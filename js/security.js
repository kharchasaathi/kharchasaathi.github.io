// security.js — Admin PIN + Role-based Access Layer for KharchaSaathi
(function () {
  console.log("%c🔐 Security module initialized", "color:#007bff;font-weight:bold;");

  const ADMIN_PIN = "1234"; // 🔑 You can change this anytime (owner only)
  const STORAGE_KEY = "adminMode";

  // --- Setup UI Elements ---
  const topBar = document.querySelector(".topbar");
  if (!topBar) return console.warn("⚠️ Security: topbar not found");

  // Admin tag (indicator)
  const adminTag = document.createElement("div");
  adminTag.id = "adminIndicator";
  adminTag.style.cssText = `
    font-size: 13px;
    color: #fff;
    background: #007bff;
    padding: 3px 8px;
    border-radius: 8px;
    margin-left: auto;
    display: none;
    user-select: none;
  `;
  adminTag.textContent = "Admin Mode ✅";
  topBar.appendChild(adminTag);

  // Logout button
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout Admin";
  logoutBtn.className = "small-btn admin-only";
  logoutBtn.style.display = "none";
  logoutBtn.onclick = deactivateAdmin;
  topBar.appendChild(logoutBtn);

  // --- Activation Shortcut (Double-tap on title) ---
  const title = topBar.querySelector("h1");
  if (title) {
    title.addEventListener("dblclick", () => {
      const pin = prompt("🔐 Enter Admin PIN to unlock:");
      if (pin === ADMIN_PIN) {
        localStorage.setItem(STORAGE_KEY, "true");
        alert("✅ Admin Mode Activated");
        enableAdminUI();
      } else {
        alert("❌ Incorrect PIN!");
      }
    });
  }

  // --- Initialize State ---
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    enableAdminUI();
  }

  // --- Core Functions ---
  function enableAdminUI() {
    adminTag.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
    showAdminOnlyButtons();
  }

  function deactivateAdmin() {
    localStorage.removeItem(STORAGE_KEY);
    alert("🔒 Admin Mode Deactivated");
    location.reload();
  }

  function showAdminOnlyButtons() {
    const adminBtns = document.querySelectorAll(".admin-only");
    adminBtns.forEach(btn => (btn.style.display = "inline-block"));
  }

  // --- Secure Action Wrapper ---
  window.confirmAdminAction = function (message, callback) {
    const isAdmin = localStorage.getItem(STORAGE_KEY) === "true";
    if (!isAdmin) return alert("⛔ Only Admin can perform this action!");
    const ok = confirm("⚠️ " + message);
    if (ok && typeof callback === "function") callback();
  };

  // --- Expose Logout Globally ---
  window.deactivateAdmin = deactivateAdmin;

  console.log("%c✅ Security system active", "color:#28a745;font-weight:bold;");
})();
