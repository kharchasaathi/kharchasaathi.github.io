/* ======================================================
   🗂 types.js — FINAL STABLE v10
   • Auto-safe window.types
   • Cloud-safe rendering (no race)
   • Clean dropdown updates
   • Prevent duplicate types
====================================================== */

/* Ensure global array */
window.types = Array.isArray(window.types) ? window.types : [];

/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  // Prevent duplicates
  const exists = window.types.some(
    t => t.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) return alert("Type already exists!");

  window.types.push({
    id: uid("type"),
    name
  });

  // Save (Local + Cloud)
  window.saveTypes?.();

  refreshTypesUI();
  input.value = "";
}

/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {
  if (!confirm("Delete ALL types?")) return;

  window.types = [];
  window.saveTypes?.();

  refreshTypesUI();
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

  const stockType = document.getElementById("ptype");
  const filterStock = document.getElementById("filterType");
  const saleType = document.getElementById("saleType");
  const wantType = document.getElementById("wantType");

  /* STOCK → Add to stock dropdown */
  if (stockType) {
    stockType.innerHTML =
      `<option value="">Select</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
  }

  /* STOCK FILTER */
  if (filterStock) {
    const current = filterStock.value || "all";
    filterStock.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
    filterStock.value = current;
  }

  /* SALES FILTER */
  if (saleType) {
    const current = saleType.value || "all";
    saleType.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
    saleType.value = current;
  }

  /* WANTING LIST */
  if (wantType) {
    const current = wantType.value || "";
    wantType.innerHTML =
      `<option value="">Select Type</option>` +
      types.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join("");
    wantType.value = current;
  }
}

/* ------------------------------------------------------
   🔄 SAFE REFRESH (avoid cloud race condition)
------------------------------------------------------ */
function refreshTypesUI() {
  renderTypes();
  updateTypeDropdowns();

  // Also refresh dependent modules
  renderStock?.();
  renderSales?.();
  renderWanting?.();
}

/* ------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------ */
document.addEventListener("click", e => {
  if (e.target.id === "addTypeBtn") addType();
  if (e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INIT (after cloud pull)
------------------------------------------------------ */
window.addEventListener("load", () => {
  refreshTypesUI();
});

window.renderTypes = renderTypes;
window.updateTypeDropdowns = updateTypeDropdowns;
