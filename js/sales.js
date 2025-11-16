function addSale() {
  const date = qs('#saleDate')?.value || todayDate();
  const typeProd = qs('#saleProduct')?.value;
  const qty = parseInt(qs('#saleQty')?.value || 0);
  const price = parseFloat(qs('#salePrice')?.value || 0);
  const status = qs('#saleStatus')?.value || "Paid";

  if (!typeProd) return alert("Select product");
  if (!qty || qty <= 0) return alert("Invalid Qty");
  if (!price || price <= 0) return alert("Invalid Price");

  const [type, name] = typeProd.split("|||");

  /* Remaining stock */
  const p = findProduct(type, name);
  const remain = p ? (p.qty - (p.sold || 0)) : 0;

  if (qty > remain) {
    if (!confirm(`Only ${remain} in stock. Continue anyway?`)) return;
  }

  /* Ask customer if Credit */
  let customer = "";
  if (status === "Credit") {
    customer = prompt("Customer name for credit sale:") || "Customer";
  }

  /* Cost + Profit */
  const cost = getProductCost(type, name);
  const profit = Math.round((price - cost) * qty);

  /* Update Stock */
  if (p) {
    p.sold = (p.sold || 0) + qty;
    saveStock();
  }

  /* Add Sale */
  const entry = {
    date,
    type,
    product: name,
    qty,
    price,
    amount: price * qty,
    profit,
    status,
    customer   // NEW Field
  };

  window.sales.push(entry);
  saveSales();

  renderSales();
  renderStock();
  updateSummaryCards && updateSummaryCards();
  renderAnalytics && renderAnalytics();

  qs('#saleQty').value = "";
  qs('#salePrice').value = "";
}
