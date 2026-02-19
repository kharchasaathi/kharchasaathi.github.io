/* ===========================================================
   sales.js — FINAL v27 (CASH + UPI + CREDIT MODE SAFE)

   ✔ Cloud only
   ✔ Universal sync safe
   ✔ Net collect safe
   ✔ Wanting auto add
   ✔ Credit-safe accounting
   ✔ Cash + UPI supported
   ✔ Credit mode stored
   ✔ Filters restored
   ✔ Smart clear guard
   ✔ Multi-device safe
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
   REFRESH TYPE SELECTOR
----------------------------------------------------------- */
function refreshSaleTypeSelector() {

  const sel = document.getElementById("saleType");
  if (!sel) return;

  sel.innerHTML = `<option value="all">All Types</option>`;

  (window.types || []).forEach(t => {
    sel.innerHTML +=
      `<option value="${t.name}">${t.name}</option>`;
  });
}


/* ===========================================================
   SAVE SALES — CLOUD ONLY
=========================================================== */
window.saveSales = function () {

  if (
    typeof cloudSaveDebounced === "function" &&
    window.__cloudReady
  ) {
    cloudSaveDebounced("sales", window.sales || []);
  }

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
};


/* ===========================================================
   ADD SALE ENTRY
=========================================================== */
function addSaleEntry({
  date,
  type,
  product,
  qty,
  price,
  status,
  paymentMode,   // NEW
  creditMode,    // NEW
  customer,
  phone
}) {

  qty    = Number(qty);
  price  = Number(price);
  status = (status || "Paid").toLowerCase();

  if (!type || !product || qty <= 0 || price <= 0)
    return;

  const p = (window.stock || [])
    .find(x => x.type === type && x.name === product);

  if (!p)
    return alert("Product not found in stock.");

  const remain =
    Number(p.qty) - Number(p.sold);

  if (remain < qty)
    return alert("Not enough stock!");

  const cost  = Number(p.cost);
  const total = qty * price;

  /* ---------- STOCK REDUCE ---------- */
  p.sold = Number(p.sold) + qty;

  /* ---------- AUTO WANTING ---------- */
  const remaining =
    Number(p.qty) - Number(p.sold);

  if (remaining <= 0) {

    window.wanting =
      window.wanting || [];

    const exists =
      window.wanting.find(
        w => w.type === p.type &&
             w.name === p.name
      );

    if (!exists) {

      window.wanting.push({
        id: uid("want"),
        type: p.type,
        name: p.name,
        qty: p.reorderQty || 1,
        date: todayDate()
      });

      window.saveWanting?.();
    }
  }

  window.saveStock?.();

  /* ---------- PROFIT ---------- */
  const isPaid = status === "paid";

  window.sales.push({
    id: uid("sale"),
    date: date || todayDate(),
    time: getCurrentTime12hr(),
    type,
    product,
    qty,
    price,
    total,
    profit: isPaid
      ? (total - qty * cost)
      : 0,
    cost,
    status: isPaid ? "Paid" : "Credit",
    fromCredit: !isPaid,
    paymentMode: isPaid ? (paymentMode || "Cash") : null,
    creditMode: !isPaid ? (creditMode || "Cash") : null,
    customer: customer || "",
    phone: phone || ""
  });

  window.saveSales();

  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}
window.addSaleEntry = addSaleEntry;


