// Persistent storage for everything CookieMgr *records* (state history, the event log, small
// key/value blobs), in IndexedDB rather than localStorage.
//
// Why not localStorage: the real Cookie Clicker save lives in localStorage, browsers give
// localStorage only ~5-10MB per site, and the game silently swallows its own quota errors —
// so add-on data there can quietly stop the game from saving (see v1.2.2). IndexedDB has its
// own, far larger quota, so nothing we store here can crowd out the game's save.
//
// Three object stores, each record carrying the save it belongs to (`s`, see saveId()):
//   chunks  { id, s, tier, start, frames: [...] }   recorded state history (core/recorder.js)
//   events  { id, s, t, ... }                       the event log (core/eventLog.js)
//   kv      { id, s, k, v }                         small blobs (stock cost basis, buff log, …)
// If IndexedDB is unavailable (very old browser, some private modes) every call resolves to an
// empty result and CookieMgr just runs without persistence.

CA.Store = (() => {
  const DB_NAME = 'CookieMgr';
  const DB_VERSION = 1;
  const STORES = ['chunks', 'events', 'kv'];
  let dbPromise = null;

  /** Identifies the current save, so two bakeries in one browser don't mix their history. */
  function saveId() {
    return typeof Game !== 'undefined' && Game.fullDate ? String(Game.fullDate) : 'default';
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const idb = typeof indexedDB !== 'undefined' ? indexedDB : null;
      if (!idb) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = idb.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' }).createIndex('s', 's');
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch((e) => CA.Util.log('IndexedDB unavailable — recorded history will not persist.', e));
    return dbPromise;
  }

  /** Runs `fn(objectStore)` in one transaction; resolves with fn's IDBRequest result (if any). */
  function run(store, mode, fn) {
    return open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(store, mode);
          const req = fn(tx.objectStore(store));
          tx.oncomplete = () => resolve(req && 'result' in req ? req.result : undefined);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        })
    );
  }

  const quiet = (p, fallback) => p.catch(() => fallback);

  const put = (store, record) => quiet(run(store, 'readwrite', (os) => os.put(record)));
  const putMany = (store, records) =>
    records.length
      ? quiet(
          run(store, 'readwrite', (os) => {
            records.forEach((r) => os.put(r));
          })
        )
      : Promise.resolve();
  const remove = (store, id) => quiet(run(store, 'readwrite', (os) => os.delete(id)));
  const removeMany = (store, ids) =>
    ids.length
      ? quiet(
          run(store, 'readwrite', (os) => {
            ids.forEach((id) => os.delete(id));
          })
        )
      : Promise.resolve();
  /** Every record in `store` belonging to save `s`. */
  const allFor = (store, s) => quiet(run(store, 'readonly', (os) => os.index('s').getAll(s)), []);

  /** Deletes every record for save `s` across all stores. */
  function clearSave(s) {
    return Promise.all(
      STORES.map((store) =>
        quiet(
          run(store, 'readwrite', (os) => {
            const req = os.index('s').openKeyCursor(s);
            req.onsuccess = () => {
              const cur = req.result;
              if (!cur) return;
              os.delete(cur.primaryKey);
              cur.continue();
            };
          })
        )
      )
    );
  }

  // ---- key/value convenience ------------------------------------------------------------
  const kvId = (s, k) => `${s}|${k}`;
  const getKV = (k, s = saveId()) => quiet(run('kv', 'readonly', (os) => os.get(kvId(s, k)))).then((r) => (r ? r.v : undefined));
  const setKV = (k, v, s = saveId()) => put('kv', { id: kvId(s, k), s, k, v });

  const available = () => open().then(
    () => true,
    () => false
  );

  return { saveId, open, available, put, putMany, remove, removeMany, allFor, clearSave, getKV, setKV };
})();
