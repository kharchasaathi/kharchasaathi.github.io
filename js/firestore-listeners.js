/* ===========================================================
   firestore-listeners.js — FINAL SAFE v1

   ✔ Realtime cloud sync
   ✔ Multi-device safe
   ✔ Razorpay ready
   ✔ Offset compatible
   ✔ Dashboard baseline safe
   ✔ Duplicate listener blocked
=========================================================== */

(function () {

  if (window.__listenersAttached) {
    console.warn("🔥 Firestore listeners already attached");
    return;
  }

  window.__listenersAttached = true;

  /* --------------------------------------------------
        WAIT FOR AUTH + CLOUD READY
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
        ATTACH LISTENERS
  -------------------------------------------------- */
  function attachListeners() {

    const uid = auth.currentUser.uid;

    const baseRef =
      db.collection("users")
        .doc(uid)
        .collection("data");

    console.log(
      "%c👂 Attaching Firestore listeners...",
      "color:#03a9f4;font-weight:bold;"
    );

    /* ==================================================
       SALES LISTENER
    ================================================== */
    baseRef.doc("sales")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        const data = snap.data().value || [];

        window.sales = data;

        renderSales?.();
        updateUniversalBar?.();
        renderAnalytics?.();
        updateSummaryCards?.();

        console.log("🔄 Sales synced");
      });

    /* ==================================================
       COLLECTIONS LISTENER
    ================================================== */
    baseRef.doc("collections")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        window.collections =
          snap.data().value || [];

        renderCollection?.();
        updateUniversalBar?.();
        renderAnalytics?.();

        console.log("🔄 Collections synced");
      });

    /* ==================================================
       OFFSETS LISTENER
    ================================================== */
    baseRef.doc("offsets")
      .onSnapshot(snap => {

        if (!snap.exists) return;

        Object.assign(
          window.__offsets,
          snap.data().value || {}
        );

        updateUniversalBar?.();

        console.log("🔄 Offsets synced");
      });

    /* ==================================================
       DASHBOARD OFFSET LISTENER
    ================================================== */
    baseRef.doc("dashboardOffset")
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
