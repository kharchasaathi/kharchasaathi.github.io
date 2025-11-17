/* ==========================================================
   💰 sales.js — Sales + Profit Manager (v3.0 PRO FINAL)
   Compatible with: core.js v3.2, stock.js v3.0
========================================================== */

/* ----------------------------------------------------------
   🔁 REFRESH TYPE + PRODUCT DROPDOWNS
---------------------------------------------------------- */
function refreshSaleSelectors() {
  const typeDD = qs("#saleType");
  const prodDD = qs("#saleProduct");

  if (!typeDD || !prodDD) return;

  // TYPE DROPDOWN
  typeDD.innerHTML =
    `<option value="">Select Type</option>` +
    window.types.map(t => `<option value="${t.name}">${esc(t.name)}</option>`).join("");

  // PRODUCT DROPDOWN (TYPE|||PRODUCT)
  const products = window.stock.map(s => `${s.type}|||${s.name}`);
  const unique = [...new Set(products)];

  prodDD.innerHTML =
    `<option value="">Select Product</option>` +
    unique.map(p => {
      const [type, name] = p.split("|||");
      return `<option value="${p}">${esc(type)} — ${esc(name)}</option>`;
    }).join("");
}

/* ----------------------------------------------------------
   ➕ ADD SALE
---------------------------------------------------------- */
function addSale() {
  const date = qs('#saleDate')?.value || todayDate();
  const selected = qs('#saleProduct')?.value;
  const qty = Number(qs('#saleQty')?.value || 0);
  const price = Number(qs('#salePrice')?.value || 0);
  const status = qs('#saleStatus')?.value || "Paid";

  if (!selected) return alert("Please select a product");
  if (qty <= 0) return alert("Invalid Qty");
  if (price <= 0) return alert("Invalid Price");

  const [type, name] = selected.split("|||");

  // ✔ stock check
  const p = findProduct(type, name);
  const remain = p ? (p.qty - (p.sold || 0)) : 0;

  if (qty > remain) {
    if (!confirm(`Only ${remain} available. Continue?`)) return;
  }

  // ✔ Customer (only for credit)
  let customer = "";
  if (status === "Credit") {
    customer = prompt("Enter customer name (optional):") || "Customer";
  }

  // ✔ cost & profit calculation
  const cost = getProductCost(type, name);
  const profit = Math.round((price - cost) * qty);

  // ✔ update stock
  if (p) {
    p.sold = (p.sold || 0) + qty;
    saveStock();
  }

  // ✔ add sale record
  window.sales.push({
    id: uid("sale"),
    date,
    type,
    product: name,
    qty,
    price,
    amount: price * qty,
    profit,
    status,
    customer
  });

  saveSales();
  renderSales();
  renderStock();
  updateSummaryCards?.();
  renderAnalytics?.();

  // reset fields
  qs('#saleQty').value = "";
  qs('#salePrice').value = "";
}

/* ----------------------------------------------------------
   ✔ MARK CREDIT → PAID
---------------------------------------------------------- */
function markSalePaid(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (s.status === "Paid") return alert("Already Paid!");

  if (!confirm("Mark this sale as PAID?")) return;

  s.status = "Paid";
  saveSales();
  renderSales();
}

/* ----------------------------------------------------------
   🗑 DELETE ONE SALE
---------------------------------------------------------- */
function deleteSale(id) {
  if (!confirm("Delete this sale?")) return;

  window.sales = window.sales.filter(s => s.id !== id);
  saveSales();
  renderSales();
}

/* ----------------------------------------------------------
   🧹 CLEAR ALL SALES
---------------------------------------------------------- */
function clearAllSales() {
  if (!confirm("Delete ALL sales?")) return;

  window.sales = [];
  saveSales();
  renderSales();
  updateSummaryCards?.();
  renderAnalytics?.();
}

qs("#clearSalesBtn")?.addEventListener("click", clearAllSales);

/* ----------------------------------------------------------
   📊 RENDER SALES TABLE
---------------------------------------------------------- */
function renderSales() {
  const tbody = qs("#salesTable tbody");
  const totalEl = qs("#salesTotal");
  const profitEl = qs("#profitTotal");

  if (!tbody) return;

  let total = 0;
  let profit = 0;

  tbody.innerHTML = window.sales.map(s => {
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
        <td>${esc(s.customer || "")}</td>
        <td>
          ${
            s.status === "Credit"
              ? `<button onclick="markSalePaid('${s.id}')" class="small-btn">💳 Pay</button>`
              : `<span class="ok">💰 Paid</span>`
          }
        </td>
      </tr>`;
  }).join("");

  totalEl.textContent = total;
  profitEl.textContent = profit;

  applyProfitVisibility();
}

/* ----------------------------------------------------------
   🔒 PROFIT LOCK
---------------------------------------------------------- */
let profitLocked = false;

function applyProfitVisibility() {
  const cells = document.querySelectorAll(".profit-cell");
  const th = document.querySelector("#salesTable thead th:nth-child(7)");

  if (profitLocked) {
    cells.forEach(c => c.style.display = "none");
    if (th) th.style.display = "none";
    qs('#profitTotal').style.display = "none";
  } else {
    cells.forEach(c => c.style.display = "");
    if (th) th.style.display = "";
    qs('#profitTotal').style.display = "";
  }
}

function toggleProfit() {
  if (!profitLocked) {
    profitLocked = true;
    applyProfitVisibility();
    return alert("Profit hidden.");
  }

  const pw = prompt("Enter admin password:");
  if (!pw || !validateAdminPassword(pw))
    return alert("Wrong password!");

  profitLocked = false;
  applyProfitVisibility();
  alert("Profit unlocked.");
}

/* ----------------------------------------------------------
   🖨 PRINT SALES
---------------------------------------------------------- */
function printSales() {
  const rows = qs("#salesTable tbody").innerHTML;
  const head = qs("#salesTable thead").innerHTML;

  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Sales Report</title>
    <style>
      table{width:100%;border-collapse:collapse;}
      td,th{border:1px solid #bbb;padding:6px;text-align:center;}
    </style>
    </head><body>
    <h2>Sales Report</h2>
    <table><thead>${head}</thead><tbody>${rows}</tbody></table>
    </body></html>
  `);
  w.document.close();
  w.print();
}

/* ----------------------------------------------------------
   🚀 INITIAL LOAD
---------------------------------------------------------- */
window.addEventListener("load", () => {
  refreshSaleSelectors();
  renderSales();
});
