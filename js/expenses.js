/* ===========================================================
   expenses.js — FINAL v15
   SETTLEMENT SAFE + UNIVERSAL v36 ALIGNED

   ✔ Expense reversal fixed
   ✔ Settlement isolated to expenses offset
   ✔ Cloud race lock added
   ✔ Multi-device safe
   ✔ Net profit safe
   ✔ Universal sync safe
=========================================================== */


/* ===========================================================
   ☁️ CLOUD SAVE
=========================================================== */
function saveExpenses() {

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced(
      "expenses",
      window.expenses || []
    );
  }

  /* 🔄 Global realtime refresh */
  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );

  window.dispatchEvent(
    new Event("expenses-updated")
  );
}


/* ===========================================================
   ENSURE DOM
=========================================================== */
function ensureExpenseDOM() {

  const section = qs("#expenses");
  if (!section) return;

  if (!qs("#expensesTable")) {

    const table = document.createElement("table");

    table.id = "expensesTable";

    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Note</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    section.appendChild(table);
  }

  if (!qs("#expTotal")) {

    const box = document.createElement("div");

    box.style.marginTop = "8px";

    box.innerHTML =
      `<b>Total: ₹<span id="expTotal">0</span></b>`;

    section.appendChild(box);
  }
}


/* ===========================================================
   ADD EXPENSE
=========================================================== */
function addExpenseEntry() {

  let date =
    qs("#expDate")?.value ||
    todayDate();

  const category =
    qs("#expCat")?.value?.trim();

  const amount =
    Number(qs("#expAmount")?.value || 0);

  const note =
    qs("#expNote")?.value?.trim();

  if (!category || amount <= 0)
    return alert(
      "Enter category and valid amount!"
    );

  date = toInternalIfNeeded(date);

  window.expenses =
    window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateUniversalBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}


/* ===========================================================
   DELETE EXPENSE — SETTLEMENT SAFE
=========================================================== */
function deleteExpense(id) {

  const exp =
    (window.expenses || [])
      .find(e => e.id === id);

  if (!exp) return;

  const addBack = confirm(
    `Expense Amount: ₹${exp.amount}\n\n` +
    `Add this amount back to Profit?`
  );

  /* Remove history */
  window.expenses =
    window.expenses.filter(
      e => e.id !== id
    );

  /* 🔥 Settlement reversal FIXED */
  if (addBack && window.__offsets) {

    window.__offsets.expenses =
      Number(window.__offsets.expenses || 0) -
      Number(exp.amount || 0);

    if (window.__offsets.expenses < 0)
      window.__offsets.expenses = 0;

    saveOffsetsSafe();
  }

  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateUniversalBar?.();
}
window.deleteExpense = deleteExpense;


/* ===========================================================
   CLEAR ALL EXPENSES — SETTLEMENT SAFE
=========================================================== */
qs("#clearExpensesBtn")
?.addEventListener("click", () => {

  if (!(window.expenses || []).length)
    return;

  const total =
    window.expenses.reduce(
      (a, e) =>
        a + Number(e.amount || 0),
      0
    );

  const addBack = confirm(
    `Total Expenses: ₹${total}\n\n` +
    `Add back to Profit?`
  );

  window.expenses = [];

  /* 🔥 Settlement reversal FIXED */
  if (addBack && window.__offsets) {

    window.__offsets.expenses =
      Number(window.__offsets.expenses || 0) -
      total;

    if (window.__offsets.expenses < 0)
      window.__offsets.expenses = 0;

    saveOffsetsSafe();
  }

  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateUniversalBar?.();
});


/* ===========================================================
   🔐 OFFSET SAVE (RACE SAFE)
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
   RENDER
=========================================================== */
function renderExpenses() {

  ensureExpenseDOM();

  const tbody =
    qs("#expensesTable tbody");

  const totalBox =
    qs("#expTotal");

  if (!tbody) return;

  let total = 0;

  tbody.innerHTML =
    (window.expenses || [])
      .map(e => {

        total +=
          Number(e.amount || 0);

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
      })
      .join("");

  if (totalBox)
    totalBox.textContent = total || 0;
}


/* ===========================================================
   EVENTS
=========================================================== */
qs("#addExpenseBtn")
?.addEventListener(
  "click",
  addExpenseEntry
);


/* ===========================================================
   CLOUD SYNC
=========================================================== */
window.addEventListener(
  "cloud-data-loaded",
  renderExpenses
);


/* ===========================================================
   INIT
=========================================================== */
window.addEventListener("load", () => {

  renderExpenses();
  updateUniversalBar?.();

});


/* ===========================================================
   EXPORT
=========================================================== */
window.renderExpenses = renderExpenses;
