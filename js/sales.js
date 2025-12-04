/* sales.js — reworked, safe, single-render, delegated events
   Responsibilities:
   - maintain window.sales array
   - addSale(), updateSale(), deleteSale()
   - renderSales() -> fills #salesTable tbody + updates #salesTotal and #profitTotal
   - collectSale() -> when user collects a sale (cash/credit)
   - integrates with window.collectCreditSale (collection.js) if available
*/

(function () {
  // safe selectors (if core.js already defines these, they'll be used)
  const qs = window.qs || (s => document.querySelector(s));
  const qsa = window.qsa || (s => Array.from(document.querySelectorAll(s)));
  const esc = x => (x === undefined || x === null) ? "" : String(x);

  // ensure global sales array exists
  window.sales = Array.isArray(window.sales) ? window.sales : [];

  // --- Utilities ---
  function parseNumber(v) {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v || 0;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoney(n) {
    return "₹" + Number(parseNumber(n)).toLocaleString();
  }

  function todayISO() {
    return (new Date()).toISOString().split("T")[0];
  }

  // compute totals (returns object)
  function computeTotals(list) {
    let salesTotal = 0;
    let profitTotal = 0;
    for (const s of list) {
      const qty = parseNumber(s.qty);
      const price = parseNumber(s.price);
      const total = parseNumber(s.total) || qty * price;
      const cost = parseNumber(s.cost || s.purchaseCost || 0);
      const profit = parseNumber(s.profit) || (total - (cost * qty));
      salesTotal += total;
      profitTotal += profit;
    }
    return { salesTotal, profitTotal };
  }

  // --- Rendering ---
  function renderSales() {
    const tbody = qs("#salesTable tbody");
    if (!tbody) return;

    const list = window.sales || [];
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;opacity:.6;">No sales recorded</td></tr>`;
      updateTotals(0, 0);
      return;
    }

    // build rows newest-first
    const rows = list.slice().reverse().map((s, idxRev) => {
      // idxRev is reversed index; compute original index
      const origIdx = list.length - 1 - idxRev;
      const date = esc(s.date || todayISO());
      const type = esc(s.type || "-");
      const product = esc(s.product || s.pname || "-");
      const qty = parseNumber(s.qty);
      const price = parseNumber(s.price);
      const total = parseNumber(s.total) || qty * price;
      const profit = parseNumber(s.profit) || (total - parseNumber(s.cost || 0) * qty);
      const status = (String((s.status || "")).toLowerCase() || (s.wasCredit ? "credit" : "paid"));
      const statusLabel = (status === "credit") ? `<span class="status-credit">Credit</span>` :
                          (status === "paid" || status === "collected") ? `<span class="status-paid">Paid</span>` :
                          `<small style="opacity:.8">${esc(status)}</small>`;

      // Buttons: collect only when credit OR not-collected; delete always
      const collectBtn = (status === "credit" || status === "pending") ?
        `<button class="btn-link sale-collect" data-idx="${origIdx}" data-type="credit">Collect</button>` :
        `<button class="btn-link sale-collect" data-idx="${origIdx}" data-type="cash">Collect</button>`;

      return `
        <tr data-idx="${origIdx}">
          <td data-label="Date">${date}</td>
          <td data-label="Type">${type}</td>
          <td data-label="Product">${product}</td>
          <td data-label="Qty">${qty}</td>
          <td data-label="Price">${formatMoney(price)}</td>
          <td data-label="Total">${formatMoney(total)}</td>
          <td data-label="Profit">${formatMoney(profit)}</td>
          <td data-label="Status">
            ${statusLabel}
            <div style="margin-top:6px;display:flex;gap:6px;">
              ${collectBtn}
              <button class="btn-link sale-delete" data-idx="${origIdx}" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows.join("");
    // update totals (use entire list)
    const totals = computeTotals(list);
    updateTotals(totals.salesTotal, totals.profitTotal);
  }

  function updateTotals(salesTotal, profitTotal) {
    const sEl = qs("#salesTotal");
    const pEl = qs("#profitTotal");
    if (sEl) sEl.textContent = formatMoney(salesTotal);
    if (pEl) pEl.textContent = formatMoney(profitTotal);
  }

  // --- CRUD operations for sales array ---
  function addSale(sale) {
    // minimal validation & normalization
    if (!sale) return false;
    const normalized = Object.assign({
      id: sale.id || ('s' + Date.now() + Math.floor(Math.random()*99)),
      date: sale.date || todayISO(),
      type: sale.type || sale.ptype || "General",
      product: sale.product || sale.pname || sale.productName || "-",
      qty: parseNumber(sale.qty) || 1,
      price: parseNumber(sale.price) || 0,
      total: parseNumber(sale.total) || (parseNumber(sale.qty) * parseNumber(sale.price)),
      cost: parseNumber(sale.cost) || parseNumber(sale.purchaseCost) || 0,
      profit: sale.profit !== undefined ? parseNumber(sale.profit) : ( (parseNumber(sale.total) || 0) - (parseNumber(sale.cost) * (parseNumber(sale.qty) || 1)) ),
      status: sale.status || (sale.wasCredit ? "credit" : "paid"),
      wasCredit: !!sale.wasCredit,
      collectedAmount: parseNumber(sale.collectedAmount) || 0,
      customer: sale.customer || sale.cust || ""
    }, sale);

    // avoid duplicates by simple key: date+product+qty+total
    const key = `${normalized.date}|${normalized.product}|${normalized.qty}|${normalized.total}`;
    const dup = window.sales.find(s => `${s.date}|${s.product}|${s.qty}|${s.total}` === key);
    if (dup) {
      // update existing if needed
      return false; // we won't add duplicate
    }

    window.sales.push(normalized);
    // re-render
    renderSales();
    // allow external hook
    if (typeof window.onSalesChanged === "function") {
      try { window.onSalesChanged(window.sales); } catch(e) { console.error(e); }
    }
    return true;
  }

  function updateSale(idx, patch) {
    if (typeof idx !== "number" || !window.sales[idx]) return false;
    const target = window.sales[idx];
    Object.assign(target, patch || {});
    // recalc totals/profit if relevant fields changed
    target.qty = parseNumber(target.qty);
    target.price = parseNumber(target.price);
    target.total = parseNumber(target.total) || (target.qty * target.price);
    target.cost = parseNumber(target.cost || 0);
    target.profit = parseNumber(target.profit) || (target.total - (target.cost * target.qty));
    renderSales();
    if (typeof window.onSalesChanged === "function") {
      try { window.onSalesChanged(window.sales); } catch(e) {}
    }
    return true;
  }

  function deleteSale(idx) {
    if (typeof idx !== "number" || !window.sales[idx]) return false;
    window.sales.splice(idx, 1);
    renderSales();
    if (typeof window.onSalesChanged === "function") {
      try { window.onSalesChanged(window.sales); } catch(e) {}
    }
    return true;
  }

  // --- Collect logic for a sale row ---
  // behavior:
  //  - if sale.status is credit -> mark as collected in credit list (via window.collectCreditSale) and set wasCredit/collected fields
  //  - else -> add to collectionHistory (via window.collectionHistory push or window.addToCollectionHistory if exists)
  //  - update universal summary by calling window.updateSummaryCards() if exists
  function collectSaleAtIndex(idx) {
    const sale = window.sales[idx];
    if (!sale) {
      alert("Sale not found");
      return;
    }

    const wasCredit = String((sale.status || "")).toLowerCase() === "credit" || !!sale.wasCredit;
    const collectedAmount = parseNumber(sale.collectedAmount || sale.total || (sale.qty * sale.price));

    if (collectedAmount <= 0) {
      alert("Collected amount is zero");
      return;
    }

    // If it's a credit sale -> send to credit-collected list (creditHistory)
    if (wasCredit) {
      // mark sale as collected
      sale.status = "collected";
      sale.wasCredit = false;
      sale.collectedAmount = collectedAmount;
      sale.creditCollectedOn = todayISO();

      // call global collect helper if present (collection.js exports collectCreditSale)
      if (typeof window.collectCreditSale === "function") {
        try {
          window.collectCreditSale(sale);
        } catch (err) {
          console.error("collectCreditSale hook failed:", err);
        }
      } else {
        // fallback: push to window.creditSalesCollected array if exists
        window.creditSalesCollected = Array.isArray(window.creditSalesCollected) ? window.creditSalesCollected : [];
        const row = {
          date: sale.creditCollectedOn || sale.date,
          customer: sale.customer || "",
          phone: sale.phone || "",
          product: sale.product,
          qty: sale.qty,
          price: sale.price,
          total: sale.total,
          collected: collectedAmount
        };
        // avoid duplicate
        const key = `${row.date}|${row.customer}|${row.product}|${Number(row.collected)}`;
        const exists = window.creditSalesCollected.find(r => `${r.date}|${r.customer}|${r.product}|${Number(r.collected)}` === key);
        if (!exists) window.creditSalesCollected.unshift(row);
      }

      // update analytics: if there is a function for updating profit or stock inv, call it
      if (typeof window.onCreditCollected === "function") {
        try { window.onCreditCollected(sale); } catch (e) { console.error(e); }
      }

    } else {
      // normal immediate collection -> add to collectionHistory
      const entry = {
        date: todayISO(),
        source: "Sales",
        details: `${sale.product} (${sale.qty}×₹${sale.price})`,
        amount: collectedAmount
      };

      // use a helper if present
      if (typeof window.addToCollectionHistory === "function") {
        try { window.addToCollectionHistory(entry); } catch (e) { console.error(e); }
      } else {
        window.collectionHistory = Array.isArray(window.collectionHistory) ? window.collectionHistory : [];
        // avoid duplicate
        const exists = window.collectionHistory.find(r => r.date === entry.date && r.source === entry.source && Number(r.amount) === Number(entry.amount) && r.details === entry.details);
        if (!exists) window.collectionHistory.unshift(entry);
        // and try to re-render collection if available
        if (typeof window.renderCollection === "function") {
          try { window.renderCollection(); } catch (e) { console.error(e); }
        }
      }

      // mark sale as paid/collected
      sale.status = "collected";
      sale.collectedAmount = collectedAmount;

      if (typeof window.onCashCollected === "function") {
        try { window.onCashCollected(sale); } catch (e) { console.error(e); }
      }
    }

    // finally update UI & totals
    renderSales();
    // update summary cards if available
    if (typeof window.updateSummaryCards === "function") {
      try { window.updateSummaryCards(); } catch (e) { console.error(e); }
    }
  }

  // --- Delegated event handlers (to avoid adding listeners repeatedly) ---
  document.addEventListener("click", function (ev) {
    const collectBtn = ev.target.closest(".sale-collect");
    if (collectBtn) {
      ev.preventDefault();
      const idx = parseInt(collectBtn.dataset.idx, 10);
      if (!Number.isNaN(idx)) collectSaleAtIndex(idx);
      return;
    }

    const delBtn = ev.target.closest(".sale-delete");
    if (delBtn) {
      ev.preventDefault();
      const idx = parseInt(delBtn.dataset.idx, 10);
      if (!Number.isNaN(idx)) {
        const ok = confirm("Delete this sale?");
        if (ok) deleteSale(idx);
      }
      return;
    }
  });

  // --- Filters (date/type) — simple helpers exposed for UI buttons ---
  function filterSalesByDateAndType(date, type) {
    // date: "YYYY-MM-DD" or falsy, type: "all" or specific
    let list = window.sales || [];
    if (date) {
      list = list.filter(s => String(s.date || "").startsWith(date));
    }
    if (type && type !== "all") {
      list = list.filter(s => String((s.type || "").toLowerCase()) === String(type).toLowerCase());
    }
    return list;
  }

  // If there are UI controls (filterSalesBtn etc.) hook them (id names from HTML)
  function attachUIControls() {
    // filter button
    const filterBtn = qs("#filterSalesBtn");
    if (filterBtn) {
      filterBtn.addEventListener("click", function () {
        const dateVal = (qs("#saleDate") && qs("#saleDate").value) ? qs("#saleDate").value : "";
        const typeVal = (qs("#saleType") && qs("#saleType").value) ? qs("#saleType").value : "all";
        const filtered = filterSalesByDateAndType(dateVal, typeVal);
        renderFilteredSales(filtered);
      });
    }

    const clearBtn = qs("#clearSalesBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!confirm("Clear all sales? This cannot be undone.")) return;
        window.sales = [];
        renderSales();
        if (typeof window.onSalesChanged === "function") {
          try { window.onSalesChanged(window.sales); } catch (e) {}
        }
      });
    }
  }

  function renderFilteredSales(list) {
    const tbody = qs("#salesTable tbody");
    if (!tbody) return;
    if (!Array.isArray(list) || !list.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;opacity:.6;">No sales for selected filters</td></tr>`;
      updateTotals(0, 0);
      return;
    }
    // same markup as renderSales but using provided list
    const rows = list.slice().reverse().map((s, idxRev) => {
      const origIdx = window.sales.indexOf(s);
      const date = esc(s.date || todayISO());
      const type = esc(s.type || "-");
      const product = esc(s.product || "-");
      const qty = parseNumber(s.qty);
      const price = parseNumber(s.price);
      const total = parseNumber(s.total) || qty * price;
      const profit = parseNumber(s.profit) || (total - parseNumber(s.cost || 0) * qty);
      const status = (String((s.status || "")).toLowerCase() || (s.wasCredit ? "credit" : "paid"));
      const statusLabel = (status === "credit") ? `<span class="status-credit">Credit</span>` :
                          (status === "paid" || status === "collected") ? `<span class="status-paid">Paid</span>` :
                          `<small style="opacity:.8">${esc(status)}</small>`;
      const collectBtn = `<button class="btn-link sale-collect" data-idx="${origIdx}" data-type="${status === "credit" ? "credit" : "cash"}">Collect</button>`;

      return `
        <tr data-idx="${origIdx}">
          <td data-label="Date">${date}</td>
          <td data-label="Type">${type}</td>
          <td data-label="Product">${product}</td>
          <td data-label="Qty">${qty}</td>
          <td data-label="Price">${formatMoney(price)}</td>
          <td data-label="Total">${formatMoney(total)}</td>
          <td data-label="Profit">${formatMoney(profit)}</td>
          <td data-label="Status">
            ${statusLabel}
            <div style="margin-top:6px;display:flex;gap:6px;">
              ${collectBtn}
              <button class="btn-link sale-delete" data-idx="${origIdx}" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = rows.join("");
    const totals = computeTotals(list);
    updateTotals(totals.salesTotal, totals.profitTotal);
  }

  // expose module API
  window.salesModule = {
    addSale,
    updateSale,
    deleteSale,
    renderSales,
    collectSaleAtIndex,
    filterSalesByDateAndType,
    init: function () {
      attachUIControls();
      renderSales();
    }
  };

  // auto-init when DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    try {
      window.sales = Array.isArray(window.sales) ? window.sales : [];
      window.creditSalesCollected = Array.isArray(window.creditSalesCollected) ? window.creditSalesCollected : [];
      window.collectionHistory = Array.isArray(window.collectionHistory) ? window.collectionHistory : [];
      window.salesModule.init();
    } catch (e) {
      console.error("salesModule init failed:", e);
    }
  });

})();
