/* ===========================================================
   firebase.js — FINAL V15 (ONLINE ONLY + LOGIN GUARD + STABLE)
   ✔ FULL COMPAT MODE (NO IMPORTS)
   ✔ Safe initialization (prevents double loading)
   ✔ Auth + Firestore (error protected)
   ✔ Protects dashboard pages
   ✔ Global methods exposed safely
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   PREVENT DOUBLE LOAD
----------------------------------------------------------- */
if (window.__firebase_loaded) {
  console.warn("firebase.js already loaded → skipped");
  return;
}
window.__firebase_loaded = true;

/* -----------------------------------------------------------
   FIREBASE CONFIG
----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.firebasestorage.app",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a99d933849f4c9482",
  measurementId: "G-7E1V1NLYTR"
};

/* -----------------------------------------------------------
   INITIALIZE (SAFE MODE)
----------------------------------------------------------- */
let auth = null;
let db = null;

try {
  firebase.initializeApp(firebaseConfig);

  auth = firebase.auth();
  db   = firebase.firestore();

  console.log("%c☁️ Firebase connected (COMPAT MODE)", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase init failed:", e);
}

window.auth = auth;
window.db   = db;

/* -----------------------------------------------------------
   PATH HELPERS
----------------------------------------------------------- */
function currentPath() {
  return location.pathname.replace(/\/+$/, "");
}

const PROTECTED = ["/tools/business-dashboard.html"];
const AUTH_PAGES = ["/login.html", "/signup.html", "/reset.html"];

/* -----------------------------------------------------------
   LOCAL EMAIL HELPERS
----------------------------------------------------------- */
function setLocalEmail(email) {
  try { localStorage.setItem("ks-user-email", email); } catch {}
}

function clearLocalEmail() {
  try { localStorage.removeItem("ks-user-email"); } catch {}
}

/* ===========================================================
   AUTH FUNCTIONS
=========================================================== */

window.fsLogin = async function (email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  setLocalEmail(cred?.user?.email || "");
  return cred;
};

window.fsSignUp = async function (email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  setLocalEmail(cred?.user?.email || "");
  return cred;
};

window.fsSendPasswordReset = function (email) {
  return auth.sendPasswordResetEmail(email);
};

window.fsLogout = async function () {
  try { await auth.signOut(); } catch (e) {}
  clearLocalEmail();
  location.href = "/login.html";
};

window.fsCheckAuth = function () {
  return new Promise(res => {
    const off = auth.onAuthStateChanged(u => {
      off();
      res(u);
    });
  });
};

window.getFirebaseUser = () => auth.currentUser || null;

/* ===========================================================
   AUTH STATE LISTENER (PAGE GUARD)
=========================================================== */
auth.onAuthStateChanged(async user => {
  const path = currentPath();

  if (user) {
    const email = user.email || "";
    setLocalEmail(email);

    console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", email);

    // auto sync
    if (typeof cloudPullAllIfAvailable === "function") {
      try { await cloudPullAllIfAvailable(); } catch {}
    }

    // login/signup page → redirect to dashboard
    if (AUTH_PAGES.some(p => path.endsWith(p))) {
      location.replace("/tools/business-dashboard.html");
    }

  } else {
    console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");
    clearLocalEmail();

    // protected page → redirect to login
    if (PROTECTED.some(p => path.endsWith(p))) {
      location.replace("/login.html");
    }
  }
});

/* ===========================================================
   FIRESTORE HELPERS
=========================================================== */
function getCloudUser() {
  return auth.currentUser?.email ||
         localStorage.getItem("ks-user-email") ||
         null;
}

window.cloudSave = async function (collection, data) {
  const user = getCloudUser();
  if (!user) return;

  try {
    await db.collection(collection).doc(user).set({ items: data }, { merge: true });
    console.log("☁️ Saved to cloud:", collection);

    if (typeof cloudPullAllIfAvailable === "function") {
      setTimeout(() => cloudPullAllIfAvailable(), 300);
    }
  } catch (e) {
    console.error("❌ Cloud Save error:", e);
  }
};

window.cloudLoad = async function (collection) {
  const user = getCloudUser();
  if (!user) return [];

  try {
    const snap = await db.collection(collection).doc(user).get();
    if (!snap.exists) return [];
    const data = snap.data() || {};
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error("❌ Cloud Load error:", e);
    return [];
  }
};

let timers = {};
window.cloudSaveDebounced = function (collection, data) {
  clearTimeout(timers[collection]);
  timers[collection] = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 400);
};

/* ===========================================================
   READY
=========================================================== */
console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
