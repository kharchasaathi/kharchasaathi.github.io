// js/sales.js — Sales + Profit + Credit System Module
(function(){
  console.log("✅ sales.js module loaded");

  const SALES_KEY = "sales-data";
  const ADMIN_KEY = "ks-admin-pw";

  // Load previous data
  window.sales = JSON.parse(localStorage.getItem(SALES_KEY) || "[]");

  // Default admin password (changeable)
  if(!localStorage.getItem(ADMIN_KEY)){
    localStorage.setItem(ADMIN_KEY, "admin123");
  }

  // 🔐 Save all sales
  window.saveSales = function(){
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  };

  // 📊 Helper: refresh dropdowns
  function refreshSaleSelectors(){
    const saleType = document.getElementById("saleType");
    const saleProduct = document.getElementById("saleProduct");
    if(!saleType || !saleProduct) return;

    const typesList = Array.isArray(window.types) ? window.types : [];
    saleType.innerHTML = `<option value="">All Types</option>` + typesList.map(t=>`<option value="${t}">${t}</option>`).join("");

    const products = (window.stock || []).map(s=>({type:s.type,name:s.name}));
    const uniqueProds = products.filter((v,i,a)=>a.findIndex(x=>x.type===v.type&&x.name===v.name)===i);
    saleProduct.innerHTML = `<option value="">Select Product</option>` + uniqueProds.map(p=>`<option value="${p.type}|||${p.name}">${p.type} — ${p.name}</option>`).join("");
  }

  // 💰 Add Sale Entry
  function addSale(){
    const d = document.getElementById("saleDate")?.value || new Date().toISOString().split("T")[0];
    const prodVal = document.getElementById("saleProduct")?.value;
    const qty = parseInt(document.getElementById("saleQty")?.value);
    const price = parseFloat(document.getElementById("salePrice")?.value);
    const status = document.getElementById("saleStatus")?.value || "Paid";
    const gstEnabled = document.getElementById("includeGst")?.checked;
    const gstPercent = parseFloat(document.getElementById("gstPercent")?.value) || 0;

    if(!prodVal) return alert("Select product");
    if(!qty || qty <= 0) return alert("Invalid quantity");
    if(!price || price <= 0) return alert("Invalid price");

    const [type, name] = prodVal.split("|||");

    const sIndex = (window.stock || []).findIndex(s=>s.type===type && s.name.toLowerCase()===name.toLowerCase());
    let cost = 0;
    if(sIndex >= 0){
      const stockItem = window.stock[sIndex];
      const remain = (stockItem.qty || 0) - (stockItem.sold || 0);
      if(qty > remain){
        if(!confirm(`Only ${remain} left in stock. Proceed anyway?`)) return;
      }
      stockItem.sold = (stockItem.sold || 0) + qty;
      cost = parseFloat(stockItem.cost) || 0;
      try{ saveAll(); }catch(e){}
    }

    let netPrice = price;
    if(gstEnabled && gstPercent > 0){
      netPrice = price / (1 + gstPercent/100);
    }
    const profit = (netPrice - cost) * qty;

    const entry = {
      date: d,
      type, product: name,
      qty, price,
      amount: price * qty,
      profit: Math.round(profit*100)/100,
      status
    };

    sales.push(entry);
    saveSales();
    renderSales();
    updateSummaryCards();
    alert(`✅ ${status} sale added successfully for ${name}`);
  }

  // 📋 Render Sales Table
  window.renderSales = function(filterDate){
    const tb = document.querySelector("#salesTable tbody");
    const totalEl = document.getElementById("salesTotal");
    const profitEl = document.getElementById("profitTotal");
    if(!tb) return;

    const list = filterDate ? sales.filter(s=>s.date===filterDate) : sales;
    if(!list.length){
      tb.innerHTML = `<tr><td colspan="8">No Sales Yet</td></tr>`;
      totalEl.textContent = "0";
      profitEl.textContent = "0";
      return;
    }

    let total=0, profitTotal=0;
    tb.innerHTML = list.map((s,i)=>{
      total += s.amount || 0;
      profitTotal += s.profit || 0;
      return `<tr>
        <td>${s.date}</td>
        <td>${s.type}</td>
        <td>${s.product}</td>
        <td>${s.qty}</td>
        <td>${s.price}</td>
        <td>${s.amount}</td>
        <td class="profit-cell">${s.profit}</td>
        <td>${s.status}</td>
      </tr>`;
    }).join("");

    totalEl.textContent = total.toFixed(2);
    profitEl.textContent = profitTotal.toFixed(2);
    applyProfitVisibility();
  };

  // 📅 View Sales by Date
  document.getElementById("viewSalesBtn")?.addEventListener("click", ()=>{
    const d = document.getElementById("saleDate")?.value;
    renderSales(d);
  });

  // 🖨 Print Sales
  document.getElementById("printSalesBtn")?.addEventListener("click", ()=>{
    const rowsHtml = document.querySelector("#salesTable tbody").innerHTML;
    const html = `
      <html><head><title>Sales Print</title>
      <style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:center}</style>
      </head><body><h3>Sales Report</h3><table>${document.querySelector("#salesTable thead").innerHTML}${rowsHtml}</table></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.print();
  });

  // 🔒 Profit Lock / Unlock
  let profitLocked = false;
  function applyProfitVisibility(){
    const colIndex = 6;
    const ths = document.querySelectorAll("#salesTable thead th");
    if(ths[colIndex]) ths[colIndex].style.display = profitLocked ? "none" : "";
    document.querySelectorAll("#salesTable tbody tr").forEach(tr=>{
      const cell = tr.querySelector(".profit-cell");
      if(cell) cell.style.display = profitLocked ? "none" : "";
    });
    document.getElementById("profitTotal").style.display = profitLocked ? "none" : "";
  }

  document.getElementById("toggleProfitBtn")?.addEventListener("click", ()=>{
    if(!profitLocked){
      profitLocked = true;
      applyProfitVisibility();
      alert("Profit column locked. Use same button to unlock with Admin password.");
      return;
    }
    const pw = prompt("Enter admin password:");
    if(!pw) return;
    const stored = localStorage.getItem(ADMIN_KEY) || "";
    if(pw === stored){
      profitLocked = false;
      applyProfitVisibility();
      alert("Profit column unlocked ✅");
    }else{
      alert("Incorrect password ❌");
    }
  });

  // 🧑‍💼 Set / Change Admin Password
  document.getElementById("setAdminBtn")?.addEventListener("click", ()=>{
    const cur = localStorage.getItem(ADMIN_KEY);
    const old = prompt("Enter current password (default: admin123):");
    if(old !== cur) return alert("Wrong password");
    const np = prompt("Enter new admin password:");
    if(!np || np.length < 4) return alert("Password too short");
    localStorage.setItem(ADMIN_KEY, np);
    alert("Admin password updated ✅");
  });

  // 🚀 Init
  window.addEventListener("load", ()=>{
    refreshSaleSelectors();
    renderSales();
    applyProfitVisibility();
  });

})();
