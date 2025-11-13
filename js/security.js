/* ==========================================================
   🔐 security.js — Admin Password + Lock System
   Works with: core.js (KEY_ADMIN, setAdminPassword, validateAdminPassword)
   ========================================================== */

const ADMIN_KEY = "ks-admin-pw";

/* ----------------------------------------------------------
   CHECK PASSWORD EXISTS (if not → set default)
---------------------------------------------------------- */
function ensureAdminPassword() {
  let pw = localStorage.getItem(ADMIN_KEY);

  if (!pw) {
    // default password if none exists
    localStorage.setItem(ADMIN_KEY, "admin123");
  }
}
ensureAdminPassword();

/* ----------------------------------------------------------
   SET NEW ADMIN PASSWORD
---------------------------------------------------------- */
function updateAdminPassword() {
  const oldPw = localStorage.getItem(ADMIN_KEY);

  // ask old password first
  const oldInput = prompt("Enter current admin password:");
  if (!oldInput) return;

  if (oldInput !== oldPw) {
    alert("Incorrect password!");
    return;
  }

  // ask new password
  const newPw = prompt("Enter new admin password (min 4 characters):");
  if (!newPw || newPw.length < 4) {
    alert("Password too short!");
    return;
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Admin password updated successfully!");
}

/* ----------------------------------------------------------
   VERIFY PASSWORD (for unlocking features)
---------------------------------------------------------- */
function askAdminPassword() {
  const pw = prompt("Enter admin password:");
  if (!pw) return false;

  return pw === localStorage.getItem(ADMIN_KEY);
}

/* ----------------------------------------------------------
   SECURE TOGGLE — SHOW/HIDE ANY ELEMENT
---------------------------------------------------------- */
function secureToggle(elementId) {
  if (!askAdminPassword()) {
    alert("Wrong password!");
    return;
  }

  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = el.style.display === "none" ? "" : "none";
}

/* ----------------------------------------------------------
   LOCK/UNLOCK PROFIT COLUMN (GLOBAL)
   (Used in sales.js automatically)
---------------------------------------------------------- */
function unlockProfitWithPassword() {
  if (askAdminPassword()) {
    window.profitLocked = false;
    if (typeof applyProfitVisibility === "function") {
      applyProfitVisibility();
    }
    alert("Profit column unlocked.");
  } else {
    alert("Incorrect password.");
  }
}

/* ----------------------------------------------------------
   CLEAR ADMIN PASSWORD (Only with old password)
---------------------------------------------------------- */
function resetAdminPassword() {
  const cur = localStorage.getItem(ADMIN_KEY);

  const old = prompt("Enter current password for reset:");
  if (!old) return;

  if (old !== cur) {
    alert("Incorrect password!");
    return;
  }

  const newPw = prompt("Enter new password:");
  if (!newPw || newPw.length < 4) {
    alert("Invalid new password.");
    return;
  }

  localStorage.setItem(ADMIN_KEY, newPw);
  alert("Password successfully reset.");
}

/* ----------------------------------------------------------
   EXPORT TO WINDOW
---------------------------------------------------------- */
window.updateAdminPassword = updateAdminPassword;
window.unlockProfitWithPassword = unlockProfitWithPassword;
window.secureToggle = secureToggle;
window.resetAdminPassword = resetAdminPassword;
