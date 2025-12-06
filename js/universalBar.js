/* ===========================================================
   universalBar.js — FINAL V12 (Net Profit + Dark-Safe)
   -----------------------------------------------------------
   ✔ Service profit = paid − invest (same as analytics.js)
   ✔ Uses ONLY status + paid/invest (no svc.profit dependency)
   ✔ Updates:
        - Net Profit
        - Stock Investment
        - Service Investment
        - Pending Credit (Sales + Service)
        - Sub values: Sale, Service, Expenses
   ✔ Safe if some elements missing (no JS error)
=========================================================== */

(function () {

  const safeNum = n => Number(n || 0);

  function getAll() {
    return {
      sales: Array.isArray(window.sales) ? window.sales : [],
      services: Array.isArray(window.services) ? window.services : [],
      expenses: Array.isArray(window.expenses) ? window.expenses : [],
      stock: Array.isArray(window.stock) ? window.stock : []
    };
  }

  /* ---------------- STOCK INVESTMENT (Sold Items) ---------------- */
  function calcStockInvestment() {
    const { stock } = getAll();
    let invested = 0;

    stock.forEach(item => {
      const qtySold = safeNum(item.sold);
      const cost    = safeNum(item.cost);
      invested += qtySold * cost;
    });

    return invested;
  }

  /* ---------------- SERVICE INVESTMENT (Completed / Collected) --- */
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

  /* ---------------- NET PROFIT (Sale + Service − Expenses) ------- */
  function calcNetAndParts() {
    const { sales, services, expenses } = getAll();

    let saleProfit = 0;
    let serviceProfit = 0;
    let totalExpenses = 0;

    // SALES: Only paid sales contribute to realized profit
    sales.forEach(s => {
      if (!s) return;
      const status = String(s.status || "").toLowerCase();
      if (status === "paid") {
        saleProfit += safeNum(s.profit);
      }
    });

    // SERVICES: profit = paid − invest for completed / collected
    services.forEach(svc => {
      if (!svc) return;
      const st = String(svc.status || "").toLowerCase();
      if (st === "completed" || st === "collected") {
        const paid   = safeNum(svc.paid);
        const invest = safeNum(svc.invest);
        serviceProfit += (paid - invest);
      }
    });

    // EXPENSES
    expenses.forEach(e => {
      if (!e) return;
      totalExpenses += safeNum(e.amount);
    });

    const totalProfit = saleProfit + serviceProfit;
    const netProfit   = totalProfit - totalExpenses;

    return { saleProfit, serviceProfit, totalExpenses, totalProfit, netProfit };
  }

  /* ---------------- PENDING CREDIT (Sales + Service) -------------- */
  function calcPendingCredit() {
    const { sales, services } = getAll();
    let pending = 0;

    // Sales credit (status = "credit") uses full total
    sales.forEach(s => {
      if (!s) return;
      if (String(s.status || "").toLowerCase() === "credit") {
        pending += safeNum(s.total);
      }
    });

    // Service credit (either creditStatus or status says "credit")
    services.forEach(svc => {
      if (!svc) return;
      const creditFlag =
        String(svc.creditStatus || "").toLowerCase() ||
        String(svc.status || "").toLowerCase();

      if (creditFlag === "credit") {
        pending += safeNum(svc.remaining);
      }
    });

    return pending;
  }

  /* ---------------- UPDATE DOM ---------------- */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "₹" + Number(value || 0).toLocaleString();
  }

  function updateUI(values) {
    // Main Net cards
    setText("unNetProfit",   values.netProfit);
    setText("unStockInv",    values.stockInv);
    setText("unServiceInv",  values.serviceInv);
    setText("unCreditSales", values.pendingCredit);

    // Sub values (if those spans exist in HTML)
    setText("unSaleProfit",   values.saleProfit);
    setText("unServiceProfit",values.serviceProfit);
    setText("unExpenses",     values.totalExpenses);
  }

  /* ---------------- PUBLIC API ---------------- */
  window.updateUniversalBar = function () {
    const stockInv    = calcStockInvestment();
    const serviceInv  = calcServiceInvestment();
    const netParts    = calcNetAndParts();
    const pendingCred = calcPendingCredit();

    const result = {
      stockInv,
      serviceInv,
      pendingCredit: pendingCred,
      saleProfit:    netParts.saleProfit,
      serviceProfit: netParts.serviceProfit,
      totalExpenses: netParts.totalExpenses,
      totalProfit:   netParts.totalProfit,
      netProfit:     netParts.netProfit
    };

    updateUI(result);

    // summary bar కూడా refresh చేయమంటాం
    try { window.updateTabSummaryBar?.(); } catch {}

    return result;
  };

  /* ---------------- INIT ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    try { window.updateUniversalBar(); } catch (e) { console.warn(e); }
  });

})();
