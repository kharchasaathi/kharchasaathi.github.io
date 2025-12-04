/* wanting.js — FINAL v9 (fixed remain handling in fallback) */
(function(){
  const qsLocal = s => document.querySelector(s);
  const escLocal = x => (window.esc ? window.esc(x) : String(x||""));
  const toDisp = window.toDisplay || (d=>d);
  window.wanting = Array.isArray(window.wanting)?window.wanting:[];

  function ensureWantTypeDropdown(){
    const dd = qsLocal("#wantType"); if(!dd) return;
    const prev = dd.value || "";
    const types = Array.isArray(window.types)?window.types: [];
    dd.innerHTML = `<option value="">Select Type</option>` + types.map(t=>`<option value="${escLocal(t.name)}">${escLocal(t.name)}</option>`).join("");
    if(prev) try{ dd.value = prev; }catch{}
  }

  function renderWanting(){
    const tbody = qsLocal("#wantingTable tbody");
    ensureWantTypeDropdown();
    if(!tbody) return;
    const list = Array.isArray(window.wanting)?window.wanting:[];
    if(!list.length){ tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;">No wanting items</td></tr>`; return; }
    tbody.innerHTML = list.map((w,i)=>`<tr>
      <td data-label="Date">${toDisp(w.date)}</td>
      <td data-label="Type">${escLocal(w.type)}</td>
      <td data-label="Product">${escLocal(w.name)}</td>
      <td data-label="Note">${escLocal(w.note||"-")}</td>
      <td data-label="Action"><button class="want-add-btn small-btn" data-i="${i}">Add to Stock</button> <button class="want-del-btn small-btn" data-i="${i}" style="background:#d32f2f;color:#fff">Delete</button></td>
    </tr>`).join("");
  }

  function addWantingItem(){
    const type = qsLocal("#wantType")?.value;
    const name = (qsLocal("#wantName")?.value||"").trim();
    const note = (qsLocal("#wantNote")?.value||"").trim();
    if(!type||!name) return alert("Enter type and product name");
    window.wanting.push({ id: window.uid?window.uid("want"):"want_"+Math.random().toString(36).slice(2,9), date: window.todayDate?window.todayDate():new Date().toISOString().split("T")[0], type, name, note });
    if(typeof window.saveWanting==="function") window.saveWanting(); else try{ localStorage.setItem("wanting-data", JSON.stringify(window.wanting)); }catch{}
    renderWanting(); window.updateUniversalBar?.(); window.renderStock?.(); window.renderSales?.();
  }

  function wantingToStock(i){
    const w = (window.wanting||[])[i]; if(!w) return alert("Item not found");
    const qty = Number(prompt(`Enter quantity for ${w.name}:`)); if(!qty||qty<=0) return alert("Invalid quantity");
    const cost = Number(prompt("Enter purchase cost ₹ each:")); if(!cost||cost<=0) return alert("Invalid cost");
    if(typeof window.addStockEntry==="function"){
      try{ window.addStockEntry({ date: window.todayDate?window.todayDate():new Date().toISOString().split("T")[0], type: w.type, name: w.name, qty, cost }); }catch(e){ console.error(e); return alert("Failed to add stock"); }
    } else {
      // FALLBACK: safely update window.stock with proper fields (ensure remain exists)
      window.stock = Array.isArray(window.stock)?window.stock:[];
      const existing = window.stock.find(p=>p.type===w.type && String(p.name||"").toLowerCase()===String(w.name||"").toLowerCase());
      if(!existing){
        window.stock.push({
          id: window.uid?window.uid("stk"):"stk_"+Math.random().toString(36).slice(2,9),
          date: window.todayDate?window.todayDate():new Date().toISOString().split("T")[0],
          type: w.type,
          name: w.name,
          qty,
          remain: qty,               // <<< FIX: set initial remain
          cost,
          sold:0,
          limit: window.getGlobalLimit?window.getGlobalLimit():0,
          history:[{date: window.todayDate?window.todayDate():new Date().toISOString().split("T")[0], qty, cost}]
        });
      } else {
        existing.qty = Number(existing.qty||0) + qty;
        existing.remain = Number(existing.remain||0) + qty; // <<< FIX: increment remain as well
        existing.history = existing.history||[];
        existing.history.push({ date: window.todayDate?window.todayDate():new Date().toISOString().split("T")[0], qty, cost });
        existing.cost = cost;
      }
      if(typeof window.saveStock==="function") window.saveStock();
    }
    window.wanting.splice(i,1);
    if(typeof window.saveWanting==="function") window.saveWanting();
    renderWanting(); window.renderStock?.(); window.renderSales?.(); window.renderCollection?.(); window.updateUniversalBar?.();
  }

  function deleteWantingItem(i){
    if(!confirm("Delete this item?")) return;
    window.wanting.splice(i,1);
    if(typeof window.saveWanting==="function") window.saveWanting();
    renderWanting(); window.updateUniversalBar?.();
  }

  document.addEventListener("click", function(e){
    const t = e.target;
    if(!t) return;
    if(t.id==="addWantBtn") return addWantingItem();
    if(t.id==="clearWantBtn"){ if(!confirm("Clear entire wanting list?")) return; window.wanting=[]; if(typeof window.saveWanting==="function") window.saveWanting(); renderWanting(); window.updateUniversalBar?.(); return; }
    if(t.classList.contains("want-add-btn")) return wantingToStock(Number(t.dataset.i));
    if(t.classList.contains("want-del-btn")) return deleteWantingItem(Number(t.dataset.i));
  });

  window.addEventListener("load", ()=>{ ensureWantTypeDropdown(); renderWanting(); });

  window.renderWanting = renderWanting; window.addWantingItem = addWantingItem; window.wantingToStock = wantingToStock;
})();
