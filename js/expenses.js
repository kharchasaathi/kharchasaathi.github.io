/* ===========================================================
   expenses.js — FINAL ONLINE VERSION v9.0
   ✔ Fully compatible with core.js v4+ (cloud sync)
   ✔ Instant UI refresh (no delay)
   ✔ toDisplay(), toInternal() from core.js
   ✔ Prevents invalid date formats
   ✔ Updates: Dashboard + Summary + UniversalBar
=========================================================== */

/* -------------------------------------------------------
   ➕ ADD EXPENSE ENTRY
------------------------------------------------------- */
function addExpenseEntry() {
  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value.trim();
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value.trim();

  if (!category || amount <= 0)
    return alert("Enter category and amount!");

  // Convert DD-MM-YYYY → YYYY-MM-DD safely
  date = toInternalIfNeeded(date);

  window.expenses = window.expenses || [];

  window.expenses.push({
    id: uid("exp"),
    date,
    category,
    amount,
    note
  });

  // LOCAL + CLOUD SAVE
  if (window.saveExpenses) window.saveExpenses();

  // UI REFRESH
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
  updateUniversalBar?.();

  // Clear fields
  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* -------------------------------------------------------
   ❌ DELETE EXPENSE ENTRY
------------------------------------------------------- */
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

/* -------------------------------------------------------
   📊 RENDER EXPENSE TABLE
------------------------------------------------------- */
function renderExpenses() {
  const tbody = qs("#expensesTable tbody");
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

  const totalBox = qs("#expTotal");
  if (totalBox) totalBox.textContent = total;
}

/* -------------------------------------------------------
   🗑 CLEAR ALL EXPENSES
------------------------------------------------------- */
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

/* -------------------------------------------------------
   ➕ ADD BUTTON
------------------------------------------------------- */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

/* -------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
  updateUniversalBar?.();
});

window.renderExpenses = renderExpenses;
