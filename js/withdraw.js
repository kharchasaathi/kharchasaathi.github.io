/* ======================================================
   withdraw.js — PROFIT WITHDRAW ENGINE v3 (FINAL SAFE)
   ✔ Cloud persistent
   ✔ Universal sync
   ✔ Dashboard sync
   ✔ Refresh safe
   ✔ Event driven
====================================================== */

(function(){

const qs  = s => document.querySelector(s);
const num = v => isNaN(v = Number(v)) ? 0 : v;
const today = () => new Date().toISOString().slice(0,10);

/* ======================================================
      INIT MEMORY SAFE
====================================================== */

window.__withdrawals = window.__withdrawals || [];
window.__unMetrics   = window.__unMetrics || {};

window.__unMetrics.profitWithdrawn =
  num(window.__unMetrics.profitWithdrawn);

/* ======================================================
      SAVE (CLOUD + GLOBAL REFRESH)
====================================================== */

function saveWithdraw(){

  cloudSaveDebounced?.(
    "withdrawals",
    window.__withdrawals
  );

  cloudSaveDebounced?.(
    "unMetrics",
    window.__unMetrics
  );

  /* 🔥 CRITICAL GLOBAL REFRESH EVENT */
  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
}


/* ======================================================
      WITHDRAW ACTION
====================================================== */

function handleWithdraw(){

  const amt  = num(qs("#wdAmount")?.value);
  const note = qs("#wdNote")?.value || "";

  if(amt <= 0)
    return alert("Enter valid amount");

  const m = window.__unMetrics || {};

  const available =
    num(m.saleProfitCollected)
    + num(m.serviceProfitCollected)
    - num(m.expensesLive)
    - num(m.profitWithdrawn);

  if(amt > available)
    return alert("Not enough available profit");

  if(!confirm(`Withdraw ₹${amt} ?`))
    return;

  /* ---------------- STORE WITHDRAW ---------------- */

  window.__withdrawals.push({
    id: uid("wd"),
    date: today(),
    amount: amt,
    note
  });

  window.__unMetrics.profitWithdrawn =
    num(window.__unMetrics.profitWithdrawn) + amt;

  saveWithdraw();

  renderWithdraw();

  /* Safe manual refresh */
  window.updateUniversalBar?.();
  window.renderAnalytics?.();
  window.renderDashboard?.();

  qs("#wdAmount").value="";
  qs("#wdNote").value="";
}


/* ======================================================
      RENDER TABLE
====================================================== */

function renderWithdraw(){

  const tbody = qs("#withdrawTable tbody");
  if(!tbody) return;

  tbody.innerHTML =
    (window.__withdrawals || [])
    .map(w=>`
      <tr>
        <td>${w.date}</td>
        <td>₹${w.amount}</td>
        <td>${w.note || "-"}</td>
      </tr>
    `).join("");
}


/* ======================================================
      CLOUD LOAD RESTORE
====================================================== */

window.addEventListener("cloud-data-loaded", ()=>{

  window.__withdrawals =
    window.__withdrawals || [];

  window.__unMetrics =
    window.__unMetrics || {};

  window.__unMetrics.profitWithdrawn =
    num(window.__unMetrics.profitWithdrawn);

  renderWithdraw();

});


/* ======================================================
      INIT
====================================================== */

qs("#withdrawBtn")
  ?.addEventListener("click", handleWithdraw);

window.renderWithdraw = renderWithdraw;

/* Initial render */
renderWithdraw();

})();
