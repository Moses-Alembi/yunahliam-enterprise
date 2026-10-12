import { HttpError } from "./errors.js";

// Fixed-window, in-memory limiter keyed by client IP. Fine for a single server process.
export function rateLimit({ windowMs, max, message = "Too many requests, please try again shortly" }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (hits.size > 10000) {
      for (const [ip, value] of hits) if (value.resetAt <= now) hits.delete(ip);
    }
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new HttpError(429, message));
    }
    next();
  };
}
