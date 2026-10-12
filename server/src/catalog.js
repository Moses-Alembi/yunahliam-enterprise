import { badRequest } from "./errors.js";

// Keep in sync with the category list in the storefront's app.js.
export const categories = [
  { key: "Phones", label: "Phones" },
  { key: "Computers", label: "Computers & Tablets" },
  { key: "Audio", label: "Audio & Speakers" },
  { key: "Power", label: "Power Stations" },
  { key: "Gaming", label: "Gaming" },
  { key: "Wearables", label: "Smart Watches" },
  { key: "Accessories", label: "Accessories" }
];
const categoryKeys = new Set(categories.map((category) => category.key));

export function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Products can be bought online only when the price is fixed and confirmed by the store.
export function purchasable(product) {
  return product.active && product.inStock && product.priceConfirmed && !product.priceFrom && product.price > 0;
}

export function toProduct(row) {
  const product = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: row.price,
    priceFrom: Boolean(row.price_from),
    priceConfirmed: Boolean(row.price_confirmed),
    badge: row.badge,
    description: row.description,
    specs: JSON.parse(row.specs),
    images: JSON.parse(row.images),
    inStock: Boolean(row.in_stock),
    active: Boolean(row.active),
    sortOrder: row.sort_order,
    updatedAt: row.updated_at
  };
  product.purchasable = purchasable(product);
  return product;
}

const fields = {
  slug: (value) => {
    const slug = slugify(value);
    if (!slug) throw badRequest("slug must contain letters or numbers");
    return slug;
  },
  name: (value) => requiredText(value, "name", 200),
  brand: (value) => requiredText(value, "brand", 100),
  category: (value) => {
    if (!categoryKeys.has(value)) throw badRequest(`category must be one of: ${[...categoryKeys].join(", ")}`);
    return value;
  },
  price: (value) => {
    if (!Number.isInteger(value) || value < 0) throw badRequest("price must be a whole number of shillings");
    return value;
  },
  priceFrom: (value) => flag(value, "priceFrom"),
  priceConfirmed: (value) => flag(value, "priceConfirmed"),
  badge: (value) => (value === null || value === "" ? null : requiredText(value, "badge", 40)),
  description: (value) => (value === null ? "" : text(value, "description", 5000)),
  specs: (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw badRequest("specs must be an object of label: value pairs");
    for (const [label, spec] of Object.entries(value)) {
      if (typeof spec !== "string" || label.length > 60 || spec.length > 300) throw badRequest("each spec must be a short text value");
    }
    return JSON.stringify(value);
  },
  images: (value) => {
    if (!Array.isArray(value) || value.some((image) => typeof image !== "string" || !image.trim())) throw badRequest("images must be a list of image paths");
    return JSON.stringify(value);
  },
  inStock: (value) => flag(value, "inStock"),
  active: (value) => flag(value, "active"),
  sortOrder: (value) => {
    if (!Number.isInteger(value)) throw badRequest("sortOrder must be a whole number");
    return value;
  }
};
const columns = {
  slug: "slug", name: "name", brand: "brand", category: "category", price: "price", priceFrom: "price_from",
  priceConfirmed: "price_confirmed", badge: "badge", description: "description", specs: "specs", images: "images",
  inStock: "in_stock", active: "active", sortOrder: "sort_order"
};

function text(value, name, max) {
  if (typeof value !== "string") throw badRequest(`${name} must be text`);
  if (value.length > max) throw badRequest(`${name} must be at most ${max} characters`);
  return value.trim();
}
function requiredText(value, name, max) {
  const result = text(value, name, max);
  if (!result) throw badRequest(`${name} is required`);
  return result;
}
function flag(value, name) {
  if (typeof value !== "boolean") throw badRequest(`${name} must be true or false`);
  return value ? 1 : 0;
}

// Returns { column: value } for the fields present in input. With `create`, name/brand/category/price are required.
export function productColumns(input, { create = false } = {}) {
  if (!input || typeof input !== "object") throw badRequest("Expected a JSON object");
  const unknown = Object.keys(input).filter((key) => !(key in fields));
  if (unknown.length) throw badRequest(`Unknown field(s): ${unknown.join(", ")}`);
  if (create) {
    const missing = ["name", "brand", "category", "price"].filter((key) => input[key] === undefined);
    if (missing.length) throw badRequest(`Missing field(s): ${missing.join(", ")}`);
  }
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) result[columns[key]] = fields[key](value);
  }
  if (create && !result.slug) result.slug = fields.slug(input.name);
  return result;
}

export function insertProduct(db, values) {
  const keys = Object.keys(values);
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO products (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`)
    .run(...keys.map((key) => values[key]));
  return Number(lastInsertRowid);
}

// Adds seed products whose slug is not already in the database. Existing rows are left alone.
export function seedProducts(db, seed) {
  const exists = db.prepare("SELECT 1 FROM products WHERE slug = ?");
  let added = 0;
  for (const item of seed) {
    if (exists.get(item.slug)) continue;
    insertProduct(db, productColumns(item, { create: true }));
    added += 1;
  }
  return added;
}
