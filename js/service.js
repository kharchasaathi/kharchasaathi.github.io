/* ===========================================================
   🛠 service.js — Service / Repair Manager (v11.0 — STABLE)
   ✔ OLD UI kept exactly same
   ✔ New core.js + analytics.js fully supported
   ✔ Pending / Completed / Failed correct flow
   ✔ Profit sync, Overview sync, Smart Dashboard sync
=========================================================== */

const qs = s => document.querySelector(s);

/* ===========================================================
   ADD JOB
=========================================================== */
function addServiceJob() {
  const date_in  = qs("#svcReceivedDate")?.value || todayDate();
  const customer = qs("#svcCustomer")?.value.trim();
  const phone    = qs("#svcPhone")?.value.trim();
  const item     = qs("#svcItemType")?.value;
  const model    = qs("#svcModel")?.value.trim();
  const problem  = qs("#svcProblem")?.value.trim();
  const advance  = Number(qs("#svcAdvance")?.value || 0);

  if (!customer || !phone || !item || !problem) {
    return alert("Please fill all required fields!");
  }

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
    returned: 0,
    status: "Pending"
  });

  saveServices();
  renderServiceTables();
  syncAll();
}

/* ===========================================================
   COMPLETE JOB
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

  // Profit calculation
  job.profit = paid - (invest + Number(job.advance || 0));

  job.date_out = todayDate();
  job.status = "Completed";

  saveServices();
  renderServiceTables();
  syncAll();
}

/* ===========================================================
   MARK FAILED JOB
=========================================================== */
function failServiceJob(id) {
  const job = (window.services || []).find(j => j.id === id);
  if (!job) return;

  const returned = Number(prompt("Returned Advance ₹:", job.returned || job.advance || 0));
  if (isNaN(returned)) return;

  job.returned = returned;
  job.profit = -(returned);  // negative profit
  job.date_out = todayDate();
  job.status = "Failed";

  saveServices();
  renderServiceTables();
  syncAll();
}

/* ===========================================================
   DELETE JOB
=========================================================== */
function deleteServiceJob(id) {
  if (!confirm("Delete this job?")) return;

  window.services = (window.services || []).filter(j => j.id !== id);
  saveServices();
  renderServiceTables();
  syncAll();
}

/* ===========================================================
   CLEAR ALL JOBS
=========================================================== */
qs("#clearServiceBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL service jobs?")) return;

  window.services = [];
  saveServices();
  renderServiceTables();
  syncAll();
});

/* ===========================================================
   RENDER TABLES — OLD UI (NO CHANGE)
=========================================================== */
function renderServiceTables() {
  const pendBody = qs("#svcTable tbody");
  const histBody = qs("#svcHistoryTable tbody");
  if (!pendBody || !histBody) return;

  const list = window.services || [];

  /* ---------- Pending UI ---------- */
  const pending = list.filter(j => j.status === "Pending");

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
                onclick="failServiceJob('${j.id}')"
                style="background:#ff9800;color:#000">⚠ Fail</button>

        <button class="small-btn"
                onclick="deleteServiceJob('${j.id}')"
                style="background:#c62828;color:#fff">🗑</button>
      </td>
    </tr>
  `).join("");

  /* ---------- Completed + Failed (History) ---------- */
  const history = list.filter(j => j.status !== "Pending");

  histBody.innerHTML = history.map(j => `
    <tr>
      <td>${j.id}</td>
      <td>${toDisplay(j.date_in)}</td>
      <td>${toDisplay(j.date_out)}</td>
      <td>${j.customer}</td>
      <td>${j.item}</td>
      <td>₹${j.invest}</td>
      <td>₹${j.paid}</td>
      <td>₹${j.profit}</td>
      <td style="font-weight:bold;color:${
        j.status === "Completed" ? "#2e7d32" : "#ff9800"
      }">${j.status}</td>
    </tr>
  `).join("");

  /* ---------- Dashboard counters ---------- */
  qs("#svcPendingCount").textContent   = pending.length;
  qs("#svcCompletedCount").textContent = history.filter(j => j.status === "Completed").length;

  const totalProfit = history.reduce((s, j) => s + Number(j.profit || 0), 0);
  qs("#svcTotalProfit").textContent = "₹" + totalProfit;

  renderServicePie(
    pending.length,
    history.filter(j => j.status === "Completed").length,
    history.filter(j => j.status === "Failed").length
  );
}

/* ===========================================================
   PIE CHART (Pending / Completed / Failed)
=========================================================== */
let svcPie = null;

function renderServicePie(pending, completed, failed) {
  const ctx = qs("#svcPie");
  if (!ctx) return;

  if (svcPie) svcPie.destroy();

  svcPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pending", "Completed", "Failed"],
      datasets: [{
        data: [pending, completed, failed],
        backgroundColor: ["#ff9800", "#4caf50", "#e53935"]
      }]
    },
    options: { responsive: true }
  });
}

/* ===========================================================
   SHARED SYNC (Overview + Analytics + Profit Bar)
=========================================================== */
function syncAll() {
  renderAnalytics?.();
  updateSummaryCards?.();
  updateTabSummaryBar?.();
}

/* ===========================================================
   REGISTER
=========================================================== */
qs("#addServiceBtn")?.addEventListener("click", addServiceJob);
window.renderServiceTables = renderServiceTables;

window.addEventListener("load", () => {
  renderServiceTables();
});
