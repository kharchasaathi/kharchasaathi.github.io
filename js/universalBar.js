/* ===========================================================
   universal-bar.js — Top Metrics + Collect Buttons (v2.0)
   CLEAN + BUG-FREE + FULLY STABLE
=========================================================== */
(function () {

  /* -------------------------------
     Utility
  --------------------------------*/
  function num(v) {
    const n = Number(v || 0);
    return isNaN(n) ? 0 : n;
  }

  function formatMoney(v) {
    return "₹" + Math.round(num(v));
  }

  /* -------------------------------
     Compute all metrics
  --------------------------------*/
  function computeMetrics() {
    const sales    = window.sales    || [];
    const services = window.services || [];
    const expenses = window.expenses || [];
    const stock    = window.stock    || [];

    let saleProfitCollected     = 0;
    let serviceProfitCollected  = 0;
    let pendingCreditTotal      = 0;
    let totalExpenses           = 0;
    let stockInvestSold         = 0;
    let serviceInvestCompleted  = 0;

    // --- SALES ---
    sales.forEach(s => {
      const st = String(s.status || "").toLowerCase();
      const profit = num(s.profit);
      const total  = num(s.total || (num(s.qty) * num(s.price)));

      if (st === "credit") {
        pendingCreditTotal += total;
      } else {
        saleProfitCollected += profit;
      }
    });

    // --- SERVICE ---
    services.forEach(j => {
      const st = String(j.status || "").toLowerCase();
      if (st === "completed") {
        serviceProfitCollected += num(j.profit);
        serviceInvestCompleted += num(j.invest);
      }
    });

    // --- EXPENSES ---
    expenses.forEach(e => {
      totalExpenses += num(e.amount || e.value);
    });

    // --- STOCK INVEST (Sold items only) ---
    stock.forEach(p => {
      const soldQty = num(p.sold);
      const cost    = num(p.cost);
      if (soldQty > 0 && cost > 0) {
        stockInvestSold += soldQty * cost;
      }
    });

    const netProfit = saleProfitCollected + serviceProfitCollected - totalExpenses;

    return {
      saleProfitCollected,
      serviceProfitCollected,
      pendingCreditTotal,
      totalExpenses,
      stockInvestSold,
      serviceInvestCompleted,
      netProfit
    };
  }

  /* -------------------------------
     Update the metric bar UI
  --------------------------------*/
  function updateUniversalBar() {
    const m = computeMetrics();

    const el = {
      net:        document.getElementById("unNetProfit"),
      sale:       document.getElementById("unSaleProfit"),
      serv:       document.getElementById("unServiceProfit"),
      exp:        document.getElementById("unExpenses"),
      stock:      document.getElementById("unStockInv"),
      servInv:    document.getElementById("unServiceInv"),
      credit:     document.getElementById("unCreditSales")
    };

    if (el.net)     el.net.textContent     = formatMoney(m.netProfit);
    if (el.sale)    el.sale.textContent    = formatMoney(m.saleProfitCollected);
    if (el.serv)    el.serv.textContent    = formatMoney(m.serviceProfitCollected);
    if (el.exp)     el.exp.textContent     = formatMoney(m.totalExpenses);
    if (el.stock)   el.stock.textContent   = formatMoney(m.stockInvestSold);
    if (el.servInv) el.servInv.textContent = formatMoney(m.serviceInvestCompleted);
    if (el.credit)  el.credit.textContent  = formatMoney(m.pendingCreditTotal);

    window.__unMetrics = m; // save snapshot
  }

  window.updateUniversalBar = updateUniversalBar;



  /* -------------------------------
     Handle Collect Button
  --------------------------------*/
  function handleCollect(kind) {
    if (!window.addCollectionEntry) {
      alert("Collection module missing.");
      return;
    }

    const m = window.__unMetrics || computeMetrics();

    let label = "";
    let approx = 0;

    switch (kind) {
      case "net":
        label = "Net Profit (Sale + Service − Expenses)";
        approx = m.netProfit;
        break;

      case "stock":
        label = "Stock Investment (Sold Items)";
        approx = m.stockInvestSold;
        break;

      case "service":
        label = "Service Investment (Completed)";
        approx = m.serviceInvestCompleted;
        break;

      default:
        return;
    }

    const hint = approx > 0
      ? `Approx available: ₹${Math.round(approx)}`
      : `No positive amount.`;

    const val = prompt(`${label}\n${hint}\n\nEnter amount to record:`);

    if (!val) return;

    const amt = Number(val);
    if (!amt || amt <= 0) {
      alert("Invalid amount.");
      return;
    }

    const note = prompt("Optional note:", "") || "";

    window.addCollectionEntry(label, note, amt);

    // refresh everything
    window.renderCollection?.();
    updateUniversalBar();
    alert("Collection recorded.");
  }

  window.handleCollect = handleCollect;



  /* -------------------------------
     Register one click listener only
  --------------------------------*/
  document.addEventListener("click", e => {
    const btn = e.target.closest(".collect-btn");
    if (!btn) return;
    handleCollect(btn.dataset.collect);
  });



  /* -------------------------------
     Initial render after load
  --------------------------------*/
  window.addEventListener("load", () => {
    setTimeout(updateUniversalBar, 120);
  });

})();
