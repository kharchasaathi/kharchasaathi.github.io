/* ===========================================================
   collection.js — COLLECTION HISTORY ONLY (v15 CLEAN)
   -----------------------------------------------------------
   ✅ Cloud master (Firestore) — Local = cache only
   ✅ Stores ONLY collected amounts (history)
   ✅ NO collect logic here (handled by universalBar.js)
   ✅ Clear affects ONLY collection history
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
   LOCAL LOAD (fallback cache)
---------------------------------------------------------- */
try {
  window.collections = JSON.parse(
    localStorage.getItem("ks-collections") || "[]"
  );
  if (!Array.isArray(window.collections)) window.collections = [];
} catch {
  window.collections = [];
}

/* ===========================================================
   CLOUD-FIRST SAVE (Local = cache only)
=========================================================== */
function saveCollectionsOnline() {

  // Local cache
  try {
    localStorage.setItem(
      "ks-collections",
      JSON.stringify(window.collections || [])
    );
  } catch (e) {
    console.warn("Local cache save failed:", e);
  }

  // Cloud master
  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("collections", window.collections || []);
  }

  // Cloud pull for multi-device sync
  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => {
      try { cloudPullAllIfAvailable(); } catch {}
    }, 250);
  }
}
window.saveCollections = saveCollectionsOnline;

/* ===========================================================
   ADD COLLECTION ENTRY (CALLED ONLY BY universalBar.js)
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

  saveCollectionsOnline();

  // UI refresh
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
};

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
      <td>${toDisplay ? toDisplay(e.date) : e.date}</td>
      <td>${escLocal(e.source)}</td>
      <td>${escLocal(e.details)}</td>
      <td>₹${cNum(e.amount)}</td>
    </tr>
  `).join("");
};

/* ===========================================================
   CLEAR COLLECTION HISTORY (ONLY THIS TAB)
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
=========================================================== */
window.addEventListener("load", () => {
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
});
