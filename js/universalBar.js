/* ===========================================================
   universal-bar.js — CLOUD ONLY — FINAL v19
   ✔ Credit-safe accounting
   ✔ Cloud offsets sync
   ✔ Collection integration
   ✔ No localStorage dependency
=========================================================== */

(function () {

  /* --------------------------------------------------
        HELPERS
  -------------------------------------------------- */
  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  const OFFSET_KEY = "offsets";

  /* --------------------------------------------------
        CLOUD LOAD / SAVE
  -------------------------------------------------- */
  async function loadOffsets() {

    if (typeof cloudLoad !== "function")
      return {};

    try {
      const d = await cloudLoad(OFFSET_KEY);
      return (typeof d === "object" && d) ? d : {};
    }
    catch {
      return {};
    }
  }

  async function saveOffsets(obj) {

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced(OFFSET_KEY, obj);
    }
  }

  /* --------------------------------------------------
        GLOBAL OFFSETS STORE
  -------------------------------------------------- */
  window.__offsets = {
    net: 0,
    sale: 0,
    service: 0,
    stock: 0,
    servInv: 0
  };

  /* --------------------------------------------------
        INIT OFFSETS
  -------------------------------------------------- */
  async function initOffsets() {

    /* Dashboard temporary clear guard */
    if (window.__dashboardViewCleared) {
      updateUniversalBar();
      return;
    }

    const o = await loadOffsets();

    Object.assign(window.__offsets, {
      net:     num(o.net),
      sale:    num(o.sale),
      service: num(o.service),
      stock:   num(o.stock),
      servInv: num(o.servInv)
    });

    updateUniversalBar();
  }

  /* --------------------------------------------------
        CORE METRICS ENGINE
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

    /* ---------- SERVICES ---------- */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "paid") {
        serviceProfit += num(j.profit);
        serviceInvest += num(j.invest);
      }

      if (st === "credit")
        pendingCredit += num(j.remaining);
    });

    /* ---------- EXPENSES ---------- */
    expenses.forEach(e => {
      expensesTotal += num(e.amount);
    });

    const offs = window.__offsets;

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
          (saleProfit + serviceProfit - expensesTotal)
          - offs.net
        )
    };
  }

  /* --------------------------------------------------
        UI UPDATE
  -------------------------------------------------- */
  function updateUniversalBar() {

    if (window.__dashboardViewCleared) {

      [
        "unSaleProfit",
        "unServiceProfit",
        "unStockInv",
        "unServiceInv",
        "unExpenses",
        "unCreditSales",
        "unNetProfit"
      ].forEach(id => {

        const el = document.getElementById(id);
        if (el) el.textContent = "₹0";
      });

      return;
    }

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

    const m = window.__unMetrics || {};
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

    /* ---------- COLLECTION ENTRY ---------- */
    window.addCollectionEntry?.(
      label,
      "",
      amount
    );

    offs[key] += amount;

    /* ---------- NET COLLECT FIX ---------- */
    if (kind === "net") {

      const sales = window.sales || [];
      const services = window.services || [];

      offs.sale =
        sales.reduce((a, s) =>
          a + (
            String(s.status).toLowerCase() === "paid"
            ? num(s.profit)
            : 0
          ), 0);

      offs.service =
        services.reduce((a, j) =>
          a + (
            String(j.status).toLowerCase() === "paid"
            ? num(j.profit)
            : 0
          ), 0);
    }

    await saveOffsets(offs);

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
        INIT
  -------------------------------------------------- */
  window.addEventListener("load", () => {

    setTimeout(initOffsets, 300);
  });

})();
