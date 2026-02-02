/* ===========================================================
   service.js — ONLINE MODE (Cloud Master) — FINAL v22
   ✔ Cloud-first (Firestore master)
   ✔ Local cache only for fast UI
   ✔ Service (left) + Money (right) single view
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);
  const esc = v => (v == null ? "" : String(v));
  const toDisplay = window.toDisplay || (d => d);
  const toInternal = window.toInternalIfNeeded || (d => d);
  const today = () => new Date().toISOString().slice(0, 10);

  /* --------------------------------------------------
        SAVE (LOCAL + CLOUD)
  -------------------------------------------------- */
  function saveServicesOnline() {
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch {}

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced("services", window.services);
    }

    if (typeof cloudPullAllIfAvailable === "function") {
      setTimeout(() => cloudPullAllIfAvailable(), 200);
    }
  }

  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  /* --------------------------------------------------
        DATE FILTER
  -------------------------------------------------- */
  function buildDateFilter() {
    const sel = qs("#svcFilterDate");
    if (!sel) return;

    const set = new Set();
    ensureServices().forEach(j => {
      if (j.date_in) set.add(j.date_in);
      if (j.date_out) set.add(j.date_out);
    });

    const list = [...set].sort((a, b) => b.localeCompare(a));

    sel.innerHTML =
      `<option value="">All Dates</option>` +
      list.map(d => `<option value="${d}">${toDisplay(d)}</option>`).join("");
  }

  function clearCalendar() {
    const c = qs("#svcFilterCalendar");
    if (c) c.value = "";
  }
  function clearDropdown() {
    const d = qs("#svcFilterDate");
    if (d) d.value = "";
  }

  /* --------------------------------------------------
        FILTER
  -------------------------------------------------- */
  function getFiltered() {
    const list = ensureServices();

    const typeVal = qs("#svcFilterType")?.value || "all";
    const statusVal = (qs("#svcFilterStatus")?.value || "all").toLowerCase();
    const dropDate = qs("#svcFilterDate")?.value || "";
    const calendarDate = qs("#svcFilterCalendar")?.value || "";
    const dateVal = calendarDate || dropDate;

    let out = [...list];

    if (typeVal !== "all") out = out.filter(j => j.item === typeVal);

    out = out.filter(j => {
      const s = j.status;
      if (statusVal === "all") return true;
      if (statusVal === "pending") return s === "pending";
      if (statusVal === "completed") return s === "completed" && !j.fromCredit;
      if (statusVal === "credit") return s === "credit";
      if (statusVal === "credit-paid") return s === "completed" && j.fromCredit;
      if (statusVal === "failed") return s === "failed";
      return true;
    });

    if (dateVal) out = out.filter(j => j.date_in === dateVal || j.date_out === dateVal);

    return out;
  }

  /* --------------------------------------------------
        COUNTS (LEFT)
  -------------------------------------------------- */
  function renderCounts() {
    const list = ensureServices();

    const pending = list.filter(j => j.status === "pending").length;
    const completed = list.filter(j => j.status === "completed").length;

    const profit = list
      .filter(j => j.status === "completed")
      .reduce((a, b) => a + Number(b.profit || 0), 0);

    qs("#svcPendingCount").textContent = pending;
    qs("#svcCompletedCount").textContent = completed;
    qs("#svcTotalProfit").textContent = "₹" + profit;
  }

  /* --------------------------------------------------
        TABLES (LEFT SIDE)
  -------------------------------------------------- */
  function renderTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");

    const f = getFiltered();
    const pending = f.filter(j => j.status === "pending");
    const history = f.filter(j => j.status !== "pending");

    pendBody.innerHTML = pending.length
      ? pending.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.phone)}</td>
          <td>${esc(j.item)}</td>
          <td>${esc(j.model)}</td>
          <td>${esc(j.problem)}</td>
          <td>Pending</td>
          <td><button class="small-btn svc-view" data-id="${j.id}">View / Update</button></td>
        </tr>`).join("")
      : `<tr><td colspan="9">No pending jobs</td></tr>`;

    histBody.innerHTML = history.length
      ? history.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.item)}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
          <td>
            ${j.status === "credit"
              ? `Credit <button class="small-btn" onclick="collectServiceCredit('${j.id}')">Collect</button>`
              : j.status}
          </td>
        </tr>`).join("")
      : `<tr><td colspan="9">No history</td></tr>`;
  }

  /* --------------------------------------------------
        SERVICE PIE (RIGHT SIDE) — BIGGER SIZE
  -------------------------------------------------- */
  let pieStatus = null;

  function drawPieStatus() {
    const el = qs("#svcPieStatus");
    if (!el || typeof Chart === "undefined") return;

    const list = ensureServices();

    const values = [
      list.filter(j => j.status === "pending").length,
      list.filter(j => j.status === "credit").length,
      list.filter(j => j.status === "completed").length,
      list.filter(j => j.status === "failed").length
    ];

    if (pieStatus) pieStatus.destroy();

    pieStatus = new Chart(el, {
      type: "pie",
      data: {
        labels: ["Pending", "Credit", "Completed", "Failed"],
        datasets: [{
          data: values.some(v => v > 0) ? values : [1, 0, 0, 0]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 20 },
        radius: "85%"   // 👈 SIZE BOOST
      }
    });
  }

  /* --------------------------------------------------
        MONEY LIST (RIGHT SIDE)
  -------------------------------------------------- */
  function renderMoneyList() {
    let box = qs("#svcMoneyBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "svcMoneyBox";
      box.style.borderLeft = "1px dashed #cbd5e1";   // 👈 MIDDLE LINE
      box.style.paddingLeft = "14px";
      qs("#service")?.appendChild(box);
    }

    let cash = 0, credit = 0, collected = 0, profit = 0;

    ensureServices().forEach(j => {
      if (j.status === "completed" && !j.fromCredit) cash += j.paid;
      if (j.status === "credit") credit += j.remaining;
      if (j.status === "completed") {
        collected += j.paid;
        profit += j.profit;
      }
    });

    box.innerHTML = `
      <h4>💰 Service Money</h4>
      <ul style="line-height:1.8;font-size:14px">
        <li>💵 Cash Collected: <b>₹${cash}</b></li>
        <li>🕒 Credit Pending: <b>₹${credit}</b></li>
        <li>✅ Total Collected: <b>₹${collected}</b></li>
        <li>📈 Total Profit: <b>₹${profit}</b></li>
      </ul>
    `;
  }

  /* --------------------------------------------------
        REFRESH
  -------------------------------------------------- */
  function refresh() {
    renderCounts();
    renderTables();
    drawPieStatus();
    renderMoneyList();
  }

  window.__svcRefresh = refresh;

  /* --------------------------------------------------
        ADD / UPDATE JOBS
  -------------------------------------------------- */
  function nextId() {
    const nums = ensureServices().map(j => Number(j.jobNum) || 0);
    const max = nums.length ? Math.max(...nums) : 0;
    return { jobNum: max + 1, jobId: String(max + 1).padStart(2, "0") };
  }

  function addJob() {
    const job = {
      id: "svc_" + Math.random().toString(36).slice(2),
      ...nextId(),
      date_in: toInternal(qs("#svcReceivedDate")?.value || today()),
      date_out: "",
      customer: esc(qs("#svcCustomer")?.value || "").trim(),
      phone: esc(qs("#svcPhone")?.value || "").trim(),
      item: qs("#svcItemType")?.value || "Other",
      model: esc(qs("#svcModel")?.value || ""),
      problem: esc(qs("#svcProblem")?.value || ""),
      advance: Number(qs("#svcAdvance")?.value || 0),
      invest: 0,
      paid: 0,
      remaining: 0,
      profit: 0,
      status: "pending",
      fromCredit: false
    };

    if (!job.customer || !job.phone || !job.problem)
      return alert("Fill all fields");

    ensureServices().push(job);
    saveServicesOnline();
    buildDateFilter();
    refresh();
  }

  function completeJob(id, mode) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const invest = Number(prompt("Repair Cost ₹:", j.invest) || 0);
    const full = Number(prompt("Total Bill ₹:", j.paid) || 0);
    if (!full) return alert("Invalid amount");

    j.invest = invest;
    j.profit = full - invest;
    j.date_out = today();

    if (mode === "paid") {
      j.paid = full;
      j.remaining = 0;
      j.status = "completed";
      j.fromCredit = false;
    } else {
      j.paid = j.advance;
      j.remaining = full - j.advance;
      j.status = "credit";
      j.fromCredit = false;
    }

    saveServicesOnline();
    buildDateFilter();
    refresh();
  }

  window.collectServiceCredit = function (id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j || j.status !== "credit") return;

    if (!confirm(`Collect ₹${j.remaining}?`)) return;

    j.paid += j.remaining;
    j.remaining = 0;
    j.status = "completed";
    j.fromCredit = true;

    saveServicesOnline();
    refresh();
  };

  function failJob(id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    j.status = "failed";
    j.date_out = today();
    j.invest = j.paid = j.remaining = j.profit = 0;

    saveServicesOnline();
    refresh();
  }

  /* --------------------------------------------------
        EVENTS
  -------------------------------------------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".svc-view");
    if (!btn) return;

    const id = btn.dataset.id;
    const ch = prompt(
      `1 - Completed (Paid)\n2 - Completed (Credit)\n3 - Failed`
    );

    if (ch === "1") completeJob(id, "paid");
    else if (ch === "2") completeJob(id, "credit");
    else if (ch === "3") failJob(id);
  });

  qs("#addServiceBtn")?.addEventListener("click", addJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL service entries?")) return;
    window.services = [];
    saveServicesOnline();
    buildDateFilter();
    refresh();
  });

  qs("#svcFilterStatus")?.addEventListener("change", refresh);
  qs("#svcFilterType")?.addEventListener("change", refresh);
  qs("#svcFilterDate")?.addEventListener("change", () => { clearCalendar(); refresh(); });
  qs("#svcFilterCalendar")?.addEventListener("change", () => { clearDropdown(); refresh(); });

  window.addEventListener("load", () => {
    buildDateFilter();
    refresh();
  });

})();
