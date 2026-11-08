/* Emberwick Candle Co. — shop page logic.
   COURSE-TRACK STUDY NOTES (Dr. Angela Yu, Full-Stack Bootcamp):
   This file combines the course's front-end patterns in plain JavaScript:
   - DATA-DRIVEN RENDERING: the whole shelf is one array of objects below.
     Cards, the result count and the empty state are all built from that data,
     so adding a candle means adding one object — never editing HTML.
   - STATE + PERSISTENCE: the basket and the wishlist live in localStorage.
     Every change saves them, so they survive page changes and reloads.
   - DERIVED STATE: the visible list (family + search + sort) and every
     price (size option, quantity, basket totals) are COMPUTED from state,
     never stored. If the data changes, the page follows.
   - OPTION-DRIVEN PRICING: the modal's size buttons reprice live —
     Small is $10 under Classic, Large is $14 over Classic.
*/

"use strict";

/* ------------------------------------------------------------------ */
/* 1. DATA — the single source of truth for the whole shop.            */
/*    price = the CLASSIC size. Petite and Grand are derived from it.  */
/* ------------------------------------------------------------------ */
const CANDLES = [
  { id: "citrus-sage",     name: "Citrus Sage",      family: "Citrus",   price: 34, burn: "45-hour burn", img: "images/c1.jpg",  alt: "Citrus sage scented candle with red roses in dim light", desc: "Bright grapefruit and clary sage over a clean soy base — the candle for a kitchen that smells like a fresh start." },
  { id: "patchouli-noir",  name: "Patchouli Noir",   family: "Woody",    price: 38, burn: "50-hour burn", img: "images/c2.jpg",  alt: "Patchouli scented candle with incense in a dark room", desc: "Earthy patchouli, sandalwood and a whisper of smoke. Deep, warm, and unapologetically grown-up." },
  { id: "cinnamon-hearth", name: "Cinnamon Hearth", family: "Spiced",   price: 36, burn: "45-hour burn", img: "images/c3.jpg",  alt: "Cinnamon spice candles with autumn leaves indoors", desc: "Cinnamon bark, clove and a little orange peel — autumn in a jar, whenever you want it." },
  { id: "winter-hearth",   name: "Winter Hearth",    family: "Spiced",   price: 36, burn: "50-hour burn", img: "images/c4.jpg",  alt: "Holiday candles with cinnamon and rosemary", desc: "Cinnamon, rosemary and pine needle for cold nights — the one that makes the whole house smell like December." },
  { id: "jasmine-mint",     name: "Jasmine & Mint",   family: "Fresh",    price: 32, burn: "40-hour burn", img: "images/c5.jpg",  alt: "Jasmine and mint candle glowing in a cozy room", desc: "Night jasmine softened with cool mint. Light, clean, and calm after a long day." },
  { id: "vanilla-bourbon", name: "Vanilla Bourbon",  family: "Gourmand", price: 38, burn: "55-hour burn", img: "images/c6.jpg",  alt: "Vanilla bourbon scented candle with red roses", desc: "Madagascar vanilla, a splash of bourbon and warm amber — sweet without being sugary." },
  { id: "cedarwood-cabin", name: "Cedarwood Cabin",  family: "Woody",    price: 36, burn: "50-hour burn", img: "images/c7.jpg",  alt: "Three handmade scented candles on a wooden surface", desc: "Cedarwood, fir and a cedar-chip wick that crackles softly as it burns. A cabin weekend, on demand." },
  { id: "vanilla-bean-snow", name: "Vanilla Bean Snow", family: "Gourmand", price: 34, burn: "45-hour burn", img: "images/c8.jpg", alt: "Vanilla bean candle beside a small snowy Christmas tree", desc: "Vanilla bean, sugar and a dusting of snow-musk. The holiday candle that works all winter long." },
  { id: "black-rose",      name: "Black Rose",       family: "Floral",   price: 40, burn: "50-hour burn", img: "images/c9.jpg",  alt: "Black candle beside red roses on a wooden surface", desc: "Dark rose, oud and black plum — the dramatic one. Best lit after dark, obviously." },
  { id: "eucalyptus-spa",  name: "Eucalyptus Spa",   family: "Fresh",    price: 32, burn: "40-hour burn", img: "images/c10.jpg", alt: "Aromatherapy candles and essential oil on marble", desc: "Eucalyptus, sea salt and white tea. The bathroom candle that turns a shower into a spa." },
  { id: "mango-melon",     name: "Mango & Melon",    family: "Citrus",   price: 30, burn: "40-hour burn", img: "images/c11.jpg", alt: "Mango and melon scented candle in a cork-topped glass jar", desc: "Ripe mango and cool melon in a cork-topped jar — summer, sealed up for February." },
  { id: "peony-blush",     name: "Peony Blush",      family: "Floral",   price: 36, burn: "45-hour burn", img: "images/c12.jpg", alt: "Floral candle display with pink peony accents", desc: "Peony, pink rose and a touch of peony-leaf green. Soft, pretty, and impossible to dislike." },
];

