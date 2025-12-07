// ======================================================
//  analytics.js — BUSINESS v21 (Accurate Credit Control)
// ======================================================

let cleanPieChart = null;

/* ======================================================
      GET TODAY ANALYTICS
====================================================== */
window.getAnalyticsData = function () {

  const today = (typeof todayDate === "function")
    ? todayDate()
    : new Date().toISOString().slice(0, 10);

  const sales    = window.sales    || [];
  const expenses = window.expenses || [];
  const services = window.services || [];

  let todaySales    = 0;   // TODAY paid sales
  let creditSales   = 0;   // TODAY credit (pending)
  let todayExpenses = 0;
  let grossProfit   = 0;   // TODAY profit PAID only

  /* TODAY SALES */
  sales.forEach(s => {
    if (s.date !== today) return;

    const total = Number(s.total || 0);
    const status = String(s.status || "").toLowerCase();

    if (status === "credit") {
      creditSales += total;   // pending
    } else {
      todaySales += total;
      grossProfit += Number(s.profit || 0);
    }
  });

  /* TODAY SERVICE PROFIT */
  services.forEach(j => {
    if (j.date_out === today && j.status === "Completed") {
      grossProfit += Number(j.profit || 0);
    }
  });

  /* TODAY EXPENSES */
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

/* ======================================================
      GLOBAL TOTAL SUMMARY
====================================================== */
window.getSummaryTotals = function () {
  const sales    = window.sales    || [];
  const expenses = window.expenses || [];
  const services = window.services || [];

  let salesProfit      = 0;   // real profit
  let serviceProfit    = 0;   // real profit
  let creditTotal      = 0;   // pending credit (sale + service)
  let stockAfterCost   = 0;   // sold stock investment
  let serviceAfterCost = 0;   // completed service invest

  /* =====================
        SALES LOOP
     ===================== */
  sales.forEach(s => {
    const status = String(s.status || "").toLowerCase();
    const cost   = Number(s.qty || 0) * Number(s.cost || 0);
    const total  = Number(s.total || 0);

    if (status === "credit") {
      creditTotal += total;          // still pending
    } else {
      salesProfit += Number(s.profit || 0);
      stockAfterCost += cost;        // investment after sale
    }
  });

  /* =====================
        SERVICES LOOP
     ===================== */
  services.forEach(j => {
    const st = j.status;

    if (st === "Completed") {
      serviceProfit    += Number(j.profit || 0);     // real profit
      serviceAfterCost += Number(j.invest || 0);     // service investment
    }

    if (st === "Credit") {
      /* pending amount is stored inside job.remaining */
      creditTotal += Number(j.remaining || 0);
    }
  });

  /* TOTAL PROFIT */
  const totalProfit = salesProfit + serviceProfit;

  /* EXPENSES */
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0), 0
  );

  /* NET PROFIT */
  const netProfit = totalProfit - totalExpenses;

  /* TOTAL INVESTMENT (SOLD ITEMS + COMPLETED SERVICE) */
  const totalInvestment = stockAfterCost + serviceAfterCost;

  return {
    salesProfit,
    serviceProfit,
    totalProfit,
    totalExpenses,
    netProfit,
    creditTotal,
    stockAfterCost,
    serviceAfterCost,
    totalInvestment
  };
};

/* ======================================================
      MAIN DASHBOARD RENDER
====================================================== */
window.renderAnalytics = function () {

  const {
    salesProfit,
    serviceProfit,
    totalProfit,
    totalExpenses,
    creditTotal,
    totalInvestment
  } = window.getSummaryTotals();

  /* SMART DASHBOARD NUMBERS */
  if (qs("#dashProfit"))
    qs("#dashProfit").textContent = "₹" + Math.round(totalProfit);

  if (qs("#dashExpenses"))
    qs("#dashExpenses").textContent = "₹" + Math.round(totalExpenses);

  if (qs("#dashCredit"))
    qs("#dashCredit").textContent = "₹" + Math.round(creditTotal);

  if (qs("#dashInv"))
    qs("#dashInv").textContent = "₹" + Math.round(totalInvestment);

  /* UNIVERSAL BAR AUTO UPDATE */
  try { window.updateUniversalBar?.(); } catch {}

  /* =====================
        PIE CHART
     ===================== */
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
          Number(totalInvestment || 0)
        ],
        backgroundColor: ["#2e7d32","#c62828","#1565c0","#fbc02d"]
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
  const data = window.getAnalyticsData();

  if (qs("#todaySales"))
    qs("#todaySales").textContent = "₹" + Math.round(data.todaySales);

  if (qs("#todayCredit"))
    qs("#todayCredit").textContent = "₹" + Math.round(data.creditSales);

  if (qs("#todayExpenses"))
    qs("#todayExpenses").textContent = "₹" + Math.round(data.todayExpenses);

  if (qs("#todayGross"))
    qs("#todayGross").textContent = "₹" + Math.round(data.grossProfit);

  if (qs("#todayNet"))
    qs("#todayNet").textContent = "₹" + Math.round(data.netProfit);
};

/* ======================================================
         INIT
====================================================== */
window.addEventListener("load", () => {
  try { renderAnalytics(); }      catch {}
  try { updateSummaryCards(); }   catch {}
});
window.addEventListener("load", () => {
  setTimeout(() => {
    renderAnalytics?.();
    renderCollection?.();
    renderExpenses?.();
    updateSummaryCards?.();
    updateUniversalBar?.();
  }, 300);
});
