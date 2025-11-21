/* =======================================================
   📦 stock.js — Inventory Manager (FINAL v7.2)
   - History restored (no error)
   - Correct product key for sales.js compatibility
   - No undefined sales
   - Fully synced with analytics + profit tab
======================================================= */

const toDisp = window.toDisplay;
const toInt  = window.toInternal;

/* -------------------------------------------------------
   ADD STOCK ENTRY
------------------------------------------------------- */
function addStock() {
  let date = qs("#pdate")?.value || todayDate();
  const type = qs("#ptype")?.value;
  const name = qs("#pname")?.value.trim();
  const qty  = Number(qs("#pqty")?.value || 0);
  const cost = Number(qs("#pcost")?.value || 0);

  if (!type || !name || qty <= 0 || cost <= 0)
    return alert("Please fill all fields.");

  if (date.includes("-") && date.split("-")[0].length === 2)
    date = toInt(date);

  addStockEntry({ date, type, name, qty, cost });

  renderStock();
  updateTypeDropdowns?.();

  qs("#pname").value = "";
  qs("#pqty").value = "";
  qs("#pcost").value = "";
}

/* -------------------------------------------------------
   RENDER STOCK LIST
------------------------------------------------------- */
function renderStock() {
  const filter = qs("#filterType")?.value || "all";
  const tbody = qs("#stockTable tbody");
  if (!tbody) return;

  let html = "";

  (window.stock || [])
    .filter(item => filter === "all" || item.type === filter)
    .forEach((p, i) => {

      const sold   = Number(p.sold || 0);
      const remain = Number(p.qty) - sold;
      const limit  = Number(p.limit ?? getGlobalLimit());

      let cls = "ok";
      if (remain <= 0) cls = "out";
      else if (remain <= limit) cls = "low";

      let style = "";
      if (cls === "low") style = 'style="background:#fff8ec"';
      if (cls === "out") style = 'style="background:#ffecec;color:#a00;font-weight:600"';

      html += `
        <tr class="${cls}" ${style}>
          <td>${toDisp(p.date)}</td>
          <td>${esc(p.type)}</td>
          <td>${esc(p.name)}</td>
          <td>${p.qty}</td>
          <td>${sold}</td>
          <td>${remain}</td>
          <td>${cls.toUpperCase()}</td>
          <td>${limit}</td>
          <td>
            <button class="history-btn" data-i="${i}">📜 History</button>
            <button class="sale-btn" data-i="${i}">💰 Sale</button>
            <button class="credit-btn" data-i="${i}">💳 Credit</button>
          </td>
        </tr>`;
    });

  tbody.innerHTML = html || `<tr><td colspan="9">No Stock Found</td></tr>`;
}

/* -------------------------------------------------------
   📜 HISTORY VIEW (GLOBAL)
------------------------------------------------------- */
function showHistory(i) {
  const p = window.stock[i];
  if (!p?.history?.length)
    return alert("No history found.");

  let msg = `Purchase History of ${p.name}:\n\n`;

  p.history.forEach(h => {
    msg += `${toDisp(h.date)} — Qty ${h.qty} @ ₹${h.cost}\n`;
  });

  alert(msg);
}
window.showHistory = showHistory;

/* -------------------------------------------------------
   QUICK SALE / CREDIT
------------------------------------------------------- */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const sold   = Number(p.sold || 0);
  const remain = Number(p.qty) - sold;

  if (remain <= 0) return alert("No stock left!");

  const qty = Number(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = Number(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  const cost = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - (qty * cost);

  p.sold = sold + qty;

  window.sales.push({
    id: uid("sale"),
    date: todayDate(),
    type: p.type,
    product: p.name,   // FULLY CORRECT (sales.js supports this)
    qty,
    price,
    total,
    amount: total,
    cost,
    profit,
    status: mode
  });

  saveStock();
  saveSales();

  if (p.sold >= p.qty)
    autoAddWanting(p.type, p.name, "Finished");

  renderStock();
  renderSales?.();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* -------------------------------------------------------
   BUTTON HANDLERS
------------------------------------------------------- */
document.addEventListener("click", e => {

  if (e.target.id === "addStockBtn")
    return addStock();

  if (e.target.id === "setLimitBtn") {
    const v = Number(qs("#globalLimit")?.value);
    if (v >= 0) {
      setGlobalLimit(v);
      renderStock();
    }
    return;
  }

  if (e.target.id === "clearStockBtn") {
    if (confirm("Clear ALL stock?")) {
      window.stock = [];
      saveStock();
      renderStock();
    }
    return;
  }

  if (e.target.classList.contains("history-btn"))
    return showHistory(Number(e.target.dataset.i));

  if (e.target.classList.contains("sale-btn"))
    return stockQuickSale(Number(e.target.dataset.i), "Paid");

  if (e.target.classList.contains("credit-btn"))
    return stockQuickSale(Number(e.target.dataset.i), "Credit");
});

qs("#filterType")?.addEventListener("change", renderStock);

/* -------------------------------------------------------
   INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  updateTypeDropdowns?.();
  renderStock();
});
