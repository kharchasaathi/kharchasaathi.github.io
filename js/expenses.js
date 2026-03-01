/* ===========================================================
   expenses.js — LEDGER INTEGRATED v21
   PURE LEDGER MODEL (NO OFFSETS)
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
    note,
    settled:false
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
   💰 SETTLE EXPENSE (NO LEDGER CHANGE)
=========================================================== */

function settleExpense(id){

  const exp = window.expenses.find(e=>e.id===id);
  if(!exp || exp.settled) return;

  if(!confirm(`Settle this expense?\n₹${exp.amount}`)) return;

  exp.settled = true;

  saveExpenses();
  renderExpenses();
  syncAll();
}

window.settleExpense = settleExpense;


/* ===========================================================
   🗑 DELETE EXPENSE (LEDGER −)
=========================================================== */

function deleteExpense(id){

  const exp = window.expenses.find(e=>e.id===id);
  if(!exp) return;

  if(!confirm(`Delete expense ₹${exp.amount}?`)) return;

  /* 🔥 REVERSE LEDGER */
  if (typeof updateLedgerField === "function") {
    updateLedgerField("expenses", -num(exp.amount));
  }

  window.expenses =
    window.expenses.filter(e=>e.id!==id);

  saveExpenses();
  renderExpenses();
  syncAll();
}

window.deleteExpense = deleteExpense;


/* ===========================================================
   🧹 CLEAR ALL (LEDGER − TOTAL)
=========================================================== */

function clearAllExpenses(){

  if(!window.expenses.length) return;

  const total =
    window.expenses.reduce((a,e)=>a+num(e.amount),0);

  if(!confirm(`Clear all expenses?\nTotal ₹${total}`))
    return;

  /* 🔥 REVERSE TOTAL FROM LEDGER */
  if (typeof updateLedgerField === "function") {
    updateLedgerField("expenses", -total);
  }

  window.expenses = [];

  saveExpenses();
  renderExpenses();
  syncAll();
}

window.clearAllExpenses = clearAllExpenses;


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
          ${
            !e.settled
            ? `<button
                onclick="settleExpense('${e.id}')"
                class="small-btn">
                ✔ Settle
               </button>`
            : `<span style="color:#16a34a;">
                Settled
               </span>`
          }
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

const clearBtn = qs("#clearExpensesBtn");
if(clearBtn && !clearBtn.__bound){
  clearBtn.addEventListener("click", clearAllExpenses);
  clearBtn.__bound = true;
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
