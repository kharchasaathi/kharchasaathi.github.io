/* =========================================
   DASHBOARD VIEW CLEAR — PERSISTENT SAFE
========================================= */

(function () {

  const qs = s => document.querySelector(s);

  /* RESTORE CLEAR STATE ON LOAD */
  if (localStorage.getItem("dashboard-view-cleared") === "1") {
    window.__dashboardViewCleared = true;
  }

  function clearDashboardView() {

    if (!confirm(
      "This will clear only Dashboard calculated view.\n\nBusiness data will NOT be deleted.\n\nContinue?"
    )) return;

    /* FLAG + SAVE */
    window.__dashboardViewCleared = true;
    localStorage.setItem("dashboard-view-cleared", "1");

    /* TODAY */
    qs("#todaySales").textContent    = "₹0";
    qs("#todayCredit").textContent   = "₹0";
    qs("#todayExpenses").textContent = "₹0";
    qs("#todayGross").textContent    = "₹0";
    qs("#todayNet").textContent      = "₹0";

    /* TOTAL */
    qs("#dashProfit").textContent   = "₹0";
    qs("#dashExpenses").textContent = "₹0";
    qs("#dashCredit").textContent   = "₹0";
    qs("#dashInv").textContent      = "₹0";

    /* PIE DESTROY */
    if (window.cleanPieChart) {
      window.cleanPieChart.destroy();
      window.cleanPieChart = null;
    }
  }

  window.clearDashboardView = clearDashboardView;

})();
