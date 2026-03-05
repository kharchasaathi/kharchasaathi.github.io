/* =======================================================
   🛒 wanting.js — ONLINE REALTIME VERSION (V9.0)
   ✔ Full cloud sync (saveWanting → cloudSaveDebounced)
   ✔ Wanting → Stock instant sync
   ✔ UniversalBar + Collection realtime update
   ✔ FIXED: removed renderPendingCollections crash
======================================================= */

const wToDisp = window.toDisplay;
const wToInt  = window.toInternal;

/* -------------------------------------------------------
   🔁 RENDER WANTING TABLE
------------------------------------------------------- */
function renderWanting() {
  const tbody    = qs("#wantingTable tbody");
  const typeDrop = qs("#wantType");

  if (!tbody || !typeDrop) return;

  /* ---- TYPE DROPDOWN ---- */
  typeDrop.innerHTML =
    `<option value="">Select Type</option>` +
    (window.types || [])
      .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
      .join("");

  const list = window.wanting || [];

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5">No wanting items</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((w, i) => `
      <tr>
        <td data-label="Date">${wToDisp(w.date)}</td>
        <td data-label="Type">${esc(w.type)}</td>
        <td data-label="Product">${esc(w.name)}</td>
        <td data-label="Note">${esc(w.note || "-")}</td>

        <td data-label="Action">
          <button class="want-add-btn small-btn" data-i="${i}">
            Add to Stock
          </button>

          <button class="want-del-btn small-btn"
            data-i="${i}"
            style="background:#d32f2f;color:#fff">
            Delete
          </button>
        </td>
      </tr>
    `)
    .join("");
}

/* -------------------------------------------------------
   ➕ ADD NEW WANTING ITEM 
------------------------------------------------------- */
function addWantingItem() {
  const type = qs("#wantType")?.value;
  const name = qs("#wantName")?.value.trim();
  const note = qs("#wantNote")?.value.trim();

  if (!type || !name)
    return alert("Enter type and product name");

  window.wanting.push({
    id: uid("want"),
    date: todayDate(),
    type,
    name,
    note
  });

  saveWanting();
  renderWanting();

  qs("#wantName").value = "";
  qs("#wantNote").value = "";

  window.renderUniversalBar?.();
}

/* -------------------------------------------------------
   🔥 WANTING → STOCK (Real-time Online)
------------------------------------------------------- */
function wantingToStock(i) {
  const w = window.wanting[i];
  if (!w) return;

  const qty = Number(prompt(`Enter quantity for ${w.name}:`));
  if (!qty || qty <= 0) return alert("Invalid quantity");

  const cost = Number(prompt("Enter purchase cost ₹ each:"));
  if (!cost || cost <= 0) return alert("Invalid cost");

  /* Add to stock through core.js function */
  addStockEntry({
    date: todayDate(),
    type: w.type,
    name: w.name,
    qty,
    cost
  });

  /* Remove from wanting */
  window.wanting.splice(i, 1);
  saveWanting();

  /* FULL REALTIME UPDATE */
  renderWanting();
  renderStock?.();
  renderSales?.();
  renderCollection?.();          // ⭐ FIX: removed renderPendingCollections
  window.renderUniversalBar?.();
}

/* -------------------------------------------------------
   ❌ DELETE WANTING ITEM
------------------------------------------------------- */
function deleteWantingItem(i) {
  if (!confirm("Delete this item?")) return;

  window.wanting.splice(i, 1);
  saveWanting();
  renderWanting();
  window.renderUniversalBar?.();
}

/* -------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {

  if (e.target.id === "addWantBtn")
    return addWantingItem();

  if (e.target.id === "clearWantBtn") {
    if (!confirm("Clear entire wanting list?")) return;
    window.wanting = [];
    saveWanting();
    renderWanting();
    window.renderUniversalBar?.();
    return;
  }

  if (e.target.classList.contains("want-add-btn"))
    return wantingToStock(Number(e.target.dataset.i));

  if (e.target.classList.contains("want-del-btn"))
    return deleteWantingItem(Number(e.target.dataset.i));
});

/* -------------------------------------------------------
   🚀 INIT
------------------------------------------------------- */
window.addEventListener("load", () => {
  renderWanting();
});
