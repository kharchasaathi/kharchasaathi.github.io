// ===============================
//  analytics.js — FINAL CLEAN V3
//  Matches business-dashboard.html (INV NEW LOGIC)
// ===============================

let cleanPieChart = null;

/* --------------------------------
   TODAY + TOTAL ANALYTICS DATA
---------------------------------- */
window.getAnalyticsData = function () {
  const today = (typeof todayDate === "function")
    ? todayDate()
    : new Date().toISOString().slice(0, 10);

  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const services = window.services || [];

  let todaySales = 0;
  let creditSales = 0;
  let todayExpenses = 0;
  let grossProfit = 0;

  // ---- TODAY SALES (Paid + Credit) ----
  sales.forEach(s => {
    if (!s.date || s.date !== today) return;

    const total = Number(s.total || s.amount ||
                 (Number(s.qty || 0) * Number(s.price || 0)));

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
   SMART DASHBOARD (TOTALS)
---------------------------------- */
window.renderAnalytics = function () {

  const sales = window.sales || [];
  const expenses = window.expenses || [];
  const services = window.services || [];

  // ---- TOTAL PROFIT (SALES + SERVICE) ----
  let salesProfit = 0;
  let serviceProfit = 0;

  sales.forEach(s => {
    if (String(s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  services.forEach(s => serviceProfit += Number(s.profit || 0));

  const totalProfit = salesProfit + serviceProfit;

  // ---- TOTAL EXPENSES ----
  let totalExpenses = 0;
  expenses.forEach(e => totalExpenses += Number(e.amount || 0));

  // ---- CREDIT SALES ----
  let creditTotal = 0;
  sales.forEach(s => {
    if (String(s.status || "").toLowerCase() === "credit") {
      creditTotal += Number(
        s.total || s.amount ||
        (Number(s.qty || 0) * Number(s.price || 0))
      );
    }
  });

  // -------------------------------------------
  //     NEW INVESTMENT LOGIC (V3 LOGIC)
  // -------------------------------------------

  let investment = 0;

  // 🔸 STOCK INVESTMENT (AFTER SALE)
  if (typeof getStockInvestmentAfterSale === "function")
    investment += Number(getStockInvestmentAfterSale());

  // 🔸 SERVICE INVESTMENT (Completed Jobs)
  if (typeof getServiceInvestmentCollected === "function")
    investment += Number(getServiceInvestmentCollected());

  // ---- UPDATE CARDS ----
  qs("#dashProfit").textContent   = "₹" + Math.round(totalProfit);
  qs("#dashExpenses").textContent = "₹" + Math.round(totalExpenses);
  qs("#dashCredit").textContent   = "₹" + Math.round(creditTotal);
  qs("#dashInv").textContent      = "₹" + Math.round(investment);

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
          totalProfit,
          totalExpenses,
          creditTotal,
          investment
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
   AUTO RENDER ON LOAD
---------------------------------- */
window.addEventListener("load", () => {
  try { renderAnalytics(); } catch (e) {}
  try { updateSummaryCards(); } catch (e) {}
});
