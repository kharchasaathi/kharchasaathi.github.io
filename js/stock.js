/* ==========================================================
   stock.js — PRO FIFO REBUILD (PART 1 — CORE ENGINE SAFE)

   ✔ Safe Data Migration
   ✔ Stable ProductId (No Random Timestamp)
   ✔ True Batch Increment (No Merge)
   ✔ Strict FIFO Deduct Engine
   ✔ Old Data Compatible
   ✔ Zero Feature Loss
========================================================== */

const $  = s => document.querySelector(s);
const num = v => isNaN(Number(v)) ? 0 : Number(v);
const toDisp = d =>
  (typeof window.toDisplay === "function"
    ? toDisplay(d)
    : d);


/* ==========================================================
   🔄 SAFE DATA MIGRATION (VERY IMPORTANT)
========================================================== */
function migrateStockStructure(){

  window.stock = window.stock || [];

  window.stock.forEach(p => {

    /* Stable ProductId Fix */
    if(!p.productId){
      p.productId =
        p.type.replace(/\s+/g,"").toUpperCase() +
        "-" +
        p.name.replace(/\s+/g,"").toUpperCase();
    }

    /* Batch Fix */
    if(!p.batch){
      p.batch = "B01";
    }

    /* Sold Fix */
    if(typeof p.sold !== "number"){
      p.sold = 0;
    }

    /* History Fix */
    if(!Array.isArray(p.history)){
      p.history = [{
        date: p.date || todayDate(),
        qty: p.qty,
        cost: p.cost
      }];
    }

  });

}

window.addEventListener("load", migrateStockStructure);


/* ==========================================================
   🆔 STABLE PRODUCT ID (NO RANDOM ID)
========================================================== */
function generateProductId(type,name){

  return (
    type.replace(/\s+/g,"").toUpperCase() +
    "-" +
    name.replace(/\s+/g,"").toUpperCase()
  );
}


/* ==========================================================
   📦 TRUE BATCH GENERATOR (NO MERGE ISSUE)
========================================================== */
function generateBatch(productId){

  const existing =
    (window.stock||[])
      .filter(p=>p.productId===productId);

  if(!existing.length) return "B01";

  const numbers =
    existing.map(p =>
      Number((p.batch||"B01").replace("B",""))
    );

  const next =
    Math.max(...numbers)+1;

  return "B"+String(next).padStart(2,"0");
}


/* ==========================================================
   💾 SAVE STOCK — CLOUD SAFE
========================================================== */
window.saveStock = function(){

  if(typeof cloudSaveDebounced === "function"){
    cloudSaveDebounced("stock", window.stock || []);
  }

  window.dispatchEvent(
    new Event("cloud-data-loaded")
  );
};


/* ==========================================================
   ➕ ADD STOCK (ALWAYS NEW BATCH)
========================================================== */
$("#addStockBtn")?.addEventListener("click",()=>{

  let date = $("#pdate").value || todayDate();
  date = toInternalIfNeeded(date);

  const type = $("#ptype").value.trim();
  const name = $("#pname").value.trim();
  const qty  = num($("#pqty").value);
  const cost = num($("#pcost").value);

  if(!type || !name || qty<=0 || cost<=0)
    return alert("Enter valid product details.");

  window.stock = window.stock || [];

  const productId = generateProductId(type,name);
  const batch     = generateBatch(productId);

  window.stock.push({

    id: uid("stk"),
    productId,
    batch,

    type,
    name,
    date,

    qty,
    sold: 0,
    cost,

    limit: num($("#globalLimit").value || 2),
    reorderQty: 1,

    history: [{
      date,
      qty,
      cost
    }]

  });

  window.saveStock();
  renderStock?.();
  window.updateUniversalBar?.();

  $("#pname").value="";
  $("#pqty").value="";
  $("#pcost").value="";
});


/* ==========================================================
   🔁 FIFO HELPER (RESTORED — IMPORTANT)
========================================================== */
function getFifoBatches(productId){

  return (window.stock||[])
    .filter(p=>p.productId===productId)
    .sort((a,b)=>
      Number(a.batch.replace("B","")) -
      Number(b.batch.replace("B",""))
    );
}


/* ==========================================================
   🧠 STRICT FIFO DEDUCT ENGINE (ISOLATED)
========================================================== */
function deductFIFO(productId, qty){

  const fifoList = getFifoBatches(productId);

  let remaining = qty;
  let totalCostUsed = 0;

  for(let batch of fifoList){

    const available =
      num(batch.qty) - num(batch.sold);

    if(available<=0) continue;

    const deduct =
      Math.min(available, remaining);

    batch.sold += deduct;
    totalCostUsed += deduct * num(batch.cost);

    remaining -= deduct;

    if(remaining<=0) break;
  }

  if(remaining>0){
    return { error:"Not enough stock." };
  }

  window.saveStock?.();

  return {
    costUsed: totalCostUsed
  };
}
/* ==========================================================
   PART 2 — UI + SALES + WANTING + RENDER
========================================================== */


/* ==========================================================
   AUTO WANTING CHECK (PRODUCT LEVEL)
========================================================== */
function checkProductWanting(productId){

  const batches = getFifoBatches(productId);

  const totalRemain =
    batches.reduce(
      (sum,p)=>sum+(num(p.qty)-num(p.sold)),
      0
    );

  if(totalRemain>0) return;

  const sample = batches[0];
  if(!sample) return;

  window.wanting = window.wanting || [];

  const exists =
    window.wanting.find(
      w => w.type === sample.type &&
           w.name === sample.name
    );

  if (!exists) {

    window.wanting.push({
      id: uid("want"),
      type: sample.type,
      name: sample.name,
      qty: sample.reorderQty || 1,
      date: todayDate()
    });

    window.saveWanting?.();
  }
}


