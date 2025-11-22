/* ===========================================================
   profits.js — NEW PROFIT TAB (Final v3.0)
========================================================== */

console.log("profits.js loaded");

const qs = s => document.querySelector(s);

window.renderProfitTab = function () {

  window.loadCollected?.();

  // Investment
  qs("#pStockInv").textContent  = "₹" + window.getPendingStockInvestment();
  qs("#pSvcInv").textContent    = "₹" + window.getPendingServiceInvestment();

  // Profits
  qs("#pSalesProfit").textContent = "₹" + window.getTotalSalesProfit();
  qs("#pSvcProfit").textContent   = "₹" + window.getTotalServiceProfit();

  // Net Profit
  const net = window.getNetProfit();
  const pendingNet = window.getPendingNetProfit();

  const box = qs("#pNetProfit");
  box.textContent = "₹" + net;

  const btn = qs("#collectNetProfitBtn");

  if (pendingNet > 0) {
    btn.style.background = "#2e7d32";
    btn.disabled = false;
  } else {
    btn.style.background = "#b71c1c";
    btn.disabled = true;
  }
};

// BUTTON HANDLERS
qs("#collectStockInvBtn")?.addEventListener("click", () => {
  const amt = window.collectStockInv();
  alert("Collected Stock Investment: ₹" + amt);
  window.renderProfitTab();
  renderAnalytics?.();
});

qs("#collectSvcInvBtn")?.addEventListener("click", () => {
  const amt = window.collectSvcInv();
  alert("Collected Service Investment: ₹" + amt);
  window.renderProfitTab();
  renderAnalytics?.();
});

qs("#collectNetProfitBtn")?.addEventListener("click", () => {
  const amt = window.collectNetProfit();
  if (amt <= 0) return;
  alert("Collected Net Profit: ₹" + amt);
  window.renderProfitTab();
  renderAnalytics?.();
});

// Auto render
window.addEventListener("load", () => {
  setTimeout(window.renderProfitTab, 150);
});
