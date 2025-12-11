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

/* ⭐ NEW — Net Profit Collected Offset Key */
const KEY_NET_COLLECTED = "ks-net-collected";

/* ---------- CLOUD COLLECTION NAMES ---------- */
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
  try { return JSON.parse(raw); }
  catch { return []; }
}

function toArray(v) { return Array.isArray(v) ? v : []; }

/* ===========================================================
   DATE HELPERS — Internal YYYY-MM-DD
=========================================================== */
function toDisplay(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;
  if (!d.includes("-")) return d;

  const p = d.split("-");
  if (p.length === 3 && p[0].length === 4) {
    return `${p[2]}-${p[1]}-${p[0]}`;
  }
  return d;
}

function toInternal(d) {
  if (!d) return "";
  if (typeof d !== "string") return d;
  const p = d.split("-");
  if (p.length !== 3) return d;

  if (p[0].length === 2 && p[2].length === 4) {
    const [dd, mm, yy] = p;
    return `${yy}-${mm}-${dd}`;
  }
  return d;
}

function toInternalIfNeeded(d) {
  if (!d) return "";
  if (d.length >= 10 && d[4] === "-") return d;
  return toInternal(d);
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
  return d.toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p="id") {
  return `${p}_${Math.random().toString(36).slice(2,10)}`;
}
window.uid = uid;

function esc(t) {
  return String(t||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}
window.esc = esc;

/* ===========================================================
   LOAD LOCAL CACHE (original behaviour preserved)
=========================================================== */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

window.collectedNetTotal =
  Number(localStorage.getItem(KEY_NET_COLLECTED) || 0);

function ensureArrays() {
  if (!Array.isArray(types))       types = [];
  if (!Array.isArray(stock))       stock = [];
  if (!Array.isArray(sales))       sales = [];
  if (!Array.isArray(wanting))     wanting = [];
  if (!Array.isArray(expenses))    expenses = [];
  if (!Array.isArray(services))    services = [];
  if (!Array.isArray(collections)) collections = [];
}
ensureArrays();

/* ===========================================================
   NORMALIZE ALL DATES
=========================================================== */
function normalizeAllDates() {
  stock = stock.map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));
  sales = sales.map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));
  expenses = expenses.map(e => ({ ...e, date: toInternalIfNeeded(e.date) }));
  wanting = wanting.map(w => ({ ...w, date: toInternalIfNeeded(w.date) }));

  services = services.map(j => ({
    ...j,
    date_in: toInternalIfNeeded(j.date_in),
    date_out: toInternalIfNeeded(j.date_out)
  }));

  collections = collections.map(c => ({
    ...c,
    date: toInternalIfNeeded(c.date)
  }));
}
normalizeAllDates();
/* ===========================================================
   SAVE HELPERS (LOCAL + CLOUD)
=========================================================== */
function _localSave(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch {}
}

function saveCollectedNetTotal() {
  try {
    localStorage.setItem(KEY_NET_COLLECTED, String(collectedNetTotal||0));
  } catch {}
}
window.saveCollectedNetTotal = saveCollectedNetTotal;

/* ---------- STANDARD SAVE WRAPPERS ---------- */
function saveTypes()       { _localSave(KEY_TYPES, types);       cloudSync(KEY_TYPES, types); }
function saveStock()       { _localSave(KEY_STOCK, stock);       cloudSync(KEY_STOCK, stock); }
function saveSales()       { _localSave(KEY_SALES, sales);       cloudSync(KEY_SALES, sales); }
function saveWanting()     { _localSave(KEY_WANTING, wanting);   cloudSync(KEY_WANTING, wanting); }
function saveExpenses()    { _localSave(KEY_EXPENSES, expenses); cloudSync(KEY_EXPENSES, expenses); }
function saveServices()    { _localSave(KEY_SERVICES, services); cloudSync(KEY_SERVICES, services); }
function saveCollections() { _localSave(KEY_COLLECTIONS, collections); cloudSync(KEY_COLLECTIONS, collections); }

window.saveTypes = saveTypes;
window.saveStock = saveStock;
window.saveSales = saveSales;
window.saveWanting = saveWanting;
window.saveExpenses = saveExpenses;
window.saveServices = saveServices;
window.saveCollections = saveCollections;

/* ===========================================================
   PART C — BUSINESS LOGIC (unchanged functionality)
=========================================================== */

/* ---------- TYPE MANAGEMENT ---------- */
function addType(name) {
  name = (name||"").trim();
  if (!name) return;
  if (types.find(t => t.name.toLowerCase() === name.toLowerCase())) return;

  types.push({ id: uid("type"), name });
  saveTypes();
}
window.addType = addType;

