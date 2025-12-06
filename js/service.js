/* ===========================================================
   🛠 service.js — Service / Repair Manager (v17 ONLINE + CREDIT READY)
   • Fully compatible with:
       - core.js (saveServices, toDisplay, todayDate, esc, metrics)
       - universalBar.js (profit only when status = "Completed")
       - analytics + dashboard
       - future Credit History tab (service credits)
   • OPTION 1:
       🔹 Paid → Profit add immediately
       🔹 Credit → Profit add only after collection (later)
   • Safe date handling (toInternalIfNeeded)
=========================================================== */

(function () {

  const qs = s => document.querySelector(s);

  // Use global helpers from core.js if available
  const escSafe       = window.esc || (x => (x === undefined || x === null) ? "" : String(x));
  const toDisplay     = window.toDisplay          || (d => d);
  const toInternalIf  = window.toInternalIfNeeded || (d => d);
  const todayDateFn   = window.todayDate          || (() => new Date().toISOString().slice(0, 10));

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
    try { renderServiceTables(); }         catch {}
    try { window.renderAnalytics?.(); }    catch {}
    try { window.updateSummaryCards?.(); } catch {}
    try { window.updateUniversalBar?.(); } catch {}
    try { window.renderCollection?.(); }   catch {}
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

      advance,          // already collected when device received
      invest: 0,        // parts cost
      paid: 0,          // total collected (advance + remaining paid)
      remaining: 0,     // pending amount (for credit jobs)
      profit: 0,        // final profit (only counted when status = 'Completed')
      returnedAdvance: 0,

      status: "Pending" // Pending / Completed / Credit / Failed/Returned
    };

    ensureServices().push(job);
    persistServices();
    refreshAllAfterChange();

    // Clear form fields (optional UX)
    try {
      qs("#svcCustomer").value = "";
      qs("#svcPhone").value    = "";
      qs("#svcModel").value    = "";
      qs("#svcProblem").value  = "";
      qs("#svcAdvance").value  = "";
    } catch {}
  }

  /* -----------------------------
      COMPLETE JOB (Paid / Credit)
      mode = "paid" | "credit"
  ------------------------------ */
  function markCompleted(id, mode) {
    const list = ensureServices();
    const job  = list.find(j => j.id === id);
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Bill Amount (Full) ₹:", job.paid || 0) || 0);

    if (!full || full <= 0) {
      alert("Invalid total amount.");
      return;
    }

    const totalProfit = full - invest;
    const alreadyGot  = Number(job.advance || 0); // already taken at receive time

    let confirmMsg = `Job ${job.jobId} — ${job.customer}\n\n` +
                     `Invest: ₹${invest}\n` +
                     `Advance (already taken): ₹${alreadyGot}\n` +
                     `Full Bill: ₹${full}\n`;

    if (mode === "paid") {
      const remainingNow = full - alreadyGot;   // ఈ visit లో తీసుకునే remaining

      confirmMsg +=
        `Remaining (to collect now): ₹${remainingNow}\n` +
        `Final Profit: ₹${totalProfit}\n\n` +
        `Mark as COMPLETED (PAID)?`;

      if (!confirm(confirmMsg)) return;

      job.invest    = invest;
      job.paid      = full;          // full bill collected (advance + remaining)
      job.remaining = 0;
      job.profit    = totalProfit;
      job.status    = "Completed";   // ✅ Profit will count in metrics
      job.date_out  = todayDateFn();
    } else {
      // mode === "credit"
      const remainingDue = full - alreadyGot;   // ఇంకా pending amount

      confirmMsg +=
        `Pending (Credit) after advance: ₹${remainingDue}\n` +
        `Expected Profit (when collected): ₹${totalProfit}\n\n` +
        `Mark as COMPLETED (CREDIT)?`;

      if (!confirm(confirmMsg)) return;

      job.invest    = invest;
      job.paid      = alreadyGot;    // ఇప్పటివరకు వచ్చిన మొత్తం (only advance)
      job.remaining = remainingDue;  // pending credit
      job.profit    = totalProfit;   // profit store అవుతుంది కానీ
      job.status    = "Credit";      // ⚠️ metrics లో ఇంకా count కాదు (status ≠ 'Completed')
      job.date_out  = todayDateFn();
    }

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
      (Now supports Credit option)
  ------------------------------ */
  function openJob(id) {
    const j = ensureServices().find(x => x.id === id);
    if (!j) return;

    const msg =
      `Job ${j.jobId}\n` +
      `Customer: ${j.customer}\nPhone: ${j.phone}\n` +
      `Item: ${j.item} - ${j.model}\nProblem: ${j.problem}\nAdvance: ₹${j.advance}\n\n` +
      `1 - Completed (Paid)\n` +
      `2 - Completed (Credit)\n` +
      `3 - Failed/Returned`;

    const ch = prompt(msg, "1");
    if (ch === "1") return markCompleted(id, "paid");
    if (ch === "2") return markCompleted(id, "credit");
    if (ch === "3") return markFailed(id);
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
    const credit    = list.filter(j => j.status === "Credit");
    const failed    = list.filter(j => j.status === "Failed/Returned");

    const badge = s => {
      if (s === "Pending")
        return `<span class="status-credit">Pending</span>`;
      if (s === "Completed")
        return `<span class="status-paid">Completed</span>`;
      if (s === "Credit")
        return `<span class="status-credit" style="background:#facc15;color:#000;">Credit</span>`;
      return `<span class="status-credit" style="background:#e53935;color:#fff;">Failed</span>`;
    };

    /* ---------- PENDING TABLE ---------- */
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

    /* ---------- HISTORY TABLE (Completed + Credit + Failed) ---------- */
    const historyList = [...completed, ...credit, ...failed];

    histBody.innerHTML =
      historyList.map(j => {
        const isCredit = j.status === "Credit";
        const profitText = isCredit
          ? `₹${j.profit} (credit)`
          : `₹${j.profit}`;

        const paidText = isCredit
          ? `₹${j.paid} (only advance)`
          : `₹${j.paid}`;

        return `
          <tr>
            <td data-label="Job ID">${j.jobId}</td>
            <td data-label="Received">${toDisplay(j.date_in)}</td>
            <td data-label="Completed">${j.date_out ? toDisplay(j.date_out) : "-"}</td>
            <td data-label="Customer">${escSafe(j.customer)}</td>
            <td data-label="Item">${escSafe(j.item)}</td>
            <td data-label="Invest">₹${j.invest}</td>
            <td data-label="Paid">${paidText}</td>
            <td data-label="Profit">${profitText}</td>
            <td data-label="Status">${badge(j.status)}</td>
          </tr>
        `;
      }).join("") ||
      `<tr><td colspan="9" style="text-align:center;opacity:0.6;">No history</td></tr>`;

    // Summary cards
    const pendingCount   = qs("#svcPendingCount");
    const completedCount = qs("#svcCompletedCount");
    const totalProfitEl  = qs("#svcTotalProfit");

    if (pendingCount)   pendingCount.textContent   = pending.length;
    if (completedCount) completedCount.textContent = completed.length;

    // OPTION 1: totalProfit = sum(profit for status === 'Completed')
    const totalProfit = list.reduce((s, j) => {
      if (String(j.status || "").toLowerCase() === "completed") {
        return s + Number(j.profit || 0);
      }
      return s;
    }, 0);

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
