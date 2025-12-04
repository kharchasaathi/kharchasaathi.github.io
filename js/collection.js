/* collection.js - Reworked collect logic (v2)
   - handleCollect(type) provided (net, stock, service)
   - normal collected amounts -> collectionHistory
   - credit collected -> creditSalesCollected / creditServiceCollected (NOT collectionHistory)
   - collected-credit rows show DELETE (no GOTO)
   - safe-guards + no-duplicate-collection checks
   - exposes hooks:
       window.onCollect(type, entry)            -> called for normal collections
       window.onCreditCollected(kind, obj)     -> called when credit sale/service is collected
*/

(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const esc = x => (x === undefined || x === null) ? "" : String(x);

  // In-memory stores (preserve existing if present)
  window.collectionHistory = Array.isArray(window.collectionHistory) ? window.collectionHistory : [];
  window.creditSalesCollected = Array.isArray(window.creditSalesCollected) ? window.creditSalesCollected : [];
  window.creditServiceCollected = Array.isArray(window.creditServiceCollected) ? window.creditServiceCollected : [];

  // Utility: format date YYYY-MM-DD
  function todayISO(d){
    d = d || new Date();
    return d.toISOString().split("T")[0];
  }

  // Utility: unique key for collection entries (to avoid duplicate pushes)
  function colKey(entry){
    // source + details + amount + date (if id present prefer id)
    if (entry && entry.id) return `id:${entry.id}`;
    return `${entry.source}::${entry.details}::${Number(entry.amount||0)}::${entry.date||""}`;
  }

  // COLLECTION HISTORY - add with duplicate guard
  function addToCollectionHistory(entry){
    try {
      if (!entry || !entry.amount || Number(entry.amount) <= 0) return false;
      entry.date = entry.date || todayISO();
      const key = colKey(entry);
      // de-dup by key
      const found = window.collectionHistory.find(e => (e._ck === key));
      if (found) return false;
      entry._ck = key;
      // newest first
      window.collectionHistory.unshift(entry);
      renderCollectionHistory();
      return true;
    } catch (e){
      console.error("addToCollectionHistory error:", e);
      return false;
    }
  }

  // RENDER collection table
  function renderCollectionHistory(){
    const tbody = qs("#collectionHistory tbody");
    if (!tbody) return;
    if (!window.collectionHistory.length){
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collections yet</td></tr>`;
      return;
    }
    tbody.innerHTML = window.collectionHistory.map(row => `
      <tr>
        <td data-label="Date">${esc(row.date)}</td>
        <td data-label="Source">${esc(row.source)}</td>
        <td data-label="Details">${esc(row.details)}</td>
        <td data-label="Amount">₹${Number(row.amount)}</td>
      </tr>
    `).join("");
  }

  // RENDER credit-collected lists (sales & service) with DELETE icon (no GOTO)
  function renderCreditCollectedTables(){
    const salesBody = qs("#creditSalesCollected tbody");
    const svcBody = qs("#creditServiceCollected tbody");

    if (salesBody){
      if (!window.creditSalesCollected.length){
        salesBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collected credit sales yet</td></tr>`;
      } else {
        salesBody.innerHTML = window.creditSalesCollected.map((r, idx) => `
          <tr data-idx="${idx}" data-type="sale">
            <td data-label="Date">${esc(r.date)}</td>
            <td data-label="Customer / Product">
              ${esc(r.customer || "-")}<br>
              <small>${esc(r.product || "")} ${r.qty ? `(${r.qty}×₹${r.price})` : ""}</small>
            </td>
            <td data-label="Collected"><span class="status-paid">Collected ₹${Number(r.collected)}</span></td>
            <td data-label="Action">
              <button class="btn-link credit-delete" data-which="sale" data-idx="${idx}" title="Delete">🗑️</button>
            </td>
          </tr>
        `).join("");
      }
    }

    if (svcBody){
      if (!window.creditServiceCollected.length){
        svcBody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;">No collected service credits yet</td></tr>`;
      } else {
        svcBody.innerHTML = window.creditServiceCollected.map((r, idx) => `
          <tr data-idx="${idx}" data-type="service">
            <td data-label="Date">${esc(r.date)}</td>
            <td data-label="Customer / Job">
              ${esc(r.customer || "-")}<br>
              <small>${esc(r.item || "")} ${esc(r.model || "")}</small>
            </td>
            <td data-label="Collected"><span class="status-paid">Collected ₹${Number(r.collected)}</span></td>
            <td data-label="Action">
              <button class="btn-link credit-delete" data-which="service" data-idx="${idx}" title="Delete">🗑️</button>
            </td>
          </tr>
        `).join("");
      }
    }
  }

  // CREDIT DELETE handler (removes from collected lists)
  document.addEventListener("click", function(e){
    const btn = e.target.closest(".credit-delete");
    if (!btn) return;
    const which = btn.dataset.which;
    const idx = Number(btn.dataset.idx);
    if (which === "sale"){
      if (Array.isArray(window.creditSalesCollected) && window.creditSalesCollected[idx]){
        // Optionally prompt
        if (confirm("Delete this collected credit sale entry?")) {
          window.creditSalesCollected.splice(idx, 1);
          renderCreditCollectedTables();
        }
      }
    } else if (which === "service"){
      if (Array.isArray(window.creditServiceCollected) && window.creditServiceCollected[idx]){
        if (confirm("Delete this collected service credit entry?")) {
          window.creditServiceCollected.splice(idx, 1);
          renderCreditCollectedTables();
        }
      }
    }
  });

  // handleCollect(type) - called by universal-card collect buttons
  // type: "net" | "stock" | "service"
  window.handleCollect = async function(type){
    try {
      type = String(type || "").toLowerCase();
      const idMap = {
        net: "unNetProfit",
        stock: "unStockInv",
        service: "unServiceInv"
      };
      const domId = idMap[type];
      const el = domId ? qs("#" + domId) : null;

      // read numeric value from element text (handles "₹1,234")
      let rawAmount = 0;
      if (el){
        const txt = (el.textContent || el.innerText || "").replace(/[₹,]/g,"").trim();
        rawAmount = Number(txt) || 0;
      }

      if (!rawAmount || rawAmount <= 0){
        alert("Nothing to collect for: " + type);
        return;
      }

      const now = todayISO();
      const entry = {
        id: `col_${Date.now()}_${Math.floor(Math.random()*9999)}`,
        date: now,
        source: (type === "net") ? "Net Profit" : (type === "stock") ? "Stock Investment" : "Service Investment",
        details: `Collected ${type}`,
        amount: Number(rawAmount)
      };

      // add to collectionHistory (cash collections only)
      const added = addToCollectionHistory(entry);

      // reset visible UI amount to 0 (do not assume underlying data mutated)
      if (el) {
        el.textContent = "₹0";
      }

      // call hook so other code (universalBar, analytics, backend) can adjust stored values
      if (typeof window.onCollect === "function"){
        try {
          await window.onCollect(type, entry);
        } catch(e){
          console.warn("onCollect hook failed:", e);
        }
      }

      // re-render and update any dashboards
      renderCollectionHistory();
      try { if (typeof window.updateSummaryCards === "function") window.updateSummaryCards(); } catch(e){}
      try { if (typeof window.renderCollection === "function") window.renderCollection(); } catch(e){}

      return added;

    } catch (err){
      console.error("handleCollect failed:", err);
      alert("Collect failed. See console.");
      return false;
    }
  };

  // collectCreditSale(saleObj)
  // saleObj: { id?, date?, customer?, product?, qty?, price?, total?, collectedAmount?, creditCollectedOn? }
  // - pushes into creditSalesCollected (NOT collectionHistory)
  // - calls window.onCreditCollected('sale', saleObj) hook for profit/stock updates
  window.collectCreditSale = function(saleObj){
    try {
      if (!saleObj) return false;
      const collected = Number(saleObj.collectedAmount || saleObj.total || (Number(saleObj.qty||0)*Number(saleObj.price||0)) || 0);
      if (!collected || collected <= 0) return false;

      const row = {
        id: saleObj.id || `sale_${Date.now()}_${Math.floor(Math.random()*9999)}`,
        date: saleObj.creditCollectedOn || saleObj.date || todayISO(),
        customer: saleObj.customer || "",
        phone: saleObj.phone || "",
        product: saleObj.product || "",
        qty: saleObj.qty || 0,
        price: saleObj.price || 0,
        total: Number(saleObj.total || (Number(saleObj.qty||0)*Number(saleObj.price||0)) || collected),
        collected: Number(collected)
      };

      // duplicate prevention by id OR signature
      const sig = row.id ? (`id:${row.id}`) : (`${row.date}|${row.customer}|${row.product}|${Number(row.total)}`);
      const exists = window.creditSalesCollected.find(r => (r._ck === sig || (r.id && r.id === row.id)));
      if (exists) return false;
      row._ck = sig;

      window.creditSalesCollected.unshift(row);
      renderCreditCollectedTables();

      // hook for profit/stock updates (app-level logic should implement)
      if (typeof window.onCreditCollected === "function"){
        try {
          window.onCreditCollected("sale", row);
        } catch(e){
          console.warn("onCreditCollected(sale) hook failed:", e);
        }
      }

      return true;
    } catch (e){
      console.error("collectCreditSale error:", e);
      return false;
    }
  };

  // collectCreditService(jobObj)
  // jobObj: { id?, date_in?, date_out?, customer?, phone?, item?, model?, creditCollectedAmount?, creditCollectedOn? }
  window.collectCreditService = function(jobObj){
    try {
      if (!jobObj) return false;
      const collected = Number(jobObj.creditCollectedAmount || jobObj.collected || 0);
      if (!collected || collected <= 0) return false;

      const row = {
        id: jobObj.id || `svc_${Date.now()}_${Math.floor(Math.random()*9999)}`,
        date: jobObj.creditCollectedOn || jobObj.date_out || jobObj.date_in || todayISO(),
        customer: jobObj.customer || "",
        phone: jobObj.phone || "",
        item: jobObj.item || "",
        model: jobObj.model || "",
        collected: Number(collected)
      };

      const sig = row.id ? (`id:${row.id}`) : (`${row.date}|${row.customer}|${row.item}|${Number(row.collected)}`);
      const exists = window.creditServiceCollected.find(r => (r._ck === sig || (r.id && r.id === row.id)));
      if (exists) return false;
      row._ck = sig;

      window.creditServiceCollected.unshift(row);
      renderCreditCollectedTables();

      if (typeof window.onCreditCollected === "function"){
        try {
          window.onCreditCollected("service", row);
        } catch(e){
          console.warn("onCreditCollected(service) hook failed:", e);
        }
      }

      return true;
    } catch (e){
      console.error("collectCreditService error:", e);
      return false;
    }
  };

  // thin wrapper for external calls to re-render both collections and credit-collected lists
  window.renderCollection = function(){
    renderCollectionHistory();
    renderCreditCollectedTables();
  };

  // initial render on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    renderCollectionHistory();
    renderCreditCollectedTables();
  });

})();
