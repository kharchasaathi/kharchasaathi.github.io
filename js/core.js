/* ===========================================================
   📌 core.js — Master Engine (v7.1) Cloud-enabled (Option A)
   ✔ Per-module Firestore collections (types, stock, sales, wanting, expenses, services)
   ✔ Debounced cloud saves (uses window.cloudSaveDebounced)
   ✔ Initial cloud load on app start (if logged in)
   ✔ Local date handling (no UTC drift)
   ✔ Safe parse + normalize dates
=========================================================== */

/* ---------- STORAGE KEYS & COLLECTION NAMES ---------- */
const KEY_TYPES      = "item-types";
const KEY_STOCK      = "stock-data";
const KEY_SALES      = "sales-data";
const KEY_WANTING    = "wanting-data";
const KEY_EXPENSES   = "expenses-data";
const KEY_SERVICES   = "service-data";
const KEY_LIMIT      = "default-limit";
const KEY_USER_EMAIL = "ks-user-email";

/* Map keys -> firestore collection names (Option A) */
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
   🔥 LOAD ARRAYS (from localStorage initially)
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

try { normalizeAllDates(); } catch(e){ console.warn("normalizeAllDates failed", e); }

/* ===========================================================
   🔥 LOGIN SYSTEM (local)
=========================================================== */
function loginUser(email) {
  if (!email || !email.includes("@")) return false;
  localStorage.setItem(KEY_USER_EMAIL, email);
  // after login, trigger cloud pull (if firebase available)
  cloudPullAllIfAvailable();
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
   🔥 SAVE HELPERS (localStorage + debounced cloud save)
   - Uses window.cloudSaveDebounced(collectionName, data) if available
=========================================================== */
function _localSave(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("LocalStorage save failed for", key, e);
  }
}

function _cloudSaveIfPossible(key, data) {
  try {
    const col = CLOUD_COLLECTIONS[key];
    if (!col) return;
    if (typeof window.cloudSaveDebounced === "function") {
      window.cloudSaveDebounced(col, data);
      console.log(`cloudSaveDebounced queued for ${col}`);
    } else {
      // fallback: attempt immediate cloudSave if available
      if (typeof window.cloudSave === "function") {
        window.cloudSave(col, data).catch(e => console.warn("cloudSave fallback failed", e));
      }
    }
  } catch (e) {
    console.warn("cloud save skipped", e);
  }
}

function saveTypes() {
  _localSave(KEY_TYPES, window.types);
  _cloudSaveIfPossible(KEY_TYPES, window.types);
}
function saveStock() {
  _localSave(KEY_STOCK, window.stock);
  _cloudSaveIfPossible(KEY_STOCK, window.stock);
}
function saveSales() {
  _localSave(KEY_SALES, window.sales);
  _cloudSaveIfPossible(KEY_SALES, window.sales);
}
function saveWanting() {
  _localSave(KEY_WANTING, window.wanting);
  _cloudSaveIfPossible(KEY_WANTING, window.wanting);
}
function saveExpenses() {
  _localSave(KEY_EXPENSES, window.expenses);
  _cloudSaveIfPossible(KEY_EXPENSES, window.expenses);
}
function saveServices() {
  _localSave(KEY_SERVICES, window.services);
  _cloudSaveIfPossible(KEY_SERVICES, window.services);
}

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
  const d = new Date();
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
  name = (name || "").trim();
  if (!name) return;
  if ((window.types || []).find(t => (t.name || "").toLowerCase() === name.toLowerCase())) return;
  window.types = window.types || [];
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
  window.expenses = window.expenses || [];
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
=========================================================== */
window.getTotalNetProfit = function() {
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
   🔥 CLOUD PULL (initial load) - Option A
   For each collection, if cloud data exists, replace localStorage and memory.
   This runs automatically on app load if cloud functions are available.
=========================================================== */
async function cloudPullAllIfAvailable() {
  if (typeof window.cloudLoad !== "function") {
    console.log("cloudLoad not available — skipping cloud pull");
    return;
  }

  // Require user email (avoid pulling for guest)
  const user = getUserEmail();
  if (!user) {
    console.log("No logged-in user — skipping cloud pull");
    return;
  }

  console.log("Attempting cloud pull for all collections...");

  const keys = [KEY_TYPES, KEY_STOCK, KEY_SALES, KEY_WANTING, KEY_EXPENSES, KEY_SERVICES];

  for (const key of keys) {
    const col = CLOUD_COLLECTIONS[key];
    try {
      const remote = await window.cloudLoad(col);
      if (remote && Array.isArray(remote)) {
        // remote is an array — replace local
        window[keyToVarName(key)] = remote;
        localStorage.setItem(key, JSON.stringify(remote));
        console.log(`Cloud -> Local sync: ${col} (${remote.length} items)`);
      } else if (remote && typeof remote === "object") {
        // some implementations may store under `.data` or object; try to smart-merge
        // If remote contains an array under the same key name, use it.
        // Otherwise try each known property.
        let used = false;
        if (Array.isArray(remote.items)) {
          window[keyToVarName(key)] = remote.items;
          localStorage.setItem(key, JSON.stringify(remote.items));
          used = true;
        } else {
          // fallback: look for any property that is array
          for (const k in remote) {
            if (Array.isArray(remote[k])) {
              window[keyToVarName(key)] = remote[k];
              localStorage.setItem(key, JSON.stringify(remote[k]));
              used = true;
              break;
            }
          }
        }
        if (used) console.log(`Cloud -> Local sync (object) for ${col}`);
      } else {
        console.log(`No cloud data for ${col}`);
      }
    } catch (e) {
      console.warn(`cloudLoad failed for ${col}`, e);
    }
  }

  // Ensure normalized and render
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
    default: return key;
  }
}

