/* ===========================================================
   sales.js — LEDGER INTEGRATED v32 (PROFESSIONAL STABLE)

   ✔ FIFO Compatible
   ✔ Ledger Connected
   ✔ Cash Filter Restored
   ✔ Credit Pending / Paid Safe
   ✔ Inline Collect Button
   ✔ Payment Mode Visible
   ✔ Clear Disabled (Owner Safety)
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
   SAVE SALES — CLOUD ONLY
----------------------------------------------------------- */
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
   FIFO DEDUCT ENGINE
=========================================================== */
function deductStockFIFO(type, product, qty) {

  qty = Number(qty);

  const batches = (window.stock || [])
    .filter(p => p.type === type && p.name === product)
    .sort((a,b)=>
      Number((a.batch||"B0").replace("B","")) -
      Number((b.batch||"B0").replace("B",""))
    );

  if (!batches.length)
    return { error: "Product not found in stock." };

  const totalRemain = batches.reduce(
    (sum,p)=>sum+(Number(p.qty)-Number(p.sold)),0
  );

  if (totalRemain < qty)
    return { error: "Not enough stock!" };

  let remainingQty = qty;
  let totalCostUsed = 0;

  for (let p of batches) {

    const available =
      Number(p.qty) - Number(p.sold);

    if (available <= 0) continue;

    const deduct =
      Math.min(available, remainingQty);

    p.sold += deduct;
    totalCostUsed += deduct * Number(p.cost);

    remainingQty -= deduct;

    if (remainingQty <= 0) break;
  }

  window.saveStock?.();

  if (typeof checkProductWanting === "function") {
    const sample = batches[0];
    checkProductWanting(sample.productId);
  }

  return { costUsed: totalCostUsed };
}



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
  paymentMode,
  creditMode,
  customer,
  phone
}) {

  qty    = Number(qty);
  price  = Number(price);
  status = (status || "Paid").toLowerCase();

  if (!type || !product || qty <= 0 || price <= 0)
    return;

  const deductResult =
    deductStockFIFO(type, product, qty);

  if (deductResult?.error)
    return alert(deductResult.error);

  const total = qty * price;
  const isPaid = status === "paid";

  const profitValue =
    isPaid
      ? (total - Number(deductResult.costUsed))
      : 0;

  const saleObj = {
    id: uid("sale"),
    date: date || todayDate(),
    time: getCurrentTime12hr(),
    type,
    product,
    qty,
    price,
    total,
    profit: profitValue,
    cost: deductResult.costUsed,
    status: isPaid ? "Paid" : "Credit",
    fromCredit: !isPaid,
    paymentMode: isPaid ? (paymentMode || "Cash") : null,
    creditMode: !isPaid ? (creditMode || "Cash") : null,
    customer: customer || "",
    phone: phone || "",
    collectionLogged: false
  };

  window.sales = window.sales || [];
  window.sales.push(saleObj);
  window.saveSales();


  /* 🔥 LEDGER UPDATE (PAID ONLY) */
  if (isPaid && typeof updateLedgerField === "function") {

    const profit = Number(profitValue);
    const investmentReturn = Number(deductResult.costUsed);

    if (profit > 0)
      updateLedgerField("salesProfit", profit);

    if (investmentReturn > 0)
      updateLedgerField("salesInvestmentReturn", investmentReturn);
  }


  /* AUTO COLLECTION (PAID ONLY) */
  if (isPaid) {

    const details =
      `${product} — Qty ${qty} × ₹${price} = ₹${total}` +
      ` (${saleObj.paymentMode})` +
      (customer ? ` — ${customer}` : "");

    window.addCollectionEntry?.(
      "Sale Collection",
      details,
      total,
      saleObj.paymentMode
    );

    saleObj.collectionLogged = true;
  }

  renderSales?.();
  renderCollection?.();
}
window.addSaleEntry = addSaleEntry;



/* ===========================================================
   CREDIT COLLECTION
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

  if (!confirm(`Collect ₹${s.total} via ${mode}?`))
    return;

  s.status = "Paid";
  s.fromCredit = true;
  s.paymentMode = mode;
  s.profit = Number(s.total) - Number(s.cost);

  window.saveSales();

  /* 🔥 LEDGER UPDATE */
  if (typeof updateLedgerField === "function") {

    if (s.profit > 0)
      updateLedgerField("salesProfit", s.profit);

    if (s.cost > 0)
      updateLedgerField("salesInvestmentReturn", s.cost);
  }

  if (!s.collectionLogged) {

    const details =
      `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
      ` (Credit Cleared — ${mode})`;

    window.addCollectionEntry?.(
      "Sale Credit Cleared",
      details,
      s.total,
      mode
    );

    s.collectionLogged = true;
  }

  renderSales?.();
  renderCollection?.();

  alert("Credit Collected Successfully!");
}
window.collectCreditSale = collectCreditSale;



/* ===========================================================
   PROFESSIONAL RENDER SALES
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

  /* FILTER TYPE */
  if (filterType !== "all")
    list = list.filter(s => s.type === filterType);

  /* FILTER DATE */
  if (filterDate)
    list = list.filter(s => s.date === filterDate);

  /* VIEW FILTER */
  if (view === "cash")
    list = list.filter(s =>
      s.status === "Paid" && !s.fromCredit
    );

  if (view === "credit-pending")
    list = list.filter(s =>
      s.status === "Credit"
    );

  if (view === "credit-paid")
    list = list.filter(s =>
      s.status === "Paid" && s.fromCredit
    );

  let totalSum  = 0;
  let profitSum = 0;

  tbody.innerHTML = list.map(s => {

    totalSum += Number(s.total || 0);

    if (s.status === "Paid")
      profitSum += Number(s.profit || 0);

    const mode =
      s.status === "Paid"
        ? (s.paymentMode || "")
        : (s.creditMode || "");

    const statusHTML =
      s.status === "Credit"
        ? `<span class="status-credit">
             Credit (${mode})
           </span>
           <button class="small-btn"
             style="background:#16a34a;color:white;padding:3px 8px;font-size:11px"
             onclick="collectCreditSale('${s.id}')">
             Collect
           </button>`
        : `<span class="status-paid">
             Paid (${mode})
           </span>`;

    return `
      <tr>
        <td>${s.date}<br><small>${s.time||""}</small></td>
        <td>${s.type}</td>
        <td>${s.product}</td>
        <td>${s.qty}</td>
        <td>₹${s.price}</td>
        <td>₹${s.total}</td>
        <td>₹${s.profit}</td>
        <td>${statusHTML}</td>
      </tr>`;
  }).join("");

  document.getElementById("salesTotal").textContent = totalSum;
  document.getElementById("profitTotal").textContent = profitSum;
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
   CLEAR SALES DISABLED
=========================================================== */
document.getElementById("clearSalesBtn")
  ?.addEventListener("click", () => {
    alert("⚠️ Sales deletion disabled. Ledger controlled system.");
  });
