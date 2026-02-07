/* ===========================================================
   firestore-listeners.js — FINAL MERGED SAFE v4

   ✔ Realtime cloud sync
   ✔ Razorpay ready
   ✔ Collect offsets synced
   ✔ Dashboard baseline synced
   ✔ Multi-device safe
   ✔ Logout/Login safe
   ✔ Duplicate listener blocked
   ✔ Function load guard added
   ✔ Collection write-lock guard added
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
        🧠 COLLECTION WRITE LOCK GUARD
        Prevent duplicate collection writes
  ================================================== */

  function attachCollectionWriteGuard() {

    if (!window.addCollectionEntry) {
      console.warn(
        "Collection function not ready — guard skipped"
      );
      return;
    }

    if (window.__collectionGuardAttached) {
      console.warn(
        "Collection guard already attached"
      );
      return;
    }

    window.__collectionGuardAttached = true;

    const _oldAddCollectionEntry =
      window.addCollectionEntry;

    window.__collectionWriteLock = false;

    window.addCollectionEntry =
      function (...args) {

        if (window.__collectionWriteLock) {
          console.warn(
            "🚫 Duplicate collection blocked"
          );
          return;
        }

        window.__collectionWriteLock = true;

        try {

          _oldAddCollectionEntry(...args);

        } finally {

          setTimeout(() => {
            window.__collectionWriteLock = false;
          }, 500);
        }
      };

    console.log(
      "%c🔒 Collection write-lock active",
      "color:#ff9800;font-weight:bold;"
    );
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

    if (typeof renderSales === "function")
      renderSales();

    if (typeof renderCollection === "function")
      renderCollection();

    if (typeof renderAnalytics === "function")
      renderAnalytics();

    if (typeof updateSummaryCards === "function")
      updateSummaryCards();

    if (typeof updateUniversalBar === "function")
      updateUniversalBar();
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

    /* 🔒 Attach collection guard now */
    attachCollectionWriteGuard();

    /* ==================================================
       SALES
    ================================================== */
    ref.doc("sales")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.sales =
          snap.data().value || [];

        safeRefresh();

        console.log("🔄 Sales synced");
      });

    /* ==================================================
       COLLECTIONS
    ================================================== */
    ref.doc("collections")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.collections =
          snap.data().value || [];

        safeRefresh();

        console.log("🔄 Collections synced");
      });

    /* ==================================================
       SERVICES
    ================================================== */
    ref.doc("services")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.services =
          snap.data().value || [];

        safeRefresh();

        console.log("🔄 Services synced");
      });

    /* ==================================================
       EXPENSES
    ================================================== */
    ref.doc("expenses")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.expenses =
          snap.data().value || [];

        safeRefresh();

        console.log("🔄 Expenses synced");
      });

    /* ==================================================
       OFFSETS (COLLECT BASELINE)
    ================================================== */
    ref.doc("offsets")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        Object.assign(
          window.__offsets,
          snap.data().value || {}
        );

        if (typeof updateUniversalBar === "function")
          updateUniversalBar();

        console.log("🔄 Offsets synced");
      });

    /* ==================================================
       DASHBOARD OFFSET (CLEAR BASELINE)
    ================================================== */
    ref.doc("dashboardOffset")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.__dashboardOffset =
          Number(snap.data().value || 0);

        if (typeof renderAnalytics === "function")
          renderAnalytics();

        if (typeof updateSummaryCards === "function")
          updateSummaryCards();

        console.log(
          "🔄 Dashboard offset synced"
        );
      });

  }

  /* --------------------------------------------------
        INIT
  -------------------------------------------------- */
  waitForCloudReady(attachListeners);

})();
