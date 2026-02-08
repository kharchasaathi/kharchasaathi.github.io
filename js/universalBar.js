/* ===========================================================
   universal-bar.js — FINAL v33
   FULL MERGE (v31 + v32)

   ✔ Main tab profit live add fix
   ✔ Baseline safe
   ✔ Collect reset safe
   ✔ Offset save lock
   ✔ Investment tracking restored
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
  const BASELINE_KEY = "universalBaseline";

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

  window.__universalBaseline = 0;
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

    const offsets  = await loadCloud(OFFSET_KEY);
    const baseline = await loadCloud(BASELINE_KEY);

    Object.assign(window.__offsets, {
      net:     num(offsets?.net),
      sale:    num(offsets?.sale),
      service: num(offsets?.service),
      stock:   num(offsets?.stock),
      servInv: num(offsets?.servInv),
      expenses:num(offsets?.expenses)
    });

    window.__universalBaseline = num(baseline);

    updateUniversalBar();
  }

  /* ==========================================================
     METRICS ENGINE — FULL MERGE FIXED
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

    /* ---------------- SALES ---------------- */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(s.total);

      if (st === "paid") {

        saleProfitAll += num(s.profit);

        /* Investment tracking */
        stockInvestAll +=
          num(s.qty) * num(s.cost);
      }
    });

    /* ---------------- SERVICES ---------------- */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "paid") {

        const invest = num(j.invest);

        let profit = num(j.profit);

        if (!profit) {
          const paid =
            num(j.paid || j.total || j.amount);
          profit = paid - invest;
        }

        serviceProfitAll +=
          Math.max(0, profit);

        serviceInvestAll += invest;
      }

      if (st === "credit")
        pendingCredit += num(j.remaining);
    });

    /* ---------------- EXPENSES ---------------- */
    expenses.forEach(e => {
      expensesAll += num(e.amount);
    });

    /* ==================================================
       🔥 BASELINE ONLY FOR NET
       (Main tab live fix)
    ================================================== */

    const totalProfitAll =
      saleProfitAll + serviceProfitAll;

    const freshProfit =
      Math.max(
        0,
        totalProfitAll -
        num(window.__universalBaseline)
      );

    return {

      /* Breakdown LIVE */
      saleProfitCollected:
        Math.max(
          0,
          saleProfitAll -
          window.__offsets.sale
        ),

      serviceProfitCollected:
        Math.max(
          0,
          serviceProfitAll -
          window.__offsets.service
        ),

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

      expensesLive:
        Math.max(
          0,
          expensesAll -
          window.__offsets.expenses
        ),

      pendingCreditTotal:
        pendingCredit,

      /* Net after baseline */
      netProfit:
        Math.max(
          0,
          freshProfit
          - (expensesAll -
             window.__offsets.expenses)
          - window.__offsets.net
        )
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
     COLLECT — FULL RESET SAFE
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

    const totalAll =
      m.saleProfitCollected +
      m.serviceProfitCollected;

    /* 🔥 BASELINE SHIFT */
    window.__universalBaseline += totalAll;

    await saveCloud(
      BASELINE_KEY,
      window.__universalBaseline
    );

    /* 🔥 FULL BREAKDOWN RESET */
    window.__offsets.sale     += m.saleProfitCollected;
    window.__offsets.service  += m.serviceProfitCollected;
    window.__offsets.expenses += m.expensesLive;
    window.__offsets.stock    += m.stockInvestSold;
    window.__offsets.servInv  += m.serviceInvestCompleted;
    window.__offsets.net      += m.netProfit;

    /* 🔒 SAVE LOCK */
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

  /* --------------------------------------------------
        BUTTON EVENTS
  -------------------------------------------------- */
  document.addEventListener("click", e => {

    const b = e.target.closest(".collect-btn");

    if (b)
      collect(b.dataset.collect);
  });

  /* --------------------------------------------------
        CLOUD READY
  -------------------------------------------------- */
  window.addEventListener(
    "cloud-data-loaded",
    () => {
      initCloud();
      updateUniversalBar();
    }
  );

})();
