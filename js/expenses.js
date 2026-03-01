/* ===========================================================
   expenses.js — LEDGER DIRECT v22
   PURE DAILY LEDGER MODEL
   ✔ Add → Ledger +
   ✔ Delete → Ledger −
   ✔ No Settle
   ✔ No Clear All
   ✔ Daily Close Safe
=========================================================== */

(function () {

/* ---------------- HELPERS ---------------- */

const qs  = s => document.querySelector(s);
const num = v => isNaN(v = Number(v)) ? 0 : v;
const esc = v => (v == null ? "" : String(v));

const today = () => new Date().toISOString().slice(0, 10);

const toInternal = window.toInternalIfNeeded || (d => d);
const toDisplay  = window.toDisplay || (d => d);


/* ---------------- GLOBAL ---------------- */

window.expenses = window.expenses || [];


/* ---------------- CLOUD SAVE ---------------- */

function saveExpenses(){
  cloudSaveDebounced?.("expenses", window.expenses);
  window.dispatchEvent(new Event("expenses-updated"));
  window.dispatchEvent(new Event("cloud-data-loaded"));
}


/* ===========================================================
   ➕ ADD EXPENSE (LEDGER +)
=========================================================== */

function addExpenseEntry(){

  let date = qs("#expDate")?.value || today();
  const category = qs("#expCat")?.value?.trim();
  const amount   = num(qs("#expAmount")?.value);
  const note     = qs("#expNote")?.value?.trim();

  if (!category || amount <= 0)
    return alert("Enter valid expense");

  date = toInternal(date);

  const entry = {
    id: uid("exp"),
    date,
    category,
    amount,
    note
  };

  window.expenses.push(entry);

  /* 🔥 LEDGER UPDATE */
  if (typeof updateLedgerField === "function") {
    updateLedgerField("expenses", amount);
  }

  saveExpenses();
  renderExpenses();
  syncAll();

  if(qs("#expAmount")) qs("#expAmount").value="";
  if(qs("#expNote"))   qs("#expNote").value="";
}

window.addExpenseEntry = addExpenseEntry;


/* ===========================================================
   🗑 DELETE EXPENSE (LEDGER −)
=========================================================== */

function deleteExpense(id){

  const exp = window.expenses.find(e=>e.id===id);
  if(!exp) return;

  if(!confirm(`Delete expense ₹${exp.amount}?\nThis will be added back to profit.`))
    return;

  /* 🔥 REVERSE LEDGER */
  if (typeof updateLedgerField === "function") {
    updateLedgerField("expenses", -num(exp.amount));
  }

  window.expenses =
    window.expenses.filter(e=>e.id!==id);

  saveExpenses();
  renderExpenses();
  syncAll();

  alert("Expense removed. Amount added back to profit.");
}

window.deleteExpense = deleteExpense;


/* ===========================================================
   🔒 DAILY CLOSE CLEAR (AUTO CALL FROM LEDGER)
   This should be triggered when account closes
=========================================================== */

window.clearExpensesAfterClose = function(){

  if(!window.expenses.length) return;

  window.expenses = [];

  saveExpenses();
  renderExpenses();
};


/* ===========================================================
   🧾 RENDER
=========================================================== */

function renderExpenses(){

  const tbody   = qs("#expensesTable tbody");
  const totalBox = qs("#expTotal");

  if(!tbody) return;

  let total=0;

  tbody.innerHTML =
    window.expenses.map(e=>{

      total += num(e.amount);

      return `
      <tr>
        <td>${toDisplay(e.date)}</td>
        <td>${esc(e.category)}</td>
        <td>₹${e.amount}</td>
        <td>${esc(e.note||"-")}</td>
        <td>
          <button
            onclick="deleteExpense('${e.id}')"
            class="small-btn"
            style="background:#d32f2f;color:#fff;">
            Delete
          </button>
        </td>
      </tr>`;
    }).join("");

  if(totalBox)
    totalBox.textContent = total;
}

window.renderExpenses = renderExpenses;


/* ---------------- SYNC ---------------- */

function syncAll(){
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}


/* ===========================================================
   BUTTON SAFE BIND
=========================================================== */

const addBtn = qs("#addExpenseBtn");
if(addBtn && !addBtn.__bound){
  addBtn.addEventListener("click", addExpenseEntry);
  addBtn.__bound = true;
}


/* ===========================================================
   CLOUD SYNC LOAD
=========================================================== */

window.addEventListener("cloud-data-loaded",()=>{
  if(!Array.isArray(window.expenses))
    window.expenses=[];
  renderExpenses();
});


/* ===========================================================
   SAFE INITIAL LOAD
=========================================================== */

window.addEventListener("load",()=>{

  const init=()=>{
    if(!Array.isArray(window.expenses))
      window.expenses=[];
    renderExpenses();
  };

  init();
  setTimeout(init,500);
});

})();
