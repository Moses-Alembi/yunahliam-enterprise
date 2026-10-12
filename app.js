/* Yunahliam Enterprise storefront. Products, orders and payments come from the store API (server/). */
const storePhone = { display: "0726 160 460", tel: "+254726160460" };

const categories = [
  { key: "Phones", label: "Phones" },
  { key: "Computers", label: "Computers & Tablets" },
  { key: "Audio", label: "Audio & Speakers" },
  { key: "Power", label: "Power Stations" },
  { key: "Gaming", label: "Gaming" },
  { key: "Wearables", label: "Smart Watches" },
  { key: "Accessories", label: "Accessories" }
];

/* ---------- Helpers ---------- */
const escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => escapeMap[char]);
}
const priceFormatter = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
function formatKsh(amount) {
  return `<span class="price-cur">KSh</span>${priceFormatter.format(amount)}`;
}
function formatPrice(product) {
  return `${product.priceFrom ? '<span class="price-from">From</span>' : ""}${formatKsh(product.price)}`;
}
function categoryLabel(key) {
  const category = categories.find((item) => item.key === key);
  return category ? category.label : "All products";
}
function countLabel(count) {
  return `${count} ${count === 1 ? "product" : "products"}`;
}
function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
function callButton(label = "☎ Call to order", extraClass = "") {
  return `<a class="button button-cta button-block ${extraClass}" href="tel:${storePhone.tel}">${label}</a>`;
}
function errorPanel(message) {
  return `<section class="panel notice notice-error"><b>${esc(message)}</b><p>Please try again, or call us on <a href="tel:${storePhone.tel}">${storePhone.display}</a>.</p></section>`;
}

/* ---------- Store API ---------- */
async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw Object.assign(new Error("We could not reach the store. Check your connection."), { status: 0 });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "Something went wrong."), { status: response.status });
  return data;
}

let productsPromise = null;
function loadProducts() {
  productsPromise ??= api("/api/products?limit=500").then((data) => data.products).catch((error) => {
    productsPromise = null;
    throw error;
  });
  return productsPromise;
}
function categoryImage(products, key) {
  const product = products.find((item) => item.category === key);
  return product ? product.images[0] : "";
}

/* ---------- Saved items (per browser) ---------- */
const savedKey = "yunahliam-saved";
const saved = new Set(readStored(savedKey, []));
function updateSavedCount() {
  document.querySelectorAll(".saved-count").forEach((badge) => { badge.textContent = saved.size || ""; });
}
function toggleSaved(id) {
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  writeStored(savedKey, [...saved]);
  updateSavedCount();
  return saved.has(id);
}

/* ---------- Cart (per browser; prices always come from the server) ---------- */
const cartKey = "yunahliam-cart";
const maxPerItem = 10;
let cart = readStored(cartKey, {});
function saveCart() {
  writeStored(cartKey, cart);
  updateCartCount();
}
function cartCount() {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}
function updateCartCount() {
  document.querySelectorAll(".cart-count").forEach((badge) => { badge.textContent = cartCount() || ""; });
}
function addToCart(slug, quantity = 1) {
  cart[slug] = Math.min((cart[slug] || 0) + quantity, maxPerItem);
  saveCart();
}
function setCartQuantity(slug, quantity) {
  if (quantity <= 0) delete cart[slug];
  else cart[slug] = Math.min(quantity, maxPerItem);
  saveCart();
}
function clearCart() {
  cart = {};
  saveCart();
}
window.addEventListener("storage", (event) => {
  if (event.key === cartKey) { cart = readStored(cartKey, {}); updateCartCount(); }
  if (event.key === savedKey) updateSavedCount();
});
updateSavedCount();
updateCartCount();

/* ---------- Toast ---------- */
let toastTimer;
function showToast(html) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.innerHTML = html;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

/* ---------- Shared markup ---------- */
function productCard(product, index = 0) {
  const id = product.slug;
  const isSaved = saved.has(id);
  const altImage = product.images[1];
  const shine = /new in|just landed/i.test(product.badge || "") ? " tag-shine" : "";
  const action = product.purchasable
    ? `<button class="button button-primary button-small" type="button" data-add-to-cart="${esc(id)}">Add to cart</button>`
    : `<a class="button button-ghost button-small" href="product.html?id=${esc(id)}">${product.inStock ? "View details" : "Out of stock"}</a>`;
  return `
    <article class="product-card" style="animation-delay:${Math.min(index * 30, 240)}ms">
      <a class="product-photo${altImage ? " has-alt" : ""}" href="product.html?id=${esc(id)}" aria-label="View ${esc(product.name)}">
        <img class="photo-main" src="${esc(product.images[0])}" alt="${esc(product.name)}" loading="lazy">
        ${altImage ? `<img class="photo-alt" src="${esc(altImage)}" alt="" loading="lazy" aria-hidden="true">` : ""}
        ${product.badge ? `<span class="product-tag${shine}">${esc(product.badge)}</span>` : ""}
      </a>
      <button class="product-save" type="button" data-save="${esc(id)}" aria-label="Save ${esc(product.name)}" aria-pressed="${isSaved}">${isSaved ? "♥" : "♡"}</button>
      <div class="product-body">
        <strong class="product-price">${formatPrice(product)}</strong>
        <h3 class="product-title"><a href="product.html?id=${esc(id)}">${esc(product.name)}</a></h3>
        <p class="product-desc">${esc(product.brand)} · ${esc(categoryLabel(product.category))}</p>
        <div class="product-chips"><span class="chip">Brand New</span><span class="chip chip-brand">Warranty</span>${product.inStock ? "" : '<span class="chip chip-warn">Out of stock</span>'}</div>
        <div class="product-action">${action}</div>
      </div>
    </article>`;
}
function skeletonCards(count = 8) {
  return Array.from({ length: count }, () => '<div class="product-card skeleton" aria-hidden="true"><div class="product-photo"></div><div class="product-body"><span></span><span></span></div></div>').join("");
}

