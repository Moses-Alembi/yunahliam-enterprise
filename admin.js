/* Yunahliam Enterprise store admin: orders, products and enquiries. Talks to /api/admin/*. */
const root = document.querySelector("#admin");
const tabBar = document.querySelector(".admin-tabs");
const userBox = document.querySelector(".admin-user");
const tokenKey = "yunahliam-admin-token";

const categories = [
  ["Phones", "Phones"], ["Computers", "Computers & Tablets"], ["Audio", "Audio & Speakers"], ["Power", "Power Stations"],
  ["Gaming", "Gaming"], ["Wearables", "Smart Watches"], ["Accessories", "Accessories"]
];
const orderStatuses = [
  ["pending_payment", "Awaiting payment"], ["paid", "Paid"], ["processing", "Processing"],
  ["dispatched", "Dispatched"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]
];
const statusLabel = Object.fromEntries([...orderStatuses, ["unpaid", "Unpaid"], ["reversed", "Reversed"], ["pending", "Pending"], ["failed", "Failed"], ["amount_mismatch", "Amount mismatch"], ["new", "New"], ["handled", "Handled"]]);
const deliveryLabel = { pickup: "Pickup in store", nairobi: "Delivery in Nairobi", countrywide: "Delivery outside Nairobi" };

/* ---------- Helpers ---------- */
const escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => escapeMap[char]);
const money = (amount) => `KSh ${new Intl.NumberFormat("en-KE").format(amount)}`;
// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS".
const when = (value) => value ? new Date(`${value.replace(" ", "T")}${value.endsWith("Z") ? "" : "Z"}`).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "";
const pill = (status) => `<span class="pill pill-${esc(status)}">${esc(statusLabel[status] || status)}</span>`;
const localPhone = (phone) => phone?.startsWith("254") ? `0${phone.slice(3)}` : phone;
const whatsapp = (phone) => `https://wa.me/${encodeURIComponent(phone)}`;

let token = null;
try { token = sessionStorage.getItem(tokenKey); } catch { /* storage unavailable */ }

async function api(path, { method = "GET", body } = {}) {
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) };
  const response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 401 && token) {
    signOut();
    throw new Error("Your session has ended. Please log in again.");
  }
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function setToken(value) {
  token = value;
  try { value ? sessionStorage.setItem(tokenKey, value) : sessionStorage.removeItem(tokenKey); } catch { /* storage unavailable */ }
}
function signOut() {
  setToken(null);
  showLogin();
}
function failure(error) {
  root.innerHTML = `<section class="panel notice notice-error"><b>${esc(error.message)}</b></section>`;
}

/* ---------- Login ---------- */
function showLogin(message = "") {
  tabBar.hidden = true;
  userBox.hidden = true;
  root.innerHTML = `
    <form class="panel login-card checkout-form" id="login-form">
      <img src="images/logo.png" alt="Yunahliam Enterprise" width="487" height="240">
      <h1 style="text-align:center;font-size:20px">Store admin</h1>
      <label>Username<input name="username" autocomplete="username" required></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
      <p class="form-error" ${message ? "" : "hidden"}>${esc(message)}</p>
      <button class="button button-primary button-block" type="submit">Log in</button>
    </form>`;
  const form = root.querySelector("#login-form");
  form.elements.username.focus();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const data = await api("/api/admin/login", { method: "POST", body: Object.fromEntries(new FormData(form)) });
      setToken(data.token);
      startApp(data.username);
    } catch (error) {
      showLogin(error.message);
    }
  });
}

function startApp(username) {
  tabBar.hidden = false;
  userBox.hidden = false;
  document.querySelector("#admin-name").textContent = username;
  route();
}

document.querySelector("#logout").addEventListener("click", async () => {
  try { await api("/api/admin/logout", { method: "POST" }); } catch { /* already signed out */ }
  signOut();
});
tabBar.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) location.hash = tab.dataset.tab;
});

