/* ===========================================================
   core.js — FINAL v21 (FULL RESTORED + CLOUD SAFE)
   PART 1 — HELPERS + BUSINESS BASE
=========================================================== */

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
  "&":"&amp;","<":"&lt;",">":"&gt;",
  "\"":"&quot;","'":"&#39;"
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
window.setGlobalLimit=v=>globalLimit=+v||0;
window.getGlobalLimit=()=>+globalLimit||0;

/* ENSURE */
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

/* NORMALIZE */
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

/* CLOUD SAVE */
window.cloudSync=(k,d)=>{
  if(!window.__cloudReady) return;
  cloudSaveDebounced?.(k,d||[]);
};

/* SAVE */
window.saveTypes=()=>cloudSync(KEY_TYPES,types);
window.saveStock=()=>cloudSync(KEY_STOCK,stock);
window.saveSales=()=>cloudSync(KEY_SALES,sales);
window.saveWanting=()=>cloudSync(KEY_WANTING,wanting);
window.saveExpenses=()=>cloudSync(KEY_EXPENSES,expenses);
window.saveServices=()=>cloudSync(KEY_SERVICES,services);
window.saveCollections=()=>cloudSync(KEY_COLLECTIONS,collections);

/* TYPES */
window.addType=name=>{
  name=(name||"").trim();
  if(!name||types.find(t=>t.name.toLowerCase()===name.toLowerCase()))return;

  types.push({id:uid("type"),name});
  saveTypes();
};

/* PRODUCT HELPERS */
window.findProduct=(type,name)=>
  stock.find(p=>
    p.type===type &&
    String(p.name).toLowerCase()===
    String(name).toLowerCase()
  );

window.getProductCost=(type,name)=>{
  const p=findProduct(type,name);
  if(!p) return 0;
  if(p.cost) return +p.cost;

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

/* STOCK ENTRY */
window.addStockEntry=({
  date,type,name,qty,cost
})=>{

  date=toInternalIfNeeded(date);
  qty=+qty; cost=+cost;
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
    p.history.push({date,qty,cost});
  }

  saveStock();
};
/* ===========================================================
   PART 2 — CLOUD EVENTS + RENDER
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

/* INVESTMENT */
window.getStockInvestmentAfterSale=()=>
  stock.reduce(
    (t,p)=>t+Number(p.sold||0)*Number(p.cost||0),
    0
  );

window.getSalesProfitCollected=()=>
  sales
    .filter(s=>String(s.status).toLowerCase()!=="credit")
    .reduce((t,s)=>t+Number(s.profit||0),0);

window.getServiceProfitCollected=()=>
  services
    .filter(s=>String(s.status).toLowerCase()==="completed")
    .reduce((t,s)=>t+Number(s.profit||0),0);

/* EMAIL */
window.updateEmailTag=()=>{
  const el=document.getElementById("emailTag");
  if(!el) return;
  el.textContent=getFirebaseUser?.()?.email||"Not logged in";
};

/* AUTH BRIDGE (RESTORED) */
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
  "⚙️ core.js v21 CLOUD ENGINE READY ✔"
);
