// firebase.js - FINAL STABLE VERSION (Non-Module, Works Everywhere)

// Quick check that the file loaded
console.log("%c🔥 firebase.js loaded", "color:#ff9800;font-weight:bold;");

// -------------------------
// Firebase Config
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

// -------------------------
// Initialize Firebase
// -------------------------
try {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");

  // -------------------------
  // CLOUD SAVE
  // -------------------------
  window.cloudSave = async function (collectionName, data) {
    try {
      const userId = localStorage.getItem("userId") || "owner";

      await db.collection(collectionName)
              .doc(userId)
              .set(data, { merge: true });

      console.log("☁️ Cloud Save:", collectionName);
    } catch (e) {
      console.error("❌ Cloud Save Error:", e);
    }
  };

  // -------------------------
  // CLOUD LOAD
  // -------------------------
  window.cloudLoad = async function (collectionName) {
    try {
      const userId = localStorage.getItem("userId") || "owner";

      const snap = await db.collection(collectionName)
                            .doc(userId)
                            .get();

      return snap.exists ? snap.data() : null;
    } catch (e) {
      console.error("❌ Cloud Load Error:", e);
      return null;
    }
  };

} catch (error) {
  console.error("❌ Firebase init error:", error);
}
