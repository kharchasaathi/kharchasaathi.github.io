/* ===========================================================
firebase.js — HARDENED V28 (LOOP SAFE + VERIFIED ONLY)

✔ No illegal return
✔ True double-load protection
✔ Email verification compulsory
✔ No infinite login loop
✔ HTML guard compatible
✔ Cloud safe pull/save
✔ Multi-device safe
=========================================================== */

console.log("%c🔥 firebase.js loading...","color:#ff9800;font-weight:bold;");

(function(){

if (window.__firebase_loaded){
  console.warn("firebase.js already initialized → skipped");
  return;
}
window.__firebase_loaded = true;

/* ===========================================================
CONFIG
=========================================================== */
const firebaseConfig = {
  apiKey:"AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain:"kharchasaathi-main.firebaseapp.com",
  projectId:"kharchasaathi-main",
  storageBucket:"kharchasaathi-main.firebasestorage.app",
  messagingSenderId:"116390837159",
  appId:"1:116390837159:web:a9c45a99d933849f4c9482"
};

if (!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

window.auth = auth;
window.db   = db;

console.log("%c☁️ Firebase connected!","color:#4caf50;font-weight:bold;");

/* ===========================================================
GLOBAL FLAGS
=========================================================== */
window.__cloudReady  = false;
window.__cloudPulled = false;
window.__currentUser = null;

/* ===========================================================
DEBOUNCE ENGINE
=========================================================== */
const __debounceTimers = {};

/* ===========================================================
CLOUD LOAD
=========================================================== */
async function cloudLoad(key){
  const user = auth.currentUser;
  if(!user) return null;

  try{
    const snap = await db
      .collection("users")
      .doc(user.uid)
      .collection("data")
      .doc(key)
      .get();

    return snap.exists ? snap.data().value : null;
  }catch(e){
    console.warn("Cloud load failed:",key,e);
    return null;
  }
}
window.cloudLoad = cloudLoad;

/* ===========================================================
CLOUD SAVE
=========================================================== */
function cloudSaveDebounced(key,value){

  if(!window.__cloudReady) return;
  const user = auth.currentUser;
  if(!user) return;

  if(__debounceTimers[key])
    clearTimeout(__debounceTimers[key]);

  __debounceTimers[key] = setTimeout(async ()=>{

    try{
      const safeValue = JSON.parse(JSON.stringify(value));

      await db
        .collection("users")
        .doc(user.uid)
        .collection("data")
        .doc(key)
        .set({
          value: safeValue,
          updated: Date.now()
        });

    }catch(e){
      console.error("Cloud save failed:",key,e);
    }

  },500);
}
window.cloudSaveDebounced = cloudSaveDebounced;

/* ===========================================================
FULL CLOUD PULL
=========================================================== */
async function cloudPullAll(){

  if(window.__cloudPulled) return;

  const keys = [
    "types","stock","sales","wanting",
    "expenses","services","collections",
    "offsets","dashboardOffset",
    "unMetrics","withdrawals"
  ];

  const results = await Promise.all(keys.map(k => cloudLoad(k)));

  const [
    types,stock,sales,wanting,
    expenses,services,collections,
    offsets,dashboardOffset,
    unMetrics,withdrawals
  ] = results;

  if(types!==null) window.types = types;
  if(stock!==null) window.stock = stock;
  if(sales!==null) window.sales = sales;
  if(wanting!==null) window.wanting = wanting;
  if(expenses!==null) window.expenses = expenses;
  if(services!==null) window.services = services;
  if(collections!==null) window.collections = collections;
  if(unMetrics!==null) window.__unMetrics = unMetrics;
  if(withdrawals!==null) window.__withdrawals = withdrawals;

  window.__offsets = Object.assign({
    net:0,sale:0,service:0,stock:0,
    servInv:0,expensesLive:0,expensesSettled:0
  }, offsets || {});

  window.__dashboardOffset = Number(dashboardOffset || 0);

  window.__cloudPulled = true;
  window.__cloudReady  = true;

  window.dispatchEvent(new Event("cloud-data-loaded"));
}

/* ===========================================================
ROUTE GUARD (LOGIN ONLY)
=========================================================== */
const PROTECTED = [
  "/tools/business-dashboard.html",
  "/tools/daily-ledger.html"
];

const AUTH_PAGES = [
  "/login.html",
  "/signup.html",
  "/reset-password.html"
];

function currentPath(){
  return location.pathname.split("?")[0];
}

/* ===========================================================
AUTH STATE HANDLER
=========================================================== */
auth.onAuthStateChanged(async user=>{

  const p = currentPath();
  window.__currentUser = user || null;

  if(user){

    console.log("%c🔐 Logged in:","color:#03a9f4;font-weight:bold;",user.email);

    /* 🔐 EMAIL VERIFICATION COMPULSORY */
    if(!user.emailVerified){
  if(!p.includes("/verify-email.html")){
    location.replace("/verify-email.html");
  }
  return;
}

    window.__cloudPulled = false;
    window.__cloudReady  = false;

    await cloudPullAll();

    window.dispatchEvent(new Event("firebase-auth-ready"));

    if(AUTH_PAGES.some(x=>p.includes(x))){
      location.replace("/tools/business-dashboard.html");
    }

  }else{

    console.log("%c🔓 Logged out","color:#f44336;font-weight:bold;");

    window.dispatchEvent(new Event("firebase-auth-ready"));

    if(PROTECTED.some(x=>p.includes(x))){
      location.replace("/login.html");
    }
  }
});

/* ===========================================================
PUBLIC AUTH HELPERS
=========================================================== */
window.fsLogin  = (e,p) => auth.signInWithEmailAndPassword(e,p);

window.fsSignUp = async(e,p)=>{
  const r = await auth.createUserWithEmailAndPassword(e,p);
  try{
    await r.user.sendEmailVerification();
  }catch{}
  return r;
};

window.fsSendPasswordReset =
  e => auth.sendPasswordResetEmail(e);

window.fsLogout = async()=>{
  await auth.signOut();
  location.href="/login.html";
};

window.getFirebaseUser =
  ()=> window.__currentUser;

console.log("%c⚙️ firebase.js READY ✔","color:#03a9f4;font-weight:bold;");

})();