/* ---------- STOCK ---------- */
function findProduct(type, name) {
  return stock.find(p =>
    p.type === type &&
    String(p.name||"").toLowerCase() === String(name||"").toLowerCase()
  );
}
window.findProduct = findProduct;

function getProductCost(type, name) {
  const p = findProduct(type, name);
  if (!p) return 0;

  if (p.cost) return Number(p.cost);

  if (p.history?.length) {
    let t=0, q=0;
    p.history.forEach(h=>{
      t += Number(h.cost)*Number(h.qty);
      q += Number(h.qty);
    });
    return q ? t/q : 0;
  }
  return 0;
}
window.getProductCost = getProductCost;

function addStockEntry({date,type,name,qty,cost}) {
  date = toInternalIfNeeded(date);
  qty  = Number(qty);
  cost = Number(cost);

  if (!type||!name||qty<=0||cost<=0) return;

  let p = findProduct(type,name);

  if (!p){
    p = {
      id:uid("stk"),
      date,type,name,qty,cost,
      sold:0,
      limit:getGlobalLimit(),
      history:[{date,qty,cost}]
    };
    stock.push(p);
  } else {
    p.qty += qty;
    p.cost = cost;
    p.history = p.history||[];
    p.history.push({date,qty,cost});
  }

  saveStock();
}
window.addStockEntry = addStockEntry;

/* ---------- LOW STOCK LIMIT ---------- */
function setGlobalLimit(v){ localStorage.setItem(KEY_LIMIT,v); }
function getGlobalLimit(){ return Number(localStorage.getItem(KEY_LIMIT)||0); }
window.setGlobalLimit=setGlobalLimit;
window.getGlobalLimit=getGlobalLimit;

/* ---------- WANTING ---------- */
function autoAddWanting(type,name,note="Low Stock") {
  if (!wanting.find(w=>w.type===type && w.name===name)){
    wanting.push({
      id:uid("want"),
      date:todayDate(),
      type,name,note
    });
    saveWanting();
  }
}
window.autoAddWanting = autoAddWanting;

