/* ===========================================================
   collection.js — FINAL v19 (ERP ANALYTICS CORE)

   ✔ Cloud only
   ✔ Multi-device safe
   ✔ Source classified
   ✔ Payment mode supported
   ✔ Analytics engine added
   ✔ Daily summary engine
   ✔ Universal compatible
=========================================================== */


/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */
function escLocal(x) {
  return (x === undefined || x === null)
    ? ""
    : String(x);
}

function cNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}


/* ===========================================================
   ☁️ CLOUD SAVE
=========================================================== */
function saveCollections() {

  if (!window.__cloudReady) {
    console.warn("⛔ Collections save blocked — cloud not ready");
    return;
  }

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced(
      "collections",
      window.collections || []
    );
  }
}
window.saveCollections = saveCollections;


/* ===========================================================
   SOURCE NORMALIZER
=========================================================== */
function normalizeSource(src = "") {

  const s = String(src).toLowerCase();

  if (s.includes("credit") && s.includes("service"))
    return "Service Credit Cleared";

  if (s.includes("credit"))
    return "Sale Credit Cleared";

  if (s.includes("service"))
    return "Service Payment";

  if (s.includes("history"))
    return "Profit Preserved";

  return "Sale Collection";
}


/* ===========================================================
   ADD COLLECTION ENTRY
=========================================================== */
window.addCollectionEntry = function (
  source,
  details,
  amount,
  paymentMode = "Cash"
) {

  const entry = {
    id: uid("coll"),
    date: todayDate(),
    source: normalizeSource(source),
    rawSource: escLocal(source),
    details: escLocal(details),
    amount: cNum(amount),
    mode: paymentMode || "Cash"
  };

  window.collections =
    window.collections || [];

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
window.runCollectionAnalytics = function () {

  const list = window.collections || [];

  let total = 0;
  let cash = 0;
  let upi = 0;
  let creditRecovered = 0;

  const sourceMap = {};
  const dailyMap = {};

  list.forEach(e => {

    const amt = cNum(e.amount);
    total += amt;

    /* Mode Split */
    if (e.mode === "Cash") cash += amt;
    if (e.mode === "UPI") upi += amt;

    /* Credit Recovery */
    if (e.source.includes("Credit"))
      creditRecovered += amt;

    /* Source Summary */
    sourceMap[e.source] =
      (sourceMap[e.source] || 0) + amt;

    /* Daily Summary */
    dailyMap[e.date] =
      (dailyMap[e.date] || 0) + amt;
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
};


/* ===========================================================
   UPDATE SUMMARY UI (If Elements Exist)
=========================================================== */
function updateCollectionSummaryUI() {

  const a = window.__collectionAnalytics;
  if (!a) return;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "₹" + val;
  };

  set("collTotal", a.total);
  set("collCash", a.cash);
  set("collUPI", a.upi);
  set("collCreditRecovered", a.creditRecovered);
}


/* ===========================================================
   RENDER COLLECTION TABLE
=========================================================== */
window.renderCollection = function () {

  const tbody =
    document.querySelector("#collectionHistory tbody");

  if (!tbody) return;

  const list = window.collections || [];

  if (!list.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5"
            style="text-align:center;opacity:0.6;">
          No collection history yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${
        typeof toDisplay === "function"
          ? toDisplay(e.date)
          : e.date
      }</td>
      <td>${escLocal(e.source)}</td>
      <td>${escLocal(e.details)}</td>
      <td>${escLocal(e.mode)}</td>
      <td>₹${cNum(e.amount)}</td>
    </tr>
  `).join("");
};


/* ===========================================================
   CLEAR COLLECTION HISTORY
=========================================================== */
document.addEventListener("click", e => {

  if (e.target.id === "clearCollectionBtn") {

    if (!confirm("Clear entire collection history?"))
      return;

    window.collections = [];

    saveCollections();

    renderCollection();
    runCollectionAnalytics();

    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
  }
});


/* ===========================================================
   ☁️ CLOUD SYNC LISTENER
=========================================================== */
window.addEventListener("cloud-data-loaded", () => {

  renderCollection();
  runCollectionAnalytics();

  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
});
