/* ===========================================================
   📌 core.js — Master Engine (v7.3) Cloud-enabled (Option A)
   ✔ Stock After Sale Investment (NEW)
   ✔ Service Investment (NEW)
   ✔ Fully synced with Profit tab + Analytics V3
   ✔ Per-module Firestore collections
   ✔ Safe date parse, normalize, localStorage sync
   ✔ GLOBAL qs/qsa FIXED (MOST IMPORTANT)
=========================================================== */

/* ===== GLOBAL QUERY HELPERS (EXTREMELY IMPORTANT) ===== */
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
function safeParse(raw) { try { return JSON.parse(raw); } catch { return []; } }
function toArray(v) { return Array.isArray(v) ? v : []; }

/* ===========================================================
   🔥 DATE CONVERTERS
=========================================================== */
function toDisplay(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;
  const [y,m,dd] = d.split("-");
  if (y.length === 4) return `${dd}-${m}-${y}`;
  return d;
}

function toInternal(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;
  const [dd,m,y] = d.split("-");
  if (dd.length === 2) return `${y}-${m}-${dd}`;
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
      date_in: toInternalIfNeeded(j.date_in),
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
window.loginUser = loginUser;
window.isLoggedIn = () => !!localStorage.getItem(KEY_USER_EMAIL);
window.getUserEmail = () => localStorage.getItem(KEY_USER_EMAIL) || "";
window.logoutUser = () => localStorage.removeItem(KEY_USER_EMAIL);

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
    if (window.cloudSaveDebounced) window.cloudSaveDebounced(col, data);
    else if (window.cloudSave) window.cloudSave(col, data).catch(()=>{});
  } catch {}
}

function saveTypes()    { _localSave(KEY_TYPES, window.types);     _cloudSaveIfPossible(KEY_TYPES, window.types); }
function saveStock()    { _localSave(KEY_STOCK, window.stock);     _cloudSaveIfPossible(KEY_STOCK, window.stock); }
function saveSales()    { _localSave(KEY_SALES, window.sales);     _cloudSaveIfPossible(KEY_SALES, window.sales); }
function saveWanting()  { _localSave(KEY_WANTING, window.wanting); _cloudSaveIfPossible(KEY_WANTING, window.wanting); }
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

window.esc = function (t){
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  }[m]));
};

/* ===========================================================
   🔥 STOCK HELPERS
=========================================================== */
function findProduct(type, name) {
  return (window.stock || []).find(
    p => p.type === type && p.name.toLowerCase() === name.toLowerCase()
  );
}
window.findProduct = findProduct;

window.getProductCost = function(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history?.length) {
    let t = 0, q = 0;
    p.history.forEach(h => { t += h.cost * h.qty; q += h.qty; });
    return q ? t/q : 0;
  }
  return 0;
};

/* ===========================================================
   🔥 ADD TYPE
=========================================================== */
window.addType = function(name) {
  name = (name || "").trim();
  if (!name) return;
  if ((window.types||[]).find(t => t.name.toLowerCase() === name.toLowerCase())) return;
  window.types.push({ id: uid("type"), name });
  saveTypes();
};

/* ===========================================================
   🔥 ADD STOCK ENTRY
=========================================================== */
window.addStockEntry = function({ date, type, name, qty, cost }) {
  date = toInternalIfNeeded(date);
  qty = Number(qty); cost = Number(cost);
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
      history: [{date, qty, cost}]
    };
    window.stock.push(p);
  } else {
    p.qty += qty;
    p.cost = cost;
    p.history.push({date, qty, cost});
  }
  saveStock();
};

/* ===========================================================
   🔥 LIMIT
=========================================================== */
window.setGlobalLimit = v => localStorage.setItem(KEY_LIMIT, v);
window.getGlobalLimit = () => Number(localStorage.getItem(KEY_LIMIT) || 0);

/* ===========================================================
   🔥 WANTING
=========================================================== */
window.autoAddWanting = function(type, name, note="Low Stock") {
  if (!window.wanting.find(w => w.type === type && w.name === name)) {
    window.wanting.push({
      id: uid("want"),
      date: todayDate(),
      type, name, note
    });
    saveWanting();
  }
};

/* ===========================================================
   🔥 EXPENSES
=========================================================== */
window.addExpense = function({ date, category, amount, note }) {
  window.expenses.push({
    id: uid("exp"),
    date: toInternalIfNeeded(date || todayDate()),
    category,
    amount: Number(amount),
    note: note || ""
  });
  saveExpenses();
};

