/* ===========================================================
   firebase.js — Compat (Auth + Firestore + Debounced Cloud Save)
   Uses the Firebase compat libraries (works with firebase-*-compat.js)
   =========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   Firebase Config (from your Firebase Console)
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
   Initialize Firebase (Compat Mode)
   NOTE: Your pages must include the compat scripts:
     firebase-app-compat.js
     firebase-auth-compat.js
     firebase-firestore-compat.js
----------------------------------------------------------- */
let db = null;
let auth = null;

try {
  firebase.initializeApp(firebaseConfig);
  // Firestore and Auth (compat)
  db = firebase.firestore ? firebase.firestore() : null;
  auth = firebase.auth ? firebase.auth() : null;

  console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase initialization failed:", e);
}

/* -----------------------------------------------------------
   AUTH FUNCTIONS (exposed on window)
----------------------------------------------------------- */

// Create / Signup
window.fsSignUp = async function (email, password) {
  if (!auth) throw new Error("Auth not available");
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try {
    if (cred && cred.user && typeof cred.user.sendEmailVerification === "function") {
      await cred.user.sendEmailVerification();
    }
  } catch (e) {
    console.warn("Email verification send failed:", e);
  }
  return cred;
};

// Sign in
window.fsSignIn = async function (email, password) {
  if (!auth) throw new Error("Auth not available");
  return auth.signInWithEmailAndPassword(email, password);
};

// Sign out
window.fsSignOut = async function () {
  if (!auth) return;
  await auth.signOut();
  localStorage.removeItem("ks-user-email");
  window.dispatchEvent(new Event("storage"));
};

// Password reset
window.fsSendPasswordReset = async function (email) {
  if (!auth) throw new Error("Auth not available");
  return auth.sendPasswordResetEmail(email);
};

// Get current firebase user
window.getFirebaseUser = function () {
  return auth ? auth.currentUser : null;
};

/* -----------------------------------------------------------
   Auth state listener — keep localStorage in sync + cloud pull
----------------------------------------------------------- */
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      localStorage.setItem("ks-user-email", user.email || "");
      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", user.email);

      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch (e) { console.warn("cloudPull failed", e); }
      }

      window.dispatchEvent(new Event("storage"));
    } else {
      localStorage.removeItem("ks-user-email");
      console.log("%c🔓 Logged out", "color:#999");
      window.dispatchEvent(new Event("storage"));
    }
  });
}

/* -----------------------------------------------------------
   Helper to pick cloud user id (email)
----------------------------------------------------------- */
function getCloudUser() {
  try {
    if (auth && auth.currentUser && auth.currentUser.email) return auth.currentUser.email;
  } catch (e) { /* ignore */ }
  return localStorage.getItem("ks-user-email") || "guest-user";
}

/* -----------------------------------------------------------
   CLOUD SAVE & LOAD (Firestore) — per-collection
   We store { items: [...] } for compatibility
----------------------------------------------------------- */
window.cloudSave = async function (collection, data) {
  if (!db) {
    console.error("❌ Firestore unavailable for cloudSave");
    return;
  }

  const user = getCloudUser();
  try {
    await db.collection(collection)
            .doc(user)
            .set({ items: data }, { merge: true });
    console.log(`☁️ Cloud Save OK → [${collection}] for ${user}`);
  } catch (e) {
    console.error("❌ Cloud Save Error:", e);
  }
};

window.cloudLoad = async function (collection) {
  if (!db) {
    console.error("❌ Firestore unavailable for cloudLoad");
    return null;
  }
  const user = getCloudUser();
  try {
    const snap = await db.collection(collection).doc(user).get();
    if (!snap.exists) {
      console.warn(`⚠️ No cloud data for ${collection}`);
      return null;
    }
    const data = snap.data();
    return Array.isArray(data.items) ? data.items : data;
  } catch (e) {
    console.error("❌ Cloud Load Error:", e);
    return null;
  }
};

/* -----------------------------------------------------------
   Debounced cloud save (per collection key)
----------------------------------------------------------- */
let _cloudSaveTimers = {};
window.cloudSaveDebounced = function (collection, data) {
  if (_cloudSaveTimers[collection]) clearTimeout(_cloudSaveTimers[collection]);
  _cloudSaveTimers[collection] = setTimeout(() => {
    if (typeof window.cloudSave === "function") {
      window.cloudSave(collection, data);
    }
  }, 500);
};

/* -----------------------------------------------------------
   Ready log
----------------------------------------------------------- */
console.log("%c⚙️ firebase.js READY (Auth + Firestore + Cloud Sync)", "color:#03a9f4;font-weight:bold;");
