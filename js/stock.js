/* ... పై భాగం (imports, helpers, calc functions) అదే ఉంచు ... */

/* -------------------------------------------------------
   QUICK SALE / CREDIT  (adds time + credit customer info)
------------------------------------------------------- */
function stockQuickSale(i, mode) {
  const p = (window.stock || [])[i];
  if (!p) return;

  const remain = Number(p.qty || 0) - Number(p.sold || 0);
  if (remain <= 0) {
    alert("No stock left!");
    return;
  }

  const qty = Number(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = Number(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  // 🔵 For Credit sales, capture customer details
  let customer = "";
  let phone    = "";

  if (mode === "Credit") {
    customer = prompt("Customer name (Credit sale):", "") || "";
    phone    = prompt("Phone number:", "") || "";
  }

  const cost  = Number(p.cost || 0);
  const total = qty * price;
  const profit = total - (qty * cost);

  p.sold = (p.sold || 0) + qty;

  const timeNow = getCurrentTime12hr();

  window.sales = window.sales || [];
  window.sales.push({
    id: window.uid ? uid("sale") : Date.now().toString(),
    date: todayDate(),
    time: timeNow,
    type: p.type,
    product: p.name,
    qty,
    price,
    total,
    amount: total,
    cost,
    profit,
    status: mode,
    // ✅ extra info for credit tracking
    customer,
    phone
  });

  window.saveStock  && window.saveStock();
  window.saveSales  && window.saveSales();

  if (p.sold >= p.qty && typeof window.autoAddWanting === "function") {
    window.autoAddWanting(p.type, p.name, "Finished");
  }

  renderStock();
  window.renderSales?.();
  window.updateSummaryCards?.();
  window.renderAnalytics?.();
  window.updateTabSummaryBar?.();
  window.updateUniversalBar?.();
}
