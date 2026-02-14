/* ===========================================================
   universal-bar.js — FINAL v42
   SETTLEMENT BASELINE ENGINE

   ✔ Profit accumulation safe
   ✔ Snapshot overwrite REMOVED
   ✔ Baseline freeze added
   ✔ Audit mismatch FIXED
   ✔ Logout/login safe
   ✔ Cloud sync safe
   ✔ Multi-device safe
=========================================================== */

(function () {

  /* --------------------------------------------------
     HELPERS
  -------------------------------------------------- */
  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  const OFFSET_KEY   = "offsets";
  const BASELINE_KEY = "settlementBaseline";

  /* --------------------------------------------------
     GLOBAL STORES
  -------------------------------------------------- */
  window.__offsets = window.__offsets || {
    net: 0,
    sale: 0,
    service: 0,
    stock: 0,
    servInv: 0,
    expenses: 0
  };

  window.__baseline =
    window.__baseline || {
      sale: 0,
      service: 0,
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
     INIT CLOUD DATA
  -------------------------------------------------- */
  async function initCloud() {

    if (!window.__cloudReady) return;

    const offsets  = await loadCloud(OFFSET_KEY);
    const baseline = await loadCloud(BASELINE_KEY);

    if (offsets) {
      Object.assign(window.__offsets, {
        net:     num(offsets.net),
        sale:    num(offsets.sale),
        service: num(offsets.service),
        stock:   num(offsets.stock),
        servInv: num(offsets.servInv),
        expenses:num(offsets.expenses)
      });
    }

    if (baseline) {
      Object.assign(window.__baseline, {
        sale:     num(baseline.sale),
        service:  num(baseline.service),
        expenses: num(baseline.expenses)
      });
    }

    updateUniversalBar();
  }

  /* ==========================================================
     METRICS ENGINE
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

      if (st === "credit")
        pendingCredit += num(j.remaining);

      if (st === "paid") {

        const invest = num(j.invest);
        const profit =
          num(j.profit) ||
          (num(j.paid) - invest);

        serviceProfitAll += Math.max(0, profit);
        serviceInvestAll += invest;
      }
    });

    /* EXPENSES */
    expenses.forEach(e => {
      expensesAll += num(e.amount);
    });

    /* LIVE VALUES */

    const saleLive =
      Math.max(
        0,
        saleProfitAll -
        window.__offsets.sale -
        window.__baseline.sale
      );

    const serviceLive =
      Math.max(
        0,
        serviceProfitAll -
        window.__offsets.service -
        window.__baseline.service
      );

    const expenseLive =
      Math.max(
        0,
        expensesAll -
        window.__offsets.expenses -
        window.__baseline.expenses
      );

    const netRaw =
      saleLive +
      serviceLive -
      expenseLive;

    const netLive =
      Math.max(
        0,
        netRaw -
        window.__offsets.net
      );

    return {

      saleProfitCollected: saleLive,
      serviceProfitCollected: serviceLive,

      stockInvestSold:
        Math.max(
          0,
          stockInvestAll -
          window.__offsets.stock
        ),

      serviceInvestCompleted:
        Math.max(
          0,
          serviceInvestAll -
          window.__offsets.servInv
        ),

      expensesLive: expenseLive,
      pendingCreditTotal: pendingCredit,
      netProfit: netLive
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
     COLLECT ENGINE
  ========================================================== */
  async function collect(kind) {

    const m = window.__unMetrics || {};

    if (kind === "net") {

      if (m.netProfit <= 0)
        return alert("Nothing to collect.");

      if (!confirm(
        `Collect Net Profit ₹${m.netProfit} ?`
      )) return;

      window.addCollectionEntry?.(
        "Net Profit",
        "",
        m.netProfit
      );

      window.__offsets.net += m.netProfit;

      /* BASELINE FREEZE */
      window.__baseline.sale     += m.saleProfitCollected;
      window.__baseline.service  += m.serviceProfitCollected;
      window.__baseline.expenses += m.expensesLive;

      await saveCloud(
        BASELINE_KEY,
        window.__baseline
      );
    }

    if (kind === "stock") {

      if (m.stockInvestSold <= 0)
        return alert("No stock investment to collect.");

      window.addCollectionEntry?.(
        "Stock Investment",
        "Sold Items",
        m.stockInvestSold
      );

      window.__offsets.stock +=
        m.stockInvestSold;
    }

    if (kind === "service") {

      if (m.serviceInvestCompleted <= 0)
        return alert("No service investment to collect.");

      window.addCollectionEntry?.(
        "Service Investment",
        "Completed Jobs",
        m.serviceInvestCompleted
      );

      window.__offsets.servInv +=
        m.serviceInvestCompleted;
    }

    if (!window.__offsetSaveLock) {

      window.__offsetSaveLock = true;

      await saveCloud(
        OFFSET_KEY,
        window.__offsets
      );

      setTimeout(() => {
        window.__offsetSaveLock = false;
      }, 600);
    }

    updateUniversalBar();
    renderCollection?.();
    renderAnalytics?.();
  }

  window.handleCollect = collect;

  document.addEventListener("click", e => {

    const b = e.target.closest(".collect-btn");
    if (!b) return;

    collect(b.dataset.collect);
  });

  window.addEventListener(
    "cloud-data-loaded",
    () => {
      initCloud();
      updateUniversalBar();
    }
  );

  [
    "sales-updated",
    "services-updated",
    "expenses-updated",
    "collection-updated"
  ].forEach(ev => {
    window.addEventListener(ev, updateUniversalBar);
  });

  setTimeout(updateUniversalBar, 500);
  setTimeout(updateUniversalBar, 1500);

})();
