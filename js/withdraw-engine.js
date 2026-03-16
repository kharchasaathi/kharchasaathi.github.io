/* ===========================================================
   WITHDRAW ENGINE v7
   Full Universal Bar Compatible System
=========================================================== */

(function(){

if(window.__withdrawEngineLoaded) return;
window.__withdrawEngineLoaded = true;

console.log("%c💰 Withdraw Engine v7 Loading...","color:#16a34a;font-weight:bold;");


/* ===========================================================
   COMMON VALIDATION
=========================================================== */

function validateLedger(){

const user = auth.currentUser;

if(!user){
alert("Login required");
return null;
}

if(!window.ledgerEngine){
alert("Ledger engine not ready");
return null;
}

const L = ledgerEngine.getCurrent();

if(!L){
alert("Ledger not loaded");
return null;
}

if(L.isClosed){
alert("Ledger already closed for today");
return null;
}

return L;

}


/* ===========================================================
   AMOUNT VALIDATION
=========================================================== */

function validateAmount(amount){

amount = Number(amount);

if(isNaN(amount) || amount <= 0){
alert("Invalid amount");
return null;
}

return amount;

}


/* ===========================================================
   OPENING WITHDRAW
=========================================================== */

async function withdrawOpening(amount){

const L = validateLedger();
if(!L) return;

amount = validateAmount(amount);
if(!amount) return;

const opening = Number(L.openingBalance || 0);
const withdrawn = Number(L.openingWithdraw || 0);

const available = opening - withdrawn;

if(amount > available){

alert(
"Opening withdraw limit exceeded.\n\n" +
"Available: ₹" + Math.round(available)
);

return;
}

const newTotal = withdrawn + amount;

await updateLedger({
openingWithdraw:newTotal
});

}


/* ===========================================================
   SALES PROFIT WITHDRAW
=========================================================== */

async function withdrawSalesProfit(amount){

const L = validateLedger();
if(!L) return;

amount = validateAmount(amount);
if(!amount) return;

const profit = Number(L.salesProfit || 0);
const withdrawn = Number(L.salesProfitWithdraw || 0);

const available = profit - withdrawn;

if(amount > available){

alert(
"Sales profit withdraw limit exceeded.\n\n" +
"Available: ₹" + Math.round(available)
);

return;
}

const newTotal = withdrawn + amount;

await updateLedger({
salesProfitWithdraw:newTotal
});

}


/* ===========================================================
   SERVICE PROFIT WITHDRAW
=========================================================== */

async function withdrawServiceProfit(amount){

const L = validateLedger();
if(!L) return;

amount = validateAmount(amount);
if(!amount) return;

const profit = Number(L.serviceProfit || 0);
const withdrawn = Number(L.serviceProfitWithdraw || 0);

const available = profit - withdrawn;

if(amount > available){

alert(
"Service profit withdraw limit exceeded.\n\n" +
"Available: ₹" + Math.round(available)
);

return;
}

const newTotal = withdrawn + amount;

await updateLedger({
serviceProfitWithdraw:newTotal
});

}


/* ===========================================================
   STOCK INVESTMENT WITHDRAW
=========================================================== */

async function withdrawStock(amount){

const L = validateLedger();
if(!L) return;

amount = validateAmount(amount);
if(!amount) return;

const invest = Number(L.salesInvestmentReturn || 0);
const withdrawn = Number(L.stockWithdrawTotal || 0);

const available = invest - withdrawn;

if(amount > available){

alert(
"Stock withdraw limit exceeded.\n\n" +
"Available: ₹" + Math.round(available)
);

return;
}

const newTotal = withdrawn + amount;

await updateLedger({
stockWithdrawTotal:newTotal
});

}


/* ===========================================================
   SERVICE INVESTMENT WITHDRAW
=========================================================== */

async function withdrawService(amount){

const L = validateLedger();
if(!L) return;

amount = validateAmount(amount);
if(!amount) return;

const invest = Number(L.serviceInvestmentReturn || 0);
const withdrawn = Number(L.serviceWithdrawTotal || 0);

const available = invest - withdrawn;

if(amount > available){

alert(
"Service withdraw limit exceeded.\n\n" +
"Available: ₹" + Math.round(available)
);

return;
}

const newTotal = withdrawn + amount;

await updateLedger({
serviceWithdrawTotal:newTotal
});

}


/* ===========================================================
   GST PAID
=========================================================== */

async function withdrawGST(amount){

const L = validateLedger();
if(!L) return;

amount = validateAmount(amount);
if(!amount) return;

const collected = Number(L.gstCollected || 0);
const paid = Number(L.gstPaid || 0);

const available = collected - paid;

if(amount > available){

alert(
"GST payment limit exceeded.\n\n" +
"Available GST: ₹" + Math.round(available)
);

return;
}

const newTotal = paid + amount;

await updateLedger({
gstPaid:newTotal
});

}


/* ===========================================================
   FIRESTORE UPDATE
=========================================================== */

async function updateLedger(updateData){

const user = auth.currentUser;

const uid = user.uid;
const dateKey = ledgerEngine.getDateKey();

const ref =
db.collection("users")
.doc(uid)
.collection("ledger")
.doc(dateKey);

updateData.updatedAt = Date.now();

await ref.update(updateData);

await ledgerEngine.refresh();

window.dispatchEvent(
new Event("ledger-updated")
);

}


/* ===========================================================
   PROMPT FUNCTIONS
=========================================================== */

async function promptOpeningWithdraw(){

const amt = prompt("Enter opening withdraw amount");
if(!amt) return;

await withdrawOpening(amt);

}

async function promptSalesProfitWithdraw(){

const amt = prompt("Enter sales profit withdraw amount");
if(!amt) return;

await withdrawSalesProfit(amt);

}

async function promptServiceProfitWithdraw(){

const amt = prompt("Enter service profit withdraw amount");
if(!amt) return;

await withdrawServiceProfit(amt);

}

async function promptStockWithdraw(){

const amt = prompt("Enter stock withdraw amount");
if(!amt) return;

await withdrawStock(amt);

}

async function promptServiceInvWithdraw(){

const amt = prompt("Enter service investment withdraw amount");
if(!amt) return;

await withdrawService(amt);

}


/* ===========================================================
   PUBLIC API
=========================================================== */

window.withdrawEngine = {

withdrawOpening,
withdrawSalesProfit,
withdrawServiceProfit,
withdrawStock,
withdrawService,
withdrawGST,

promptOpeningWithdraw,
promptSalesProfitWithdraw,
promptServiceProfitWithdraw,
promptStockWithdraw,
promptServiceInvWithdraw

};

console.log("%c💰 Withdraw Engine READY ✔","color:#16a34a;font-weight:bold;");

})();
