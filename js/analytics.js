// ===============================
//  analytics.js — FINAL CLEAN V5
//  + Collection.js integration
//  + Safe Numbers + Investment Fix
//  + Fully matches business-dashboard.html
// ===============================

let cleanPieChart = null;

/* --------------------------------
   TODAY + TOTAL ANALYTICS DATA
---------------------------------- */
window.getAnalyticsData = function () {

  const today = (typeof todayDate === "function")
    ? todayDate()
    : new Date().toISOString().slice(0, 10);

  const sales       = window.sales       || [];
  const expenses    = window.expenses    || [];
  const services    = window.services    || [];
  const collections = window.collections || [];

  let todaySales      = 0;
  let creditSales     = 0;
  let todayExpenses   = 0;
  let grossProfit     = 0;
  let todayCollection = 0;

  /* ---------- TODAY SALES ---------- */
  sales.forEach(s => {
    if (s.date !== today) return;

    const total = Number(s.total || (s.qty * s.price));

    if (String(s.status).toLowerCase() === "credit") {
      creditSales += total;
    } else {
      todaySales += total;
      grossProfit += Number(s.profit || 0);
    }
  });

  /* ---------- TODAY SERVICE PROFIT ---------- */
  services.forEach(j => {
    if (j.date_out === today) {
      grossProfit += Number(j.profit || 0);
    }
  });

  /* ---------- TODAY EXPENSES ---------- */
  expenses.forEach(e => {
    if (e.date === today) todayExpenses += Number(e.amount || 0);
  });

  /* ---------- TODAY COLLECTION ---------- */
  collections.forEach(c => {
    if (c.date === today) {
      todayCollection += Number(c.amount || 0);
    }
  });

  const netProfit = grossProfit - todayExpenses;

  return {
    todaySales,
    creditSales,
    todayExpenses,
    todayCollection,
    grossProfit,
    netProfit
  };
};


/* --------------------------------
   SMART DASHBOARD (TOTALS)
---------------------------------- */
window.renderAnalytics = function () {

  const sales       = window.sales       || [];
  const expenses    = window.expenses    || [];
  const services    = window.services    || [];
  const collections = window.collections || [];

  let salesProfit   = 0;
  let serviceProfit = 0;

  sales.forEach(s => {
    if (String(s.status).toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  services.forEach(j => {
    serviceProfit += Number(j.profit || 0);
  });

  const totalProfit = salesProfit + serviceProfit;

  /* ---------- TOTAL EXPENSES ---------- */
  let totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0), 0
  );

  /* ---------- TOTAL CREDIT ---------- */
  let creditTotal = 0;
  sales.forEach(s => {
    if (String(s.status).toLowerCase() === "credit") {
      creditTotal += Number(
        s.total || (s.qty * s.price)
      );
    }
  });

  /* ---------- TOTAL INVESTMENT ---------- */
  let investment = 0;

  investment += Number(getStockInvestmentAfterSale?.() || 0);
  investment += Number(getServiceInvestmentCollected?.() || 0);

  /* ---------- TOTAL COLLECTION ---------- */
  let totalCollection = collections.reduce(
    (s, c) => s + Number(c.amount || 0), 0
  );

  /* ---------- UPDATE CARDS ---------- */
  qs("#dashProfit").textContent   = "₹" + Math.round(totalProfit);
  qs("#dashExpenses").textContent = "₹" + Math.round(totalExpenses);
  qs("#dashCredit").textContent   = "₹" + Math.round(creditTotal);
  qs("#dashInv").textContent      = "₹" + Math.round(investment);

  /* ---------- PIE CHART ---------- */
  const ctx = qs("#cleanPie");
  if (!ctx || typeof Chart === "undefined") return;

  if (cleanPieChart) cleanPieChart.destroy();

  cleanPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Profit", "Expenses", "Credit", "Investment", "Collection"],
      datasets: [{
        data: [
          Number(totalProfit || 0),
          Number(totalExpenses || 0),
          Number(creditTotal || 0),
          Number(investment || 0),
          Number(totalCollection || 0)
        ],
        backgroundColor: [
          "#2e7d32",
          "#c62828",
          "#1565c0",
          "#fbc02d",
          "#6a1b9a"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
};


/* --------------------------------
   AUTO RENDER
---------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch (e) {}
  try { updateSummaryCards(); } catch (e) {}
});
