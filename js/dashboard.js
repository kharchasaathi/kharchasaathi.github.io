/* =========================================
   dashboard.js — FINAL v32
   WITHDRAW + SETTLEMENT + LEDGER SAFE

   ✔ Settlement aware
   ✔ Withdraw aware
   ✔ Expense live lock safe
   ✔ Profit duplication guard
   ✔ Universal synced
   ✔ Multi-device safe
========================================= */

(function () {

  const qs = s => document.querySelector(s);

  /* ---------------------------------------
     SAFE NUM
  --------------------------------------- */
  const num = v =>
    (isNaN(v = Number(v))) ? 0 : Number(v);

  const money = v =>
    "₹" + Math.round(num(v));

  /* ---------------------------------------
     GET OFFSETS (SETTLEMENT ENGINE)
  --------------------------------------- */
  function getOffsets() {

    return window.__offsets || {
      net: 0,
      sale: 0,
      service: 0,
      stock: 0,
      servInv: 0,
      expenses: 0
    };
  }

  /* ---------------------------------------
     CORE ANALYTICS ENGINE
  --------------------------------------- */
  function computeDashboard() {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    const offs = getOffsets();

    let saleProfit    = 0;
    let serviceProfit = 0;
    let expenseTotal  = 0;
    let creditTotal   = 0;
    let investTotal   = 0;

    /* =====================================
       🔹 SALES ENGINE
    ===================================== */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        creditTotal += num(s.total);

      if (st === "paid") {

        saleProfit += num(s.profit);

        investTotal +=
          num(s.qty) * num(s.cost);
      }
    });

    /* =====================================
       🔹 SERVICE ENGINE
    ===================================== */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "credit")
        creditTotal += num(j.remaining);

      if (st === "paid") {

        const invest = num(j.invest);

        const profit =
          num(j.profit) ||
          (num(j.paid) - invest);

        serviceProfit +=
          Math.max(0, profit);

        investTotal += invest;
      }
    });

    /* =====================================
       🔹 EXPENSE ENGINE
    ===================================== */
    expenses.forEach(e => {
      expenseTotal += num(e.amount);
    });

    /* =====================================
       🔥 APPLY SETTLEMENT + WITHDRAW
    ===================================== */

    const withdrawn =
      num(window.__unMetrics?.profitWithdrawn);

    /* Sale settlement */
    const saleLive =
      Math.max(0, saleProfit - num(offs.sale));

    /* Service settlement */
    const serviceLive =
      Math.max(0, serviceProfit - num(offs.service));

    /* Expense settlement */
    const expenseLive =
      Math.max(0, expenseTotal - num(offs.expenses));

    /* Gross live */
    const grossLive =
      saleLive + serviceLive;

    /* Net after expenses */
    const netAfterExpense =
      grossLive - expenseLive;

    /* Final net after withdraw + net offset */
    const netLive =
      Math.max(
        0,
        netAfterExpense
        - withdrawn
        - num(offs.net)
      );

    return {

      profit:   netLive,
      gross:    grossLive,
      expenses: expenseLive,
      credit:   creditTotal,
      invest:   investTotal
    };
  }

  /* ---------------------------------------
     UI RENDER
  --------------------------------------- */
  function renderDashboard() {

    const d = computeDashboard();

    setText("#dashProfit",   money(d.profit));
    setText("#dashExpenses", money(d.expenses));
    setText("#dashCredit",   money(d.credit));
    setText("#dashInv",      money(d.invest));

    setText("#todayGross", money(d.gross));
    setText("#todayNet",   money(d.profit));
  }

  /* ---------------------------------------
     SAFE TEXT SETTER
  --------------------------------------- */
  function setText(id, value) {

    const el = qs(id);
    if (el) el.textContent = value;
  }

  /* =====================================
     🔄 UNIVERSAL SYNC EVENTS
  ===================================== */

  window.addEventListener(
    "sales-updated",
    renderDashboard
  );

  window.addEventListener(
    "services-updated",
    renderDashboard
  );

  window.addEventListener(
    "expenses-updated",
    renderDashboard
  );

  window.addEventListener(
    "collection-updated",
    renderDashboard
  );

  window.addEventListener(
    "cloud-data-loaded",
    renderDashboard
  );

  /* Initial load */
  setTimeout(renderDashboard, 800);

})();
