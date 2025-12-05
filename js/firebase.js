/* ===========================================================
   firebase.js — FINAL v15 (ONLINE-ONLY, FIREBASE AUTH + FIRESTORE)
   -----------------------------------------------------------
   FIXES ADDED IN v15:
   ✔ updateEmailTag() included (no more "Checking login…")
   ✔ After cloudPull → auto refresh UI (all tabs + universal bar)
   ✔ Zero duplicate declarations
=========================================================== */

console.log("%c🔥 firebase.js v15 loaded","color:#ff9800;font-weight:bold;");

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
   INIT FIREBASE
----------------------------------------------------------- */
let db=null, auth=null, firebaseReady=false;

try{
  firebase.initializeApp(firebaseConfig);
  db=firebase.firestore();
  auth=firebase.auth();
  firebaseReady=true;
  console.log("%c☁️ Firebase initialized","color:#4caf50;font-weight:bold;");
}catch(e){
  console.error("❌ Firebase init failed",e);
}

/* -----------------------------------------------------------
   LOCAL STORAGE EMAIL HELPERS
----------------------------------------------------------- */
function setLocalEmail(email){
  try{ localStorage.setItem("ks-user-email", email || ""); }catch{}
}
function clearLocalEmail(){
  try{ localStorage.removeItem("ks-user-email"); }catch{}
}

/* -----------------------------------------------------------
   AUTH HELPERS
----------------------------------------------------------- */
async function _fsLogin(email,password){
  if(!firebaseReady||!auth) throw new Error("Firebase not ready");
  const cred = await auth.signInWithEmailAndPassword(email,password);
  if(cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
}
window.fsLogin=_fsLogin;
window.fsSignIn=_fsLogin;

window.fsSignUp=async function(email,password){
  if(!firebaseReady||!auth) throw new Error("Firebase not ready");
  const cred = await auth.createUserWithEmailAndPassword(email,password);
  try{ await cred.user.sendEmailVerification(); }catch{}
  if(cred.user?.email) setLocalEmail(cred.user.email);
  return cred;
};

window.fsSendPasswordReset=async function(email){
  if(!firebaseReady||!auth) throw new Error("Firebase not ready");
  return auth.sendPasswordResetEmail(email);
};

window.fsLogout=async function(){
  try{
    if(firebaseReady && auth) await auth.signOut();
  }catch(e){ console.error("Logout error:",e); }
  finally{
    clearLocalEmail();
    window.location.href="/login.html";
  }
};

window.getFirebaseUser=function(){
  try{ return auth?.currentUser || null; }
  catch{ return null; }
};

/* -----------------------------------------------------------
   FIRESTORE SAVE/LOAD
----------------------------------------------------------- */
function _getCloudUserId(){
  const u=window.getFirebaseUser();
  if(u?.email) return u.email;
  return localStorage.getItem("ks-user-email") || null;
}

async function firebaseSaveCollection(collection,arr){
  if(!firebaseReady||!db) return false;

  const id=_getCloudUserId();
  if(!id) return false;

  try{
    await db.collection(collection).doc(id).set({items:arr},{merge:true});
    return true;
  }catch(e){
    console.error("firebaseSaveCollection error:",collection,e);
    return false;
  }
}
window.firebaseSaveCollection=firebaseSaveCollection;

async function firebaseLoadCollection(collection){
  if(!firebaseReady||!db) return null;

  const id=_getCloudUserId();
  if(!id) return null;

  try{
    const snap=await db.collection(collection).doc(id).get();
    if(!snap.exists) return [];
    const data=snap.data()||{};
    return Array.isArray(data.items)?data.items:[];
  }catch(e){
    console.error("firebaseLoadCollection error:",collection,e);
    return null;
  }
}
window.firebaseLoadCollection=firebaseLoadCollection;

/* -----------------------------------------------------------
   DEBOUNCED CLOUD SAVE
----------------------------------------------------------- */
const _debTimers={};
window.cloudSaveDebounced=function(k,arr,wait=600){
  if(_debTimers[k]) clearTimeout(_debTimers[k]);
  _debTimers[k]=setTimeout(()=>firebaseSaveCollection(k,arr),wait);
};

/* -----------------------------------------------------------
   FIX #1 — UPDATE EMAIL TAG (NO MORE "Checking login…")
----------------------------------------------------------- */
window.updateEmailTag = function(){
  const el=document.getElementById("emailTag");
  if(!el) return;
  try{
    const u=getFirebaseUser();
    if(u?.email){
      el.textContent=u.email;
    }else{
      el.textContent="Not logged in";
    }
  }catch{
    el.textContent="Not logged in";
  }
};

/* -----------------------------------------------------------
   FIX #2 — GLOBAL UI REFRESH AFTER CLOUD SYNC
----------------------------------------------------------- */
function forceUIRefresh(){
  try{ window.renderStock?.(); }catch{}
  try{ window.renderSales?.(); }catch{}
  try{ window.renderWanting?.(); }catch{}
  try{ window.renderExpenses?.(); }catch{}
  try{ window.renderServiceTables?.(); }catch{}
  try{ window.renderCollection?.(); }catch{}
  try{ window.renderAnalytics?.(); }catch{}
  try{ window.updateUniversalBar?.(); }catch{}
}

/* -----------------------------------------------------------
   AUTH STATE LISTENER
----------------------------------------------------------- */
auth?.onAuthStateChanged(async user=>{
  const path=(window.location.pathname||"");

  if(user){
    setLocalEmail(user.email||"");
    console.log("%c🔐 Logged in →","color:#03a9f4;font-weight:bold;",user.email);

    // Pull cloud data
    if(typeof window.cloudPullAllIfAvailable==="function"){
      try{ await window.cloudPullAllIfAvailable(); }catch(e){}
    }

    forceUIRefresh();   // ⭐ IMPORTANT

    // redirect if on login/signup
    if(path.endsWith("/login.html") || path.endsWith("/signup.html") || path.endsWith("/reset.html")){
      window.location.replace("/tools/business-dashboard.html");
    }
  }else{
    clearLocalEmail();
    console.log("%c🔓 Logged out","color:#f44336;font-weight:bold;");

    if(path.endsWith("/tools/business-dashboard.html")){
      window.location.replace("/login.html");
    }
  }

  // Update UI tag
  window.updateEmailTag();
});

console.log("%c⚙️ firebase.js v15 READY","color:#03a9f4;font-weight:bold;");
