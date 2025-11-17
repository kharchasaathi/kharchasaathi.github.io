/* ===========================================================
   📊 analytics.js — Smart Dashboard (FINAL v4.0)
   Fully Synced with: core.js + sales.js + expenses.js
   Uses: Chart.js (auto-refresh)
   =========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */
function formatDate(d) {
  return new Date(d).toISOString().split("T")[0];
}
function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay();  // 0 = Sunday
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
   CALCULATE FULL ANALYTICS DATA
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  let todaySales = 0,
      weekSales = 0,
      monthSales = 0,
      paidSales = 0,
      creditSales = 0,
      grossProfit = 0;

  sales.forEach(s => {
    const d = s.date;
    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    if (d === today) todaySales += amt;
    if (d >= weekStart) weekSales += amt;
    if (d >= monthStart) monthSales += amt;

    if (s.status === "Credit") creditSales += amt;
    else paidSales += amt;

    grossProfit += prof;
  });

  const todayExpenses = getExpensesByDate(today);
  const netProfit = grossProfit - todayExpenses;

  return {
    todaySales,
    weekSales,
    monthSales,
    paidSales,
    creditSales,
    grossProfit,
    todayExpenses,
    netProfit
  };
}

/* ----------------------------------------------------------
   MAIN RENDER FUNCTION
---------------------------------------------------------- */
function renderAnalytics() {
  const barCanvas = document.getElementById("salesBar");
  const pieCanvas = document.getElementById("salesPie");

  if (!barCanvas || !pieCanvas) {
    console.warn("Analytics canvas not found (salesBar / salesPie)");
    return;
  }

  const data = getAnalyticsData();

  /* --- Destroy Old Charts Before Re-render --- */
  if (salesBarChart) salesBarChart.destroy();
  if (salesPieChart) salesPieChart.destroy();

  /* ----------------------------------------------------
     BAR CHART — Today / Week / Month Sales
  ---------------------------------------------------- */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [{
        label: "Sales ₹",
        data: [data.todaySales, data.weekSales, data.monthSales],
        backgroundColor: ["#ff9800", "#fb8c00", "#f57c00"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: "Sales Summary" },
        legend: { display: false }
      }
    }
  });

  /* ----------------------------------------------------
     PIE CHART — Paid vs Credit Sales
  ---------------------------------------------------- */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Paid Sales", "Credit Sales"],
      datasets: [{
        data: [data.paidSales, data.creditSales],
        backgroundColor: ["#4caf50", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Gross Profit: ₹${data.grossProfit} | Net Profit: ₹${data.netProfit}`
        }
      }
    }
  });

  /* Update summary cards (Overview) */
  if (typeof updateSummaryCards === "function") updateSummaryCards();
}

/* ----------------------------------------------------------
   AUTO REFRESH EVERY 60 SECONDS
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 60000);

/* ----------------------------------------------------------
   LOCAL STORAGE SYNC
---------------------------------------------------------- */
window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

/* ----------------------------------------------------------
   INITIAL
---------------------------------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

/* expose */
window.renderAnalytics = renderAnalytics;
