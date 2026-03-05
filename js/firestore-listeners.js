/* ===========================================================
   firestore-listeners.js — HARDENED v21
   FULL SAFE + UNSUBSCRIBE + CLOUD WAIT + WRITE LOCK
=========================================================== */

(function () {

/* --------------------------------------------------
   DUPLICATE FILE LOAD BLOCK
-------------------------------------------------- */

if (window.__fsListenersAttached){
  console.warn("🔥 Firestore listeners already attached");
  return;
}

window.__fsListenersAttached = true;
window.__fsUnsubs = [];

console.log(
"%c👂 Firestore listeners system booting...",
"color:#03a9f4;font-weight:bold;"
);


/* ==================================================
   FIREBASE GUARD (FIX #1)
================================================== */

if(!window.db || !window.auth){
  console.error("🔥 Firebase not ready. Listeners aborted.");
  return;
}

const db   = window.db;
const auth = window.auth;


/* ==================================================
   SAFE FUNCTION CALL WRAPPER
================================================== */

function safeCall(fnName){

  const fn = window[fnName];

  if(typeof fn === "function"){
    try{
      fn();
    }catch(err){
      console.warn(`⚠️ ${fnName} crashed`,err);
    }
  }

}


/* ==================================================
   SAFE ARRAY
================================================== */

function safeArray(v){
  return Array.isArray(v) ? v : [];
}


/* ==================================================
   SAFE UI REFRESH
================================================== */

function safeRefresh(){

  safeCall("renderSales");
  safeCall("renderCollection");
  safeCall("renderAnalytics");
  safeCall("renderDashboard");
  safeCall("updateSummaryCards");
  safeCall("renderWithdraw");

  setTimeout(()=>{

    safeCall("updateUniversalBar");
    safeCall("runLedgerAudit");

  },50);

}


/* ==================================================
   COLLECTION WRITE LOCK
================================================== */

function attachCollectionWriteGuard(){

  if(!window.addCollectionEntry) return;
  if(window.__collectionGuardAttached) return;

  window.__collectionGuardAttached = true;

  const oldAdd = window.addCollectionEntry;

  window.__collectionWriteLock = false;

  window.addCollectionEntry = function (...args){

    if(window.__collectionWriteLock){
      console.warn("🚫 Duplicate collection blocked");
      return;
    }

    window.__collectionWriteLock = true;

    try{
      oldAdd(...args);
    }
    finally{

      setTimeout(()=>{

        window.__collectionWriteLock = false;

      },500);

    }

  };

  console.log("🔒 Collection write-lock active");

}


/* ==================================================
   CLEAR OLD LISTENERS
================================================== */

function clearAllListeners(){

  if(!window.__fsUnsubs) return;

  window.__fsUnsubs.forEach(unsub=>{
    try{unsub();}catch{}
  });

  window.__fsUnsubs = [];

  console.log("🧹 Old listeners cleared");

}


/* ==================================================
   WAIT FOR CLOUD READY
================================================== */

function waitForCloudReady(cb){

  if(window.__cloudReady && auth.currentUser){
    cb();
    return;
  }

  const t=setInterval(()=>{

    if(window.__cloudReady && auth.currentUser){
      clearInterval(t);
      cb();
    }

  },300);

}


/* ==================================================
   ATTACH LISTENERS
================================================== */

function attachListeners(){

  clearAllListeners();

  const uid = auth.currentUser.uid;

  const ref =
  db.collection("users")
    .doc(uid)
    .collection("data");

  attachCollectionWriteGuard();


  function listen(docName,handler){

    const unsub =
    ref.doc(docName)
      .onSnapshot(snap=>{

        if(!snap.exists) return;

        /* FIX #2 SAFE SNAPSHOT */
        const data = snap.data() || {};

        handler(data.value);

      });

    window.__fsUnsubs.push(unsub);

  }


/* ================= TYPES ================= */

listen("types",v=>{
  window.types = safeArray(v);
  safeCall("renderTypes");
  console.log("🔄 Types synced");
});


/* ================= STOCK ================= */

listen("stock",v=>{
  window.stock = safeArray(v);
  safeCall("renderStock");
  safeCall("updateUniversalBar");
  console.log("🔄 Stock synced");
});


/* ================= WANTING ================= */

listen("wanting",v=>{
  window.wanting = safeArray(v);
  safeCall("renderWanting");
  console.log("🔄 Wanting synced");
});


/* ================= SALES ================= */

listen("sales",v=>{
  window.sales = safeArray(v);
  safeRefresh();
  console.log("🔄 Sales synced");
});


/* ================= SERVICES ================= */

listen("services",v=>{
  window.services = safeArray(v);
  safeRefresh();
  console.log("🔄 Services synced");
});


/* ================= EXPENSES ================= */

listen("expenses",v=>{
  window.expenses = safeArray(v);
  safeRefresh();
  console.log("🔄 Expenses synced");
});


/* ================= COLLECTIONS ================= */

listen("collections",v=>{
  window.collections = safeArray(v);
  safeRefresh();
  console.log("🔄 Collections synced");
});


/* ================= WITHDRAWALS ================= */

listen("withdrawals",v=>{
  window.__withdrawals = safeArray(v);
  safeCall("renderWithdraw");
  safeCall("updateUniversalBar");
  safeCall("runLedgerAudit");
  console.log("🔄 Withdrawals synced");
});


/* ================= UNIVERSAL METRICS ================= */

listen("unMetrics",v=>{

  window.__unMetrics =
  Object.assign(window.__unMetrics || {},v || {});

  safeCall("updateUniversalBar");
  safeCall("renderDashboard");
  safeCall("renderAnalytics");
  safeCall("runLedgerAudit");

  console.log("🔄 Universal metrics synced");

});


/* ================= OFFSETS ================= */

listen("offsets",v=>{

  window.__offsets =
  Object.assign(window.__offsets || {},v || {});

  safeCall("updateUniversalBar");
  safeCall("runLedgerAudit");

  console.log(
  "%c🔄 Offsets realtime synced",
  "color:#4caf50;font-weight:bold;"
  );

});


/* ================= DASHBOARD OFFSET ================= */

listen("dashboardOffset",v=>{

  window.__dashboardOffset = Number(v || 0);

  safeCall("renderAnalytics");
  safeCall("updateSummaryCards");

  console.log("🔄 Dashboard offset synced");

});


console.log(
"%c👂 Listeners attached for user:",
"color:#4caf50;font-weight:bold;",
uid
);

}


/* ==================================================
   AUTH WATCHER
================================================== */

auth.onAuthStateChanged(user=>{

  if(user){

    waitForCloudReady(()=>{
      attachListeners();
    });

  }
  else{

    clearAllListeners();

  }

});

})();
