/* ==========================================================
   login-utils.js — ONLINE MODE (Firebase v9 COMPAT API)
   FINAL FIXED VERSION v9 — NO DUPLICATE AUTH DECLARATION
========================================================== */

/* Firebase Auth reference (compat mode)
   Fix: use global auth from firebase.js */
const auth = window.auth;

/* ----------------------------------------------------------
   CURRENT USER
---------------------------------------------------------- */
function getFirebaseUser() {
  return auth.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ----------------------------------------------------------
   LOGIN (Email + Password)
---------------------------------------------------------- */
async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    await auth.signInWithEmailAndPassword(email, password);

    localStorage.setItem("ks-user-email", email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.loginUser = loginUser;

/* ----------------------------------------------------------
   SIGNUP (Create Account)
---------------------------------------------------------- */
async function signupUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    await auth.createUserWithEmailAndPassword(email, password);

    localStorage.setItem("ks-user-email", email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.signupUser = signupUser;

/* ----------------------------------------------------------
   PASSWORD RESET
---------------------------------------------------------- */
async function resetPassword(email) {
  try {
    if (!email) throw new Error("Email required.");

    await auth.sendPasswordResetEmail(email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.resetPassword = resetPassword;

/* ----------------------------------------------------------
   LOGOUT (also clears local cache)
---------------------------------------------------------- */
async function logoutUser() {
  try {
    await auth.signOut();

    localStorage.removeItem("ks-user-email");

    // Optional cleanup
    localStorage.removeItem("stock-data");
    localStorage.removeItem("sales-data");
    localStorage.removeItem("expenses-data");
    localStorage.removeItem("service-data");
    localStorage.removeItem("ks-collections");
    localStorage.removeItem("item-types");

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.logoutUser = logoutUser;

/* ----------------------------------------------------------
   IS LOGGED IN?
---------------------------------------------------------- */
function isLoggedIn() {
  return !!auth.currentUser;
}
window.isLoggedIn = isLoggedIn;

/* ----------------------------------------------------------
   AUTH STATE LISTENER (online mode)
---------------------------------------------------------- */
auth.onAuthStateChanged(user => {
  try {
    if (user) {
      localStorage.setItem("ks-user-email", user.email);

      if (typeof window.cloudPull === "function") {
        window.cloudPull();
      }

    } else {
      localStorage.removeItem("ks-user-email");

      if (typeof window.clearLocalUI === "function") {
        window.clearLocalUI();
      }
    }

    if (typeof updateEmailTag === "function") {
      updateEmailTag();
    }

  } catch (e) {
    console.warn("Auth listener error:", e);
  }
});
