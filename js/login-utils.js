/* login-utils.js — CLEAN V11 (NO BOM, NO DUPLICATE AUTH, NO HIDDEN CHARACTERS) */

const auth = window.auth;

function getFirebaseUser() {
  return auth.currentUser || null;
}
window.getFirebaseUser = getFirebaseUser;

async function loginUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    const res = await auth.signInWithEmailAndPassword(email, password);
    localStorage.setItem("ks-user-email", email);

    return { success: true, user: res.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.loginUser = loginUser;

async function signupUser(email, password) {
  try {
    if (!email || !password) throw new Error("Missing email or password.");

    const res = await auth.createUserWithEmailAndPassword(email, password);
    localStorage.setItem("ks-user-email", email);

    return { success: true, user: res.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
window.signupUser = signupUser;

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

function isLoggedIn() {
  return !!auth.currentUser;
}
window.isLoggedIn = isLoggedIn;

auth.onAuthStateChanged(user => {
  try {
    if (user) {
      localStorage.setItem("ks-user-email", user.email);
      if (typeof cloudPullAllIfAvailable === "function") cloudPullAllIfAvailable();
    } else {
      localStorage.removeItem("ks-user-email");
      if (typeof clearLocalUI === "function") clearLocalUI();
    }

    if (typeof updateEmailTag === "function") updateEmailTag();

  } catch (e) {
    console.warn("Auth listener error:", e);
  }
});
