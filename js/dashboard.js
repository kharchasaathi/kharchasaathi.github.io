/* =========================================
dashboard.js — FINAL v23 (OPTION 2 SAFE)

✔ Dashboard clear = UI only
✔ No cloud flag
✔ Logout safe
✔ Universal unaffected
✔ Render guard added
========================================= */

(function () {

const qs = s => document.querySelector(s);

/* ---------------------------------------
SAFE TEXT SETTER
--------------------------------------- */
function setText(id, value) {

const el = qs(id);
if (el) el.textContent = value;

}

/* ---------------------------------------
APPLY CLEAR UI
--------------------------------------- */
function applyClearView() {

/* ---------- TODAY ---------- */
setText("#todaySales",    "₹0");
setText("#todayCredit",   "₹0");
setText("#todayExpenses", "₹0");
setText("#todayGross",    "₹0");
setText("#todayNet",      "₹0");

/* ---------- TOTAL ---------- */
setText("#dashProfit",   "₹0");
setText("#dashExpenses", "₹0");
setText("#dashCredit",   "₹0");
setText("#dashInv",      "₹0");

/* ---------- PIE DESTROY ---------- */
if (window.cleanPieChart) {

  try {
    window.cleanPieChart.destroy();
  } catch {}

  window.cleanPieChart = null;
}

}

/* ---------------------------------------
CLEAR DASHBOARD VIEW
--------------------------------------- */
function clearDashboardView() {

if (!confirm(
  "This will clear only Dashboard calculated view.\n\nBusiness data will NOT be deleted.\n\nContinue?"
)) return;

window.__dashboardViewCleared = true;

applyClearView();

}

window.clearDashboardView = clearDashboardView;

/* ---------------------------------------
RENDER GUARD
--------------------------------------- */
function applyGuardIfNeeded() {

if (window.__dashboardViewCleared) {
  applyClearView();
}

}

window.__applyDashboardClearGuard =
applyGuardIfNeeded;

/* ---------------------------------------
CLOUD DATA LOAD
--------------------------------------- */
window.addEventListener(
"cloud-data-loaded",
applyGuardIfNeeded
);

})();