/* ===========================================================
   🔥 STORAGE SYNC (auto refresh when localStorage changes)
=========================================================== */
window.addEventListener("storage", () => {
  try {
    window.types     = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
    window.stock     = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
    window.sales     = toArray(safeParse(localStorage.getItem(KEY_SALES)));
    window.wanting   = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
    window.expenses  = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
    window.services  = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
  } catch (e) {
    console.warn("storage event parsing failed", e);
  }

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
   🔥 AUTO CLOUD PULL ON LOAD (if logged-in)
=========================================================== */
window.addEventListener("load", () => {
  // Delay slightly to let firebase.js load (if present)
  setTimeout(() => {
    cloudPullAllIfAvailable();
  }, 200);
});
/* ===========================================================
   🔵 NEW: UNIVERSAL INVESTMENT + PROFIT COLLECTORS
=========================================================== */

/* ----------------------------------------
   1) STOCK INVESTMENT (total purchase cost)
----------------------------------------- */
window.getStockInvestmentCollected = function () {
  let total = 0;

  (window.stock || []).forEach(p => {
    if (p.history && p.history.length) {
      p.history.forEach(h => {
        total += Number(h.cost || 0) * Number(h.qty || 0);
      });
    } else {
      total += Number(p.cost || 0) * Number(p.qty || 0);
    }
  });

  return total;
};

/* ----------------------------------------
   2) SALES INVESTMENT (sold qty × cost)
   (this excludes unsold stock)
----------------------------------------- */
window.getSalesInvestmentCollected = function () {
  let total = 0;

  (window.sales || []).forEach(s => {
    const costPerItem = Number(s.cost || 0);   // from stock.js
    const qty = Number(s.qty || 0);
    total += qty * costPerItem;
  });

  return total;
};

/* ----------------------------------------
   3) SALES PROFIT COLLECTED
----------------------------------------- */
window.getSalesProfitCollected = function () {
  let total = 0;

  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() !== "credit") {
      total += Number(s.profit || 0);
    }
  });

  return total;
};

/* ----------------------------------------
   4) SERVICE INVESTMENT (completed only)
----------------------------------------- */
window.getServiceInvestmentCollected = function () {
  let total = 0;

  (window.services || []).forEach(s => {
    if (s.status === "Completed") {
      total += Number(s.invest || 0);
    }
  });

  return total;
};

/* ----------------------------------------
   5) SERVICE PROFIT (completed only)
----------------------------------------- */
window.getServiceProfitCollected = function () {
  let total = 0;

  (window.services || []).forEach(s => {
    if (s.status === "Completed") {
      total += Number(s.profit || 0);
    }
  });

  return total;
};
