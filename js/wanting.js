// js/wanting.js — Auto Wanting + Reminder System
(function(){
  console.log("✅ wanting.js module loaded");

  const WANT_KEY = "wanting-data";

  // Load previous data
  window.wanting = JSON.parse(localStorage.getItem(WANT_KEY) || "[]");

  // 💾 Save Wanting Data
  function saveWanting(){
    localStorage.setItem(WANT_KEY, JSON.stringify(wanting));
  }

  // ➕ Add new Wanting Item (manual)
  function addWantingItem(){
    const t = prompt("Enter Type:");
    if(!t) return;
    const n = prompt("Enter Product Name:");
    if(!n) return;
    const note = prompt("Add Note (optional):") || "Manual entry";
    const d = new Date().toISOString().split("T")[0];
    wanting.push({date: d, type: t, name: n, note});
    saveWanting();
    renderWanting();
    alert("✅ Added to Wanting List");
  }

  // ❌ Clear all wanting
  function clearWanting(){
    if(!confirm("Clear all Wanting items?")) return;
    wanting = [];
    saveWanting();
    renderWanting();
  }

  // 🧾 Render Wanting List
  window.renderWanting = function(){
    const el = document.getElementById("wantingList");
    if(!el) return;
    if(!wanting.length){
      el.innerHTML = `<tr><td colspan="4" style="opacity:.6">No items in wanting list</td></tr>`;
      return;
    }
    el.innerHTML = wanting.map((w,i)=>`
      <tr>
        <td>${w.date}</td>
        <td>${w.type}</td>
        <td>${w.name}</td>
        <td>${w.note || ""}</td>
        <td><button class="remove-want" data-i="${i}">🗑</button></td>
      </tr>
    `).join("");
  };

  // 🗑 Remove single wanting item
  function removeWant(i){
    wanting.splice(i,1);
    saveWanting();
    renderWanting();
  }

  // 🔁 Auto Add when stock empty (hooked in sales.js)
  window.autoAddWanting = function(type, name){
    const d = new Date().toISOString().split("T")[0];
    const exists = wanting.find(w=>w.name.toLowerCase()===name.toLowerCase());
    if(exists) return;
    wanting.push({date:d,type,name,note:"Auto-added (Out of Stock)"});
    saveWanting();
    renderWanting();
  };

  // 🔔 Reminder notifier (local)
  function checkReminders(){
    const today = new Date().toISOString().split("T")[0];
    if(!wanting.length) return;
    const pending = wanting.filter(w=>!w.cleared);
    if(pending.length){
      console.log("🔔 Reminder:", pending.length, "items pending in Wanting list.");
    }
  }

  // 🖱 Event Listeners
  document.addEventListener("click", e=>{
    if(e.target.id === "addWantBtn") addWantingItem();
    if(e.target.id === "clearWantBtn") clearWanting();
    if(e.target.classList.contains("remove-want")) removeWant(e.target.dataset.i);
  });

  // 🚀 Init
  window.addEventListener("load", ()=>{
    renderWanting();
    checkReminders();
    setInterval(checkReminders, 60000);
  });

})();
