/* ======================================================
   withdraw.js — PROFIT WITHDRAW ENGINE v1
====================================================== */

(function(){

const qs  = s => document.querySelector(s);
const num = v => isNaN(v = Number(v)) ? 0 : v;
const today =
  () => new Date().toISOString().slice(0,10);

window.__withdrawals =
  window.__withdrawals || [];

window.__unMetrics =
  window.__unMetrics || {};

window.__unMetrics.profitWithdrawn =
  num(window.__unMetrics.profitWithdrawn);

/* ======================================================
      SAVE
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

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
}


/* ======================================================
      WITHDRAW ACTION
====================================================== */

function handleWithdraw(){

  const amt =
    num(qs("#wdAmount")?.value);

  const note =
    qs("#wdNote")?.value || "";

  if(amt <= 0)
    return alert("Enter valid amount");

  const m = window.__unMetrics || {};

  const available =
    num(m.saleProfitCollected)
    + num(m.serviceProfitCollected)
    - num(m.expensesLive)
    - num(m.profitWithdrawn);

  if(amt > available)
    return alert(
      "Not enough available profit"
    );

  if(!confirm(
    `Withdraw ₹${amt} ?`
  )) return;

  window.__withdrawals.push({
    id: uid("wd"),
    date: today(),
    amount: amt,
    note
  });

  window.__unMetrics.profitWithdrawn += amt;

  saveWithdraw();

  renderWithdraw();
  window.renderAnalytics?.();
  window.updateUniversalBar?.();

  qs("#wdAmount").value="";
  qs("#wdNote").value="";
}


/* ======================================================
      RENDER
====================================================== */

function renderWithdraw(){

  const tbody =
    qs("#withdrawTable tbody");

  if(!tbody) return;

  tbody.innerHTML =
    window.__withdrawals.map(w=>`
      <tr>
        <td>${w.date}</td>
        <td>₹${w.amount}</td>
        <td>${w.note||"-"}</td>
      </tr>
    `).join("");
}


/* ======================================================
      INIT
====================================================== */

window.addEventListener(
  "cloud-data-loaded",
  renderWithdraw
);

qs("#withdrawBtn")
  ?.addEventListener("click", handleWithdraw);

window.renderWithdraw = renderWithdraw;

})();
