/* ===========================================================
   DASHBOARD VIEW CLEAR (SAFE)
=========================================================== */

const qs = s => document.querySelector(s);

function clearDashboardView() {

  if (!confirm(
    "This will clear only Dashboard calculated view.\n\nBusiness data will NOT be deleted.\n\nContinue?"
  )) return;

  // TODAY
  qs("#todaySales").textContent    = "₹0";
  qs("#todayCredit").textContent   = "₹0";
  qs("#todayExpenses").textContent = "₹0";
  qs("#todayGross").textContent    = "₹0";
  qs("#todayNet").textContent      = "₹0";

  // TOTAL
  qs("#dashProfit").textContent   = "₹0";
  qs("#dashExpenses").textContent = "₹0";
  qs("#dashCredit").textContent   = "₹0";
  qs("#dashInv").textContent      = "₹0";

  // PIE
  if (window.cleanPieChart) {
    window.cleanPieChart.destroy();
    window.cleanPieChart = null;
  }

  setTimeout(() => {
    renderAnalytics?.();
    updateSummaryCards?.();
    updateUniversalBar?.();
  }, 200);
}

window.clearDashboardView = clearDashboardView;
