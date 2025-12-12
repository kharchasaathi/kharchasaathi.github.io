/* ======================================================
   analytics.js — BUSINESS v22 (ONLINE-FIXED: ClearAll + Cloud-safe)
   • Fixes: clearEverything() (global clear), chart safe destroy
   • Uses cloudSaveDebounced/cloudSave when available for offsets/clears
   • Keeps UI update calls safe (no ReferenceError)
   • Compatible with online core.js / firebase.js cloud functions
====================================================== */

(function () {
  // small helpers (safe even if other files didn't define qs)
  const qs = s => document.querySelector(s);
  const safeNum = v => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  // keep chart ref
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
      if (String(s.date || "") !== String(today)) return;

      const total = safeNum(s.total || 0);
      const status = String(s.status || "").toLowerCase();

      if (status === "credit") {
        creditSales += total;   // pending
      } else {
        todaySales += total;
        grossProfit += safeNum(s.profit || 0);
      }
    });

    /* TODAY SERVICE PROFIT */
    services.forEach(j => {
      if ((j.date_out || "") === today && String(j.status || "").toLowerCase() === "completed") {
        grossProfit += safeNum(j.profit || 0);
      }
    });

    /* TODAY EXPENSES */
    expenses.forEach(e => {
      if ((e.date || "") === today) {
        todayExpenses += safeNum(e.amount || 0);
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
    let stockAfterCost   = 0;   // sold stock investment (cost basis)
    let serviceAfterCost = 0;   // completed service invest

    /* =====================
          SALES LOOP
       ===================== */
    sales.forEach(s => {
      const status = String(s.status || "").toLowerCase();
      const cost   = safeNum(s.qty || 0) * safeNum(s.cost || 0);
      const total  = safeNum(s.total || 0);

      if (status === "credit") {
        creditTotal += total;          // still pending
      } else {
        salesProfit += safeNum(s.profit || 0);
        stockAfterCost += cost;        // investment after sale
      }
    });

    /* =====================
          SERVICES LOOP
       ===================== */
    services.forEach(j => {
      const st = String(j.status || "");
      if (st.toLowerCase() === "completed") {
        serviceProfit    += safeNum(j.profit || 0);     // real profit
        serviceAfterCost += safeNum(j.invest || 0);     // service investment
      }

      if (st.toLowerCase() === "credit") {
        /* pending amount is stored inside job.remaining */
        creditTotal += safeNum(j.remaining || 0);
      }
    });

    /* TOTAL PROFIT */
    const totalProfit = salesProfit + serviceProfit;

    /* EXPENSES */
    const totalExpenses = (expenses || []).reduce(
      (sum, e) => sum + safeNum(e.amount || 0), 0
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
        RENDER / CHART
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

    // destroy previous chart safely
    try { if (cleanPieChart && typeof cleanPieChart.destroy === "function") cleanPieChart.destroy(); } catch (e) { /* ignore */ }

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
       GLOBAL CLEAR: clearEverything (ONLINE SAFE)
       - Clears all local arrays
       - Calls save wrappers (which cloudSync / cloudSave)
       - Resets offsets in cloud ("offsets" collection) if possible
  ====================================================== */
  window.clearEverything = async function () {
    if (!confirm("This will DELETE ALL business data (types, stock, sales, services, wanting, expenses, collections) for this user. Proceed?")) return;

    // 1) clear in-memory
    window.types = [];
    window.stock = [];
    window.sales = [];
    window.wanting = [];
    window.expenses = [];
    window.services = [];
    window.collections = [];

    // 2) clear localStorage keys (best-effort)
    try {
      const keys = [
        "item-types",
        "stock-data",
        "sales-data",
        "wanting-data",
        "expenses-data",
        "service-data",
        "ks-collections",
        "ks-net-collected",
        "ks-collected-sale-profit",
        "ks-collected-service-profit",
        "ks-collected-stock",
        "ks-collected-service-inv"
      ];
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Local clear failed:", e);
    }

    // 3) call save wrappers if present (they also cloudSync)
    try {
      if (typeof window.saveTypes === "function") window.saveTypes();
      if (typeof window.saveStock === "function") window.saveStock();
      if (typeof window.saveSales === "function") window.saveSales();
      if (typeof window.saveWanting === "function") window.saveWanting();
      if (typeof window.saveExpenses === "function") window.saveExpenses();
      if (typeof window.saveServices === "function") window.saveServices();
      if (typeof window.saveCollections === "function") window.saveCollections();
    } catch (e) {
      console.warn("Save wrappers error:", e);
    }

    // 4) Try to reset cloud offsets (collection name "offsets") — online only
    try {
      const zeroOffsets = { net: 0, sale: 0, service: 0, stock: 0, servInv: 0 };
      if (typeof cloudSaveDebounced === "function") {
        cloudSaveDebounced("offsets", zeroOffsets);
      } else if (typeof cloudSave === "function") {
        cloudSave("offsets", zeroOffsets);
      } else {
        // if not available, just clear window offsets if present
        if (window.__offsets) {
          window.__offsets.net = 0;
          window.__offsets.sale = 0;
          window.__offsets.service = 0;
          window.__offsets.stock = 0;
          window.__offsets.servInv = 0;
        }
      }
    } catch (e) {
      console.warn("Offset reset failed:", e);
    }

    // 5) Refresh UI & analytics
    try { renderAnalytics?.(); } catch {}
    try { updateSummaryCards?.(); } catch {}
    try { updateUniversalBar?.(); } catch {}
    try { renderCollection?.(); } catch {}
    try { renderExpenses?.(); } catch {}
    try { renderStock?.(); } catch {}
    try { renderSales?.(); } catch {}
    try { renderServiceTables?.(); } catch {}
    try { updateTabSummaryBar?.(); } catch {}

    alert("All business data cleared (local + cloud-requested).");
  };

  /* ======================================================
       INIT
  ====================================================== */
  window.addEventListener("load", () => {
    try { renderAnalytics(); }      catch (e) { console.warn(e); }
    try { updateSummaryCards(); }   catch (e) { console.warn(e); }
  });

  // delayed second pass (after cloudPull)
  window.addEventListener("load", () => {
    setTimeout(() => {
      try { renderAnalytics?.(); }    catch (e) { console.warn(e); }
      try { renderCollection?.(); }   catch (e) { console.warn(e); }
      try { renderExpenses?.(); }     catch (e) { console.warn(e); }
      try { updateSummaryCards?.(); } catch (e) { console.warn(e); }
      try { updateUniversalBar?.(); } catch (e) { console.warn(e); }
    }, 300);
  });

})(); 
