/* ==========================================================
   LOGIN UTILS — Email-only Based Authentication (LocalStorage)
   Works offline + GitHub Pages compatible
   ========================================================== */

// LOGIN KEY
const LOGIN_KEY = "ks-user-email";

/* -------------------------------------------
   Save login email
------------------------------------------- */
function loginUser(email) {
  if (!email || !email.includes("@")) return false;
  localStorage.setItem(LOGIN_KEY, email.trim());
  return true;
}

/* -------------------------------------------
   Check if user is logged in
------------------------------------------- */
function isLoggedIn() {
  return !!localStorage.getItem(LOGIN_KEY);
}

/* -------------------------------------------
   Get logged-in email
------------------------------------------- */
function getUserEmail() {
  return localStorage.getItem(LOGIN_KEY) || "";
}

/* -------------------------------------------
   Logout user
------------------------------------------- */
function logoutUser() {
  localStorage.removeItem(LOGIN_KEY);
}

/* -------------------------------------------
   Expose to window
------------------------------------------- */
window.loginUser = loginUser;
window.isLoggedIn = isLoggedIn;
window.getUserEmail = getUserEmail;
window.logoutUser = logoutUser;