/* ---------- Routing (#orders, #order/YE-…, #products, #product/12, #product/new, #enquiries) ---------- */
function route() {
  if (!token) return showLogin();
  const [view, id] = decodeURIComponent(location.hash.slice(1)).split("/");
  const tab = { order: "orders", product: "products" }[view] || view || "dashboard";
  tabBar.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === tab)));
  const views = { dashboard, orders, order: () => orderDetail(id), products, product: () => productForm(id), enquiries };
  root.innerHTML = '<p class="detail-loading">Loading…</p>';
  (views[view] || dashboard)().catch(failure);
  refreshBadges();
}
window.addEventListener("hashchange", route);

async function refreshBadges() {
  try {
    const summary = await api("/api/admin/summary");
    tabBar.querySelectorAll("[data-badge]").forEach((badge) => {
      const value = summary[badge.dataset.badge];
      badge.textContent = value;
      badge.hidden = !value;
    });
    return summary;
  } catch { return null; }
}

/* ---------- Dashboard ---------- */
async function dashboard() {
  const summary = await api("/api/admin/summary");
  const card = (value, label, hash, alert = false) => `<button class="panel stat-card${alert && value ? " alert" : ""}" type="button" onclick="location.hash='${hash}'"><strong>${esc(value)}</strong><span>${esc(label)}</span></button>`;
  root.innerHTML = `
    <div class="panel toolbar"><h1>Dashboard</h1><a class="button button-ghost" href="index.html" target="_blank" rel="noopener">View store ↗</a></div>
    <div class="stat-grid">
      ${card(summary.toFulfil, "Paid orders to fulfil", "orders")}
      ${card(summary.awaitingPayment, "Orders awaiting payment", "orders")}
      ${card(money(summary.paidToday), "Paid today", "orders")}
      ${card(summary.newEnquiries, "New enquiries", "enquiries")}
      ${card(summary.unconfirmedPrices, "Products with unconfirmed prices", "products", true)}
      ${card(summary.paymentIssues, "Payments needing review", "orders", true)}
    </div>
    ${summary.unconfirmedPrices ? `<p class="notice">Products with unconfirmed prices show a guide price and can only be ordered by phone. Open <a href="#products">Products</a>, check each price and tick <b>Confirmed</b> to let customers buy it online.</p>` : ""}
    ${summary.paymentIssues ? '<p class="notice notice-error">Some payments were reversed or did not match the order total. Check them in the Pesapal dashboard before dispatching.</p>' : ""}`;
}

