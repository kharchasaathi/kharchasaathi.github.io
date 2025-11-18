/* =======================================================
   🛒 wanting.js — Wanting / Reorder Manager (FINAL v6.0)
   FIXED: Type dropdown, dd-mm-yyyy display, internal dates
======================================================= */

const toDisp = window.toDisplay;
const toInt  = window.toInternal;

/* -------------------------------------------------------
   🔁 RENDER WANTING TABLE
------------------------------------------------------- */
function renderWanting() {
  const tbody = qs("#wantingTable tbody");
  const typeDrop = qs("#wantType");

  if (!tbody || !typeDrop) return;

  /* ---------- Fill Type Dropdown (Correct: t.name) ---------- */
  typeDrop.innerHTML =
    `<option value="">Select Type</option>` +
    window.types
      .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
      .join("");

  /* ---------- Build Table ---------- */
  if (!window.wanting.length) {
    tbody.innerHTML = `<tr><td colspan="5">No wanting items</td></tr>`;
    return;
  }

  let html = "";

  window.wanting.forEach((w, i) => {
    html += `
      <tr>
        <td>${toDisp(w.date)}</td>
        <td>${esc(w.type)}</td>
        <td>${esc(w.name)}</td>
        <td>${esc(w.note || "")}</td>
        <td>
          <button class="want-add-btn small-btn" data-i="${i}">Add to Stock</button>
          <button class="want-del-btn small-btn" data-i="${i}" style="background:#d32f2f;color:#fff">Delete</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/* -------------------------------------------------------
   ➕ ADD NEW WANTING ITEM (date in internal format)
------------------------------------------------------- */
function addWantingItem() {
  const type = qs("#wantType")?.value;
  const name = qs("#wantName")?.value.trim();
  const note = qs("#wantNote")?.value.trim();

  if (!type || !name) return alert("Enter type and product name");

  window.wanting.push({
    id: uid("want"),
    date: todayDate(),   // saved internal yyyy-mm-dd
    type,
    name,
    note
  });

  saveWanting();
  renderWanting();

  qs("#wantName").value = "";
  qs("#wantNote").value = "";
}

/* -------------------------------------------------------
   🔥 MOVE "WANTED ITEM" → STOCK
------------------------------------------------------- */
function wantingToStock(i) {
  const w = window.wanting[i];
  if (!w) return;

  const qty = Number(prompt(`Enter quantity for ${w.name}:`));
  if (!qty || qty <= 0) return alert("Invalid quantity");

  const cost = Number(prompt("Enter purchase cost ₹ each:"));
  if (!cost || cost <= 0) return alert("Invalid cost");

  /* Add to Stock */
  addStockEntry({
    date: todayDate(),     // internal yyyy-mm-dd
    type: w.type,
    name: w.name,
    qty,
    cost
  });

  /* Remove from Wanting */
  window.wanting.splice(i, 1);
  saveWanting();

  renderWanting();
  renderStock?.();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* -------------------------------------------------------
   ❌ DELETE WANTING ENTRY
------------------------------------------------------- */
function deleteWantingItem(i) {
  if (!confirm("Delete this item?")) return;

  window.wanting.splice(i, 1);
  saveWanting();
  renderWanting();
}

/* -------------------------------------------------------
   🖱 BUTTON EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {

  if (e.target.id === "addWantBtn")
    return addWantingItem();

  if (e.target.id === "clearWantBtn") {
    if (!confirm("Clear entire wanting list?")) return;
    window.wanting = [];
    saveWanting();
    renderWanting();
    return;
  }

  if (e.target.classList.contains("want-add-btn"))
    return wantingToStock(Number(e.target.dataset.i));

  if (e.target.classList.contains("want-del-btn"))
    return deleteWantingItem(Number(e.target.dataset.i));
});

/* -------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderWanting();
});
