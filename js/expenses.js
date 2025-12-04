/* expenses.js — FINAL v9.1 (esc fix + full core.js compatibility) */
(function(){
  const qsLocal = s => document.querySelector(s);

  // FIX: missing esc()
  const esc = x => window.esc ? window.esc(x) : String(x || "");

  function renderExpenses(){
    const tbody = qsLocal("#expensesTable tbody"); 
    if(!tbody) return;

    const list = Array.isArray(window.expenses) ? window.expenses : [];
    let total = 0;

    if(!list.length){
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;">No expenses</td></tr>`;
      if(qsLocal("#expTotal")) qsLocal("#expTotal").textContent = 0;
      return;
    }

    tbody.innerHTML = list.map(e=>{
      total += Number(e.amount||0);
      return `
        <tr>
          <td data-label="Date">${window.toDisplay ? window.toDisplay(e.date) : e.date}</td>
          <td data-label="Category">${esc(e.category)}</td>
          <td data-label="Amount">₹${Number(e.amount||0)}</td>
          <td data-label="Note">${esc(e.note||"-")}</td>
          <td data-label="Action">
            <button class="small-btn" onclick="deleteExpense('${e.id}')" style="background:#d32f2f;color:#fff;">🗑 Delete</button>
          </td>
        </tr>`;
    }).join("");

    if(qsLocal("#expTotal")) qsLocal("#expTotal").textContent = total;
  }

  window.addExpenseEntry = function(){
    const date = qsLocal("#expDate")?.value || (window.todayDate ? window.todayDate() : new Date().toISOString().split("T")[0]);
    const category = (qsLocal("#expCat")?.value || "").trim();
    const amount = Number(qsLocal("#expAmount")?.value || 0);
    const note = (qsLocal("#expNote")?.value || "").trim();

    if(!category || amount <= 0) return alert("Enter category and amount!");

    const row = {
      id: window.uid ? window.uid("exp") : "exp_" + Math.random().toString(36).slice(2,9),
      date: window.toInternalIfNeeded ? window.toInternalIfNeeded(date) : date,
      category,
      amount,
      note
    };

    window.expenses = Array.isArray(window.expenses) ? window.expenses : [];
    window.expenses.push(row);

    if(typeof window.saveExpenses === "function") window.saveExpenses();
    else try { localStorage.setItem("expenses-data", JSON.stringify(window.expenses)); } catch {}

    try{ renderExpenses(); }catch{}
    try{ renderAnalytics?.(); }catch{}
    try{ updateSummaryCards?.(); }catch{}
    try{ updateTabSummaryBar?.(); }catch{}
    try{ window.updateUniversalBar?.(); }catch{}

    qsLocal("#expAmount").value = "";
    qsLocal("#expNote").value = "";
  };

  window.deleteExpense = function(id){
    window.expenses = (window.expenses || []).filter(e => e.id !== id);
    if(typeof window.saveExpenses === "function") window.saveExpenses();

    try{ renderExpenses(); }catch{}
    try{ renderAnalytics?.(); }catch{}
    try{ updateSummaryCards?.(); }catch{}
    try{ updateUniversalBar?.(); }catch{}
  };

  qsLocal("#addExpenseBtn")?.addEventListener("click", ()=> window.addExpenseEntry());

  qsLocal("#clearExpensesBtn")?.addEventListener("click", ()=>{
    if(!confirm("Clear ALL expenses?")) return;
    window.expenses = [];
    if(typeof window.saveExpenses === "function") window.saveExpenses();
    renderExpenses();
    try{ renderAnalytics?.(); }catch{}
    try{ updateSummaryCards?.(); }catch{}
  });

  window.addEventListener("load", ()=>{
    renderExpenses();
    try{ window.updateUniversalBar?.(); }catch{}
  });

  window.renderExpenses = renderExpenses;

})();
