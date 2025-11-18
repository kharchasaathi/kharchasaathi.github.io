/* =======================================================
   🛒 wanting.js — Wanting / Reorder Manager (FINAL v6.1 FIXED)
======================================================= */

const wToDisp = window.toDisplay;
const wToInt  = window.toInternal;

/* -------------------------------------------------------
   🔁 RENDER WANTING TABLE
------------------------------------------------------- */
function renderWanting() {
  const tbody = qs("#wantingTable tbody");
  const typeDrop = qs("#wantType");

  if (!tbody || !typeDrop) return;

  typeDrop.innerHTML =
    `<option value="">Select Type</option>` +
    window.types
      .map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`)
      .join("");

  if (!window.wanting.length) {
    tbody.innerHTML = `<tr><td colspan="5">No wanting items</td></tr>`;
    return;
  }

  let html = "";

  window.wanting.forEach((w, i) => {
    html += `
      <tr>
        <td>${wToDisp(w.date)}</td>
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
   ➕ ADD NEW WANTING ITEM 
------------------------------------------------------- */
function addWantingItem() {
  const type = qs("#wantType")?.value;
  const name = qs("#wantName")?.value.trim();
  const note = qs("#wantNote")?.value.trim();

  if (!type || !name) return alert("Enter type and product name");

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
}

/* -------------------------------------------------------
   🔥 WANTING → STOCK
------------------------------------------------------- */
function wantingToStock(i) {
  const w = window.wanting[i];
  if (!w) return;

  const qty = Number(prompt(`Enter quantity for ${w.name}:`));
  if (!qty || qty <= 0) return alert("Invalid quantity");

  const cost = Number(prompt("Enter purchase cost ₹ each:"));
  if (!cost || cost <= 0) return alert("Invalid cost");

  addStockEntry({
    date: todayDate(),
    type: w.type,
    name: w.name,
    qty,
    cost
  });

  window.wanting.splice(i, 1);
  saveWanting();

  renderWanting();
  renderStock?.();
  updateSummaryCards?.();
  renderAnalytics?.();
}

/* -------------------------------------------------------
   ❌ DELETE
------------------------------------------------------- */
function deleteWantingItem(i) {
  if (!confirm("Delete this item?")) return;
  window.wanting.splice(i, 1);
  saveWanting();
  renderWanting();
}

/* -------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.id === "addWantBtn") return addWantingItem();
  if (e.target.id === "clearWantBtn") {
    if (!confirm("Clear entire wanting list?")) return;
    window.wanting = [];
    saveWanting();
    renderWanting();
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
