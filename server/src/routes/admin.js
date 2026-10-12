import { Router } from "express";
import { createSession, deleteSession, requireAdmin, verifyPassword } from "../auth.js";
import { insertProduct, productColumns, toProduct } from "../catalog.js";
import { HttpError, badRequest, notFound } from "../errors.js";
import { findOrder, orderStatuses, presentOrder } from "../orders.js";
import { rateLimit } from "../rate-limit.js";

export function adminRoutes({ db, config }) {
  const router = Router();

  router.post("/admin/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts. Try again in 15 minutes." }), (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") throw badRequest("username and password are required");
    const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
    if (!admin || !verifyPassword(password, admin.password_hash)) throw new HttpError(401, "Incorrect username or password");
    res.json({ username: admin.username, ...createSession(db, admin.id, config.adminSessionHours) });
  });

  router.use("/admin", requireAdmin(db));

  router.post("/admin/logout", (req, res) => {
    deleteSession(db, req.sessionToken);
    res.status(204).end();
  });

  router.get("/admin/me", (req, res) => res.json({ username: req.admin.username }));

  /* ---------- Products ---------- */
  function productById(id) {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(id));
    if (!row) throw notFound("Product not found");
    return row;
  }

  router.get("/admin/products", (req, res) => {
    res.json({ products: db.prepare("SELECT * FROM products ORDER BY sort_order, id").all().map(toProduct) });
  });

  router.post("/admin/products", (req, res) => {
    const id = insertProduct(db, productColumns(req.body, { create: true }));
    res.status(201).json({ product: toProduct(productById(id)) });
  });

  router.get("/admin/products/:id", (req, res) => res.json({ product: toProduct(productById(req.params.id)) }));

  router.patch("/admin/products/:id", (req, res) => {
    const { id } = productById(req.params.id);
    const values = productColumns(req.body);
    const keys = Object.keys(values);
    if (keys.length) {
      db.prepare(`UPDATE products SET ${keys.map((key) => `${key} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`)
        .run(...keys.map((key) => values[key]), id);
    }
    res.json({ product: toProduct(productById(id)) });
  });

  // Products are hidden rather than deleted so past orders still point at them.
  router.delete("/admin/products/:id", (req, res) => {
    const { id } = productById(req.params.id);
    db.prepare("UPDATE products SET active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
    res.status(204).end();
  });

  /* ---------- Orders ---------- */
  router.get("/admin/orders", (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !orderStatuses.includes(status)) throw badRequest(`status must be one of: ${orderStatuses.join(", ")}`);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const filter = status ? "WHERE status = ?" : "";
    const params = status ? [status] : [];
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM orders ${filter}`).get(...params);
    const orders = db.prepare(`SELECT * FROM orders ${filter} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    res.json({ total, limit, offset, orders: orders.map((order) => presentOrder(db, order, { admin: true })) });
  });

  function adminOrder(orderNumber) {
    const order = findOrder(db, orderNumber);
    if (!order) throw notFound("Order not found");
    return order;
  }

  router.get("/admin/orders/:orderNumber", (req, res) => {
    res.json({ order: presentOrder(db, adminOrder(req.params.orderNumber), { admin: true }) });
  });

  // Moves an order along (processing, dispatched, ...) or records a payment taken outside M-Pesa Express.
  router.patch("/admin/orders/:orderNumber", (req, res) => {
    const order = adminOrder(req.params.orderNumber);
    const { status, paymentStatus } = req.body ?? {};
    if (status === undefined && paymentStatus === undefined) throw badRequest("Send status and/or paymentStatus");
    if (status !== undefined && !orderStatuses.includes(status)) throw badRequest(`status must be one of: ${orderStatuses.join(", ")}`);
    if (paymentStatus !== undefined && !["paid", "unpaid"].includes(paymentStatus)) throw badRequest("paymentStatus must be paid or unpaid");

    let nextStatus = status ?? order.status;
    if (paymentStatus === "paid" && status === undefined && order.status === "pending_payment") nextStatus = "paid";
    const nextPayment = paymentStatus ?? order.payment_status;
    const paidAt = nextPayment === "paid" ? order.paid_at ?? new Date().toISOString().replace("T", " ").slice(0, 19) : null;
    db.prepare("UPDATE orders SET status = ?, payment_status = ?, paid_at = ?, updated_at = datetime('now') WHERE id = ?")
      .run(nextStatus, nextPayment, paidAt, order.id);
    console.log(`Admin ${req.admin.username} updated ${order.order_number}: ${order.status}/${order.payment_status} -> ${nextStatus}/${nextPayment}`);
    res.json({ order: presentOrder(db, findOrder(db, order.order_number), { admin: true }) });
  });

  /* ---------- Enquiries ---------- */
  router.get("/admin/enquiries", (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !["new", "handled"].includes(status)) throw badRequest("status must be new or handled");
    const rows = db.prepare(`
      SELECT enquiries.*, products.name AS product_name, products.slug AS product_slug FROM enquiries
      LEFT JOIN products ON products.id = enquiries.product_id
      ${status ? "WHERE enquiries.status = ?" : ""} ORDER BY enquiries.id DESC LIMIT 200`).all(...(status ? [status] : []));
    res.json({
      enquiries: rows.map((row) => ({
        id: row.id, name: row.name, phone: row.phone, email: row.email, message: row.message, status: row.status,
        product: row.product_slug ? { slug: row.product_slug, name: row.product_name } : null, createdAt: row.created_at
      }))
    });
  });

  router.patch("/admin/enquiries/:id", (req, res) => {
    const { status } = req.body ?? {};
    if (!["new", "handled"].includes(status)) throw badRequest("status must be new or handled");
    const { changes } = db.prepare("UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, Number(req.params.id));
    if (!changes) throw notFound("Enquiry not found");
    res.json({ ok: true });
  });

  /* ---------- Dashboard ---------- */
  router.get("/admin/summary", (req, res) => {
    const count = (sql, ...params) => db.prepare(sql).get(...params).n;
    res.json({
      toFulfil: count("SELECT COUNT(*) AS n FROM orders WHERE status IN ('paid', 'processing')"),
      awaitingPayment: count("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending_payment'"),
      newEnquiries: count("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'"),
      paidToday: count("SELECT COALESCE(SUM(total), 0) AS n FROM orders WHERE payment_status = 'paid' AND date(paid_at) = date('now')"),
      unconfirmedPrices: count("SELECT COUNT(*) AS n FROM products WHERE active = 1 AND price_confirmed = 0"),
      paymentIssues: count("SELECT COUNT(*) AS n FROM payments WHERE status IN ('amount_mismatch', 'reversed')")
    });
  });

  return router;
}
