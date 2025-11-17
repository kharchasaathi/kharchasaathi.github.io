/* =======================================================
   📦 stock.js — Product Stock Manager
   Works with: core.js, types.js, sales.js, wanting.js
   ======================================================= */

/* window.stock already loaded from core.js */

/* -------------------------------------------------------
   ➕ ADD / UPDATE STOCK
------------------------------------------------------- */
function addStock() {
  const date = document.getElementById("pdate")?.value;
  const type = document.getElementById("ptype")?.value;
  const name = document.getElementById("pname")?.value.trim();
  const qty = parseInt(document.getElementById("pqty")?.value || 0);
  const cost = parseFloat(document.getElementById("pcost")?.value || 0);

  if (!date || !type || !name || !qty || !cost)
    return alert("Please fill all fields.");

  // Check if product already exists
  let item = window.stock.find(
    s => s.type === type && s.name.toLowerCase() === name.toLowerCase()
  );

  if (item) {
    item.qty += qty;
    item.cost = cost;
    item.date = date;

    item.history = item.history || [];
    item.history.push({ date, qty, cost });
  }
  else {
    window.stock.push({
      date,
      type,
      name,
      qty,
      sold: 0,
      cost,
      history: [{ date, qty, cost }]
    });
  }

  saveStock();
  renderStock();

  // clear form
  document.getElementById("pname").value = "";
  document.getElementById("pqty").value = "";
  document.getElementById("pcost").value = "";
}

/* -------------------------------------------------------
   🔥 RENDER STOCK TABLE
------------------------------------------------------- */
function renderStock() {
  const filter = document.getElementById("filterType")?.value || "all";
  const tbody = document.querySelector("#stockTable tbody");

  if (!tbody) return;

  let html = "";

  window.stock
    .filter(item => filter === "all" || item.type === filter)
    .forEach((item, index) => {
      const sold = item.sold || 0;
      const remain = item.qty - sold;
      const limit = getGlobalLimit();

      let status = "OK", cls = "ok";

      if (remain <= 0) {
        status = "OUT";
        cls = "out";
      } else if (remain <= limit) {
        status = "LOW";
        cls = "low";
      }

      html += `
      <tr>
        <td>${item.date}</td>
        <td>${esc(item.type)}</td>
        <td>${esc(item.name)}</td>
        <td>${item.qty}</td>
        <td>${sold}</td>
        <td>${remain}</td>
        <td class="${cls}">${status}</td>
        <td>${limit}</td>
        <td>
          <button class="history-btn" data-i="${index}">📜</button>
          <button class="sale-btn" data-i="${index}">💸</button>
          <button class="credit-btn" data-i="${index}">📒</button>
        </td>
        <td>
  <button onclick="viewHistory('${p.id}')" class="small-btn">📜 History</button>
  <button onclick="quickSale('${p.id}')" class="small-btn">💰 Sale</button>
  <button onclick="addCredit('${p.id}')" class="small-btn">💳 Credit</button>
</td>
      </tr>`;
    });

  tbody.innerHTML = html || `<tr><td colspan="9">No Stock Found</td></tr>`;
}

/* -------------------------------------------------------
   📜 SHOW STOCK HISTORY
------------------------------------------------------- */
function showHistory(i) {
  const s = window.stock[i];
  if (!s || !s.history) return alert("No history available.");

  let msg = `${s.name} History:\n\n`;

  s.history.forEach(h => {
    msg += `${h.date} — Qty: ${h.qty} @ ₹${h.cost}\n`;
  });

  alert(msg);
}

/* -------------------------------------------------------
   💸 SALE / CREDIT FROM STOCK PAGE
------------------------------------------------------- */
function stockSale(i, mode) {
  const s = window.stock[i];
  if (!s) return;

  const remain = (s.qty - (s.sold || 0));
  if (remain <= 0) return alert("No stock left!");

  const qty = parseInt(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = parseFloat(prompt("Enter Sale Price ₹:"));
  if (!price || price <= 0) return;

  const date = todayDate();
  const cost = getProductCost(s.type, s.name);
  const profit = (price - cost) * qty;

  // Update sold qty
  s.sold = (s.sold || 0) + qty;

  // Save sale entry
  window.sales.push({
    date,
    type: s.type,
    product: s.name,
    qty,
    price,
    amount: price * qty,
    profit: Math.round(profit),
    status: mode
  });

  saveStock();
  saveSales();

  // Auto add to wanting when finished
  if (s.sold >= s.qty) {
    let want = window.wanting || [];
    want.push({ date, type: s.type, name: s.name, note: "Auto Added" });
    window.wanting = want;
    saveWanting();
    alert(`${s.name} finished! Auto-added to Wanting.`);
  }

  renderStock();
  if (typeof renderSales === "function") renderSales();
}

/* -------------------------------------------------------
   🖱 EVENT HANDLING
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addStockBtn") addStock();
  if (e.target.id === "clearStockBtn") {
    if (confirm("Clear all stock?")) {
      window.stock = [];
      saveStock();
      renderStock();
    }
  }

  if (e.target.classList.contains("history-btn"))
    showHistory(e.target.dataset.i);

  if (e.target.classList.contains("sale-btn"))
    stockSale(e.target.dataset.i, "Paid");

  if (e.target.classList.contains("credit-btn"))
    stockSale(e.target.dataset.i, "Credit");
});

/* -------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderStock();
});
