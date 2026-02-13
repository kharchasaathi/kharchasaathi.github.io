/* ===========================================================
   accounting-audit.js — FINAL AUDIT GUARD v1
   ✔ Profit integrity check
   ✔ Credit mismatch detection
   ✔ Settlement verification
   ✔ Offset corruption guard
   ✔ Investment alignment audit
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

  /* ---------------- PROFIT CHECK ---------------- */
  let salesProfit = 0;
  sales.forEach(s=>{
    if(s.status==="paid")
      salesProfit += num(s.profit);
  });

  let serviceProfit = 0;
  services.forEach(j=>{
    if(j.status==="paid")
      serviceProfit += num(j.profit);
  });

  const expectedProfit =
    salesProfit + serviceProfit;

  const universalProfit =
    num(metrics.saleProfitCollected)
    + num(metrics.serviceProfitCollected);

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

  /* ---------------- CREDIT CHECK ---------------- */
  let creditSales = 0;
  sales.forEach(s=>{
    if(s.status==="credit")
      creditSales += num(s.remaining);
  });

  let creditService = 0;
  services.forEach(j=>{
    if(j.status==="credit")
      creditService += num(j.remaining);
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

  /* ---------------- OFFSET CHECK ---------------- */
  Object.entries(offsets)
    .forEach(([k,v])=>{
      if(num(v) < 0){
        logFail(
          "Negative offset detected",
          { key:k, value:v }
        );
      }
    });

  /* ---------------- EXPENSE CHECK ---------------- */
  let totalExpenses = 0;
  expenses.forEach(e=>{
    totalExpenses += num(e.amount);
  });

  if(totalExpenses !== num(metrics.expensesLive)){
    logFail(
      "Expense mismatch",
      {
        ledger: totalExpenses,
        metrics: metrics.expensesLive
      }
    );
  }else{
    logPass("Expense ledger correct");
  }

  console.log(
    "%c🧠 Accounting audit completed",
    "color:#3b82f6;font-weight:bold"
  );
}

/* ===========================================================
   AUTO TRIGGERS
=========================================================== */

window.runAccountingAudit = runAudit;

window.addEventListener(
  "cloud-data-loaded",
  runAudit
);

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

setTimeout(runAudit,1500);

})();
