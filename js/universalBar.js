/* ===========================================================
   universalBar.js — Top Summary Bar + Net Profit Collect
   • Computes:
       - Sale Profit (collected only)
       - Service Profit (completed jobs)
       - Total Expenses
       - Net Profit (sale + service − expenses − already collected)
       - Stock Investment (after sale)
       - Service Investment (completed)
       - Pending Credit Sales
   • Updates:
       - Universal top bar (unNetProfit, unSaleProfit, ...)
       - Collection tab summary (colSales, colService, ...)
   • Adds Net Profit "Collect" button & writes to Collection Center
=========================================================== */

(function () {
  function num(v) {
    const n = Number(v || 0);
    return isNaN(n) ? 0 : n;
  }

  function fmt(v) {
    return "₹" + Math.round(num(v));
  }

  function computeTotals() {
    const sales     = window.sales     || [];
    const services  = window.services  || [];
    const expenses  = window.expenses  || [];
    const collects  = window.collections || [];

    // ---- Sale Profit & Credit ----
    let saleProfit  = 0;
    let creditSales = 0;

    sales.forEach(s => {
      const status = String(s.status || "").toLowerCase();
      const profit = num(s.profit);
      const total  = num(s.total || s.amount || (num(s.qty) * num(s.price)));

      if (status === "credit") {
        creditSales += total;
      } else {
        saleProfit += profit;
      }
    });

    // ---- Service Profit + Investment ----
    let serviceProfit = 0;
    let serviceInvest = 0;

    services.forEach(j => {
      const status = String(j.status || "").toLowerCase();
      if (status === "completed") {
        serviceProfit += num(j.profit);
        serviceInvest += num(j.invest);
      }
    });

    // ---- Expenses ----
    let totalExp = 0;
    expenses.forEach(e => { totalExp += num(e.amount); });

    // ---- Stock Investment (After Sale) ----
    let stockInvAfter = 0;
    if (typeof window.getStockInvestmentAfterSale === "function") {
      stockInvAfter = num(window.getStockInvestmentAfterSale());
    }

    // ---- Already collected Net Profit (history) ----
    let collectedNet = 0;
    collects.forEach(c => {
      const src = (c.source || c.type || "").toLowerCase();
      if (src === "net profit") {
        collectedNet += num(c.amount);
      }
    });

    const grossProfit = saleProfit + serviceProfit;
    const netRaw      = grossProfit - totalExp;
    const netCurrent  = netRaw - collectedNet;

    return {
      saleProfit,
      serviceProfit,
      expenses: totalExp,
      stockInvAfter,
      serviceInvest,
      creditSales,
      grossProfit,
      netRaw,
      netCurrent,
      collectedNet
    };
  }

  function updateUniversalBar() {
    const t = computeTotals();

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = fmt(val);
    };

    set("unNetProfit",    t.netCurrent);
    set("unSaleProfit",   t.saleProfit);
    set("unServiceProfit",t.serviceProfit);
    set("unExpenses",     t.expenses);
    set("unStockInv",     t.stockInvAfter);
    set("unServiceInv",   t.serviceInvest);
    set("unCreditSales",  t.creditSales);

    // ---- Mirror into Collection summary cards (if present) ----
    const cSales   = document.getElementById("colSales");
    const cServ    = document.getElementById("colService");
    const cCredit  = document.getElementById("colCredit");
    const cInv     = document.getElementById("colInvRemain");

    if (cSales)  cSales.textContent  = fmt(t.saleProfit);
    if (cServ)   cServ.textContent   = fmt(t.serviceProfit);
    if (cCredit) cCredit.textContent = fmt(t.creditSales);
    if (cInv)    cInv.textContent    = fmt(t.stockInvAfter + t.serviceInvest);
  }

  // ---- Net Profit Collect Button ----
  function ensureCollectButton() {
    const card = document.querySelector("#universalBar .uni-card.main");
    if (!card) return;
    if (document.getElementById("unProfitCollectBtn")) return;

    const btn = document.createElement("button");
    btn.id = "unProfitCollectBtn";
    btn.className = "small-btn";
    btn.style.marginTop = "4px";
    btn.style.alignSelf = "flex-start";
    btn.textContent = "Collect";

    card.appendChild(btn);
  }

  function onCollectClick() {
    const t = computeTotals();
    const amt = Math.round(t.netCurrent);

    if (amt <= 0) {
      alert("No net profit to collect right now.");
      return;
    }

    if (typeof window.addCollectionEntry !== "function") {
      alert("Collection module not ready.");
      return;
    }

    if (!confirm(`Add current net profit ₹${amt} to Collection Center?`)) return;

    window.addCollectionEntry(
      "Net Profit",
      "Sale + Service − Expenses",
      amt
    );

    // Refresh UI
    if (typeof window.renderCollection === "function") {
      window.renderCollection();
    }
    updateUniversalBar();
    alert("Net profit added to Collection History.");
  }

  // Init after everything is loaded
  window.addEventListener("load", () => {
    try {
      ensureCollectButton();
      updateUniversalBar();

      const btn = document.getElementById("unProfitCollectBtn");
      if (btn && !btn._bound) {
        btn.addEventListener("click", onCollectClick);
        btn._bound = true;
      }
    } catch (e) {
      console.error("Universal bar init error:", e);
    }
  });

  // Make function available to other files
  window.updateUniversalBar = updateUniversalBar;
})();