/* Size options: each size is a price OFFSET from the Classic price.
   Deriving prices this way keeps one number per candle in the data. */
const SIZES = [
  { key: "Small",   offset: -10, note: "8 oz · a smaller pour" },
  { key: "Classic", offset: 0,   note: "12 oz · the full candle" },
  { key: "Large",   offset: 14,  note: "16 oz · the big one" },
];

const BASKET_KEY = "emberwick-candle-basket";
const WISHLIST_KEY = "emberwick-candle-wishlist";

/* ------------------------------------------------------------------ */
/* 2. STATE — loaded from localStorage, saved on every change.         */
/* ------------------------------------------------------------------ */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let basket = loadJSON(BASKET_KEY, []);       // [{id, size, qty}]
let wishlist = loadJSON(WISHLIST_KEY, []);   // [id, id, ...]
let activeFamily = "All";
let searchText = "";
let sortMode = "featured";

/* ------------------------------------------------------------------ */
/* 3. HELPERS                                                          */
/* ------------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const money = (n) => "$" + n.toFixed(2);
function candleById(id) { return CANDLES.find((b) => b.id === id); }
function sizePrice(candle, sizeKey) {
  const size = SIZES.find((s) => s.key === sizeKey) || SIZES[1];
  return candle.price + size.offset;
}
function basketCount() { return basket.reduce((sum, line) => sum + line.qty, 0); }
function basketSubtotal() {
  return basket.reduce((sum, line) => {
    const b = candleById(line.id);
    return b ? sum + sizePrice(b, line.size) * line.qty : sum;
  }, 0);
}

/* ------------------------------------------------------------------ */
/* 4. RENDER — the visible list is DERIVED from data + filters.        */
/*    Filter, then search, then sort, then paint. Nothing is stored.   */
/* ------------------------------------------------------------------ */
function visibleCandles() {
  let list = CANDLES.slice();
  if (activeFamily !== "All") {
    list = list.filter((b) => b.family === activeFamily);
  }
  const q = searchText.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.burn.toLowerCase().includes(q)
    );
  }
  if (sortMode === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sortMode === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sortMode === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list; // "featured" keeps the catalogue order
}

function renderGrid() {
  const grid = $("#candleGrid");
  const list = visibleCandles();
  $("#resultCount").textContent =
    list.length + (list.length === 1 ? " candle" : " candles");

  if (list.length === 0) {
    grid.innerHTML =
      '<div class="empty-state"><strong>No candles match that search.</strong>' +
      "Try a different scent, or clear the family filter to see the whole shelf.</div>";
    return;
  }

  grid.innerHTML = list.map((b) => {
    const wished = wishlist.includes(b.id);
    return (
      '<article class="card">' +
      '<img src="' + b.img + '" alt="' + b.alt + '" loading="lazy">' +
      '<div class="card-body">' +
      '<h3>' + b.name + '</h3>' +
      '<p class="card-family">' + b.family + '</p>' +
      '<p class="desc">' + b.desc + '</p>' +
      '<div class="card-meta"><span class="price">' + money(b.price) +
      ' <small>Classic</small></span><span class="stems">' + b.burn + '</span></div>' +
      '<div class="card-actions">' +
      '<button class="btn" type="button" data-view="' + b.id + '">View &amp; choose size</button>' +
      '<button class="heart" type="button" data-wish="' + b.id + '" aria-pressed="' + wished +
      '" aria-label="Save ' + b.name + ' to wishlist">' + (wished ? "♥" : "♡") + '</button>' +
      "</div></div></article>"
    );
  }).join("");
}

/* ------------------------------------------------------------------ */
/* 5. BASKET DRAWER — same state, second view of it.                  */
/* ------------------------------------------------------------------ */
function renderBasketBtn() {
  $("#basketBtn").textContent = "Basket (" + basketCount() + ")";
}

