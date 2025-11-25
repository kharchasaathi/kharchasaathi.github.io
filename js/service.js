/* ===========================================================
   🛠 service.js — Service / Repair Manager (v12 FIXED SAFE)
   • Job IDs: 01, 02, 03...
   • Status: Pending / Completed / Failed/Returned
   • Pie chart: Pending / Completed / Failed
=========================================================== */

(function () {

  const qs = function (s) { return document.querySelector(s); };
  const toDisplay  = window.toDisplay  || function (d) { return d || ""; };
  const toInternal = window.toInternal || function (d) { return d || ""; };
  const todayDate  = window.todayDate  || function () {
    return new Date().toISOString().slice(0, 10);
  };
  const esc = function (x) { return (x === undefined || x === null) ? "" : String(x); };

  let svcPie = null;

  function ensureServices() {
    if (!Array.isArray(window.services)) window.services = [];
    return window.services;
  }

  function persistServices() {
    const list = ensureServices();
    if (typeof window.saveServices === "function") {
      try { window.saveServices(); return; } catch (e) {}
    }
    try { localStorage.setItem("services", JSON.stringify(list)); }
    catch (e) { console.warn("Local save error", e); }
  }

  function normalizeDateInput(d) {
    if (!d) return "";
    const parts = d.split("-");
    if (parts[0].length === 2) return toInternal(d);
    return d;
  }

  function nextJobId() {
    const list = ensureServices();
    const nums = list.map(function (j) {
      return Number(j.jobNum || j.jobId) || 0;
    });
    const max = nums.length ? Math.max.apply(null, nums) : 0;
    const n = max + 1;
    return {
      jobNum: n,
      jobId: String(n).padStart(2, "0")
    };
  }

  function addServiceJob() {
    let receivedRaw = qs("#svcReceivedDate") ? qs("#svcReceivedDate").value : todayDate();
    const date_in = normalizeDateInput(receivedRaw);

    const customer = esc(qs("#svcCustomer")?.value || "").trim();
    const phone    = esc(qs("#svcPhone")?.value || "").trim();
    const item     = qs("#svcItemType")?.value || "Other";
    const model    = esc(qs("#svcModel")?.value || "").trim();
    const problem  = esc(qs("#svcProblem")?.value || "").trim();
    const advance  = Number(qs("#svcAdvance")?.value || 0);

    if (!customer || !phone || !problem) {
      alert("Please fill Customer, Phone and Problem.");
      return;
    }

    const ids = nextJobId();

    const job = {
      id: "svc_" + Math.random().toString(36).slice(2, 9),
      jobNum: ids.jobNum,
      jobId: ids.jobId,
      date_in: date_in,
      date_out: "",
      customer: customer,
      phone: phone,
      item: item,
      model: model,
      problem: problem,
      advance: advance,
      invest: 0,
      paid: 0,
      remaining: 0,
      profit: 0,
      returnedAdvance: 0,
      status: "Pending"
    };

    const list = ensureServices();
    list.push(job);
    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  function markCompleted(id) {
    const list = ensureServices();
    const job = list.find(function (j) { return j.id === id; });
    if (!job) return;

    const invest = Number(prompt("Parts / Repair Cost ₹:", job.invest || 0) || 0);
    const full   = Number(prompt("Total Amount Collected ₹:", job.paid || 0) || 0);

    const remaining = full - job.advance;
    const profit    = full - invest;

    if (!confirm(
      "Save this job?\n\nInvest: ₹" + invest +
      "\nAdvance: ₹" + job.advance +
      "\nFull Amount: ₹" + full +
      "\nRemaining: ₹" + remaining +
      "\nProfit: ₹" + profit
    )) return;

    job.invest = invest;
    job.paid = full;
    job.remaining = remaining;
    job.profit = profit;
    job.status = "Completed";
    job.date_out = todayDate();

    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  function markFailed(id) {
    const list = ensureServices();
    const job = list.find(function (j) { return j.id === id; });
    if (!job) return;

    const returned = Number(prompt("Advance returned ₹:", job.advance || 0) || 0);

    job.returnedAdvance = returned;
    job.invest = 0;
    job.paid = 0;
    job.remaining = 0;
    job.profit = 0;
    job.status = "Failed/Returned";
    job.date_out = todayDate();

    persistServices();
    renderServiceTables();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateTabSummaryBar?.();
  }

  function deleteServiceJob(id) {
    if (!confirm("Delete this job?")) return;

    const list = ensureServices();
    window.services = list.filter(function (j) { return j.id !== id; });

    persistServices();
    renderServiceTables();
  }

  function clearAllServices() {
    if (!confirm("Delete ALL service jobs?")) return;
    window.services = [];
    persistServices();
    renderServiceTables();
  }

  function openJob(id) {
    const list = ensureServices();
    const j = list.find(function (x) { return x.id === id; });
    if (!j) return;

    const msg =
      "Job " + j.jobId + "\n" +
      "Customer: " + j.customer + "\n" +
      "Phone: " + j.phone + "\n" +
      "Item: " + j.item + " - " + j.model + "\n" +
      "Problem: " + j.problem + "\n" +
      "Advance: ₹" + j.advance + "\n\n" +
      "1 - Completed\n2 - Failed/Returned";

    const choice = prompt(msg, "1");
    if (choice === "1") return markCompleted(id);
    if (choice === "2") return markFailed(id);
  }

  function renderServiceTables() {
    const pendBody = qs("#svcTable tbody");
    const histBody = qs("#svcHistoryTable tbody");
    if (!pendBody || !histBody) return;

    const list = ensureServices();

    const pending   = list.filter(function (j) { return j.status === "Pending"; });
    const completed = list.filter(function (j) { return j.status === "Completed"; });
    const failed    = list.filter(function (j) { return j.status === "Failed/Returned"; });

    pendBody.innerHTML = pending.map(function (j) {
      return (
        "<tr>" +
        "<td>" + esc(j.jobId) + "</td>" +
        "<td>" + toDisplay(j.date_in) + "</td>" +
        "<td>" + esc(j.customer) + "</td>" +
        "<td>" + esc(j.phone) + "</td>" +
        "<td>" + esc(j.item) + "</td>" +
        "<td>" + esc(j.model) + "</td>" +
        "<td>" + esc(j.problem) + "</td>" +
        "<td>" + esc(j.status) + "</td>" +
        "<td>" +
        "<button class='small-btn svc-view' data-id='" + j.id + "'>Open</button>" +
        "<button class='small-btn svc-del' data-id='" + j.id + "' style='background:#b71c1c;color:#fff'>🗑</button>" +
        "</td></tr>"
      );
    }).join("") || "<tr><td colspan='9'>No pending jobs</td></tr>";

    histBody.innerHTML = [...completed, ...failed].map(function (j) {
      const failedTxt = j.status === "Failed/Returned"
        ? "Failed/Returned (Returned ₹" + (j.returnedAdvance || 0) + ")"
        : "Completed";

      return (
        "<tr>" +
        "<td>" + esc(j.jobId) + "</td>" +
        "<td>" + toDisplay(j.date_in) + "</td>" +
        "<td>" + toDisplay(j.date_out) + "</td>" +
        "<td>" + esc(j.customer) + "</td>" +
        "<td>" + esc(j.item) + "</td>" +
        "<td>₹" + (j.invest || 0) + "</td>" +
        "<td>₹" + (j.paid || 0) + "</td>" +
        "<td>₹" + (j.profit || 0) + "</td>" +
        "<td>" + failedTxt + "</td>" +
        "</tr>"
      );
    }).join("") || "<tr><td colspan='9'>No history</td></tr>";

    qs("#svcPendingCount").textContent   = pending.length;
    qs("#svcCompletedCount").textContent = completed.length;

    const totalProfit = list.reduce(function (s, j) {
      return s + Number(j.profit || 0);
    }, 0);
    qs("#svcTotalProfit").textContent = "₹" + totalProfit;

    renderServicePie();
  }

  function renderServicePie() {
    const ctx = qs("#svcPie");
    if (!ctx) return;

    const list = ensureServices();
    const P = list.filter(function (j) { return j.status === "Pending"; }).length;
    const C = list.filter(function (j) { return j.status === "Completed"; }).length;
    const F = list.filter(function (j) { return j.status === "Failed/Returned"; }).length;

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
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  }

  qs("#addServiceBtn")?.addEventListener("click", addServiceJob);
  qs("#clearServiceBtn")?.addEventListener("click", clearAllServices);

  document.addEventListener("click", function (e) {
    const t = e.target;
    if (t.classList.contains("svc-view"))  openJob(t.dataset.id);
    if (t.classList.contains("svc-del"))   deleteServiceJob(t.dataset.id);
  });

  window.addEventListener("load", renderServiceTables);

  window.renderServiceTables = renderServiceTables;

})();
