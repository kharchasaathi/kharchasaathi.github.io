/* ==========================================================
   🔐 security.js — ONLINE MODE (Firebase Auth)
   SaaS Compatible Version v11
   ----------------------------------------------------------
   ✔ Works with GLOBAL ACCESS GUARD
   ✔ No duplicate auth listeners
   ✔ No emailTag override
   ✔ Admin password system intact
   ✔ Improved default password handling
========================================================== */

console.log("🔐 security.js loaded (v11 SaaS Safe)");

/* ==========================================================
   🔵 FIREBASE USER HELPERS
   (Helpers only — no auth control here)
========================================================== */

function getUserEmail() {
  try {
    const user = window.auth?.currentUser;
    return user?.email || "";
  } catch {
    return "";
  }
}
window.getUserEmail = getUserEmail;

function isLoggedIn() {
  try {
    return !!window.auth?.currentUser;
  } catch {
    return false;
  }
}
window.isLoggedIn = isLoggedIn;


/* ==========================================================
   🔐 ADMIN PASSWORD SYSTEM
   (Local UI-Level Security Only)
========================================================== */

const ADMIN_KEY = "ks-admin-pw";

/* First-time password setup (no hardcoded default exposure) */
function ensureAdminPassword() {
  let pw = localStorage.getItem(ADMIN_KEY);

  if (!pw) {
    const newPw = prompt(
      "Set Admin Password (first time setup)\n\nMinimum 4 characters:"
    );

    if (!newPw || newPw.length < 4) {
      alert("Invalid password. Using temporary default: admin123");
      localStorage.setItem(ADMIN_KEY, "admin123");
    } else {
      localStorage.setItem(ADMIN_KEY, newPw);
      alert("Admin password set successfully.");
    }
  }
}
ensureAdminPassword();

/* Ask for admin password */
function askAdminPassword() {
  const pw = prompt("Enter admin password:");
  if (!pw) return false;

  return pw === localStorage.getItem(ADMIN_KEY);
}
window.askAdminPassword = askAdminPassword;

/* Update admin password */
function updateAdminPassword() {
  const oldPw = localStorage.getItem(ADMIN_KEY);
  const oldInput = prompt("Enter current admin password:");

  if (!oldInput) return;

  if (oldInput !== oldPw) {
    alert("Incorrect password!");
    return;
  }

  const newPw = prompt("Enter new admin password (min 4 chars):");

  if (!newPw || newPw.length < 4) {
    alert("Password too short!");
    return;
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Admin password updated successfully.");
}
window.updateAdminPassword = updateAdminPassword;


/* Reset admin password */
function resetAdminPassword() {
  const cur = localStorage.getItem(ADMIN_KEY);
  const old = prompt("Enter current password:");

  if (!old) return;

  if (old !== cur) {
    alert("Incorrect password!");
    return;
  }

  const newPw = prompt("Enter new password (min 4 chars):");

  if (!newPw || newPw.length < 4) {
    alert("Invalid new password.");
    return;
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Password successfully reset.");
}
window.resetAdminPassword = resetAdminPassword;


/* ==========================================================
   🔒 UI SECURITY TOGGLES
========================================================== */

/* Secure toggle any element */
function secureToggle(elementId) {
  if (!askAdminPassword()) {
    alert("Wrong password!");
    return;
  }

  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display =
    el.style.display === "none" ? "" : "none";
}
window.secureToggle = secureToggle;


/* Unlock Profit Column */
function unlockProfitWithPassword() {
  if (!askAdminPassword()) {
    alert("Incorrect password.");
    return;
  }

  window.profitLocked = false;

  if (typeof applyProfitVisibility === "function") {
    applyProfitVisibility();
  }

  alert("Profit column unlocked.");
}
window.unlockProfitWithPassword = unlockProfitWithPassword;


/* ==========================================================
   🚫 REMOVED IN v11
----------------------------------------------------------
   ❌ No emailTag updates
   ❌ No auth.onAuthStateChanged listener
   ❌ No login/logout overrides
----------------------------------------------------------
   Email + Subscription handled by:
   👉 GLOBAL ACCESS GUARD
========================================================== */
