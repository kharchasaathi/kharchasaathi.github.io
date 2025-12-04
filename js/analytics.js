/* ============================================================
   analytics.js — FINAL V6 (CLEAN & VERIFIED)
   ------------------------------------------------------------
   Safe, bug-free analytics engine for Dashboard
   Compatible with Firebase Online Mode
=========================================================== */

(function (global) {
  "use strict";

  /* ----------------------- Utils ----------------------- */
  const qs = s => document.querySelector(s);
  const escNum = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  let cleanPieChart = null;

  /* ---------------- TODAY ANALYTICS -------------------- */
  function getAnalyticsData() {
    const today =
      typeof todayDate === "function"
        ? todayDate()
        : new Date().toISOString().slice(0, 10);

    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];

    let todaySales = 0;
    let creditSales = 0;
    let todayExpenses = 0;
    let grossProfit = 0;

    // Sales
    sales.forEach(s => {
      if (!s || String(s.date || "") !== today) return;

      const total = escNum(
        s.total ??
          s.amount ??
          Number(s.qty || 0) * Number(s.price || 0)
      );

      const status = String(s.status || "").toLowerCase();

      if (status === "credit") creditSales += total;
      else {
        todaySales += total;
        grossProfit += escNum(s.profit || 0);
      }
    });

    // Services
    services.forEach(sv => {
      if (!sv) return;
      if (String(sv.date_out || "") === today)
        grossProfit += escNum(sv.profit || 0);
    });

    // Expenses
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

  /* ---------------- GLOBAL TOTALS -------------------- */
  function getSummaryTotals() {
    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];

    let salesProfit = 0;
    let serviceProfit = 0;
    let creditTotal = 0;

    sales.forEach(s => {
      if (!s) return;

      const total = escNum(
        s.total ??
          s.amount ??
          Number(s.qty || 0) * Number(s.price || 0)
      );

      const status = String(s.status || "").toLowerCase();

      if (status === "credit") creditTotal += total;
      else salesProfit += escNum(s.profit || 0);
    });

    services.forEach(j => {
      if (!j) return;
      serviceProfit += escNum(j.profit || 0);
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
    } catch (err) {
      console.warn("getStockInvestmentAfterSale() failed:", err);
    }

    try {
      if (typeof global.getServiceInvestmentCollected === "function")
        serviceInv = escNum(global.getServiceInvestmentCollected());
    } catch (err) {
      console.warn("getServiceInvestmentCollected() failed:", err);
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
  }

  /* ---------------- RENDER ANALYTICS -------------------- */
  function renderAnalytics() {
    const {
      totalProfit,
      totalExpenses,
      creditTotal,
      stockAfter,
      serviceInv
    } = getSummaryTotals();

    // Summary cards
    qs("#dashProfit") &&
      (qs("#dashProfit").textContent = "₹" + Math.round(totalProfit || 0));
    qs("#dashExpenses") &&
      (qs("#dashExpenses").textContent =
        "₹" + Math.round(totalExpenses || 0));
    qs("#dashCredit") &&
      (qs("#dashCredit").textContent = "₹" + Math.round(creditTotal || 0));
    qs("#dashInv") &&
      (qs("#dashInv").textContent =
        "₹" + Math.round(Number(stockAfter || 0) + Number(serviceInv || 0)));

    // universal bar update
    try {
      global.updateUniversalBar?.();
    } catch (err) {
      console.warn("updateUniversalBar() error:", err);
    }

    // PIE chart
    const canvas = qs("#cleanPie");
    if (!canvas || typeof Chart === "undefined") return;

    if (cleanPieChart?.destroy) cleanPieChart.destroy();

    const values = [
      Number(totalProfit || 0),
      Number(totalExpenses || 0),
      Number(creditTotal || 0),
      Number(stockAfter || 0) + Number(serviceInv || 0)
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
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    } catch (err) {
      console.error("Pie chart render failed:", err);
    }
  }

  /* ---------------- TODAY CARDS -------------------- */
  function updateSummaryCards() {
    const d = getAnalyticsData();

    qs("#todaySales") &&
      (qs("#todaySales").textContent = "₹" + Math.round(d.todaySales || 0));
    qs("#todayCredit") &&
      (qs("#todayCredit").textContent = "₹" + Math.round(d.creditSales || 0));
    qs("#todayExpenses") &&
      (qs("#todayExpenses").textContent =
        "₹" + Math.round(d.todayExpenses || 0));
    qs("#todayGross") &&
      (qs("#todayGross").textContent =
        "₹" + Math.round(d.grossProfit || 0));
    qs("#todayNet") &&
      (qs("#todayNet").textContent = "₹" + Math.round(d.netProfit || 0));
  }

  /* ---------------- EXPORTS -------------------- */
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
