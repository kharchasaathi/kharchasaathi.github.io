/* ===========================================================
   collection.js — FINAL v17 (OPTION-2 CLOUD SAFE)

   ✔ No localStorage
   ✔ Logout/Login safe
   ✔ Multi-device sync safe
   ✔ Stores ONLY collected amounts
   ✔ UniversalBar compatible
   ✔ Analytics compatible
   ✔ Cloud-ready guarded
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
   ☁️ CLOUD SAVE (SAFE)
=========================================================== */
function saveCollections() {

  /* Cloud ready guard */
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
   ADD COLLECTION ENTRY
   (Called from Universal / Sales / Services)
=========================================================== */
window.addCollectionEntry = function (
  source,
  details,
  amount
) {

  const entry = {
    id: uid("coll"),
    date: todayDate(),
    source: escLocal(source),
    details: escLocal(details),
    amount: cNum(amount)
  };

  window.collections =
    window.collections || [];

  window.collections.push(entry);

  saveCollections();

  /* UI refresh */
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
};


/* ===========================================================
   RENDER COLLECTION HISTORY
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
        <td colspan="4"
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

      <td>₹${cNum(e.amount)}</td>

    </tr>
  `).join("");
};


/* ===========================================================
   CLEAR COLLECTION HISTORY
   (Only this tab)
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
