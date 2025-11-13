// core.js — tabs, theme, module loader, dashboard calculations
(function () {

  console.log("⚙️ Core Loaded");

  // --- Theme Toggle ---
  const themeBtn = document.getElementById("themeBtn");
  if (localStorage.getItem("ks-theme") === "dark")
    document.body.classList.add("dark");

  themeBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "ks-theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  };

  // --- Help Modal ---
  document.getElementById("helpBtn").onclick = () =>
    document.getElementById("helpModal").setAttribute("aria-hidden", "false");

  document.getElementById("closeHelp").onclick = () =>
    document.getElementById("helpModal").setAttribute("aria-hidden", "true");

  // --- Tabs ---
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");

  tabs.forEach(t =>
    t.onclick = () => activateTab(t.dataset.tab)
  );

  function activateTab(id) {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
    sections.forEach(s => s.classList.toggle("active", s.id === id));

    lazyLoad(id);
  }

  // --- Module Map ---
  const map = {
    types: "js/types.js",
    stock: "js/stock.js",
    sales: "js/sales.js",
    wanting: "js/wanting.js",
    analytics: "js/analytics.js"
  };

  const loaded = {};

  // --- Lazy Load Modules ---
  function lazyLoad(id) {
    if (loaded[id]) {
      runInit(id);
      return;
    }

    if (!map[id]) return;

    const s = document.createElement("script");
    s.src = map[id];
    s.onload = () => {
      loaded[id] = true;
      console.log("Module loaded:", id);
      runInit(id);
    };
    document.body.appendChild(s);
  }

  // --- Module Init router ---
  function runInit(id) {
    if (id === "wanting" && typeof wantingModuleInit === "function")
      wantingModuleInit();

    if (typeof moduleInit === "function")
      moduleInit(id);

    if (typeof perTabUpdate === "function")
      perTabUpdate(id);
  }

  // --- Summary Boxes Update ---
  window.updateSummaryCards = function () {
    try {
      const sales = JSON.parse(localStorage.getItem("sales-data") || "[]");
      const stock = JSON.parse(localStorage.getItem("stock-data") || "[]");

      const today = new Date().toISOString().split("T")[0];
      let todaySales = 0, todayCredit = 0, todayProfit = 0;

      sales.forEach(s => {
        if (s.date === today) {
          if (s.status === "Paid") todaySales += +s.amount;
          if (s.status === "Credit") todayCredit += +s.amount;
          todayProfit += +s.profit || 0;
        }
      });

      const total = stock.reduce((a,b)=>a+ +b.qty,0);
      const sold = stock.reduce((a,b)=>a+ +b.sold,0);

      document.getElementById("todaySales").textContent = "₹" + todaySales;
      document.getElementById("todayCredit").textContent = "₹" + todayCredit;
      document.getElementById("todayProfit").textContent = "₹" + todayProfit;
      document.getElementById("stockRemain").textContent = total ? Math.round((total - sold) / total * 100) + "%" : "0%";

    } catch (e) {
      console.log("Summary error:", e);
    }
  };

  window.addEventListener("load", updateSummaryCards);

})();
