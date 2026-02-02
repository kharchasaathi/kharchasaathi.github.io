/* ===========================================================
   📌 core.js — Master Engine (ONLINE ONLY — FINAL v14 CLEAN)
   ⭐ Core Infra Only (NO Net Profit / Offset Logic)
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
function safeParse(raw){ try{ return JSON.parse(raw);}catch{ return [];} }
function toArray(v){ return Array.isArray(v) ? v : []; }

/* ===========================================================
   DATE HELPERS
=========================================================== */
function toDisplay(d){
  if(!d || typeof d!=="string" || !d.includes("-")) return d||"";
  const p=d.split("-");
  return (p.length===3 && p[0].length===4) ? `${p[2]}-${p[1]}-${p[0]}` : d;
}
function toInternal(d){
  if(!d || typeof d!=="string") return d||"";
  const p=d.split("-");
  if(p.length===3 && p[0].length===2) return `${p[2]}-${p[1]}-${p[0]}`;
  return d;
}
function toInternalIfNeeded(d){
  if(!d) return "";
  return (d.length>=10 && d[4]==="-") ? d : toInternal(d);
}
window.toDisplay = toDisplay;
window.toInternal = toInternal;
window.toInternalIfNeeded = toInternalIfNeeded;

/* ===========================================================
   BASIC HELPERS
=========================================================== */
function todayDate(){
  const d=new Date();
  d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate=todayDate;

function uid(p="id"){ return `${p}_${Math.random().toString(36).slice(2,10)}`;}
window.uid=uid;

function esc(t){
  return String(t||"").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}
window.esc=esc;

/* ===========================================================
   LOAD LOCAL CACHE
=========================================================== */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

function ensureArrays(){
  if(!Array.isArray(types)) types=[];
  if(!Array.isArray(stock)) stock=[];
  if(!Array.isArray(sales)) sales=[];
  if(!Array.isArray(wanting)) wanting=[];
  if(!Array.isArray(expenses)) expenses=[];
  if(!Array.isArray(services)) services=[];
  if(!Array.isArray(collections)) collections=[];
}
ensureArrays();

/* ===========================================================
   NORMALIZE DATES
=========================================================== */
function normalizeAllDates(){
  stock = stock.map(s=>({...s,date:toInternalIfNeeded(s.date)}));
  sales = sales.map(s=>({...s,date:toInternalIfNeeded(s.date)}));
  expenses = expenses.map(e=>({...e,date:toInternalIfNeeded(e.date)}));
  wanting = wanting.map(w=>({...w,date:toInternalIfNeeded(w.date)}));
  services = services.map(j=>({...j,
    date_in:toInternalIfNeeded(j.date_in),
    date_out:toInternalIfNeeded(j.date_out)
  }));
  collections = collections.map(c=>({...c,date:toInternalIfNeeded(c.date)}));
}
normalizeAllDates();

/* ===========================================================
   SAVE HELPERS
=========================================================== */
function _localSave(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} }

function saveTypes(){ _localSave(KEY_TYPES,types); cloudSync(KEY_TYPES,types); }
function saveStock(){ _localSave(KEY_STOCK,stock); cloudSync(KEY_STOCK,stock); }
function saveSales(){ _localSave(KEY_SALES,sales); cloudSync(KEY_SALES,sales); }
function saveWanting(){ _localSave(KEY_WANTING,wanting); cloudSync(KEY_WANTING,wanting); }
function saveExpenses(){ _localSave(KEY_EXPENSES,expenses); cloudSync(KEY_EXPENSES,expenses); }
function saveServices(){ _localSave(KEY_SERVICES,services); cloudSync(KEY_SERVICES,services); }
function saveCollections(){ _localSave(KEY_COLLECTIONS,collections); cloudSync(KEY_COLLECTIONS,collections); }

Object.assign(window,{
  saveTypes,saveStock,saveSales,saveWanting,
  saveExpenses,saveServices,saveCollections
});

/* ===========================================================
   BUSINESS BASE (Types / Stock / Wanting / Expenses)
=========================================================== */
window.addType = function(name){
  name=(name||"").trim();
  if(!name || types.find(t=>t.name.toLowerCase()===name.toLowerCase())) return;
  types.push({id:uid("type"),name});
  saveTypes();
};

window.findProduct = (type,name)=>stock.find(
  p=>p.type===type && String(p.name||"").toLowerCase()===String(name||"").toLowerCase()
);

window.getProductCost = function(type,name){
  const p=findProduct(type,name);
  if(!p) return 0;
  if(p.cost) return Number(p.cost);
  if(p.history?.length){
    let t=0,q=0;
    p.history.forEach(h=>{t+=h.cost*h.qty;q+=h.qty;});
    return q?t/q:0;
  }
  return 0;
};

window.addStockEntry = function({date,type,name,qty,cost}){
  date=toInternalIfNeeded(date); qty=+qty; cost=+cost;
  if(!type||!name||qty<=0||cost<=0) return;
  let p=findProduct(type,name);
  if(!p){
    stock.push({
      id:uid("stk"),date,type,name,qty,cost,
      sold:0,limit:getGlobalLimit(),
      history:[{date,qty,cost}]
    });
  }else{
    p.qty+=qty; p.cost=cost;
    p.history=p.history||[];
    p.history.push({date,qty,cost});
  }
  saveStock();
};

