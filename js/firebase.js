/* ===========================================================
   firebase.js — FINAL STABLE VERSION (For Email Login System)
   Works with Firebase v9 compat + Firestore + Auto Cloud Sync
   =========================================================== */

console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

// --------------------------------------------------
// Firebase Config
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

// --------------------------------------------------
// Initialize Firebase (Compat Mode for Safety)
// --------------------------------------------------
let db = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();

  console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");
} 
catch (e) {
  console.error("❌ Firebase initialization failed:", e);
}



// --------------------------------------------------
// Helper: Get Logged-in Email (User ID)
// --------------------------------------------------
function getCloudUser() {
  const email = localStorage.getItem("ks-user-email");
  return email ? email : "guest-user";   // fallback (should never happen ideally)
}



// --------------------------------------------------
// CLOUD SAVE  (Saves entire module data)
// --------------------------------------------------
window.cloudSave = async function (collectionName, data) {
  if (!db) return console.error("❌ Firestore unavailable");

  try {
    const userId = getCloudUser();

    await db.collection(collectionName)
            .doc(userId)
            .set(data, { merge: true });

    console.log(`☁️ Cloud Save OK → [${collectionName}] for ${userId}`);
  } 
  catch (e) {
    console.error("❌ Cloud Save Error:", e);
  }
};



// --------------------------------------------------
// CLOUD LOAD (Loads entire module data)
// --------------------------------------------------
window.cloudLoad = async function (collectionName) {
  if (!db) return console.error("❌ Firestore unavailable");

  try {
    const userId = getCloudUser();

    const snap = await db.collection(collectionName)
                         .doc(userId)
                         .get();

    if (!snap.exists) {
      console.warn(`⚠️ No cloud data found for ${collectionName}`);
      return null;
    }

    console.log(`☁️ Cloud Load OK → [${collectionName}] for ${userId}`);
    return snap.data();
  } 
  catch (e) {
    console.error("❌ Cloud Load Error:", e);
    return null;
  }
};



// --------------------------------------------------
// OPTIONAL: Test auto-start (ONLY logs)
// --------------------------------------------------
console.log("%c⚙️ firebase.js ready (Email-based mode active)", "color:#03a9f4;font-weight:bold;");
