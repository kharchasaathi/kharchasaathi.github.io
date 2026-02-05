/* ===========================================================
   expenses.js — ONLINE MODE — FINAL v13.2 FIXED

   ✔ Cancel = Profit NOT added
   ✔ OK = Profit added back
   ✔ Delete = History remove only
   ✔ Clear All = Same safe logic
   ✔ Universal Bar compatible
=========================================================== */


/* ===========================================================
   CLOUD + LOCAL SAVE
=========================================================== */
function saveExpensesOnline() {
  try {
    localStorage.setItem("expenses-data", JSON.stringify(window.expenses));
  } catch {}

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("expenses", window.expenses);
  }

  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => cloudPullAllIfAvailable(), 200);
  }
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
    box.innerHTML = `<b>Total: ₹<span id="expTotal">0</span></b>`;
    section.appendChild(box);
  }
}


/* ===========================================================
   ADD EXPENSE
=========================================================== */
function addExpenseEntry() {

  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value?.trim();
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value?.trim();

  if (!category || amount <= 0)
    return alert("Enter category and valid amount!");

  date = toInternalIfNeeded(date);

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  saveExpensesOnline();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateUniversalBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}


/* ===========================================================
   DELETE EXPENSE — FIXED LOGIC
=========================================================== */
function deleteExpense(id) {

  const exp = (window.expenses || []).find(e => e.id === id);
  if (!exp) return;

  const addBack = confirm(
    `Expense Amount: ₹${exp.amount}\n\nDo you want to add this amount back to Net Profit?`
  );

  /* Remove expense history */
  window.expenses = window.expenses.filter(e => e.id !== id);

  /* 🔥 KEY FIX
     Cancel → Neutralize profit increase
     OK     → Allow profit increase
  */
  if (!addBack && window.__offsets) {

    window.__offsets.net =
      Number(window.__offsets.net || 0) +
      Number(exp.amount || 0);

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced("offsets", window.__offsets);
    }
  }

  saveExpensesOnline();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateUniversalBar?.();
}
window.deleteExpense = deleteExpense;


/* ===========================================================
   CLEAR ALL — FIXED LOGIC
=========================================================== */
qs("#clearExpensesBtn")?.addEventListener("click", () => {

  if (!(window.expenses || []).length) return;

  const total = window.expenses.reduce(
    (a, e) => a + Number(e.amount || 0), 0
  );

  const addBack = confirm(
    `Total Expenses: ₹${total}\n\nDo you want to add this amount back to Net Profit?`
  );

  /* Clear history */
  window.expenses = [];

  /* 🔥 KEY FIX */
  if (!addBack && window.__offsets) {

    window.__offsets.net =
      Number(window.__offsets.net || 0) +
      total;

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced("offsets", window.__offsets);
    }
  }

  saveExpensesOnline();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateUniversalBar?.();
});


/* ===========================================================
   RENDER
=========================================================== */
function renderExpenses() {

  ensureExpenseDOM();

  const tbody = qs("#expensesTable tbody");
  const totalBox = qs("#expTotal");
  if (!tbody) return;

  let total = 0;

  tbody.innerHTML = (window.expenses || [])
    .map(e => {

      total += Number(e.amount || 0);

      return `
        <tr>
          <td data-label="Date">${toDisplay(e.date)}</td>
          <td data-label="Category">${esc(e.category)}</td>
          <td data-label="Amount">₹${esc(e.amount)}</td>
          <td data-label="Note">${esc(e.note || "-")}</td>
          <td data-label="Action">
            <button class="small-btn"
              onclick="deleteExpense('${e.id}')"
              style="background:#d32f2f;color:white;">
              🗑 Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  if (totalBox) totalBox.textContent = total || 0;
}


/* ===========================================================
   EVENTS
=========================================================== */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

window.addEventListener("load", () => {
  renderExpenses();
  updateUniversalBar?.();
});

window.renderExpenses = renderExpenses;
