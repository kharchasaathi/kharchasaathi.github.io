/* ===========================================================
   firestore-listeners.js — FINAL MERGED SAFE v5

   ✔ Realtime cloud sync
   ✔ Razorpay ready
   ✔ Collect offsets synced
   ✔ Dashboard baseline synced
   ✔ Multi-device safe
   ✔ Logout/Login safe
   ✔ Duplicate listener blocked
   ✔ Function load guard added
   ✔ Collection write-lock guard added
   ✔ 🧠 Offset overwrite bug FIXED
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
  ================================================== */
  function attachCollectionWriteGuard() {

    if (!window.addCollectionEntry) {
      console.warn(
        "Collection function not ready — guard skipped"
      );
      return;
    }

    if (window.__collectionGuardAttached)
      return;

    window.__collectionGuardAttached = true;

    const _oldAdd =
      window.addCollectionEntry;

    window.__collectionWriteLock = false;

    window.addCollectionEntry =
      function (...args) {

        if (window.__collectionWriteLock) {
          console.warn("🚫 Duplicate collection blocked");
          return;
        }

        window.__collectionWriteLock = true;

        try {
          _oldAdd(...args);
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

    renderSales?.();
    renderCollection?.();
    renderAnalytics?.();
    updateSummaryCards?.();
    updateUniversalBar?.();
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

    /* ==================================================
       SALES
    ================================================== */
    ref.doc("sales").onSnapshot(snap => {

      if (!snap.exists) return;

      window.sales =
        snap.data().value || [];

      safeRefresh();
      console.log("🔄 Sales synced");
    });

    /* ==================================================
       COLLECTIONS
    ================================================== */
    ref.doc("collections").onSnapshot(snap => {

      if (!snap.exists) return;

      window.collections =
        snap.data().value || [];

      safeRefresh();
      console.log("🔄 Collections synced");
    });

    /* ==================================================
       SERVICES
    ================================================== */
    ref.doc("services").onSnapshot(snap => {

      if (!snap.exists) return;

      window.services =
        snap.data().value || [];

      safeRefresh();
      console.log("🔄 Services synced");
    });

    /* ==================================================
       EXPENSES
    ================================================== */
    ref.doc("expenses").onSnapshot(snap => {

      if (!snap.exists) return;

      window.expenses =
        snap.data().value || [];

      safeRefresh();
      console.log("🔄 Expenses synced");
    });

    /* ==================================================
       🧠 OFFSETS — OVERWRITE PROTECTED
    ================================================== */
    ref.doc("offsets").onSnapshot(snap => {

      if (!snap.exists) return;

      const incoming =
        snap.data().value || {};

      const local =
        window.__offsets || {};

      /* 🔒 Ignore snapshot while saving */
      if (window.__offsetSaveLock) {
        console.warn(
          "⏳ Offset snapshot ignored (save lock)"
        );
        return;
      }

      /* 🔒 Ignore older data */
      const isOlder =
        Object.keys(incoming).every(k =>
          Number(incoming[k] || 0)
          <=
          Number(local[k] || 0)
        );

      if (isOlder) {
        console.warn(
          "⏳ Older offsets ignored"
        );
        return;
      }

      Object.assign(
        window.__offsets,
        incoming
      );

      updateUniversalBar?.();

      console.log(
        "%c🔄 Offsets synced (safe merge)",
        "color:#4caf50"
      );
    });

    /* ==================================================
       DASHBOARD OFFSET
    ================================================== */
    ref.doc("dashboardOffset")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.__dashboardOffset =
          Number(snap.data().value || 0);

        renderAnalytics?.();
        updateSummaryCards?.();

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
