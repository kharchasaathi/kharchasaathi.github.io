/* ===========================================================
   expenses.js — (FINAL v5.0)
   ✔ dd-mm-yyyy → yyyy-mm-dd auto convert
   ✔ Auto UI Refresh: Overview + Profit Bar + Smart Dashboard
   ✔ No reload required
=========================================================== */

/* -------------------------
   ADD EXPENSE ENTRY
-------------------------- */
function addExpenseEntry() {
  let date = qs("#expDate")?.value || todayDate();
  const category = qs("#expCat")?.value;
  const amount = Number(qs("#expAmount")?.value || 0);
  const note = qs("#expNote")?.value || "";

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

  // UI Refresh
  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();

  qs("#expAmount").value = "";
  qs("#expNote").value = "";
}

/* -------------------------
   RENDER EXPENSE TABLE
-------------------------- */
function renderExpenses() {
  const tbody = qs("#expensesTable tbody");
  if (!tbody) return;

  const fdate = qs("#expFilterDate")?.value || "";
  const fcat  = qs("#expFilterCat")?.value || "all";

  let list = window.expenses || [];

  if (fdate) list = list.filter(e => e.date === fdate);
  if (fcat !== "all") list = list.filter(e => e.category === fcat);

  let total = 0;

  tbody.innerHTML = list
    .map(e => {
      total += Number(e.amount || 0);
      return `
        <tr>
          <td>${toDisplay(e.date)}</td>
          <td>${e.category}</td>
          <td>₹${e.amount}</td>
          <td>${e.note || "-"}</td>
        </tr>
      `;
    })
    .join("");

  qs("#expTotal").textContent = total;
}

/* -------------------------
   CLEAR EXPENSES
-------------------------- */
qs("#clearExpensesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL expenses?")) return;

  window.expenses = [];
  saveExpenses();

  renderExpenses();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
});

/* -------------------------
   BUTTON HANDLERS
-------------------------- */
qs("#addExpenseBtn")?.addEventListener("click", addExpenseEntry);
qs("#expFilterDate")?.addEventListener("change", renderExpenses);
qs("#expFilterCat")?.addEventListener("change", renderExpenses);

/* -------------------------
   INITIAL LOAD
-------------------------- */
window.addEventListener("load", () => {
  renderExpenses();
});

window.renderExpenses = renderExpenses;
