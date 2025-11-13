// wanting.js — Wanting Module
console.log("Wanting module loaded");

// Load on init
window.moduleInit = function(id) {
  if (id === "wanting") renderWanting();
};

const WANTING_KEY = "wanting-data";

// Render Wanting list
window.renderWanting = function () {
  const box = document.getElementById("wantingContainer");

  let list = JSON.parse(localStorage.getItem(WANTING_KEY) || "[]");

  // Empty UI
  box.innerHTML = `
    <h3>Add Item</h3>
    <input id="wantText" placeholder="Enter item" />
    <button id="wantAddBtn">Add</button>

    <h3 style="margin-top:20px;">Your Wanting List</h3>
    <ul id="wantList"></ul>
  `;

  // Buttons
  document.getElementById("wantAddBtn").onclick = () => {
    const val = document.getElementById("wantText").value.trim();
    if (!val) return alert("Enter item name!");

    list.push(val);
    localStorage.setItem(WANTING_KEY, JSON.stringify(list));

    // Cloud save
    if (typeof cloudSave === "function")
      cloudSave("wanting", list);

    renderWanting();
  };

  // Fill list
  const ul = document.getElementById("wantList");

  if (list.length === 0) {
    ul.innerHTML = "<p>No items added yet.</p>";
    return;
  }

  list.forEach((item, i) => {
    const li = document.createElement("li");
    li.style.margin = "8px 0";
    li.style.listStyle = "none";

    li.innerHTML = `
      ${item}
      <button style="
        float:right;
        background:red;
        color:white;
        border:none;
        padding:4px 8px;
        border-radius:6px;
        cursor:pointer;">Delete</button>
    `;

    // Delete item
    li.querySelector("button").onclick = () => {
      list.splice(i, 1);
      localStorage.setItem(WANTING_KEY, JSON.stringify(list));

      // Cloud Save
      if (typeof cloudSave === "function")
        cloudSave("wanting", list);

      renderWanting();
    };

    ul.appendChild(li);
  });
};
