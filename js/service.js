/* ===========================================================
   service.js — ONLINE MODE — FINAL v23.4 (CREDIT SAFE)
   ✔ Status filter mapping FIXED
   ✔ Page refresh data load FIXED
   ✔ Service pie size FORCE FIXED (Dashboard size)
   ✔ All Dates filter REMOVED
   ✔ Add Job form auto-clear
   ✔ UniversalBar + Analytics compatible
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);
  const esc = v => (v == null ? "" : String(v));
  const toDisplay = window.toDisplay || (d => d);
  const toInternal = window.toInternalIfNeeded || (d => d);
  const today = () => new Date().toISOString().slice(0, 10);

  /* --------------------------------------------------
        LOAD CACHE (SYNC)
  -------------------------------------------------- */
  (function init() {
    try {
      const raw = localStorage.getItem("service-data");
      window.services = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(window.services)) window.services = [];
    } catch {
      window.services = [];
    }
  })();

  const list = () => window.services || [];

  /* --------------------------------------------------
        SAVE (LOCAL + CLOUD)
  -------------------------------------------------- */
  function saveServices() {
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch {}

    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced("services", window.services);
    }

    if (typeof cloudPullAllIfAvailable === "function") {
      setTimeout(() => {
        cloudPullAllIfAvailable();
        refresh();
      }, 200);
    }
  }

  /* --------------------------------------------------
        🔥 PIE SIZE FORCE FIX (MAIN FIX)
  -------------------------------------------------- */
  function ensureServicePieSize() {
    const canvas = document.getElementById("cleanPie");
    if (!canvas) return;

    // Dashboard-equivalent size
    canvas.style.width  = "320px";
    canvas.style.height = "320px";
    canvas.width  = 320;
    canvas.height = 320;

    const parent = canvas.parentElement;
    if (parent) {
      parent.style.minHeight = "340px";
      parent.style.display = "flex";
      parent.style.alignItems = "center";
      parent.style.justifyContent = "center";
    }
  }

  /* --------------------------------------------------
        ADD JOB
  -------------------------------------------------- */
  function addJob() {

    const job = {
      id: uid("svc"),
      jobId: String(list().length + 1).padStart(2, "0"),

      date_in: toInternal(qs("#svcReceivedDate")?.value || today()),
      date_out: "",

      customer: esc(qs("#svcCustomer")?.value),
      phone: esc(qs("#svcPhone")?.value),

      item: qs("#svcItemType")?.value || "",
      model: esc(qs("#svcModel")?.value),
      problem: esc(qs("#svcProblem")?.value),

      advance: Number(qs("#svcAdvance")?.value || 0),

      invest: 0,
      paid: 0,
      remaining: 0,
      profit: 0,

      status: "pending",   // pending | paid | credit | failed
      fromCredit: false
    };

    if (!job.customer || !job.phone || !job.problem)
      return alert("Fill all fields");

    list().push(job);
    saveServices();
    clearAddForm();
    refresh();
  }

  /* --------------------------------------------------
        CLEAR ADD FORM
  -------------------------------------------------- */
  function clearAddForm() {
    [
      "#svcCustomer",
      "#svcPhone",
      "#svcModel",
      "#svcProblem",
      "#svcAdvance"
    ].forEach(id => {
      const el = qs(id);
      if (el) el.value = "";
    });

    const d = qs("#svcReceivedDate");
    if (d) d.value = today();
  }

  /* --------------------------------------------------
        COMPLETE / CREDIT / FAIL
  -------------------------------------------------- */
  function completeJob(id, mode) {
    const j = list().find(x => x.id === id);
    if (!j) return;

    const invest = Number(prompt("Repair Investment ₹:", j.invest) || 0);
    const total  = Number(prompt("Total Bill ₹:", j.paid) || 0);
    if (!total) return alert("Invalid amount");

    j.invest = invest;
    j.date_out = today();

    if (mode === "paid") {
      j.status = "paid";
      j.fromCredit = false;
      j.paid = total;
      j.remaining = 0;
      j.profit = total - invest;
    } else {
      j.status = "credit";
      j.fromCredit = false;
      j.paid = j.advance;
      j.remaining = total - j.advance;
      j.profit = 0;
    }

    saveServices();
    refresh();
  }

  window.collectServiceCredit = function (id) {
    const j = list().find(x => x.id === id);
    if (!j || j.status !== "credit") return;

    if (!confirm(`Collect ₹${j.remaining}?`)) return;

    j.paid += j.remaining;
    j.remaining = 0;
    j.status = "paid";
    j.fromCredit = true;
    j.profit = j.paid - j.invest;

    saveServices();

    window.addCollectionEntry?.(
      "Service (Credit cleared)",
      `${j.item} ${j.model || ""} — ${j.customer}`,
      j.paid
    );

    refresh();
  };

  function failJob(id) {
    const j = list().find(x => x.id === id);
    if (!j) return;

    j.status = "failed";
    j.date_out = today();
    j.invest = j.paid = j.remaining = j.profit = 0;

    saveServices();
    refresh();
  }

  /* --------------------------------------------------
        FILTER + RENDER
  -------------------------------------------------- */
  function renderTables() {

    const statusFilter =
      qs("#svcFilterStatus")?.value?.toLowerCase() || "all";

    const pBody = qs("#svcTable tbody");
    const hBody = qs("#svcHistoryTable tbody");

    const pending = list().filter(j => j.status === "pending");
    let history  = list().filter(j => j.status !== "pending");

    if (statusFilter !== "all") {
      history = history.filter(j => {
        if (statusFilter === "completed") return j.status === "paid" && !j.fromCredit;
        if (statusFilter === "credit")    return j.status === "credit";
        if (statusFilter === "credit-paid") return j.status === "paid" && j.fromCredit;
        if (statusFilter === "failed")    return j.status === "failed";
        return true;
      });
    }

    pBody.innerHTML = pending.length
      ? pending.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.customer}</td>
          <td>${j.phone}</td>
          <td>${j.item}</td>
          <td>${j.problem}</td>
          <td>Pending</td>
          <td><button class="small-btn svc-view" data-id="${j.id}">Update</button></td>
        </tr>
      `).join("")
      : `<tr><td colspan="8">No pending jobs</td></tr>`;

    hBody.innerHTML = history.length
      ? history.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td>${j.customer}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
          <td>${j.status}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="8">No history</td></tr>`;
  }

  /* --------------------------------------------------
        REFRESH (🔥 PIE FIX HOOK)
  -------------------------------------------------- */
  function refresh() {
    renderTables();
    ensureServicePieSize();     // 🔥 KEY LINE
    window.updateUniversalBar?.();
    window.renderAnalytics?.();
  }

  /* --------------------------------------------------
        EVENTS
  -------------------------------------------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".svc-view");
    if (!btn) return;

    const id = btn.dataset.id;
    const ch = prompt("1 - Paid\n2 - Credit\n3 - Failed");

    if (ch === "1") completeJob(id, "paid");
    else if (ch === "2") completeJob(id, "credit");
    else if (ch === "3") failJob(id);
  });

  qs("#addServiceBtn")?.addEventListener("click", addJob);
  qs("#svcFilterStatus")?.addEventListener("change", refresh);

  /* --------------------------------------------------
        INIT — PAGE LOAD FIX
  -------------------------------------------------- */
  window.addEventListener("load", () => {
    setTimeout(() => {
      ensureServicePieSize();
      refresh();
    }, 100);
  });

})();
