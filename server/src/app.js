import path from "node:path";
import express from "express";
import { pesapalConfigured } from "./config.js";
import { HttpError } from "./errors.js";
import { adminRoutes } from "./routes/admin.js";
import { catalogRoutes } from "./routes/catalog.js";
import { orderRoutes } from "./routes/orders.js";
import { enquiryRoutes } from "./routes/enquiries.js";
import { paymentRoutes } from "./routes/payments.js";

// Only these storefront files are public; everything else in the repo (server/, .git, .env, documents) stays private.
const publicFile = /^\/(?:(?:index|shop|product|about|contact|cart|checkout|order|admin)\.html|(?:app|admin)\.js|styles\.css|images\/[^/]+\.(?:png|jpe?g|webp|svg|gif|ico))?$/i;
const xml = (value) => String(value).replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);

export function createApp({ db, config, pesapal }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  // Kept in sync with the .htaccess used on static hosting.
  const csp = [
    "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data:", "connect-src 'self'",
    "frame-src https://maps.google.com https://www.google.com", "base-uri 'self'", "object-src 'none'",
    "frame-ancestors 'self'", "form-action 'self'"
  ].join("; ");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      "Content-Security-Policy": csp
    });
    if (req.secure) res.set("Strict-Transport-Security", "max-age=31536000");
    next();
  });

  const api = express.Router();
  api.use(express.json({ limit: "100kb" }));
  api.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  api.get("/health", (req, res) => res.json({ ok: true, payments: pesapalConfigured(config.pesapal) ? config.pesapal.env : "not configured" }));
  api.use(catalogRoutes({ db }));
  api.use(orderRoutes({ db, config, pesapal }));
  api.use(paymentRoutes({ db, pesapal }));
  api.use(enquiryRoutes({ db }));
  api.use(adminRoutes({ db, config }));
  api.use((req, res, next) => next(new HttpError(404, "Not found")));
  app.use("/api", api);

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nDisallow: /api/\nDisallow: /admin.html\nDisallow: /checkout.html\nDisallow: /order.html\n\nSitemap: ${config.publicUrl}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", (req, res) => {
    const pages = ["/", "/shop.html", "/about.html", "/contact.html"];
    const products = db.prepare("SELECT slug, updated_at FROM products WHERE active = 1 ORDER BY sort_order").all();
    const urls = [
      ...pages.map((page) => `<url><loc>${xml(config.publicUrl + page)}</loc></url>`),
      ...products.map((product) => `<url><loc>${xml(`${config.publicUrl}/product.html?id=${product.slug}`)}</loc><lastmod>${product.updated_at.slice(0, 10)}</lastmod></url>`)
    ];
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  });

  // Pages and scripts revalidate on every visit so a deploy shows up at once; photos are cached for a day.
  const site = express.static(config.siteRoot, {
    index: "index.html",
    dotfiles: "deny",
    setHeaders(res, file) {
      res.set("Cache-Control", /\.(?:html|js|css)$/i.test(file) ? "no-cache" : "public, max-age=86400");
      if (/admin\.html$/i.test(file)) res.set("X-Robots-Tag", "noindex, nofollow");
    }
  });
  app.use((req, res, next) => {
    let pathname;
    try { pathname = decodeURIComponent(req.path); } catch { return next(); }
    if ((req.method === "GET" || req.method === "HEAD") && publicFile.test(pathname)) return site(req, res, next);
    next();
  });
  app.use((req, res) => res.status(404).sendFile(path.join(config.siteRoot, "index.html")));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") error = new HttpError(400, "Request body is not valid JSON");
    else if (/UNIQUE constraint failed: products\.slug/.test(error.message)) error = new HttpError(409, "A product with that slug already exists");
    const status = error.status || 500;
    if (!(error instanceof HttpError)) console.error(error);
    res.status(status).json({ error: status >= 500 && !(error instanceof HttpError) ? "Something went wrong on our side" : error.message, ...(error.details ? { details: error.details } : {}) });
  });

  return app;
}