function renderCategoryList(list, products, { active = "All", asLinks = false } = {}) {
  const rows = [{ key: "All", label: "All products", count: products.length }]
    .concat(categories.map((category) => ({ ...category, count: products.filter((product) => product.category === category.key).length })));
  list.innerHTML = rows.map((row) => {
    const thumb = row.key === "All"
      ? '<span class="category-thumb all" aria-hidden="true">★</span>'
      : `<span class="category-thumb"><img src="${esc(categoryImage(products, row.key))}" alt="" loading="lazy"></span>`;
    const inner = `${thumb}<span><span class="category-name">${esc(row.label)}</span><span class="category-count">${countLabel(row.count)}</span></span><span class="category-chevron" aria-hidden="true">›</span>`;
    const activeClass = row.key === active ? " active" : "";
    return asLinks
      ? `<li><a class="category-item${activeClass}" href="shop.html${row.key === "All" ? "" : `?category=${row.key}`}">${inner}</a></li>`
      : `<li><button class="category-item${activeClass}" type="button" data-category="${row.key}" aria-pressed="${row.key === active}">${inner}</button></li>`;
  }).join("");
}

document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  if (saveButton) {
    const isSaved = toggleSaved(saveButton.dataset.save);
    saveButton.setAttribute("aria-pressed", String(isSaved));
    saveButton.textContent = isSaved ? "♥" : "♡";
    saveButton.classList.remove("pop");
    if (isSaved) {
      void saveButton.offsetWidth; // restart the animation on repeat saves
      saveButton.classList.add("pop");
    }
    document.dispatchEvent(new CustomEvent("saved-change"));
    return;
  }
  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    addToCart(addButton.dataset.addToCart);
    showToast(`Added to your cart. <a href="cart.html">View cart (${cartCount()})</a>`);
  }
});

/* ---------- Home page: featured products ---------- */
const trendingGrid = document.querySelector("#trending-grid");
if (trendingGrid) {
  trendingGrid.innerHTML = skeletonCards(8);
  loadProducts().then((products) => {
    renderCategoryList(document.querySelector("#category-list"), products, { asLinks: true });
    trendingGrid.innerHTML = products.slice(0, 12).map(productCard).join("");
  }).catch((error) => { trendingGrid.innerHTML = errorPanel(error.message); });
}

