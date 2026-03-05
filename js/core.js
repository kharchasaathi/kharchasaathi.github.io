/* ===========================================================
   core.js — FINAL v23 (HARDENED + CLOUD SAFE)
=========================================================== */

/* ===============================
   DOM HELPERS — GLOBAL SAFE
=============================== */

window.qs = s => document.querySelector(s);
window.qsa = s => Array.from(document.querySelectorAll(s));

/* CLOUD KEYS */
const KEY_TYPES="types";
const KEY_STOCK="stock";
const KEY_SALES="sales";
const KEY_WANTING="wanting";
const KEY_EXPENSES="expenses";
const KEY_SERVICES="services";
const KEY_COLLECTIONS="collections";

/* ARRAY SAFE */
const toArray=v=>Array.isArray(v)?v:[];

/* DATE HELPERS */
function toDisplay(d){
  if(!d||!d.includes("-")) return d||"";
  const p=d.split("-");
  return p[0].length===4?`${p[2]}-${p[1]}-${p[0]}`:d;
}

function toInternalIfNeeded(d){
  if(!d) return "";
  return d[4]==="-"?d:d.split("-").reverse().join("-");
}

Object.assign(window,{toDisplay,toInternalIfNeeded});

/* BASIC */
window.todayDate=()=>{
  const d=new Date();
  d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

window.uid=p=>`${p}_${Math.random().toString(36).slice(2,10)}`;

window.esc=t=>String(t||"").replace(/[&<>"']/g,m=>({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  "\"":"&quot;",
  "'":"&#39;"
}[m]));

/* GLOBAL DATA */
window.types=[];
window.stock=[];
window.sales=[];
window.wanting=[];
window.expenses=[];
window.services=[];
window.collections=[];

/* LIMIT */
window.globalLimit=0;
window.setGlobalLimit=v=>window.globalLimit=+v||0;
window.getGlobalLimit=()=>+window.globalLimit||0;

/* ===========================================================
   ENSURE ARRAYS
=========================================================== */

function ensureArrays(){
  [
    "types",
    "stock",
    "sales",
    "wanting",
    "expenses",
    "services",
    "collections"
  ].forEach(k=>{
    if(!Array.isArray(window[k])){
      window[k]=[];
    }
  });
}

ensureArrays();

/* ===========================================================
   NORMALIZE ALL DATES
=========================================================== */

function normalizeAllDates(){

  window.stock = window.stock.map(s=>({
    ...s,
    date:toInternalIfNeeded(s.date)
  }));

  window.sales = window.sales.map(s=>({
    ...s,
    date:toInternalIfNeeded(s.date)
  }));

  window.expenses = window.expenses.map(e=>({
    ...e,
    date:toInternalIfNeeded(e.date)
  }));

  window.wanting = window.wanting.map(w=>({
    ...w,
    date:toInternalIfNeeded(w.date)
  }));

  window.services = window.services.map(j=>({
    ...j,
    date_in:toInternalIfNeeded(j.date_in),
    date_out:toInternalIfNeeded(j.date_out)
  }));

  window.collections = window.collections.map(c=>({
    ...c,
    date:toInternalIfNeeded(c.date)
  }));
}

/* ===========================================================
   CLOUD SAVE WRAPPER
=========================================================== */

window.cloudSync=(k,d)=>{
  if(!window.__cloudReady) return;
  window.cloudSaveDebounced?.(k,d||[]);
};

/* SAVE FUNCTIONS */

window.saveTypes=()=>cloudSync(KEY_TYPES,window.types);
window.saveStock=()=>cloudSync(KEY_STOCK,window.stock);
window.saveSales=()=>cloudSync(KEY_SALES,window.sales);
window.saveWanting=()=>cloudSync(KEY_WANTING,window.wanting);
window.saveExpenses=()=>cloudSync(KEY_EXPENSES,window.expenses);
window.saveServices=()=>cloudSync(KEY_SERVICES,window.services);
window.saveCollections=()=>cloudSync(KEY_COLLECTIONS,window.collections);

/* ===========================================================
   TYPES
=========================================================== */

window.addType=name=>{

  name=(name||"").trim();

  if(!name) return;

  const exists = window.types.find(
    t=>t.name.toLowerCase()===name.toLowerCase()
  );

  if(exists) return;

  window.types=[
    ...window.types,
    {id:uid("type"),name}
  ];

  saveTypes();
};

/* ===========================================================
   PRODUCT HELPERS
=========================================================== */

window.findProduct=(type,name)=>
  window.stock.find(p=>
    p.type===type &&
    String(p.name).toLowerCase()===
    String(name).toLowerCase()
  );


window.getProductCost=(type,name)=>{

  const p=findProduct(type,name);

  if(!p) return 0;

  if(p.cost) return +p.cost;

  if(p.history?.length){

    let total=0;
    let qty=0;

    p.history.forEach(h=>{
      total+=h.cost*h.qty;
      qty+=h.qty;
    });

    return qty ? total/qty : 0;
  }

  return 0;
};

/* ===========================================================
   STOCK ENTRY (IMMUTABLE SAFE)
=========================================================== */

window.addStockEntry=({
  date,
  type,
  name,
  qty,
  cost
})=>{

  date=toInternalIfNeeded(date);
  qty=+qty;
  cost=+cost;

  if(!type||!name||qty<=0||cost<=0) return;

  const p=findProduct(type,name);

  if(!p){

    window.stock=[
      ...window.stock,
      {
        id:uid("stk"),
        date,
        type,
        name,
        qty,
        cost,
        sold:0,
        limit:getGlobalLimit(),
        history:[{date,qty,cost}]
      }
    ];

  }else{

    window.stock = window.stock.map(prod=>{

      if(prod.id!==p.id) return prod;

      return{
        ...prod,
        qty:prod.qty+qty,
        cost:cost,
        history:[
          ...(prod.history||[]),
          {date,qty,cost}
        ]
      };

    });

  }

  saveStock();
};

/* ===========================================================
   CLOUD EVENTS
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
      "renderUniversalBar",
      "updateTypeDropdowns"
    ].forEach(fn=>{
      try{
        window[fn]?.();
      }catch{}
    });

  }
);

/* ===========================================================
   METRICS HELPERS
=========================================================== */

window.getStockInvestmentAfterSale=()=>
  window.stock.reduce(
    (t,p)=>t+Number(p.sold||0)*Number(p.cost||0),
    0
  );


window.getSalesProfitCollected=()=>
  window.sales
    .filter(s=>
      String(s.status).toLowerCase()!=="credit"
    )
    .reduce((t,s)=>t+Number(s.profit||0),0);


window.getServiceProfitCollected=()=>
  window.services
    .filter(s=>{
      const st=String(s.status).toLowerCase();
      return ["paid","completed"].includes(st);
    })
    .reduce((t,s)=>t+Number(s.profit||0),0);

/* ===========================================================
   EMAIL TAG
=========================================================== */

if(!window.updateEmailTag){

  window.updateEmailTag=()=>{

    const el=document.getElementById("emailTag");

    if(!el) return;

    el.textContent=
      window.getFirebaseUser?.()?.email ||
      "Not logged in";

  };

}

/* ===========================================================
   AUTH BRIDGE
=========================================================== */

if(typeof window.auth!=="undefined"){

  window.auth.onAuthStateChanged(user=>{

    if(user){

      window.dispatchEvent(
        new Event("firebase-auth-ready")
      );

    }

  });

}

console.log(
"⚙️ core.js v23 PRODUCTION CLOUD ENGINE READY ✔"
);
