// firebase.js — Cloud Sync Layer for KharchaSaathi

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyC1TSwODhcD88-IizbtZkh3DLWMWR4CV9o",
  authDomain: "kharchasaathi-main.firebaseapp.com",
  projectId: "kharchasaathi-main",
  storageBucket: "kharchasaathi-main.appspot.com",
  messagingSenderId: "116390837159",
  appId: "1:116390837159:web:a9c45a7b097ec9c273c432",
  measurementId: "G-7F1V1N1YTR"
};

// --- Init Firebase ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log("%c☁️ Firebase connected successfully!", "color:#4caf50;font-weight:bold;");

// --- CLOUD SAVE ---
window.cloudSave = async function (collectionName, data) {
  try {
    const userId = localStorage.getItem("userId") || "owner";
    await setDoc(doc(db, collectionName, userId), data, { merge: true });
    console.log(`✅ Synced ${collectionName} to Cloud`);
  } catch (e) {
    console.error("❌ Cloud Save Error:", e);
  }
};

// --- CLOUD LOAD ---
window.cloudLoad = async function (collectionName) {
  try {
    const userId = localStorage.getItem("userId") || "owner";
    const snap = await getDoc(doc(db, collectionName, userId));
    if (snap.exists()) {
      console.log(`☁️ Loaded ${collectionName} from Cloud`);
      return snap.data();
    } else {
      console.warn(`⚠️ No ${collectionName} data in Cloud`);
      return null;
    }
  } catch (e) {
    console.error("❌ Cloud Load Error:", e);
    return null;
  }
};
