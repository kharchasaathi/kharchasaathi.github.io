/* =========================================
   dashboard.js — FINAL v30
   SETTLEMENT AWARE ANALYTICS ENGINE

   ✔ Clear button removed
   ✔ Dashboard offset removed
   ✔ Settlement aware profit
   ✔ Logout/Login safe
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
     GET OFFSETS
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

    let saleTotal    = 0;
    let serviceTotal = 0;
    let expenseTotal = 0;
    let creditTotal  = 0;
    let investTotal  = 0;

    /* -------- SALES -------- */
    sales.forEach(s => {

      const st = String(s.status).toLowerCase();

      if (st === "credit")
        creditTotal += num(s.total);

      if (st === "paid") {

        saleTotal += num(s.profit);
        investTotal += num(s.qty) * num(s.cost);
      }
    });

    /* -------- SERVICES -------- */
    services.forEach(j => {

      const st = String(j.status).toLowerCase();

      if (st === "credit")
        creditTotal += num(j.remaining);

      if (st === "paid") {

        const invest = num(j.invest);
        const profit =
          num(j.profit) ||
          (num(j.paid) - invest);

        serviceTotal += Math.max(0, profit);
        investTotal  += invest;
      }
    });

    /* -------- EXPENSES -------- */
    expenses.forEach(e => {
      expenseTotal += num(e.amount);
    });

    /* =====================================
       🔥 APPLY SETTLEMENT OFFSETS
    ===================================== */

    const saleLive =
      Math.max(0, saleTotal - offs.sale);

    const serviceLive =
      Math.max(0, serviceTotal - offs.service);

    const expenseLive =
      Math.max(0, expenseTotal - offs.expenses);

    const netRaw =
      saleLive +
      serviceLive -
      expenseLive;

    const netLive =
      Math.max(0, netRaw - offs.net);

    return {

      profit:   netLive,
      gross:    saleLive + serviceLive,
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

    /* TODAY cards can reuse same safe values */
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

  /* ---------------------------------------
     UNIVERSAL SYNC
  --------------------------------------- */
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
