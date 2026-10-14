// The **auto-gardener**, in two layers you pick separately:
//
//   a **garden profile** (layout): which seed goes on which tile (or nothing), and a soil — a saved
//     snapshot, or the built-in "Current garden": whatever is planted, kept as it is (each tile's
//     plant remembered, and replanted when it dies)
//   a **gardener** (behaviour): algorithmic code run from the top every second — the built-in
//     Effect maximizer, Weed collector and Mutation tracker (editable, revertable), or your own
//
// The Effect maximizer (the default) does what the auto-gardener always did:
//
//   - in the last `lead` seconds before a garden tick (15 by default):
//       · on the tiles the layout has a seed for, harvests plants that aren't that seed (weeds,
//         mutations, leftovers) — tiles the layout leaves empty it doesn't touch
//       · harvests the layout's own mature plants when the chance that they die of old age on the
//         coming tick is above your threshold (50% by default; 100% = let them die)
//       · replants the tiles it just cleared
//   - any time: plants the layout's seed on every empty tile you can afford; harvests a plant whose
//     seed you haven't unlocked yet as soon as it's mature, which unlocks it; and keeps the soil on
//     fertilizer while most plants are growing, clay once they're mature (when the game lets you —
//     a 10-minute cooldown)
//
// The Weed collector keeps the garden bare for weeds and fungi; the Mutation tracker grows the
// layout's parents and watches the other tiles for mutations (see their code below).
//
// Why harvest before a plant dies? A harvest of a mature plant unlocks its seed if it's new, counts
// towards the harvest achievements, and some plants pay out on harvest (Bakeberry, Chocoroot, Queenbeet…);
// a plant that dies of old age just disappears (except on Pebbles, which has a 35% chance to unlock
// its seed). The game's own formulas (minigameGarden.js M.logic) give the death chance exactly:
// each tick a plant ages by randomFloor((ageTick + ageTickR·random) × tile boost × dragon boost)
// and dies at 100.

