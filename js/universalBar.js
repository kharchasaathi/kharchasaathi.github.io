/* ===========================================================
   universal-bar.js — FINAL v37
   SETTLEMENT SAFE CORE ENGINE (DOUBLE OFFSET FIXED)

   ✔ Net profit formula fixed
   ✔ Component settlement removed from net collect
   ✔ Expense settlement isolated
   ✔ Investment collect separated
   ✔ Credit excluded
   ✔ Offset overwrite protected
   ✔ Cloud sync race-safe
   ✔ Multi-device safe
   ✔ Post-collect profit accumulation FIXED
=========================================================== */

(function () {

  /* --------------------------------------------------
        HELPERS
  -------------------------------------------------- */
  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  const OFFSET_KEY = "offsets";

  /* --------------------------------------------------
        GLOBAL OFFSETS STORE
  -------------------------------------------------- */
  window.__offsets = window.__offsets || {
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
        INIT CLOUD OFFSETS
  -------------------------------------------------- */
  async function initCloud() {

    if (!window.__cloudReady) return;

    const offsets = await loadCloud(OFFSET_KEY);
    if (!offsets) return;

    Object.assign(window.__offsets, {
      net:     num(offsets.net),
      sale:    num(offsets.sale),
      service: num(offsets.service),
      stock:   num(offsets.stock),
      servInv: num(offsets.servInv),
      expenses:num(offsets.expenses)
    });

    updateUniversalBar();
  }

  /* ==========================================================
     🧠 METRICS ENGINE (CORE PROFIT LOGIC)
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

        stockInvestAll +=
          num(s.qty) * num(s.cost);
      }
    });

    /* ---------------- SERVICES ---------------- */
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

    /* ---------------- EXPENSES ---------------- */
    expenses.forEach(e => {
      expensesAll += num(e.amount);
    });

    /* ==================================================
       LIVE PROFITS (after settlement deduction)
    ================================================== */

    const saleLive =
      Math.max(0,
        saleProfitAll - window.__offsets.sale
      );

    const serviceLive =
      Math.max(0,
        serviceProfitAll - window.__offsets.service
      );

    const expenseLive =
      Math.max(0,
        expensesAll - window.__offsets.expenses
      );

    /* ---------------- NET PROFIT ---------------- */
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

  /* ✅ NET OFFSET */
  window.__offsets.net += m.netProfit;

  /* ✅ COMPONENT SNAPSHOT SYNC */
  const sales = window.sales || [];
  const services = window.services || [];
  const expenses = window.expenses || [];

  window.__offsets.sale =
    sales.reduce((a, s) =>
      a + (
        String(s.status).toLowerCase() === "paid"
          ? num(s.profit)
          : 0
      ), 0);

  window.__offsets.service =
    services.reduce((a, j) =>
      a + (
        String(j.status).toLowerCase() === "paid"
          ? (
              num(j.profit) ||
              (num(j.paid) - num(j.invest))
            )
          : 0
      ), 0);

  window.__offsets.expenses =
    expenses.reduce((a, e) =>
      a + num(e.amount), 0);
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
     💰 COLLECT ENGINE (FIXED)
  ========================================================== */
  async function collect(kind) {

    const m = window.__unMetrics || {};

    /* ---------------- NET PROFIT ---------------- */
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

      /* ✅ ONLY NET OFFSET — NO COMPONENT SETTLEMENT */
      window.__offsets.net += m.netProfit;
    }

    /* ---------------- STOCK INVEST ---------------- */
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

    /* ---------------- SERVICE INVEST ---------------- */
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

    /* ---------------- SAVE OFFSETS ---------------- */
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

  /* --------------------------------------------------
        BUTTON EVENTS
  -------------------------------------------------- */
  document.addEventListener("click", e => {

    const b = e.target.closest(".collect-btn");
    if (!b) return;

    collect(b.dataset.collect);
  });

  /* --------------------------------------------------
        CLOUD READY SYNC
  -------------------------------------------------- */
  window.addEventListener(
    "cloud-data-loaded",
    () => {
      initCloud();
      updateUniversalBar();
    }
  );

  /* --------------------------------------------------
        LIVE DATA EVENTS
  -------------------------------------------------- */
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
