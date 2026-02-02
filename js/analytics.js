/* ======================================================
   analytics.js — BUSINESS v23 (READ-ONLY + SAFE)
   ------------------------------------------------------
   ✅ Dashboard analytics only
   ✅ NO global clear
   ✅ NO offset reset
   ✅ UniversalBar = single source of truth
   ✅ Credit pending visible
====================================================== */

(function () {

  const qs = s => document.querySelector(s);
  const num = v => isNaN(v = Number(v)) ? 0 : v;

  let cleanPieChart = null;

  /* ======================================================
        TODAY ANALYTICS (READ ONLY)
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

    /* SALES */
    sales.forEach(s => {
      if (s.date !== today) return;

      if ((s.status || "").toLowerCase() === "credit") {
        todayCredit += num(s.total);
      } else {
        todaySales  += num(s.total);
        todayProfit += num(s.profit);
      }
    });

    /* SERVICES */
    services.forEach(j => {
      if (
        j.date_out === today &&
        (j.status || "").toLowerCase() === "completed"
      ) {
        todayProfit += num(j.profit);
      }
    });

    /* EXPENSES */
    expenses.forEach(e => {
      if (e.date === today) {
        todayExpenses += num(e.amount);
      }
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
        TOTAL SUMMARY (READ ONLY)
  ====================================================== */
  window.getSummaryTotals = function () {

    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];
    const stock    = window.stock    || [];

    let salesProfit   = 0;
    let serviceProfit = 0;
    let creditTotal   = 0;
    let stockInvest   = 0;
    let serviceInvest = 0;

    /* SALES */
    sales.forEach(s => {
      if ((s.status || "").toLowerCase() === "credit") {
        creditTotal += num(s.total);
      } else {
        salesProfit += num(s.profit);
        stockInvest += num(s.qty) * num(s.cost);
      }
    });

    /* SERVICES */
    services.forEach(j => {
      const st = (j.status || "").toLowerCase();

      if (st === "completed") {
        serviceProfit += num(j.profit);
        serviceInvest += num(j.invest);
      }

      if (st === "credit") {
        creditTotal += num(j.remaining);
      }
    });

    /* EXPENSES */
    const totalExpenses =
      expenses.reduce((a, e) => a + num(e.amount), 0);

    return {
      salesProfit,
      serviceProfit,
      totalProfit: salesProfit + serviceProfit,
      totalExpenses,
      netProfit: salesProfit + serviceProfit - totalExpenses,
      creditTotal,
      totalInvestment: stockInvest + serviceInvest
    };
  };

  /* ======================================================
        RENDER DASHBOARD + PIE
  ====================================================== */
  window.renderAnalytics = function () {

    const {
      totalProfit,
      totalExpenses,
      creditTotal,
      totalInvestment
    } = window.getSummaryTotals();

    if (qs("#dashProfit"))
      qs("#dashProfit").textContent = "₹" + Math.round(totalProfit);

    if (qs("#dashExpenses"))
      qs("#dashExpenses").textContent = "₹" + Math.round(totalExpenses);

    if (qs("#dashCredit"))
      qs("#dashCredit").textContent = "₹" + Math.round(creditTotal);

    if (qs("#dashInv"))
      qs("#dashInv").textContent = "₹" + Math.round(totalInvestment);

    /* PIE CHART */
    const ctx = qs("#cleanPie");
    if (!ctx || typeof Chart === "undefined") return;

    try {
      cleanPieChart?.destroy();
    } catch {}

    cleanPieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Profit", "Expenses", "Credit Pending", "Investment"],
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
        plugins: { legend: { position: "bottom" } }
      }
    });
  };

  /* ======================================================
        TODAY CARDS
  ====================================================== */
  window.updateSummaryCards = function () {

    const d = window.getAnalyticsData();

    if (qs("#todaySales"))
      qs("#todaySales").textContent = "₹" + Math.round(d.todaySales);

    if (qs("#todayCredit"))
      qs("#todayCredit").textContent = "₹" + Math.round(d.todayCredit);

    if (qs("#todayExpenses"))
      qs("#todayExpenses").textContent = "₹" + Math.round(d.todayExpenses);

    if (qs("#todayGross"))
      qs("#todayGross").textContent = "₹" + Math.round(d.grossProfit);

    if (qs("#todayNet"))
      qs("#todayNet").textContent = "₹" + Math.round(d.netProfit);
  };

  /* ======================================================
        INIT (SAFE)
  ====================================================== */
  window.addEventListener("load", () => {
    setTimeout(() => {
      renderAnalytics?.();
      updateSummaryCards?.();
      updateUniversalBar?.(); // read-only refresh
    }, 300);
  });

})();
