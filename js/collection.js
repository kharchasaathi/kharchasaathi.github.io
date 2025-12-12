/* ===========================================================
   collection.js — ONLINE-FIRST COLLECT LOGIC (V14)
   ✔ Cloud master (Firestore) — Local = cache only
   ✔ One-click collect (no duplicates)
   ✔ Updates universal bar, analytics, summary
   ✔ Net-collected offset updated locally when Net is collected
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
   LOCAL LOAD (fallback) — window.collections exists after core pull
---------------------------------------------------------- */
try {
  window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");
  if (!Array.isArray(window.collections)) window.collections = [];
} catch {
  window.collections = [];
}

/* ===========================================================
   CLOUD-FIRST SAVE (Local = cache only)
=========================================================== */
function saveCollectionsOnline() {
  // 1) Local cache for fast UI
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch (e) {
    console.warn("Local cache save failed:", e);
  }

  // 2) Cloud save (master)
  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("collections", window.collections || []);
  }

  // 3) Trigger pull shortly after to ensure UI across devices updates
  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => {
      try { cloudPullAllIfAvailable(); } catch {}
    }, 250);
  }
}
window.saveCollections = saveCollectionsOnline;

/* ===========================================================
   ADD COLLECTION ENTRY — HISTORY (CLOUD MASTER)
=========================================================== */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: uid("coll"),
    date: todayDate(),
    source: escLocal(source),
    details: escLocal(details),
    amount: cNum(amount)
  };

  window.collections = window.collections || [];
  window.collections.push(entry);

  // save (cloud + local cache)
  saveCollectionsOnline();

  // UI updates
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
};

/* ===========================================================
   MAIN — HANDLE COLLECT BUTTON (ONE CLICK ONLY)
   Also updates collectedNetTotal when collecting 'net'
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

      // Increase local collected offset so net is not counted again
      if (amt > 0) {
        window.collectedNetTotal = Number(window.collectedNetTotal || 0) + amt;
        if (typeof saveCollectedNetTotal === "function") saveCollectedNetTotal();
      }

      // reset value in metrics (UI)
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

  // ---- SAVE HISTORY (cloud master)
  window.addCollectionEntry(label, details, amt);

  // ---- UPDATE METRICS & UI ----
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.renderCollection?.();
};

/* ===========================================================
   SUMMARY HELP
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
   RENDER COLLECTION HISTORY (ONLINE-SAFE)
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
      <td>${toDisplay ? toDisplay(e.date) : e.date}</td>
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
    saveCollectionsOnline();

    renderCollection();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
  }
});

/* ===========================================================
   INIT
   — try to keep local cache but cloudPullAllIfAvailable (core) will overwrite with server data
=========================================================== */
window.addEventListener("load", () => {
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
});
