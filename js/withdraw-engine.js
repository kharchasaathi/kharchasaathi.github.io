/* ===========================================================
   WITHDRAW ENGINE v2
   Safe Owner Cash Withdrawal System
   ✔ Profit Safety Check
   ✔ No Over Withdraw
   ✔ Firestore Ledger Update
=========================================================== */

(function(){

if(window.__withdrawEngineLoaded) return;
window.__withdrawEngineLoaded = true;

console.log("%c💰 Withdraw Engine v2 Loading...","color:#16a34a;font-weight:bold;");


/* ===========================================================
   WITHDRAW CASH
=========================================================== */
async function withdrawCash(amount){

  const user = auth.currentUser;

  if(!user){
    alert("Login required");
    return;
  }

  if(!window.ledgerEngine){
    alert("Ledger engine not ready");
    return;
  }

  const L = ledgerEngine.getCurrent();

  if(!L){
    alert("Ledger not loaded");
    return;
  }

  if(L.isClosed){
    alert("Ledger already closed for today");
    return;
  }

  amount = Number(amount);

  if(!amount || amount <= 0){
    alert("Invalid amount");
    return;
  }


  /* ===========================================================
     AVAILABLE CASH CHECK
  =========================================================== */

  const availableCash =
      Number(L.openingBalance || 0)
    + Number(L.netFlow || 0)
    - Number(L.withdrawalsTotal || 0);

  if(amount > availableCash){

    alert(
      "Not enough cash available.\n\n" +
      "Available: ₹" + Math.round(availableCash)
    );

    return;

  }


  /* ===========================================================
     UPDATE LEDGER
  =========================================================== */

  const newTotal =
    Number(L.withdrawalsTotal || 0) + amount;

  const uid = user.uid;
  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

  const newOpening =
  Number(L.openingBalance || 0) - amount;

const newOpening =
  Number(L.openingBalance || 0) - amount;

await ref.update({
  withdrawalsTotal: newTotal,
  openingBalance: newOpening,
  updatedAt: Date.now()
});


  console.log("💰 Withdrawal recorded:", amount);


  /* ===========================================================
     REFRESH LEDGER
  =========================================================== */

  await ledgerEngine.refresh();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   PROMPT WITHDRAW INPUT
=========================================================== */
async function promptWithdraw(){

  const amt = prompt("Enter withdrawal amount");

  if(!amt) return;

  await withdrawCash(Number(amt));

}


/* ===========================================================
   PUBLIC API
=========================================================== */

window.withdrawEngine = {

  withdrawCash,
  promptWithdraw

};

console.log("%c💰 Withdraw Engine READY ✔","color:#16a34a;font-weight:bold;");

})();
