/* ===========================================================
   🛠 service.js — Service / Repair Manager (v20 BUSINESS)
   ✔ Old UI intact
   ✔ Credit stored, profit counted only when collected
   ✔ Collection history entry on credit-clear
   ✔ UniversalBar, Dashboard, Analytics live refresh
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);

  const escSafe       = window.esc || (x => x == null ? "" : String(x));
  const toDisplay     = window.toDisplay          || (d => d);
  const toInternalIf  = window.toInternalIfNeeded || (d => d);
  const todayDateFn   = window.todayDate          || (() => new Date().toISOString().slice(0, 10));

  let svcPie = null;

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
        JOB ID
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

  /* ======================================================
        ADD NEW SERVICE JOB
  ====================================================== */
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

      status: "Pending"  // MAIN STATES
                         // Pending / Completed / Credit / Failed/Returned
    };

    ensureServices().push(job);
    persistServices();
    fullRefresh();

    try {
      qs("#svcCustomer").value = "";
      qs("#svcPhone").value    = "";
      qs("#svcModel").value    = "";
      qs("#svcProblem").value  = "";
      qs("#svcAdvance").value  = "";
    } catch {}
  }

  /* ======================================================
      COMPLETE JOB
      mode = "paid" | "credit"
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

      const remainingNow = full - alreadyGot;

      const ok = confirm(
        `Job ${job.jobId}\nCustomer: ${job.customer}\n\n` +
        `Invest: ₹${invest}\nAdvance: ₹${alreadyGot}\n` +
        `Collect Now: ₹${remainingNow}\n` +
        `Final Profit: ₹${totalProfit}\n\n` +
        `Mark COMPLETED (PAID)?`
      );
      if (!ok) return;

      job.invest    = invest;
      job.paid      = full;
      job.remaining = 0;
      job.profit    = totalProfit;     // ⭐ profit activates immediately
      job.status    = "Completed";
      job.date_out  = todayDateFn();

      // Collection history entry for this remainingNow
      if (remainingNow > 0) {
        window.addCollectionEntry(
          "Service (Paid)",
          `Job ${job.jobId} — ${job.customer}`,
          remainingNow
        );
      }

    } else {
      /** mode === credit **/

      const remainingDue = full - alreadyGot;

      const ok = confirm(
        `Job ${job.jobId}\nCustomer: ${job.customer}\n\n` +
        `Invest: ₹${invest}\nAdvance: ₹${alreadyGot}\n` +
        `Pending Credit: ₹${remainingDue}\n` +
        `Profit after collection: ₹${totalProfit}\n\n` +
        `Mark COMPLETED (CREDIT)?`
      );
      if (!ok) return;

      job.invest    = invest;
      job.paid      = alreadyGot;       // only advance received
      job.remaining = remainingDue;     // pending
      job.profit    = totalProfit;      // ⭐ profit STORED but NOT activated yet
      job.status    = "Credit";         // metrics IGNORE now
      job.date_out  = todayDateFn();
    }

    persistServices();
    fullRefresh();
  }

  /* ======================================================
        FAIL / RETURNED JOB
  ====================================================== */
  function markFailed(id) {
    const job = ensureServices().find(j => j.id === id);
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
    fullRefresh();
  }

  /* ======================================================
        DELETE JOB
  ====================================================== */
  function deleteServiceJob(id) {
    if (!confirm("Delete this job?")) return;
    window.services = ensureServices().filter(j => j.id !== id);
    persistServices();
    fullRefresh();
  }

  /* ======================================================
        QUICK MENU
  ====================================================== */
  function openJob(id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const msg =
      `Job ${j.jobId}\n` +
      `Customer: ${j.customer}\nPhone: ${j.phone}\n` +
      `Item: ${j.item} — ${j.model}\nProblem: ${j.problem}\nAdvance: ₹${j.advance}\n\n` +
      `1 — Completed (Paid)\n` +
      `2 — Completed (Credit)\n` +
      `3 — Failed/Returned`;

    const ch = prompt(msg, "1");
    if (ch === "1") return markCompleted(id, "paid");
    if (ch === "2") return markCompleted(id, "credit");
    if (ch === "3") return markFailed(id);
  }

  /* ======================================================
        CREDIT COLLECTION (NEW)
        👉 Activate profit & reduce pending credits
  ====================================================== */
  window.collectServiceCredit = function (id) {
    const job = ensureServices().find(j => j.id === id);
    if (!job) return;

    if (job.status !== "Credit") {
      alert("Not a Credit Job");
      return;
    }

    const due = Number(job.remaining || 0);
    if (due <= 0) {
      alert("No pending credit.");
      return;
    }

    if (!confirm(
      `Job ${job.jobId}\nCustomer: ${job.customer}\n` +
      `Collect Pending: ₹${due}\n\nConfirm?`
    )) return;

    // Cash collected
    window.addCollectionEntry(
      "Service (Credit cleared)",
      `Job ${job.jobId} — ${job.customer}`,
      due
    );

    // Activate profit now
    job.paid      = job.paid + due;
    job.remaining = 0;
    job.status    = "Completed";      // NOW profit is valid
    persistServices();
    fullRefresh();

    alert("Service Credit Collected!");
  };

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

    const badge = s => {
      if (s === "Pending")  return `<span class="status-credit">Pending</span>`;
      if (s === "Completed")return `<span class="status-paid">Completed</span>`;
      if (s === "Credit")   return `<span class="status-credit" style="background:#facc15;color:#000;">Credit</span>`;
      return `<span class="status-credit" style="background:#e53935;color:#fff;">Failed</span>`;
    };

    /* ---------- PENDING TABLE ---------- */
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
          <td>${badge(j.status)}</td>
          <td>
            <button class="small-btn svc-view" data-id="${j.id}">Open</button>
            <button class="small-btn svc-del" data-id="${j.id}" style="background:#b71c1c">🗑</button>
          </td>
        </tr>
      `).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:.6;">No pending jobs</td></tr>`;

    /* ---------- HISTORY TABLE ---------- */
    const historyList = [...completed, ...credit, ...failed];

    histBody.innerHTML =
      historyList.map(j => {
        const isCredit = j.status === "Credit";
        const profitText = isCredit
          ? `₹${j.profit} (credit)`
          : `₹${j.profit}`;

        const paidText = isCredit
          ? `₹${j.paid} (advance)`
          : `₹${j.paid}`;

        const creditBtn =
          isCredit
            ? `<button class="small-btn" style="background:#16a34a;color:white;font-size:11px"
                onclick="collectServiceCredit('${j.id}')">Collect</button>`
            : "";

        return `
          <tr>
            <td>${j.jobId}</td>
            <td>${toDisplay(j.date_in)}</td>
            <td>${j.date_out ? toDisplay(j.date_out) : "-"}</td>
            <td>${escSafe(j.customer)}</td>
            <td>${escSafe(j.item)}</td>
            <td>₹${j.invest}</td>
            <td>${paidText}</td>
            <td>${profitText}</td>
            <td>${badge(j.status)} ${creditBtn}</td>
          </tr>
        `;
      }).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:.6;">No history</td></tr>`;

    /* ---------- SUMMARY CARDS ---------- */
    const pendingCount   = qs("#svcPendingCount");
    const completedCount = qs("#svcCompletedCount");
    const totalProfitEl  = qs("#svcTotalProfit");

    if (pendingCount)   pendingCount.textContent   = pending.length;
    if (completedCount) completedCount.textContent = completed.length;

    // ⭐ profit only from completed = real profit
    const totalProfit = list.reduce((s, j) => {
      if (j.status === "Completed") {
        return s + Number(j.profit || 0);
      }
      return s;
    }, 0);

    if (totalProfitEl) totalProfitEl.textContent = "₹" + totalProfit;

    renderServicePie();
  }

  /* ======================================================
       PIE CHART
  ====================================================== */
  function renderServicePie() {
    const ctx = qs("#svcPie");
    if (!ctx || typeof Chart === "undefined") return;

    const list = ensureServices();
    const P = list.filter(j => j.status === "Pending").length;
    const C = list.filter(j => j.status === "Completed").length;
    const R = list.filter(j => j.status === "Credit").length;
    const F = list.filter(j => j.status === "Failed/Returned").length;

    if (svcPie) svcPie.destroy();

    svcPie = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Pending", "Completed", "Credit", "Failed/Returned"],
        datasets: [{
          data: [P, C, R, F],
          backgroundColor: ["#FFEB3B", "#4CAF50", "#FACC15", "#E53935"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  /* ======================================================
        EVENT BINDINGS
  ====================================================== */
  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);

  qs("#clearServiceBtn")?.addEventListener("click", () => {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    persistServices();
    fullRefresh();
  });

  document.addEventListener("click", e => {
    if (e.target.classList.contains("svc-view")) {
      openJob(e.target.dataset.id);
    }
    if (e.target.classList.contains("svc-del")) {
      deleteServiceJob(e.target.dataset.id);
    }
  });

  /* ======================================================
        INIT
  ====================================================== */
  window.addEventListener("load", () => {
    renderServiceTables();
    window.updateUniversalBar?.();
  });

  window.renderServiceTables = renderServiceTables;

})();
