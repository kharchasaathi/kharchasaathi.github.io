/* core.js — FINAL V14.0 (bug-fixed: remain + key-guards + robust loads + Service Investment Fix) */
(function(){
  // STORAGE KEYS (primary names used by core)
  const KEY_TYPES_DEFAULT       = "item-types";
  const KEY_TYPES_COMPAT        = "ks-types";

  const KEY_STOCK_DEFAULT       = "stock-data";
  const KEY_STOCK_COMPAT        = "ks-stock";

  const KEY_SALES_DEFAULT       = "sales-data";
  const KEY_SALES_COMPAT        = "ks-sales";

  const KEY_WANTING_DEFAULT     = "wanting-data";
  const KEY_WANTING_COMPAT      = "ks-wanting";

  const KEY_EXPENSES_DEFAULT    = "expenses-data";
  const KEY_EXPENSES_COMPAT     = "ks-expenses";

  const KEY_SERVICES_DEFAULT    = "service-data";
  const KEY_SERVICES_COMPAT     = "ks-services";

  const KEY_COLLECTIONS_DEFAULT = "ks-collections";
  const KEY_COLLECTIONS_COMPAT  = "collections";

  const KEY_LIMIT              = "default-limit";
  const KEY_USER_EMAIL         = "ks-user-email";

  const CLOUD_COLLECTIONS = {
    [KEY_TYPES_DEFAULT]:       "types",
    [KEY_TYPES_COMPAT]:        "types",
    [KEY_STOCK_DEFAULT]:       "stock",
    [KEY_STOCK_COMPAT]:        "stock",
    [KEY_SALES_DEFAULT]:       "sales",
    [KEY_SALES_COMPAT]:        "sales",
    [KEY_WANTING_DEFAULT]:     "wanting",
    [KEY_WANTING_COMPAT]:      "wanting",
    [KEY_EXPENSES_DEFAULT]:    "expenses",
    [KEY_EXPENSES_COMPAT]:     "expenses",
    [KEY_SERVICES_DEFAULT]:    "services",
    [KEY_SERVICES_COMPAT]:     "services",
    [KEY_COLLECTIONS_DEFAULT]: "collections",
    [KEY_COLLECTIONS_COMPAT]:  "collections"
  };

  /* ---------- safe JSON parse ---------- */
  function safeParse(raw){
    try{ return JSON.parse(raw); } catch(e){ return []; }
  }
  function toArray(v){ return Array.isArray(v) ? v : []; }

  /* ---------- UID & ESC ---------- */
  function uid(prefix="id"){ return `${prefix}_${Math.random().toString(36).slice(2,10)}`; }
  window.uid = uid;

  function esc(s){ return String(s == null ? "" : s); }
  window.esc = esc;

  /* ---------- DATE HELPERS ---------- */
  function todayDate(){
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().split("T")[0];
  }
  window.todayDate = todayDate;

  function toInternalIfNeeded(d){
    if(!d) return "";
    if(typeof d !== "string") return d;
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if(/^\d{2}-\d{2}-\d{4}$/.test(d)){
      const [dd,mm,yy] = d.split("-");
      return `${yy}-${mm}-${dd}`;
    }
    return d;
  }
  window.toInternalIfNeeded = toInternalIfNeeded;

  function toDisplay(d){
    if(!d || typeof d !== "string") return "";
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)){
      const [y,m,dd] = d.split("-");
      return `${dd}-${m}-${y}`;
    }
    return d;
  }
  window.toDisplay = toDisplay;

  /* ---------- FLEXIBLE localStorage read that supports compat keys ---------- */
  function readFirstAvailable(keys){
    for(const k of keys){
      try {
        const raw = localStorage.getItem(k);
        if (raw !== null && raw !== undefined) {
          const parsed = safeParse(raw);
          return parsed;
        }
      } catch(e){}
    }
    return [];
  }

  /* ---------- LOAD initial data (checks both default & compat keys) ---------- */
  window.types       = toArray(readFirstAvailable([KEY_TYPES_DEFAULT, KEY_TYPES_COMPAT]));
  window.stock       = toArray(readFirstAvailable([KEY_STOCK_DEFAULT, KEY_STOCK_COMPAT]));
  window.sales       = toArray(readFirstAvailable([KEY_SALES_DEFAULT, KEY_SALES_COMPAT]));
  window.wanting     = toArray(readFirstAvailable([KEY_WANTING_DEFAULT, KEY_WANTING_COMPAT]));
  window.expenses    = toArray(readFirstAvailable([KEY_EXPENSES_DEFAULT, KEY_EXPENSES_COMPAT]));
  window.services    = toArray(readFirstAvailable([KEY_SERVICES_DEFAULT, KEY_SERVICES_COMPAT]));
  window.collections = toArray(readFirstAvailable([KEY_COLLECTIONS_DEFAULT, KEY_COLLECTIONS_COMPAT]));

  function ensureArrays(){
    if(!Array.isArray(window.types)) window.types = [];
    if(!Array.isArray(window.stock)) window.stock = [];
    if(!Array.isArray(window.sales)) window.sales = [];
    if(!Array.isArray(window.wanting)) window.wanting = [];
    if(!Array.isArray(window.expenses)) window.expenses = [];
    if(!Array.isArray(window.services)) window.services = [];
    if(!Array.isArray(window.collections)) window.collections = [];
  }
  ensureArrays();

  /* ---------- normalize dates + ensure stock 'remain' field ---------- */
  function normalizeAllDatesAndStock(){
    try {
      window.stock = (window.stock || []).map(p => {
        const copy = { ...p };
        copy.date = toInternalIfNeeded(copy.date);
        // ensure numeric fields
        copy.qty = Number(copy.qty || 0);
        copy.sold = Number(copy.sold || 0);
        // remain should exist (qty - sold) fallback to qty if missing
        copy.remain = Number(copy.remain ?? (copy.qty - copy.sold));
        // history dates
        if (Array.isArray(copy.history)) {
          copy.history = copy.history.map(h => ({ ...h, date: toInternalIfNeeded(h.date), qty: Number(h.qty||0), cost: Number(h.cost||0) }));
        }
        return copy;
      });

      window.sales = (window.sales || []).map(s => ({ ...s, date: toInternalIfNeeded(s.date) }));
      window.wanting = (window.wanting || []).map(w => ({ ...w, date: toInternalIfNeeded(w.date) }));
      window.expenses = (window.expenses || []).map(e => ({ ...e, date: toInternalIfNeeded(e.date) }));
      window.services = (window.services || []).map(j => ({ ...j, date_in: toInternalIfNeeded(j.date_in), date_out: toInternalIfNeeded(j.date_out) }));
      window.collections = (window.collections || []).map(c => ({ ...c, date: toInternalIfNeeded(c.date) }));
    } catch (e) {
      console.warn("normalizeAllDatesAndStock failed", e);
    }
  }
  normalizeAllDatesAndStock();

  /* ---------- LOCAL SAVE (write to primary + compat keys to avoid breaking older modules) ---------- */
  function _localSave(keyPrimary, keyCompat, arr){
    try {
      localStorage.setItem(keyPrimary, JSON.stringify(arr || []));
    } catch(e) { console.warn("localSave primary failed:", keyPrimary, e); }
    try {
      // write compat key as well to help older modules
      localStorage.setItem(keyCompat, JSON.stringify(arr || []));
    } catch(e) { /* ignore */ }
  }

  /* ---------- SAVE FUNCTIONS (exposed) ---------- */
  function saveTypes(){ _localSave(KEY_TYPES_DEFAULT, KEY_TYPES_COMPAT, window.types); }
  function saveStock(){ _localSave(KEY_STOCK_DEFAULT, KEY_STOCK_COMPAT, window.stock); }
  function saveSales(){ _localSave(KEY_SALES_DEFAULT, KEY_SALES_COMPAT, window.sales); }
  function saveWanting(){ _localSave(KEY_WANTING_DEFAULT, KEY_WANTING_COMPAT, window.wanting); }
  function saveExpenses(){ _localSave(KEY_EXPENSES_DEFAULT, KEY_EXPENSES_COMPAT, window.expenses); }
  function saveServices(){ _localSave(KEY_SERVICES_DEFAULT, KEY_SERVICES_COMPAT, window.services); }
  function saveCollections(){ _localSave(KEY_COLLECTIONS_DEFAULT, KEY_COLLECTIONS_COMPAT, window.collections); }

  window.saveTypes = saveTypes;
  window.saveStock = saveStock;
  window.saveSales = saveSales;
  window.saveWanting = saveWanting;
  window.saveExpenses = saveExpenses;
  window.saveServices = saveServices;
  window.saveCollections = saveCollections;

  /* ---------- CLOUD SYNC (uses firebase helper if present) ---------- */
  async function cloudSync(key, arr){
    // attempt local save first (caller might have already done it)
    try {
      // map passed key to our canonical primary key names if caller passed constants from this file
      let primaryKey = key;
      switch(key) {
        case KEY_TYPES_DEFAULT: case KEY_TYPES_COMPAT: primaryKey = KEY_TYPES_DEFAULT; break;
        case KEY_STOCK_DEFAULT: case KEY_STOCK_COMPAT: primaryKey = KEY_STOCK_DEFAULT; break;
        case KEY_SALES_DEFAULT: case KEY_SALES_COMPAT: primaryKey = KEY_SALES_DEFAULT; break;
        case KEY_WANTING_DEFAULT: case KEY_WANTING_COMPAT: primaryKey = KEY_WANTING_DEFAULT; break;
        case KEY_EXPENSES_DEFAULT: case KEY_EXPENSES_COMPAT: primaryKey = KEY_EXPENSES_DEFAULT; break;
        case KEY_SERVICES_DEFAULT: case KEY_SERVICES_COMPAT: primaryKey = KEY_SERVICES_DEFAULT; break;
        case KEY_COLLECTIONS_DEFAULT: case KEY_COLLECTIONS_COMPAT: primaryKey = KEY_COLLECTIONS_DEFAULT; break;
        default: primaryKey = key;
      }
      // save locally (primary + compat) using mapping above
      if (primaryKey === KEY_TYPES_DEFAULT) saveTypes();
      else if (primaryKey === KEY_STOCK_DEFAULT) saveStock();
      else if (primaryKey === KEY_SALES_DEFAULT) saveSales();
      else if (primaryKey === KEY_WANTING_DEFAULT) saveWanting();
      else if (primaryKey === KEY_EXPENSES_DEFAULT) saveExpenses();
      else if (primaryKey === KEY_SERVICES_DEFAULT) saveServices();
      else if (primaryKey === KEY_COLLECTIONS_DEFAULT) saveCollections();
    } catch(e) { /* ignore */ }

    // cloud
    try {
      const col = CLOUD_COLLECTIONS[key] || CLOUD_COLLECTIONS[primaryKey];
      if (col && typeof window.cloudSave === "function") {
        await window.cloudSave(col, arr);
      }
    } catch(e){
      console.warn("cloudSync failed", e);
    }
  }
  window.cloudSync = cloudSync;

  /* ---------- STORAGE event: reload & normalize & safe renders ---------- */
  window.addEventListener("storage", () => {
    try {
      window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_TYPES_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_TYPES_COMPAT)));
      window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_STOCK_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_STOCK_COMPAT)));
      window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_SALES_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_SALES_COMPAT)));
      window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_WANTING_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_WANTING_COMPAT)));
      window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_EXPENSES_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_EXPENSES_COMPAT)));
      window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_SERVICES_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_SERVICES_COMPAT)));
      window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS_DEFAULT))) .length ? toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS_DEFAULT))) : toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS_COMPAT)));

      ensureArrays();
      normalizeAllDatesAndStock();

      try{ renderTypes?.(); } catch(e){}
      try{ renderStock?.(); } catch(e){}
      try{ renderSales?.(); } catch(e){}
      try{ renderWanting?.(); } catch(e){}
      try{ renderExpenses?.(); } catch(e){}
      try{ renderServiceTables?.(); } catch(e){}
      try{ renderAnalytics?.(); } catch(e){}
      try{ renderCollection?.(); } catch(e){}
      try{ updateSummaryCards?.(); } catch(e){}
      try{ updateTabSummaryBar?.(); } catch(e){}
      try{ updateUniversalBar?.(); } catch(e){}
      try{ updateEmailTag?.(); } catch(e){}
    } catch (err) {
      console.warn("storage handler failed", err);
    }
  });

  /* ---------- BUSINESS LOGIC (types / stock / wanting / expenses / collections) ---------- */

  window.addType = function(name){
    name = (name || "").trim();
    if (!name) return;
    if ((window.types || []).some(t => String(t.name || "").toLowerCase() === name.toLowerCase())) return;
    const item = { id: uid("type"), name };
    window.types.push(item);
    saveTypes();
    cloudSync(KEY_TYPES_DEFAULT, window.types);
    try{ renderTypes?.(); } catch(e){}
  };

  window.findProduct = function(type, name){
    return (window.stock || []).find(p => p.type === type && String(p.name || "").toLowerCase() === String(name || "").toLowerCase());
  };

  window.getProductCost = function(type, name){
    const p = window.findProduct(type, name);
    if (!p) return 0;
    if (p.cost) return Number(p.cost);
    if (Array.isArray(p.history) && p.history.length){
      let total = 0, q = 0;
      p.history.forEach(h => { total += Number(h.cost || 0) * Number(h.qty || 0); q += Number(h.qty || 0); });
      return q ? (total / q) : 0;
    }
    return 0;
  };

  window.addStockEntry = function({ date, type, name, qty, cost }){
    date = toInternalIfNeeded(date || todayDate());
    qty = Number(qty || 0);
    cost = Number(cost || 0);
    if (!type || !name || qty <= 0 || cost <= 0) return;

    let p = window.findProduct(type, name);

    if (!p) {
      p = {
        id: uid("stk"),
        date,
        type,
        name,
        qty,
        sold: 0,
        remain: qty,
        cost,
        limit: Number(localStorage.getItem(KEY_LIMIT) || 0),
        history: [{ date, qty, cost }]
      };
      window.stock.push(p);
    } else {
      p.qty = Number(p.qty || 0) + qty;
      p.sold = Number(p.sold || 0);
      p.remain = Number(p.remain || (p.qty - p.sold)) + qty; // add new qty to remain
      p.cost = cost;
      p.history = p.history || [];
      p.history.push({ date, qty, cost });
    }

    saveStock();
    cloudSync(KEY_STOCK_DEFAULT, window.stock);
    try{ renderStock?.(); } catch(e){}
  };

  window.setGlobalLimit = function(v){ localStorage.setItem(KEY_LIMIT, v); };
  window.getGlobalLimit = function(){ return Number(localStorage.getItem(KEY_LIMIT) || 0); };

  window.autoAddWanting = function(type, name, note = "Low Stock"){
    if (!type || !name) return;
    if ((window.wanting || []).some(w => w.type === type && w.name === name)) return;
    const row = { id: uid("want"), date: todayDate(), type, name, note };
    window.wanting.push(row);
    saveWanting();
    cloudSync(KEY_WANTING_DEFAULT, window.wanting);
    try{ renderWanting?.(); } catch(e){}
  };

  window.addExpense = function({ date, category, amount, note }){
    const row = { id: uid("exp"), date: toInternalIfNeeded(date || todayDate()), category, amount: Number(amount || 0), note: note || "" };
    window.expenses.push(row);
    saveExpenses();
    cloudSync(KEY_EXPENSES_DEFAULT, window.expenses);
    try{ renderExpenses?.(); } catch(e){}
  };

  window.getTotalNetProfit = function(){
    let salesProfit = 0, serviceProfit = 0, exp = 0;
    (window.sales || []).forEach(s => {
      if (String(s.status || "").toLowerCase() !== "credit") salesProfit += Number(s.profit || 0);
    });
    (window.services || []).forEach(j => { serviceProfit += Number(j.profit || 0); });
    (window.expenses || []).forEach(e => { exp += Number(e.amount || 0); });
    return salesProfit + serviceProfit - exp;
  };

  window.updateTabSummaryBar = function(){
    const el = document.getElementById("tabSummaryBar"); if (!el) return;
    const net = window.getTotalNetProfit();
    if (net >= 0) { el.style.background = "#004d00"; el.style.color = "#fff"; el.textContent = `Profit: +₹${net}`; }
    else { el.style.background = "#4d0000"; el.style.color = "#fff"; el.textContent = `Loss: -₹${Math.abs(net)}`; }
  };

  /* -------------------------------------------------------------------------
     DASBOARD/ANALYTICS GLOBAL METRICS (Added back for backward compatibility)
  ------------------------------------------------------------------------- */
  // 1) REMAINING STOCK INVESTMENT (for Dashboard Pie Chart Investment)
  window.getStockInvestmentAfterSale = function () {
    return (window.stock || []).reduce((sum, p) => {
      // This calculates the value of remaining stock (qty - sold) * cost
      const remain = Number(p.qty || 0) - Number(p.sold || 0);
      return sum + (remain * Number(p.cost || 0));
    }, 0);
  };

  // 2) SERVICE INVESTMENT (Completed/Collected only) - FIXED KEY: s.cost
  window.getServiceInvestmentCollected = function () {
    return (window.services || [])
      // Completed or Collected status are considered
      .filter(s => String(s.status || "").toLowerCase() === "completed" || String(s.status || "").toLowerCase() === "collected")
      .reduce((t, s) => t + Number(s.cost || 0), 0); // ✅ FIXED: using s.cost
  };

  /* ---------- Collections helpers (single source-of-truth: window.collections) ---------- */
  function ensureCollections(){ if (!Array.isArray(window.collections)) window.collections = []; }
  ensureCollections();

  function _collectionKey(e){ return `${e.date||""}|${e.source||""}|${e.details||""}|${Number(e.amount||0)}`; }

  window.addCollectionEntry = function(entry){
    ensureCollections();
    entry = entry || {};
    const e = {
      id: entry.id || uid("col"),
      date: toInternalIfNeeded(entry.date || todayDate()),
      source: entry.source || "Unknown",
      details: entry.details || "",
      amount: Number(entry.amount || 0)
    };
    const k = _collectionKey(e);
    window._collectionKeys = window._collectionKeys || [];
    if (window._collectionKeys.includes(k)) return false;
    window._collectionKeys.unshift(k);
    window.collections.unshift(e);
    saveCollections();
    cloudSync(KEY_COLLECTIONS_DEFAULT, window.collections);
    try{ renderCollection?.(); } catch(e){}
    try{ updateSummaryCards?.(); } catch(e){}
    try{ updateUniversalBar?.(); } catch(e){}
    return true;
  };

  window.markSaleCollected = function(saleOrId, options={}){
    if (!saleOrId) return false;
    let sale = (typeof saleOrId === "string") ? (window.sales || []).find(s => s.id === saleOrId) : saleOrId;
    if (!sale) return false;
    const idx = (window.sales || []).findIndex(s => s.id === sale.id);
    if (idx === -1) window.sales.unshift(sale);
    else sale = window.sales[idx];
    if (String(sale.creditStatus || "").toLowerCase() === "collected" || sale._collectedMarked) return false;
    const collectedAmount = Number(options.collectedAmount || sale.collectedAmount || sale.collected || sale.total || (Number(sale.qty||0) * Number(sale.price||0)) || 0);
    const collectedOn = options.collectedOn || todayDate();
    sale.creditStatus = "collected"; sale.wasCredit = true; sale.collectedAmount = collectedAmount; sale.creditCollectedOn = collectedOn; sale._collectedMarked = true;
    saveSales(); cloudSync(KEY_SALES_DEFAULT, window.sales);
    window.addCollectionEntry({ date: collectedOn, source: "Sales (Credit Collected)", details: `${sale.customer||"-"} / ${sale.product||"-"}`, amount: collectedAmount });
    return true;
  };

  window.markServiceCollected = function(jobOrId, options={}){
    if (!jobOrId) return false;
    let job = (typeof jobOrId === "string") ? (window.services || []).find(s => s.id === jobOrId) : jobOrId;
    if (!job) return false;
    const idx = (window.services || []).findIndex(s => s.id === job.id);
    if (idx === -1) window.services.unshift(job);
    else job = window.services[idx];
    if (String(job.creditStatus || "").toLowerCase() === "collected" || job._collectedMarked) return false;
    const collectedAmount = Number(options.collectedAmount || job.creditCollectedAmount || job.collected || 0);
    const collectedOn = options.collectedOn || todayDate();
    job.creditStatus = "collected"; job.creditCollectedAmount = collectedAmount; job.creditCollectedOn = collectedOn; job._collectedMarked = true;
    saveServices(); cloudSync(KEY_SERVICES_DEFAULT, window.services);
    window.addCollectionEntry({ date: collectedOn, source: "Service (Credit Collected)", details: `${job.customer||"-"} / ${job.item||"-"}`, amount: collectedAmount });
    return true;
  };

  // expose cloudSync (already set above)
  window.cloudSync = cloudSync;

  // final normalization & persist ensure remain is present for loaded stock
  normalizeAllDatesAndStock();
  saveStock();

})();
