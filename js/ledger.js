/* ===========================================================
   ledger.js — DAILY LEDGER ENGINE v1
   SINGLE SOURCE OF TRUTH
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
      lastUpdated: Date.now()
    };

    await ref.set(newLedger);
    window.currentLedger = newLedger;

  }else{
    window.currentLedger = snap.data();
  }

  window.currentLedgerDate = date;

  window.dispatchEvent(new Event("ledger-loaded"));
}

/* ===========================================================
   UPDATE FIELD
=========================================================== */
async function updateLedgerField(field, amount){

  if(!window.currentLedger) return;

  if(window.currentLedger.isClosed){
    alert("Ledger closed for this date.");
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
   CLOSE DAY
=========================================================== */
async function closeLedgerDay(){

  if(!window.currentLedger) return;

  window.currentLedger.isClosed = true;
  await saveLedger();

  alert("Day Closed Successfully");
}

/* ===========================================================
   CARRY FORWARD
=========================================================== */
async function carryForwardNextDay(){

  const nextDate = new Date(window.currentLedgerDate);
  nextDate.setDate(nextDate.getDate()+1);

  const next = nextDate.toISOString().slice(0,10);

  await loadLedger(next);

  window.currentLedger.openingBalance =
    window.currentLedger.closingBalance;

  await saveLedger();
}

/* ===========================================================
   EXPORT
=========================================================== */
window.loadLedger          = loadLedger;
window.updateLedgerField   = updateLedgerField;
window.closeLedgerDay      = closeLedgerDay;
window.carryForwardNextDay = carryForwardNextDay;

})();
