/* ===========================================================
   service.js — FINAL PERFECT VERSION
   (Type filter fixed, Date filter fixed, Pie charts always load)
=========================================================== */
(function () {
  const qs = s => document.querySelector(s);
  const esc = x => (x == null ? "" : String(x));
  const toDisplay = window.toDisplay || (d => d);
  const toInternal = window.toInternalIfNeeded || (d => d);
  const today = () => new Date().toISOString().slice(0, 10);

  let pieStatus = null;
  let pieMoney = null;

  /* ---------- STORAGE ---------- */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persist() {
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch (e) {}
  }

  /* =====================================================
        FILTER OPTIONS (ONCE ON PAGE LOAD)
  ===================================================== */
  function populateFilters() {
    /* TYPE FIX */
    const typeEl = qs("#svcFilterType");
    if (typeEl) {
      typeEl.innerHTML = `
        <option value="all">All</option>
        <option value="Mobile">Mobile</option>
        <option value="Laptop">Laptop</option>
        <option value="Other">Other</option>
      `;
    }

    /* DATE FIX */
    const dateEl = qs("#svcFilterDate");
    if (dateEl) {
      const set = new Set();
      ensureServices().forEach(j => {
        if (j.date_in) set.add(j.date_in);
        if (j.date_out) set.add(j.date_out);
      });

      const dates = [...set].sort((a, b) => b.localeCompare(a));

      dateEl.innerHTML =
        `<option value="">All Dates</option>` +
        dates.map(d => `<option value="${d}">${toDisplay(d)}</option>`).join("");
    }
  }

  /* =====================================================
        FILTERED LIST
  ===================================================== */
  function getFiltered() {
    const list = ensureServices();

    const typeVal = qs("#svcFilterType")?.value || "all";
    const statusVal = (qs("#svcFilterStatus")?.value || "all").toLowerCase();
    const dateVal = qs("#svcFilterDate")?.value || "";

    let out = [...list];

    /* TYPE filter (correct matching) */
    if (typeVal !== "all") {
      out = out.filter(j => j.item === typeVal);
    }

    /* STATUS filter */
    if (statusVal !== "all") {
      out = out.filter(j => {
        const s = String(j.status || "").toLowerCase();
        if (statusVal === "pending") return s === "pending";
        if (statusVal === "completed") return s === "completed";
        if (statusVal === "credit") return s === "credit";
        if (statusVal === "credit-paid") return s === "completed" && j.fromCredit;
        if (statusVal === "failed") return s === "failed/returned";
      });
    }

    /* DATE filter */
    if (dateVal) {
      out = out.filter(j => j.date_in === dateVal || j.date_out === dateVal);
    }

    return out;
  }

  /* =====================================================
        FULL REFRESH
  ===================================================== */
  function fullRefresh() {
    renderTables();

    setTimeout(() => {
      renderPieStatus();
      renderPieMoney();
    }, 80);
  }

  /* =====================================================
        ADD NEW JOB
  ===================================================== */
  function nextId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum) || 0);
    return {
      jobNum: (nums.length ? Math.max(...nums) : 0) + 1,
      jobId: String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0")
    };
  }

  function addJob() {
    let received = qs("#svcReceivedDate")?.value || today();
    received = toInternal(received);

    const customer = esc(qs("#svcCustomer")?.value || "").trim();
    const phone = esc(qs("#svcPhone")?.value || "").trim();
    const item = qs("#svcItemType")?.value || "Other";  // FIXED: do not lowercase
    const model = esc(qs("#svcModel")?.value || "");
    const problem = esc(qs("#svcProblem")?.value || "");
    const advance = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone, Problem");
      return;
    }

    const ids = nextId();
    const job = {
      id: "svc_" + Math.random().toString(36).slice(2, 9),
      jobNum: ids.jobNum,
      jobId: ids.jobId,
      date_in: received,
      date_out: "",
      customer,
      phone,
      item,
      model,
      problem,
      advance,
      invest: 0,
      paid: 0,
      remaining: 0,
      profit: 0,
      returnedAdvance: 0,
      status: "Pending",
      fromCredit: false
    };

    ensureServices().push(job);
    persist();
    fullRefresh();
  }

  /* =====================================================
        COMPLETE JOB
  ===================================================== */
  function markCompleted(id, mode) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full = Number(prompt("Total Bill ₹:", job.paid || 0) || 0);

    if (!full) return alert("Invalid amount");

    const adv = Number(job.advance || 0);
    const profit = full - invest;

    job.invest = invest;
    job.profit = profit;
    job.date_out = today();
    job.fromCredit = false;

    if (mode === "paid") {
      const collect = full - adv;
      if (!confirm(`Collect ₹${collect}? Profit: ₹${profit}`)) return;

      job.paid = full;
      job.remaining = 0;
      job.status = "Completed";
    } else {
      const due = full - adv;
      if (!confirm(`Credit pending ₹${due}`)) return;

      job.paid = adv;
      job.remaining = due;
      job.status = "Credit";
    }

    persist();
    fullRefresh();
  }

  /* =====================================================
        COLLECT CREDIT
  ===================================================== */
  function collectServiceCredit(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job || job.status !== "Credit") return;

    const due = Number(job.remaining || 0);
    if (!confirm(`Collect ₹${due}?`)) return;

    job.paid += due;
    job.remaining = 0;
    job.status = "Completed";
    job.fromCredit = true;

    persist();
    fullRefresh();
  }
  window.collectServiceCredit = collectServiceCredit;

  /* =====================================================
        FAILED JOB
  ===================================================== */
  function markFailed(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const ret = Number(prompt("Advance Returned ₹:", job.advance || 0) || 0);

    job.returnedAdvance = ret;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed/Returned";
    job.date_out = today();

    persist();
    fullRefresh();
  }

  /* =====================================================
        RENDER TABLES
  ===================================================== */
  function renderTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");

    const filtered = getFiltered();
    const pending = filtered.filter(j => j.status === "Pending");
    const history = filtered.filter(j => j.status !== "Pending");

    pendBody.innerHTML =
      pending.length
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
          <td><button class="btn btn-xs svc-view" data-id="${j.id}">View / Update</button></td>
        </tr>`).join("")
        : `<tr><td colspan="9">No pending jobs</td></tr>`;

    histBody.innerHTML =
      history.length
        ? history.map(j => {
            let st = j.status;
            if (j.status === "Credit") {
              st = `Credit <button class="btn btn-xs" onclick="collectServiceCredit('${j.id}')">Collect</button>`;
            }
            return `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.item)}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
          <td>${st}</td>
        </tr>`;
          }).join("")
        : `<tr><td colspan="9">No history</td></tr>`;
  }

  /* =====================================================
        PIE — STATUS
  ===================================================== */
  function renderPieStatus() {
    const el = qs("#svcPieStatus");
    if (!el || typeof Chart === "undefined") return;

    const list = getFiltered();
    const P = list.filter(j => j.status === "Pending").length;
    const C = list.filter(j => j.status === "Completed").length;
    const F = list.filter(j => j.status === "Failed/Returned").length;

    if (pieStatus) pieStatus.destroy();

    pieStatus = new Chart(el, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{ data: [P, C, F] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  /* =====================================================
        PIE — MONEY
  ===================================================== */
  function renderPieMoney() {
    const el = qs("#svcPieMoney");
    if (!el || typeof Chart === "undefined") return;

    const list = getFiltered();
    const cash = list.filter(j => j.status === "Completed" && !j.fromCredit).length;
    const creditPending = list.filter(j => j.status === "Credit").length;
    const creditPaid = list.filter(j => j.status === "Completed" && j.fromCredit).length;

    if (pieMoney) pieMoney.destroy();

    pieMoney = new Chart(el, {
      type: "pie",
      data: {
        labels: ["Cash service", "Credit (pending)", "Credit paid"],
        datasets: [{ data: [cash, creditPending, creditPaid] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  /* =====================================================
        EVENTS
  ===================================================== */
  document.addEventListener("click", e => {
    if (e.target.classList.contains("svc-view")) {
      const id = e.target.dataset.id;
      const j = ensureServices().find(x => x.id === id);
      if (!j) return;

      const msg =
        `Job ${j.jobId}\n` +
        `Customer: ${j.customer}\n` +
        `Phone: ${j.phone}\n` +
        `Item: ${j.item}\n\n` +
        `1 - Completed (Paid)\n` +
        `2 - Completed (Credit)\n` +
        `3 - Failed/Returned`;

      const ch = prompt(msg, "1");
      if (ch === "1") return markCompleted(id, "paid");
      if (ch === "2") return markCompleted(id, "credit");
      if (ch === "3") return markFailed(id);
    }
  });

  qs("#addServiceBtn")?.addEventListener("click", addJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL jobs?")) return;
    window.services = [];
    persist();
    fullRefresh();
  });

  qs("#svcFilterType")?.addEventListener("change", fullRefresh);
  qs("#svcFilterStatus")?.addEventListener("change", fullRefresh);
  qs("#svcFilterDate")?.addEventListener("change", fullRefresh);

  /* =====================================================
        PAGE LOAD
  ===================================================== */
  window.addEventListener("load", () => {
    populateFilters();
    fullRefresh();
  });

})();
