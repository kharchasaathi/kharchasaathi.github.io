/* ==========================================================
   💰 sales.js — Sales Viewer + Profit Manager (FINAL v5.0)
   PURE VIEW MODE — No manual sale adding
   Sales come only from:
     ✔ Stock Quick Sale
     ✔ Stock Quick Credit
========================================================== */

/* window.sales already loaded from core.js */

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
    window.types
      .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
      .join("");
}

/* ----------------------------------------------------------
   FILTER TRIGGER (DATE + TYPE)
---------------------------------------------------------- */
qs("#filterSalesBtn")?.addEventListener("click", () => {
  renderSales();
});

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
   DELETE ALL SALES
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

  window.sales
    .filter(s => typeFilter === "all" || s.type === typeFilter)
    .filter(s => !dateFilter || s.date === dateFilter)
    .forEach(s => {
      total += Number(s.amount);
      profit += Number(s.profit);

      rows += `
        <tr>
          <td>${s.date}</td>
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
  renderSales();
});
