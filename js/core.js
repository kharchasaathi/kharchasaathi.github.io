/* ===========================================================
   📌 core.js — Master Engine (v7.3) Cloud-enabled (Option A)
   ✔ Stock After Sale Investment (NEW)
   ✔ Service Investment (NEW)
   ✔ Fully synced with Profit tab + Analytics V3
   ✔ Per-module Firestore collections
   ✔ Safe date parse, normalize, localStorage sync
=========================================================== */

/* GLOBAL QUERY HELPERS (required for ALL modules) */
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

window.qs = qs;
window.qsa = qsa;
/* ---------- STORAGE KEYS & COLLECTION NAMES ---------- */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_EXPENSES   = "expenses-data";
const KEY_SERVICES   = "service-data";
const KEY_LIMIT      = "default-limit";
const KEY_USER_EMAIL = "ks-user-email";

const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:    "types",
  [KEY_STOCK]:    "stock",
  [KEY_SALES]:    "sales",
  [KEY_WANTING]:  "wanting",
  [KEY_EXPENSES]: "expenses",
  [KEY_SERVICES]: "services"
};

/* ---------- SAFE PARSE ---------- */
function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return []; }
}
function toArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ===========================================================
   🔥 DATE CONVERTERS
=========================================================== */
function toDisplay(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;
  const parts = d.split("-");
  if (parts[0].length === 4) {
    const [y, m, dd] = parts;
    return `${dd}-${m}-${y}`;
  }
  return d;
}

function toInternal(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;
  const parts = d.split("-");
  if (parts[0].length === 2) {
    const [dd, m, y] = parts;
    return `${y}-${m}-${dd}`;
  }
  return d;
}

function toInternalIfNeeded(d) {
  if (!d) return "";
  const p = d.split("-");
  if (p[0].length === 4) return d;
  if (p[0].length === 2) return toInternal(d);
  return d;
}

window.toDisplay = toDisplay;
window.toInternal = toInternal;
window.toInternalIfNeeded = toInternalIfNeeded;

/* ===========================================================
   🔥 LOAD DATA
=========================================================== */
window.types     = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock     = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales     = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting   = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses  = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services  = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));

/* ===========================================================
   🔥 NORMALIZE DATES
=========================================================== */
function normalizeAllDates() {
  if (window.stock)
    window.stock = window.stock.map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));

  if (window.sales)
    window.sales = window.sales.map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));

  if (window.expenses)
    window.expenses = window.expenses.map(e => ({ ...e, date: toInternalIfNeeded(e.date) }));

  if (window.wanting)
    window.wanting = window.wanting.map(w => ({ ...w, date: toInternalIfNeeded(w.date) }));

  if (window.services)
    window.services = window.services.map(j => ({
      ...j,
      date_in:  toInternalIfNeeded(j.date_in),
      date_out: toInternalIfNeeded(j.date_out)
    }));
}
try { normalizeAllDates(); } catch(e){}

/* ===========================================================
   🔥 LOGIN
=========================================================== */
function loginUser(email) {
  if (!email || !email.includes("@")) return false;
  localStorage.setItem(KEY_USER_EMAIL, email);
  cloudPullAllIfAvailable();
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
   🔥 SAVE HELPERS (local + cloud)
=========================================================== */
function _localSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch{}
}

function _cloudSaveIfPossible(key, data) {
  const col = CLOUD_COLLECTIONS[key];
  if (!col) return;

  try {
    if (typeof window.cloudSaveDebounced === "function") {
      window.cloudSaveDebounced(col, data);
    } else if (typeof window.cloudSave === "function") {
      window.cloudSave(col, data).catch(()=>{});
    }
  } catch {}
}

