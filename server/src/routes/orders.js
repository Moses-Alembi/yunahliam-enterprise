import { Router } from "express";
import { safeEqual } from "../auth.js";
import { pesapalConfigured } from "../config.js";
import { HttpError, notFound } from "../errors.js";
import { createOrder, findOrder, presentOrder, refreshPayment } from "../orders.js";
import { PesapalError } from "../pesapal.js";
import { rateLimit } from "../rate-limit.js";

// A payment link is reused for this long before a fresh one is requested.
const reuseLinkMinutes = 30;

export function orderRoutes({ db, config, pesapal }) {
  const router = Router();

  // Customers reach their order with the order number plus the private key returned at checkout.
  function authorizedOrder(req) {
    const key = req.query.key ?? req.body?.key;
    const order = findOrder(db, req.params.orderNumber);
    if (!order || typeof key !== "string" || !safeEqual(key, order.access_key)) throw notFound("Order not found");
    return order;
  }

  function requirePesapal() {
    if (!pesapalConfigured(config.pesapal)) throw new HttpError(503, "Online payment is not available right now. Please call us to complete your order.");
  }

  function pesapalFailure(order, action, error) {
    if (!(error instanceof PesapalError)) return error;
    console.error(`Pesapal ${action} failed for ${order.order_number}:`, error.message, error.body ? JSON.stringify(error.body) : "");
    return new HttpError(502, "We could not reach our payment provider. Please try again in a moment.");
  }

  router.get("/delivery-options", (req, res) => {
    res.json({ deliveryOptions: Object.entries(config.delivery).map(([key, option]) => ({ key, ...option })) });
  });

  router.post("/orders", rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), (req, res) => {
    const { orderNumber, accessKey } = createOrder(db, req.body, config.delivery);
    res.status(201).json({ orderNumber, accessKey, order: presentOrder(db, findOrder(db, orderNumber)) });
  });

  router.get("/orders/:orderNumber", (req, res) => {
    res.json({ order: presentOrder(db, authorizedOrder(req)) });
  });

  // Returns a Pesapal payment page for the order total. The storefront sends the customer to `redirectUrl`.
  router.post("/orders/:orderNumber/pay", rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }), async (req, res) => {
    const order = authorizedOrder(req);
    requirePesapal();
    if (order.payment_status === "paid") throw new HttpError(409, "This order is already paid");
    if (order.status !== "pending_payment") throw new HttpError(409, "This order can no longer be paid online");

    const reusable = db.prepare(`SELECT * FROM payments WHERE order_id = ? AND status = 'pending' AND redirect_url IS NOT NULL
      AND amount = ? AND created_at > datetime('now', ?) ORDER BY id DESC LIMIT 1`).get(order.id, order.total, `-${reuseLinkMinutes} minutes`);
    if (reusable) return res.json({ redirectUrl: reusable.redirect_url, order: presentOrder(db, order) });

    const { attempts } = db.prepare("SELECT COUNT(*) AS attempts FROM payments WHERE order_id = ?").get(order.id);
    const merchantReference = `${order.order_number}-${attempts + 1}`;
    const { lastInsertRowid: paymentId } = db.prepare("INSERT INTO payments (order_id, merchant_reference, amount, currency) VALUES (?, ?, ?, ?)")
      .run(order.id, merchantReference, order.total, config.pesapal.currency);

    const returnUrl = `${config.publicUrl}/order.html?order=${encodeURIComponent(order.order_number)}&key=${encodeURIComponent(order.access_key)}`;
    const [firstName, ...rest] = order.customer_name.split(/\s+/);
    let submitted;
    try {
      submitted = await pesapal.submitOrder({
        merchantReference,
        amount: order.total,
        description: `Yunahliam Enterprise order ${order.order_number}`,
        callbackUrl: returnUrl,
        cancellationUrl: `${returnUrl}&cancelled=1`,
        notificationId: await pesapal.ipnId(`${config.publicUrl}/api/payments/pesapal/ipn`),
        billingAddress: {
          email_address: order.email || "",
          phone_number: `0${order.phone.slice(3)}`,
          country_code: "KE",
          first_name: firstName,
          last_name: rest.join(" "),
          line_1: order.delivery_address || ""
        }
      });
    } catch (error) {
      db.prepare("DELETE FROM payments WHERE id = ?").run(paymentId);
      throw pesapalFailure(order, "SubmitOrderRequest", error);
    }
    db.prepare("UPDATE payments SET tracking_id = ?, redirect_url = ?, updated_at = datetime('now') WHERE id = ?")
      .run(submitted.trackingId, submitted.redirectUrl, paymentId);
    res.status(201).json({ redirectUrl: submitted.redirectUrl, order: presentOrder(db, order) });
  });

  // Checks the latest payment with Pesapal. The order page calls this when the customer returns from paying.
  router.post("/orders/:orderNumber/pay/verify", rateLimit({ windowMs: 60 * 1000, max: 20 }), async (req, res) => {
    const order = authorizedOrder(req);
    const payment = db.prepare("SELECT * FROM payments WHERE order_id = ? AND tracking_id IS NOT NULL AND status IN ('pending', 'failed') ORDER BY id DESC LIMIT 1").get(order.id);
    if (payment && order.payment_status !== "paid") {
      requirePesapal();
      try {
        await refreshPayment(db, pesapal, payment.tracking_id);
      } catch (error) {
        throw pesapalFailure(order, "GetTransactionStatus", error);
      }
    }
    res.json({ order: presentOrder(db, findOrder(db, order.order_number)) });
  });

  return router;
}
