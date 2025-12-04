/* firebase.js — FINAL V13.1 (online-only, corrected redirect & bucket) */
console.log("firebase.js loading...");

const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",   // ✅ FIXED
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a99d933849f4c9482",
  measurementId: "G-7E1V1NLYTR"
};

let db = null, auth = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("Firebase initialized");
} catch (e) { console.error("Firebase init failed", e); }

/* Local helpers */
function setLocalEmail(email) { try { localStorage.setItem("ks-user-email", email); } catch {} }
function clearLocalEmail() { try { localStorage.removeItem("ks-user-email"); } catch {} }

/* Auth helpers */
window.fsLogin = async function (email, password) {
  if (!auth) throw new Error("Auth not ready");
  const cred = await auth.signInWithEmailAndPassword(email, password);
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

window.fsSignUp = async function (email, password) {
  if (!auth) throw new Error("Auth not ready");
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try { await cred.user.sendEmailVerification(); } catch {}
  if (cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

window.fsLogout = async function () {
  try { if (auth) await auth.signOut(); } catch (e) { console.error("logout error", e); }
  clearLocalEmail();
  window.location.href = "/login.html";
};

window.getFirebaseUser = () => auth?.currentUser || null;

/* Auth protected pages */
const PROTECTED_PATHS = ["/tools/business-dashboard.html"];
const AUTH_PAGES = ["/login.html", "/signup.html", "/reset.html"];

if (auth) {
  auth.onAuthStateChanged(async user => {
    const cleanPath = (window.location.pathname || "").split("?")[0];  // ✅ FIXED

    if (user) {
      setLocalEmail(user.email || "");
      console.log("Logged in:", user.email);

      if (typeof window.cloudPullAllIfAvailable === "function") {
        try { await window.cloudPullAllIfAvailable(); } catch (e) { console.warn(e); }
      }

      // redirect only if currently on an auth page
      if (AUTH_PAGES.some(p => cleanPath.endsWith(p))) {   // ✅ FIXED
        window.location.replace("/tools/business-dashboard.html");
      }

    } else {
      clearLocalEmail();
      console.log("Logged out");

      // redirect only if currently on protected page
      if (PROTECTED_PATHS.some(p => cleanPath.endsWith(p))) {  // ✅ FIXED
        window.location.replace("/login.html");
      }
    }
  });
}

/* Firestore wrappers */
function getCloudUser() {
  return auth?.currentUser?.email || localStorage.getItem("ks-user-email") || null;
}

window.cloudSave = async function (collection, data) {
  const u = getCloudUser();
  if (!u) { console.warn("cloudSave skipped: no user"); return false; }
  try {
    await db.collection(collection).doc(u).set({ items: data || [] }, { merge: true });
    console.log(`Saved ${collection} for ${u}`);
    return true;
  } catch (e) {
    console.error("cloudSave error", e);
    return false;
  }
};

window.cloudLoad = async function (collection) {
  const u = getCloudUser();
  if (!u) return [];
  try {
    const snap = await db.collection(collection).doc(u).get();
    if (!snap.exists) return [];
    const data = snap.data() || {};
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error("cloudLoad error", e);
    return [];
  }
};

/* Debounced cloud save */
const _cloudTimers = {};
window.cloudSaveDebounced = function (collection, data) {
  if (_cloudTimers[collection]) clearTimeout(_cloudTimers[collection]);
  _cloudTimers[collection] = setTimeout(() => {
    window.cloudSave(collection, data).catch(() => {});
  }, 500);
};

console.log("firebase.js READY");