function saveTypes()    { _localSave(KEY_TYPES, window.types);       _cloudSaveIfPossible(KEY_TYPES, window.types); }
function saveStock()    { _localSave(KEY_STOCK, window.stock);       _cloudSaveIfPossible(KEY_STOCK, window.stock); }
function saveSales()    { _localSave(KEY_SALES, window.sales);       _cloudSaveIfPossible(KEY_SALES, window.sales); }
function saveWanting()  { _localSave(KEY_WANTING, window.wanting);   _cloudSaveIfPossible(KEY_WANTING, window.wanting); }
function saveExpenses() { _localSave(KEY_EXPENSES, window.expenses); _cloudSaveIfPossible(KEY_EXPENSES, window.expenses); }
function saveServices() { _localSave(KEY_SERVICES, window.services); _cloudSaveIfPossible(KEY_SERVICES, window.services); }

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;
window.saveServices = saveServices;

/* ===========================================================
   🔥 BASICS
=========================================================== */
function todayDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p="id") { return p + "_" + Math.random().toString(36).slice(2,10); }
window.uid = uid;

function esc(t){
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  }[m]));
}
window.esc = esc;

/* ===========================================================
   🔥 STOCK HELPERS
=========================================================== */
function findProduct(type, name) {
  return (window.stock || []).find(
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
  name = (name || "").trim();
  if (!name) return;
  if ((window.types || []).find(t => t.name.toLowerCase() === name.toLowerCase())) return;
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

  window.stock = window.stock || [];

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
    p.history = p.history || [];
    p.history.push({ date, qty, cost });
  }

  saveStock();
}
window.addStockEntry = addStockEntry;

/* ===========================================================
   🔥 LIMIT
=========================================================== */
function setGlobalLimit(v) { localStorage.setItem(KEY_LIMIT, v); }
function getGlobalLimit() { return Number(localStorage.getItem(KEY_LIMIT) || 0); }

window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ===========================================================
   🔥 WANTING