/* ---------- Orders ---------- */
async function orders() {
  const status = new URLSearchParams(location.search).get("status") || sessionStorage.getItem("admin-order-filter") || "";
  const data = await api(`/api/admin/orders?limit=200${status ? `&status=${status}` : ""}`);
  root.innerHTML = `
    <div class="panel toolbar"><h1>Orders</h1>
      <label>Show <select id="order-filter"><option value="">All orders</option>${orderStatuses.map(([key, label]) => `<option value="${key}" ${key === status ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <button class="button button-ghost" type="button" id="reload">Refresh</button>
    </div>
    <section class="panel table-wrap"><table class="admin-table">
      <thead><tr><th>Order</th><th>Placed</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>${data.orders.length ? data.orders.map((order) => `
        <tr class="clickable" data-order="${esc(order.orderNumber)}">
          <td><b>${esc(order.orderNumber)}</b><div class="muted">${order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</div></td>
          <td>${esc(when(order.createdAt))}</td>
          <td>${esc(order.customerName)}<div class="muted">${esc(localPhone(order.phone))}</div></td>
          <td>${esc(deliveryLabel[order.deliveryMethod] || order.deliveryMethod)}</td>
          <td><b>${money(order.total)}</b></td>
          <td>${pill(order.status)}</td>
          <td>${pill(order.paymentStatus)}${order.payments.some((payment) => ["amount_mismatch", "reversed"].includes(payment.status)) ? ' <span class="pill pill-failed">Check</span>' : ""}</td>
        </tr>`).join("") : '<tr><td colspan="7" class="empty-row">No orders yet.</td></tr>'}</tbody>
    </table></section>`;
  root.querySelector("#order-filter").addEventListener("change", (event) => {
    try { sessionStorage.setItem("admin-order-filter", event.target.value); } catch { /* ignore */ }
    orders().catch(failure);
  });
  root.querySelector("#reload").addEventListener("click", () => orders().catch(failure));
  root.querySelector("tbody").addEventListener("click", (event) => {
    const row = event.target.closest("[data-order]");
    if (row) location.hash = `order/${row.dataset.order}`;
  });
}

async function orderDetail(orderNumber) {
  const { order } = await api(`/api/admin/orders/${encodeURIComponent(orderNumber)}`);
  root.innerHTML = `
    <div class="panel toolbar"><h1>Order ${esc(order.orderNumber)}</h1>${pill(order.status)} ${pill(order.paymentStatus)}<a class="button button-ghost" href="#orders">← All orders</a></div>
    <section class="panel detail-card">
      <dl class="detail-grid">
        <div><dt>Customer</dt><dd>${esc(order.customerName)}</dd></div>
        <div><dt>Phone</dt><dd><a href="tel:+${esc(order.phone)}">${esc(localPhone(order.phone))}</a> · <a href="${whatsapp(order.phone)}" target="_blank" rel="noopener">WhatsApp</a></dd></div>
        <div><dt>Email</dt><dd>${order.email ? `<a href="mailto:${esc(order.email)}">${esc(order.email)}</a>` : "—"}</dd></div>
        <div><dt>Placed</dt><dd>${esc(when(order.createdAt))}</dd></div>
        <div><dt>Delivery</dt><dd>${esc(deliveryLabel[order.deliveryMethod] || order.deliveryMethod)}</dd></div>
        <div><dt>Address</dt><dd>${esc(order.deliveryAddress || "—")}</dd></div>
        <div><dt>Notes</dt><dd>${esc(order.notes || "—")}</dd></div>
        <div><dt>Paid at</dt><dd>${esc(when(order.paidAt) || "—")}</dd></div>
      </dl>
    </section>
    <section class="panel table-wrap"><table class="admin-table">
      <thead><tr><th>Item</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
      <tbody>${order.items.map((item) => `<tr><td>${esc(item.name)}</td><td>${money(item.unitPrice)}</td><td>${item.quantity}</td><td>${money(item.lineTotal)}</td></tr>`).join("")}
        <tr><td colspan="3" style="text-align:right">Delivery</td><td>${money(order.deliveryFee)}</td></tr>
        <tr><td colspan="3" style="text-align:right"><b>Total</b></td><td><b>${money(order.total)}</b></td></tr></tbody>
    </table></section>
    <section class="panel table-wrap"><table class="admin-table">
      <thead><tr><th>Payment attempt</th><th>Started</th><th>Amount</th><th>Status</th><th>Method</th><th>Pesapal confirmation</th></tr></thead>
      <tbody>${order.payments.length ? order.payments.map((payment) => `<tr><td>${esc(payment.merchantReference)}<div class="muted">${esc(payment.trackingId || "")}</div></td><td>${esc(when(payment.createdAt))}</td><td>${money(payment.amount)}</td><td>${pill(payment.status)}</td><td>${esc(payment.paymentMethod || "—")}</td><td>${esc(payment.confirmationCode || "—")}</td></tr>`).join("") : '<tr><td colspan="6" class="empty-row">No online payment attempts.</td></tr>'}</tbody>
    </table></section>
    <section class="panel detail-card">
      <h2 style="font-size:17px">Update order</h2>
      <div class="action-row">
        <label class="visually-hidden" for="status-select">Order status</label>
        <select id="status-select">${orderStatuses.map(([key, label]) => `<option value="${key}" ${key === order.status ? "selected" : ""}>${label}</option>`).join("")}</select>
        <button class="button button-primary" type="button" id="save-status">Save status</button>
        ${order.paymentStatus !== "paid" ? '<button class="button button-outline" type="button" id="mark-paid">Mark as paid (cash / in store)</button>' : ""}
        <span class="form-status" id="order-message"></span>
      </div>
    </section>`;
  const message = root.querySelector("#order-message");
  const save = async (body) => {
    try {
      await api(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}`, { method: "PATCH", body });
      await orderDetail(order.orderNumber);
      refreshBadges();
    } catch (error) { message.textContent = error.message; }
  };
  root.querySelector("#save-status").addEventListener("click", () => save({ status: root.querySelector("#status-select").value }));
  root.querySelector("#mark-paid")?.addEventListener("click", () => {
    if (confirm(`Mark ${order.orderNumber} as paid? Only do this if you received ${money(order.total)} outside the website.`)) save({ paymentStatus: "paid" });
  });
}

