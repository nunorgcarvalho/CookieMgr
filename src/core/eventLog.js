// The central **event** log: one place for everything that *happened* — golden/wrath cookies,
// reindeer, ascensions, stock trades, and (later) spells and macro runs. Pages show filtered
// views of it; the recorder uses it to attribute golden-cookie income.
//
//   CA.EventLog.add({ type: 'golden', title, text, cookies: +1234, data: {...} })
//
// Each event also gets t (wall ms), a (active-play ms, see core/recorder.js) and an id.
// `cookies` is the signed change to the bank the event caused (0 if none). Persisted per save
// in IndexedDB (core/store.js); the newest MAX_MEMORY are kept in memory.

CA.EventLog = (() => {
  const MAX_MEMORY = 5000;
  const MAX_STORED = 20000;
  const FLUSH_MS = 5000;

  const TYPES = {}; // type -> { name, icon, color, income }
  let saveId = null;
  let events = []; // oldest first
  let pending = [];
  let seq = 0;
  let version = 0;

  /** Describes an event type for filters/legends. `income`: its cookies count as income. */
  function defineType(type, meta) {
    TYPES[type] = { name: type, icon: '', color: '#ccc', income: false, ...meta };
  }

  function add(ev) {
    const t = Date.now();
    const s = saveId || CA.Store.saveId();
    const e = {
      title: '',
      text: '',
      cookies: 0,
      data: {},
      ...ev,
      t,
      a: CA.Recorder.activeNow(),
      s,
      id: `${s}|${t}|${++seq}`,
    };
    events.push(e);
    if (events.length > MAX_MEMORY + 200) events.splice(0, events.length - MAX_MEMORY);
    pending.push(e);
    version++;
    CA.Events.emit('eventLogged', e);
    return e;
  }

  function flush() {
    const batch = pending;
    pending = [];
    return CA.Store.putMany('events', batch);
  }

  function load() {
    const s = CA.Store.saveId();
    saveId = s;
    const addedMeanwhile = events.filter((e) => e.s === s);
    return CA.Store.allFor('events', s).then((stored) => {
      if (s !== saveId) return;
      stored.sort((x, y) => x.t - y.t);
      if (stored.length > MAX_STORED) {
        const drop = stored.splice(0, stored.length - MAX_STORED);
        CA.Store.removeMany(
          'events',
          drop.map((e) => e.id)
        );
      }
      const ids = new Set(stored.map((e) => e.id));
      events = stored.concat(addedMeanwhile.filter((e) => !ids.has(e.id))).slice(-MAX_MEMORY);
      seq = Math.max(seq, stored.length);
      version++;
      CA.Events.emit('eventLogged', null);
    });
  }

  /** Erases this save's event log. */
  function clear() {
    const ids = events.map((e) => e.id);
    events = [];
    pending = [];
    version++;
    return CA.Store.allFor('events', saveId).then((stored) =>
      CA.Store.removeMany('events', ids.concat(stored.map((e) => e.id)))
    );
  }

  /** Events of the given types (all if omitted), oldest first. */
  function list(types) {
    if (!types) return events;
    const set = new Set(types);
    return events.filter((e) => set.has(e.type));
  }

  /** Events strictly after wall time `t`. */
  function since(t) {
    let lo = 0;
    let hi = events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (events[mid].t <= t) lo = mid + 1;
      else hi = mid;
    }
    return events.slice(lo);
  }

  function init() {
    defineType('golden', { name: 'Golden cookie', icon: 'cookie', color: '#ffd54a', income: true });
    defineType('wrath', { name: 'Wrath cookie', icon: 'cookie', color: '#e5484d', income: true });
    defineType('reindeer', { name: 'Reindeer', icon: 'star', color: '#c48a5a', income: true });
    defineType('ascend', { name: 'Ascension', icon: 'star', color: '#c9bcff' });
    defineType('trade', { name: 'Stock trade', icon: 'stocks', color: '#7fe08b' });
    load();
    setInterval(flush, FLUSH_MS);
    addEventListener('pagehide', flush);
    CA.Events.on('storeReloaded', load);
    // A different save was loaded (import/hard reset): switch logs along with the recorder.
    CA.Events.on('history', (why) => {
      if (why === 'load' && CA.Store.saveId() !== saveId) load();
    });
  }

  return { init, add, list, since, flush, clear, defineType, types: () => TYPES, version: () => version };
})();
