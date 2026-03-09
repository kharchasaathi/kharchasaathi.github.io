/* ===========================================================
   UNIVERSAL BAR v11 — ERP SAFE BUILD (FIXED)
=========================================================== */

(function () {

  if(window.__universalBarLoaded) return;
  window.__universalBarLoaded = true;

  console.log("%c💰 Universal Bar v11 Loading...","color:#0ea5e9;font-weight:bold;");


  const num = v => isNaN(v = Number(v)) ? 0 : v;
  const money = v => "₹" + Math.round(num(v));


  function renderUniversalBar(){

    const L =
      window.currentLedger ||
      window.ledgerEngine?.getCurrent?.();

    if(!L) return;

    const set = (id,val)=>{
      const el=document.getElementById(id);
      if(el) el.textContent=money(val);
    };


    /* INCOME */

    set("ubOpening",L.openingBalance);

    set("ubSaleProfit",L.salesProfit);
    set("ubServiceProfit",L.serviceProfit);

    set("ubSaleInv",L.salesInvestmentReturn);
    set("ubServiceInv",L.serviceInvestmentReturn);

    set("ubGstCollected",L.gstCollected);

/* EXPENSE */

set("ubExpenses",L.expensesTotal || L.expenses);

/* OPENING WITHDRAW */
set("ubOpeningWithdraw",L.openingWithdraw || 0);

set("ubWithdraw",L.withdrawalsTotal || L.withdrawals);
set("ubGstPaid",L.gstPayable || L.gstPaid);
    


    /* NET FLOW */

    const totalIncome =
        num(L.salesProfit)
      + num(L.serviceProfit)
      + num(L.salesInvestmentReturn)
      + num(L.serviceInvestmentReturn)
      + num(L.gstCollected);

    const totalExpense =
        num(L.expensesTotal || L.expenses)
      + num(L.withdrawalsTotal || L.withdrawals)
      + num(L.gstPayable || L.gstPaid);

    const netFlow = totalIncome - totalExpense;

    set("ubNetFlow",netFlow);

    const netEl=document.getElementById("ubNetFlow");

    if(netEl){

      netEl.classList.remove(
        "ub-netflow-positive",
        "ub-netflow-negative"
      );

      if(netFlow>=0)
        netEl.classList.add("ub-netflow-positive");
      else
        netEl.classList.add("ub-netflow-negative");
    }


    /* PENDING CREDIT */

    let pending = 0;

    (window.sales || []).forEach(s=>{
      if(String(s.status).toLowerCase()==="credit"){
        pending += num(
          s.remaining ?? s.balance ?? s.due ?? s.total
        );
      }
    });

    (window.services || []).forEach(j=>{
      if(String(j.status).toLowerCase()==="credit"){
        pending += num(
          j.remaining ?? j.balance ?? j.due ?? j.total
        );
      }
    });

    set("ubPendingCredit",pending);

  }


  function bindActions(){

    const w=document.getElementById("cashWithdraw");
    const e=document.getElementById("cashExpense");
    const g=document.getElementById("cashGST");

    if(w) w.onclick=()=>{
      if(window.withdrawEngine)
        withdrawEngine.promptWithdraw();
    };

    if(e) e.onclick=()=>{
      if(window.expenseEngine)
        expenseEngine.promptExpense();
    };

    if(g) g.onclick=()=>{
      if(window.gstEngine)
        gstEngine.promptGST();
    };

  }


  window.renderUniversalBar = renderUniversalBar;

  window.addEventListener("ledger-ready",renderUniversalBar);
  window.addEventListener("ledger-updated",renderUniversalBar);


  window.addEventListener("load",()=>{

    bindActions();
    renderUniversalBar();

  });

  console.log("%c💰 Universal Bar READY ✔","color:#0ea5e9;font-weight:bold;");

})();
