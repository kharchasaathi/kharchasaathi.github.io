/* ===========================================================
   universal-bar.js — LEDGER DRIVEN v8
   Ledger Based + Global Pending Credit
=========================================================== */

(function () {

  const num = v =>
    (isNaN(v = Number(v))) ? 0 : Number(v);

  const money = v =>
    "₹" + Math.round(num(v));


  /* ==========================================================
     RENDER FROM LEDGER + GLOBAL PENDING
  ========================================================== */
  function renderUniversalBar() {

    const L = window.currentLedger;
    if (!L) return;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = money(v);
    };

    /* ---------------- INCOME (+) ---------------- */

    set("ubOpening",       L.openingBalance);
    set("ubSaleProfit",    L.salesProfit);
    set("ubServiceProfit", L.serviceProfit);
    set("ubSaleInv",       L.salesInvestmentReturn);
    set("ubServiceInv",    L.serviceInvestmentReturn);
    set("ubGstCollected",  L.gstCollected);

    /* ---------------- EXPENSE (-) ---------------- */

    set("ubExpenses",  L.expenses);
    set("ubWithdraw",  L.withdrawals);
    set("ubGstPaid",   L.gstPaid);


    /* ---------------- NET FLOW (Ledger Only) ---------------- */

    const totalIncome =
        num(L.salesProfit)
      + num(L.serviceProfit)
      + num(L.salesInvestmentReturn)
      + num(L.serviceInvestmentReturn)
      + num(L.gstCollected);

    const totalExpense =
        num(L.expenses)
      + num(L.withdrawals)
      + num(L.gstPaid);

    const netFlow = totalIncome - totalExpense;

    set("ubNetFlow", netFlow);

    const box = document.querySelector(".ub-netflow-box");

    if (box) {

      box.classList.remove(
        "ub-netflow-positive",
        "ub-netflow-negative"
      );

      if (netFlow >= 0) {
        box.classList.add("ub-netflow-positive");
      } else {
        box.classList.add("ub-netflow-negative");
      }
    }


    /* ---------------- PENDING CREDIT (GLOBAL) ---------------- */

    let pending = 0;

    (window.sales || []).forEach(s => {
      if (String(s.status).toLowerCase() === "credit")
        pending += num(s.total);
    });

    (window.services || []).forEach(j => {
      if (String(j.status).toLowerCase() === "credit")
        pending += num(j.remaining);
    });

    set("ubPendingCredit", pending);
  }

  window.renderUniversalBar = renderUniversalBar;


  /* ==========================================================
     AUTO REFRESH
  ========================================================== */

  window.addEventListener(
    "ledger-updated",
    renderUniversalBar
  );

})();
