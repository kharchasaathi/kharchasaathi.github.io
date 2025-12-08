/* ===========================================================
   expenses.js — FINAL AUTO-SAFE VERSION v10.1
   ✔ Works even if HTML was missing earlier
   ✔ Auto-creates #expensesTable and #expTotal if not found
   ✔ Fully compatible with core.js cloud sync
=========================================================== */


/* ===========================================================
   ENSURE REQUIRED DOM EXISTS (AUTO CREATE)
=========================================================== */
function ensureExpenseDOM() {
  let section = qs("#expenses");
  if (!section) return;  // user may hide tab

  /* ---------- Ensure EXPENSE TABLE ---------- */
  let table = qs("#expensesTable");
  if (!table) {
    table = document.createElement("table");
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

  /* ---------- Ensure TOTAL SPAN ---------- */
  let totalBox = qs("#expTotal");
  if (!totalBox) {
    const box = document.createElement("div");
    box.style.marginTop = "8px";
    box.innerHTML = `
      <b>Total: ₹<span id="expTotal">0</span></b>
    `;
    section.appendChild(box);
  }
}

/* ===========================================================
   ➕ ADD EXPENSE ENTRY
=========================================================== */
function addExpenseEntry() {
  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value?.trim();
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value?.trim();

  if (!category || amount <= 0)
    return alert("Enter category and amount!");

  date = toInternalIfNeeded(date);

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  if (window.saveExpenses) window.saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* ===========================================================
   ❌ DELETE EXPENSE ENTRY
=========================================================== */
function deleteExpense(id) {
  window.expenses = (window.expenses || []).filter(e => e.id !== id);

  if (window.saveExpenses) window.saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();
}
window.deleteExpense = deleteExpense;

/* ===========================================================
   📊 RENDER EXPENSE TABLE (AUTO DOM SAFE)
=========================================================== */
function renderExpenses() {
  ensureExpenseDOM();

  const table = qs("#expensesTable");
  const tbody = qs("#expensesTable tbody");
  const totalBox = qs("#expTotal");

  if (!tbody) return;

  const list = window.expenses || [];
  let total = 0;

  tbody.innerHTML = list
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
   🗑 CLEAR ALL EXPENSES
=========================================================== */
qs("#clearExpensesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL expenses?")) return;

  window.expenses = [];
  if (window.saveExpenses) window.saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();
});

/* ===========================================================
   ➕ ADD BUTTON
=========================================================== */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

/* ===========================================================
   🚀 INITIAL LOAD
=========================================================== */
window.addEventListener("load", () => {
  renderExpenses();
  updateUniversalBar?.();
});

window.renderExpenses = renderExpenses;
