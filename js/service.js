/* ===========================================================
   🛠 service.js — Service / Repair Manager (v16 ONLINE)
   • Fully compatible with:
       - core.js v9 (saveServices, toDisplay, todayDate, esc)
       - universalBar.js v3
       - collection.js v8
       - analytics + dashboard
   • Uses cloud-aware saveServices() (NO direct localStorage key mismatch)
   • Safe date handling (toInternalIfNeeded)
   • Centralized refresh after each change
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);

  // Use global helpers from core.js if available
  const escSafe      = window.esc || (x => (x === undefined || x === null) ? "" : String(x));
  const toDisplay    = window.toDisplay        || (d => d);
  const toInternalIf = window.toInternalIfNeeded || (d => d);
  const todayDateFn  = window.todayDate        || (() => new Date().toISOString().slice(0, 10));

  let svcPie = null;

  /* -----------------------------
      STORAGE HELPERS
  ------------------------------ */
  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    // Prefer core.js saveServices (cloud + local sync)
    if (typeof window.saveServices === "function") {
      try {
        window.saveServices();
        return;
      } catch (e) {
        console.warn("saveServices() failed:", e);
      }
    }

    // Fallback: local cache under core.js key
    try {
      localStorage.setItem("service-data", JSON.stringify(window.services));
    } catch (e) {
      console.warn("Service local save error:", e);
    }
  }

  function refreshAllAfterChange() {
    try { renderServiceTables(); }        catch {}
    try { window.renderAnalytics?.(); }   catch {}
    try { window.updateSummaryCards?.(); }catch {}
    try { window.updateUniversalBar?.(); }catch {}
    try { window.renderCollection?.(); }  catch {}
  }

  /* -----------------------------
      JOB ID GENERATOR
  ------------------------------ */
  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(j => Number(j.jobNum || j.jobId) || 0);
    const max  = nums.length ? Math.max(...nums) : 0;
    const n    = max + 1;

    return {
      jobNum: n,
      jobId: String(n).padStart(2, "0")
    };
  }

  /* -----------------------------
      ADD SERVICE JOB
  ------------------------------ */
  function addServiceJob() {

    let received = qs("#svcReceivedDate")?.value || todayDateFn();

    // Use global safe converter (dd-mm-yyyy → yyyy-mm-dd)
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
    refreshAllAfterChange();

    // Clear form fields (optional, small UX)
    try {
      qs("#svcCustomer").value = "";
      qs("#svcPhone").value    = "";
      qs("#svcModel").value    = "";
      qs("#svcProblem").value  = "";
      qs("#svcAdvance").value  = "";
    } catch {}
  }

  /* -----------------------------
      COMPLETE JOB
  ------------------------------ */
  function markCompleted(id) {
    const list = ensureServices();
    const job  = list.find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Amount Collected ₹:", job.paid   || 0) || 0);

    const remaining = full - job.advance;
    const profit    = full - invest;

    if (!confirm(
      `Save this job?\n\n` +
      `Invest: ₹${invest}\n` +
      `Advance: ₹${job.advance}\n` +
      `Full: ₹${full}\n` +
      `Remaining (Customer pays): ₹${remaining}\n` +
      `Profit: ₹${profit}`
    )) return;

    job.invest    = invest;
    job.paid      = full;
    job.remaining = remaining;
    job.profit    = profit;
    job.status    = "Completed";
    job.date_out  = todayDateFn();   // already internal format

    persistServices();
    refreshAllAfterChange();
  }

  /* -----------------------------
      FAIL / RETURNED JOB
  ------------------------------ */
  function markFailed(id) {
    const list = ensureServices();
    const job  = list.find(j => j.id === id);
    if (!job) return;

    const returned = Number(prompt("Advance returned ₹:", job.advance || 0) || 0);

    job.returnedAdvance = returned;
    job.invest    = 0;
    job.paid      = 0;
    job.remaining = 0;
    job.profit    = 0;
    job.status    = "Failed/Returned";
    job.date_out  = todayDateFn();

    persistServices();
    refreshAllAfterChange();
  }

  /* -----------------------------
      DELETE JOB
  ------------------------------ */
  function deleteServiceJob(id) {
    if (!confirm("Delete this job?")) return;

    window.services = ensureServices().filter(j => j.id !== id);
    persistServices();
    refreshAllAfterChange();
  }

  /* -----------------------------
      QUICK POPUP MENU FOR JOB
  ------------------------------ */
  function openJob(id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const msg =
      `Job ${j.jobId}\n` +
      `Customer: ${j.customer}\nPhone: ${j.phone}\n` +
      `Item: ${j.item} - ${j.model}\nProblem: ${j.problem}\nAdvance: ₹${j.advance}\n\n` +
      `1 - Completed\n2 - Failed/Returned`;

    const ch = prompt(msg, "1");
    if (ch === "1") return markCompleted(id);
    if (ch === "2") return markFailed(id);
  }

  /* ==========================================================
       RENDER TABLES (Pending + History)
  ========================================================== */
  function renderServiceTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();

    const pending   = list.filter(j => j.status === "Pending");
    const completed = list.filter(j => j.status === "Completed");
    const failed    = list.filter(j => j.status === "Failed/Returned");

    const badge = s => {
      if (s === "Pending")
        return `<span class="status-credit">Pending</span>`;
      if (s === "Completed")
        return `<span class="status-paid">Completed</span>`;
      return `<span class="status-credit" style="background:#e53935;color:#fff;">Failed</span>`;
    };

    pendBody.innerHTML =
      pending.map(j => `
        <tr>
          <td data-label="Job ID">${j.jobId}</td>
          <td data-label="Received">${toDisplay(j.date_in)}</td>
          <td data-label="Customer">${escSafe(j.customer)}</td>
          <td data-label="Phone">${escSafe(j.phone)}</td>
          <td data-label="Item">${escSafe(j.item)}</td>
          <td data-label="Model">${escSafe(j.model)}</td>
          <td data-label="Problem">${escSafe(j.problem)}</td>
          <td data-label="Status">${badge(j.status)}</td>
          <td data-label="Action">
            <button class="small-btn svc-view" data-id="${j.id}">Open</button>
            <button class="small-btn svc-del" data-id="${j.id}" style="background:#b71c1c">🗑</button>
          </td>
        </tr>
      `).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:0.6;">No pending jobs</td></tr>`;

    histBody.innerHTML =
      [...completed, ...failed].map(j => `
        <tr>
          <td data-label="Job ID">${j.jobId}</td>
          <td data-label="Received">${toDisplay(j.date_in)}</td>
          <td data-label="Completed">${j.date_out ? toDisplay(j.date_out) : "-"}</td>
          <td data-label="Customer">${escSafe(j.customer)}</td>
          <td data-label="Item">${escSafe(j.item)}</td>
          <td data-label="Invest">₹${j.invest}</td>
          <td data-label="Paid">₹${j.paid}</td>
          <td data-label="Profit">₹${j.profit}</td>
          <td data-label="Status">${badge(j.status)}</td>
        </tr>
      `).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:0.6;">No history</td></tr>`;

    // Summary cards
    const pendingCount   = qs("#svcPendingCount");
    const completedCount = qs("#svcCompletedCount");
    const totalProfitEl  = qs("#svcTotalProfit");

    if (pendingCount)   pendingCount.textContent   = pending.length;
    if (completedCount) completedCount.textContent = completed.length;

    const totalProfit = list.reduce((s, j) => s + Number(j.profit || 0), 0);
    if (totalProfitEl) totalProfitEl.textContent = "₹" + totalProfit;

    renderServicePie();
  }

  /* ==========================================================
      PIE CHART
  ========================================================== */
  function renderServicePie() {
    const ctx = qs("#svcPie");
    if (!ctx || typeof Chart === "undefined") return;

    const list = ensureServices();
    const P = list.filter(j => j.status === "Pending").length;
    const C = list.filter(j => j.status === "Completed").length;
    const F = list.filter(j => j.status === "Failed/Returned").length;

    if (svcPie) svcPie.destroy();

    svcPie = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Failed/Returned"],
        datasets: [{
          data: [P, C, F],
          backgroundColor: ["#FFEB3B", "#4CAF50", "#E53935"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  /* ==========================================================
      EVENT BINDINGS
  ========================================================== */
  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    persistServices();
    refreshAllAfterChange();
  });

  document.addEventListener("click", e => {
    if (e.target.classList.contains("svc-view")) {
      openJob(e.target.dataset.id);
    }
    if (e.target.classList.contains("svc-del")) {
      deleteServiceJob(e.target.dataset.id);
    }
  });

  /* ==========================================================
      INIT
  ========================================================== */
  window.addEventListener("load", () => {
    renderServiceTables();
    window.updateUniversalBar?.();
  });

  window.renderServiceTables = renderServiceTables;

})();
