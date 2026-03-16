/* ===========================================================
   UNIVERSAL BAR v17 — ERP SAFE
   TODAY PROFIT COLOR + COUNTER BALANCE + BALANCE SPLIT
=========================================================== */

(function(){

if(window.__universalBarLoaded) return;
window.__universalBarLoaded = true;

console.log("%c💰 Universal Bar v17 Loading...","color:#0ea5e9;font-weight:bold;");


/* ===============================
   HELPERS
=============================== */

const num = v => isNaN(v = Number(v)) ? 0 : v;

const plus = v => v>0 ? "+₹"+Math.round(v) : "₹0";
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

/* COLOR LOGIC */

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
   TODAY BALANCE SPLIT
=============================== */

let cash = num(L.cashBalance);
let upi  = num(L.upiBalance);

/* fallback */

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
   BUTTON ACTIONS
=============================== */

function bindActions(){

const withdrawBtns =
document.querySelectorAll(".ub-btn");

withdrawBtns.forEach(btn=>{

btn.addEventListener("click",()=>{

if(window.withdrawEngine)
withdrawEngine.promptWithdraw();

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
