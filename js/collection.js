/* ===========================================================
   COLLECTION ENGINE v2 (ERP LEVEL)

   ✔ Credit recovery auto ledger update
   ✔ Sales auto collection log
   ✔ Service auto collection log
   ✔ Collection analytics
   ✔ Charts
   ✔ Ledger compatible
=========================================================== */

(function(){

if(window.__collectionEngineLoaded) return;
window.__collectionEngineLoaded = true;

console.log("%c📥 Collection Engine v2 Loading...",
"color:#0ea5e9;font-weight:bold");


/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */

const num = v => isNaN(v = Number(v)) ? 0 : v;

const esc = v =>
  (v===undefined || v===null) ? "" : String(v);

const today = () =>
  new Date().toISOString().slice(0,10);


/* ----------------------------------------------------------
   GLOBAL STORAGE
---------------------------------------------------------- */

window.collections =
  window.collections || [];


/* ----------------------------------------------------------
   CLOUD SAVE
---------------------------------------------------------- */

function saveCollections(){

  cloudSaveDebounced?.(
    "collections",
    window.collections
  );

  window.dispatchEvent(
    new Event("collections-updated")
  );

}


/* ===========================================================
   ➕ CORE COLLECTION ENTRY
=========================================================== */

async function addCollectionEntry(
  source,
  details,
  amount,
  mode="Cash"
){

  amount = num(amount);

  if(amount<=0){
    alert("Invalid collection amount");
    return;
  }

  const entry = {

    id: uid("coll"),

    date: today(),

    source: esc(source),

    details: esc(details),

    amount,

    mode

  };

  window.collections.push(entry);

  saveCollections();

  await processLedgerImpact(source,amount);

  renderCollection();
  runCollectionAnalytics();

  window.renderUniversalBar?.();

}

window.addCollectionEntry = addCollectionEntry;


/* ===========================================================
   LEDGER IMPACT ENGINE
=========================================================== */

async function processLedgerImpact(source,amount){

  if(!window.ledgerEngine) return;

  const L = ledgerEngine.getCurrent();

  if(!L || L.isClosed) return;

  const uid = auth.currentUser.uid;

  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

  const s = String(source).toLowerCase();

  let update={};

  if(s.includes("sale")){

    update.salesProfit =
      num(L.salesProfit) + amount;

  }

  else if(s.includes("service")){

    update.serviceProfit =
      num(L.serviceProfit) + amount;

  }

  else if(s.includes("credit")){

    update.salesProfit =
      num(L.salesProfit) + amount;

  }

  if(Object.keys(update).length){

    update.updatedAt = Date.now();

    await ref.update(update);

    await ledgerEngine.refresh();

  }

}


/* ===========================================================
   AUTO SALES COLLECTION
=========================================================== */

window.logSaleCollection = function(
  saleId,
  amount,
  mode="Cash"
){

  addCollectionEntry(
    "Sale Payment",
    "Sale ID: "+saleId,
    amount,
    mode
  );

};


/* ===========================================================
   AUTO SERVICE COLLECTION
=========================================================== */

window.logServiceCollection = function(
  serviceId,
  amount,
  mode="Cash"
){

  addCollectionEntry(
    "Service Payment",
    "Service ID: "+serviceId,
    amount,
    mode
  );

};


/* ===========================================================
   CREDIT RECOVERY
=========================================================== */

window.logCreditRecovery = function(
  invoiceId,
  amount,
  mode="Cash"
){

  addCollectionEntry(
    "Credit Recovered",
    "Invoice: "+invoiceId,
    amount,
    mode
  );

};


/* ===========================================================
   COLLECTION ANALYTICS
=========================================================== */

window.runCollectionAnalytics = function(){

  const list =
    window.collections || [];

  let total=0;
  let cash=0;
  let upi=0;
  let creditRecovered=0;

  const sourceMap={};
  const dailyMap={};

  list.forEach(e=>{

    const amt = num(e.amount);

    total += amt;

    if(e.mode==="Cash") cash+=amt;
    if(e.mode==="UPI")  upi+=amt;

    if(
      String(e.source)
      .toLowerCase()
      .includes("credit")
    )
      creditRecovered += amt;

    sourceMap[e.source] =
      (sourceMap[e.source]||0) + amt;

    dailyMap[e.date] =
      (dailyMap[e.date]||0) + amt;

  });

  window.__collectionAnalytics = {

    total,
    cash,
    upi,
    creditRecovered,
    sourceMap,
    dailyMap

  };

  updateCollectionSummaryUI();

  renderCollectionCharts();

};


/* ===========================================================
   SUMMARY UI
=========================================================== */

function updateCollectionSummaryUI(){

  const a =
    window.__collectionAnalytics;

  if(!a) return;

  const set=(id,val)=>{

    const el=document.getElementById(id);

    if(el)
      el.textContent="₹"+Math.round(val);

  };

  set("collTotal",a.total);
  set("collCash",a.cash);
  set("collUPI",a.upi);
  set("collCreditRecovered",
      a.creditRecovered);

}


/* ===========================================================
   CHART ENGINE
=========================================================== */

let collModeChart=null;
let collSourceChart=null;
let collDailyChart=null;

function renderCollectionCharts(){

  const a =
    window.__collectionAnalytics;

  if(!a) return;

  const modeCtx =
    document.getElementById("collModeChart");

  if(modeCtx && typeof Chart!=="undefined"){

    collModeChart?.destroy();

    collModeChart = new Chart(modeCtx,{
      type:"pie",
      data:{
        labels:["Cash","UPI"],
        datasets:[{
          data:[a.cash,a.upi]
        }]
      }
    });

  }

  const sourceCtx =
    document.getElementById("collSourceChart");

  if(sourceCtx && typeof Chart!=="undefined"){

    collSourceChart?.destroy();

    collSourceChart = new Chart(sourceCtx,{
      type:"bar",
      data:{
        labels:Object.keys(a.sourceMap),
        datasets:[{
          data:Object.values(a.sourceMap)
        }]
      }
    });

  }

  const dailyCtx =
    document.getElementById("collDailyChart");

  if(dailyCtx && typeof Chart!=="undefined"){

    collDailyChart?.destroy();

    const dates =
      Object.keys(a.dailyMap).sort();

    collDailyChart =
      new Chart(dailyCtx,{

      type:"line",

      data:{
        labels:dates,
        datasets:[{
          label:"Daily Collection",
          data:dates.map(
            d=>a.dailyMap[d]
          ),
          tension:0.3
        }]
      }

    });

  }

}


/* ===========================================================
   TABLE RENDER
=========================================================== */

window.renderCollection = function(){

  const tbody =
    document.querySelector(
      "#collectionHistory tbody"
    );

  if(!tbody) return;

  const list =
    window.collections || [];

  if(!list.length){

    tbody.innerHTML=
      `<tr>
        <td colspan="5"
        style="text-align:center;opacity:0.6">
        No collection history yet
        </td>
      </tr>`;

    return;

  }

  tbody.innerHTML = list.map(e=>`

    <tr>

      <td>${e.date}</td>

      <td>${esc(e.source)}</td>

      <td>${esc(e.details)}</td>

      <td>${esc(e.mode)}</td>

      <td>₹${num(e.amount)}</td>

    </tr>

  `).join("");

};


/* ===========================================================
   CLEAR HISTORY
=========================================================== */

document.addEventListener("click",e=>{

  if(e.target.id!=="clearCollectionBtn")
    return;

  if(!confirm(
    "Clear entire collection history?"
  )) return;

  window.collections=[];

  saveCollections();

  renderCollection();
  runCollectionAnalytics();

});


/* ===========================================================
   INIT
=========================================================== */

window.addEventListener(
  "cloud-data-loaded",
  ()=>{
    renderCollection();
    runCollectionAnalytics();
  }
);

window.addEventListener(
  "DOMContentLoaded",
  ()=>{
    renderCollection();
    runCollectionAnalytics();

    console.log("📊 Collection engine ready");
  }
);

})();
