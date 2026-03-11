/* ===========================================================
   EXPENSE ENGINE v1
   Business Expense Recording System
=========================================================== */

(function(){

if(window.__expenseEngineLoaded) return;
window.__expenseEngineLoaded = true;

console.log("%c💸 Expense Engine Loading...","color:#dc2626;font-weight:bold;");


/* ===========================================================
   ADD EXPENSE
=========================================================== */
async function addExpense(amount, note=""){

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
    (L.expensesTotal || 0) + amount;

  const uid = user.uid;
  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

  await ref.update({

  expensesTotal: newTotal,
  lastExpenseNote: note || "",
  updatedAt: Date.now()

});

  console.log("💸 Expense added:", amount);

  /* refresh ledger */
  await ledgerEngine.refresh();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   PROMPT EXPENSE INPUT
=========================================================== */
async function promptExpense(){

  const amt = prompt("Enter expense amount");

  if(!amt) return;

  const note = prompt("Expense note (optional)");

  await addExpense(Number(amt), note || "");

}


/* ===========================================================
   PUBLIC ACCESS
=========================================================== */

window.expenseEngine = {

  addExpense,
  promptExpense

};

console.log("%c💸 Expense Engine READY ✔","color:#dc2626;font-weight:bold;");

})();
