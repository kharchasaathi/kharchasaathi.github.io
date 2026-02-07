/* ===========================================================
   universal-bar.js — FINAL v26 (FRESH PROFIT ENGINE)

   ✔ Sale & Service profit separated
   ✔ No cross subtraction bug
   ✔ Fresh profit after collect only
   ✔ Baseline hard lock
   ✔ Service calc fixed
   ✔ Expenses safe subtract
   ✔ Cloud offsets safe
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
    servInv: 0
  };

  window.__universalBaseline = 0;
  window.__offsetSaveLock = false;

  /* --------------------------------------------------
        CLOUD LOAD
  -------------------------------------------------- */
  async function loadCloud(key) {

    if (typeof cloudLoad !== "function")
      return null;

    try {
      return await cloudLoad(key);
    } catch {
      return null;
    }
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
      servInv: num(offsets?.servInv)
    });

    window.__universalBaseline =
      num(baseline);

    updateUniversalBar();
  }

  /* --------------------------------------------------
        METRICS ENGINE (FULL FIXED)
  -------------------------------------------------- */
  function computeMetrics() {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let saleProfitAll    = 0;
    let serviceProfitAll = 0;
    let pendingCredit    = 0;
    let expensesTotal    = 0;
    let stockInvestAll   = 0;
    let serviceInvestAll = 0;

    /* ================= SALES ================= */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(s.total);

      if (st === "paid") {

        saleProfitAll += num(s.profit);

        stockInvestAll +=
          num(s.qty) * num(s.cost);
      }
    });

    /* ================= SERVICES ================= */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "paid") {

        const invest = num(j.invest);

        /* SAFE PROFIT */
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

    /* ================= EXPENSES ================= */
    expenses.forEach(e => {
      expensesTotal += num(e.amount);
    });

    /* ==================================================
          🔒 BASELINE SEPARATION
    ================================================== */

    const totalProfitAll =
      saleProfitAll + serviceProfitAll;

    const baseline =
      num(window.__universalBaseline);

    const freshProfit =
      Math.max(0, totalProfitAll - baseline);

    /* ==================================================
          FINAL METRICS
    ================================================== */
    return {

      saleProfitCollected:
        Math.max(
          0,
          saleProfitAll - window.__offsets.sale
        ),

      serviceProfitCollected:
        Math.max(
          0,
          serviceProfitAll - window.__offsets.service
        ),

      stockInvestSold:
        Math.max(
          0,
          stockInvestAll - window.__offsets.stock
        ),

      serviceInvestCompleted:
        Math.max(
          0,
          serviceInvestAll - window.__offsets.servInv
        ),

      pendingCreditTotal:
        pendingCredit,

      expensesLive:
        expensesTotal,

      netProfit:
        Math.max(
          0,
          freshProfit - expensesTotal
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

  /* --------------------------------------------------
        COLLECT HANDLER
  -------------------------------------------------- */
  async function collect(kind) {

    const m    = window.__unMetrics || {};
    const offs = window.__offsets;

    const map = {

      net:     ["Net Profit",        m.netProfit,     "net"],
      stock:   ["Stock Investment", m.stockInvestSold,"stock"],
      service: ["Service Investment",m.serviceInvestCompleted,"servInv"]
    };

    if (!map[kind]) return;

    const [label, available, key] = map[kind];

    if (available <= 0)
      return alert("Nothing available to collect.");

    const amount = num(prompt(
      `${label}\nAvailable ₹${available}\nEnter amount:`
    ));

    if (amount <= 0 || amount > available)
      return alert("Invalid amount");

    /* COLLECTION ENTRY */
    window.addCollectionEntry?.(
      label,
      "",
      amount
    );

    offs[key] += amount;

    /* BASELINE SHIFT ONLY FOR NET */
    if (kind === "net") {

      const fresh =
        window.__unMetrics?.netProfit || 0;

      window.__universalBaseline += fresh;

      await saveCloud(
        BASELINE_KEY,
        window.__universalBaseline
      );
    }

    /* SAVE OFFSETS */
    if (!window.__offsetSaveLock) {

      window.__offsetSaveLock = true;

      await saveCloud(
        OFFSET_KEY,
        offs
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
