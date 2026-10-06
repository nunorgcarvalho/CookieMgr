// Records every recorded state (core/states.js) once a second into **frames**:
//   { t: wall-clock ms, a: active-play ms, dt: seconds covered, <stateId>: value, ... }
//
// Active play time: time only counts while the game is actually running. A gap of more than
// MAX_GAP_MS between ticks (page closed, computer asleep, a throttled background tab) adds just
// one tick's worth, and flows aren't computed across it — so offline/background earnings never
// land in a 1-second frame, and graphs can drop inactive time entirely (frame.a).
//
// Progressive resolution, by active-time age:
//   tier 0  every second    for the last 3 hours of active play
//   tier 1  every 15 s      up to 24 hours back
//   tier 2  every 2 min     up to 7 days back
//   tier 3  every 15 min    beyond that, kept indefinitely
// Frames are grouped into chunks (per tier); once a chunk ages past its tier it is merged into
// the next tier's resolution (gauges by time-weighted mean, counters by last value, flows by
// sum — see CA.States) and deleted. Everything lives in IndexedDB (core/store.js) per save,
// and the whole history can be exported to / imported from a file.

CA.Recorder = (() => {
  const SAMPLE_MS = 1000;
  const MAX_GAP_MS = 5000;
  const FLUSH_MS = 15000;
  const COMPACT_MS = 60000;
  const HOUR = 3600 * 1000;
  const TIERS = [
    { res: 1000, maxAge: 3 * HOUR, chunk: 600, label: '1 s' },
    { res: 15000, maxAge: 24 * HOUR, chunk: 480, label: '15 s' },
    { res: 120000, maxAge: 7 * 24 * HOUR, chunk: 720, label: '2 min' },
    { res: 900000, maxAge: Infinity, chunk: 672, label: '15 min' },
  ];
  const EXPORT_FORMAT = 'cookiemgr-history';

  let saveId = null;
  let tiers = TIERS.map(() => []); // per tier: chunks { id, s, tier, start, frames }, oldest first
  let all = []; // every frame across tiers, oldest first (tiers cover disjoint, ordered spans)
  let active = 0;
  let lastTick = 0;
  let prev = null;
  let ready = false;
  let loading = null;
  let rev = 0; // bumped whenever frames() changes
  const dirty = new Set();
  let toDelete = [];

  const inAscension = () => CA.Ascension.inProgress();

  // ---- frames ----------------------------------------------------------------------------

  /** Merges consecutive frames into one: gauges by dt-weighted mean, counters by last value,
   *  flows by sum. Keys from states no longer defined fall back to mean. */
  function merge(group) {
    const last = group[group.length - 1];
    const out = { t: last.t, a: last.a, dt: 0 };
    const keys = new Set();
    group.forEach((f) => {
      out.dt += f.dt || 0;
      Object.keys(f).forEach((k) => {
        if (k !== 't' && k !== 'a' && k !== 'dt') keys.add(k);
      });
    });
    keys.forEach((k) => {
      const def = CA.States.get(k);
      const agg = def ? def.agg : 'mean';
      let sum = 0;
      let w = 0;
      let lastV;
      let n = 0;
      group.forEach((f) => {
        const v = f[k];
        if (!Number.isFinite(v)) return;
        n++;
        lastV = v;
        const fw = f.dt || 0;
        if (agg === 'mean') {
          sum += v * fw;
          w += fw;
        } else sum += v;
      });
      if (!n) return;
      if (agg === 'last') out[k] = lastV;
      else if (agg === 'sum') out[k] = sum;
      else out[k] = w > 0 ? sum / w : lastV;
    });
    return out;
  }

  /** Groups frames into `res`-ms buckets of active time and merges each bucket. */
  function downsample(frames, res) {
    const out = [];
    let group = [];
    let idx = null;
    frames.forEach((f) => {
      const b = Math.floor(f.a / res);
      if (idx !== null && b !== idx) {
        out.push(merge(group));
        group = [];
      }
      idx = b;
      group.push(f);
    });
    if (group.length) out.push(merge(group));
    return out;
  }

  // ---- chunks ----------------------------------------------------------------------------

  const newChunk = (tier, start) => ({ id: `${saveId}|${tier}|${start}`, s: saveId, tier, start, frames: [] });

  function appendTo(tier, frames) {
    if (!frames.length) return;
    const list = tiers[tier];
    const res = TIERS[tier].res;
    let chunk = list[list.length - 1];
    frames.forEach((f) => {
      // A bucket can straddle two source chunks; fold its second half into the first.
      if (tier > 0 && chunk && chunk.frames.length) {
        const tail = chunk.frames[chunk.frames.length - 1];
        if (Math.floor(tail.a / res) === Math.floor(f.a / res)) {
          chunk.frames[chunk.frames.length - 1] = merge([tail, f]);
          dirty.add(chunk);
          return;
        }
      }
      if (!chunk || chunk.frames.length >= TIERS[tier].chunk) {
        chunk = newChunk(tier, f.a);
        list.push(chunk);
      }
      chunk.frames.push(f);
      dirty.add(chunk);
    });
  }

  function rebuildAll() {
    rev++;
    all = [];
    for (let k = TIERS.length - 1; k >= 0; k--) tiers[k].forEach((c) => (all = all.concat(c.frames)));
  }

  /** Moves chunks that have aged out of their tier into the next tier's resolution. */
  function compact() {
    let changed = false;
    for (let k = 0; k < TIERS.length - 1; k++) {
      while (tiers[k].length > 1) {
        const c = tiers[k][0];
        const end = c.frames.length ? c.frames[c.frames.length - 1].a : c.start;
        if (active - end <= TIERS[k].maxAge) break;
        appendTo(k + 1, downsample(c.frames, TIERS[k + 1].res));
        tiers[k].shift();
        dirty.delete(c);
        toDelete.push(c.id);
        changed = true;
      }
    }
    if (changed) {
      rebuildAll();
      CA.Events.emit('history', 'compact');
    }
    return changed;
  }

  // ---- sampling --------------------------------------------------------------------------

  function tick() {
    if (!ready || typeof Game === 'undefined' || !Game.ready) return;
    if (CA.Store.saveId() !== saveId) {
      switchSave();
      return;
    }
    if (!CA.Settings.get('trackHistory') || inAscension()) {
      // nothing to measure; start clean afterwards
      lastTick = 0;
      prev = null;
      return;
    }
    const now = Date.now();
    const gap = lastTick ? now - lastTick : SAMPLE_MS;
    const continuous = lastTick && gap <= MAX_GAP_MS;
    const step = continuous ? gap : SAMPLE_MS;
    active += step;
    lastTick = now;
    const frame = { t: now, a: active, dt: step / 1000 };
    const ctx = {
      dt: frame.dt,
      prev: continuous ? prev : null,
      frame,
      events: CA.EventLog.since(continuous && prev ? prev.t : now),
    };
    CA.States.recorded().forEach((d) => {
      const v = CA.States.value(d.id, ctx);
      if (Number.isFinite(v)) frame[d.id] = v;
    });
    prev = frame;
    appendTo(0, [frame]);
    all.push(frame);
    rev++;
    CA.Events.emit('history', 'sample');
  }

  // ---- persistence -----------------------------------------------------------------------

  function flush() {
    if (!saveId) return Promise.resolve();
    const chunks = [...dirty];
    dirty.clear();
    const dels = toDelete;
    toDelete = [];
    return Promise.all([
      CA.Store.putMany('chunks', chunks),
      CA.Store.removeMany('chunks', dels),
      CA.Store.setKV('recorder', { active }, saveId),
    ]);
  }

  function load() {
    ready = false;
    saveId = CA.Store.saveId();
    const s = saveId;
    loading = Promise.all([CA.Store.allFor('chunks', s), CA.Store.getKV('recorder', s)]).then(([chunks, meta]) => {
      if (s !== saveId) return; // switched again meanwhile
      tiers = TIERS.map(() => []);
      chunks
        .filter((c) => tiers[c.tier] && Array.isArray(c.frames))
        .sort((x, y) => x.tier - y.tier || x.start - y.start)
        .forEach((c) => tiers[c.tier].push(c));
      let maxA = 0;
      tiers.forEach((list) => list.forEach((c) => c.frames.forEach((f) => (maxA = Math.max(maxA, f.a)))));
      active = Math.max((meta && meta.active) || 0, maxA);
      dirty.clear();
      toDelete = [];
      rebuildAll();
      compact();
      prev = null;
      lastTick = 0;
      ready = true;
      CA.Events.emit('history', 'load');
    });
    return loading;
  }

  function switchSave() {
    ready = false;
    flush().then(load);
  }

  /** Erases this save's recorded state history (chunks only). */
  function clear() {
    const ids = [];
    tiers.forEach((list) => list.forEach((c) => ids.push(c.id)));
    tiers = TIERS.map(() => []);
    all = [];
    rev++;
    dirty.clear();
    toDelete = [];
    prev = null;
    return CA.Store.removeMany('chunks', ids).then(() => CA.Events.emit('history', 'clear'));
  }

  // ---- queries ---------------------------------------------------------------------------

  const frames = () => all;

  /** Frames that have `key`, as { t, a, v } points — cached until the frames change. */
  const seriesCache = new Map();
  function series(key) {
    let c = seriesCache.get(key);
    if (c && c.rev === rev) return c.pts;
    // sampling only appends; anything else (load/compact/clear) replaces `all` → rebuild
    if (!c || c.src !== all) c = { src: all, n: 0, pts: [] };
    for (let i = c.n; i < all.length; i++) {
      const f = all[i];
      if (Number.isFinite(f[key])) c.pts.push({ t: f.t, a: f.a, v: f[key] });
    }
    c.n = all.length;
    c.rev = rev;
    seriesCache.set(key, c);
    return c.pts;
  }

  /** Index of the first frame with `key` (default t) >= value — binary search. */
  function lowerBound(value, key = 't') {
    let lo = 0;
    let hi = all.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (all[mid][key] < value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Wall-clock time at active-play time `a`. Within a frame both clocks run together. */
  function timeAt(a) {
    if (!all.length) return Date.now() - (active - a);
    const i = lowerBound(a, 'a');
    if (i >= all.length) {
      const l = all[all.length - 1];
      return l.t + (a - l.a);
    }
    return all[i].t - (all[i].a - a);
  }

  /** Active-play time at wall-clock time `t`; a moment while the game wasn't running maps to
   *  where play resumed. */
  function activeAt(t) {
    if (!all.length) return active;
    const i = lowerBound(t);
    if (i >= all.length) {
      const l = all[all.length - 1];
      return l.a + Math.max(0, Math.min(t - l.t, MAX_GAP_MS));
    }
    const f = all[i];
    return f.a - Math.min(f.t - t, (f.dt || 1) * 1000);
  }

  function summary() {
    const perTier = tiers.map((list, k) => ({
      label: TIERS[k].label,
      frames: list.reduce((n, c) => n + c.frames.length, 0),
      chunks: list.length,
    }));
    return { active, frames: all.length, perTier, first: all[0] || null, ready };
  }

  // ---- export / import -------------------------------------------------------------------

  /** Everything recorded for this save (state history, event log, small blobs) as one object. */
  function exportData() {
    return flush()
      .then(() => CA.EventLog.flush())
      .then(() => Promise.all([CA.Store.allFor('chunks', saveId), CA.Store.allFor('events', saveId), CA.Store.allFor('kv', saveId)]))
      .then(([chunks, events, kv]) => ({
        format: EXPORT_FORMAT,
        version: 1,
        cookieMgr: CA.VERSION,
        exportedAt: Date.now(),
        bakery: typeof Game !== 'undefined' ? Game.bakeryName : '',
        saveId,
        chunks,
        events,
        kv,
      }));
  }

  /** Replaces this save's recorded data with an export (from any save/browser). */
  function importData(data) {
    if (!data || data.format !== EXPORT_FORMAT || !Array.isArray(data.chunks)) {
      return Promise.reject(new Error('Not a CookieMgr history export.'));
    }
    const s = saveId;
    const rekey = (r, rest) => ({ ...r, s, id: `${s}|${rest}` });
    const chunks = data.chunks.filter((c) => c && Array.isArray(c.frames)).map((c) => rekey(c, `${c.tier}|${c.start}`));
    const events = (data.events || []).filter((e) => e && Number.isFinite(e.t)).map((e, i) => rekey(e, `${e.t}|i${i}`));
    const kv = (data.kv || []).filter((r) => r && r.k).map((r) => rekey(r, r.k));
    return CA.Store.clearSave(s)
      .then(() => Promise.all([CA.Store.putMany('chunks', chunks), CA.Store.putMany('events', events), CA.Store.putMany('kv', kv)]))
      .then(() => {
        CA.Events.emit('storeReloaded');
        return load();
      })
      .then(() => ({ chunks: chunks.length, events: events.length }));
  }

  /** Downloads exportData() as a .json file. */
  function exportFile() {
    return exportData().then((data) => {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = String(data.bakery || 'bakery').replace(/[^\w-]+/g, '_');
      a.href = url;
      a.download = `cookiemgr-history-${name}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return data;
    });
  }

  /** Reads a File chosen by the user and imports it. */
  function importFile(file) {
    return file.text().then((txt) => importData(JSON.parse(txt)));
  }

  function init() {
    CA.Settings.defineOption({
      key: 'trackHistory',
      icon: 'record',
      group: 'general',
      name: 'Record history',
      desc: 'Records CpS, cookies, prestige and more over time for the graphs — every second for the last 3 hours of play, coarser further back. Kept in this browser (not in your game save); export it under History data below.',
      default: true,
    });
    load();
    setInterval(tick, SAMPLE_MS);
    setInterval(flush, FLUSH_MS);
    setInterval(compact, COMPACT_MS);
    addEventListener('pagehide', flush);
  }

  /** dt-weighted averages of the newest `seconds` of active play (live, independent of the view). */
  function recent(seconds) {
    const frames = all;
    const from = active - seconds * 1000;
    // each value averaged over the seconds it was actually measured (the first frame after a
    // gap has no clicking / baked figures — it mustn't count as a second of zero)
    const sum = { cps: 0, click: 0, clickRaw: 0, base: 0, clickRate: 0 };
    const secs = { cps: 0, click: 0, clickRaw: 0, base: 0, clickRate: 0 };
    let earned = 0;
    let earnedSecs = 0;
    let total = 0;
    for (let i = frames.length - 1; i >= 0 && frames[i].a > from; i--) {
      const f = frames[i];
      const dt = f.dt || 0;
      total += dt;
      Object.keys(sum).forEach((k) => {
        // frames from before v2.4 have no clickRaw: use clicking as it was
        const v = k === 'clickRaw' && !Number.isFinite(f.clickRaw) ? f.click : f[k];
        if (!Number.isFinite(v)) return;
        sum[k] += v * dt;
        secs[k] += dt;
      });
      if (Number.isFinite(f.earned)) {
        earned += f.earned;
        earnedSecs += dt;
      }
    }
    if (!total) return null;
    const per = (k) => (secs[k] ? sum[k] / secs[k] : 0);
    return { cps: per('cps'), click: per('click'), clickRaw: per('clickRaw'), base: per('base'), clickRate: secs.clickRate ? per('clickRate') : NaN, actual: earnedSecs ? earned / earnedSecs : 0, secs: total };
  }

  return {
    recent,
    init,
    frames,
    series,
    revision: () => rev,
    lowerBound,
    timeAt,
    activeAt,
    summary,
    clear,
    flush,
    compact,
    exportData,
    importData,
    exportFile,
    importFile,
    activeNow: () => active,
    isReady: () => ready,
    whenLoaded: () => loading,
    TIERS,
    _merge: merge,
    _downsample: downsample,
  };
})();
