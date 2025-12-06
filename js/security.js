/* ==========================================================
   🔐 security.js — Login + Logout + Email + Admin Password
   ========================================================== */

/* --------------------------
   🔐 LOGIN SYSTEM
--------------------------- */
function isLoggedIn() {
  return !!localStorage.getItem("ks-user-email");
}

function loginUser(email) {
  if (!email) return false;
  localStorage.setItem("ks-user-email", email);
  return true;
}

function getUserEmail() {
  return localStorage.getItem("ks-user-email") || "";
}

function logoutUser() {
  localStorage.removeItem("ks-user-email");
}

/* ==========================================================
   🔐 ADMIN PASSWORD (for Profit Lock)
========================================================== */

const ADMIN_KEY = "ks-admin-pw";

/* Set default password if not exists */
function ensureAdminPassword() {
  let pw = localStorage.getItem(ADMIN_KEY);

  if (!pw) {
    localStorage.setItem(ADMIN_KEY, "admin123"); // default
  }
}
ensureAdminPassword();

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
  alert("Admin password updated!");
}

/* Ask password for unlocking */
function askAdminPassword() {
  const pw = prompt("Enter admin password:");
  if (!pw) return false;

  return pw === localStorage.getItem(ADMIN_KEY);
}

/* Secure Toggle (if needed) */
function secureToggle(elementId) {
  if (!askAdminPassword()) {
    alert("Wrong password!");
    return;
  }

  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = el.style.display === "none" ? "" : "none";
}

/* Unlock profit column */
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

/* Reset admin password */
function resetAdminPassword() {
  const cur = localStorage.getItem(ADMIN_KEY);
  const old = prompt("Enter current password:");

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

/* ==========================================================
   🔵 EMAIL TAG UPDATE (Fixes "Loading...")
========================================================== */

window.updateEmailTag = function () {
  const tag = document.getElementById("emailTag");
  if (!tag) return;

  try {
    const email = getUserEmail();

    if (email) {
      tag.textContent = email;
    } else {
      tag.textContent = "Offline (Local mode)";
    }
  } catch (err) {
    console.error("updateEmailTag error:", err);
    tag.textContent = "Offline";
  }
};

/* Auto-update email badge */
window.addEventListener("load", updateEmailTag);
window.addEventListener("storage", updateEmailTag);

/* EXPORTS */
window.isLoggedIn = isLoggedIn;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.getUserEmail = getUserEmail;

window.updateAdminPassword = updateAdminPassword;
window.unlockProfitWithPassword = unlockProfitWithPassword;
window.secureToggle = secureToggle;
window.resetAdminPassword = resetAdminPassword;

console.log("🔐 security.js loaded");
