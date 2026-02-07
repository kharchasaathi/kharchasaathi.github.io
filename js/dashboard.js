/* =========================================
   dashboard.js — FINAL v25

   ✔ Persistent clear FIXED
   ✔ Cloud offset load safe
   ✔ Logout/Login safe
   ✔ Analytics offset applied
   ✔ Pie safe destroy
   ✔ Universal unaffected
========================================= */

(function () {

  const qs = s => document.querySelector(s);

  const OFFSET_KEY = "dashboardOffset";

  /* ---------------------------------------
     SAFE NUM
  --------------------------------------- */
  const num = v =>
    (isNaN(v = Number(v))) ? 0 : Number(v);

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

    /* TODAY */
    setText("#todaySales",    "₹0");
    setText("#todayCredit",   "₹0");
    setText("#todayExpenses", "₹0");
    setText("#todayGross",    "₹0");
    setText("#todayNet",      "₹0");

    /* TOTAL */
    setText("#dashProfit",   "₹0");
    setText("#dashExpenses", "₹0");
    setText("#dashCredit",   "₹0");
    setText("#dashInv",      "₹0");

    /* PIE DESTROY */
    if (window.cleanPieChart) {

      try {
        window.cleanPieChart.destroy();
      } catch {}

      window.cleanPieChart = null;
    }
  }

  /* ---------------------------------------
     CLOUD SAVE
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
     CLOUD LOAD
  --------------------------------------- */
  async function loadDashboardOffset() {

    if (
      typeof cloudLoad !== "function" ||
      !window.__cloudReady
    ) return;

    try {

      const val =
        await cloudLoad(OFFSET_KEY);

      window.__dashboardOffset =
        num(val);

      if (window.__dashboardOffset > 0) {
        window.__dashboardViewCleared = true;
      }

      applyGuardIfNeeded();

    } catch (err) {

      console.warn(
        "Dashboard offset load failed",
        err
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

    /* Capture baseline profit */
    const profit =
      num(window.__unMetrics?.netProfit);

    /* Save offset */
    window.__dashboardOffset = profit;

    /* Mark cleared */
    window.__dashboardViewCleared = true;

    /* Cloud save */
    saveDashboardOffset(profit);

    /* Apply UI */
    applyClearView();
  }

  window.clearDashboardView =
    clearDashboardView;

  /* ---------------------------------------
     OFFSET APPLY ENGINE
  --------------------------------------- */
  function applyDashboardOffset(data) {

    const offs =
      num(window.__dashboardOffset);

    if (!offs) return data;

    return {

      profit:
        Math.max(0, num(data.profit) - offs),

      gross:
        Math.max(0, num(data.gross) - offs)
    };
  }

  window.__applyDashboardOffset =
    applyDashboardOffset;

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
     CLOUD READY INIT
  --------------------------------------- */
  window.addEventListener(
    "cloud-data-loaded",
    () => {

      loadDashboardOffset();
    }
  );

})();
