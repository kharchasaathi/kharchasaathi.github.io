/* =========================================
   dashboard.js — FINAL v24 (OPTION-2 PERSISTENT OFFSET)

   ✔ Dashboard clear persistent
   ✔ Offset baseline saved to cloud
   ✔ Logout/Login safe
   ✔ Universal unaffected
   ✔ New profit only after clear
========================================= */

(function () {

  const qs = s => document.querySelector(s);

  const OFFSET_KEY = "dashboardOffset";

  /* ---------------------------------------
     SAFE TEXT SETTER
  --------------------------------------- */
  function setText(id, value) {

    const el = qs(id);
    if (el) el.textContent = value;
  }

  /* ---------------------------------------
     APPLY CLEAR UI
  --------------------------------------- */
  function applyClearView() {

    /* ---------- TODAY ---------- */
    setText("#todaySales",    "₹0");
    setText("#todayCredit",   "₹0");
    setText("#todayExpenses", "₹0");
    setText("#todayGross",    "₹0");
    setText("#todayNet",      "₹0");

    /* ---------- TOTAL ---------- */
    setText("#dashProfit",   "₹0");
    setText("#dashExpenses", "₹0");
    setText("#dashCredit",   "₹0");
    setText("#dashInv",      "₹0");

    /* ---------- PIE DESTROY ---------- */
    if (window.cleanPieChart) {

      try {
        window.cleanPieChart.destroy();
      } catch {}

      window.cleanPieChart = null;
    }
  }

  /* ---------------------------------------
     SAVE DASHBOARD OFFSET (CLOUD)
  --------------------------------------- */
  function saveDashboardOffset(amount) {

    if (
      typeof cloudSaveDebounced === "function" &&
      window.__cloudReady
    ) {
      cloudSaveDebounced(
        OFFSET_KEY,
        amount
      );
    }
  }

  /* ---------------------------------------
     CLEAR DASHBOARD VIEW
  --------------------------------------- */
  function clearDashboardView() {

    if (!confirm(
      "This will clear only Dashboard calculated view.\n\nBusiness data will NOT be deleted.\n\nContinue?"
    )) return;

    /* ----------------------------------
       CAPTURE CURRENT PROFIT BASELINE
    ---------------------------------- */
    const profit =
      window.__unMetrics?.netProfit || 0;

    /* Save offset globally */
    window.__dashboardOffset = profit;

    /* Save to cloud */
    saveDashboardOffset(profit);

    /* Session flag */
    window.__dashboardViewCleared = true;

    /* Apply UI */
    applyClearView();
  }

  window.clearDashboardView =
    clearDashboardView;

  /* ---------------------------------------
     RENDER GUARD
  --------------------------------------- */
  function applyGuardIfNeeded() {

    if (window.__dashboardViewCleared) {
      applyClearView();
    }
  }

  window.__applyDashboardClearGuard =
    applyGuardIfNeeded;

  /* ---------------------------------------
     CLOUD DATA LOAD
  --------------------------------------- */
  window.addEventListener(
    "cloud-data-loaded",
    () => {

      /* If offset exists → treat as cleared */
      if (
        Number(window.__dashboardOffset || 0)
        > 0
      ) {
        window.__dashboardViewCleared = true;
      }

      applyGuardIfNeeded();
    }
  );

})();
