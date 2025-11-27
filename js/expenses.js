/* ===========================================================
   expenses.js — FINAL V8.0 (Colorful UI + Mobile Labels + Perfect Sync)
   • Matches new global colourful table UI
   • Mobile-friendly: data-label support
   • Add/Delete smooth
   • Auto updates: Overview, Dashboard, Summary, TabBar
=========================================================== */

const esc = x => (x === undefined || x === null) ? "" : String(x);

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

  // Convert dd-mm-yyyy → yyyy-mm-dd
  if (date.includes("-") && date.split("-")[0].length === 2)
    date = toInternal(date);

  window.expenses = window.expenses || [];

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
  updateTabSummaryBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* -------------------------------------------------------
   ❌ DELETE EXPENSE ENTRY
------------------------------------------------------- */
function deleteExpense(id) {
  window.expenses = (window.expenses || []).filter(e => e.id !== id);
  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}
window.deleteExpense = deleteExpense;

/* -------------------------------------------------------
   📊 RENDER EXPENSE TABLE (UI UPGRADED)
------------------------------------------------------- */
function renderExpenses() {
  const tbody = qs("#expensesTable tbody");
  if (!tbody) return;

  let list = window.expenses || [];
  let total = 0;

  tbody.innerHTML = list.map(e => {
    total += Number(e.amount || 0);
    return `
      <tr>
        <td data-label="Date">${toDisplay(e.date)}</td>
        <td data-label="Category">${esc(e.category)}</td>
        <td data-label="Amount">₹${esc(e.amount)}</td>
        <td data-label="Note">${esc(e.note || "-")}</td>

        <td data-label="Action">
          <button class="btn-del small-btn" 
                  onclick="deleteExpense('${e.id}')"
                  style="background:#d32f2f;color:#fff;">
            🗑 Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");

  const totalBox = qs("#expTotal");
  if (totalBox) totalBox.textContent = total;
}

/* -------------------------------------------------------
   🗑 CLEAR ALL EXPENSES
------------------------------------------------------- */
qs("#clearExpensesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL expenses?")) return;

  window.expenses = [];
  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
});

/* -------------------------------------------------------
   ➕ ADD BUTTON
------------------------------------------------------- */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);

/* -------------------------------------------------------
   🚀 INITIAL PAGE LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
});

window.renderExpenses = renderExpenses;
