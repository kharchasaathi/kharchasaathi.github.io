console.log("sales.js loaded");

window.renderSales = function () {
  const box = document.getElementById("salesContainer");
  let sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  box.innerHTML = `
    <h3>Sales</h3>
    <ul>${sales.map(s => `<li>${s.item} — ₹${s.amount}</li>`).join("")}</ul>

    <input id="saleItem" placeholder="Item">
    <input id="saleAmount" type="number" placeholder="Amount">
    <button onclick="addSale()">Add</button>
  `;
};

window.addSale = function () {
  let sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  const item = saleItem.value.trim();
  const amount = Number(saleAmount.value);

  if (!item || amount < 1) return alert("Enter valid sale");

  sales.push({ item, amount, date: new Date().toISOString().split("T")[0] });

  localStorage.setItem("sales-data", JSON.stringify(sales));
  cloudSave("sales", sales);

  renderSales();
};

window.moduleInit = id => {
  if (id === "sales") renderSales();
};
