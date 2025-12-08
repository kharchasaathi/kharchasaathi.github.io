/* ===========================================================
   📌 core.js — Master Engine (ONLINE ONLY — FINAL V16)
   ⭐ Net + Stock + Service investment offsets (PERMANENT)
=========================================================== */

/* ---------- STORAGE KEYS ---------- */
const KEY_TYPES        = "item-types";
const KEY_STOCK        = "stock-data";
const KEY_SALES        = "sales-data";
const KEY_WANTING      = "wanting-data";
const KEY_EXPENSES     = "expenses-data";
const KEY_SERVICES     = "service-data";
const KEY_COLLECTIONS  = "ks-collections";
const KEY_LIMIT        = "default-limit";
const KEY_USER_EMAIL   = "ks-user-email";

/* ⭐ NEW — permanent offsets */
const KEY_NET_COLLECTED     = "ks-net-collected";
const KEY_STOCK_COLLECTED   = "ks-stock-collected";
const KEY_SERVICE_COLLECTED = "ks-service-collected";

/* ---------- CLOUD COLLECTION NAMES ---------- */
const CLOUD_COLLECTIONS = {
  [KEY_TYPES]:       "types",
  [KEY_STOCK]:       "stock",
  [KEY_SALES]:       "sales",
  [KEY_WANTING]:     "wanting",
  [KEY_EXPENSES]:    "expenses",
  [KEY_SERVICES]:    "services",
  [KEY_COLLECTIONS]: "collections"
};

/* ===========================================================
   SAFE HELPERS
=========================================================== */
function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return []; }
}
function toArray(v) {
  return Array.isArray(v) ? v : [];
}
/* ===========================================================
   DATE HELPERS
=========================================================== */
function toDisplay(d) {
  if (!d || typeof d !== "string") return d;
  const p = d.split("-");
  if (p.length === 3 && p[0].length === 4)
    return `${p[2]}-${p[1]}-${p[0]}`;
  return d;
}

function toInternal(d) {
  if (!d || typeof d !== "string") return d;
  const p = d.split("-");
  if (p.length === 3 && p[0].length === 2 && p[2].length === 4)
    return `${p[2]}-${p[1]}-${p[0]}`;
  return d;
}

function toInternalIfNeeded(d) {
  if (!d || typeof d !== "string") return d;
  const p = d.split("-");
  if (p.length !== 3) return d;
  if (p[0].length === 4) return d;
  if (p[0].length === 2 && p[2].length === 4) return toInternal(d);
  return d;
}

window.toDisplay = toDisplay;
window.toInternal = toInternal;
window.toInternalIfNeeded = toInternalIfNeeded;

/* ===========================================================
   BASIC HELPERS
=========================================================== */
function todayDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
window.todayDate = todayDate;

function uid(p = "id") {
  return p + "_" + Math.random().toString(36).slice(2, 10);
}
window.uid = uid;

function esc(t) {
  return String(t || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;","<": "&lt;",">": "&gt;",'"': "&quot;","'": "&#39;"
  }[m]));
}
window.esc = esc;
/* ===========================================================
   LOAD LOCAL DATA
=========================================================== */
window.types       = toArray(safeParse(localStorage.getItem(KEY_TYPES)));
window.stock       = toArray(safeParse(localStorage.getItem(KEY_STOCK)));
window.sales       = toArray(safeParse(localStorage.getItem(KEY_SALES)));
window.wanting     = toArray(safeParse(localStorage.getItem(KEY_WANTING)));
window.expenses    = toArray(safeParse(localStorage.getItem(KEY_EXPENSES)));
window.services    = toArray(safeParse(localStorage.getItem(KEY_SERVICES)));
window.collections = toArray(safeParse(localStorage.getItem(KEY_COLLECTIONS)));

window.collectedNetTotal     = Number(localStorage.getItem(KEY_NET_COLLECTED)     || 0);
window.collectedStockTotal   = Number(localStorage.getItem(KEY_STOCK_COLLECTED)   || 0);
window.collectedServiceTotal = Number(localStorage.getItem(KEY_SERVICE_COLLECTED) || 0);

function ensureArrays() {
  if (!Array.isArray(window.types))       window.types = [];
  if (!Array.isArray(window.stock))       window.stock = [];
  if (!Array.isArray(window.sales))       window.sales = [];
  if (!Array.isArray(window.wanting))     window.wanting = [];
  if (!Array.isArray(window.expenses))    window.expenses = [];
  if (!Array.isArray(window.services))    window.services = [];
  if (!Array.isArray(window.collections)) window.collections = [];
}
ensureArrays();
/* ===========================================================
   NET PROFIT (Dynamic + Offset)
=========================================================== */
window.getTotalNetProfit = function () {
  let salesProfit = 0, serviceProfit = 0, exp = 0;

  (sales || []).forEach(s => {
    if ((s.status || "").toLowerCase() !== "credit") {
      salesProfit += Number(s.profit || 0);
    }
  });

  (services || []).forEach(j => {
    if ((j.status || "").toLowerCase() === "completed") {
      serviceProfit += Number(j.profit || 0);
    }
  });

  (expenses || []).forEach(e => {
    exp += Number(e.amount || 0);
  });

  const collectedOffset = Number(window.collectedNetTotal || 0);

  const rawNet = salesProfit + serviceProfit - exp;
  const netAfterOffset = rawNet - collectedOffset;

  return Math.max(0, netAfterOffset);  // ⭐ NEVER NEGATIVE
};
