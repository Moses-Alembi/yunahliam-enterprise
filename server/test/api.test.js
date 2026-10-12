import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, test } from "node:test";
import { createApp } from "../src/app.js";
import { hashPassword } from "../src/auth.js";
import { seedProducts } from "../src/catalog.js";
import { loadConfig } from "../src/config.js";
import { openDatabase } from "../src/db.js";
import { createPesapalClient } from "../src/pesapal.js";
import { normalizeKenyanPhone } from "../src/phone.js";

const listen = (handler) => new Promise((resolve) => {
  const server = http.createServer(handler).listen(0, "127.0.0.1", () => resolve(server));
});
const urlOf = (server) => `http://127.0.0.1:${server.address().port}`;

// Stands in for Pesapal's API 3.0.
function fakePesapal() {
  const state = { ipns: [], orders: [], statuses: {}, failSubmit: false };
  const json = (res, body) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(body)); };
  const handler = (req, res) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const url = new URL(req.url, "http://pesapal.test");
      if (url.pathname === "/api/Auth/RequestToken") {
        assert.deepEqual(JSON.parse(raw), { consumer_key: "key", consumer_secret: "secret" });
        return json(res, { token: "test-token", expiryDate: new Date(Date.now() + 300000).toISOString(), error: null, status: "200" });
      }
      assert.equal(req.headers.authorization, "Bearer test-token");
      if (url.pathname === "/api/URLSetup/GetIpnList") return json(res, state.ipns);
      if (url.pathname === "/api/URLSetup/RegisterIPN") {
        const ipn = { ...JSON.parse(raw), ipn_id: `ipn-${state.ipns.length + 1}` };
        state.ipns.push(ipn);
        return json(res, { ...ipn, error: null, status: "200" });
      }
      if (url.pathname === "/api/Transactions/SubmitOrderRequest") {
        if (state.failSubmit) return json(res, { error: { error_type: "api_error", code: "invalid_amount", message: "Invalid amount" }, status: "500" });
        const body = JSON.parse(raw);
        state.orders.push(body);
        const n = state.orders.length;
        return json(res, { order_tracking_id: `trk-${n}`, merchant_reference: body.id, redirect_url: `https://pay.example/${n}`, error: null, status: "200" });
      }
      if (url.pathname === "/api/Transactions/GetTransactionStatus") {
        const trackingId = url.searchParams.get("orderTrackingId");
        return json(res, state.statuses[trackingId] ?? { status_code: 0, payment_status_description: "INVALID", amount: 0, currency: "KES", error: null, status: "200" });
      }
      res.statusCode = 404;
      res.end("{}");
    });
  };
  return { state, handler };
}

const seed = [
  { slug: "phone-a", name: "Phone A", brand: "Samsung", category: "Phones", price: 15400, priceConfirmed: true, images: ["images/a.png"], sortOrder: 0 },
  { slug: "phone-b", name: "Phone B", brand: "Apple", category: "Phones", price: 149000, priceConfirmed: false, images: ["images/b.png"], sortOrder: 1 },
  { slug: "speaker", name: "Speaker", brand: "JBL", category: "Audio", price: 5000, priceConfirmed: true, images: ["images/c.png"], sortOrder: 2 },
  { slug: "laptop", name: "Laptop", brand: "Apple", category: "Computers", price: 199000, priceFrom: true, priceConfirmed: true, images: ["images/d.png"], sortOrder: 3 }
];

