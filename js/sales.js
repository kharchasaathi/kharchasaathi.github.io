/* ===========================================================
   sales.js — COMMERCIAL REBUILD v28 (PART 1)

   ✔ Pure commercial behavior
   ✔ Paid → Auto collection entry
   ✔ Credit → Collection only when cleared
   ✔ Duplicate collection guard
   ✔ Auto wanting restored
   ✔ Universal safe
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
   ADD SALE ENTRY — COMMERCIAL + WANTING SAFE
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
  const isPaid = status === "paid";


  /* =======================================================
     📦 STOCK REDUCE
  ======================================================= */
  p.sold = Number(p.sold) + qty;


  /* =======================================================
     🔁 AUTO WANTING (RESTORED)
  ======================================================= */
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


  /* =======================================================
     💰 PROFIT
  ======================================================= */
  const profitValue =
    isPaid ? (total - qty * cost) : 0;


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
    cost,
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


  /* =======================================================
     💵 AUTO COLLECTION (PAID ONLY)
  ======================================================= */
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


  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();
}
window.addSaleEntry = addSaleEntry;



/* ===========================================================
   CREDIT → PAID COLLECTION (SAFE)
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


  /* COLLECTION LOG (NO DUPLICATE) */
  if (!s.collectionLogged) {

    const details =
      `${s.product} — Qty ${s.qty} × ₹${s.price} = ₹${s.total}` +
      ` (Credit Cleared — ${mode})` +
      (s.customer ? ` — ${s.customer}` : "");

    window.addCollectionEntry?.(
      "Sale Credit Cleared",
      details,
      s.total,
      mode
    );

    s.collectionLogged = true;
  }


  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Credit Collected Successfully!");
}
window.collectCreditSale = collectCreditSale;
/* ===========================================================
   RENDER SALES TABLE — COMMERCIAL SAFE
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


  /* ---------------- FILTERS ---------------- */

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


  /* ---------------- TOTALS ---------------- */

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
      ? `<span class="status-credit">
           Credit (${modeDisplay})
         </span>
         <button class="small-btn"
           style="
             background:#16a34a;
             color:white;
             padding:3px 8px;
             font-size:11px"
           onclick="collectCreditSale('${s.id}')">
           Collect
         </button>`
      : `<span class="status-paid">
           Paid (${modeDisplay})
         </span>`;


    return `
      <tr>
        <td>
          ${s.date}<br>
          <small>${s.time || ""}</small>
        </td>
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
   FILTER EVENTS — SAFE REFRESH
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
   CLEAR SALES — LEDGER SAFE DELETE
=========================================================== */

document.getElementById("clearSalesBtn")
?.addEventListener("click", () => {

  const view =
    document.getElementById("saleView")?.value || "all";

  const salesList = window.sales || [];


  /* 🔒 CREDIT GUARD */

  const hasPendingCredit =
    salesList.some(s =>
      String(s.status).toLowerCase() === "credit"
    );

  if (hasPendingCredit &&
     view !== "credit-pending")
  {
    return alert(
      "❌ Cannot clear while Pending Credit exists!"
    );
  }


  if (!confirm(
    "Clear ALL records in this filtered view?"
  )) return;



  /* ======================================================
     🧠 LEDGER SAFE FILTER DELETE
  ====================================================== */

  const removedSales = [];


  window.sales = salesList.filter(s => {

    const st =
      String(s.status).toLowerCase();

    const fc =
      Boolean(s.fromCredit);


    /* ---------- CASH PAID ---------- */
    if (view === "cash") {

      if (st === "paid" && !fc) {
        removedSales.push(s);
        return false;
      }
      return true;
    }


    /* ---------- CREDIT CLEARED ---------- */
    if (view === "credit-paid") {

      if (st === "paid" && fc) {
        removedSales.push(s);
        return false;
      }
      return true;
    }


    /* ---------- CREDIT PENDING ---------- */
    if (view === "credit-pending") {

      if (st === "credit") {
        removedSales.push(s);
        return false;
      }
      return true;
    }


    /* ---------- ALL ---------- */
    if (view === "all") {
      removedSales.push(s);
      return false;
    }

    return true;
  });



  /* ======================================================
     🔄 COLLECTION ADJUST TRIGGER
  ====================================================== */

  if (removedSales.length > 0) {

    window.dispatchEvent(
      new CustomEvent(
        "sales-deleted",
        { detail: removedSales }
      )
    );
  }



  /* ======================================================
     SAVE + REFRESH
  ====================================================== */

  window.saveSales();

  renderSales();
  renderCollection?.();
  window.renderAnalytics?.();
  window.updateSummaryCards?.();
  window.updateUniversalBar?.();

  alert("Sales records cleared safely.");
});