function renderDrawer() {
  const body = $("#drawerBody");
  const foot = $("#drawerFoot");
  if (basket.length === 0) {
    body.innerHTML =
      '<p class="drawer-empty">Your basket is empty.<br>Pick a candle and choose a size to get started.</p>';
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = basket.map((line, i) => {
    const b = candleById(line.id);
    if (!b) return "";
    const unit = sizePrice(b, line.size);
    return (
      '<div class="basket-line">' +
      '<img src="' + b.img + '" alt="' + b.alt + '">' +
      "<div><h4>" + b.name + "</h4>" +
      '<p class="line-sub">' + line.size + " · " + money(unit) + " each</p>" +
      '<span class="qty-mini"><button type="button" data-dec="' + i + '" aria-label="One fewer">−</button>' +
      "<span>" + line.qty + "</span>" +
      '<button type="button" data-inc="' + i + '" aria-label="One more">+</button></span>' +
      '<br><button class="line-remove" type="button" data-remove="' + i + '">Remove</button>' +
      "</div>" +
      '<div class="line-price">' + money(unit * line.qty) + "</div>" +
      "</div>"
    );
  }).join("");

  foot.innerHTML =
    '<div class="totals"><div><span>Subtotal</span><span>' + money(basketSubtotal()) + "</span></div>" +
    "<div><span>Delivery</span><span>At checkout</span></div></div>" +
    '<a class="btn btn-rose" href="cart.html">Go to checkout</a>';
}

function openDrawer() {
  renderDrawer();
  $("#basketDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("open");
}
function closeDrawer() {
  $("#basketDrawer").classList.remove("open");
  $("#drawerBackdrop").classList.remove("open");
}

function addToBasket(id, size, qty) {
  const existing = basket.find((l) => l.id === id && l.size === size);
  if (existing) existing.qty += qty;
  else basket.push({ id: id, size: size, qty: qty });
  saveJSON(BASKET_KEY, basket);
  renderBasketBtn();
  renderDrawer();
}

/* ------------------------------------------------------------------ */
/* 6. DETAIL MODAL — size and quantity reprice live (derived state).  */
/* ------------------------------------------------------------------ */
let modalCandle = null;
let modalSize = "Classic";
let modalQty = 1;

function openModal(id) {
  modalCandle = candleById(id);
  if (!modalCandle) return;
  modalSize = "Classic";
  modalQty = 1;
  $("#modalImg").src = modalCandle.img;
  $("#modalImg").alt = modalCandle.alt;
  $("#modalTitle").textContent = modalCandle.name;
  $("#modalFamily").textContent =
    modalCandle.family + " · " + modalCandle.stems;
  $("#modalDesc").textContent = modalCandle.desc;
  renderSizeRow();
  renderModalTotal();
  $("#modalBackdrop").classList.add("open");
}
function closeModal() {
  $("#modalBackdrop").classList.remove("open");
  modalCandle = null;
}
function renderSizeRow() {
  $("#sizeRow").innerHTML = SIZES.map((s) => {
    const price = modalCandle.price + s.offset;
    return (
      '<button class="size-opt" type="button" data-size="' + s.key +
      '" aria-pressed="' + (modalSize === s.key) + '">' +
      "<strong>" + s.key + " — " + money(price) + "</strong>" +
      "<span>" + s.note + "</span></button>"
    );
  }).join("");
  $("#qtyOut").textContent = modalQty;
}
function renderModalTotal() {
  $("#modalTotal").textContent = money(
    sizePrice(modalCandle, modalSize) * modalQty
  );
  $("#qtyOut").textContent = modalQty;
}

/* ------------------------------------------------------------------ */
/* 7. EVENTS — one delegated listener per area keeps this tidy.        */
/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  renderGrid();
  renderBasketBtn();

  // Search (live, as you type) and sort.
  $("#searchInput").addEventListener("input", (e) => {
    searchText = e.target.value;
    renderGrid();
  });
  $("#sortSelect").addEventListener("change", (e) => {
    sortMode = e.target.value;
    renderGrid();
  });

  // Family chips — single-select, aria-pressed shows the active one.
  $("#familyChips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeFamily = btn.dataset.family;
    document.querySelectorAll("#familyChips .chip").forEach((c) =>
      c.setAttribute("aria-pressed", String(c === btn))
    );
    renderGrid();
  });

  // Grid: view buttons and wishlist hearts.
  $("#candleGrid").addEventListener("click", (e) => {
    const viewBtn = e.target.closest("[data-view]");
    if (viewBtn) { openModal(viewBtn.dataset.view); return; }
    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) {
      const id = wishBtn.dataset.wish;
      if (wishlist.includes(id)) wishlist = wishlist.filter((w) => w !== id);
      else wishlist.push(id);
      saveJSON(WISHLIST_KEY, wishlist);
      renderGrid(); // re-render so the heart flips and stays flipped
    }
  });

  // Modal: size, quantity, add, close (button, backdrop, Escape).
  $("#sizeRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-size]");
    if (!btn) return;
    modalSize = btn.dataset.size;
    renderSizeRow();
    renderModalTotal();
  });
  $("#qtyMinus").addEventListener("click", () => {
    if (modalQty > 1) { modalQty--; renderModalTotal(); }
  });
  $("#qtyPlus").addEventListener("click", () => {
    if (modalQty < 9) { modalQty++; renderModalTotal(); }
  });
  $("#modalAddBtn").addEventListener("click", () => {
    if (!modalCandle) return;
    addToBasket(modalCandle.id, modalSize, modalQty);
    closeModal();
    openDrawer();
  });
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalBackdrop").addEventListener("click", (e) => {
    if (e.target === $("#modalBackdrop")) closeModal();
  });

  // Basket drawer: open, close, quantity, remove.
  $("#basketBtn").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  $("#drawerBody").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rem = e.target.closest("[data-remove]");
    if (inc) {
      basket[+inc.dataset.inc].qty = Math.min(9, basket[+inc.dataset.inc].qty + 1);
    } else if (dec) {
      const line = basket[+dec.dataset.dec];
      line.qty--;
      if (line.qty <= 0) basket.splice(+dec.dataset.dec, 1);
    } else if (rem) {
      basket.splice(+rem.dataset.remove, 1);
    } else return;
    saveJSON(BASKET_KEY, basket);
    renderBasketBtn();
    renderDrawer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDrawer(); }
  });
});
