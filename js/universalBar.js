/* ===========================================================
   universal-bar.js — FINAL OFFSET VERSION v7.0
   ✔ Net Profit offset (permanent)
   ✔ Stock Investment offset (permanent)
   ✔ Service Investment offset (permanent)
   ✔ All 3 collections ZERO instantly + after reload
=========================================================== */
(function () {

  const num = v => (isNaN(v = Number(v))) ? 0 : v;
  const money = v => "₹" + Math.round(num(v));

  /* ===========================================================
     CENTRAL METRIC CALCULATOR  (offset aware)
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

    services.forEach(j => {
      const status = String(j.status || "").toLowerCase();
      if (status === "completed") {
        serviceProfitCollected += num(j.profit);
        serviceInvestCompleted += num(j.invest);
      }
    });

    expenses.forEach(e => {
      totalExpenses += num(e.amount || e.value);
    });

    stock.forEach(p => {
      const soldQty = num(p.sold);
      const cost    = num(p.cost);
      if (soldQty > 0 && cost > 0) {
        stockInvestSold += soldQty * cost;
      }
    });

    /* ⭐ OFFSETS (loaded later from core.js) */
    const netOffset     = num(window.collectedNetTotal     || 0);
    const stockOffset   = num(window.collectedStockTotal   || 0);
    const serviceOffset = num(window.collectedServiceTotal || 0);

    return {
      saleProfitCollected,
      serviceProfitCollected,
      pendingCreditTotal,
      totalExpenses,

      /* ⭐ Proper ZERO logic */
      stockInvestSold: stockInvestSold - stockOffset,
      serviceInvestCompleted: serviceInvestCompleted - serviceOffset,

      netProfit:
        (saleProfitCollected + serviceProfitCollected - totalExpenses)
        - netOffset
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
     COLLECT HANDLER — ALL OFFSETS
  ============================================================ */
  function handleCollect(kind) {
    updateUniversalBar();
    const m = window.__unMetrics;

    const labels = {
      net: [
        "Net Profit (Sale + Service − Expenses)",
        m.netProfit
      ],
      stock: [
        "Stock Investment (Sold Items)",
        m.stockInvestSold
      ],
      service: [
        "Service Investment (Completed)",
        m.serviceInvestCompleted
      ]
    };

    if (!labels[kind]) return;
    const [label, approx] = labels[kind];

    const val = prompt(
      `${label}\nApprox: ₹${Math.round(approx)}\n\nEnter amount:`
    );
    if (!val) return;

    const amt = num(val);
    if (amt <= 0) return alert("Invalid amount.");

    const note = prompt("Optional note:", "") || "";

    /* ================================
       ⭐ 1) NET PROFIT OFFSET
    ==================================*/
    if (kind === "net") {
      window.addCollectionEntry("Net Profit", note, amt);

      window.collectedNetTotal =
        num(window.collectedNetTotal || 0) + amt;

      window.saveCollectedNetTotal?.();

      updateUniversalBar();
      window.renderCollection?.();
      window.renderAnalytics?.();
      window.updateSummaryCards?.();
      window.updateTabSummaryBar?.();
      alert("Net Profit collected!");
      return;
    }

    /* ================================
       ⭐ 2) STOCK INVESTMENT OFFSET
    ==================================*/
    if (kind === "stock") {
      window.addCollectionEntry("Stock Investment", note, amt);

      window.collectedStockTotal =
        num(window.collectedStockTotal || 0) + amt;

      window.saveCollectedStockTotal?.();

      updateUniversalBar();
      window.renderCollection?.();
      window.renderAnalytics?.();
      window.updateSummaryCards?.();
      window.updateTabSummaryBar?.();
      alert("Stock Investment collected!");
      return;
    }

    /* ================================
       ⭐ 3) SERVICE INVESTMENT OFFSET
    ==================================*/
    if (kind === "service") {
      window.addCollectionEntry("Service Investment", note, amt);

      window.collectedServiceTotal =
        num(window.collectedServiceTotal || 0) + amt;

      window.saveCollectedServiceTotal?.();

      updateUniversalBar();
      window.renderCollection?.();
      window.renderAnalytics?.();
      window.updateSummaryCards?.();
      window.updateTabSummaryBar?.();
      alert("Service Investment collected!");
      return;
    }
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
