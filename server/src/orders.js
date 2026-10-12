import crypto from "node:crypto";
import { purchasable, toProduct } from "./catalog.js";
import { badRequest } from "./errors.js";
import { transaction } from "./db.js";
import { normalizeKenyanPhone } from "./phone.js";
import { pesapalStatus } from "./pesapal.js";

export const orderStatuses = ["pending_payment", "paid", "processing", "dispatched", "delivered", "cancelled"];
const maxQuantity = 10;

function cleanText(value, name, { required = false, max = 500 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${name} is required`);
    return null;
  }
  if (typeof value !== "string") throw badRequest(`${name} must be text`);
  const trimmed = value.trim();
  if (required && !trimmed) throw badRequest(`${name} is required`);
  if (trimmed.length > max) throw badRequest(`${name} must be at most ${max} characters`);
  return trimmed || null;
}

function newOrderNumber() {
  // e.g. YE-7K3Q9P: no 0/O or 1/I so it is easy to read out over the phone.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  return `YE-${[...bytes].map((byte) => alphabet[byte % alphabet.length]).join("")}`;
}

// Validates a checkout request and prices it from the database. Prices sent by the browser are ignored.
export function createOrder(db, input, deliveryOptions) {
  if (!input || typeof input !== "object") throw badRequest("Expected a JSON object");
  const customerName = cleanText(input.customerName, "customerName", { required: true, max: 120 });
  const phone = normalizeKenyanPhone(input.phone);
  if (!phone) throw badRequest("phone must be a Kenyan mobile number, e.g. 0712 345 678");
  const email = cleanText(input.email, "email", { max: 200 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("email is not valid");
  const delivery = deliveryOptions[input.deliveryMethod];
  if (!delivery) throw badRequest(`deliveryMethod must be one of: ${Object.keys(deliveryOptions).join(", ")}`);
  const deliveryAddress = cleanText(input.deliveryAddress, "deliveryAddress", { required: input.deliveryMethod !== "pickup", max: 500 });
  const notes = cleanText(input.notes, "notes", { max: 1000 });

  if (!Array.isArray(input.items) || input.items.length === 0) throw badRequest("items must list at least one product");
  if (input.items.length > 20) throw badRequest("Too many different items in one order");
  const quantities = new Map();
  for (const item of input.items) {
    const quantity = item?.quantity ?? 1;
    if (typeof item?.slug !== "string") throw badRequest("Each item needs a product slug");
    if (!Number.isInteger(quantity) || quantity < 1) throw badRequest("quantity must be a whole number of at least 1");
    quantities.set(item.slug, (quantities.get(item.slug) || 0) + quantity);
  }

  const findProduct = db.prepare("SELECT * FROM products WHERE slug = ?");
  const lines = [...quantities].map(([slug, quantity]) => {
    const row = findProduct.get(slug);
    if (!row) throw badRequest(`Unknown product: ${slug}`);
    const product = toProduct(row);
    if (!purchasable(product)) throw badRequest(`${product.name} cannot be bought online right now. Please call us to order it.`);
    if (quantity > maxQuantity) throw badRequest(`You can order at most ${maxQuantity} of ${product.name} online`);
    return { product, quantity, lineTotal: product.price * quantity };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const total = subtotal + delivery.fee;
  const accessKey = crypto.randomBytes(18).toString("base64url");

  return transaction(db, () => {
    let orderNumber = newOrderNumber();
    while (db.prepare("SELECT 1 FROM orders WHERE order_number = ?").get(orderNumber)) orderNumber = newOrderNumber();
    const { lastInsertRowid: orderId } = db.prepare(`
      INSERT INTO orders (order_number, access_key, customer_name, phone, email, delivery_method, delivery_address, notes, subtotal, delivery_fee, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(orderNumber, accessKey, customerName, phone, email, input.deliveryMethod, deliveryAddress, notes, subtotal, delivery.fee, total);
    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)");
    for (const line of lines) insertItem.run(orderId, line.product.id, line.product.name, line.product.price, line.quantity, line.lineTotal);
    return { orderNumber, accessKey };
  });
}

