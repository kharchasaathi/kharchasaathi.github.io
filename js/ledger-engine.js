/* ===========================================================
LEDGER ENGINE v14.1 — SYSTEM SYNC + REPORT SYSTEM
=========================================================== */
(function(){
if(window.__ledgerEngineLoaded) return;
window.__ledgerEngineLoaded = true;
console.log("%c📒 Ledger Engine v14.1 Loading...","color:#673ab7;font-weight:bold;");
let currentLedger = null;
let currentDateKey = null;
const num = v => isNaN(v = Number(v)) ? 0 : v;
/* ===========================================================
ALLOWED LEDGER FIELDS
=========================================================== */
const ledgerFields = new Set([
"salesProfit","serviceProfit",
"salesInvestmentReturn","serviceInvestmentReturn",
"stockWithdrawTotal","serviceWithdrawTotal",
"expensesTotal",
"salesProfitWithdraw","serviceProfitWithdraw",
"openingWithdraw",
"gstCollected","gstPaid"
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
function emptyLedger(opening = 0){
return{
openingBalance: num(opening), // ✅ safety fix
salesProfit:0,
serviceProfit:0,
salesInvestmentReturn:0,
serviceInvestmentReturn:0,
stockWithdrawTotal:0,
serviceWithdrawTotal:0,
expensesTotal:0,
salesProfitWithdraw:0,
serviceProfitWithdraw:0,
openingWithdraw:0,
gstCollected:0,
gstPaid:0,
netFlow:0,
closingBalance: num(opening), // ✅ safety fix
isClosed:false,
closedAt:null,
createdAt:Date.now(),
updatedAt:Date.now()
};
}
/* ===========================================================
CALCULATE LEDGER
=========================================================== */
function calculateLedger(){
if(!currentLedger) return;
/* NET FLOW = TODAY PROFIT */
currentLedger.netFlow =
num(currentLedger.salesProfit)
+ num(currentLedger.serviceProfit)
- num(currentLedger.expensesTotal);
/* CLOSING BALANCE */
currentLedger.closingBalance =
num(currentLedger.openingBalance)
+ num(currentLedger.salesProfit)
+ num(currentLedger.serviceProfit)
+ num(currentLedger.salesInvestmentReturn)
+ num(currentLedger.serviceInvestmentReturn)
+ num(currentLedger.gstCollected)
- num(currentLedger.expensesTotal)
- num(currentLedger.stockWithdrawTotal)
- num(currentLedger.serviceWithdrawTotal)
- num(currentLedger.salesProfitWithdraw)
- num(currentLedger.serviceProfitWithdraw)
- num(currentLedger.openingWithdraw)
- num(currentLedger.gstPaid);
}
/* ===========================================================
BUTTON STATE
=========================================================== */
function updateCloseButtonState(){
const btn = document.getElementById("closeLedgerBtn");
if(!btn || !currentLedger) return;
btn.disabled = currentLedger.isClosed;
}
/* ===========================================================
ENSURE TODAY LEDGER (FIXED — LAST AVAILABLE OPENING)
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


/* ===============================
   IF TODAY LEDGER NOT EXISTS
=============================== */

if(!snap.exists){

let opening = 0;
let found = false;

/* 🔥 FIX: USE todayKey (NO TIMEZONE BUG) */
const [y, m, d] = today.split("-").map(Number);

let checkDate = new Date(y, m - 1, d);
checkDate.setDate(checkDate.getDate() - 1);

/* 🔥 FIND LAST VALID LEDGER (365 DAYS) */
for(let i=0; i<365; i++){

  const key =
  checkDate.getFullYear()+"-"+
  String(checkDate.getMonth()+1).padStart(2,"0")+"-"+
  String(checkDate.getDate()).padStart(2,"0");

  console.log("🔍 Checking ledger:", key);

  const prevSnap =
  await db.collection("users")
  .doc(uid)
  .collection("ledger")
  .doc(key)
  .get();

  if(prevSnap.exists){

    const data = prevSnap.data() || {};

    console.log("📄 Found doc:", key, data);

    /* ✅ IMPORTANT FIX */
    if(data.closingBalance != null){
  opening = num(data.closingBalance);
  found = true;
  break;
}

      opening = data.closingBalance;
      found = true;

      console.log("📦 Opening taken from:", key, "→", opening);

      break; // ✅ stop once valid found

    } else {

      console.warn("⚠ closingBalance missing/invalid in:", key);

    }

  }

  checkDate.setDate(checkDate.getDate() - 1);
}
   if(!found){
  console.warn("⚠ fallback → using last known closing");

  opening = num(currentLedger?.closingBalance || 0);
}
   console.log("🧠 FINAL OPENING USED:", opening);

/* 🔥 FINAL SAFETY LOG */
console.log("✅ FINAL OPENING VALUE:", opening);

/* 🔥 OPTIONAL WARNING */
if(!found){
  console.warn("⚠ No valid previous ledger found (365 days), opening = 0");
}

/* ===============================
   CREATE NEW LEDGER
=============================== */

const newLedger = emptyLedger(opening);

await ref.set(newLedger);

currentLedger = newLedger;

}


/* ===============================
   IF ALREADY EXISTS
=============================== */
else{

  const data = snap.data() || {};

  /* 🔥 CRITICAL FIX */
  if(typeof data.openingBalance !== "number"){

    console.warn("⚠ openingBalance missing → recalculating...");

    /* 🔁 fallback: previous ledger నుండి తీసుకురా */
    let opening = 0;
    let found = false;

    const [y, m, d] = today.split("-").map(Number);

    let checkDate = new Date(y, m - 1, d);
    checkDate.setDate(checkDate.getDate() - 1);

    for(let i=0; i<365; i++){

      const key =
      checkDate.getFullYear()+"-"+
      String(checkDate.getMonth()+1).padStart(2,"0")+"-"+
      String(checkDate.getDate()).padStart(2,"0");

      const prevSnap =
      await db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(key)
      .get();

      if(prevSnap.exists){

        const prevData = prevSnap.data() || {};

        if(typeof prevData.closingBalance === "number"){

          opening = prevData.closingBalance;
          found = true;

          console.log("📦 (ELSE) Opening taken from:", key, "→", opening);

          break;
        }

      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    /* 🔥 FINAL FALLBACK (VERY IMPORTANT) */
    if(!found){
      console.warn("⚠ fallback → using last known closing");

      opening = num(currentLedger?.closingBalance || 0);
    }

    console.log("🧠 FINAL OPENING USED (ELSE):", opening);

    currentLedger = {
      ...emptyLedger(opening),
      ...data
    };

  } else {

    /* ✅ NORMAL CASE */
    currentLedger = {
      ...emptyLedger(data.openingBalance),
      ...data
    };

  }

}


/* ===============================
   FINAL CALCULATIONS
=============================== */

calculateLedger();

updateCloseButtonState();

window.dispatchEvent(new Event("ledger-ready"));

console.log("📒 Ledger ready:",today);

}
/* ===========================================================
SAFE LEDGER UPDATE
=========================================================== */
let updateLock = false;
window.updateLedgerField = async function(field, value){
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
updateLock = true;
/* ✅ FIXED CORE BUG */
currentLedger[field] =
num(currentLedger[field]) + num(value);
calculateLedger();
const user = auth.currentUser;
if(!user){
updateLock = false;
return;
}
const ref =
db.collection("users")
.doc(user.uid)
.collection("ledger")
.doc(currentDateKey);
try{
/* ✅ IMPORTANT — field also save చేయాలి */
calculateLedger(); // 🔥 ensure latest values

const payload = {
  ...currentLedger,
  closingBalance: num(currentLedger.closingBalance),
  netFlow: num(currentLedger.netFlow),
  updatedAt: Date.now()
};
delete payload.salesList;
delete payload.servicesList;
delete payload.expensesList;

await ref.set(payload, { merge: true });
}
catch(err){
console.error("Ledger update failed",err);
}
updateLock = false;
window.dispatchEvent(new Event("ledger-updated"));
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
calculateLedger();
const closingBalance = num(currentLedger.closingBalance); // ✅ safety
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
/* ================= NEXT DAY ================= */
const parts = currentDateKey.split("-");
const nextDate = new Date(parts[0], parts[1]-1, parts[2]);
nextDate.setDate(nextDate.getDate() + 1);
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
await nextRef.set(emptyLedger(closingBalance)); // ✅ carry forward safe
}
/* ✅ LOCAL UPDATE (IMPORTANT) */
currentLedger.isClosed = true;
updateCloseButtonState();
alert("Ledger closed successfully");
window.dispatchEvent(new Event("ledger-updated"));
};
/* ===========================================================
DAILY LEDGER DATA BUILDER (FIXED)
=========================================================== */
window.buildDailyLedgerReport = function(dateKey){

/* ✅ SAFETY ARRAYS */
const sales = (window.sales || []).filter(s => s.date === dateKey);

const services = (window.services || [])
.filter(s => s.date_in === dateKey || s.date_out === dateKey);

const expenses = (window.expenses || [])
.filter(e => e.date === dateKey);

const withdraws = (window.withdraws || [])
.filter(w => w.date === dateKey);

const collections = (window.collections || [])
.filter(c => c.date === dateKey);


/* ✅ OPTIONAL FALLBACK */
if(!sales.length && window.loadedLedgerByDate?.salesList){

  return {
    sales: window.loadedLedgerByDate.salesList || [],
    services: window.loadedLedgerByDate.servicesList || [],
    expenses: window.loadedLedgerByDate.expensesList || [],
    withdraws: window.loadedLedgerByDate.withdrawList || [],
    collections: window.loadedLedgerByDate.collectionList || []
  };

}


/* 🔥 FINAL RETURN (VERY IMPORTANT FIX) */
return { sales, services, expenses, withdraws, collections };

};

/* ===========================================================
BUILD DAILY LEDGER TEXT (FULL FINANCIAL REPORT)
=========================================================== */
window.generateDailyLedgerText = function(dateKey){
const report = buildDailyLedgerReport(dateKey)
/* 🔥 KEEP EXISTING LOGIC */
let L = window.ledgerEngine?.getCurrent?.() || {}
if(window.loadedLedgerByDate){
L = window.loadedLedgerByDate
}
let txt = ""
let salesProfitTotal = 0
let salesInvestmentTotal = 0
let serviceProfitTotal = 0
let serviceInvestmentTotal = 0
let expensesTotal = 0
let withdrawTotal = 0
txt += "📒 Shop Ledger Report\n\n"
txt += "Date: " + dateKey + "\n\n"
/* ================= SALES PROFIT ================= */
if(report.sales?.length){
txt += "🧾 SALES PROFIT\n"
report.sales.forEach(s=>{
const profit = num(s.profit)
salesProfitTotal += profit
txt += `${s.product || "Item"} Qty:${s.qty || 1} Profit:₹${profit}\n`
})
txt += `\nTotal Sales Profit: ₹${salesProfitTotal}\n\n`
}
/* ================= SALES INVESTMENT ================= */
if(report.sales?.length){
txt += "📦 SALES INVESTMENT\n"
report.sales.forEach(s=>{
const invest = num(s.investment || s.cost)
salesInvestmentTotal += invest
txt += `${s.product || "Item"} Invest:₹${invest}\n`
})
txt += `\nTotal Sales Investment: ₹${salesInvestmentTotal}\n\n`
}
/* ================= SERVICE PROFIT ================= */
if(report.services?.length){
txt += "🛠 SERVICE PROFIT\n"
report.services.forEach(j=>{
const profit = num(j.profit)
serviceProfitTotal += profit
txt += `${j.customer || j.job || "Service"} Profit:₹${profit}\n`
})
txt += `\nTotal Service Profit: ₹${serviceProfitTotal}\n\n`
}
/* ================= SERVICE INVESTMENT ================= */
if(report.services?.length){
txt += "🔧 SERVICE INVESTMENT\n"
report.services.forEach(j=>{
const invest = num(j.investment || j.cost)
serviceInvestmentTotal += invest
txt += `${j.customer || j.job || "Service"} Invest:₹${invest}\n`
})
txt += `\nTotal Service Investment: ₹${serviceInvestmentTotal}\n\n`
}
/* ================= EXPENSES ================= */
if(report.expenses?.length){
txt += "💸 EXPENSES\n"
report.expenses.forEach(e=>{
const amt = num(e.amount)
expensesTotal += amt
txt += `${e.note || "Expense"} ₹${amt}\n`
})
txt += `\nTotal Expenses: ₹${expensesTotal}\n\n`
}
/* ================= WITHDRAW ================= */
let salesW = num(L.salesProfitWithdraw)
let serviceW = num(L.serviceProfitWithdraw)
let stockW = num(L.stockWithdrawTotal)
let serviceInvW = num(L.serviceWithdrawTotal)
let openingW = num(L.openingWithdraw)
/* 🔁 FALLBACK */
if(
!salesW &&
!serviceW &&
!stockW &&
!serviceInvW &&
!openingW
){
(report.withdraws || []).forEach(w=>{
const type = (w.type || "").toLowerCase()
if(type==="sales-profit") salesW += num(w.amount)
else if(type==="service-profit") serviceW += num(w.amount)
else if(type==="stock") stockW += num(w.amount)
else if(type==="service") serviceInvW += num(w.amount)
else if(type==="opening") openingW += num(w.amount)
})
}
withdrawTotal =
salesW +
serviceW +
stockW +
serviceInvW +
openingW
if(withdrawTotal){
txt += "💰 WITHDRAW\n"
if(salesW)
txt += `Sales Profit Withdraw: ₹${salesW}\n`
if(serviceW)
txt += `Service Profit Withdraw: ₹${serviceW}\n`
if(stockW)
txt += `Stock Investment Withdraw: ₹${stockW}\n`
if(serviceInvW)
txt += `Service Investment Withdraw: ₹${serviceInvW}\n`
if(openingW)
txt += `Opening Withdraw: ₹${openingW}\n`
txt += `\nTotal Withdraw: ₹${withdrawTotal}\n\n`
}
/* ================= GST ================= */
let gstCollected = num(L.gstCollected)
let gstPaid = num(L.gstPaid)
if(!gstCollected){
(report.collections || []).forEach(c=>{
gstCollected += num(c.gst || 0)
})
}
if(!gstPaid){
(report.withdraws || []).forEach(w=>{
if((w.type||"")==="gst"){
gstPaid += num(w.amount)
}
})
}
if(gstCollected || gstPaid){
txt += "🧾 GST\n"
txt += `GST Collected: ₹${gstCollected}\n`
txt += `GST Paid: ₹${gstPaid}\n\n`
}
/* ================= FINAL SUMMARY ================= */
txt += "--------------------------------\n\n"
txt += `Total Sales Profit: ₹${salesProfitTotal}\n`
txt += `Total Service Profit: ₹${serviceProfitTotal}\n`
txt += `Total Expenses: ₹${expensesTotal}\n`
txt += `Total Withdraw: ₹${withdrawTotal}\n\n`
const netProfit =
(salesProfitTotal + serviceProfitTotal)
- expensesTotal
- withdrawTotal
txt += `Net Profit: ₹${netProfit}\n\n`
/* ================= COUNTER BALANCE ================= */
const ledgerDoc = L
const opening = num(ledgerDoc.openingBalance)
const closing = num(ledgerDoc.closingBalance)
txt += "--------------------------------\n\n"
txt += `Opening Balance: ₹${opening}\n`
txt += `Closing Balance: ₹${closing}\n\n`
txt += `Counter Balance: ₹${closing}\n`
return txt
}
/* ===========================================================
DOWNLOAD CSV
=========================================================== */
window.downloadLedgerCSV = function(dateKey){
const report = buildDailyLedgerReport(dateKey);
let rows = [["TYPE","DETAIL","AMOUNT"]];
/* 🔥 SAFE FALLBACK VALUES */
report.sales.forEach(s=>{
rows.push([
"SALE",
s.product || "Item",
num(s.total || s.price || 0)
]);
});
report.services.forEach(j=>{
rows.push([
"SERVICE",
j.customer || j.job || "Service",
num(j.paid || j.amount || 0)
]);
});
report.expenses.forEach(e=>{
rows.push([
"EXPENSE",
e.note || "Expense",
num(e.amount)
]);
});
report.withdraws.forEach(w=>{
rows.push([
"WITHDRAW",
w.note || w.type || "Withdraw",
num(w.amount)
]);
});
let csv = rows.map(r=>r.join(",")).join("\n");
const blob = new Blob([csv],{type:"text/csv"});
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "ledger-" + dateKey + ".csv";
a.click();
URL.revokeObjectURL(url);
};
/* ===========================================================
DOWNLOAD TEXT REPORT
=========================================================== */
window.downloadLedgerReport = function(dateKey){
const txt = generateDailyLedgerText(dateKey);
const blob = new Blob([txt],{type:"text/plain"});
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "ledger-" + dateKey + ".txt";
a.click();
URL.revokeObjectURL(url);
};
/* ===========================================================
WHATSAPP SHARE
=========================================================== */
window.shareLedgerWhatsApp = function(dateKey){
const txt = generateDailyLedgerText(dateKey);
const url = "https://wa.me/?text=" + encodeURIComponent(txt);
window.open(url,"_blank");
};
/* ===========================================================
LEDGER VIEW BUILDER
=========================================================== */
window.renderDailyLedger = function(dateKey){
const box = document.getElementById("dailyLedgerBox");
if(!box) return;
const txt = generateDailyLedgerText(dateKey);
/* ✅ FIX: template string + safe render */
box.innerHTML =
`<pre style="white-space:pre-wrap;font-size:13px">${txt}</pre>`;
};
/* ===========================================================
AUTO DATE LOAD
=========================================================== */
window.loadTodayLedger = function(){
/* ✅ BETTER: use ledger date (not system date) */
const today = currentDateKey || new Date().toISOString().slice(0,10);
renderDailyLedger(today);
};
/* ===========================================================
PUBLIC API
=========================================================== */
window.ledgerEngine = {
getCurrent: () => currentLedger,
getDateKey: () => currentDateKey,
refresh: ensureTodayLedger
};
/* ===========================================================
AUTO LOAD LEDGER
=========================================================== */
auth.onAuthStateChanged(user=>{
if(user){
setTimeout(()=>{
ensureTodayLedger();
},200);
}
});
console.log("%c📒 Ledger Engine READY ✔","color:#673ab7;font-weight:bold;");
})();
