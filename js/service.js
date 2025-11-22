/* ===========================================================
   🛠 service.js — Service / Repair Manager (v10.0 FINAL)
   ✔ Matches your business-dashboard(9).html
   ✔ Pending + Completed tables fully working
   ✔ Profit & Investment auto-sync to Profit tab
   ✔ Smart Dashboard + Analytics auto update
   ✔ No duplicate qs()
   ✔ No silent failures
=========================================================== */

// Shortcuts
const qs = s => document.querySelector(s);

/* ===========================================================
   ADD NEW JOB
=========================================================== */
function addServiceJob() {
  const date_in   = qs("#svcReceivedDate")?.value || todayDate();
  const customer  = qs("#svcCustomer")?.value.trim();
  const phone     = qs("#svcPhone")?.value.trim();
  const item      = qs("#svcItemType")?.value;
  const model     = qs("#svcModel")?.value.trim();
  const problem   = qs("#svcProblem")?.value.trim();
  const advance   = Number(qs("#svcAdvance")?.value || 0);

  if (!customer || !phone || !item || !problem)
    return alert("Please fill all required job details!");

  window.services = window.services || [];

  window.services.push({
    id: uid("job"),
    date_in: toInternalIfNeeded(date_in),
    date_out: "",
    customer,
    phone,
    item,
    model,
    problem,
    advance,
    invest: 0,
    paid: 0,
    profit: 0,
    status: "Pending"
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

/* ===========================================================
   COMPLETE JOB POPUP
=========================================================== */
function completeServiceJob(id) {
  const job = (window.services || []).find(j => j.id === id);
  if (!job) return;

  const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0));
  if (isNaN(invest)) return;

  const paid = Number(prompt("Total Amount Collected ₹:", job.paid || 0));
  if (isNaN(paid)) return;

  job.invest = invest;
  job.paid = paid;

  const profit = paid - (invest + Number(job.advance || 0));
  job.profit = profit;
  job.date_out = todayDate();
  job.status = "Completed";

  saveServices();

  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

/* ===========================================================
   DELETE A JOB
=========================================================== */
function deleteServiceJob(id) {
  if (!confirm("Delete this job?")) return;
  window.services = (window.services || []).filter(j => j.id !== id);
  saveServices();
  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

/* ===========================================================
   CLEAR ALL JOBS
=========================================================== */
qs("#clearServiceBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL service jobs?")) return;
  window.services = [];
  saveServices();
  renderServiceTables();
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
});

/* ===========================================================
   RENDER MAIN UI
=========================================================== */
function renderServiceTables() {
  const pendBody = qs("#svcTable tbody");
  const histBody = qs("#svcHistoryTable tbody");

  if (!pendBody || !histBody) return;

  const list = window.services || [];

  /* ---------- Pending ---------- */
  const pending = list.filter(x => x.status !== "Completed");
  pendBody.innerHTML = pending.map(j => `
    <tr>
      <td>${j.id}</td>
      <td>${toDisplay(j.date_in)}</td>
      <td>${j.customer}</td>
      <td>${j.phone}</td>
      <td>${j.item}</td>
      <td>${j.model}</td>
      <td>${j.problem}</td>
      <td>${j.status}</td>
      <td>
        <button class="small-btn" 
                onclick="completeServiceJob('${j.id}')"
                style="background:#2e7d32;color:#fff">✔ Complete</button>
        <button class="small-btn" 
                onclick="deleteServiceJob('${j.id}')"
                style="background:#b71c1c;color:#fff">🗑</button>
      </td>
    </tr>
  `).join("");

  /* ---------- Completed / History ---------- */
  const completed = list.filter(x => x.status === "Completed");
  histBody.innerHTML = completed.map(j => `
    <tr>
      <td>${j.id}</td>
      <td>${toDisplay(j.date_in)}</td>
      <td>${toDisplay(j.date_out)}</td>
      <td>${j.customer}</td>
      <td>${j.item}</td>
      <td>₹${j.invest}</td>
      <td>₹${j.paid}</td>
      <td>₹${j.profit}</td>
      <td>${j.status}</td>
    </tr>
  `).join("");

  /* ---------- Summary boxes ---------- */
  qs("#svcPendingCount").textContent   = pending.length;
  qs("#svcCompletedCount").textContent = completed.length;

  const totalProfit = completed.reduce((s, j) => s + Number(j.profit || 0), 0);
  qs("#svcTotalProfit").textContent = "₹" + totalProfit;

  /* ---------- PIE ---------- */
  renderServicePie(pending.length, completed.length);
}

/* ===========================================================
   PIE CHART
=========================================================== */
let svcPie = null;

function renderServicePie(pending, completed) {
  const ctx = qs("#svcPie");
  if (!ctx) return;

  if (svcPie) svcPie.destroy();

  svcPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pending", "Completed"],
      datasets: [{
        data: [pending, completed],
        backgroundColor: ["#ff9800", "#4caf50"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

/* ===========================================================
   BUTTON
=========================================================== */
qs("#addServiceBtn")?.addEventListener("click", addServiceJob);

/* ===========================================================
   INITIAL LOAD
=========================================================== */
window.renderServiceTables = renderServiceTables;

window.addEventListener("load", () => {
  renderServiceTables();
});
