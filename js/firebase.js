/* ===========================================================
   🔥 firebase.js — FINAL (Compat Version)
   Works perfectly with business-dashboard (Option A)
   =========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
   Firebase Config (YOUR APP KEYS)
----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

/* -----------------------------------------------------------
   Initialize Firebase (Compat Mode)
----------------------------------------------------------- */
let db = null;
let auth = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");
} catch (e) {
  console.error("❌ Firebase initialization failed:", e);
}

/* -----------------------------------------------------------
   AUTH FUNCTIONS
----------------------------------------------------------- */

// SIGN UP
window.fsSignUp = async function (email, password) {
  if (!auth) throw new Error("Auth not available");

  const cred = await auth.createUserWithEmailAndPassword(email, password);

  try {
    await cred.user.sendEmailVerification();
  } catch (e) {
    console.warn("Email verification send failed:", e);
  }
  return cred;
};

// SIGN IN
window.fsSignIn = async function (email, password) {
  if (!auth) throw new Error("Auth not available");
  return auth.signInWithEmailAndPassword(email, password);
};

// SIGN OUT
window.fsSignOut = async function () {
  if (!auth) return;
  await auth.signOut();
  localStorage.removeItem("ks-user-email");
  window.dispatchEvent(new Event("storage"));
};

// RESET PASSWORD
window.fsSendPasswordReset = async function (email) {
  if (!auth) throw new Error("Auth not available");
  return auth.sendPasswordResetEmail(email);
};

// Get firebase user
window.getFirebaseUser = function () {
  return auth ? auth.currentUser : null;
};

/* -----------------------------------------------------------
   Auth State Listener
----------------------------------------------------------- */
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      localStorage.setItem("ks-user-email", user.email || "");

      console.log("%c🔐 Logged in:", "color:#03a9f4;font-weight:bold;", user.email);

      // auto cloud pull
      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch {}
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
   Helper – get user email for Firestore
----------------------------------------------------------- */
function getCloudUser() {
  if (auth && auth.currentUser && auth.currentUser.email) {
    return auth.currentUser.email;
  }
  const email = localStorage.getItem("ks-user-email");
  return email || "guest-user";
}

/* -----------------------------------------------------------
   CLOUD SAVE & CLOUD LOAD (per collection)
----------------------------------------------------------- */
window.cloudSave = async function (collection, data) {
  if (!db) return;

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
  if (!db) return null;

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
   Debounced Cloud Save
----------------------------------------------------------- */
let _cloudSaveTimer = {};
window.cloudSaveDebounced = function (col, data) {
  clearTimeout(_cloudSaveTimer[col]);
  _cloudSaveTimer[col] = setTimeout(() => {
    window.cloudSave(col, data);
  }, 500);
};

console.log("%c⚙️ firebase.js READY (Auth + Cloud Sync ON)", "color:#03a9f4;font-weight:bold;");
