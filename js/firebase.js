/* ===========================================================
   firebase.js — FINAL V13 (ONLINE ONLY + LOGIN GUARD + FIXED LOGOUT)
   ✔ Firebase Auth + Firestore
   ✔ Works with core.js cloudPullAllIfAvailable()
   ✔ Saves ks-user-email after login
   ✔ Protects Business pages (auto-redirect to login)
   ✔ Logout ALWAYS redirects to login.html (fixed)
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
   INITIALIZE
----------------------------------------------------------- */
let db = null;
let auth = null;

try {
  firebase.initializeApp(firebaseConfig);
  db   = firebase.firestore();
  auth = firebase.auth();
  console.log("%c☁️ Firebase connected!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase init failed:", e);
}

/* -----------------------------------------------------------
   PATH HELPERS
----------------------------------------------------------- */
function currentPath() {
  return window.location.pathname || "";
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

async function _doSignIn(email, password) {
  if (!auth) throw new Error("Auth not ready");

  const cred = await auth.signInWithEmailAndPassword(email, password);

  if (cred.user?.email) setLocalEmail(cred.user.email);

  return cred;
}

window.fsLogin  = _doSignIn;
window.fsSignIn = _doSignIn;

window.fsSignUp = async function (email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);

  try { await cred.user.sendEmailVerification(); } catch {}

  if (cred.user?.email) setLocalEmail(cred.user.email);

  return cred;
};

/*  
   ✔ LOGOUT FIXED (always redirects to login)
*/
window.fsLogout = async function () {
  try { 
    await auth.signOut(); 
  } catch (e) {
    console.error("Logout error:", e);
  }

  clearLocalEmail();

  // HARD REDIRECT → 100% guaranteed logout
  window.location.href = "/login.html";
};

window.fsSendPasswordReset = email => auth.sendPasswordResetEmail(email);

window.fsCheckAuth = function () {
  return new Promise(resolve => {
    const off = auth.onAuthStateChanged(u => {
      off();
      resolve(u);
    });
  });
};

window.getFirebaseUser = () => auth?.currentUser || null;

/* ===========================================================
   AUTH STATE LISTENER — LOGIN GUARD
=========================================================== */
if (auth) {
  auth.onAuthStateChanged(async user => {
    const path = currentPath();

    if (user) {
      const email = user.email || "";
      setLocalEmail(email);

      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", email);

      // Sync data after login
      if (typeof cloudPullAllIfAvailable === "function") {
        try { await cloudPullAllIfAvailable(); } catch {}
      }

      // If user is on login/signup page → redirect to dashboard
      if (AUTH_PAGES.some(p => path.endsWith(p))) {
        window.location.replace("/tools/business-dashboard.html");
      }

    } else {
      clearLocalEmail();
      console.log("%c🔓 Logged out", "color:#f44336;font-weight:bold;");

      // If user tries to access protected page → go to login
      if (PROTECTED_PATHS.some(p => path.endsWith(p))) {
        window.location.replace("/login.html");
      }
    }
  });
}

/* ===========================================================
   FIRESTORE HELPERS
=========================================================== */
function getCloudUser() {
  return auth?.currentUser?.email || localStorage.getItem("ks-user-email") || null;
}

window.cloudSave = async function (collection, data) {
  const user = getCloudUser();
  if (!user) return console.warn("cloudSave skipped: no user");

  try {
    await db.collection(collection)
            .doc(user)
            .set({ items: data }, { merge: true });

    console.log(`☁️ Saved: ${collection} → ${user}`);

    setTimeout(() => {
      if (typeof cloudPullAllIfAvailable === "function") {
        try { cloudPullAllIfAvailable(); } catch {}
      }
    }, 300);

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

/* ---------------- DEBOUNCED SAVE ---------------- */
let _timers = {};
window.cloudSaveDebounced = function (collection, data) {
  if (_timers[collection]) clearTimeout(_timers[collection]);
  _timers[collection] = setTimeout(() => {
    window.cloudSave(collection, data);
  }, 400);
};

/* ===========================================================
   READY
=========================================================== */
console.log("%c⚙️ firebase.js READY ✔ (ONLINE ONLY)", "color:#03a9f4;font-weight:bold;");
