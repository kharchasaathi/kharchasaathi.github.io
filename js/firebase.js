/* ===========================================================
firebase.js — V31 PRODUCTION MERGE (CLOUD + AUTO USER SAFE)

✔ Full cloud engine retained
✔ Auto Firestore user document creation
✔ 14 days free trial auto start
✔ Email verification compulsory
✔ No login loop
✔ No "Account setup incomplete"
✔ Multi-device safe
✔ Ledger audit auto trigger
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

const __debounceTimers = {};

/* ===========================================================
SAFE CALL (for audit trigger)
=========================================================== */

function safeCall(fn){
  try{
    if(typeof window[fn] === "function"){
      window[fn]();
    }
  }catch(e){
    console.warn("⚠️ Safe call failed:",fn,e);
  }
}

/* ===========================================================
ENSURE USER DOCUMENT EXISTS
=========================================================== */

async function ensureUserDoc(user){

  const ref  = db.collection("users").doc(user.uid);
  const snap = await ref.get();

  if(!snap.exists){

    console.log("🆕 Creating Firestore user document...");

    await ref.set({
      email: user.email,
      plan: "free_trial",
      trialStartedAt: Date.now(),
      trialEndsAt: Date.now() + (14*24*60*60*1000),
      subscriptionActive: false,
      createdAt: Date.now()
    });

    console.log("✅ User document created");
  }
}

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

  /* 🔍 Initial accounting audit */
  safeCall("runLedgerAudit");
}

/* ===========================================================
ROUTE GUARD
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

    if(!user.emailVerified){
      if(!p.includes("/verify-email.html")){
        location.replace("/verify-email.html");
      }
      return;
    }

    await ensureUserDoc(user);

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
AUTH HELPERS
=========================================================== */

window.fsLogin = (email,password)=>
  auth.signInWithEmailAndPassword(email,password);

window.fsSignUp = async(email,password)=>{

  const result = await auth.createUserWithEmailAndPassword(email,password);
  const user   = result.user;

  await ensureUserDoc(user);

  await user.sendEmailVerification();

  return result;
};

window.fsSendPasswordReset =
  email => auth.sendPasswordResetEmail(email);

window.fsLogout = async()=>{
  await auth.signOut();
  location.href="/login.html";
};

window.getFirebaseUser =
  ()=> window.__currentUser;

console.log("%c⚙️ firebase.js READY ✔","color:#03a9f4;font-weight:bold;");

})();
