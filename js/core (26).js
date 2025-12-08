/* ===========================================================
   📌 core.js — Master Engine (ONLINE ONLY — FINAL V13)
   ⭐ With Net Offset System for Collected Profit
=========================================================== */

/* ---------- STORAGE KEYS ---------- */
const KEY_TYPES        = "item-types";
const KEY_STOCK        = "stock-data";
const KEY_SALES        = "sales-data";
const KEY_WANTING      = "wanting-data";
const KEY_EXPENSES     = "expenses-data";
const KEY_SERVICES     = "service-data";
const KEY_COLLECTIONS  = "ks-collections";
const KEY_LIMIT        = "default-limit";
const KEY_USER_EMAIL   = "ks-user-email";
/* ⭐ NEW — Net Profit Collected Offset Key (LOCAL ONLY) */
const KEY_NET_COLLECTED = "ks-net-collected";

/* ---------- CLOUD COLLECTION NAMES (Firestore Collections) ---------- */
const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:       "types",
  [KEY_STOCK]:       "stock",
  [KEY_SALES]:       "sales",
  [KEY_WANTING]:     "wanting",
  [KEY_EXPENSES]:    "expenses",
  [KEY_SERVICES]:    "services",
  [KEY_COLLECTIONS]: "collections"
};

/* ===========================================================
   SAFE HELPERS
=========================================================== */
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ===========================================================
   DATE HELPERS
   Internal: YYYY-MM-DD   Display: DD-MM-YYYY
=========================================================== */
function toDisplay(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;

  if (d.includes("-")) {
    const p = d.split("-");
    if (p.length === 3) {
      const [a, b, c] = p;
      if (a.length === 4) {
        return `${c}-${b}-${a}`; // YYYY-MM-DD → DD-MM-YYYY
      }
    }
  }
  return d;
}

function toInternal(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;
  if (!d.includes("-")) return d;

  const p = d.split("-");
  if (p.length !== 3) return d;

  // DD-MM-YYYY → YYYY-MM-DD
  if (p[0].length === 2 && p[2].length === 4) {
    const [dd, m, y] = p;
    return `${y}-${m}-${dd}`;
  }

  return d;
}

function toInternalIfNeeded(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;

  const p = d.split("-");
  if (p.length !== 3) return d;

  if (p[0].length === 4) return d;                // already YYYY-MM-DD
  if (p[0].length === 2 && p[2].length === 4)     // DD-MM-YYYY
    return toInternal(d);

  return d;
}

window.toDisplay = toDisplay;
window.toInternal = toInternal;
window.toInternalIfNeeded = toInternalIfNeeded;

/* ===========================================================
   BASIC HELPERS
=========================================================== */
function todayDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}
window.todayDate = todayDate;

function uid(p = "id") {
  return p + "_" + Math.random().toString(36).slice(2, 10);
}
window.uid = uid;

