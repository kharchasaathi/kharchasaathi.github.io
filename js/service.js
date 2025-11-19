/* =======================================================
   🛠 service.js — Service / Repair Manager (v8.1 CLEAN FINAL)
   ✔ 100% Works with core.js & analytics.js
   ✔ Uses SAME STORAGE KEY: "service-data"
   ✔ Dates internally saved as yyyy-mm-dd
   ✔ Display always dd-mm-yyyy (uses toDisplay())
   ✔ Clear All works perfectly
   ✔ Profit, expenses, analytics all perfect
   ======================================================= */

(function () {

  /* ---------- CONSTANTS ---------- */
  const KEY = "service-data";   // FIXED — core.js uses SAME KEY

  const toDisplay  = window.toDisplay;
  const toInternal = window.toInternal;
  const today      = window.todayDate;
  const uid        = window.uid;
  const esc        = window.esc;

  let svcPieChart = null;

  /* ---------- LOAD DATA ---------- */
  window.services = JSON.parse(localStorage.getItem(KEY) || "[]");

  function save() {
    localStorage.setItem(KEY, JSON.stringify(window.services));
    window.dispatchEvent(new Event("storage"));   // notify others
  }

  /* ---------- JOB ID GENERATOR ---------- */
  function nextJobId() {
    if (!window.services.length) return "01";
    const max = Math.max(...window.services.map(s => Number(s.jobNum || 0)));
    return String(max + 1).padStart(2, "0");
  }

  /* =====================================================
       ADD NEW JOB
     ===================================================== */
  function addJob() {
    const receivedRaw = qs("#svcReceivedDate")?.value || today();
    const received = toInternal(receivedRaw);

    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone    = (qs("#svcPhone")?.value || "").trim();
    const itemType = qs("#svcItemType")?.value || "Other";
    const model    = (qs("#svcModel")?.value || "").trim();
    const problem  = (qs("#svcProblem")?.value || "").trim();
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !model || !problem) {
      return alert("Please fill required fields.");
    }

    const jobNum = Number(nextJobId());
    const jobId  = String(jobNum).padStart(2, "0");

    const job = {
      id: uid("svc"),
      jobNum,
      jobId,
      date_in: received,
      date_out: "",
      customer,
      phone,
      itemType,
      model,
      problem,
      advance,
      invest: 0,
      paid: 0,
      remaining: 0,
      profit: 0,
      returnedAdvance: 0,
      status: "Pending"
    };

    window.services.push(job);
    save();
    renderTables();
    clearForm();

    updateSummaryCards?.();
    renderAnalytics?.();
  }

  function clearForm() {
    ["svcReceivedDate","svcCustomer","svcPhone","svcModel","svcProblem","svcAdvance"]
      .forEach(id => qs("#" + id) && (qs("#" + id).value = ""));
  }

  /* =====================================================
        RENDER TABLES
     ===================================================== */
  function renderTables() {
    const tb = qs("#svcTable tbody");
    const hist = qs("#svcHistoryTable tbody");
    if (!tb || !hist) return;

    const pending   = window.services.filter(s => s.status === "Pending");
    const completed = window.services.filter(s => s.status === "Completed");
    const failed    = window.services.filter(s => s.status === "Failed/Returned");

    /* -------- Pending ---------- */
    tb.innerHTML = pending.map(s => `
      <tr>
        <td>${esc(s.jobId)}</td>
        <td>${toDisplay(s.date_in)}</td>
        <td>${esc(s.customer)}</td>
        <td>${esc(s.phone)}</td>
        <td>${esc(s.itemType)}</td>
        <td>${esc(s.model)}</td>
        <td>${esc(s.problem)}</td>
        <td>${s.advance > 0 ? "Advance: ₹" + s.advance : ""}</td>
        <td>
          <button class="svc-view small-btn" data-id="${s.id}">Open</button>
          <button class="svc-del small-btn" data-id="${s.id}" style="background:#d32f2f">Delete</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="9">No pending jobs</td></tr>`;

    /* -------- History ---------- */
    hist.innerHTML = [...completed, ...failed].map(s => {
      if (s.status === "Failed/Returned") {
        return `
        <tr>
          <td>${esc(s.jobId)}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${toDisplay(s.date_out)}</td>
          <td>${esc(s.customer)}</td>
          <td>${esc(s.model)}</td>
          <td>₹${s.invest}</td>
          <td>₹${s.paid}</td>
          <td>₹${s.profit}</td>
          <td>Failed (Returned ₹${s.returnedAdvance})</td>
        </tr>`;
      }
      return `
        <tr>
          <td>${esc(s.jobId)}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${toDisplay(s.date_out)}</td>
          <td>${esc(s.customer)}</td>
          <td>${esc(s.model)}</td>
          <td>₹${s.invest}</td>
          <td>₹${s.paid}</td>
          <td>₹${s.profit}</td>
          <td>Completed</td>
        </tr>`;
    }).join("") || `<tr><td colspan="9">No history</td></tr>`;

    /* -------- Summary cards ---------- */
    qs("#svcPendingCount").textContent   = pending.length;
    qs("#svcCompletedCount").textContent = completed.length;
    qs("#svcTotalProfit").textContent    =
      "₹" + window.services.reduce((s, j) => s + Number(j.profit || 0), 0);

    renderPie();
  }

  /* =====================================================
       PIE CHART
     ===================================================== */
  function renderPie() {
    const c = qs("#svcPie");
    if (!c) return;

    const P = window.services.filter(s => s.status === "Pending").length;
    const C = window.services.filter(s => s.status === "Completed").length;
    const F = window.services.filter(s => s.status === "Failed/Returned").length;

    if (svcPieChart) svcPieChart.destroy();

    svcPieChart = new Chart(c, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{ data: [P, C, F] }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  }

  /* =====================================================
       OPEN JOB ACTION MENU
     ===================================================== */
  function openJob(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return;

    const msg =
`Job ${s.jobId}
Customer: ${s.customer}
Phone: ${s.phone}
Item: ${s.itemType} - ${s.model}
Problem: ${s.problem}
Advance: ₹${s.advance}

Choose:
1 - Mark Completed
2 - Mark Failed`;

    const ch = prompt(msg, "1");
    if (ch === "1") return markCompleted(id);
    if (ch === "2") return markFailed(id);
  }

  /* =====================================================
       MARK COMPLETED
     ===================================================== */
  function markCompleted(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return;

    const invest = Number(prompt("Enter investment (cost) ₹:", s.invest || 0) || 0);
    const full   = Number(prompt("Enter FULL PAYMENT (customer total) ₹:", s.paid || 0) || 0);

    const remaining = full - s.advance;
    const profit = full - invest;

    const ok = confirm(
`Save?
Invest: ₹${invest}
Advance: ₹${s.advance}
Full Payment: ₹${full}
Remaining: ₹${remaining}
Profit: ₹${profit}`
    );
    if (!ok) return;

    s.invest = invest;
    s.paid = full;
    s.remaining = remaining;
    s.profit = profit;
    s.status = "Completed";
    s.date_out = today();

    save();
    renderTables();
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  /* =====================================================
       MARK FAILED
     ===================================================== */
  function markFailed(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return;

    const returned = Number(prompt("Advance returned ₹:", s.advance || 0) || 0);

    s.returnedAdvance = returned;
    s.invest = 0;
    s.paid = 0;
    s.remaining = 0;
    s.profit = 0;
    s.status = "Failed/Returned";
    s.date_out = today();

    save();
    renderTables();
    updateSummaryCards?.();
    renderAnalytics?.();
  }

  /* =====================================================
        DELETE & CLEAR
     ===================================================== */
  function deleteJob(id) {
    if (!confirm("Delete this job?")) return;
    window.services = window.services.filter(s => s.id !== id);
    save();
    renderTables();
  }

  window.clearAllServices = function () {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    save();
    renderTables();
  };

  /* =====================================================
       EVENTS
     ===================================================== */
  document.addEventListener("click", e => {
    if (e.target.id === "addServiceBtn") addJob();
    if (e.target.classList.contains("svc-view")) openJob(e.target.dataset.id);
    if (e.target.classList.contains("svc-del")) deleteJob(e.target.dataset.id);
    if (e.target.id === "clearServiceBtn") clearAllServices();
  });

  /* Initial Load */
  window.addEventListener("load", renderTables);

  /* Expose API */
  window.renderServiceTables = renderTables;
})();
