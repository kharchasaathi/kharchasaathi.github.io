/* ===========================================================
   firestore-listeners.js — HARDENED v18
   FULL SAFE + UNSUBSCRIBE + CLOUD WAIT + WRITE LOCK

   ✔ Listener crash guard
   ✔ Cloud-ready race safe
   ✔ Collection write lock
   ✔ Wanting restored
   ✔ Universal recompute safe
   ✔ Settlement safe
   ✔ Withdraw safe
   ✔ Offset realtime safe
   ✔ Cross-user safe
   ✔ Memory leak safe
   ✔ Multi-device safe
=========================================================== */

(function () {

/* --------------------------------------------------
   DUPLICATE FILE LOAD BLOCK
-------------------------------------------------- */
if (window.__fsListenersAttached) {
  console.warn("🔥 Firestore listeners already attached");
  return;
}

window.__fsListenersAttached = true;
window.__fsUnsubs = [];

console.log(
  "%c👂 Firestore listeners system booting...",
  "color:#03a9f4;font-weight:bold;"
);

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
      console.warn(`⚠️ ${fnName} crashed`, err);
    }
  }
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

  setTimeout(()=>{
    safeCall("updateUniversalBar");
  },50);
}


/* ==================================================
   COLLECTION WRITE LOCK
================================================== */
function attachCollectionWriteGuard(){

  if (!window.addCollectionEntry) return;
  if (window.__collectionGuardAttached) return;

  window.__collectionGuardAttached = true;

  const oldAdd = window.addCollectionEntry;
  window.__collectionWriteLock = false;

  window.addCollectionEntry = function (...args){

    if (window.__collectionWriteLock){
      console.warn("🚫 Duplicate collection blocked");
      return;
    }

    window.__collectionWriteLock = true;

    try{
      oldAdd(...args);
    }finally{
      setTimeout(()=>{
        window.__collectionWriteLock = false;
      },500);
    }
  };

  console.log("🔒 Collection write-lock active");
}


/* ==================================================
   CLEAR OLD LISTENERS (Cross-user safe)
================================================== */
function clearAllListeners(){

  if(!window.__fsUnsubs) return;

  window.__fsUnsubs.forEach(unsub=>{
    try{ unsub(); }catch{}
  });

  window.__fsUnsubs = [];
  console.log("🧹 Old listeners cleared");
}


/* ==================================================
   WAIT FOR CLOUD READY
================================================== */
function waitForCloudReady(cb){

  if (window.__cloudReady && auth.currentUser){
    cb();
    return;
  }

  const t = setInterval(()=>{

    if (window.__cloudReady && auth.currentUser){
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

  function listen(docName, handler){

    const unsub = ref.doc(docName)
      .onSnapshot(snap=>{

        if (!snap.exists) return;

        handler(snap.data().value);

      });

    window.__fsUnsubs.push(unsub);
  }


  /* ================= TYPES ================= */
  listen("types", v=>{
    window.types = v || [];
    safeCall("renderTypes");
    console.log("🔄 Types synced");
  });


  /* ================= STOCK ================= */
  listen("stock", v=>{
    window.stock = v || [];
    safeCall("renderStock");
    safeCall("updateUniversalBar");
    console.log("🔄 Stock synced");
  });


  /* ================= WANTING ================= */
  listen("wanting", v=>{
    window.wanting = v || [];
    safeCall("renderWanting");
    console.log("🔄 Wanting synced");
  });


  /* ================= SALES ================= */
  listen("sales", v=>{
    window.sales = v || [];
    safeRefresh();
    console.log("🔄 Sales synced");
  });


  /* ================= SERVICES ================= */
  listen("services", v=>{
    window.services = v || [];
    safeRefresh();
    console.log("🔄 Services synced");
  });


  /* ================= EXPENSES ================= */
  listen("expenses", v=>{
    window.expenses = v || [];
    safeRefresh();
    console.log("🔄 Expenses synced");
  });


  /* ================= COLLECTIONS ================= */
  listen("collections", v=>{
    window.collections = v || [];
    safeRefresh();
    console.log("🔄 Collections synced");
  });


  /* ================= WITHDRAWALS ================= */
  listen("withdrawals", v=>{
    window.__withdrawals = v || [];
    safeCall("renderWithdraw");
    safeCall("updateUniversalBar");
    console.log("🔄 Withdrawals synced");
  });


  /* ================= UNIVERSAL METRICS ================= */
  listen("unMetrics", v=>{

    window.__unMetrics =
      Object.assign(window.__unMetrics || {}, v || {});

    safeCall("updateUniversalBar");
    safeCall("renderDashboard");
    safeCall("renderAnalytics");

    console.log("🔄 Universal metrics synced");
  });


  /* ================= OFFSETS ================= */
  listen("offsets", v=>{

    window.__offsets =
      Object.assign(window.__offsets || {}, v || {});

    safeCall("updateUniversalBar");

    console.log(
      "%c🔄 Offsets realtime synced",
      "color:#4caf50;font-weight:bold;"
    );
  });


  /* ================= DASHBOARD OFFSET ================= */
  listen("dashboardOffset", v=>{

    window.__dashboardOffset =
      Number(v || 0);

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

  }else{

    clearAllListeners();

  }

});

})();
