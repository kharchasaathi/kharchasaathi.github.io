/* ======================================================
   analytics.js — FINAL v31
   WITHDRAW + SETTLEMENT + UNIVERSAL SAFE
====================================================== */

(function () {

  const qs  = s => document.querySelector(s);
  const num = v => isNaN(v = Number(v)) ? 0 : v;

  let cleanPieChart = null;

  /* ======================================================
        TODAY ANALYTICS
  ====================================================== */
  window.getAnalyticsData = function () {

    const today =
      typeof todayDate === "function"
        ? todayDate()
        : new Date().toISOString().slice(0, 10);

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let todaySales    = 0;
    let todayCredit   = 0;
    let todayExpenses = 0;
    let todayProfit   = 0;

    /* ---------------- SALES ---------------- */

    sales.forEach(s => {

      if (s.date !== today) return;

      const st =
        String(s.status || "").toLowerCase();

      if (st === "credit")
        todayCredit += num(s.total);

      if (st === "paid") {
        todaySales  += num(s.total);
        todayProfit += num(s.profit);
      }
    });

    /* ---------------- SERVICES ---------------- */

    services.forEach(j => {

      if (j.date_out !== today) return;

      const st =
        String(j.status || "").toLowerCase();

      if (st === "paid")
        todayProfit += num(j.profit);

      if (st === "credit")
        todayCredit += num(j.remaining);
    });

    /* ---------------- EXPENSES ---------------- */

    expenses.forEach(e => {

      if (e.date === today)
        todayExpenses += num(e.amount);
    });

    return {
      todaySales,
      todayCredit,
      todayExpenses,
      grossProfit: todayProfit,
      netProfit: todayProfit - todayExpenses
    };
  };


  /* ======================================================
        TOTAL SUMMARY
        (WITHDRAW + OFFSET SAFE)
  ====================================================== */
  window.getSummaryTotals = function () {

    const m = window.__unMetrics || {};

    const salesProfit   =
      num(m.saleProfitCollected);

    const serviceProfit =
      num(m.serviceProfitCollected);

    const withdrawn =
      num(m.profitWithdrawn);   // 🔥 NEW

    const totalProfitRaw =
      salesProfit + serviceProfit;

    const totalExpenses =
      num(m.expensesLive);

    const offset =
      Number(window.__dashboardOffset || 0);

    return {

      salesProfit,
      serviceProfit,

      /* ---------------- PROFIT ---------------- */

      totalProfit:
        Math.max(
          0,
          totalProfitRaw
          - withdrawn
          - offset
        ),

      /* ---------------- EXPENSE ---------------- */

      totalExpenses,

      /* ---------------- NET ---------------- */

      netProfit:
        Math.max(
          0,
          totalProfitRaw
          - totalExpenses
          - withdrawn
          - offset
        ),

      /* ---------------- CREDIT ---------------- */

      creditTotal:
        num(m.pendingCreditTotal),

      /* ---------------- INVESTMENT ---------------- */

      totalInvestment:
        num(m.stockInvestSold)
        + num(m.serviceInvestCompleted)
    };
  };


  /* ======================================================
        RENDER DASHBOARD
  ====================================================== */
  window.renderAnalytics = function () {

    if (window.__dashboardViewCleared)
      return;

    const t = window.getSummaryTotals();

    qs("#dashProfit") &&
      (qs("#dashProfit").textContent =
        "₹" + Math.round(t.totalProfit));

    qs("#dashExpenses") &&
      (qs("#dashExpenses").textContent =
        "₹" + Math.round(t.totalExpenses));

    qs("#dashCredit") &&
      (qs("#dashCredit").textContent =
        "₹" + Math.round(t.creditTotal));

    qs("#dashInv") &&
      (qs("#dashInv").textContent =
        "₹" + Math.round(t.totalInvestment));


    /* ======================================================
          PIE CHART
    ====================================================== */

    const canvas = qs("#cleanPie");
    if (!canvas || typeof Chart === "undefined")
      return;

    try { cleanPieChart?.destroy(); }
    catch {}

    cleanPieChart = new Chart(canvas, {

      type: "pie",

      data: {
        labels: [
          "Profit",
          "Expenses",
          "Credit Pending",
          "Investment"
        ],

        datasets: [{
          data: [
            t.totalProfit,
            t.totalExpenses,
            t.creditTotal,
            t.totalInvestment
          ],

          backgroundColor: [
            "#16a34a",
            "#dc2626",
            "#2563eb",
            "#facc15"
          ]
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  };


  /* ======================================================
        TODAY SUMMARY CARDS
  ====================================================== */
  window.updateSummaryCards = function () {

    if (window.__dashboardViewCleared)
      return;

    const d = window.getAnalyticsData();

    qs("#todaySales") &&
      (qs("#todaySales").textContent =
        "₹" + Math.round(d.todaySales));

    qs("#todayCredit") &&
      (qs("#todayCredit").textContent =
        "₹" + Math.round(d.todayCredit));

    qs("#todayExpenses") &&
      (qs("#todayExpenses").textContent =
        "₹" + Math.round(d.todayExpenses));

    qs("#todayGross") &&
      (qs("#todayGross").textContent =
        "₹" + Math.round(d.grossProfit));

    qs("#todayNet") &&
      (qs("#todayNet").textContent =
        "₹" + Math.round(d.netProfit));
  };


  /* ======================================================
        CLOUD SYNC
  ====================================================== */
  window.addEventListener(
    "cloud-data-loaded",
    () => {

      if (window.__dashboardViewCleared)
        return;

      renderAnalytics?.();
      updateSummaryCards?.();
      updateUniversalBar?.();
    }
  );


  /* ======================================================
        SAFE LOAD
  ====================================================== */
  window.addEventListener("load", () => {

    const safeRender = () => {

      if (window.__dashboardViewCleared)
        return;

      if (
        Array.isArray(window.sales) &&
        Array.isArray(window.services)
      ) {

        renderAnalytics?.();
        updateSummaryCards?.();
        updateUniversalBar?.();
      }
    };

    safeRender();
    setTimeout(safeRender, 500);
    setTimeout(safeRender, 1000);
  });

})();