/* ---------- Products ---------- */
async function products() {
  const { products: list } = await api("/api/admin/products");
  root.innerHTML = `
    <div class="panel toolbar"><h1>Products <span class="muted" style="font-size:14px;font-weight:400">(${list.length})</span></h1>
      <input type="search" id="product-filter" placeholder="Search products" aria-label="Search products">
      <label><input type="checkbox" id="unconfirmed-only"> Unconfirmed prices only</label>
      <a class="button button-primary" href="#product/new">+ Add product</a>
    </div>
    <p class="notice">Tick <b>Confirmed</b> once a price is correct. Only confirmed, in-stock products with a fixed price can be bought online; the rest show a guide price and a call button.</p>
    <section class="panel table-wrap"><table class="admin-table">
      <thead><tr><th></th><th>Product</th><th>Price (KSh)</th><th>Confirmed</th><th>In stock</th><th>Visible</th><th></th></tr></thead>
      <tbody>${list.map((product) => `
        <tr data-id="${product.id}" data-search="${esc(`${product.name} ${product.brand} ${product.category}`.toLowerCase())}" data-confirmed="${product.priceConfirmed}">
          <td><img src="${esc(product.images[0] || "images/logo.png")}" alt="" loading="lazy"></td>
          <td><a href="#product/${product.id}"><b>${esc(product.name)}</b></a><div class="muted">${esc(product.brand)} · ${esc(product.category)}${product.priceFrom ? " · “From” price" : ""}${product.purchasable ? " · Sold online" : ""}</div></td>
          <td><input type="number" min="0" step="100" name="price" value="${product.price}" aria-label="Price for ${esc(product.name)}"></td>
          <td><input type="checkbox" name="priceConfirmed" ${product.priceConfirmed ? "checked" : ""} aria-label="Price confirmed"></td>
          <td><input type="checkbox" name="inStock" ${product.inStock ? "checked" : ""} aria-label="In stock"></td>
          <td><input type="checkbox" name="active" ${product.active ? "checked" : ""} aria-label="Visible in the store"></td>
          <td><button class="button button-primary button-small" type="button" data-save hidden>Save</button><span class="muted" data-saved></span></td>
        </tr>`).join("")}</tbody>
    </table></section>`;

  const rows = [...root.querySelectorAll("tbody tr")];
  const applyFilter = () => {
    const query = root.querySelector("#product-filter").value.trim().toLowerCase();
    const unconfirmedOnly = root.querySelector("#unconfirmed-only").checked;
    rows.forEach((row) => { row.hidden = (query && !row.dataset.search.includes(query)) || (unconfirmedOnly && row.dataset.confirmed === "true"); });
  };
  root.querySelector("#product-filter").addEventListener("input", applyFilter);
  root.querySelector("#unconfirmed-only").addEventListener("change", applyFilter);

  const tbody = root.querySelector("tbody");
  tbody.addEventListener("input", (event) => {
    const row = event.target.closest("tr");
    row.classList.add("dirty");
    row.querySelector("[data-save]").hidden = false;
    row.querySelector("[data-saved]").textContent = "";
  });
  tbody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-save]");
    if (!button) return;
    const row = button.closest("tr");
    const price = Number(row.querySelector('[name="price"]').value);
    if (!Number.isInteger(price) || price < 0) {
      row.querySelector("[data-saved]").textContent = "Enter a whole number";
      return;
    }
    button.disabled = true;
    try {
      const { product } = await api(`/api/admin/products/${row.dataset.id}`, {
        method: "PATCH",
        body: { price, priceConfirmed: row.querySelector('[name="priceConfirmed"]').checked, inStock: row.querySelector('[name="inStock"]').checked, active: row.querySelector('[name="active"]').checked }
      });
      row.classList.remove("dirty");
      row.dataset.confirmed = String(product.priceConfirmed);
      button.hidden = true;
      row.querySelector("[data-saved]").textContent = product.purchasable ? "Saved · sold online" : "Saved";
      refreshBadges();
    } catch (error) {
      row.querySelector("[data-saved]").textContent = error.message;
    }
    button.disabled = false;
  });
}

