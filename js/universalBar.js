/* ===========================================================
   universal-bar.js — FINAL v3.2 (FIXED SERVICE INVEST KEY)
   ✔ Matches sales.js v12, stock.js v3, collection.js v10
   ✔ Labels exactly same as dashboard cards
   ✔ Accurate metrics: profit, credit, investments
   ✔ Safe even if arrays missing or empty
============================================================ */
(function () {

  /* -------------------------------
     Utility Helpers
  --------------------------------*/
  const num = v => (isNaN(v = Number(v))) ? 0 : v;
  const money = v => "₹" + Math.round(num(v));

  /* ===========================================================
     CENTRAL METRIC CALCULATOR
     * This runs on a timer to update the top bar
  ============================================================ */
  function computeMetrics() {

    // Ensure data is an array (core.js already does this, but for safety)
    const sales    = Array.isArray(window.sales)    ? window.sales    : [];
    const services = Array.isArray(window.services) ? window.services : [];
    const expenses = Array.isArray(window.expenses) ? window.expenses : [];
    const stock    = Array.isArray(window.stock)    ? window.stock    : [];

    let saleProfitCollected     = 0;
    let serviceProfitCollected  = 0;
    let pendingCreditTotal      = 0;
    let totalExpenses           = 0;
    let stockInvestSold         = 0;
    let serviceInvestCompleted  = 0;

    /* -------------------------------
       SALES PROFIT + CREDIT
    --------------------------------*/
    sales.forEach(s => {
      const status = String(s.status || "").toLowerCase();
      const qty    = num(s.qty);
      const price  = num(s.price);

      if (status !== "credit") {
        saleProfitCollected += num(s.profit); // Use s.profit calculated in sales.js
      } else {
        const total = num(s.total) || (qty * price);
        pendingCreditTotal += total;
      }
    });

    /* -------------------------------
       SERVICE PROFIT + CREDIT
    --------------------------------*/
    services.forEach(j => {
      const status = String(j.status || "").toLowerCase();
      
      if (status === "completed") {
        serviceProfitCollected += num(j.profit);
        serviceInvestCompleted += num(j.cost); // ✅ FIX: j.cost ను ఉపయోగిస్తుంది
      } else if (status === "credit") {
        pendingCreditTotal += num(j.price);
      }
    });

    /* -------------------------------
       EXPENSES
    --------------------------------*/
    expenses.forEach(e => {
      totalExpenses += num(e.amount);
    });
    
    /* -------------------------------
       STOCK INVESTMENT (Sold items)
    --------------------------------*/
    stock.forEach(p => {
        const sold = num(p.sold);
        const cost = num(p.cost);
        stockInvestSold += sold * cost;
    });

    return {
      saleProfitCollected,
      serviceProfitCollected,
      pendingCreditTotal,
      totalExpenses,
      stockInvestSold,
      serviceInvestCompleted,
      netProfit: saleProfitCollected + serviceProfitCollected - totalExpenses
    };
  }

  /* ===========================================================
     UI UPDATER (Called by other modules like sales.js)
  ============================================================ */
  function updateUniversalBar() {
    const m = computeMetrics();
    const isMobile = window.innerWidth < 600;

    const bar = document.getElementById("universalBar");
    if (!bar) return;

    let items = [];

    // 1. Net Profit
    items.push({
      kind: "net",
      label: isMobile ? "Net" : "Net Profit",
      value: money(m.netProfit),
      class: m.netProfit >= 0 ? "positive" : "negative",
      color: m.netProfit >= 0 ? "#16a34a" : "#dc2626"
    });

    // 2. Pending Credit (Sales + Service)
    items.push({
      kind: "credit",
      label: isMobile ? "Credit" : "Pending Credit",
      value: money(m.pendingCreditTotal),
      class: "warning",
      color: "#facc15",
      action: "collect-credit" // New button link to credit tab
    });

    // 3. Stock Investment (Sold Items)
    items.push({
      kind: "stock",
      label: isMobile ? "Sold Inv" : "Stock Investment (Sold)",
      value: money(m.stockInvestSold),
      color: "#0284c7"
    });

    // 4. Service Investment (Completed Jobs)
    items.push({
      kind: "service",
      label: isMobile ? "Service Inv" : "Service Investment (Completed)",
      value: money(m.serviceInvestCompleted),
      color: "#1d4ed8"
    });

    // 5. Total Expenses
    items.push({
      kind: "expenses",
      label: isMobile ? "Expenses" : "Total Expenses",
      value: money(m.totalExpenses),
      class: "negative",
      color: "#94a3b8"
    });


    // Render items
    bar.innerHTML = items.map(item => `
      <div class="card universal-card ${item.class || ""}" style="border-left: 4px solid ${item.color};">
        <p class="label">${item.label}</p>
        <p class="value">${item.value}</p>
        ${item.action ? `
          <button class="small-btn collect-btn" data-collect="${item.action}">
            Collect
          </button>
        ` : ''}
      </div>
    `).join("");
  }
  window.updateUniversalBar = updateUniversalBar;
  window.computeMetrics = computeMetrics;

  /* ===========================================================
     CREDIT COLLECTION (from top bar)
  ============================================================ */
  function handleCollect(kind) {
    if (kind === "collect-credit") {
      // Direct link to the credit tab (defined in core.js)
      if (typeof window.switchTab === "function") {
        window.switchTab("credit");
      } else {
        alert("Switch to Credit tab to collect pending payments.");
      }
      return;
    }

    // Old logic (should not run if core.js is setup correctly)
    const m = computeMetrics();

    const labels = {
      net: [
        "Net Profit (Sale + Service − Expenses)",
        m.netProfit
      ],
      stock: [
        "Stock Investment (Sold Items)",
        m.stockInvestSold
      ],
      service: [
        "Service Investment (Completed)",
        m.serviceInvestCompleted
      ]
    };

    if (!labels[kind]) return;

    const [label, approx] = labels[kind];

    const val = prompt(
      `${label}\nApprox: ₹${Math.round(approx)}\n\nEnter amount:`
    );

    if (!val) return;

    const amt = num(val);
    if (amt <= 0) {
      alert("Invalid amount.");
      return;
    }

    const note = prompt("Optional note:", "") || "";
    window.addCollectionEntry(label, note, amt);

    updateUniversalBar();
    window.renderCollection?.();
    alert("Collection recorded.");
  }

  window.handleCollect = handleCollect;

  /* ===========================================================
     CLICK LISTENER (Top bar buttons)
  ============================================================ */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".collect-btn");
    if (!btn) return;
    handleCollect(btn.dataset.collect);
  });

  /* ===========================================================
     INITIAL LOAD
  ============================================================ */
  window.addEventListener("load", () => {
    // tiny delay gives HTML time to render → prevents “Loading...” freeze
    setTimeout(updateUniversalBar, 150);
  });

})();
