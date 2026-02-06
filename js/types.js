/* ======================================================
   🗂 types.js — Product Type Manager (FINAL ONLINE v12)
   ------------------------------------------------------
   ✔ Cloud Master (Firestore)
   ✔ Local = Cache only
   ✔ Logout/Login safe
   ✔ Multi-device sync safe
   ✔ Race-condition fixed
====================================================== */


/* ------------------------------------------------------
   🌐 SAVE WRAPPER (LOCAL + CLOUD)
------------------------------------------------------ */
window.saveTypes = function () {

  try {
    localStorage.setItem(
      "types-data",
      JSON.stringify(window.types || [])
    );
  } catch {}

  if (typeof cloudSaveDebounced === "function") {
    cloudSaveDebounced("types", window.types || []);
  }

  /* Cloud pull re-sync */
  if (typeof cloudPullAllIfAvailable === "function") {
    setTimeout(() => cloudPullAllIfAvailable(), 200);
  }
};


/* ------------------------------------------------------
   📥 LOAD LOCAL CACHE
------------------------------------------------------ */
function loadTypesLocal() {

  try {
    const d = JSON.parse(
      localStorage.getItem("types-data")
    );

    if (Array.isArray(d)) {
      window.types = d;
    }
  } catch {
    window.types = [];
  }
}


/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType() {

  const input = document.getElementById("typeName");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return alert("Enter a valid type name.");

  window.types = window.types || [];

  /* Prevent duplicate */
  if (
    window.types.some(
      t => t.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return alert("Type already exists!");
  }

  window.types.push({
    id: uid("type"),
    name
  });

  window.saveTypes();

  renderTypes();
  updateTypeDropdowns();

  /* Cloud race sync */
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 180);

  input.value = "";
}


/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes() {

  if (!confirm("Delete ALL types?")) return;

  window.types = [];
  window.saveTypes();

  renderTypes();
  updateTypeDropdowns();

  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 200);
}


/* ------------------------------------------------------
   📋 RENDER TYPES
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
   🔽 UPDATE DROPDOWNS
------------------------------------------------------ */
function updateTypeDropdowns() {

  const types = window.types || [];

  const addStockType = document.getElementById("ptype");
  const filterStock  = document.getElementById("filterType");
  const saleType     = document.getElementById("saleType");
  const wantType     = document.getElementById("wantType");

  const options = types
    .map(t =>
      `<option value="${esc(t.name)}">${esc(t.name)}</option>`
    )
    .join("");

  if (addStockType)
    addStockType.innerHTML =
      `<option value="">Select</option>` + options;

  if (filterStock)
    filterStock.innerHTML =
      `<option value="all">All Types</option>` + options;

  if (saleType)
    saleType.innerHTML =
      `<option value="all">All Types</option>` + options;

  if (wantType)
    wantType.innerHTML =
      `<option value="">Select Type</option>` + options;
}


/* ------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------ */
document.addEventListener("click", e => {

  if (e.target.id === "addTypeBtn")
    addType();

  if (e.target.id === "clearTypesBtn")
    clearTypes();
});


/* ------------------------------------------------------
   ☁️ CLOUD SYNC LISTENER
   (Triggered after cloudPullAllIfAvailable)
------------------------------------------------------ */
window.addEventListener("cloud-data-loaded", () => {

  renderTypes();
  updateTypeDropdowns();
});


/* ------------------------------------------------------
   🚀 INIT
------------------------------------------------------ */
window.addEventListener("load", () => {

  /* 1️⃣ Load local cache first */
  loadTypesLocal();

  /* Ensure array */
  window.types = window.types || [];

  /* 2️⃣ Initial render */
  renderTypes();
  updateTypeDropdowns();

  /* 3️⃣ Cloud overwrite render */
  setTimeout(() => {
    renderTypes();
    updateTypeDropdowns();
  }, 250);
});
