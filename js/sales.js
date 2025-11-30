/* ===========================================================
   sales.js — REALTIME ONLINE VERSION (v13.0)
   ✔ Instant Cloud Sync
   ✔ Pending Credit → Collection Auto Refresh
   ✔ UniversalBar, Dashboard live update
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
   ADD SALE ENTRY (Real-time Cloud + UI Update)
=========================================================== */
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {

  qty = Number(qty);
  price = Number(price);

  if (!type || !product || qty <= 0 || price <= 0) return;

  // Find stock product
  const p = (window.stock || []).find(
    x => x.type === type && x.name === product
  );

  if (!p) { alert("Product not found in stock."); return; }

  const remain = Number(p.qty) - Number(p.sold);
  if (remain < qty) { alert("Not enough stock!"); return; }

  const cost = Number(p.cost);
  const total = qty * price;
  const profit = total - qty * cost;

  // Update sold qty
  p.sold = Number(p.sold) + qty;
  window.saveStock?.();

  // Add sale
  window.sales.push({
    id: uid("sale"),
    date: date || todayDate(),
    time: getCurrentTime12hr(),
    type,
    product,
    qty,
    price,
    total,
    profit,
    cost,
    status: status || "Paid",
    customer: customer || "",
    phone: phone || ""
  });

  /* 🔥 CLOUD + LOCAL SAVE */
  window.saveSales?.();

  /* 🔥 INSTANT UI REFRESH */
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}

/* ===========================================================
   CREDIT → PAID (Instant Update Everywhere)
=========================================================== */
function collectCreditSale(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if ((s.status || "").toLowerCase() !== "credit") {
    alert("Already Paid.");
    return;
  }

  const msg = [
    `Product: ${s.product} (${s.type})`,
    `Qty: ${s.qty}`,
    `Total: ₹${s.total}`,
  ];

  if (s.customer) msg.push("Customer: " + s.customer);
  if (s.phone) msg.push("Phone: " + s.phone);

  if (!confirm(msg.join("\n") + "\n\nMark as PAID?")) return;

  s.status = "Paid";

  /* 🔥 CLOUD SAVE FIRST */
  window.saveSales?.();

  /* 🔥 UI updates (NO REFRESH NEEDED) */
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Marked as PAID.");
}

window.collectCreditSale = collectCreditSale;

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
  if (filterDate) list = list.filter(s => s.date === filterDate);

  let totalSum = 0;
  let profitSum = 0;

  tbody.innerHTML = list
    .map(s => {
      const t = Number(s.total);
      totalSum += t;

      if ((s.status || "").toLowerCase() !== "credit")
        profitSum += Number(s.profit || 0);

      const isCredit = (s.status || "").toLowerCase() === "credit";

      const statusHTML = isCredit
        ? `
          <span class="status-credit">Credit</span>
          <button class="small-btn"
            style="background:#16a34a;color:white;padding:3px 8px;font-size:11px"
            onclick="collectCreditSale('${s.id}')">
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
          <td>₹${t}</td>
          <td>₹${s.profit}</td>
          <td>${statusHTML}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("salesTotal").textContent = totalSum;
  document.getElementById("profitTotal").textContent = profitSum;

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
