/* ===========================================================
   📌 core.js — Master Engine (v6.0 ULTRA CLEAN FINAL)
   ✔ Global date normalization (stock, sales, expenses, wanting, services)
   ✔ dd-mm-yyyy <-> yyyy-mm-dd full support
   ✔ Safe load + safe parse
   ✔ Stable toDisplay() + toInternal()
   ✔ Service module compatible
   ✔ Smart Dashboard compatible
=========================================================== */

/* ---------- LOCAL STORAGE KEYS ---------- */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_EXPENSES   = "expenses-data";
const KEY_SERVICES   = "service-data";      // NEW — service included
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

/* ===========================================================
   🔥 UNIVERSAL DATE CONVERTERS
=========================================================== */

/* Convert yyyy-mm-dd → dd-mm-yyyy (FOR DISPLAY ONLY) */
function toDisplay(d) {
  if (!d) return "";
  if (d.includes("/") || d.includes(".")) return d;
  const p = d.split("-");
  if (p.length !== 3) return d;
  return `${p[2]}-${p[1]}-${p[0]}`;
}

/* Convert dd-mm-yyyy → yyyy-mm-dd (FOR STORAGE ONLY) */
function toInternal(d) {
  if (!d) return "";
  const p = d.split("-");
  if (p.length !== 3) return d;
  return `${p[2]}-${p[1]}-${p[0]}`;
}

/* Detect format & convert if needed */
function toInternalIfNeeded(d) {
  if (!d) return "";
  const p = d.split("-");
  if (p[0].length === 4) return d;     // already yyyy-mm-dd
  if (p[0].length === 2) return toInternal(d); // dd-mm-yyyy → convert
  return d;
}

/* ===========================================================
   🔥 LOAD GLOBAL ARRAYS
=========================================================== */
window.types     = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock     = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales     = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting   = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses  = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services  = toArray(safeParse(localStorage.getItem(KEY_SERVICES))); // NEW

/* ===========================================================
   🔥 AUTO-NORMALIZE ALL DATES (SUPER IMPORTANT)
=========================================================== */
function normalizeAllDates() {

  if (window.stock)
    window.stock = window.stock.map(s => ({
      ...s,
      date: toInternalIfNeeded(s.date)
    }));

  if (window.sales)
    window.sales = window.sales.map(s => ({
      ...s,
      date: toInternalIfNeeded(s.date)
    }));

  if (window.expenses)
    window.expenses = window.expenses.map(e => ({
      ...e,
      date: toInternalIfNeeded(e.date)
    }));

  if (window.wanting)
    window.wanting = window.wanting.map(w => ({
      ...w,
      date: toInternalIfNeeded(w.date)
    }));

  /* NEW — service/repair module date normalization */
  if (window.services)
    window.services = window.services.map(j => ({
      ...j,
      date_in:  toInternalIfNeeded(j.date_in),
      date_out: toInternalIfNeeded(j.date_out)
    }));
}

try { normalizeAllDates(); } catch(e){ console.warn("Normalize failed", e); }

/* ===========================================================
   🔥 LOGIN SYSTEM
=========================================================== */
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

/* ===========================================================
   🔥 SAVE HELPERS
=========================================================== */
function saveTypes()    { localStorage.setItem(KEY_TYPES, JSON.stringify(window.types)); }
function saveStock()    { localStorage.setItem(KEY_STOCK, JSON.stringify(window.stock)); }
function saveSales()    { localStorage.setItem(KEY_SALES, JSON.stringify(window.sales)); }
function saveWanting()  { localStorage.setItem(KEY_WANTING, JSON.stringify(window.wanting)); }
function saveExpenses() { localStorage.setItem(KEY_EXPENSES, JSON.stringify(window.expenses)); }
function saveServices() { localStorage.setItem(KEY_SERVICES, JSON.stringify(window.services)); } // NEW

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;
window.saveServices = saveServices;

/* ===========================================================
   🔥 BASIC UTILITIES (ESC, UID, TODAY)
=========================================================== */
function todayDate() {
  return new Date().toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p="id") {
  return p + "_" + Math.random().toString(36).slice(2, 9);
}
window.uid = uid;

function esc(t){
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[m]));
}
window.esc = esc;

/* ===========================================================
   🔥 STOCK HELPERS
=========================================================== */
function findProduct(type, name) {
  return window.stock.find(
    p => p.type === type && p.name.toLowerCase() === name.toLowerCase()
  );
}
window.findProduct = findProduct;

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

/* ===========================================================
   🔥 ADD TYPE
=========================================================== */
function addType(name) {
  name = name.trim();
  if (!name) return;

  if (window.types.find(t => t.name.toLowerCase() === name.toLowerCase()))
    return;

  window.types.push({ id: uid("type"), name });
  saveTypes();
}
window.addType = addType;

/* ===========================================================
   🔥 ADD STOCK
=========================================================== */
function addStockEntry({ date, type, name, qty, cost }) {

  date = toInternalIfNeeded(date);
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

/* ===========================================================
   🔥 WANTING AUTO ADD
=========================================================== */
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

/* ===========================================================
   🔥 EXPENSES
=========================================================== */
function addExpense({ date, category, amount, note }) {
  window.expenses.push({
    id: uid("exp"),
    date: toInternalIfNeeded(date || todayDate()),
    category,
    amount: Number(amount || 0),
    note: note || ""
  });
  saveExpenses();
}
window.addExpense = addExpense;

/* ===========================================================
   🔥 STORAGE SYNC — all modules auto refresh
=========================================================== */
window.addEventListener("storage", () => {

  window.types     = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  window.stock     = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  window.sales     = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  window.wanting   = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  window.expenses  = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  window.services  = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));

  renderTypes?.();
  renderStock?.();
  renderSales?.();
  renderWanting?.();
  renderExpenses?.();
  renderServiceTables?.();
  renderAnalytics?.();
  updateSummaryCards?.();
});
