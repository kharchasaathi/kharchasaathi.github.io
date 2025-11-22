/* ===========================================================
   🛠 service.js — Service / Repair Manager (FINAL v9.1 FIXED)
   Fully compatible with your HTML structure
   - NO duplicate qs()
   - window.renderServiceTables is exported
=========================================================== */

/* ---------------------------------------------
   ADD SERVICE JOB
---------------------------------------------- */
function addServiceJob() {
  const date_in   = qs("#svcReceivedDate")?.value || todayDate();
  const customer  = qs("#svcCustomer")?.value.trim();
  const phone     = qs("#svcPhone")?.value.trim();
  const item      = qs("#svcItemType")?.value;
  const model     = qs("#svcModel")?.value.trim();
  const problem   = qs("#svcProblem")?.value.trim();
  const advance   = Number(qs("#svcAdvance")?.value || 0);

  if (!customer || !phone || !item || !model || !problem) {
    alert("Please fill all fields.");
    return;
  }

  window.services = window.services || [];
  window.services.push({
    id: uid("svc"),
    date_in,
    customer,
    phone,
    item,
    model,
    problem,
    advance,
    status: "Pending",
    date_out: "",
    invest: 0,
    paid: 0,
    profit: 0
  });

  saveServices();
  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();

  qs("#svcCustomer").value = "";
  qs("#svcPhone").value = "";
  qs("#svcModel").value = "";
  qs("#svcProblem").value = "";
  qs("#svcAdvance").value = "";
}

window.addServiceJob = addServiceJob;

/* ---------------------------------------------
   COMPLETE SERVICE JOB
---------------------------------------------- */
function completeService(id) {
  const j = (window.services || []).find(s => s.id === id);
  if (!j) return;

  const invest = Number(prompt("Parts / Investment Amount ₹:", j.invest || 0) || 0);
  const paid   = Number(prompt("Total Amount Received ₹:", j.paid || 0) || 0);

  j.invest = invest;
  j.paid   = paid;
  j.profit = paid - invest - Number(j.advance || 0);
  j.date_out = todayDate();
  j.status = "Completed";

  saveServices();
  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

window.completeService = completeService;

/* ---------------------------------------------
   DELETE SERVICE JOB
---------------------------------------------- */
function deleteService(id) {
  if (!confirm("Delete this service record?")) return;

  window.services = (window.services || []).filter(s => s.id !== id);
  saveServices();
  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

window.deleteService = deleteService;

/* ---------------------------------------------
   RENDER SERVICE TABLES
---------------------------------------------- */
function renderServiceTables() {
  const tbody = qs("#svcTable tbody");
  const hist  = qs("#svcHistoryTable tbody");

  if (!tbody || !hist) return;

  const list = window.services || [];
  let pending = "";
  let completed = "";
  let pendingCount = 0;
  let compCount = 0;
  let totalProfit = 0;

  list.forEach(s => {
    if (s.status === "Pending") {
      pending += `
        <tr>
          <td>${s.id}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${s.customer}</td>
          <td>${s.phone}</td>
          <td>${s.item}</td>
          <td>${s.model}</td>
          <td>${s.problem}</td>
          <td>${s.status}</td>
          <td>
            <button onclick="completeService('${s.id}')">✔ Done</button>
            <button onclick="deleteService('${s.id}')">🗑</button>
          </td>
        </tr>`;
      pendingCount++;
    } else {
      completed += `
        <tr>
          <td>${s.id}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${toDisplay(s.date_out)}</td>
          <td>${s.customer}</td>
          <td>${s.item}</td>
          <td>₹${s.invest}</td>
          <td>₹${s.paid}</td>
          <td>₹${s.profit}</td>
          <td>${s.status}</td>
        </tr>`;
      compCount++;
      totalProfit += Number(s.profit || 0);
    }
  });

  tbody.innerHTML = pending || `<tr><td colspan="9">No pending jobs</td></tr>`;
  hist.innerHTML  = completed || `<tr><td colspan="9">No completed jobs</td></tr>`;

  qs("#svcPendingCount").textContent   = pendingCount;
  qs("#svcCompletedCount").textContent = compCount;
  qs("#svcTotalProfit").textContent    = "₹" + totalProfit;
}

window.renderServiceTables = renderServiceTables;

/* ---------------------------------------------
   INITIAL LOAD
---------------------------------------------- */
window.addEventListener("load", () => {
  renderServiceTables();
});
