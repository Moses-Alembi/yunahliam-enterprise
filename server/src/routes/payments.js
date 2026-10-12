import { Router } from "express";
import { refreshPayment } from "../orders.js";

export function paymentRoutes({ db, pesapal }) {
  const router = Router();

  // Pesapal's IPN only tells us *which* transaction changed. We never trust its contents: the real status is
  // always fetched from Pesapal, so a forged notification cannot mark an order paid.
  router.all("/payments/pesapal/ipn", async (req, res) => {
    const params = { ...req.query, ...(req.body && typeof req.body === "object" ? req.body : {}) };
    const trackingId = params.OrderTrackingId;
    const reply = (status) => res.json({
      orderNotificationType: params.OrderNotificationType ?? null,
      orderTrackingId: trackingId ?? null,
      orderMerchantReference: params.OrderMerchantReference ?? null,
      status
    });
    if (typeof trackingId !== "string" || !trackingId) return res.status(400).json({ error: "OrderTrackingId is required" });

    const known = db.prepare("SELECT 1 FROM payments WHERE tracking_id = ?").get(trackingId);
    if (!known) {
      console.warn(`Pesapal IPN for unknown OrderTrackingId ${trackingId}`);
      return reply(200);
    }
    try {
      await refreshPayment(db, pesapal, trackingId);
      reply(200);
    } catch (error) {
      // 500 tells Pesapal to send the notification again later.
      console.error(`Pesapal IPN processing failed for ${trackingId}:`, error.message);
      reply(500);
    }
  });

  return router;
}
