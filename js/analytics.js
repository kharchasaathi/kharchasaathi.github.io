/* ===========================================================
   📊 analytics.js — Smart Dashboard (FINAL v8.1)
   • Today/Week/Month sales
   • totalProfit (sales profit EXCLUDING credit-sales) + service profit
   • todayExpenses computed correctly
   • Pie: Total Profit | Expenses | Credit Sales
   • Works with core.js date normalization (internal yyyy-mm-dd)
   =========================================================== */

let salesBarChart = null;
let salesPieChart = null;

/* -------------------- HELPERS -------------------- */

function toNum(d) {
  return d ? Number(String(d).replace(/-/g, "")) : 0;
}

function formatDate(d) {
  if (!d) return "";
  // Expecting internal yyyy-mm-dd; return same (used for numeric compare)
  return d;
}

function getStartOfWeek() {
  const t = new Date();
  const day = t.getDay();
  t.setDate(t.getDate() - day);
  return t.toISOString().split("T")[0];
}

function getStartOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

/* return total expenses for a specific internal-date (yyyy-mm-dd) */
function getExpensesByDate(date) {
  return (window.expenses || [])
    .filter(e => e && e.date === date)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

/* ----------------------------------------------------------
   COLLECT ANALYTICS (SALES + SERVICE + EXPENSES)
   - NOTE: sales with status === 'Credit' ARE NOT counted in profit.
     Their amounts are shown under creditSales and will count only
     after you update that sale's status (e.g. to Paid).
---------------------------------------------------------- */
function getAnalyticsData() {
  const sales = window.sales || [];
  const services = window.services || [];
  const expenses = window.expenses || [];

  const today = (typeof todayDate === "function") ? todayDate() : (new Date().toISOString().split("T")[0]);
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const weekN = toNum(weekStart);
  const monthN = toNum(monthStart);

  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;

  let totalProfitSales = 0;   // sales profit ONLY from non-credit (paid) sales
  let totalProfitService = 0; // repair/service profit
  let totalExpenses = 0;
  let creditSales = 0;        // amount of credit-sales (not yet counted in profit)
  let paidSalesAmount = 0;    // amount of paid sales (optional use)

  /* ----- SALES DATA ----- */
  (sales || []).forEach(s => {
    if (!s || !s.date) return;
    const d = s.date;
    const dNum = toNum(d);
    const amt = Number(s.amount || 0);
    const prof = Number(s.profit || 0);

    // Sales amounts for bar (include credit & paid)
    if (d === today) todaySales += amt;
    if (dNum >= weekN) weekSales += amt;
    if (dNum >= monthN) monthSales += amt;

    // Separate credit sales from paid sales profit
    if (String(s.status || "").toLowerCase() === "credit") {
      creditSales += amt;
      // do NOT add s.profit to totalProfitSales
    } else {
      // treat everything else as paid (or Cash/Online) contributing to profit
      totalProfitSales += prof;
      paidSalesAmount += amt;
    }
  });

  /* ----- SERVICE PROFITS ----- */
  (services || []).forEach(j => {
    totalProfitService += Number(j.profit || 0);
  });

  /* ----- EXPENSES (TOTAL) ----- */
  totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const grossProfit = totalProfitSales + totalProfitService; // exclude credit-sales profit
  const netProfit = grossProfit - totalExpenses;

  // Today-specific expenses (for overview card)
  const todayExpenses = getExpensesByDate(today);

  return {
    // sales amounts for charts/overview
    todaySales,
    weekSales,
    monthSales,

    // profit figures
    totalProfitSales,
    totalProfitService,
    grossProfit,      // total profit from paid sales + service
    totalExpenses,
    todayExpenses,
    netProfit,

    // credit / paid breakdown
    creditSales,
    paidSalesAmount
  };
}

/* ----------------------------------------------------------
   RENDER DASHBOARD
---------------------------------------------------------- */
function renderAnalytics() {
  const barCanvas = qs("#salesBar");
  const pieCanvas = qs("#salesPie");

  // If canvas not present, still update summary cards via getAnalyticsData
  const data = getAnalyticsData();

  // Update top-level summary cards if present
  // (some pages may call updateSummaryCards separately)
  try {
    const sumTodayEl = qs("#sumToday");
    if (sumTodayEl) sumTodayEl.textContent = "₹" + (data.todaySales || 0);
    const sumWeekEl = qs("#sumWeek");
    if (sumWeekEl) sumWeekEl.textContent = "₹" + (data.weekSales || 0);
    const sumMonthEl = qs("#sumMonth");
    if (sumMonthEl) sumMonthEl.textContent = "₹" + (data.monthSales || 0);
    const sumGrossEl = qs("#sumGross");
    if (sumGrossEl) sumGrossEl.textContent = "₹" + (data.grossProfit || 0);
    const sumNetEl = qs("#sumNet");
    if (sumNetEl) sumNetEl.textContent = "₹" + (data.netProfit || 0);
  } catch (e) {
    // ignore
  }

  if (!barCanvas || !pieCanvas) return;

  if (salesBarChart) try { salesBarChart.destroy(); } catch(e){}
  if (salesPieChart) try { salesPieChart.destroy(); } catch(e){}

  /* ---------- BAR CHART (SALES AMOUNTS) ---------- */
  salesBarChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Today", "This Week", "This Month"],
      datasets: [{
        label: "Sales ₹",
        data: [data.todaySales || 0, data.weekSales || 0, data.monthSales || 0],
        backgroundColor: ["#ff9800", "#fb8c00", "#f57c00"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: "Sales Overview" },
        legend: { display: false }
      }
    }
  });

  /* ---------- PIE CHART (Profit | Expenses | Credit Sales) ---------- */
  salesPieChart = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Total Profit", "Expenses", "Credit Sales"],
      datasets: [{
        data: [
          Number(data.grossProfit || 0),
          Number(data.totalExpenses || 0),
          Number(data.creditSales || 0)
        ],
        backgroundColor: ["#4caf50", "#e53935", "#2196f3"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: `Net Profit: ₹${data.netProfit}  (Profit excludes credit sales until paid)`
        }
      }
    }
  });

  // let other modules update (overview, tab bar, etc.)
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

/* ----------------------------------------------------------
   AUTO REFRESH & SYNC
---------------------------------------------------------- */
setInterval(() => {
  try { renderAnalytics(); } catch {}
}, 45000);

window.addEventListener("storage", () => {
  try { renderAnalytics(); } catch {}
});

window.addEventListener("load", () => {
  try { renderAnalytics(); } catch {}
});

/* expose */
window.renderAnalytics = renderAnalytics;
window.getAnalyticsData = getAnalyticsData;
