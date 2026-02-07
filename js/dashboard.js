/* =========================================
   dashboard.js — CLOUD ONLY — FINAL v3
   -----------------------------------------
   ✔ Dashboard View Clear = Cloud synced
   ✔ Logout/Login safe
   ✔ Multi-device safe
   ✔ Business data NOT deleted
   ✔ Analytics + UniversalBar protected
   ✔ Syntax error fixed
========================================= */

(function () {

  const qs  = s => document.querySelector(s);
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

    } catch (e) {
      console.warn("Dashboard flag load failed:", e);
    }
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

    /* ---------- UNIVERSAL BAR ---------- */
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