export function findOrder(db, orderNumber) {
  return db.prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) || null;
}

function maskPhone(phone) {
  return `${phone.slice(0, 6)}***${phone.slice(-3)}`;
}

// `admin` adds customer contact details and the full payment history.
export function presentOrder(db, order, { admin = false } = {}) {
  const items = db.prepare("SELECT product_id, name, unit_price, quantity, line_total FROM order_items WHERE order_id = ? ORDER BY id").all(order.id);
  const payments = db.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY id").all(order.id);
  const result = {
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    phone: admin ? order.phone : maskPhone(order.phone),
    deliveryMethod: order.delivery_method,
    items: items.map((item) => ({ productId: item.product_id, name: item.name, unitPrice: item.unit_price, quantity: item.quantity, lineTotal: item.line_total })),
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    total: order.total,
    paidAt: order.paid_at,
    createdAt: order.created_at,
    payments: payments.map((payment) => ({
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      confirmationCode: payment.confirmation_code,
      description: payment.status_description,
      createdAt: payment.created_at,
      ...(admin ? { id: payment.id, merchantReference: payment.merchant_reference, trackingId: payment.tracking_id } : {})
    }))
  };
  if (admin) Object.assign(result, { email: order.email, deliveryAddress: order.delivery_address, notes: order.notes, updatedAt: order.updated_at });
  return result;
}

// Which status changes Pesapal may cause. A failed attempt can still succeed (the customer retries on the same
// payment page), and a completed payment can later be reversed. Everything else is final.
const allowedTransitions = {
  pending: ["paid", "failed", "reversed", "amount_mismatch"],
  failed: ["paid", "reversed", "amount_mismatch"],
  paid: ["reversed"]
};

function nextPaymentStatus(payment, result) {
  if (result.statusCode === pesapalStatus.completed) {
    const short = result.amount !== null && result.amount < payment.amount;
    const wrongCurrency = result.currency !== null && result.currency !== payment.currency;
    return short || wrongCurrency ? "amount_mismatch" : "paid";
  }
  if (result.statusCode === pesapalStatus.failed) return "failed";
  if (result.statusCode === pesapalStatus.reversed) return "reversed";
  return payment.status; // INVALID: the customer has not paid yet.
}

// Records a Pesapal transaction status for one of our payments. Safe to call any number of times.
export function applyPaymentStatus(db, trackingId, result) {
  return transaction(db, () => {
    const payment = db.prepare("SELECT * FROM payments WHERE tracking_id = ?").get(trackingId);
    if (!payment) return null;
    const status = nextPaymentStatus(payment, result);
    if (status === payment.status || !(allowedTransitions[payment.status] || []).includes(status)) return payment;

    db.prepare(`UPDATE payments SET status = ?, payment_method = ?, confirmation_code = ?, status_description = ?, raw_status = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(status, result.paymentMethod ?? null, result.confirmationCode ?? null, result.description ?? null, result.raw ? JSON.stringify(result.raw) : null, payment.id);
    if (status === "paid") {
      db.prepare(`UPDATE orders SET payment_status = 'paid', paid_at = datetime('now'), updated_at = datetime('now'),
        status = CASE WHEN status = 'pending_payment' THEN 'paid' ELSE status END WHERE id = ?`).run(payment.order_id);
    } else if (status === "reversed" && payment.status === "paid") {
      db.prepare("UPDATE orders SET payment_status = 'reversed', updated_at = datetime('now') WHERE id = ?").run(payment.order_id);
    }
    return { ...payment, status };
  });
}

// Asks Pesapal for the latest status of a payment and records it.
export async function refreshPayment(db, pesapal, trackingId) {
  const payment = applyPaymentStatus(db, trackingId, await pesapal.transactionStatus(trackingId));
  if (payment?.status === "amount_mismatch") console.error(`Payment ${payment.merchant_reference}: amount or currency does not match the order. Check it in the Pesapal dashboard.`);
  if (payment?.status === "reversed") console.error(`Payment ${payment.merchant_reference} was reversed.`);
  return payment;
}
