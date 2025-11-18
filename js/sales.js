/* ==========================================================
   💰 sales.js — Sales Viewer + Profit Manager (FINAL v6.0)
   PURE VIEW MODE — No manual manual sale adding.
   Sales come only from:
     ✔ Stock Quick Sale
     ✔ Stock Quick Credit
   FULL dd-mm-yyyy SUPPORT
========================================================== */

/* window.sales already loaded + normalized in core.js */

/* ----------------------------------------------------------
   SAVE SALES
---------------------------------------------------------- */
function saveSales() {
  localStorage.setItem("sales-data", JSON.stringify(window.sales));
  window.dispatchEvent(new Event("storage"));
}

/* ----------------------------------------------------------
   REFRESH TYPE FILTER DROPDOWN
---------------------------------------------------------- */
function refreshSaleTypeSelector() {
  const tdd = qs("#saleType");
  if (!tdd) return;

  tdd.innerHTML =
    `<option value="all">All Types</option>` +
    (window.types || [])
      .map(t => `<option value="${esc(t.name || t)}">${esc(t.name || t)}</option>`)
      .join("");
}

/* ----------------------------------------------------------
   IMMEDIATE FILTERING (Type + Date)
---------------------------------------------------------- */
function attachImmediateSalesFilters() {
  qs("#saleType")?.addEventListener("change", renderSales);
  qs("#saleDate")?.addEventListener("change", () => {
    let d = qs("#saleDate").value;
    qs("#saleDate").value = d; // stays yyyy-mm-dd internally
    renderSales();
  });
}

/* ----------------------------------------------------------
   MARK CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (s.status === "Paid") return alert("Already Paid");

  if (!confirm("Mark this entry as PAID?")) return;

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
  const typeFilter = qs("#saleType")?.value || "all";
  const dateFilter = qs("#saleDate")?.value || "";

  if (!tbody) return;

  let total = 0;
  let profit = 0;
  let rows = "";

  (window.sales || [])
    .filter(s => typeFilter === "all" || s.type === typeFilter)
    .filter(s => !dateFilter || s.date === dateFilter)
    .forEach(s => {
      const dispDate = toDisplay(s.date); // always dd-mm-yyyy in UI

      total += Number(s.amount || 0);
      profit += Number(s.profit || 0);

      rows += `
        <tr>
          <td>${dispDate}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.product)}</td>
          <td>${s.qty}</td>
          <td>${s.price}</td>
          <td>${s.amount}</td>
          <td>${s.profit}</td>
          <td>${s.status === "Credit" ? "💳 Credit" : "💰 Paid"}</td>
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

/* Expose functions */
window.refreshSaleTypeSelector = refreshSaleTypeSelector;
window.renderSales = renderSales;
window.markSalePaid = markSalePaid;
window.saveSales = saveSales;
