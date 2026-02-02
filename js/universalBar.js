/* ===========================================================
   universal-bar.js — LOCKED COLLECT-ONLY VERSION (v16)
   -----------------------------------------------------------
   ✅ Universal Bar = READ ONLY (except Collect)
   ✅ Clear buttons NEVER affect this bar
   ✅ Only Collect button updates offsets
   ✅ Cloud offsets = single source of truth
=========================================================== */

(function () {

  const num = v => (isNaN(v = Number(v))) ? 0 : Number(v);
  const money = v => "₹" + Math.round(num(v));

  /* -----------------------------------------------------------
     CLOUD OFFSET LOAD & SAVE
  ----------------------------------------------------------- */
  const OFFSET_KEY = "offsets"; // Firestore doc / collection key

  async function loadOffsets() {
    if (typeof cloudLoad !== "function") return {};
    try {
      const data = await cloudLoad(OFFSET_KEY);
      return typeof data === "object" && data !== null ? data : {};
    } catch {
      return {};
    }
  }

  async function saveOffsets(obj) {
    if (typeof cloudSaveDebounced !== "function") return;
    cloudSaveDebounced(OFFSET_KEY, obj);
  }

  /* -----------------------------------------------------------
     GLOBAL OFFSET STORE (COLLECTED AMOUNTS)
     ❗ NEVER reset automatically
  ----------------------------------------------------------- */
  window.__offsets = {
    net: 0,     // collected net profit
    sale: 0,    // collected sale profit
    service: 0, // collected service profit
    stock: 0,   // collected stock investment (sold)
    servInv: 0  // collected service investment
  };

  async function initOffsets() {
    const loaded = await loadOffsets();

    window.__offsets = {
      net:     num(loaded.net),
      sale:    num(loaded.sale),
      service: num(loaded.service),
      stock:   num(loaded.stock),
      servInv: num(loaded.servInv)
    };

    updateUniversalBar();
  }

  /* -----------------------------------------------------------
     CENTRAL METRIC CALCULATOR (LIVE DATA)
     ⚠️ Pure calculation — NO SIDE EFFECTS
  ----------------------------------------------------------- */
  function computeMetrics() {

    const sales    = Array.isArray(window.sales)    ? window.sales    : [];
    const services = Array.isArray(window.services) ? window.services : [];
    const expenses = Array.isArray(window.expenses) ? window.expenses : [];
    const stock    = Array.isArray(window.stock)    ? window.stock    : [];

    let saleProfit    = 0;
    let serviceProfit = 0;
    let pendingCredit = 0;
    let totalExpenses = 0;

    let stockInvestSold = 0;
    let serviceInvest  = 0;

    /* ---------- SALES ---------- */
    sales.forEach(s => {
      const st = (s.status || "").toLowerCase();
      if (st === "credit") {
        pendingCredit += num(s.total);
      } else {
        saleProfit += num(s.profit);
      }
    });

    /* ---------- SERVICES ---------- */
    services.forEach(j => {
      if ((j.status || "").toLowerCase() === "completed") {
        serviceProfit += num(j.profit);
        serviceInvest += num(j.invest);
      }
    });

    /* ---------- EXPENSES ---------- */
    expenses.forEach(e => {
      totalExpenses += num(e.amount);
    });

    /* ---------- STOCK (SOLD INVESTMENT) ---------- */
    stock.forEach(p => {
      const sold = num(p.sold);
      if (sold > 0) stockInvestSold += sold * num(p.cost);
    });

    const offs = window.__offsets;

    const netLive =
      saleProfit + serviceProfit - totalExpenses;

    return {
      // 🔹 Raw live values (for UI breakdown)
      saleProfitLive:    saleProfit,
      serviceProfitLive: serviceProfit,
      expensesLive:      totalExpenses,

      // 🔹 Display values (after collection offsets)
      saleProfitCollected:    Math.max(0, saleProfit    - offs.sale),
      serviceProfitCollected: Math.max(0, serviceProfit - offs.service),

      stockInvestSold:        Math.max(0, stockInvestSold - offs.stock),
      serviceInvestCompleted: Math.max(0, serviceInvest  - offs.servInv),

      pendingCreditTotal: pendingCredit,

      netProfit: Math.max(0, netLive - offs.net)
    };
  }

  /* -----------------------------------------------------------
     UPDATE UI (READ ONLY)
  ----------------------------------------------------------- */
  function updateUniversalBar() {
    const m = computeMetrics();

    const el = {
      net:     document.getElementById("unNetProfit"),
      sale:    document.getElementById("unSaleProfit"),
      serv:    document.getElementById("unServiceProfit"),
      exp:     document.getElementById("unExpenses"),
      stock:   document.getElementById("unStockInv"),
      servInv: document.getElementById("unServiceInv"),
      credit:  document.getElementById("unCreditSales")
    };

    if (el.sale)    el.sale.textContent    = money(m.saleProfitCollected);
    if (el.serv)    el.serv.textContent    = money(m.serviceProfitCollected);
    if (el.exp)     el.exp.textContent     = money(m.expensesLive);
    if (el.stock)   el.stock.textContent   = money(m.stockInvestSold);
    if (el.servInv) el.servInv.textContent = money(m.serviceInvestCompleted);
    if (el.credit)  el.credit.textContent  = money(m.pendingCreditTotal);
    if (el.net)     el.net.textContent     = money(m.netProfit);

    // expose for other modules (analytics / UI)
    window.__unMetrics = m;
  }

  window.updateUniversalBar = updateUniversalBar;

  /* -----------------------------------------------------------
     COLLECT HANDLER (ONLY MUTATION POINT)
  ----------------------------------------------------------- */
  async function collect(kind) {

    const m    = window.__unMetrics || {};
    const offs = window.__offsets;

    const map = {
      net:    ["Net Profit",                    m.netProfit,              "net"],
      stock:  ["Stock Investment (Sold Items)", m.stockInvestSold,        "stock"],
      service:["Service Investment",            m.serviceInvestCompleted, "servInv"]
    };

    if (!map[kind]) return;

    const [label, available, key] = map[kind];

    if (num(available) <= 0)
      return alert("Nothing available to collect.");

    const amount = num(
      prompt(`${label}\nAvailable: ₹${available}\nEnter amount to collect:`)
    );

    if (amount <= 0 || amount > available)
      return alert("Invalid amount.");

    const note = prompt("Optional note:", "") || "";

    // ✅ Collection history ONLY from Collect button
    window.addCollectionEntry?.(label, note, amount);

    offs[key] = num(offs[key]) + amount;

    // Special handling: Net collect locks sale & service baseline
    if (kind === "net") {
      offs.sale =
        num(window.sales?.reduce((a, s) => a + num(s.profit), 0) || 0);
      offs.service =
        num(window.services?.reduce((a, j) => a + num(j.profit), 0) || 0);
    }

    await saveOffsets(offs);

    updateUniversalBar();
    window.renderCollection?.();
    window.renderAnalytics?.();

    alert("Amount collected successfully.");
  }

  window.handleCollect = collect;

  /* -----------------------------------------------------------
     AUTO COLLECT BUTTON HANDLER
  ----------------------------------------------------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".collect-btn");
    if (!btn) return;
    collect(btn.dataset.collect);
  });

  /* -----------------------------------------------------------
     INIT
  ----------------------------------------------------------- */
  window.addEventListener("load", () => {
    setTimeout(initOffsets, 300);
  });

})();
