/* ======================================================
   🗂 types.js — Product Type Manager (FINAL ONLINE v8.0)
   • Fully compatible with new core.js cloud system
   • Instant UI update (no refresh delay)
   • Prevents duplicate types
   • Updates Stock + Sales + Wanting dropdowns automatically
====================================================== */

/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  // Prevent duplicates
  if ((window.types || []).find(t => t.name.toLowerCase() === name.toLowerCase())) {
    return alert("Type already exists!");
  }

  // Push new object
  window.types.push({
    id: uid("type"),
    name
  });

  // Save (Local + Cloud)
  if (window.saveTypes) window.saveTypes();

  // Refresh UI
  renderTypes();
  updateTypeDropdowns();

  input.value = "";
}

/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {
  if (!confirm("Delete ALL types?")) return;

  window.types = [];
  if (window.saveTypes) window.saveTypes();

  renderTypes();
  updateTypeDropdowns();
}

/* ------------------------------------------------------
   📋 RENDER TYPE LIST
------------------------------------------------------ */
function renderTypes() {
  const list = document.getElementById("typeList");
  if (!list) return;

  const types = window.types || [];

  if (!types.length) {
    list.innerHTML = "<li>No types added.</li>";
    return;
  }

  list.innerHTML = types
    .map(t => `<li>${esc(t.name)}</li>`)
    .join("");
}

/* ------------------------------------------------------
   🔽 UPDATE DROPDOWNS (Stock + Sales + Wanting)
------------------------------------------------------ */
function updateTypeDropdowns() {

  const types = window.types || [];

  const addStockType = document.getElementById("ptype");
  const filterStock  = document.getElementById("filterType");
  const saleType     = document.getElementById("saleType");
  const wantType     = document.getElementById("wantType");

  /* STOCK → Add stock selector */
  if (addStockType) {
    addStockType.innerHTML =
      `<option value="">Select</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* STOCK FILTER */
  if (filterStock) {
    filterStock.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* SALES FILTER */
  if (saleType) {
    saleType.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* WANTING → Type selector */
  if (wantType) {
    wantType.innerHTML =
      `<option value="">Select Type</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }
}

/* ------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------ */
document.addEventListener("click", e => {
  if (e.target.id === "addTypeBtn") addType();
  if (e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INIT
------------------------------------------------------ */
window.addEventListener("load", () => {
  renderTypes();
  updateTypeDropdowns();
});
