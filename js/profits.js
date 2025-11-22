/* ===========================================================
   profits.js — Profit Tab (Final v3.1)
   ✔ Stock & Service Investment: separate collect
   ✔ Net Profit = (SalesProfit + ServiceProfit - Expenses)
   ✔ Net Profit collect -> వెంటనే తగ్గుతుంది (reload అవసరం లేదు)
   ✔ Loss (negative) ఉంటే బటన్ RED + disabled
=========================================================== */

console.log("profits.js loaded");

const qs = s => document.querySelector(s);

/* ---------- LOCALSTORAGE KEYS ---------- */
const KEY_NET_COLLECT   = "ks-net-profit-collected";
const KEY_STOCK_COLLECT = "ks-stock-inv-collected";
const KEY_SVC_COLLECT   = "ks-svc-inv-collected";

/* ---------- HELPERS: READ / WRITE COLLECTED ---------- */
function getCollectedNet() {
  return Number(localStorage.getItem(KEY_NET_COLLECT) || 0);
}
function setCollectedNet(v) {
  localStorage.setItem(KEY_NET_COLLECT, String(v));
}

function getCollectedStockInv() {
  return Number(localStorage.getItem(KEY_STOCK_COLLECT) || 0);
}
function setCollectedStockInv(v) {
  localStorage.setItem(KEY_STOCK_COLLECT, String(v));
}

function getCollectedSvcInv() {
  return Number(localStorage.getItem(KEY_SVC_COLLECT) || 0);
}
function setCollectedSvcInv(v) {
  localStorage.setItem(KEY_SVC_COLLECT, String(v));
}

/* ---------- TOTALS (FROM EXISTING DATA) ---------- */

// Sales profit (Paid only) — core.js already defines getSalesProfitCollected()
function getSalesProfitTotal() {
  if (typeof window.getSalesProfitCollected === "function")
    return Number(window.getSalesProfitCollected() || 0);

  return (window.sales || [])
    .filter(s => String(s.status || "").toLowerCase() !== "credit")
    .reduce((a, b) => a + Number(b.profit || 0), 0);
}

// Service profit — core.js already defines getServiceProfitCollected()
function getServiceProfitTotal() {
  if (typeof window.getServiceProfitCollected === "function")
    return Number(window.getServiceProfitCollected() || 0);

  return (window.services || [])
    .filter(s => s.status === "Completed")
    .reduce((a, b) => a + Number(b.profit || 0), 0);
}

// Expenses total (simple)
function getExpensesTotal() {
  return (window.expenses || [])
    .reduce((a, b) => a + Number(b.amount || 0), 0);
}

// RAW net profit (can be negative)
function getNetProfitRaw() {
  return getSalesProfitTotal() + getServiceProfitTotal() - getExpensesTotal();
}

/* ---------- INVESTMENT TOTALS (FROM core.js) ---------- */

function getStockInvestmentTotal() {
  if (typeof window.getStockInvestmentCollected === "function")
    return Number(window.getStockInvestmentCollected() || 0);
  return 0;
}

function getServiceInvestmentTotal() {
  if (typeof window.getServiceInvestmentCollected === "function")
    return Number(window.getServiceInvestmentCollected() || 0);
  return 0;
}

/* ---------- PENDING (NOT YET COLLECTED) ---------- */

function getPendingStockInv() {
  const pending = getStockInvestmentTotal() - getCollectedStockInv();
  return pending < 0 ? 0 : pending;
}

function getPendingSvcInv() {
  const pending = getServiceInvestmentTotal() - getCollectedSvcInv();
  return pending < 0 ? 0 : pending;
}

// raw net - already collected net
function getPendingNetProfit() {
  const raw = getNetProfitRaw();
  const collected = getCollectedNet();
  const pending = raw - collected;
  // pending net only positive, loss case we separately handle
  return pending < 0 ? 0 : pending;
}

// బయట నుండి use చేయాలనుకుంటే
window.getPendingNetProfit = getPendingNetProfit;

/* ===========================================================
   RENDER PROFIT TAB
=========================================================== */

