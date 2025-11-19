/* ===========================================================
   📊 analytics.js — Smart Dashboard (OPTION - A FINAL v8.0)
   ✔ Sales + Service Profit + Expenses Included
   ✔ Bar: Today / Week / Month Sales
   ✔ Pie: Profit vs Expenses
   ✔ Clean & Minimal Dashboard
=========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* -------------------- HELPERS -------------------- */

function toNum(d) {
  return d ? Number(d.replace(/-/g, "")) : 0;
}

function formatDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay();
  t.setDate(t.getDate() - day);
  return formatDate(t);
}

function getStartOfMonth() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e.date === date)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   COLLECT ANALYTICS (SALES + SERVICE + EXPENSES)
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const services = window.services || [];
  const expenses = window.expenses || [];

  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const todayN = toNum(today);
  const weekN = toNum(weekStart);
  const monthN = toNum(monthStart);

  let todaySales = 0,
      weekSales = 0,
      monthSales = 0,
      totalProfitSales = 0,
      totalProfitService = 0,
      totalExpenses = 0;

  /* ----- SALES PROFITS ----- */
  sales.forEach(s => {
    const d = s.date;
    if (!d) return;

    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    const dNum = toNum(d);

    if (d === today) todaySales += amt;
    if (dNum >= weekN) weekSales += amt;
    if (dNum >= monthN) monthSales += amt;

    totalProfitSales += prof;
  });

  /* ----- SERVICE PROFITS ----- */
  services.forEach(s => {
    totalProfitService += Number(s.profit || 0);
  });

  /* ----- EXPENSES ----- */
  expenses.forEach(e => {
    totalExpenses += Number(e.amount || 0);
  });

  const totalProfit = totalProfitSales + totalProfitService;
  const netProfit = totalProfit - totalExpenses;

  return {
    todaySales,
    weekSales,
    monthSales,
    totalProfit,
    totalExpenses,
    netProfit
  };
}

/* ----------------------------------------------------------
   RENDER DASHBOARD
---------------------------------------------------------- */
function renderAnalytics() {
  const barCanvas = qs("#salesBar");
  const pieCanvas = qs("#salesPie");

  if (!barCanvas || !pieCanvas) return;

  const d = getAnalyticsData();

  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ---------- BAR CHART (SALES) ---------- */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "Week", "Month"],
      datasets: [{
        label: "Sales ₹",
        data: [d.todaySales, d.weekSales, d.monthSales],
        backgroundColor: ["#ff9800", "#fb8c00", "#f57c00"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Sales Overview" },
        legend: { display: false }
      },
      scales: { y: { beginAtZero: true } }
    }
  });

  /* ---------- PIE CHART (PROFIT vs EXPENSES) ---------- */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Total Profit", "Expenses"],
      datasets: [{
        data: [d.totalProfit, d.totalExpenses],
        backgroundColor: ["#4caf50", "#e53935"]
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

  updateSummaryCards?.();
}

/* ----------------------------------------------------------
   AUTO REFRESH
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 45000);

/* ----------------------------------------------------------
   SYNC STORAGE
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

/* ----------------------------------------------------------
   ON LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

window.renderAnalytics = renderAnalytics;
window.getAnalyticsData = getAnalyticsData;
