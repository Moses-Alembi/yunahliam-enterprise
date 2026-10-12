// Usage: npm run create-admin -- <username>
// Uses ADMIN_PASSWORD if set, otherwise generates a strong password and prints it once.
// Running it for an existing username resets that admin's password.
import crypto from "node:crypto";
import { hashPassword } from "../src/auth.js";
import { loadConfig } from "../src/config.js";
import { openDatabase } from "../src/db.js";

const username = process.argv[2];
if (!username || !/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
  console.error("Usage: npm run create-admin -- <username>   (3-40 letters, numbers, . _ -)");
  process.exit(1);
}
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(15).toString("base64url");
if (password.length < 10) {
  console.error("ADMIN_PASSWORD must be at least 10 characters");
  process.exit(1);
}

const db = openDatabase(loadConfig().dbPath);
const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
if (existing) {
  db.prepare("UPDATE admins SET password_hash = ? WHERE id = ?").run(hashPassword(password), existing.id);
  db.prepare("DELETE FROM admin_sessions WHERE admin_id = ?").run(existing.id);
  console.log(`Password reset for admin "${username}" (existing sessions signed out).`);
} else {
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hashPassword(password));
  console.log(`Created admin "${username}".`);
}
if (!process.env.ADMIN_PASSWORD) console.log(`Password: ${password}\nStore it somewhere safe; it will not be shown again.`);
db.close();
