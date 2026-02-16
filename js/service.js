/* ===========================================================
   service.js — FINAL MERGED RESTORE BUILD
   LOCAL + CLOUD + SETTLEMENT SAFE + UNIVERSAL ALIGNED
   FILTERS + HELPERS RESTORED
=========================================================== */

(function () {

/* -------------------------------------------------- HELPERS */
const qs = s => document.querySelector(s);
const esc = v => (v == null ? "" : String(v));
const num = v => isNaN(v = Number(v)) ? 0 : v;
const toDisplay = window.toDisplay || (d => d);
const toInternal = window.toInternalIfNeeded || (d => d);
const today = () => new Date().toISOString().slice(0, 10);

/* -------------------------------------------------- LOAD LOCAL CACHE */
(function initServiceStore(){
  try{
    const raw = localStorage.getItem("service-data");
    window.services = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(window.services))
      window.services = [];
  }catch{
    window.services = [];
  }
})();

const ensureServices = () => {
  if(!Array.isArray(window.services))
    window.services = [];
  return window.services;
};

/* -------------------------------------------------- SAVE */
function saveServices(){

  /* LOCAL */
  try{
    localStorage.setItem(
      "service-data",
      JSON.stringify(window.services)
    );
  }catch{}

  /* CLOUD */
  cloudSaveDebounced?.(
    "services",
    window.services
  );

  /* CLOUD PULL */
  if(typeof cloudPullAllIfAvailable==="function"){
    setTimeout(
      ()=>cloudPullAllIfAvailable(),
      200
    );
  }

  /* LIVE EVENT */
  window.dispatchEvent(
    new Event("services-updated")
  );
}

/* -------------------------------------------------- FORM CLEAR */
function clearAddForm(){

  [
    "#svcCustomer",
    "#svcPhone",
    "#svcModel",
    "#svcProblem",
    "#svcAdvance"
  ].forEach(id=>{
    const el=qs(id);
    if(el) el.value="";
  });

  const d=qs("#svcReceivedDate");
  if(d) d.value=today();
}

/* -------------------------------------------------- DATE FILTER */
function buildDateFilter(){

  const sel=qs("#svcFilterDate");
  if(!sel) return;

  const set=new Set();

  ensureServices().forEach(j=>{
    if(j.date_in) set.add(j.date_in);
    if(j.date_out) set.add(j.date_out);
  });

  sel.innerHTML=
    `<option value="">All Dates</option>`+
    [...set]
      .sort((a,b)=>b.localeCompare(a))
      .map(d=>
        `<option value="${d}">
          ${toDisplay(d)}
        </option>`
      ).join("");
}

/* -------------------------------------------------- FILTER HELPERS (RESTORED) */
function clearCalendar(){
  qs("#svcFilterCalendar") &&
  (qs("#svcFilterCalendar").value="");
}

function clearDropdown(){
  qs("#svcFilterDate") &&
  (qs("#svcFilterDate").value="");
}

/* -------------------------------------------------- FILTER ENGINE */
function getFiltered(){

  const list=ensureServices();

  const typeVal=
    qs("#svcFilterType")?.value||"all";

  const statusVal=
    (qs("#svcFilterStatus")?.value||"all")
      .toLowerCase();

  const dropDate=
    qs("#svcFilterDate")?.value||"";

  const calendarDate=
    qs("#svcFilterCalendar")?.value||"";

  const dateVal=calendarDate||dropDate;

  let out=[...list];

  if(typeVal!=="all")
    out=out.filter(j=>j.item===typeVal);

  out=out.filter(j=>{
    const s=j.status;

    if(statusVal==="all") return true;
    if(statusVal==="pending") return s==="pending";
    if(statusVal==="completed")
      return s==="paid"&&!j.fromCredit;
    if(statusVal==="credit") return s==="credit";
    if(statusVal==="credit-paid")
      return s==="paid"&&j.fromCredit;
    if(statusVal==="failed") return s==="failed";

    return true;
  });

  if(dateVal)
    out=out.filter(j=>
      j.date_in===dateVal||
      j.date_out===dateVal
    );

  return out;
}

/* -------------------------------------------------- COUNTS */
function renderCounts(){

  const list=ensureServices();

  const pending=
    list.filter(j=>j.status==="pending").length;

  const completed=
    list.filter(j=>j.status==="paid").length;

  const profit=
    list.filter(j=>j.status==="paid")
        .reduce((a,b)=>a+num(b.profit),0);

  qs("#svcPendingCount") &&
    (qs("#svcPendingCount").textContent=pending);

  qs("#svcCompletedCount") &&
    (qs("#svcCompletedCount").textContent=completed);

  qs("#svcTotalProfit") &&
    (qs("#svcTotalProfit").textContent="₹"+profit);
}

/* -------------------------------------------------- TABLES */
function renderTables(){

  const pendBody=qs("#svcTable tbody");
  const histBody=qs("#svcHistoryTable tbody");

  const f=getFiltered();

  const pending=f.filter(j=>j.status==="pending");
  const history=f.filter(j=>j.status!=="pending");

  if(pendBody)
    pendBody.innerHTML=pending.length
      ? pending.map(j=>`
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.phone)}</td>
          <td>${esc(j.item)}</td>
          <td>${esc(j.model)}</td>
          <td>${esc(j.problem)}</td>
          <td>Pending</td>
          <td>
            <button class="small-btn svc-view"
              data-id="${j.id}">
              View / Update
            </button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="9">No pending jobs</td></tr>`;

  if(histBody)
    histBody.innerHTML=history.length
      ? history.map(j=>`
        <tr>
          <td>${j.jobId}</td>
          <td>${toDisplay(j.date_in)}</td>
          <td>${j.date_out?toDisplay(j.date_out):"-"}</td>
          <td>${esc(j.customer)}</td>
          <td>${esc(j.phone)}</td>
          <td>${esc(j.item)}</td>
          <td>₹${j.invest}</td>
          <td>₹${j.paid}</td>
          <td>₹${j.profit}</td>
          <td>
            ${
              j.status==="credit"
              ? `Credit
                 <button class="small-btn"
                   onclick="collectServiceCredit('${j.id}')">
                   Collect
                 </button>`
              : j.status
            }
          </td>
        </tr>`).join("")
      : `<tr><td colspan="10">No history</td></tr>`;
}

/* -------------------------------------------------- PIE */
let pieStatus=null;

function drawPieStatus(){

  const el=qs("#svcPieStatus");
  if(!el||typeof Chart==="undefined") return;

  const list=ensureServices();

  const values=[
    list.filter(j=>j.status==="pending").length,
    list.filter(j=>j.status==="credit").length,
    list.filter(j=>j.status==="paid").length,
    list.filter(j=>j.status==="failed").length
  ];

  pieStatus?.destroy();

  pieStatus=new Chart(el,{
    type:"pie",
    data:{
      labels:["Pending","Credit","Completed","Failed"],
      datasets:[{
        data:
          values.some(v=>v>0)
          ? values
          : [1,0,0,0]
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}

/* -------------------------------------------------- MONEY */
function renderMoneyList(){

  const box=qs("#svcMoneyBox");
  if(!box) return;

  let cash=0,credit=0,collected=0,profit=0;

  ensureServices().forEach(j=>{

    if(j.status==="paid"&&!j.fromCredit)
      cash+=j.paid;

    if(j.status==="credit")
      credit+=j.remaining;

    if(j.status==="paid"){
      collected+=j.paid;
      profit+=j.profit;
    }
  });

  box.innerHTML=`
    <h4>💰 Service Financial Summary</h4>
    <ul style="line-height:1.8;font-size:14px">
      <li>💵 Cash Collected: <b>₹${cash}</b></li>
      <li>🕒 Credit Pending: <b>₹${credit}</b></li>
      <li>✅ Total Collected: <b>₹${collected}</b></li>
      <li>📈 Total Profit: <b>₹${profit}</b></li>
    </ul>`;
}

/* -------------------------------------------------- ADD JOB */
function addJob(){

  const list=ensureServices();

  const job={
    id:uid("svc"),
    jobId:String(list.length+1).padStart(2,"0"),
    date_in:toInternal(
      qs("#svcReceivedDate")?.value||today()
    ),
    date_out:"",
    customer:esc(qs("#svcCustomer")?.value).trim(),
    phone:esc(qs("#svcPhone")?.value).trim(),
    item:qs("#svcItemType")?.value||"Other",
    model:esc(qs("#svcModel")?.value),
    problem:esc(qs("#svcProblem")?.value),
    advance:num(qs("#svcAdvance")?.value),
    invest:0,
    paid:0,
    remaining:0,
    profit:0,
    status:"pending",
    fromCredit:false
  };

  if(!job.customer||!job.phone||!job.problem)
    return alert("Fill all fields");

  list.push(job);

  saveServices();
  clearAddForm();
  buildDateFilter();
  refresh();
}

/* -------------------------------------------------- COMPLETE */
function completeJob(id,mode){

  const j=ensureServices().find(x=>x.id===id);
  if(!j) return;

  const invest=num(prompt("Repair Investment ₹:",j.invest));
  const total=num(prompt("Total Bill ₹:",j.paid));
  if(!total) return;

  j.invest=invest;
  j.date_out=today();

  if(mode==="paid"){
    j.status="paid";
    j.paid=total;
    j.remaining=0;
    j.profit=total-invest;
  }else{
    j.status="credit";
    j.paid=j.advance;
    j.remaining=total-j.advance;
    j.profit=0;
  }

  saveServices();
  buildDateFilter();
  refresh();
}

/* -------------------------------------------------- CREDIT COLLECT */
window.collectServiceCredit=function(id){

  const j=ensureServices().find(x=>x.id===id);
  if(!j||j.status!=="credit") return;

  if(!confirm(`Collect ₹${j.remaining}?`)) return;

  window.addCollectionEntry?.(
    "Service Credit Cleared",
    `${j.customer} — ${j.item}`,
    j.remaining
  );

  j.paid+=j.remaining;
  j.remaining=0;
  j.status="paid";
  j.fromCredit=true;
  j.profit=j.paid-j.invest;

  saveServices();
  refresh();
};

/* -------------------------------------------------- FAIL */
function failJob(id){

  const j=ensureServices().find(x=>x.id===id);
  if(!j) return;

  j.status="failed";
  j.date_out=today();
  j.invest=j.paid=j.remaining=j.profit=0;

  saveServices();
  refresh();
}

/* -------------------------------------------------- REFRESH */
function refresh(){

  renderCounts();
  renderTables();
  drawPieStatus();
  renderMoneyList();

  window.updateUniversalBar?.();
  window.renderAnalytics?.();
}

window.__svcRefresh=refresh;

/* -------------------------------------------------- EVENTS (RESTORED) */
document.addEventListener("click",e=>{

  const btn=e.target.closest(".svc-view");
  if(!btn) return;

  const id=btn.dataset.id;

  const ch=prompt(
    "1 - Paid\n2 - Credit\n3 - Failed"
  );

  if(ch==="1") completeJob(id,"paid");
  else if(ch==="2") completeJob(id,"credit");
  else if(ch==="3") failJob(id);
});

qs("#addServiceBtn")
?.addEventListener("click",addJob);

/* FILTER EVENTS RESTORED */
qs("#svcFilterStatus")
?.addEventListener("change",refresh);

qs("#svcFilterType")
?.addEventListener("change",refresh);

qs("#svcFilterDate")
?.addEventListener("change",()=>{
  clearCalendar();
  refresh();
});

qs("#svcFilterCalendar")
?.addEventListener("change",()=>{
  clearDropdown();
  refresh();
});
   /* -------------------------------------------------- CLEAR ALL */
qs("#clearServiceBtn")
?.addEventListener("click",()=>{

  if(!confirm("Delete ALL service history?")) return;

  window.services = [];

  saveServices();
  buildDateFilter();
  refresh();
});

/* -------------------------------------------------- INIT */
window.addEventListener("load",()=>{
  buildDateFilter();
  refresh();
});

})();
