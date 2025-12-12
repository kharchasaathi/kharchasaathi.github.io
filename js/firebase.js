/* ===========================================================
   firebase.js — FINAL V14 (ONLINE ONLY + LOGIN GUARD)
   ✔ COMPAT MODE (NO IMPORT / NO EXPORT)
   ✔ Works with firebase-app-compat.js
   ✔ Auth + Firestore working
   ✔ Protects dashboard pages
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

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
   INITIALIZE (COMPAT)
----------------------------------------------------------- */
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

window.auth = auth;
window.db   = db;

console.log("%c☁️ Firebase connected! (COMPAT MODE)", "color:#4caf50;font-weight:bold;");

/* -----------------------------------------------------------
   PATH HELPERS
----------------------------------------------------------- */
function currentPath() {
  return window.location.pathname || "";
}

const PROTECTED = [ "/tools/business-dashboard.html" ];
const AUTH_PAGES = [ "/login.html", "/signup.html", "/reset.html" ];

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
   AUTH FUNCTIONS (COMPAT API)
=========================================================== */

window.fsLogin = async function(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

window.fsSignUp = async function(email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

window.fsSendPasswordReset = function(email) {
  return auth.sendPasswordResetEmail(email);
};

/* LOGOUT — ALWAYS redirect to login */
window.fsLogout = async function() {
  try { await auth.signOut(); } catch(e) {}
  clearLocalEmail();
  window.location.href = "/login.html";
};

/* Check auth once */
window.fsCheckAuth = function () {
  return new Promise(resolve => {
    const off = auth.onAuthStateChanged(u => {
      off();
      resolve(u);
    });
  });
};

/* Get current user */
window.getFirebaseUser = () => auth.currentUser || null;

/* ===========================================================
   AUTH STATE LISTENER (GUARD)
=========================================================== */
auth.onAuthStateChanged(async user => {
  const path = currentPath();

  if (user) {
    const email = user.email || "";
    setLocalEmail(email);

    console.log("%c🔐 Authenticated:", "color:#03a9f4;font-weight:bold;", email);

    if (typeof cloudPullAllIfAvailable === "function") {
      try { await cloudPullAllIfAvailable(); } catch {}
    }

    // If on login page → move to dashboard
    if (AUTH_PAGES.some(p => path.endsWith(p))) {
      window.location.replace("/tools/business-dashboard.html");
    }

  } else {
    console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");
    clearLocalEmail();

    // Prevent access to protected pages
    if (PROTECTED.some(p => path.endsWith(p))) {
      window.location.replace("/login.html");
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

window.cloudSave = async function(collection, data) {
  const user = getCloudUser();
  if (!user) return;

  try {
    await db.collection(collection).doc(user).set({ items: data }, { merge: true });
    console.log("☁️ Saved:", collection);

    if (typeof cloudPullAllIfAvailable === "function") {
      setTimeout(() => cloudPullAllIfAvailable(), 300);
    }

  } catch (e) {
    console.error("❌ Cloud save error:", e);
  }
};

window.cloudLoad = async function(collection) {
  const user = getCloudUser();
  if (!user) return [];

  try {
    const snap = await db.collection(collection).doc(user).get();
    if (!snap.exists) return [];
    const data = snap.data() || {};
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error("❌ Cloud load error:", e);
    return [];
  }
};

let timers = {};
window.cloudSaveDebounced = function(collection, data) {
  clearTimeout(timers[collection]);
  timers[collection] = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 400);
};

console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
