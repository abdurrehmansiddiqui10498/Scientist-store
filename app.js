const HOME_HERO_IMAGE = "assets/home-hero.jpg";
const OLD_HOME_HERO_IMAGES = ["assets/20260527_203220.jpeg"];

const IMAGE_OPTIONS = [
  { label: "Home hero", src: HOME_HERO_IMAGE },
  { label: "Science banner", src: "assets/20260527_203220.jpeg" },
  { label: "Technology lab", src: "assets/20260527_203234.jpeg" },
  { label: "Home statement", src: "assets/20260527_203251.jpeg" },
  { label: "Catalog reference", src: "assets/20260527_203301.jpeg" },
  { label: "Product footer", src: "assets/20260527_203308.jpeg" },
  { label: "Contact reference", src: "assets/20260527_203316.jpeg" }
];

const ACCENT_OPTIONS = ["#2458d4", "#23775b", "#c87a1d", "#4a365e", "#b23838"];

const ADMIN_ACCOUNTS = [
  { name: "Store Admin", email: "admin@bubloo.test", password: "Science@2026" },
  { name: "Bubloo Owner", email: "owner@bubloo.test", password: "Bubloo@2026" }
];

const OWNER_CONTACT = {
  email: "bublooscientist2023@gmail.com",
  phone: "+923378324258"
};

const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${OWNER_CONTACT.email}`;

const DEFAULT_SETTINGS = {
  storeName: "Bubloo Scientist's Store",
  heroTitle: "Unlock your potential in Science",
  heroBody: "Browse focused products for students, creators, and technology-minded builders.",
  heroImage: HOME_HERO_IMAGE,
  notice: "After a buyer registers an order, the admin will contact them soon. Stay alerted.",
  accent: "#2458d4"
};

const DEFAULT_PRODUCTS = [
  {
    id: "product-online-database",
    name: "Online database",
    category: "Digital system",
    price: 50000,
    compareAt: 70000,
    stock: 9,
    image: "assets/20260527_203301.jpeg",
    description: "A clean online database setup for storing company details, student records, and project data.",
    featured: true
  },
  {
    id: "product-science-launch",
    name: "Science launch kit",
    category: "Learning kit",
    price: 15000,
    compareAt: 19000,
    stock: 15,
    image: "assets/20260527_203220.jpeg",
    description: "A science-themed starter kit with visuals, planning templates, and guided project structure.",
    featured: true
  },
  {
    id: "product-tech-growth",
    name: "Technology growth session",
    category: "Consulting",
    price: 24000,
    compareAt: 0,
    stock: 6,
    image: "assets/20260527_203234.jpeg",
    description: "A focused strategy session for improving a technology store, catalog, or project workflow.",
    featured: false
  }
];

const KEYS = {
  settings: "bubloo.settings",
  products: "bubloo.products",
  users: "bubloo.users",
  orders: "bubloo.orders",
  cart: "bubloo.cart",
  session: "bubloo.session"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : structuredClone(fallback);
    } catch {
      return structuredClone(fallback);
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let settings = store.get(KEYS.settings, DEFAULT_SETTINGS);
if (OLD_HOME_HERO_IMAGES.includes(settings.heroImage)) {
  settings.heroImage = HOME_HERO_IMAGE;
  store.set(KEYS.settings, settings);
}
let products = store.get(KEYS.products, DEFAULT_PRODUCTS);
let users = store.get(KEYS.users, []);
let orders = store.get(KEYS.orders, []);
let cart = store.get(KEYS.cart, []);
let session = store.get(KEYS.session, null);
let authRole = "user";
let authMode = "signin";
let catalogView = "grid";
let pendingBuyId = null;
let pendingCheckout = false;
let toastTimer = 0;
let productPreviewObjectUrl = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function openDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
  }
}

function closeDialog(dialog) {
  if (dialog.open) {
    dialog.close();
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function saveProducts() {
  store.set(KEYS.products, products);
}

function saveSettings() {
  store.set(KEYS.settings, settings);
}

function saveUsers() {
  store.set(KEYS.users, users);
}

function saveOrders() {
  store.set(KEYS.orders, orders);
}

function saveCart() {
  store.set(KEYS.cart, cart);
}

function saveSession() {
  if (session) {
    store.set(KEYS.session, session);
  } else {
    localStorage.removeItem(KEYS.session);
  }
}

function renderSettings() {
  document.documentElement.style.setProperty("--accent", settings.accent);
  document.documentElement.style.setProperty("--accent-strong", darkenAccent(settings.accent));
  document.documentElement.style.setProperty("--accent-soft", softenAccent(settings.accent));
  $("#brandName").textContent = settings.storeName;
  $("#footerBrand").textContent = settings.storeName;
  $("#heroTitle").textContent = settings.heroTitle;
  $("#heroBody").textContent = settings.heroBody;
  $("#heroImage").src = settings.heroImage;
  $("#heroImage").alt = `${settings.storeName} hero image`;
  $("#storeNotice").textContent = settings.notice;
  document.title = settings.storeName;
}

function darkenAccent(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(Math.max(0, r - 34), Math.max(0, g - 34), Math.max(0, b - 34));
}

function softenAccent(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}

function hexToRgb(hex) {
  const safe = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_SETTINGS.accent;
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16)
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function renderSession() {
  const profileInitial = $("#profileInitial");
  if (!session) {
    profileInitial.textContent = "Sign in";
    $("#heroProfileAction").textContent = "Profile";
    return;
  }

  if (session.role === "admin") {
    profileInitial.textContent = "Admin";
    $("#heroProfileAction").textContent = "Admin panel";
    return;
  }

  profileInitial.textContent = session.name ? session.name.charAt(0).toUpperCase() : "User";
  $("#heroProfileAction").textContent = "Your profile";
}

function renderProducts() {
  const query = $("#siteSearch").value.trim().toLowerCase();
  const availability = $("#availabilityFilter").value;
  const sort = $("#priceSort").value;
  let visibleProducts = products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const isSale = Number(product.compareAt) > Number(product.price);
    const matchesAvailability =
      availability === "all" ||
      (availability === "in-stock" && Number(product.stock) > 0) ||
      (availability === "sale" && isSale);
    return matchesQuery && matchesAvailability;
  });

  if (sort === "low") {
    visibleProducts = visibleProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "high") {
    visibleProducts = visibleProducts.sort((a, b) => Number(b.price) - Number(a.price));
  } else {
    visibleProducts = visibleProducts.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  $("#resultCount").textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "item" : "items"}`;
  const grid = $("#productGrid");
  grid.classList.toggle("list-view", catalogView === "list");

  if (!visibleProducts.length) {
    grid.innerHTML = '<div class="empty-state">No products match those filters yet.</div>';
    return;
  }

  grid.innerHTML = visibleProducts.map(productCard).join("");
}

