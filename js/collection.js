/* ===========================================================
   collection.js — FINAL ONLINE VERSION (V10.1 CUSTOM)
   ✔ Instant cloud sync (no refresh)
   ✔ Qty × Rate shown everywhere
   ✔ Customer + Phone visible
   ✔ Credit → Paid with detailed history (amount in brackets ONLY)
   ✔ Fully synced with universalBar + core.js + analytics
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
    cloudSaveDebounced("collections", window.collections || []);
  }
}
window.saveCollections = saveCollections;

/* ===========================================================
   PUBLIC: addCollectionEntry
   👉 amount ఇక్కడకి వస్తుంది. Credit clear case లో మనం 0 పంపిస్తాం.
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
   GET PENDING CREDIT LIST
=========================================================== */
function getPendingList() {
  const list = [];

  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "credit") {

      const qty    = cNum(s.qty);
      const price  = cNum(s.price);
      const total  = cNum(s.total || (qty * price));

      list.push({
        id: s.id,
        name: s.product,
        type: s.type,
        date: s.date,
        qty,
        price,
        pending: total,
        customer: escLocal(s.customer),
        phone: escLocal(s.phone)
      });
    }
  });

  return list;
}

/* ===========================================================
   RENDER PENDING
=========================================================== */
window.renderPendingCollections = function () {
  const tbody = qs("#pendingCollectionTable tbody");
  if (!tbody) return;

  const list = getPendingList();

  if (!list.length) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;opacity:0.6;">
        No pending collections
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td data-label="Date">${toDisplay(r.date)}</td>

      <td data-label="Name">
        ${escLocal(r.name)}
        <br><small>Qty ${r.qty} × ₹${r.price} = <b>₹${r.pending}</b></small>
        ${r.customer ? `<br><small>${r.customer}</small>` : ""}
        ${r.phone ? `<br><small>📞 ${r.phone}</small>` : ""}
      </td>

      <td data-label="Type">${escLocal(r.type)}</td>
      <td data-label="Pending"><b>₹${r.pending}</b></td>

      <td data-label="Action">
        <button class="small-btn pending-collect-btn"
                data-id="${r.id}"
                data-amount="${r.pending}">
          Collect
        </button>
      </td>
    </tr>
  `).join("");
};

/* ===========================================================
   RENDER HISTORY
=========================================================== */
window.renderCollection = function () {
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
      <tr><td colspan="4" style="text-align:center;opacity:0.6;">
        No collection history yet
      </td></tr>`;
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
=========================================================== */
document.addEventListener("click", e => {
  const target = e.target;

  /* Clear history */
  if (target.id === "clearCollectionBtn") {
    if (confirm("Clear entire collection history?")) {
      window.collections = [];
      saveCollections();
      renderCollection();
      window.updateUniversalBar?.();
      window.renderAnalytics?.();
      window.updateSummaryCards?.();
    }
    return;
  }

  /* Credit → Paid collect */
  const btn = target.closest(".pending-collect-btn");
  if (!btn) return;

  const id  = btn.dataset.id;
  const amt = cNum(btn.dataset.amount);

  const sale = (window.sales || []).find(s => s.id === id);
  if (!sale) {
    alert("Sale not found.");
    return;
  }

  if (String(sale.status || "").toLowerCase() !== "credit") {
    alert("Already Paid");
    renderPendingCollections();
    return;
  }

  const qty   = cNum(sale.qty);
  const price = cNum(sale.price);
  const total = cNum(sale.total || (qty * price));

  const msg =
    `Product: ${sale.product}\n` +
    `Qty: ${qty}\n` +
    `Rate: ₹${price}\n` +
    `Total: ₹${total}\n` +
    (sale.customer ? `Customer: ${sale.customer}\n` : "") +
    (sale.phone ? `Phone: ${sale.phone}\n` : "") +
    `\nMark as PAID & collect now?`;

  if (!confirm(msg)) return;

  /* Update Status */
  sale.status = "Paid";
  window.saveSales?.();

  /* Build details text
     👉 Amount historyలో కాదు, details లో bracket లో మాత్రమే */
  const collectedAmt = amt || total;

  const fullDetails =
    `${sale.product} — Qty ${qty} × ₹${price} = ₹${total}` +
    ` (Collected ₹${collectedAmt})` +
    (sale.customer ? ` — ${sale.customer}` : "") +
    (sale.phone ? ` — ${sale.phone}` : "");

  /* IMPORTANT: amount = 0
     👉 Credit amount మళ్ళీ Profit / Stock లోనే count అవుతుంది */
  window.addCollectionEntry("Sale (Credit cleared)", fullDetails, 0);

  /* FULL REALTIME REFRESH */
  renderPendingCollections();
  renderCollection();
  window.renderSales?.();
  window.renderAnalytics?.();
  window.updateUniversalBar?.();
  window.updateSummaryCards?.();
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
