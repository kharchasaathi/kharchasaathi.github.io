/* ===========================================================
   WITHDRAW ENGINE v1
   Owner Cash Withdrawal System
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

  const newTotal =
    (L.withdrawalsTotal || 0) + amount;

  const uid = user.uid;
  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

  await ref.update({

    withdrawalsTotal: newTotal,
    updatedAt: Date.now()

  });

  console.log("💰 Withdrawal recorded:", amount);

  /* refresh ledger */
  await ledgerEngine.refresh();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   SIMPLE PROMPT WITHDRAW
=========================================================== */
async function promptWithdraw(){

  const amt = prompt("Enter withdrawal amount");

  if(!amt) return;

  await withdrawCash(Number(amt));

}


/* ===========================================================
   PUBLIC ACCESS
=========================================================== */

window.withdrawEngine = {

  withdrawCash,
  promptWithdraw

};

console.log("%c💰 Withdraw Engine READY ✔","color:#16a34a;font-weight:bold;");

})();
