/* ==========================================================
   💰 sales.js — Sales Viewer + Profit Manager (FINAL v8.1)
   • Compatible with core.saveSales (cloud-enabled) if present
   • Falls back to localStorage when core is absent
   • Credit sale profit excluded until marked Paid
========================================================== */

/* ----- helpers / compatibility ----- */
const _SALES_KEY = "sales-data";

/* Persist sales: if core/window.saveSales exists, prefer that (it does cloud sync).
   Otherwise fallback to localStorage and dispatch storage event. */
function persistSales() {
  try {
    // If core provided a saveSales function (cloud-enabled), call it
    if (typeof window.saveSales === "function" && window.saveSales !== persistSales) {
      // core.saveSales will handle local + cloud saving
      return window.saveSales();
    }
  } catch (e) {
    // ignore and fallback
  }

  // fallback: write to localStorage
  try {
    localStorage.setItem(_SALES_KEY, JSON.stringify(window.sales || []));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Fallback saveSales failed:", e);
  }
}

/* ----- TYPE FILTER ----- */
function refreshSaleTypeSelector() {
  const tdd = qs("#saleType");
  if (!tdd) return;

  tdd.innerHTML =
    `<option value="all">All Types</option>` +
    (window.types || [])
      .map(t => `<option value="${esc(t.name || t)}">${esc(t.name || t)}</option>`)
      .join("");
}

/* ----- LIVE FILTER ----- */
function attachImmediateSalesFilters() {
  qs("#saleType")?.addEventListener("change", renderSales);
  qs("#saleDate")?.addEventListener("change", renderSales);
}

/* ----------------------------------------------------------
   MARK CREDIT → PAID  (Main logic)
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = (window.sales || []).find(x => x.id === id);
  if (!s) return;

  if (String(s.status || "").toLowerCase() === "paid") {
    alert("Already Paid");
    return;
  }

  if (!confirm("Mark this CREDIT sale as PAID?")) return;

  // Only change status to Paid — do not alter amount/profit/qty fields
  s.status = "Paid";

  // Persist & re-render (uses core save if present)
  persistSales();
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
  persistSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
});

/* ----------------------------------------------------------
   RENDER SALES TABLE (Credit profit excluded)
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

      // CREDIT sales do not contribute to profit until marked Paid
      if (String(s.status || "").toLowerCase() !== "credit") {
        profit += Number(s.profit || 0);
      }

      const statusBtn =
        String(s.status || "").toLowerCase() === "credit"
          ? `<button class="small-btn"
               style="background:#ff9800;color:#fff"
               onclick="markSalePaid('${s.id}')">CREDIT</button>`
          : `💰 Paid`;

      rows += `
        <tr>
          <td>${dispDate}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.product)}</td>
          <td>${esc(s.qty)}</td>
          <td>${esc(s.price)}</td>
          <td>${esc(s.amount)}</td>
          <td>${esc(s.profit)}</td>
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
   - ensure selector + listeners + initial render
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleTypeSelector();
  attachImmediateSalesFilters();
  renderSales();
});

/* expose for other modules */
window.refreshSaleTypeSelector = refreshSaleTypeSelector;
window.renderSales = renderSales;
window.markSalePaid = markSalePaid;
window.persistSales = persistSales;
