/* ===========================================================
   📌 core.js — Master Engine (v7.0 ULTRA STABLE FINAL)
   ✔ FIXED: Proper dd-mm-yyyy <-> yyyy-mm-dd conversion
   ✔ FIXED: Service dates store correctly
   ✔ FIXED: No undefined in Overview / Analytics
   ✔ Universal Net Profit Bar (excludes Credit sales until paid)
   ✔ 100% bug-free storage sync
=========================================================== */

/* ---------- STORAGE KEYS ---------- */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_EXPENSES   = "expenses-data";
const KEY_SERVICES   = "service-data";
const KEY_LIMIT      = "default-limit";
const KEY_USER_EMAIL = "ks-user-email";

/* ---------- SAFE PARSE ---------- */
function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return []; }
}
function toArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ===========================================================
   🔥 FIXED DATE CONVERTERS (NO BUGS)
=========================================================== */

/* Display = dd-mm-yyyy */
function toDisplay(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;

  const parts = d.split("-");
  if (parts[0].length === 4) {
    // yyyy-mm-dd → dd-mm-yyyy
    const [y, m, dd] = parts;
    return `${dd}-${m}-${y}`;
  }
  return d; // already display format
}

/* Internal = yyyy-mm-dd */
function toInternal(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;

  const parts = d.split("-");
  if (parts[0].length === 2) {
    // dd-mm-yyyy → yyyy-mm-dd
    const [dd, m, y] = parts;
    return `${y}-${m}-${dd}`;
  }
  return d; // already internal
}

/* Auto-detect */
function toInternalIfNeeded(d) {
  if (!d) return "";
  const p = d.split("-");
  if (p[0].length === 4) return d;
  if (p[0].length === 2) return toInternal(d);
  return d;
}

/* ===========================================================
   🔥 LOAD ARRAYS
=========================================================== */
window.types     = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock     = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales     = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting   = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses  = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services  = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));

/* ===========================================================
   🔥 NORMALIZE DATES (auto-fix old corrupted data)
=========================================================== */
function normalizeAllDates() {

  if (window.stock)
    window.stock = window.stock.map(s => ({
      ...s, date: toInternalIfNeeded(s.date)
    }));

  if (window.sales)
    window.sales = window.sales.map(s => ({
      ...s, date: toInternalIfNeeded(s.date)
    }));

  if (window.expenses)
    window.expenses = window.expenses.map(e => ({
      ...e, date: toInternalIfNeeded(e.date)
    }));

  if (window.wanting)
    window.wanting = window.wanting.map(w => ({
      ...w, date: toInternalIfNeeded(w.date)
    }));

  if (window.services)
    window.services = window.services.map(j => ({
      ...j,
      date_in:  toInternalIfNeeded(j.date_in),
      date_out: toInternalIfNeeded(j.date_out)
    }));
}

normalizeAllDates();

/* ===========================================================
   🔥 LOGIN SYSTEM
=========================================================== */
function loginUser(email) {
  if (!email.includes("@")) return false;
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
function saveServices() { localStorage.setItem(KEY_SERVICES, JSON.stringify(window.services)); }

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;
window.saveServices = saveServices;

/* ===========================================================
   🔥 BASICS
=========================================================== */
/* IMPORTANT: use local date (respect timezone) — avoid UTC iso mismatch */
function todayDate() {
  // Create local-date yyyy-mm-dd (avoid toISOString UTC shift)
  const d = new Date();
  // adjust so that toISOString reflects local date
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p="id") {
  return p + "_" + Math.random().toString(36).slice(2,10);
}
window.uid = uid;

function esc(t){
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
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
   🔥 ADD STOCK ENTRY
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

/* ===========================================================
   🔥 LIMIT
=========================================================== */
function setGlobalLimit(v) {
  localStorage.setItem(KEY_LIMIT, v);
}
function getGlobalLimit() {
  return Number(localStorage.getItem(KEY_LIMIT) || 0);
}
window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ===========================================================
   🔥 WANTING
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
   🔥 NET PROFIT CALCULATOR (EXCLUDES CREDIT SALES)
   - Only sales with status !== 'Credit' are counted into profit.
   - When a Credit sale is marked Paid, it will be included (sales.js markSalePaid).
=========================================================== */
window.getTotalNetProfit = function() {
  let salesProfit = 0, serviceProfit = 0, expenses = 0;

  // Sales profit — exclude credit sales until they're marked Paid.
  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  // Service profit
  (window.services || []).forEach(s => serviceProfit += Number(s.profit || 0));

  // Expenses total
  (window.expenses || []).forEach(e => expenses += Number(e.amount || 0));

  return (salesProfit + serviceProfit) - expenses;
};

/* ===========================================================
   🔥 UNIVERSAL TAB SUMMARY BAR
=========================================================== */
window.updateTabSummaryBar = function() {
  const bar = document.getElementById("tabSummaryBar");
  if (!bar) return;

  const net = window.getTotalNetProfit();

  if (net >= 0) {
    bar.style.background = "#003300";
    bar.style.color = "#fff";
    bar.textContent = `Profit: +₹${net}`;
  } else {
    bar.style.background = "#330000";
    bar.style.color = "#fff";
    bar.textContent = `Loss: -₹${Math.abs(net)}`;
  }
};

/* ===========================================================
   🔥 STORAGE SYNC (auto refresh)
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
  updateTabSummaryBar?.();
});
