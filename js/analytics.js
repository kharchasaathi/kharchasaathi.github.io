console.log("analytics.js module loaded");

window.renderAnalytics = function () {
  const container = document.getElementById("analyticsContainer");

  let sales = JSON.parse(localStorage.getItem("sales-data") || "[]");

  if (sales.length === 0) {
    container.innerHTML = `<p>No sales data available yet 📉</p>`;
    return;
  }

  const total = sales.reduce((a, b) => a + Number(b.amount), 0);

  container.innerHTML = `
    <h3>Smart Sales Dashboard</h3>
    <p>Total Revenue: ₹${total}</p>
  `;
};
