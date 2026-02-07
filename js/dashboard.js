/* =========================================
   dashboard.js — CLOUD ONLY — FINAL v2
   -----------------------------------------
   ✔ Dashboard View Clear = Cloud synced
   ✔ Logout/Login safe
   ✔ Multi-device safe
   ✔ Business data NOT deleted
   ✔ Analytics + UniversalBar protected
========================================= */

(function () {

  const qs = s => document.querySelector(s);
  const KEY = "dashboardViewCleared";

  /* ---------------------------------------
        LOAD FLAG FROM CLOUD
  --------------------------------------- */
  async function loadFlag() {

    if (typeof cloudLoad !== "function")
      return;

    try {

      const flag = await cloudLoad(KEY);

      if (flag === true || flag === "1") {
        window.__dashboardViewCleared = true;
        applyClearView();
      }

    } catch {}
  }

  /* ---------------------------------------
        SAVE FLAG TO CLOUD
  --------------------------------------- */
  function saveFlag() {

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced(KEY, true);
    }
  }

  /* ---------------------------------------
        APPLY CLEAR UI
  --------------------------------------- */
  function applyClearView() {

    /* TODAY */
    qs("#todaySales")?.textContent    = "₹0";
    qs("#todayCredit")?.textContent   = "₹0";
    qs("#todayExpenses")?.textContent = "₹0";
    qs("#todayGross")?.textContent    = "₹0";
    qs("#todayNet")?.textContent      = "₹0";

    /* TOTAL */
    qs("#dashProfit")?.textContent   = "₹0";
    qs("#dashExpenses")?.textContent = "₹0";
    qs("#dashCredit")?.textContent   = "₹0";
    qs("#dashInv")?.textContent      = "₹0";

    /* PIE DESTROY */
    if (window.cleanPieChart) {
      try {
        window.cleanPieChart.destroy();
      } catch {}
      window.cleanPieChart = null;
    }

    /* Universal bar reset view */
    window.updateUniversalBar?.();
  }

  /* ---------------------------------------
        CLEAR DASHBOARD VIEW
  --------------------------------------- */
  function clearDashboardView() {

    if (!confirm(
      "This will clear only Dashboard calculated view.\n\nBusiness data will NOT be deleted.\n\nContinue?"
    )) return;

    /* FLAG */
    window.__dashboardViewCleared = true;

    /* SAVE CLOUD */
    saveFlag();

    /* APPLY UI */
    applyClearView();
  }

  window.clearDashboardView = clearDashboardView;

  /* ---------------------------------------
        CLOUD SYNC LISTENER
  --------------------------------------- */
  window.addEventListener(
    "cloud-data-loaded",
    loadFlag
  );

  /* ---------------------------------------
        INIT
  --------------------------------------- */
  window.addEventListener("load", loadFlag);

})();
