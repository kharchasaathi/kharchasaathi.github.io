/* ======================================================
   🗂 types.js — Manage Product Categories / Types (FINAL v7.0)
   Compatible with core.js v4+, wanting.js v6+, stock/sales
   ====================================================== */

/* window.types structure:
   [
     { id: "type_xxx", name: "6d glass" },
     { id: "type_xxx", name: "uv glass" }
   ]
*/

/* ------------------------------------------------------
   ➕ ADD TYPE  (Correct: store as object)
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  // prevent duplicates
  if (window.types.find(t => t.name.toLowerCase() === name.toLowerCase()))
    return alert("Type already exists!");

  window.types.push({
    id: uid("type"),
    name
  });

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
    .map(t => `<li>${esc(t.name)}</li>`)
    .join("");
}

/* ------------------------------------------------------
   🔽 UPDATE DROPDOWNS (Stock + Sales + Wanting)
------------------------------------------------------ */
function updateTypeDropdowns() {

  const addStockType = document.getElementById("ptype");
  const filterStock = document.getElementById("filterType");
  const saleType = document.getElementById("saleType");
  const wantType = document.getElementById("wantType");

  /* Stock → Type selector */
  if (addStockType) {
    addStockType.innerHTML =
      `<option value="">Select</option>` +
      window.types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* Stock Filter */
  if (filterStock) {
    filterStock.innerHTML =
      `<option value="all">All Types</option>` +
      window.types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* Sales → Type selector */
  if (saleType) {
    saleType.innerHTML =
      `<option value="all">All Types</option>` +
      window.types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* WANTING → Type selector (IMPORTANT FIX) */
  if (wantType) {
    wantType.innerHTML =
      `<option value="">Select Type</option>` +
      window.types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
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
