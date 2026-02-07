/* ===========================================================
   📌 core.js — Master Engine (CLOUD ONLY — FINAL v16 PART 1)
   ⭐ Infra + Helpers + Business Base
   ⭐ Limit System Restored
   ❌ No LocalStorage dependency
=========================================================== */

/* ===========================================================
   CLOUD COLLECTION KEYS
=========================================================== */
const KEY_TYPES        = "types";
const KEY_STOCK        = "stock";
const KEY_SALES        = "sales";
const KEY_WANTING      = "wanting";
const KEY_EXPENSES     = "expenses";
const KEY_SERVICES     = "services";
const KEY_COLLECTIONS  = "collections";

/* ===========================================================
   SAFE HELPERS
=========================================================== */
function toArray(v){
  return Array.isArray(v) ? v : [];
}

/* ===========================================================
   DATE HELPERS
=========================================================== */
function toDisplay(d){
  if(!d || typeof d!=="string" || !d.includes("-")) return d||"";
  const p=d.split("-");
  return (p.length===3 && p[0].length===4)
    ? `${p[2]}-${p[1]}-${p[0]}`
    : d;
}

function toInternal(d){
  if(!d || typeof d!=="string") return d||"";
  const p=d.split("-");
  if(p.length===3 && p[0].length===2)
    return `${p[2]}-${p[1]}-${p[0]}`;
  return d;
}

function toInternalIfNeeded(d){
  if(!d) return "";
  return (d.length>=10 && d[4]==="-")
    ? d
    : toInternal(d);
}

window.toDisplay=toDisplay;
window.toInternal=toInternal;
window.toInternalIfNeeded=toInternalIfNeeded;

/* ===========================================================
   BASIC HELPERS
=========================================================== */
function todayDate(){
  const d=new Date();
  d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate=todayDate;

function uid(p="id"){
  return `${p}_${Math.random().toString(36).slice(2,10)}`;
}
window.uid=uid;

function esc(t){
  return String(t||"").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[m]));
}
window.esc=esc;

/* ===========================================================
   GLOBAL CLOUD DATA CONTAINERS
=========================================================== */
window.types=[];
window.stock=[];
window.sales=[];
window.wanting=[];
window.expenses=[];
window.services=[];
window.collections=[];

/* ===========================================================
   GLOBAL LIMIT SYSTEM (RESTORED)
=========================================================== */
window.globalLimit=0;

window.setGlobalLimit=function(v){
  globalLimit=Number(v)||0;
};

window.getGlobalLimit=function(){
  return Number(globalLimit||0);
};

/* ===========================================================
   ENSURE ARRAYS
=========================================================== */
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

  stock=stock.map(s=>({
    ...s,
    date:toInternalIfNeeded(s.date)
  }));

  sales=sales.map(s=>({
    ...s,
    date:toInternalIfNeeded(s.date)
  }));

  expenses=expenses.map(e=>({
    ...e,
    date:toInternalIfNeeded(e.date)
  }));

  wanting=wanting.map(w=>({
    ...w,
    date:toInternalIfNeeded(w.date)
  }));

  services=services.map(j=>({
    ...j,
    date_in:toInternalIfNeeded(j.date_in),
    date_out:toInternalIfNeeded(j.date_out)
  }));

  collections=collections.map(c=>({
    ...c,
    date:toInternalIfNeeded(c.date)
  }));
}

/* ===========================================================
   CLOUD SAVE WRAPPER
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

/* ===========================================================
   SAVE HELPERS (CLOUD ONLY)
=========================================================== */
function saveTypes(){cloudSync(KEY_TYPES,types);}
function saveStock(){cloudSync(KEY_STOCK,stock);}
function saveSales(){cloudSync(KEY_SALES,sales);}
function saveWanting(){cloudSync(KEY_WANTING,wanting);}
function saveExpenses(){cloudSync(KEY_EXPENSES,expenses);}
function saveServices(){cloudSync(KEY_SERVICES,services);}
function saveCollections(){cloudSync(KEY_COLLECTIONS,collections);}

Object.assign(window,{
  saveTypes,saveStock,saveSales,
  saveWanting,saveExpenses,
  saveServices,saveCollections
});

/* ===========================================================
   BUSINESS BASE — TYPES
=========================================================== */
window.addType=function(name){

  name=(name||"").trim();

  if(!name ||
     types.find(t=>
       t.name.toLowerCase()===name.toLowerCase()
     )
  ) return;

  types.push({
    id:uid("type"),
    name
  });

  saveTypes();
};

/* ===========================================================
   PRODUCT HELPERS
=========================================================== */
window.findProduct=(type,name)=>
  stock.find(p=>
    p.type===type &&
    String(p.name||"").toLowerCase()===
    String(name||"").toLowerCase()
  );

window.getProductCost=function(type,name){

  const p=findProduct(type,name);
  if(!p) return 0;

  if(p.cost) return Number(p.cost);

  if(p.history?.length){
    let t=0,q=0;
    p.history.forEach(h=>{
      t+=h.cost*h.qty;
      q+=h.qty;
    });
    return q?t/q:0;
  }

  return 0;
};

