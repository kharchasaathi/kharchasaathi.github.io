/* =======================================================
   📦 stock.js — Inventory Manager (FINAL CLEAN v11.1)
   ✔ BEFORE-SALE investment (total purchase cost)
   ✔ AFTER-SALE investment (remain × cost)
   ✔ Shows BEFORE-sale investment in stock tab
   ✔ Auto-updates analytics, overview, dashboard
   ✔ Fully compatible with core.js (V7.3)
   ✔ NOW quick-sale also stores TIME (12-HOUR AM/PM)
======================================================= */

const toDisp = window.toDisplay;
const toInt  = window.toInternal;

/* -------------------------------------------------------
   TIME (12 hr format)
------------------------------------------------------- */
function getCurrentTime12hr() {
  const now = new Date();

  let hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  hh = hh === 0 ? 12 : hh;

  return `${hh}:${mm}:${ss} ${ampm}`;
}

/* -------------------------------------------------------
   BEFORE SALE INVESTMENT
------------------------------------------------------- */
function calcStockInvestmentBeforeSale() {
  let total = 0;

  (window.stock || []).forEach(p => {
    if (p.history?.length) {
      p.history.forEach(h => {
        total += Number(h.cost || 0) * Number(h.qty || 0);
      });
    } else {
      total += Number(p.cost || 0) * Number(p.qty || 0);
    }
  });

  return total;
}

/* -------------------------------------------------------
   AFTER SALE INVESTMENT
------------------------------------------------------- */
function calcStockInvestmentAfterSale() {
  let total = 0;

  (window.stock || []).forEach(p => {
    const qty    = Number(p.qty || 0);
    const sold   = Number(p.sold || 0);
    const cost   = Number(p.cost || 0);
    const remain = qty - sold;

    if (remain > 0)
      total += remain * cost;
  });

  return total;
}

/* -------------------------------------------------------
   UPDATE UI BOX
------------------------------------------------------- */
function updateStockInvestmentBox() {
  const box = qs("#stockInvValue");
  if (box) box.textContent = "₹" + calcStockInvestmentBeforeSale();
}

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
  updateStockInvestmentBox();

  qs("#pname").value = "";
  qs("#pqty").value  = "";
  qs("#pcost").value = "";
}

/* -------------------------------------------------------
   RENDER STOCK TABLE
------------------------------------------------------- */
function renderStock() {
  const filterType = qs("#filterType")?.value || "all";
  const searchTxt  = (qs("#productSearch")?.value || "").trim().toLowerCase();
  const tbody = qs("#stockTable tbody");
  if (!tbody) return;

  let html = "";

  (window.stock || [])
    .filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (searchTxt && !item.name.toLowerCase().includes(searchTxt)) return false;
      return true;
    })
    .forEach((p, i) => {

      const sold   = Number(p.sold || 0);
      const remain = Number(p.qty) - sold;
      const limit  = Number(getGlobalLimit());

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

  updateStockInvestmentBox();
}

/* -------------------------------------------------------
   HISTORY POPUP
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
   (NOW ADDS TIME)
------------------------------------------------------- */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const remain = Number(p.qty) - Number(p.sold || 0);
  if (remain <= 0) return alert("No stock left!");

  const qty = Number(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = Number(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  const cost  = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - (qty * cost);

  p.sold = (p.sold || 0) + qty;

  // ADD TIME HERE
  const timeNow = getCurrentTime12hr();

  window.sales = window.sales || [];
  window.sales.push({
    id: uid("sale"),
    date: todayDate(),
    time: timeNow,     // ★ NEW
    type: p.type,
    product: p.name,
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
  updateTabSummaryBar?.();
}

/* -------------------------------------------------------
   BUTTON EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {

  if (e.target.id === "addStockBtn")
    return addStock();

  if (e.target.id === "setLimitBtn") {
    const v = Number(qs("#globalLimit")?.value);

    if (v < 0 || isNaN(v)) return alert("Invalid Limit!");

    if (!confirm(`Set global limit = ${v} for ALL products?`)) return;

    setGlobalLimit(v);
    alert("Global limit updated.");
    renderStock();
    return;
  }

  if (e.target.id === "clearStockBtn") {
    if (confirm("Clear ALL stock?")) {
      window.stock = [];
      saveStock();
      renderStock();
      updateStockInvestmentBox();
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

/* -------------------------------------------------------
   FILTER + SEARCH EVENTS
------------------------------------------------------- */
qs("#filterType")?.addEventListener("change", renderStock);
qs("#productSearch")?.addEventListener("input", renderStock);

/* -------------------------------------------------------
   INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  updateTypeDropdowns?.();
  renderStock();
  updateStockInvestmentBox();
});
