/* ===========================================================
   📌 core.js — Master Storage + Utility Engine (v2.0)
   Controls: LocalStorage, Data Sync, Safe Updates
   Works with: types.js, stock.js, sales.js, wanting.js, analytics.js, expenses.js
   =========================================================== */

/* ------------------------------------
   🔐 LOCAL STORAGE KEYS
------------------------------------ */
const KEY_TYPES       = "item-types";
const KEY_STOCK       = "stock-data";
const KEY_SALES       = "sales-data";
const KEY_WANTING     = "wanting-data";
const KEY_EXPENSES    = "expenses-data";   // NEW
const KEY_LIMIT       = "default-limit";
const KEY_USER_EMAIL  = "ks-user-email";   // login key

/* ------------------------------------
   🔧 GLOBAL DATA (Auto-loaded)
------------------------------------ */
window.types    = JSON.parse(localStorage.getItem(KEY_TYPES)   || "[]");
window.stock    = JSON.parse(localStorage.getItem(KEY_STOCK)   || "[]");
window.sales    = JSON.parse(localStorage.getItem(KEY_SALES)   || "[]");
window.wanting  = JSON.parse(localStorage.getItem(KEY_WANTING) || "[]");
window.expenses = JSON.parse(localStorage.getItem(KEY_EXPENSES)|| "[]");

