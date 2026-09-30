const products = [
  { name: "iPhone 17", category: "Phones", brand: "Apple", image: "APPLE 17-01.png", images: ["APPLE 17-01.png", "APPLE 17-02.png"], price: 149000, badge: "NEW IN" },
  { name: "Samsung Galaxy S26", category: "Phones", brand: "Samsung", image: "S26-01.png", images: ["S26-01.png", "S26-02.png", "S26-03.png"], price: 129000, badge: "JUST LANDED" },
  { name: "Samsung Galaxy A06 4/64GB", category: "Phones", brand: "Samsung", image: "A06-01.png", images: ["A06-01.png", "A06-02.png"], price: 15400, priceSource: "provided", badge: "VALUE PICK" },
  { name: "Samsung Galaxy A27 5G 6/128GB", category: "Phones", brand: "Samsung", image: "A27-01.png", images: ["A27-01.png", "A27-02.png", "A27-03.png", "A27-04.png"], price: 40300, priceSource: "provided", badge: "PRICE PROVIDED" },
  { name: "MacBook Air 13 M5", category: "Computers", brand: "Apple", image: "APPLE MACBOOK AIR 13 M5-01.png", images: ["APPLE MACBOOK AIR 13 M5-01.png", "APPLE MACBOOK AIR 13 M5-02.png", "APPLE MACBOOK AIR 13 M5-03.png", "APPLE MACBOOK AIR 13 M5-04.png"], price: 199000, badge: "TOP PICK" },
  { name: "Bose QuietComfort Ultra", category: "Audio", brand: "Bose", image: "BOSE QUIETCOMFORT ULTRA HEADPHONES 2ND GEN-01.png", images: ["BOSE QUIETCOMFORT ULTRA HEADPHONES 2ND GEN-01.png", "BOSE QUIETCOMFORT ULTRA HEADPHONES 2ND GEN-02.png", "BOSE QUIETCOMFORT ULTRA HEADPHONES 2ND GEN-03.png"], price: 72000, badge: "FAN FAVOURITE" },
  { name: "EcoFlow Delta 3", category: "Power", brand: "EcoFlow", image: "ECOFLOW DELTA 3 2000AIR-01.png", images: ["ECOFLOW DELTA 3 2000AIR-01.png", "ECOFLOW DELTA 3 2000AIR-02.png", "ECOFLOW DELTA 3 2000AIR-03.png", "ECOFLOW DELTA 3 2000AIR-04.png"], price: 249000, badge: "READY WHEN YOU ARE" },
  { name: "PlayStation 5 Slim", category: "Gaming", brand: "Sony", image: "Sony PlayStation 5 (PS5) Slim-01.png", images: ["Sony PlayStation 5 (PS5) Slim-01.png", "Sony PlayStation 5 (PS5) Slim-02.png"], price: 74900, badge: "GAME ON" },
  { name: "iPad Air 11 M4", category: "Computers", brand: "Apple", image: "APPLE IPAD AIR 11 M4-01.png", images: ["APPLE IPAD AIR 11 M4-01.png", "APPLE IPAD AIR 11 M4-02.png", "APPLE IPAD AIR 11 M4-03.png"], price: 104000, badge: "NEW IN" },
  { name: "JBL PartyBox 520", category: "Audio", brand: "JBL", image: "JBL PartyBox 520-01.png", images: ["JBL PartyBox 520-01.png", "JBL PartyBox 520-02.png", "JBL PartyBox 520-03.png", "JBL PartyBox 520-04.png"], price: 125000, badge: "BRING THE SOUND" },
  { name: "Samsung Galaxy Z Fold8 Ultra", category: "Phones", brand: "Samsung", image: "GALAXY Z-FOLD8 ULTRA-01.png", price: 359000, badge: "BIG IDEAS" },
  { name: "Apple AirPods Max 2", category: "Audio", brand: "Apple", image: "Apple AirPods Max 2-01.png", price: 89000, badge: "LISTEN IN" },
  { name: "Galaxy Watch Ultra 2025", category: "Wearables", brand: "Samsung", image: "WATCH ULTRA 47MM LTE 2025-01.png", price: 82900, badge: "GO FURTHER" },
  { name: "UGREEN Everyday Accessories", category: "Accessories", brand: "UGREEN", image: "UGREEN ACCESSORIES A-01.png", price: 1500, priceFrom: true, badge: "LITTLE UPGRADES" },
  { name: "MacBook Neo 13", category: "Computers", brand: "Apple", image: "Apple MacBook Neo 13-01.png", price: 89900, badge: "NEW IN" },
  { name: "EcoFlow River 3 Plus", category: "Power", brand: "EcoFlow", image: "ECOFLOW RIVER 3 PLUS-01.png", price: 69900, badge: "POWER ON THE GO" },
  { name: "Nintendo Switch 2", category: "Gaming", brand: "Nintendo", image: "Nintendo Switch 2.jpg", price: 74900, badge: "PLAY ANYWHERE" },
  { name: "Bose SoundLink Flex", category: "Audio", brand: "Bose", image: "BOSE SOUNDLINK FLEX 2nd gen-01.png", price: 27900, badge: "TAKE IT OUTSIDE" },
  { name: "Samsung Galaxy Tab A11 4/64GB", category: "Computers", brand: "Samsung", image: "Galaxy Tab A11.png", price: 21100, priceSource: "provided", badge: "PRICE PROVIDED" },
  { name: "JBL PartyBox On-The-Go 2", category: "Audio", brand: "JBL", image: "JBL PartyBox On-The-Go 2-01.png", price: 84900, badge: "GOOD TIMES" },
  { name: "Samsung Galaxy Z Flip8", category: "Phones", brand: "Samsung", image: "SAMSUNG GALAXY Z FLIP8-01.png", price: 179000, badge: "FOLD INTO FUN" },
  { name: "EcoFlow Delta Pro 3", category: "Power", brand: "EcoFlow", image: "ECOFLOW DELTA PRO 3-01.png", price: 579000, badge: "POWER MORE" },
  { name: "Bose QuietComfort Ultra Earbuds", category: "Audio", brand: "Bose", image: "BOSE QUIETCOMFORT ULTRA EARBUDS 2ND GEN-01.png", price: 47900, badge: "TUNE EVERYTHING OUT" },
  { name: "Apple iPad Pro 13 M5", category: "Computers", brand: "Apple", image: "APPLE IPAD PRO 13 M5-01.png", price: 249000, badge: "PRO ALL DAY" },
  { name: "Galaxy Watch 8 Classic", category: "Wearables", brand: "Samsung", image: "WATCH 8CLASSIC 46MM-01.png", price: 58900, badge: "MADE FOR YOU" },
  { name: "Promate Everyday Accessories", category: "Accessories", brand: "Promate", image: "Promate products-01.png", price: 1000, priceFrom: true, badge: "SMART EXTRAS" }
];