CA.Garden = (() => {
  const SIZE = 6;
  let profiles = []; // { id, name, soil, plot: [[key|null × 6] × 6] }
  let gardeners = []; // yours: { id, name, rules }; a built-in you edited: { id, rules }
  let current = null; // the Current garden layout: each tile's plant as last seen ([[key|null × 6] × 6])
  let unlockedAt = {}; // seed → when a harvest by CookieMgr unlocked it (ms)
  const CURRENT = 'current';
  const S = () => CA.Settings;

  function minigame() {
    const M = CA.Util.minigame('Farm');
    return M && M.plot && M.plantsById ? M : null;
  }

  const unlockedTile = (M, x, y) => (typeof M.isTileUnlocked === 'function' ? M.isTileUnlocked(x, y) : true);
  const plantAt = (M, x, y) => {
    const t = M.plot[y] && M.plot[y][x];
    return t && t[0] > 0 ? M.plantsById[t[0] - 1] || null : null;
  };
  /** Seconds until the next garden tick. */
  const nextTickIn = (M) => (M.nextStep ? Math.max(0, (M.nextStep - Date.now()) / 1000) : Infinity);

  // ---- the chance a plant dies on the next tick -------------------------------------------------

  /**
   * P(the plant on (x, y) reaches age 100 on the next tick). Its growth that tick is
   * randomFloor(v) with v uniform on [a, b] = boost × [ageTick, ageTick + ageTickR]; randomFloor(v)
   * is ⌈v⌉ with probability frac(v), else ⌊v⌋. So with n = 100 − age it dies with probability
   * 1 when v ≥ n, v − (n − 1) when n − 1 < v < n, and 0 below — averaged over v.
   */
  function decayChance(M, x, y) {
    const me = plantAt(M, x, y);
    if (!me || me.immortal) return 0;
    const n = 100 - M.plot[y][x][1];
    if (n <= 0) return 1;
    const tileBoost = M.plotBoost && M.plotBoost[y] && M.plotBoost[y][x] ? M.plotBoost[y][x][0] : 1;
    const dragon = 1 + 0.05 * (typeof Game.auraMult === 'function' ? Game.auraMult('Supreme Intellect') : 0);
    const k = tileBoost * dragon;
    const a = k * me.ageTick;
    const b = k * (me.ageTick + (me.ageTickR || 0));
    const p = (v) => (v >= n ? 1 : v > n - 1 ? v - (n - 1) : 0);
    if (b - a < 1e-9) return p(a);
    // antiderivative of p
    const F = (v) => (v <= n - 1 ? 0 : v < n ? (v - n + 1) ** 2 / 2 : 0.5 + (v - n));
    return Math.max(0, Math.min(1, (F(b) - F(a)) / (b - a)));
  }

  // ---- profiles ------------------------------------------------------------------------------

  const newId = () => `g${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  /** The layout the gardener keeps: a saved profile, or (picked, or none picked) the Current garden. */
  function active() {
    const id = S().get('gardenProfile');
    return profiles.find((p) => p.id === id) || currentProfile();
  }
  const activeLayoutId = () => active().id;
  const emptyPlot = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  // The Current garden remembers each tile's plant: taken from the garden when you pick it, then
  // changed only by your own clicks on the garden (a seed you plant, a plant you harvest) — a plant
  // that dies or is harvested by the gardener is replanted, and a mutation or weed that springs up
  // isn't adopted.
  const keeps = (me) => !!me && !!me.unlocked && !me.weed && !me.fungus;
  /** What's planted now, seed by seed (seeds you've unlocked — not weeds, fungi or new mutations). */
  function captureCurrent() {
    const M = minigame();
    current = emptyPlot();
    if (M) for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const me = unlockedTile(M, x, y) ? plantAt(M, x, y) : null;
      if (keeps(me)) current[y][x] = me.key;
    }
    changed();
  }
  /** Notes your clicks on the garden's tiles (once per garden), for the Current garden. */
  function watchClicks(M) {
    if (!M || M.__caWatched || typeof M.clickTile !== 'function') return;
    M.__caWatched = true;
    const orig = M.clickTile;
    M.clickTile = function (x, y) {
      const out = orig.apply(this, arguments);
      try {
        if (current && activeLayoutId() === CURRENT && current[y]) {
          const me = plantAt(M, x, y);
          current[y][x] = keeps(me) ? me.key : null;
          changed();
        }
      } catch (e) {
        /* the game's click went through; the memory just isn't updated */
      }
      return out;
    };
  }
  function currentProfile() {
    const M = minigame();
    watchClicks(M);
    if (!current && M) captureCurrent();
    const soil = M && M.soilsById && M.soilsById[M.soil] ? M.soilsById[M.soil].key : 'dirt';
    return { id: CURRENT, name: 'Current garden', soil, plot: current || emptyPlot(), live: true };
  }

  /** Saves the current garden (seeds on every tile + the soil) as a new profile. */
  function snapshot(name) {
    const M = minigame();
    if (!M) return null;
    const plot = [];
    for (let y = 0; y < SIZE; y++) {
      plot.push([]);
      for (let x = 0; x < SIZE; x++) {
        const me = unlockedTile(M, x, y) ? plantAt(M, x, y) : null;
        plot[y].push(me ? me.key : null);
      }
    }
    const soil = M.soilsById && M.soilsById[M.soil] ? M.soilsById[M.soil].key : 'dirt';
    const p = { id: newId(), name: String(name || `Garden ${profiles.length + 1}`).slice(0, 40), soil, plot };
    profiles.push(p);
    if (activeLayoutId() === CURRENT && S().get('gardenProfile') !== CURRENT) S().set('gardenProfile', p.id);
    changed();
    return p;
  }

  function removeProfile(id) {
    const i = profiles.findIndex((p) => p.id === id);
    if (i < 0) return;
    profiles.splice(i, 1);
    if (S().get('gardenProfile') === id) S().set('gardenProfile', profiles[0] ? profiles[0].id : CURRENT);
    changed();
  }

  function rename(id, name) {
    const p = profiles.find((x) => x.id === id);
    if (!p || !String(name).trim()) return;
    p.name = String(name).trim().slice(0, 40);
    changed();
  }

  /** Keep the garden like this layout (Current garden: what's planted now, captured afresh). */
  function use(id) {
    if (id === CURRENT) {
      captureCurrent();
      S().set('gardenProfile', CURRENT);
      return;
    }
    if (profiles.some((p) => p.id === id)) S().set('gardenProfile', id);
  }
  const changed = () => CA.Events.emit('garden');

  // ---- tending ------------------------------------------------------------------------------

  function plant(M, me, x, y) {
    if (!me.unlocked || (typeof M.canPlant === 'function' && !M.canPlant(me))) return false;
    // as M.useTool does, minus the mouse sparkle and sound
    M.plot[y][x] = [me.id + 1, 0];
    M.toRebuild = true;
    Game.Spend(typeof M.getCost === 'function' ? M.getCost(me) : 0);
    return true;
  }

  function setSoil(M, key) {
    const soil = M.soils && M.soils[key];
    if (!soil || M.soil === soil.id || M.freeze || M.nextSoil > Date.now() || M.parent.amount < soil.req) return false;
    // through the game's own button when it's there (it updates its highlight), else as it does
    const btn = document.getElementById(`gardenSoil-${soil.id}`);
    if (btn) btn.click();
    if (M.soil !== soil.id) {
      M.nextSoil = Date.now() + (Game.Has('Turbo-charged soil') ? 1 : 1000 * 60 * 10);
      M.toCompute = true;
      M.soil = soil.id;
      if (typeof M.computeStepT === 'function') M.computeStepT();
    }
    return true;
  }

  // ---- gardeners: what the auto-gardener does, written as code ------------------------------------
  //
  // A gardener is algorithmic code (features/script.js) run from the top on every pass of the
  // auto-gardener, made of the garden's own words below; it tends towards the active layout. The
  // built-in ones can be edited (and reverted); your own are made from any of them.

  const FERTILIZER_VAR = 'fertilizerAbove';
  /** The Effect maximizer, with the numbers of the old settings (seconds before the tick, the death-chance threshold, unlocking new seeds). */
  function defaultRules() {
    const lead = Math.max(1, Number(S().get('gardenLead')) || 15);
    const thr = Math.max(0, Math.min(100, Number(S().get('gardenThreshold')))) / 100;
    const unlock = S().get('gardenUnlockNew') !== false;
    const lines = [
      '# Effect maximizer: keeps the layout planted, and its plants\' effects as high as they go.',
      '# It plants only where the layout has a seed, and only clears the tiles the layout uses.',
      '# Your numbers (used below):',
      `${FERTILIZER_VAR} = 0.67   # fertilizer while more than this share of the planted tiles is still growing, else clay`,
      `tickWindow = ${lead}   # the last seconds before a garden tick, when old plants are dealt with`,
    ];
    if (thr < 1) lines.push(`dyingOver = ${thr}   # replant mature plants more likely than this to die on the tick (the new one grows at it)`);
    lines.push(
      `unlockNewSeeds = ${unlock}   # a seed you haven't unlocked yet: let it grow, harvest it once mature (that unlocks it)`,
      "# Plant the layout's seed on every empty tile it has one for, right away.",
      'garden.plantEmpty()',
      'if unlockNewSeeds:',
      '  garden.harvestNew()',
      '# Soil, first: its effects count the whole time, not just at the tick — fertilizer while most',
      '# plants are still growing, clay (effects ×1.25) once enough of them are mature.',
      `if garden.youngShare() > ${FERTILIZER_VAR}:`,
      '  garden.soil(fertilizer)',
      'else:',
      '  garden.soil(clay)',
      '# In the last tickWindow seconds before a garden tick:',
      'if garden.tickIn() <= tickWindow:',
      "  # clear the layout's tiles of what doesn't belong there (leaving new seeds to grow)",
      '  for tile in garden.tiles():',
      '    if garden.wantAt(tile) != "" and garden.isOff(tile) and not garden.isEmpty(tile) and not (unlockNewSeeds and garden.isNew(tile)):',
      '      garden.harvest(tile)'
    );
    if (thr < 1) lines.push('  # replant mature plants likely to die on the tick', '  garden.harvestDying(dyingOver)', '  garden.plantEmpty()');
    return lines.join('\n') + '\n';
  }
  const WEED_RULES = `# Weed collector: keeps the garden bare, so weeds and fungi spring up, and gets their seeds.
# Meddleweed is left to grow old, then harvested — the older it is, the likelier it leaves brown
# mold or crumbspore behind. Anything you haven't unlocked yet grows until it's mature and is
# harvested (that unlocks it); everything else is cleared away. It plants nothing.
oldWeedOver = 0.5   # harvest a meddleweed once it's this likely to die on the next tick
# fertilizer: the most weeds (×1.2) and the quickest ticks
garden.soil(fertilizer)
for tile in garden.tiles():
  if not garden.isEmpty(tile):
    if garden.plantAt(tile) == "meddleweed":
      if garden.decay(tile) > oldWeedOver:
        garden.harvest(tile)
    elif garden.isNew(tile):
      if garden.isMature(tile):
        garden.harvest(tile)
    else:
      garden.harvest(tile)
`;
  const MUTATION_RULES = `# Mutation tracker: keeps the layout's plants (the parents) growing, and watches every other tile
# for mutations. A seed you've unlocked already is cleared at once (its tile is another chance); a
# new one is kept — every copy of it — and harvested once mature (that unlocks it). Seeds unlocked
# in the last keepRecentMinutes count as new, so a fresh find's other copies grow on too.
growingOver = 0.34        # fertilizer while more than this share of the layout's plants is still growing
keepRecentMinutes = 60
tickWindow = 15
dyingOver = 0.5
garden.plantEmpty()
# Soil: fertilizer to grow the parents; wood chips (three times the mutation chances) once they're
# mature, if you have the 300 farms it needs — else fertilizer, whose quicker ticks give more chances
if garden.layoutYoungShare() > growingOver or not garden.soilAvailable(woodchips):
  garden.soil(fertilizer)
else:
  garden.soil(woodchips)
for tile in garden.tiles():
  if not garden.isEmpty(tile) and garden.isOff(tile):
    if garden.isNew(tile) or garden.unlockedAgo(garden.plantAt(tile)) < keepRecentMinutes * 60:
      if garden.isMature(tile):
        garden.harvest(tile)
    else:
      garden.harvest(tile)
# In the last tickWindow seconds before a garden tick: replant parents likely to die on it
if garden.tickIn() <= tickWindow:
  garden.harvestDying(dyingOver)
  garden.plantEmpty()
`;
  const BUILTIN_GARDENERS = [
    { id: 'effects', name: 'Effect maximizer', desc: 'Keeps the layout planted and its effects high: fertilizer while plants grow, clay once they’re mature; replants plants about to die.', source: defaultRules },
    { id: 'weeds', name: 'Weed collector', desc: 'Keeps the garden bare on fertilizer so weeds and fungi spring up; harvests old meddleweed (for brown mold and crumbspore) and new seeds once mature.', source: () => WEED_RULES },
    { id: 'mutations', name: 'Mutation tracker', desc: 'Grows the layout’s parents, then wood chips for mutations; clears seeds you have from the other tiles at once, keeps new ones until they’re mature.', source: () => MUTATION_RULES },
  ];
  const isBuiltinGardener = (id) => BUILTIN_GARDENERS.some((g) => g.id === id);
  /** Every gardener: { id, name, desc, builtin, edited }. */
  function gardenerList() {
    return BUILTIN_GARDENERS.map((g) => ({ id: g.id, name: g.name, desc: g.desc, builtin: true, edited: gardeners.some((x) => x.id === g.id) })).concat(
      gardeners.filter((g) => !isBuiltinGardener(g.id)).map((g) => ({ id: g.id, name: g.name, desc: '', builtin: false, edited: false }))
    );
  }
  const gardenerById = (id) => gardenerList().find((g) => g.id === id) || null;
  /** The gardener the auto-gardener follows (the Effect maximizer unless you picked another). */
  const activeGardener = () => gardenerById(S().get('gardenGardener')) || gardenerById('effects');
  /** A gardener's code: yours, a built-in's as you edited it, or its default. */
  function gardenerRules(id) {
    const own = gardeners.find((g) => g.id === id);
    if (own && typeof own.rules === 'string') return own.rules;
    const b = BUILTIN_GARDENERS.find((g) => g.id === id);
    return b ? b.source() : '';
  }
  /** Sets a gardener's code (a built-in: null, or its default code, brings the default back). */
  function setGardenerRules(id, src) {
    const b = BUILTIN_GARDENERS.find((g) => g.id === id);
    const i = gardeners.findIndex((g) => g.id === id);
    if (b) {
      if (src == null || String(src).trim() === b.source().trim()) {
        if (i >= 0) gardeners.splice(i, 1);
      } else if (i >= 0) gardeners[i].rules = String(src).slice(0, 20000);
      else gardeners.push({ id, rules: String(src).slice(0, 20000) });
    } else if (i >= 0 && src != null) gardeners[i].rules = String(src).slice(0, 20000);
    changed();
  }
  /** A gardener of your own (its code: the given one, or a copy of the active gardener's); returns its id. */
  function newGardener(name, src) {
    const id = `r${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    gardeners.push({ id, name: String(name || 'My gardener').trim().slice(0, 40) || 'My gardener', rules: String(src != null ? src : rulesOf()).slice(0, 20000) });
    changed();
    return id;
  }
  function renameGardener(id, name) {
    const g = gardeners.find((x) => x.id === id && !isBuiltinGardener(id));
    if (!g || !String(name).trim()) return;
    g.name = String(name).trim().slice(0, 40);
    changed();
  }
  function removeGardener(id) {
    if (isBuiltinGardener(id)) return;
    gardeners = gardeners.filter((g) => g.id !== id);
    if (S().get('gardenGardener') === id) S().set('gardenGardener', 'effects');
    changed();
  }
  const useGardener = (id) => S().set('gardenGardener', gardenerById(id) ? id : 'effects');
  /** The active gardener's code (what the auto-gardener runs). */
  const rulesOf = () => gardenerRules(activeGardener().id);
  /** Sets a gardener's code — by its id (a garden profile's id, from before v3.2: the active gardener's). */
  const setRules = (id, src) => setGardenerRules(gardenerById(id) ? id : activeGardener().id, src);

  /**
   * Rules saved before v3.1.1 had the soil threshold written into their if (if garden.youngShare() > 0.67:):
   * it becomes a variable at the top, like the default rules have it — the rest of the code as it was.
   */
  function liftSoilThreshold(src) {
    const re = /^([ \t]*)if garden\.youngShare\(\) > ([0-9.]+)[ \t]*:[ \t]*$/gm;
    const found = [...src.matchAll(re)];
    if (found.length !== 1 || new RegExp(`\\b${FERTILIZER_VAR}\\b`).test(src)) return src;
    const value = found[0][2];
    const lines = src.replace(re, `$1if garden.youngShare() > ${FERTILIZER_VAR}:`).split('\n');
    // under the rules' heading comment (the comments after it belong to the lines they describe)
    const at = /^\s*#/.test(lines[0] || '') ? 1 : 0;
    lines.splice(at, 0, `${FERTILIZER_VAR} = ${value}   # fertilizer while more than this share of the planted tiles is still growing, else clay`);
    return lines.join('\n');
  }
  const compiled = new Map(); // source → { flow, errors }
  function compileRules(src) {
    if (!compiled.has(src)) {
      if (compiled.size > 20) compiled.clear();
      compiled.set(src, CA.Script.compile(src));
    }
    return compiled.get(src);
  }

  // what the auto-gardener's latest pass did, by kind (the actions count into it; the page shows it)
  let acc = null;
  function count(k, n = 1) {
    if (!n) return;
    const now = Date.now();
    if (!acc || now - acc.t > 300) acc = { t: now, harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: 0 };
    acc[k] += n;
    last = { at: now, harvested: acc.harvested, planted: acc.planted, saved: acc.saved, unlocked: acc.unlocked, soil: acc.soil > 0 };
  }
  /** Runs fn(M, profile) on a garden that can be tended, else 0. */
  function withGarden(fn) {
    const M = minigame();
    const p = active();
    if (!M || !p || M.freeze) return 0;
    return fn(M, p) || 0;
  }
  const tilesOf = (M) => {
    const out = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (unlockedTile(M, x, y)) out.push([x, y]);
    return out;
  };
  const wantAt = (p, x, y) => (p.plot[y] && p.plot[y][x]) || null;
  /** M.harvest, noting when it unlocks a seed (garden.unlockedAgo). */
  function harvestTile(M, x, y) {
    const me = plantAt(M, x, y);
    const was = me && me.unlocked;
    const ok = M.harvest(x, y);
    if (ok && me && !was && me.unlocked) {
      unlockedAt[me.key] = Date.now();
      changed();
    }
    return ok;
  }
  const isMature = (M, x, y) => {
    const me = plantAt(M, x, y);
    return !!me && M.plot[y][x][1] >= me.mature;
  };

  const actions = {
    plantEmpty: () =>
      withGarden((M, p) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const want = wantAt(p, x, y);
          if (want && M.plants[want] && !plantAt(M, x, y) && plant(M, M.plants[want], x, y)) n++;
        });
        count('planted', n);
        return n;
      }),
    harvestNew: () =>
      withGarden((M) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const me = plantAt(M, x, y);
          if (me && !me.unlocked && isMature(M, x, y) && harvestTile(M, x, y)) n++;
        });
        count('unlocked', n);
        return n;
      }),
    pullMismatches: (keepNew) =>
      withGarden((M, p) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const me = plantAt(M, x, y);
          if (!me || me.key === wantAt(p, x, y)) return;
          if (keepNew && !me.unlocked) return; // a new seed: harvestNew's
          if (harvestTile(M, x, y)) n++;
        });
        count('harvested', n);
        return n;
      }),
    harvestDying: (threshold) =>
      withGarden((M, p) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const me = plantAt(M, x, y);
          if (me && me.key === wantAt(p, x, y) && isMature(M, x, y) && decayChance(M, x, y) > threshold && harvestTile(M, x, y)) n++;
        });
        count('saved', n);
        return n;
      }),
    harvestMature: () =>
      withGarden((M, p) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const me = plantAt(M, x, y);
          if (me && me.unlocked && me.key === wantAt(p, x, y) && isMature(M, x, y) && harvestTile(M, x, y)) n++;
        });
        count('harvested', n);
        return n;
      }),
    soil: (key) =>
      withGarden((M, p) => {
        const k = key === 'profile' ? p.soil : key;
        if (setSoil(M, k)) {
          count('soil');
          return 1;
        }
        return 0;
      }),
  };

  /** The layout's own plants (tiles where its seed grows): { planted, young }. */
  function layoutCensus() {
    const M = minigame();
    const p = active();
    const c = { planted: 0, young: 0 };
    if (!M || !p) return c;
    tilesOf(M).forEach(([x, y]) => {
      const me = plantAt(M, x, y);
      if (!me || me.key !== wantAt(p, x, y)) return;
      c.planted++;
      if (!isMature(M, x, y)) c.young++;
    });
    return c;
  }

  /** Plants on the plot now: { planted, mature, young, empty, off } (empty: unlocked tiles with nothing). */
  function census() {
    const M = minigame();
    const p = active();
    const c = { planted: 0, mature: 0, young: 0, empty: 0, off: 0 };
    if (!M) return c;
    tilesOf(M).forEach(([x, y]) => {
      const me = plantAt(M, x, y);
      if (!me) c.empty++;
      else {
        c.planted++;
        if (isMature(M, x, y)) c.mature++;
        else c.young++;
      }
      if (p && (me ? me.key : null) !== wantAt(p, x, y)) c.off++;
    });
    return c;
  }

  // The Auto-gardener is a built-in algorithmic macro whose code is the active gardener's
  // (sourceFrom), run from the top every second (pass) while there's a garden to tend (ready).
  // tend() is the same pass by hand — the garden.tend action.
  let last = { at: 0, harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: false };
  let lastPass = null; // { t, at, trace, lines, error, errors, profile }
  const canTend = () => {
    const M = minigame();
    return !!M && !!active() && !M.freeze;
  };
  /** After each pass (the gardener's, or tend()'s): where the rules went, for the page. */
  function recordPass(F, errors) {
    const p = active();
    lastPass = { t: Date.now(), at: F.at, trace: F.trace, lines: F.trace.map((x) => x.line).filter(Boolean), error: F.error, errors: errors || [], profile: p && p.id, gardener: activeGardener().id };
  }
  function tend() {
    if (!canTend()) return 0;
    const { flow, errors } = compileRules(rulesOf());
    const F = CA.Macros.runPass(flow);
    recordPass(F, errors);
    return F.done;
  }


  /** What the current garden looks like against the active profile, tile by tile (for the page). */
  function view() {
    const M = minigame();
    if (!M) return null;
    const p = active();
    const tiles = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const open = unlockedTile(M, x, y);
        const me = open ? plantAt(M, x, y) : null;
        const want = p && p.plot[y] ? p.plot[y][x] : null;
        tiles.push({
          x,
          y,
          open,
          plant: me,
          age: me ? M.plot[y][x][1] : 0,
          want: want && M.plants[want] ? M.plants[want] : null,
          match: !p || (me ? me.key : null) === want,
          decay: me ? decayChance(M, x, y) : 0,
        });
      }
    }
    return { M, profile: p, tiles, next: nextTickIn(M), step: M.stepT || 0, soil: M.soilsById && M.soilsById[M.soil] };
  }

  // ---- save / load ---------------------------------------------------------------------------

  const cleanPlot = (plot) => Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => (plot && plot[y] && typeof plot[y][x] === 'string' ? plot[y][x] : null)));
  const serialize = () => ({
    profiles: profiles.map((p) => ({ id: p.id, name: p.name, soil: p.soil, plot: p.plot.map((r) => r.slice()) })),
    gardeners: gardeners.map((g) => ({ ...g })),
    ...(current ? { current: current.map((r) => r.slice()) } : {}),
    unlockedAt: { ...unlockedAt },
  });
  function load(data) {
    // before v3.2: just the profiles (an array), each with its own rules
    const v2 = Array.isArray(data);
    const list = v2 ? data : (data && Array.isArray(data.profiles) && data.profiles) || [];
    gardeners = !v2 && data && Array.isArray(data.gardeners) ? data.gardeners.filter((g) => g && g.id && typeof g.rules === 'string').map((g) => ({ id: String(g.id), ...(isBuiltinGardener(g.id) ? {} : { name: String(g.name || 'My gardener').slice(0, 40) }), rules: g.rules.slice(0, 20000) })) : [];
    current = !v2 && data && Array.isArray(data.current) ? cleanPlot(data.current) : null;
    unlockedAt = !v2 && data && data.unlockedAt && typeof data.unlockedAt === 'object' ? { ...data.unlockedAt } : {};
    profiles = list
      .filter((p) => p && p.id && Array.isArray(p.plot))
      .map((p) => {
        // a profile's own rules (v2.26–v3.1): a gardener of yours now — the active one if its profile was
        if (typeof p.rules === 'string') {
          const id = `r${String(p.id)}`;
          gardeners.push({ id, name: `${String(p.name || 'Garden').slice(0, 30)} rules`, rules: liftSoilThreshold(p.rules.slice(0, 20000)) });
          if (S().get('gardenProfile') === String(p.id)) S().set('gardenGardener', id);
        }
        return { id: String(p.id), name: String(p.name || 'Garden').slice(0, 40), soil: typeof p.soil === 'string' ? p.soil : 'dirt', plot: cleanPlot(p.plot) };
      });
    changed();
  }

  const GARDENER = 'gardener';
  /** The layouts to pick from: the Current garden, then your profiles. */
  const layoutOptions = () => [{ v: CURRENT, label: 'Current garden (keeps what’s planted)' }].concat(profiles.map((p) => ({ v: p.id, label: p.name })));

  function init() {
    CA.Settings.registerSection('garden', { serialize, load, event: 'garden' });
    S().defineOption({ key: 'gardenProfile', group: 'garden-hidden', name: 'Active garden profile', desc: '', default: '' });
    S().defineOption({ key: 'gardenGardener', group: 'garden-hidden', name: 'Active gardener', desc: '', default: 'effects' });
    S().defineOption({ key: 'gardenThreshold', group: 'garden-hidden', name: 'Harvest before dying at', desc: '', default: 50 });
    S().defineOption({ key: 'gardenLead', group: 'garden-hidden', name: 'Seconds before the tick', desc: '', default: 15 });
    S().defineOption({
      key: 'gardenUnlockNew',
      group: 'garden-hidden',
      icon: 'leaf',
      name: 'Unlock new seeds',
      desc: 'Lets a seed you haven’t unlocked yet grow wherever it appears, and harvests it the moment it’s mature (which unlocks it) — instead of pulling it out as a mismatch.',
      default: true,
    });
    // the garden's words, for its rules (and any algorithmic macro)
    const A = CA.Actions.register;
    A({ id: 'garden.plantEmpty', name: 'Plant the profile’s seed on every empty tile', icon: 'leaf', group: 'Garden', unit: 'planted', run: () => actions.plantEmpty() });
    A({ id: 'garden.harvestNew', name: 'Harvest new seeds once mature (unlocks them)', icon: 'leaf', group: 'Garden', unit: 'unlocked', run: () => actions.harvestNew() });
    A({
      id: 'garden.pullMismatches',
      name: 'Pull out what isn’t the profile’s seed',
      icon: 'leaf',
      group: 'Garden',
      unit: 'pulled',
      params: [{ key: 'keepNew', label: 'Leave seeds you haven’t unlocked', type: 'bool', default: true }],
      run: (p) => actions.pullMismatches(p.keepNew !== false),
    });
    A({
      id: 'garden.harvestDying',
      name: 'Harvest mature plants likely to die on the next tick',
      icon: 'leaf',
      group: 'Garden',
      unit: 'harvested',
      params: [{ key: 'threshold', label: 'Chance to die over', type: 'number', default: 0.5, min: 0 }],
      run: (p) => actions.harvestDying(Number(p.threshold)),
    });
    A({ id: 'garden.harvestMature', name: 'Harvest every mature plant of the profile', icon: 'leaf', group: 'Garden', unit: 'harvested', run: () => actions.harvestMature() });
    const soils = () => ['dirt', 'fertilizer', 'clay', 'pebbles', 'woodchips', 'profile'].map((v) => ({ v, label: v === 'profile' ? 'the profile’s soil' : v }));
    A({
      id: 'garden.soil',
      name: 'Switch the soil (when the game allows)',
      icon: 'leaf',
      group: 'Garden',
      unit: 'switched',
      params: [{ key: 'soil', label: 'Soil', type: 'select', default: 'fertilizer', options: soils }],
      run: (p) => actions.soil(p.soil),
    });
    CA.Conditions.register({
      id: 'garden.soilIs',
      name: 'The garden’s soil is…',
      icon: 'leaf',
      params: [{ key: 'soil', label: 'Soil', type: 'select', default: 'clay', options: soils }],
      describe: (p) => `the soil is ${p.soil}`,
      test: (p) => {
        const M = minigame();
        const s = M && M.soilsById && M.soilsById[M.soil];
        return !!s && s.key === (p.soil === 'profile' && active() ? active().soil : p.soil);
      },
    });
    const V = (id, desc, get) => CA.Script.defineValue({ id, desc, get });
    V('garden.tickIn', 'seconds until the next garden tick', () => {
      const M = minigame();
      return M ? Math.round(nextTickIn(M) * 10) / 10 : NaN;
    });
    V('garden.youngShare', 'share of the planted tiles not mature yet (0–1)', () => {
      const c = census();
      return c.planted ? Math.round((c.young / c.planted) * 1000) / 1000 : 0;
    });
    V('garden.matureShare', 'share of the planted tiles that are mature (0–1)', () => {
      const c = census();
      return c.planted ? Math.round((c.mature / c.planted) * 1000) / 1000 : 0;
    });
    V('garden.plants', 'plants on the plot', () => census().planted);
    V('garden.mature', 'mature plants on the plot', () => census().mature);
    V('garden.empty', 'empty tiles', () => census().empty);
    V('garden.offProfile', 'tiles that aren’t as the profile has them', () => census().off);
    V('garden.layoutYoungShare', 'share of the layout’s own plants not mature yet (0–1)', () => {
      const c = layoutCensus();
      return c.planted ? Math.round((c.young / c.planted) * 1000) / 1000 : 0;
    });
    CA.Script.defineValue({
      id: 'garden.isUnlocked',
      desc: 'whether you’ve unlocked a seed',
      params: ['seed'],
      bool: true,
      get: (seed) => !!((minigame() || {}).plants || {})[seed] && !!minigame().plants[seed].unlocked,
    });
    CA.Script.defineValue({
      id: 'garden.unlockedAgo',
      desc: 'seconds since a seed was unlocked (a huge number when it’s been long, or never)',
      params: ['seed'],
      get: (seed) => {
        let t = unlockedAt[seed] || 0;
        (CA.EventLog.list(['garden']) || []).forEach((e) => e.data && e.data.seed === seed && e.t > t && (t = e.t));
        return t ? Math.max(0, (Date.now() - t) / 1000) : 1e12;
      },
    });
    CA.Script.defineValue({
      id: 'garden.soilAvailable',
      desc: 'whether you have the farms a soil needs',
      params: ['soil'],
      bool: true,
      get: (soil) => {
        const M = minigame();
        const s = M && M.soils && M.soils[soil];
        return !!s && (M.parent.amount || 0) >= (s.req || 0);
      },
    });

    // tile by tile: a tile is named "x,y" (garden.tiles() lists the ones you can use)
    const at = (fn, none) => (tile) => {
      const M = minigame();
      const [x, y] = String(tile).split(',').map(Number);
      return M && Number.isInteger(x) && Number.isInteger(y) && unlockedTile(M, x, y) ? fn(M, x, y) : none;
    };
    const T = (id, desc, get, bool) => CA.Script.defineValue({ id, desc, params: ['tile'], get, bool });
    const tileOptions = () => {
      const M = minigame();
      return M ? tilesOf(M).map(([x, y]) => ({ v: `${x},${y}`, label: `${x},${y}${plantAt(M, x, y) ? ` — ${plantAt(M, x, y).name}` : ''}` })) : [];
    };
    CA.Script.defineValue({
      id: 'garden.tiles',
      desc: 'a list: every tile you can plant on ("x,y")',
      list: true,
      get: () => {
        const M = minigame();
        return M ? tilesOf(M).map(([x, y]) => `${x},${y}`) : [];
      },
    });
    T('garden.plantAt', 'what grows on a tile (its seed, or "" when empty)', at((M, x, y) => (plantAt(M, x, y) || {}).key || '', ''));
    T('garden.wantAt', 'the layout’s seed for a tile (or "")', at((M, x, y) => (active() && wantAt(active(), x, y)) || '', ''));
    T('garden.age', 'how far a tile’s plant has grown (its age; 0 when empty)', at((M, x, y) => (plantAt(M, x, y) ? M.plot[y][x][1] : 0), 0));
    T('garden.decay', 'the chance a tile’s plant dies on the next tick (0–1)', at((M, x, y) => (isMature(M, x, y) ? decayChance(M, x, y) : 0), 0));
    T('garden.isMature', 'whether a tile’s plant is mature', at((M, x, y) => isMature(M, x, y), false), true);
    T('garden.isNew', 'whether a tile’s plant is a seed you haven’t unlocked yet', at((M, x, y) => !!plantAt(M, x, y) && !plantAt(M, x, y).unlocked, false), true);
    T('garden.isEmpty', 'whether a tile has nothing growing', at((M, x, y) => !plantAt(M, x, y), false), true);
    T('garden.isOff', 'whether a tile isn’t as the layout has it', at((M, x, y) => ((plantAt(M, x, y) || {}).key || null) !== ((active() && wantAt(active(), x, y)) || null), false), true);
    CA.Script.defineValue({
      id: 'garden.seeds',
      desc: 'a list: every seed you’ve unlocked',
      list: true,
      get: () => Object.keys((minigame() || {}).plants || {}).filter((k) => minigame().plants[k].unlocked),
    });
    CA.Script.defineValue({ id: 'garden.seedCost', desc: 'cookies to plant a seed', params: ['seed'], get: (seed) => {
      const M = minigame();
      const me = M && M.plants[seed];
      return me && typeof M.getCost === 'function' ? M.getCost(me) : NaN;
    } });
    const seedOptions = () => Object.keys((minigame() || {}).plants || {}).map((k) => ({ v: k, label: minigame().plants[k].name }));
    A({
      id: 'garden.harvest',
      name: 'Harvest a tile',
      icon: 'leaf',
      group: 'Garden',
      unit: 'harvested',
      params: [{ key: 'tile', label: 'Tile', type: 'select', default: '', options: tileOptions }],
      run: (p) =>
        withGarden((M) => {
          const [x, y] = String(p.tile).split(',').map(Number);
          if (!Number.isInteger(x) || !Number.isInteger(y) || !plantAt(M, x, y) || !harvestTile(M, x, y)) return 0;
          count('harvested');
          return 1;
        }),
    });
    A({
      id: 'garden.plant',
      name: 'Plant a seed on a tile',
      icon: 'leaf',
      group: 'Garden',
      unit: 'planted',
      params: [
        { key: 'tile', label: 'Tile', type: 'select', default: '', options: tileOptions },
        { key: 'seed', label: 'Seed', type: 'select', default: 'bakerWheat', options: seedOptions },
      ],
      run: (p) =>
        withGarden((M) => {
          const [x, y] = String(p.tile).split(',').map(Number);
          const me = M.plants[p.seed];
          if (!me || !Number.isInteger(x) || !Number.isInteger(y) || !unlockedTile(M, x, y) || plantAt(M, x, y) || !plant(M, me, x, y)) return 0;
          count('planted');
          return 1;
        }),
    });
    CA.Actions.register({
      id: 'garden.tend',
      name: 'Tend the garden (the active gardener, once)',
      icon: 'leaf',
      group: 'Garden',
      unit: 'done',
      available: () => !!minigame() && !!active(),
      run: () => tend(),
    });
    CA.Macros.addBuiltin({
      id: GARDENER,
      name: 'Auto-gardener',
      desc: 'Tends your garden: the gardener you pick (what it does — the Effect maximizer, the Weed collector, the Mutation tracker, or your own code) with the layout you pick (a garden profile, or the Current garden). Edit gardeners on the Garden page.',
      icon: { sprite: [4, 0], sheet: 'img/gardenPlants.png' }, // mature Baker's wheat
      mode: 'flow',
      pass: true,
      every: 1000,
      sourceFrom: () => (active() ? rulesOf() : ''),
      // its two choices, on its card: the layout and the gardener (the Garden page's own settings)
      inputs: [
        { key: 'layout', label: 'Layout', type: 'select', default: '', options: layoutOptions, get: activeLayoutId, set: (v) => use(v) },
        { key: 'gardener', label: 'Gardener', type: 'select', default: 'effects', options: () => gardenerList().map((g) => ({ v: g.id, label: g.name })), get: () => activeGardener().id, set: (v) => useGardener(v) },
      ],
      ready: canTend,
      afterPass: (F) => recordPass(F),
      editAt: 'garden',
      defaultKey: '',
      section: 'garden',
    });
  }

  return {
    init,
    minigame,
    decayChance,
    snapshot,
    removeProfile,
    rename,
    use,
    active,
    profiles: () => profiles.slice(),
    layoutOptions,
    CURRENT,
    gardeners: gardenerList,
    gardener: gardenerById,
    activeGardener,
    activeLayoutId,
    captureCurrent,
    gardenerRules,
    setGardenerRules,
    newGardener,
    renameGardener,
    removeGardener,
    useGardener,
    tend,
    view,
    last: () => last,
    lastPass: () => lastPass,
    rulesOf,
    setRules,
    defaultRules,
    census,
    compileRules,
    serialize,
    load,
    GARDENER,
    nextTickIn,
  };
})();
