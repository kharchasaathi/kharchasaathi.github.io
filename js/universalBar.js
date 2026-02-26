/* ===========================================================
   universal-bar.js — FINAL v5
   SETTLEMENT + WITHDRAW + LEDGER SAFE

   ✔ Settlement aware expenses
   ✔ Withdraw deduction safe
   ✔ Profit integrity safe
   ✔ Dashboard aligned
   ✔ Analytics aligned
   ✔ Audit ready
=========================================================== */

(function () {

  /* ---------------- HELPERS ---------------- */

  const num = v =>
    (isNaN(v = Number(v))) ? 0 : Number(v);

  const money = v =>
    "₹" + Math.round(num(v));


  /* ==========================================================
     METRICS ENGINE
  ========================================================== */
  function computeMetrics() {

    /* 🔒 DASHBOARD CLEAR GUARD */
    if (window.__dashboardViewCleared) {
      return {
        saleProfitCollected: 0,
        serviceProfitCollected: 0,
        stockInvestSold: 0,
        serviceInvestCompleted: 0,
        expensesLive: 0,
        pendingCreditTotal: 0,
        profitWithdrawn: 0,
        netProfit: 0
      };
    }

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];
    const offs     = window.__offsets || {};

    let saleProfitAll     = 0;
    let serviceProfitAll  = 0;
    let expensesAll       = 0;
    let stockInvestAll    = 0;
    let serviceInvestAll  = 0;
    let pendingCredit     = 0;

    /* ---------------- SALES ---------------- */

    sales.forEach(s => {

      const st =
        String(s.status).toLowerCase();

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

      const st =
        String(j.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(j.remaining);

      if (st === "paid") {

        const invest =
          num(j.invest);

        const profit =
          num(j.profit) ||
          (num(j.paid) - invest);

        serviceProfitAll +=
          Math.max(0, profit);

        serviceInvestAll += invest;
      }
    });


    /* ---------------- EXPENSES (LEDGER TOTAL) ---------------- */

    expenses.forEach(e => {
      expensesAll += num(e.amount);
    });


    /* ======================================================
       💰 SETTLEMENT ADJUSTMENT
       Remove settled expenses from live impact
    ====================================================== */

    const settledOffset =
      num(offs.expensesSettled);

    const expensesLive =
      Math.max(
        0,
        expensesAll - settledOffset
      );


    /* ======================================================
       💸 WITHDRAW LEDGER
    ====================================================== */

    const withdrawn =
      num(window.__unMetrics?.profitWithdrawn);


    /* ======================================================
       FINAL NET PROFIT
    ====================================================== */

    const netLive =
      Math.max(
        0,
        saleProfitAll +
        serviceProfitAll -
        expensesLive -
        withdrawn
      );


    return {

      saleProfitCollected: saleProfitAll,
      serviceProfitCollected: serviceProfitAll,

      stockInvestSold: stockInvestAll,
      serviceInvestCompleted: serviceInvestAll,

      expensesLive,
      pendingCreditTotal: pendingCredit,

      profitWithdrawn: withdrawn,
      netProfit: netLive
    };
  }


  /* ==========================================================
     UI RENDER
  ========================================================== */
  function updateUniversalBar() {

    const m = computeMetrics();

    /* 🔒 Preserve withdraw ledger */
    m.profitWithdrawn =
      num(window.__unMetrics?.profitWithdrawn);

    window.__unMetrics = m;

    const set = (id, v) => {
      const el =
        document.getElementById(id);
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

  window.updateUniversalBar =
    updateUniversalBar;


  /* ==========================================================
     🔄 AUTO REFRESH EVENTS
  ========================================================== */

  window.addEventListener(
    "cloud-data-loaded",
    updateUniversalBar
  );

  [
    "sales-updated",
    "services-updated",
    "expenses-updated",
    "collection-updated"
  ].forEach(ev => {

    window.addEventListener(
      ev,
      updateUniversalBar
    );

  });


  /* Safety delayed refresh */

  setTimeout(updateUniversalBar, 500);
  setTimeout(updateUniversalBar, 1500);

})();
