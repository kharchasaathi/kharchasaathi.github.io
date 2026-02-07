/* ======================================================
   🗂 types.js — Product Type Manager
   CLOUD ONLY — FINAL v14
   ------------------------------------------------------
   ✔ No localStorage
   ✔ Logout/Login safe
   ✔ Multi-device sync safe
   ✔ Cloud overwrite safe
====================================================== */


/* ------------------------------------------------------
   🔁 SAFE RENDER WRAPPER
------------------------------------------------------ */
function safeRenderTypes(){

  renderTypes();
  updateTypeDropdowns();
}


/* ------------------------------------------------------
   ➕ ADD TYPE
------------------------------------------------------ */
function addType(){

  const input=document.getElementById("typeName");
  if(!input) return;

  const name=input.value.trim();
  if(!name) return alert("Enter a valid type name.");

  window.types=window.types||[];

  /* Prevent duplicate */
  if(
    window.types.some(
      t=>t.name.toLowerCase()===name.toLowerCase()
    )
  ){
    return alert("Type already exists!");
  }

  window.types.push({
    id:uid("type"),
    name
  });

  /* ☁️ Cloud save */
  saveTypes?.();

  safeRenderTypes();

  input.value="";
}


/* ------------------------------------------------------
   ❌ CLEAR ALL TYPES
------------------------------------------------------ */
function clearTypes(){

  if(!confirm("Delete ALL types?")) return;

  window.types=[];

  /* ☁️ Cloud save */
  saveTypes?.();

  safeRenderTypes();
}


/* ------------------------------------------------------
   📋 RENDER TYPES
------------------------------------------------------ */
function renderTypes(){

  const list=document.getElementById("typeList");
  if(!list) return;

  const types=window.types||[];

  if(!types.length){
    list.innerHTML="<li>No types added.</li>";
    return;
  }

  list.innerHTML=types
    .map(t=>`<li>${esc(t.name)}</li>`)
    .join("");
}


/* ------------------------------------------------------
   🔽 UPDATE DROPDOWNS
------------------------------------------------------ */
function updateTypeDropdowns(){

  const types=window.types||[];

  const addStockType=document.getElementById("ptype");
  const filterStock=document.getElementById("filterType");
  const saleType=document.getElementById("saleType");
  const wantType=document.getElementById("wantType");

  const options=types
    .map(t=>
      `<option value="${esc(t.name)}">${esc(t.name)}</option>`
    )
    .join("");

  if(addStockType)
    addStockType.innerHTML=
      `<option value="">Select</option>`+options;

  if(filterStock)
    filterStock.innerHTML=
      `<option value="all">All Types</option>`+options;

  if(saleType)
    saleType.innerHTML=
      `<option value="all">All Types</option>`+options;

  if(wantType)
    wantType.innerHTML=
      `<option value="">Select Type</option>`+options;
}


/* ------------------------------------------------------
   🖱 EVENTS
------------------------------------------------------ */
document.addEventListener("click",e=>{

  if(e.target.id==="addTypeBtn")
    addType();

  if(e.target.id==="clearTypesBtn")
    clearTypes();
});


/* ------------------------------------------------------
   ☁️ CLOUD SYNC LISTENER
------------------------------------------------------ */
window.addEventListener(
  "cloud-data-loaded",
  ()=>{
    safeRenderTypes();
  }
);


/* ------------------------------------------------------
   🚀 INIT
------------------------------------------------------ */
window.addEventListener("load",()=>{

  /* Cloud pull renders automatically */
  safeRenderTypes();

  /* Retry after pull delay */
  setTimeout(safeRenderTypes,400);
  setTimeout(safeRenderTypes,800);

});
