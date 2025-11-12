// analytics.js — Smart Sales Dashboard with visual charts & insights
(function(){
  console.log("📊 Smart Dashboard module loaded");

  const analyticsEl = document.getElementById("analytics");

  // Create chart container
  analyticsEl.innerHTML = `
    <h3>📊 Smart Sales Dashboard</h3>
    <canvas id="salesChart" style="width:100%;max-width:600px;height:320px;"></canvas>
    <div id="analyticsSummary" style="margin-top:20px;font-size:14px;line-height:1.6;"></div>
  `;

  // Load saved data
  const sales = JSON.parse(localStorage.getItem("sales-data") || "[]");
  const stock = JSON.parse(localStorage.getItem("stock-data") || "[]");

  if (!sales.length) {
    document.getElementById("analyticsSummary").innerHTML =
      "<p style='color:gray;'>No sales data available yet 📉</p>";
    return;
  }

  // Group sales by date
  const grouped = {};
  sales.forEach(s => {
    const d = s.date;
    grouped[d] = (grouped[d] || 0) + Number(s.amount || 0);
  });

  const dates = Object.keys(grouped).sort();
  const values = dates.map(d => grouped[d]);

  // Chart.js loader
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
  script.onload = () => renderChart(dates, values);
  document.body.appendChild(script);

  function renderChart(labels, data){
    const ctx = document.getElementById("salesChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Daily Sales (₹)",
          data,
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          tension: 0.25,
          fill: true,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: {
        plugins:{ legend:{ display:true } },
        scales:{
          y:{ beginAtZero:true, ticks:{ callback:v=>"₹"+v } },
          x:{ ticks:{ autoSkip:true, maxTicksLimit:7 } }
        }
      }
    });

    // Summary analytics
    const total = data.reduce((a,b)=>a+b,0);
    const avg = (total/data.length).toFixed(2);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const growth = ((data[data.length-1] - data[0]) / data[0] * 100).toFixed(1);

    document.getElementById("analyticsSummary").innerHTML = `
      <b>📅 Total Days:</b> ${data.length}<br>
      <b>💰 Total Sales:</b> ₹${total.toFixed(2)}<br>
      <b>📈 Avg Daily Sales:</b> ₹${avg}<br>
      <b>🚀 Highest Day:</b> ₹${max}<br>
      <b>📉 Lowest Day:</b> ₹${min}<br>
      <b>📊 Growth Rate:</b> ${isNaN(growth) ? "N/A" : growth+"%"}
    `;
  }

  // Refresh chart if new data saved
  window.renderAnalytics = () => {
    console.log("🔄 Refreshing analytics chart...");
    analyticsEl.innerHTML = `
      <h3>📊 Smart Sales Dashboard</h3>
      <canvas id="salesChart" style="width:100%;max-width:600px;height:320px;"></canvas>
      <div id="analyticsSummary" style="margin-top:20px;font-size:14px;line-height:1.6;"></div>
    `;
    renderChart(Object.keys(grouped), Object.values(grouped));
  };
})();
