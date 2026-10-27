// Timers: when things will happen — Cookie Monster's timer bar and the timing parts of its statistics,
// worked out from the game's own rules (main.js):
//
//   golden cookie / reindeer   each frame without one, the timer (time) counts up; past minTime a
//                              cookie appears with chance ((time − minTime) ÷ (maxTime − minTime))⁵
//                              that frame (so surely by maxTime). From that, exactly: the soonest it
//                              can come, the latest, the expected wait, the median, the chance it
//                              comes within N seconds. (Cookie Monster only shows the min and max.)
//   buffs                      seconds left of each effect, its multipliers — what it multiplies your
//                              income by, clicking counted — and the chance a golden cookie comes
//                              before it ends
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
   * This cycle's cumulative chance, counted from when the last one left (not from now): secs since
   * then → the chance one has come by then — 0 up to minTime, 1 at maxTime (the same curve).
   */
  function cycleCdf({ minTime, maxTime }) {
    const S = curve(minTime, maxTime);
    const span = S.length - 1;
    return (secs) => {
      const k = Math.floor(secs * fps()) - minTime;
      return k <= 0 ? 0 : k >= span ? 1 : 1 - S[k];
    };
  }

  /**
   * Everything about a shimmer type's next appearance — null when it can't come (no timer running:
   * the Golden switch, out of season): { type, spawned, cycle: { min, max, elapsed (seconds, as fixed
   * when the last one left), cdf(secs since it left) → the chance one has come by then, by (cdf now) }, wait (waitFrom — from now), factors (what's making them more frequent now),
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
      cycle: { min: me.minTime / f, max: me.maxTime / f, elapsed: me.time / f, cdf: cycleCdf(me), by: cycleCdf(me)(me.time / f) },
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

  // ---- how long a golden cookie's effect lasts ---------------------------------------------------
  // main.js golden popFunc: an effect lasts ceil(base × effectDurMod) seconds — Get lucky ×2, Lasting
  // fortune ×1.1, Lucky digit / number / payout and Green yeast digestives ×1.01 each, Epoch Manipulator
  // (+5% × its aura strength), the golden (or wrath) cookie effect-duration effects (Game.eff), and Vomitrax
  // (the spirit of decadence) slotted: ×1.07 diamond, ×1.05 ruby, ×1.02 jade.
  const EFFECTS = {
    frenzy: { base: 77 },
    'building special': { base: 30 },
    'click frenzy': { base: 13 },
    dragonflight: { base: 10 },
    'dragon harvest': { base: 60 },
    'everything must go': { base: 8 },
    'cookie storm': { base: 7 },
    'blood frenzy': { base: 6, wrath: true },
    clot: { base: 66, wrath: true },
    'cursed finger': { base: 10, wrath: true },
  };
  const EFFECT_ALIASES = { 'elder frenzy': 'blood frenzy', 'building buff': 'building special', 'building debuff': 'building special', 'cookie storm drop': 'cookie storm' };
  const effectKey = (name) => {
    const k = String(name || '').toLowerCase();
    return EFFECTS[k] ? k : EFFECT_ALIASES[k] || null;
  };
  /** The multiplier on a golden (or wrath) cookie's effect durations now (popFunc's effectDurMod). */
  function effectDurMod(wrath = false) {
    const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
    let m = 1;
    if (has('Get lucky')) m *= 2;
    if (has('Lasting fortune')) m *= 1.1;
    if (has('Lucky digit')) m *= 1.01;
    if (has('Lucky number')) m *= 1.01;
    if (has('Green yeast digestives')) m *= 1.01;
    if (has('Lucky payout')) m *= 1.01;
    m *= 1 + (typeof Game.auraMult === 'function' ? Game.auraMult('Epoch Manipulator') : 0) * 0.05;
    if (typeof Game.eff === 'function') m *= Game.eff(wrath ? 'wrathCookieEffDur' : 'goldenCookieEffDur');
    if (typeof Game.hasGod === 'function') {
      const lvl = Game.hasGod('decadence');
      if (lvl === 1) m *= 1.07;
      else if (lvl === 2) m *= 1.05;
      else if (lvl === 3) m *= 1.02;
    }
    return m;
  }
  /**
   * Seconds a golden cookie's effect lasts when it starts now (frenzy, building special, click frenzy,
   * dragonflight, dragon harvest, everything must go, cookie storm; from wrath cookies: clot, cursed finger,
   * elder frenzy) — NaN for anything else. wrath: from a wrath cookie (default: the effects only those give).
   */
  function effectDuration(name, wrath) {
    const k = effectKey(name);
    if (!k) return NaN;
    const w = wrath === undefined ? !!EFFECTS[k].wrath : !!wrath;
    return Math.ceil(EFFECTS[k].base * effectDurMod(w));
  }

  /** The effects running: [{ name, secs, maxSecs, cps, click, type, icon }] — type: the game's buff type ('frenzy',
   *  'click frenzy', 'building buff'…), icon: its picture in img/icons.png ([x, y], or [x, y, sheet]). */
  const buffs = () =>
    Object.values(Game.buffs || {})
      .filter((b) => b && b.time > 0)
      .map((b) => ({
        name: b.name,
        secs: b.time / fps(),
        maxSecs: (b.maxTime || b.time) / fps(),
        cps: b.multCpS !== undefined ? b.multCpS : 1,
        click: b.multClick !== undefined ? b.multClick : 1,
        type: (b.type && b.type.name) || String(b.name || '').toLowerCase(),
        icon: Array.isArray(b.icon) ? b.icon : null,
      }));

  /**
   * The effects running, each with the chance a golden cookie appears before it ends (golden: 0–1; 1
   * while one's on screen, 0 with none coming) — what a Frenzy can still be stacked with.
   */
  function buffsWithGolden() {
    const s = spawnOf('golden');
    return buffs().map((b) => ({ ...b, golden: s ? s.within(b.secs) : 0 }));
  }

  /**
   * What an effect running multiplies your income by, clicking counted: (CpS + clicks/s × a click)
   * with it alone over the same with no effects — the game's own Game.mouseCps() asked both ways
   * (CpS and the buffs swapped in and restored within this one call), at your click rate (the last
   * ten seconds: yours or an autoclicker's). A CpS effect at no clicking is its multCpS; a click
   * effect at no clicking is ×1. { mult, cps, click, rate } — or null when it isn't running.
   */
  function effectiveMult(name) {
    const b = Object.values(Game.buffs || {}).find((x) => x && x.time > 0 && x.name.toLowerCase() === String(name).toLowerCase());
    if (!b) return null;
    const cps = b.multCpS !== undefined ? b.multCpS : 1;
    const click = b.multClick !== undefined ? b.multClick : 1;
    const rate = CA.Payback && typeof CA.Payback.clickRate === 'function' ? CA.Payback.clickRate() : 0;
    const base = Game.unbuffedCps || Game.cookiesPs || 0;
    const mouse = (cpsNow, buffsNow) => {
      if (typeof Game.mouseCps !== 'function') return NaN;
      const keep = [Game.cookiesPs, Game.buffs];
      try {
        Game.cookiesPs = cpsNow;
        Game.buffs = buffsNow;
        return Game.mouseCps();
      } catch (e) {
        return NaN;
      } finally {
        [Game.cookiesPs, Game.buffs] = keep;
      }
    };
    let mult = cps;
    if (rate > 0) {
      const c0 = mouse(base, {});
      const c1 = mouse(base * cps, { [b.name]: b });
      const before = base + rate * c0;
      if (Number.isFinite(c0) && Number.isFinite(c1) && before > 0) mult = (base * cps + rate * c1) / before;
      else if (!(base > 0)) mult = click; // nothing baked yet: clicking is all there is
    }
    return { mult, cps, click, rate };
  }

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
    V('golden.effectDuration', 'seconds a golden cookie’s effect lasts if it starts now, with your upgrades (frenzy, building special, click frenzy, dragonflight, clot…; NaN for others)', (n) => effectDuration(n), ['effect']);
    V('buff.timeLeft', 'seconds an effect has left (0: not running)', (n) => {
      const b = buffs().find((x) => x.name.toLowerCase() === String(n).toLowerCase());
      return b ? b.secs : 0;
    }, ['effect']);
    V('buff.goldenChance', 'the chance a golden cookie appears before an effect ends (0–1; 0: not running)', (n) => {
      const b = buffsWithGolden().find((x) => x.name.toLowerCase() === String(n).toLowerCase());
      return b ? b.golden : 0;
    }, ['effect']);
    V('buff.effectiveMult', 'what an effect multiplies your income by, clicking counted at your click rate (Click frenzy at 10 clicks/s…; 1: not running)', (n) => (effectiveMult(n) || { mult: 1 }).mult, ['effect']);
    V('lump.ripeIn', 'seconds until the sugar lump is ripe (0: it is)', () => (lump() || { ripeIn: NaN }).ripeIn);
    V('autosave.in', 'seconds until the game saves itself', () => autosave() ?? NaN);
    V('magic.fullIn', 'seconds until the Grimoire’s magic is full (0: it is)', () => magicFull() ?? NaN);
  }

  return { init, spawnOf, distribution, waitFrom, meanWithout, goldenFactors, reindeerFactors, buffs, buffsWithGolden, effectiveMult, effectDuration, effectDurMod, EFFECTS, lump, autosave, magicFull, curve, LUMP_TYPES };
})();
