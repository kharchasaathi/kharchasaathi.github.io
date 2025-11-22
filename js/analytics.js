/* ===========================================================
   📊 analytics.js — Smart Dashboard (FINAL v10.0)
   ✔ Today / Week / Month Sales
   ✔ Expenses
   ✔ Sales Profit + Service Profit
   ✔ NEW: Total Investment (Stock + Service)
   ✔ 4-Color Pie: Profit | Expenses | Credit | Investment
   ✔ Fully linked with Profit Tab
=========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------- HELPERS ----------------- */

function toNum(d) {
  return Number(d.replace(/-/g, "")) || 0;
}

function getStartOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function getStartOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

/* ===========================================================
   MAIN ANALYTICS DATA
=========================================================== */
function getAnalyticsData() {
  const sales     = window.sales || [];
  const services  = window.services || [];
  const expenses  = window.expenses || [];

  const today     = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart= getStartOfMonth();

  const weekNum   = toNum(weekStart);
  const monthNum  = toNum(monthStart);

  let todaySales = 0,
      weekSales  = 0,
      monthSales = 0;

  let paidSalesProfit = 0;
  let paidSalesAmount = 0;
  let creditSales = 0;

  /* ---------- SALES ---------- */
  sales.forEach(s => {
    const d = s.date;
    const amt = Number(s.total || 0);
    const prof = Number(s.profit || 0);
    const dNum = toNum(d);

    if (d === today) todaySales += amt;
    if (dNum >= weekNum) weekSales += amt;
    if (dNum >= monthNum) monthSales += amt;

    if ((s.status || "").toLowerCase() === "credit") {
      creditSales += amt;
      return;
    }

    paidSalesProfit += prof;
    paidSalesAmount += amt;
  });

  /* ---------- SERVICE PROFITS ---------- */
  let serviceProfit = 0;
  (services || []).forEach(s => {
    if (s.status === "Completed") {
      serviceProfit += Number(s.profit || 0);
    }
  });

  /* ---------- EXPENSES ---------- */
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  /* ---------- NEW: TOTAL INVESTMENT (Stock + Service) ---------- */
  const totalInvestment =
      (window.getStockInvestmentCollected?.() || 0) +
      (window.getServiceInvestmentCollected?.() || 0)

  /* ---------- GROSS & NET ---------- */
  const grossProfit = paidSalesProfit + serviceProfit;
  const netProfit = grossProfit - totalExpenses;

  return {
    todaySales,
    weekSales,
    monthSales,

    paidSalesProfit,
    serviceProfit,
    grossProfit,
    netProfit,

    totalExpenses,
    creditSales,
    totalInvestment,

    todayExpenses: getExpensesByDate(today)
  };
}

/* ===========================================================
   RENDER SMART DASHBOARD
=========================================================== */
function renderAnalytics() {
  const barCanvas = qs("#salesBar");
  const pieCanvas = qs("#salesPie");
  const d = getAnalyticsData();

  /* ---------- Update Summary Cards ---------- */
  

  updateSummaryCards?.();
  updateTabSummaryBar?.();

  if (!barCanvas || !pieCanvas) return;

  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ===========================================================
     BAR CHART — Today / Week / Month Sales
  ============================================================ */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "Week", "Month"],
      datasets: [{
        label: "Sales ₹",
        data: [d.todaySales, d.weekSales, d.monthSales],
        backgroundColor: ["#ff9800", "#fb8c00", "#f57c00"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  /* ===========================================================
     PIE CHART — Profit | Expenses | Credit | Investment
  ============================================================ */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: [
        "Profit",
        "Expenses",
        "Credit Sales",
        "Investment"
      ],
      datasets: [{
        data: [
          d.grossProfit,
          d.totalExpenses,
          d.creditSales,
          d.totalInvestment
        ],
        backgroundColor: [
          "#4caf50", // green  = profit
          "#e53935", // red    = expenses
          "#2196f3", // blue   = credit
          "#ffeb3b"  // yellow = investment
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Net Profit: ₹${d.netProfit}`
        }
      }
    }
  });
}

/* ===========================================================
   AUTO REFRESH
=========================================================== */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 40000);

window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

window.renderAnalytics = renderAnalytics;
window.getAnalyticsData = getAnalyticsData;
