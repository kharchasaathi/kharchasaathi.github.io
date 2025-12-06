/* ==========================================================
   LOGIN UTILS (ONLINE MODE ONLY) — Firebase Authentication
   FINAL VERSION v5
   ----------------------------------------------------------
   ✔ Email + Password login
   ✔ Signup
   ✔ Logout
   ✔ Password Reset
   ✔ Current User Helper
   ----------------------------------------------------------
   Requires: firebase.js (Firebase initialized)
========================================================== */

/* ----------------------------------------------------------
   CURRENT USER
---------------------------------------------------------- */
function getFirebaseUser() {
  return firebase.auth().currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ----------------------------------------------------------
   LOGIN (Email + Password)
---------------------------------------------------------- */
async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    await firebase.auth().signInWithEmailAndPassword(email, password);

    // store email for UI topbar
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

    await firebase.auth().createUserWithEmailAndPassword(email, password);

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

    await firebase.auth().sendPasswordResetEmail(email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.resetPassword = resetPassword;

/* ----------------------------------------------------------
   LOGOUT
---------------------------------------------------------- */
async function logoutUser() {
  try {
    await firebase.auth().signOut();

    // local cleanup
    localStorage.removeItem("ks-user-email");

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.logoutUser = logoutUser;

/* ----------------------------------------------------------
   IS LOGGED IN? (Sync with Firebase)
---------------------------------------------------------- */
function isLoggedIn() {
  const u = firebase.auth().currentUser;
  return !!u;
}
window.isLoggedIn = isLoggedIn;

/* ----------------------------------------------------------
   AUTH STATE LISTENER (Auto redirect helpers)
---------------------------------------------------------- */
firebase.auth().onAuthStateChanged(user => {
  try {
    if (user) {
      localStorage.setItem("ks-user-email", user.email || "");
    } else {
      localStorage.removeItem("ks-user-email");
    }

    if (typeof updateEmailTag === "function") {
      updateEmailTag();
    }
  } catch (e) {
    console.warn("Auth state listener error:", e);
  }
});
