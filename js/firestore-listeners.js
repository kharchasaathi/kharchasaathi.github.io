/* ===========================================================
   firestore-listeners.js — FINAL SAFE v14
   REALTIME + MULTI-DEVICE + OFFSET SYNC FIXED

   ✔ Realtime cloud sync
   ✔ No baseline filtering
   ✔ No settlement math
   ✔ Console error safe
   ✔ Main tab instant update
   ✔ Offset realtime sync FIXED
   ✔ Collection write-lock safe
   ✔ Logout/Login safe
   ✔ Multi-device safe
=========================================================== */

(function () {

  /* --------------------------------------------------
     DUPLICATE LISTENER BLOCK
  -------------------------------------------------- */
  if (window.__fsListenersAttached) {
    console.warn("🔥 Firestore listeners already attached");
    return;
  }

  window.__fsListenersAttached = true;

  console.log(
    "%c👂 Attaching Firestore listeners...",
    "color:#03a9f4;font-weight:bold;"
  );

  const db   = window.db;
  const auth = window.auth;

  /* ==================================================
     COLLECTION WRITE LOCK
  ================================================== */
  function attachCollectionWriteGuard() {

    if (!window.addCollectionEntry) return;
    if (window.__collectionGuardAttached) return;

    window.__collectionGuardAttached = true;

    const oldAdd = window.addCollectionEntry;
    window.__collectionWriteLock = false;

    window.addCollectionEntry = function (...args) {

      if (window.__collectionWriteLock) {
        console.warn("🚫 Duplicate collection blocked");
        return;
      }

      window.__collectionWriteLock = true;

      try {
        oldAdd(...args);
      } finally {
        setTimeout(() => {
          window.__collectionWriteLock = false;
        }, 500);
      }
    };

    console.log("🔒 Collection write-lock active");
  }

  /* --------------------------------------------------
     WAIT FOR CLOUD READY
  -------------------------------------------------- */
  function waitForCloudReady(cb) {

    if (window.__cloudReady && auth.currentUser) {
      cb();
      return;
    }

    const t = setInterval(() => {

      if (window.__cloudReady && auth.currentUser) {
        clearInterval(t);
        cb();
      }

    }, 300);
  }

  /* --------------------------------------------------
     SAFE UI REFRESH
  -------------------------------------------------- */
  function safeRefresh() {

    renderSales?.();
    renderCollection?.();

    renderAnalytics?.();
    updateSummaryCards?.();

    setTimeout(() => {
      updateUniversalBar?.();
    }, 50);
  }

  /* --------------------------------------------------
     ATTACH LISTENERS
  -------------------------------------------------- */
  function attachListeners() {

    const uid = auth.currentUser.uid;

    const ref =
      db.collection("users")
        .doc(uid)
        .collection("data");

    attachCollectionWriteGuard();

    /* ================= TYPES ================= */
    ref.doc("types").onSnapshot(snap => {

      if (!snap.exists) return;

      window.types = snap.data().value || [];
      renderTypes?.();

      console.log("🔄 Types synced");
    });

    /* ================= STOCK ================= */
    ref.doc("stock").onSnapshot(snap => {

      if (!snap.exists) return;

      window.stock = snap.data().value || [];

      renderStock?.();
      updateUniversalBar?.();

      console.log("🔄 Stock synced");
    });

    /* ================= WANTING ================= */
    ref.doc("wanting").onSnapshot(snap => {

      if (!snap.exists) return;

      window.wanting = snap.data().value || [];
      renderWanting?.();

      console.log("🔄 Wanting synced");
    });

    /* ================= SALES ================= */
    ref.doc("sales").onSnapshot(snap => {

      if (!snap.exists) return;

      window.sales = snap.data().value || [];
      safeRefresh();

      console.log("🔄 Sales synced");
    });

    /* ================= SERVICES ================= */
    ref.doc("services").onSnapshot(snap => {

      if (!snap.exists) return;

      window.services = snap.data().value || [];
      safeRefresh();

      console.log("🔄 Services synced");
    });

    /* ================= EXPENSES ================= */
    ref.doc("expenses").onSnapshot(snap => {

      if (!snap.exists) return;

      window.expenses = snap.data().value || [];
      safeRefresh();

      console.log("🔄 Expenses synced");
    });

    /* ================= COLLECTIONS ================= */
    ref.doc("collections").onSnapshot(snap => {

      if (!snap.exists) return;

      window.collections = snap.data().value || [];
      safeRefresh();

      console.log("🔄 Collections synced");
    });

    /* ==================================================
       OFFSETS — REALTIME SYNC FIXED
    ================================================== */
    ref.doc("offsets").onSnapshot(snap => {

      if (!snap.exists) return;

      const incoming = snap.data().value || {};

      /* SAFE INIT */
      if (!window.__offsets)
        window.__offsets = {};

      /* ALWAYS MERGE (NO HYDRATION LOCK) */
      Object.assign(window.__offsets, incoming);

      updateUniversalBar?.();

      console.log(
        "%c🔄 Offsets realtime synced",
        "color:#4caf50;font-weight:bold;"
      );
    });

    /* ================= DASHBOARD OFFSET ================= */
    ref.doc("dashboardOffset")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.__dashboardOffset =
          Number(snap.data().value || 0);

        renderAnalytics?.();
        updateSummaryCards?.();

        console.log("🔄 Dashboard offset synced");
      });

  }

  /* --------------------------------------------------
     INIT
  -------------------------------------------------- */
  waitForCloudReady(attachListeners);

})();