/* ------------------------------------
   🔐 LOGIN SYSTEM (Email-based)
------------------------------------ */
function loginUser(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return false;
  localStorage.setItem(KEY_USER_EMAIL, email.trim());
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

/* expose */
window.loginUser = loginUser;
window.isLoggedIn = isLoggedIn;
window.getUserEmail = getUserEmail;
window.logoutUser = logoutUser;

/* ------------------------------------
   💾 SAVE / SYNC Helpers
------------------------------------ */
function saveAllLocal() {
  localStorage.setItem(KEY_TYPES,   JSON.stringify(window.types));
  localStorage.setItem(KEY_STOCK,   JSON.stringify(window.stock));
  localStorage.setItem(KEY_SALES,   JSON.stringify(window.sales));
  localStorage.setItem(KEY_WANTING, JSON.stringify(window.wanting));
  localStorage.setItem(KEY_EXPENSES,JSON.stringify(window.expenses));

  // Notify other tabs
  window.dispatchEvent(new Event("storage"));

  // Debounced cloud sync (if cloudSave available)
  cloudSaveDebounced('types', window.types);
  cloudSaveDebounced('stock', window.stock);
  cloudSaveDebounced('sales', window.sales);
  cloudSaveDebounced('wanting', window.wanting);
  cloudSaveDebounced('expenses', window.expenses);
}

function saveTypes()   { localStorage.setItem(KEY_TYPES,   JSON.stringify(window.types)); cloudSaveDebounced('types', window.types); }
function saveStock()   { localStorage.setItem(KEY_STOCK,   JSON.stringify(window.stock)); cloudSaveDebounced('stock', window.stock); }
function saveSales()   { localStorage.setItem(KEY_SALES,   JSON.stringify(window.sales)); cloudSaveDebounced('sales', window.sales); }
function saveWanting() { localStorage.setItem(KEY_WANTING, JSON.stringify(window.wanting)); cloudSaveDebounced('wanting', window.wanting); }
function saveExpenses(){ localStorage.setItem(KEY_EXPENSES,JSON.stringify(window.expenses)); cloudSaveDebounced('expenses', window.expenses); }

window.saveAllLocal = saveAllLocal;
window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;

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
window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ------------------------------------
   📆 DATE + UID HELPERS
------------------------------------ */
function todayDate() {
  return new Date().toISOString().split("T")[0];
}
function uid(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}
/**
 * parseDateISO('YYYY-MM-DD') -> Date at local midnight
 */
function parseDateISO(s) {
  if (!s) return new Date();
  // ensure format and create local midnight
  return new Date(s + 'T00:00:00');
}

window.uid = uid;
window.todayDate = todayDate;
window.parseDateISO = parseDateISO;

/* ------------------------------------
   🔠 Escape HTML
------------------------------------ */
function esc(text) {
  if (text === null || typeof text === 'undefined') return "";
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}
window.esc = esc;

/* ------------------------------------
   📦 FIND & STOCK HELPERS
------------------------------------ */
function findProduct(type, name) {
  if (!type || !name) return null;
  return window.stock.find(
    s => String(s.type) === String(type) && String(s.name).toLowerCase() === String(name).toLowerCase()
  );
}

/* getProductCost: uses explicit cost or history average */
function getProductCost(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;
  if (p.cost) return parseFloat(p.cost) || 0;
  if (p.history && p.history.length) {
    let total = 0, qty = 0;
    p.history.forEach(h => {
      total += (Number(h.cost || 0) * Number(h.qty || 0));
      qty   += Number(h.qty || 0);
    });
    return qty ? (total / qty) : 0;
  }
  return 0;
}
window.findProduct = findProduct;
window.getProductCost = getProductCost;

/* ------------------------------------
   🧾 TYPES & STOCK management helpers
------------------------------------ */
function addType(name) {
  name = (name||'').trim();
  if (!name) return null;
  // prevent duplicates (case-insensitive)
  const exists = window.types.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (exists) return exists;
  const it = { id: uid('type'), name };
  window.types.push(it);
  saveTypes();
  return it;
}

function removeType(id) {
  window.types = window.types.filter(t => t.id !== id);
  // also remove from stock (optional: keep)
  window.stock = window.stock.filter(s => s.type !== id && s.type !== (window.types.find(x=>x.id===id)?.name));
  saveTypes();
  saveStock();
}

function addStockEntry({ date, type, name, qty, cost, limit }) {
  date = date || todayDate();
  type = (type||'').trim();
  name = (name||'').trim();
  qty = Number(qty || 0);
  cost = Number(cost || 0);
  limit = (typeof limit === 'undefined') ? getGlobalLimit() : Number(limit || 0);

  // create type if not exists (auto)
  if (!window.types.find(t => t.name.toLowerCase() === type.toLowerCase())) {
    addType(type);
  }

  // find existing product
  let p = findProduct(type, name);
  if (!p) {
    p = { id: uid('stk'), date, type, name, qty, cost, history: [], limit };
    window.stock.push(p);
  } else {
    // update existing: push history and increase qty
    p.history = p.history || [];
    p.history.push({ date, cost: Number(cost||0), qty: Number(qty||0) });
    p.qty = (Number(p.qty || 0) + Number(qty));
    // update limit only if provided
    if (typeof limit !== 'undefined') p.limit = limit;
  }
  saveStock();
  return p;
}

/* updateStockQty: adjust (can be negative to reduce) */
function updateStockQty(type, name, delta) {
  const p = findProduct(type, name);
  if (!p) return null;
  p.qty = (Number(p.qty || 0) + Number(delta || 0));
  if (p.qty < 0) p.qty = 0;
  saveStock();

  // Auto-add wanting if below limit
  const lim = (typeof p.limit !== 'undefined') ? Number(p.limit) : getGlobalLimit();
  if (lim && p.qty <= lim) {
    autoAddWanting(p.type, p.name);
  }
  return p;
}

window.addType = addType;
window.removeType = removeType;
window.addStockEntry = addStockEntry;
window.updateStockQty = updateStockQty;

/* ------------------------------------
   🛒 WANTING helpers (auto add)
------------------------------------ */
function autoAddWanting(type, name, note = 'auto-low-stock') {
  window.wanting = window.wanting || [];
  if (!type || !name) return;
  const exists = window.wanting.find(w => String(w.type).toLowerCase() === String(type).toLowerCase() && String(w.name).toLowerCase() === String(name).toLowerCase());
  if (exists) return exists;
  const it = { id: uid('want'), date: todayDate(), type, name, note };
  window.wanting.push(it);
  saveWanting();
  return it;
}

window.autoAddWanting = autoAddWanting;

/* ------------------------------------
   💳 EXPENSES helpers
------------------------------------ */
function addExpense({ date, category, amount, note }) {
  date = date || todayDate();
  category = (category || 'misc').trim();
  amount = Number(amount || 0);
  const it = { id: uid('exp'), date, category, amount, note: note || '' };
  window.expenses = window.expenses || [];
  window.expenses.push(it);
  saveExpenses();
  return it;
}
function getExpenses() {
  return window.expenses || [];
}
window.addExpense = addExpense;
window.getExpenses = getExpenses;

/* ------------------------------------
   🔄 CLOUD SAVE (debounced)
------------------------------------ */
let _cloudTimer = null;
function cloudSaveDebounced(collection, data) {
  if (typeof window.cloudSave !== 'function') return;
  // small debounce to group rapid writes
  clearTimeout(_cloudTimer);
  _cloudTimer = setTimeout(() => {
    try {
      const userId = getUserEmail() || 'owner';
      window.cloudSave(collection, data);
      // cloudSave implementation can use userId internally
    } catch (e) {
      console.error('cloudSaveDebounced error', e);
    }
  }, 350);
}
window.cloudSaveDebounced = cloudSaveDebounced;

/* ------------------------------------
   🔄 SYNC DATA WHEN LOCALSTORAGE CHANGES (auto-render)
------------------------------------ */
window.addEventListener("storage", () => {
  try {
    window.types    = JSON.parse(localStorage.getItem(KEY_TYPES)   || "[]");
    window.stock    = JSON.parse(localStorage.getItem(KEY_STOCK)   || "[]");
    window.sales    = JSON.parse(localStorage.getItem(KEY_SALES)   || "[]");
    window.wanting  = JSON.parse(localStorage.getItem(KEY_WANTING) || "[]");
    window.expenses = JSON.parse(localStorage.getItem(KEY_EXPENSES)|| "[]");
  } catch (e) {
    console.warn('core.js: storage parse error', e);
  }

  if (typeof renderTypes === "function") renderTypes();
  if (typeof renderStock === "function") renderStock();
  if (typeof renderSales === "function") renderSales();
  if (typeof renderWanting === "function") renderWanting();
  if (typeof renderExpenses === "function") renderExpenses();
  if (typeof renderAnalytics === "function") renderAnalytics();
  if (typeof updateSummaryCards === "function") updateSummaryCards();
});

/* ------------------------------------
   🧪 Small debug helper
------------------------------------ */
function debugDump() {
  return {
    types: window.types,
    stock: window.stock,
    sales: window.sales,
    wanting: window.wanting,
    expenses: window.expenses,
    user: getUserEmail()
  };
}
window.debugDump = debugDump;

/* ------------------------------------
   Exports (for other modules to use)
------------------------------------ */
window.saveAllLocal = saveAllLocal;
window.addType = addType;
window.addStockEntry = addStockEntry;
window.updateStockQty = updateStockQty;
window.autoAddWanting = autoAddWanting;
window.addExpense = addExpense;
window.getExpenses = getExpenses;

/* End of core.js (v2.0) */
