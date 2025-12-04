/* ============================================================
   SERVICE.JS — FINAL V10 (Stable, Integrated)
   ------------------------------------------------------------
   - window.services canonical store
   - add / complete / collect credit logic
   - sync with collection.js via collectCreditService()
   - safe localStorage + optional cloud hook
   - render pending table + history table + counters
=========================================================== */

(function () {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const esc = x => (x === undefined || x === null) ? "" : String(x);
  const num = x => Number(x || 0);
  const todayISO = () => (new Date()).toISOString().split("T")[0];

  // canonical services array
  window.services = Array.isArray(window.services) ? window.services : [];

  /* ===========================
     Persistence
  =========================== */
  function saveServices() {
    try {
      localStorage.setItem("ks-services", JSON.stringify(window.services));
    } catch (e) {
      console.error("saveServices failed", e);
    }
    if (typeof cloudSaveDebounced === "function") {
      cloudSaveDebounced("services", window.services);
    }
  }
  window.saveServices = saveServices;

  /* ===========================
     Utility: uid
  =========================== */
  function uid(prefix = "id") {
    return prefix + "_" + Math.random().toString(36).slice(2, 9);
  }

  /* ===========================
     Add Service Job
     Fields in UI: svcReceivedDate, svcCustomer, svcPhone,
                    svcItemType, svcModel, svcProblem, svcAdvance
  =========================== */
  window.addServiceJob = function () {
    const date_in = qs("#svcReceivedDate")?.value || todayISO();
    const customer = (qs("#svcCustomer")?.value || "").trim();
    const phone = (qs("#svcPhone")?.value || "").trim();
    const item = (qs("#svcItemType")?.value || "Other").trim();
    const model = (qs("#svcModel")?.value || "").trim();
    const problem = (qs("#svcProblem")?.value || "").trim();
    const advance = num(qs("#svcAdvance")?.value || 0);

    if (!customer && !phone && !problem) {
      alert("Provide at least customer name / phone / problem.");
      return;
    }

    const job = {
      id: uid("svc"),
      date_in,
      date_out: null,
      customer,
      phone,
      item,
      model,
      problem,
      invest: 0,          // money spent during service
      paid: advance,      // amount paid so far
      remaining: 0,       // amount yet to be paid
      status: "pending",  // pending / completed / cancelled
      creditStatus: "none", // none / credit / collected
      creditCollectedAmount: 0,
      creditCollectedOn: null,
      createdAt: (new Date()).toISOString()
    };

    // If advance is zero, remaining is 0 until job is completed with final cost
    window.services.unshift(job);
    saveServices();
    renderServiceTables();
    window.updateSummaryCards?.();
    alert("Service job added.");
  };

  /* ===========================
     Complete Job
     - sets invest, final paid amount, status completed
     - determines remaining and credit flag
     - if paid covers everything -> mark collected
  =========================== */
  window.completeServiceJob = function (id, { invest = 0, finalPaid = 0 } = {}) {
    const job = window.services.find(j => j.id === id);
    if (!job) return;

    job.invest = num(invest);
    job.paid = num(job.paid || 0) + num(finalPaid);
    // determine total due: let's assume service price = invest + markup
    // In absence of explicit price field, we'll treat (paid) as what's paid; remaining stays if more due.
    // For simplicity: remaining = Math.max(0, expected - paid). We don't have expected price - so infer:
    // If user paid something and wants to close, we'll mark remaining = 0 and status completed.
    job.remaining = Math.max(0, num(job.remaining || 0));
    job.status = "completed";
    job.date_out = todayISO();

    // If job.paid === 0 -> treat as pending credit equal to some estimate (use invest as default)
    if (job.paid === 0 && job.invest > 0) {
      job.creditStatus = "credit";
      job.remaining = job.invest;
    } else if (job.paid < job.invest) {
      job.creditStatus = "credit";
      job.remaining = job.invest - job.paid;
    } else {
      job.creditStatus = (job.remaining > 0) ? "credit" : "collected";
      job.remaining = Math.max(0, job.remaining);
      if (job.remaining === 0) job.creditStatus = "collected";
    }

    saveServices();
    renderServiceTables();
    window.updateSummaryCards?.();
  };

  /* ===========================
     Collect Credit for a Service Job
     - amount collected moves to creditServiceCollected (collection.js)
     - job.creditStatus -> collected
     - creditCollectedAmount, creditCollectedOn set
     - Adds to investment/profit via external hooks if available
  =========================== */
  window.collectServicePayment = function (id, collectedAmount) {
    collectedAmount = num(collectedAmount || 0);
    const job = window.services.find(j => j.id === id);
    if (!job) {
      alert("Job not found.");
      return;
    }
    if (collectedAmount <= 0) {
      alert("Invalid collect amount.");
      return;
    }

    // Update job bookkeeping
    job.paid = num(job.paid || 0) + collectedAmount;
    job.remaining = Math.max(0, num(job.remaining || 0) - collectedAmount);
    job.creditStatus = (job.remaining > 0) ? "credit" : "collected";
    job.creditCollectedAmount = (job.creditCollectedAmount || 0) + collectedAmount;
    job.creditCollectedOn = todayISO();

    // Persist
    saveServices();
    renderServiceTables();

    // Inform collection module: prefer using collectCreditService() if exists
    try {
      if (typeof window.collectCreditService === "function") {
        window.collectCreditService({
          date_out: job.date_out || todayISO(),
          date_in: job.date_in,
          customer: job.customer,
          phone: job.phone,
          item: job.item,
          model: job.model,
          creditCollectedAmount: collectedAmount,
          creditCollectedOn: job.creditCollectedOn
        });
      } else if (typeof window.addToCollectionHistory === "function") {
        // fallback: push to collectionHistory
        window.addToCollectionHistory({
          date: todayISO(),
          source: "Service (collected)",
          details: `${job.item} ${job.model} — ${job.customer}`,
          amount: collectedAmount
        });
      }
    } catch (err) {
      console.error("collectServicePayment: collection hook failed", err);
    }

    // Update summary/universal bars
    try { window.updateSummaryCards && window.updateSummaryCards(); } catch (e) {}
    try { window.renderCollection && window.renderCollection(); } catch (e) {}

    alert("Collected ₹" + collectedAmount);
  };

  /* ===========================
     Delete a job (from pending or history)
  =========================== */
  window.deleteServiceJob = function (id) {
    if (!confirm("Delete this service job?")) return;
    window.services = window.services.filter(j => j.id !== id);
    saveServices();
    renderServiceTables();
    window.updateSummaryCards?.();
  };

  /* ===========================
     Clear All Jobs
  =========================== */
  window.clearService = function () {
    if (!confirm("Clear all service jobs?")) return;
    window.services = [];
    saveServices();
    renderServiceTables();
    window.updateSummaryCards?.();
  };

  /* ===========================
     Render pending & history tables + counters
  =========================== */
  window.renderServiceTables = function () {
    const pendingBody = qs("#svcTable tbody");
    const historyBody = qs("#svcHistoryTable tbody");
    const pendingCountEl = qs("#svcPendingCount");
    const completedCountEl = qs("#svcCompletedCount");
    const totalProfitEl = qs("#svcTotalProfit");

    const pending = window.services.filter(j => String(j.status).toLowerCase() !== "completed");
    const completed = window.services.filter(j => String(j.status).toLowerCase() === "completed");

    // Pending
    if (pendingBody) {
      if (!pending.length) {
        pendingBody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No pending jobs</td></tr>`;
      } else {
        pendingBody.innerHTML = pending.map(j => `
          <tr data-id="${esc(j.id)}">
            <td>${esc(j.id)}</td>
            <td>${esc(j.date_in)}</td>
            <td>${esc(j.customer || "-")}</td>
            <td>${esc(j.phone || "")}</td>
            <td>${esc(j.item)}</td>
            <td>${esc(j.model)}</td>
            <td>${esc(j.problem)}</td>
            <td>${esc(j.status)}</td>
            <td>
              <button class="btn-link svc-complete" data-id="${esc(j.id)}">Complete</button>
              <button class="btn-link svc-collect" data-id="${esc(j.id)}">Collect</button>
              <button class="btn-link svc-delete" data-id="${esc(j.id)}">Delete</button>
            </td>
          </tr>
        `).join("");
      }
    }

    // History
    if (historyBody) {
      if (!completed.length) {
        historyBody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No completed jobs</td></tr>`;
      } else {
        historyBody.innerHTML = completed.map(j => `
          <tr data-id="${esc(j.id)}">
            <td>${esc(j.id)}</td>
            <td>${esc(j.date_in)}</td>
            <td>${esc(j.date_out || "-")}</td>
            <td>${esc(j.customer || "-")}</td>
            <td>${esc(j.item)}</td>
            <td>₹${num(j.invest || 0)}</td>
            <td>₹${num(j.paid || 0)}</td>
            <td>₹${num((j.paid || 0) - (j.invest || 0))}</td>
            <td>
              ${j.creditStatus === "credit" ? `<span class="status-credit">Pending ₹${num(j.remaining)}</span>` :
                `<span class="status-paid">Collected</span>`}
              <button class="btn-link svc-delete" data-id="${esc(j.id)}">Delete</button>
            </td>
          </tr>
        `).join("");
      }
    }

    // Counters
    if (pendingCountEl) pendingCountEl.textContent = pending.length;
    if (completedCountEl) completedCountEl.textContent = completed.length;

    // Total repair profit: sum of (paid - invest) for completed
    const totalProfit = completed.reduce((s, j) => s + (num(j.paid || 0) - num(j.invest || 0)), 0);
    if (totalProfitEl) totalProfitEl.textContent = "₹" + totalProfit;

    // attach handlers for row buttons (delegated)
  };

  /* ===========================
     Delegated click handlers for table buttons
  =========================== */
  document.addEventListener("click", function (e) {
    // Complete button (opens small prompt to enter invest & finalPaid)
    const comp = e.target.closest(".svc-complete");
    if (comp) {
      const id = comp.dataset.id;
      const invest = prompt("Enter invest/expense for this job (₹)", "0");
      if (invest === null) return;
      const finalPaid = prompt("Enter amount customer paid now (₹)", "0");
      if (finalPaid === null) return;
      window.completeServiceJob(id, { invest: num(invest), finalPaid: num(finalPaid) });
      return;
    }

    // Collect button: ask collect amount, then call collectServicePayment
    const coll = e.target.closest(".svc-collect");
    if (coll) {
      const id = coll.dataset.id;
      const amount = prompt("Enter amount to collect (₹)", "0");
      if (amount === null) return;
      window.collectServicePayment(id, num(amount));
      return;
    }

    // Delete job
    const del = e.target.closest(".svc-delete");
    if (del) {
      const id = del.dataset.id;
      window.deleteServiceJob(id);
      return;
    }
  });

  /* ===========================
     Initialize on load
  =========================== */
  document.addEventListener("DOMContentLoaded", function () {
    // if services exist in localStorage, merge (avoid overwriting window.services if pre-populated)
    try {
      const raw = localStorage.getItem("ks-services");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && !parsed.length === false) {
          // merge non-duplicated by id, keep existing order (window.services may have been set by other modules)
          const map = new Map((window.services || []).map(j => [j.id, j]));
          parsed.forEach(j => {
            if (!map.has(j.id)) map.set(j.id, j);
          });
          window.services = Array.from(map.values());
        }
      }
    } catch (e) {
      console.warn("Failed to hydrate services from storage:", e);
    }

    renderServiceTables();
  });

  // expose render name used across app
  window.renderServiceTables = window.renderServiceTables || function () { renderServiceTables(); };

})();
