import { Router } from "express";
import { categories, toProduct } from "../catalog.js";
import { badRequest, notFound } from "../errors.js";

const sorts = {
  featured: "sort_order, id",
  "price-asc": "price, sort_order",
  "price-desc": "price DESC, sort_order",
  az: "name COLLATE NOCASE"
};

function wholeNumber(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw badRequest(`${name} must be a whole number between ${min} and ${max}`);
  return parsed;
}

export function catalogRoutes({ db }) {
  const router = Router();

  router.get("/categories", (req, res) => {
    const counts = Object.fromEntries(db.prepare("SELECT category, COUNT(*) AS count FROM products WHERE active = 1 GROUP BY category").all().map((row) => [row.category, row.count]));
    res.json({ categories: categories.map((category) => ({ ...category, count: counts[category.key] || 0 })) });
  });

  router.get("/products", (req, res) => {
    const { category, q, sort = "featured" } = req.query;
    if (!sorts[sort]) throw badRequest(`sort must be one of: ${Object.keys(sorts).join(", ")}`);
    const min = wholeNumber(req.query.min, "min");
    const max = wholeNumber(req.query.max, "max");
    const limit = wholeNumber(req.query.limit, "limit", { min: 1, max: 500 }) ?? 50;
    const offset = wholeNumber(req.query.offset, "offset") ?? 0;

    const where = ["active = 1"];
    const params = [];
    if (typeof category === "string" && category && category !== "All") { where.push("category = ?"); params.push(category); }
    if (typeof q === "string" && q.trim()) {
      const like = `%${q.trim().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      where.push("(name LIKE ? ESCAPE '\\' OR brand LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\')");
      params.push(like, like, like);
    }
    if (min !== undefined) { where.push("price >= ?"); params.push(min); }
    if (max !== undefined) { where.push("price <= ?"); params.push(max); }

    const clause = where.join(" AND ");
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM products WHERE ${clause}`).get(...params);
    const rows = db.prepare(`SELECT * FROM products WHERE ${clause} ORDER BY ${sorts[sort]} LIMIT ? OFFSET ?`).all(...params, limit, offset);
    res.json({ total, limit, offset, products: rows.map(toProduct) });
  });

  router.get("/products/:slug", (req, res) => {
    const row = db.prepare("SELECT * FROM products WHERE slug = ? AND active = 1").get(req.params.slug);
    if (!row) throw notFound("Product not found");
    res.json({ product: toProduct(row) });
  });

  return router;
}
