import { Router } from "express";
import { badRequest } from "../errors.js";
import { normalizeKenyanPhone } from "../phone.js";
import { rateLimit } from "../rate-limit.js";

function text(value, name, { required = false, max }) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (value !== undefined && value !== null && typeof value !== "string") throw badRequest(`${name} must be text`);
  if (required && !trimmed) throw badRequest(`${name} is required`);
  if (trimmed.length > max) throw badRequest(`${name} must be at most ${max} characters`);
  return trimmed || null;
}

export function enquiryRoutes({ db }) {
  const router = Router();

  // Contact-page messages. They show up in the admin panel.
  router.post("/enquiries", rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: "You have sent several messages. Please call us instead." }), (req, res) => {
    const body = req.body ?? {};
    const name = text(body.name, "name", { required: true, max: 120 });
    const phone = normalizeKenyanPhone(body.phone);
    if (!phone) throw badRequest("Please enter a Kenyan mobile number, e.g. 0712 345 678");
    const email = text(body.email, "email", { max: 200 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("email is not valid");
    const message = text(body.message, "message", { required: true, max: 2000 });
    let productId = null;
    if (body.productSlug !== undefined) {
      const product = db.prepare("SELECT id FROM products WHERE slug = ?").get(String(body.productSlug));
      productId = product ? product.id : null;
    }
    db.prepare("INSERT INTO enquiries (name, phone, email, message, product_id) VALUES (?, ?, ?, ?, ?)").run(name, phone, email, message, productId);
    res.status(201).json({ ok: true });
  });

  return router;
}
