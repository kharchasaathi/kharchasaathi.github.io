/* =======================================================
   📦 stock.js — Inventory Manager (FINAL CLEAN v12)
   ✔ BEFORE-SALE investment (purchase cost)
   ✔ AFTER-SALE investment (remain × cost)
   ✔ Shows BEFORE-sale investment in stock tab
   ✔ Exports stock investment functions for universal bar
   ✔ Quick Sale / Credit includes TIME (12-hr AM/PM)
======================================================= */

const toDisp = window.toDisplay || (x => x);
const toInt  = window.toInternal || (x => x);
const todayDate = window.todayDate || (function () {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
});

// local escape – DOES NOT clash with global esc
function escLocal(x) {
  return (x === undefined || x === null) ? "" : String(x);
}

/* -------------------------------------------------------
   TIME (12 hr format)
------------------------------------------------------- */
function getCurrentTime12hr() {
  const now = new Date();

  let hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  hh = hh === 0 ? 12 : hh;

  return `${hh}:${mm}:${ss} ${ampm}`;
}

/* -------------------------------------------------------
   BEFORE SALE INVESTMENT
------------------------------------------------------- */
function calcStockInvestmentBeforeSale() {
  let total = 0;

  (window.stock || []).forEach(p => {
    if (p.history && p.history.length) {
      p.history.forEach(h => {
        total += Number(h.cost || 0) * Number(h.qty || 0);
      });
    } else {
      total += Number(p.cost || 0) * Number(p.qty || 0);
    }
  });

  return total;
}

/* -------------------------------------------------------
   AFTER SALE INVESTMENT
------------------------------------------------------- */
function calcStockInvestmentAfterSale() {
  let total = 0;

  (window.stock || []).forEach(p => {
    const qty    = Number(p.qty || 0);
    const sold   = Number(p.sold || 0);
    const cost   = Number(p.cost || 0);
    const remain = qty - sold;

    if (remain > 0) total += remain * cost;
  });

  return total;
}

// Export for other modules (analytics, universal bar, collection)
window.getStockInvestmentBeforeSale = calcStockInvestmentBeforeSale;
window.getStockInvestmentAfterSale  = calcStockInvestmentAfterSale;

/* -------------------------------------------------------
   UPDATE UI BOX (Before-sale investment)
------------------------------------------------------- */
function updateStockInvestmentBox() {
  const box = qs("#stockInvValue");
  if (box) box.textContent = "₹" + calcStockInvestmentBeforeSale();
}

/* -------------------------------------------------------
   ADD STOCK ENTRY
------------------------------------------------------- */
function addStock() {
  let date = qs("#pdate")?.value || todayDate();
  const type = qs("#ptype")?.value;
  const name = (qs("#pname")?.value || "").trim();
  const qty  = Number(qs("#pqty")?.value || 0);
  const cost = Number(qs("#pcost")?.value || 0);

  if (!type || !name || qty <= 0 || cost <= 0) {
    alert("Please fill Date, Type, Product, Qty, Cost.");
    return;
  }

  if (date.includes("-") && date.split("-")[0].length === 2) {
    date = toInt(date);
  }

  // Assume addStockEntry is defined in core.js
  if (typeof window.addStockEntry === "function") {
    window.addStockEntry({ date, type, name, qty, cost });
  } else {
    // Fallback simple push
    window.stock = window.stock || [];
    window.stock.push({
      id: window.uid ? uid("stk") : Date.now().toString(),
      date,
      type,
      name,
      qty,
      sold: 0,
      cost
    });
    window.saveStock && window.saveStock();
  }

  renderStock();
  window.updateTypeDropdowns?.();
  updateStockInvestmentBox();
  window.updateUniversalBar?.();

  // clear inputs
  const pn = qs("#pname"), pq = qs("#pqty"), pc = qs("#pcost");
  if (pn) pn.value = "";
  if (pq) pq.value = "";
  if (pc) pc.value = "";
}

