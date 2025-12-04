/* service.js — reworked service / repair manager
   - maintains window.services array
   - renders #svcTable (pending/active) and #svcHistoryTable (completed/history)
   - addServiceJob(), completeJob(), collectServiceCredit(), deleteJob()
   - updates counts: #svcPendingCount, #svcCompletedCount, #svcTotalProfit
   - delegates clicks for collect/delete/complete
   - integrates with collection.js hooks: collectCreditService, addToCollectionHistory, renderCollection
*/

(function () {
  const qs = window.qs || (s => document.querySelector(s));
  const qsa = window.qsa || (s => Array.from(document.querySelectorAll(s)));
  const esc = x => (x === undefined || x === null) ? "" : String(x);

  // ensure global arrays exist
  window.services = Array.isArray(window.services) ? window.services : [];
  window.creditServiceCollected = Array.isArray(window.creditServiceCollected) ? window.creditServiceCollected : [];
  window.collectionHistory = Array.isArray(window.collectionHistory) ? window.collectionHistory : [];

  function todayISO() {
    return (new Date()).toISOString().split("T")[0];
  }

  function parseNumber(v) {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v || 0;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoney(n) {
    return "₹" + Number(parseNumber(n)).toLocaleString();
  }

  // Render tables
  function renderServiceTables() {
    renderPendingTable();
    renderHistoryTable();
    updateCountsAndProfit();
  }

  function renderPendingTable() {
    const tbody = qs("#svcTable tbody");
    if (!tbody) return;
    const pending = (window.services || []).filter(j => {
      const s = String((j.status || "").toLowerCase());
      // consider as pending unless marked completed/collected
      return !(s === "completed" || s === "collected");
    });

    if (!pending.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No pending jobs</td></tr>`;
      return;
    }

    tbody.innerHTML = pending.map((j, i) => {
      const idx = window.services.indexOf(j); // original index
      const id = esc(j.id || ("svc" + (j.date_in || todayISO()) + i));
      const received = esc(j.date_in || j.date || todayISO());
      const customer = esc(j.customer || "-");
      const phone = esc(j.phone || "");
      const item = esc(j.item || j.svcItemType || "-");
      const model = esc(j.model || "");
      const problem = esc(j.problem || j.svcProblem || "-");
      const status = esc(j.status || "pending");
      const statusLabel = `<small style="opacity:.8">${status}</small>`;

      // Actions: complete, collect (if credit), delete
      const collectBtn = `<button class="btn-link svc-collect" data-idx="${idx}" title="Collect">Collect</button>`;
      const completeBtn = `<button class="btn-link svc-complete" data-idx="${idx}" title="Mark Completed">Done</button>`;
      const delBtn = `<button class="btn-link svc-delete" data-idx="${idx}" title="Delete">🗑️</button>`;

      return `
        <tr data-idx="${idx}">
          <td data-label="Job ID">${id}</td>
          <td data-label="Received">${received}</td>
          <td data-label="Customer">${customer}</td>
          <td data-label="Phone">${phone}</td>
          <td data-label="Item">${item}</td>
          <td data-label="Model">${model}</td>
          <td data-label="Problem">${problem}</td>
          <td data-label="Status">${statusLabel}</td>
          <td data-label="Action" style="min-width:140px;display:flex;gap:6px;flex-wrap:wrap;">
            ${completeBtn}
            ${collectBtn}
            ${delBtn}
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderHistoryTable() {
    const tbody = qs("#svcHistoryTable tbody");
    if (!tbody) return;
    const history = (window.services || []).filter(j => {
      const s = String((j.status || "").toLowerCase());
      return (s === "completed" || s === "collected" || j.completedOn);
    });

    if (!history.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No completed jobs</td></tr>`;
      return;
    }

    tbody.innerHTML = history.slice().reverse().map(j => {
      const id = esc(j.id || ("svc" + (j.date_in || todayISO())));
      const received = esc(j.date_in || j.date || "");
      const completed = esc(j.date_out || j.completedOn || "");
      const customer = esc(j.customer || "-");
      const item = esc(j.item || "-");
      const invest = formatMoney(j.invest || j.investment || j.partsCost || 0);
      const paid = formatMoney(j.paid || j.paidAmount || 0);
      const profit = formatMoney(j.profit || ((parseNumber(j.paid || j.paidAmount || 0) - parseNumber(j.invest || 0))));
      const status = esc(j.status || "completed");
      return `
        <tr>
          <td data-label="Job ID">${id}</td>
          <td data-label="Received">${received}</td>
          <td data-label="Completed">${completed}</td>
          <td data-label="Customer">${customer}</td>
          <td data-label="Item">${item}</td>
          <td data-label="Invest">${invest}</td>
          <td data-label="Paid">${paid}</td>
          <td data-label="Profit">${profit}</td>
          <td data-label="Status">${status}</td>
        </tr>
      `;
    }).join("");
  }

  function updateCountsAndProfit() {
    const pendingCountEl = qs("#svcPendingCount");
    const completedCountEl = qs("#svcCompletedCount");
    const totalProfitEl = qs("#svcTotalProfit");

    const pending = (window.services || []).filter(j => {
      const s = String((j.status || "").toLowerCase());
      return !(s === "completed" || s === "collected");
    });
    const completed = (window.services || []).filter(j => {
      const s = String((j.status || "").toLowerCase());
      return (s === "completed" || s === "collected");
    });

    const profitSum = completed.reduce((acc, j) => {
      return acc + parseNumber(j.profit || (parseNumber(j.paid || j.paidAmount || 0) - parseNumber(j.invest || j.partsCost || 0)));
    }, 0);

    if (pendingCountEl) pendingCountEl.textContent = pending.length;
    if (completedCountEl) completedCountEl.textContent = completed.length;
    if (totalProfitEl) totalProfitEl.textContent = formatMoney(profitSum);
  }

  // CRUD operations
  function addServiceJob(job) {
    if (!job) return false;
    const normalized = Object.assign({
      id: job.id || ('svc' + Date.now() + Math.floor(Math.random()*99)),
      date_in: job.date_in || job.date || todayISO(),
      date_out: job.date_out || "",
      customer: job.customer || "",
      phone: job.phone || "",
      item: job.item || job.svcItemType || "Other",
      model: job.model || "",
      problem: job.problem || job.svcProblem || "",
      invest: parseNumber(job.invest || job.partsCost || job.investment || 0),
      paid: parseNumber(job.paid || job.paidAmount || 0),
      profit: job.profit !== undefined ? parseNumber(job.profit) : (parseNumber(job.paid || job.paidAmount || 0) - parseNumber(job.invest || 0)),
      status: job.status || "pending",
      remaining: parseNumber(job.remaining || 0),
      creditStatus: job.creditStatus || "" // "credit" or "collected"
    }, job);

    // avoid simple duplicates by id or by date+customer+item
    const dup = window.services.find(s => s.id === normalized.id || (s.date_in === normalized.date_in && s.customer === normalized.customer && s.item === normalized.item));
    if (dup) return false;

    window.services.push(normalized);
    renderServiceTables();
    if (typeof window.onServicesChanged === "function") {
      try { window.onServicesChanged(window.services); } catch (e) { console.error(e); }
    }
    return true;
  }

  function markJobCompleted(idx) {
    if (typeof idx !== "number" || !window.services[idx]) return false;
    const job = window.services[idx];
    job.status = "completed";
    job.date_out = job.date_out || todayISO();
    // if job has paid & invest, recalc profit
    job.invest = parseNumber(job.invest || 0);
    job.paid = parseNumber(job.paid || 0);
    job.profit = parseNumber(job.profit || (job.paid - job.invest));
    renderServiceTables();
    if (typeof window.onServiceCompleted === "function") {
      try { window.onServiceCompleted(job); } catch (e) { console.error(e); }
    }
    return true;
  }

  function deleteJob(idx) {
    if (typeof idx !== "number" || !window.services[idx]) return false;
    window.services.splice(idx, 1);
    renderServiceTables();
    if (typeof window.onServicesChanged === "function") {
      try { window.onServicesChanged(window.services); } catch (e) { console.error(e); }
    }
    return true;
  }

  // Collect logic for a service job
  function collectServiceAtIndex(idx) {
    const job = window.services[idx];
    if (!job) {
      alert("Job not found");
      return;
    }

    // determine collected amount: prefer creditCollectedAmount, then paidAmount, then remaining
    const collectedAmount = parseNumber(job.creditCollectedAmount || job.paid || job.paidAmount || job.remaining || 0);
    if (collectedAmount <= 0) {
      alert("No amount set to collect for this job");
      return;
    }

    const isCredit = String((job.creditStatus || job.status || "")).toLowerCase() === "credit" || (parseNumber(job.remaining) > 0);

    if (isCredit) {
      // mark as collected in credit-service list
      job.creditStatus = "collected";
      job.status = "collected";
      job.creditCollectedAmount = collectedAmount;
      job.creditCollectedOn = todayISO();

      if (typeof window.collectCreditService === "function") {
        try { window.collectCreditService(job); } catch (e) { console.error("collectCreditService hook failed:", e); }
      } else {
        // fallback: push to window.creditServiceCollected
        const row = {
          date: job.creditCollectedOn || job.date_out || job.date_in || todayISO(),
          customer: job.customer || "",
          phone: job.phone || "",
          item: job.item || "",
          model: job.model || "",
          collected: collectedAmount
        };
        const key = `${row.date}|${row.customer}|${row.item}|${Number(row.collected)}`;
        const exists = window.creditServiceCollected.find(r => `${r.date}|${r.customer}|${r.item}|${Number(r.collected)}` === key);
        if (!exists) window.creditServiceCollected.unshift(row);
        if (typeof window.renderCollection === "function") {
          try { window.renderCollection(); } catch (e) {}
        }
      }

      // update profit/analytics hook
      if (typeof window.onCreditServiceCollected === "function") {
        try { window.onCreditServiceCollected(job); } catch (e) { console.error(e); }
      }

    } else {
      // normal collection -> add to collectionHistory
      const entry = {
        date: todayISO(),
        source: "Service",
        details: `${job.item} ${job.model} — ${job.customer}`,
        amount: collectedAmount
      };
      if (typeof window.addToCollectionHistory === "function") {
        try { window.addToCollectionHistory(entry); } catch (e) { console.error(e); }
      } else {
        // fallback
        const exists = window.collectionHistory.find(r => r.date === entry.date && r.source === entry.source && Number(r.amount) === Number(entry.amount) && r.details === entry.details);
        if (!exists) window.collectionHistory.unshift(entry);
        if (typeof window.renderCollection === "function") {
          try { window.renderCollection(); } catch (e) {}
        }
      }
      job.status = "collected";
      job.paid = (parseNumber(job.paid) || 0) + collectedAmount;
      job.profit = parseNumber(job.paid) - parseNumber(job.invest || 0);
      if (typeof window.onCashServiceCollected === "function") {
        try { window.onCashServiceCollected(job); } catch (e) { console.error(e); }
      }
    }

    // update UI
    renderServiceTables();
    if (typeof window.updateSummaryCards === "function") {
      try { window.updateSummaryCards(); } catch (e) { console.error(e); }
    }
  }

  // Delegated event handlers
  document.addEventListener("click", function (ev) {
    const completeBtn = ev.target.closest(".svc-complete");
    if (completeBtn) {
      ev.preventDefault();
      const idx = parseInt(completeBtn.dataset.idx, 10);
      if (!Number.isNaN(idx)) {
        markJobCompleted(idx);
      }
      return;
    }

    const collectBtn = ev.target.closest(".svc-collect");
    if (collectBtn) {
      ev.preventDefault();
      const idx = parseInt(collectBtn.dataset.idx, 10);
      if (!Number.isNaN(idx)) {
        collectServiceAtIndex(idx);
      }
      return;
    }

    const delBtn = ev.target.closest(".svc-delete");
    if (delBtn) {
      ev.preventDefault();
      const idx = parseInt(delBtn.dataset.idx, 10);
      if (!Number.isNaN(idx)) {
        if (confirm("Delete this job?")) deleteJob(idx);
      }
      return;
    }
  });

  // UI bindings for add & clear
  function attachUIControls() {
    const addBtn = qs("#addServiceBtn");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        // read relevant inputs from DOM
        const date = (qs("#svcReceivedDate") && qs("#svcReceivedDate").value) ? qs("#svcReceivedDate").value : todayISO();
        const customer = qs("#svcCustomer") ? qs("#svcCustomer").value.trim() : "";
        const phone = qs("#svcPhone") ? qs("#svcPhone").value.trim() : "";
        const item = qs("#svcItemType") ? qs("#svcItemType").value : "Other";
        const model = qs("#svcModel") ? qs("#svcModel").value.trim() : "";
        const problem = qs("#svcProblem") ? qs("#svcProblem").value.trim() : "";
        const invest = qs("#svcAdvance") ? parseNumber(qs("#svcAdvance").value) : 0;

        const ok = addServiceJob({
          date_in: date,
          customer, phone, item, model, problem,
          invest,
          status: "pending"
        });

        if (ok) {
          // clear small fields
          if (qs("#svcCustomer")) qs("#svcCustomer").value = "";
          if (qs("#svcPhone")) qs("#svcPhone").value = "";
          if (qs("#svcModel")) qs("#svcModel").value = "";
          if (qs("#svcProblem")) qs("#svcProblem").value = "";
          if (qs("#svcAdvance")) qs("#svcAdvance").value = "";
        } else {
          alert("Job not added (duplicate or invalid)");
        }
      });
    }

    const clearBtn = qs("#clearServiceBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!confirm("Clear all service jobs? This cannot be undone.")) return;
        window.services = [];
        renderServiceTables();
        if (typeof window.onServicesChanged === "function") {
          try { window.onServicesChanged(window.services); } catch (e) {}
        }
      });
    }
  }

  // public API
  window.serviceModule = {
    addServiceJob,
    markJobCompleted,
    deleteJob,
    collectServiceAtIndex,
    renderServiceTables,
    init: function () {
      attachUIControls();
      renderServiceTables();
    }
  };

  // auto init
  document.addEventListener("DOMContentLoaded", function () {
    try {
      window.services = Array.isArray(window.services) ? window.services : [];
      window.creditServiceCollected = Array.isArray(window.creditServiceCollected) ? window.creditServiceCollected : [];
      window.collectionHistory = Array.isArray(window.collectionHistory) ? window.collectionHistory : [];
      window.serviceModule.init();
    } catch (e) {
      console.error("serviceModule init failed:", e);
    }
  });

})();