window.renderProfitTab = function () {
  // 1) INVESTMENTS (pending only)
  const stockPending = getPendingStockInv();
  const svcPending   = getPendingSvcInv();

  qs("#pStockInv") && (qs("#pStockInv").textContent = "₹" + stockPending);
  qs("#pSvcInv")   && (qs("#pSvcInv").textContent   = "₹" + svcPending);

  // 2) PROFITS (TOTAL display only)
  const salesProf = getSalesProfitTotal();
  const svcProf   = getServiceProfitTotal();

  qs("#pSalesProfit") && (qs("#pSalesProfit").textContent = "₹" + salesProf);
  qs("#pSvcProfit")   && (qs("#pSvcProfit").textContent   = "₹" + svcProf);

  // 3) NET PROFIT (display + button color)
  const rawNet     = getNetProfitRaw();       // ఇది loss check కోసం
  const pendingNet = getPendingNetProfit();   // collect amount

  const netBox = qs("#pNetProfit");
  const btn    = qs("#collectNetProfitBtn");

  if (!netBox || !btn) return;

  // Display:  
  //   - loss అయితే  -₹value
  //   - profit అయితే pending (collect చేయగలిగినది మాత్రమే)
  let showVal;
  if (rawNet < 0) {
    showVal = rawNet;
  } else {
    showVal = pendingNet;
  }

  if (showVal < 0) {
    netBox.textContent = "-₹" + Math.abs(showVal);
  } else {
    netBox.textContent = "₹" + showVal;
  }

  // Button state:
  //  - rawNet < 0  → RED + disabled
  //  - rawNet >=0 & pendingNet > 0 → GREEN + enabled
  //  - rawNet >=0 & pendingNet == 0 → GREY + disabled
  if (rawNet < 0) {
    btn.style.background = "#b71c1c"; // red
    btn.disabled = true;
  } else if (pendingNet > 0) {
    btn.style.background = "#2e7d32"; // green
    btn.disabled = false;
  } else {
    btn.style.background = "#555";    // no money to collect
    btn.disabled = true;
  }
};

/* ===========================================================
   BUTTON HANDLERS
=========================================================== */

// STOCK INVESTMENT COLLECT (separate)
qs("#collectStockInvBtn")?.addEventListener("click", () => {
  const pending = getPendingStockInv();
  if (!pending) {
    alert("No Stock Investment pending to collect.");
    return;
  }
  if (!confirm(`Collect ₹${pending} Stock Investment?`)) return;

  setCollectedStockInv(getCollectedStockInv() + pending);
  alert(`Collected Stock Investment: ₹${pending}`);

  window.renderProfitTab?.();
  window.renderAnalytics?.();
  window.updateTabSummaryBar?.();
});

// SERVICE INVESTMENT COLLECT (separate)
qs("#collectSvcInvBtn")?.addEventListener("click", () => {
  const pending = getPendingSvcInv();
  if (!pending) {
    alert("No Service Investment pending to collect.");
    return;
  }
  if (!confirm(`Collect ₹${pending} Service Investment?`)) return;

  setCollectedSvcInv(getCollectedSvcInv() + pending);
  alert(`Collected Service Investment: ₹${pending}`);

  window.renderProfitTab?.();
  window.renderAnalytics?.();
  window.updateTabSummaryBar?.();
});

// NET PROFIT COLLECT (SalesProfit + ServiceProfit - Expenses)
qs("#collectNetProfitBtn")?.addEventListener("click", () => {
  const rawNet     = getNetProfitRaw();
  const pendingNet = getPendingNetProfit();

  if (rawNet < 0) {
    alert("Currently loss. Net profit is negative, cannot collect.");
    return;
  }
  if (!pendingNet) {
    alert("No Net Profit pending to collect.");
    return;
  }

  if (!confirm(`Collect Net Profit of ₹${pendingNet}?`)) return;

  setCollectedNet(getCollectedNet() + pendingNet);
  alert(`Collected Net Profit: ₹${pendingNet}`);

  window.renderProfitTab?.();
  window.renderAnalytics?.();
  window.updateTabSummaryBar?.();
});

/* ===========================================================
   AUTO RENDER ON LOAD + STORAGE CHANGE
=========================================================== */

window.addEventListener("load", () => {
  setTimeout(() => {
    window.renderProfitTab?.();
  }, 200);
});

window.addEventListener("storage", () => {
  // sales / service / expenses మారితే కూడా refresh అవ్వాలి
  window.renderProfitTab?.();
});
