/* ===========================================================
   collection.js — FINAL SAFE AUTO DOM VERSION (V12.0)
   ✔ Auto-create required DOM nodes
   ✔ Never crashes if HTML IDs missing
   ✔ Instant cloud sync + universal bar update
   ✔ Works without Pending table
=========================================================== */

const qs = s => document.querySelector(s);

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
window.collections = Array.isArray(window.collections)
  ? window.collections
  : [];

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
   AUTO DOM FIX — IF ELEMENTS ARE MISSING, CREATE THEM
=========================================================== */
function ensureCollectionDOM() {
  const section = qs("#collection");
  if (!section) return;  // user may hide tab

  /* ---- SUMMARY CARDS CONTAINER ---- */
  let sumBox = qs("#colSummaryBox");
  if (!sumBox) {
    sumBox = document.createElement("div");
    sumBox.id = "colSummaryBox";
    sumBox.style.margin = "6px 0 12px";
    sumBox.innerHTML = `
      <div>
        Sales Collected: <b id="colSales">₹0</b> |
        Service Collected: <b id="colService">₹0</b> |
        Pending Credit: <b id="colCredit">₹0</b> |
        Investment Remaining: <b id="colInvRemain">₹0</b>
      </div>
    `;
    section.appendChild(sumBox);
  }

  /* ---- HISTORY TABLE ---- */
  let table = qs("#collectionHistory");
  if (!table) {
    table = document.createElement("table");
    table.id = "collectionHistory";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Source</th>
          <th>Details</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    section.appendChild(table);
  }

  /* ---- CLEAR BUTTON ---- */
  let clr = qs("#clearCollectionBtn");
  if (!clr) {
    clr = document.createElement("button");
    clr.id = "clearCollectionBtn";
    clr.className = "small-btn";
    clr.style.marginTop = "10px";
    clr.textContent = "Clear History";
    section.appendChild(clr);
  }
}

/* ===========================================================
   PUBLIC: ADD COLLECTION ENTRY
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
   HIDE PENDING SECTION (IF EXISTS)
=========================================================== */
window.renderPendingCollections = function () {
  const table = qs("#pendingCollectionTable");
  if (!table) return;

  table.style.display = "none";

  const prev = table.previousElementSibling;
  if (prev && prev.tagName.toLowerCase() === "h4") {
    prev.style.display = "none";
  }
};

/* ===========================================================
   RENDER HISTORY TABLE (AUTO DOM SAFE)
=========================================================== */
window.renderCollection = function () {
  ensureCollectionDOM();

  const sum = computeCollectionSummary();
  const fmt = v => "₹" + Math.round(cNum(v));

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
   CLICK HANDLER — CLEAR HISTORY ONLY
=========================================================== */
document.addEventListener("click", e => {
  const t = e.target;

  if (t.id === "clearCollectionBtn") {
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
  renderPendingCollections();
  renderCollection();
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
});
