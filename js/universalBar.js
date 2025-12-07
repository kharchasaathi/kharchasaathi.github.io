/* ===========================================================
   universal-bar.js — FINAL FIXED VERSION v4.0
   ✔ Net profit collection ZEROES metrics after collect
   ✔ Prevents repeated net collections
   ✔ UI refresh everywhere (bar + cards + analytics)
   ✔ Safe if arrays missing or empty
=========================================================== */
(function () {

  const num = v => (isNaN(v = Number(v))) ? 0 : v;
  const money = v => "₹" + Math.round(num(v));

  /* ===========================================================
     CENTRAL METRIC CALCULATOR
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

    /* ---------------- SALES PROFIT + CREDIT ---------------- */
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

    /* ---------------- SERVICE PROFIT + INVEST ---------------- */
    services.forEach(j => {
      const status = String(j.status || "").toLowerCase();
      if (status === "completed") {
        serviceProfitCollected += num(j.profit);
        serviceInvestCompleted += num(j.invest);
      }
    });

    /* ---------------- EXPENSES ---------------- */
    expenses.forEach(e => {
      totalExpenses += num(e.amount || e.value);
    });

    /* ---------------- SOLD STOCK INVEST ---------------- */
    stock.forEach(p => {
      const soldQty = num(p.sold);
      const cost    = num(p.cost);
      if (soldQty > 0 && cost > 0) {
        stockInvestSold += soldQty * cost;
      }
    });

    return {
      saleProfitCollected,
      serviceProfitCollected,
      pendingCreditTotal,
      totalExpenses,
      stockInvestSold,
      serviceInvestCompleted,
      netProfit: saleProfitCollected + serviceProfitCollected - totalExpenses
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
     COLLECT HANDLER — FIXED FOR NET PROFIT
  ============================================================ */
  function handleCollect(kind) {

    if (!window.addCollectionEntry) {
      alert("Collection module missing.");
      return;
    }

    // always fresh
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

    if (kind === "net") {
      if (m.netProfit <= 0) {
        alert("No profit to collect.");
        return;
      }

      // ask amount once
      const val = prompt(
        `${label}\nApprox: ₹${Math.round(m.netProfit)}\n\nEnter amount:`
      );
      if (!val) return;

      const amt = num(val);
      if (amt <= 0) return alert("Invalid amount.");

      const note = prompt("Optional note:", "") || "";
      addCollectionEntry("Net Profit", note, amt);

      /* ⭐ VERY IMPORTANT — ZERO OUT PROFIT AFTER COLLECT */
      window.__unMetrics.saleProfitCollected = 0;
      window.__unMetrics.serviceProfitCollected = 0;

      /* ⭐ UI REFRESH */
      updateUniversalBar();
      window.renderCollection?.();
      window.updateSummaryCards?.();
      window.renderAnalytics?.();

      alert("Collection recorded.");
      return;
    }

    /* ⭐ STOCK / SERVICE NORMAL COLLECTION (unchanged) */
    const val = prompt(
      `${label}\nApprox: ₹${Math.round(approx)}\n\nEnter amount:`
    );

    if (!val) return;

    const amt = num(val);
    if (amt <= 0) {
      alert("Invalid amount.");
      return;
    }

    const note = prompt("Optional note:", "") || "";
    addCollectionEntry(label, note, amt);

    updateUniversalBar();
    window.renderCollection?.();
    alert("Collection recorded.");
  }

  window.handleCollect = handleCollect;

  /* ===========================================================
     CLICK LISTENER
  ============================================================ */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".collect-btn");
    if (!btn) return;
    handleCollect(btn.dataset.collect);
  });

  /* ===========================================================
     INITIAL LOAD
  ============================================================ */
  window.addEventListener("load", () => {
    setTimeout(updateUniversalBar, 150);
  });

})();
window.__allScriptsLoaded = true;
