/* ===========================================================
   collection.js — Collection Center (SAFE FINAL V3.0)
   • Matches business-dashboard v3.1 HTML
   • No errors even if tables are empty
   • Works with only History table (no pending feature)
=========================================================== */

/* ------------ LOCAL HISTORY STORE ------------ */
window.collections = JSON.parse(localStorage.getItem("ks-collections") || "[]");

function saveCollections() {
  try {
    localStorage.setItem("ks-collections", JSON.stringify(window.collections || []));
  } catch (e) {
    console.warn("Unable to save collections", e);
  }
}

/* ------------ PUBLIC ADD ENTRY ------------ */
window.addCollectionEntry = function (source, details, amount) {
  const escFn = window.esc || (x => String(x ?? ""));
  const entry = {
    id: Date.now().toString(),
    date: window.todayDate ? todayDate() : new Date().toISOString().slice(0, 10),
    source: escFn(source || ""),
    details: escFn(details || ""),
    amount: Number(amount || 0)
  };

  window.collections.push(entry);
  saveCollections();
  renderCollection();
};

/* ===========================================================
   SUMMARY NUMBERS
=========================================================== */
function getNum(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

function computeCollectionSummary() {
  let salesCollected = 0;
  let serviceCollected = 0;
  let pendingCredit = 0;
  let investmentRemain = 0;

  // 1) Sales Profit Collected
  (window.sales || []).forEach(s => {
    const status = String(s.status || "").toLowerCase();
    if (status !== "credit") salesCollected += getNum(s.profit);
  });

  // 2) Service Profit Collected
  (window.services || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "completed") {
      serviceCollected += getNum(s.profit);
    }
  });

  // 3) Pending Credits
  (window.sales || []).forEach(s => {
    if (String(s.status || "").toLowerCase() === "credit") {
      const total = getNum(s.total || (getNum(s.qty) * getNum(s.price)));
      pendingCredit += total;
    }
  });

  // 4) Investment After Sale
  if (typeof window.getStockInvestmentAfterSale === "function") {
    investmentRemain += getNum(window.getStockInvestmentAfterSale());
  }
  if (typeof window.getServiceInvestmentCollected === "function") {
    investmentRemain += getNum(window.getServiceInvestmentCollected());
  }

  return { salesCollected, serviceCollected, pendingCredit, investmentRemain };
}

/* ===========================================================
   RENDER COLLECTION TAB
=========================================================== */
function renderCollection() {

  // ---- SUMMARY CARDS UPDATE ----
  const sum = computeCollectionSummary();

  qs("#colSales").textContent      = "₹" + Math.round(sum.salesCollected);
  qs("#colService").textContent    = "₹" + Math.round(sum.serviceCollected);
  qs("#colCredit").textContent     = "₹" + Math.round(sum.pendingCredit);
  qs("#colInvRemain").textContent  = "₹" + Math.round(sum.investmentRemain);

  // ---- HISTORY TABLE ----
  const tbody = document.querySelector("#collectionHistory tbody");
  if (!tbody) return;

  const list = window.collections || [];

  if (list.length === 0) {
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

/* ===========================================================
   CLEAR BUTTON
=========================================================== */
document.addEventListener("click", e => {
  if (e.target && e.target.id === "clearCollectionBtn") {
    if (!confirm("Clear entire collection history?")) return;
    window.collections = [];
    saveCollections();
    renderCollection();
  }
});

/* ===========================================================
   INIT ON LOAD
=========================================================== */
window.addEventListener("load", () => {
  if (!Array.isArray(window.collections)) {
    window.collections = [];
    saveCollections();
  }
  renderCollection();
});
/* ===========================================================
   🔄 BUILD PENDING COLLECTION LIST
=========================================================== */
function getPendingList() {
  const list = [];

  // ---- Sales Pending Credit ----
  (window.sales || []).forEach(s => {
    if (String(s.status).toLowerCase() === "credit") {
      const total = Number(s.total || (s.qty * s.price));
      const pending = total;

      if (pending > 0) {
        list.push({
          id: s.id,
          name: s.product || s.name || "Sale",
          type: "Sale Credit",
          date: s.date,
          pending: pending,
          source: "sales"
        });
      }
    }
  });

  // ---- Service Pending ----
  (window.services || []).forEach(job => {
    if (String(job.status).toLowerCase() === "pending") {
      const total = Number(job.total || 0);
      const adv = Number(job.advance || 0);
      const pending = total - adv;

      if (pending > 0) {
        list.push({
          id: job.id,
          name: job.customer,
          type: "Service",
          date: job.received,
          pending: pending,
          source: "service"
        });
      }
    }
  });

  return list;
}

/* ===========================================================
   📥 RENDER PENDING TABLE
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

  tbody.innerHTML = list.map((r, i) => `
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
  `).join("");
}

/* ===========================================================
   💰 COLLECT BUTTON LOGIC
=========================================================== */
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

  // ---- Update main data ----
  if (item.source === "sales") {
    let row = (window.sales || []).find(x => x.id === item.id);
    if (row) {
      row.total = Number(row.total) - amt;
      if (row.total <= 0) row.status = "paid";
      saveSales();
    }
  }

  if (item.source === "service") {
    let job = (window.services || []).find(x => x.id === item.id);
    if (job) {
      job.advance = Number(job.advance || 0) + amt;
      if (job.advance >= job.total) job.status = "completed";
      saveService();
    }
  }

  renderPendingCollections();
  renderCollection();
  alert("Amount collected!");
});

/* ===========================================================
   ⏳ INIT
=========================================================== */
window.addEventListener("load", () => {
  renderPendingCollections();
  renderCollection();
});
