/* ===========================================================
   ledger.js — DAILY LEDGER ENGINE v2 (ERP SAFE)
   ✔ Close Day = Lock + Auto Carry Forward
   ✔ No Separate Carry Forward
   ✔ Multi-Device Safe
   ✔ Single Source of Truth
=========================================================== */

(function(){

const num = v => isNaN(v = Number(v)) ? 0 : Number(v);
const today = () => new Date().toISOString().slice(0,10);

window.currentLedgerDate = today();
window.currentLedger     = null;

/* ===========================================================
   LOAD LEDGER
=========================================================== */
async function loadLedger(date){

  if(!window.__cloudReady || !window.auth?.currentUser)
    return;

  const uid = window.auth.currentUser.uid;

  const ref = db
    .collection("users")
    .doc(uid)
    .collection("ledger")
    .doc(date);

  const snap = await ref.get();

  if(!snap.exists){

    const newLedger = {
      date,
      openingBalance: 0,
      salesProfit: 0,
      serviceProfit: 0,
      salesInvestmentReturn: 0,
      serviceInvestmentReturn: 0,
      gstCollected: 0,
      expenses: 0,
      withdrawals: 0,
      gstPaid: 0,
      closingBalance: 0,
      isClosed: false,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    await ref.set(newLedger);
    window.currentLedger = newLedger;

  }else{
    window.currentLedger = snap.data();
  }

  window.currentLedgerDate = date;

  recalculateClosingBalance();
  window.dispatchEvent(new Event("ledger-loaded"));
}

/* ===========================================================
   UPDATE FIELD
=========================================================== */
async function updateLedgerField(field, amount){

  if(!window.currentLedger) return;

  if(window.currentLedger.isClosed){
    alert("⚠ Ledger already closed for this date.");
    return;
  }

  const value = num(window.currentLedger[field]) + num(amount);

  window.currentLedger[field] = value;

  recalculateClosingBalance();
  await saveLedger();
}

/* ===========================================================
   RECALCULATE CLOSING
=========================================================== */
function recalculateClosingBalance(){

  const L = window.currentLedger;
  if(!L) return;

  const income =
      num(L.salesProfit)
    + num(L.serviceProfit)
    + num(L.salesInvestmentReturn)
    + num(L.serviceInvestmentReturn)
    + num(L.gstCollected);

  const expense =
      num(L.expenses)
    + num(L.withdrawals)
    + num(L.gstPaid);

  L.closingBalance =
    num(L.openingBalance)
    + income
    - expense;

  L.lastUpdated = Date.now();
}

/* ===========================================================
   SAVE
=========================================================== */
async function saveLedger(){

  if(!window.__cloudReady) return;

  const uid = window.auth.currentUser.uid;

  await db
    .collection("users")
    .doc(uid)
    .collection("ledger")
    .doc(window.currentLedgerDate)
    .set(window.currentLedger);

  window.dispatchEvent(new Event("ledger-updated"));
}

/* ===========================================================
   CLOSE DAY (PRO ERP MODE)
   ✔ Lock
   ✔ Auto Carry Forward
   ✔ Prevent Duplicate
=========================================================== */
async function closeLedgerDay(){

  if(!window.currentLedger) return;

  if(window.currentLedger.isClosed){
    alert("Day already closed.");
    return;
  }

  const uid = window.auth.currentUser.uid;

  recalculateClosingBalance();

  /* 1️⃣ LOCK CURRENT DAY */
  window.currentLedger.isClosed = true;
  window.currentLedger.closedAt = Date.now();

  await saveLedger();

  /* 2️⃣ CREATE NEXT DAY */
  const nextDate = new Date(window.currentLedgerDate);
  nextDate.setDate(nextDate.getDate()+1);

  const next = nextDate.toISOString().slice(0,10);

  const nextRef = db
    .collection("users")
    .doc(uid)
    .collection("ledger")
    .doc(next);

  const nextSnap = await nextRef.get();

  /* 3️⃣ Only create if NOT exists */
  if(!nextSnap.exists){

    const nextLedger = {
      date: next,
      openingBalance: num(window.currentLedger.closingBalance),
      salesProfit: 0,
      serviceProfit: 0,
      salesInvestmentReturn: 0,
      serviceInvestmentReturn: 0,
      gstCollected: 0,
      expenses: 0,
      withdrawals: 0,
      gstPaid: 0,
      closingBalance: num(window.currentLedger.closingBalance),
      isClosed: false,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      carriedForwardFrom: window.currentLedgerDate
    };

    await nextRef.set(nextLedger);
  }

  alert("✅ Day Closed & Balance Carried Forward");
}

/* ===========================================================
   EXPORT
=========================================================== */
window.loadLedger        = loadLedger;
window.updateLedgerField = updateLedgerField;
window.closeLedgerDay    = closeLedgerDay;

})();
