// Mutations: what each empty garden tile can grow at the next tick, and how likely — exactly, from the
// game's own rules (minigameGarden.js M.logic), asking the game for its recipes (M.getMuts) rather than
// copying them:
//
//   each tick, each empty unlocked tile looks at its 8 neighbours — how many of each plant, how many of
//   each mature — and M.getMuts lists what could grow, each with a chance. Every entry is drawn: a weed
//   also needs a draw under the soil's weed multiplier, a weed or fungus one under the tile's boost
//   (plotBoost[2]); one of the entries that came up grows (picked evenly — a plant listed twice counts
//   twice). That repeats `loops` times a tick (wood chips 3, × the Supreme Intellect aura, randomly
//   rounded; × M.loopsMult), each time able to replace the last. A tile with no neighbours at all can
//   grow meddleweed instead (0.2% × weed multiplier × boost, once a tick).
//   The tick ages the plants in reading order first — a neighbour above or to the left of a tile has
//   already aged when the tile looks (it may have just matured, or died of old age), one below or to
//   the right hasn't: so for those four neighbours each outcome is weighed by its chance.
//
// What's left out (all rare, and none can be worked out from here): a plant spreading onto a tile
// this same tick next to another, and contamination of planted tiles.
//
// Words: garden.mutationChance(x, y), garden.growChance(seed), garden.growIn(seed) — see init.

