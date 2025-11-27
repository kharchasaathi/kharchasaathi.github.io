/* ===========================================================
   📌 core.js — Master Engine (FINAL V8.0)
   ✔ FULL Collection Module Integrated
   ✔ Cloud Sync for Collections
   ✔ Stock/Service Investment Helpers
   ✔ Safe Date Converter
   ✔ Fully Synced With All JS Files
=========================================================== */

/* ---------- STORAGE KEYS ---------- */
const KEY_TYPES        = "item-types";
const KEY_STOCK        = "stock-data";
const KEY_SALES        = "sales-data";
const KEY_WANTING      = "wanting-data";
const KEY_EXPENSES     = "expenses-data";
const KEY_SERVICES     = "service-data";
const KEY_COLLECTIONS  = "ks-collections";   // ⭐ NEW
const KEY_LIMIT        = "default-limit";
const KEY_USER_EMAIL   = "ks-user-email";

/* ---------- CLOUD COLLECTION NAMES ---------- */
const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:       "types",
  [KEY_STOCK]:       "stock",
  [KEY_SALES]:       "sales",
  [KEY_WANTING]:     "wanting",
  [KEY_EXPENSES]:    "expenses",
  [KEY_SERVICES]:    "services",
  [KEY_COLLECTIONS]: "collections"  // ⭐ NEW (Cloud sync enabled)
};

/* ===========================================================
   SAFE HELPERS
=========================================================== */
function safeParse(raw) { try { return JSON.parse(raw); } catch { return []; } }
function toArray(v) { return Array.isArray(v) ? v : []; }

/* ===========================================================
   DATE HELPERS
=========================================================== */
function toDisplay(d) {
  if (!d) return "";
  if (d.includes("-")) {
    const [y,m,dd] = d.split("-");
    if (y.length === 4) return `${dd}-${m}-${y}`;
  }
  return d;
}

function toInternal(d) {
  if (!d) return "";
  if (!d.includes("-")) return d;
  const p = d.split("-");
  if (p[0].length === 2) {
    const [dd, m, y] = p;
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
   LOAD ALL MODULE DATA (LOCAL)
=========================================================== */
window.types        = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock        = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales        = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting      = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses     = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services     = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections  = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS))); // ⭐ NEW

function ensureArrays() {
  if (!Array.isArray(window.types))       window.types = [];
  if (!Array.isArray(window.stock))       window.stock = [];
  if (!Array.isArray(window.sales))       window.sales = [];
  if (!Array.isArray(window.wanting))     window.wanting = [];
  if (!Array.isArray(window.expenses))    window.expenses = [];
  if (!Array.isArray(window.services))    window.services = [];
  if (!Array.isArray(window.collections)) window.collections = []; // ⭐ NEW
}
ensureArrays();

/* ===========================================================
   NORMALIZE DATES
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

  if (window.collections)
    window.collections = window.collections.map(c => ({
      ...c,
      date: toInternalIfNeeded(c.date)
    }));
}
normalizeAllDates();

/* ===========================================================
   LOGIN
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
   SAVE HELPERS (LOCAL + CLOUD)
=========================================================== */
function _localSave(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
function _cloudSaveIfPossible(key, data){
  const col = CLOUD_COLLECTIONS[key];
  if (!col) return;
  try {
    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced(col, data);
    } else if (typeof cloudSave === "function") {
      cloudSave(col, data).catch(()=>{});
    }
  } catch {}
}

function saveTypes()      { _localSave(KEY_TYPES, types);         _cloudSaveIfPossible(KEY_TYPES, types); }
function saveStock()      { _localSave(KEY_STOCK, stock);         _cloudSaveIfPossible(KEY_STOCK, stock); }
function saveSales()      { _localSave(KEY_SALES, sales);         _cloudSaveIfPossible(KEY_SALES, sales); }
function saveWanting()    { _localSave(KEY_WANTING, wanting);     _cloudSaveIfPossible(KEY_WANTING, wanting); }
function saveExpenses()   { _localSave(KEY_EXPENSES, expenses);   _cloudSaveIfPossible(KEY_EXPENSES, expenses); }
function saveServices()   { _localSave(KEY_SERVICES, services);   _cloudSaveIfPossible(KEY_SERVICES, services); }
function saveCollections(){ _localSave(KEY_COLLECTIONS, collections); _cloudSaveIfPossible(KEY_COLLECTIONS, collections); } // ⭐ NEW

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;
window.saveServices = saveServices;
window.saveCollections = saveCollections;  // ⭐ NEW

