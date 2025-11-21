/* ===========================================================
   sales.js — Sales Manager (Final v7.0)
   ✔ Correct stock deduction
   ✔ Credit/Paid handling
   ✔ Correct cost per item from stock
   ✔ Auto profit calc
   ✔ Collect system compatible
=========================================================== */

function refreshSaleTypeSelector() {
  const sel = document.getElementById("saleType");
  if (!sel) return;

  const types = window.types || [];
  sel.innerHTML = `<option value="all">All Types</option>`;

  types.forEach(t => {
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
    alert("Product not found in stock");
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

  // Save stock
  saveStock();

  // Add sale record
  window.sales = window.sales || [];
  window.sales.push({
    id: uid("sale"),
    date,
    type,
    name,
    qty,
    price,
    total,
    cost,
    profit,
    status: status || "Paid"
  });

  saveSales();
}

/* ===========================================================
   RENDER SALES TABLE
=========================================================== */
function renderSales() {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

  const filterType = document.getElementById("saleType")?.value || "all";
  const filterDate = document.getElementById("saleDate")?.value || "";

  let list = window.sales || [];

  if (filterType !== "all") {
    list = list.filter(s => s.type === filterType);
  }
  if (filterDate) {
    list = list.filter(s => s.date === filterDate);
  }

  let total = 0, profit = 0;

  tbody.innerHTML = list
    .map(s => {
      total += Number(s.total || 0);
      if (String(s.status).toLowerCase() !== "credit")
        profit += Number(s.profit || 0);

      return `
        <tr>
          <td>${toDisplay(s.date)}</td>
          <td>${s.type}</td>
          <td>${s.name}</td>
          <td>${s.qty}</td>
          <td>₹${s.price}</td>
          <td>₹${s.total}</td>
          <td>₹${s.profit}</td>
          <td>${s.status}</td>
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
});

/* Auto-render */
window.renderSales = renderSales;
window.refreshSaleTypeSelector = refreshSaleTypeSelector;
