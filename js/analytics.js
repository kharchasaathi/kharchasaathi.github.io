/* analytics.js — FINAL V6 (your provided code with guards) */
(function (global) {
  'use strict';
  const qs = s => document.querySelector(s);
  const escNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  let cleanPieChart = null;
  function getAnalyticsData(){ /* same as your supplied code — safe */ /* CODE COPIED FROM YOUR LAST MESSAGE */ 
    const today = (typeof todayDate === "function") ? todayDate() : new Date().toISOString().slice(0, 10);
    const sales = Array.isArray(global.sales) ? global.sales : [];
    const expenses = Array.isArray(global.expenses) ? global.expenses : [];
    const services = Array.isArray(global.services) ? global.services : [];
    let todaySales = 0, creditSales = 0, todayExpenses = 0, grossProfit = 0;
    sales.forEach(s => {
      if (!s || String(s.date || "") !== String(today)) return;
      const total = escNum(s.total ?? s.amount ?? (Number(s.qty || 0) * Number(s.price || 0)));
      const status = String(s.status || "").toLowerCase();
      if (status === "credit") creditSales += total;
      else { todaySales += total; grossProfit += escNum(s.profit || 0); }
    });
    services.forEach(j => { if (!j) return; if (String(j.date_out || "") === String(today)) grossProfit += escNum(j.profit || 0); });
    expenses.forEach(e => { if (!e) return; if (String(e.date || "") === String(today)) todayExpenses += escNum(e.amount || 0); });
    const netProfit = grossProfit - todayExpenses;
    return { todaySales, creditSales, todayExpenses, grossProfit, netProfit };
  }
  function getSummaryTotals(){ const sales = Array.isArray(global.sales) ? global.sales : []; const expenses = Array.isArray(global.expenses) ? global.expenses : []; const services = Array.isArray(global.services) ? global.services : []; let salesProfit=0, serviceProfit=0, creditTotal=0; sales.forEach(s=>{ if(!s) return; const status=String(s.status||"").toLowerCase(); const total=escNum(s.total ?? s.amount ?? (Number(s.qty||0)*Number(s.price||0))); if(status==="credit") creditTotal+=total; else salesProfit+=escNum(s.profit||0); }); services.forEach(j=>{ if(!j) return; serviceProfit+=escNum(j.profit||0); }); const totalProfit = salesProfit + serviceProfit; const totalExpenses = expenses.reduce((sum,e)=>{ if(!e) return sum; return sum + escNum(e.amount||0); },0); const netProfit = totalProfit - totalExpenses; let stockAfter=0, serviceInv=0; try{ if(typeof global.getStockInvestmentAfterSale==="function") stockAfter = escNum(global.getStockInvestmentAfterSale()); }catch(err){ console.warn("getStockInvestmentAfterSale() threw:", err); } try{ if(typeof global.getServiceInvestmentCollected==="function") serviceInv = escNum(global.getServiceInvestmentCollected()); }catch(err){ console.warn("getServiceInvestmentCollected() threw:", err); } return { salesProfit, serviceProfit, totalProfit, totalExpenses, netProfit, creditTotal, stockAfter, serviceInv }; }
  function renderAnalytics(){ const { salesProfit, serviceProfit, totalProfit, totalExpenses, netProfit, creditTotal, stockAfter, serviceInv } = getSummaryTotals(); const dashProfit = qs("#dashProfit"), dashExpenses = qs("#dashExpenses"), dashCredit = qs("#dashCredit"), dashInv = qs("#dashInv"); if (dashProfit) dashProfit.textContent = "₹" + Math.round(totalProfit || 0); if (dashExpenses) dashExpenses.textContent = "₹" + Math.round(totalExpenses || 0); if (dashCredit) dashCredit.textContent = "₹" + Math.round(creditTotal || 0); if (dashInv) dashInv.textContent = "₹" + Math.round((Number(stockAfter||0)+Number(serviceInv||0))||0); try{ if(typeof global.updateUniversalBar==="function") global.updateUniversalBar(); }catch(err){ console.warn("updateUniversalBar() error:", err); } const canvas = qs("#cleanPie"); if(!canvas) return; if(typeof Chart === "undefined") return; try{ if(cleanPieChart && typeof cleanPieChart.destroy==="function") cleanPieChart.destroy(); const dataValues = [Number(totalProfit||0), Number(totalExpenses||0), Number(creditTotal||0), Number((Number(stockAfter||0)+Number(serviceInv||0))||0)]; cleanPieChart = new Chart(canvas, { type:"pie", data:{ labels:["Profit","Expenses","Credit","Investment"], datasets:[{ data: dataValues, backgroundColor: ["#2e7d32","#c62828","#1565c0","#fbc02d"] }] }, options:{ responsive:true, plugins:{ legend:{ position:"bottom" } } } }); }catch(err){ console.error("renderAnalytics — Chart render failed:", err); } }
  function updateSummaryCards(){ const data = getAnalyticsData(); const tSales = qs("#todaySales"), tCredit = qs("#todayCredit"), tExp = qs("#todayExpenses"), tGross = qs("#todayGross"), tNet = qs("#todayNet"); if(tSales) tSales.textContent = "₹"+Math.round(data.todaySales||0); if(tCredit) tCredit.textContent = "₹"+Math.round(data.creditSales||0); if(tExp) tExp.textContent = "₹"+Math.round(data.todayExpenses||0); if(tGross) tGross.textContent = "₹"+Math.round(data.grossProfit||0); if(tNet) tNet.textContent = "₹"+Math.round(data.netProfit||0); }
  try{ global.getAnalyticsData=getAnalyticsData; global.getSummaryTotals=getSummaryTotals; global.renderAnalytics=renderAnalytics; global.updateSummaryCards=updateSummaryCards; }catch(err){ console.warn("analytics: attach failed", err); }
  window.addEventListener("load", ()=>{ try{ renderAnalytics(); }catch(e){ console.warn("renderAnalytics failed:", e);} try{ updateSummaryCards(); }catch(e){ console.warn("updateSummaryCards failed:", e);} });
})(window);
