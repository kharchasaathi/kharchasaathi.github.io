/* ==========================================================
   🛒 wanting.js — Wanting (Re-order) List Manager
   Works with: core.js, stock.js, sales.js
   Storage Key: wanting-data
   ========================================================== */

window.wanting = JSON.parse(localStorage.getItem("wanting-data") || "[]");

/* ==========================================================
   RENDER WANTING LIST
========================================================== */
function renderWanting() {
  const tbody = document.querySelector("#wantingTable tbody");
  if (!tbody) return;

  if (!window.wanting.length) {
    tbody.innerHTML = `<tr><td colspan="5">No items in Wanting list</td></tr>`;
    return;
  }

  tbody.innerHTML = window.wanting
    .map((w, i) => `
      <tr>
        <td>${w.date}</td>
        <td>${esc(w.type)}</td>
        <td>${esc(w.name)}</td>
        <td>${esc(w.note || "")}</td>
        <td>
          <button class="want-edit" data-i="${i}" title="Edit">✏️</button>
          <button class="want-remove" data-i="${i}" title="Remove">🗑️</button>
        </td>
      </tr>
    `)
    .join("");
}

/* ==========================================================
   MANUAL ADD WANTING ITEM
========================================================== */
function addWanting() {
  const type = document.getElementById("wantType")?.value.trim() || "";
  const name = document.getElementById("wantName")?.value.trim();
  const note = document.getElementById("wantNote")?.value.trim() || "";

  if (!name) return alert("Please enter product name");

  const entry = {
    date: todayDate(),
    type,
    name,
    note
  };

  window.wanting.push(entry);
  saveWanting();
  renderWanting();

  if (document.getElementById("wantName")) document.getElementById("wantName").value = "";
  if (document.getElementById("wantNote")) document.getElementById("wantNote").value = "";
}

/* ==========================================================
   AUTO ADD WANTING ITEM (From Stock when finished)
========================================================== */
function autoAddToWanting(obj) {
  if (!obj || !obj.name) return;

  // prevent duplicates
  const exists = window.wanting.find(
    w =>
      w.name.toLowerCase() === obj.name.toLowerCase() &&
      w.type === obj.type
  );

  if (exists) return;

  window.wanting.push({
    date: obj.date || todayDate(),
    type: obj.type || "",
    name: obj.name,
    note: obj.note || "Auto Added"
  });

  saveWanting();
  renderWanting();
}

/* ==========================================================
   EDIT WANTING
========================================================== */
function editWant(index) {
  index = parseInt(index);
  if (!window.wanting[index]) return;

  const cur = window.wanting[index];

  const newName = prompt("Product Name:", cur.name);
  if (!newName) return;

  const newType = prompt("Type:", cur.type);
  const newNote = prompt("Note:", cur.note);

  window.wanting[index] = {
    date: todayDate(),
    type: newType || "",
    name: newName,
    note: newNote || ""
  };

  saveWanting();
  renderWanting();
}

/* ==========================================================
   REMOVE WANTING
========================================================== */
function removeWant(index) {
  index = parseInt(index);
  if (!window.wanting[index]) return;

  if (!confirm("Remove this item?")) return;

  window.wanting.splice(index, 1);
  saveWanting();
  renderWanting();
}

/* ==========================================================
   CLEAR ENTIRE WANTING LIST
========================================================== */
function clearWanting() {
  if (!confirm("Clear entire Wanting list?")) return;

  window.wanting = [];
  saveWanting();
  renderWanting();
}

/* ==========================================================
   PRINT WANTING LIST
========================================================== */
function printWanting() {
  const rows = document.querySelector("#wantingTable tbody").innerHTML;

  const html = `
  <html>
  <head>
    <title>Wanting List</title>
    <style>
      table { width:100%; border-collapse:collapse; }
      th,td { border:1px solid #ccc; padding:6px; }
    </style>
  </head>
  <body>
    <h3>Wanting List — ${todayDate()}</h3>
    <table>
      <thead>
        <tr><th>Date</th><th>Type</th><th>Product</th><th>Note</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
}

/* ==========================================================
   EVENT LISTENERS
========================================================== */
document.addEventListener("click", e => {
  if (e.target.id === "addWantBtn") addWanting();
  if (e.target.id === "clearWantBtn") clearWanting();
  if (e.target.id === "printWantBtn") printWanting();

  if (e.target.classList.contains("want-remove"))
    removeWant(e.target.dataset.i);

  if (e.target.classList.contains("want-edit"))
    editWant(e.target.dataset.i);
});

/* ==========================================================
   INITIAL LOAD
========================================================== */
window.addEventListener("load", () => {
  renderWanting();

  if (typeof updateTypeDropdowns === "function")
    updateTypeDropdowns();
});

/* ==========================================================
   EXPORT FUNCTIONS
========================================================== */
window.autoAddToWanting = autoAddToWanting;
window.renderWanting = renderWanting;
