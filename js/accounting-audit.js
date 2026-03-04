/* ===========================================================
   LEDGER AUDIT ENGINE v3 (ENTERPRISE SAFE)

   ✔ Ledger integrity check
   ✔ Profit validation
   ✔ Expense validation
   ✔ Withdrawal validation
   ✔ GST validation
   ✔ Negative balance detection
   ✔ Credit ledger verification
   ✔ Collection vs Profit verification
   ✔ Module vs Ledger cross verification
=========================================================== */

(function(){

if(window.__ledgerAuditLoaded) return;
window.__ledgerAuditLoaded = true;

console.log(
"%c🧠 Ledger Audit Engine v3 Loading...",
"color:#3b82f6;font-weight:bold"
);


/* ----------------------------------------------------------
   HELPERS
---------------------------------------------------------- */

const num = v => isNaN(v = Number(v)) ? 0 : v;

function pass(msg){
console.log("%c✅ " + msg,"color:#22c55e;font-weight:bold");
}

function fail(msg,data){
console.error(
"%c🚨 AUDIT FAILURE → " + msg,
"color:#ef4444;font-weight:bold",
data || ""
);
}


/* ===========================================================
   MAIN AUDIT
=========================================================== */

function runLedgerAudit(){

if(!window.ledgerEngine){
console.warn("Ledger engine not ready");
return;
}

const L = ledgerEngine.getCurrent();

if(!L){
console.warn("Ledger not loaded");
return;
}


/* ===========================================================
   PROFIT VALIDATION
=========================================================== */

const expectedProfit =
num(L.salesProfit) +
num(L.serviceProfit) +
num(L.salesInvestmentReturn) +
num(L.serviceInvestmentReturn);

const calculatedNet =
expectedProfit -
(
num(L.expensesTotal) +
num(L.withdrawalsTotal) +
num(L.gstPayable)
);

if(num(L.netFlow) !== calculatedNet){

fail("Net flow mismatch",{
ledgerNet : L.netFlow,
expected  : calculatedNet
});

}else{
pass("Net flow correct");
}


/* ===========================================================
   CLOSING BALANCE VALIDATION
=========================================================== */

const expectedClosing =
num(L.openingBalance) +
num(L.netFlow);

if(num(L.closingBalance) !== expectedClosing){

fail("Closing balance mismatch",{
ledger : L.closingBalance,
expected : expectedClosing
});

}else{
pass("Closing balance correct");
}


/* ===========================================================
   NEGATIVE VALUE CHECK
=========================================================== */

Object.entries(L).forEach(([k,v])=>{

if(typeof v === "number" && v < 0){

fail("Negative ledger value",{ field:k,value:v });

}

});


/* ===========================================================
   WITHDRAWAL SAFETY CHECK
=========================================================== */

const availableCash =
num(L.openingBalance) +
num(L.netFlow);

if(num(L.withdrawalsTotal) > availableCash){

fail("Over withdrawal detected",{
withdrawn : L.withdrawalsTotal,
available : availableCash
});

}else{
pass("Withdrawal limit safe");
}


/* ===========================================================
   CREDIT LEDGER AUDIT
=========================================================== */

const sales = window.sales || [];
const services = window.services || [];
const collections = window.collections || [];

let creditSales = 0;
let creditServices = 0;

sales.forEach(s=>{
if(String(s.status).toLowerCase()==="credit"){
creditSales += num(s.remaining || s.total);
}
});

services.forEach(j=>{
if(String(j.status).toLowerCase()==="credit"){
creditServices += num(j.remaining || j.total);
}
});

const expectedCredit = creditSales + creditServices;


/* recovered credit */

let recoveredCredit = 0;

collections.forEach(c=>{

if(String(c.source).toLowerCase().includes("credit")){
recoveredCredit += num(c.amount);
}

});

if(recoveredCredit > expectedCredit){

fail("Credit recovery exceeds credit ledger",{
creditLedger : expectedCredit,
recovered : recoveredCredit
});

}else{
pass("Credit ledger safe");
}


/* ===========================================================
   COLLECTION vs PROFIT VALIDATION
=========================================================== */

let collectionSales = 0;
let collectionServices = 0;

collections.forEach(c=>{

const src = String(c.source).toLowerCase();

if(src.includes("sale"))
collectionSales += num(c.amount);

if(src.includes("service"))
collectionServices += num(c.amount);

});

if(collectionSales < num(L.salesProfit)){

fail("Sales profit exceeds collections",{
ledgerSalesProfit : L.salesProfit,
collections : collectionSales
});

}else{
pass("Sales collection verified");
}

if(collectionServices < num(L.serviceProfit)){

fail("Service profit exceeds collections",{
ledgerServiceProfit : L.serviceProfit,
collections : collectionServices
});

}else{
pass("Service collection verified");
}


/* ===========================================================
   MODULE → LEDGER CROSS CHECK (NEW)
=========================================================== */

let moduleSalesProfit = 0;

sales.forEach(s=>{
if(String(s.status).toLowerCase()==="paid"){
moduleSalesProfit += num(s.profit);
}
});

if(moduleSalesProfit < num(L.salesProfit)){

fail("Ledger sales profit exceeds module data",{
ledger : L.salesProfit,
module : moduleSalesProfit
});

}else{
pass("Sales module integrity verified");
}


let moduleServiceProfit = 0;

services.forEach(j=>{
const st = String(j.status).toLowerCase();

if(["paid","completed"].includes(st)){
moduleServiceProfit += num(j.profit);
}
});

if(moduleServiceProfit < num(L.serviceProfit)){

fail("Ledger service profit exceeds module data",{
ledger : L.serviceProfit,
module : moduleServiceProfit
});

}else{
pass("Service module integrity verified");
}


/* ===========================================================
   EXPENSE MODULE CROSS CHECK (NEW)
=========================================================== */

const expenses = window.expenses || [];

let moduleExpenses = 0;

expenses.forEach(e=>{
moduleExpenses += num(e.amount);
});

if(moduleExpenses !== num(L.expensesTotal)){

fail("Expense ledger mismatch",{
ledger : L.expensesTotal,
module : moduleExpenses
});

}else{
pass("Expense ledger verified");
}


/* ===========================================================
   GST SANITY CHECK (NEW)
=========================================================== */

if(num(L.gstPayable) < 0){

fail("GST payable negative",{value:L.gstPayable});

}else{
pass("GST sanity check passed");
}


/* ===========================================================
   FINAL LOG
=========================================================== */

console.log(
"%c🧠 Ledger audit completed",
"color:#3b82f6;font-weight:bold"
);

}


/* ===========================================================
   AUTO TRIGGERS
=========================================================== */

window.runLedgerAudit = runLedgerAudit;

window.addEventListener("ledger-ready",runLedgerAudit);
window.addEventListener("ledger-updated",runLedgerAudit);
window.addEventListener("collections-updated",runLedgerAudit);

setTimeout(runLedgerAudit,1500);

})();
