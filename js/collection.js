/* ===========================================================
   collection.js — FINAL CLEAN v7.0
   ✔ Fully compatible with sales.js v12 / stock.js v3
   ✔ Customer + Phone display in pending list
   ✔ Credit → Paid update + history entry
   ✔ Uses universalBar metrics
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

/* -----------------------------
   Local storage for history
----------------------------- */
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch (e) {
    console.warn("Collection save error:", e);
  }
}

/* ===========================================================
   PUBLIC: addCollectionEntry
=========================================================== */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: Date.now().toString(),
    date: window.todayDate ? todayDate() : new Date().toISOString().slice(0, 10),
    source: escLocal(source || ""),
    details: escLocal(details || ""),
    amount: cNum(amount)
  };

  window.collections = window.collections || [];
  window.collections.push(entry);
  saveCollections();

  renderCollection();
  window.updateUniversalBar?.();
};

/* ===========================================================
   SUMMARY (uses universalBar metrics)
=========================================================== */
function computeCollectionSummary() {
  window.updateUniversalBar?.();
  const m = window.__unMetrics || {};

  return {
    salesCollected:   cNum(m.saleProfitCollected),
    serviceCollected: cNum(m.serviceProfitCollected),
    pendingCredit:    cNum(m.pendingCreditTotal),
    investmentRemain: cNum(m.stockInvestSold) + cNum(m.serviceInvestCompleted)
  };
}

/* ===========================================================
   GET PENDING CREDIT LIST
=========================================================== */
function getPendingList() {
  const list = [];

  (window.sales || []).forEach(s => {
    const st = String(s.status || "").toLowerCase();

    if (st === "credit") {
      const total = cNum(s.total || (cNum(s.qty) * cNum(s.price)));

      if (total > 0) {
        list.push({
          id: s.id,
          name: s.product || "Sale",
          type: s.type || "Sale",
          date: s.date,
          pending: total,
          customer: s.customer || "",
          phone: s.phone || ""
        });
      }
    }
  });

  return list;
}

/* ===========================================================
   RENDER PENDING COLLECTION TABLE
=========================================================== */
function renderPendingCollections() {
  const tbody = qs("#pendingCollectionTable tbody");
  if (!tbody) return;

  const list = getPendingList();

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:0.6;">
          No pending collections
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td data-label="Date">${window.toDisplay ? toDisplay(r.date) : r.date}</td>

      <td data-label="Name">
        ${escLocal(r.name)}
        ${r.customer ? `<br><small>${escLocal(r.customer)}</small>` : ""}
        ${r.phone ? `<br><small>📞 ${escLocal(r.phone)}</small>` : ""}
      </td>

      <td data-label="Type">${escLocal(r.type)}</td>
      <td data-label="Pending">₹${r.pending}</td>

      <td data-label="Action">
        <button class="small-btn pending-collect-btn"
                data-id="${r.id}"
                data-amount="${r.pending}">
          Collect
        </button>
      </td>
    </tr>
  `).join("");
}

/* ===========================================================
   RENDER HISTORY + SUMMARY
=========================================================== */
function renderCollection() {
  const sum = computeCollectionSummary();
  const fmt = v => "₹" + Math.round(cNum(v));

  if (qs("#colSales"))      qs("#colSales").textContent     = fmt(sum.salesCollected);
  if (qs("#colService"))    qs("#colService").textContent   = fmt(sum.serviceCollected);
  if (qs("#colCredit"))     qs("#colCredit").textContent    = fmt(sum.pendingCredit);
  if (qs("#colInvRemain"))  qs("#colInvRemain").textContent = fmt(sum.investmentRemain);

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
      <td data-label="Amount">₹${e.amount}</td>
    </tr>
  `).join("");
}

window.renderCollection = renderCollection;

/* ===========================================================
   GLOBAL CLICK HANDLER
=========================================================== */
document.addEventListener("click", e => {
  const target = e.target;

  /* --- CLEAR HISTORY --- */
  if (target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
    window.updateUniversalBar?.();
    return;
  }

  /* --- CREDIT → PAID (Collect) --- */
  const btn = target.closest(".pending-collect-btn");
  if (!btn) return;

  const id  = btn.getAttribute("data-id");
  const amt = cNum(btn.getAttribute("data-amount") || 0);

  const sale = (window.sales || []).find(s => s.id == id);
  if (!sale) return alert("Sale not found.");

  if (String(sale.status || "").toLowerCase() !== "credit") {
    alert("This sale is not CREDIT anymore.");
    renderPendingCollections();
    renderCollection();
    return;
  }

  const lines = [
    `Product: ${sale.product} (${sale.type})`,
    `Qty: ${sale.qty}, Total: ₹${sale.total}`
  ];
  if (sale.customer) lines.push(`Customer: ${sale.customer}`);
  if (sale.phone)    lines.push(`Phone: ${sale.phone}`);

  if (!confirm(lines.join("\n") + "\n\nMark this as COLLECTED?")) return;

  // 1) Mark as paid
  sale.status = "Paid";
  window.saveSales && window.saveSales();

  // 2) Add history entry
  window.addCollectionEntry("Sale (Credit cleared)", sale.product, amt);

  // 3) UI refresh
  renderPendingCollections();
  renderCollection();
  window.renderSales?.();
  window.updateUniversalBar?.();

  alert("Collection recorded and marked as Paid.");
});

/* ===========================================================
   INIT
=========================================================== */
window.addEventListener("load", () => {
  if (!Array.isArray(window.collections)) {
    window.collections = [];
    saveCollections();
  }

  renderPendingCollections();
  renderCollection();
  window.updateUniversalBar?.();
});
