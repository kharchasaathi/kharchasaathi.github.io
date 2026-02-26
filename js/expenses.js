/* ===========================================================
   expenses.js — FINAL v19
   LEDGER SAFE + SETTLEMENT CORRECT + PROFIT LOCK SAFE
=========================================================== */

(function () {

/* ---------------- HELPERS ---------------- */

const qs  = s => document.querySelector(s);
const num = v => isNaN(v = Number(v)) ? 0 : v;
const esc = v => (v == null ? "" : String(v));

const today =
  () => new Date().toISOString().slice(0, 10);

const toInternal =
  window.toInternalIfNeeded || (d => d);

const toDisplay =
  window.toDisplay || (d => d);


/* ---------------- GLOBAL STRUCTURES ---------------- */

window.expenses = window.expenses || [];

window.__offsets = window.__offsets || {
  net: 0,
  sale: 0,
  service: 0,
  expensesLive: 0,
  expensesSettled: 0
};


/* ---------------- CLOUD SAVE ---------------- */

function saveExpenses(){

  cloudSaveDebounced?.(
    "expenses",
    window.expenses
  );

  window.dispatchEvent(
    new Event("expenses-updated")
  );

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
}


/* ---------------- OFFSET SAVE ---------------- */

async function saveOffsetsSafe(){

  if (window.__offsetSaveLock) return;

  window.__offsetSaveLock = true;

  cloudSaveDebounced?.(
    "offsets",
    window.__offsets
  );

  setTimeout(()=>{
    window.__offsetSaveLock = false;
  },600);
}


/* ===========================================================
   ➕ ADD
=========================================================== */

function addExpenseEntry(){

  let date =
    qs("#expDate")?.value || today();

  const category =
    qs("#expCat")?.value?.trim();

  const amount =
    num(qs("#expAmount")?.value);

  const note =
    qs("#expNote")?.value?.trim();

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

  /* Live offset */
  window.__offsets.expensesLive += amount;

  saveOffsetsSafe();
  saveExpenses();

  renderExpenses();
  syncAll();
}

window.addExpenseEntry = addExpenseEntry;


/* ===========================================================
   💰 SETTLE
=========================================================== */

function settleExpense(id){

  const exp =
    window.expenses.find(e=>e.id===id);

  if(!exp || exp.settled) return;

  if(!confirm(
    `Settle this expense?\n₹${exp.amount}`
  )) return;

  exp.settled = true;

  window.__offsets.expensesLive -=
    num(exp.amount);

  window.__offsets.expensesSettled +=
    num(exp.amount);

  saveOffsetsSafe();
  saveExpenses();

  renderExpenses();
  syncAll();
}

window.settleExpense = settleExpense;


/* ===========================================================
   🗑 DELETE — LEDGER SAFE
=========================================================== */

function deleteExpense(id){

  const exp =
    window.expenses.find(e=>e.id===id);

  if(!exp) return;

  if(!confirm(
    `Delete expense ₹${exp.amount}?`
  )) return;

  /* Ledger reversal */

  if(exp.settled){

    window.__offsets.expensesSettled -=
      num(exp.amount);

  }else{

    window.__offsets.expensesLive -=
      num(exp.amount);
  }

  window.expenses =
    window.expenses.filter(e=>e.id!==id);

  saveOffsetsSafe();
  saveExpenses();

  renderExpenses();
  syncAll();
}

window.deleteExpense = deleteExpense;


/* ===========================================================
   🧹 CLEAR ALL — LEDGER SAFE
=========================================================== */

function clearAllExpenses(){

  if(!window.expenses.length)
    return;

  const total =
    window.expenses.reduce(
      (a,e)=>a+num(e.amount),0
    );

  if(!confirm(
    `Clear all expenses?\nTotal ₹${total}`
  )) return;

  window.expenses.forEach(e=>{

    if(e.settled){

      window.__offsets.expensesSettled -=
        num(e.amount);

    }else{

      window.__offsets.expensesLive -=
        num(e.amount);
    }

  });

  window.expenses = [];

  saveOffsetsSafe();
  saveExpenses();

  renderExpenses();
  syncAll();
}

window.clearAllExpenses = clearAllExpenses;


/* ===========================================================
   🧾 RENDER
=========================================================== */

function renderExpenses(){

  const tbody =
    qs("#expensesTable tbody");

  const totalBox =
    qs("#expTotal");

  if(!tbody) return;

  let total=0;

  tbody.innerHTML =
    window.expenses.map(e=>{

      total+=num(e.amount);

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
   CLOUD SYNC
=========================================================== */

window.addEventListener(
  "cloud-data-loaded",
  ()=>{
    if(!Array.isArray(window.expenses))
      window.expenses=[];
    renderExpenses();
  }
);

})();
