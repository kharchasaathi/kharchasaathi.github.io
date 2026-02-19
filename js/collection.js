/* ===========================================================
   collection.js — FINAL v18 (ERP COLLECTION ENGINE)

   ✔ Cloud only
   ✔ Multi-device safe
   ✔ Credit cleared tagging
   ✔ Service credit tagging
   ✔ Profit preserve tagging
   ✔ Payment mode ready
   ✔ Universal compatible
   ✔ Analytics ready
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
    console.warn(
      "⛔ Collections save blocked — cloud not ready"
    );
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
   (Auto classify collection types)
=========================================================== */
function normalizeSource(src = "") {

  const s = String(src).toLowerCase();

  if (s.includes("credit") &&
      s.includes("service"))
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
  paymentMode = "Cash"   // future ready
) {

  const entry = {
    id: uid("coll"),
    date: todayDate(),

    /* Auto classified source */
    source: normalizeSource(source),

    rawSource: escLocal(source),

    details: escLocal(details),

    amount: cNum(amount),

    /* Mode tagging */
    mode: paymentMode || "Cash"
  };

  window.collections =
    window.collections || [];

  window.collections.push(entry);

  saveCollections();

  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
};


/* ===========================================================
   RENDER COLLECTION TABLE
=========================================================== */
window.renderCollection = function () {

  const tbody =
    document.querySelector(
      "#collectionHistory tbody"
    );

  if (!tbody) return;

  const list =
    window.collections || [];

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

      <td>
        ${
          typeof toDisplay === "function"
            ? toDisplay(e.date)
            : e.date
        }
      </td>

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

    if (!confirm(
      "Clear entire collection history?"
    )) return;

    window.collections = [];

    saveCollections();

    renderCollection();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
  }

});


/* ===========================================================
   ☁️ CLOUD SYNC LISTENER
=========================================================== */
window.addEventListener(
  "cloud-data-loaded",
  () => {

    renderCollection();
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();

  }
);
