// ======================================================
//  analytics.js — FINAL V6 (Dashboard Only)
//  • Today overview helpers (Dashboard tab)
//  • Smart Dashboard (Total) + Pie chart
//  • Universal Bar is handled ONLY by universalBar.js
// ======================================================

let cleanPieChart = null;

/* --------------------------------
   TODAY + TOTAL ANALYTICS DATA
---------------------------------- */
window.getAnalyticsData = function () {

  const today = (typeof todayDate === "function")
    ? todayDate()
    : new Date().toISOString().slice(0, 10);

  const sales    = window.sales    || [];
  const expenses = window.expenses || [];
  const services = window.services || [];

  let todaySales    = 0;
  let creditSales   = 0;
  let todayExpenses = 0;
  let grossProfit   = 0;

  // ---- TODAY SALES ----
  sales.forEach(s => {
    if (!s.date || s.date !== today) return;

    const total = Number(
      s.total || s.amount ||
      (Number(s.qty || 0) * Number(s.price || 0))
    );

    const status = String(s.status || "").toLowerCase();

    if (status === "credit") {
      creditSales += total;
    } else {
      todaySales += total;
      grossProfit += Number(s.profit || 0);
    }
  });

  // ---- TODAY SERVICE PROFIT ----
  services.forEach(j => {
    if (j.date_out === today) {
      grossProfit += Number(j.profit || 0);
    }
  });

  // ---- TODAY EXPENSES ----
  expenses.forEach(e => {
    if (e.date === today) {
      todayExpenses += Number(e.amount || 0);
    }
  });

  const netProfit = grossProfit - todayExpenses;

  return {
    todaySales,
    creditSales,
    todayExpenses,
    grossProfit,
    netProfit
  };
};

/* --------------------------------
   GLOBAL TOTAL SUMMARY NUMBERS
   (Used by Smart Dashboard & Pie)
---------------------------------- */
window.getSummaryTotals = function () {
  const sales    = window.sales    || [];
  const expenses = window.expenses || [];
  const services = window.services || [];

  let salesProfit   = 0;
  let serviceProfit = 0;
  let creditTotal   = 0;

  // SALES PROFIT + CREDIT
  sales.forEach(s => {
    const status = String(s.status || "").toLowerCase();
    const total  = Number(
      s.total || s.amount ||
      (Number(s.qty || 0) * Number(s.price || 0))
    );

    if (status === "credit") {
      creditTotal += total;
    } else {
      // Only non-credit sales count as collected profit
      salesProfit += Number(s.profit || 0);
    }
  });

  // SERVICE PROFIT (completed only - because only then profit is set)
  services.forEach(j => {
    serviceProfit += Number(j.profit || 0);
  });

  const totalProfit = salesProfit + serviceProfit;

  // EXPENSES
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0), 0
  );

  const netProfit = totalProfit - totalExpenses;

  // INVESTMENTS (from core.js helpers)
  let stockAfter = 0;
  let serviceInv = 0;

  if (typeof window.getStockInvestmentAfterSale === "function") {
    stockAfter = Number(window.getStockInvestmentAfterSale() || 0);
  }
  if (typeof window.getServiceInvestmentCollected === "function") {
    serviceInv = Number(window.getServiceInvestmentCollected() || 0);
  }

  return {
    salesProfit,
    serviceProfit,
    totalProfit,
    totalExpenses,
    netProfit,
    creditTotal,
    stockAfter,
    serviceInv
  };
};

/* --------------------------------
   SMART DASHBOARD (TOTALS TAB)
---------------------------------- */
window.renderAnalytics = function () {

  const {
    salesProfit,
    serviceProfit,
    totalProfit,
    totalExpenses,
    netProfit,      // (ఇక్కడ direct గా use చేయకపోయినా future use కోసం)
    creditTotal,
    stockAfter,
    serviceInv
  } = window.getSummaryTotals();

  // ---- SMART DASHBOARD CAR్డ్స్ ----
  const dashProfit   = qs("#dashProfit");
  const dashExpenses = qs("#dashExpenses");
  const dashCredit   = qs("#dashCredit");
  const dashInv      = qs("#dashInv");

  if (dashProfit)   dashProfit.textContent   = "₹" + Math.round(totalProfit);
  if (dashExpenses) dashExpenses.textContent = "₹" + Math.round(totalExpenses);
  if (dashCredit)   dashCredit.textContent   = "₹" + Math.round(creditTotal);
  if (dashInv)      dashInv.textContent      = "₹" + Math.round(stockAfter + serviceInv);

  // ---- UNIVERSAL BAR UPDATE (delegate to universalBar.js) ----
  if (typeof window.updateUniversalBar === "function") {
    window.updateUniversalBar();
  }

  // ---- PIE CHART ----
  const ctx = qs("#cleanPie");
  if (!ctx || typeof Chart === "undefined") return;

  if (cleanPieChart) cleanPieChart.destroy();

  cleanPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Profit", "Expenses", "Credit", "Investment"],
      datasets: [{
        data: [
          Number(totalProfit || 0),
          Number(totalExpenses || 0),
          Number(creditTotal || 0),
          Number(stockAfter + serviceInv || 0)
        ],
        backgroundColor: ["#2e7d32", "#c62828", "#1565c0", "#fbc02d"]
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
   TODAY SUMMARY CARDS (Overview Tab)
---------------------------------- */
window.updateSummaryCards = function () {
  const data = window.getAnalyticsData();

  const tSales   = qs("#todaySales");
  const tCredit  = qs("#todayCredit");
  const tExp     = qs("#todayExpenses");
  const tGross   = qs("#todayGross");
  const tNet     = qs("#todayNet");

  if (tSales)  tSales.textContent  = "₹" + Math.round(data.todaySales);
  if (tCredit) tCredit.textContent = "₹" + Math.round(data.creditSales);
  if (tExp)    tExp.textContent    = "₹" + Math.round(data.todayExpenses);
  if (tGross)  tGross.textContent  = "₹" + Math.round(data.grossProfit);
  if (tNet)    tNet.textContent    = "₹" + Math.round(data.netProfit);
};

/* --------------------------------
   AUTO RENDER ON LOAD
---------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); }      catch (e) {}
  try { updateSummaryCards(); }   catch (e) {}
  // universalBar.js కూడా load అయిన తర్వాత తన own init వేసుకుంటుంది
});