=========================================================== */
function autoAddWanting(type, name, note="Low Stock") {
  window.wanting = window.wanting || [];
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
   🔥 NET PROFIT CALCULATOR
=========================================================== */
window.getTotalNetProfit = function() {

  if (typeof window.getPendingSalesProfit === "function" &&
      typeof window.getPendingServiceProfit === "function") {

    const pendingSales   = Number(window.getPendingSalesProfit() || 0);
    const pendingService = Number(window.getPendingServiceProfit() || 0);

    const expenses = (window.expenses || [])
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    return (pendingSales + pendingService) - expenses;
  }

  let salesProfit = 0, serviceProfit = 0, expenses = 0;

  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  (window.services || []).forEach(s => serviceProfit += Number(s.profit || 0));
  (window.expenses || []).forEach(e => expenses += Number(e.amount || 0));

  return (salesProfit + serviceProfit) - expenses;
};

/* ===========================================================
   🔥 SUMMARY BAR
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
   🔥 CLOUD PULL (initial load)
=========================================================== */
async function cloudPullAllIfAvailable() {
  if (typeof window.cloudLoad !== "function") return;

  const user = getUserEmail();
  if (!user) return;

  const keys = [KEY_TYPES, KEY_STOCK, KEY_SALES, KEY_WANTING, KEY_EXPENSES, KEY_SERVICES];

  for (const key of keys) {
    const col = CLOUD_COLLECTIONS[key];
    try {
      const remote = await window.cloudLoad(col);
      if (Array.isArray(remote)) {
        window[keyToVarName(key)] = remote;
        localStorage.setItem(key, JSON.stringify(remote));
      }
    } catch {}
  }

  try { normalizeAllDates(); } catch {}
  try { renderTypes?.(); } catch {}
  try { renderStock?.(); } catch {}
  try { renderSales?.(); } catch {}
  try { renderWanting?.(); } catch {}
  try { renderExpenses?.(); } catch {}
  try { renderServiceTables?.(); } catch {}
  try { renderAnalytics?.(); } catch {}
  try { updateSummaryCards?.(); } catch {}
  try { updateTabSummaryBar?.(); } catch {}
}

function keyToVarName(key) {
  switch (key) {
    case KEY_TYPES: return "types";
    case KEY_STOCK: return "stock";
    case KEY_SALES: return "sales";
    case KEY_WANTING: return "wanting";
    case KEY_EXPENSES: return "expenses";
    case KEY_SERVICES: return "services";
  }
  return key;
}

/* ===========================================================
   🔥 STORAGE SYNC
=========================================================== */
window.addEventListener("storage", () => {
  window.types    = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  window.stock    = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  window.sales    = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  window.wanting  = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  window.expenses = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  window.services = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));

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

/* ===========================================================
   🔥 AUTO CLOUD LOAD
=========================================================== */
window.addEventListener("load", () => {
  setTimeout(cloudPullAllIfAvailable, 200);
});

/* ===========================================================
   🔵 UNIVERSAL INVESTMENT + PROFIT HELPERS (FINAL)
=========================================================== */

/* 1) TOTAL STOCK INVESTMENT (BEFORE SALE) */
window.getStockInvestmentCollected = function () {
  let total = 0;

  (window.stock || []).forEach(p => {
    if (p.history?.length) {
      p.history.forEach(h => {
        total += Number(h.cost || 0) * Number(h.qty || 0);
      });
    } else {
      total += Number(p.cost || 0) * Number(p.qty || 0);
    }
  });

  return total;
};

/* 2) STOCK INVESTMENT (AFTER SALE) - REMAIN ONLY */
window.getStockInvestmentAfterSale = function () {
  let total = 0;

  (window.stock || []).forEach(p => {
    const qty   = Number(p.qty || 0);
    const sold  = Number(p.sold || 0);
    const cost  = Number(p.cost || 0);
    const remain = qty - sold;
    if (remain > 0) total += remain * cost;
  });

  return total;
};

/* 3) SALES INVESTMENT (sold qty × cost) */
window.getSalesInvestmentCollected = function () {
  return (window.sales || [])
    .reduce((t, s) => t + (Number(s.qty || 0) * Number(s.cost || 0)), 0);
};

/* 4) SALES PROFIT */
window.getSalesProfitCollected = function () {
  return (window.sales || [])
    .filter(s => String(s.status || "").toLowerCase() !== "credit")
    .reduce((t, s) => t + Number(s.profit || 0), 0);
};

/* 5) SERVICE INVESTMENT (Completed only) */
window.getServiceInvestmentCollected = function () {
  return (window.services || [])
    .filter(s => s.status === "Completed")
    .reduce((t, s) => t + Number(s.invest || 0), 0);
};

/* 6) SERVICE PROFIT */
window.getServiceProfitCollected = function () {
  return (window.services || [])
    .filter(s => s.status === "Completed")
    .reduce((t, s) => t + Number(s.profit || 0), 0);
};

/* ===========================================================
   🔵 BACKWARD COMPAT — AUTO ADD
=========================================================== */
window.addSalesProfit = function (amt) {
  const b = JSON.parse(localStorage.getItem("ks-profit-box") || "{}");
  b.salesProfit = (b.salesProfit || 0) + Number(amt || 0);
  localStorage.setItem("ks-profit-box", JSON.stringify(b));
};

window.addStockInvestment = function (amt) {
  const b = JSON.parse(localStorage.getItem("ks-profit-box") || "{}");
  b.stockInvestment = (b.stockInvestment || 0) + Number(amt || 0);
  localStorage.setItem("ks-profit-box", JSON.stringify(b));
};

window.addServiceInvestment = function (amt) {
  const b = JSON.parse(localStorage.getItem("ks-profit-box") || "{}");
  b.serviceInvestment = (b.serviceInvestment || 0) + Number(amt || 0);
  localStorage.setItem("ks-profit-box", JSON.stringify(b));
};

window.addServiceProfit = function (amt) {
  const b = JSON.parse(localStorage.getItem("ks-profit-box") || "{}");
  b.serviceProfit = (b.serviceProfit || 0) + Number(amt || 0);
  localStorage.setItem("ks-profit-box", JSON.stringify(b));
};