function esc(t) {
  return String(t || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
window.esc = esc;

/* ===========================================================
   LOAD ALL MODULE DATA (LOCAL CACHE)
=========================================================== */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

/* ⭐ NEW — Load collected net offset (number) */
window.collectedNetTotal = Number(localStorage.getItem(KEY_NET_COLLECTED) || 0);

/* Ensure always arrays */
function ensureArrays() {
  if (!Array.isArray(window.types))       window.types = [];
  if (!Array.isArray(window.stock))       window.stock = [];
  if (!Array.isArray(window.sales))       window.sales = [];
  if (!Array.isArray(window.wanting))     window.wanting = [];
  if (!Array.isArray(window.expenses))    window.expenses = [];
  if (!Array.isArray(window.services))    window.services = [];
  if (!Array.isArray(window.collections)) window.collections = [];
}
ensureArrays();

/* ===========================================================
   NORMALIZE DATES (convert everything to YYYY-MM-DD)
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

  if (window.services)
    window.services = window.services.map(j => ({
      ...j,
      date_in:  toInternalIfNeeded(j.date_in),
      date_out: toInternalIfNeeded(j.date_out)
    }));

  if (window.collections)
    window.collections = window.collections.map(c => ({
      ...c,
      date: toInternalIfNeeded(c.date)
    }));
}

normalizeAllDates();
/* ===========================================================
   SAVE HELPERS (LOCAL + CLOUD)
=========================================================== */
function _localSave(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

/* ⭐ NEW — SAVE NET COLLECTED OFFSET (NUMBER) */
function saveCollectedNetTotal() {
  try {
    localStorage.setItem(
      KEY_NET_COLLECTED,
      String(window.collectedNetTotal || 0)
    );
  } catch {}
}
window.saveCollectedNetTotal = saveCollectedNetTotal;

/* ---------- STANDARD SAVE WRAPPERS ---------- */
function saveTypes() {
  _localSave(KEY_TYPES, types);
  cloudSync(KEY_TYPES, types);
}
function saveStock() {
  _localSave(KEY_STOCK, stock);
  cloudSync(KEY_STOCK, stock);
}
function saveSales() {
  _localSave(KEY_SALES, sales);
  cloudSync(KEY_SALES, sales);
}
function saveWanting() {
  _localSave(KEY_WANTING, wanting);
  cloudSync(KEY_WANTING, wanting);
}
function saveExpenses() {
  _localSave(KEY_EXPENSES, expenses);
  cloudSync(KEY_EXPENSES, expenses);
}
function saveServices() {
  _localSave(KEY_SERVICES, services);
  cloudSync(KEY_SERVICES, services);
}
function saveCollections() {
  _localSave(KEY_COLLECTIONS, collections);
  cloudSync(KEY_COLLECTIONS, collections);
}

window.saveTypes       = saveTypes;
window.saveStock       = saveStock;
window.saveSales       = saveSales;
window.saveWanting     = saveWanting;
window.saveExpenses    = saveExpenses;
window.saveServices    = saveServices;
window.saveCollections = saveCollections;

/* ===========================================================
   PART C — BUSINESS LOGIC (Types / Stock / Wanting / Expenses)
=========================================================== */

/* ---------- TYPE MANAGEMENT ---------- */
function addType(name) {
  name = (name || "").trim();
  if (!name) return;

  if (types.find(t => t.name.toLowerCase() === name.toLowerCase())) return;

  types.push({
    id: uid("type"),
    name
  });

  saveTypes();
  cloudSync(KEY_TYPES, types);
}
window.addType = addType;

/* ---------- STOCK MANAGEMENT ---------- */
function findProduct(type, name) {
  return (stock || []).find(
    p =>
      p.type === type &&
      String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
  );
}
window.findProduct = findProduct;

function getProductCost(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history && p.history.length) {
    let t = 0, q = 0;
    p.history.forEach(h => {
      t += Number(h.cost) * Number(h.qty);
      q += Number(h.qty);
    });
    return q ? t / q : 0;
  }
  return 0;
}
window.getProductCost = getProductCost;

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
    stock.push(p);
  } else {
    p.qty += qty;
    p.cost = cost;
    p.history = p.history || [];
    p.history.push({ date, qty, cost });
  }

  saveStock();
  cloudSync(KEY_STOCK, stock);
}
window.addStockEntry = addStockEntry;

/* ---------- LOW STOCK LIMIT ---------- */
function setGlobalLimit(v) {
  localStorage.setItem(KEY_LIMIT, v);
}
function getGlobalLimit() {
  return Number(localStorage.getItem(KEY_LIMIT) || 0);
}
window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ---------- WANTING LIST ---------- */
function autoAddWanting(type, name, note = "Low Stock") {
  if (!wanting.find(w => w.type === type && w.name === name)) {
    wanting.push({
      id: uid("want"),
      date: todayDate(),
      type,
      name,
      note
    });

    saveWanting();
    cloudSync(KEY_WANTING, wanting);
  }
}
window.autoAddWanting = autoAddWanting;

/* ---------- EXPENSES ---------- */
function addExpense({ date, category, amount, note }) {
  expenses.push({
    id: uid("exp"),
    date: toInternalIfNeeded(date || todayDate()),
    category,
    amount: Number(amount || 0),
    note: note || ""
  });

  saveExpenses();
  cloudSync(KEY_EXPENSES, expenses);
}
window.addExpense = addExpense;

