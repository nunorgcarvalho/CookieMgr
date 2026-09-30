// Records what the bakery is doing over time so the graph has something to draw.
//
//   samples    once per second: displayed CPS, "unbuffed" CPS and measured click income
//   intervals  every buff/effect that was active, with start and end (they can overlap = stacking)
//   events     one-off things: golden cookie / reindeer pops (with their outcome) and ascensions
//
// Data lives in memory for the current session only.

CA.History = (() => {
  const SAMPLE_MS = 1000;
  const MAX_SAMPLES = 4 * 3600; // keep 4 hours
  const MAX_EVENTS = 500;
  const MAX_INTERVALS = 1500;
  const FPS = 30; // buff timers are counted in logic frames

  const samples = []; // { t, cps, base, click }
  const intervals = []; // { name, label, desc, icon, start, end|null, multCps, multClick, ... }
  const events = []; // { t, kind, title, text, gain }
  const open = {}; // buff name -> currently open interval
  let lastT = 0;
  let lastHandmade = null;
  let timer = null;

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

  function capArray(arr, max) {
    if (arr.length > max + 200) arr.splice(0, arr.length - max);
  }

  const inAscension = () => Game.OnAscend || Game.AscendTimer > 0;

  function closeInterval(iv, now) {
    iv.end = Math.min(now, iv.projEnd || now);
    delete open[iv.name];
  }

  function openInterval(b, now) {
    const elapsed = Math.max(0, ((b.maxTime || 0) - (b.time || 0)) / FPS) * 1000;
    const iv = {
      name: b.name,
      label: b.dname || b.name,
      desc: stripHtml(b.desc),
      icon: b.icon || [0, 0],
      start: now - Math.min(elapsed, SAMPLE_MS),
      end: null,
      projEnd: now + ((b.time || 0) / FPS) * 1000,
      duration: (b.maxTime || 0) / FPS,
      multCps: typeof b.multCpS === 'number' ? b.multCpS : 1,
      multClick: typeof b.multClick === 'number' ? b.multClick : 1,
      ref: b,
    };
    open[b.name] = iv;
    intervals.push(iv);
    capArray(intervals, MAX_INTERVALS);
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

  function addEvent(ev) {
    events.push({ t: Date.now(), ...ev });
    capArray(events, MAX_EVENTS);
    CA.Events.emit('history', 'event');
  }

  // ---- sampling -------------------------------------------------------------------

  function sample() {
    if (typeof Game === 'undefined' || !Game.ready) return;
    if (!CA.Settings.get('trackHistory')) return;
    const now = Date.now();

    if (inAscension()) {
      // nothing to measure while the ascension screen is up; start clean afterwards
      closeAll(now);
      lastHandmade = null;
      lastT = 0;
      return;
    }

    const dt = lastT ? (now - lastT) / 1000 : 0;
    const handmade = Game.handmadeCookies;
    let click = 0;
    if (lastHandmade !== null && dt > 0 && handmade >= lastHandmade) click = (handmade - lastHandmade) / dt;
    lastHandmade = handmade;
    lastT = now;

    const shown = 1 - (Game.cpsSucked || 0);
    samples.push({
      t: now,
      cps: Game.cookiesPs * shown,
      base: (Game.unbuffedCps || Game.cookiesPs) * shown,
      click,
    });
    capArray(samples, MAX_SAMPLES);
    trackBuffs(now);
    CA.Events.emit('history', 'sample');
  }

  // ---- one-off events -------------------------------------------------------------

  /** Wraps a shimmer type's popFunc so we can log what each pop actually did. */
  function watchShimmers() {
    if (!Game.shimmerTypes) return;
    const kinds = { golden: 'golden', reindeer: 'reindeer' };
    Object.keys(kinds).forEach((type) => {
      const st = Game.shimmerTypes[type];
      if (!st || typeof st.popFunc !== 'function') return;
      const original = st.popFunc;
      st.popFunc = function (me) {
        if (!CA.Settings.get('trackHistory')) return original.apply(this, arguments);
        const before = Game.cookies;
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
          const wrath = type === 'golden' && me && me.wrath;
          addEvent({
            kind: wrath ? 'wrath' : type,
            title: type === 'reindeer' ? 'Reindeer' : wrath ? 'Wrath cookie' : 'Golden cookie',
            text: texts.filter(Boolean).slice(0, 2).join(' — '),
            gain: Game.cookies - before,
          });
        } catch (e) {
          /* never break the game over a log entry */
        }
        return result;
      };
    });
  }

  // ---- queries ---------------------------------------------------------------------

  /** Index of the first sample with t >= time (binary search). */
  function lowerBound(time) {
    let lo = 0;
    let hi = samples.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].t < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Summary numbers for [t0, t1]. */
  function stats(t0, t1) {
    const from = lowerBound(t0);
    let n = 0;
    let sumCps = 0;
    let sumClick = 0;
    let peak = 0;
    let peakT = 0;
    for (let i = from; i < samples.length && samples[i].t <= t1; i++) {
      const s = samples[i];
      n++;
      sumCps += s.cps;
      sumClick += s.click;
      if (s.cps >= peak) {
        peak = s.cps;
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

  function clear() {
    samples.length = 0;
    intervals.length = 0;
    events.length = 0;
    Object.keys(open).forEach((k) => delete open[k]);
    lastT = 0;
    lastHandmade = null;
    CA.Events.emit('history', 'clear');
  }

  function init() {
    CA.Settings.defineOption({
      key: 'trackHistory',
      group: 'general',
      name: 'Record history',
      desc: 'Keeps a rolling 4-hour record of your CpS and active effects for the graphs.',
      default: true,
    });
    watchShimmers();
    CA.Events.on('ascend', () => {
      const now = Date.now();
      closeAll(now);
      addEvent({ kind: 'ascend', title: 'Ascended', text: 'A new run begins.', gain: 0 });
    });
    timer = setInterval(sample, SAMPLE_MS);
    sample();
  }

  return { init, samples, intervals, events, colorFor, lowerBound, stats, intervalsIn, clear, addEvent, sampleNow: sample };
})();