const categories = [
  { key: "Phones", label: "Phones" },
  { key: "Computers", label: "Computers & Tablets" },
  { key: "Audio", label: "Audio & Speakers" },
  { key: "Power", label: "Power Stations" },
  { key: "Gaming", label: "Gaming" },
  { key: "Wearables", label: "Smart Watches" },
  { key: "Accessories", label: "Accessories" }
];
const storeLocation = "Westlands, Nairobi";

function productId(product) {
  return product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const priceFormatter = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
function formatPrice(product) {
  return `${product.priceFrom ? "From " : ""}KSh ${priceFormatter.format(product.price)}`;
}
function categoryLabel(key) {
  const category = categories.find((item) => item.key === key);
  return category ? category.label : "All products";
}
function categoryImage(key) {
  const product = products.find((item) => item.category === key);
  return product ? product.image : "";
}
function countLabel(count) {
  return `${count} ${count === 1 ? "ad" : "ads"}`;
}

/* ---------- Saved items (per browser) ---------- */
const savedKey = "yunahliam-saved";
const saved = (() => {
  try { return new Set(JSON.parse(localStorage.getItem(savedKey)) || []); } catch { return new Set(); }
})();
function updateSavedCount() {
  document.querySelectorAll(".saved-count").forEach((badge) => { badge.textContent = saved.size || ""; });
}
function toggleSaved(id) {
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  try { localStorage.setItem(savedKey, JSON.stringify([...saved])); } catch { /* storage unavailable */ }
  updateSavedCount();
  return saved.has(id);
}
updateSavedCount();

/* ---------- Shared markup ---------- */
function adCard(product, index = 0) {
  const id = productId(product);
  const isSaved = saved.has(id);
  const photoCount = (product.images || [product.image]).length;
  return `
    <article class="ad-card" style="animation-delay:${Math.min(index * 30, 240)}ms">
      <a class="ad-photo" href="product.html?id=${id}" aria-label="View ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="ad-tag">${product.badge}</span>
        <span class="ad-count">${photoCount} ${photoCount === 1 ? "photo" : "photos"}</span>
      </a>
      <button class="ad-save" type="button" data-save="${id}" aria-label="Save ${product.name}" aria-pressed="${isSaved}">${isSaved ? "♥" : "♡"}</button>
      <div class="ad-body">
        <strong class="ad-price">${formatPrice(product)}</strong>
        <h3 class="ad-title"><a href="product.html?id=${id}">${product.name}</a></h3>
        <p class="ad-desc">${product.brand} · ${categoryLabel(product.category)}</p>
        <div class="ad-chips"><span class="chip">Brand New</span><span class="chip chip-green">Warranty</span></div>
        <span class="ad-loc">⌖ ${storeLocation}</span>
      </div>
    </article>`;
}

function renderCategoryList(list, { active = "All", asLinks = false } = {}) {
  const rows = [{ key: "All", label: "All products", count: products.length }]
    .concat(categories.map((category) => ({ ...category, count: products.filter((product) => product.category === category.key).length })));
  list.innerHTML = rows.map((row) => {
    const thumb = row.key === "All"
      ? '<span class="category-thumb all" aria-hidden="true">★</span>'
      : `<span class="category-thumb"><img src="${categoryImage(row.key)}" alt="" loading="lazy"></span>`;
    const inner = `${thumb}<span><span class="category-name">${row.label}</span><span class="category-count">${countLabel(row.count)}</span></span><span class="category-chevron" aria-hidden="true">›</span>`;
    const activeClass = row.key === active ? " active" : "";
    return asLinks
      ? `<li><a class="category-item${activeClass}" href="shop.html${row.key === "All" ? "" : `?category=${row.key}`}">${inner}</a></li>`
      : `<li><button class="category-item${activeClass}" type="button" data-category="${row.key}" aria-pressed="${row.key === active}">${inner}</button></li>`;
  }).join("");
}

document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  if (!saveButton) return;
  const isSaved = toggleSaved(saveButton.dataset.save);
  saveButton.setAttribute("aria-pressed", String(isSaved));
  saveButton.textContent = isSaved ? "♥" : "♡";
  document.dispatchEvent(new CustomEvent("saved-change"));
});

