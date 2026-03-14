/* ===========================================================
   UNIVERSAL BAR v12 — COUNTER BALANCE + TODAY PROFIT
=========================================================== */

(function () {

  if(window.__universalBarLoaded) return;
  window.__universalBarLoaded = true;

  console.log("%c💰 Universal Bar v12 Loading...","color:#0ea5e9;font-weight:bold;");


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


    /* ===============================
       DISPLAY VALUES
    =============================== */

    set("ubOpening",L.openingBalance);

    set("ubSaleProfit",L.salesProfit);
    set("ubServiceProfit",L.serviceProfit);

    set("ubSaleInv",L.salesInvestmentReturn);
    set("ubServiceInv",L.serviceInvestmentReturn);

    set("ubGstCollected",L.gstCollected);

    set("ubExpenses",L.expensesTotal || L.expenses);

    set("ubOpeningWithdraw",L.openingWithdraw || 0);

    set("ubWithdraw",L.withdrawalsTotal || L.withdrawals);

    set("ubGstPaid",L.gstPaid || 0);


    /* ===============================
       TODAY PROFIT
    =============================== */

    const todayProfit =
        num(L.salesProfit)
      + num(L.serviceProfit)
      - num(L.expensesTotal || L.expenses);

    set("ubTodayProfit",todayProfit);

    const profitEl=document.getElementById("ubTodayProfit");

    if(profitEl){

      profitEl.classList.remove(
        "ub-netflow-positive",
        "ub-netflow-negative"
      );

      if(todayProfit>=0)
        profitEl.classList.add("ub-netflow-positive");
      else
        profitEl.classList.add("ub-netflow-negative");
    }


    /* ===============================
       COUNTER BALANCE
    =============================== */

    const counterBalance =
        num(L.openingBalance)
      + num(L.gstCollected)
      - num(L.openingWithdraw)
      - num(L.withdrawalsTotal || 0)
      - num(L.gstPaid);

    set("ubCounterBalance",counterBalance);


    const counterEl=document.getElementById("ubCounterBalance");

    if(counterEl){

      counterEl.classList.remove(
        "ub-netflow-positive",
        "ub-netflow-negative"
      );

      if(counterBalance>=0)
        counterEl.classList.add("ub-netflow-positive");
      else
        counterEl.classList.add("ub-netflow-negative");
    }


    /* ===============================
       PENDING CREDIT
    =============================== */

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
