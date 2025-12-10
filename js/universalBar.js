/* ===========================================================
   universal-bar.js — FINAL OFFSET VERSION v10.0
   ⭐ When NET collected → Sale & Service UI reset to ZERO
   ⭐ Stock & Service investment offsets unchanged
   ⭐ Internal accounting data SAFE
   ⭐ All alerts/messages are now in ENGLISH
=========================================================== */
(function () {

  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  /* ===========================================================
     CENTRAL METRIC CALCULATOR (offset-aware)
  ============================================================ */
  function computeMetrics() {

    const sales    = Array.isArray(window.sales)    ? window.sales    : [];
    const services = Array.isArray(window.services) ? window.services : [];
    const expenses = Array.isArray(window.expenses) ? window.expenses : [];
    const stock    = Array.isArray(window.stock)    ? window.stock    : [];

    let saleProfitCollected     = 0;
    let serviceProfitCollected  = 0;
    let pendingCreditTotal      = 0;
    let totalExpenses           = 0;
    let stockInvestSold         = 0;
    let serviceInvestCompleted  = 0;

    // -------- SALES PROFIT + CREDIT ----------
    sales.forEach(s => {
      const status = String(s.status || "").toLowerCase();
      const qty    = num(s.qty);
      const price  = num(s.price);
      const total  = num(s.total || qty * price);
      const profit = num(s.profit);

      if (status === "credit") {
        pendingCreditTotal += total;
      } else {
        saleProfitCollected += profit;
      }
    });

    // -------- SERVICE PROFIT + INVEST ----------
    services.forEach(j => {
      const status = String(j.status || "").toLowerCase();
      if (status === "completed") {
        serviceProfitCollected += num(j.profit);
        serviceInvestCompleted += num(j.invest);
      }
    });

    // -------- EXPENSES ----------
    expenses.forEach(e => {
      totalExpenses += num(e.amount || e.value);
    });

    // -------- SOLD STOCK INVEST ----------
    stock.forEach(p => {
      const soldQty = num(p.sold);
      const cost    = num(p.cost);
      if (soldQty > 0 && cost > 0) {
        stockInvestSold += soldQty * cost;
      }
    });

    /* ⭐ OFFSETS (loaded from core.js) */
    const netOffset     = num(window.collectedNetTotal     || 0);
    const stockOffset   = num(window.collectedStockTotal   || 0);
    const serviceOffset = num(window.collectedServiceTotal || 0);

    /* =======================================================
       ⭐ NEW FIX — If NET collected, Sale + Service UI = ZERO
       ✔ Data untouched (only display changed)
    ======================================================== */

    let saleProfitDisplay     = saleProfitCollected;
    let serviceProfitDisplay  = serviceProfitCollected;

    if (netOffset > 0) {
      saleProfitDisplay = 0;
      serviceProfitDisplay = 0;
    }

    /* =======================================================
       NET PROFIT
    ======================================================== */
    const netProfit =
      (saleProfitCollected + serviceProfitCollected - totalExpenses)
      - netOffset;

    return {
      saleProfitCollected:     saleProfitDisplay,
      serviceProfitCollected:  serviceProfitDisplay,
      pendingCreditTotal,
      totalExpenses,

      stockInvestSold: Math.max(0, stockInvestSold - stockOffset),
      serviceInvestCompleted: Math.max(0, serviceInvestCompleted - serviceOffset),

      netProfit: Math.max(0, netProfit)
    };
  }

  /* ===========================================================
     UPDATE UI
  ============================================================ */
  function updateUniversalBar() {
    const m = computeMetrics();

    const el = {
      net:      document.getElementById("unNetProfit"),
      sale:     document.getElementById("unSaleProfit"),
      serv:     document.getElementById("unServiceProfit"),
      exp:      document.getElementById("unExpenses"),
      stock:    document.getElementById("unStockInv"),
      servInv:  document.getElementById("unServiceInv"),
      credit:   document.getElementById("unCreditSales")
    };

    if (el.net)     el.net.textContent     = money(m.netProfit);
    if (el.sale)    el.sale.textContent    = money(m.saleProfitCollected);
    if (el.serv)    el.serv.textContent    = money(m.serviceProfitCollected);
    if (el.exp)     el.exp.textContent     = money(m.totalExpenses);
    if (el.stock)   el.stock.textContent   = money(m.stockInvestSold);
    if (el.servInv) el.servInv.textContent = money(m.serviceInvestCompleted);
    if (el.credit)  el.credit.textContent  = money(m.pendingCreditTotal);

    window.__unMetrics = m;
  }

  window.updateUniversalBar = updateUniversalBar;

  /* ===========================================================
     COLLECT HANDLER
  ============================================================ */
  function handleCollect(kind) {

    if (typeof window.addCollectionEntry !== "function") {
      alert("Collection module missing.");
      return;
    }

    updateUniversalBar();
    const m = window.__unMetrics || {};

    const labels = {
      net:      ["Net Profit (Sale + Service − Expenses)", m.netProfit],
      stock:    ["Stock Investment (Sold Items)", m.stockInvestSold],
      service:  ["Service Investment (Completed)", m.serviceInvestCompleted]
    };

    if (!labels[kind]) return;
    const [label, approx] = labels[kind];

    /* ===== ENGLISH VALIDATION ===== */

    if (kind === "net" && num(m.netProfit) <= 0)
      return alert("No net profit available to collect.");

    if (kind === "stock" && num(m.stockInvestSold) <= 0)
      return alert("No stock investment available to collect.");

    if (kind === "service" && num(m.serviceInvestCompleted) <= 0)
      return alert("No service investment available to collect.");

    const val = prompt(
      `${label}\nApprox: ₹${Math.round(approx)}\n\nEnter collection amount:`
    );
    if (!val) return;

    const amt = num(val);
    if (amt <= 0) return alert("Invalid amount.");

    const note = prompt("Optional note:", "") || "";

    /* ================================ */
    if (kind === "net") {
      window.addCollectionEntry("Net Profit", note, amt);
      window.collectedNetTotal =
        num(window.collectedNetTotal || 0) + amt;
      window.saveCollectedNetTotal?.();
    }

    if (kind === "stock") {
      window.addCollectionEntry("Stock Investment (Sold Items)", note, amt);
      window.collectedStockTotal =
        num(window.collectedStockTotal || 0) + amt;
      window.saveCollectedStockTotal?.();
    }

    if (kind === "service") {
      window.addCollectionEntry("Service Investment (Completed)", note, amt);
      window.collectedServiceTotal =
        num(window.collectedServiceTotal || 0) + amt;
      window.saveCollectedServiceTotal?.();
    }

    updateUniversalBar();
    window.renderCollection?.();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
    window.updateTabSummaryBar?.();

    alert(kind === "net"
      ? "Net profit collected!"
      : kind === "stock"
        ? "Stock investment collected!"
        : "Service investment collected!"
    );
  }

  window.handleCollect = handleCollect;

  /* ===========================================================
     CLICK HANDLER
  ============================================================ */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".collect-btn");
    if (!btn) return;
    handleCollect(btn.dataset.collect);
  });

  window.addEventListener("load", () => {
    setTimeout(updateUniversalBar, 250);
  });

})();
window.__allScriptsLoaded = true;
