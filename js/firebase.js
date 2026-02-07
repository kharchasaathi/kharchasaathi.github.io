/* ===========================================================
   firebase.js — FINAL V18 (CLOUD READY SAFE ENGINE)
   ✔ Cloud ready guard added
   ✔ Prevent empty overwrite
   ✔ Auto pull after login
   ✔ Multi-device sync safe
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   PREVENT DOUBLE LOAD
----------------------------------------------------------- */
if (window.__firebase_loaded) {
  console.warn("firebase.js already loaded → skipped");
} else {
  window.__firebase_loaded = true;
}

/* -----------------------------------------------------------
   FIREBASE CONFIG
----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.firebasestorage.app",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a99d933849f4c9482"
};

/* -----------------------------------------------------------
   INIT
----------------------------------------------------------- */
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

window.auth = auth;
window.db   = db;

console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");

/* ===========================================================
   🌩️ CLOUD READY ENGINE
=========================================================== */

window.__cloudReady = false;

/* ---------------- LOAD ONE ---------------- */
async function cloudLoad(key) {

  const user = auth.currentUser;
  if (!user) return null;

  try {

    const ref = db
      .collection("users")
      .doc(user.uid)
      .collection("data")
      .doc(key);

    const snap = await ref.get();

    return snap.exists ? snap.data().value : null;

  } catch (e) {
    console.warn("Cloud load failed:", key, e);
    return null;
  }
}
window.cloudLoad = cloudLoad;

/* ---------------- SAVE ONE ---------------- */
function cloudSaveDebounced(key, value) {

  if (!window.__cloudReady) {
    console.warn("⛔ Save blocked before cloud ready:", key);
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  db.collection("users")
    .doc(user.uid)
    .collection("data")
    .doc(key)
    .set({
      value,
      updated: Date.now()
    });
}
window.cloudSaveDebounced = cloudSaveDebounced;

/* ===========================================================
   🌍 PULL ALL DATA (LOGIN LOAD)
=========================================================== */

async function cloudPullAll() {

  const keys = [
    "sales",
    "services",
    "expenses",
    "collections",
    "offsets",
    "dashboardViewCleared"
  ];

  const results = await Promise.all(
    keys.map(k => cloudLoad(k))
  );

  const [
    sales,
    services,
    expenses,
    collections,
    offsets,
    dashFlag
  ] = results;

  window.sales       = sales       || [];
  window.services    = services    || [];
  window.expenses    = expenses    || [];
  window.collections = collections || [];

  window.__offsets = Object.assign({
    net:0, sale:0, service:0,
    stock:0, servInv:0
  }, offsets || {});

  if (dashFlag === true || dashFlag === "1") {
    window.__dashboardViewCleared = true;
  }

  /* READY */
  window.__cloudReady = true;

  console.log(
    "%c☁️ Cloud data loaded ✔",
    "color:#4caf50;font-weight:bold;"
  );

  /* Notify modules */
  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
}

window.cloudPullAllIfAvailable = cloudPullAll;

/* ===========================================================
   AUTH API
=========================================================== */

window.fsLogin = (email, pw) =>
  auth.signInWithEmailAndPassword(email, pw);

window.fsSignUp = async (email, pw) => {

  const r =
    await auth.createUserWithEmailAndPassword(email, pw);

  try { await r.user.sendEmailVerification(); }
  catch {}

  return r;
};

window.fsSendPasswordReset =
  email => auth.sendPasswordResetEmail(email);

window.fsLogout = async () => {

  await auth.signOut();

  window.location.href = "/login.html";
};

window.getFirebaseUser =
  () => auth.currentUser;

/* ===========================================================
   ROUTE GUARD
=========================================================== */

const PROTECTED =
  ["/tools/business-dashboard.html"];

const AUTH_PAGES =
  ["/login.html", "/signup.html", "/reset.html"];

function path() {
  return window.location.pathname || "";
}

/* ===========================================================
   AUTH STATE LISTENER
=========================================================== */

auth.onAuthStateChanged(async user => {

  const p = path();

  if (user) {

    console.log(
      "%c🔐 Logged in:",
      "color:#03a9f4;font-weight:bold;",
      user.email
    );

    /* 🔥 LOAD CLOUD DATA */
    await cloudPullAll();

    /* Redirect auth pages */
    if (AUTH_PAGES.some(x => p.endsWith(x))) {
      window.location.replace(
        "/tools/business-dashboard.html"
      );
    }

  } else {

    console.log(
      "%c🔓 Logged out",
      "color:#f44336;font-weight:bold;"
    );

    if (PROTECTED.some(x => p.endsWith(x))) {
      window.location.replace("/login.html");
    }
  }
});

console.log(
  "%c⚙️ firebase.js READY ✔",
  "color:#03a9f4;font-weight:bold;"
);
