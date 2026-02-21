/* ===========================================================
   expenses.js — COMMERCIAL REBUILD v16
   DASHBOARD v31 + OFFSET UNIFIED + LEDGER SAFE

   ✔ Unified __offsets system
   ✔ Settlement isolated
   ✔ Negative offset guard
   ✔ Cloud race safe
   ✔ Multi-device safe
   ✔ Analytics v31 aligned
=========================================================== */

(function () {

  /* ===========================================================
     HELPERS (SAFE LOCAL)
  =========================================================== */

  const qs  = s => document.querySelector(s);
  const num = v => isNaN(v = Number(v)) ? 0 : v;
  const esc = v => (v == null ? "" : String(v));
  const today =
    () => new Date().toISOString().slice(0, 10);

  const toInternal =
    window.toInternalIfNeeded || (d => d);

  const toDisplay =
    window.toDisplay || (d => d);


  /* ===========================================================
     ENSURE GLOBAL STRUCTURES
  =========================================================== */

  window.expenses = window.expenses || [];
  window.__offsets = window.__offsets || {
    net: 0,
    sale: 0,
    service: 0,
    expenses: 0
  };


  /* ===========================================================
     CLOUD SAVE (SAFE)
  =========================================================== */

  function saveExpenses() {

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced(
        "expenses",
        window.expenses
      );
    }

    window.dispatchEvent(
      new Event("expenses-updated")
    );

    window.dispatchEvent(
      new Event("cloud-data-loaded")
    );
  }


  /* ===========================================================
     OFFSET SAVE (UNIFIED + RACE SAFE)
  =========================================================== */

  async function saveOffsetsSafe() {

    if (window.__offsetSaveLock) return;

    window.__offsetSaveLock = true;

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced(
        "offsets",
        window.__offsets
      );
    }

    setTimeout(() => {
      window.__offsetSaveLock = false;
    }, 600);
  }


  /* ===========================================================
     ADD EXPENSE
  =========================================================== */

  function addExpenseEntry() {

    let date =
      qs("#expDate")?.value || today();

    const category =
      qs("#expCat")?.value?.trim();

    const amount =
      num(qs("#expAmount")?.value);

    const note =
      qs("#expNote")?.value?.trim();

    if (!category || amount <= 0)
      return alert("Enter category and valid amount!");

    date = toInternal(date);

    window.expenses.push({
      id: uid("exp"),
      date,
      category,
      amount,
      note
    });

    saveExpenses();

    renderExpenses();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();

    if (qs("#expAmount")) qs("#expAmount").value = "";
    if (qs("#expNote")) qs("#expNote").value = "";
  }


  /* ===========================================================
     DELETE EXPENSE (SETTLEMENT SAFE)
  =========================================================== */

  function deleteExpense(id) {

    const exp =
      window.expenses.find(e => e.id === id);

    if (!exp) return;

    const addBack = confirm(
      `Expense Amount: ₹${exp.amount}\n\nAdd back to Profit?`
    );

    window.expenses =
      window.expenses.filter(
        e => e.id !== id
      );

    /* Settlement reversal */
    if (addBack) {

      window.__offsets.expenses =
        Math.max(
          0,
          num(window.__offsets.expenses)
          - num(exp.amount)
        );

      saveOffsetsSafe();
    }

    saveExpenses();

    renderExpenses();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
  }

  window.deleteExpense = deleteExpense;


  /* ===========================================================
     CLEAR ALL (SETTLEMENT SAFE)
  =========================================================== */

  function clearAllExpenses() {

    if (!window.expenses.length)
      return;

    const total =
      window.expenses.reduce(
        (a, e) => a + num(e.amount),
        0
      );

    const addBack = confirm(
      `Total Expenses: ₹${total}\n\nAdd back to Profit?`
    );

    window.expenses = [];

    if (addBack) {

      window.__offsets.expenses =
        Math.max(
          0,
          num(window.__offsets.expenses)
          - total
        );

      saveOffsetsSafe();
    }

    saveExpenses();

    renderExpenses();
    window.renderAnalytics?.();
    window.updateSummaryCards?.();
    window.updateUniversalBar?.();
  }


  /* ===========================================================
     RENDER ENGINE
  =========================================================== */

  function renderExpenses() {

    const tbody =
      qs("#expensesTable tbody");

    const totalBox =
      qs("#expTotal");

    if (!tbody) return;

    let total = 0;

    tbody.innerHTML =
      window.expenses.map(e => {

        total += num(e.amount);

        return `
          <tr>
            <td>${toDisplay(e.date)}</td>
            <td>${esc(e.category)}</td>
            <td>₹${esc(e.amount)}</td>
            <td>${esc(e.note || "-")}</td>
            <td>
              <button
                class="small-btn"
                onclick="deleteExpense('${e.id}')"
                style="background:#d32f2f;color:white;">
                🗑 Delete
              </button>
            </td>
          </tr>
        `;
      }).join("");

    if (totalBox)
      totalBox.textContent = total;
  }
   /* ===========================================================
     BUTTON EVENTS (SAFE BIND)
  =========================================================== */

  const addBtn = qs("#addExpenseBtn");
  if (addBtn && !addBtn.__bound) {
    addBtn.addEventListener("click", addExpenseEntry);
    addBtn.__bound = true;
  }

  const clearBtn = qs("#clearExpensesBtn");
  if (clearBtn && !clearBtn.__bound) {
    clearBtn.addEventListener("click", clearAllExpenses);
    clearBtn.__bound = true;
  }


  /* ===========================================================
     CLOUD SYNC (SAFE)
  =========================================================== */

  window.addEventListener(
    "cloud-data-loaded",
    () => {

      if (!Array.isArray(window.expenses))
        window.expenses = [];

      renderExpenses();
      window.updateUniversalBar?.();
    }
  );


  /* ===========================================================
     SAFE INITIAL LOAD
  =========================================================== */

  window.addEventListener("load", () => {

    const safeInit = () => {

      if (!Array.isArray(window.expenses))
        window.expenses = [];

      renderExpenses();
      window.updateUniversalBar?.();
    };

    safeInit();
    setTimeout(safeInit, 500);
  });


  /* ===========================================================
     EXPORTS
  =========================================================== */

  window.renderExpenses   = renderExpenses;
  window.addExpenseEntry  = addExpenseEntry;
  window.clearAllExpenses = clearAllExpenses;

})();