/* ---------- Shop page: filters and products ---------- */
const productGrid = document.querySelector("#product-grid");
if (productGrid) {
  const params = new URLSearchParams(window.location.search);
  const categoryList = document.querySelector("#category-list");
  const searchInput = document.querySelector("#product-search");
  const searchCategory = document.querySelector("#search-category");
  const sortSelect = document.querySelector("#sort-products");
  const priceMin = document.querySelector("#price-min");
  const priceMax = document.querySelector("#price-max");
  const resultCount = document.querySelector("#result-count");
  const sectionTitle = document.querySelector("#section-title");
  const breadcrumbCurrent = document.querySelector("#breadcrumb-current");
  const emptyState = document.querySelector("#empty-state");
  const showAllButton = document.querySelector("#show-all");
  const pageSize = 12;
  let products = [];

  const state = {
    category: categories.some((item) => item.key === params.get("category")) ? params.get("category") : "All",
    query: params.get("q") || "",
    savedOnly: params.get("saved") === "1",
    min: Number(params.get("min")) || 0,
    max: Number(params.get("max")) || 0,
    visible: pageSize
  };
  searchInput.value = state.query;
  searchCategory.value = state.category;
  if (state.min) priceMin.value = state.min;
  if (state.max) priceMax.value = state.max;

  function filteredProducts() {
    const search = state.query.trim().toLowerCase();
    const matches = products.filter((product) =>
      (state.category === "All" || product.category === state.category) &&
      (!search || `${product.name} ${product.brand} ${product.category} ${categoryLabel(product.category)}`.toLowerCase().includes(search)) &&
      (!state.min || product.price >= state.min) &&
      (!state.max || product.price <= state.max) &&
      (!state.savedOnly || saved.has(product.slug)));
    if (sortSelect.value === "az") matches.sort((first, second) => first.name.localeCompare(second.name));
    if (sortSelect.value === "price-asc") matches.sort((first, second) => first.price - second.price);
    if (sortSelect.value === "price-desc") matches.sort((first, second) => second.price - first.price);
    return matches;
  }

  function syncUrl() {
    const next = new URLSearchParams();
    if (state.category !== "All") next.set("category", state.category);
    if (state.query) next.set("q", state.query);
    if (state.min) next.set("min", state.min);
    if (state.max) next.set("max", state.max);
    if (state.savedOnly) next.set("saved", "1");
    const search = next.toString();
    history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  }

  function render() {
    const matches = filteredProducts();
    const title = state.savedOnly ? "Saved items" : categoryLabel(state.category);
    productGrid.innerHTML = matches.slice(0, state.visible).map(productCard).join("");
    sectionTitle.textContent = `${title}${state.query ? ` matching “${state.query}”` : ""}`;
    breadcrumbCurrent.textContent = title;
    resultCount.textContent = countLabel(matches.length);
    emptyState.hidden = matches.length > 0;
    showAllButton.hidden = state.visible >= matches.length;
    renderCategoryList(categoryList, products, { active: state.savedOnly ? "" : state.category });
    document.title = `${title} | Yunahliam Enterprise`;
    syncUrl();
  }

  function update(changes) {
    Object.assign(state, changes, { visible: pageSize });
    render();
  }

  categoryList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-category]");
    if (!item) return;
    searchCategory.value = item.dataset.category;
    update({ category: item.dataset.category, savedOnly: false });
    productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector(".search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    update({ query: searchInput.value.trim(), category: searchCategory.value, savedOnly: false });
  });
  searchInput.addEventListener("input", () => update({ query: searchInput.value.trim() }));
  searchCategory.addEventListener("change", () => update({ category: searchCategory.value }));
  sortSelect.addEventListener("change", render);
  document.querySelector("#price-form").addEventListener("submit", (event) => {
    event.preventDefault();
    update({ min: Number(priceMin.value) || 0, max: Number(priceMax.value) || 0 });
  });
  document.querySelector("#clear-filters").addEventListener("click", () => {
    priceMin.value = "";
    priceMax.value = "";
    searchInput.value = "";
    searchCategory.value = "All";
    sortSelect.value = "featured";
    update({ category: "All", query: "", min: 0, max: 0, savedOnly: false });
  });
  document.querySelector(".filter-toggle").addEventListener("click", (event) => {
    const isOpen = document.querySelector(".sidebar").classList.toggle("filters-open");
    event.currentTarget.setAttribute("aria-expanded", String(isOpen));
  });
  showAllButton.addEventListener("click", () => {
    state.visible += pageSize;
    render();
  });
  document.addEventListener("saved-change", () => { if (state.savedOnly) render(); });

  productGrid.innerHTML = skeletonCards(8);
  showAllButton.hidden = true;
  loadProducts().then((list) => {
    products = list;
    render();
  }).catch((error) => { productGrid.innerHTML = errorPanel(error.message); });
}

