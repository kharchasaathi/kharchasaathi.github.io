/* ===========================================================
   📌 core.js — Master Engine (v4.0 FINAL)
   Fully Fixed: Stock Filter, Limits, Sales Selectors,
   Smart Dashboard Sync, Storage Clean
   =========================================================== */

/* ---------- LOCAL STORAGE KEYS ---------- */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_EXPENSES   = "expenses-data";
const KEY_LIMIT      = "default-limit";
const KEY_USER_EMAIL = "ks-user-email";

/* ---------- SAFE PARSE ---------- */
function safeParse(raw) {
  try { return JSON.parse(raw); } 
  catch { return []; }
}
function toArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ---------- LOAD GLOBAL ARRAYS ---------- */
window.types    = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock    = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales    = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting  = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));

/* ---------- LOGIN ---------- */
function loginUser(email) {
  if (!email.includes("@")) return false;
  localStorage.setItem(KEY_USER_EMAIL, email);
  return true;
}
function isLoggedIn() { return !!localStorage.getItem(KEY_USER_EMAIL); }
function getUserEmail() { return localStorage.getItem(KEY_USER_EMAIL) || ""; }
function logoutUser() { localStorage.removeItem(KEY_USER_EMAIL); }

window.loginUser = loginUser;
window.isLoggedIn = isLoggedIn;
window.getUserEmail = getUserEmail;
window.logoutUser = logoutUser;

/* ---------- SAVE HELPERS ---------- */
function saveTypes()    { localStorage.setItem(KEY_TYPES, JSON.stringify(window.types)); }
function saveStock()    { localStorage.setItem(KEY_STOCK, JSON.stringify(window.stock)); }
function saveSales()    { localStorage.setItem(KEY_SALES, JSON.stringify(window.sales)); }
function saveWanting()  { localStorage.setItem(KEY_WANTING, JSON.stringify(window.wanting)); }
function saveExpenses() { localStorage.setItem(KEY_EXPENSES, JSON.stringify(window.expenses)); }

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;

/* ---------- DATE + UID ---------- */
function todayDate() {
  return new Date().toISOString().split("T")[0];
}
function uid(p="id") {
  return p + "_" + Math.random().toString(36).slice(2, 9);
}
window.todayDate = todayDate;
window.uid = uid;

/* ---------- ESC ---------- */
function esc(t){ 
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[m])); 
}
window.esc = esc;

/* ---------- FIND PRODUCT ---------- */
function findProduct(type, name) {
  return window.stock.find(
    p => p.type === type && p.name.toLowerCase() === name.toLowerCase()
  );
}
window.findProduct = findProduct;

/* ---------- GET PRODUCT COST ---------- */
function getProductCost(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history?.length) {
    let t = 0, q = 0;
    p.history.forEach(h => {
      t += Number(h.cost) * Number(h.qty);
      q += Number(h.qty);
    });
    return q ? (t / q) : 0;
  }

  return 0;
}
window.getProductCost = getProductCost;

/* ---------- ADD TYPE ---------- */
function addType(name) {
  name = name.trim();
  if (!name) return;

  if (window.types.find(t => t.name.toLowerCase() === name.toLowerCase()))
    return;

  window.types.push({ id: uid("type"), name });
  saveTypes();
}
window.addType = addType;

/* ---------- ADD / UPDATE STOCK ---------- */
function addStockEntry({ date, type, name, qty, cost }) {
  qty  = Number(qty);
  cost = Number(cost);

  if (!type || !name || qty <= 0 || cost <= 0) return;

  let p = findProduct(type, name);

  if (!p) {
    p = {
      id: uid("stk"),
      date,
      type,
      name,
      qty,
      cost,
      sold: 0,
      limit: getGlobalLimit(),
      history: [{ date, qty, cost }]
    };
    window.stock.push(p);
  } else {
    p.qty += qty;
    p.cost = cost;
    p.history.push({ date, qty, cost });
  }

  saveStock();
}
window.addStockEntry = addStockEntry;

/* ---------- LIMIT ---------- */
function setGlobalLimit(v) { localStorage.setItem(KEY_LIMIT, v); }
function getGlobalLimit()  { return Number(localStorage.getItem(KEY_LIMIT) || 0); }

window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ---------- WANTING ---------- */
function autoAddWanting(type, name, note="Low Stock") {
  if (!window.wanting.find(w => w.type === type && w.name === name)) {
    window.wanting.push({
      id: uid("want"),
      date: todayDate(),
      type,
      name,
      note
    });
    saveWanting();
  }
}
window.autoAddWanting = autoAddWanting;

/* ---------- EXPENSES ---------- */
function addExpense({ date, category, amount, note }) {
  window.expenses.push({
    id: uid("exp"),
    date: date || todayDate(),
    category,
    amount: Number(amount || 0),
    note: note || ""
  });
  saveExpenses();
}
window.addExpense = addExpense;

/* ---------- STORAGE SYNC ---------- */
window.addEventListener("storage", () => {
  window.types    = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  window.stock    = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  window.sales    = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  window.wanting  = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));

  renderTypes?.();
  renderStock?.();
  renderSales?.();
  renderWanting?.();
  renderExpenses?.();
  renderAnalytics?.();
  updateSummaryCards?.();
});
