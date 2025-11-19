/* ===========================================================
   📊 analytics.js — Smart Dashboard (OPTION - A FINAL v8.0)
   ✔ Sales + Service Profit + Expenses Included
   ✔ Excludes Credit-sales profit until paid
   ✔ Bar: Today / Week / Month Sales
   ✔ Pie: Total Profit vs Total Expenses
   ✔ Exposes fields used by updateSummaryCards()
   ✔ Robust Number parsing to avoid NaN/undefined
=========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* -------------------- HELPERS -------------------- */

function toNum(d) {
  return d ? Number(String(d).replace(/-/g, "")) : 0;
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
    .filter(e => (e.date || "") === date)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
}

/* ----------------------------------------------------------
   COLLECT ANALYTICS (SALES + SERVICE + EXPENSES)
   - Credit sales: profit NOT included until paid (status !== "Credit")
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const services = window.services || [];
  const expenses = window.expenses || [];

  const today = todayDate();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const weekN = toNum(weekStart);
  const monthN = toNum(monthStart);

  let todaySales = 0,
      weekSales = 0,
      monthSales = 0,
      totalProfitSales = 0,
      totalProfitService = 0,
      totalExpenses = 0,
      paidSales = 0,
      creditSales = 0;

  /* ----- SALES: amounts + profit (exclude credit profit) ----- */
  sales.forEach(s => {
    const d = s.date || "";
    if (!d) return;

    const amt = Number(s.amount) || 0;
    const prof = Number(s.profit) || 0;
    const status = (s.status || "").toString();

    const dNum = toNum(d);

    if (d === today) todaySales += amt;
    if (dNum >= weekN) weekSales += amt;
    if (dNum >= monthN) monthSales += amt;

    // Count paid vs credit sales for analytics and pie (if needed)
    if (status === "Credit") creditSales += amt;
    else paidSales += amt;

    // Only include profit for non-credit (i.e. paid) sales
    if (status !== "Credit") totalProfitSales += prof;
  });

  /* ----- SERVICE PROFITS ----- */
  services.forEach(s => {
    totalProfitService += Number(s.profit) || 0;
  });

  /* ----- EXPENSES (total and today's) ----- */
  expenses.forEach(e => {
    totalExpenses += Number(e.amount) || 0;
  });

  const totalProfit = (totalProfitSales || 0) + (totalProfitService || 0);
  const todayExpenses = getExpensesByDate(today);
  const netProfit = totalProfit - (todayExpenses || 0);

  // Return shape compatible with existing UI functions
  return {
    todaySales: Math.round(todaySales),
    weekSales: Math.round(weekSales),
    monthSales: Math.round(monthSales),

    // keep legacy names expected elsewhere
    paidSales: Math.round(paidSales),
    creditSales: Math.round(creditSales),

    // profit/expense numbers
    totalProfit: Math.round(totalProfit),      // whole profit (sales+service)
    totalExpenses: Math.round(totalExpenses),  // all expenses (all-time)
    grossProfit: Math.round(totalProfit),      // alias for old code
    todayExpenses: Math.round(todayExpenses),  // used in summary cards
    netProfit: Math.round(netProfit)
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

  if (salesBarChart) try { salesBarChart.destroy(); } catch(e){}
  if (salesPieChart) try { salesPieChart.destroy(); } catch(e){}

  /* ---------- BAR CHART (SALES) ---------- */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
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
      labels: ["Total Profit", "Total Expenses"],
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
          text: `Net Profit (today-impact): ₹${d.netProfit}`
        }
      }
    }
  });

  // update other UI cards that depend on analytics
  try { updateSummaryCards?.(); } catch(e){}
  try { updateTabSummaryBar?.(); } catch(e){}
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
