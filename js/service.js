/* =======================================================
   🛠 service.js — Service / Repair Manager (v3.0 FINAL)
   Improvements:
   ✔ Failed/Returned → ask "advance returned"
   ✔ Pending list shows Advance ₹
   ✔ Pie chart: Pending | Completed | Failed/Returned
   ✔ Clear All button supported
   ======================================================= */

(function(){
  const KEY = "service-data";

  const toDisplay = window.toDisplay || (d => d || "");
  const toInternal = window.toInternal || (d => d || "");
  const today = window.todayDate || (() => new Date().toISOString().split("T")[0]);
  const uid = window.uid || (p => p + "_" + Math.random().toString(36).slice(2,9));
  const esc = window.esc || (t => String(t||""));

  let svcPieChart = null;

  window.services = JSON.parse(localStorage.getItem(KEY) || "[]");

  function save() {
    localStorage.setItem(KEY, JSON.stringify(window.services));
    window.dispatchEvent(new Event("storage"));
  }

  // Simple auto number generator
  function nextJobId() {
    if (!window.services.length) return "01";
    const max = Math.max(...window.services.map(s => Number(s.jobNum || 0)));
    return String(max + 1).padStart(2, "0");
  }

  /* ------------------------------
        ADD NEW JOB
  ------------------------------ */
  function addJob() {
    const date = qs("#svcReceivedDate").value || today();
    const customer = qs("#svcCustomer").value.trim();
    const phone = qs("#svcPhone").value.trim();
    const itemType = qs("#svcItemType").value;
    const model = qs("#svcModel").value.trim();
    const problem = qs("#svcProblem").value.trim();
    const advance = Number(qs("#svcAdvance").value || 0);

    if (!customer || !phone || !model || !problem)
      return alert("Fill all required fields.");

    const jobNum = Number(nextJobId());
    const jobId = String(jobNum).padStart(2,"0");

    const job = {
      id: uid("svc"),
      jobNum,
      jobId,
      date_in: toInternal(date),
      date_out: "",
      customer,
      phone,
      itemType,
      model,
      problem,
      advance,
      invest: 0,
      paid: 0,
      profit: 0,
      status: "Pending"
    };

    window.services.push(job);
    save();
    renderTables();
    clearForm();
  }

  function clearForm() {
    qs("#svcReceivedDate").value = "";
    qs("#svcCustomer").value = "";
    qs("#svcPhone").value = "";
    qs("#svcModel").value = "";
    qs("#svcProblem").value = "";
    qs("#svcAdvance").value = "";
  }

  /* ------------------------------
      RENDER TABLES
  ------------------------------ */
  function renderTables() {
    const tb = qs("#svcTable tbody");
    const hist = qs("#svcHistoryTable tbody");

    const pend = window.services.filter(s => s.status === "Pending");
    const comp = window.services.filter(s => s.status !== "Pending");

    tb.innerHTML =
      pend.map(s => `
      <tr>
        <td>${s.jobId}</td>
        <td>${toDisplay(s.date_in)}</td>
        <td>${esc(s.customer)}</td>
        <td>${esc(s.phone)}</td>
        <td>${esc(s.itemType)}</td>
        <td>${esc(s.model)}</td>
        <td>${esc(s.problem)}</td>
        <td>Advance: ₹${s.advance}</td>
        <td>
          <button class="svc-view small-btn" data-id="${s.id}">Open</button>
          <button class="svc-del small-btn" data-id="${s.id}" style="background:#d32f2f">Delete</button>
        </td>
      </tr>`).join("") ||
      `<tr><td colspan="9">No pending jobs</td></tr>`;

    hist.innerHTML =
      comp.map(s => `
        <tr>
          <td>${s.jobId}</td>
          <td>${toDisplay(s.date_in)}</td>
          <td>${toDisplay(s.date_out)}</td>
          <td>${esc(s.customer)}</td>
          <td>${esc(s.model)}</td>
          <td>₹${s.invest}</td>
          <td>₹${s.paid}</td>
          <td>₹${s.profit}</td>
          <td>${s.status} (Advance Returned: ₹${s.advance})</td>
        </tr>`).join("") ||
      `<tr><td colspan="9">No completed/failed jobs</td></tr>`;

    qs("#svcPendingCount").textContent = pend.length;
    qs("#svcCompletedCount").textContent = comp.length;
    qs("#svcTotalProfit").textContent =
      "₹" + comp.reduce((a,b)=>a + Number(b.profit||0), 0);

    renderPie();
  }

  /* ------------------------------
        PIE CHART
  ------------------------------ */
  function renderPie() {
    const c = qs("#svcPie");
    if (!c) return;

    const list = window.services;
    const P = list.filter(s=>s.status==="Pending").length;
    const C = list.filter(s=>s.status==="Completed").length;
    const F = list.filter(s=>s.status==="Failed/Returned").length;

    if (svcPieChart) svcPieChart.destroy();

    svcPieChart = new Chart(c,{
      type:"pie",
      data:{
        labels:["Pending","Completed","Failed/Returned"],
        datasets:[{
          data:[P,C,F],
          backgroundColor:["#ffb74d","#4caf50","#e57373"]
        }]
      },
      options:{responsive:true,plugins:{legend:{position:"bottom"}}}
    });
  }

  /* ------------------------------
       ACTION MENU
  ------------------------------ */
  function openJob(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return alert("Not found");

    const msg =
`Job ${s.jobId}
Customer: ${s.customer}
Phone: ${s.phone}
Item: ${s.itemType} - ${s.model}
Problem: ${s.problem}
Advance: ₹${s.advance}
Received: ${toDisplay(s.date_in)}

Choose action:
1 - Mark Completed
2 - Mark Failed/Returned`;

    const choice = prompt(msg,"1");
    if (!choice) return;

    if (choice === "1") markCompleted(id);
    else if (choice === "2") markFailed(id);
  }

  /* ------------------------------
       COMPLETED
  ------------------------------ */
  function markCompleted(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return;

    const inv = Number(prompt("Investment spent ₹:", s.invest || 0) || 0);
    const paid = Number(prompt("Final Amount received from customer ₹:", s.paid || 0) || 0);

    s.invest = inv;
    s.paid = paid;
    s.profit = paid - inv;
    s.status = "Completed";
    s.date_out = today();

    save();
    renderTables();
  }

  /* ------------------------------
       FAILED / RETURNED
  ------------------------------ */
  function markFailed(id) {
    const s = window.services.find(x => x.id === id);
    if (!s) return;

    const returnedAdv = Number(prompt("Advance returned to customer ₹:", s.advance || 0) || 0);

    s.advance = returnedAdv;   // show how much returned
    s.invest = 0;
    s.paid = 0;
    s.profit = 0;
    s.status = "Failed/Returned";
    s.date_out = today();

    save();
    renderTables();
  }

  /* ------------------------------
       DELETE JOB
  ------------------------------ */
  function deleteJob(id){
    if(!confirm("Delete this job?")) return;
    window.services = window.services.filter(s => s.id !== id);
    save();
    renderTables();
  }

  /* ------------------------------
       CLEAR ALL (Button enabled)
  ------------------------------ */
  window.clearAllServices = function(){
    if(!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    save();
    renderTables();
  };

  /* EVENTS */
  document.addEventListener("click", e => {
    if (e.target.id === "addServiceBtn") addJob();
    if (e.target.classList.contains("svc-view")) openJob(e.target.dataset.id);
    if (e.target.classList.contains("svc-del")) deleteJob(e.target.dataset.id);
    if (e.target.id === "clearServiceBtn") clearAllServices(); // NEW
  });

  window.addEventListener("load", renderTables);
})();
