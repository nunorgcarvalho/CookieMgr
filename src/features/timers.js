// Timers: when things will happen — Cookie Monster's timer bar and the timing parts of its statistics,
// worked out from the game's own rules (main.js):
//
//   golden cookie / reindeer   each frame without one, the timer (time) counts up; past minTime a
//                              cookie appears with chance ((time − minTime) ÷ (maxTime − minTime))⁵
//                              that frame (so surely by maxTime). From that, exactly: the soonest it
//                              can come, the latest, the expected wait, the median, the chance it
//                              comes within N seconds. (Cookie Monster only shows the min and max.)
//   buffs                      seconds left of each effect, its multipliers
//   sugar lump                 seconds until mature / ripe / overripe (it falls off then), its type
//   autosave                   seconds until the game saves itself (once a minute)
//   magic                      seconds until the Grimoire's magic is full (features/grimoire.js)

CA.Timers = (() => {
  const fps = () => Game.fps || 30;

  // ---- golden cookies and reindeer ------------------------------------------------------------------
  //
  // The game (main.js updateShimmers): each logic frame without one on screen, a type's timer counts
  // up (time++), then a new one appears with chance ((time − minTime) ÷ (maxTime − minTime))⁵ — zero
  // before minTime, certain at maxTime. minTime and maxTime are fixed when the previous one leaves
  // (shimmer.die → getMinTime / getMaxTime): 5 and 15 minutes for golden cookies (reindeer 3 and 6) ×
  // everything that makes them more frequent — so what you change now counts from the next one.
  //
  // So, exactly, from now: S[k] = Π (1 − (j ÷ span)⁵) for j = 1 … k — the chance none has come k
  // frames past minTime; everything below is that curve, conditioned on the frames already waited.

  const curves = new Map();
  function curve(min, max) {
    const key = `${min}|${max}`;
    if (curves.has(key)) return curves.get(key);
    const span = Math.max(1, max - min);
    const S = new Float64Array(span + 1);
    S[0] = 1;
    for (let k = 1; k <= span; k++) S[k] = S[k - 1] * (1 - Math.min(1, Math.pow(k / span, 5)));
    if (curves.size > 30) curves.clear();
    curves.set(key, S);
    return S;
  }

  /**
   * The wait from a timer state ({ time, minTime, maxTime } in frames) to the next appearance, in
   * seconds: { soonest, latest, mean, median, mode, sd, pct(p), within(s), hazard (chance in the next
   * second), pdf (chance per bin), cdf, bin (seconds a bin), bins, range } — pdf / cdf over [0, range]:
   * up to where 99.9% of it has come (the last 0.1% would only stretch the picture), at most the latest.
   */
  function waitFrom({ time, minTime, maxTime }, bins = 120) {
    const f = fps();
    const S = curve(minTime, maxTime);
    const span = S.length - 1;
    const toMin = Math.max(0, minTime - time); // frames with no chance at all
    const done = Math.max(0, time - minTime); // frames past minTime already survived
    const base = S[Math.min(done, span)] || 1e-300;
    /** P(none within the next k frames). */
    const none = (k) => {
      const j = k - toMin;
      if (j <= 0) return 1;
      return done + j >= span ? 0 : S[done + j] / base;
    };
    const total = toMin + Math.max(0, span - done); // the latest, in frames
    let mean = 0;
    let sq = 0;
    let modeK = toMin + 1;
    let modeP = -1;
    for (let k = 0; k < total; k++) {
      const p = none(k);
      mean += p; // E[W] = Σ P(W > k)
      sq += (2 * k + 1) * p; // E[W²] = Σ (2k + 1) P(W > k)
      const pk = p - none(k + 1); // P(W = k + 1)
      if (pk > modeP) {
        modeP = pk;
        modeK = k + 1;
      }
    }
    /** The first k with P(W ≤ k) ≥ q (frames). */
    function quantile(q) {
      let lo = 0;
      let hi = total;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (1 - none(mid) >= q) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
    const latest = total / f;
    const range = Math.max(toMin + 1, Math.min(total, quantile(0.999))) / f;
    const bin = Math.max(1 / f, range / bins);
    const pdf = [];
    const cdf = [];
    for (let i = 0; i < bins; i++) {
      const a = 1 - none(Math.round((i * bin) * f));
      const b = 1 - none(Math.round(((i + 1) * bin) * f));
      pdf.push(Math.max(0, b - a));
      cdf.push(b);
    }
    return {
      soonest: toMin / f,
      latest,
      mean: mean / f,
      median: quantile(0.5) / f,
      mode: modeK / f,
      sd: Math.sqrt(Math.max(0, sq - mean * mean)) / f,
      pct: (p) => quantile(p / 100) / f,
      within: (secs) => 1 - none(Math.floor(secs * f)),
      hazard: 1 - none(f),
      pdf,
      cdf,
      bin,
      bins,
      range,
    };
  }

  // what makes them come more often — main.js shimmerTypes.golden / reindeer getTimeMod, factor by factor
  function goldenFactors(wrath) {
    const out = [];
    const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
    const add = (name, k, why) => k !== 1 && out.push({ name, k, why });
    if (has('Lucky day')) add('Lucky day', 0.5, 'heavenly upgrade');
    if (has('Serendipity')) add('Serendipity', 0.5, 'heavenly upgrade');
    if (has('Golden goose egg')) add('Golden goose egg', 0.95, 'Easter egg');
    if (has('Heavenly luck')) add('Heavenly luck', 0.95, 'heavenly upgrade');
    if (has('Green yeast digestives')) add('Green yeast digestives', 0.99, 'garden drop');
    const arcane = typeof Game.auraMult === 'function' ? Game.auraMult('Arcane Aura') : 0;
    if (arcane) add('Arcane Aura', 1 - arcane * 0.05, 'dragon aura');
    if (typeof Game.hasBuff === 'function' && Game.hasBuff('Sugar blessing')) add('Sugar blessing', 0.9, 'buff');
    if (Game.season === 'easter' && has('Starspawn')) add('Starspawn', 0.98, 'season');
    else if (Game.season === 'halloween' && has('Starterror')) add('Starterror', 0.98, 'season');
    else if (Game.season === 'valentines' && has('Starlove')) add('Starlove', 0.98, 'season');
    else if (Game.season === 'fools' && has('Startrade')) add('Startrade', 0.95, 'season');
    const eff = typeof Game.eff === 'function' ? Game.eff(wrath ? 'wrathCookieFreq' : 'goldenCookieFreq') : 1;
    if (eff !== 1) add(wrath ? 'Wrath cookie frequency (garden…)' : 'Golden cookie frequency (garden, …)', 1 / eff, `+${Math.round((eff - 1) * 1000) / 10}%`);
    if (Game.hasGod) {
      const god = (key, name, k1, k2, k3) => {
        const lvl = Game.hasGod(key);
        if (lvl) add(name, [0, k1, k2, k3][lvl], ['', 'diamond', 'ruby', 'jade'][lvl]);
      };
      god('industry', 'Muridal (industry)', 1.1, 1.06, 1.03);
      god('mother', 'Mokalsium (mother)', 1.15, 1.1, 1.05);
      if (Game.season !== '') god('seasons', 'Selebrak (seasons)', ...(Game.season === 'fools' ? [0.955, 0.97, 0.985] : [0.97, 0.98, 0.99]));
    }
    return out;
  }
  function reindeerFactors() {
    const out = [];
    const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
    const add = (name, k, why) => k !== 1 && out.push({ name, k, why });
    if (has('Reindeer baking grounds')) add('Reindeer baking grounds', 0.5, 'Santa');
    if (has('Starsnow')) add('Starsnow', 0.95, 'season');
    if (Game.hasGod) {
      const lvl = Game.hasGod('seasons');
      if (lvl) add('Selebrak (seasons)', [0, 0.9, 0.95, 0.97][lvl], ['', 'diamond', 'ruby', 'jade'][lvl]);
    }
    const eff = typeof Game.eff === 'function' ? Game.eff('reindeerFreq') : 1;
    if (eff !== 1) add('Reindeer frequency', 1 / eff, `+${Math.round((eff - 1) * 1000) / 10}%`);
    return out;
  }
  const BASE = { golden: [5, 15], reindeer: [3, 6] };
  /** A cycle's bounds (frames) from factors: Math.ceil(fps × 60 × minutes × Π k), as the game rounds. */
  const bounds = (type, factors) => {
    const m = factors.reduce((a, x) => a * x.k, 1);
    return BASE[type].map((mins) => Math.ceil(fps() * 60 * mins * m));
  };

  /**
   * Everything about a shimmer type's next appearance — null when it can't come (no timer running:
   * the Golden switch, out of season): { type, spawned, cycle: { min, max, elapsed } (seconds, as fixed
   * when the last one left), wait (waitFrom — from now), factors (what's making them more frequent now),
   * next: { min, max, mean } (a fresh cycle at today's factors), override ('chain' | 'hoard' | ''),
   * wrathChance (the next golden cookie being a wrath cookie) }.
   */
  function distribution(type, bins = 120) {
    const me = Game.shimmerTypes && Game.shimmerTypes[type];
    if (!me || !(me.maxTime > 0)) return null;
    const on = typeof me.spawnConditions !== 'function' || me.spawnConditions();
    if (!on) return null;
    const f = fps();
    const factors = type === 'golden' ? goldenFactors(false) : reindeerFactors();
    const [nmin, nmax] = bounds(type, factors);
    let override = '';
    if (type === 'golden' && me.chain > 0) override = 'chain';
    if (type === 'golden' && typeof Game.Has === 'function' && Game.Has('Gold hoard')) override = 'hoard';
    if (type === 'reindeer' && typeof Game.Has === 'function' && Game.Has('Reindeer season')) override = 'season';
    let wrathChance = 0;
    if (type === 'golden') {
      if (Game.hasGod && Game.hasGod('scorn')) wrathChance = 1;
      else wrathChance = [0, 1 / 3, 2 / 3, 1][Math.max(0, Math.min(3, Game.elderWrath || 0))];
    }
    return {
      type,
      spawned: !!me.spawned,
      cycle: { min: me.minTime / f, max: me.maxTime / f, elapsed: me.time / f },
      wait: me.spawned ? null : waitFrom(me, bins),
      factors,
      next: { min: nmin / f, max: nmax / f, mean: waitFrom({ time: 0, minTime: nmin, maxTime: nmax }, 2).mean },
      override,
      wrathChance,
    };
  }
  /** The mean wait of a fresh cycle with some of today's factors left out (names) — the what-if. */
  function meanWithout(type, names) {
    const factors = (type === 'golden' ? goldenFactors(false) : reindeerFactors()).filter((x) => !names.includes(x.name));
    const [a, b] = bounds(type, factors);
    return waitFrom({ time: 0, minTime: a, maxTime: b }, 2).mean;
  }

  /**
   * A shimmer type's next appearance, from now: { spawned, soonest, latest, expected, median, within(s) }
   * in seconds — or null when it can't come. (The short form of distribution().)
   */
  function spawnOf(type) {
    const d = distribution(type, 2);
    if (!d) return null;
    if (d.spawned) return { spawned: true, soonest: 0, latest: 0, expected: 0, median: 0, within: () => 1 };
    const w = d.wait;
    return { spawned: false, soonest: w.soonest, latest: w.latest, expected: w.mean, median: w.median, within: w.within };
  }

  // ---- buffs, the sugar lump, autosave ------------------------------------------------------------------

  /** The effects running: [{ name, secs, maxSecs, cps, click }]. */
  const buffs = () =>
    Object.values(Game.buffs || {})
      .filter((b) => b && b.time > 0)
      .map((b) => ({ name: b.name, secs: b.time / fps(), maxSecs: (b.maxTime || b.time) / fps(), cps: b.multCpS !== undefined ? b.multCpS : 1, click: b.multClick !== undefined ? b.multClick : 1 }));

  const LUMP_TYPES = ['normal', 'bifurcated', 'golden', 'meaty', 'caramelized'];
  /** The sugar lump: { type, matureIn, ripeIn, fallsIn } seconds (0 once reached), or null before lumps. */
  function lump() {
    if (!Game.lumpT || !(Game.lumpRipeAge > 0)) return null;
    const age = Date.now() - Game.lumpT;
    const until = (ms) => Math.max(0, (ms - age) / 1000);
    return { type: LUMP_TYPES[Game.lumpCurrentType] || 'normal', matureIn: until(Game.lumpMatureAge), ripeIn: until(Game.lumpRipeAge), fallsIn: until(Game.lumpOverripeAge) };
  }

  /** Seconds until the game autosaves (null when autosave is off). */
  function autosave() {
    if (Game.prefs && !Game.prefs.autosave) return null;
    const period = fps() * 60;
    return (period - (Game.OnAscend ? 0 : (Game.T || 0) % period)) / fps();
  }

  /** Seconds until the Grimoire's magic is full (0: full; null: no Grimoire). */
  function magicFull() {
    const M = CA.Util.minigame('Wizard tower');
    if (!M || !CA.Grimoire || typeof CA.Grimoire.refillSeconds !== 'function') return null;
    return M.magic >= M.magicM ? 0 : CA.Grimoire.refillSeconds(M.magic, M.magicM, M.magicM);
  }

  function init() {
    const V = (id, desc, get, params) => CA.Script.defineValue({ id, desc, get, params });
    const g = (k) => () => (spawnOf('golden') || { [k]: NaN })[k];
    V('golden.soonest', 'seconds until the next golden cookie can appear (0: it can now)', g('soonest'));
    V('golden.latest', 'seconds until the next golden cookie surely appears', g('latest'));
    V('golden.expected', 'seconds the next golden cookie takes on average', g('expected'));
    V('golden.chanceWithin', 'the chance the next golden cookie appears within a number of seconds (0–1)', (s) => {
      const x = spawnOf('golden');
      return x ? x.within(Number(s) || 0) : 0;
    }, ['seconds']);
    V('reindeer.expected', 'seconds the next reindeer takes on average (Christmas)', () => (spawnOf('reindeer') || { expected: NaN }).expected);
    V('buff.timeLeft', 'seconds an effect has left (0: not running)', (n) => {
      const b = buffs().find((x) => x.name.toLowerCase() === String(n).toLowerCase());
      return b ? b.secs : 0;
    }, ['effect']);
    V('lump.ripeIn', 'seconds until the sugar lump is ripe (0: it is)', () => (lump() || { ripeIn: NaN }).ripeIn);
    V('autosave.in', 'seconds until the game saves itself', () => autosave() ?? NaN);
    V('magic.fullIn', 'seconds until the Grimoire’s magic is full (0: it is)', () => magicFull() ?? NaN);
  }

  return { init, spawnOf, distribution, waitFrom, meanWithout, goldenFactors, reindeerFactors, buffs, lump, autosave, magicFull, curve, LUMP_TYPES };
})();
