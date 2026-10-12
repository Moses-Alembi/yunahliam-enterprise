import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function number(value, fallback) {
  const parsed = Number(value);
  return value === undefined || value === "" || Number.isNaN(parsed) ? fallback : parsed;
}

export function loadConfig(env = process.env) {
  const port = number(env.PORT, 3000);
  const pesapalEnv = env.PESAPAL_ENV === "production" ? "production" : "sandbox";
  return {
    port,
    serverRoot,
    siteRoot: path.resolve(serverRoot, ".."),
    dbPath: env.DB_PATH || path.join(serverRoot, "data", "store.db"),
    publicUrl: (env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ""),
    trustProxy: env.TRUST_PROXY === "true" ? 1 : false,
    adminSessionHours: number(env.ADMIN_SESSION_HOURS, 12),
    delivery: {
      pickup: { label: "Pick up at Westlands Business Park", fee: 0 },
      nairobi: { label: "Delivery within Nairobi", fee: number(env.DELIVERY_FEE_NAIROBI, 300) },
      countrywide: { label: "Delivery outside Nairobi", fee: number(env.DELIVERY_FEE_COUNTRYWIDE, 600) }
    },
    pesapal: {
      env: pesapalEnv,
      baseUrl: (env.PESAPAL_BASE_URL || (pesapalEnv === "production" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3")).replace(/\/$/, ""),
      consumerKey: env.PESAPAL_CONSUMER_KEY || "",
      consumerSecret: env.PESAPAL_CONSUMER_SECRET || "",
      // Optional: if empty, the IPN URL is looked up or registered with Pesapal automatically on the first payment.
      ipnId: env.PESAPAL_IPN_ID || "",
      currency: "KES"
    }
  };
}

export function pesapalConfigured(pesapal) {
  return Boolean(pesapal.consumerKey && pesapal.consumerSecret);
}