/* ---------- Mobile menu ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }
  });
}

/* ---------- Product page ---------- */
const productDetail = document.querySelector("#product-detail");
if (productDetail) {
  const requestedId = new URLSearchParams(window.location.search).get("id");
  loadProducts().then((products) => {
    const product = products.find((item) => item.slug === requestedId);
    if (!product) {
      productDetail.innerHTML = '<section class="panel detail-not-found"><h1>We could not find that item.</h1><a class="button button-primary" href="shop.html">Back to the shop</a></section>';
      return;
    }
    renderProduct(product, products);
  }).catch((error) => { productDetail.innerHTML = errorPanel(error.message); });

  function buyPanel(product) {
    if (product.purchasable) {
      return `<span class="detail-price-label">PRICE</span><strong>${formatPrice(product)}</strong>
        <small class="detail-price-note">Pay securely with M-Pesa, Airtel Money or card.</small>
        <div class="buy-row">
          <div class="qty-stepper" role="group" aria-label="Quantity"><button type="button" data-qty-step="-1" aria-label="Decrease quantity">−</button><input id="buy-qty" type="number" min="1" max="${maxPerItem}" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-qty-step="1" aria-label="Increase quantity">+</button></div>
          <button class="button button-primary" type="button" id="add-to-cart">Add to cart</button>
        </div>
        <button class="button button-cta button-block cta-pulse" type="button" id="buy-now">Buy now</button>
        <a class="detail-call-link" href="tel:${storePhone.tel}">or call ${storePhone.display} to order</a>`;
    }
    if (!product.inStock) {
      return `<span class="detail-price-label">LAST PRICE</span><strong>${formatPrice(product)}</strong>
        <small class="detail-price-note">This item is out of stock right now. Call us and we will let you know when it is back.</small>${callButton("☎ Call to reserve")}`;
    }
    const label = product.priceFrom ? "STARTING PRICE" : "GUIDE PRICE";
    const note = product.priceFrom ? "Price depends on the configuration you choose." : "Call us to confirm today’s price and stock.";
    return `<span class="detail-price-label">${label}</span><strong>${formatPrice(product)}</strong><small class="detail-price-note">${note}</small>${callButton("☎ Call to order", "cta-pulse")}`;
  }

  function renderProduct(product, products) {
    const id = product.slug;
    const images = product.images;
    const isSaved = saved.has(id);
    const similar = products.filter((item) => item.category === product.category && item !== product).slice(0, 4);
    const specs = [["Brand", product.brand], ["Condition", "Brand New"], ["Type", categoryLabel(product.category)], ["Warranty", "Included"], ...Object.entries(product.specs || {})];
    const description = product.description
      ? product.description.split(/\n{2,}/).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")
      : `<p>${esc(product.name)} from ${esc(product.brand)}, part of our ${esc(categoryLabel(product.category).toLowerCase())} range. Every unit is brand new and comes with warranty. Call or message us for colours, configurations, delivery and after-sales support.</p>`;
    productDetail.innerHTML = `
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>›</span><a href="shop.html?category=${esc(product.category)}">${esc(categoryLabel(product.category))}</a><span>›</span><span>${esc(product.name)}</span></nav>
      <div class="detail-layout">
        <section class="panel detail-main" aria-label="Product details">
          <div class="detail-gallery">
            <div class="detail-image-stage">
              ${images.length > 1 ? '<button class="gallery-arrow gallery-previous" type="button" aria-label="Previous image">‹</button>' : ""}
              <img class="detail-main-image" src="${esc(images[0])}" alt="${esc(product.name)}" fetchpriority="high">
              ${images.length > 1 ? '<button class="gallery-arrow gallery-next" type="button" aria-label="Next image">›</button>' : ""}
              <span class="gallery-count">1 / ${images.length}</span>
            </div>
            ${images.length > 1 ? `<div class="detail-thumbnails" aria-label="Product images">${images.map((image, index) => `<button class="detail-thumbnail${index === 0 ? " selected" : ""}" type="button" data-image-index="${index}" aria-label="View image ${index + 1}"><img src="${esc(image)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
          </div>
          <section class="detail-details">
            <div class="detail-title-row"><h1>${esc(product.name)}</h1><button class="detail-save" type="button" data-save="${esc(id)}" aria-label="Save ${esc(product.name)}" aria-pressed="${isSaved}">${isSaved ? "♥" : "♡"}</button></div>
            <div class="detail-meta"><span>${esc(product.brand)}</span><span>${esc(categoryLabel(product.category))}</span>${product.badge ? `<span class="detail-badge">${esc(product.badge)}</span>` : ""}</div>
            <dl class="detail-specs">${specs.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>
            <div class="detail-description"><h2>Description</h2>${description}</div>
            <div class="detail-share"><span>Follow us</span><a href="https://www.facebook.com/share/1cDpzyPnNR/" target="_blank" rel="noreferrer" aria-label="Yunahliam on Facebook">f</a><a href="https://www.instagram.com/yunahliam.enterprise/" target="_blank" rel="noreferrer" aria-label="Yunahliam on Instagram">◎</a></div>
          </section>
        </section>
        <aside class="detail-sidebar">
          <section class="panel detail-panel detail-price">${buyPanel(product)}<ul class="reassure"><li>Warranty included</li><li>Tax-compliant invoice</li><li>Delivery options available</li></ul></section>
          <section class="panel detail-panel seller-panel">
            <div class="seller-summary"><img class="seller-logo" src="images/logo.png" alt="" width="487" height="240"><div><strong>Questions about this product?</strong><small>Our team can confirm stock, colours and delivery for you.</small></div></div>
            <a class="seller-phone" href="tel:${storePhone.tel}">+254 726 160 460</a>
            <a class="button button-outline button-block" href="contact.html?product=${encodeURIComponent(id)}#enquiry">Send an enquiry</a>
            <a class="seller-location" href="https://maps.google.com/?q=Westlands+Business+Park+Nairobi" target="_blank" rel="noreferrer">⌖ Westlands Business Park, Nairobi</a>
          </section>
        </aside>
      </div>
      ${similar.length ? `<section class="similar-products"><h2>You may also like</h2><div class="product-grid">${similar.map(productCard).join("")}</div></section>` : ""}`;

    const mainImage = productDetail.querySelector(".detail-main-image");
    const thumbnails = [...productDetail.querySelectorAll(".detail-thumbnail")];
    const imageCount = productDetail.querySelector(".gallery-count");
    let activeImage = 0;
    const showImage = (index) => {
      activeImage = (index + images.length) % images.length;
      mainImage.src = images[activeImage];
      imageCount.textContent = `${activeImage + 1} / ${images.length}`;
      thumbnails.forEach((thumbnail, thumbnailIndex) => thumbnail.classList.toggle("selected", thumbnailIndex === activeImage));
    };
    thumbnails.forEach((thumbnail, index) => thumbnail.addEventListener("click", () => showImage(index)));
    productDetail.querySelector(".gallery-previous")?.addEventListener("click", () => showImage(activeImage - 1));
    productDetail.querySelector(".gallery-next")?.addEventListener("click", () => showImage(activeImage + 1));

    const qtyInput = productDetail.querySelector("#buy-qty");
    if (qtyInput) {
      const quantity = () => Math.min(Math.max(Math.round(Number(qtyInput.value)) || 1, 1), maxPerItem);
      productDetail.querySelectorAll("[data-qty-step]").forEach((button) => button.addEventListener("click", () => {
        qtyInput.value = Math.min(Math.max(quantity() + Number(button.dataset.qtyStep), 1), maxPerItem);
      }));
      productDetail.querySelector("#add-to-cart").addEventListener("click", () => {
        addToCart(id, quantity());
        showToast(`Added to your cart. <a href="cart.html">View cart (${cartCount()})</a>`);
      });
      productDetail.querySelector("#buy-now").addEventListener("click", () => {
        addToCart(id, quantity());
        window.location.href = "checkout.html";
      });
    }

    document.title = `${product.name} | Yunahliam Enterprise`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `Buy the ${product.name} brand new with warranty from Yunahliam Enterprise, Nairobi.`);
  }
}

/* ---------- Cart page ---------- */
function cartLines(products) {
  return Object.entries(cart).map(([slug, quantity]) => {
    const product = products.find((item) => item.slug === slug);
    return { slug, quantity, product, available: Boolean(product?.purchasable) };
  });
}

const cartPage = document.querySelector("#cart-page");
if (cartPage) {
  let products = [];
  const render = () => {
    const lines = cartLines(products);
    if (!lines.length) {
      cartPage.innerHTML = `<section class="panel empty-cart"><h1>Your cart is empty</h1><p>Browse the shop and add the devices you like.</p><a class="button button-primary" href="shop.html">Start shopping</a></section>`;
      return;
    }
    const subtotal = lines.filter((line) => line.available).reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const blocked = lines.some((line) => !line.available);
    cartPage.innerHTML = `
      <div class="panel section-head"><h1>Your cart</h1><span class="result-count">${cartCount()} ${cartCount() === 1 ? "item" : "items"}</span></div>
      <div class="cart-layout">
        <section class="panel cart-items" aria-label="Items in your cart">
          ${lines.map((line) => line.product ? `
            <article class="cart-line${line.available ? "" : " unavailable"}">
              <a class="cart-thumb" href="product.html?id=${esc(line.slug)}"><img src="${esc(line.product.images[0])}" alt=""></a>
              <div class="cart-info">
                <a class="cart-name" href="product.html?id=${esc(line.slug)}">${esc(line.product.name)}</a>
                <span class="cart-unit">${formatKsh(line.product.price)} each</span>
                ${line.available ? "" : `<span class="cart-warning">Not available to buy online right now. <a href="tel:${storePhone.tel}">Call us</a> to order it.</span>`}
              </div>
              <div class="qty-stepper" role="group" aria-label="Quantity for ${esc(line.product.name)}"><button type="button" data-cart-step="-1" data-slug="${esc(line.slug)}" aria-label="Decrease">−</button><output>${line.quantity}</output><button type="button" data-cart-step="1" data-slug="${esc(line.slug)}" aria-label="Increase">+</button></div>
              <strong class="cart-line-total">${formatKsh(line.product.price * line.quantity)}</strong>
              <button class="cart-remove" type="button" data-cart-remove="${esc(line.slug)}" aria-label="Remove ${esc(line.product.name)}">×</button>
            </article>` : `
            <article class="cart-line unavailable"><div class="cart-info"><span class="cart-name">An item that is no longer listed</span></div><button class="cart-remove" type="button" data-cart-remove="${esc(line.slug)}" aria-label="Remove item">×</button></article>`).join("")}
        </section>
        <aside class="panel cart-summary">
          <h2>Order summary</h2>
          <dl class="summary-rows"><div><dt>Subtotal</dt><dd>${formatKsh(subtotal)}</dd></div><div><dt>Delivery</dt><dd>Chosen at checkout</dd></div></dl>
          ${blocked ? '<p class="cart-warning">Remove the items marked above to check out, or call us to order them.</p>' : ""}
          <a class="button button-cta button-block${blocked ? " disabled" : ""}" href="checkout.html" ${blocked ? 'aria-disabled="true" tabindex="-1"' : ""}>Proceed to checkout</a>
          <a class="button button-ghost button-block" href="shop.html">Continue shopping</a>
          <ul class="reassure"><li>Pay with M-Pesa, Airtel Money or card</li><li>Warranty on every device</li></ul>
        </aside>
      </div>`;
  };
  cartPage.addEventListener("click", (event) => {
    const step = event.target.closest("[data-cart-step]");
    const remove = event.target.closest("[data-cart-remove]");
    if (step) setCartQuantity(step.dataset.slug, (cart[step.dataset.slug] || 0) + Number(step.dataset.cartStep));
    else if (remove) setCartQuantity(remove.dataset.cartRemove, 0);
    else return;
    render();
  });
  loadProducts().then((list) => { products = list; render(); }).catch((error) => { cartPage.innerHTML = errorPanel(error.message); });
}

/* ---------- Orders kept in this browser ---------- */
const ordersKey = "yunahliam-orders";
function rememberOrder(orderNumber, accessKey) {
  const orders = readStored(ordersKey, []).filter((order) => order.orderNumber !== orderNumber);
  orders.unshift({ orderNumber, accessKey, createdAt: new Date().toISOString() });
  writeStored(ordersKey, orders.slice(0, 20));
}
function orderLink(orderNumber, accessKey) {
  return `order.html?order=${encodeURIComponent(orderNumber)}&key=${encodeURIComponent(accessKey)}`;
}
async function startPayment(orderNumber, accessKey) {
  const { redirectUrl } = await api(`/api/orders/${encodeURIComponent(orderNumber)}/pay`, { method: "POST", body: { key: accessKey } });
  window.location.href = redirectUrl;
}

/* ---------- Checkout page ---------- */
const checkoutPage = document.querySelector("#checkout-page");
if (checkoutPage) {
  const customerKey = "yunahliam-customer";
  Promise.all([loadProducts(), api("/api/delivery-options")]).then(([products, { deliveryOptions }]) => {
    const lines = cartLines(products);
    if (!lines.length) {
      checkoutPage.innerHTML = `<section class="panel empty-cart"><h1>Your cart is empty</h1><a class="button button-primary" href="shop.html">Start shopping</a></section>`;
      return;
    }
    if (lines.some((line) => !line.available)) {
      window.location.replace("cart.html");
      return;
    }
    const customer = readStored(customerKey, {});
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    checkoutPage.innerHTML = `
      <div class="panel section-head"><h1>Checkout</h1><a class="button button-ghost" href="cart.html">Edit cart</a></div>
      <div class="cart-layout">
        <form class="panel checkout-form" id="checkout-form" novalidate>
          <fieldset><legend>Your details</legend>
            <label>Full name<input name="customerName" autocomplete="name" required maxlength="120" value="${esc(customer.customerName)}"></label>
            <div class="form-row">
              <label>Phone number<input name="phone" type="tel" autocomplete="tel" required placeholder="0712 345 678" value="${esc(customer.phone)}"></label>
              <label><span>Email <small>(optional, for your receipt)</small></span><input name="email" type="email" autocomplete="email" maxlength="200" value="${esc(customer.email)}"></label>
            </div>
          </fieldset>
          <fieldset><legend>Delivery</legend>
            <div class="delivery-options">${deliveryOptions.map((option, index) => `
              <label class="delivery-option"><input type="radio" name="deliveryMethod" value="${esc(option.key)}" data-fee="${option.fee}" ${(customer.deliveryMethod ? customer.deliveryMethod === option.key : index === 0) ? "checked" : ""}>
                <span><b>${esc(option.label)}</b><small>${option.fee ? formatKsh(option.fee) : "Free"}</small></span></label>`).join("")}
            </div>
            <label class="address-field">Delivery address<textarea name="deliveryAddress" rows="2" maxlength="500" autocomplete="street-address" placeholder="Building, street, area and town">${esc(customer.deliveryAddress)}</textarea></label>
            <label><span>Order notes <small>(optional)</small></span><textarea name="notes" rows="2" maxlength="1000" placeholder="Colour preference, delivery times…"></textarea></label>
          </fieldset>
          <p class="form-error" id="checkout-error" role="alert" hidden></p>
          <button class="button button-cta button-block" type="submit" id="place-order">Place order &amp; pay</button>
          <p class="checkout-fineprint">You will be taken to Pesapal to pay securely with M-Pesa, Airtel Money or card. We confirm every order by phone before dispatch.</p>
        </form>
        <aside class="panel cart-summary">
          <h2>Order summary</h2>
          <ul class="summary-items">${lines.map((line) => `<li><img src="${esc(line.product.images[0])}" alt=""><span>${esc(line.product.name)} <small>× ${line.quantity}</small></span><b>${formatKsh(line.product.price * line.quantity)}</b></li>`).join("")}</ul>
          <dl class="summary-rows"><div><dt>Subtotal</dt><dd>${formatKsh(subtotal)}</dd></div><div><dt>Delivery</dt><dd id="summary-delivery"></dd></div><div class="summary-total"><dt>Total</dt><dd id="summary-total"></dd></div></dl>
        </aside>
      </div>`;

    const form = checkoutPage.querySelector("#checkout-form");
    const errorBox = checkoutPage.querySelector("#checkout-error");
    const submit = checkoutPage.querySelector("#place-order");
    const addressField = checkoutPage.querySelector(".address-field");
    const updateTotals = () => {
      const selected = form.querySelector('input[name="deliveryMethod"]:checked');
      const fee = Number(selected.dataset.fee);
      checkoutPage.querySelector("#summary-delivery").innerHTML = fee ? formatKsh(fee) : "Free";
      checkoutPage.querySelector("#summary-total").innerHTML = formatKsh(subtotal + fee);
      addressField.hidden = selected.value === "pickup";
    };
    form.addEventListener("change", updateTotals);
    updateTotals();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      errorBox.hidden = true;
      if (!data.customerName.trim() || !data.phone.trim()) {
        errorBox.textContent = "Please enter your name and phone number.";
        errorBox.hidden = false;
        return;
      }
      if (data.deliveryMethod === "pickup") data.deliveryAddress = "";
      else if (!data.deliveryAddress.trim()) {
        errorBox.textContent = "Please enter a delivery address.";
        errorBox.hidden = false;
        return;
      }
      writeStored(customerKey, { customerName: data.customerName, phone: data.phone, email: data.email, deliveryMethod: data.deliveryMethod, deliveryAddress: data.deliveryAddress });
      submit.disabled = true;
      submit.textContent = "Placing your order…";
      let order;
      try {
        order = await api("/api/orders", { method: "POST", body: { ...data, items: lines.map((line) => ({ slug: line.slug, quantity: line.quantity })) } });
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        submit.disabled = false;
        submit.innerHTML = "Place order &amp; pay";
        return;
      }
      rememberOrder(order.orderNumber, order.accessKey);
      clearCart();
      submit.textContent = "Opening secure payment…";
      try {
        await startPayment(order.orderNumber, order.accessKey);
      } catch {
        // The order exists; its page lets the customer retry payment or call us.
        window.location.href = `${orderLink(order.orderNumber, order.accessKey)}&payment=unavailable`;
      }
    });
  }).catch((error) => { checkoutPage.innerHTML = errorPanel(error.message); });
}

