/* ===========================================================
   service.js — ONLINE MODE — FINAL v23 (CREDIT SAFE)
   ✔ Matches sales.js v21 logic
   ✔ Profit & investment ONLY after collection
   ✔ UniversalBar compatible
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);
  const esc = v => (v == null ? "" : String(v));
  const toDisplay = window.toDisplay || (d => d);
  const toInternal = window.toInternalIfNeeded || (d => d);
  const today = () => new Date().toISOString().slice(0, 10);

  /* --------------------------------------------------
        LOAD CACHE
  -------------------------------------------------- */
  (function init() {
    if (!Array.isArray(window.services)) {
      try {
        window.services = JSON.parse(
          localStorage.getItem("service-data") || "[]"
        );
      } catch {
        window.services = [];
      }
    }
  })();

  function saveServices() {
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch {}

    cloudSaveDebounced?.("services", window.services);
    setTimeout(() => cloudPullAllIfAvailable?.(), 200);
  }

  const list = () => window.services || [];

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

      status: "pending",   // pending | credit | paid | failed
      fromCredit: false
    };

    if (!job.customer || !job.phone || !job.problem)
      return alert("Fill all fields");

    list().push(job);
    saveServices();
    refresh();
  }

  /* --------------------------------------------------
        COMPLETE JOB
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
      j.profit = 0; // 🔥 IMPORTANT
    }

    saveServices();
    refresh();
  }

  /* --------------------------------------------------
        COLLECT SERVICE CREDIT
  -------------------------------------------------- */
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

    // 🔥 Collection history
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
        RENDER TABLES
  -------------------------------------------------- */
  function renderTables() {
    const pBody = qs("#svcTable tbody");
    const hBody = qs("#svcHistoryTable tbody");

    const pending = list().filter(j => j.status === "pending");
    const history = list().filter(j => j.status !== "pending");

    pBody.innerHTML = pending.length ? pending.map(j => `
      <tr>
        <td>${j.jobId}</td>
        <td>${toDisplay(j.date_in)}</td>
        <td>${j.customer}</td>
        <td>${j.phone}</td>
        <td>${j.item}</td>
        <td>${j.problem}</td>
        <td>Pending</td>
        <td>
          <button class="small-btn svc-view" data-id="${j.id}">Update</button>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="8">No pending jobs</td></tr>`;

    hBody.innerHTML = history.length ? history.map(j => `
      <tr>
        <td>${j.jobId}</td>
        <td>${toDisplay(j.date_in)}</td>
        <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
        <td>${j.customer}</td>
        <td>₹${j.invest}</td>
        <td>₹${j.paid}</td>
        <td>₹${j.profit}</td>
        <td>
          ${j.status === "credit"
            ? `Credit <button class="small-btn" onclick="collectServiceCredit('${j.id}')">Collect</button>`
            : j.status}
        </td>
      </tr>
    `).join("") : `<tr><td colspan="8">No history</td></tr>`;
  }

  function refresh() {
    renderTables();
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
    const ch = prompt("1-Paid\n2-Credit\n3-Failed");

    if (ch === "1") completeJob(id, "paid");
    else if (ch === "2") completeJob(id, "credit");
    else if (ch === "3") failJob(id);
  });

  qs("#addServiceBtn")?.addEventListener("click", addJob);

  window.addEventListener("load", refresh);

})();
