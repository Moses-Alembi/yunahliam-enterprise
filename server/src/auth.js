import crypto from "node:crypto";
import { HttpError } from "./errors.js";

const scryptOptions = { N: 16384, r: 8, p: 1 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, scryptOptions);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = crypto.scryptSync(password, Buffer.from(salt, "base64"), expected.length, scryptOptions);
  return crypto.timingSafeEqual(actual, expected);
}

export function safeEqual(first, second) {
  const a = Buffer.from(String(first));
  const b = Buffer.from(String(second));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Only a hash of the session token is stored, so a leaked database cannot be used to log in.
export function createSession(db, adminId, hours) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").run(new Date().toISOString());
  db.prepare("INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), adminId, expiresAt);
  return { token, expiresAt };
}

export function deleteSession(db, token) {
  db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(sha256(token));
}

function bearerToken(req) {
  const match = /^Bearer (\S+)$/.exec(req.get("authorization") || "");
  return match ? match[1] : null;
}

export function requireAdmin(db) {
  const lookup = db.prepare(`
    SELECT admins.id, admins.username FROM admin_sessions
    JOIN admins ON admins.id = admin_sessions.admin_id
    WHERE token_hash = ? AND expires_at > ?`);
  return (req, res, next) => {
    const token = bearerToken(req);
    const admin = token && lookup.get(sha256(token), new Date().toISOString());
    if (!admin) return next(new HttpError(401, "Please log in as an administrator"));
    req.admin = admin;
    req.sessionToken = token;
    next();
  };
}
