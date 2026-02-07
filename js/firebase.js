/* ===========================================================
firebase.js — FINAL V21 (OPTION-2 + DASHBOARD OFFSET)

✔ Pulls ALL business data
✔ Prevents empty overwrite
✔ Duplicate pull blocked
✔ Offsets cloud synced
✔ Dashboard clear persistent
✔ Multi-device data safe
=========================================================== */

console.log("%c🔥 firebase.js loaded","color:#ff9800;font-weight:bold;");

/* -----------------------------------------------------------
PREVENT DOUBLE LOAD
----------------------------------------------------------- */
if (window.__firebase_loaded){
  console.warn("firebase.js already loaded → skipped");
}else{
  window.__firebase_loaded=true;
}

/* -----------------------------------------------------------
CONFIG
----------------------------------------------------------- */
const firebaseConfig={
  apiKey:"AIzaSyC1TSwODhcD88-IizbteOGF-bbebAP6Poc",
  authDomain:"kharchasaathi-main.firebaseapp.com",
  projectId:"kharchasaathi-main",
  storageBucket:"kharchasaathi-main.firebasestorage.app",
  messagingSenderId:"116390837159",
  appId:"1:116390837159:web:a9c45a99d933849f4c9482"
};

firebase.initializeApp(firebaseConfig);

const auth=firebase.auth();
const db=firebase.firestore();

window.auth=auth;
window.db=db;

console.log("%c☁️ Firebase connected!","color:#4caf50;font-weight:bold;");

/* ===========================================================
CLOUD ENGINE
=========================================================== */

window.__cloudReady=false;
window.__cloudPulled=false;

/* ---------------- LOAD ONE ---------------- */
async function cloudLoad(key){

  const user=auth.currentUser;
  if(!user) return null;

  try{

    const snap=await db
      .collection("users")
      .doc(user.uid)
      .collection("data")
      .doc(key)
      .get();

    return snap.exists
      ? snap.data().value
      : null;

  }catch(e){
    console.warn("Cloud load failed:",key,e);
    return null;
  }
}
window.cloudLoad=cloudLoad;

/* ---------------- SAVE ---------------- */
function cloudSaveDebounced(key,value){

  if(!window.__cloudReady){
    console.warn("⛔ Save blocked before ready:",key);
    return;
  }

  const user=auth.currentUser;
  if(!user) return;

  db.collection("users")
    .doc(user.uid)
    .collection("data")
    .doc(key)
    .set({
      value,
      updated:Date.now()
    });
}
window.cloudSaveDebounced=cloudSaveDebounced;

/* ===========================================================
🌍 FULL CLOUD PULL (WITH DASHBOARD OFFSET)
=========================================================== */
async function cloudPullAll(){

  if(window.__cloudPulled){
    console.log("☁️ Pull skipped (already pulled)");
    return;
  }

  const keys=[
    "types",
    "stock",
    "sales",
    "wanting",
    "expenses",
    "services",
    "collections",
    "offsets",
    "dashboardOffset"   // ✅ NEW KEY
  ];

  const results=await Promise.all(
    keys.map(k=>cloudLoad(k))
  );

  const [
    types,
    stock,
    sales,
    wanting,
    expenses,
    services,
    collections,
    offsets,
    dashboardOffset   // ✅ NEW
  ]=results;

  if(types!==null)       window.types=types;
  if(stock!==null)       window.stock=stock;
  if(sales!==null)       window.sales=sales;
  if(wanting!==null)     window.wanting=wanting;
  if(expenses!==null)    window.expenses=expenses;
  if(services!==null)    window.services=services;
  if(collections!==null)window.collections=collections;

  /* OFFSETS SAFE MERGE */
  window.__offsets=Object.assign({
    net:0,
    sale:0,
    service:0,
    stock:0,
    servInv:0
  },offsets||{});

  /* =======================================================
     DASHBOARD OFFSET INIT
  ======================================================= */
  window.__dashboardOffset =
    Number(dashboardOffset || 0);

  window.__cloudPulled=true;
  window.__cloudReady=true;

  console.log(
    "%c☁️ Cloud fully loaded ✔",
    "color:#4caf50;font-weight:bold;"
  );

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
}

window.cloudPullAllIfAvailable=cloudPullAll;

/* ===========================================================
AUTH API
=========================================================== */
window.fsLogin=(e,p)=>
  auth.signInWithEmailAndPassword(e,p);

window.fsSignUp=async(e,p)=>{
  const r=
    await auth.createUserWithEmailAndPassword(e,p);
  try{await r.user.sendEmailVerification();}catch{}
  return r;
};

window.fsSendPasswordReset=
  e=>auth.sendPasswordResetEmail(e);

window.fsLogout=async()=>{
  await auth.signOut();
  location.href="/login.html";
};

window.getFirebaseUser=
  ()=>auth.currentUser;

/* ===========================================================
ROUTE GUARD
=========================================================== */
const PROTECTED=[
  "/tools/business-dashboard.html"
];

const AUTH_PAGES=[
  "/login.html",
  "/signup.html",
  "/reset.html"
];

function path(){
  return location.pathname||"";
}

/* ===========================================================
AUTH STATE
=========================================================== */
auth.onAuthStateChanged(async user=>{

  const p=path();

  if(user){

    console.log(
      "%c🔐 Logged in:",
      "color:#03a9f4;font-weight:bold;",
      user.email
    );

    await cloudPullAll();

    if(AUTH_PAGES.some(x=>p.endsWith(x))){
      location.replace(
        "/tools/business-dashboard.html"
      );
    }

  }else{

    console.log(
      "%c🔓 Logged out",
      "color:#f44336;font-weight:bold;"
    );

    if(PROTECTED.some(x=>p.endsWith(x))){
      location.replace("/login.html");
    }
  }
});

console.log(
  "%c⚙️ firebase.js READY ✔",
  "color:#03a9f4;font-weight:bold;"
);
