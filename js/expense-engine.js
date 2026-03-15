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
     SAVE EXPENSE HISTORY
  =========================================================== */

  window.expenses = window.expenses || [];

  const dateInput =
    document.getElementById("expDate")?.value ||
    new Date().toISOString().slice(0,10);

  const categoryInput =
    document.getElementById("expCat")?.value || "General";

  const expenseRecord = {

    date : dateInput,
    category : categoryInput,
    amount : amount,
    note : note || ""

  };

  window.expenses.push(expenseRecord);


  /* ===========================================================
     LEDGER UPDATE
  =========================================================== */

  if(typeof updateLedgerField === "function"){

    try{

      await updateLedgerField("expensesTotal", amount);

      if(note){
        await updateLedgerField("lastExpenseNote", note);
      }

    }catch(err){

      console.error("Expense ledger update failed:", err);
      alert("Failed to record expense");
      return;

    }

  }else{

    console.warn("updateLedgerField not available");

  }


  console.log("💸 Expense added:", amount);


  /* ===========================================================
     UI REFRESH
  =========================================================== */

  renderExpenses?.();
  renderUniversalBar?.();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   RENDER EXPENSE TABLE
=========================================================== */

function renderExpenses(){

  const tbody =
    document.querySelector("#expensesTable tbody");

  const totalEl =
    document.getElementById("expTotal");

  if(!tbody) return;

  tbody.innerHTML = "";

  let total = 0;

  (window.expenses || []).forEach((e,i)=>{

    total += Number(e.amount);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${e.category}</td>
      <td>${e.amount}</td>
      <td>${e.note || ""}</td>
      <td>
        <button onclick="deleteExpense(${i})"
        style="background:#ef4444;color:white;border:none;padding:4px 8px;border-radius:6px;cursor:pointer">
        Delete
        </button>
      </td>
    `;

    tbody.appendChild(tr);

  });

  if(totalEl){
    totalEl.textContent = total;
  }

}


/* ===========================================================
   DELETE EXPENSE
=========================================================== */

window.deleteExpense = async function(index){

  const exp = window.expenses[index];

  if(!exp) return;

  const confirmDelete =
    confirm("Delete this expense?");

  if(!confirmDelete) return;

  const restoreLedger =
    confirm(
      "Restore this expense amount to ledger balance?\n\nOK = Restore balance\nCancel = Go back"
    );

  if(!restoreLedger){
    return;
  }

  /* REMOVE HISTORY */

  window.expenses.splice(index,1);


  /* FIX LEDGER (REMOVE EXPENSE) */

  try{

    if(typeof updateLedgerField === "function"){

      await updateLedgerField(
        "expensesTotal",
        -Number(exp.amount)
      );

    }

  }catch(err){

    console.error(
      "Ledger restore failed",
      err
    );

  }


  renderExpenses?.();
  renderUniversalBar?.();

};


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