/* ===========================================================
   🔥 NET PROFIT CALCULATOR
=========================================================== */
window.getTotalNetProfit = function() {
  let salesProfit = 0, serviceProfit = 0, expenses = 0;

  (window.sales||[])
    .filter(s => (s.status||"") !== "credit")
    .forEach(s => salesProfit += Number(s.profit||0));

  (window.services||[])
    .forEach(s => serviceProfit += Number(s.profit||0));

  (window.expenses||[])
    .forEach(e => expenses += Number(e.amount||0));

  return (salesProfit + serviceProfit) - expenses;
};

/* ===========================================================
   🔥 SUMMARY BAR
=========================================================== */
window.updateTabSummaryBar = function() {
  const bar = qs("#tabSummaryBar");
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
  if (!window.cloudLoad) return;
  const user = getUserEmail();
  if (!user) return;

  const keys = [KEY_TYPES, KEY_STOCK, KEY_SALES, KEY_WANTING, KEY_EXPENSES, KEY_SERVICES];

  for (const key of keys) {
    try {
      const remote = await cloudLoad(CLOUD_COLLECTIONS[key]);
      if (Array.isArray(remote)) {
        window[keyToVarName(key)] = remote;
        localStorage.setItem(key, JSON.stringify(remote));
      }
    } catch {}
  }

  normalizeAllDates();
  renderTypes?.(); renderStock?.(); renderSales?.();
  renderWanting?.(); renderExpenses?.(); renderServiceTables?.();
  renderAnalytics?.(); updateSummaryCards?.(); updateTabSummaryBar?.();
}

function keyToVarName(key){
  switch(key){
    case KEY_TYPES: return "types";
    case KEY_STOCK: return "stock";
    case KEY_SALES: return "sales";
    case KEY_WANTING:return "wanting";
    case KEY_EXPENSES:return "expenses";
    case KEY_SERVICES:return "services";
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

  renderTypes?.(); renderStock?.(); renderSales?.();
  renderWanting?.(); renderExpenses?.(); renderServiceTables?.();
  renderAnalytics?.(); updateSummaryCards?.(); updateTabSummaryBar?.();
});

/* ===========================================================
   🔥 AUTO CLOUD LOAD
=========================================================== */
window.addEventListener("load", () => {
  setTimeout(cloudPullAllIfAvailable, 200);
});

/* ===========================================================
   🔵 UNIVERSAL INVESTMENT + PROFIT HELPERS
=========================================================== */
window.getStockInvestmentCollected = function(){
  let t=0;
  (window.stock||[]).forEach(p=>{
    if (p.history?.length){
      p.history.forEach(h=> t += h.cost*h.qty );
    } else t+=p.cost*p.qty;
  });
  return t;
};

window.getStockInvestmentAfterSale = function(){
  let t=0;
  (window.stock||[]).forEach(p=>{
    const remain = p.qty - p.sold;
    if (remain>0) t+= remain*p.cost;
  });
  return t;
};

window.getSalesInvestmentCollected = ()=> (window.sales||[])
  .reduce((t,s)=>t+(s.qty*s.cost),0);

window.getSalesProfitCollected = ()=> (window.sales||[])
  .filter(s=>s.status!=="credit")
  .reduce((t,s)=>t+Number(s.profit||0),0);

window.getServiceInvestmentCollected = ()=> (window.services||[])
  .filter(s=>s.status==="Completed")
  .reduce((t,s)=>t+Number(s.invest||0),0);

window.getServiceProfitCollected = ()=> (window.services||[])
  .filter(s=>s.status==="Completed")
  .reduce((t,s)=>t+Number(s.profit||0),0);

/* ===========================================================
   🔵 BACKWARD COMPAT
=========================================================== */
window.addSalesProfit = amt => {
  const b = JSON.parse(localStorage.getItem("ks-profit-box")||"{}");
  b.salesProfit = (b.salesProfit||0)+Number(amt||0);
  localStorage.setItem("ks-profit-box",JSON.stringify(b));
};
window.addStockInvestment = amt => {
  const b=JSON.parse(localStorage.getItem("ks-profit-box")||"{}");
  b.stockInvestment=(b.stockInvestment||0)+Number(amt||0);
  localStorage.setItem("ks-profit-box",JSON.stringify(b));
};
window.addServiceInvestment = amt => {
  const b=JSON.parse(localStorage.getItem("ks-profit-box")||"{}");
  b.serviceInvestment=(b.serviceInvestment||0)+Number(amt||0);
  localStorage.setItem("ks-profit-box",JSON.stringify(b));
};
window.addServiceProfit = amt => {
  const b=JSON.parse(localStorage.getItem("ks-profit-box")||"{}");
  b.serviceProfit=(b.serviceProfit||0)+Number(amt||0);
  localStorage.setItem("ks-profit-box",JSON.stringify(b));
};