/* ===========================================================
   CREDIT → PAID COLLECTION
=========================================================== */
function collectCreditSale(id) {

  const s = window.sales.find(x => x.id === id);
  if (!s) return;

  if (String(s.status).toLowerCase() !== "credit")
    return alert("Already Paid.");

  const payMode =
    prompt("Payment Mode? (Cash / UPI)", "Cash");

  if (!payMode) return;

  const mode =
    payMode.toLowerCase() === "upi"
      ? "UPI"
      : "Cash";

  if (!confirm(
    `Collect ₹${s.total} via ${mode}?`
  )) return;

  /* PROFIT UNLOCK */
  s.status = "Paid";
  s.fromCredit = true;
  s.paymentMode = mode;
  s.profit =
    Number(s.total) -
    Number(s.qty * s.cost);

  window.saveSales();

  /* COLLECTION LOG */
  const details =
    `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
    ` (Credit Cleared — ${mode})` +
    (s.customer ? ` — ${s.customer}` : "");

  window.addCollectionEntry?.(
    "Sale (Credit cleared)",
    details,
    s.total
  );

  renderSales();
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

  const tbody =
    document.querySelector("#salesTable tbody");

  if (!tbody) return;

  const filterType =
    document.getElementById("saleType")?.value || "all";

  const filterDate =
    document.getElementById("saleDate")?.value || "";

  const view =
    document.getElementById("saleView")?.value || "all";

  let list = [...(window.sales || [])];

  if (filterType !== "all")
    list = list.filter(s => s.type === filterType);

  if (filterDate)
    list = list.filter(s => s.date === filterDate);

  if (view !== "all") {

    list = list.filter(s => {

      const st =
        String(s.status).toLowerCase();

      const fc =
        Boolean(s.fromCredit);

      if (view === "cash")
        return st === "paid" && !fc;

      if (view === "credit-pending")
        return st === "credit";

      if (view === "credit-paid")
        return st === "paid" && fc;

      return true;
    });
  }

  let totalSum  = 0;
  let profitSum = 0;

  tbody.innerHTML = list.map(s => {

    totalSum += Number(s.total || 0);

    if (
      String(s.status).toLowerCase()
      === "paid"
    ){
      profitSum += Number(s.profit || 0);
    }

    const modeDisplay =
      s.status === "Paid"
      ? (s.paymentMode || "")
      : (s.creditMode || "");

    const statusHTML =
      String(s.status).toLowerCase()
      === "credit"
      ? `<span class="status-credit">Credit (${modeDisplay})</span>
         <button class="small-btn"
           style="background:#16a34a;color:white;padding:3px 8px;font-size:11px"
           onclick="collectCreditSale('${s.id}')">
           Collect
         </button>`
      : `<span class="status-paid">Paid (${modeDisplay})</span>`;

    return `
      <tr>
        <td>${s.date}<br>
            <small>${s.time || ""}</small></td>
        <td>${s.type}</td>
        <td>${s.product}</td>
        <td>${s.qty}</td>
        <td>₹${s.price}</td>
        <td>₹${s.total}</td>
        <td>₹${s.profit}</td>
        <td>${statusHTML}</td>
      </tr>`;
  }).join("");

  document.getElementById("salesTotal")
    .textContent = totalSum;

  document.getElementById("profitTotal")
    .textContent = profitSum;

  window.updateUniversalBar?.();
}
window.renderSales = renderSales;


/* ===========================================================
   FILTER EVENTS
=========================================================== */
document.getElementById("saleType")
  ?.addEventListener("change", renderSales);

document.getElementById("saleDate")
  ?.addEventListener("change", renderSales);

document.getElementById("saleView")
  ?.addEventListener("change", renderSales);

document.getElementById("filterSalesBtn")
  ?.addEventListener("click", renderSales);


/* ===========================================================
   CLEAR SALES — SMART CREDIT SAFE
=========================================================== */
document.getElementById("clearSalesBtn")
?.addEventListener("click", () => {

  const view =
    document.getElementById("saleView")?.value || "all";

  const hasPendingCredit =
    (window.sales || []).some(s =>
      String(s.status).toLowerCase() === "credit"
    );

  if (hasPendingCredit &&
     view !== "credit-pending")
  {
    return alert(
      "❌ Cannot clear while Credit Pending exists!"
    );
  }

  if (!confirm("Clear ALL records in this view?"))
    return;

  window.sales =
    window.sales.filter(s => {

      const st =
        String(s.status).toLowerCase();

      const fc =
        Boolean(s.fromCredit);

      if (view === "cash")
        return !(st === "paid" && !fc);

      if (view === "credit-paid")
        return !(st === "paid" && fc);

      if (view === "credit-pending")
        return st !== "credit";

      return false;
    });

  window.saveSales();

  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
});