/* ===========================================================
   NET PROFIT (Dynamic Calculator with Net Offset)
=========================================================== */
window.getTotalNetProfit = function () {
  let salesProfit = 0,
      serviceProfit = 0,
      exp = 0;

  // Sales profits (only non-credit)
  (sales || []).forEach(s => {
    if ((s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  // Service profit (completed only)
  (services || []).forEach(j => {
    if ((j.status || "").toLowerCase() === "completed") {
      serviceProfit += Number(j.profit || 0);
    }
  });

  // Expenses
  (expenses || []).forEach(e => {
    exp += Number(e.amount || 0);
  });

  // ⭐ Minus already collected NET offset
  const collectedOffset = Number(window.collectedNetTotal || 0);

  return (salesProfit + serviceProfit - exp) - collectedOffset;
};

/* ===========================================================
   TAB SUMMARY BAR (Top Green/Red Bar)
=========================================================== */
window.updateTabSummaryBar = function () {
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
   PART D — CLOUD PULL + STORAGE SYNC + INVESTMENTS + EMAIL TAG
=========================================================== */
/* ===========================================================
   UNIVERSAL CLOUD SAVE WRAPPER  (REQUIRED)
=========================================================== */
window.cloudSync = function(key, data) {
  // If firebase/cloud is unavailable → silently skip
  if (typeof cloudSaveDebounced !== "function") return;

  // Firestore collection name mapping
  const map = {
    "item-types":      "types",
    "stock-data":      "stock",
    "sales-data":      "sales",
    "wanting-data":    "wanting",
    "expenses-data":   "expenses",
    "service-data":    "services",
    "ks-collections":  "collections"
  };

  const col = map[key];
  if (!col) return;

  cloudSaveDebounced(col, data || []);
};

/* -----------------------------------------------------------
   KEY → GLOBAL VAR NAME MAP
----------------------------------------------------------- */
function keyToVarName(key) {
  switch (key) {
    case KEY_TYPES:       return "types";
    case KEY_STOCK:       return "stock";
    case KEY_SALES:       return "sales";
    case KEY_WANTING:     return "wanting";
    case KEY_EXPENSES:    return "expenses";
    case KEY_SERVICES:    return "services";
    case KEY_COLLECTIONS: return "collections";
  }
  return key;
}

/* -----------------------------------------------------------
   CLOUD PULL — FIXED VERSION
   (Firestore → LocalStorage → Window Arrays)
   ⭐ ALWAYS SYNC — EVEN IF REMOTE IS EMPTY
----------------------------------------------------------- */
async function cloudPullAllIfAvailable() {
  if (typeof cloudLoad !== "function") return;

  let email = "";

  // 1) Firebase auth
  try {
    if (window.getFirebaseUser) {
      const u = getFirebaseUser();
      if (u && u.email) email = u.email;
    }
  } catch {}

  // 2) Local login (security.js)
  if (!email && window.getUserEmail) {
    email = getUserEmail() || "";
  }

  // 3) LocalStorage fallback
  if (!email) {
    email = localStorage.getItem(KEY_USER_EMAIL) || "";
  }

  // No email = offline mode
  if (!email) {
    updateEmailTag();
    return;
  }

  const keys = [
    KEY_TYPES,
    KEY_STOCK,
    KEY_SALES,
    KEY_WANTING,
    KEY_EXPENSES,
    KEY_SERVICES,
    KEY_COLLECTIONS
  ];

  for (const key of keys) {
    const col = CLOUD_COLLECTIONS[key];
    if (!col) continue;

    try {
      const remote = await cloudLoad(col);
      const arr = toArray(remote);

      const varName = keyToVarName(key);
      window[varName] = arr;
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.warn("Cloud pull failed for", key, e);

      const localArr = toArray(safeParse(localStorage.getItem(key)));
      const varName = keyToVarName(key);
      window[varName] = localArr;
    }
  }

  ensureArrays();
  normalizeAllDates();

  try { renderTypes?.(); }             catch {}
  try { renderStock?.(); }             catch {}
  try { renderSales?.(); }             catch {}
  try { refreshSaleTypeSelector?.(); } catch {}
  try { renderWanting?.(); }           catch {}
  try { renderExpenses?.(); }          catch {}
  try { renderServiceTables?.(); }     catch {}
  try { renderAnalytics?.(); }         catch {}
  try { renderCollection?.(); }        catch {}
  try { renderPendingCollections?.(); }catch {}
  try { updateSummaryCards?.(); }      catch {}
  try { updateTabSummaryBar?.(); }     catch {}
  try { updateUniversalBar?.(); }      catch {}
  try { updateEmailTag?.(); }          catch {}
}

window.cloudPullAllIfAvailable = cloudPullAllIfAvailable;

/* -----------------------------------------------------------
   AUTO CLOUD LOAD ON PAGE LOAD
----------------------------------------------------------- */
window.addEventListener("load", () => {
  setTimeout(() => {
    try { cloudPullAllIfAvailable(); }   catch {}
    try { updateEmailTag(); }            catch {}
    try { updateTabSummaryBar?.(); }     catch {}
    try { updateUniversalBar?.(); }      catch {}
  }, 300);
});
/* -----------------------------------------------------------
   STORAGE EVENTS (MULTI-TAB & LOCAL SYNC)
----------------------------------------------------------- */
window.addEventListener("storage", () => {
  window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
  window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));
  window.collectedNetTotal = Number(localStorage.getItem(KEY_NET_COLLECTED) || 0);

  ensureArrays();
  normalizeAllDates();

  try { renderTypes?.(); }             catch {}
  try { renderStock?.(); }             catch {}
  try { renderSales?.(); }             catch {}
  try { renderWanting?.(); }           catch {}
  try { renderExpenses?.(); }          catch {}
  try { renderServiceTables?.(); }     catch {}
  try { renderAnalytics?.(); }         catch {}
  try { renderCollection?.(); }        catch {}
  try { renderPendingCollections?.(); }catch {}
  try { updateSummaryCards?.(); }      catch {}
  try { updateTabSummaryBar?.(); }     catch {}
  try { updateUniversalBar?.(); }      catch {}
  try { updateEmailTag?.(); }          catch {}
});

/* -----------------------------------------------------------
   UNIVERSAL INVESTMENT HELPERS
----------------------------------------------------------- */

// 1) TOTAL STOCK INVESTMENT (before sale)
window.getStockInvestmentCollected = function () {
  let total = 0;
  (stock || []).forEach(p => {
    if (p.history && p.history.length) {
      p.history.forEach(h => {
        total += Number(h.cost) * Number(h.qty);
      });
    } else {
      total += Number(p.cost || 0) * Number(p.qty || 0);
    }
  });
  return total;
};

// 2) STOCK INVESTMENT (sold qty × cost only)
window.getStockInvestmentAfterSale = function () {
  let total = 0;
  (stock || []).forEach(p => {
    const sold = Number(p.sold || 0);
    const cost = Number(p.cost || 0);
    total += sold * cost;
  });
  return total;
};

// 3) SALES INVESTMENT (sold qty × cost)
window.getSalesInvestmentCollected = function () {
  return (sales || []).reduce(
    (t, s) => t + Number(s.qty || 0) * Number(s.cost || 0),
    0
  );
};

// 4) SALES PROFIT (paid only)
window.getSalesProfitCollected = function () {
  return (sales || [])
    .filter(s => (String(s.status || "").toLowerCase() !== "credit"))
    .reduce((t, s) => t + Number(s.profit || 0), 0);
};

// 5) SERVICE INVESTMENT (Completed only)
window.getServiceInvestmentCollected = function () {
  return (services || [])
    .filter(s => String(s.status || "").toLowerCase() === "completed")
    .reduce((t, s) => t + Number(s.invest || 0), 0);
};

// 6) SERVICE PROFIT (Completed only)
window.getServiceProfitCollected = function () {
  return (services || [])
    .filter(s => String(s.status || "").toLowerCase() === "completed")
    .reduce((t, s) => t + Number(s.profit || 0), 0);
};

/* -----------------------------------------------------------
   EMAIL TAG — TOPBAR STATUS
----------------------------------------------------------- */
window.updateEmailTag = function () {
  const el = document.getElementById("emailTag");
  if (!el) return;

  let email = "";

  try {
    if (window.getFirebaseUser) {
      const u = getFirebaseUser();
      if (u && u.email) email = u.email;
    }
  } catch {}

  if (!email && window.getUserEmail) {
    email = getUserEmail() || "";
  }

  if (!email) {
    email = localStorage.getItem(KEY_USER_EMAIL) || "";
  }

  el.textContent = email ? email : "Offline (Local mode)";
};

/* Run once */
try { updateEmailTag(); } catch {}
