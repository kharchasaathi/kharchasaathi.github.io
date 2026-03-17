/* ===========================================================
   UNIVERSAL BAR v20 — ERP SAFE
   FULL WITHDRAW FIX + UPI FIX + COUNTER BALANCE SAFE
=========================================================== */

(function(){

if(window.__universalBarLoaded) return;
window.__universalBarLoaded = true;

console.log("%c💰 Universal Bar v20 Loading...","color:#0ea5e9;font-weight:bold;");


/* ===============================
   HELPERS
=============================== */

const num = v => isNaN(v = Number(v)) ? 0 : v;

const plus  = v => v>0 ? "+₹"+Math.round(v) : "₹0";
const minus = v => v>0 ? "-₹"+Math.round(v) : "₹0";
const money = v => "₹"+Math.round(num(v));

function set(id,val){
const el=document.getElementById(id);
if(el) el.textContent = val;
}


/* ===============================
   RENDER UNIVERSAL BAR
=============================== */

function renderUniversalBar(){

const L =
window.currentLedger ||
window.ledgerEngine?.getCurrent?.();

if(!L) return;


/* ===============================
   OPENING
=============================== */

set("ubOpening",money(L.openingBalance));


/* ===============================
   INCOME
=============================== */

set("ubSaleProfit",plus(L.salesProfit));
set("ubServiceProfit",plus(L.serviceProfit));

set("ubSaleInv",plus(L.salesInvestmentReturn));
set("ubServiceInv",plus(L.serviceInvestmentReturn));

set("ubGST",plus(L.gstCollected));


/* ===============================
   EXPENSE
=============================== */

set("ubExpenses",minus(L.expensesTotal));

set("ubSalesProfitWithdraw",minus(L.salesProfitWithdraw));
set("ubServiceProfitWithdraw",minus(L.serviceProfitWithdraw));

set("ubStockWithdraw",minus(L.stockWithdrawTotal));
set("ubServiceInvWithdraw",minus(L.serviceWithdrawTotal));

set("ubOpeningWithdraw",minus(L.openingWithdraw));

set("ubGSTPaid",minus(L.gstPaid));


/* ===============================
   TODAY PROFIT
=============================== */

const todayProfit =
num(L.salesProfit)
+ num(L.serviceProfit)
- num(L.expensesTotal);

const profitEl =
document.getElementById("ubTodayProfit");

if(profitEl){

profitEl.textContent =
(todayProfit>=0?"+₹":"-₹")+Math.abs(todayProfit);

const profitBox = profitEl.closest(".ub-profit");

if(profitBox){

profitBox.classList.remove(
"ub-netflow-positive",
"ub-netflow-negative"
);

if(todayProfit >= 0)
profitBox.classList.add("ub-netflow-positive");
else
profitBox.classList.add("ub-netflow-negative");

}

}


/* ===============================
   COUNTER BALANCE
=============================== */

const counterBalance =

num(L.openingBalance)

+ num(L.salesProfit)
+ num(L.serviceProfit)

+ num(L.salesInvestmentReturn)
+ num(L.serviceInvestmentReturn)

+ num(L.gstCollected)

- num(L.expensesTotal)

- num(L.salesProfitWithdraw)
- num(L.serviceProfitWithdraw)

- num(L.stockWithdrawTotal)
- num(L.serviceWithdrawTotal)

- num(L.openingWithdraw)

- num(L.gstPaid);

const counterEl =
document.getElementById("ubCounterBalance");

if(counterEl){

counterEl.textContent =
"₹"+Math.max(0,Math.round(counterBalance));

}
   /* ===============================
   TOTAL WITHDRAW + NET FLOW
=============================== */

const totalWithdraw =
num(L.salesProfitWithdraw) +
num(L.serviceProfitWithdraw) +
num(L.stockWithdrawTotal) +
num(L.serviceWithdrawTotal) +
num(L.openingWithdraw);

set("ubTotalWithdraw","-₹"+Math.round(totalWithdraw));

const netFlow =
num(L.salesProfit) +
num(L.serviceProfit) -
num(L.expensesTotal) -
totalWithdraw;

set(
"ubNetFlow",
(netFlow>=0?"+₹":"-₹")+Math.abs(netFlow)
);


/* ===============================
   CASH / UPI SPLIT
=============================== */

let cash = num(L.cashBalance);
let upi  = num(L.upiBalance);

if(!cash && !upi){

cash = counterBalance;
upi = 0;

}

set("ubCash",money(cash));
set("ubUPI",money(upi));


/* ===============================
   PENDING CREDIT
=============================== */

let pending = 0;

(window.sales || []).forEach(s=>{

if(String(s.status).toLowerCase()==="credit"){

pending += num(
s.remaining ??
s.balance ??
s.due ??
s.total
);

}

});

(window.services || []).forEach(j=>{

if(String(j.status).toLowerCase()==="credit"){

pending += num(
j.remaining ??
j.balance ??
j.due ??
j.total
);

}

});

set("ubPendingCredit",money(pending));

}


/* ===============================
   WITHDRAW BUTTON ACTIONS
=============================== */

function bindActions(){

document.querySelectorAll("[data-withdraw]").forEach(btn=>{

btn.addEventListener("click",()=>{

const type = btn.dataset.withdraw;

if(!window.withdrawEngine) return;


/* OPENING BALANCE */

if(type==="opening-balance")
withdrawEngine.promptOpeningWithdraw();


/* SALES PROFIT */

if(type==="sales-profit")
withdrawEngine.promptSalesProfitWithdraw();


/* SERVICE PROFIT */

if(type==="service-profit")
withdrawEngine.promptServiceProfitWithdraw();


/* STOCK INVESTMENT */

if(type==="stock-investment")
withdrawEngine.promptStockWithdraw();


/* SERVICE INVESTMENT */

if(type==="service-investment")
withdrawEngine.promptServiceInvWithdraw();


/* GST */

if(type==="gst-collected" && window.gstEngine)
gstEngine.promptGST();

});

});

}


/* ===============================
   EVENTS
=============================== */

window.renderUniversalBar =
renderUniversalBar;

window.addEventListener(
"ledger-ready",
renderUniversalBar
);

window.addEventListener(
"ledger-updated",
renderUniversalBar
);

window.addEventListener("load",()=>{

bindActions();
renderUniversalBar();

});


console.log(
"%c💰 Universal Bar READY ✔",
"color:#0ea5e9;font-weight:bold;"
);

})();
