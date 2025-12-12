/* ===========================================================
   firebase.js — FINAL V16 (STABLE + COMPAT MODE + LOGIN GUARD)
   ✔ No illegal return
   ✔ No double loading errors
   ✔ Auth + Firestore compat
   ✔ Global methods safe
=========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   PREVENT DOUBLE LOAD (SAFE VERSION)
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
  appId: "1:116390837159:web:a9c45a99d933849f4c9482",
  measurementId: "G-7E1V1NLYTR"
};

/* -----------------------------------------------------------
   INITIALIZE
----------------------------------------------------------- */
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

window.auth = auth;
window.db   = db;

console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");

/* -----------------------------------------------------------
   PATHS
----------------------------------------------------------- */
const PROTECTED = ["/tools/business-dashboard.html"];
const AUTH_PAGES = ["/login.html", "/signup.html", "/reset.html"];

function path() {
  return window.location.pathname || "";
}

/* -----------------------------------------------------------
   EMAIL HELPERS
----------------------------------------------------------- */
function saveEmail(mail) {
  try { localStorage.setItem("ks-user-email", mail); } catch {}
}

function clearEmail() {
  try { localStorage.removeItem("ks-user-email"); } catch {}
}

/* ===========================================================
   AUTH API (COMPAT)
=========================================================== */

window.fsLogin = async (email, pw) => {
  const r = await auth.signInWithEmailAndPassword(email, pw);
  saveEmail(r.user.email);
  return r;
};

window.fsSignUp = async (email, pw) => {
  const r = await auth.createUserWithEmailAndPassword(email, pw);
  saveEmail(r.user.email);
  return r;
};

window.fsSendPasswordReset = email =>
  auth.sendPasswordResetEmail(email);

window.fsLogout = async () => {
  try {
    await auth.signOut();
  } catch {}
  clearEmail();
  window.location.href = "/login.html";
};

window.getFirebaseUser = () => auth.currentUser;

/* ===========================================================
   AUTH STATE LISTENER
=========================================================== */
auth.onAuthStateChanged(async user => {
  const p = path();

  if (user) {
    saveEmail(user.email);
    console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", user.email);

    if (AUTH_PAGES.some(x => p.endsWith(x))) {
      window.location.replace("/tools/business-dashboard.html");
    }

  } else {
    clearEmail();
    console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");

    if (PROTECTED.some(x => p.endsWith(x))) {
      window.location.replace("/login.html");
    }
  }
});

console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