CA.Mutations = (() => {
  /** The garden — when it has what the odds are worked out from (the game's own functions). */
  const garden = () => {
    const M = CA.Util.minigame('Farm');
    return M && M.plot && M.plants && typeof M.getMuts === 'function' && typeof M.getTile === 'function' && typeof M.isTileUnlocked === 'function' ? M : null;
  };
  const OFFSETS = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  /**
   * P(randomFloor(v) ≥ d) for v uniform on [lo, hi] (the game's random rounding): E[clamp(v − d + 1, 0, 1)].
   */
  function atLeast(d, lo, hi) {
    const g = (v) => clamp01(v - d + 1);
    if (!(hi > lo)) return g(lo);
    const G = (v) => (v < d - 1 ? 0 : v < d ? (v - d + 1) ** 2 / 2 : 0.5 + (v - d));
    return (G(hi) - G(lo)) / (hi - lo);
  }

  const dragonBoost = () => 1 + 0.05 * (typeof Game.auraMult === 'function' ? Game.auraMult('Supreme Intellect') : 0);

  /**
   * A neighbour's possible states once the tick has aged it: [{ p, key, mature }] (key null: died).
   * `aged`: whether the tick ages it before the tile looks (above, or left on the same row).
   */
  function states(M, boost, nx, ny, aged) {
    const tile = M.getTile(nx, ny);
    if (!tile || !(tile[0] > 0)) return [{ p: 1, key: null, mature: false }];
    const me = M.plantsById[tile[0] - 1];
    const age = tile[1];
    if (!aged || !M.isTileUnlocked(nx, ny)) return [{ p: 1, key: me.key, mature: age >= me.mature }];
    const b = ((boost[ny] && boost[ny][nx] && boost[ny][nx][0]) || 1) * dragonBoost();
    const lo = me.ageTick * b;
    const hi = (me.ageTick + (me.ageTickR || 0)) * b;
    // its age after: max(age + inc, 0); immortal ones stop at mature + 1; others die at 100
    const reach = (target) => (age >= target ? 1 : atLeast(Math.ceil(target - age), lo, hi));
    const dies = me.immortal ? 0 : reach(100);
    const mature = Math.max(0, reach(me.mature) - dies);
    const out = [];
    if (dies > 0) out.push({ p: dies, key: null, mature: false });
    if (mature > 0) out.push({ p: mature, key: me.key, mature: true });
    if (1 - dies - mature > 1e-15) out.push({ p: 1 - dies - mature, key: me.key, mature: false });
    return out;
  }

  /** Chance each entry ends up the one picked, given each comes up independently with chance q[i]. */
  function picked(q) {
    return q.map((qi, i) => {
      if (!(qi > 0)) return 0;
      // how many of the others come up: a Poisson-binomial, by DP
      let dist = [1];
      q.forEach((qj, j) => {
        if (j === i) return;
        const next = new Array(dist.length + 1).fill(0);
        dist.forEach((p, k) => {
          next[k] += p * (1 - qj);
          next[k + 1] += p * qj;
        });
        dist = next;
      });
      return qi * dist.reduce((s, p, k) => s + p / (k + 1), 0);
    });
  }

  /** The number of loops a tick runs: [{ n, p }]. */
  function loops(M) {
    const soil = M.soilsById && M.soilsById[M.soil];
    const base = (soil && soil.key === 'woodchips' ? 3 : 1) * dragonBoost();
    const fl = Math.floor(base);
    const frac = base - fl;
    const mult = M.loopsMult || 1;
    const out = [{ n: fl * mult, p: 1 - frac }];
    if (frac > 0) out.push({ n: (fl + 1) * mult, p: frac });
    return out.filter((x) => x.p > 0);
  }

  /**
   * What an empty tile can grow at the next tick: { x, y, any (chance something grows), plants:
   * [{ key, name, chance }] (most likely first) } — null for a planted or locked tile, or no garden.
   */
  function tile(x, y, ctx) {
    const M = garden();
    if (!M || !M.plot || !M.isTileUnlocked(x, y)) return null;
    if (M.plot[y][x][0] > 0) return null;
    const c = ctx || context(M);
    const boost2 = (c.boost[y] && c.boost[y][x] && c.boost[y][x][2]) ?? 1;
    // the neighbours' states, and every combination of them (the aged ones can be in two or three)
    let combos = [{ p: 1, neighs: {}, neighsM: {}, any: 0 }];
    OFFSETS.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      const aged = ny < y || (ny === y && nx < x);
      const st = states(M, c.boost, nx, ny, aged);
      const next = [];
      combos.forEach((cb) =>
        st.forEach((s) => {
          if (!s.key) return next.push({ ...cb, p: cb.p * s.p });
          const neighs = { ...cb.neighs, [s.key]: (cb.neighs[s.key] || 0) + 1 };
          const neighsM = s.mature ? { ...cb.neighsM, [s.key]: (cb.neighsM[s.key] || 0) + 1 } : cb.neighsM;
          next.push({ p: cb.p * s.p, neighs, neighsM, any: cb.any + 1 });
        })
      );
      combos = next;
    });
    const chance = {};
    const add = (key, p) => p > 0 && (chance[key] = (chance[key] || 0) + p);
    combos.forEach((cb) => {
      if (!(cb.p > 0)) return;
      if (!cb.any) {
        // weeds in a tile with nothing around (the first loop only)
        add('meddleweed', cb.p * clamp01(0.002 * c.weedMult * boost2));
        return;
      }
      // the game's own recipes, for these neighbours (every plant counted, as the game does)
      const neighs = { ...c.zero, ...cb.neighs };
      const neighsM = { ...c.zero, ...cb.neighsM };
      const muts = M.getMuts(neighs, neighsM) || [];
      const q = muts.map(([key, m]) => {
        const pl = M.plants[key];
        if (!pl) return 0;
        return clamp01(m) * (pl.weed ? clamp01(c.weedMult) : 1) * (!pl.weed && !pl.fungus ? 1 : clamp01(boost2));
      });
      const r = picked(q); // a loop's outcome: each entry's chance of being the one that grows
      const r0 = q.reduce((s, qi) => s * (1 - qi), 1); // nothing grows in a loop
      // over the loops, the last one where something came up decides: P(p) = r_p × (1 − r0^L) ÷ (1 − r0)
      c.loops.forEach((L) => {
        const k = r0 < 1 ? (1 - r0 ** L.n) / (1 - r0) : L.n;
        muts.forEach(([key], i) => add(key, cb.p * L.p * r[i] * k));
      });
    });
    const plants = Object.keys(chance)
      .map((key) => ({ key, name: (M.plants[key] && M.plants[key].name) || key, chance: Math.min(1, chance[key]) }))
      .sort((a, b) => b.chance - a.chance);
    return { x, y, any: Math.min(1, plants.reduce((s, p) => s + p.chance, 0)), plants };
  }

  /**
   * The tiles' boosts the next tick will work with: the tick first rebuilds M.plotBoost from the plot as
   * it is then (computeBoostPlot) — so the game's own function is run here too, but on a grid of our own:
   * M.plotBoost is swapped for a fresh one for the call and the game's put back (whatever happens), as
   * the game's live boosts (what plants do to their neighbours' effects) must only change at a tick.
   */
  function nextBoost(M) {
    const fresh = () => Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [1, 1, 1]));
    if (typeof M.computeBoostPlot !== 'function') return M.plotBoost ? M.plotBoost.map((r) => r.map((t) => t.slice())) : fresh();
    const live = M.plotBoost;
    const mine = fresh();
    M.plotBoost = mine;
    try {
      M.computeBoostPlot();
      return M.plotBoost;
    } finally {
      M.plotBoost = live;
    }
  }

  /** What a tick reads the same for every tile: the boosts, the weed multiplier, the loops, every plant at 0. */
  function context(M) {
    const soil = M.soilsById && M.soilsById[M.soil];
    const zero = {};
    Object.keys(M.plants || {}).forEach((k) => (zero[k] = 0));
    return { boost: nextBoost(M), weedMult: soil ? soil.weedMult : 1, loops: loops(M), zero };
  }

  /** Every empty tile's odds at the next tick, and per plant: the chance at least one tile grows it. */
  function all() {
    const M = garden();
    if (!M || !M.plot) return null;
    const c = context(M);
    const tiles = [];
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const t = tile(x, y, c);
      if (t) tiles.push(t);
    }
    const none = {};
    tiles.forEach((t) => t.plants.forEach((p) => (none[p.key] = (none[p.key] ?? 1) * (1 - p.chance))));
    const plants = Object.keys(none)
      .map((key) => ({ key, name: (M.plants[key] && M.plants[key].name) || key, chance: 1 - none[key], tiles: tiles.filter((t) => t.plants.some((p) => p.key === key)).length, unlocked: !!(M.plants[key] && M.plants[key].unlocked) }))
      .sort((a, b) => b.chance - a.chance);
    return { tiles, plants, tickSecs: M.stepT || 0, nextTickIn: Math.max(0, ((M.nextStep || 0) - Date.now()) / 1000) };
  }

  /** The chance at least one tile grows a plant at the next tick (0–1). */
  function growChance(key) {
    const a = all();
    const p = a && a.plants.find((x) => x.key === key);
    return p ? p.chance : 0;
  }
  /** Seconds until a plant grows somewhere, on average, at today's odds (Infinity: it can't now). */
  function growIn(key) {
    const a = all();
    const p = a && a.plants.find((x) => x.key === key);
    if (!p || !(p.chance > 0)) return Infinity;
    // the next tick, then a geometric number of ticks
    return a.nextTickIn + ((1 - p.chance) / p.chance) * a.tickSecs;
  }

  function init() {
    const V = (id, desc, params, get) => CA.Script.defineValue({ id, desc, params, get });
    V('garden.mutationChance', 'the chance an empty garden tile grows something at the next tick (0–1; x, y from 0, top left)', ['x', 'y'], (x, y) => {
      const t = tile(Math.floor(Number(x)), Math.floor(Number(y)));
      return t ? t.any : 0;
    });
    V('garden.growChance', 'the chance a seed grows somewhere in the garden at the next tick (0–1)', ['seed'], growChance);
    V('garden.growIn', 'seconds until a seed grows somewhere, on average, at the garden’s odds now (Infinity: it can’t)', ['seed'], growIn);
  }

  return { init, tile, all, growChance, growIn, atLeast, picked, loops, nextBoost };
})();