/* ---------- Home page: trending ads ---------- */
const trendingGrid = document.querySelector("#trending-grid");
if (trendingGrid) {
  renderCategoryList(document.querySelector("#category-list"), { asLinks: true });
  trendingGrid.innerHTML = products.slice(0, 12).map(adCard).join("");
}

/* ---------- Shop page: filters and listing ---------- */
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
  const listingTitle = document.querySelector("#listing-title");
  const breadcrumbCurrent = document.querySelector("#breadcrumb-current");
  const emptyState = document.querySelector("#empty-state");
  const showAllButton = document.querySelector("#show-all");
  const pageSize = 12;

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
      (!state.savedOnly || saved.has(productId(product))));
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
    const title = state.savedOnly ? "Saved ads" : categoryLabel(state.category);
    productGrid.innerHTML = matches.slice(0, state.visible).map(adCard).join("");
    listingTitle.textContent = `${title}${state.query ? ` matching “${state.query}”` : ""}`;
    breadcrumbCurrent.textContent = title;
    resultCount.textContent = countLabel(matches.length);
    emptyState.hidden = matches.length > 0;
    showAllButton.hidden = state.visible >= matches.length;
    renderCategoryList(categoryList, { active: state.savedOnly ? "" : state.category });
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

  render();
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
  const product = products.find((item) => productId(item) === requestedId);
  if (!product) {
    productDetail.innerHTML = '<section class="panel listing-not-found"><h1>We could not find that item.</h1><a class="button button-green" href="shop.html">Back to all ads</a></section>';
  } else {
    const id = productId(product);
    const images = product.images || [product.image];
    const isSaved = saved.has(id);
    const similar = products.filter((item) => item.category === product.category && item !== product).slice(0, 4);
    const priceLabel = product.priceSource === "provided" ? "PRICE" : product.priceFrom ? "STARTING PRICE" : "SUGGESTED PRICE";
    const priceNote = product.priceSource === "provided" ? "Please confirm this price is current." : "Estimate; confirm model, storage and stock.";
    productDetail.innerHTML = `
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>›</span><a href="shop.html?category=${product.category}">${categoryLabel(product.category)}</a><span>›</span><span>${product.name}</span></nav>
      <div class="listing-layout">
        <section class="panel listing-main" aria-label="Product listing">
          <div class="listing-gallery">
            <div class="listing-image-stage">
              ${images.length > 1 ? '<button class="gallery-arrow gallery-previous" type="button" aria-label="Previous image">‹</button>' : ""}
              <img class="listing-main-image" src="${images[0]}" alt="${product.name}" fetchpriority="high">
              ${images.length > 1 ? '<button class="gallery-arrow gallery-next" type="button" aria-label="Next image">›</button>' : ""}
              <span class="gallery-count">1 / ${images.length}</span>
            </div>
            ${images.length > 1 ? `<div class="listing-thumbnails" aria-label="Product images">${images.map((image, index) => `<button class="listing-thumbnail${index === 0 ? " selected" : ""}" type="button" data-image-index="${index}" aria-label="View image ${index + 1}"><img src="${image}" alt=""></button>`).join("")}</div>` : ""}
          </div>
          <section class="listing-details">
            <div class="listing-title-row"><h1>${product.name}</h1><button class="listing-save" type="button" data-save="${id}" aria-label="Save ${product.name}" aria-pressed="${isSaved}">${isSaved ? "♥" : "♡"}</button></div>
            <div class="listing-meta"><span>⌖ ${storeLocation}</span><span class="verified">✔ Verified seller</span><span>${product.badge}</span></div>
            <dl class="listing-specs"><div><dt>Brand</dt><dd>${product.brand}</dd></div><div><dt>Condition</dt><dd>Brand New</dd></div><div><dt>Type</dt><dd>${categoryLabel(product.category)}</dd></div><div><dt>Warranty</dt><dd>Included</dd></div></dl>
            <div class="listing-description"><h2>Description</h2><p>${product.name} from ${product.brand}, listed in our ${categoryLabel(product.category).toLowerCase()} collection. Contact Yunahliam Enterprise to confirm current pricing, stock and available configurations. Our team can also help with product-specific warranty details, delivery and after-sales support.</p></div>
            <div class="listing-share"><span>Share this ad</span><a href="https://www.facebook.com/share/1cDpzyPnNR/" target="_blank" rel="noreferrer" aria-label="Yunahliam on Facebook">f</a><a href="https://www.instagram.com/yunahliam.enterprise/" target="_blank" rel="noreferrer" aria-label="Yunahliam on Instagram">◎</a></div>
          </section>
        </section>
        <aside class="listing-sidebar">
          <section class="panel listing-panel listing-price"><span class="listing-price-label">${priceLabel}</span><strong>${formatPrice(product)}</strong><small class="listing-price-note">${priceNote}</small><a class="button button-outline button-block" href="tel:+254726160460">Request call back</a></section>
          <section class="panel listing-panel seller-panel">
            <div class="seller-summary"><span class="seller-avatar">Y</span><div><strong>Yunahliam Enterprise</strong><small>10 years in technology</small><small class="verified">✔ Verified seller</small></div></div>
            <div class="seller-phone" hidden><a href="tel:+254726160460">+254 726 160 460</a></div>
            <button class="button button-green button-block" type="button" data-reveal-contact>☎ <span>Show contact</span></button>
            <a class="button button-outline button-block" href="contact.html">Send an enquiry</a>
            <a class="seller-location" href="https://maps.google.com/?q=Westlands+Business+Park+Nairobi" target="_blank" rel="noreferrer">⌖ Westlands Business Park, Nairobi</a>
          </section>
          <section class="panel listing-panel safety-panel"><h2>Safety tips</h2><ul><li>Avoid paying in advance before receiving the item.</li><li>Meet in a safe public place when collecting in person.</li><li>Check the exact model and condition before you buy.</li><li>Inspect the item and included accessories.</li><li>Pay only when you are satisfied.</li></ul></section>
        </aside>
      </div>
      ${similar.length ? `<section class="similar-ads"><h2>Similar adverts</h2><div class="product-grid">${similar.map(adCard).join("")}</div></section>` : ""}`;

    const mainImage = productDetail.querySelector(".listing-main-image");
    const thumbnails = [...productDetail.querySelectorAll(".listing-thumbnail")];
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
    productDetail.querySelector("[data-reveal-contact]").addEventListener("click", (event) => {
      const phone = productDetail.querySelector(".seller-phone");
      phone.hidden = !phone.hidden;
      event.currentTarget.querySelector("span").textContent = phone.hidden ? "Show contact" : "Hide contact";
    });
    document.title = `${product.name} | Yunahliam Enterprise`;
  }
}
