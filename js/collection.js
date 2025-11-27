/* ===========================================================
   collection.js — Collection Manager (FINAL V1.0)
   • Auto-loads all pending collections
   • Supports: Credit Sales + Service Pending Payments
   • Allows collecting partial / full payments
   • Adds entry into Collection History
   • Clean colourful table UI compatible
=========================================================== */

const esc = x => (x === undefined || x === null) ? "" : String(x);

/* -------------------------------------------------------
   🔄 LOAD ALL COLLECTION ITEMS
------------------------------------------------------- */
function getAllCollections() {
  const sales = window.sales || [];
  const services = window.serviceJobs || [];

  let list = [];

  // 🟦 CREDIT SALES
  sales.forEach(s => {
    if (s.status === "credit") {
      list.push({
        id: s.id,
        type: "sale",
        date: s.date,
        itemType: esc(s.type),
        name: esc(s.name),
        amount: Number(s.total || 0),
        pending: Number(s.total || 0),
      });
    }
  });

  // 🟧 SERVICE PENDING PAYMENTS
  services.forEach(s => {
    if (s.status === "pending") {
      const pendingAmt = Number(s.total || 0) - Number(s.advance || 0);
      if (pendingAmt > 0) {
        list.push({
          id: s.id,
          type: "service",
          date: s.received,
          itemType: esc(s.item),
          name: esc(s.customer),
          amount: pendingAmt,
          pending: pendingAmt,
        });
      }
    }
  });

  return list;
}

/* -------------------------------------------------------
   📥 RENDER COLLECTION TABLE
------------------------------------------------------- */
function renderCollection() {
  const tbody = qs("#collectionTable tbody");
  const historyBody = qs("#collectionHistory tbody");
  if (!tbody) return;

  const list = getAllCollections();

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5">No pending collections</td></tr>`;
  } else {
    tbody.innerHTML = list.map((c, i) => `
      <tr>
        <td data-label="Date">${toDisplay(c.date)}</td>
        <td data-label="Name">${esc(c.name)}</td>
        <td data-label="Type">${c.type === "sale" ? "Sale Credit" : "Service"}</td>
        <td data-label="Pending">₹${c.pending}</td>

        <td data-label="Action">
          <button class="small-btn collect-btn" data-i="${i}">
            Collect
          </button>
        </td>
      </tr>
    `).join("");
  }

  // ⬇️ RENDER HISTORY
  renderCollectionHistory();

  // ⬇️ UPDATE PIE
  renderCollectionPie();
}

/* -------------------------------------------------------
   🧾 SAVE COLLECTION HISTORY
------------------------------------------------------- */
function saveCollectionHistory() {
  localStorage.setItem("collectionHistory", JSON.stringify(window.collectionHistory || []));
}

/* -------------------------------------------------------
   📜 LOAD COLLECTION HISTORY
------------------------------------------------------- */
function loadCollectionHistory() {
  window.collectionHistory = JSON.parse(localStorage.getItem("collectionHistory") || "[]");
}

/* -------------------------------------------------------
   📖 RENDER HISTORY LIST
------------------------------------------------------- */
function renderCollectionHistory() {
  const body = qs("#collectionHistory tbody");
  if (!body) return;

  const list = window.collectionHistory || [];

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="4">No history yet</td></tr>`;
    return;
  }

  body.innerHTML = list.map(h => `
    <tr>
      <td data-label="Date">${toDisplay(h.date)}</td>
      <td data-label="Name">${esc(h.name)}</td>
      <td data-label="Type">${h.kind}</td>
      <td data-label="Amount">₹${h.amount}</td>
    </tr>
  `).join("");
}

/* -------------------------------------------------------
   💰 PROCESS COLLECTION PAYMENT
------------------------------------------------------- */
function collectAmount(i) {
  const list = getAllCollections();
  const item = list[i];
  if (!item) return;

  let amt = Number(prompt(`Enter amount to collect (Pending ₹${item.pending}):`));

  if (!amt || amt <= 0) return alert("Invalid amount!");
  if (amt > item.pending) return alert("Amount exceeds pending!");

  // RECORD HISTORY
  window.collectionHistory = window.collectionHistory || [];
  window.collectionHistory.push({
    id: uid("coll"),
    ref: item.id,
    kind: item.type === "sale" ? "Credit Sale" : "Service",
    date: todayDate(),
    name: item.name,
    amount: amt
  });
  saveCollectionHistory();

  // UPDATE SALES / SERVICE RECORD
  if (item.type === "sale") {
    let s = (window.sales || []).find(x => x.id === item.id);
    if (s) {
      s.total = Number(s.total) - amt;
      if (s.total <= 0) s.status = "paid";
      saveSales();
    }
  } else {
    let sv = (window.serviceJobs || []).find(x => x.id === item.id);
    if (sv) {
      if (!sv.paid) sv.paid = 0;
      sv.paid += amt;

      if (sv.paid >= sv.total) {
        sv.status = "completed";
      }
      saveService();
    }
  }

  renderCollection();
}

/* -------------------------------------------------------
   🥧 PIE CHART (COLLECTION STATUS)
------------------------------------------------------- */
let collPieChart = null;

function renderCollectionPie() {
  const ctx = qs("#collectionPie");
  if (!ctx) return;

  const list = getAllCollections();

  const pending = list.reduce((a, b) => a + b.pending, 0);
  const collected = (window.collectionHistory || [])
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  const data = [pending, collected];

  if (collPieChart) {
    collPieChart.destroy();
  }

  collPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pending", "Collected"],
      datasets: [{
        data,
      }]
    }
  });
}

/* -------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.classList.contains("collect-btn")) {
    const i = Number(e.target.dataset.i);
    collectAmount(i);
  }
});

/* -------------------------------------------------------
   🚀 INIT
------------------------------------------------------- */
window.addEventListener("load", () => {
  loadCollectionHistory();
  renderCollection();
});

window.renderCollection = renderCollection;
