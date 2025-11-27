/* ===========================================================
   collection.js — Collection Center (SAFE FINAL V4.0)
   • Pending Sales (Credit)
   • Pending Services (Advance < Total)
   • Collection History
   • Universal Summary (Sales + Service + Pending + Investment)
=========================================================== */

const esc = x => (x === undefined || x === null) ? "" : String(x);

/* -----------------------------------------------------------
   HISTORY STORAGE
----------------------------------------------------------- */
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections));
  } catch (e) {
    console.warn("Collection save error:", e);
  }
}

/* -----------------------------------------------------------
   PUBLIC ADD ENTRY
----------------------------------------------------------- */
window.addCollectionEntry = function (source, details, amount) {
  const entry = {
    id: "coll_" + Date.now(),
    date: todayDate(),
    source: esc(source),
    details: esc(details),
    amount: Number(amount || 0)
  };

  window.collections.push(entry);
  saveCollections();
  renderCollection();
};

/* -----------------------------------------------------------
   SUMMARY NUMBERS
----------------------------------------------------------- */
function getNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

function computeCollectionSummary() {
  let salesCollected = 0;
  let serviceCollected = 0;
  let pendingCredit = 0;
  let investmentRemain = 0;

  // ✔ Sales Collected (profit only of PAID)
  (window.sales || []).forEach(s => {
    const st = String(s.status || "").toLowerCase();
    if (st !== "credit") {
      salesCollected += getNum(s.profit);
    }
  });

  // ✔ Service Collected (completed only)
  (window.services || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "completed") {
      serviceCollected += getNum(s.profit);
    }
  });

  // ✔ Pending Credits (sales)
  (window.sales || []).forEach(s => {
    if (String(s.status).toLowerCase() === "credit") {
      const total = getNum(s.total || s.qty * s.price);
      pendingCredit += total;
    }
  });

  // ✔ Investment After Sale (stock remain + service investment)
  if (typeof window.getStockInvestmentAfterSale === "function") {
    investmentRemain += getNum(window.getStockInvestmentAfterSale());
  }
  if (typeof window.getServiceInvestmentCollected === "function") {
    investmentRemain += getNum(window.getServiceInvestmentCollected());
  }

  return { salesCollected, serviceCollected, pendingCredit, investmentRemain };
}

/* -----------------------------------------------------------
   RENDER SUMMARY + HISTORY
----------------------------------------------------------- */
function renderCollection() {

  // ---- SUMMARY UPDATE ----
  const sum = computeCollectionSummary();
  qs("#colSales").textContent     = "₹" + Math.round(sum.salesCollected);
  qs("#colService").textContent   = "₹" + Math.round(sum.serviceCollected);
  qs("#colCredit").textContent    = "₹" + Math.round(sum.pendingCredit);
  qs("#colInvRemain").textContent = "₹" + Math.round(sum.investmentRemain);

  // ---- HISTORY TABLE ----
  const tbody = qs("#collectionHistory tbody");
  if (!tbody) return;

  const list = window.collections || [];

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;opacity:0.6">
          No collection history yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list
    .map(e => `
      <tr>
        <td data-label="Date">${e.date}</td>
        <td data-label="Source">${e.source}</td>
        <td data-label="Details">${e.details}</td>
        <td data-label="Amount">₹${e.amount}</td>
      </tr>
    `)
    .join("");
}

window.renderCollection = renderCollection;

/* -----------------------------------------------------------
   GET PENDING LIST (Credit Sales + Service Pending)
----------------------------------------------------------- */
function getPendingList() {
  const list = [];

  // ---- Sales pending credit ----
  (window.sales || []).forEach(s => {
    if (String(s.status).toLowerCase() === "credit") {
      const pending = Number(s.total || (s.qty * s.price));
      if (pending > 0) {
        list.push({
          id: s.id,
          name: s.product,
          type: "Sale Credit",
          date: s.date,
          pending,
          source: "sales"
        });
      }
    }
  });

  // ---- Service pending ----
  (window.services || []).forEach(j => {
    if (String(j.status).toLowerCase() === "pending") {
      const total = Number(j.invest || 0) + Number(j.paid || 0) + Number(j.remaining || 0);
      const adv = Number(j.advance || 0);
      const pending = total - adv;

      if (pending > 0) {
        list.push({
          id: j.id,
          name: j.customer,
          type: "Service",
          date: j.date_in,
          pending,
          source: "service"
        });
      }
    }
  });

  return list;
}

/* -----------------------------------------------------------
   RENDER PENDING COLLECTION TABLE
----------------------------------------------------------- */
function renderPendingCollections() {
  const tbody = qs("#pendingCollectionTable tbody");
  if (!tbody) return;

  const list = getPendingList();

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;opacity:0.6">
          No pending collections
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((r, i) => `
      <tr>
        <td data-label="Date">${r.date}</td>
        <td data-label="Name">${r.name}</td>
        <td data-label="Type">${r.type}</td>
        <td data-label="Pending">₹${r.pending}</td>
        <td data-label="Action">
          <button class="small-btn collectNowBtn" data-i="${i}">
            Collect
          </button>
        </td>
      </tr>
    `)
    .join("");
}

/* -----------------------------------------------------------
   COLLECT BUTTON LOGIC
----------------------------------------------------------- */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("collectNowBtn")) return;

  const idx = Number(e.target.dataset.i);
  const list = getPendingList();
  const item = list[idx];
  if (!item) return;

  let amt = Number(prompt(`Collect amount (Pending ₹${item.pending}):`));
  if (!amt || amt <= 0) return alert("Invalid amount!");
  if (amt > item.pending) return alert("More than pending!");

  // ---- Add to History ----
  window.addCollectionEntry(item.type, item.name, amt);

  // ---- Update Sales ----
  if (item.source === "sales") {
    let row = (window.sales || []).find(x => x.id === item.id);
    if (row) {
      row.total -= amt;
      if (row.total <= 0) row.status = "Paid";
      saveSales();
    }
  }

  // ---- Update Service ----
  if (item.source === "service") {
    let job = (window.services || []).find(x => x.id === item.id);
    if (job) {
      job.advance += amt;
      const total = Number(job.invest || 0) + Number(job.paid || 0) + Number(job.remaining || 0);

      if (job.advance >= total) job.status = "Completed";
      saveServices?.();
    }
  }

  renderPendingCollections();
  renderCollection();
});

/* -----------------------------------------------------------
   CLEAR HISTORY
----------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
  }
});

/* -----------------------------------------------------------
   INIT
----------------------------------------------------------- */
window.addEventListener("load", () => {
  renderPendingCollections();
  renderCollection();
});
