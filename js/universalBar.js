/* ===========================================================
   universalBar.js — FINAL STABLE VERSION (v11 FIXED)
=========================================================== */

(function(){

  const safeNum = n => Number(n || 0);

  function getAll() {
    return {
      sales: Array.isArray(window.sales) ? window.sales : [],
      services: Array.isArray(window.services) ? window.services : [],
      stock: Array.isArray(window.stock) ? window.stock : []
    };
  }

  /* ---------------- STOCK INVESTMENT ---------------- */
  function calcStockInvestment() {
    const { stock } = getAll();
    let invested = 0;

    stock.forEach(item => {
      const qtySold = safeNum(item.sold);
      const cost = safeNum(item.cost);
      invested += (qtySold * cost);
    });

    return invested;
  }

  /* ---------------- SERVICE INVESTMENT ---------------- */
  function calcServiceInvestment() {
    const { services } = getAll();
    let invested = 0;

    services.forEach(svc => {
      const st = String(svc.status || "").toLowerCase();
      if (st === "completed" || st === "collected") {
        invested += safeNum(svc.invest);
      }
    });

    return invested;
  }

  /* ---------------- NET PROFIT ---------------- */
  function calcNetProfit() {
    const { sales, services } = getAll();
    let saleProfit = 0;
    let serviceProfit = 0;

    sales.forEach(s => {
      if (String(s.status).toLowerCase() === "paid") {
        saleProfit += safeNum(s.profit);
      }
    });

    services.forEach(svc => {
      const st = String(svc.status || "").toLowerCase();
      if (st === "completed" || st === "collected") {
        serviceProfit += safeNum(svc.profit);
      }
    });

    return {
      sale: saleProfit,
      service: serviceProfit,
      total: saleProfit + serviceProfit
    };
  }

  /* ---------------- PENDING CREDIT ---------------- */
  function calcPendingCredit() {
    const { sales, services } = getAll();
    let pending = 0;

    sales.forEach(s => {
      if (String(s.status).toLowerCase() === "credit") {
        pending += safeNum(s.total);
      }
    });

    services.forEach(svc => {
      if (String(svc.creditStatus || svc.status).toLowerCase() === "credit") {
        pending += safeNum(svc.remaining);
      }
    });

    return pending;
  }

  /* ---------------- UPDATE UI ---------------- */
  function updateUI(values) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = "₹" + Number(val || 0).toLocaleString();
    };

    set("unNetProfit", values.net.total);
    set("unStockInv", values.stockInv);
    set("unServiceInv", values.serviceInv);

    /* IMPORTANT FIX:
       HTML uses id="unCreditSales"
       So update that instead of unPendingCredit
    */
    set("unCreditSales", values.pendingCredit);
  }

  /* ---------------- MASTER EXPORT ---------------- */
  window.updateUniversalBar = function () {
    const stockInv = calcStockInvestment();
    const serviceInv = calcServiceInvestment();
    const net = calcNetProfit();
    const pendingCredit = calcPendingCredit();

    updateUI({ stockInv, serviceInv, net, pendingCredit });

    // also update summary bar if exists
    try { window.updateTabSummaryBar?.(); } catch {}

    return { stockInv, serviceInv, net, pendingCredit };
  };

  /* ---------------- INIT ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    try { window.updateUniversalBar(); } catch(e){}
  });

})();
