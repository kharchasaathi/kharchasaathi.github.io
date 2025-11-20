/* ==========================================================
   💰 sales.js — Sales Viewer + Profit Manager (CLOUD v9.0)
   ✔ Credit profit excluded until Paid
   ✔ Auto Sync → Firebase Cloud (Debounced)
   ✔ No UI changes — drop-in replacement
========================================================== */

function saveSales() {
  localStorage.setItem("sales-data", JSON.stringify(window.sales));

  // 🔥 NEW: Cloud Sync
  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("sales", { items: window.sales });
  }

  window.dispatchEvent(new Event("storage"));
}

/* TYPE FILTER */
function refreshSaleTypeSelector() {
  const tdd = qs("#saleType");
  if (!tdd) return;

  tdd.innerHTML =
    `<option value="all">All Types</option>` +
    (window.types || [])
      .map(t => `<option value="${esc(t.name || t)}">${esc(t.name || t)}</option>`)
      .join("");
}

/* LIVE FILTER */
function attachImmediateSalesFilters() {
  qs("#saleType")?.addEventListener("change", renderSales);
  qs("#saleDate")?.addEventListener("change", renderSales);
}

/* ----------------------------------------------------------
   MARK CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (s.status === "Paid") {
    alert("Already Paid");
    return;
  }

  if (!confirm("Mark this CREDIT sale as PAID?")) return;

  s.status = "Paid";

  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* ----------------------------------------------------------
   CLEAR ALL SALES
---------------------------------------------------------- */
qs("#clearSalesBtn")?.addEventListener("click", () => {
  if (!confirm("Delete ALL sales permanently?")) return;

  window.sales = [];
  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
});

/* ----------------------------------------------------------
   RENDER SALES TABLE
---------------------------------------------------------- */
function renderSales() {
  const tbody = qs("#salesTable tbody");
  const totalEl = qs("#salesTotal");
  const profitEl = qs("#profitTotal");

  if (!tbody) return;

  const typeFilter = qs("#saleType")?.value || "all";
  const dateFilter = qs("#saleDate")?.value || "";

  let total = 0;
  let profit = 0;
  let rows = "";

  (window.sales || [])
    .filter(s => typeFilter === "all" || s.type === typeFilter)
    .filter(s => !dateFilter || s.date === dateFilter)
    .forEach(s => {

      const dispDate = toDisplay(s.date);

      total += Number(s.amount || 0);

      if (String(s.status).toLowerCase() !== "credit") {
        profit += Number(s.profit || 0);
      }

      const statusBtn =
        s.status === "Credit"
          ? `<button class="small-btn"
               style="background:#ff9800;color:#fff"
               onclick="markSalePaid('${s.id}')">CREDIT</button>`
          : `💰 Paid`;

      rows += `
        <tr>
          <td>${dispDate}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.product)}</td>
          <td>${s.qty}</td>
          <td>${s.price}</td>
          <td>${s.amount}</td>
          <td>${s.profit}</td>
          <td>${statusBtn}</td>
        </tr>
      `;
    });

  if (!rows)
    rows = `<tr><td colspan="8">No sales found</td></tr>`;

  tbody.innerHTML = rows;
  totalEl.textContent = total;
  profitEl.textContent = profit;
}

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleTypeSelector();
  attachImmediateSalesFilters();
  renderSales();
});

window.refreshSaleTypeSelector = refreshSaleTypeSelector;
window.renderSales = renderSales;
window.markSalePaid = markSalePaid;
window.saveSales = saveSales;
