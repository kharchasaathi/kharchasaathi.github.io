/* ===========================================================
   sales.js — Sales Manager (Final v11.2 with Universal Bar)
   ✔ Profit auto-calculated
   ✔ Time included (12-hour format)
   ✔ Analytics + Overview + Universal bar sync
   ✔ No double-profit / double-invest errors
=========================================================== */

function refreshSaleTypeSelector() {
  const sel = document.getElementById("saleType");
  if (!sel) return;

  sel.innerHTML = `<option value="all">All Types</option>`;
  (window.types || []).forEach(t => {
    sel.innerHTML += `<option value="${t.name}">${t.name}</option>`;
  });
}

/* -----------------------------------------------------------
   🔵 12-HOUR TIME GENERATOR
----------------------------------------------------------- */
function getCurrentTime12hr() {
  const now = new Date();

  let hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");

  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  hh = hh === 0 ? 12 : hh;

  return `${hh}:${mm}:${ss} ${ampm}`;
}

/* -----------------------------------------------------------
   ADD SALE ENTRY (Clean — No double profit/invest)
----------------------------------------------------------- */
function addSaleEntry({ date, type, name, qty, price, status }) {

  date = window.toInternalIfNeeded ? toInternalIfNeeded(date) : date;
  qty = Number(qty);
  price = Number(price);

  if (!type || !name || qty <= 0 || price <= 0) return;

  let p = window.findProduct ? findProduct(type, name) : null;
  if (!p) {
    alert("Product not found in stock!");
    return;
  }

  if (p.qty < qty) {
    alert("Not enough stock!");
    return;
  }

  const cost  = Number(p.cost || 0);
  const total = qty * price;
  const invest = qty * cost;
  const profit = total - invest;

  // Update stock
  p.qty -= qty;
  p.sold = (p.sold || 0) + qty;
  window.saveStock && window.saveStock();

  // 🔵 Add sale record
  window.sales = window.sales || [];
  window.sales.push({
    id: window.uid ? uid("sale") : Date.now().toString(),
    date,
    time: getCurrentTime12hr(),
    type,
    product: name,
    qty,
    price,
    total,
    amount: total,
    cost,
    profit,
    status: status || "Paid"
  });

  window.saveSales && window.saveSales();

  renderSales?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateTabSummaryBar?.();
  window.updateUniversalBar?.();
}

/* -----------------------------------------------------------
   TOGGLE CREDIT → PAID
----------------------------------------------------------- */
function toggleSaleStatus(id) {
  const s = (window.sales || []).find(x => x.id === id);
  if (!s) return;

  if (s.status === "Credit") {
    if (!confirm("Mark this Credit sale as PAID?")) return;
    s.status = "Paid";
  } else {
    alert("Already Paid.");
    return;
  }

  window.saveSales && window.saveSales();
  renderSales();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateTabSummaryBar?.();
  window.updateUniversalBar?.();
}
window.toggleSaleStatus = toggleSaleStatus;

/* -----------------------------------------------------------
   RENDER SALES TABLE
----------------------------------------------------------- */
function renderSales() {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

  const filterType = document.getElementById("saleType")?.value || "all";
  const filterDate = document.getElementById("saleDate")?.value || "";

  let list = [...(window.sales || [])];

  if (filterType !== "all") list = list.filter(s => s.type === filterType);
  if (filterDate)          list = list.filter(s => s.date === filterDate);

  let total = 0, profit = 0;

  tbody.innerHTML = list.map(s => {
      const t = Number(s.total || s.amount || 0);
      total += t;

      if (String(s.status).toLowerCase() !== "credit")
        profit += Number(s.profit || 0);

      const statusHTML = 
        s.status === "Credit"
          ? `<button onclick="toggleSaleStatus('${s.id}')" 
               style="background:#2196f3;color:white;border:none;
               padding:4px 10px;border-radius:5px;cursor:pointer;">
               💳 Credit
             </button>`
          : `<span style="background:#4caf50;color:white;
                  padding:4px 10px;border-radius:5px;">
                💰 Paid
             </span>`;

      return `
        <tr>
          <td>${window.toDisplay ? toDisplay(s.date) : s.date}<br>
              <small>${s.time || "--"}</small></td>
          <td>${s.type}</td>
          <td>${s.product}</td>
          <td>${s.qty}</td>
          <td>₹${s.price}</td>
          <td>₹${t}</td>
          <td>₹${s.profit}</td>
          <td>${statusHTML}</td>
        </tr>`;
    })
    .join("");

  document.getElementById("salesTotal").textContent  = total;
  document.getElementById("profitTotal").textContent = profit;

  window.updateUniversalBar?.();
}

/* -----------------------------------------------------------
   CLEAR SALES
----------------------------------------------------------- */
document.getElementById("clearSalesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear all sales?")) return;
  window.sales = [];
  window.saveSales && window.saveSales();
  renderSales();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateTabSummaryBar?.();
  window.updateUniversalBar?.();
});

window.renderSales = renderSales;
window.refreshSaleTypeSelector = refreshSaleTypeSelector;
