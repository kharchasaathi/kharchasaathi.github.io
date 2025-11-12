// core.js — theme, tabs, lazy loader, safe init, summary update hooks
(function(){
  // --- theme init ---
  const body = document.body;
  const themeBtn = document.getElementById('themeBtn');
  if(localStorage.getItem('ks-theme') === 'dark') body.classList.add('dark');
  themeBtn && themeBtn.addEventListener('click', ()=>{
    body.classList.toggle('dark');
    localStorage.setItem('ks-theme', body.classList.contains('dark') ? 'dark' : 'light');
  });

  // --- help modal ---
  const helpBtn = document.getElementById('helpBtn'), helpModal = document.getElementById('helpModal');
  helpBtn && helpBtn.addEventListener('click', ()=> { helpModal.setAttribute('aria-hidden','false'); helpModal.style.display='flex'; });
  document.getElementById('closeHelp')?.addEventListener('click', ()=> { helpModal.setAttribute('aria-hidden','true'); helpModal.style.display='none'; });

  // --- tabs ---
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const sections = Array.from(document.querySelectorAll('.section'));

  function setActiveTab(tabEl){
    tabs.forEach(t=>t.classList.remove('active'));
    sections.forEach(s=> s.classList.remove('active'), s.setAttribute('aria-hidden','true'));
    tabEl.classList.add('active');
    const id = tabEl.dataset.tab;
    const target = document.getElementById(id);
    if(target){ target.classList.add('active'); target.setAttribute('aria-hidden','false'); }
    // lazy load module if exists
    lazyLoadModule(id);
    // run per-tab updates
    if(typeof perTabUpdate === 'function') perTabUpdate(id);
  }

  tabs.forEach(t=> t.addEventListener('click', ()=> setActiveTab(t) ));

  // --- lazy loader for modules (load JS + HTML fragments if desired) ---
  // For now we load JS modules only (types.js, stock.js, sales.js, wanting.js, analytics.js).
  const loadedModules = {};
  function lazyLoadModule(id){
    if(loadedModules[id]) return;
    const map = {
      'types': 'js/types.js',
      'stock': 'js/stock.js',
      'sales': 'js/sales.js',
      'wanting': 'js/wanting.js',
      'analytics': 'js/analytics.js'
    };
    const src = map[id];
    if(!src) return;
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    s.onload = ()=> { loadedModules[id] = true; console.log('Module loaded:', id); if(typeof moduleInit === 'function') moduleInit(id); };
    s.onerror = (e)=> console.warn('Module load failed:', src, e);
    document.body.appendChild(s);
  }

  // --- safe init: update summary cards placeholder (module will override) ---
  window.updateSummaryCards = function(){
    try{
      const sales = JSON.parse(localStorage.getItem('sales-data')||'[]');
      const stock = JSON.parse(localStorage.getItem('stock-data')||'[]');
      const today = new Date().toISOString().split('T')[0];
      let todaySales=0, todayCredit=0, todayProfit=0;
      (sales||[]).forEach(s=>{
        if(s.date===today){
          if(s.status==='Paid') todaySales += Number(s.amount||0);
          if(s.status==='Credit') todayCredit += Number(s.amount||0);
          todayProfit += Number(s.profit||0);
        }
      });
      const totalQty = (stock||[]).reduce((a,b)=> a + (Number(b.qty||0)),0);
      const soldQty = (stock||[]).reduce((a,b)=> a + (Number(b.sold||0)),0);
      const remainPct = totalQty ? Math.round(((totalQty - soldQty)/totalQty)*100) : 0;
      document.getElementById('todaySales').textContent = '₹' + (Math.round(todaySales*100)/100).toFixed(2);
      document.getElementById('todayCredit').textContent = '₹' + (Math.round(todayCredit*100)/100).toFixed(2);
      document.getElementById('todayProfit').textContent = '₹' + (Math.round(todayProfit*100)/100).toFixed(2);
      document.getElementById('stockRemain').textContent = remainPct + '%';
    } catch(e){ console.warn('updateSummaryCards failed', e); }
  };

  // run once on load (and expose)
  window.addEventListener('load', ()=> {
    updateSummaryCards();
    // load default module for dashboard preview: don't auto-load analytics script (user must open tab)
    // but if you want to pre-load small preview data, call lazyLoadModule('analytics') here (we keep it lazy)
  });

  // autosave on close (safe)
  window.addEventListener('beforeunload', ()=>{
    try{ if(typeof window.saveAll === 'function') window.saveAll(); if(typeof window.saveSales === 'function') window.saveSales(); }catch(e){ console.warn('Auto-save skipped:',e);}
  });

  // small helper for per-tab updates (modules can listen)
  window.perTabUpdate = function(id){
    if(id==='dashboard') updateSummaryCards();
    if(id==='analytics' && typeof window.renderAnalytics === 'function') window.renderAnalytics();
    if(id==='stock' && typeof window.renderStock === 'function') window.renderStock();
    if(id==='types' && typeof window.renderTypes === 'function') window.renderTypes();
    if(id==='sales' && typeof window.renderSales === 'function') window.renderSales();
  };

  // Expose lazy loader for dev / debugging
  window.lazyLoadModule = lazyLoadModule;
  console.log('KharchaSaathi core loaded ✅');
})();
