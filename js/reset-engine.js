/* ===========================================================
   reset-engine.js — FULL SYSTEM RESET ENGINE
   ✔ Cloud safe
   ✔ Offset safe
   ✔ Dashboard safe
   ✔ Universal safe
=========================================================== */

(function(){

/* -----------------------------------------------------------
   RESET ALL DATA
----------------------------------------------------------- */
async function resetAllBusinessData(){

  if(!confirm(
`⚠️ FINAL WARNING

This will DELETE all data permanently.

Types
Stock
Sales
Services
Expenses
Collections
Wanting
Offsets
Dashboard history

Continue?`
  )) return;

  if(!confirm(
    "This cannot be undone.\n\nConfirm RESET?"
  )) return;

  /* ---------------- CLEAR ARRAYS ---------------- */
  window.types       = [];
  window.stock       = [];
  window.sales       = [];
  window.services    = [];
  window.expenses    = [];
  window.collections = [];
  window.wanting     = [];

  /* ---------------- RESET OFFSETS ---------------- */
  window.__offsets = {
    net:0,
    sale:0,
    service:0,
    stock:0,
    servInv:0,
    expenses:0
  };

  /* ---------------- DASHBOARD ---------------- */
  window.__dashboardOffset      = 0;
  window.__dashboardViewCleared = false;

  /* ---------------- UNIVERSAL ---------------- */
  window.__unMetrics = {};

  /* ---------------- SAVE TO CLOUD ---------------- */
  if(window.__cloudReady){

    const save = window.cloudSaveDebounced;

    save("types",[]);
    save("stock",[]);
    save("sales",[]);
    save("services",[]);
    save("expenses",[]);
    save("collections",[]);
    save("wanting",[]);
    save("offsets",window.__offsets);
    save("dashboardOffset",0);
  }

  /* ---------------- UI REFRESH ---------------- */
  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );

  alert("✅ System reset complete.");

  console.log(
    "%c🧨 FULL SYSTEM RESET DONE",
    "color:#ef4444;font-weight:bold;"
  );
}

/* -----------------------------------------------------------
   BUTTON BIND
----------------------------------------------------------- */
document
.getElementById("resetAllDataBtn")
?.addEventListener(
  "click",
  resetAllBusinessData
);

})();
