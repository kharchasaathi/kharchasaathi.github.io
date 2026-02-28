/* ===========================================================
   universal-bar.js — FINAL v6
   SETTLEMENT + WITHDRAW + LEDGER SAFE
   + Dynamic Net Flow Color
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

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        pendingCredit += num(s.total);

      if (st === "paid") {
        saleProfitAll += num(s.profit);
        stockInvestAll += num(s.qty) * num(s.cost);
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

    const settledOffset = num(offs.expensesSettled);
    const expensesLive =
      Math.max(0, expensesAll - settledOffset);

    const withdrawn =
      num(window.__unMetrics?.profitWithdrawn);

    const netLive =
      saleProfitAll +
      serviceProfitAll -
      expensesLive -
      withdrawn;

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

    m.profitWithdrawn =
      num(window.__unMetrics?.profitWithdrawn);

    window.__unMetrics = m;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = money(v);
    };

    /* Update Cards */
    set("ubSaleProfit",    m.saleProfitCollected);
    set("ubServiceProfit", m.serviceProfitCollected);
    set("ubSaleInv",       m.stockInvestSold);
    set("ubServiceInv",    m.serviceInvestCompleted);
    set("ubExpenses",      m.expensesLive);
    set("ubProfitWithdraw",m.profitWithdrawn);
    set("ubNetFlow",       m.netProfit);


    /* ======================================================
       🔥 Dynamic Net Flow Color
    ====================================================== */

    const box = document.querySelector(".ub-netflow-box");

    if (box) {

      box.classList.remove(
        "ub-netflow-positive",
        "ub-netflow-negative"
      );

      if (m.netProfit >= 0) {
        box.classList.add("ub-netflow-positive");
      } else {
        box.classList.add("ub-netflow-negative");
      }
    }
  }

  window.updateUniversalBar = updateUniversalBar;


  /* ==========================================================
     AUTO REFRESH EVENTS
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

  setTimeout(updateUniversalBar, 500);
  setTimeout(updateUniversalBar, 1500);

})();
