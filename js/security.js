/* ===========================================================
   firebase.js — FINAL v14 (ONLINE-ONLY, FIREBASE AUTH + FIRESTORE)
   ✔ Uses Firebase Auth only (no local fake login)
   ✔ Exposes firebaseSaveCollection / firebaseLoadCollection for core.js
   ✔ Debounced cloud saves to avoid write storms
   ✔ Saves ks-user-email after login (for UI)
   ✔ Protects business pages (redirects if not logged in)
   ✔ Logout always redirects to /login.html (guaranteed)
   ========================================================== */

console.log("%c🔥 firebase.js v14 loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   FIREBASE CONFIG — replace with your own credentials if needed
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
   INIT FIREBASE (compat libs expected to be loaded)
----------------------------------------------------------- */
let db = null;
let auth = null;
let firebaseReady = false;

try {
  if (!window.firebase || !window.firebase.initializeApp) {
    console.warn("Firebase SDK missing — ensure firebase-app-compat.js & firebase-auth-compat.js & firebase-firestore-compat.js are loaded.");
  } else {
    firebase.initializeApp(firebaseConfig);
    db   = firebase.firestore();
    auth = firebase.auth();
    firebaseReady = true;
    console.log("%c☁️ Firebase initialized", "color:#4caf50;font-weight:bold;");
  }
} catch (err) {
  console.error("❌ Firebase initialization failed:", err);
}

/* -----------------------------------------------------------
   PATH GUARDS / ROUTES
----------------------------------------------------------- */
function currentPath() {
  return (window.location && window.location.pathname) ? window.location.pathname : "";
}

const PROTECTED_PATHS = [
  "/tools/business-dashboard.html"
];

const AUTH_PAGES = [
  "/login.html",
  "/signup.html",
  "/reset.html"
];

/* -----------------------------------------------------------
   LOCAL EMAIL STORAGE (UI convenience)
----------------------------------------------------------- */
function setLocalEmail(email) {
  try { localStorage.setItem("ks-user-email", email || ""); } catch {}
}

function clearLocalEmail() {
  try { localStorage.removeItem("ks-user-email"); } catch {}
}

/* ===========================================================
   AUTH HELPERS (ONLINE ONLY)
   Exposed functions:
     - fsLogin(email,password)
     - fsSignUp(email,password)
     - fsLogout()
     - fsSendPasswordReset(email)
     - fsCheckAuth() -> Promise<user|null>
     - getFirebaseUser()
=========================================================== */

async function _fsLogin(email, password) {
  if (!firebaseReady || !auth) throw new Error("Firebase not ready");
  const cred = await auth.signInWithEmailAndPassword(email, password);
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
}
window.fsLogin = _fsLogin;
window.fsSignIn = _fsLogin; // alias

window.fsSignUp = async function (email, password) {
  if (!firebaseReady || !auth) throw new Error("Firebase not ready");
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try { await cred.user.sendEmailVerification(); } catch (e) { /* ignore */ }
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

window.fsSendPasswordReset = async function (email) {
  if (!firebaseReady || !auth) throw new Error("Firebase not ready");
  return auth.sendPasswordResetEmail(email);
};

window.fsLogout = async function () {
  try {
    if (firebaseReady && auth) {
      await auth.signOut();
    }
  } catch (e) {
    console.error("Logout error:", e);
  } finally {
    clearLocalEmail();
    // HARD REDIRECT to /login.html — ensures logout even if auth failed
    window.location.href = "/login.html";
  }
};

window.fsCheckAuth = function () {
  return new Promise(resolve => {
    if (!firebaseReady || !auth) return resolve(null);
    const off = auth.onAuthStateChanged(user => {
      off();
      resolve(user);
    });
  });
};

window.getFirebaseUser = function () {
  try { return (firebaseReady && auth) ? auth.currentUser : null; }
  catch { return null; }
};

/* ===========================================================
   FIRESTORE SAVE / LOAD IMPLEMENTATION (used by core)
   Exposes:
     - window.firebaseSaveCollection(collectionName, arr)
     - window.firebaseLoadCollection(collectionName) -> array|null
   Implementation notes:
     - Uses document id = user's email (safe and per-user)
     - Stores: { items: [...] }
     - Returns boolean or array, never throws (internal errors logged)
=========================================================== */

function _getCloudUserId() {
  const fbUser = getFirebaseUser();
  if (fbUser && fbUser.email) return fbUser.email;
  // fallback: if local ks-user-email present (shouldn't in pure-online, but safe)
  return localStorage.getItem("ks-user-email") || null;
}

async function firebaseSaveCollection(collection, arr) {
  if (!firebaseReady || !db) {
    console.warn("firebaseSaveCollection skipped: Firebase not ready");
    return false;
  }

  const userId = _getCloudUserId();
  if (!userId) {
    console.warn("firebaseSaveCollection skipped: no authenticated user");
    return false;
  }

  try {
    // Write under doc = userId, field items = arr
    await db.collection(collection).doc(userId).set({ items: arr }, { merge: true });
    // small log
    // console.log(`☁️ Saved collection ${collection} (${arr?.length || 0}) for ${userId}`);
    return true;
  } catch (err) {
    console.error("firebaseSaveCollection error:", collection, err);
    return false;
  }
}
window.firebaseSaveCollection = firebaseSaveCollection;

async function firebaseLoadCollection(collection) {
  if (!firebaseReady || !db) {
    console.warn("firebaseLoadCollection skipped: Firebase not ready");
    return null;
  }

  const userId = _getCloudUserId();
  if (!userId) {
    // no user — return null to let caller treat as offline/no-data
    return null;
  }

  try {
    const snap = await db.collection(collection).doc(userId).get();
    if (!snap.exists) return [];
    const data = snap.data() || {};
    return Array.isArray(data.items) ? data.items : [];
  } catch (err) {
    console.error("firebaseLoadCollection error:", collection, err);
    return null;
  }
}
window.firebaseLoadCollection = firebaseLoadCollection;

/* -----------------------------------------------------------
   Debounced cloud save wrapper — exposes cloudSaveDebounced
   Usage: cloudSaveDebounced(collectionKey, arr)
----------------------------------------------------------- */
const _debTimers = {};
window.cloudSaveDebounced = function(collectionKey, arr, wait = 600) {
  // map core's storageKey -> firestore collection name if needed
  // core.js calls cloudSync/cloudSave which will invoke firebaseSaveCollection through its abstraction
  if (_debTimers[collectionKey]) clearTimeout(_debTimers[collectionKey]);
  _debTimers[collectionKey] = setTimeout(async () => {
    try {
      // core's CLOUD_COLLECTIONS map may have been available; but use the passed collectionKey name mapping in core
      // We will attempt to look up CLOUD_COLLECTIONS mapping if available
      let colName = null;
      try {
        if (typeof CLOUD_COLLECTIONS !== "undefined" && CLOUD_COLLECTIONS[collectionKey]) {
          colName = CLOUD_COLLECTIONS[collectionKey];
        }
      } catch (e) {}
      // fallback: use collectionKey as-is
      const target = colName || collectionKey;
      await firebaseSaveCollection(target, arr);
    } catch (err) {
      console.warn("cloudSaveDebounced error:", err);
    }
  }, wait);
};

/* ===========================================================
   AUTH STATE LISTENER — login guard / redirect logic
   - When logged in: save ks-user-email, pull cloud data (via core's cloudPullAllIfAvailable)
   - When logged out: clear local email and redirect away from protected pages
=========================================================== */
if (firebaseReady && auth) {
  auth.onAuthStateChanged(async user => {
    const path = currentPath();

    if (user) {
      const email = user.email || "";
      setLocalEmail(email);
      console.log("%c🔐 Firebase: logged in →", "color:#03a9f4;font-weight:bold;", email);

      // After login, trigger core cloud pull if available
      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch (e) { console.warn("cloudPullAllIfAvailable error:", e); }
      }

      // If user is on auth pages, redirect to dashboard
      if (AUTH_PAGES.some(p => path.endsWith(p))) {
        try { window.location.replace("/tools/business-dashboard.html"); } catch(e){}
      }
    } else {
      // logged out
      clearLocalEmail();
      console.log("%c🔓 Firebase: logged out", "color:#f44336;font-weight:bold;");

      // If current path is protected, force redirect to login
      if (PROTECTED_PATHS.some(p => path.endsWith(p))) {
        try { window.location.replace("/login.html"); } catch(e){}
      }
    }

    // Always update email tag UI if available
    try { if (typeof window.updateEmailTag === "function") window.updateEmailTag(); } catch (e) { console.warn(e); }
  });
}

/* ===========================================================
   EXPORT / BACKWARD-COMPATIBILITY
   - core.js expects window.firebaseSaveCollection / window.firebaseLoadCollection
   - older modules might call cloudSaveDebounced; we've exposed it
=========================================================== */
window.firebaseSaveCollection = firebaseSaveCollection;
window.firebaseLoadCollection = firebaseLoadCollection;
window.setLocalEmail = setLocalEmail;
window.clearLocalEmail = clearLocalEmail;

console.log("%c⚙️ firebase.js v14 READY (ONLINE-ONLY)", "color:#03a9f4;font-weight:bold;");
