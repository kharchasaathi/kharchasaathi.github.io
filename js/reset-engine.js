/* ===========================================================
   reset-engine.js — FULL SYSTEM RESET ENGINE v3
   ✔ Cloud safe
   ✔ Offset safe
   ✔ Dashboard safe
   ✔ Universal safe
   ✔ Ledger safe
   ✔ Withdraw / GST safe
   ✔ Ledger refresh safe
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
Ledger
Withdraw
GST
Dashboard history

Continue?`
  )) return;

  if(!confirm(
    "This cannot be undone.\n\nConfirm RESET?"
  )) return;


  /* -----------------------------------------------------------
     CLEAR LOCAL ARRAYS
  ----------------------------------------------------------- */

  window.types       = [];
  window.stock       = [];
  window.sales       = [];
  window.services    = [];
  window.expenses    = [];
  window.collections = [];
  window.wanting     = [];


  /* -----------------------------------------------------------
     RESET OFFSETS
  ----------------------------------------------------------- */

  window.__offsets = {

    net:0,
    sale:0,
    service:0,
    stock:0,
    servInv:0,
    expenses:0

  };


  /* -----------------------------------------------------------
     RESET LEDGER CACHE
  ----------------------------------------------------------- */

  if(window.ledgerEngine){

    const L = window.ledgerEngine.getCurrent?.();

    if(L){

      L.salesProfit = 0;
      L.serviceProfit = 0;

      L.salesInvestmentReturn = 0;
      L.serviceInvestmentReturn = 0;

      L.expensesTotal = 0;

      L.withdrawalsTotal = 0;
      L.stockWithdrawTotal = 0;
      L.serviceWithdrawTotal = 0;
      L.openingWithdraw = 0;

      L.gstCollected = 0;
      L.gstPaid = 0;

      L.netFlow = 0;

      /* recalc safety */
      if(window.ledgerEngine?.refresh){
        await window.ledgerEngine.refresh();
      }

    }

  }


  /* -----------------------------------------------------------
     RESET DASHBOARD
  ----------------------------------------------------------- */

  window.__dashboardOffset      = 0;
  window.__dashboardViewCleared = false;


  /* -----------------------------------------------------------
     RESET UNIVERSAL BAR METRICS
  ----------------------------------------------------------- */

  window.__unMetrics = {};


  /* -----------------------------------------------------------
     CLEAR WITHDRAW CACHE
  ----------------------------------------------------------- */

  window.__withdrawHistory = [];


  /* -----------------------------------------------------------
     SAVE RESET TO CLOUD
  ----------------------------------------------------------- */

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

    /* Ledger reset snapshot */

    save("ledgerReset",{

      salesProfit:0,
      serviceProfit:0,

      salesInvestmentReturn:0,
      serviceInvestmentReturn:0,

      expensesTotal:0,

      withdrawalsTotal:0,
      stockWithdrawTotal:0,
      serviceWithdrawTotal:0,
      openingWithdraw:0,

      gstCollected:0,
      gstPaid:0,

      netFlow:0

    });

  }


  /* -----------------------------------------------------------
     REFRESH UI
  ----------------------------------------------------------- */

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );

  window.dispatchEvent(
    new Event("ledger-updated")
  );

  window.dispatchEvent(
    new Event("ledger-ready")
  );

  /* universal bar refresh */
  if(window.renderUniversalBar){
    window.renderUniversalBar();
  }


  /* -----------------------------------------------------------
     COMPLETE
  ----------------------------------------------------------- */

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
