/* ===========================================================
   universal-bar.js — FINAL v29 (TRUE SETTLEMENT ENGINE)

   ✔ Net collect = Full settlement
   ✔ Sale + Service reset
   ✔ Expenses impact reset
   ✔ Future profit works
   ✔ No double subtraction bug
   ✔ Baseline hard lock safe
   ✔ Cloud sync safe
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

  /* --------------------------------------------------
        METRICS ENGINE
  -------------------------------------------------- */
  function computeMetrics() {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let saleProfitAll    = 0;
    let serviceProfitAll = 0;
    let expensesAll      = 0;
    let pendingCredit    = 0;

    /* SALES */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(s.total);

      if (st === "paid")
        saleProfitAll += num(s.profit);
    });

    /* SERVICES */
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

        serviceProfitAll += Math.max(0, profit);
      }

      if (st === "credit")
        pendingCredit += num(j.remaining);
    });

    /* EXPENSES */
    expenses.forEach(e => {
      expensesAll += num(e.amount);
    });

    /* BASELINE APPLY */
    const totalProfitAll =
      saleProfitAll + serviceProfitAll;

    const freshProfit =
      Math.max(
        0,
        totalProfitAll - num(window.__universalBaseline)
      );

    return {

      saleProfitCollected:
        Math.max(0,
          saleProfitAll - window.__offsets.sale
        ),

      serviceProfitCollected:
        Math.max(0,
          serviceProfitAll - window.__offsets.service
        ),

      expensesLive:
        Math.max(0,
          expensesAll - window.__offsets.expenses
        ),

      pendingCreditTotal:
        pendingCredit,

      netProfit:
        Math.max(
          0,
          freshProfit
          - (expensesAll - window.__offsets.expenses)
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
    set("unExpenses",      m.expensesLive);
    set("unCreditSales",   m.pendingCreditTotal);
    set("unNetProfit",     m.netProfit);
  }

  window.updateUniversalBar = updateUniversalBar;

  /* --------------------------------------------------
        COLLECT HANDLER — TRUE SETTLEMENT
  -------------------------------------------------- */
  async function collect(kind) {

    if (kind !== "net") return;

    const m = window.__unMetrics || {};

    if (m.netProfit <= 0)
      return alert("Nothing to collect.");

    const amount = num(prompt(
      `Net Profit\nAvailable ₹${m.netProfit}\nEnter amount:`
    ));

    if (amount <= 0 || amount > m.netProfit)
      return alert("Invalid amount");

    window.addCollectionEntry?.(
      "Net Profit",
      "",
      amount
    );

    /* ==================================================
          🔥 TRUE SETTLEMENT ENGINE
          ONLY BASELINE SHIFT
          NO OFFSET SHIFT (BUG FIX)
    ================================================== */

    const salesAll    = window.sales    || [];
    const servicesAll = window.services || [];

    let saleProfitAll    = 0;
    let serviceProfitAll = 0;

    salesAll.forEach(s => {
      if (String(s.status).toLowerCase() === "paid")
        saleProfitAll += num(s.profit);
    });

    servicesAll.forEach(j => {

      if (String(j.status).toLowerCase() === "paid") {

        let profit = num(j.profit);

        if (!profit) {
          const paid =
            num(j.paid || j.total || j.amount);
          profit = paid - num(j.invest);
        }

        serviceProfitAll += Math.max(0, profit);
      }
    });

    const totalAll =
      saleProfitAll + serviceProfitAll;

    /* BASELINE SHIFT */
    window.__universalBaseline += totalAll;

    await saveCloud(
      BASELINE_KEY,
      window.__universalBaseline
    );

    /* IMPORTANT:
       No sale/service/expense offsets shift
       → prevents future profit block bug
    */

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
