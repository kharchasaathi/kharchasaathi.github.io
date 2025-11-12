// security.js — Admin PIN + Role-based Access Layer for KharchaSaathi
(function () {
  console.log("🔐 Security module loaded");

  const ADMIN_PIN = "1234"; // you can change this later (only owner knows)

  // Add Admin Mode indicator at top right
  const topBar = document.querySelector(".topbar");
  const adminTag = document.createElement("div");
  adminTag.id = "adminIndicator";
  adminTag.style.cssText = `
    font-size: 13px; color: white; background:#007bff;
    padding:3px 8px; border-radius:8px; margin-left:auto; display:none;
  `;
  adminTag.textContent = "Admin Mode ✅";
  topBar.appendChild(adminTag);

  // Hidden activation shortcut (double tap on app name)
  const title = document.querySelector("h1");
  title.addEventListener("dblclick", () => {
    const pin = prompt("Enter Admin PIN to unlock:");
    if (pin === ADMIN_PIN) {
      localStorage.setItem("adminMode", "true");
      alert("✅ Admin Mode Activated");
      adminTag.style.display = "inline-block";
      showAdminOptions();
    } else {
      alert("❌ Incorrect PIN!");
    }
  });

  // If admin already active from last session
  if (localStorage.getItem("adminMode") === "true") {
    adminTag.style.display = "inline-block";
    showAdminOptions();
  }

  // Show/Hide secure options dynamically
  function showAdminOptions() {
    const adminBtns = document.querySelectorAll(".admin-only");
    adminBtns.forEach((btn) => (btn.style.display = "inline-block"));
  }

  // Logout Admin
  window.deactivateAdmin = function () {
    localStorage.removeItem("adminMode");
    alert("🔒 Admin Mode Deactivated");
    location.reload();
  };

  // Add a small logout button only visible to admin
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout Admin";
  logoutBtn.className = "small-btn";
  logoutBtn.style.display = "none";
  logoutBtn.onclick = window.deactivateAdmin;
  topBar.appendChild(logoutBtn);

  // Auto toggle logout button if admin active
  if (localStorage.getItem("adminMode") === "true") {
    logoutBtn.style.display = "inline-block";
  }

  // Optional: confirmation on risky actions (Clear, Delete All, etc.)
  window.confirmAdminAction = function (msg, fn) {
    const isAdmin = localStorage.getItem("adminMode") === "true";
    if (!isAdmin) return alert("⛔ Only Admin can perform this action!");
    const ok = confirm("⚠️ " + msg);
    if (ok && typeof fn === "function") fn();
  };
})();
