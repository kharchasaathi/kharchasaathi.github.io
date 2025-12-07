/* ===========================================================
   collection.js — FIXED COLLECT LOGIC (V13 FINAL)
   ✔ One-click collect (no duplicates)
   ✔ Resets universal bar source to ZERO immediately
   ✔ Updates analytics, dashboard & universal bar
   ✔ Saves clean history
=========================================================== */


/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */
function escLocal(x) {
  return (x === undefined || x === null) ? "" : String(x);
}

function cNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

/* ----------------------------------------------------------
   LOCAL LOAD
---------------------------------------------------------- */
try {
  window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");
  if (!Array.isArray(window.collections)) window.collections = [];
} catch {
  window.collections = [];
}

/* ----------------------------------------------------------
   SAVE (LOCAL + CLOUD)
---------------------------------------------------------- */
function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch {}

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("collections", window.collections || []);
  }
}
window.saveCollections = saveCollections;


/* ===========================================================
   ADD COLLECTION ENTRY — HISTORY
=========================================================== */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: uid("coll"),
    date: todayDate(),
    source: escLocal(source),
    details: escLocal(details),
    amount: cNum(amount)
  };

  window.collections.push(entry);
  saveCollections();
  renderCollection();
  window.updateUniversalBar?.();
};


/* ===========================================================
   MAIN FIX — HANDLE COLLECT BUTTON (ONE CLICK ONLY)
=========================================================== */
window.handleCollect = function (type) {

  // ---- BLOCK MULTIPLE CLICKS ----
  if (window.__collectBusy) return;
  window.__collectBusy = true;
  setTimeout(() => window.__collectBusy = false, 800);   // release after 0.8 sec

  if (!window.__unMetrics) {
    alert("Still calculating… retry");
    return;
  }

  const m = window.__unMetrics;
  let amt = 0, label = "", details = "";

  switch(type){
    case "net":
      amt = cNum(m.netProfit);
      label = "Net Profit";
      details = "Sale + Service - Expenses";
      window.__unMetrics.netProfit = 0;
      break;

    case "stock":
      amt = cNum(m.stockInvestSold);
      label = "Stock Investment";
      details = "Sold items";
      window.__unMetrics.stockInvestSold = 0;
      break;

    case "service":
      amt = cNum(m.serviceInvestCompleted);
      label = "Service Investment";
      details = "Completed jobs";
      window.__unMetrics.serviceInvestCompleted = 0;
      break;

    default:
      alert("Unknown collect type: " + type);
      return;
  }

  // ---- ZERO BLOCK ----
  if (amt <= 0) {
    alert("Nothing to collect");
    return;
  }

  // ---- SAVE HISTORY ----
  window.addCollectionEntry(label, details, amt);

  // ---- UPDATE METRICS (RESET JUST DONE VALUE) ----
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.renderCollection?.();
};


/* ===========================================================
   SUMMARY
=========================================================== */
function computeCollectionSummary() {
  const m = window.__unMetrics || {};

  return {
    salesCollected:   cNum(m.saleProfitCollected),
    serviceCollected: cNum(m.serviceProfitCollected),
    pendingCredit:    cNum(m.pendingCreditTotal),
    investmentRemain: cNum(m.stockInvestSold) + cNum(m.serviceInvestCompleted)
  };
}


/* ===========================================================
   RENDER COLLECTION HISTORY
=========================================================== */
window.renderCollection = function () {
  const tbody = qs("#collectionHistory tbody");
  if (!tbody) return;

  const list = window.collections || [];
  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;opacity:0.6;">
          No collection history yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${e.date}</td>
      <td>${escLocal(e.source)}</td>
      <td>${escLocal(e.details)}</td>
      <td>₹${cNum(e.amount)}</td>
    </tr>
  `).join("");
};


/* ===========================================================
   CLEAR COLLECTION HISTORY
=========================================================== */
document.addEventListener("click", e => {
  if (e.target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;

    window.collections = [];
    saveCollections();

    renderCollection();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
  }
});


/* ===========================================================
   INIT
=========================================================== */
window.addEventListener("load", () => {
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
});
