// tools/trust-ledger.js
// Simple browser-side immutable ledger for proof-of-invoice

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const TrustLedger = (() => {
  const KEY = 'ks_trust_ledger_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(chain) {
    localStorage.setItem(KEY, JSON.stringify(chain, null, 2));
  }

  async function addEntry(data) {
    const chain = load();
    const prev = chain.length ? chain.at(-1).hash : null;
    const entry = { data, timestamp: new Date().toISOString(), prev };
    entry.hash = await sha256Hex(JSON.stringify(entry));
    chain.push(entry);
    save(chain);
    return entry;
  }

  async function verify() {
    const chain = load();
    for (let i = 0; i < chain.length; i++) {
      const e = chain[i];
      const testHash = await sha256Hex(JSON.stringify({ data: e.data, timestamp: e.timestamp, prev: e.prev }));
      if (testHash !== e.hash) return { ok: false, at: i };
      if (i > 0 && e.prev !== chain[i - 1].hash) return { ok: false, reason: 'Chain broken', at: i };
    }
    return { ok: true, length: chain.length };
  }

  function exportChain() {
    return JSON.stringify(load(), null, 2);
  }

  function importChain(txt) {
    try {
      const arr = JSON.parse(txt);
      if (!Array.isArray(arr)) throw 0;
      save(arr);
      return true;
    } catch {
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function lastProof() {
    const chain = load();
    if (!chain.length) return null;
    return chain.at(-1);
  }

  return { addEntry, verify, exportChain, importChain, clear, lastProof };
})();
