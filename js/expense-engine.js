/* ===========================================================
   EXPENSE ENGINE v6
   Business Expense Recording System (Firestore + Full Report)
=========================================================== */

(function(){

if(window.__expenseEngineLoaded) return;
window.__expenseEngineLoaded = true;

console.log("%c💸 Expense Engine Loading...","color:#dc2626;font-weight:bold;");


/* ===========================================================
   GLOBAL STORE
=========================================================== */

window.expenses = [];


/* ===========================================================
   SAFE NUMBER
=========================================================== */

const num = v => isNaN(v = Number(v)) ? 0 : v;


/* ===========================================================
   LOAD EXPENSES FROM FIRESTORE
=========================================================== */

async function loadExpenses(){

  if(!window.ledgerEngine) return;

  const user = auth?.currentUser;
  if(!user) return;

  const date = ledgerEngine.getDateKey();

  try{

    const doc = await db
      .collection("users")
      .doc(user.uid)
      .collection("ledger")
      .doc(date)
      .get();

    const data = doc.data() || {};

    window.expenses = data.expenses || [];

    renderExpenses();

  }catch(err){

    console.error("Expense load failed",err);

  }

}

window.addEventListener("ledger-ready",loadExpenses);


/* ===========================================================
   ADD EXPENSE
=========================================================== */

async function addExpense(amount,note=""){

  const user = auth?.currentUser;

  if(!user){
    alert("Login required");
    return;
  }

  if(!window.ledgerEngine){
    alert("Ledger engine not ready");
    return;
  }

  const L = ledgerEngine.getCurrent();

  if(!L){
    alert("Ledger not loaded");
    return;
  }

  if(L.isClosed){
    alert("Ledger already closed for today");
    return;
  }

  amount = num(amount);

  if(amount<=0){
    alert("Invalid amount");
    return;
  }

  const date = ledgerEngine.getDateKey();

  const category =
  document.getElementById("expCat")?.value
  || "General";

  const expenseRecord = {

    date:date,
    category:category,
    amount:amount,
    note:note || ""

  };

  try{

    await db
    .collection("users")
    .doc(user.uid)
    .collection("ledger")
    .doc(date)
    .set({

      expenses:
      firebase.firestore.FieldValue.arrayUnion(expenseRecord)

    },{merge:true});

    window.expenses.push(expenseRecord);

  }catch(err){

    console.error("Expense save failed",err);
    alert("Expense save failed");
    return;

  }

  if(typeof updateLedgerField==="function"){

    await updateLedgerField(
      "expensesTotal",
      amount
    );

  }

  renderExpenses();
  window.renderUniversalBar?.();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   RENDER EXPENSE TABLE
=========================================================== */

function renderExpenses(){

  const tbody =
  document.querySelector("#expensesTable tbody");

  const totalEl =
  document.getElementById("expTotal");

  if(!tbody) return;

  tbody.innerHTML="";

  let total=0;

  window.expenses.forEach((e,i)=>{

    total+=num(e.amount);

    const tr=document.createElement("tr");

    tr.innerHTML=`
    <td>${e.date}</td>
    <td>${e.category}</td>
    <td>${e.amount}</td>
    <td>${e.note||""}</td>
    <td>
      <button onclick="deleteExpense(${i})"
      style="background:#ef4444;color:white;border:none;padding:4px 8px;border-radius:6px">
      Delete
      </button>
    </td>
    `;

    tbody.appendChild(tr);

  });

  if(totalEl){
    totalEl.textContent=total;
  }

}


/* ===========================================================
   DELETE EXPENSE
=========================================================== */

window.deleteExpense = async function(index){

  const user = auth?.currentUser;
  if(!user) return;

  if(!window.ledgerEngine){
    alert("Ledger engine not ready");
    return;
  }

  const exp = window.expenses[index];
  if(!exp) return;

  if(!confirm("Delete this expense?")) return;

  if(!confirm(
  "Restore this expense amount to ledger balance?\n\nOK = Restore balance\nCancel = Go back"
  )) return;

  const date = ledgerEngine.getDateKey();

  try{

    await db
    .collection("users")
    .doc(user.uid)
    .collection("ledger")
    .doc(date)
    .update({

      expenses:
      firebase.firestore.FieldValue.arrayRemove(exp)

    });

    window.expenses.splice(index,1);

  }catch(err){

    console.error("Expense delete failed",err);
    alert("Delete failed");
    return;

  }

  if(typeof updateLedgerField==="function"){

    await updateLedgerField(
      "expensesTotal",
      -num(exp.amount)
    );

  }

  renderExpenses();
  window.renderUniversalBar?.();

}


/* ===========================================================
   DAILY LEDGER REPORT GENERATOR
=========================================================== */

function generateDailyLedgerReport(){

  if(!window.ledgerEngine) return "";

  const L = ledgerEngine.getCurrent();
  if(!L) return "";

  const date = ledgerEngine.getDateKey();

  const sales = window.sales || [];
  const services = window.services || [];
  const withdraws = window.withdraws || [];

  let report="";

  report+="KHARCHASAATHI DAILY LEDGER\n";
  report+=`Date: ${date}\n\n`;


  /* OPENING */

  report+="OPENING BALANCE\n";
  report+=`${num(L.openingBalance)}\n\n`;


  /* SALES */

  report+="SALES\n";

  sales
  .filter(s=>s.date===date)
  .forEach(s=>{

    report+=
    `${(s.product||"Item").padEnd(15)} ${num(s.qty)||1}   ${num(s.total)}\n`;

  });

  report+="--------------------------------\n";
  report+=`Sales Total: ${num(L.salesTotal)}\n`;
  report+=`Sales Profit: ${num(L.salesProfit)}\n`;
  report+=`Stock Investment Return: ${num(L.salesInvestmentReturn)}\n\n`;


  /* SERVICE */

  report+="SERVICE\n";

  services
  .filter(s=>s.date===date)
  .forEach(s=>{

    report+=
    `${(s.model||"Service").padEnd(20)} ${num(s.paid)}\n`;

  });

  report+="--------------------------------\n";
  report+=`Service Collection: ${num(L.serviceCollection)}\n`;
  report+=`Service Profit: ${num(L.serviceProfit)}\n`;
  report+=`Service Investment Return: ${num(L.serviceInvestmentReturn)}\n\n`;


  /* EXPENSES */

  report+="EXPENSES\n";

  window.expenses
  .filter(e=>e.date===date)
  .forEach(e=>{

    report+=`${e.category.padEnd(15)} ${num(e.amount)}\n`;

  });

  report+="--------------------------------\n";
  report+=`Total Expenses: ${num(L.expensesTotal)}\n\n`;


  /* GST */

  report+="GST\n";
  report+=`Collected: ${num(L.gstCollected)}\n`;
  report+=`Paid: ${num(L.gstPaid)}\n\n`;


  /* WITHDRAW */

  report+="WITHDRAW\n";

  withdraws.forEach(w=>{
    report+=`${w.note||"Withdraw"} ${num(w.amount)}\n`;
  });

  report+="\n--------------------------------\n";


  /* COUNTER BALANCE */

  report+="COUNTER BALANCE BREAKDOWN\n\n";

  report+=`Opening Balance: ${num(L.openingBalance)}\n`;
  report+=`Sales Collection: ${num(L.salesTotal)}\n`;
  report+=`Service Collection: ${num(L.serviceCollection)}\n`;
  report+=`GST Collected: ${num(L.gstCollected)}\n`;
  report+=`Stock Investment Return: ${num(L.salesInvestmentReturn)}\n`;
  report+=`Service Investment Return: ${num(L.serviceInvestmentReturn)}\n\n`;

  report+=`Stock Investment: -${num(L.stockInvestment)}\n`;
  report+=`Service Investment: -${num(L.serviceInvestment)}\n`;
  report+=`Expenses: -${num(L.expensesTotal)}\n`;
  report+=`Withdraw: -${num(L.withdrawalsTotal)}\n`;
  report+=`GST Paid: -${num(L.gstPaid)}\n\n`;

  report+="--------------------------------\n";
  report+=`COUNTER BALANCE: ${num(L.closingBalance)}\n\n`;


  /* CLOSE DAY */

  report+="--------------------------------\n";
  report+="CLOSE DAY SUMMARY\n\n";

  report+=`Closing Balance: ${num(L.closingBalance)}\n`;
  report+=`Next Day Opening: ${num(L.closingBalance)}\n`;
  report+="Day Status: CLOSED\n";

  report+="--------------------------------\n";

  return report;

}


/* ===========================================================
   DOWNLOAD LEDGER
=========================================================== */

window.downloadLedger=function(){

  const text=generateDailyLedgerReport();
  if(!text) return;

  const blob=new Blob([text],{type:"text/plain"});

  const url=URL.createObjectURL(blob);

  const a=document.createElement("a");

  a.href=url;
  a.download=
  `ledger-${ledgerEngine.getDateKey()}.txt`;

  a.click();

  URL.revokeObjectURL(url);

};


/* ===========================================================
   WHATSAPP SHARE
=========================================================== */

window.shareLedgerWhatsApp=function(){

  const txt=generateDailyLedgerReport();
  if(!txt) return;

  const url=
  "https://wa.me/?text="+
  encodeURIComponent(txt);

  window.open(url,"_blank");

};


/* ===========================================================
   PROMPT EXPENSE INPUT
=========================================================== */

async function promptExpense(){

  const amt=prompt("Enter expense amount");
  if(!amt) return;

  const note=
  prompt("Expense note (optional)");

  await addExpense(num(amt),note||"");

}


/* ===========================================================
   PUBLIC API
=========================================================== */

window.expenseEngine={

  addExpense,
  promptExpense,
  renderExpenses

};

console.log(
"%c💸 Expense Engine READY ✔",
"color:#dc2626;font-weight:bold"
);

})();
