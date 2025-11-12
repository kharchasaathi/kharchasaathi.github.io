// js/types.js — Manage Item Types + Stock Integration + History + Auto Save
(function(){
  console.log("✅ types.js module loaded");

  // LocalStorage keys
  const K_TYPES = "item-types";
  const K_STOCK = "stock-data";
  const K_LIMIT = "default-limit";

  // Global in-memory stores
  window.types = JSON.parse(localStorage.getItem(K_TYPES) || '["Mobiles","Accessories"]');
  window.stock = JSON.parse(localStorage.getItem(K_STOCK) || '[]');

  // 💾 Save All Data
  window.saveAll = function(){
    localStorage.setItem(K_TYPES, JSON.stringify(types));
    localStorage.setItem(K_STOCK, JSON.stringify(stock));
  };

  // 🗂 Render Types List
  window.renderTypes = function(){
    const list = document.getElementById("typeList");
    if (!list) return;
    list.innerHTML = types.length
      ? types.map(t => `<li>${t}</li>`).join("")
      : `<li style="opacity:0.6">No types yet</li>`;
  };

  // 🔽 Update Dropdowns (Type + Filter)
  function updateDropdowns(){
    const tsel = document.getElementById("ptype");
    const fsel = document.getElementById("filterType");
    if (!tsel || !fsel) return;

    const typeOpts = types.map(t => `<option value="${t}">${t}</option>`).join("");
    tsel.innerHTML = `<option value="">Select</option>${typeOpts}`;
    fsel.innerHTML = `<option value="all">All Types</option>${typeOpts}`;
  }

  // ➕ Add New Type
  function addType(){
    const el = document.getElementById("typeName");
    const val = el.value.trim();
    if (!val) return alert("Enter a type name");
    if (types.includes(val)) return alert("Type already exists");
    types.push(val);
    saveAll();
    renderTypes();
    updateDropdowns();
    el.value = "";
  }

  // ❌ Clear All Types
  function clearTypes(){
    if (!confirm("Clear all types?")) return;
    types = [];
    saveAll();
    renderTypes();
    updateDropdowns();
  }

  // ⚙️ Global Stock Limit
  function setGlobalLimit(){
    const v = parseInt(document.getElementById("globalLimit").value);
    if (isNaN(v) || v < 0) return alert("Invalid number");
    localStorage.setItem(K_LIMIT, v);
    alert("Limit set: " + v);
  }

  function getLimit(){
    const v = parseInt(localStorage.getItem(K_LIMIT));
    return isNaN(v) ? 0 : v;
  }

  // ➕ Add Stock Item
  function addStock(){
    const d = document.getElementById("pdate").value;
    const t = document.getElementById("ptype").value;
    const n = document.getElementById("pname").value.trim();
    const q = parseInt(document.getElementById("pqty").value);
    const c = parseFloat(document.getElementById("pcost").value);

    if (!d || !t || !n || !q || !c) return alert("Please fill all fields");

    let ex = stock.find(s => s.type === t && s.name.toLowerCase() === n.toLowerCase());
    if (ex) {
      ex.qty += q;
      ex.date = d;
      ex.cost = c;
      ex.history = ex.history || [];
      ex.history.push({ date: d, qty: q, cost: c });
    } else {
      stock.push({
        date: d,
        type: t,
        name: n,
        qty: q,
        sold: 0,
        cost: c,
        history: [{ date: d, qty: q, cost: c }]
      });
    }
    saveAll();
    renderStock();
    document.getElementById("pname").value = "";
    document.getElementById("pqty").value = "";
    document.getElementById("pcost").value = "";
  }

  // 📋 Render Stock Table
  window.renderStock = function(){
    const f = document.getElementById("filterType")?.value || "all";
    const tb = document.querySelector("#stockTable tbody");
    if (!tb) return;

    tb.innerHTML =
      stock
        .filter(s => f === "all" || s.type === f)
        .map((s, i) => {
          const sold = s.sold || 0;
          const rem = s.qty - sold;
          const lim = getLimit();
          let cls = "ok", msg = "OK";
          if (rem <= 0) { cls = "out"; msg = "OUT"; }
          else if (rem <= lim) { cls = "low"; msg = "LOW"; }

          return `
          <tr>
            <td>${s.date}</td>
            <td>${s.type}</td>
            <td>${s.name}</td>
            <td>${s.qty}</td>
            <td>${sold}</td>
            <td>${rem}</td>
            <td class="${cls}">${msg}</td>
            <td>${lim}</td>
            <td>
              <button class="history-btn" data-i="${i}">📜</button>
              <button class="remove-btn" data-i="${i}">🗑</button>
            </td>
          </tr>`;
        })
        .join("") || `<tr><td colspan="9">No Data</td></tr>`;
  };

  // 📜 View History
  function viewHistory(i){
    const s = stock[i];
    if (!s || !s.history) return alert("No history available");
    const list = s.history.map(h => `${h.date} — Qty: ${h.qty} @₹${h.cost}`).join("\n");
    alert(`📜 ${s.name} History:\n${list}`);
  }

  // 🗑 Remove Stock Item
  function removeStock(i){
    if (!confirm("Delete this stock item?")) return;
    stock.splice(i, 1);
    saveAll();
    renderStock();
  }

  // 🖱️ Events
  document.addEventListener("click", e => {
    const id = e.target.id;
    if (id === "addTypeBtn") addType();
    if (id === "clearTypesBtn") clearTypes();
    if (id === "setLimitBtn") setGlobalLimit();
    if (id === "clearStockBtn") {
      if (confirm("Clear all stock?")) {
        stock = [];
        saveAll();
        renderStock();
      }
    }
    if (id === "addStockBtn") addStock();

    if (e.target.classList.contains("history-btn")) viewHistory(e.target.dataset.i);
    if (e.target.classList.contains("remove-btn")) removeStock(e.target.dataset.i);
  });

  // 🔁 Filter change
  document.getElementById("filterType")?.addEventListener("change", renderStock);

  // 🚀 Init
  window.addEventListener("load", ()=>{
    renderTypes();
    updateDropdowns();
    renderStock();
  });

})();
