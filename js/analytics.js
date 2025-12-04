/* ============================================================
   analytics.js — FINAL V7 (Service Profit Synced)
   ------------------------------------------------------------
   ✔ Service profit = paid - invest (same as universalBar.js)
   ✔ No dependency on service.profit field
   ✔ 100% synced, zero mismatch
=========================================================== */

(function (global) {
  "use strict";

  const qs = s => document.querySelector(s);
  const escNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;

  let cleanPieChart = null;

  /* ---------------- TODAY ANALYTICS -------------------- */
  function getAnalyticsData() {
    const today = typeof todayDate === "function"
      ? todayDate()
      : new Date().toISOString().slice(0, 10);

    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];

    let todaySales = 0;
    let creditSales = 0;
    let todayExpenses = 0;
    let grossProfit = 0;

    /* SALES */
    sales.forEach(s => {
      if (!s || String(s.date || "") !== today) return;

      const total = escNum(s.total ?? s.amount ?? (s.qty * s.price));
      const isCredit = String(s.status || "").toLowerCase() === "credit";

      if (isCredit) creditSales += total;
      else {
        todaySales += total;
        grossProfit += escNum(s.profit || 0);
      }
    });

    /* SERVICES — profit = paid - invest */
    services.forEach(sv => {
      if (!sv) return;
      if (String(sv.date_out || "") === today) {
        const p = escNum(sv.paid) - escNum(sv.invest);
        grossProfit += p;
      }
    });

    /* EXPENSES */
    expenses.forEach(e => {
      if (!e) return;
      if (String(e.date || "") === today)
        todayExpenses += escNum(e.amount || 0);
    });

    return {
      todaySales,
      creditSales,
      todayExpenses,
      grossProfit,
      netProfit: grossProfit - todayExpenses
    };
  }

  /* ---------------- GLOBAL TOTALS ----------------------- */
  function getSummaryTotals() {
    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];

    let salesProfit = 0;
    let serviceProfit = 0;
    let creditTotal = 0;

    /* SALES PROFIT */
    sales.forEach(s => {
      if (!s) return;

      const total = escNum(s.total ?? s.amount ?? (s.qty * s.price));
      const isCredit = String(s.status || "").toLowerCase() === "credit";

      if (isCredit) creditTotal += total;
      else salesProfit += escNum(s.profit || 0);
    });

    /* SERVICE PROFIT (FIXED) */
    services.forEach(j => {
      if (!j) return;

      const st = String(j.status || "").toLowerCase();
      if (st === "completed" || st === "collected") {
        serviceProfit += escNum(j.paid) - escNum(j.invest);
      }
    });

    const totalProfit = salesProfit + serviceProfit;

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + escNum(e?.amount || 0),
      0
    );

    const netProfit = totalProfit - totalExpenses;

    let stockAfter = 0;
    let serviceInv = 0;

    try {
      if (typeof global.getStockInvestmentAfterSale === "function")
        stockAfter = escNum(global.getStockInvestmentAfterSale());
    } catch {}

    try {
      if (typeof global.getServiceInvestmentCollected === "function")
        serviceInv = escNum(global.getServiceInvestmentCollected());
    } catch {}

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
  }

  /* ---------------- RENDER ANALYTICS -------------------- */
  function renderAnalytics() {
    const { totalProfit, totalExpenses, creditTotal, stockAfter, serviceInv } =
      getSummaryTotals();

    qs("#dashProfit") &&
      (qs("#dashProfit").textContent = "₹" + Math.round(totalProfit));
    qs("#dashExpenses") &&
      (qs("#dashExpenses").textContent = "₹" + Math.round(totalExpenses));
    qs("#dashCredit") &&
      (qs("#dashCredit").textContent = "₹" + Math.round(creditTotal));
    qs("#dashInv") &&
      (qs("#dashInv").textContent =
        "₹" + Math.round(stockAfter + serviceInv));

    try {
      global.updateUniversalBar?.();
    } catch {}

    const canvas = qs("#cleanPie");
    if (!canvas || typeof Chart === "undefined") return;

    if (cleanPieChart?.destroy) cleanPieChart.destroy();

    const values = [
      totalProfit,
      totalExpenses,
      creditTotal,
      stockAfter + serviceInv
    ];

    try {
      cleanPieChart = new Chart(canvas, {
        type: "pie",
        data: {
          labels: ["Profit", "Expenses", "Credit", "Investment"],
          datasets: [
            {
              data: values,
              backgroundColor: [
                "#2e7d32",
                "#c62828",
                "#1565c0",
                "#fbc02d"
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } }
        }
      });
    } catch (err) {
      console.error("Pie chart error:", err);
    }
  }

  /* ---------------- TODAY CARDS -------------------- */
  function updateSummaryCards() {
    const d = getAnalyticsData();

    qs("#todaySales") &&
      (qs("#todaySales").textContent = "₹" + Math.round(d.todaySales));
    qs("#todayCredit") &&
      (qs("#todayCredit").textContent = "₹" + Math.round(d.creditSales));
    qs("#todayExpenses") &&
      (qs("#todayExpenses").textContent = "₹" + Math.round(d.todayExpenses));
    qs("#todayGross") &&
      (qs("#todayGross").textContent = "₹" + Math.round(d.grossProfit));
    qs("#todayNet") &&
      (qs("#todayNet").textContent = "₹" + Math.round(d.netProfit));
  }

  /* ---------------- EXPORT -------------------- */
  global.getAnalyticsData = getAnalyticsData;
  global.getSummaryTotals = getSummaryTotals;
  global.renderAnalytics = renderAnalytics;
  global.updateSummaryCards = updateSummaryCards;

  /* ---------------- INIT -------------------- */
  window.addEventListener("load", () => {
    try {
      renderAnalytics();
      updateSummaryCards();
    } catch (err) {
      console.warn("Analytics init failed:", err);
    }
  });

})(window);
