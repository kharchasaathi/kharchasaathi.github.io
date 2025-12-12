/* ===========================================================
   login-utils.js — CLEAN FINAL VERSION (NO ERRORS)
   Uses ONLY window.auth from firebase.js
=========================================================== */

// ALWAYS use auth from firebase.js — do NOT redeclare
const auth = window.auth;

/* ---------------- CURRENT USER ---------------- */
function getFirebaseUser() {
  return auth?.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ---------------- LOGIN ---------------- */
async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    const r = await auth.signInWithEmailAndPassword(email, password);

    localStorage.setItem("ks-user-email", r.user.email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.loginUser = loginUser;

/* ---------------- SIGNUP ---------------- */
async function signupUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    const r = await auth.createUserWithEmailAndPassword(email, password);

    localStorage.setItem("ks-user-email", r.user.email);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.signupUser = signupUser;

/* ---------------- RESET PASSWORD ---------------- */
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

/* ---------------- LOGOUT ---------------- */
async function logoutUser() {
  try {
    await auth.signOut();
    localStorage.removeItem("ks-user-email");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.logoutUser = logoutUser;

/* ---------------- AUTH LISTENER ---------------- */
auth.onAuthStateChanged(user => {
  try {
    if (user) {
      localStorage.setItem("ks-user-email", user.email);
      if (typeof cloudPullAllIfAvailable === "function") {
        cloudPullAllIfAvailable();
      }
    } else {
      localStorage.removeItem("ks-user-email");
    }

    if (typeof updateEmailTag === "function") {
      updateEmailTag();
    }

  } catch (e) {
    console.warn("Auth listener error:", e);
  }
});
