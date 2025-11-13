console.log("analytics.js loaded");

window.renderAnalytics = function () {
  const box = document.getElementById("analyticsContainer");
  let sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  if (sales.length === 0) {
    box.innerHTML = "<p>No sales data yet</p>";
    return;
  }

  const total = sales.reduce((a,b)=>a + Number(b.amount), 0);

  box.innerHTML = `
    <h3>Smart Dashboard</h3>
    <p>Total Revenue: ₹${total}</p>
  `;
};

window.moduleInit = id => {
  if (id === "analytics") renderAnalytics();
};
