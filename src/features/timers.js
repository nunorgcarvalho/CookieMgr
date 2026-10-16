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

  // survival curves, per (minTime, maxTime): S[k] = chance nothing spawned in frames min+1 … min+k
  const curves = new Map();
  function curve(min, max) {
    const key = `${min}|${max}`;
    if (curves.has(key)) return curves.get(key);
    const span = Math.max(1, max - min);
    const S = [1];
    for (let k = 1; k <= span; k++) S.push(S[k - 1] * (1 - Math.min(1, Math.pow(k / span, 5))));
    if (curves.size > 20) curves.clear();
    curves.set(key, S);
    return S;
  }
  /**
   * A shimmer type's next appearance, from now: { spawned, soonest, latest, expected, median, within(s) }
   * in seconds — or null when it can't come (no timer running: the Golden switch, out of season…).
   */
  function spawnOf(type) {
    const me = Game.shimmerTypes && Game.shimmerTypes[type];
    if (!me || !(me.maxTime > 0)) return null;
    const on = typeof me.spawnConditions !== 'function' || me.spawnConditions();
    if (!on) return null;
    if (me.spawned) return { spawned: true, soonest: 0, latest: 0, expected: 0, median: 0, within: () => 1 };
    const S = curve(me.minTime, me.maxTime);
    const f = fps();
    // frames since minTime already survived (time counts frames without one)
    const done = Math.max(0, me.time - me.minTime);
    const base = S[Math.min(done, S.length - 1)] || 1e-300;
    const left = (k) => (done + k >= S.length - 1 ? 0 : S[done + k] / base); // P(none in the next k frames)
    let expected = 0;
    let median = null;
    const toMin = Math.max(0, me.minTime - me.time);
    for (let k = 0; done + k < S.length; k++) {
      const p = left(k);
      expected += p;
      if (median === null && p <= 0.5) median = k;
    }
    return {
      spawned: false,
      soonest: toMin / f,
      latest: Math.max(0, me.maxTime - me.time) / f,
      expected: (toMin + expected) / f,
      median: (toMin + (median || 0)) / f,
      within: (secs) => {
        const k = Math.floor(secs * f) - toMin;
        return k <= 0 ? 0 : 1 - left(k);
      },
    };
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

  return { init, spawnOf, buffs, lump, autosave, magicFull, curve, LUMP_TYPES };
})();