/* ===========================================================
   STOCK ENTRY (LIMIT RESTORED)
=========================================================== */
window.addStockEntry=function({
  date,type,name,qty,cost
}){

  date=toInternalIfNeeded(date);
  qty=+qty;
  cost=+cost;

  if(!type||!name||qty<=0||cost<=0) return;

  let p=findProduct(type,name);

  if(!p){

    stock.push({
      id:uid("stk"),
      date,
      type,
      name,
      qty,
      cost,
      sold:0,
      limit:getGlobalLimit(),   // 🔥 RESTORED
      history:[{date,qty,cost}]
    });

  }else{

    p.qty+=qty;
    p.cost=cost;

    p.history=p.history||[];
    p.history.push({date,qty,cost});
  }

  saveStock();
};
/* ===========================================================
   📌 core.js — PART 2
   CLOUD PULL + INIT + RENDER SYNC
=========================================================== */

/* ===========================================================
   KEY → GLOBAL VAR MAP
=========================================================== */
function keyToVarName(key){
  return {
    types:"types",
    stock:"stock",
    sales:"sales",
    wanting:"wanting",
    expenses:"expenses",
    services:"services",
    collections:"collections"
  }[key];
}

/* ===========================================================
   ☁️ CLOUD PULL ENGINE
=========================================================== */
window.cloudPullAllIfAvailable=async function(){

  if(typeof cloudLoad!=="function") return;

  let email="";

  try{
    email=getFirebaseUser?.()?.email||"";
  }catch{}

  if(!email){
    console.warn("No user → Cloud pull skipped");
    return;
  }

  console.log("☁️ Pulling cloud data…");

  const keys=[
    "types",
    "stock",
    "sales",
    "wanting",
    "expenses",
    "services",
    "collections"
  ];

  for(const key of keys){

    try{

      const arr=toArray(
        await cloudLoad(key)
      );

      window[keyToVarName(key)]=arr;

    }catch(err){

      console.warn(
        "Cloud load failed →",
        key,
        err
      );

      window[keyToVarName(key)]=[];
    }
  }

  ensureArrays();
  normalizeAllDates();

  /* SAFE RENDERS */
  [
    "renderTypes",
    "renderStock",
    "renderSales",
    "renderWanting",
    "renderExpenses",
    "renderServiceTables",
    "renderCollection",
    "renderAnalytics",
    "updateSummaryCards",
    "updateUniversalBar",
    "updateTypeDropdowns"
  ].forEach(fn=>{
    try{window[fn]?.();}catch{}
  });

};

/* ===========================================================
   🔄 AUTH READY → CLOUD PULL
=========================================================== */
window.addEventListener("firebase-auth-ready",()=>{

  console.log("Auth ready → Pulling data");

  setTimeout(()=>{
    cloudPullAllIfAvailable();
  },200);

});

/* ===========================================================
   🚀 AUTO INIT
=========================================================== */
window.addEventListener("load",()=>{

  setTimeout(()=>{

    cloudPullAllIfAvailable();

    updateUniversalBar?.();
    updateSummaryCards?.();

  },300);

});

/* ===========================================================
   🔁 CLOUD DATA EVENT
=========================================================== */
window.addEventListener(
  "cloud-data-loaded",
  ()=>{

    ensureArrays();
    normalizeAllDates();

    [
      "renderTypes",
      "renderStock",
      "renderSales",
      "renderWanting",
      "renderExpenses",
      "renderServiceTables",
      "renderCollection",
      "renderAnalytics",
      "updateSummaryCards",
      "updateUniversalBar",
      "updateTypeDropdowns"
    ].forEach(fn=>{
      try{window[fn]?.();}catch{}
    });

  }
);

/* ===========================================================
   📊 INVESTMENT HELPERS
=========================================================== */
window.getStockInvestmentAfterSale=()=>
  stock.reduce(
    (t,p)=>
      t+Number(p.sold||0)*
        Number(p.cost||0),
    0
  );

window.getSalesProfitCollected=()=>
  sales
    .filter(s=>
      String(s.status||"")
        .toLowerCase()!=="credit"
    )
    .reduce(
      (t,s)=>t+Number(s.profit||0),
      0
    );

window.getServiceProfitCollected=()=>
  services
    .filter(s=>
      String(s.status||"")
        .toLowerCase()==="completed"
    )
    .reduce(
      (t,s)=>t+Number(s.profit||0),
      0
    );

/* ===========================================================
   📧 EMAIL TAG (CLOUD SESSION ONLY)
=========================================================== */
window.updateEmailTag=function(){

  const el=document.getElementById("emailTag");
  if(!el) return;

  let email="";

  try{
    email=getFirebaseUser?.()?.email||"";
  }catch{}

  el.textContent=email||"Not logged in";
};

/* ===========================================================
   🔒 AUTH EVENT BRIDGE
=========================================================== */
if(typeof auth!=="undefined"){

  auth.onAuthStateChanged(user=>{

    if(user){

      window.dispatchEvent(
        new Event("firebase-auth-ready")
      );

    }

  });

}

console.log(
  "⚙️ core.js v16 CLOUD ENGINE READY ✔"
);
