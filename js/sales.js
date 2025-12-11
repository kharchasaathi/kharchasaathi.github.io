/* ===========================================================
   sales.js — ONLINE MODE (Option-B Cloud Master) — FINAL v20
   ✔ Cloud is the master database
   ✔ LocalStorage = only temporary UI cache
   ✔ All save operations go through cloudSync() via saveSales()
=========================================================== */

/* -----------------------------------------------------------
   HELPER — Time in 12hr format
----------------------------------------------------------- */
function getCurrentTime12hr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* -----------------------------------------------------------
   REFRESH TYPE SELECTOR (from window.types)
----------------------------------------------------------- */
function refreshSaleTypeSelector() {
  const sel = document.getElementById("saleType");
  if (!sel) return;

  sel.innerHTML = `<option value="all">All Types</option>`;

  (window.types || []).forEach(t => {
    sel.innerHTML += `<option value="${t.name}">${t.name}</option>`;
  });
}

/* ===========================================================
   SAVE SALES (Cloud Master + Local UI Cache)
=========================================================== */
window.saveSales = function () {

  // 1️⃣ TEMPORARY LOCAL CACHE (for immediate UI refresh)
  try {
    localStorage.setItem("sales-data", JSON.stringify(window.sales));
  } catch {}

  // 2️⃣ CLOUD MASTER SAVE
  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("sales", window.sales);
  }

  // 3️⃣ GLOBAL CLOUD RESYNC (ALL DEVICES)
  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => cloudPullAllIfAvailable(), 200);
  }
};

/* ===========================================================
   ADD SALE ENTRY (ONLINE MODE)
=========================================================== */
function addSaleEntry({ date, type, product, qty, price, status, customer, phone }) {

  qty    = Number(qty);
  price  = Number(price);
  status = status || "Paid";

  if (!type || !product || qty <= 0 || price <= 0) return;

  const p = (window.stock || []).find(x => x.type === type && x.name === product);
  if (!p) return alert("Product not found in stock.");

  const remain = Number(p.qty) - Number(p.sold);
  if (remain < qty) return alert("Not enough stock!");

  const cost   = Number(p.cost);
  const total  = qty * price;
  let   profit = 0;

  if (status.toLowerCase() === "paid") {
    profit = total - qty * cost;
  }

  /* ---------- UPDATE STOCK ---------- */
  p.sold = Number(p.sold) + qty;
  window.saveStock?.();

  /* ---------- RECORD SALE ---------- */
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

  window.saveSales();

  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}

/* ===========================================================
   CREDIT → PAID (COLLECT)
=========================================================== */
function collectCreditSale(id) {
  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if ((s.status || "").toLowerCase() !== "credit") {
    return alert("Already Paid.");
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

  window.saveSales();

  /* Add Collection Log */
  const collected = s.total;

  const details =
    `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
    ` (Credit Cleared)` +
    (s.customer ? ` — ${s.customer}` : "") +
    (s.phone    ? ` — ${s.phone}`    : "");

  window.addCollectionEntry("Sale (Credit cleared)", details, collected);

  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();

  setTimeout(() => window.updateUniversalBar?.(), 50);

  alert("Credit Collected Successfully!");
}
window.collectCreditSale = collectCreditSale;

/* ===========================================================
   RENDER SALES TABLE (Full Filter Logic)
=========================================================== */
function renderSales() {
  const tbody = document.querySelector("#salesTable tbody");
  if (!tbody) return;

  const filterType = document.getElementById("saleType")?.value || "all";
  const filterDate = document.getElementById("saleDate")?.value || "";
  const view       = document.getElementById("saleView")?.value || "all";

  let list = [...(window.sales || [])];

  /* TYPE */
  if (filterType !== "all") list = list.filter(s => s.type === filterType);

  /* DATE */
  if (filterDate) list = list.filter(s => s.date === filterDate);

  /* VIEW (always applies) */
  if (view !== "all") {
    list = list.filter(s => {
      const status = String(s.status || "").toLowerCase();
      const fromCredit = Boolean(s.fromCredit);

      if (view === "cash")           return status === "paid" && !fromCredit;
      if (view === "credit-pending") return status === "credit";
      if (view === "credit-paid")    return status === "paid" && fromCredit;

      return true;
    });
  }

  let totalSum = 0;
  let profitSum = 0;

  tbody.innerHTML = list.map(s => {
    const t = Number(s.total || 0);
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
        </button>`
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
  }).join("");

  document.getElementById("salesTotal").textContent  = totalSum;
  document.getElementById("profitTotal").textContent = profitSum;

  /* Clear button show/hide */
  const btn = document.getElementById("clearSalesBtn");
  if (btn) {
    btn.style.display = (view === "cash" || view === "credit-paid") ? "" : "none";
  }

  window.updateUniversalBar?.();
}
window.renderSales = renderSales;

/* ===========================================================
   FILTER EVENTS
=========================================================== */
document.getElementById("saleType")?.addEventListener("change", renderSales);
document.getElementById("saleDate")?.addEventListener("change", renderSales);
document.getElementById("saleView")?.addEventListener("change", renderSales);
document.getElementById("filterSalesBtn")?.addEventListener("click", renderSales);

/* ===========================================================
   CLEAR SALES (Only cash or credit-paid)
=========================================================== */
document.getElementById("clearSalesBtn")?.addEventListener("click", () => {
  const view = document.getElementById("saleView")?.value || "all";

  if (!(view === "cash" || view === "credit-paid"))
    return alert("❌ Cannot clear Credit Pending data!");

  if (!confirm("Clear ALL records in this view?")) return;

  window.sales = window.sales.filter(s => {
    const status = String(s.status || "").toLowerCase();
    const fromCredit = Boolean(s.fromCredit);

    if (view === "cash") return !(status === "paid" && !fromCredit);
    if (view === "credit-paid") return !(status === "paid" && fromCredit);

    return true;
  });

  window.saveSales();

  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  setTimeout(() => window.updateUniversalBar?.(), 50);
});
