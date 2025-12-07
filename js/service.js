/* ===========================================================
   🛠 service.js — FINAL BUSINESS V25
   ✔ Pending + Cash + Credit Pending + Credit Paid History
   ✔ Profit activates only when collected
   ✔ Collection history entry on credit-clear
   ✔ LIVE Refresh: Dashboard + Analytics + Universal Bar
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);

  const escSafe       = window.esc || (x => x == null ? "" : String(x));
  const toDisplay     = window.toDisplay          || (d => d);
  const toInternalIf  = window.toInternalIfNeeded || (d => d);
  const todayDateFn   = window.todayDate          || (() => new Date().toISOString().slice(0, 10));

  /* ======================================================
        STORAGE + SYNC
  ====================================================== */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); return; } catch {}
    }
    localStorage.setItem("service-data", JSON.stringify(window.services || []));
  }

  function fullRefresh() {
    try { renderServiceTables(); }         catch {}
    try { window.renderAnalytics?.(); }    catch {}
    try { window.updateSummaryCards?.(); } catch {}
    try { window.updateUniversalBar?.(); } catch {}
    try { window.renderCollection?.(); }   catch {}
  }

  /* ======================================================
        NEW JOB
  ====================================================== */
  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum || j.jobId) || 0);
    const max  = nums.length ? Math.max(...nums) : 0;
    const n = max + 1;
    return {
      jobNum: n,
      jobId: String(n).padStart(2, "0")
    };
  }

  function addServiceJob() {

    let received = qs("#svcReceivedDate")?.value || todayDateFn();
    received = toInternalIf(received);

    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone    = (qs("#svcPhone")?.value || "").trim();
    const item     = qs("#svcItemType")?.value || "Other";
    const model    = (qs("#svcModel")?.value || "").trim();
    const problem  = (qs("#svcProblem")?.value || "").trim();
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone, and Problem.");
      return;
    }

    const ids = nextJobId();

    const job = {
      id: "svc_" + Math.random().toString(36).slice(2, 9),
      jobNum: ids.jobNum,
      jobId:  ids.jobId,

      date_in:  received,
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

      status: "Pending"
    };

    ensureServices().push(job);
    persistServices();
    fullRefresh();
  }

  /* ======================================================
      COMPLETE JOB
  ====================================================== */
  function markCompleted(id, mode) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Bill Amount (Full) ₹:", job.paid || 0) || 0);

    if (!full || full <= 0) {
      alert("Invalid total amount.");
      return;
    }

    const totalProfit = full - invest;
    const alreadyGot  = Number(job.advance || 0);

    if (mode === "paid") {

      const collectNow = full - alreadyGot;

      const ok = confirm(
        `Job ${job.jobId}\nCustomer: ${job.customer}\n\n` +
        `Invest: ₹${invest}\nAdvance: ₹${alreadyGot}\nCollect Now: ₹${collectNow}\n` +
        `Final Profit: ₹${totalProfit}\n\nConfirm PAID?`
      );
      if (!ok) return;

      job.invest    = invest;
      job.paid      = full;
      job.remaining = 0;
      job.profit    = totalProfit;
      job.status    = "Completed";
      job.date_out  = todayDateFn();

      if (collectNow > 0) {
        window.addCollectionEntry(
          "Service (Paid)",
          `Job ${job.jobId} — ${job.customer}`,
          collectNow
        );
      }

    } else {
      /** CREDIT MODE **/

      const pendingDue = full - alreadyGot;

      const ok = confirm(
        `Job ${job.jobId}\nCustomer: ${job.customer}\n\n` +
        `Invest: ₹${invest}\nAdvance: ₹${alreadyGot}\nPending Credit: ₹${pendingDue}\n` +
        `Profit will activate only after collection.\n\nConfirm CREDIT?`
      );
      if (!ok) return;

      job.invest    = invest;
      job.paid      = alreadyGot;
      job.remaining = pendingDue;
      job.profit    = totalProfit;     // stored but inactive
      job.status    = "Credit";
      job.date_out  = todayDateFn();
    }

    persistServices();
    fullRefresh();
  }

  /* ======================================================
      CREDIT COLLECTION
  ====================================================== */
  window.collectServiceCredit = function (id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    if (job.status !== "Credit") {
      alert("Not a credit job.");
      return;
    }

    const due = Number(job.remaining || 0);

    if (due <= 0) {
      alert("No pending credit.");
      return;
    }

    if (!confirm(
      `Job ${job.jobId}\nCustomer: ${job.customer}\nCollect Pending: ₹${due}\n\nConfirm?`
    )) return;

    window.addCollectionEntry(
      "Service (Credit Cleared)",
      `Job ${job.jobId} — ${job.customer}`,
      due
    );

    job.paid      = job.paid + due;
    job.remaining = 0;
    job.status    = "Completed";   // ⭐ profit activates now
    persistServices();
    fullRefresh();

    alert("Collected successfully!");
  };

  /* ======================================================
       DELETE
  ====================================================== */
  function deleteServiceJob(id) {
    if (!confirm("Delete this job?")) return;
    window.services = ensureServices().filter(j => j.id !== id);
    persistServices();
    fullRefresh();
  }

  /* ======================================================
       FILTER LOGIC FOR HISTORY TABLE
  ====================================================== */
  function filterHistory(all) {
    const v = qs("#svcView")?.value || "all";

    if (v === "cash") {
      return all.filter(j => j.status === "Completed" && j.remaining === 0);
    }

    if (v === "credit-pending") {
      return all.filter(j => j.status === "Credit" && j.remaining > 0);
    }

    if (v === "credit-paid") {
      return all.filter(j =>
        j.status === "Completed" &&
        j.remaining === 0 &&
        j.paid > 0 &&
        j.advance < j.paid          // means credit cleared
      );
    }

    return all;
  }

  /* ======================================================
       RENDER TABLES
  ====================================================== */
  function renderServiceTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();

    const pending   = list.filter(j => j.status === "Pending");
    const completed = list.filter(j => j.status === "Completed");
    const credit    = list.filter(j => j.status === "Credit");
    const failed    = list.filter(j => j.status === "Failed/Returned");

    /* ---------- PENDING ---------- */
    pendBody.innerHTML =
      pending.map(j => `
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${escSafe(j.customer)}</td>
          <td>${escSafe(j.phone)}</td>
          <td>${escSafe(j.item)}</td>
          <td>${escSafe(j.model)}</td>
          <td>${escSafe(j.problem)}</td>
          <td><span class="status-credit">Pending</span></td>
          <td>
            <button class="small-btn svc-view" data-id="${j.id}">Open</button>
            <button class="small-btn svc-del" data-id="${j.id}" style="background:#b71c1c">🗑</button>
          </td>
        </tr>
      `).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:.6;">No pending</td></tr>`;

    /* ---------- HISTORY FILTER  ---------- */
    let historyAll = [...completed, ...credit, ...failed];
    historyAll = filterHistory(historyAll);

    histBody.innerHTML =
      historyAll.map(j => {
        const isCred = j.status === "Credit" && j.remaining > 0;
        const creditBtn = isCred
          ? `<button class="small-btn"
              style="background:#16a34a;color:white;font-size:11px"
              onclick="collectServiceCredit('${j.id}')">Collect</button>`
          : "";

        const paidText = j.status === "Credit"
          ? `₹${j.paid} (adv)`
          : `₹${j.paid}`;

        const prof = j.status === "Credit"
          ? `₹${j.profit} (credit)`
          : `₹${j.profit}`;

        return `
          <tr>
            <td>${j.jobId}</td>
            <td>${toDisplay(j.date_in)}</td>
            <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
            <td>${escSafe(j.customer)}</td>
            <td>${escSafe(j.item)}</td>
            <td>₹${j.invest}</td>
            <td>${paidText}</td>
            <td>${prof}</td>
            <td>${creditBtn}</td>
          </tr>
        `;
      }).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:.6;">No history</td></tr>`;
  }

  /* ======================================================
       EVENTS
  ====================================================== */
  document.addEventListener("click", e => {
    if (e.target.classList.contains("svc-view"))
      openJob(e.target.dataset.id);

    if (e.target.classList.contains("svc-del"))
      deleteServiceJob(e.target.dataset.id);
  });

  qs("#svcView")?.addEventListener("change", renderServiceTables);

  window.addEventListener("load", () => {
    renderServiceTables();
  });

  /* EXPORT */
  window.renderServiceTables = renderServiceTables;

})();
