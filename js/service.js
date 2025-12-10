/* ===========================================================
   service.js — FULL FILTER + DUAL PIE CHARTS
   - Safe investment / profit
   - Service credit → collect later
   - Status + Type + Date filters (AND mode)
   - Pie-1: Pending / Completed / Failed
   - Pie-2: Cash / Credit pending / Credit collected
=========================================================== */
(function () {
  const qs = sel => document.querySelector(sel);
  const escSafe = window.esc || (x => (x == null ? "" : String(x)));
  const toDisplay = window.toDisplay || (d => d);
  const toInternalIf = window.toInternalIfNeeded || (d => d);
  const todayDateFn =
    window.todayDate || (() => new Date().toISOString().slice(0, 10));

  let pieStatus = null;
  let pieMoney = null;

  /* ---------------- STORAGE ---------------- */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    if (typeof window.saveServices === "function") {
      try {
        window.saveServices();
        return;
      } catch (e) {}
    }
    try {
      localStorage.setItem(
        "service-data",
        JSON.stringify(window.services || [])
      );
    } catch (e) {}
  }

  function fullRefresh() {
    try { renderServiceTables(); } catch (e) {}
    try { renderSvcPieStatus(); } catch (e) {}
    try { renderSvcPieMoney(); } catch (e) {}
    try { window.renderAnalytics?.(); } catch (e) {}
    try { window.updateSummaryCards?.(); } catch (e) {}
    try { window.updateUniversalBar?.(); } catch (e) {}
    try { window.renderCollection?.(); } catch (e) {}
  }

  /* ---------------- NEW JOB ---------------- */
  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum || j.jobId) || 0);
    const max = nums.length ? Math.max(...nums) : 0;
    const n = max + 1;
    return { jobNum: n, jobId: String(n).padStart(2, "0") };
  }

  function addServiceJob() {
    let received = qs("#svcReceivedDate")?.value || todayDateFn();
    received = toInternalIf(received);

    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone = (qs("#svcPhone")?.value || "").trim();
    const item = qs("#svcItemType")?.value || "Other";
    const model = (qs("#svcModel")?.value || "").trim();
    const problem = (qs("#svcProblem")?.value || "").trim();
    const advance = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone, Problem");
      return;
    }

    const ids = nextJobId();
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
    persistServices();
    fullRefresh();

    qs("#svcCustomer").value = "";
    qs("#svcPhone").value = "";
    qs("#svcModel").value = "";
    qs("#svcProblem").value = "";
    qs("#svcAdvance").value = "";
  }

  /* ---------------- COMPLETE (PAID / CREDIT) ---------------- */
  function markCompleted(id, mode) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const invest = Number(
      prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0
    );
    const full = Number(prompt("Total Bill ₹:", job.paid || 0) || 0);

    if (!full || full <= 0) {
      alert("Invalid amount");
      return;
    }

    const profit = full - invest;
    const adv = Number(job.advance || 0);

    job.invest = invest;
    job.profit = profit;
    job.date_out = todayDateFn();
    job.fromCredit = false;

    if (mode === "paid") {
      const collect = full - adv;
      if (!confirm(`Collect Now: ₹${collect}\nProfit: ₹${profit}`)) return;

      job.paid = full;
      job.remaining = 0;
      job.status = "Completed";

      if (collect > 0) {
        window.addCollectionEntry?.(
          "Service (Paid)",
          `Job ${job.jobId}`,
          collect
        );
      }
    } else {
      const due = full - adv;
      if (!confirm(`Pending Credit: ₹${due}\nProfit added after collect`)) {
        return;
      }

      job.paid = adv;
      job.remaining = due;
      job.status = "Credit";
      job.fromCredit = false;
    }

    persistServices();
    fullRefresh();
  }

  /* ---------------- CREDIT → PAID ---------------- */
  function collectServiceCredit(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const status = String(job.status || "").toLowerCase();
    if (status !== "credit") {
      alert("Already collected / not in credit.");
      return;
    }

    const due = Number(job.remaining || 0);
    if (due <= 0) {
      job.status = "Completed";
      persistServices();
      fullRefresh();
      return;
    }

    if (!confirm(`Collect pending amount ₹${due}?`)) return;

    job.paid = Number(job.paid || 0) + due;
    job.remaining = 0;
    job.status = "Completed";
    job.fromCredit = true;

    window.addCollectionEntry?.(
      "Service (Credit cleared)",
      `Job ${job.jobId}`,
      due
    );

    persistServices();
    fullRefresh();
  }

  window.collectServiceCredit = collectServiceCredit;

  /* ---------------- FAILED ---------------- */
  function markFailed(id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const ret = Number(
      prompt("Advance Returned ₹:", job.advance || 0) || 0
    );

    job.returnedAdvance = ret;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed/Returned";
    job.date_out = todayDateFn();
    job.fromCredit = false;

    persistServices();
    fullRefresh();
  }

  /* =======================================================
     TABLES + FILTERS
  ======================================================= */
  function renderServiceTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();

    const filterType   = qs("#svcFilterType")?.value || "all";
    const filterStatus = qs("#svcFilterStatus")?.value || "all";
    const filterDate   = qs("#svcFilterDate")?.value || "";

    let filtered = [...list];

    /* ---------- TYPE FILTER ---------- */
    if (filterType !== "all") {
      filtered = filtered.filter(j => j.item === filterType);
    }

    /* ---------- STATUS FILTER ---------- */
    if (filterStatus !== "all") {
      const v = filterStatus.toLowerCase();
      filtered = filtered.filter(j => {
        const s = String(j.status || "").toLowerCase();
        if (v === "pending") return s === "pending";
        if (v === "completed") return s === "completed";
        if (v === "credit") return s === "credit";
        if (v === "credit-paid") return s === "completed" && j.fromCredit;
        if (v === "failed") return s === "failed/returned";
        return true;
      });
    }

    /* ---------- DATE FILTER ---------- */
    if (filterDate) {
      filtered = filtered.filter(
        j => j.date_in === filterDate || j.date_out === filterDate
      );
    }

    const pending = filtered.filter(j => j.status === "Pending");
    const history = filtered.filter(j => j.status !== "Pending");

    /* ---------- PENDING TABLE ---------- */
    pendBody.innerHTML =
      pending.length
        ? pending
            .map(
              j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${escSafe(j.customer)}</td>
          <td>${escSafe(j.phone)}</td>
          <td>${escSafe(j.item)}</td>
          <td>${escSafe(j.model)}</td>
          <td>${escSafe(j.problem)}</td>
          <td>Pending</td>
          <td><button class="btn btn-xs svc-view" data-id="${j.id}">
              View / Update
          </button></td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="9">No pending jobs</td></tr>`;

    /* ---------- HISTORY TABLE ---------- */
    histBody.innerHTML =
      history.length
        ? history
            .map(j => {
              const s = String(j.status || "").toLowerCase();
              let st = escSafe(j.status);

              if (s === "credit") {
                st =
                  `Credit <button class="btn btn-xs" onclick="collectServiceCredit('${j.id}')">
                    Collect
                  </button>`;
              }
              return `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${escSafe(j.customer)}</td>
          <td>${escSafe(j.item)}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
          <td>${st}</td>
        </tr>`;
            })
            .join("")
        : `<tr><td colspan="9">No history</td></tr>`;
  }

  /* =======================================================
     PIE — STATUS
  ======================================================= */
  function renderSvcPieStatus() {
    const canvas = qs("#svcPieStatus");
    if (!canvas || typeof Chart === "undefined") return;

    const list = ensureServices();
    const P = list.filter(j => j.status === "Pending").length;
    const C = list.filter(j => j.status === "Completed").length;
    const F = list.filter(j => j.status === "Failed/Returned").length;

    if (pieStatus) pieStatus.destroy();

    pieStatus = new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{ data: [P, C, F] }]
      }
    });
  }

  /* =======================================================
     PIE — MONEY STATUS
  ======================================================= */
  function renderSvcPieMoney() {
    const canvas = qs("#svcPieMoney");
    if (!canvas || typeof Chart === "undefined") return;

    const list = ensureServices();

    const cash = list.filter(
      j => j.status === "Completed" && !j.fromCredit
    ).length;

    const creditPending = list.filter(
      j => j.status === "Credit"
    ).length;

    const creditPaid = list.filter(
      j => j.status === "Completed" && j.fromCredit
    ).length;

    if (pieMoney) pieMoney.destroy();

    pieMoney = new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Cash service", "Credit (pending)", "Credit paid"],
        datasets: [{ data: [cash, creditPending, creditPaid] }]
      }
    });
  }

  /* =======================================================
     EVENTS
  ======================================================= */
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

  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL jobs?")) return;
    window.services = [];
    persistServices();
    fullRefresh();
  });

  /* ⭐ FILTER EVENTS (AUTO REFRESH) */
  qs("#svcFilterType")?.addEventListener("change", fullRefresh);
  qs("#svcFilterStatus")?.addEventListener("change", fullRefresh);
  qs("#svcFilterDate")?.addEventListener("change", fullRefresh);

  window.addEventListener("load", fullRefresh);

  window.renderServiceTables = renderServiceTables;
})();
