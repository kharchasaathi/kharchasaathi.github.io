/* ==========================================================
   💰 sales.js — Sales + Profit Manager (v2.0)
   Works with: core.js, stock.js, types.js, analytics.js
   ========================================================== */

const SALES_KEY = "sales-data";
window.sales = JSON.parse(localStorage.getItem(SALES_KEY) || "[]");

let profitLocked = false;

/* ----------------------------------------------------------
   SAVE SALES
---------------------------------------------------------- */
function saveSales() {
  localStorage.setItem(SALES_KEY, JSON.stringify(window.sales));
  window.dispatchEvent(new Event("storage"));
  cloudSaveDebounced("sales", window.sales);
}

/* ----------------------------------------------------------
   REFRESH TYPE + PRODUCT DROPDOWNS
---------------------------------------------------------- */
function refreshSaleSelectors() {
  const typeDD = document.getElementById("saleType");
  const prodDD = document.getElementById("saleProduct");
  if (!typeDD || !prodDD) return;

  /* Types */
  typeDD.innerHTML =
    `<option value="">Select Type</option>` +
    window.types
      .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
      .join("");

  /* Unique product list */
  const products = window.stock.map(s => ({
    type: s.type,
    name: s.name
  }));

  const unique = products.filter(
    (x, i, a) => a.findIndex(y => y.type === x.type && y.name === x.name) === i
  );

  prodDD.innerHTML =
    `<option value="">Select Product</option>` +
    unique
      .map(p => `<option value="${p.type}|||${p.name}">
        ${esc(p.type)} — ${esc(p.name)}
      </option>`)
      .join("");
}

/* ----------------------------------------------------------
   ADD SALE ENTRY
---------------------------------------------------------- */
function addSale() {
  const d = document.getElementById("saleDate")?.value || todayDate();
  const val = document.getElementById("saleProduct")?.value;
  const qty = Number(document.getElementById("saleQty")?.value || 0);
  const price = Number(document.getElementById("salePrice")?.value || 0);
  const status = document.getElementById("saleStatus")?.value || "Paid";

  if (!val) return alert("Select product");
  if (!qty || qty <= 0) return alert("Invalid Qty");
  if (!price || price <= 0) return alert("Invalid Price");

  const [type, name] = val.split("|||");

  const p = findProduct(type, name);
  const remain = p ? Number(p.qty) : 0;

  if (qty > remain && !confirm(`Only ${remain} in stock. Continue?`)) return;

  const cost = getProductCost(type, name);
  const amount = price * qty;
  const profit = Math.round((price - cost) * qty);

  /* ---- Update stock ---- */
  updateStockQty(type, name, -qty);

  /* ---- Add sale record ---- */
  const entry = {
    id: uid("sale"),
    date: d,
    type,
    product: name,
    qty,
    price,
    amount,
    profit,
    status
  };

  window.sales.push(entry);
  saveSales();

  renderSales();
  renderStock();
  updateSummaryCards?.();
  renderAnalytics?.();

  /* reset inputs */
  document.getElementById("saleQty").value = "";
  document.getElementById("salePrice").value = "";
}

/* ----------------------------------------------------------
   MARK CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (s.status === "Paid") return alert("Already paid!");

  if (!confirm("Mark this credit as paid?")) return;

  s.status = "Paid";
  saveSales();
  renderSales();
}

/* ----------------------------------------------------------
   DELETE SALE (optional)
---------------------------------------------------------- */
function deleteSale(id) {
  if (!confirm("Delete this sale permanently?")) return;
  window.sales = window.sales.filter(s => s.id !== id);
  saveSales();
  renderSales();
}

/* ----------------------------------------------------------
   RENDER SALES TABLE
---------------------------------------------------------- */
function renderSales(filterDate = null) {
  const tbody = document.querySelector("#salesTable tbody");
  const totalEl = document.getElementById("salesTotal");
  const profitEl = document.getElementById("profitTotal");
  if (!tbody) return;

  let list = window.sales.slice().sort((a,b)=>a.date<b.date?1:-1);

  if (filterDate) list = list.filter(s => s.date === filterDate);

  let total = 0, profit = 0;

  tbody.innerHTML = list
    .map(s => {
      total += s.amount;
      profit += s.profit;

      return `
        <tr>
          <td>${s.date}</td>
          <td>${esc(s.type)}</td>
          <td>${esc(s.product)}</td>
          <td>${s.qty}</td>
          <td>${s.price}</td>
          <td>${s.amount}</td>
          <td class="profit-cell">${s.profit}</td>
          <td>
            ${s.status === "Credit"
              ? `<button class="small-btn" onclick="markSalePaid('${s.id}')">💳 Pay</button>`
              : `<span class="ok">Paid</span>`}
          </td>
        </tr>`;
    })
    .join("");

  if (!tbody.innerHTML)
    tbody.innerHTML = `<tr><td colspan="8">No Sales</td></tr>`;

  totalEl.textContent = total;
  profitEl.textContent = profit;

  applyProfitVisibility();
}

/* ----------------------------------------------------------
   PROFIT LOCK
---------------------------------------------------------- */
function applyProfitVisibility() {
  const cells = document.querySelectorAll(".profit-cell");
  const head = document.querySelector("#salesTable thead th:nth-child(7)");

  if (profitLocked) {
    cells.forEach(c => (c.style.display = "none"));
    if (head) head.style.display = "none";
    document.getElementById("profitTotal").style.display = "none";
  } else {
    cells.forEach(c => (c.style.display = ""));
    if (head) head.style.display = "";
    document.getElementById("profitTotal").style.display = "";
  }
}

function toggleProfit() {
  if (!profitLocked) {
    profitLocked = true;
    applyProfitVisibility();
    return alert("Profit Hidden. Unlock with Admin password.");
  }

  const pw = prompt("Enter admin password:");
  if (!pw || !validateAdminPassword(pw)) return alert("Incorrect!");

  profitLocked = false;
  applyProfitVisibility();
  alert("Profit Unlocked.");
}

/* ----------------------------------------------------------
   PRINT SALES
---------------------------------------------------------- */
function printSales() {
  const rows = document.querySelector("#salesTable tbody").innerHTML;
  const head = document.querySelector("#salesTable thead").innerHTML;

  const html = `
    <html>
      <head>
        <title>Sales Report</title>
        <style>
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #ccc;padding:6px;text-align:center;}
        </style>
      </head>
      <body>
        <h2>Sales Report</h2>
        <table>
          <thead>${head}</thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
}

/* ----------------------------------------------------------
   EVENT HANDLERS
---------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addSaleBtn") addSale();
  if (e.target.id === "printSalesBtn") printSales();
  if (e.target.id === "toggleProfitBtn") toggleProfit();
});

/* ----------------------------------------------------------
   INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleSelectors();
  renderSales();
});
