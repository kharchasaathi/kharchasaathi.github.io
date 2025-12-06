/* ======================================================
   🗂 types.js — Product Type Manager (FINAL ONLINE v8.1)
   • 💡 FIX: Uses window.addType from core.js
   • Fully compatible with new core.js cloud system
   • Instant UI update (no refresh delay)
   • Updates Stock + Sales + Wanting dropdowns automatically
====================================================== */

/* ------------------------------------------------------
   ⭐ NEW: ADD TYPE (uses core.js logic)
------------------------------------------------------ */
// 'addType' బదులు 'handleAddType' అని పేరు మార్చి, core.js లోని window.addType ను కాల్ చేస్తున్నాము.
function handleAddType() {
  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  // Call the robust function from core.js
  // core.js లో నిర్వచించిన window.addType(name) ను ఉపయోగిస్తుంది.
  if (typeof window.addType === "function") {
    window.addType(name); 
  } else {
    // Fallback: If core.js did not load, use old safe logic (less robust)
    if ((window.types || []).find(t => t.name.toLowerCase() === name.toLowerCase())) {
        return alert("Type already exists!");
    }
    // ఇక్కడ window.types కు push చేసే ముందు అది Array అని నిర్ధారించుకోవడం ముఖ్యం.
    (window.types = Array.isArray(window.types) ? window.types : []).push({ id: uid("type"), name });
    if (window.saveTypes) window.saveTypes();
  }

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
  const table = document.getElementById("typesTable");
  if (!table) return;

  const types = window.types || [];
  table.innerHTML = types
    .map((t, i) => `
      <tr>
        <td data-label="Name">${t.name}</td>
        <td data-label="Action">
          <button class="small-btn" 
                  onclick="deleteType('${t.id}')"
                  style="background:#d32f2f;color:white;">
            🗑 Delete
          </button>
        </td>
      </tr>
    `)
    .join("");
}
window.renderTypes = renderTypes;

/* ------------------------------------------------------
   🗑 DELETE TYPE
------------------------------------------------------ */
function deleteType(id) {
  if (!confirm("Delete this type?")) return;

  const initialLength = (window.types || []).length;
  window.types = (window.types || []).filter(t => t.id !== id);

  if ((window.types || []).length !== initialLength) {
    if (window.saveTypes) window.saveTypes();
    renderTypes();
    updateTypeDropdowns();
  }
}
window.deleteType = deleteType;


/* ------------------------------------------------------
   🔄 UPDATE DROPDOWNS (Stock, Sales, Wanting tabs)
------------------------------------------------------ */
window.updateTypeDropdowns = function () {
  const types          = window.types || [];
  const esc            = window.esc || (x => x); // Use esc from core.js

  const addStockType   = document.getElementById("addStockType");
  const filterStock    = document.getElementById("filterType");
  const saleType       = document.getElementById("saleType");
  const wantType       = document.getElementById("wantType");

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
  if (e.target.id === "addTypeBtn") handleAddType(); // <-- ఫంక్షన్ పేరు మార్చబడింది
  if (e.target.id === "clearTypesBtn") clearTypes();
});

/* ------------------------------------------------------
   🚀 INIT
------------------------------------------------------ */
window.addEventListener("load", () => {
  renderTypes();
  updateTypeDropdowns();
});