/* ---------- Order page ---------- */
const orderPage = document.querySelector("#order-page");
if (orderPage) {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order");
  const accessKey = params.get("key");
  const statusText = {
    pending_payment: ["Awaiting payment", "Complete your payment to confirm this order."],
    paid: ["Payment received", "Thank you! We will call you shortly to arrange delivery or pickup."],
    processing: ["Being prepared", "We are getting your order ready."],
    dispatched: ["On its way", "Your order has left our store."],
    delivered: ["Delivered", "Enjoy your new tech. We are here if you need anything."],
    cancelled: ["Cancelled", "This order was cancelled. Call us if you have questions."]
  };
  const paymentText = { pending: "Waiting for payment", paid: "Paid", failed: "Failed", reversed: "Reversed", amount_mismatch: "Under review" };

  if (!orderNumber || !accessKey) {
    const orders = readStored(ordersKey, []);
    orderPage.innerHTML = `<div class="panel section-head"><h1>Your orders</h1></div>
      ${orders.length ? `<section class="panel order-list">${orders.map((order) => `<a class="order-list-row" href="${orderLink(order.orderNumber, order.accessKey)}"><b>${esc(order.orderNumber)}</b><span>${new Date(order.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}</span><span class="category-chevron">›</span></a>`).join("")}</section>`
        : `<section class="panel empty-cart"><h2>No orders on this device yet</h2><p>Orders you place on this browser appear here. For other orders, call us on <a href="tel:${storePhone.tel}">${storePhone.display}</a>.</p><a class="button button-primary" href="shop.html">Shop now</a></section>`}`;
  } else {
    let polls = 0;
    const returnedFromPayment = params.has("OrderTrackingId") || params.has("cancelled");
    const render = (order, { payError } = {}) => {
      const [title, subtitle] = statusText[order.status] || [order.status, ""];
      const lastPayment = order.payments.at(-1);
      const canPay = order.status === "pending_payment" && order.paymentStatus !== "paid";
      let banner = "";
      if (params.get("payment") === "unavailable" && canPay) banner = `<p class="notice">Your order is saved, but online payment could not start. Try again below or call <a href="tel:${storePhone.tel}">${storePhone.display}</a> to pay.</p>`;
      else if (params.has("cancelled") && canPay) banner = '<p class="notice">Payment was cancelled. You can try again whenever you are ready.</p>';
      else if (canPay && lastPayment?.status === "failed") banner = '<p class="notice notice-error">The last payment attempt did not go through. Please try again.</p>';
      else if (order.paymentStatus === "reversed") banner = `<p class="notice notice-error">This payment was reversed. Please call us on <a href="tel:${storePhone.tel}">${storePhone.display}</a>.</p>`;
      orderPage.innerHTML = `
        <section class="panel order-hero status-${esc(order.status)}">
          <span class="order-status-icon" aria-hidden="true">${order.paymentStatus === "paid" ? "✔" : order.status === "cancelled" ? "✕" : "…"}</span>
          <div><p class="eyebrow">Order ${esc(order.orderNumber)}</p><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
        </section>
        ${banner}
        ${payError ? `<p class="notice notice-error">${esc(payError)}</p>` : ""}
        <div class="cart-layout">
          <section class="panel order-items">
            <h2>Items</h2>
            <ul class="summary-items">${order.items.map((item) => `<li><span>${esc(item.name)} <small>× ${item.quantity}</small></span><b>${formatKsh(item.lineTotal)}</b></li>`).join("")}</ul>
            <dl class="summary-rows"><div><dt>Subtotal</dt><dd>${formatKsh(order.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${order.deliveryFee ? formatKsh(order.deliveryFee) : "Free"}</dd></div><div class="summary-total"><dt>Total</dt><dd>${formatKsh(order.total)}</dd></div></dl>
          </section>
          <aside class="panel cart-summary">
            <h2>Payment</h2>
            ${order.payments.length ? `<ul class="payment-list">${order.payments.map((payment) => `<li><span>${esc(paymentText[payment.status] || payment.status)}${payment.paymentMethod ? ` · ${esc(payment.paymentMethod)}` : ""}</span>${payment.confirmationCode ? `<small>Ref ${esc(payment.confirmationCode)}</small>` : ""}</li>`).join("")}</ul>` : '<p class="product-desc">No payment yet.</p>'}
            ${canPay ? '<button class="button button-cta button-block" type="button" id="pay-now">Pay now</button>' : ""}
            ${canPay && lastPayment?.status === "pending" ? '<button class="button button-ghost button-block" type="button" id="check-payment">I have paid, check again</button>' : ""}
            <a class="button button-outline button-block" href="tel:${storePhone.tel}">☎ Call ${storePhone.display}</a>
            <p class="checkout-fineprint">Keep this page’s link to check your order later. Your order number is <b>${esc(order.orderNumber)}</b>.</p>
          </aside>
        </div>`;
      orderPage.querySelector("#pay-now")?.addEventListener("click", async (event) => {
        event.currentTarget.disabled = true;
        event.currentTarget.textContent = "Opening secure payment…";
        try { await startPayment(orderNumber, accessKey); } catch (error) { render(order, { payError: error.message }); }
      });
      orderPage.querySelector("#check-payment")?.addEventListener("click", () => refresh(true));
    };
    const refresh = async (verify) => {
      try {
        const { order } = verify
          ? await api(`/api/orders/${encodeURIComponent(orderNumber)}/pay/verify`, { method: "POST", body: { key: accessKey } })
          : await api(`/api/orders/${encodeURIComponent(orderNumber)}?key=${encodeURIComponent(accessKey)}`);
        rememberOrder(orderNumber, accessKey);
        render(order);
        document.title = `Order ${order.orderNumber} | Yunahliam Enterprise`;
        // Right after paying, the result can take a few seconds to arrive from Pesapal.
        const waiting = order.status === "pending_payment" && order.payments.at(-1)?.status === "pending";
        if (returnedFromPayment && !params.has("cancelled") && waiting && polls < 10) {
          polls += 1;
          setTimeout(() => refresh(true), 4000);
        }
      } catch (error) {
        orderPage.innerHTML = error.status === 404
          ? `<section class="panel empty-cart"><h1>Order not found</h1><p>Check the link, or call us on <a href="tel:${storePhone.tel}">${storePhone.display}</a> with your order number.</p></section>`
          : errorPanel(error.message);
      }
    };
    refresh(returnedFromPayment);
  }
}

