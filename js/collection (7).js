/* ===========================================================
   collection.js — FINAL ONLINE VERSION (V11.1 HISTORY ONLY)
   ✔ Instant cloud sync (no refresh)
   ✔ Summary cards: Sales, Service, Pending Credit, Investment
   ✔ Collection tab = ONLY History (NO pending list here)
   ✔ Credit → Paid logic handled in sales.js / service.js only
=========================================================== */

/* -----------------------------
   Helpers
----------------------------- */
function escLocal(x) {
  return (x === undefined || x === null) ? "" : String(x);
}

function cNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

/* ===========================================================
   LOAD LOCAL (Cloud sync handled by core.js)
=========================================================== */
window.collections = Array.isArray(window.collections) ? window.collections : [];

/* ===========================================================
   SAVE (LOCAL + CLOUD)
=========================================================== */
function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch {}

  if (typeof cloudSaveDebounced === "function") {
    // Firestore collection name → "collections" (core.js లో map ఉంది)
    cloudSaveDebounced("collections", window.collections || []);
  }
}
window.saveCollections = saveCollections;

/* ===========================================================
   PUBLIC: addCollectionEntry
   👉 ఇక్కడ ఇప్పుడు ప్రధాన use:
      - Universal Bar collect buttons (Net / Stock / Service)
      - Manual collections (future లో)
   👉 Credit clear case కోసం ఇకపైన ఈ function వాడకూడదు
      (Credit history కోసం separate module పెట్టబోతున్నాం)
=========================================================== */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: uid("coll"),
    date: todayDate(),                // YYYY-MM-DD (core.js helper)
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
   SUMMARY (Uses universalBar metrics)
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
   RENDER PENDING (INFO ONLY → NOW COMPLETELY HIDDEN)
   👉 Collection tab లో Pending Collections block కనిపించకుండా
      heading + table రెండిటినీ hide చేస్తున్నాం.
=========================================================== */
window.renderPendingCollections = function () {
  const table = qs("#pendingCollectionTable");
  if (!table) return;

  // Hide table
  table.style.display = "none";

  // If previous sibling is the "Pending Collections" <h4>, hide that too
  const prev = table.previousElementSibling;
  if (prev && prev.tagName && prev.tagName.toLowerCase() === "h4") {
    prev.style.display = "none";
  }
};

/* ===========================================================
   RENDER HISTORY (Collection Tab Main Table)
=========================================================== */
window.renderCollection = function () {
  const sum = computeCollectionSummary();
  const fmt = v => "₹" + Math.round(cNum(v));

  // Top cards
  if (qs("#colSales"))     qs("#colSales").textContent     = fmt(sum.salesCollected);
  if (qs("#colService"))   qs("#colService").textContent   = fmt(sum.serviceCollected);
  if (qs("#colCredit"))    qs("#colCredit").textContent    = fmt(sum.pendingCredit);
  if (qs("#colInvRemain")) qs("#colInvRemain").textContent = fmt(sum.investmentRemain);

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
      <td data-label="Date">${e.date}</td>
      <td data-label="Source">${escLocal(e.source)}</td>
      <td data-label="Details">${escLocal(e.details)}</td>
      <td data-label="Amount">₹${cNum(e.amount)}</td>
    </tr>
  `).join("");
};

/* ===========================================================
   GLOBAL CLICK HANDLER
   👉 ఇక్కడ ఇప్పుడు ఒక్క Clear History మాత్రమే ఉంది
=========================================================== */
document.addEventListener("click", e => {
  const target = e.target;

  /* Clear entire history */
  if (target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;

    window.collections = [];
    saveCollections();

    renderCollection();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
    return;
  }

  // ❌ ఇకపై ఇక్కడ pending-collect-btn ఏదీ handle చేయం.
  // Credit → Paid → Profit update → Credit History
  // ఇవన్నీ sales.js / service.js / credit-history.js లోనే జరుగుతాయి.
});

/* ===========================================================
   INIT
=========================================================== */
window.addEventListener("load", () => {
  // Pending block ను hide చెయ్యడం మాత్రమే
  renderPendingCollections();

  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
});
