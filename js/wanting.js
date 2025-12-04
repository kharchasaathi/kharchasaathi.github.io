/* =======================================================
   🛒 wanting.js — STABLE ONLINE VERSION v9.0
   • Safe global guards
   • Preserves dropdown selection
   • Avoids runtime errors if helpers not loaded yet
   • Calls dependent renderers using optional chaining
======================================================= */

(function(){
  const qsLocal = s => (typeof document !== "undefined") ? document.querySelector(s) : null;
  const escLocal = x => (window.esc ? window.esc(x) : String(x || ""));
  const toDisp = window.toDisplay || (d => d);
  const toInt  = window.toInternal || (d => d);

  // Ensure global wanting array exists
  window.wanting = Array.isArray(window.wanting) ? window.wanting : [];

  /* -------------------------------------------------------
     🔁 SAFE TYPE DROPDOWN RENDER (preserve selection)
  ------------------------------------------------------- */
  function ensureWantTypeDropdown() {
    const typeDrop = qsLocal("#wantType");
    if (!typeDrop) return;

    const prev = typeDrop.value || "";

    const types = Array.isArray(window.types) ? window.types : [];

    typeDrop.innerHTML =
      `<option value="">Select Type</option>` +
      types.map(t => `<option value="${escLocal(t.name)}">${escLocal(t.name)}</option>`).join("");

    if (prev) try { typeDrop.value = prev; } catch (e) {}
  }

  /* -------------------------------------------------------
     🔁 RENDER WANTING TABLE
  ------------------------------------------------------- */
  function renderWanting() {
    const tbody = qsLocal("#wantingTable tbody");
    const typeDrop = qsLocal("#wantType");

    // keep type dropdown in sync safely
    ensureWantTypeDropdown();

    if (!tbody) return;

    const list = Array.isArray(window.wanting) ? window.wanting : [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;">No wanting items</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((w, i) => `
      <tr>
        <td data-label="Date">${toDisp(w.date)}</td>
        <td data-label="Type">${escLocal(w.type)}</td>
        <td data-label="Product">${escLocal(w.name)}</td>
        <td data-label="Note">${escLocal(w.note || "-")}</td>
        <td data-label="Action">
          <button class="want-add-btn small-btn" data-i="${i}">Add to Stock</button>
          <button class="want-del-btn small-btn" data-i="${i}" style="background:#d32f2f;color:#fff">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  /* -------------------------------------------------------
     ➕ ADD NEW WANTING ITEM
  ------------------------------------------------------- */
  function addWantingItem() {
    const type = qsLocal("#wantType")?.value;
    const name = qsLocal("#wantName")?.value.trim();
    const note = qsLocal("#wantNote")?.value.trim();

    if (!type || !name) {
      return alert("Enter type and product name");
    }

    window.wanting.push({
      id: (window.uid ? window.uid("want") : ("want_" + Math.random().toString(36).slice(2,9))),
      date: (typeof window.todayDate === "function") ? window.todayDate() : new Date().toISOString().split("T")[0],
      type,
      name,
      note
    });

    // Save (local + cloud if available)
    if (typeof window.saveWanting === "function") window.saveWanting();
    else try { localStorage.setItem("wanting-data", JSON.stringify(window.wanting)); } catch {}

    renderWanting();
    // UI updates
    window.updateUniversalBar?.();
    window.renderStock?.();
    window.renderSales?.();
  }

  /* -------------------------------------------------------
     🔥 WANTING → STOCK (Real-time Online)
  ------------------------------------------------------- */
  function wantingToStock(i) {
    const w = (Array.isArray(window.wanting) ? window.wanting[i] : null);
    if (!w) return alert("Item not found");

    const qtyRaw = prompt(`Enter quantity for ${w.name}:`);
    const qty = Number(qtyRaw);
    if (!qty || qty <= 0) return alert("Invalid quantity");

    const costRaw = prompt("Enter purchase cost ₹ each:");
    const cost = Number(costRaw);
    if (!cost || cost <= 0) return alert("Invalid cost");

    // Use core's addStockEntry if present
    if (typeof window.addStockEntry === "function") {
      try {
        addStockEntry({
          date: (typeof window.todayDate === "function") ? window.todayDate() : new Date().toISOString().split("T")[0],
          type: w.type,
          name: w.name,
          qty,
          cost
        });
      } catch (e) {
        console.error("addStockEntry failed:", e);
        return alert("Failed to add stock. See console.");
      }
    } else {
      // Fallback: push into window.stock safely
      window.stock = Array.isArray(window.stock) ? window.stock : [];
      const existing = window.stock.find(p => p.type === w.type && String(p.name).toLowerCase() === String(w.name).toLowerCase());
      if (!existing) {
        window.stock.push({
          id: (window.uid ? window.uid("stk") : ("stk_" + Math.random().toString(36).slice(2,9))),
          date: (typeof window.todayDate === "function") ? window.todayDate() : new Date().toISOString().split("T")[0],
          type: w.type,
          name: w.name,
          qty,
          cost,
          sold: 0,
          limit: (typeof window.getGlobalLimit === "function") ? window.getGlobalLimit() : 0,
          history: [{ date: (typeof window.todayDate === "function") ? window.todayDate() : new Date().toISOString().split("T")[0], qty, cost }]
        });
      } else {
        existing.qty = Number(existing.qty || 0) + qty;
        existing.history = existing.history || [];
        existing.history.push({ date: (typeof window.todayDate === "function") ? window.todayDate() : new Date().toISOString().split("T")[0], qty, cost });
        existing.cost = cost;
      }
      if (typeof window.saveStock === "function") window.saveStock();
    }

    // Remove from wanting
    window.wanting.splice(i, 1);
    if (typeof window.saveWanting === "function") window.saveWanting();

    // Refresh all dependent UIs
    renderWanting();
    window.renderStock?.();
    window.renderSales?.();
    window.renderCollection?.();
    window.updateUniversalBar?.();
  }

  /* -------------------------------------------------------
     ❌ DELETE WANTING ITEM
  ------------------------------------------------------- */
  function deleteWantingItem(i) {
    if (!confirm("Delete this item?")) return;

    window.wanting.splice(i, 1);
    if (typeof window.saveWanting === "function") window.saveWanting();

    renderWanting();
    window.updateUniversalBar?.();
  }

  /* -------------------------------------------------------
     🖱 EVENTS (delegated)
  ------------------------------------------------------- */
  document.addEventListener("click", function(e){
    const target = e.target;

    if (!target) return;

    if (target.id === "addWantBtn") {
      return addWantingItem();
    }

    if (target.id === "clearWantBtn") {
      if (!confirm("Clear entire wanting list?")) return;
      window.wanting = [];
      if (typeof window.saveWanting === "function") window.saveWanting();
      renderWanting();
      window.updateUniversalBar?.();
      return;
    }

    if (target.classList.contains("want-add-btn")) {
      const idx = Number(target.dataset.i);
      return wantingToStock(idx);
    }

    if (target.classList.contains("want-del-btn")) {
      const idx = Number(target.dataset.i);
      return deleteWantingItem(idx);
    }
  });

  /* -------------------------------------------------------
     🚀 INIT
  ------------------------------------------------------- */
  window.addEventListener("load", function(){
    // make sure types dropdown present & render
    ensureWantTypeDropdown();
    renderWanting();
  });

  // expose for testing
  window.renderWanting = renderWanting;
  window.addWantingItem = addWantingItem;
  window.deleteWantingItem = deleteWantingItem;
  window.wantingToStock = wantingToStock;
})();
