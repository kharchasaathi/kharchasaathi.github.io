/* ======================================================
   🗂 types.js — Manage Product Categories / Types
   Works with: core.js, stock.js, sales.js, wanting.js
   ====================================================== */

/* Global types array already loaded from core.js
   -> window.types
*/

/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  if (window.types.includes(name))
    return alert("Type already exists!");

  window.types.push(name);
  saveTypes();
  renderTypes();
  updateTypeDropdowns();

  input.value = "";
}

/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {
  if (!confirm("Delete all types?")) return;

  window.types = [];
  saveTypes();
  renderTypes();
  updateTypeDropdowns();
}

/* ------------------------------------------------------
   📋 RENDER TYPE LIST
------------------------------------------------------ */
function renderTypes() {
  const list = document.getElementById("typeList");
  if (!list) return;

  if (!window.types.length) {
    list.innerHTML = "<li>No types added.</li>";
    return;
  }

  list.innerHTML = window.types
    .map(t => `<li>${esc(t)}</li>`)
    .join("");
}

/* ------------------------------------------------------
   🔽 UPDATE DROPDOWNS (Stock + Sales)
------------------------------------------------------ */
function updateTypeDropdowns() {
  const addStockType = document.getElementById("ptype");
  const filterStock = document.getElementById("filterType");
  const saleType = document.getElementById("saleType");

  /* Stock → Type selector */
  if (addStockType) {
    addStockType.innerHTML =
      `<option value="">Select</option>` +
      window.types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  }

  /* Stock Filter */
  if (filterStock) {
    filterStock.innerHTML =
      `<option value="all">All Types</option>` +
      window.types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  }

  /* Sales → Type selector */
  if (saleType) {
    saleType.innerHTML =
      `<option value="">All Types</option>` +
      window.types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  }

  /* Product list in sales depends on type → refresh */
  if (typeof refreshSaleSelectors === "function") {
    refreshSaleSelectors();
  }
}

/* ------------------------------------------------------
   🖱 EVENT HANDLERS
------------------------------------------------------ */
document.addEventListener("click", e => {
  if (e.target.id === "addTypeBtn") addType();
  if (e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INITIAL LOAD
------------------------------------------------------ */
window.addEventListener("load", () => {
  renderTypes();
  updateTypeDropdowns();
});
