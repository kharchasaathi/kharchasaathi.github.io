/* ===========================================================
   📌 core.js — MASTER ENGINE (CLOUD SAFE — FINAL v19)
   PART 1 — INFRA + HELPERS + BUSINESS BASE
=========================================================== */

/* ===========================================================
   CLOUD COLLECTION KEYS
=========================================================== */
const KEY_TYPES       = "types";
const KEY_STOCK       = "stock";
const KEY_SALES       = "sales";
const KEY_WANTING     = "wanting";
const KEY_EXPENSES    = "expenses";
const KEY_SERVICES    = "services";
const KEY_COLLECTIONS = "collections";

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
window.todayDate=function(){
  const d=new Date();
  d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

window.uid=function(p="id"){
  return `${p}_${Math.random().toString(36).slice(2,10)}`;
};

window.esc=function(t){
  return String(t||"").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[m]));
};

/* ===========================================================
   GLOBAL DATA CONTAINERS
=========================================================== */
window.types=[];
window.stock=[];
window.sales=[];
window.wanting=[];
window.expenses=[];
window.services=[];
window.collections=[];

/* ===========================================================
   LIMIT SYSTEM
=========================================================== */
window.globalLimit=0;

window.setGlobalLimit=v=>{
  globalLimit=Number(v)||0;
};

window.getGlobalLimit=()=>
  Number(globalLimit||0);

/* ===========================================================
   ENSURE ARRAYS (INITIAL CALL RESTORED)
=========================================================== */
function ensureArrays(){

  [
    "types","stock","sales",
    "wanting","expenses",
    "services","collections"
  ].forEach(k=>{
    if(!Array.isArray(window[k]))
      window[k]=[];
  });
}
ensureArrays();

/* ===========================================================
   NORMALIZE DATES
=========================================================== */
function normalizeAllDates(){

  stock=stock.map(s=>({...s,date:toInternalIfNeeded(s.date)}));
  sales=sales.map(s=>({...s,date:toInternalIfNeeded(s.date)}));
  expenses=expenses.map(e=>({...e,date:toInternalIfNeeded(e.date)}));
  wanting=wanting.map(w=>({...w,date:toInternalIfNeeded(w.date)}));

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

  if(!window.__cloudReady){
    console.warn("⛔ Save blocked:",key);
    return;
  }

  if(typeof cloudSaveDebounced!=="function")
    return;

  cloudSaveDebounced(key,data||[]);
};

/* ===========================================================
   SAVE HELPERS
=========================================================== */
window.saveTypes       =()=>cloudSync(KEY_TYPES,types);
window.saveStock       =()=>cloudSync(KEY_STOCK,stock);
window.saveSales       =()=>cloudSync(KEY_SALES,sales);
window.saveWanting     =()=>cloudSync(KEY_WANTING,wanting);
window.saveExpenses    =()=>cloudSync(KEY_EXPENSES,expenses);
window.saveServices    =()=>cloudSync(KEY_SERVICES,services);
window.saveCollections =()=>cloudSync(KEY_COLLECTIONS,collections);

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
   STOCK ENTRY
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
      date,type,name,qty,cost,
      sold:0,
      limit:getGlobalLimit(),
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
   CLOUD PULL + INIT + EVENTS + RENDER SYNC
=========================================================== */

/* ===========================================================
   KEY → VAR MAP
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
   FALLBACK CLOUD PULL
=========================================================== */
window.cloudPullAllIfAvailable=async function(){

  if(typeof cloudLoad!=="function") return;
  if(!window.__cloudReady) return;

  const keys=[
    "types","stock","sales",
    "wanting","expenses",
    "services","collections"
  ];

  for(const key of keys){

    try{
      const arr=toArray(await cloudLoad(key));
      window[keyToVarName(key)]=arr;
    }catch{
      window[keyToVarName(key)]=[];
    }
  }

  ensureArrays();
  normalizeAllDates();

  /* SAFE RENDER */
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
   AUTH READY → PULL (RESTORED)
=========================================================== */
window.addEventListener(
  "firebase-auth-ready",
  ()=>{

    console.log("Auth ready → Pulling data");

    setTimeout(()=>{
      cloudPullAllIfAvailable();
    },200);

  }
);

/* ===========================================================
   AUTO INIT (RESTORED)
=========================================================== */
window.addEventListener("load",()=>{

  setTimeout(()=>{

    cloudPullAllIfAvailable();

    updateUniversalBar?.();
    updateSummaryCards?.();

  },300);

});

/* ===========================================================
   CLOUD DATA EVENT
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
   INVESTMENT HELPERS
=========================================================== */
window.getStockInvestmentAfterSale=()=>
  stock.reduce(
    (t,p)=>t+Number(p.sold||0)*Number(p.cost||0),
    0
  );

window.getSalesProfitCollected=()=>
  sales
    .filter(s=>
      String(s.status||"").toLowerCase()!=="credit"
    )
    .reduce((t,s)=>t+Number(s.profit||0),0);

window.getServiceProfitCollected=()=>
  services
    .filter(s=>
      String(s.status||"").toLowerCase()==="completed"
    )
    .reduce((t,s)=>t+Number(s.profit||0),0);

/* ===========================================================
   EMAIL TAG
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
   AUTH BRIDGE
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
  "⚙️ core.js v19 CLOUD ENGINE READY ✔"
);
