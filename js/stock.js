/* ==========================================================
   stock.js — ONLINE REALTIME VERSION (v4.0)
   ✔ Fully online (core.js + firebase.js compatible)
   ✔ Cloud sync instant (cloudSaveDebounced)
   ✔ Sales.js live sync
   ✔ Collection, UniversalBar instant update
========================================================== */

/* -----------------------------
   Helpers
----------------------------- */
const $  = s => document.querySelector(s);
const $all = s => Array.from(document.querySelectorAll(s));

const num = v => isNaN(Number(v)) ? 0 : Number(v);

function getCurrentTime12hr() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ==========================================================
   STOCK DATA (Loaded by core.js – DO NOT OVERWRITE)
========================================================== */
/*  ⚠️ Do NOT: window.stock = JSON.parse(...)
    core.js already loads stock + cloud sync
*/

/* ==========================================================
   SAVE STOCK (LOCAL + CLOUD)
========================================================== */
window.saveStock = function () {
  try {
    localStorage.setItem("stock-data", JSON.stringify(window.stock));
  } catch {}

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("stock", window.stock);
  }
};

/* ==========================================================
   ADD STOCK
========================================================== */
$("#addStockBtn")?.addEventListener("click", () => {
  const date = $("#pdate").value || todayDate();
  const type = $("#ptype").value.trim();
  const name = $("#pname").value.trim();
  const qty  = num($("#pqty").value);
  const cost = num($("#pcost").value);

  if (!type || !name || qty <= 0 || cost <= 0) {
    alert("Enter valid product details.");
    return;
  }

  window.stock.push({
    id: uid("stk"),
    date,
    type,
    name,
    qty,
    sold: 0,
    cost,
    limit: num($("#globalLimit").value || 2)
  });

  window.saveStock();
  renderStock();
  window.updateUniversalBar?.();
});

/* ==========================================================
   CLEAR ALL STOCK
========================================================== */
$("#clearStockBtn")?.addEventListener("click", () => {
  if (!confirm("Delete ALL stock?")) return;

  window.stock = [];
  window.saveStock();

  renderStock();
  window.updateUniversalBar?.();
});

/* ==========================================================
   SET GLOBAL LIMIT
========================================================== */
$("#setLimitBtn")?.addEventListener("click", () => {
  const limit = num($("#globalLimit").value || 2);
  window.stock.forEach(p => p.limit = limit);

  window.saveStock();
  renderStock();
});

/* ==========================================================
   STOCK QUICK SALE (Cash / Credit)
========================================================== */
function stockQuickSale(i, mode) {
  const p = window.stock[i];
  if (!p) return;

  const remain = num(p.qty) - num(p.sold);
  if (remain <= 0) { alert("No stock left."); return; }

  const qty = num(prompt(`Enter Qty (Available: ${remain})`));
  if (!qty || qty <= 0 || qty > remain) return;

  const price = num(prompt("Enter Selling Price ₹:"));
  if (!price || price <= 0) return;

  let customer = "";
  let phone = "";

  if (mode === "Credit") {
    customer = prompt("Customer Name:") || "";
    phone = prompt("Phone Number:") || "";
  }

  const cost = num(p.cost);
  const total = qty * price;
  const profit = total - qty * cost;

  /* Update sold qty */
  p.sold += qty;
  window.saveStock();

  /* Add sale entry (sales.js handles sync) */
  window.sales.push({
    id: uid("sale"),
    date: todayDate(),
    time: getCurrentTime12hr(),
    type: p.type,
    product: p.name,
    qty,
    price,
    total,
    profit,
    cost,
    status: mode,
    customer,
    phone
  });

  window.saveSales?.();

  /* Auto Wanting */
  if (p.sold >= p.qty && window.autoAddWanting) {
    window.autoAddWanting(p.type, p.name, "Finished");
  }

  /* 🔥 FULL REALTIME UPDATE */
  renderStock();
  window.renderSales?.();
  renderPendingCollections?.();
  renderCollection?.();
  window.updateUniversalBar?.();
}

/* expose */
window.stockQuickSale = stockQuickSale;

/* ==========================================================
   RENDER STOCK TABLE
========================================================== */
function renderStock() {
  const tbody = $("#stockTable tbody");
  if (!tbody) return;

  const filterType = $("#filterType")?.value || "all";
  const searchTxt = ($("#productSearch")?.value || "").toLowerCase();

  let data = window.stock || [];

  if (filterType !== "all") {
    data = data.filter(p => p.type === filterType);
  }

  if (searchTxt) {
    data = data.filter(p =>
      p.name.toLowerCase().includes(searchTxt) ||
      p.type.toLowerCase().includes(searchTxt)
    );
  }

  tbody.innerHTML = data.map((p, i) => {
    const remain = num(p.qty) - num(p.sold);
    const alert = remain <= p.limit ? "⚠️" : "";

    return `
      <tr>
        <td>${p.date}</td>
        <td>${p.type}</td>
        <td>${p.name}</td>
        <td>${p.qty}</td>
        <td>${p.sold}</td>
        <td>${remain}</td>
        <td>${alert}</td>
        <td>${p.limit}</td>
        <td>
          <button class="small-btn" onclick="stockQuickSale(${i}, 'Paid')">Cash</button>
          <button class="small-btn" onclick="stockQuickSale(${i}, 'Credit')"
            style="background:#facc15;color:black;">Credit</button>
        </td>
      </tr>
    `;
  }).join("");

  updateStockInvestment();
}

/* ==========================================================
   STOCK INVESTMENT (Before sale)
========================================================== */
function updateStockInvestment() {
  const total = window.stock.reduce((sum, p) => {
    const remain = num(p.qty) - num(p.sold);
    return sum + remain * num(p.cost);
  }, 0);

  $("#stockInvValue").textContent = "₹" + total;
}

/* ==========================================================
   EVENTS
========================================================== */
$("#productSearch")?.addEventListener("input", renderStock);
$("#filterType")?.addEventListener("change", renderStock);

/* ==========================================================
   INIT
========================================================== */
window.addEventListener("load", () => {
  renderStock();
  updateStockInvestment();
  window.updateUniversalBar?.();
});
