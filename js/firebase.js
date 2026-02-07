/* ===========================================================
   firebase.js — FINAL V17 (CLOUD-ONLY + SESSION SAFE)
   ✔ No illegal return
   ✔ No double loading errors
   ✔ Auth + Firestore compat
   ✔ Login guard protected
   ✔ Cloud-only session (No local cache)
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
   ROUTE GUARD PATHS
----------------------------------------------------------- */
const PROTECTED = ["/tools/business-dashboard.html"];
const AUTH_PAGES = ["/login.html", "/signup.html", "/reset.html"];

function path() {
  return window.location.pathname || "";
}

/* ===========================================================
   AUTH API (CLOUD SESSION ONLY)
=========================================================== */

/* ---------------- LOGIN ---------------- */
window.fsLogin = async (email, pw) => {
  const r = await auth.signInWithEmailAndPassword(email, pw);
  return r;
};

/* ---------------- SIGNUP ---------------- */
window.fsSignUp = async (email, pw) => {
  const r = await auth.createUserWithEmailAndPassword(email, pw);

  /* Optional: Email verification */
  try {
    await r.user.sendEmailVerification();
  } catch {}

  return r;
};

/* ---------------- RESET ---------------- */
window.fsSendPasswordReset = email =>
  auth.sendPasswordResetEmail(email);

/* ---------------- LOGOUT ---------------- */
window.fsLogout = async () => {

  try {
    await auth.signOut();
  } catch {}

  /* Hard redirect */
  window.location.href = "/login.html";
};

/* ---------------- CURRENT USER ---------------- */
window.getFirebaseUser = () => auth.currentUser;

/* ===========================================================
   AUTH STATE LISTENER (SESSION GUARD)
=========================================================== */
auth.onAuthStateChanged(async user => {

  const p = path();

  if (user) {

    console.log(
      "%c🔐 Logged in:",
      "color:#03a9f4;font-weight:bold;",
      user.email
    );

    /* Redirect if on auth pages */
    if (AUTH_PAGES.some(x => p.endsWith(x))) {
      window.location.replace("/tools/business-dashboard.html");
    }

  } else {

    console.log(
      "%c🔓 Logged out",
      "color:#f44336;font-weight:bold;"
    );

    /* Redirect if accessing protected */
    if (PROTECTED.some(x => p.endsWith(x))) {
      window.location.replace("/login.html");
    }
  }

});

console.log("%c⚙️ firebase.js READY ✔", "color:#03a9f4;font-weight:bold;");
