/* ===========================================================
   WITHDRAW ENGINE v3
   Safe Owner Cash Withdrawal System
   ✔ Profit Safety Check
   ✔ No Over Withdraw
   ✔ Firestore Ledger Update
   ✔ NaN Protection
   ✔ Opening Balance Safety
=========================================================== */

(function(){

if(window.__withdrawEngineLoaded) return;
window.__withdrawEngineLoaded = true;

console.log("%c💰 Withdraw Engine Loading...","color:#16a34a;font-weight:bold;");


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

  const opening = Number(L.openingBalance || 0);
  const netFlow = Number(L.netFlow || 0);
  const withdrawn = Number(L.withdrawalsTotal || 0);

  const availableCash =
      opening
    + netFlow
    - withdrawn;

  if(amount > availableCash){

    alert(
      "Not enough cash available.\n\n" +
      "Available: ₹" + Math.round(availableCash)
    );

    return;

  }


  /* ===========================================================
     CALCULATE NEW VALUES
  =========================================================== */

  const newTotal =
    withdrawn + amount;

  const newOpening =
    Math.max(0, opening - amount);


  /* ===========================================================
     UPDATE LEDGER
  =========================================================== */

  const uid = user.uid;
  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

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

  const amount = Number(amt);

  if(isNaN(amount) || amount <= 0){
    alert("Invalid amount");
    return;
  }

  await withdrawCash(amount);

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