/* -------------------------------------------------------
   RENDER STOCK TABLE
------------------------------------------------------- */
function renderStock() {
  const filterType = qs("#filterType")?.value || "all";
  const searchTxt  = (qs("#productSearch")?.value || "").trim().toLowerCase();
  const tbody = qs("#stockTable tbody");
  if (!tbody) return;

  let html = "";

  (window.stock || [])
    .filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (searchTxt && !item.name.toLowerCase().includes(searchTxt)) return false;
      return true;
    })
    .forEach((p, i) => {
      const sold   = Number(p.sold || 0);
      const remain = Number(p.qty || 0) - sold;
      const limit  = Number(window.getGlobalLimit ? getGlobalLimit() : 0);

      let cls = "ok";
      if (remain <= 0) cls = "out";
      else if (remain <= limit) cls = "low";

      let style = "";
      if (cls === "low") {
        style = 'style="background:#fff8ec"';
      } else if (cls === "out") {
        style = 'style="background:#ffecec;color:#a00;font-weight:600"';
      }

      html += `
        <tr class="${cls}" ${style}>
          <td>${toDisp(p.date)}</td>
          <td>${escLocal(p.type)}</td>
          <td>${escLocal(p.name)}</td>
          <td>${p.qty}</td>
          <td>${sold}</td>
          <td>${remain}</td>
          <td>${cls.toUpperCase()}</td>
          <td>${limit}</td>
          <td>
            <button class="history-btn" data-i="${i}">📜 History</button>
            <button class="sale-btn" data-i="${i}">💰 Sale</button>
            <button class="credit-btn" data-i="${i}">💳 Credit</button>
          </td>
        </tr>`;
    });

  tbody.innerHTML = html || `<tr><td colspan="9">No Stock Found</td></tr>`;

  updateStockInvestmentBox();
}

/* -------------------------------------------------------
   HISTORY POPUP
------------------------------------------------------- */
function showHistory(i) {
  const p = (window.stock || [])[i];
  if (!p || !p.history || !p.history.length) {
    alert("No history found.");
    return;
  }

  let msg = `Purchase History of ${p.name}:\n\n`;
  p.history.forEach(h => {
    msg += `${toDisp(h.date)} — Qty ${h.qty} @ ₹${h.cost}\n`;
  });

  alert(msg);
}
window.showHistory = showHistory;

/* -------------------------------------------------------
   QUICK SALE / CREDIT  (adds time)
------------------------------------------------------- */
function stockQuickSale(i, mode) {
  const p = (window.stock || [])[i];
  if (!p) return;

  const remain = Number(p.qty || 0) - Number(p.sold || 0);
  if (remain <= 0) {
    alert("No stock left!");
    return;
  }

  const qty = Number(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = Number(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  const cost  = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - (qty * cost);

  p.sold = (p.sold || 0) + qty;

  const timeNow = getCurrentTime12hr();

  window.sales = window.sales || [];
  window.sales.push({
    id: window.uid ? uid("sale") : Date.now().toString(),
    date: todayDate(),
    time: timeNow,
    type: p.type,
    product: p.name,
    qty,
    price,
    total,
    amount: total,
    cost,
    profit,
    status: mode
  });

  window.saveStock  && window.saveStock();
  window.saveSales  && window.saveSales();

  if (p.sold >= p.qty && typeof window.autoAddWanting === "function") {
    window.autoAddWanting(p.type, p.name, "Finished");
  }

  renderStock();
  window.renderSales?.();
  window.updateSummaryCards?.();
  window.renderAnalytics?.();
  window.updateTabSummaryBar?.();
  window.updateUniversalBar?.();
}

/* -------------------------------------------------------
   BUTTON EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {
  const t = e.target;

  if (t.id === "addStockBtn") {
    addStock();
    return;
  }

  if (t.id === "setLimitBtn") {
    const v = Number(qs("#globalLimit")?.value);
    if (v < 0 || isNaN(v)) {
      alert("Invalid Limit!");
      return;
    }
    if (confirm(`Set global limit = ${v} for ALL products?`)) {
      window.setGlobalLimit && setGlobalLimit(v);
      alert("Global limit updated.");
      renderStock();
    }
    return;
  }

  if (t.id === "clearStockBtn") {
    if (confirm("Clear ALL stock?")) {
      window.stock = [];
      window.saveStock && window.saveStock();
      renderStock();
      updateStockInvestmentBox();
      window.updateUniversalBar?.();
    }
    return;
  }

  if (t.classList.contains("history-btn")) {
    showHistory(Number(t.dataset.i));
    return;
  }

  if (t.classList.contains("sale-btn")) {
    stockQuickSale(Number(t.dataset.i), "Paid");
    return;
  }

  if (t.classList.contains("credit-btn")) {
    stockQuickSale(Number(t.dataset.i), "Credit");
    return;
  }
});

/* -------------------------------------------------------
   FILTER + SEARCH EVENTS
------------------------------------------------------- */
qs("#filterType")?.addEventListener("change", renderStock);
qs("#productSearch")?.addEventListener("input", renderStock);

/* -------------------------------------------------------
   INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  window.updateTypeDropdowns?.();
  renderStock();
  updateStockInvestmentBox();
  window.updateUniversalBar?.();
});
