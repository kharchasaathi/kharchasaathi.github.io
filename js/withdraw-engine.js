/* ===========================================================
   WITHDRAW ENGINE v6
   Multi Withdraw Safe System
   ✔ Profit Withdraw Limit
   ✔ Stock Withdraw Limit
   ✔ Service Withdraw Limit
   ✔ GST Paid Limit
   ✔ Firestore Safe Update
   ✔ Amount Validation Fix
=========================================================== */

(function(){

if(window.__withdrawEngineLoaded) return;
window.__withdrawEngineLoaded = true;

console.log("%c💰 Withdraw Engine Loading...","color:#16a34a;font-weight:bold;");


/* ===========================================================
   COMMON VALIDATION
=========================================================== */

function validateLedger(){

  const user = auth.currentUser;

  if(!user){
    alert("Login required");
    return null;
  }

  if(!window.ledgerEngine){
    alert("Ledger engine not ready");
    return null;
  }

  const L = ledgerEngine.getCurrent();

  if(!L){
    alert("Ledger not loaded");
    return null;
  }

  if(L.isClosed){
    alert("Ledger already closed for today");
    return null;
  }

  return L;

}


/* ===========================================================
   AMOUNT VALIDATION
=========================================================== */

function validateAmount(amount){

  amount = Number(amount);

  if(isNaN(amount) || amount <= 0){
    alert("Invalid amount");
    return null;
  }

  return amount;

}


/* ===========================================================
   PROFIT WITHDRAW
=========================================================== */

async function withdrawProfit(amount){

  const L = validateLedger();
  if(!L) return;

  amount = validateAmount(amount);
  if(!amount) return;

  const profit =
      Number(L.salesProfit || 0)
    + Number(L.serviceProfit || 0);

  const withdrawn =
      Number(L.withdrawalsTotal || 0);

  const availableProfit =
      profit - withdrawn;

  if(amount > availableProfit){

    alert(
      "Profit withdraw limit exceeded.\n\n" +
      "Available Profit: ₹" + Math.round(availableProfit)
    );

    return;

  }

  const newTotal = withdrawn + amount;

  await updateLedger({
    withdrawalsTotal: newTotal
  });

}


/* ===========================================================
   STOCK INVESTMENT WITHDRAW
=========================================================== */

async function withdrawStock(amount){

  const L = validateLedger();
  if(!L) return;

  amount = validateAmount(amount);
  if(!amount) return;

  const invest =
      Number(L.salesInvestmentReturn || 0);

  const withdrawn =
      Number(L.stockWithdrawTotal || 0);

  const available =
      invest - withdrawn;

  if(amount > available){

    alert(
      "Stock withdraw limit exceeded.\n\n" +
      "Available Stock: ₹" + Math.round(available)
    );

    return;

  }

  const newTotal =
      withdrawn + amount;

  await updateLedger({
    stockWithdrawTotal: newTotal
  });

}


/* ===========================================================
   SERVICE INVESTMENT WITHDRAW
=========================================================== */

async function withdrawService(amount){

  const L = validateLedger();
  if(!L) return;

  amount = validateAmount(amount);
  if(!amount) return;

  const invest =
      Number(L.serviceInvestmentReturn || 0);

  const withdrawn =
      Number(L.serviceWithdrawTotal || 0);

  const available =
      invest - withdrawn;

  if(amount > available){

    alert(
      "Service withdraw limit exceeded.\n\n" +
      "Available Service: ₹" + Math.round(available)
    );

    return;

  }

  const newTotal =
      withdrawn + amount;

  await updateLedger({
    serviceWithdrawTotal: newTotal
  });

}


/* ===========================================================
   GST PAID
=========================================================== */

async function withdrawGST(amount){

  const L = validateLedger();
  if(!L) return;

  amount = validateAmount(amount);
  if(!amount) return;

  const collected =
      Number(L.gstCollected || 0);

  const paid =
      Number(L.gstPaid || 0);

  const available =
      collected - paid;

  if(amount > available){

    alert(
      "GST payment limit exceeded.\n\n" +
      "Available GST: ₹" + Math.round(available)
    );

    return;

  }

  const newTotal =
      paid + amount;

  await updateLedger({
    gstPaid: newTotal
  });

}


/* ===========================================================
   FIRESTORE UPDATE
=========================================================== */

async function updateLedger(updateData){

  const user = auth.currentUser;

  const uid = user.uid;
  const dateKey = ledgerEngine.getDateKey();

  const ref =
    db.collection("users")
      .doc(uid)
      .collection("ledger")
      .doc(dateKey);

  updateData.updatedAt = Date.now();

  await ref.update(updateData);

  await ledgerEngine.refresh();

  window.dispatchEvent(
    new Event("ledger-updated")
  );

}


/* ===========================================================
   PROMPT FUNCTIONS
=========================================================== */

async function promptProfitWithdraw(){

  const amt = prompt("Enter profit withdraw amount");
  if(!amt) return;

  await withdrawProfit(amt);

}

async function promptStockWithdraw(){

  const amt = prompt("Enter stock withdraw amount");
  if(!amt) return;

  await withdrawStock(amt);

}

async function promptServiceWithdraw(){

  const amt = prompt("Enter service withdraw amount");
  if(!amt) return;

  await withdrawService(amt);

}

async function promptGSTPaid(){

  const amt = prompt("Enter GST payment amount");
  if(!amt) return;

  await withdrawGST(amt);

}


/* ===========================================================
   PUBLIC API
=========================================================== */

window.withdrawEngine = {

  withdrawProfit,
  withdrawStock,
  withdrawService,
  withdrawGST,

  promptProfitWithdraw,
  promptStockWithdraw,
  promptServiceWithdraw,
  promptGSTPaid

};

console.log("%c💰 Withdraw Engine READY ✔","color:#16a34a;font-weight:bold;");

})();