function productCard(product) {
  const isSale = Number(product.compareAt) > Number(product.price);
  const outOfStock = Number(product.stock) <= 0;
  const adminPreview = session?.role === "admin";
  const actions = adminPreview
    ? `<button class="secondary-action" data-open-admin type="button">Manage product</button>`
    : `
      <button class="secondary-action" data-add="${escapeHtml(product.id)}" type="button" ${outOfStock ? "disabled" : ""}>Add to cart</button>
      <button class="primary-action" data-buy="${escapeHtml(product.id)}" type="button" ${outOfStock ? "disabled" : ""}>Buy</button>
    `;

  return `
    <article class="product-card">
      <div class="product-media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        ${isSale ? '<span class="badge">Sale</span>' : ""}
      </div>
      <div class="product-body">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="price-row">
          <span>${money(product.price)}</span>
          ${isSale ? `<span class="compare-price">${money(product.compareAt)}</span>` : ""}
        </div>
        <span class="stock-line">${outOfStock ? "Out of stock" : `${product.stock} available`}</span>
        <div class="product-actions">${actions}</div>
      </div>
    </article>
  `;
}

function renderCart() {
  const cartItems = $("#cartItems");
  const resolvedItems = cart
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
    .filter((item) => item.product);

  if (!resolvedItems.length) {
    cartItems.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
  } else {
    cartItems.innerHTML = resolvedItems
      .map(({ product, qty }) => `
        <div class="cart-row">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          <div>
            <h4>${escapeHtml(product.name)}</h4>
            <p>${money(product.price)} each</p>
          </div>
          <div class="quantity-controls" aria-label="Quantity controls for ${escapeHtml(product.name)}">
            <button type="button" data-qty="${escapeHtml(product.id)}" data-delta="-1" aria-label="Decrease quantity">-</button>
            <strong>${qty}</strong>
            <button type="button" data-qty="${escapeHtml(product.id)}" data-delta="1" aria-label="Increase quantity">+</button>
          </div>
        </div>
      `)
      .join("");
  }

  $("#cartTotal").textContent = money(cartTotal());
  $("#checkoutTotal").textContent = money(cartTotal());
  $("#cartCount").textContent = cart.reduce((total, item) => total + item.qty, 0);
}

