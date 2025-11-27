/* ===========================================================
   collection.js — FINAL V2.1 (No duplicate esc)
   ✔ Uses window.sales & window.services
   ✔ Credit Sales + Service Collections
   ✔ Collection History
   ✔ Pie Chart
=========================================================== */


/* -------------------------------------------------------
   🔄 GET ALL PENDING COLLECTIONS
------------------------------------------------------- */
function getAllCollections() {
  const sales = window.sales || [];
  const services = window.services || [];

  let list = [];

  // 🟦 CREDIT SALES
  sales.forEach(s => {
    if (String(s.status).toLowerCase() === "credit") {
      const total = Number(
        s.total ||
        (Number(s.qty || 0) * Number(s.price || 0))
      );

      list.push({
        id: s.id,
        type: "sale",
        date: s.date,
        name: esc(s.name),
        itemType: esc(s.type),
        pending: total
      });
    }
  });

  // 🟧 SERVICE PENDING PAYMENTS
  services.forEach(j => {
    if (String(j.status).toLowerCase() === "pending") {
      const bill = Number(j.bill || 0);
      const adv  = Number(j.advance || 0);
      const pendingAmt = bill - adv;

      if (pendingAmt > 0) {
        list.push({
          id: j.id,
          type: "service",
          date: j.date_in,
          name: esc(j.customer),
          itemType: esc(j.item),
          pending: pendingAmt
        });
      }
    }
  });

  return list;
}

/* -------------------------------------------------------
   📥 RENDER MAIN COLLECTION TABLE
------------------------------------------------------- */
function renderCollection() {
  const tbody = qs("#collectionTable tbody");
  if (!tbody) return;

  const list = getAllCollections();

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4">No pending collections</td></tr>`;
  } else {
    tbody.innerHTML = list.map((c, i) => `
      <tr>
        <td data-label="Date">${toDisplay(c.date)}</td>
        <td data-label="Type">${c.type === "sale" ? "Credit Sale" : "Service"}</td>
        <td data-label="Details">${c.itemType} — ${c.name}</td>
        <td data-label="Pending">₹${c.pending}</td>
        <td data-label="Action">
          <button class="collect-btn small-btn" data-i="${i}">
            Collect
          </button>
        </td>
      </tr>
    `).join("");
  }

  renderCollectionHistory();
  renderCollectionPie();
}

/* -------------------------------------------------------
   📜 HISTORY STORAGE
------------------------------------------------------- */
function loadCollectionHistory() {
  window.collectionHistory = JSON.parse(
    localStorage.getItem("ks-collection-history") || "[]"
  );
}
function saveCollectionHistory() {
  localStorage.setItem(
    "ks-collection-history",
    JSON.stringify(window.collectionHistory || [])
  );
}

/* -------------------------------------------------------
   📖 RENDER HISTORY TABLE
------------------------------------------------------- */
function renderCollectionHistory() {
  const body = qs("#collectionHistory tbody");
  if (!body) return;

  const list = window.collectionHistory || [];

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="4">No history found</td></tr>`;
    return;
  }

  body.innerHTML = list.map(h => `
    <tr>
      <td data-label="Date">${toDisplay(h.date)}</td>
      <td data-label="Source">${h.kind}</td>
      <td data-label="Details">${esc(h.details)}</td>
      <td data-label="Amount">₹${h.amount}</td>
    </tr>
  `).join("");
}

/* -------------------------------------------------------
   💰 COLLECT AMOUNT
------------------------------------------------------- */
function collectAmount(i) {
  const list = getAllCollections();
  const item = list[i];
  if (!item) return;

  let amt = Number(prompt(`Enter amount to collect (Pending ₹${item.pending}):`));

  if (!amt || amt <= 0) return alert("Invalid amount");
  if (amt > item.pending) return alert("Amount exceeds pending!");

  /* ----- SAVE TO HISTORY ----- */
  window.collectionHistory = window.collectionHistory || [];
  window.collectionHistory.push({
    id: uid("coll"),
    date: todayDate(),
    kind: item.type === "sale" ? "Credit Sale" : "Service",
    details: `${item.itemType} — ${item.name}`,
    amount: amt
  });
  saveCollectionHistory();

  /* ----- UPDATE SALES / SERVICES ----- */
  if (item.type === "sale") {
    const s = (window.sales || []).find(x => x.id === item.id);
    if (s) {
      const total = Number(s.total || 0);
      s.total = total - amt;
      if (s.total <= 0) s.status = "paid";
      saveSales();
    }
  } else {
    const j = (window.services || []).find(x => x.id === item.id);
    if (j) {
      j.advance = Number(j.advance || 0) + amt;
      if (j.advance >= Number(j.bill || 0)) j.status = "Completed";
      saveServices();
    }
  }

  renderCollection();
  renderAnalytics?.();
  updateSummaryCards?.();
}

/* -------------------------------------------------------
   🥧 PIE CHART
------------------------------------------------------- */
let collPieChart = null;

function renderCollectionPie() {
  const ctx = qs("#collectionPie");
  if (!ctx) return;

  const list = getAllCollections();
  const pending = list.reduce((a,b)=>a + Number(b.pending||0), 0);
  const collected = (window.collectionHistory || [])
    .reduce((a,b)=>a + Number(b.amount||0), 0);

  if (collPieChart) collPieChart.destroy();

  collPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pending", "Collected"],
      datasets: [{
        data: [pending, collected],
        backgroundColor: ["#d32f2f","#2e7d32"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/* -------------------------------------------------------
   🔘 BUTTON HANDLER
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.classList.contains("collect-btn")) {
    collectAmount(Number(e.target.dataset.i));
  }
});

/* -------------------------------------------------------
   🚀 INIT
------------------------------------------------------- */
window.addEventListener("load", () => {
  loadCollectionHistory();
  renderCollection();
});
