/* ===========================================================
   📌 core.js — Master Storage + Utility Engine
   Controls: LocalStorage, Data Sync, Safe Updates
   Works with: types.js, stock.js, sales.js, wanting.js, analytics.js
   =========================================================== */


/* ------------------------------------
   🔐 LOCAL STORAGE KEYS
------------------------------------ */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_LIMIT      = "default-limit";
const KEY_USER_EMAIL = "ks-user-email";   // NEW LOGIN KEY


/* ------------------------------------
   🔧 GLOBAL DATA (Auto-loaded)
------------------------------------ */
window.types   = JSON.parse(localStorage.getItem(KEY_TYPES)   || "[]");
window.stock   = JSON.parse(localStorage.getItem(KEY_STOCK)   || "[]");
window.sales   = JSON.parse(localStorage.getItem(KEY_SALES)   || "[]");
window.wanting = JSON.parse(localStorage.getItem(KEY_WANTING) || "[]");



/* ------------------------------------
   🔐 LOGIN SYSTEM (Email-based)
------------------------------------ */
function loginUser(email) {
  if (!email || !email.includes("@")) return false;
  localStorage.setItem(KEY_USER_EMAIL, email);
  return true;
}

function isLoggedIn() {
  return !!localStorage.getItem(KEY_USER_EMAIL);
}

function getUserEmail() {
  return localStorage.getItem(KEY_USER_EMAIL) || "";
}

function logoutUser() {
  localStorage.removeItem(KEY_USER_EMAIL);
}



/* ------------------------------------
   💾 SAVE ALL DATA SAFELY
------------------------------------ */
function saveAllLocal() {
  localStorage.setItem(KEY_TYPES,   JSON.stringify(window.types));
  localStorage.setItem(KEY_STOCK,   JSON.stringify(window.stock));
  localStorage.setItem(KEY_SALES,   JSON.stringify(window.sales));
  localStorage.setItem(KEY_WANTING, JSON.stringify(window.wanting));

  // Notify other tabs
  window.dispatchEvent(new Event("storage"));
}


/* Save individual modules */
function saveTypes()   { localStorage.setItem(KEY_TYPES,   JSON.stringify(window.types)); }
function saveStock()   { localStorage.setItem(KEY_STOCK,   JSON.stringify(window.stock)); }
function saveSales()   { localStorage.setItem(KEY_SALES,   JSON.stringify(window.sales)); }
function saveWanting() { localStorage.setItem(KEY_WANTING, JSON.stringify(window.wanting)); }



/* ------------------------------------
   📌 LIMIT HANDLER
------------------------------------ */
function setGlobalLimit(v) {
  localStorage.setItem(KEY_LIMIT, v);
}

function getGlobalLimit() {
  const v = parseInt(localStorage.getItem(KEY_LIMIT));
  return isNaN(v) ? 0 : v;
}



/* ------------------------------------
   📆 Today's Date Helper
------------------------------------ */
function todayDate() {
  return new Date().toISOString().split("T")[0];
}



/* ------------------------------------
   🔠 Escape HTML
------------------------------------ */
function esc(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}



/* ------------------------------------
   📦 FIND PRODUCT
------------------------------------ */
function findProduct(type, name) {
  return window.stock.find(
    s => s.type === type && s.name.toLowerCase() === name.toLowerCase()
  );
}



/* ------------------------------------
   💰 GET PRODUCT COST (Auto average)
------------------------------------ */
function getProductCost(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return parseFloat(p.cost);

  if (p.history && p.history.length) {
    let total = 0, qty = 0;
    p.history.forEach(h => {
      total += (h.cost * h.qty);
      qty   += h.qty;
    });
    return qty ? total / qty : 0;
  }
  return 0;
}



/* ------------------------------------
   🔄 SYNC DATA WHEN LOCALSTORAGE CHANGES
------------------------------------ */
window.addEventListener("storage", () => {
  try {
    window.types   = JSON.parse(localStorage.getItem(KEY_TYPES)   || "[]");
    window.stock   = JSON.parse(localStorage.getItem(KEY_STOCK)   || "[]");
    window.sales   = JSON.parse(localStorage.getItem(KEY_SALES)   || "[]");
    window.wanting = JSON.parse(localStorage.getItem(KEY_WANTING) || "[]");
  } catch (e) {}

  if (typeof renderTypes          === "function") renderTypes();
  if (typeof renderStock          === "function") renderStock();
  if (typeof renderSales          === "function") renderSales();
  if (typeof renderAnalytics      === "function") renderAnalytics();
  if (typeof updateSummaryCards   === "function") updateSummaryCards();
});
