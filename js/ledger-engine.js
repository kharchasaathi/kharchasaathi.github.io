/* ===========================================================
   LEDGER ENGINE v8 — ENTERPRISE + DAILY REPORT SUPPORT
=========================================================== */

(function(){

if(window.__ledgerEngineLoaded) return;
window.__ledgerEngineLoaded = true;

console.log("%c📒 Ledger Engine Loading...","color:#673ab7;font-weight:bold;");

let currentLedger = null;
let currentDateKey = null;

const num = v => isNaN(v = Number(v)) ? 0 : v;


/* ===========================================================
   ALLOWED LEDGER FIELDS
=========================================================== */

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
   DATE KEY
=========================================================== */

function getTodayKey(){

const d = new Date();

return d.getFullYear()+"-"+ 
String(d.getMonth()+1).padStart(2,"0")+"-"+ 
String(d.getDate()).padStart(2,"0");

}


/* ===========================================================
   EMPTY LEDGER
=========================================================== */

function emptyLedger(opening=0){

return {

openingBalance:opening,

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


/* ---------- CREATE LEDGER IF MISSING ---------- */

if(!snap.exists){

console.log("📦 Creating ledger:",today);

let opening=0;

/* get yesterday ledger */

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

opening = num(ySnap.data().closingBalance);

}

const newLedger = emptyLedger(opening);

await ref.set(newLedger);

currentLedger = newLedger;

}
else{

currentLedger = snap.data();

}


/* ---------- CALCULATE ---------- */

calculateNetFlow();

updateCloseButtonState();

/* ---------- EVENT ---------- */

window.dispatchEvent(
new Event("ledger-ready")
);

console.log("📒 Ledger ready:",today);

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
console.warn("Ledger locked");
return;
}

if(!currentLedger) return;

if(currentLedger.isClosed){
console.warn("Ledger closed");
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
   DAILY LEDGER DATA BUILDER
=========================================================== */

window.buildDailyLedgerReport = function(dateKey){

const sales =
(window.sales||[])
.filter(s=>s.date===dateKey);

const services =
(window.services||[])
.filter(s=>s.date_in===dateKey || s.date_out===dateKey);

const expenses =
(window.expenses||[])
.filter(e=>e.date===dateKey);

const withdraws =
(window.withdraws||[])
.filter(w=>w.date===dateKey);

const collections =
(window.collections||[])
.filter(c=>c.date===dateKey);

return {

sales,
services,
expenses,
withdraws,
collections

};

};


/* ===========================================================
   CLOSE DAY
=========================================================== */

window.closeLedgerDay = async function(){

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
    alert("Already closed");
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
    netFlow: currentLedger.netFlow,
    closingBalance: closingBalance,
    isClosed: true,
    closedAt: Date.now(),
    updatedAt: Date.now()
  });

  console.log("✅ Ledger closed");


  /* ---------- CREATE NEXT DAY ---------- */

  const nextDate = new Date(currentDateKey);
  nextDate.setDate(nextDate.getDate() + 1);

  const nextKey =
    nextDate.getFullYear() + "-" +
    String(nextDate.getMonth() + 1).padStart(2,"0") + "-" +
    String(nextDate.getDate()).padStart(2,"0");

  const nextRef =
    db.collection("users")
    .doc(user.uid)
    .collection("ledger")
    .doc(nextKey);

  const nextSnap = await nextRef.get();

  if(!nextSnap.exists){

    await nextRef.set(
      emptyLedger(closingBalance)
    );

    console.log("📦 Next ledger:", nextKey);
  }

  alert("Ledger closed successfully");

  updateCloseButtonState();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

};   // ⚠️ VERY IMPORTANT — function close

/* ===========================================================
   PUBLIC API
=========================================================== */

window.ledgerEngine = {

getCurrent:()=>currentLedger,
getDateKey:()=>currentDateKey,
refresh:ensureTodayLedger

};


/* ===========================================================
   AUTO LOAD LEDGER AFTER LOGIN
=========================================================== */

auth.onAuthStateChanged(user=>{

if(user){

setTimeout(()=>{

ensureTodayLedger();

},200);

}

});


/* ---------- CREATE NEXT DAY ---------- */

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

await nextRef.set(
emptyLedger(closingBalance)
);

console.log("📦 Next ledger:",nextKey);

}

