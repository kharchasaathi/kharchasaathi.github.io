/* ==========================================================
   🧾 expenses.js — Simple Expenses Manager
   Works with: core.js (saveExpenses, cloudSaveDebounced)
   ========================================================== */

const EXP_KEY = 'expenses-data';
window.expenses = JSON.parse(localStorage.getItem(EXP_KEY) || '[]');

function saveExpenses() {
  localStorage.setItem(EXP_KEY, JSON.stringify(window.expenses || []));
  window.dispatchEvent(new Event('storage'));
  cloudSaveDebounced?.('expenses', window.expenses || []);
}

function addExpense() {
  const date = qs('#expDate')?.value || todayDate();
  const category = (qs('#expCategory')?.value || '').trim() || 'misc';
  const amount = Number(qs('#expAmount')?.value || 0);
  const note = (qs('#expNote')?.value || '').trim();

  if (!amount || amount <= 0) return alert('Enter a valid amount');

  const it = { id: uid('exp'), date, category, amount, note };
  window.expenses = window.expenses || [];
  window.expenses.push(it);
  saveExpenses();
  renderExpenses();

  // clear inputs
  if (qs('#expAmount')) qs('#expAmount').value = '';
  if (qs('#expNote')) qs('#expNote').value = '';
}

function renderExpenses() {
  const tbody = qs('#expensesTable tbody');
  if (!tbody) return;

  const list = (window.expenses || []).slice().sort((a,b)=> a.date < b.date ? 1 : -1);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5">No Expenses</td></tr>`;
    updateExpensesTotal();
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr data-id="${esc(e.id)}">
      <td>${esc(e.date)}</td>
      <td>${esc(e.category)}</td>
      <td>₹${Number(e.amount || 0)}</td>
      <td>${esc(e.note || '')}</td>
      <td>
        <button class="exp-del small-btn" data-id="${esc(e.id)}">🗑️</button>
      </td>
    </tr>`).join('');

  updateExpensesTotal();
}

function updateExpensesTotal() {
  const total = (window.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  if (qs('#expensesTotal')) qs('#expensesTotal').textContent = total;
}

/* delete a single expense */
function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  window.expenses = (window.expenses || []).filter(e => e.id !== id);
  saveExpenses();
  renderExpenses();
}

/* clear all expenses */
function clearExpenses() {
  if (!confirm('Clear all expenses?')) return;
  window.expenses = [];
  saveExpenses();
  renderExpenses();
}

/* print */
function printExpenses() {
  const rows = qs('#expensesTable tbody').innerHTML;
  const html = `<html><head><title>Expenses</title>
    <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}</style>
    </head><body><h3>Expenses — ${todayDate()}</h3><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

/* events */
document.addEventListener('click', e => {
  const t = e.target;
  if (t.id === 'addExpBtn') return addExpense();
  if (t.id === 'clearExpBtn') return clearExpenses();
  if (t.id === 'printExpBtn') return printExpenses();

  if (t.classList.contains('exp-del')) return deleteExpense(t.dataset.id);
});

/* initial render */
window.addEventListener('load', () => {
  renderExpenses();
});

/* exports */
window.saveExpenses = saveExpenses;
window.renderExpenses = renderExpenses;
window.addExpense = addExpense;