/* ---------- EXPENSES ---------- */
function addExpense({date,category,amount,note}) {
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
   NET PROFIT + SUMMARY BAR
=========================================================== */
window.getTotalNetProfit = function () {
  let salesProfit = 0, serviceProfit = 0, exp = 0;

  sales.forEach(s=>{
    if ((s.status||"").toLowerCase()!=="credit"){
      salesProfit += Number(s.profit||0);
    }
  });

  services.forEach(j=>{
    if ((j.status||"").toLowerCase()==="completed"){
      serviceProfit += Number(j.profit||0);
    }
  });

  expenses.forEach(e=>{
    exp += Number(e.amount||0);
  });

  const collectedOffset = Number(collectedNetTotal||0);
  return (salesProfit+serviceProfit-exp)-collectedOffset;
};

window.updateTabSummaryBar = function () {
  const bar = document.getElementById("tabSummaryBar");
  if (!bar) return;

  const net = window.getTotalNetProfit();
  bar.style.color="#fff";

  if (net>=0){
    bar.style.background="#003300";
    bar.textContent = `Profit: +₹${net}`;
  } else {
    bar.style.background="#330000";
    bar.textContent = `Loss: -₹${Math.abs(net)}`;
  }
};
/* ===========================================================
   CLOUD SYNC WRAPPER
=========================================================== */
window.cloudSync = function(key, data){
  if (typeof cloudSaveDebounced !== "function") return;

  const map = {
    [KEY_TYPES]: "types",
    [KEY_STOCK]: "stock",
    [KEY_SALES]: "sales",
    [KEY_WANTING]: "wanting",
    [KEY_EXPENSES]: "expenses",
    [KEY_SERVICES]: "services",
    [KEY_COLLECTIONS]: "collections"
  };

  const col = map[key];
  if (!col) return;

  cloudSaveDebounced(col, data || []);
};

/* ---------- LOCAL VAR NAME FOR GIVEN KEY ---------- */
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
   CLOUD PULL — ALWAYS SYNC SAFE VERSION
=========================================================== */
async function cloudPullAllIfAvailable() {
  if (typeof cloudLoad!=="function") return;

  let email = "";

  try{
    const u = getFirebaseUser?.();
    if (u?.email) email = u.email;
  } catch{}

  if (!email && window.getUserEmail){
    email = getUserEmail()||"";
  }
  if (!email) email = localStorage.getItem(KEY_USER_EMAIL)||"";

  if (!email){
    updateEmailTag();
    return;
  }

  const keys = [
    KEY_TYPES, KEY_STOCK, KEY_SALES, KEY_WANTING,
    KEY_EXPENSES, KEY_SERVICES, KEY_COLLECTIONS
  ];

  for (const key of keys){
    const col = CLOUD_COLLECTIONS[key];
    if (!col) continue;

    try{
      const remote = await cloudLoad(col);
      const arr = toArray(remote);
      const v = keyToVarName(key);

      window[v] = arr;
      localStorage.setItem(key, JSON.stringify(arr));
    }
    catch(e){
      const localArr = toArray(safeParse(localStorage.getItem(key)));
      const v = keyToVarName(key);
      window[v] = localArr;
    }
  }

  ensureArrays();
  normalizeAllDates();

  /* REFRESH ALL RENDER FUNCTIONS SAFELY */
  const calls = [
    "renderTypes","renderStock","renderSales","refreshSaleTypeSelector",
    "renderWanting","renderExpenses","renderServiceTables","renderAnalytics",
    "renderCollection","renderPendingCollections","updateSummaryCards",
    "updateTabSummaryBar","updateUniversalBar","updateEmailTag"
  ];

  calls.forEach(fn=>{
    try{ window[fn]?.(); }catch{}
  });
}

window.cloudPullAllIfAvailable = cloudPullAllIfAvailable;

/* AUTO RUN */
window.addEventListener("load", ()=>{
  setTimeout(()=>{
    try{ cloudPullAllIfAvailable(); }catch{}
    try{ updateEmailTag(); }catch{}
    try{ updateTabSummaryBar(); }catch{}
    try{ updateUniversalBar?.(); }catch{}
  },300);
});
/* ===========================================================
   STORAGE EVENT SYNC
=========================================================== */
window.addEventListener("storage", ()=>{
  types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
  wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
  collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));
  collectedNetTotal = Number(localStorage.getItem(KEY_NET_COLLECTED)||0);

  ensureArrays();
  normalizeAllDates();

  const calls = [
    "renderTypes","renderStock","renderSales","renderWanting","renderExpenses",
    "renderServiceTables","renderAnalytics","renderCollection",
    "renderPendingCollections","updateSummaryCards","updateTabSummaryBar",
    "updateUniversalBar","updateEmailTag"
  ];
  calls.forEach(fn=>{ try{window[fn]?.();}catch{} });
});

/* ===========================================================
   UNIVERSAL INVESTMENT HELPERS (unchanged)
=========================================================== */
window.getStockInvestmentCollected = function () {
  let total=0;
  stock.forEach(p=>{
    if (p.history?.length){
      p.history.forEach(h=>{
        total += Number(h.cost)*Number(h.qty);
      });
    } else {
      total += Number(p.cost||0)*Number(p.qty||0);
    }
  });
  return total;
};

window.getStockInvestmentAfterSale = function () {
  let total=0;
  stock.forEach(p=>{
    total += Number(p.sold||0) * Number(p.cost||0);
  });
  return total;
};

window.getSalesInvestmentCollected = function () {
  return sales.reduce((t,s)=> t + Number(s.qty||0)*Number(s.cost||0),0);
};

window.getSalesProfitCollected = function () {
  return sales
    .filter(s=>String(s.status||"").toLowerCase()!=="credit")
    .reduce((t,s)=> t + Number(s.profit||0), 0);
};

window.getServiceInvestmentCollected = function () {
  return services
    .filter(s=>String(s.status||"").toLowerCase()==="completed")
    .reduce((t,s)=> t + Number(s.invest||0), 0);
};

window.getServiceProfitCollected = function () {
  return services
    .filter(s=>String(s.status||"").toLowerCase()==="completed")
    .reduce((t,s)=> t + Number(s.profit||0), 0);
};

/* ===========================================================
   EMAIL TAG
=========================================================== */
window.updateEmailTag = function(){
  const el = document.getElementById("emailTag");
  if (!el) return;

  let email="";

  try{
    const u = getFirebaseUser?.();
    if (u?.email) email = u.email;
  }catch{}

  if (!email && window.getUserEmail){
    email = getUserEmail()||"";
  }

  if (!email){
    email = localStorage.getItem(KEY_USER_EMAIL)||"";
  }

  el.textContent = email || "Offline (Local Mode)";
};

try{ updateEmailTag(); }catch{}

