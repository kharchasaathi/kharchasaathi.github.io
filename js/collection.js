/* ===========================================================
   collection.js — FINAL v21 (AUTO UI + ANALYTICS + CHARTS)

   ✔ Auto inject dashboard UI
   ✔ Charts engine added
   ✔ Cloud only
   ✔ Multi-device safe
   ✔ Source classified
   ✔ Payment mode supported
   ✔ Analytics engine added
   ✔ Universal compatible
=========================================================== */


/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */
function escLocal(x){
  return (x===undefined||x===null)?"":String(x);
}

function cNum(v){
  const n=Number(v||0);
  return isNaN(n)?0:n;
}


/* ===========================================================
   🧩 AUTO INSERT DASHBOARD
=========================================================== */
function injectCollectionDashboard(){

  if(document.querySelector(".collection-dashboard"))
    return;

  const table=document.getElementById(
    "collectionHistory"
  );
  if(!table) return;

  const wrapper=document.createElement("div");

  wrapper.innerHTML=`
  <div class="collection-dashboard">

    <div class="coll-card">
      <h4>Total Collection</h4>
      <h2 id="collTotal">₹0</h2>
    </div>

    <div class="coll-card">
      <h4>Cash</h4>
      <h2 id="collCash">₹0</h2>
    </div>

    <div class="coll-card">
      <h4>UPI</h4>
      <h2 id="collUPI">₹0</h2>
    </div>

    <div class="coll-card">
      <h4>Credit Recovered</h4>
      <h2 id="collCreditRecovered">₹0</h2>
    </div>

  </div>
  `;

  table.parentNode.insertBefore(
    wrapper,
    table
  );
}


/* ===========================================================
   ☁️ CLOUD SAVE
=========================================================== */
function saveCollections(){

  if(!window.__cloudReady){
    console.warn(
      "⛔ Collections save blocked — cloud not ready"
    );
    return;
  }

  cloudSaveDebounced?.(
    "collections",
    window.collections||[]
  );
}
window.saveCollections=saveCollections;


/* ===========================================================
   SOURCE NORMALIZER
=========================================================== */
function normalizeSource(src=""){

  const s=String(src).toLowerCase();

  if(s.includes("credit")&&s.includes("service"))
    return "Service Credit Cleared";

  if(s.includes("credit"))
    return "Sale Credit Cleared";

  if(s.includes("service"))
    return "Service Payment";

  if(s.includes("history"))
    return "Profit Preserved";

  return "Sale Collection";
}


/* ===========================================================
   ADD COLLECTION ENTRY
=========================================================== */
window.addCollectionEntry=function(
  source,
  details,
  amount,
  paymentMode="Cash"
){

  const entry={
    id:uid("coll"),
    date:todayDate(),
    source:normalizeSource(source),
    rawSource:escLocal(source),
    details:escLocal(details),
    amount:cNum(amount),
    mode:paymentMode||"Cash"
  };

  window.collections=
    window.collections||[];

  window.collections.push(entry);

  saveCollections();

  renderCollection();
  runCollectionAnalytics();

  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
};


/* ===========================================================
   🔎 COLLECTION ANALYTICS CORE
=========================================================== */
window.runCollectionAnalytics=function(){

  const list=window.collections||[];

  let total=0;
  let cash=0;
  let upi=0;
  let creditRecovered=0;

  const sourceMap={};
  const dailyMap={};

  list.forEach(e=>{

    const amt=cNum(e.amount);
    total+=amt;

    if(e.mode==="Cash") cash+=amt;
    if(e.mode==="UPI") upi+=amt;

    if(e.source.includes("Credit"))
      creditRecovered+=amt;

    sourceMap[e.source]=
      (sourceMap[e.source]||0)+amt;

    dailyMap[e.date]=
      (dailyMap[e.date]||0)+amt;
  });

  window.__collectionAnalytics={
    total,
    cash,
    upi,
    creditRecovered,
    sourceMap,
    dailyMap
  };

  updateCollectionSummaryUI();

  /* 🔥 CHARTS CALL ADDED */
  renderCollectionCharts();
};


/* ===========================================================
   UPDATE SUMMARY UI
=========================================================== */
function updateCollectionSummaryUI(){

  const a=window.__collectionAnalytics;
  if(!a) return;

  const set=(id,val)=>{
    const el=document.getElementById(id);
    if(el) el.textContent="₹"+val;
  };

  set("collTotal",a.total);
  set("collCash",a.cash);
  set("collUPI",a.upi);
  set(
    "collCreditRecovered",
    a.creditRecovered
  );
}


/* ===========================================================
   COLLECTION CHART ENGINE
=========================================================== */
let collModeChart=null;
let collSourceChart=null;
let collDailyChart=null;

function renderCollectionCharts(){

  const a=window.__collectionAnalytics;
  if(!a) return;

  /* MODE PIE */
  const modeCtx=
    document.getElementById("collModeChart");

  if(modeCtx&&typeof Chart!=="undefined"){

    collModeChart?.destroy();

    collModeChart=new Chart(modeCtx,{
      type:"pie",
      data:{
        labels:["Cash","UPI"],
        datasets:[{
          data:[a.cash,a.upi]
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false
      }
    });
  }

  /* SOURCE BAR */
  const sourceCtx=
    document.getElementById(
      "collSourceChart"
    );

  if(sourceCtx&&typeof Chart!=="undefined"){

    collSourceChart?.destroy();

    collSourceChart=new Chart(sourceCtx,{
      type:"bar",
      data:{
        labels:Object.keys(a.sourceMap),
        datasets:[{
          data:Object.values(a.sourceMap)
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false
      }
    });
  }

  /* DAILY LINE */
  const dailyCtx=
    document.getElementById(
      "collDailyChart"
    );

  if(dailyCtx&&typeof Chart!=="undefined"){

    collDailyChart?.destroy();

    const sortedDates=
      Object.keys(a.dailyMap).sort();

    collDailyChart=new Chart(dailyCtx,{
      type:"line",
      data:{
        labels:sortedDates,
        datasets:[{
          data:sortedDates.map(
            d=>a.dailyMap[d]
          )
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false
      }
    });
  }
}


/* ===========================================================
   RENDER TABLE
=========================================================== */
window.renderCollection=function(){

  const tbody=
    document.querySelector(
      "#collectionHistory tbody"
    );
  if(!tbody) return;

  const list=window.collections||[];

  if(!list.length){
    tbody.innerHTML=`
      <tr>
        <td colspan="5"
            style="text-align:center;opacity:0.6;">
          No collection history yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML=list.map(e=>`
    <tr>
      <td>${
        typeof toDisplay==="function"
        ?toDisplay(e.date)
        :e.date
      }</td>
      <td>${escLocal(e.source)}</td>
      <td>${escLocal(e.details)}</td>
      <td>${escLocal(e.mode)}</td>
      <td>₹${cNum(e.amount)}</td>
    </tr>
  `).join("");
};


/* ===========================================================
   CLEAR HISTORY
=========================================================== */
document.addEventListener("click",e=>{

  if(e.target.id==="clearCollectionBtn"){

    if(!confirm(
      "Clear entire collection history?"
    )) return;

    window.collections=[];

    saveCollections();

    renderCollection();
    runCollectionAnalytics();

    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
  }
});


/* ===========================================================
   INIT
=========================================================== */
window.addEventListener(
  "cloud-data-loaded",
  ()=>{

    injectCollectionDashboard();
    renderCollection();
    runCollectionAnalytics();

    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
  }
);

window.addEventListener(
  "DOMContentLoaded",
  ()=>injectCollectionDashboard()
);
