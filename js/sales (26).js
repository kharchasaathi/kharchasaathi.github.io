/* ===========================================================
   sales.js — BUSINESS VERSION (v17)
=========================================================== */

function getCurrentTime12hr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

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
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {

  qty    = Number(qty);
  price  = Number(price);
  status = status || "Paid";

  if (!type || !product || qty <= 0 || price <= 0) return;

  const p = (window.stock || []).find(x => x.type === type && x.name === product);
  if (!p) {
    alert("Product not found in stock.");
    return;
  }

  const remain = Number(p.qty) - Number(p.sold);
  if (remain < qty) {
    alert("Not enough stock!");
    return;
  }

  const cost   = Number(p.cost);
  const total  = qty * price;
  let   profit = 0;

  if (status.toLowerCase() === "paid") {
    profit = total - qty * cost;
  }

  /* STOCK UPDATE */
  p.sold = Number(p.sold) + qty;
  window.saveStock?.();

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
    status,
    customer: customer || "",
    phone:    phone    || "",
    fromCredit: false
  });

  window.saveSales?.();

  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}

/* ===========================================================
   CREDIT → PAID
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
    s.customer ? `Customer: ${s.customer}` : "",
    s.phone    ? `Phone: ${s.phone}`       : ""
  ].filter(Boolean);

  if (!confirm(msg.join("\n") + "\n\nMark as PAID & Collect?")) return;

  s.status = "Paid";
  s.fromCredit = true;

  s.profit = Number(s.total) - Number(s.qty * s.cost);
  window.saveSales?.();

  const collected = s.total;

  const details =
    `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
    ` (Credit Cleared)` +
    (s.customer ? ` — ${s.customer}` : "") +
    (s.phone    ? ` — ${s.phone}`    : "");

  window.addCollectionEntry("Sale (Credit cleared)", details, collected);

  renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();

  /* ⭐ delayed universal refresh gives correct net always */
  setTimeout(() => window.updateUniversalBar?.(), 50);

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
  const view       = document.getElementById("saleView")?.value || "all";

  let list = [...(window.sales || [])];

  if (filterType !== "all") list = list.filter(s => s.type === filterType);

  if (filterDate) list = list.filter(s => s.date === filterDate);

  list = list.filter(s => {
    const status = String(s.status || "").toLowerCase();
    const fromCredit = Boolean(s.fromCredit);

    if (view === "cash")       return status === "paid" && !fromCredit;
    if (view === "credit-pending") return status === "credit";
    if (view === "credit-paid")    return status === "paid" && fromCredit;
    return true;
  });

  let totalSum  = 0;
  let profitSum = 0;

  tbody.innerHTML = list
    .map(s => {
      const t = Number(s.total);
      totalSum += t;

      if ((s.status || "").toLowerCase() === "paid") {
        profitSum += Number(s.profit || 0);
      }

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

  document.getElementById("salesTotal").textContent  = totalSum;
  document.getElementById("profitTotal").textContent = profitSum;

  const btn = document.getElementById("clearSalesBtn");
  if (btn) {
    if (view === "cash" || view === "credit-paid") btn.style.display = "";
    else btn.style.display = "none";
  }

  window.updateUniversalBar?.();
}
window.renderSales = renderSales;

/* ===========================================================
   FILTER EVENTS
=========================================================== */
document.getElementById("filterSalesBtn")?.addEventListener("click", () => {
  renderSales();
});
document.getElementById("saleView")?.addEventListener("change", () => {
  renderSales();
});

/* ===========================================================
   CLEAR SALES
=========================================================== */
document.getElementById("clearSalesBtn")?.addEventListener("click", () => {
  const view = document.getElementById("saleView")?.value || "all";

  if (!(view === "cash" || view === "credit-paid")) {
    alert("❌ Cannot clear Credit Pending data!");
    return;
  }

  if (!confirm("Clear ALL records in this view?")) return;

  window.sales = window.sales.filter(s => {
    const status = s.status.toLowerCase();
    const fromCredit = Boolean(s.fromCredit);

    if (view === "cash")       return !(status === "paid" && !fromCredit);
    if (view === "credit-paid") return !(status === "paid" && fromCredit);

    return true;
  });

  window.saveSales?.();

  renderSales();
  renderPendingCollections?.();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  setTimeout(() => window.updateUniversalBar?.(), 50);
});