describe("store API", () => {
  let api, pesapal, pesapalServer, server, db;

  before(async () => {
    pesapal = fakePesapal();
    pesapalServer = await listen(pesapal.handler);
    const config = loadConfig({ PUBLIC_URL: "https://shop.example", PESAPAL_BASE_URL: urlOf(pesapalServer), PESAPAL_CONSUMER_KEY: "key", PESAPAL_CONSUMER_SECRET: "secret" });
    db = openDatabase(":memory:");
    seedProducts(db, seed);
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run("owner", hashPassword("correct horse battery"));
    server = await listen(createApp({ db, config, pesapal: createPesapalClient(config.pesapal) }));
    api = async (method, path, body, headers = {}) => {
      const response = await fetch(`${urlOf(server)}${path}`, {
        method, headers: { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    };
  });

  after(() => {
    server.close();
    pesapalServer.close();
    db.close();
  });

  const checkout = (overrides = {}) => api("POST", "/api/orders", {
    customerName: "Wanjiku Kamau", phone: "0712 345 678", deliveryMethod: "nairobi", deliveryAddress: "Kilimani, Nairobi",
    items: [{ slug: "phone-a", quantity: 2 }, { slug: "speaker" }], ...overrides
  });

  test("lists, filters and sorts products", async () => {
    const all = await api("GET", "/api/products");
    assert.equal(all.body.total, 4);
    const phones = await api("GET", "/api/products?category=Phones&sort=price-desc");
    assert.deepEqual(phones.body.products.map((product) => product.slug), ["phone-b", "phone-a"]);
    const search = await api("GET", "/api/products?q=jbl");
    assert.deepEqual(search.body.products.map((product) => product.slug), ["speaker"]);
    const priced = await api("GET", "/api/products?min=10000&max=150000");
    assert.equal(priced.body.total, 2);
    const one = await api("GET", "/api/products/phone-a");
    assert.equal(one.body.product.purchasable, true);
    assert.equal((await api("GET", "/api/products/phone-b")).body.product.purchasable, false);
    assert.equal((await api("GET", "/api/products/nope")).status, 404);
    const categories = await api("GET", "/api/categories");
    assert.equal(categories.body.categories.find((category) => category.key === "Phones").count, 2);
  });

  test("prices orders on the server and ignores prices sent by the browser", async () => {
    const response = await checkout({ items: [{ slug: "phone-a", quantity: 2, price: 1 }, { slug: "speaker" }] });
    assert.equal(response.status, 201);
    assert.match(response.body.orderNumber, /^YE-[A-Z2-9]{6}$/);
    assert.equal(response.body.order.subtotal, 15400 * 2 + 5000);
    assert.equal(response.body.order.deliveryFee, 300);
    assert.equal(response.body.order.total, 15400 * 2 + 5000 + 300);
    assert.equal(response.body.order.phone, "254712***678");
  });

  test("rejects orders that cannot be fulfilled online", async () => {
    assert.equal((await checkout({ items: [{ slug: "phone-b" }] })).status, 400, "unconfirmed price");
    assert.equal((await checkout({ items: [{ slug: "laptop" }] })).status, 400, "'from' price");
    assert.equal((await checkout({ items: [{ slug: "ghost" }] })).status, 400, "unknown product");
    assert.equal((await checkout({ phone: "12345" })).status, 400, "bad phone");
    assert.equal((await checkout({ deliveryAddress: "" })).status, 400, "delivery needs an address");
    assert.equal((await checkout({ deliveryMethod: "pickup", deliveryAddress: "" })).status, 201, "pickup needs no address");
    assert.equal((await checkout({ items: [{ slug: "phone-a", quantity: 0 }] })).status, 400, "zero quantity");
  });

  test("keeps orders private without the access key", async () => {
    const { body } = await checkout();
    assert.equal((await api("GET", `/api/orders/${body.orderNumber}`)).status, 404);
    assert.equal((await api("GET", `/api/orders/${body.orderNumber}?key=wrong`)).status, 404);
    assert.equal((await api("GET", `/api/orders/${body.orderNumber}?key=${body.accessKey}`)).status, 200);
  });

  const completed = (amount, extra = {}) => ({
    status_code: 1, payment_status_description: "Completed", amount, currency: "KES", payment_method: "MpesaKE",
    confirmation_code: "TJK1ABC2DE", error: null, status: "200", ...extra
  });
  const order = (created) => api("GET", `/api/orders/${created.orderNumber}?key=${created.accessKey}`).then((response) => response.body.order);
  const ipn = (trackingId) => api("GET", `/api/payments/pesapal/ipn?OrderTrackingId=${trackingId}&OrderMerchantReference=x&OrderNotificationType=IPNCHANGE`);

  test("Pesapal payment: order request, IPN and idempotency", async () => {
    const { body: created } = await checkout();
    const pay = await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey });
    assert.equal(pay.status, 201);
    assert.equal(pay.body.redirectUrl, `https://pay.example/${pesapal.state.orders.length}`);

    assert.deepEqual(pesapal.state.ipns.map((entry) => entry.url), ["https://shop.example/api/payments/pesapal/ipn"], "IPN registered once");
    const submitted = pesapal.state.orders.at(-1);
    assert.equal(submitted.id, `${created.orderNumber}-1`);
    assert.equal(submitted.amount, created.order.total);
    assert.equal(submitted.currency, "KES");
    assert.equal(submitted.notification_id, "ipn-1");
    assert.equal(submitted.callback_url, `https://shop.example/order.html?order=${created.orderNumber}&key=${created.accessKey}`);
    assert.equal(submitted.billing_address.phone_number, "0712345678");
    assert.equal(submitted.billing_address.first_name, "Wanjiku");
    assert.equal(submitted.billing_address.last_name, "Kamau");

    const again = await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey });
    assert.equal(again.body.redirectUrl, pay.body.redirectUrl, "a fresh link is reused rather than creating a second Pesapal order");
    assert.equal(pesapal.state.orders.at(-1), submitted);

    const trackingId = `trk-${pesapal.state.orders.length}`;
    // An IPN before the customer has paid must not change anything: we only trust GetTransactionStatus.
    assert.equal((await ipn(trackingId)).body.status, 200);
    assert.equal((await order(created)).paymentStatus, "unpaid");

    pesapal.state.statuses[trackingId] = completed(created.order.total);
    const notified = await ipn(trackingId);
    assert.deepEqual(notified.body, { orderNotificationType: "IPNCHANGE", orderTrackingId: trackingId, orderMerchantReference: "x", status: 200 });
    await ipn(trackingId); // duplicate notifications are harmless
    const paid = await order(created);
    assert.equal(paid.status, "paid");
    assert.equal(paid.paymentStatus, "paid");
    assert.equal(paid.payments.length, 1);
    assert.equal(paid.payments[0].confirmationCode, "TJK1ABC2DE");
    assert.equal(paid.payments[0].paymentMethod, "MpesaKE");
    assert.equal((await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey })).status, 409, "cannot pay twice");

    pesapal.state.statuses[trackingId] = { ...completed(created.order.total), status_code: 3, payment_status_description: "Reversed" };
    await ipn(trackingId);
    assert.equal((await order(created)).paymentStatus, "reversed");

    assert.equal((await ipn("unknown-id")).body.status, 200, "unknown IDs are acknowledged and ignored");
    assert.equal((await api("GET", "/api/payments/pesapal/ipn")).status, 400);
  });

  test("does not mark an order paid when the amount or currency is wrong", async () => {
    for (const status of [completed(1), completed(999999, { currency: "USD" })]) {
      const { body: created } = await checkout();
      await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey });
      pesapal.state.statuses[`trk-${pesapal.state.orders.length}`] = status;
      await ipn(`trk-${pesapal.state.orders.length}`);
      const result = await order(created);
      assert.equal(result.paymentStatus, "unpaid");
      assert.equal(result.payments[0].status, "amount_mismatch");
    }
  });

  test("verify picks up a failed attempt and a later success on the same payment page", async () => {
    const { body: created } = await checkout();
    await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey });
    const trackingId = `trk-${pesapal.state.orders.length}`;
    pesapal.state.statuses[trackingId] = { status_code: 2, payment_status_description: "Failed", amount: created.order.total, currency: "KES", error: null, status: "200" };
    let verify = await api("POST", `/api/orders/${created.orderNumber}/pay/verify`, { key: created.accessKey });
    assert.equal(verify.body.order.payments[0].status, "failed");
    assert.equal(verify.body.order.paymentStatus, "unpaid");

    pesapal.state.statuses[trackingId] = completed(created.order.total);
    verify = await api("POST", `/api/orders/${created.orderNumber}/pay/verify`, { key: created.accessKey });
    assert.equal(verify.body.order.paymentStatus, "paid");
  });

  test("a Pesapal error returns 502 and leaves no half-made payment behind", async () => {
    const { body: created } = await checkout();
    pesapal.state.failSubmit = true;
    const failed = await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey });
    pesapal.state.failSubmit = false;
    assert.equal(failed.status, 502);
    assert.equal((await order(created)).payments.length, 0);
    await api("POST", `/api/orders/${created.orderNumber}/pay`, { key: created.accessKey });
    assert.equal(pesapal.state.orders.at(-1).id, `${created.orderNumber}-1`);
  });

  test("payment is refused with 503 when Pesapal is not configured", async () => {
    const config = loadConfig({});
    const bare = await listen(createApp({ db, config, pesapal: createPesapalClient(config.pesapal) }));
    const { body: created } = await checkout();
    const response = await fetch(`${urlOf(bare)}/api/orders/${created.orderNumber}/pay`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: created.accessKey })
    });
    bare.close();
    assert.equal(response.status, 503);
  });

  test("admin login, product management and order updates", async () => {
    assert.equal((await api("GET", "/api/admin/orders")).status, 401);
    assert.equal((await api("POST", "/api/admin/login", { username: "owner", password: "nope" })).status, 401);
    const login = await api("POST", "/api/admin/login", { username: "owner", password: "correct horse battery" });
    assert.equal(login.status, 200);
    const auth = { Authorization: `Bearer ${login.body.token}` };

    const created = await api("POST", "/api/admin/products", { name: "Galaxy Watch 8", brand: "Samsung", category: "Wearables", price: 42000, priceConfirmed: true, images: ["images/w.png"] }, auth);
    assert.equal(created.status, 201);
    assert.equal(created.body.product.slug, "galaxy-watch-8");
    assert.equal((await api("POST", "/api/admin/products", { name: "Galaxy Watch 8", brand: "Samsung", category: "Wearables", price: 1 }, auth)).status, 409);
    assert.equal((await api("POST", "/api/admin/products", { name: "X", brand: "Y", category: "Toys", price: 1 }, auth)).status, 400);

    const phoneB = (await api("GET", "/api/products/phone-b")).body.product;
    const confirmed = await api("PATCH", `/api/admin/products/${phoneB.id}`, { priceConfirmed: true, price: 148000 }, auth);
    assert.equal(confirmed.body.product.purchasable, true);
    assert.equal(confirmed.body.product.price, 148000);

    assert.equal((await api("DELETE", `/api/admin/products/${created.body.product.id}`, undefined, auth)).status, 204);
    assert.equal((await api("GET", "/api/products/galaxy-watch-8")).status, 404, "hidden products leave the public catalogue");

    const { body: order } = await checkout({ deliveryMethod: "pickup" });
    const marked = await api("PATCH", `/api/admin/orders/${order.orderNumber}`, { paymentStatus: "paid" }, auth);
    assert.equal(marked.body.order.status, "paid");
    assert.equal(marked.body.order.phone, "254712345678", "admins see the full phone number");
    const shipped = await api("PATCH", `/api/admin/orders/${order.orderNumber}`, { status: "dispatched" }, auth);
    assert.equal(shipped.body.order.status, "dispatched");
    const paidOrders = await api("GET", "/api/admin/orders?status=dispatched", undefined, auth);
    assert.ok(paidOrders.body.orders.some((item) => item.orderNumber === order.orderNumber));

    assert.equal((await api("POST", "/api/admin/logout", undefined, auth)).status, 204);
    assert.equal((await api("GET", "/api/admin/me", undefined, auth)).status, 401);
  });

  test("serves the storefront but never server files", async () => {
    const get = (path) => fetch(`${urlOf(server)}${path}`);
    assert.equal((await get("/")).status, 200);
    assert.equal((await get("/shop.html")).status, 200);
    assert.equal((await get("/images/APPLE%2017-01.png")).status, 200);
    for (const page of ["/cart.html", "/checkout.html", "/order.html", "/admin.html", "/admin.js", "/app.js"]) assert.equal((await get(page)).status, 200, page);
    assert.equal((await get("/admin.html")).headers.get("x-robots-tag"), "noindex, nofollow");
    for (const path of ["/server/.env.example", "/server/data/products.seed.json", "/.git/config", "/server/src/config.js", "/images/../server/package.json", "/.gitignore", "/Samsung%20A06%2064gb.docx"]) {
      const response = await get(path);
      assert.equal(response.status, 404, path);
      assert.ok(!(await response.text()).includes("PESAPAL_"), path);
    }
  });

  test("sitemap lists visible products and robots.txt points to it", async () => {
    const sitemap = await (await fetch(`${urlOf(server)}/sitemap.xml`)).text();
    assert.match(sitemap, /<loc>https:\/\/shop\.example\/product\.html\?id=phone-a<\/loc>/);
    assert.match(await (await fetch(`${urlOf(server)}/robots.txt`)).text(), /Sitemap: https:\/\/shop\.example\/sitemap\.xml/);
  });

  test("enquiries: public form, admin inbox and dashboard summary", async () => {
    assert.equal((await api("POST", "/api/enquiries", { name: "Otieno", phone: "123", message: "Hi" })).status, 400);
    assert.equal((await api("POST", "/api/enquiries", { name: "Otieno", phone: "0722000111", message: "" })).status, 400);
    const sent = await api("POST", "/api/enquiries", { name: "Otieno", phone: "0722 000 111", message: "Is it in blue? <b>", productSlug: "phone-a" });
    assert.equal(sent.status, 201);

    const { body: login } = await api("POST", "/api/admin/login", { username: "owner", password: "correct horse battery" });
    const auth = { Authorization: `Bearer ${login.token}` };
    assert.equal((await api("GET", "/api/admin/enquiries")).status, 401);
    const inbox = await api("GET", "/api/admin/enquiries?status=new", undefined, auth);
    const enquiry = inbox.body.enquiries[0];
    assert.equal(enquiry.phone, "254722000111");
    assert.equal(enquiry.message, "Is it in blue? <b>");
    assert.deepEqual(enquiry.product, { slug: "phone-a", name: "Phone A" });

    const before = (await api("GET", "/api/admin/summary", undefined, auth)).body;
    assert.ok(before.newEnquiries >= 1);
    assert.equal((await api("PATCH", `/api/admin/enquiries/${enquiry.id}`, { status: "handled" }, auth)).status, 200);
    assert.equal((await api("GET", "/api/admin/summary", undefined, auth)).body.newEnquiries, before.newEnquiries - 1);
    assert.equal((await api("PATCH", "/api/admin/enquiries/99999", { status: "handled" }, auth)).status, 404);
    for (const key of ["toFulfil", "awaitingPayment", "paidToday", "unconfirmedPrices", "paymentIssues"]) assert.equal(typeof before[key], "number", key);
  });
});

test("the product seed is valid and every image exists", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const config = loadConfig({});
  const seedFile = JSON.parse(fs.readFileSync(path.join(config.serverRoot, "data", "products.seed.json"), "utf8"));
  const db = openDatabase(":memory:");
  assert.equal(seedProducts(db, seedFile), seedFile.length);
  assert.equal(new Set(seedFile.map((product) => product.slug)).size, seedFile.length);
  for (const product of seedFile) {
    assert.ok(product.images.length > 0, product.name);
    for (const image of product.images) assert.ok(fs.existsSync(path.join(config.siteRoot, image)), image);
  }
  db.close();
});

test("normalises Kenyan phone numbers", () => {
  for (const input of ["0712345678", "+254712345678", "254712345678", "712345678", "0712 345 678", "0712-345-678"]) assert.equal(normalizeKenyanPhone(input), "254712345678", input);
  assert.equal(normalizeKenyanPhone("0110123456"), "254110123456");
  for (const input of ["0812345678", "071234567", "hello", "", null]) assert.equal(normalizeKenyanPhone(input), null, String(input));
});

