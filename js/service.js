/* ==========================================================
   🛠 service.js — Service / Repair Manager (FINAL v6.0)
   ✔ Correct Profit & Investment tracking
   ✔ Pending + Completed tables
   ✔ Sync with Profit Tab & Analytics
   ✔ Cloud + Local save supported
========================================================= */

const _SERVICE_KEY = "service-data";

/* ---------- SAVE HANDLER (uses core.js if available) ---------- */
function persistServices() {
  try {
    if (typeof window.saveServices === "function") {
      return window.saveServices();   // cloud save
    }
  } catch (e) {}

  localStorage.setItem(_SERVICE_KEY, JSON.stringify(window.services || []));
  window.dispatchEvent(new Event("storage"));
}

/* ==========================================================
   ADD NEW SERVICE JOB
========================================================= */
window.addServiceJob = function () {
  const date_in = qs("#svcReceivedDate").value || todayDate();
  const customer = qs("#svcCustomer").value.trim();
  const phone = qs("#svcPhone").value.trim();
  const item = qs("#svcItemType").value;
  const model = qs("#svcModel").value.trim();
  const problem = qs("#svcProblem").value.trim();
  const advance = Number(qs("#svcAdvance").value || 0);

  if (!customer || !problem) {
    alert("Customer name & problem required!");
    return;
  }

  const job = {
    id: uid("job"),
    date_in,
    customer,
    phone,
    item,
    model,
    problem,
    advance,
    invest: 0,
    paid: 0,
    profit: 0,
    status: "Pending",
    date_out: ""
  };

  window.services.push(job);
  persistServices();
  renderServiceTables();
};

/* ==========================================================
   MARK JOB COMPLETED
========================================================= */
window.completeServiceJob = function (id) {
  const s = window.services.find(x => x.id === id);
  if (!s) return;

  const invest = Number(prompt("Enter investment amount:", s.invest || 0)) || 0;
  const paid = Number(prompt("Final amount received:", s.paid || 0)) || 0;

  s.invest = invest;
  s.paid = paid;

  // PROFIT = PAID - INVEST - ADVANCE already received?
  const advance = Number(s.advance || 0);
  const grossReceive = advance + paid;
  s.profit = grossReceive - invest;

  s.status = "Completed";
  s.date_out = todayDate();

  persistServices();
  renderServiceTables();
  renderAnalytics?.();
  renderProfitTab?.();
};

/* ==========================================================
   DELETE JOB
========================================================= */
window.deleteServiceJob = function (id) {
  if (!confirm("Delete this job?")) return;

  window.services = window.services.filter(x => x.id !== id);
  persistServices();
  renderServiceTables();
};

/* ==========================================================
   CLEAR ALL JOBS
========================================================= */
qs("#clearServiceBtn")?.addEventListener("click", () => {
  if (!confirm("Delete ALL service jobs?")) return;

  window.services = [];
  persistServices();
  renderServiceTables();
});

/* ==========================================================
   RENDER TABLES (Pending + Completed)
========================================================= */
window.renderServiceTables = function () {
  const pendingBody = qs("#svcTable tbody");
  const historyBody = qs("#svcHistoryTable tbody");

  pendingBody.innerHTML = "";
  historyBody.innerHTML = "";

  let pending = 0,
    completed = 0,
    svcProfit = 0;

  (window.services || []).forEach(s => {
    if (s.status === "Pending") {
      pending++;

      pendingBody.innerHTML += `
        <tr>
          <td>${s.id}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${esc(s.customer)}</td>
          <td>${esc(s.phone)}</td>
          <td>${esc(s.item)}</td>
          <td>${esc(s.model)}</td>
          <td>${esc(s.problem)}</td>
          <td>Pending</td>
          <td>
            <button class="small-btn" onclick="completeServiceJob('${s.id}')">Complete</button>
            <button class="small-btn" style="background:#d32f2f" onclick="deleteServiceJob('${s.id}')">Delete</button>
          </td>
        </tr>
      `;
    } else {
      completed++;
      svcProfit += Number(s.profit || 0);

      historyBody.innerHTML += `
        <tr>
          <td>${s.id}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${toDisplay(s.date_out)}</td>
          <td>${esc(s.customer)}</td>
          <td>${esc(s.item)}</td>
          <td>₹${s.invest}</td>
          <td>₹${s.paid}</td>
          <td>₹${s.profit}</td>
          <td>${s.status}</td>
        </tr>
      `;
    }
  });

  qs("#svcPendingCount").textContent = pending;
  qs("#svcCompletedCount").textContent = completed;
  qs("#svcTotalProfit").textContent = "₹" + svcProfit;

  renderServicePie();
};

/* ==========================================================
   PIE CHART (Pending vs Completed)
========================================================= */
let svcPieChart = null;

function renderServicePie() {
  const ctx = qs("#svcPie");
  if (!ctx) return;

  const pending = window.services.filter(s => s.status === "Pending").length;
  const completed = window.services.filter(s => s.status === "Completed").length;

  if (svcPieChart) svcPieChart.destroy();

  svcPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Pending", "Completed"],
      datasets: [{
        data: [pending, completed],
        backgroundColor: ["#ff9800", "#4caf50"]
      }]
    },
    options: { responsive: true }
  });
}

/* ==========================================================
   SERVICE INVESTMENT + PROFIT EXPORTERS (used by PROFIT TAB)
========================================================= */

window.getServiceInvestment = function () {
  let t = 0;
  (window.services || []).forEach(s => {
    if (s.status === "Completed") t += Number(s.invest || 0);
  });
  return t;
};

window.getServiceProfit = function () {
  let t = 0;
  (window.services || []).forEach(s => {
    if (s.status === "Completed") t += Number(s.profit || 0);
  });
  return t;
};

/* ==========================================================
   INITIAL RENDER
========================================================= */
window.addEventListener("load", () => {
  renderServiceTables();
});