async function productForm(id) {
  const isNew = id === "new";
  const product = isNew
    ? { name: "", brand: "", category: "Phones", price: 0, priceFrom: false, priceConfirmed: false, badge: "", description: "", specs: {}, images: [], inStock: true, active: true, sortOrder: 0 }
    : (await api(`/api/admin/products/${encodeURIComponent(id)}`)).product;
  root.innerHTML = `
    <div class="panel toolbar"><h1>${isNew ? "Add product" : `Edit ${esc(product.name)}`}</h1>${isNew ? "" : `<a class="button button-ghost" href="product.html?id=${esc(product.slug)}" target="_blank" rel="noopener">View in store ↗</a>`}<a class="button button-ghost" href="#products">← All products</a></div>
    <form class="panel product-form checkout-form" id="product-form">
      <div class="form-row"><label>Name<input name="name" required maxlength="200" value="${esc(product.name)}"></label><label>Brand<input name="brand" required maxlength="100" value="${esc(product.brand)}"></label></div>
      <div class="form-row three">
        <label>Category<select name="category">${categories.map(([key, label]) => `<option value="${key}" ${key === product.category ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Price (KSh)<input name="price" type="number" min="0" step="1" required value="${product.price}"></label>
        <label><span>Badge <small>(short label on the photo)</small></span><input name="badge" maxlength="40" value="${esc(product.badge || "")}"></label>
      </div>
      <div class="checks">
        <label><input type="checkbox" name="priceConfirmed" ${product.priceConfirmed ? "checked" : ""}> Price confirmed</label>
        <label><input type="checkbox" name="priceFrom" ${product.priceFrom ? "checked" : ""}> Show as “From” price (phone orders only)</label>
        <label><input type="checkbox" name="inStock" ${product.inStock ? "checked" : ""}> In stock</label>
        <label><input type="checkbox" name="active" ${product.active ? "checked" : ""}> Visible in the store</label>
      </div>
      <label><span>Description <small>(blank lines start new paragraphs)</small></span><textarea name="description" rows="5" maxlength="5000">${esc(product.description)}</textarea></label>
      <label><span>Specifications <small>(one per line, e.g. “Storage: 256GB”)</small></span><textarea name="specs" rows="4">${esc(Object.entries(product.specs).map(([label, value]) => `${label}: ${value}`).join("\n"))}</textarea></label>
      <label><span>Images <small>(one path per line, e.g. images/A57-01.png; the first is the main photo)</small></span><textarea name="images" rows="4">${esc(product.images.join("\n"))}</textarea></label>
      <label><span>Sort order <small>(lower numbers appear first)</small></span><input name="sortOrder" type="number" step="1" value="${product.sortOrder}"></label>
      <p class="form-error" id="product-error" hidden></p>
      <div class="action-row"><button class="button button-primary" type="submit">${isNew ? "Create product" : "Save changes"}</button></div>
    </form>`;
  const form = root.querySelector("#product-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorBox = root.querySelector("#product-error");
    errorBox.hidden = true;
    const field = (name) => form.elements[name];
    const specs = {};
    for (const line of field("specs").value.split("\n").map((value) => value.trim()).filter(Boolean)) {
      const split = line.indexOf(":");
      if (split < 1) { errorBox.textContent = `Specification “${line}” needs a label, e.g. “Storage: 256GB”.`; errorBox.hidden = false; return; }
      specs[line.slice(0, split).trim()] = line.slice(split + 1).trim();
    }
    const body = {
      name: field("name").value, brand: field("brand").value, category: field("category").value,
      price: Number(field("price").value), badge: field("badge").value.trim() || null, description: field("description").value,
      specs, images: field("images").value.split("\n").map((value) => value.trim()).filter(Boolean),
      priceConfirmed: field("priceConfirmed").checked, priceFrom: field("priceFrom").checked,
      inStock: field("inStock").checked, active: field("active").checked, sortOrder: Number(field("sortOrder").value) || 0
    };
    try {
      const saved = isNew
        ? await api("/api/admin/products", { method: "POST", body })
        : await api(`/api/admin/products/${product.id}`, { method: "PATCH", body });
      location.hash = "products";
      if (!isNew) refreshBadges();
      return saved;
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    }
  });
}

/* ---------- Enquiries ---------- */
async function enquiries() {
  const filter = sessionStorage.getItem("admin-enquiry-filter") ?? "new";
  const { enquiries: list } = await api(`/api/admin/enquiries${filter ? `?status=${filter}` : ""}`);
  root.innerHTML = `
    <div class="panel toolbar"><h1>Enquiries</h1>
      <label>Show <select id="enquiry-filter"><option value="new" ${filter === "new" ? "selected" : ""}>New</option><option value="handled" ${filter === "handled" ? "selected" : ""}>Handled</option><option value="" ${filter === "" ? "selected" : ""}>All</option></select></label>
    </div>
    <section class="panel table-wrap"><table class="admin-table">
      <thead><tr><th>Received</th><th>From</th><th>Product</th><th>Message</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.length ? list.map((enquiry) => `
        <tr>
          <td>${esc(when(enquiry.createdAt))}</td>
          <td><b>${esc(enquiry.name)}</b><div class="muted"><a href="tel:+${esc(enquiry.phone)}">${esc(localPhone(enquiry.phone))}</a> · <a href="${whatsapp(enquiry.phone)}" target="_blank" rel="noopener">WhatsApp</a></div>${enquiry.email ? `<div class="muted"><a href="mailto:${esc(enquiry.email)}">${esc(enquiry.email)}</a></div>` : ""}</td>
          <td>${enquiry.product ? `<a href="product.html?id=${esc(enquiry.product.slug)}" target="_blank" rel="noopener">${esc(enquiry.product.name)}</a>` : "—"}</td>
          <td class="enquiry-message">${esc(enquiry.message)}</td>
          <td>${pill(enquiry.status)}</td>
          <td><button class="button button-ghost button-small" type="button" data-enquiry="${enquiry.id}" data-next="${enquiry.status === "new" ? "handled" : "new"}">${enquiry.status === "new" ? "Mark handled" : "Reopen"}</button></td>
        </tr>`).join("") : '<tr><td colspan="6" class="empty-row">Nothing here.</td></tr>'}</tbody>
    </table></section>`;
  root.querySelector("#enquiry-filter").addEventListener("change", (event) => {
    try { sessionStorage.setItem("admin-enquiry-filter", event.target.value); } catch { /* ignore */ }
    enquiries().catch(failure);
  });
  root.querySelector("tbody").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-enquiry]");
    if (!button) return;
    button.disabled = true;
    try {
      await api(`/api/admin/enquiries/${button.dataset.enquiry}`, { method: "PATCH", body: { status: button.dataset.next } });
      await enquiries();
      refreshBadges();
    } catch (error) { failure(error); }
  });
}

/* ---------- Start ---------- */
if (token) {
  api("/api/admin/me").then((me) => startApp(me.username)).catch(() => signOut());
} else {
  showLogin();
}
