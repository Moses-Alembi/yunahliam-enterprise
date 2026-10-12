import fs from "node:fs";
import path from "node:path";
import { createApp } from "./app.js";
import { hashPassword } from "./auth.js";
import { seedProducts } from "./catalog.js";
import { loadConfig, pesapalConfigured } from "./config.js";
import { openDatabase } from "./db.js";
import { createPesapalClient } from "./pesapal.js";

const config = loadConfig();
const db = openDatabase(config.dbPath);

// First run: fill the catalogue from the storefront's original product list.
const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get();
if (count === 0) {
  const seed = JSON.parse(fs.readFileSync(path.join(config.serverRoot, "data", "products.seed.json"), "utf8"));
  console.log(`Seeded ${seedProducts(db, seed)} products`);
}

// First run only: create the admin from ADMIN_USERNAME/ADMIN_PASSWORD so no shell is needed to deploy.
// It never overwrites an existing admin; remove ADMIN_PASSWORD from the environment once set up.
if (db.prepare("SELECT COUNT(*) AS n FROM admins").get().n === 0) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) {
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) console.error("ADMIN_USERNAME must be 3-40 letters, numbers, . _ - ; admin not created");
    else if (password.length < 10) console.error("ADMIN_PASSWORD must be at least 10 characters; admin not created");
    else {
      db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hashPassword(password));
      console.log(`Created admin "${username}" from the environment. Remove ADMIN_PASSWORD from the app's settings now.`);
    }
  }
}

const app = createApp({ db, config, pesapal: createPesapalClient(config.pesapal) });
const server = app.listen(config.port, () => {
  console.log(`Yunahliam store running at http://localhost:${config.port}`);
  console.log(pesapalConfigured(config.pesapal) ? `Pesapal: ${config.pesapal.env}` : "Pesapal: not configured (set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET in server/.env)");
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
