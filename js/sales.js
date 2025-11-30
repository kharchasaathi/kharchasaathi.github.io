/* ===========================================================
   sales.js — REALTIME ONLINE VERSION (v14.0 FINAL)
   ✔ Credit profit excluded until collection
   ✔ Full sync with collection.js
   ✔ UniversalBar, Dashboard, PieChart instant refresh
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
   ⭐ CREDIT profit NOT added here
=========================================================== */
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {

  qty = Number(qty);
  price = Number(price);

  if (!type || !product || qty <= 0 || price <= 0) return;

  const p = (window.stock || []).find(
    x => x.type === type && x.name === product
  );

  if (!p) { alert("Product not found in stock."); return; }

  const remain = Number(p.qty) - Number(p.sold);
  if (remain < qty) { alert("Not enough stock!"); return; }

  const cost  = Number(p.cost);
  const total = qty * price;
  const profit = total - qty * cost;

  /* -------------------------
      STOCK UPDATE
  ------------------------- */
  p.sold = Number(p.sold) + qty;
  window.saveStock?.();

  /* -------------------------
      ADD SALE ENTRY
      ⭐ Profit only counts when PAID
  ------------------------- */
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
    status: status || "Paid",  // Paid / Credit
    customer: customer || "",
    phone: phone || ""
  });

  window.saveSales?.();

  /* FULL UI REFRESH */
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}

/* ===========================================================
   CREDIT → PAID
   ⭐ Profit is added ONLY here.
   ⭐ Pending must become 0 immediately.
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
    `Rate: ₹${s.price}`,
    `Total: ₹${s.total}`,
  ];

  if (s.customer) msg.push("Customer: " + s.customer);
  if (s.phone) msg.push("Phone: " + s.phone);

  if (!confirm(msg.join("\n") + "\n\nMark as PAID & Collect?")) return;

  /* ---------------------------------
     UPDATE STATUS
  --------------------------------- */
  s.status = "Paid";

  /* ---------------------------------
     Profit is valid ONLY after collection
  --------------------------------- */
  s.profit = Number(s.total) - Number(s.qty * s.cost);

  window.saveSales?.();

  /* ---------------------------------
     Add collection history entry
     👉 Amount = ZERO
     👉 Details include (Collected ₹xxx)
  --------------------------------- */
  const collected = s.total;

  const details =
    `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
    ` (Collected ₹${collected})` +
    (s.customer ? ` — ${s.customer}` : "") +
    (s.phone ? ` — ${s.phone}` : "");

  window.addCollectionEntry("Sale (Credit cleared)", details, 0);

  /* FULL REALTIME REFRESH */
  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Credit Collected Successfully!");
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

      /* ⭐ Profit only from PAID sales */
      if ((s.status || "").toLowerCase() === "paid")
        profitSum += Number(s.profit || 0);

      const statusHTML =
        (s.status || "").toLowerCase() === "credit"
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