function cartTotal() {
  return cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return product ? total + Number(product.price) * item.qty : total;
  }, 0);
}

function addToCart(productId, replace = false) {
  const product = products.find((entry) => entry.id === productId);
  if (!product || Number(product.stock) <= 0) {
    showToast("That product is not available right now.");
    return false;
  }

  if (replace) {
    cart = [];
  }

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} added to cart.`);
  return true;
}

function updateQuantity(productId, delta) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) {
    return;
  }
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((entry) => entry.id !== productId);
  }
  saveCart();
  renderCart();
}

function openCheckout() {
  if (!cart.length) {
    showToast("Add a product before checkout.");
    return;
  }
  if (!session || session.role !== "user") {
    pendingCheckout = true;
    openAuth("user", "signin");
    showToast("Please sign in or create a local user account to buy.");
    return;
  }
  $("#buyerName").value = session.name || "";
  $("#buyerEmail").value = session.email || "";
  $("#buyerPhone").value = session.phone || "";
  $("#checkoutTotal").textContent = money(cartTotal());
  closeDialog($("#cartModal"));
  openDialog($("#checkoutModal"));
}

function buyProduct(productId) {
  if (session?.role === "admin") {
    showToast("Admins can manage products, while local users buy from the catalog.");
    return;
  }
  if (!session || session.role !== "user") {
    pendingBuyId = productId;
    openAuth("user", "signin");
    showToast("Please sign in or create a local user account to buy.");
    return;
  }
  if (addToCart(productId, true)) {
    openCheckout();
  }
}

function orderSubject(order) {
  return `New order ${order.id} - ${settings.storeName}`;
}

function orderMessage(order) {
  const itemLines = order.items
    .map((item) => `- ${item.qty} x ${item.name} at ${money(item.price)} each`)
    .join("\n");
  const createdAt = new Date(order.createdAt).toLocaleString();

  return [
    `New buyer registration from ${settings.storeName}`,
    "",
    `Order ID: ${order.id}`,
    `Total: ${money(order.total)}`,
    `Date: ${createdAt}`,
    "",
    "Buyer details:",
    `Name: ${order.buyer.name}`,
    `Email: ${order.buyer.email}`,
    `Phone: ${order.buyer.phone}`,
    "",
    "Products:",
    itemLines,
    "",
    "Please contact the buyer soon. Stay alerted."
  ].join("\n");
}

function orderMessageShort(order) {
  const itemText = order.items.map((item) => `${item.qty} x ${item.name}`).join(", ");
  return `${order.id} | ${order.buyer.name} | ${order.buyer.phone} | ${order.buyer.email} | ${money(order.total)} | ${itemText}`;
}

function emailHref(order) {
  return `mailto:${OWNER_CONTACT.email}?subject=${encodeURIComponent(orderSubject(order))}&body=${encodeURIComponent(orderMessage(order))}`;
}

function smsHref(order) {
  return `sms:${OWNER_CONTACT.phone}?&body=${encodeURIComponent(orderMessageShort(order))}`;
}

async function fetchWithTimeout(url, options, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function sendOrderNotification(order) {
  const subject = orderSubject(order);
  const message = orderMessage(order);
  const payload = {
    subject,
    message,
    ownerEmail: OWNER_CONTACT.email,
    ownerPhone: OWNER_CONTACT.phone,
    order
  };

  try {
    const response = await fetchWithTimeout("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        sent: true,
        channel: result.channels?.join(" and ") || "notification"
      };
    }
  } catch {
    // Static previews and unconfigured deployments use the email fallback below.
  }

  try {
    const response = await fetchWithTimeout(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        _subject: subject,
        name: order.buyer.name,
        email: order.buyer.email,
        phone: order.buyer.phone,
        order_id: order.id,
        total: money(order.total),
        message
      })
    });
    if (response.ok) {
      return { sent: true, channel: "email" };
    }
  } catch {
    // Manual email and SMS links remain available in the success dialog.
  }

  return { sent: false, channel: "manual" };
}

function renderSuccess(order, notification) {
  $("#emailOwnerLink").href = emailHref(order);
  $("#smsOwnerLink").href = smsHref(order);
  $("#notificationActions").hidden = false;

  if (notification.sent) {
    $("#successMessage").textContent = "Your order was registered and the admin was notified. The admin will contact you soon. Stay alerted.";
    $("#notificationStatus").textContent = `Notification sent by ${notification.channel}. Backup email and SMS links are available below.`;
    return;
  }

  $("#successMessage").textContent = "Your order was registered. The admin should contact you soon. Stay alerted.";
  $("#notificationStatus").textContent = "Automatic notification could not be confirmed. Use Email admin or SMS admin to send the order details now.";
}

async function submitCheckout(event) {
  event.preventDefault();
  const buyer = {
    name: $("#buyerName").value.trim(),
    email: $("#buyerEmail").value.trim().toLowerCase(),
    phone: $("#buyerPhone").value.trim()
  };

  if (!buyer.name || !buyer.email || !buyer.phone) {
    showToast("Please add name, email, and phone number.");
    return;
  }

  const items = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product
        ? {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            qty: item.qty
          }
        : null;
    })
    .filter(Boolean);

  if (!items.length) {
    showToast("Your cart is empty.");
    return;
  }

  for (const item of items) {
    const product = products.find((entry) => entry.id === item.id);
    product.stock = Math.max(0, Number(product.stock) - item.qty);
  }

  const order = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    buyer,
    items,
    total: cartTotal(),
    status: "Admin should contact buyer",
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);

  const currentUser = users.find((user) => user.email === session.email);
  if (currentUser) {
    currentUser.name = buyer.name;
    currentUser.phone = buyer.phone;
    session.name = buyer.name;
    session.phone = buyer.phone;
    saveUsers();
    saveSession();
  }

  cart = [];
  saveCart();
  saveOrders();
  saveProducts();
  renderAll();
  const notification = await sendOrderNotification(order);
  renderSuccess(order, notification);
  closeDialog($("#checkoutModal"));
  openDialog($("#successModal"));
}

function openAuth(role = "user", mode = "signin") {
  authRole = role;
  authMode = mode;
  updateAuthView();
  openDialog($("#authModal"));
  $("#authEmail").focus();
}

function updateAuthView() {
  $$("[data-auth-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authRole === authRole);
  });
  $$("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === authMode);
  });

  const isAdmin = authRole === "admin";
  const isSignup = authMode === "signup" && !isAdmin;
  $("#authModeTabs").hidden = isAdmin;
  $("#nameField").hidden = !isSignup;
  $("#phoneField").hidden = !isSignup;
  $("#authTitle").textContent = isAdmin ? "Admin sign in" : isSignup ? "Create local account" : "Local user sign in";
  $("#authSubmit").textContent = isSignup ? "Create account" : "Sign in";
  $("#authHelp").textContent = isAdmin
    ? "Admins are predefined and cannot register. Use admin@bubloo.test with password Science@2026."
    : isSignup
      ? "Local users can register, then buy products from the catalog."
      : "Sign in as a local user, or create a local account if you are new.";
  $("#authPassword").autocomplete = isSignup ? "new-password" : "current-password";
}

function handleAuth(event) {
  event.preventDefault();
  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const name = $("#authName").value.trim();
  const phone = $("#authPhone").value.trim();

  if (authRole === "admin") {
    const admin = ADMIN_ACCOUNTS.find((entry) => entry.email === email && entry.password === password);
    if (!admin) {
      showToast("Admin sign in failed. Admin accounts are predefined.");
      return;
    }
    session = { role: "admin", name: admin.name, email: admin.email };
    saveSession();
    closeDialog($("#authModal"));
    renderAll();
    openAdmin();
    return;
  }

  if (authMode === "signup") {
    if (!name || !email || !password) {
      showToast("Name, email, and password are required.");
      return;
    }
    if (users.some((user) => user.email === email)) {
      showToast("That local user already exists. Please sign in.");
      return;
    }
    const user = { name, email, phone, password };
    users.push(user);
    session = { role: "user", name, email, phone };
    saveUsers();
    saveSession();
    closeDialog($("#authModal"));
    renderAll();
    showToast("Local account created. The admin will contact you soon. Stay alerted.");
    continuePendingPurchase();
    return;
  }

  const user = users.find((entry) => entry.email === email && entry.password === password);
  if (!user) {
    showToast("Local sign in failed. Create a local account first.");
    return;
  }
  session = { role: "user", name: user.name, email: user.email, phone: user.phone };
  saveSession();
  closeDialog($("#authModal"));
  renderAll();
  continuePendingPurchase();
}

function continuePendingPurchase() {
  if (session?.role !== "user") {
    pendingBuyId = null;
    pendingCheckout = false;
    return;
  }

  if (pendingBuyId) {
    const productId = pendingBuyId;
    pendingBuyId = null;
    if (addToCart(productId, true)) {
      openCheckout();
      return;
    }
  }

  if (pendingCheckout) {
    pendingCheckout = false;
    openCheckout();
  }
}

function logout() {
  session = null;
  saveSession();
  renderAll();
  closeDialog($("#profileModal"));
  closeDialog($("#adminModal"));
  showToast("Signed out.");
}

function openProfile() {
  if (!session) {
    openAuth("user", "signin");
    return;
  }
  if (session.role === "admin") {
    openAdmin();
    return;
  }
  renderProfile();
  openDialog($("#profileModal"));
}

function renderProfile() {
  const userOrders = orders.filter((order) => order.buyer.email === session.email);
  const orderList = userOrders.length
    ? `<ul>${userOrders
        .map((order) => `<li>${escapeHtml(order.id)} - ${money(order.total)} - ${escapeHtml(order.status)}</li>`)
        .join("")}</ul>`
    : "<p>No orders yet. Your buyer registrations will show here.</p>";
  $("#profileSummary").innerHTML = `
    <h3>${escapeHtml(session.name)}</h3>
    <p>${escapeHtml(session.email)}</p>
    <p>${escapeHtml(session.phone || "No phone saved yet")}</p>
    ${orderList}
  `;
}

function openAdmin() {
  if (session?.role !== "admin") {
    showToast("Only predefined admins can open customization tools.");
    return;
  }
  renderAdmin();
  openDialog($("#adminModal"));
}

function fillImageSelect(select, selectedValue) {
  select.innerHTML = IMAGE_OPTIONS.map(
    (option) => `<option value="${escapeHtml(option.src)}" ${option.src === selectedValue ? "selected" : ""}>${escapeHtml(option.label)}</option>`
  ).join("");
}

function renderAccentChoices() {
  $("#accentChoices").innerHTML = ACCENT_OPTIONS.map(
    (color) => `
      <button class="swatch-button ${settings.accent === color ? "active" : ""}"
        style="background:${color}"
        type="button"
        data-accent="${color}"
        aria-label="Use accent color ${color}">
      </button>
    `
  ).join("");
  $("#settingAccent").value = settings.accent;
}

function renderAdmin() {
  $("#settingStoreName").value = settings.storeName;
  $("#settingHeroTitle").value = settings.heroTitle;
  $("#settingHeroBody").value = settings.heroBody;
  $("#settingNotice").value = settings.notice;
  fillImageSelect($("#settingHeroImage"), settings.heroImage);
  resetProductImageUpload();
  renderAccentChoices();
  renderAdminProducts();
  renderOrders();
}

function renderAdminProducts() {
  if (!products.length) {
    $("#adminProductList").innerHTML = '<div class="empty-state">No products published yet.</div>';
    return;
  }
  $("#adminProductList").innerHTML = products
    .map((product) => `
      <article>
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        <div>
          <h4>${escapeHtml(product.name)}</h4>
          <p>${escapeHtml(product.category)} - ${money(product.price)} - ${product.stock} in stock</p>
        </div>
        <button class="danger-button" type="button" data-delete-product="${escapeHtml(product.id)}">Delete</button>
      </article>
    `)
    .join("");
}

function renderOrders() {
  if (!orders.length) {
    $("#ordersList").innerHTML = '<div class="empty-state">No buyer registrations yet.</div>';
    return;
  }
  $("#ordersList").innerHTML = orders
    .map((order) => {
      const itemText = order.items.map((item) => `${item.qty} x ${item.name}`).join(", ");
      const date = new Date(order.createdAt).toLocaleString();
      return `
        <article>
          <h4>${escapeHtml(order.id)} - ${money(order.total)}</h4>
          <p>${escapeHtml(order.buyer.name)} | ${escapeHtml(order.buyer.email)} | ${escapeHtml(order.buyer.phone)}</p>
          <p>${escapeHtml(itemText)}</p>
          <p>${escapeHtml(order.status)} | ${escapeHtml(date)}</p>
        </article>
      `;
    })
    .join("");
}

function saveWebsiteSettings(event) {
  event.preventDefault();
  settings = {
    storeName: $("#settingStoreName").value.trim(),
    heroTitle: $("#settingHeroTitle").value.trim(),
    heroBody: $("#settingHeroBody").value.trim(),
    heroImage: $("#settingHeroImage").value,
    notice: $("#settingNotice").value.trim(),
    accent: $("#settingAccent").value || DEFAULT_SETTINGS.accent
  };
  saveSettings();
  renderAll();
  renderAdmin();
  showToast("Website customization saved.");
}

async function imageFileToDataUrl(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read that image.")));
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load that image.")));
    img.src = source;
  });

  const maxSize = 1400;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function setProductUploadPreview(src, label = "No image selected") {
  const preview = $("#productImagePreview");
  if (!src) {
    preview.innerHTML = `<span>${escapeHtml(label)}</span>`;
    return;
  }
  preview.innerHTML = `
    <img src="${escapeHtml(src)}" alt="Selected product image preview">
    <span>${escapeHtml(label)}</span>
  `;
}

function resetProductImageUpload() {
  const input = $("#productImageUpload");
  if (input) {
    input.value = "";
  }
  if (productPreviewObjectUrl) {
    URL.revokeObjectURL(productPreviewObjectUrl);
    productPreviewObjectUrl = "";
  }
  setProductUploadPreview();
}

async function addProduct(event) {
  event.preventDefault();
  const imageFile = $("#productImageUpload").files[0];

  if (!imageFile) {
    showToast("Please upload a product image.");
    return;
  }

  let uploadedImage = "";
  try {
    uploadedImage = await imageFileToDataUrl(imageFile);
  } catch (error) {
    showToast(error.message);
    return;
  }

  const product = {
    id: `product-${Date.now().toString(36)}`,
    name: $("#productName").value.trim(),
    category: $("#productCategory").value.trim(),
    price: Number($("#productPrice").value),
    compareAt: Number($("#productCompare").value) || 0,
    stock: Number($("#productStock").value) || 0,
    image: uploadedImage,
    description: $("#productDescription").value.trim(),
    featured: false
  };

  if (!product.name || !product.category || !product.description || product.price < 0) {
    showToast("Please complete the product details.");
    return;
  }

  products.unshift(product);
  saveProducts();
  $("#productForm").reset();
  resetProductImageUpload();
  renderAll();
  renderAdmin();
  showToast("Product published.");
}

function deleteProduct(productId) {
  const product = products.find((entry) => entry.id === productId);
  if (!product) {
    return;
  }
  const confirmed = window.confirm(`Delete ${product.name} from the catalog?`);
  if (!confirmed) {
    return;
  }
  products = products.filter((entry) => entry.id !== productId);
  cart = cart.filter((entry) => entry.id !== productId);
  saveProducts();
  saveCart();
  renderAll();
  renderAdmin();
  showToast("Product removed.");
}

function renderAll() {
  renderSettings();
  renderSession();
  renderProducts();
  renderCart();
}

function scrollToTarget(selector) {
  const target = document.querySelector(selector);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setupEvents() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const closeButton = event.target.closest("[data-close]");
    if (closeButton) {
      closeDialog($(`#${closeButton.dataset.close}`));
      return;
    }

    const scrollButton = event.target.closest("[data-scroll]");
    if (scrollButton) {
      scrollToTarget(scrollButton.dataset.scroll);
      return;
    }

    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      if (session?.role === "admin") {
        showToast("Admins manage products. Local users buy from the catalog.");
      } else {
        addToCart(addButton.dataset.add);
      }
      return;
    }

    const buyButton = event.target.closest("[data-buy]");
    if (buyButton) {
      buyProduct(buyButton.dataset.buy);
      return;
    }

    const quantityButton = event.target.closest("[data-qty]");
    if (quantityButton) {
      updateQuantity(quantityButton.dataset.qty, Number(quantityButton.dataset.delta));
      return;
    }

    const deleteButton = event.target.closest("[data-delete-product]");
    if (deleteButton) {
      deleteProduct(deleteButton.dataset.deleteProduct);
      return;
    }

    const accentButton = event.target.closest("[data-accent]");
    if (accentButton) {
      $("#settingAccent").value = accentButton.dataset.accent;
      settings.accent = accentButton.dataset.accent;
      renderAccentChoices();
      renderSettings();
      return;
    }

    if (event.target.closest("[data-open-admin]")) {
      openAdmin();
    }
  });

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog(dialog);
      }
    });
  });

  $("#searchToggle").addEventListener("click", () => {
    const drawer = $("#searchDrawer");
    drawer.hidden = !drawer.hidden;
    if (!drawer.hidden) {
      $("#siteSearch").focus();
    }
  });

  $("#profileButton").addEventListener("click", openProfile);
  $("#heroProfileAction").addEventListener("click", openProfile);
  $("#cartButton").addEventListener("click", () => openDialog($("#cartModal")));
  $("#checkoutButton").addEventListener("click", openCheckout);
  $("#clearCart").addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
    showToast("Cart cleared.");
  });

  $("#siteSearch").addEventListener("input", renderProducts);
  $("#availabilityFilter").addEventListener("change", renderProducts);
  $("#priceSort").addEventListener("change", renderProducts);

  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      catalogView = button.dataset.view;
      $$("[data-view]").forEach((entry) => entry.classList.toggle("active", entry === button));
      renderProducts();
    });
  });

  $$("[data-auth-role]").forEach((button) => {
    button.addEventListener("click", () => {
      authRole = button.dataset.authRole;
      if (authRole === "admin") {
        authMode = "signin";
      }
      updateAuthView();
    });
  });

  $$("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      authMode = button.dataset.authMode;
      updateAuthView();
    });
  });

  $("#authForm").addEventListener("submit", handleAuth);
  $("#checkoutForm").addEventListener("submit", submitCheckout);
  $("#settingsForm").addEventListener("submit", saveWebsiteSettings);
  $("#productForm").addEventListener("submit", addProduct);
  $("#productImageUpload").addEventListener("change", (event) => {
    const file = event.currentTarget.files[0];
    if (!file) {
      resetProductImageUpload();
      return;
    }
    if (!file.type.startsWith("image/")) {
      resetProductImageUpload();
      showToast("Please upload an image file.");
      return;
    }
    if (productPreviewObjectUrl) {
      URL.revokeObjectURL(productPreviewObjectUrl);
    }
    productPreviewObjectUrl = URL.createObjectURL(file);
    setProductUploadPreview(productPreviewObjectUrl, file.name);
  });
  $("#logoutUser").addEventListener("click", logout);
  $("#logoutAdmin").addEventListener("click", logout);

  $("#contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("Message saved locally for this demo.");
  });

  $("#newsletterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("Newsletter signup saved locally.");
  });
}

function init() {
  fillImageSelect($("#settingHeroImage"), settings.heroImage);
  setupEvents();
  renderAll();
}

init();
