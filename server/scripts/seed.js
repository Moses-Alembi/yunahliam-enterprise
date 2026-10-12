// Adds any products from data/products.seed.json that are not in the database yet. Existing products are untouched.
import fs from "node:fs";
import path from "node:path";
import { seedProducts } from "../src/catalog.js";
import { loadConfig } from "../src/config.js";
import { openDatabase } from "../src/db.js";

const config = loadConfig();
const db = openDatabase(config.dbPath);
const seed = JSON.parse(fs.readFileSync(path.join(config.serverRoot, "data", "products.seed.json"), "utf8"));
console.log(`Added ${seedProducts(db, seed)} of ${seed.length} seed products to ${config.dbPath}`);
db.close();