alert("Ledger closed successfully");

updateCloseButtonState();

window.dispatchEvent(
new Event("ledger-updated")
);

}
   /* ===========================================================
   DAILY LEDGER REPORT SYSTEM
=========================================================== */


/* ===========================================================
   BUILD DAILY LEDGER TEXT
=========================================================== */

window.generateDailyLedgerText = function(dateKey){

const report =
window.buildDailyLedgerReport
? window.buildDailyLedgerReport(dateKey)
: null;

if(!report) return "No data";

let txt = "";

txt += "📒 Shop Ledger Report\n\n";
txt += "Date: "+dateKey+"\n\n";


/* SALES */

if(report.sales?.length){

txt += "🧾 SALES\n";

report.sales.forEach(s=>{

txt +=
`${s.time||""} | ${s.product}\n`+
`Qty:${s.qty} × ₹${s.price}\n`+
`Total: ₹${s.total}\n`+
`Profit: ₹${s.profit}\n\n`;

});

}


/* SERVICES */

if(report.services?.length){

txt += "🛠 SERVICE\n";

report.services.forEach(j=>{

txt +=
`${j.customer} — ${j.item}\n`+
`Invest: ₹${j.invest}\n`+
`Paid: ₹${j.paid}\n`+
`Profit: ₹${j.profit}\n\n`;

});

}


/* EXPENSES */

if(report.expenses?.length){

txt += "💸 EXPENSES\n";

report.expenses.forEach(e=>{

txt +=
`${e.note||"Expense"} — ₹${e.amount}\n`;

});

txt += "\n";

}


/* WITHDRAW */

if(report.withdraws?.length){

txt += "💰 WITHDRAW\n";

report.withdraws.forEach(w=>{

txt +=
`${w.note||"Withdraw"} — ₹${w.amount}\n`;

});

txt += "\n";

}


return txt;

};



/* ===========================================================
   DOWNLOAD CSV
=========================================================== */

window.downloadLedgerCSV = function(dateKey){

const report = window.buildDailyLedgerReport(dateKey);
let rows = [];

rows.push([
"TYPE","DETAIL","AMOUNT"
]);

report.sales.forEach(s=>{

rows.push([
"SALE",
`${s.product} Qty:${s.qty}`,
s.total
]);

});

report.services.forEach(j=>{

rows.push([
"SERVICE",
j.customer,
j.paid
]);

});

report.expenses.forEach(e=>{

rows.push([
"EXPENSE",
e.note||"",
e.amount
]);

});

report.withdraws.forEach(w=>{

rows.push([
"WITHDRAW",
w.note||"",
w.amount
]);

});


let csv =
rows.map(r=>r.join(",")).join("\n");

const blob =
new Blob([csv],{type:"text/csv"});

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href=url;
a.download="ledger-"+dateKey+".csv";
a.click();

URL.revokeObjectURL(url);

};



/* ===========================================================
   DOWNLOAD TEXT REPORT
=========================================================== */

window.downloadLedgerReport = function(dateKey){

const txt =
generateDailyLedgerText(dateKey);

const blob =
new Blob([txt],{type:"text/plain"});

const url =
URL.createObjectURL(blob);

const a =
document.createElement("a");

a.href=url;
a.download="ledger-"+dateKey+".txt";
a.click();

URL.revokeObjectURL(url);

};



/* ===========================================================
   WHATSAPP SHARE
=========================================================== */

window.shareLedgerWhatsApp = function(dateKey){

const txt =
generateDailyLedgerText(dateKey);

const url =
"https://wa.me/?text=" +
encodeURIComponent(txt);

window.open(url,"_blank");

};



/* ===========================================================
   LEDGER VIEW BUILDER
=========================================================== */

window.renderDailyLedger = function(dateKey){

const box =
document.getElementById("dailyLedgerBox");

if(!box) return;

const txt =
generateDailyLedgerText(dateKey);

box.innerHTML =
`<pre style="white-space:pre-wrap;font-size:13px">
${txt}
</pre>`;

};



/* ===========================================================
   AUTO DATE LOAD
=========================================================== */

window.loadTodayLedger = function(){

const today =
new Date().toISOString().slice(0,10);

window.renderDailyLedger(today);

};
   console.log("%c📒 Ledger Engine READY ✔","color:#673ab7;font-weight:bold;");

})();
