console.log("stock.js loaded");

window.renderStock = function () {
  const box = document.getElementById("stockContainer");
  let stock = JSON.parse(localStorage.getItem("stock-data") || "[]");

  box.innerHTML = `
    <h3>Stock Items</h3>
    <ul>${stock.map(s => `<li>${s.name} — Qty: ${s.qty}</li>`).join("")}</ul>

    <input id="itemName" placeholder="Item">
    <input id="itemQty" type="number" placeholder="Qty">
    <button onclick="addStock()">Add</button>
  `;
};

window.addStock = function () {
  let stock = JSON.parse(localStorage.getItem("stock-data") || "[]");

  const name = itemName.value.trim();
  const qty = Number(itemQty.value);

  if (!name || qty < 1) return alert("Enter valid item");

  stock.push({ name, qty, sold: 0 });

  localStorage.setItem("stock-data", JSON.stringify(stock));
  cloudSave("stock", stock);

  renderStock();
};

window.moduleInit = id => {
  if (id === "stock") renderStock();
};
