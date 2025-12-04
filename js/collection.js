/* collection.js — Final (v4)
   - normal collections -> collectionHistory
   - credit collections -> creditSalesCollected / creditServiceCollected
   - safe-guards vs duplicates
   - calls updateUniversalBar() and render hooks when available
*/

(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const esc = x => (x === undefined || x === null) ? "" : String(x);
  const todayISO = () => (new Date()).toISOString().split('T')[0];

  // Persisted (or in-memory) collections used by other modules
  window.collectionHistory = Array.isArray(window.collectionHistory) ? window.collectionHistory : [];
  window.creditSalesCollected = Array.isArray(window.creditSalesCollected) ? window.creditSalesCollected : [];
  window.creditServiceCollected = Array.isArray(window.creditServiceCollected) ? window.creditServiceCollected : [];

  // ---------------------
  // Helpers
  // ---------------------
  function numeric(v){ return Number(v || 0); }

  function findDuplicateCollection(entry){
    return window.collectionHistory.find(e =>
      e.source === entry.source &&
      e.details === entry.details &&
      numeric(e.amount) === numeric(entry.amount) &&
      e.date === entry.date
    );
  }

  function findDuplicateCredit(list, key){
    // key is string composite to check duplicates
    return list.find(r => r.__dupKey === key);
  }

  function makeKeyForSale(sale){
    // prefer id if present
    if (sale && sale.id) return `sale:${sale.id}`;
    return `sale:${sale.date||''}|${sale.customer||''}|${sale.product||''}|${numeric(sale.total)}`;
  }
  function makeKeyForService(job){
    if (job && job.id) return `svc:${job.id}`;
    return `svc:${job.date_out||job.date_in||''}|${job.customer||''}|${job.item||''}|${numeric(job.creditCollectedAmount||job.collected||0)}`;
  }

  // ---------------------
  // Renderers
  // ---------------------
  function renderCollectionHistory(){
    const tbody = qs("#collectionHistory tbody");
    if(!tbody) return;
    if(!window.collectionHistory.length){
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collections yet</td></tr>`;
      return;
    }
    tbody.innerHTML = window.collectionHistory.map(row => `
      <tr>
        <td data-label="Date">${esc(row.date)}</td>
        <td data-label="Source">${esc(row.source)}</td>
        <td data-label="Details">${esc(row.details)}</td>
        <td data-label="Amount">₹${Number(row.amount).toLocaleString()}</td>
      </tr>
    `).join("");
  }

  function renderCreditCollectedTables(){
    const salesBody = qs("#creditSalesCollected tbody");
    const svcBody   = qs("#creditServiceCollected tbody");

    if (salesBody){
      if (!window.creditSalesCollected.length){
        salesBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collected credit sales yet</td></tr>`;
      } else {
        salesBody.innerHTML = window.creditSalesCollected.map((r, idx) => `
          <tr data-idx="${idx}">
            <td>${esc(r.date)}</td>
            <td>${esc(r.customer || "-")}<br><small>${esc(r.product || "")} (${r.qty}×₹${r.price})</small></td>
            <td><span class="status-paid">Collected ₹${Number(r.collected).toLocaleString()}</span></td>
            <td><button class="btn-link credit-delete" data-which="sale" data-idx="${idx}" title="Delete">🗑️</button></td>
          </tr>
        `).join("");
      }
    }

    if (svcBody){
      if (!window.creditServiceCollected.length){
        svcBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collected service credits yet</td></tr>`;
      } else {
        svcBody.innerHTML = window.creditServiceCollected.map((r, idx) => `
          <tr data-idx="${idx}">
            <td>${esc(r.date)}</td>
            <td>${esc(r.customer || "-")}<br><small>${esc(r.item || "")} ${esc(r.model || "")}</small></td>
            <td><span class="status-paid">Collected ₹${Number(r.collected).toLocaleString()}</span></td>
            <td><button class="btn-link credit-delete" data-which="service" data-idx="${idx}" title="Delete">🗑️</button></td>
          </tr>
        `).join("");
      }
    }
  }

  // ---------------------
  // Delete handlers for credit-collected rows
  // ---------------------
  document.addEventListener("click", function(ev){
    const btn = ev.target.closest(".credit-delete");
    if (!btn) return;
    const which = btn.dataset.which;
    const idx = Number(btn.dataset.idx);
    if (which === "sale"){
      if (window.creditSalesCollected && window.creditSalesCollected[idx]){
        window.creditSalesCollected.splice(idx,1);
        renderCreditCollectedTables();
        try{ if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch(e){}
      }
    } else if (which === "service"){
      if (window.creditServiceCollected && window.creditServiceCollected[idx]){
        window.creditServiceCollected.splice(idx,1);
        renderCreditCollectedTables();
        try{ if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch(e){}
      }
    }
  });

  // ---------------------
  // Add normal collection
  // ---------------------
  function addToCollectionHistory(entry){
    // expects { date, source, details, amount }
    entry.date = entry.date || todayISO();
    entry.amount = numeric(entry.amount);
    if (entry.amount <= 0) return false;
    if (findDuplicateCollection(entry)) return false; // avoid duplicate
    window.collectionHistory.unshift(entry); // newest first
    renderCollectionHistory();
    return true;
  }

  // ---------------------
  // Collect credit sale (used when a credit sale gets paid)
  // ---------------------
  function addCreditSaleCollected(saleObj){
    if (!saleObj) return false;
    const key = makeKeyForSale(saleObj);
    if (findDuplicateCredit(window.creditSalesCollected, key)) return false;
    const collected = numeric(saleObj.collectedAmount || saleObj.collected || saleObj.total || (numeric(saleObj.qty)*numeric(saleObj.price)));
    if (collected <= 0) return false;

    const row = {
      __dupKey: key,
      date: saleObj.creditCollectedOn || todayISO(),
      customer: saleObj.customer || "",
      phone: saleObj.phone || "",
      product: saleObj.product || "",
      qty: saleObj.qty || 0,
      price: saleObj.price || 0,
      total: numeric(saleObj.total || collected),
      collected: collected
    };

    window.creditSalesCollected.unshift(row);
    renderCreditCollectedTables();
    return true;
  }

  // ---------------------
  // Collect credit service (used when service job credit collected)
  // ---------------------
  function addCreditServiceCollected(jobObj){
    if (!jobObj) return false;
    const key = makeKeyForService(jobObj);
    if (findDuplicateCredit(window.creditServiceCollected, key)) return false;
    const collected = numeric(jobObj.creditCollectedAmount || jobObj.collected || 0);
    if (collected <= 0) return false;

    const row = {
      __dupKey: key,
      date: jobObj.creditCollectedOn || todayISO(),
      customer: jobObj.customer || "",
      phone: jobObj.phone || "",
      item: jobObj.item || "",
      model: jobObj.model || "",
      collected: collected
    };

    window.creditServiceCollected.unshift(row);
    renderCreditCollectedTables();
    return true;
  }

  // ---------------------
  // Public API
  // ---------------------
  // handleCollect(type) invoked by UI (type: 'net'|'stock'|'service')
  window.handleCollect = async function(type){
    try {
      type = String(type || "").toLowerCase();
      // map DOM ids (these exist in dashboard html)
      const idMap = { net: "unNetProfit", stock: "unStockInv", service: "unServiceInv" };
      const id = idMap[type];
      const el = id ? qs("#" + id) : null;
      let raw = 0;
      if (el){
        raw = Number((el.textContent||el.innerText||"").replace(/[₹,]/g,"").trim()) || 0;
      }
      if (!raw || raw <= 0){
        alert("Nothing to collect for: " + type);
        return;
      }

      // Normal collection => add to collectionHistory
      const entry = {
        date: todayISO(),
        source: (type === "net") ? "Net Profit" : (type === "stock") ? "Stock Investment" : "Service Investment",
        details: `Collected from ${type}`,
        amount: raw
      };
      addToCollectionHistory(entry);

      // Reset the displayed value to zero (UI only)
      if (el) el.textContent = "₹0";

      // If app has onCollect hook, call it (for persistent storage)
      if (typeof window.onCollect === "function"){
        try { await window.onCollect(type, entry); } catch(e){ console.warn("onCollect hook failed", e); }
      }

      // Update universal bar / other renderers
      try{ if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch(e){}
      try{ if (typeof window.renderCollection === "function") window.renderCollection(); } catch(e){}
      renderCollectionHistory();
    } catch (err){
      console.error("handleCollect error:", err);
      alert("Collect failed — see console.");
    }
  };

  // collectCreditSale(saleObj) — called when a credit sale is collected (from sales module)
  window.collectCreditSale = function(saleObj){
    try {
      const ok = addCreditSaleCollected(saleObj);
      if (!ok) return false;

      // mark original sale as collected in window.sales if possible (safe update)
      try {
        if (saleObj && saleObj.id && Array.isArray(window.sales)){
          const idx = window.sales.findIndex(s => s.id === saleObj.id);
          if (idx >= 0){
            window.sales[idx].wasCredit = true;
            window.sales[idx].status = "paid";
            window.sales[idx].collectedAmount = saleObj.collectedAmount || saleObj.total || (numeric(saleObj.qty)*numeric(saleObj.price));
            window.sales[idx].creditCollectedOn = todayISO();
          }
        }
      } catch(e){ console.warn("marking sale paid failed", e); }

      // As per your request: collected credit should also add to Net profit & Stock investment where applicable.
      // We do not mutate calculations directly here — rely on updateUniversalBar which reads arrays.
      try { if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch(e){}
      try { if (typeof window.renderCollection === "function") window.renderCollection(); } catch(e){}
      return true;
    } catch(e){
      console.error("collectCreditSale failed:", e);
      return false;
    }
  };

  // collectCreditService(jobObj) — called when a service credit is collected
  window.collectCreditService = function(jobObj){
    try {
      const ok = addCreditServiceCollected(jobObj);
      if (!ok) return false;

      // Mark job as paid/collected if possible
      try {
        if (jobObj && jobObj.id && Array.isArray(window.services)){
          const idx = window.services.findIndex(s => s.id === jobObj.id);
          if (idx >= 0){
            window.services[idx].creditStatus = "collected";
            window.services[idx].creditCollectedAmount = jobObj.creditCollectedAmount || jobObj.collected || 0;
            window.services[idx].creditCollectedOn = todayISO();
            window.services[idx].status = "collected";
          }
        }
      } catch(e){ console.warn("marking service collected failed", e); }

      try { if (typeof window.updateUniversalBar === "function") window.updateUniversalBar(); } catch(e){}
      try { if (typeof window.renderCollection === "function") window.renderCollection(); } catch(e){}
      return true;
    } catch(e){
      console.error("collectCreditService failed:", e);
      return false;
    }
  };

  // expose render wrapper for compatibility
  window.renderCollection = function(){
    renderCollectionHistory();
    renderCreditCollectedTables();
  };

  // init on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    try {
      renderCollectionHistory();
      renderCreditCollectedTables();
    }catch(e){ console.error("collection init failed:", e); }
  });

})();
