// Garden history: how many of each seed were at each growth stage, over time — for the growth
// chart on the Garden page.
//
// The plot only changes at garden ticks (every 3–15 minutes) and when something is planted or
// harvested, so instead of a column per seed × stage in every recorder frame, this keeps a
// snapshot each time the plot changes: { t, a, c: { 'bakerWheat:3': 5, … } } (t wall clock,
// a active time, stages 0 bud … 3 mature). Kept per save in IndexedDB (CA.Store key-value),
// trimmed to the newest MAX snapshots.
//
// It also logs a 'garden' event when a seed gets unlocked (shown as a marker on the chart).

CA.GardenHistory = (() => {
  const KV = 'gardenHistory';
  const SAMPLE_MS = 5000;
  const MAX = 6000;
  const SAVE_MS = 30000;
  const STAGES = ['bud', 'sprout', 'bloom', 'mature'];

  let samples = [];
  let lastKey = '';
  let unlocked = null; // Set of unlocked plant keys, to spot new ones
  let dirty = false;
  let loaded = false;

  /** Each seed's colour, picked to match its sprite. Unknown seeds get a stable hashed hue. */
  const COLORS = {
    bakerWheat: '#e3c46b',
    thumbcorn: '#f0d43c',
    cronerice: '#c8b4e6',
    gildmillet: '#f7b733',
    clover: '#4caf50',
    goldenClover: '#ffd700',
    shimmerlily: '#cfe8ff',
    elderwort: '#9b72cf',
    bakeberry: '#d6453d',
    chocoroot: '#7a5236',
    whiteChocoroot: '#f1e3c8',
    whiteMildew: '#dcdcdc',
    brownMold: '#9a7258',
    meddleweed: '#8bc34a',
    whiskerbloom: '#f6a9cb',
    chimerose: '#ef3e7a',
    nursetulip: '#ffc2d9',
    drowsyfern: '#2bb3a3',
    wardlichen: '#aab43a',
    keenmoss: '#5e9a33',
    queenbeet: '#9c1655',
    queenbeetLump: '#c2185b',
    duketater: '#d9aa6a',
    crumbspore: '#b39b8c',
    doughshroom: '#f6dfae',
    glovemorel: '#c9763f',
    cheapcap: '#9fb4bf',
    foolBolete: '#ff6b5b',
    wrinklegill: '#7d7489',
    greenRot: '#5a8f42',
    shriekbulb: '#8a63d2',
    tidygrass: '#3fae4a',
    everdaisy: '#fff38a',
    ichorpuff: '#ff9a72',
  };
  function colorOf(key) {
    if (COLORS[key]) return COLORS[key];
    let h = 0;
    for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${h}, 55%, 60%)`;
  }
  /** A stage's shade of a seed's colour: young stages darker, mature the full colour. */
  function shade(key, stage) {
    const base = colorOf(key);
    const dark = [0.62, 0.42, 0.2, 0][stage] || 0;
    return dark ? mix(base, '#1e140a', dark) : base;
  }
  function mix(a, b, f) {
    const p = (c) => {
      if (c.startsWith('hsl')) return null;
      const n = parseInt(c.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const x = p(a);
    const y = p(b);
    if (!x || !y) return a;
    const m = x.map((v, i) => Math.round(v * (1 - f) + y[i] * f));
    return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }

  // ---- sampling ---------------------------------------------------------------------------

  const stageOf = (me, age) => (age >= me.mature ? 3 : age >= me.mature * 0.666 ? 2 : age >= me.mature * 0.333 ? 1 : 0);

  /** The garden right now: { 'key:stage': count }. */
  function countsNow(M) {
    const c = {};
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const tile = M.plot[y] && M.plot[y][x];
        if (!tile || !tile[0]) continue;
        if (typeof M.isTileUnlocked === 'function' && !M.isTileUnlocked(x, y)) continue;
        const me = M.plantsById[tile[0] - 1];
        if (!me || !me.key) continue;
        const k = `${me.key}:${stageOf(me, tile[1])}`;
        c[k] = (c[k] || 0) + 1;
      }
    }
    return c;
  }

  const activeNow = () => {
    const fr = CA.Recorder.frames();
    const last = fr[fr.length - 1];
    return last ? last.a + (Date.now() - last.t) : Date.now();
  };

  function sample() {
    const M = CA.Garden.minigame();
    if (!M) return;
    checkUnlocks(M);
    const c = countsNow(M);
    const key = JSON.stringify(c);
    if (key === lastKey) return;
    lastKey = key;
    samples.push({ t: Date.now(), a: activeNow(), c });
    if (samples.length > MAX) samples.splice(0, samples.length - MAX);
    dirty = true;
    CA.Events.emit('gardenHistory');
  }

  function checkUnlocks(M) {
    const now = new Set(Object.keys(M.plants || {}).filter((k) => M.plants[k].unlocked));
    if (unlocked) {
      now.forEach((k) => {
        if (unlocked.has(k)) return;
        const me = M.plants[k];
        CA.EventLog.add({ type: 'garden', title: `Unlocked ${me.name}`, text: `${now.size} of ${Object.keys(M.plants).length} seeds`, data: { seed: k } });
      });
    }
    unlocked = now;
  }

  function persist() {
    if (!dirty || !loaded) return Promise.resolve();
    dirty = false;
    return CA.Store.setKV(KV, samples).catch(() => (dirty = true));
  }

  /** Snapshots with `key` ('t' or 'a') ≤ x1, plus the one in force at x0. */
  const list = () => samples;

  function init() {
    CA.EventLog.defineType('garden', { name: 'Garden', icon: 'leaf', color: '#9fe06a' });
    CA.Store.getKV(KV)
      .then((v) => {
        if (Array.isArray(v)) samples = v.concat(samples).slice(-MAX);
        if (samples.length) lastKey = JSON.stringify(samples[samples.length - 1].c);
      })
      .catch(() => {})
      .finally(() => {
        loaded = true;
        dirty = dirty || samples.length > 0;
      });
    setInterval(sample, SAMPLE_MS);
    setInterval(persist, SAVE_MS);
    addEventListener('pagehide', persist);
    setTimeout(sample, 1000);
  }

  return { init, sample, list, colorOf, shade, STAGES, countsNow, flush: () => ((dirty = true), persist()) };
})();
