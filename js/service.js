/* =======================================================
   🛠 service.js — Service / Repair Manager (v8.2 FINAL)
   ✔ Date input fixed
   ✔ Display = dd-mm-yyyy (core.js handles it)
   ✔ Internal = yyyy-mm-dd
   ✔ Fully compatible with core.js & analytics.js
======================================================= */

(function () {

  const KEY = "service-data";

  const toDisplay  = window.toDisplay;
  const toInternal = window.toInternal;
  const today      = window.todayDate;
  const uid        = window.uid;
  const esc        = window.esc;

  let svcPieChart = null;

  /* -------- LOAD DATA -------- */
  window.services = JSON.parse(localStorage.getItem(KEY) || "[]");

  function save() {
    localStorage.setItem(KEY, JSON.stringify(window.services));
    window.dispatchEvent(new Event("storage"));
  }

  /* -------- JOB ID -------- */
  function nextJobId() {
    if (!window.services.length) return "01";
    const max = Math.max(...window.services.map(s => Number(s.jobNum || 0)));
    return String(max + 1).padStart(2, "0");
  }

  /* =====================================================
       ADD JOB (DATE FIXED)
     ===================================================== */
  function addJob() {

    let receivedRaw = qs("#svcReceivedDate")?.value || today();

    // FIX: Convert only if dd-mm-yyyy manually entered
    let received =
      receivedRaw.split("-")[0].length === 2
        ? toInternal(receivedRaw)
        : receivedRaw;

    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone    = (qs("#svcPhone")?.value || "").trim();
    const itemType = qs("#svcItemType")?.value || "Other";
    const model    = (qs("#svcModel")?.value || "").trim();
    const problem  = (qs("#svcProblem")?.value || "").trim();
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !model || !problem) {
      return alert("Please fill all required fields.");
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

    /* Pending Jobs */
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
          <button class="svc-del small-btn" style="background:#d32f2f" data-id="${s.id}">Delete</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="9">No pending jobs</td></tr>`;

    /* Completed + Failed */
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

    /* Summary */
    qs("#svcPendingCount").textContent = pending.length;
    qs("#svcCompletedCount").textContent = completed.length;
    qs("#svcTotalProfit").textContent =
      "₹" + window.services.reduce((s,j)=>s+Number(j.profit||0),0);

    renderPie();
  }

  /* =====================================================
       PIE CHART
     ===================================================== */
  function renderPie() {
    const c = qs("#svcPie");
    if (!c) return;

    const P = window.services.filter(s=>s.status==="Pending").length;
    const C = window.services.filter(s=>s.status==="Completed").length;
    const F = window.services.filter(s=>s.status==="Failed/Returned").length;

    if (svcPieChart) svcPieChart.destroy();

    svcPieChart = new Chart(c,{
      type:"pie",
      data:{
        labels:["Pending","Completed","Failed/Returned"],
        datasets:[{data:[P,C,F]}]
      },
      options:{responsive:true,plugins:{legend:{position:"bottom"}}}
    });
  }

  /* =====================================================
       OPEN JOB
     ===================================================== */
  function openJob(id) {
    const s = window.services.find(x=>x.id===id);
    if (!s) return;

    const ch = prompt(
`Job ${s.jobId}
Customer: ${s.customer}
Item: ${s.itemType} - ${s.model}
Problem: ${s.problem}
Advance: ₹${s.advance}

1 - Completed
2 - Failed
`, "1");

    if (ch==="1") return markCompleted(id);
    if (ch==="2") return markFailed(id);
  }

  /* =====================================================
       COMPLETED
     ===================================================== */
  function markCompleted(id) {
    const s = window.services.find(x=>x.id===id);
    if (!s) return;

    const invest = Number(prompt("Enter investment ₹:", s.invest||0) || 0);
    const full   = Number(prompt("Enter FULL PAYMENT ₹:", s.paid||0) || 0);

    const remaining = full - s.advance;
    const profit    = full - invest;

    if (!confirm(
`Save?
Invest: ₹${invest}
Advance: ₹${s.advance}
Full Payment: ₹${full}
Remaining: ₹${remaining}
Profit: ₹${profit}`
    )) return;

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
       FAILED / RETURNED
     ===================================================== */
  function markFailed(id) {
    const s = window.services.find(x=>x.id===id);
    if (!s) return;

    const returned = Number(prompt("Advance returned ₹:", s.advance||0) || 0);

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
       DELETE / CLEAR
     ===================================================== */
  function deleteJob(id) {
    if (!confirm("Delete this job?")) return;
    window.services = window.services.filter(s=>s.id!==id);
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
    if (e.target.id==="addServiceBtn") addJob();
    if (e.target.classList.contains("svc-view")) openJob(e.target.dataset.id);
    if (e.target.classList.contains("svc-del")) deleteJob(e.target.dataset.id);
    if (e.target.id==="clearServiceBtn") clearAllServices();
  });

  window.addEventListener("load", renderTables);

  window.renderServiceTables = renderTables;

})();
