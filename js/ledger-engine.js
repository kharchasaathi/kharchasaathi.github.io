/* ===========================================================
   LEDGER ENGINE v1 — FOUNDATION
   Daily Financial Container System
=========================================================== */

(function(){

if(window.__ledgerEngineLoaded) return;
window.__ledgerEngineLoaded = true;

console.log("%c📒 Ledger Engine Loading...","color:#673ab7;font-weight:bold;");

let currentLedger = null;
let currentDateKey = null;

/* ===========================================================
   UTIL — DATE KEY (YYYY-MM-DD)
=========================================================== */
function getTodayKey(){
  const d = new Date();
  return d.getFullYear() + "-" +
         String(d.getMonth()+1).padStart(2,"0") + "-" +
         String(d.getDate()).padStart(2,"0");
}

/* ===========================================================
   CREATE EMPTY LEDGER STRUCTURE
=========================================================== */
function emptyLedger(opening = 0){
  return {
    openingBalance: opening,

    salesProfit: 0,
    serviceProfit: 0,

    salesInvestmentReturn: 0,
    serviceInvestmentReturn: 0,

    expensesTotal: 0,
    withdrawalsTotal: 0,
    gstPayable: 0,

    netFlow: 0,
    closingBalance: 0,

    isClosed: false,
    closedAt: null,

    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/* ===========================================================
   ENSURE TODAY LEDGER EXISTS
=========================================================== */
async function ensureTodayLedger(){

  if(!auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const today = getTodayKey();
  currentDateKey = today;

  const ref = db
    .collection("users")
    .doc(uid)
    .collection("ledger")
    .doc(today);

  const snap = await ref.get();

  if(!snap.exists){

    console.log("📦 Creating new ledger for", today);

    let opening = 0;

    // get yesterday closing
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yKey =
      yesterday.getFullYear() + "-" +
      String(yesterday.getMonth()+1).padStart(2,"0") + "-" +
      String(yesterday.getDate()).padStart(2,"0");

    const ySnap = await db
      .collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(yKey)
      .get();

    if(ySnap.exists){
      const yData = ySnap.data();
      opening = yData.closingBalance || 0;
    }

    await ref.set(emptyLedger(opening));
    currentLedger = emptyLedger(opening);

  }else{
    currentLedger = snap.data();
  }

  calculateNetFlow();

  window.dispatchEvent(new Event("ledger-ready"));
}

/* ===========================================================
   CALCULATE NET FLOW
=========================================================== */
function calculateNetFlow(){

  if(!currentLedger) return;

  const income =
    currentLedger.salesProfit +
    currentLedger.serviceProfit +
    currentLedger.salesInvestmentReturn +
    currentLedger.serviceInvestmentReturn;

  const expense =
    currentLedger.expensesTotal +
    currentLedger.withdrawalsTotal +
    currentLedger.gstPayable;

  currentLedger.netFlow = income - expense;
}

/* ===========================================================
   PUBLIC ACCESS
=========================================================== */
window.ledgerEngine = {

  getCurrent: ()=> currentLedger,
  getDateKey: ()=> currentDateKey,

  refresh: ensureTodayLedger

};

console.log("%c📒 Ledger Engine READY ✔","color:#673ab7;font-weight:bold;");

})();
