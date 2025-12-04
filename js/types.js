/* ======================================================
   🗂 types.js — FINAL STABLE v10 (FIXED)
   • Auto-safe window.types
   • Cloud-safe rendering (no race)
   • Clean dropdown updates
   • Prevent duplicate types
   • Added small safety guards to avoid console errors
====================================================== */

/* Ensure global array */
window.types = Array.isArray(window.types) ? window.types : [];

/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = (input.value || "").trim();
  if (!name) return alert("Enter a valid type name.");

  // Prevent duplicates (safe guard if t.name missing)
  const exists = (window.types || []).some(
    t => String(t.name || "").toLowerCase() === name.toLowerCase()
  );
  if (exists) return alert("Type already exists!");

  window.types.push({
    id: (typeof uid === "function") ? uid("type") : ("type_" + Math.random().toString(36).slice(2,9)),
    name
  });

  // Save (Local + Cloud) — safe call
  if (typeof window.saveTypes === "function") window.saveTypes();

  refreshTypesUI();
  input.value = "";
}

/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {
  if (!confirm("Delete ALL types?")) return;

  window.types = [];
  if (typeof window.saveTypes === "function") window.saveTypes();

  refreshTypesUI();
}

/* ------------------------------------------------------
   📋 RENDER TYPE LIST
------------------------------------------------------ */
function renderTypes() {
  const list = document.getElementById("typeList");
  if (!list) return;

  const types = Array.isArray(window.types) ? window.types : [];

  if (!types.length) {
    list.innerHTML = "<li>No types added.</li>";
    return;
  }

  list.innerHTML = types
    .map(t => `<li>${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}</li>`)
    .join("");
}

/* ------------------------------------------------------
   🔽 UPDATE DROPDOWNS (Stock + Sales + Wanting)
------------------------------------------------------ */
function updateTypeDropdowns() {
  const types = Array.isArray(window.types) ? window.types : [];

  const stockType = document.getElementById("ptype");
  const filterStock = document.getElementById("filterType");
  const saleType = document.getElementById("saleType");
  const wantType = document.getElementById("wantType");

  /* STOCK → Add to stock dropdown */
  if (stockType) {
    stockType.innerHTML =
      `<option value="">Select</option>` +
      types.map(t => `<option value="${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}">${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}</option>`).join("");
  }

  /* STOCK FILTER */
  if (filterStock) {
    const current = filterStock.value || "all";
    filterStock.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}">${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}</option>`).join("");
    try { filterStock.value = current; } catch (e) {}
  }

  /* SALES FILTER */
  if (saleType) {
    const current = saleType.value || "all";
    saleType.innerHTML =
      `<option value="all">All Types</option>` +
      types.map(t => `<option value="${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}">${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}</option>`).join("");
    try { saleType.value = current; } catch (e) {}
  }

  /* WANTING LIST */
  if (wantType) {
    const current = wantType.value || "";
    wantType.innerHTML =
      `<option value="">Select Type</option>` +
      types.map(t => `<option value="${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}">${(typeof esc === "function") ? esc(t.name) : String(t.name || "")}</option>`).join("");
    try { wantType.value = current; } catch (e) {}
  }
}

/* ------------------------------------------------------
   🔄 SAFE REFRESH (avoid cloud race condition)
------------------------------------------------------ */
function refreshTypesUI() {
  renderTypes();
  updateTypeDropdowns();

  // Also refresh dependent modules (safe calls)
  try { if (typeof renderStock === "function") renderStock(); } catch (e) {}
  try { if (typeof renderSales === "function") renderSales(); } catch (e) {}
  try { if (typeof renderWanting === "function") renderWanting(); } catch (e) {}
}

/* ------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------ */
document.addEventListener("click", e => {
  if (e.target && e.target.id === "addTypeBtn") addType();
  if (e.target && e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INIT (after cloud pull)
------------------------------------------------------ */
window.addEventListener("load", () => {
  refreshTypesUI();
});

/* Expose for other modules/tests */
window.renderTypes = renderTypes;
window.updateTypeDropdowns = updateTypeDropdowns;
