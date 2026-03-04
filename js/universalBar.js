/* ===========================================================
   UNIVERSAL BAR v10 — FULL MERGED
   Ledger Summary + Pending Credit + Quick Actions
=========================================================== */

(function () {

  if(window.__universalBarLoaded) return;
  window.__universalBarLoaded = true;

  console.log("%c💰 Universal Bar v10 Loading...","color:#0ea5e9;font-weight:bold;");


  /* ==========================================================
     UTIL
  ========================================================== */

  const num = v =>
    (isNaN(v = Number(v))) ? 0 : Number(v);

  const money = v =>
    "₹" + Math.round(num(v));


  /* ==========================================================
     CREATE BAR
  ========================================================== */

  function createBar(){

    if(document.getElementById("universalBar")) return;

    const bar = document.createElement("div");
    bar.id = "universalBar";

    bar.innerHTML = `

    <div class="ub-summary">

      <div>Open <span id="ubOpening">₹0</span></div>

      <div>Sale Profit <span id="ubSaleProfit">₹0</span></div>
      <div>Service Profit <span id="ubServiceProfit">₹0</span></div>

      <div>Sale Inv <span id="ubSaleInv">₹0</span></div>
      <div>Service Inv <span id="ubServiceInv">₹0</span></div>

      <div>GST Collected <span id="ubGstCollected">₹0</span></div>

      <div>Expenses <span id="ubExpenses">₹0</span></div>
      <div>Withdraw <span id="ubWithdraw">₹0</span></div>
      <div>GST Paid <span id="ubGstPaid">₹0</span></div>

      <div class="ub-netflow-box">
        Net <span id="ubNetFlow">₹0</span>
      </div>

      <div>Pending <span id="ubPendingCredit">₹0</span></div>

    </div>

    <div class="ub-actions">

      <button id="cashWithdraw">Withdraw</button>
      <button id="cashExpense">Expense</button>
      <button id="cashGST">GST</button>

    </div>

    `;

    document.body.appendChild(bar);

    addStyle();
    bindActions();
  }


  /* ==========================================================
     STYLE
  ========================================================== */

  function addStyle(){

    const style = document.createElement("style");

    style.innerHTML = `

    #universalBar{
      position:fixed;
      bottom:0;
      left:0;
      right:0;
      background:#111;
      color:#fff;
      font-size:12px;
      padding:8px;
      z-index:9999;
      box-shadow:0 -4px 14px rgba(0,0,0,0.4);
    }

    .ub-summary{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      justify-content:center;
      margin-bottom:6px;
    }

    .ub-actions{
      display:flex;
      justify-content:center;
      gap:10px;
    }

    .ub-actions button{
      border:none;
      padding:8px 12px;
      border-radius:8px;
      cursor:pointer;
      color:#fff;
      font-size:12px;
    }

    #cashWithdraw{ background:#ef4444; }
    #cashExpense{ background:#f97316; }
    #cashGST{ background:#2563eb; }

    .ub-netflow-positive{
      color:#22c55e;
      font-weight:bold;
    }

    .ub-netflow-negative{
      color:#ef4444;
      font-weight:bold;
    }

    `;

    document.head.appendChild(style);
  }


  /* ==========================================================
     RENDER LEDGER
  ========================================================== */

  function renderUniversalBar(){

    const L = window.currentLedger ||
              (window.ledgerEngine && ledgerEngine.getCurrent());

    if(!L) return;

    const set=(id,v)=>{
      const el=document.getElementById(id);
      if(el) el.textContent=money(v);
    };


    /* ---------------- INCOME ---------------- */

    set("ubOpening", L.openingBalance);
    set("ubSaleProfit", L.salesProfit);
    set("ubServiceProfit", L.serviceProfit);

    set("ubSaleInv", L.salesInvestmentReturn);
    set("ubServiceInv", L.serviceInvestmentReturn);

    set("ubGstCollected", L.gstCollected);


    /* ---------------- EXPENSE ---------------- */

    set("ubExpenses", L.expensesTotal || L.expenses);
    set("ubWithdraw", L.withdrawalsTotal || L.withdrawals);
    set("ubGstPaid", L.gstPayable || L.gstPaid);


    /* ---------------- NET FLOW ---------------- */

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

    set("ubNetFlow", netFlow);

    const box=document.querySelector(".ub-netflow-box");

    if(box){

      box.classList.remove(
        "ub-netflow-positive",
        "ub-netflow-negative"
      );

      if(netFlow>=0)
        box.classList.add("ub-netflow-positive");
      else
        box.classList.add("ub-netflow-negative");
    }


    /* ---------------- PENDING CREDIT ---------------- */

    let pending=0;

    (window.sales || []).forEach(s=>{
      if(String(s.status).toLowerCase()==="credit")
        pending+=num(s.total);
    });

    (window.services || []).forEach(j=>{
      if(String(j.status).toLowerCase()==="credit")
        pending+=num(j.remaining);
    });

    set("ubPendingCredit", pending);

  }


  /* ==========================================================
     QUICK ACTIONS
  ========================================================== */

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


  /* ==========================================================
     AUTO REFRESH
  ========================================================== */

  window.renderUniversalBar=renderUniversalBar;

  window.addEventListener(
    "ledger-ready",
    renderUniversalBar
  );

  window.addEventListener(
    "ledger-updated",
    renderUniversalBar
  );


  /* ==========================================================
     INIT
  ========================================================== */

  window.addEventListener("load", createBar);

  console.log("%c💰 Universal Bar READY ✔","color:#0ea5e9;font-weight:bold;");

})();
