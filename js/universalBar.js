/* ===========================================================
   universal-bar.js — FINAL v25
   ✔ Service profit auto calculation FIXED
   ✔ Paid − Invest safe calc
   ✔ Old records supported
   ✔ Offset + Baseline lock safe
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
        INIT CLOUD DATA
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
        METRICS ENGINE
  -------------------------------------------------- */
  function computeMetrics() {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let saleProfit     = 0;
    let serviceProfit  = 0;
    let pendingCredit  = 0;
    let expensesTotal  = 0;
    let stockInvest    = 0;
    let serviceInvest  = 0;

    /* ---------- SALES ---------- */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(s.total);

      if (st === "paid") {
        saleProfit += num(s.profit);
        stockInvest += num(s.qty) * num(s.cost);
      }
    });

    /* ==================================================
          🔥 SERVICE PROFIT FIX — SAFE CALC
    ================================================== */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "paid") {

        const invest = num(j.invest);

        /* SAFE PROFIT CALC */
        let profit = num(j.profit);

        if (!profit) {

          const paid =
            num(j.paid || j.total || j.amount);

          profit = paid - invest;
        }

        serviceProfit += Math.max(0, profit);
        serviceInvest += invest;
      }

      if (st === "credit")
        pendingCredit += num(j.remaining);
    });

    /* ---------- EXPENSES ---------- */
    expenses.forEach(e => {
      expensesTotal += num(e.amount);
    });

    const offs = window.__offsets;

    /* BASELINE LOCK */
    const totalProfitRaw =
      saleProfit + serviceProfit;

    const baseline =
      num(window.__universalBaseline);

    const totalProfit =
      Math.max(0, totalProfitRaw - baseline);

    return {

      saleProfitCollected:
        Math.max(0, saleProfit - offs.sale),

      serviceProfitCollected:
        Math.max(0, serviceProfit - offs.service),

      stockInvestSold:
        Math.max(0, stockInvest - offs.stock),

      serviceInvestCompleted:
        Math.max(0, serviceInvest - offs.servInv),

      pendingCreditTotal:
        pendingCredit,

      expensesLive:
        expensesTotal,

      netProfit:
        Math.max(
          0,
          (totalProfit - expensesTotal)
          - offs.net
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

      net: [
        "Net Profit",
        m.netProfit,
        "net"
      ],

      stock: [
        "Stock Investment",
        m.stockInvestSold,
        "stock"
      ],

      service: [
        "Service Investment",
        m.serviceInvestCompleted,
        "servInv"
      ]
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

    window.addCollectionEntry?.(
      label,
      "",
      amount
    );

    offs[key] += amount;

    /* BASELINE SHIFT */
    if (kind === "net") {

      const currentProfit =
        (window.__unMetrics?.netProfit || 0);

      window.__universalBaseline +=
        currentProfit;

      await saveCloud(
        BASELINE_KEY,
        window.__universalBaseline
      );
    }

    /* OFFSET SAVE LOCK */
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
        CLOUD READY INIT
  -------------------------------------------------- */
  window.addEventListener(
    "cloud-data-loaded",
    () => {

      initCloud();
      updateUniversalBar();
    }
  );

})();
