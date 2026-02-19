/* ==========================================================
   stock.js — FINAL v16
   ID SAFE + CASH/UPI MODE + ATOMIC STOCK/SALES UPDATE
========================================================== */

const $  = s => document.querySelector(s);
const num = v => isNaN(Number(v)) ? 0 : Number(v);
const toDisp = d =>
  (typeof window.toDisplay === "function"
    ? toDisplay(d)
    : d);


/* ==========================================================
   SAVE STOCK — CLOUD ONLY
========================================================== */
window.saveStock = function () {

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("stock", window.stock || []);
  }

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
};


/* ==========================================================
   ADD STOCK
========================================================== */
$("#addStockBtn")?.addEventListener("click", () => {

  let date = $("#pdate").value || todayDate();
  date = toInternalIfNeeded(date);

  const type = $("#ptype").value.trim();
  const name = $("#pname").value.trim();
  const qty  = num($("#pqty").value);
  const cost = num($("#pcost").value);

  if (!type || !name || qty <= 0 || cost <= 0)
    return alert("Enter valid product details.");

  const p = (window.stock || []).find(
    x => x.type === type &&
         x.name.toLowerCase() === name.toLowerCase()
  );

  if (!p) {

    window.stock.push({
      id: uid("stk"),
      type,
      name,
      date,
      qty,
      sold: 0,
      cost,
      limit: num($("#globalLimit").value || 2),
      history: [{ date, qty, cost }]
    });

  } else {

    p.qty += qty;
    p.cost = cost;

    if (!Array.isArray(p.history))
      p.history = [];

    p.history.push({ date, qty, cost });
  }

  window.saveStock();
  renderStock();
  window.updateUniversalBar?.();

  $("#pname").value="";
  $("#pqty").value="";
  $("#pcost").value="";
});


/* ==========================================================
   QUICK SALE — ID SAFE + PAYMENT MODE
========================================================== */
function stockQuickSale(id, mode) {

  const p = window.stock.find(x => x.id === id);
  if (!p) return;

  const remain = num(p.qty) - num(p.sold);
  if (remain <= 0)
    return alert("No stock left.");

  const qty = num(
    prompt(`Enter Qty (Available: ${remain})`)
  );
  if (!qty || qty > remain) return;

  const price = num(
    prompt("Enter Selling Price ₹:")
  );
  if (!price) return;

  /* ================= PAYMENT MODE ================= */
  let paymentMode = "Cash";
  let creditMode  = null;

  const payChoice = prompt(
    "Select Payment Mode:\n1 - Cash\n2 - UPI"
  );

  if (payChoice === "2") {
    paymentMode = "UPI";
  }

  let customer="", phone="";
  const isPaid = mode === "Paid";

  if (mode === "Credit") {

    customer = prompt("Customer Name:") || "";
    phone    = prompt("Phone Number:") || "";

    creditMode = paymentMode; // store how credit was created
  }

  const cost   = num(p.cost);
  const total  = qty * price;
  const profit = total - qty * cost;

  /* ---------- STOCK REDUCE ---------- */
  p.sold += qty;
  window.saveStock();

  /* ==================================================
     WANTING AUTO ADD
  ================================================== */
  if (p.sold >= p.qty) {

    if (window.autoAddWanting) {

      window.autoAddWanting(
        p.type,
        p.name,
        "Finished"
      );

    } else {

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
  }

  /* ==================================================
     SALES ENTRY (UPDATED STRUCTURE)
  ================================================== */
  window.sales.push({
    id: uid("sale"),
    date: todayDate(),
    time: new Date()
      .toLocaleTimeString("en-IN",
        {hour:"2-digit",minute:"2-digit"}),

    type: p.type,
    product: p.name,
    qty,
    price,
    total,
    profit,
    cost,

    status: isPaid ? "Paid" : "Credit",
    fromCredit: !isPaid,

    paymentMode: isPaid ? paymentMode : null,
    creditMode:  !isPaid ? creditMode  : null,

    customer,
    phone
  });

  window.saveSales?.();

  renderStock();
  window.renderSales?.();
  window.renderCollection?.();
  window.updateUniversalBar?.();
}
window.stockQuickSale = stockQuickSale;


/* ==========================================================
   CLEAR STOCK
========================================================== */
$("#clearStockBtn")?.addEventListener("click", () => {

  if (!confirm("Delete ALL stock?")) return;

  window.stock = [];
  window.saveStock();

  renderStock();
  window.updateUniversalBar?.();
});


/* ==========================================================
   GLOBAL LIMIT
========================================================== */
$("#setLimitBtn")?.addEventListener("click", () => {

  const limit =
    num($("#globalLimit").value || 2);

  window.stock.forEach(
    p => p.limit = limit
  );

  window.saveStock();
  renderStock();
});


/* ==========================================================
   RENDER TABLE
========================================================== */
function renderStock() {

  const tbody =
    $("#stockTable tbody");
  if (!tbody) return;

  const filterType =
    $("#filterType")?.value || "all";

  const searchTxt =
    ($("#productSearch")?.value || "")
    .toLowerCase();

  let data = window.stock || [];

  if (filterType !== "all")
    data = data.filter(
      p => p.type === filterType
    );

  if (searchTxt)
    data = data.filter(p =>
      p.name.toLowerCase().includes(searchTxt) ||
      p.type.toLowerCase().includes(searchTxt)
    );

  tbody.innerHTML = data.map((p)=>{

    const remain =
      num(p.qty) - num(p.sold);

    const alert =
      remain <= p.limit ? "⚠️" : "";

    return `
    <tr>
      <td>${toDisp(p.date)}</td>
      <td>${p.type}</td>
      <td>${p.name}</td>
      <td>${p.qty}</td>
      <td>${p.sold}</td>
      <td>${remain}</td>
      <td>${alert}</td>
      <td>${p.limit}</td>
      <td>
        <button onclick="showStockHistory('${p.id}')">📜</button>
        <button onclick="stockQuickSale('${p.id}','Paid')">Cash</button>
        <button onclick="stockQuickSale('${p.id}','Credit')">Credit</button>
      </td>
    </tr>`;
  }).join("");

  updateStockInvestment();
}


/* ==========================================================
   INVESTMENT
========================================================== */
function updateStockInvestment(){

  const total =
    (window.stock||[])
    .reduce((sum,p)=>{
      const remain =
        num(p.qty)-num(p.sold);
      return sum + remain*num(p.cost);
    },0);

  $("#stockInvValue")
    .textContent = "₹"+total;
}


/* ==========================================================
   FILTER EVENTS
========================================================== */
$("#productSearch")
  ?.addEventListener("input",renderStock);

$("#filterType")
  ?.addEventListener("change",renderStock);


/* ==========================================================
   INIT
========================================================== */
window.addEventListener("load",()=>{

  renderStock();
  updateStockInvestment();
  window.updateUniversalBar?.();

});
