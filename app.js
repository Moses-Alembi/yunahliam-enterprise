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

const productGrid = document.querySelector("#product-grid");
function productId(product) {
  return product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const priceFormatter = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
function formatPrice(product) {
  return `${product.priceFrom ? "From " : ""}KSh ${priceFormatter.format(product.price)}`;
}

if (productGrid) {
const searchInput = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#sort-products");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const showAllButton = document.querySelector("#show-all");
const inquiryDialog = document.querySelector("#inquiry-dialog");
const inquiryProduct = document.querySelector("#inquiry-product");
const pageSize = 8;
let visibleCount = pageSize;
let query = "";
const requestedCategory = new URLSearchParams(window.location.search).get("category");
if ([...categoryFilter.options].some((option) => option.value === requestedCategory)) {
  categoryFilter.value = requestedCategory;
}

function filteredProducts() {
  const category = categoryFilter.value;
  const search = query.trim().toLowerCase();
  const matches = products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesSearch = !search || `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
  if (sortSelect.value === "az") matches.sort((first, second) => first.name.localeCompare(second.name));
  if (sortSelect.value === "price-asc") matches.sort((first, second) => first.price - second.price);
  if (sortSelect.value === "price-desc") matches.sort((first, second) => second.price - first.price);
  return matches;
}

function renderProducts() {
  const matches = filteredProducts();
  const shown = matches.slice(0, visibleCount);
  productGrid.innerHTML = shown.map((product, index) => `
    <article class="product-card" style="animation-delay:${Math.min(index * 35, 210)}ms">
      <div class="product-photo"><span class="product-badge">${product.badge}</span><a class="product-view-link" href="product.html?id=${productId(product)}" aria-label="View ${product.name} details"><img src="${product.image}" alt="${product.name}" loading="lazy"></a></div>
      <div class="product-info">
        <div class="product-meta"><span>${product.brand}</span><span>${product.category}</span></div>
        <h3><a href="product.html?id=${productId(product)}">${product.name}</a></h3>
        <div class="product-price-row"><strong>${formatPrice(product)}</strong><small>${product.priceSource === "provided" ? "PROVIDED PRICE" : product.priceFrom ? "FROM" : "SUGGESTED"}</small></div>
        <div class="product-actions"><button class="inquire-button" type="button" data-inquire="${product.name}" aria-label="Ask about ${product.name}">Ask about <span aria-hidden="true">↗</span></button><button class="save-button" type="button" aria-label="Save ${product.name}" aria-pressed="false">♡</button></div>
      </div>
    </article>`).join("");
  resultCount.textContent = `${matches.length} ${matches.length === 1 ? "item" : "items"}${query ? ` matching “${query}”` : ""}`;
  emptyState.hidden = matches.length > 0;
  if (showAllButton) showAllButton.hidden = matches.length <= pageSize || visibleCount >= matches.length;
}

function chooseCategory(category) {
  categoryFilter.value = category;
  query = "";
  searchInput.value = "";
  visibleCount = pageSize;
  renderProducts();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
}

searchInput.addEventListener("input", () => {
  query = searchInput.value;
  visibleCount = pageSize;
  renderProducts();
});
document.querySelector(".search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  query = searchInput.value;
  visibleCount = pageSize;
  renderProducts();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelectorAll("[data-search]").forEach((button) => button.addEventListener("click", () => {
  searchInput.value = button.dataset.search;
  query = button.dataset.search;
  categoryFilter.value = "All";
  visibleCount = pageSize;
  renderProducts();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
}));
categoryFilter.addEventListener("change", () => { visibleCount = pageSize; renderProducts(); });
sortSelect.addEventListener("change", renderProducts);
document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => chooseCategory(button.dataset.category)));
if (showAllButton) {
  showAllButton.addEventListener("click", () => {
    visibleCount = filteredProducts().length;
    renderProducts();
  });
}
productGrid.addEventListener("click", (event) => {
  const inquireButton = event.target.closest("[data-inquire]");
  if (inquireButton) {
    inquiryProduct.textContent = inquireButton.dataset.inquire;
    inquiryDialog.showModal();
    return;
  }
  const saveButton = event.target.closest(".save-button");
  if (saveButton) {
    const saved = saveButton.getAttribute("aria-pressed") === "true";
    saveButton.setAttribute("aria-pressed", String(!saved));
    saveButton.textContent = saved ? "♡" : "♥";
  }
});
document.querySelector(".dialog-close").addEventListener("click", () => inquiryDialog.close());
inquiryDialog.addEventListener("click", (event) => {
  if (event.target === inquiryDialog) inquiryDialog.close();
});

renderProducts();
}

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

const productDetail = document.querySelector("#product-detail");
if (productDetail) {
  const requestedId = new URLSearchParams(window.location.search).get("id");
  const product = products.find((item) => productId(item) === requestedId);
  if (!product) {
    productDetail.innerHTML = '<section class="listing-not-found"><h1>We could not find that item.</h1><a class="button button-dark" href="shop.html">Back to the shop <span aria-hidden="true">↗</span></a></section>';
  } else {
    const images = product.images || [product.image];
    productDetail.innerHTML = `
      <div class="listing-layout">
        <section class="listing-main" aria-label="Product listing">
          <div class="listing-gallery">
            <div class="listing-image-stage">
              <button class="gallery-arrow gallery-previous" type="button" aria-label="Previous image">‹</button>
              <img class="listing-main-image" src="${images[0]}" alt="${product.name}" fetchpriority="high">
              <button class="gallery-arrow gallery-next" type="button" aria-label="Next image">›</button>
              <span class="gallery-count">1 / ${images.length}</span>
            </div>
            <div class="listing-thumbnails" aria-label="Product images">${images.map((image, index) => `<button class="listing-thumbnail${index === 0 ? " selected" : ""}" type="button" data-image-index="${index}" aria-label="View image ${index + 1}"><img src="${image}" alt=""></button>`).join("")}</div>
          </div>
          <section class="listing-details">
            <div class="listing-title-row"><h1>${product.name}</h1><button class="listing-save" type="button" aria-label="Save ${product.name}" aria-pressed="false">♡</button></div>
            <div class="listing-meta"><span>Yunahliam Enterprise</span><span>Nairobi, Kenya</span><span>Warranty-backed</span></div>
            <dl class="listing-specs"><div><dt>Brand</dt><dd>${product.brand}</dd></div><div><dt>Type</dt><dd>${product.category}</dd></div><div><dt>Availability</dt><dd>Contact us to confirm</dd></div><div><dt>Warranty</dt><dd>Warranty-backed</dd></div></dl>
            <div class="listing-description"><h2>Product description</h2><p>${product.name} from ${product.brand}, listed in our ${product.category.toLowerCase()} collection. Contact Yunahliam Enterprise to confirm current pricing, stock and available configurations. Our team can also help with product-specific warranty details, delivery and after-sales support.</p></div>
            <div class="listing-share"><span>Share this listing</span><a href="https://www.facebook.com/share/1cDpzyPnNR/" target="_blank" rel="noreferrer" aria-label="Share with Yunahliam on Facebook">f</a><a href="https://www.instagram.com/yunahliam.enterprise/" target="_blank" rel="noreferrer" aria-label="Visit Yunahliam on Instagram">◎</a></div>
          </section>
        </section>
        <aside class="listing-sidebar">
          <section class="listing-panel listing-price"><span class="listing-price-label">${product.priceSource === "provided" ? "PRICE FROM YOUR LIST" : product.priceFrom ? "STARTING PRICE" : "SUGGESTED PRICE"}</span><strong>${formatPrice(product)}</strong><small class="listing-price-note">${product.priceSource === "provided" ? "Please confirm this price is current." : "Estimate; confirm model, storage and stock."}</small><a class="listing-outline-button" href="tel:+254726160460">Confirm price & availability</a></section>
          <section class="listing-panel seller-panel"><div class="seller-summary"><span class="seller-avatar">Y</span><div><strong>Yunahliam Enterprise</strong><small>10 years in technology</small><small>Warranty & after-sales support</small></div></div><button class="listing-call-button" type="button" data-reveal-contact>☎ <span>Show contact</span></button><a class="listing-outline-button" href="contact.html">Send an enquiry</a><a class="seller-location" href="https://maps.google.com/?q=Westlands+Business+Park+Nairobi" target="_blank" rel="noreferrer">⌖ Westlands Business Park, Nairobi</a><div class="seller-phone" hidden><a href="tel:+254726160460">+254 726 160 460</a></div></section>
          <section class="listing-panel safety-panel"><h2>Safe buying tips</h2><ul><li>Avoid paying in advance before receiving the item.</li><li>Meet in a safe public place when collecting in person.</li><li>Check the exact model and condition before you buy.</li><li>Inspect the item and included accessories.</li><li>Pay only when you are satisfied.</li></ul></section>
        </aside>
      </div>`;

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
    productDetail.querySelector(".gallery-previous").addEventListener("click", () => showImage(activeImage - 1));
    productDetail.querySelector(".gallery-next").addEventListener("click", () => showImage(activeImage + 1));
    productDetail.querySelector("[data-reveal-contact]").addEventListener("click", (event) => {
      const phone = productDetail.querySelector(".seller-phone");
      phone.hidden = !phone.hidden;
      event.currentTarget.querySelector("span").textContent = phone.hidden ? "Show contact" : "Hide contact";
    });
    const saveButton = productDetail.querySelector(".listing-save");
    saveButton.addEventListener("click", () => {
      const saved = saveButton.getAttribute("aria-pressed") === "true";
      saveButton.setAttribute("aria-pressed", String(!saved));
      saveButton.textContent = saved ? "♡" : "♥";
    });
    document.title = `${product.name} | Yunahliam Enterprise`;
  }
}