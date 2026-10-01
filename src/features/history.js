// What the CpS graph needs beyond plain state history:
//
//   samples    the recorder's frames (core/recorder.js) — t, cps, base, click and every other
//              recorded state; this module no longer samples anything itself
//   intervals  every buff/effect that was active, with start and end (they can overlap = stacking)
//   events     golden/wrath cookie and reindeer pops (with their outcome) and ascensions, as
//              entries in the central event log (core/eventLog.js)
//
// The buff log is stored in IndexedDB (core/store.js) per save. Nothing here touches
// localStorage — see core/store.js for why that matters.

CA.History = (() => {
  const TICK_MS = 1000;
  const MAX_INTERVALS = 1500;
  const PERSIST_MS = 30000;
  const FPS = 30; // buff timers are counted in logic frames
  const MARKER_TYPES = ['golden', 'wrath', 'reindeer', 'ascend'];
  const LEGACY_KEY = 'CookieMgr.history.v1';

  let intervals = []; // { name, label, desc, icon, start, end|null, multCps, multClick, ... }
  const open = {}; // buff name -> currently open interval
  let dirty = false;

  // ---- colours -------------------------------------------------------------------

  const KNOWN_COLORS = {
    Frenzy: '#f4c430',
    'Elder frenzy': '#ef5350',
    'Click frenzy': '#42a5f5',
    Dragonflight: '#ff8a3d',
    'Dragon Harvest': '#aeea00',
    'Blood frenzy': '#c62828',
    Clot: '#8e6bbf',
    'Cursed finger': '#8d6e63',
    'Cookie storm': '#26c6da',
    'Everything must go': '#ec407a',
    'Sugar frenzy': '#f8bbd0',
    Devastation: '#b71c1c',
    'Sugar blessing': '#ffd54f',
  };
  const colorCache = {};
  function colorFor(name) {
    if (KNOWN_COLORS[name]) return KNOWN_COLORS[name];
    if (!colorCache[name]) {
      let h = 0;
      for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
      colorCache[name] = `hsl(${(h * 137.508) % 360}, 62%, 58%)`;
    }
    return colorCache[name];
  }

  // ---- helpers -------------------------------------------------------------------

  const stripHtml = (s) =>
    String(s || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const inAscension = () => Game.OnAscend || Game.AscendTimer > 0;

  // ---- buff intervals --------------------------------------------------------------

  function closeInterval(iv, now) {
    iv.end = Math.min(now, iv.projEnd || now);
    delete open[iv.name];
    dirty = true;
  }

  function openInterval(b, now) {
    const elapsed = Math.max(0, ((b.maxTime || 0) - (b.time || 0)) / FPS) * 1000;
    const iv = {
      name: b.name,
      label: b.dname || b.name,
      desc: stripHtml(b.desc),
      icon: b.icon || [0, 0],
      start: now - Math.min(elapsed, TICK_MS),
      end: null,
      projEnd: now + ((b.time || 0) / FPS) * 1000,
      duration: (b.maxTime || 0) / FPS,
      multCps: typeof b.multCpS === 'number' ? b.multCpS : 1,
      multClick: typeof b.multClick === 'number' ? b.multClick : 1,
      ref: b,
    };
    open[b.name] = iv;
    intervals.push(iv);
    // Log effects that just started (not ones already running when we first looked, e.g. after a reload).
    if (elapsed <= TICK_MS * 2) {
      const bits = [];
      if (Math.abs(iv.multCps - 1) > 0.001) bits.push(`×${Math.round(iv.multCps * 100) / 100} CpS`);
      if (Math.abs(iv.multClick - 1) > 0.001) bits.push(`×${Math.round(iv.multClick * 100) / 100} clicks`);
      CA.EventLog.add({
        type: 'effect',
        title: `${iv.label} started`,
        text: [bits.join(', '), iv.duration ? `${Math.round(iv.duration)}s` : ''].filter(Boolean).join(' · '),
        data: { name: iv.name, duration: iv.duration, multCps: iv.multCps, multClick: iv.multClick },
      });
    }
    if (intervals.length > MAX_INTERVALS + 200) intervals.splice(0, intervals.length - MAX_INTERVALS);
    dirty = true;
    return iv;
  }

  function trackBuffs(now) {
    const seen = {};
    for (const name in Game.buffs) {
      const b = Game.buffs[name];
      if (!b || b.time <= 0) continue;
      seen[name] = true;
      let iv = open[name];
      if (iv && iv.ref !== b) {
        closeInterval(iv, now);
        iv = null;
      }
      if (!iv) iv = openInterval(b, now);
      iv.projEnd = now + (b.time / FPS) * 1000;
      iv.duration = Math.max(iv.duration, (now - iv.start) / 1000 + b.time / FPS);
      if (typeof b.multCpS === 'number') iv.multCps = b.multCpS;
      if (typeof b.multClick === 'number') iv.multClick = b.multClick;
    }
    Object.keys(open).forEach((name) => {
      if (!seen[name]) closeInterval(open[name], now);
    });
  }

  function closeAll(now) {
    Object.keys(open).forEach((name) => closeInterval(open[name], now));
  }

  function tick() {
    if (typeof Game === 'undefined' || !Game.ready || !CA.Settings.get('trackHistory')) return;
    const now = Date.now();
    if (inAscension()) closeAll(now);
    else trackBuffs(now);
  }

  // ---- one-off events -------------------------------------------------------------

  const EVENT_ICON = { golden: [10, 14], wrath: [15, 5], reindeer: [12, 9] };

  function addEvent(ev) {
    const e = CA.EventLog.add(ev);
    CA.Events.emit('history', 'event');
    return e;
  }

  /** Wraps a shimmer type's popFunc so we can log what each pop actually did, notify about it
   *  right away, and record exactly which buffs it granted (name/duration/multipliers), not
   *  just the scraped popup text. */
  function watchShimmers() {
    if (!Game.shimmerTypes) return;
    ['golden', 'reindeer'].forEach((shimmer) => {
      const st = Game.shimmerTypes[shimmer];
      if (!st || typeof st.popFunc !== 'function') return;
      const original = st.popFunc;
      st.popFunc = function (me) {
        if (!CA.Settings.get('trackHistory')) return original.apply(this, arguments);
        const before = Game.cookies;
        const buffsBefore = Object.keys(Game.buffs || {});
        const texts = [];
        const popup = Game.Popup;
        const notify = Game.Notify;
        Game.Popup = function (text) {
          texts.push(stripHtml(text));
          return popup.apply(this, arguments);
        };
        Game.Notify = function (title) {
          if (title) texts.push(stripHtml(title));
          return notify.apply(this, arguments);
        };
        let result;
        try {
          result = original.apply(this, arguments);
        } finally {
          Game.Popup = popup;
          Game.Notify = notify;
        }
        try {
          const wrath = shimmer === 'golden' && me && me.wrath;
          const type = wrath ? 'wrath' : shimmer;
          const title = shimmer === 'reindeer' ? 'Reindeer' : wrath ? 'Wrath cookie' : 'Golden cookie';
          const text = texts.filter(Boolean).slice(0, 2).join(' — ');
          const cookies = Game.cookies - before;
          // Buffs that didn't exist a moment ago must have come from this pop.
          const effects = Object.keys(Game.buffs || {})
            .filter((name) => !buffsBefore.includes(name))
            .map((name) => {
              const b = Game.buffs[name];
              return {
                name,
                duration: (b.maxTime || 0) / FPS,
                multCps: typeof b.multCpS === 'number' ? b.multCpS : 1,
                multClick: typeof b.multClick === 'number' ? b.multClick : 1,
              };
            });
          addEvent({ type, title, text, cookies, data: { effects } });
          if (CA.Settings.get('goldenNotify')) {
            const beautify = (v) => (typeof Beautify === 'function' ? Beautify(v) : Math.round(v).toString());
            const desc = text || (Math.abs(cookies) >= 1 ? `${cookies >= 0 ? '+' : '−'}${beautify(Math.abs(cookies))} cookies` : '');
            CA.Util.notify(title, desc, EVENT_ICON[type] || CA.ICON, 1.5);
          }
        } catch (e) {
          /* never break the game over a log entry */
        }
        return result;
      };
    });
  }

  // ---- queries ---------------------------------------------------------------------

  const samples = () => CA.Recorder.frames();
  const lowerBound = (time) => CA.Recorder.lowerBound(time);
  /** Golden/wrath/reindeer pops and ascensions, oldest first. */
  const events = () => CA.EventLog.list(MARKER_TYPES);

  /** Summary numbers for [t0, t1]. */
  function stats(t0, t1) {
    const all = samples();
    const from = lowerBound(t0);
    let n = 0;
    let sumCps = 0;
    let sumClick = 0;
    let peak = 0;
    let peakT = 0;
    for (let i = from; i < all.length && all[i].t <= t1; i++) {
      const s = all[i];
      const cps = s.cps || 0;
      n++;
      sumCps += cps;
      sumClick += s.click || 0;
      if (cps >= peak) {
        peak = cps;
        peakT = s.t;
      }
    }
    const avg = n ? sumCps / n : 0;
    const avgClick = n ? sumClick / n : 0;
    return { n, avg, avgClick, peak, peakT, clickShare: avg + avgClick > 0 ? avgClick / (avg + avgClick) : 0 };
  }

  /** Intervals overlapping [t0, t1]; open ones end "now". */
  function intervalsIn(t0, t1) {
    const now = Date.now();
    return intervals.filter((iv) => (iv.end || now) >= t0 && iv.start <= t1);
  }

  // ---- persistence -------------------------------------------------------------------

  function persist() {
    if (!dirty || loadedFor !== CA.Store.saveId()) return Promise.resolve();
    dirty = false;
    // ref points at a live game buff object — not storable
    return CA.Store.setKV(
      'buffs',
      intervals.map(({ ref, ...rest }) => rest),
      loadedFor
    );
  }

  let loadedFor = null;

  function load() {
    Object.keys(open).forEach((k) => delete open[k]);
    loadedFor = CA.Store.saveId();
    return CA.Store.getKV('buffs').then((stored) => {
      intervals = (Array.isArray(stored) ? stored : []).map((iv) => {
        // An interval still "open" as of the last save can't be trusted to still be running
        // (there's no live Game.buffs reference for it any more): close it where we last saw it.
        // If the buff really is still active, the next tick opens a fresh interval for it.
        if (iv.end == null) iv.end = iv.projEnd ? Math.min(iv.projEnd, Date.now()) : iv.start;
        return iv;
      });
      CA.Events.emit('history', 'buffs');
    });
  }

  /** Erases everything recorded for this save: state history, event log, buff log. */
  function clear() {
    intervals = [];
    Object.keys(open).forEach((k) => delete open[k]);
    dirty = true;
    return Promise.all([CA.Recorder.clear(), CA.EventLog.clear(), persist()]).then(() => CA.Events.emit('history', 'clear'));
  }

  function init() {
    CA.Settings.defineOption({
      key: 'goldenNotify',
      icon: 'sparkle',
      group: 'general',
      name: 'Golden cookie notifications',
      desc: 'A quick notification the moment a golden or wrath cookie (or reindeer) is popped.',
      default: true,
    });
    // Up to v1.2 the history lived in localStorage; it's in IndexedDB now. Free that space.
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {
      /* ignore */
    }
    load();
    watchShimmers();
    CA.Events.on('ascend', () => {
      closeAll(Date.now());
      addEvent({ type: 'ascend', title: 'Ascended', text: 'A new run begins.' });
    });
    CA.Events.on('storeReloaded', load);
    CA.Events.on('history', (why) => {
      if (why === 'load' && loadedFor !== CA.Store.saveId()) load(); // a different save was loaded
    });
    setInterval(tick, TICK_MS);
    setInterval(persist, PERSIST_MS);
    addEventListener('pagehide', persist);
  }

  return {
    init,
    get samples() {
      return samples();
    },
    get intervals() {
      return intervals;
    },
    get events() {
      return events();
    },
    colorFor,
    lowerBound,
    stats,
    intervalsIn,
    clear,
    addEvent,
  };
})();
