/* ===========================================================
   login-utils.js — PRODUCTION SAFE VERSION
   Uses window.auth only
=========================================================== */

/* --------------- HELPERS ---------------- */
function _getAuth() {
  return window.auth || null;
}

/* --------------- CURRENT USER ---------------- */
function getFirebaseUser() {
  return _getAuth()?.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

/* ---------------- LOGIN ---------------- */
async function loginUser(email, password) {
  try {
    if (!email || !password)
      throw new Error("Missing email or password");

    const a = _getAuth();
    if (!a)
      throw new Error("Auth not ready. Reload page.");

    await a.signInWithEmailAndPassword(email, password);

    // Let auth listener handle state
    return { success: true };

  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}
window.loginUser = loginUser;

/* ---------------- SIGNUP ---------------- */
async function signupUser(email, password) {
  try {
    if (!email || !password)
      throw new Error("Missing email or password");

    const a = _getAuth();
    if (!a)
      throw new Error("Auth not ready. Reload page.");

    const r =
      await a.createUserWithEmailAndPassword(
        email,
        password
      );

    // 🔐 Send email verification
    await r.user.sendEmailVerification();

    return { success: true };

  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}
window.signupUser = signupUser;

/* ---------------- RESET PASSWORD ---------------- */
async function resetPassword(email) {
  try {
    if (!email)
      throw new Error("Email required");

    const a = _getAuth();
    if (!a)
      throw new Error("Auth not ready. Reload page.");

    await a.sendPasswordResetEmail(email);

    return { success: true };

  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}
window.resetPassword = resetPassword;

/* ---------------- LOGOUT ---------------- */
async function logoutUser() {
  try {
    const a = _getAuth();
    if (!a)
      throw new Error("Auth not ready.");

    await a.signOut();

    return { success: true };

  } catch (err) {
    return {
      success: false,
      error: err?.message || String(err)
    };
  }
}
window.logoutUser = logoutUser;

/* --------------- AUTH STATE LISTENER ---------------- */

(function attachAuthListener(){

  function waitForAuth(){

    const a = _getAuth();

    if (!a) {
      return setTimeout(waitForAuth, 200);
    }

    if (typeof a.onAuthStateChanged !== "function")
      return;

    a.onAuthStateChanged(user => {

      try {

        if (user) {

          localStorage.setItem(
            "ks-user-email",
            user.email
          );

          if (typeof cloudPullAllIfAvailable === "function") {
            cloudPullAllIfAvailable();
          }

        } else {

          localStorage.removeItem("ks-user-email");

          if (typeof clearLocalUI === "function") {
            clearLocalUI();
          }

        }

        if (typeof updateEmailTag === "function") {
          updateEmailTag();
        }

      } catch (e) {
        console.warn("Auth listener error:", e);
      }

    });

  }

  waitForAuth();

})();
