/* ===========================================================
   accounting-audit.js — FINAL AUDIT GUARD v3 (ERP SAFE)

   ✔ Profit integrity check (Collected only)
   ✔ Sales + Service settlement aligned
   ✔ Credit mismatch detection
   ✔ Offset corruption guard
   ✔ Expense settlement aware verification
   ✔ Withdraw compatible
   ✔ Universal aligned
=========================================================== */

(function(){

/* -------------------------------------------------- HELPERS */
const num = v => isNaN(v = Number(v)) ? 0 : v;

function logPass(msg){
  console.log(
    "%c✅ " + msg,
    "color:#22c55e;font-weight:bold"
  );
}

function logFail(msg,data){
  console.error(
    "%c🚨 AUDIT FAILURE → " + msg,
    "color:#ef4444;font-weight:bold",
    data || ""
  );
}


/* ===========================================================
   MAIN AUDIT ENGINE
=========================================================== */
function runAudit(){

  const sales    = window.sales || [];
  const services = window.services || [];
  const expenses = window.expenses || [];
  const offsets  = window.__offsets || {};
  const metrics  = window.__unMetrics || {};


  /* =========================================================
     💰 PROFIT SETTLEMENT CHECK
     Only collected profit should count
  ========================================================= */

  let salesProfit = 0;

  sales.forEach(s=>{

    if(
      String(s.status).toLowerCase() === "paid" &&
      s.collectionLogged === true
    ){
      salesProfit += num(s.profit);
    }

  });


  let serviceProfit = 0;

  services.forEach(j=>{

    const st =
      String(j.status).toLowerCase();

    if(
      ["paid","completed"].includes(st) &&
      j.collectionLogged === true
    ){
      serviceProfit += num(j.profit);
    }

  });


  const expectedProfit =
    salesProfit + serviceProfit;


  const universalProfit =
    num(metrics.saleProfitCollected) +
    num(metrics.serviceProfitCollected);


  if(expectedProfit !== universalProfit){

    logFail(
      "Profit mismatch",
      {
        expected: expectedProfit,
        universal: universalProfit
      }
    );

  }else{
    logPass("Profit settlement correct");
  }



  /* =========================================================
     🧾 CREDIT LEDGER CHECK
  ========================================================= */

  let creditSales = 0;

  sales.forEach(s=>{

    if(
      String(s.status).toLowerCase() === "credit"
    ){
      creditSales +=
        num(s.remaining || s.total);
    }

  });


  let creditService = 0;

  services.forEach(j=>{

    if(
      String(j.status).toLowerCase() === "credit"
    ){
      creditService +=
        num(j.remaining || j.total);
    }

  });


  const expectedCredit =
    creditSales + creditService;


  const dashboardCredit =
    num(metrics.pendingCreditTotal);


  if(expectedCredit !== dashboardCredit){

    logFail(
      "Credit mismatch",
      {
        expected: expectedCredit,
        dashboard: dashboardCredit
      }
    );

  }else{
    logPass("Credit ledger correct");
  }



  /* =========================================================
     🔁 OFFSET CORRUPTION CHECK
  ========================================================= */

  Object.entries(offsets)
    .forEach(([k,v])=>{

      if(num(v) < 0){

        logFail(
          "Negative offset detected",
          { key:k, value:v }
        );

      }

    });



  /* =========================================================
     💸 EXPENSE LEDGER CHECK (SETTLEMENT AWARE)
  ========================================================= */

  let totalExpenses = 0;

  expenses.forEach(e=>{
    totalExpenses += num(e.amount);
  });


  const settledOffset =
    num(offsets.expensesSettled);

  const expectedLiveExpenses =
    Math.max(
      0,
      totalExpenses - settledOffset
    );


  if(
    expectedLiveExpenses !==
    num(metrics.expensesLive)
  ){

    logFail(
      "Expense mismatch",
      {
        ledger: totalExpenses,
        settled: settledOffset,
        expectedLive: expectedLiveExpenses,
        metrics: metrics.expensesLive
      }
    );

  }else{
    logPass("Expense ledger correct");
  }



  /* =========================================================
     🧠 FINAL LOG
  ========================================================= */

  console.log(
    "%c🧠 Accounting audit completed",
    "color:#3b82f6;font-weight:bold"
  );

}



/* ===========================================================
   AUTO TRIGGERS
=========================================================== */

window.runAccountingAudit = runAudit;


/* CLOUD LOAD */
window.addEventListener(
  "cloud-data-loaded",
  runAudit
);

/* MODULE EVENTS */
window.addEventListener(
  "services-updated",
  runAudit
);

window.addEventListener(
  "sales-updated",
  runAudit
);

window.addEventListener(
  "expenses-updated",
  runAudit
);


/* SAFETY DELAY RUN */
setTimeout(runAudit,1500);

})();
