/* ===========================================================
   sales.js — Sales Manager (Final v9.0)
   ✔ product key fixed
   ✔ total value correct
   ✔ Stock deduction correct
   ✔ Profit calculation correct
   ✔ No undefined values
   ✔ Works with Profit tab + Analytics
   ✔ Credit → Paid toggle button restored
=========================================================== */

function refreshSaleTypeSelector() {
  const sel = document.getElementById("saleType");
  if (!sel) return;

  sel.innerHTML = `<option value="all">All Types</option>`;
  (window.types || []).forEach(t => {
    sel.innerHTML += `<option value="${t.name}">${t.name}</option>`;
  });
}

/* ===========================================================
   ADD SALE ENTRY
=========================================================== */
function addSaleEntry({ date, type, name, qty, price, status }) {
  date = toInternalIfNeeded(date);
  qty = Number(qty);
  price = Number(price);

  if (!type || !name || qty <= 0 || price <= 0) return;

  let p = findProduct(type, name);
  if (!p) {
    alert("Product not found in stock!");
    return;
  }

  if (p.qty < qty) {
    alert("Not enough stock!");
    return;
  }

  const cost = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - (qty * cost);

  // Deduct stock
  p.qty -= qty;
  p.sold += qty;
  saveStock();

  // Save sale record
  window.sales = window.sales || [];
  window.sales.push({
    id: uid("sale"),
    date,
    type,
    product: name,
    qty,
    price,
    amount: total,
    total,
    cost,
    profit,
    status: status || "Paid"
  });

  saveSales();

  renderSales?.();
  renderAnalytics?.();
  updateTabSummaryBar?.();
}

/* ===========================================================
   TOGGLE CREDIT → PAID
=========================================================== */
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

  saveSales();
  renderSales();
  renderAnalytics?.();
  updateTabSummaryBar?.();
}
window.toggleSaleStatus = toggleSaleStatus;

/* ===========================================================
   RENDER SALES TABLE
=========================================================== */
function renderSales() {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

  const filterType = document.getElementById("saleType")?.value || "all";
  const filterDate = document.getElementById("saleDate")?.value || "";

  let list = window.sales || [];

  if (filterType !== "all") list = list.filter(s => s.type === filterType);
  if (filterDate) list = list.filter(s => s.date === filterDate);

  let total = 0, profit = 0;

  tbody.innerHTML = list
    .map(s => {
      const t = Number(s.total || s.amount || 0);

      total += t;
      if (String(s.status).toLowerCase() !== "credit")
        profit += Number(s.profit || 0);

      /* ---- STATUS BUTTON ---- */
      let statusHTML = "";
      if (s.status === "Credit") {
        statusHTML = `
          <button onclick="toggleSaleStatus('${s.id}')"
            style="background:#2196f3;color:white;border:none;
                   padding:4px 10px;border-radius:5px;cursor:pointer;">
            💳 Credit
          </button>`;
      } else {
        statusHTML = `
          <span style="background:#4caf50;color:white;
                       padding:4px 10px;border-radius:5px;">
            💰 Paid
          </span>`;
      }

      return `
        <tr>
          <td>${toDisplay(s.date)}</td>
          <td>${s.type}</td>
          <td>${s.product}</td>
          <td>${s.qty}</td>
          <td>₹${s.price}</td>
          <td>₹${t}</td>
          <td>₹${s.profit}</td>
          <td>${statusHTML}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("salesTotal").textContent = total;
  document.getElementById("profitTotal").textContent = profit;
}

/* ===========================================================
   CLEAR SALES
=========================================================== */
document.getElementById("clearSalesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear all sales?")) return;
  window.sales = [];
  saveSales();
  renderSales();
  renderAnalytics?.();
  updateTabSummaryBar?.();
});

window.renderSales = renderSales;
window.refreshSaleTypeSelector = refreshSaleTypeSelector;
