/* ===========================================================
   universal-bar.js — BACKUP LOGIC RESTORE BUILD
   OFFSET SETTLEMENT ONLY + INSTANT LIVE UPDATE
=========================================================== */

(function () {

  /* ---------------- HELPERS ---------------- */
  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  const OFFSET_KEY = "offsets";

  /* ---------------- OFFSETS ---------------- */
  window.__offsets = window.__offsets || {
    net: 0,
    sale: 0,
    service: 0,
    stock: 0,
    servInv: 0,
    expenses: 0
  };

  window.__offsetSaveLock = false;

  /* ---------------- CLOUD ---------------- */
  async function loadCloud(key) {
    if (typeof cloudLoad !== "function") return null;
    try { return await cloudLoad(key); }
    catch { return null; }
  }

  async function saveCloud(key, value) {
    if (!window.__cloudReady) return;
    cloudSaveDebounced?.(key, value);
  }

  async function initCloud() {

    if (!window.__cloudReady) return;

    const offsets = await loadCloud(OFFSET_KEY);
    if (!offsets) return;

    Object.assign(window.__offsets, {
      net: num(offsets.net),
      sale: num(offsets.sale),
      service: num(offsets.service),
      stock: num(offsets.stock),
      servInv: num(offsets.servInv),
      expenses: num(offsets.expenses)
    });

    updateUniversalBar();
  }

  /* ==========================================================
     METRICS ENGINE — OFFSET ONLY
  ========================================================== */
  function computeMetrics() {

    const sales    = window.sales || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let saleProfitAll = 0;
    let serviceProfitAll = 0;
    let expensesAll = 0;
    let stockInvestAll = 0;
    let serviceInvestAll = 0;
    let pendingCredit = 0;

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

    /* OFFSET SETTLEMENT ONLY */

    const saleLive =
      Math.max(0,
        saleProfitAll -
        window.__offsets.sale
      );

    const serviceLive =
      Math.max(0,
        serviceProfitAll -
        window.__offsets.service
      );

    const expenseLive =
      Math.max(0,
        expensesAll -
        window.__offsets.expenses
      );

    const netLive =
      Math.max(0,
        saleLive +
        serviceLive -
        expenseLive -
        window.__offsets.net
      );

    return {

      saleProfitCollected: saleLive,
      serviceProfitCollected: serviceLive,

      stockInvestSold:
        Math.max(0,
          stockInvestAll -
          window.__offsets.stock
        ),

      serviceInvestCompleted:
        Math.max(0,
          serviceInvestAll -
          window.__offsets.servInv
        ),

      expensesLive: expenseLive,
      pendingCreditTotal: pendingCredit,
      netProfit: netLive
    };
  }

  /* ---------------- UI ---------------- */
  function updateUniversalBar() {

    const m = computeMetrics();
    window.__unMetrics = m;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = money(v);
    };

    set("unSaleProfit", m.saleProfitCollected);
    set("unServiceProfit", m.serviceProfitCollected);
    set("unStockInv", m.stockInvestSold);
    set("unServiceInv", m.serviceInvestCompleted);
    set("unExpenses", m.expensesLive);
    set("unCreditSales", m.pendingCreditTotal);
    set("unNetProfit", m.netProfit);
  }

  window.updateUniversalBar = updateUniversalBar;

  /* ==========================================================
     COLLECT ENGINE — OFFSET ONLY
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

      window.__offsets.net      += m.netProfit;
      window.__offsets.sale    += m.saleProfitCollected;
      window.__offsets.service += m.serviceProfitCollected;
      window.__offsets.expenses+= m.expensesLive;
    }

    if (kind === "stock") {
      window.__offsets.stock +=
        m.stockInvestSold;
    }

    if (kind === "service") {
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
  }

  window.handleCollect = collect;

  /* LIVE SYNC */
  [
    "sales-updated",
    "services-updated",
    "expenses-updated",
    "collection-updated"
  ].forEach(ev => {
    window.addEventListener(ev, updateUniversalBar);
  });

  window.addEventListener(
    "cloud-data-loaded",
    initCloud
  );

})();
