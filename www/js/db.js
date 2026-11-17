/* Tiny IndexedDB wrapper — all user data stays on the device. Falls back to localStorage. */
(function () {
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej('no idb');
      const r = indexedDB.open('grimoire', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = (store, mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, mode), s = t.objectStore(store);
    const out = fn(s);
    t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out);
    t.onerror = () => rej(t.error);
  }));
  const LS = {
    items() { try { return JSON.parse(localStorage.getItem('g_items') || '{}'); } catch (e) { return {}; } },
    saveItems(o) { try { localStorage.setItem('g_items', JSON.stringify(o)); } catch (e) { alert('Storage full'); } },
  };
  let fallback = false;
  window.DB = {
    async init() { try { await open(); } catch (e) { fallback = true; } },
    async all() {
      if (fallback) return Object.values(LS.items());
      return tx('items', 'readonly', s => s.getAll());
    },
    async put(item) {
      if (fallback) { const o = LS.items(); o[item.id] = item; LS.saveItems(o); return; }
      return tx('items', 'readwrite', s => s.put(item));
    },
    async del(id) {
      if (fallback) { const o = LS.items(); delete o[id]; LS.saveItems(o); return; }
      return tx('items', 'readwrite', s => s.delete(id));
    },
    async clear() {
      if (fallback) { LS.saveItems({}); return; }
      return tx('items', 'readwrite', s => s.clear());
    },
    async get(k, def) {
      if (fallback) { try { const v = localStorage.getItem('g_kv_' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
      const v = await tx('kv', 'readonly', s => s.get(k));
      return v === undefined ? def : v;
    },
    async delKey(k) {
      if (fallback) { try { localStorage.removeItem('g_kv_' + k); } catch (e) { } return; }
      return tx('kv', 'readwrite', s => s.delete(k));
    },
    // all kv entries whose key starts with prefix -> {key: value}
    async prefixed(prefix) {
      if (fallback) { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('g_kv_' + prefix)) try { o[k.slice(5)] = JSON.parse(localStorage.getItem(k)); } catch (e) { } } return o; }
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff');
      return open().then(db => new Promise((res, rej) => {
        const o = {}, t = db.transaction('kv', 'readonly'), r = t.objectStore('kv').openCursor(range);
        r.onsuccess = () => { const c = r.result; if (c) { o[c.key] = c.value; c.continue(); } };
        t.oncomplete = () => res(o); t.onerror = () => rej(t.error);
      }));
    },
    async set(k, v) {
      if (fallback) { try { localStorage.setItem('g_kv_' + k, JSON.stringify(v)); } catch (e) { } return; }
      return tx('kv', 'readwrite', s => s.put(v, k));
    },
  };
})();
