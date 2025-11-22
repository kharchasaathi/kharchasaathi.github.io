/* ===========================================================
   📦 profits.js — Profit Tab Logic (v2.0 Final)
   Fully compatible with existing core.js Profit Module
=========================================================== */

console.log("profits.js loaded");

// Shortcuts
const qs = s => document.querySelector(s);

/* ----------------------------------------------------------
   SAFE RENDER (Fixes Chrome cache not refreshing)
---------------------------------------------------------- */
function safeNumber(v){ return Number(v || 0); }

/* ----------------------------------------------------------
   MAIN RENDER — PROFIT BOX UI
---------------------------------------------------------- */
window.renderProfitBox = function () {
  if (!window.getProfitBox) return;

  const box = window.getProfitBox();   // from core.js
  const data = window.getAnalyticsData?.() || {};

  // Ensure valid numbers
  const stockInv  = safeNumber(box.stockInv);
  const salesProf = safeNumber(box.salesProf);
  const svcInv    = safeNumber(box.svcInv);
  const svcProf   = safeNumber(box.svcProf);

  // Update UI
  qs("#pb_stockInv")  && (qs("#pb_stockInv").textContent  = "₹" + stockInv);
  qs("#pb_salesProf") && (qs("#pb_salesProf").textContent = "₹" + salesProf);
  qs("#pb_svcInv")    && (qs("#pb_svcInv").textContent    = "₹" + svcInv);
  qs("#pb_svcProf")   && (qs("#pb_svcProf").textContent   = "₹" + svcProf);

  renderProfitPie();
};

/* ----------------------------------------------------------
   PROFIT PIE CHART
---------------------------------------------------------- */
let profitPie = null;

function renderProfitPie() {
  const ctx = qs("#profitPie");
  if (!ctx) return;

  const box = window.getProfitBox?.() || {};
  const data = window.getAnalyticsData?.() || {};

  const stockInv  = safeNumber(box.stockInv);
  const svcInv    = safeNumber(box.svcInv);
  const salesProf = safeNumber(box.salesProf);
  const svcProf   = safeNumber(box.svcProf);

  const expenses  = safeNumber(data.totalExpenses);
  const credit    = safeNumber(data.creditSales);

  const totalInvestment = stockInv + svcInv;
  const totalProfit     = salesProf + svcProf;

  if (profitPie) profitPie.destroy();

  profitPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Investment", "Profit", "Expenses", "Credit Sales"],
      datasets: [{
        data: [totalInvestment, totalProfit, expenses, credit],
        backgroundColor: ["#ffeb3b", "#4caf50", "#e53935", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Business Financial Status" }
      }
    }
  });
}

/* ----------------------------------------------------------
   COLLECT BUTTON HANDLERS (NO CHANGE)
---------------------------------------------------------- */

qs("#pb_collectStockInv")?.addEventListener("click", () => {
  const amt = window.collectStockInv?.() || 0;
  alert(`Stock Investment Collected: ₹${amt}`);
  renderProfitBox();
});

qs("#pb_collectSalesProf")?.addEventListener("click", () => {
  const amt = window.collectSalesProfit?.() || 0;
  alert(`Sales Profit Collected: ₹${amt}`);
  renderProfitBox();
});

qs("#pb_collectSvcInv")?.addEventListener("click", () => {
  const amt = window.collectServiceInv?.() || 0;
  alert(`Service Investment Collected: ₹${amt}`);
  renderProfitBox();
});

qs("#pb_collectSvcProf")?.addEventListener("click", () => {
  const amt = window.collectServiceProfit?.() || 0;
  alert(`Service Profit Collected: ₹${amt}`);
  renderProfitBox();
});

/* ----------------------------------------------------------
   AUTO RENDER ON LOAD (Fixes Chrome stale cache)
---------------------------------------------------------- */
window.addEventListener("load", () => {
  setTimeout(() => {
    renderProfitBox();
  }, 150);
});

// Refresh also when any localStorage changes
window.addEventListener("storage", () => {
  renderProfitBox();
});