window.setGlobalLimit=v=>localStorage.setItem(KEY_LIMIT,v);
window.getGlobalLimit=()=>Number(localStorage.getItem(KEY_LIMIT)||0);

window.autoAddWanting=function(type,name,note="Low Stock"){
  if(!wanting.find(w=>w.type===type&&w.name===name)){
    wanting.push({id:uid("want"),date:todayDate(),type,name,note});
    saveWanting();
  }
};

window.addExpense=function({date,category,amount,note}){
  expenses.push({
    id:uid("exp"),
    date:toInternalIfNeeded(date||todayDate()),
    category,amount:+amount||0,note:note||""
  });
  saveExpenses();
};
/* ===========================================================
   CLOUD SYNC WRAPPER
=========================================================== */
window.cloudSync=function(key,data){
  if(typeof cloudSaveDebounced!=="function") return;
  const map={
    [KEY_TYPES]:"types",
    [KEY_STOCK]:"stock",
    [KEY_SALES]:"sales",
    [KEY_WANTING]:"wanting",
    [KEY_EXPENSES]:"expenses",
    [KEY_SERVICES]:"services",
    [KEY_COLLECTIONS]:"collections"
  };
  const col=map[key];
  if(col) cloudSaveDebounced(col,data||[]);
};

function keyToVarName(key){
  return {
    [KEY_TYPES]:"types",
    [KEY_STOCK]:"stock",
    [KEY_SALES]:"sales",
    [KEY_WANTING]:"wanting",
    [KEY_EXPENSES]:"expenses",
    [KEY_SERVICES]:"services",
    [KEY_COLLECTIONS]:"collections"
  }[key];
}

/* ===========================================================
   CLOUD PULL
=========================================================== */
window.cloudPullAllIfAvailable=async function(){
  if(typeof cloudLoad!=="function") return;

  let email="";
  try{ email=getFirebaseUser?.()?.email||"";}catch{}
  if(!email) email=localStorage.getItem(KEY_USER_EMAIL)||"";
  if(!email){ updateEmailTag(); return; }

  for(const key of Object.keys(CLOUD_COLLECTIONS)){
    try{
      const arr=toArray(await cloudLoad(CLOUD_COLLECTIONS[key]));
      window[keyToVarName(key)]=arr;
      localStorage.setItem(key,JSON.stringify(arr));
    }catch{
      window[keyToVarName(key)]=toArray(safeParse(localStorage.getItem(key)));
    }
  }

  ensureArrays();
  normalizeAllDates();

  [
    "renderTypes","renderStock","renderSales",
    "renderWanting","renderExpenses",
    "renderServiceTables","renderAnalytics",
    "renderCollection","updateSummaryCards",
    "updateUniversalBar","updateEmailTag"
  ].forEach(fn=>{ try{window[fn]?.();}catch{} });
};

/* ===========================================================
   AUTO INIT
=========================================================== */
window.addEventListener("load",()=>{
  setTimeout(()=>{
    cloudPullAllIfAvailable();
    updateEmailTag();
    updateUniversalBar?.();
  },300);
});

/* ===========================================================
   STORAGE EVENT SYNC
=========================================================== */
window.addEventListener("storage",()=>{
  types=toArray(safeParse(localStorage.getItem(KEY_TYPES)));
  stock=toArray(safeParse(localStorage.getItem(KEY_STOCK)));
  sales=toArray(safeParse(localStorage.getItem(KEY_SALES)));
  wanting=toArray(safeParse(localStorage.getItem(KEY_WANTING)));
  expenses=toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
  services=toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
  collections=toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

  ensureArrays();
  normalizeAllDates();

  ["renderStock","renderSales","renderExpenses",
   "renderServiceTables","renderAnalytics",
   "renderCollection","updateSummaryCards",
   "updateUniversalBar","updateEmailTag"
  ].forEach(fn=>{ try{window[fn]?.();}catch{} });
});

/* ===========================================================
   INVESTMENT HELPERS (USED BY ANALYTICS / UNIVERSAL BAR)
=========================================================== */
window.getStockInvestmentAfterSale=()=>stock.reduce(
  (t,p)=>t+Number(p.sold||0)*Number(p.cost||0),0
);

window.getSalesProfitCollected=()=>sales
  .filter(s=>String(s.status||"").toLowerCase()!=="credit")
  .reduce((t,s)=>t+Number(s.profit||0),0);

window.getServiceProfitCollected=()=>services
  .filter(s=>String(s.status||"").toLowerCase()==="completed")
  .reduce((t,s)=>t+Number(s.profit||0),0);

/* ===========================================================
   EMAIL TAG
=========================================================== */
window.updateEmailTag=function(){
  const el=document.getElementById("emailTag");
  if(!el) return;
  let email="";
  try{ email=getFirebaseUser?.()?.email||"";}catch{}
  if(!email) email=localStorage.getItem(KEY_USER_EMAIL)||"";
  el.textContent=email||"Offline (Local Mode)";
};