/* ===========================================================
   BASICS
=========================================================== */
function todayDate(){
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p="id"){
  return p + "_" + Math.random().toString(36).slice(2,10);
}
window.uid = uid;

function esc(t){
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  }[m]));
}
window.esc = esc;

/* ===========================================================
   STOCK HELPERS
=========================================================== */
function findProduct(type, name) {
  return (window.stock || []).find(
    p => p.type === type &&
    String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
  );
}
window.findProduct = findProduct;

function getProductCost(type, name){
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history?.length){
    let t=0, q=0;
    p.history.forEach(h=>{
      t += Number(h.cost)*Number(h.qty);
      q += Number(h.qty);
    });
    return q ? (t/q) : 0;
  }
  return 0;
}
window.getProductCost = getProductCost;

/* ===========================================================
   ADD TYPE
=========================================================== */
function addType(name){
  name = (name||"").trim();
  if (!name) return;
  if (window.types.find(t => t.name.toLowerCase() === name.toLowerCase())) return;
  types.push({ id: uid("type"), name });
  saveTypes();
}
window.addType = addType;

/* ===========================================================
   ADD STOCK ENTRY
=========================================================== */
function addStockEntry({ date, type, name, qty, cost }) {
  date = toInternalIfNeeded(date);
  qty  = Number(qty);
  cost = Number(cost);

  if (!type || !name || qty<=0 || cost<=0) return;

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
}
window.addStockEntry = addStockEntry;

/* ===========================================================
   LIMIT
=========================================================== */
function setGlobalLimit(v){ localStorage.setItem(KEY_LIMIT,v); }
function getGlobalLimit(){ return Number(localStorage.getItem(KEY_LIMIT)||0); }
window.setGlobalLimit = setGlobalLimit;
window.getGlobalLimit = getGlobalLimit;

/* ===========================================================
   WANTING
=========================================================== */
function autoAddWanting(type,name,note="Low Stock"){
  if (!window.wanting.find(w => w.type===type && w.name===name)){
    wanting.push({
      id:uid("want"),
      date:todayDate(),
      type,name,note
    });
    saveWanting();
  }
}
window.autoAddWanting = autoAddWanting;

/* ===========================================================
   EXPENSE
=========================================================== */
function addExpense({date,category,amount,note}){
  expenses.push({
    id:uid("exp"),
    date:toInternalIfNeeded(date||todayDate()),
    category,
    amount:Number(amount||0),
    note:note||""
  });
  saveExpenses();
}
window.addExpense = addExpense;

/* ===========================================================
   NET PROFIT (Dynamic)
=========================================================== */
window.getTotalNetProfit = function(){
  let salesProfit = 0, serviceProfit = 0, exp = 0;

  sales.forEach(s=>{
    if ((s.status||"").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit||0);
    }
  });

  services.forEach(j => serviceProfit += Number(j.profit||0));

  expenses.forEach(e => exp += Number(e.amount||0));

  return (salesProfit + serviceProfit) - exp;
};

/* ===========================================================
   TAB SUMMARY BAR
=========================================================== */
window.updateTabSummaryBar = function(){
  const bar = qs("#tabSummaryBar");
  if (!bar) return;

  const net = window.getTotalNetProfit();

  if (net>=0){
    bar.style.background="#003300";
    bar.style.color="#fff";
    bar.textContent = `Profit: +₹${net}`;
  } else {
    bar.style.background="#330000";
    bar.style.color="#fff";
    bar.textContent = `Loss: -₹${Math.abs(net)}`;
  }
};

