/* ===========================================================
   GST ENGINE v1
   GST Payment Recording System
=========================================================== */

(function(){

if(window.__gstEngineLoaded) return;
window.__gstEngineLoaded = true;

console.log("%c🧾 GST Engine Loading...","color:#ea580c;font-weight:bold;");


/* ===========================================================
   PAY GST
=========================================================== */
async function payGST(amount){

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
    (L.gstPayable || 0) + amount;

  const uid = user.uid;
  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

  await ref.update({

    gstPayable: newTotal,
    updatedAt: Date.now()

  });

  console.log("🧾 GST paid:", amount);

  /* refresh ledger */
  await ledgerEngine.refresh();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   PROMPT GST PAYMENT
=========================================================== */
async function promptGST(){

  const amt = prompt("Enter GST payment amount");

  if(!amt) return;

  await payGST(Number(amt));

}


/* ===========================================================
   PUBLIC ACCESS
=========================================================== */

window.gstEngine = {

  payGST,
  promptGST

};

console.log("%c🧾 GST Engine READY ✔","color:#ea580c;font-weight:bold;");

})();