/* ==========================================================
   QUICK SALE — USES STRICT FIFO ENGINE
========================================================== */
function stockQuickSale(id, mode) {

  const batchItem =
    window.stock.find(x => x.id === id);
  if (!batchItem) return;

  const productId = batchItem.productId;

  const fifoList = getFifoBatches(productId);

  const totalRemain = fifoList.reduce(
    (sum,p)=>sum+(num(p.qty)-num(p.sold)),
    0
  );

  if (totalRemain <= 0)
    return alert("No stock left.");

  const qty = num(
    prompt(`Enter Qty (Available: ${totalRemain})`)
  );
  if (!qty || qty > totalRemain) return;

  const price = num(
    prompt("Enter Selling Price ₹:")
  );
  if (!price) return;


  /* PAYMENT MODE */
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

  if (!isPaid) {
    customer = prompt("Customer Name:") || "";
    phone    = prompt("Phone Number:") || "";
    creditMode = paymentMode;
  }


  /* 🔥 STRICT FIFO DEDUCT */
  const deductResult = deductFIFO(productId, qty);

  if (deductResult?.error) {
    return alert(deductResult.error);
  }

  const totalCostUsed = deductResult.costUsed;


  /* WANTING CHECK */
  checkProductWanting(productId);


  const total  = qty * price;
  const profit = isPaid
    ? total - totalCostUsed
    : 0;


  /* SALES ENTRY */
  const saleObj = {

    id: uid("sale"),
    date: todayDate(),
    time: new Date()
      .toLocaleTimeString("en-IN",
        {hour:"2-digit",minute:"2-digit"}),

    type: batchItem.type,
    product: batchItem.name,
    productId,
    qty,
    price,
    total,
    profit,
    cost: totalCostUsed,

    status: isPaid ? "Paid" : "Credit",
    fromCredit: !isPaid,

    paymentMode: isPaid ? paymentMode : null,
    creditMode:  !isPaid ? creditMode  : null,

    customer,
    phone,

    collectionLogged: false
  };

  window.sales = window.sales || [];
  window.sales.push(saleObj);

  window.saveSales?.();


  /* COLLECTION AUTO */
  if (isPaid) {

    const details =
      `${batchItem.name} — Qty ${qty} × ₹${price} = ₹${total}` +
      ` (${paymentMode})`;

    window.addCollectionEntry?.(
      "Stock Sale Collection",
      details,
      total,
      paymentMode
    );

    saleObj.collectionLogged = true;
  }


  renderStock();
  window.renderSales?.();
  window.renderCollection?.();
  window.updateUniversalBar?.();
}

window.stockQuickSale = stockQuickSale;


/* ==========================================================
   SHOW PURCHASE HISTORY (PER BATCH)
========================================================== */
function showStockHistory(id){

  const p =
    (window.stock||[])
    .find(x=>x.id===id);

  if(!p || !p.history?.length){
    alert("No purchase history available.");
    return;
  }

  let msg =
    `📦 ${p.name} (Batch ${p.batch})\n\n`;

  let totalQty  = 0;
  let totalCost = 0;

  p.history.forEach(h=>{

    const qty  = Number(h.qty)||0;
    const cost = Number(h.cost)||0;

    totalQty  += qty;
    totalCost += qty*cost;

    msg +=
      `${toDisp(h.date)} — ` +
      `${qty} × ₹${cost} = ₹${qty*cost}\n`;
  });

  const avg =
    totalQty
      ? (totalCost/totalQty).toFixed(2)
      : 0;

  msg +=
    `\nTotal Batch Qty: ${totalQty}` +
    `\nAverage Cost: ₹${avg}`;

  alert(msg);
}

window.showStockHistory = showStockHistory;


/* ==========================================================
   RENDER STOCK TABLE (FIFO DISPLAY SAFE)
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


  /* HIDE SOLD OUT */
  data = data.filter(p =>
    (num(p.qty) - num(p.sold)) > 0
  );


  /* FILTERS */
  if (filterType !== "all")
    data = data.filter(
      p => p.type === filterType
    );

  if (searchTxt)
    data = data.filter(p =>
      p.name.toLowerCase().includes(searchTxt) ||
      p.type.toLowerCase().includes(searchTxt) ||
      (p.batch && p.batch.toLowerCase().includes(searchTxt))
    );


  /* FIFO SORT */
  data.sort((a,b)=>{

    if(a.productId === b.productId){
      return Number(a.batch.replace("B","")) -
             Number(b.batch.replace("B",""));
    }

    return a.name.localeCompare(b.name);
  });


  /* BUILD TABLE */
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
      <td>${p.batch}</td>
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
   LIVE STOCK INVESTMENT
========================================================== */
function updateStockInvestment(){

  const total =
    (window.stock||[])
    .reduce((sum,p)=>{

      const remain =
        num(p.qty) - num(p.sold);

      if(remain<=0) return sum;

      return sum + remain*num(p.cost);

    },0);

  const el = $("#stockInvValue");
  if(el) el.textContent = "₹"+total;
}


/* ==========================================================
   FILTER EVENTS
========================================================== */
$("#productSearch")
  ?.addEventListener("input",renderStock);

$("#filterType")
  ?.addEventListener("change",renderStock);


/* ==========================================================
   INIT LOAD
========================================================== */
window.addEventListener("load",()=>{

  renderStock();
  updateStockInvestment();
  window.updateUniversalBar?.();

});