/* ===========================================================
   CLOUD PULL
=========================================================== */
async function cloudPullAllIfAvailable(){
  if (typeof cloudLoad !== "function") return;

  const user = getUserEmail();
  if (!user) return;

  const keys = [
    KEY_TYPES,
    KEY_STOCK,
    KEY_SALES,
    KEY_WANTING,
    KEY_EXPENSES,
    KEY_SERVICES,
    KEY_COLLECTIONS  // ⭐ NEW
  ];

  for (const key of keys){
    const col = CLOUD_COLLECTIONS[key];
    try{
      const remote = await cloudLoad(col);
      if (remote){
        const arr = toArray(remote);
        window[keyToVarName(key)] = arr;
        localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch {}
  }

  ensureArrays();
  normalizeAllDates();

  try{ renderTypes?.(); }catch{}
  try{ renderStock?.(); }catch{}
  try{ renderSales?.(); }catch{}
  try{ renderWanting?.(); }catch{}
  try{ renderExpenses?.(); }catch{}
  try{ renderServiceTables?.(); }catch{}
  try{ renderAnalytics?.(); }catch{}
  try{ updateSummaryCards?.(); }catch{}
  try{ updateTabSummaryBar?.(); }catch{}
}

function keyToVarName(key){
  switch(key){
    case KEY_TYPES: return "types";
    case KEY_STOCK: return "stock";
    case KEY_SALES: return "sales";
    case KEY_WANTING: return "wanting";
    case KEY_EXPENSES: return "expenses";
    case KEY_SERVICES: return "services";
    case KEY_COLLECTIONS: return "collections";
  }
  return key;
}

/* ===========================================================
   AUTO CLOUD LOAD
=========================================================== */
window.addEventListener("load",()=>{
  setTimeout(cloudPullAllIfAvailable,200);
});

/* ===========================================================
   STORAGE EVENTS (MULTI-TAB SYNC)
=========================================================== */
window.addEventListener("storage",()=>{
  types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
  collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS))); // ⭐ NEW

  ensureArrays();

  try{ renderTypes?.(); }catch{}
  try{ renderStock?.(); }catch{}
  try{ renderSales?.(); }catch{}
  try{ renderWanting?.(); }catch{}
  try{ renderExpenses?.(); }catch{}
  try{ renderServiceTables?.(); }catch{}
  try{ renderAnalytics?.(); }catch{}
  try{ updateSummaryCards?.(); }catch{}
  try{ updateTabSummaryBar?.(); }catch{}
});

/* ===========================================================
   UNIVERSAL INVESTMENT HELPERS
=========================================================== */

/* 1) TOTAL STOCK INVESTMENT (before sale) */
window.getStockInvestmentCollected = function(){
  let total=0;
  stock.forEach(p=>{
    if (p.history?.length){
      p.history.forEach(h => {
        total += Number(h.cost)*Number(h.qty);
      });
    } else {
      total += Number(p.cost) * Number(p.qty);
    }
  });
  return total;
};

/* 2) AFTER SALE – remaining only */
window.getStockInvestmentAfterSale = function(){
  let total=0;
  stock.forEach(p=>{
    const remain = Number(p.qty) - Number(p.sold||0);
    if (remain>0) total += remain * Number(p.cost);
  });
  return total;
};

/* 3) SALES INVESTMENT (sold qty × cost) */
window.getSalesInvestmentCollected = function(){
  return sales.reduce((t,s) =>
    t + (Number(s.qty||0) * Number(s.cost||0)), 0
  );
};

/* 4) SALES PROFIT (paid only) */
window.getSalesProfitCollected = function(){
  return sales
    .filter(s => (s.status||"").toLowerCase()!=="credit")
    .reduce((t,s)=>t+Number(s.profit||0),0);
};

/* 5) SERVICE INVESTMENT (Completed only) */
window.getServiceInvestmentCollected = function(){
  return services
    .filter(s => s.status==="Completed")
    .reduce((t,s)=>t+Number(s.invest||0),0);
};

/* 6) SERVICE PROFIT */
window.getServiceProfitCollected = function(){
  return services
    .filter(s => s.status==="Completed")
    .reduce((t,s)=>t+Number(s.profit||0),0);
};
