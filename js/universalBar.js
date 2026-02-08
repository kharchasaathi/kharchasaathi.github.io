/* ===========================================================
   universal-bar.js — FINAL v35
   NO BASELINE + LIVE PROFIT ADD FIX

   ✔ Collect after profit live add
   ✔ No baseline blocking
   ✔ Offsets only settlement
   ✔ Expenses reset safe
   ✔ Investment tracking safe
   ✔ Cloud sync safe
   ✔ Multi-device safe
=========================================================== */

(function () {

  /* --------------------------------------------------
        HELPERS
  -------------------------------------------------- */
  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  const OFFSET_KEY = "offsets";

  /* --------------------------------------------------
        GLOBAL STORES
  -------------------------------------------------- */
  window.__offsets = {
    net: 0,
    sale: 0,
    service: 0,
    stock: 0,
    servInv: 0,
    expenses: 0
  };

  window.__offsetSaveLock = false;

  /* --------------------------------------------------
        CLOUD LOAD
  -------------------------------------------------- */
  async function loadCloud(key) {
    if (typeof cloudLoad !== "function") return null;
    try { return await cloudLoad(key); }
    catch { return null; }
  }

  /* --------------------------------------------------
        CLOUD SAVE
  -------------------------------------------------- */
  async function saveCloud(key, value) {

    if (!window.__cloudReady) return;

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced(key, value);
    }
  }

  /* --------------------------------------------------
        INIT CLOUD
  -------------------------------------------------- */
  async function initCloud() {

    if (!window.__cloudReady) return;

    const offsets = await loadCloud(OFFSET_KEY);

    Object.assign(window.__offsets, {
      net:     num(offsets?.net),
      sale:    num(offsets?.sale),
      service: num(offsets?.service),
      stock:   num(offsets?.stock),
      servInv: num(offsets?.servInv),
      expenses:num(offsets?.expenses)
    });

    updateUniversalBar();
  }

  /* ==========================================================
     METRICS ENGINE — BASELINE REMOVED
  ========================================================== */
  function computeMetrics() {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let saleProfitAll    = 0;
    let serviceProfitAll = 0;
    let expensesAll      = 0;
    let stockInvestAll   = 0;
    let serviceInvestAll = 0;
    let pendingCredit    = 0;

    /* SALES */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(s.total);

      if (st === "paid") {
        saleProfitAll += num(s.profit);
        stockInvestAll += num(s.qty) * num(s.cost);
      }
    });

    /* SERVICES */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "paid") {

        const invest = num(j.invest);
        let profit   = num(j.profit);

        if (!profit) {
          const paid =
            num(j.paid || j.total || j.amount);
          profit = paid - invest;
        }

        serviceProfitAll += Math.max(0, profit);
        serviceInvestAll += invest;
      }

      if (st === "credit")
        pendingCredit += num(j.remaining);
    });

    /* EXPENSES */
    expenses.forEach(e => {
      expensesAll += num(e.amount);
    });

    /* ==================================================
       🔥 FINAL NET FORMULA (NO BASELINE)
    ================================================== */

    const saleCollected =
      Math.max(0,
        saleProfitAll - window.__offsets.sale
      );

    const serviceCollected =
      Math.max(0,
        serviceProfitAll - window.__offsets.service
      );

    const expensesLive =
      Math.max(0,
        expensesAll - window.__offsets.expenses
      );

    const netProfit =
      Math.max(
        0,
        saleCollected +
        serviceCollected -
        expensesLive -
        window.__offsets.net
      );

    return {

      saleProfitCollected: saleCollected,
      serviceProfitCollected: serviceCollected,

      stockInvestSold:
        Math.max(0,
          stockInvestAll - window.__offsets.stock
        ),

      serviceInvestCompleted:
        Math.max(0,
          serviceInvestAll - window.__offsets.servInv
        ),

      expensesLive,
      pendingCreditTotal: pendingCredit,
      netProfit
    };
  }

  /* --------------------------------------------------
        UI UPDATE
  -------------------------------------------------- */
  function updateUniversalBar() {

    const m = computeMetrics();
    window.__unMetrics = m;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = money(v);
    };

    set("unSaleProfit",    m.saleProfitCollected);
    set("unServiceProfit", m.serviceProfitCollected);
    set("unStockInv",      m.stockInvestSold);
    set("unServiceInv",    m.serviceInvestCompleted);
    set("unExpenses",      m.expensesLive);
    set("unCreditSales",   m.pendingCreditTotal);
    set("unNetProfit",     m.netProfit);
  }

  window.updateUniversalBar = updateUniversalBar;

  /* ==========================================================
     COLLECT — OFFSET ONLY RESET
  ========================================================== */
  async function collect(kind) {

    if (kind !== "net") return;

    const m = window.__unMetrics || {};

    if (m.netProfit <= 0)
      return alert("Nothing to collect.");

    if (!confirm(
      `Collect FULL Net Profit ₹${m.netProfit} ?`
    )) return;

    window.addCollectionEntry?.(
      "Net Profit",
      "",
      m.netProfit
    );

    /* 🔥 OFFSETS RESET ONLY */
    window.__offsets.sale     += m.saleProfitCollected;
    window.__offsets.service  += m.serviceProfitCollected;
    window.__offsets.expenses += m.expensesLive;
    window.__offsets.stock    += m.stockInvestSold;
    window.__offsets.servInv  += m.serviceInvestCompleted;
    window.__offsets.net      += m.netProfit;

    if (!window.__offsetSaveLock) {

      window.__offsetSaveLock = true;

      await saveCloud(
        OFFSET_KEY,
        window.__offsets
      );

      setTimeout(() => {
        window.__offsetSaveLock = false;
      }, 500);
    }

    updateUniversalBar();
    renderCollection?.();
    renderAnalytics?.();
  }

  window.handleCollect = collect;

  /* BUTTON EVENTS */
  document.addEventListener("click", e => {

    const b = e.target.closest(".collect-btn");

    if (b)
      collect(b.dataset.collect);
  });

  /* CLOUD READY */
  window.addEventListener(
    "cloud-data-loaded",
    () => {
      initCloud();
      updateUniversalBar();
    }
  );

  /* ==========================================================
     LIVE DATA REFRESH
  ========================================================== */

  window.addEventListener(
    "sales-updated",
    updateUniversalBar
  );

  window.addEventListener(
    "services-updated",
    updateUniversalBar
  );

  window.addEventListener(
    "expenses-updated",
    updateUniversalBar
  );

  setTimeout(updateUniversalBar, 500);
  setTimeout(updateUniversalBar, 1200);

})();
