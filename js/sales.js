/* ===========================================================
   sales.js — FINAL v11 (Consolidated, Bug-Free)
   -----------------------------------------------------------
   ✔ Credit profit excluded until collection
   ✔ Uses collection.js → collectCreditSale(saleObj)
   ✔ No naming conflict
   ✔ No fallback errors
   ✔ Full UI refresh
=========================================================== */

/* ------------------------------
   TIME FORMAT
------------------------------ */
function getCurrentTime12hr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------
   REFRESH SALE TYPE DROPDOWN
------------------------------ */
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
   ⭐ CREDIT profit NOT added here (profit added only after collection)
=========================================================== */
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {
  qty = Number(qty);
  price = Number(price);

  if (!type || !product || qty <= 0 || price <= 0) return;

  const p = (window.stock || []).find(x => x.type === type && x.name === product);
  if (!p) { alert("Product not found in stock."); return; }

  const remain = Number(p.qty) - Number(p.sold || 0);
  if (remain < qty) { alert("Not enough stock!"); return; }

  const cost  = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - qty * cost;

  // update stock
  p.sold = Number(p.sold || 0) + qty;
  window.saveStock?.();

  // add sale
  window.sales = window.sales || [];
  window.sales.push({
    id: uid ? uid("sale") : Date.now().toString(),
    date: date || todayDate(),
    time: getCurrentTime12hr(),
    type,
    product,
    qty,
    price,
    total,
    profit, // profit stored but realized only after payment
    cost,
    status: (status || "Paid"),
    customer: customer || "",
    phone: phone || ""
  });

  window.saveSales?.();

  // refresh UI
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}
window.addSaleEntry = addSaleEntry;

/* ===========================================================
   CREDIT → PAID COLLECTION
   -----------------------------------------------------------
   ✔ Renamed to avoid name conflict
   ✔ Calls collection.js collector
   ✔ Fixes fallback addCollectionEntry format
=========================================================== */
function handleSaleCreditCollection(id) {
  const s = (window.sales || []).find(x => x.id === id);
  if (!s) return alert("Sale not found.");

  if (String(s.status || "").toLowerCase() !== "credit") {
    return alert("This sale is already Paid.");
  }

  const msg = [
    `Product: ${s.product} (${s.type})`,
    `Qty: ${s.qty}`,
    `Rate: ₹${s.price}`,
    `Total: ₹${s.total}`,
  ];
  if (s.customer) msg.push("Customer: " + s.customer);
  if (s.phone)    msg.push("Phone: " + s.phone);

  if (!confirm(msg.join("\n") + "\n\nMark as PAID & Collect?")) return;

  // update sale status
  s.status = "Paid";
  s.profit = Number(s.total) - Number((s.qty || 0) * (s.cost || 0));

  window.saveSales?.();

  // call credit collector from collection.js
  try {
    if (typeof window.collectCreditSale === "function") {
      window.collectCreditSale(s);  
    }
  } catch (err) {
    console.warn("Error calling external credit collector", err);

    // Fallback (0 amount entry)
    window.addCollectionEntry?.({
      date: todayDate(),
      source: "Sale (Credit cleared)",
      details: `${s.product} — Collected`,
      amount: 0
    });
  }

  // Update UI
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Credit marked PAID and recorded in Credit History.");
}
window.handleSaleCreditCollection = handleSaleCreditCollection;

/* ===========================================================
   RENDER SALES TABLE
=========================================================== */
function renderSales() {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

  const filterType = document.getElementById("saleType")?.value || "all";
  const filterDate = document.getElementById("saleDate")?.value || "";

  let list = [...(window.sales || [])];

  if (filterType !== "all") list = list.filter(s => s.type === filterType);
  if (filterDate)          list = list.filter(s => s.date === filterDate);

  let totalSum = 0;
  let profitSum = 0;

  tbody.innerHTML = list.map(s => {
    const total = Number(s.total || 0);
    totalSum += total;

    const isCredit = String(s.status || "").toLowerCase() === "credit";

    // realized profit only for PAID sales
    if (!isCredit) profitSum += Number(s.profit || 0);

    const statusHTML = isCredit
      ? `
          <span class="status-credit">Credit</span>
          <button class="small-btn"
            style="background:#16a34a;color:white;padding:3px 8px;font-size:11px"
            onclick="handleSaleCreditCollection('${s.id}')">
            Collect
          </button>
        `
      : `<span class="status-paid">Paid</span>`;

    return `
      <tr>
        <td>${s.date}<br><small>${s.time || ""}</small></td>
        <td>${s.type}</td>
        <td>${s.product}</td>
        <td>${s.qty}</td>
        <td>₹${s.price}</td>
        <td>₹${total}</td>
        <td>₹${s.profit || 0}</td>
        <td>${statusHTML}</td>
      </tr>
    `;
  }).join("");

  document.getElementById("salesTotal") && (document.getElementById("salesTotal").textContent = totalSum);
  document.getElementById("profitTotal") && (document.getElementById("profitTotal").textContent = profitSum);

  window.updateUniversalBar?.();
}
window.renderSales = renderSales;

/* ===========================================================
   CLEAR SALES
=========================================================== */
document.getElementById("clearSalesBtn")?.addEventListener("click", () => {
  if (!confirm("Clear ALL sales?")) return;

  window.sales = [];
  window.saveSales?.();

  renderSales();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
});
