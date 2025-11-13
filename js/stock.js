console.log("stock.js module loaded");

window.renderStock = function () {
  const container = document.getElementById("stockContainer");

  let stock = JSON.parse(localStorage.getItem("stock-data") || "[]");

  container.innerHTML = `
    <h3>Stock Items</h3>
    <ul>${stock.map(s => `<li>${s.name} — Qty: ${s.qty}</li>`).join("")}</ul>

    <input id="itemName" placeholder="Item name" />
    <input id="itemQty" type="number" placeholder="Qty" />
    <button onclick="addStockItem()">Add Item</button>
  `;
};

window.addStockItem = function () {
  let stock = JSON.parse(localStorage.getItem("stock-data") || "[]");

  const name = document.getElementById("itemName").value;
  const qty = Number(document.getElementById("itemQty").value);

  if (name.trim() !== "" && qty > 0) {
    stock.push({ name, qty, sold: 0 });
    localStorage.setItem("stock-data", JSON.stringify(stock));
    cloudSave("stock", stock);
    renderStock();
  }
};
