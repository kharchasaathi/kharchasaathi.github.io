/* ======================================================
   analytics.js — FINAL v27 (OFFSET-AWARE CLOUD SAFE)

   ✔ Dashboard analytics only (READ ONLY)
   ✔ Credit-safe
   ✔ Dashboard offset supported
   ✔ UniversalBar independent
   ✔ Cloud sync compatible
   ✔ Logout/Login safe
   ✔ Loader order crash fixed
====================================================== */

(function () {

  const qs  = s => document.querySelector(s);
  const num = v => isNaN(v = Number(v)) ? 0 : v;

  let cleanPieChart = null;

  /* ======================================================
        TODAY ANALYTICS (NO OFFSET)
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

    /* ---------- SALES ---------- */
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

    /* ---------- SERVICES ---------- */
    services.forEach(j => {

      if (j.date_out !== today) return;

      const st =
        String(j.status || "").toLowerCase();

      if (st === "paid")
        todayProfit += num(j.profit);

      if (st === "credit")
        todayCredit += num(j.remaining);
    });

    /* ---------- EXPENSES ---------- */
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
        TOTAL SUMMARY (OFFSET AWARE)
  ====================================================== */
  window.getSummaryTotals = function () {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];

    let salesProfit   = 0;
    let serviceProfit = 0;
    let creditTotal   = 0;
    let stockInvest   = 0;
    let serviceInvest = 0;

    /* ---------- SALES ---------- */
    sales.forEach(s => {

      const st =
        String(s.status || "").toLowerCase();

      if (st === "credit")
        creditTotal += num(s.total);

      if (st === "paid") {
        salesProfit += num(s.profit);
        stockInvest += num(s.qty) * num(s.cost);
      }
    });

    /* ---------- SERVICES ---------- */
    services.forEach(j => {

      const st =
        String(j.status || "").toLowerCase();

      if (st === "paid") {
        serviceProfit += num(j.profit);
        serviceInvest += num(j.invest);
      }

      if (st === "credit")
        creditTotal += num(j.remaining);
    });

    const totalExpenses =
      expenses.reduce(
        (a, e) => a + num(e.amount),
        0
      );

    /* OFFSET APPLY */
    const offset =
      Number(window.__dashboardOffset || 0);

    const totalProfitRaw =
      salesProfit + serviceProfit;

    const totalProfit =
      Math.max(0, totalProfitRaw - offset);

    const netProfit =
      Math.max(
        0,
        (totalProfitRaw - totalExpenses)
        - offset
      );

    return {
      salesProfit,
      serviceProfit,
      totalProfit,
      totalExpenses,
      netProfit,
      creditTotal,
      totalInvestment:
        stockInvest + serviceInvest
    };
  };

  /* ======================================================
        RENDER DASHBOARD + PIE
  ====================================================== */
  window.renderAnalytics = function () {

    if (window.__dashboardViewCleared)
      return;

    const {
      totalProfit,
      totalExpenses,
      creditTotal,
      totalInvestment
    } = window.getSummaryTotals();

    if (qs("#dashProfit"))
      qs("#dashProfit").textContent =
        "₹" + Math.round(totalProfit);

    if (qs("#dashExpenses"))
      qs("#dashExpenses").textContent =
        "₹" + Math.round(totalExpenses);

    if (qs("#dashCredit"))
      qs("#dashCredit").textContent =
        "₹" + Math.round(creditTotal);

    if (qs("#dashInv"))
      qs("#dashInv").textContent =
        "₹" + Math.round(totalInvestment);

    /* PIE */
    const canvas = qs("#cleanPie");

    if (!canvas ||
        typeof Chart === "undefined")
      return;

    try { cleanPieChart?.destroy(); }
    catch {}

    cleanPieChart =
      new Chart(canvas, {

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
              totalProfit,
              totalExpenses,
              creditTotal,
              totalInvestment
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
            legend: {
              position: "bottom",
              labels: { boxWidth: 14 }
            }
          }
        }
      });

    window.cleanPieChart =
      cleanPieChart;
  };

  /* ======================================================
        TODAY CARDS
  ====================================================== */
  window.updateSummaryCards = function () {

    if (window.__dashboardViewCleared)
      return;

    const d =
      window.getAnalyticsData();

    if (qs("#todaySales"))
      qs("#todaySales").textContent =
        "₹" + Math.round(d.todaySales);

    if (qs("#todayCredit"))
      qs("#todayCredit").textContent =
        "₹" + Math.round(d.todayCredit);

    if (qs("#todayExpenses"))
      qs("#todayExpenses").textContent =
        "₹" + Math.round(d.todayExpenses);

    if (qs("#todayGross"))
      qs("#todayGross").textContent =
        "₹" + Math.round(d.grossProfit);

    if (qs("#todayNet"))
      qs("#todayNet").textContent =
        "₹" + Math.round(d.netProfit);
  };

  /* ======================================================
        ☁️ CLOUD SYNC (REPLACED SAFE VERSION)
  ====================================================== */
  window.addEventListener(
    "cloud-data-loaded",
    () => {

      if (window.__dashboardViewCleared)
        return;

      if (typeof renderAnalytics === "function")
        renderAnalytics();

      if (typeof updateSummaryCards === "function")
        updateSummaryCards();

      if (typeof updateUniversalBar === "function")
        updateUniversalBar();
    }
  );

  /* ======================================================
        INIT SAFE LOAD
  ====================================================== */
  window.addEventListener("load", () => {

    const safeRender = () => {

      if (window.__dashboardViewCleared)
        return;

      if (
        Array.isArray(window.services) &&
        Array.isArray(window.sales)
      ) {

        if (typeof renderAnalytics === "function")
          renderAnalytics();

        if (typeof updateSummaryCards === "function")
          updateSummaryCards();

        if (typeof updateUniversalBar === "function")
          updateUniversalBar();
      }
    };

    safeRender();
    setTimeout(safeRender, 500);
    setTimeout(safeRender, 1000);
  });

})();
