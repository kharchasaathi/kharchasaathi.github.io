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

  /* ===========================================================
     LEDGER SAFE UPDATE
  =========================================================== */

  if(typeof updateLedgerField === "function"){

    try{

      /* expense amount add */
      await updateLedgerField("expensesTotal", amount);

      /* expense note save */
      if(note){
        await updateLedgerField("lastExpenseNote", note);
      }

    }catch(err){

      console.error("Expense ledger update failed:",err);
      alert("Failed to record expense");

      return;

    }

  }else{

    console.warn("updateLedgerField not available");

  }

  console.log("💸 Expense added:", amount);

  /* UI refresh */
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