/* ---------- Contact page: enquiry form ---------- */
const enquiryForm = document.querySelector("#enquiry-form");
if (enquiryForm) {
  const productSlug = new URLSearchParams(window.location.search).get("product");
  const status = enquiryForm.querySelector(".form-status");
  if (productSlug) {
    loadProducts().then((products) => {
      const product = products.find((item) => item.slug === productSlug);
      if (!product) return;
      enquiryForm.elements.productSlug.value = product.slug;
      enquiryForm.elements.message.value ||= `Hi, I am interested in the ${product.name}. Is it available, and what is the current price?`;
      enquiryForm.querySelector(".enquiry-product").textContent = `About: ${product.name}`;
    }).catch(() => {});
  }
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = enquiryForm.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(enquiryForm));
    if (!data.productSlug) delete data.productSlug;
    button.disabled = true;
    status.hidden = true;
    try {
      await api("/api/enquiries", { method: "POST", body: data });
      enquiryForm.reset();
      enquiryForm.querySelector(".enquiry-product").textContent = "";
      status.className = "form-status notice";
      status.textContent = "Thank you! Your message has reached our team. We usually reply within working hours the same day.";
    } catch (error) {
      status.className = "form-status notice notice-error";
      status.textContent = error.message;
    }
    status.hidden = false;
    button.disabled = false;
  });
}

/* ---------- Footer: back to top + current year ---------- */
document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
const backToTop = document.querySelector(".back-to-top");
if (backToTop) {
  const toggleBackToTop = () => backToTop.classList.toggle("show", window.scrollY > 400);
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();
}
