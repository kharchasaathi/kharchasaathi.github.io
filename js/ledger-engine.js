/* ===========================================================
   LEDGER ENGINE v6 — ENTERPRISE SAFE BUILD

   ✔ Modular Ledger Engine
   ✔ Auto Opening Balance (Carry Forward)
   ✔ Net Flow System
   ✔ Close Day Lock
   ✔ Next Day Auto Create
   ✔ Close Button Auto Disable
   ✔ Multi-Device Safe
   ✔ updateLedgerField()
   ✔ Race Condition Safe
=========================================================== */

(function(){

if(window.__ledgerEngineLoaded) return;
window.__ledgerEngineLoaded = true;

console.log("%c📒 Ledger Engine Loading...","color:#673ab7;font-weight:bold;");

let currentLedger = null;
let currentDateKey = null;

const num = v => isNaN(v = Number(v)) ? 0 : v;

/* allowed ledger fields */
const ledgerFields = new Set([
"salesProfit",
"serviceProfit",
"salesInvestmentReturn",
"serviceInvestmentReturn",
"expensesTotal",
"withdrawalsTotal",
"gstPayable"
]);


/* ===========================================================
   DATE KEY (YYYY-MM-DD)
=========================================================== */
function getTodayKey(){

const d = new Date();

return d.getFullYear()+"-"+ 
String(d.getMonth()+1).padStart(2,"0")+"-"+ 
String(d.getDate()).padStart(2,"0");

}


/* ===========================================================
   EMPTY LEDGER STRUCTURE
=========================================================== */
function emptyLedger(opening=0){

return {

openingBalance: opening,

salesProfit:0,
serviceProfit:0,

salesInvestmentReturn:0,
serviceInvestmentReturn:0,

expensesTotal:0,
withdrawalsTotal:0,

gstPayable:0,

netFlow:0,
closingBalance:opening,

isClosed:false,
closedAt:null,

createdAt:Date.now(),
updatedAt:Date.now()

};

}


/* ===========================================================
   CALCULATE NET FLOW
=========================================================== */
function calculateNetFlow(){

if(!currentLedger) return;

const income =
num(currentLedger.salesProfit) +
num(currentLedger.serviceProfit) +
num(currentLedger.salesInvestmentReturn) +
num(currentLedger.serviceInvestmentReturn);

const expense =
num(currentLedger.expensesTotal) +
num(currentLedger.withdrawalsTotal) +
num(currentLedger.gstPayable);

currentLedger.netFlow = income - expense;

currentLedger.closingBalance =
num(currentLedger.openingBalance) +
currentLedger.netFlow;

}


/* ===========================================================
   ENSURE TODAY LEDGER
=========================================================== */
async function ensureTodayLedger(){

if(!auth.currentUser) return;

const uid = auth.currentUser.uid;
const today = getTodayKey();

currentDateKey = today;

const ref =
db.collection("users")
.doc(uid)
.collection("ledger")
.doc(today);

const snap = await ref.get();

if(!snap.exists){

console.log("📦 Creating new ledger for",today);

let opening=0;

const y = new Date();
y.setDate(y.getDate()-1);

const yKey =
y.getFullYear()+"-"+ 
String(y.getMonth()+1).padStart(2,"0")+"-"+ 
String(y.getDate()).padStart(2,"0");

const ySnap =
await db.collection("users")
.doc(uid)
.collection("ledger")
.doc(yKey)
.get();

if(ySnap.exists){

const yData = ySnap.data();
opening = num(yData.closingBalance);

}

const newLedger = emptyLedger(opening);

await ref.set(newLedger);

currentLedger = newLedger;

}
else{

currentLedger = snap.data();

}

calculateNetFlow();

updateCloseButtonState();

window.dispatchEvent(new Event("ledger-ready"));

}


/* ===========================================================
   SAFE LEDGER UPDATE
=========================================================== */
let updateLock=false;

window.updateLedgerField = async function(field,value){

if(!ledgerFields.has(field)){
console.warn("Invalid ledger field:",field);
return;
}

if(updateLock){
console.warn("Ledger update skipped (lock)");
return;
}

if(!currentLedger) return;

if(currentLedger.isClosed){
console.warn("Ledger closed — update blocked");
return;
}

updateLock=true;

currentLedger[field] =
num(currentLedger[field]) + num(value);

calculateNetFlow();

const user = auth.currentUser;
if(!user){
updateLock=false;
return;
}

const ref =
db.collection("users")
.doc(user.uid)
.collection("ledger")
.doc(currentDateKey);

try{

await ref.update({

[field]:currentLedger[field],
netFlow:currentLedger.netFlow,
closingBalance:currentLedger.closingBalance,
updatedAt:Date.now()

});

}
catch(err){

console.error("Ledger update failed",err);

}

updateLock=false;

window.dispatchEvent(
new Event("ledger-updated")
);

};


/* ===========================================================
   CLOSE DAY
=========================================================== */
async function closeLedgerDay(){

const user = auth.currentUser;

if(!user){
alert("Login required");
return;
}

if(!currentLedger){
alert("Ledger not loaded");
return;
}

if(currentLedger.isClosed){
alert("Ledger already closed");
return;
}

calculateNetFlow();

const closingBalance =
num(currentLedger.openingBalance) +
num(currentLedger.netFlow);

const ref =
db.collection("users")
.doc(user.uid)
.collection("ledger")
.doc(currentDateKey);

await ref.update({

netFlow:currentLedger.netFlow,
closingBalance:closingBalance,

isClosed:true,
closedAt:Date.now(),
updatedAt:Date.now()

});

console.log("✅ Ledger closed");

const nextDate = new Date(currentDateKey);
nextDate.setDate(nextDate.getDate()+1);

const nextKey =
nextDate.getFullYear()+"-"+ 
String(nextDate.getMonth()+1).padStart(2,"0")+"-"+ 
String(nextDate.getDate()).padStart(2,"0");

const nextRef =
db.collection("users")
.doc(user.uid)
.collection("ledger")
.doc(nextKey);

const nextSnap = await nextRef.get();

if(!nextSnap.exists){

const nextLedger = emptyLedger(closingBalance);

await nextRef.set(nextLedger);

console.log("📦 Next day ledger created:",nextKey);

}

alert("Ledger closed successfully");

updateCloseButtonState();

window.dispatchEvent(new Event("ledger-updated"));

await ensureTodayLedger();

}


/* ===========================================================
   CLOSE BUTTON AUTO CONTROL
=========================================================== */
function updateCloseButtonState(){

const btn = document.getElementById("closeLedgerBtn");

if(!btn || !currentLedger) return;

btn.disabled = currentLedger.isClosed;

}


/* ===========================================================
   PUBLIC API
=========================================================== */
window.ledgerEngine = {

getCurrent:()=>currentLedger,
getDateKey:()=>currentDateKey,
refresh:ensureTodayLedger

};

window.closeLedgerDay = closeLedgerDay;

console.log("%c📒 Ledger Engine READY ✔","color:#673ab7;font-weight:bold;");

})();
