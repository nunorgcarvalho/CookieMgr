// The **auto-gardener**: keeps the Garden (Farm minigame) matching a saved layout.
//
// A **profile** is a snapshot of a garden: which seed is on every tile (or nothing) and the soil.
// While the "Auto-gardener" macro is on, once a second it tends the garden towards the active one:
//
//   - in the last `lead` seconds before a garden tick (15 by default):
//       · harvests plants that aren't the profile's seed for their tile (weeds, mutations, leftovers)
//       · harvests the profile's own mature plants when the chance that they die of old age on the
//         coming tick is above your threshold (50% by default; 100% = let them die)
//       · replants the tiles it just cleared
//       · switches the soil to the profile's, when the game lets you (10-minute cooldown)
//   - any time: plants the profile's seed on every empty tile you can afford, and harvests a plant
//     whose seed you haven't unlocked yet as soon as it's mature, which
//     unlocks it (if "Unlock new seeds" is on; off, a new seed is a mismatch like any other)
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
  const S = () => CA.Settings;

  function minigame() {
    const farm = Game.Objects && Game.Objects.Farm;
    const M = farm && farm.minigame;
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
  const active = () => profiles.find((p) => p.id === S().get('gardenProfile')) || null;

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
    if (!active()) S().set('gardenProfile', p.id);
    changed();
    return p;
  }

  function removeProfile(id) {
    const i = profiles.findIndex((p) => p.id === id);
    if (i < 0) return;
    profiles.splice(i, 1);
    if (S().get('gardenProfile') === id) S().set('gardenProfile', profiles[0] ? profiles[0].id : '');
    changed();
  }

  function rename(id, name) {
    const p = profiles.find((x) => x.id === id);
    if (!p || !String(name).trim()) return;
    p.name = String(name).trim().slice(0, 40);
    changed();
  }

  const use = (id) => S().set('gardenProfile', profiles.some((p) => p.id === id) ? id : '');
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

  // ---- rules: what the auto-gardener does, written as code (one set per profile) -----------------
  //
  // Each profile has rules — algorithmic code (features/script.js) run from the top on every pass
  // of the auto-gardener — built from the garden's own actions, values and conditions below. A
  // profile without rules of its own uses the default ones (which carry over the old settings:
  // seconds before the tick, the death-chance threshold, unlocking new seeds).

  function defaultRules() {
    const lead = Math.max(1, Number(S().get('gardenLead')) || 15);
    const thr = Math.max(0, Math.min(100, Number(S().get('gardenThreshold')))) / 100;
    const lines = [
      '# These rules run from the top every second while the Auto-gardener is on.',
      '# Plant the profile\'s seed on every empty tile, right away.',
      'garden.plantEmpty()',
    ];
    if (S().get('gardenUnlockNew') !== false) lines.push("# A seed you haven't unlocked: let it grow, harvest it once it's mature (that unlocks it).", 'garden.harvestNew()');
    lines.push(
      `# In the last ${lead} seconds before a garden tick:`,
      `if garden.tickIn() <= ${lead}:`,
      "  # pull out what isn't the profile's seed for its tile",
      `  garden.pullMismatches(${S().get('gardenUnlockNew') !== false ? 'true' : 'false'})`
    );
    if (thr < 1) lines.push(`  # harvest mature plants more likely than ${Math.round(thr * 100)}% to die on the tick, then replant`, `  garden.harvestDying(${thr})`, '  garden.plantEmpty()');
    lines.push(
      '# Soil: fertilizer while most plants are still growing, clay once a third of them are mature.',
      'if garden.youngShare() > 0.67:',
      '  garden.soil(fertilizer)',
      'else:',
      '  garden.soil(clay)'
    );
    return lines.join('\n') + '\n';
  }
  const rulesOf = (p) => (p && typeof p.rules === 'string' ? p.rules : defaultRules());
  /** Sets a profile's rules (null: back to the default ones). */
  function setRules(id, src) {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    if (src == null) delete p.rules;
    else p.rules = String(src).slice(0, 20000);
    changed();
  }
  const compiled = new Map(); // source → { flow, errors }
  function compileRules(src) {
    if (!compiled.has(src)) {
      if (compiled.size > 20) compiled.clear();
      compiled.set(src, CA.Script.compile(src));
    }
    return compiled.get(src);
  }

  // what this pass has done (the actions count into it; the page shows it)
  let pass = null;
  const count = (k, n = 1) => pass && (pass[k] = (pass[k] || 0) + n);
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
          if (me && !me.unlocked && isMature(M, x, y) && M.harvest(x, y)) n++;
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
          if (M.harvest(x, y)) n++;
        });
        count('harvested', n);
        return n;
      }),
    harvestDying: (threshold) =>
      withGarden((M, p) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const me = plantAt(M, x, y);
          if (me && me.key === wantAt(p, x, y) && isMature(M, x, y) && decayChance(M, x, y) > threshold && M.harvest(x, y)) n++;
        });
        count('saved', n);
        return n;
      }),
    harvestMature: () =>
      withGarden((M, p) => {
        let n = 0;
        tilesOf(M).forEach(([x, y]) => {
          const me = plantAt(M, x, y);
          if (me && me.unlocked && me.key === wantAt(p, x, y) && isMature(M, x, y) && M.harvest(x, y)) n++;
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

  /**
   * One pass of the auto-gardener: the active profile's rules, from the top. Returns how many
   * things it did; what it did by kind goes to `last`, and where the rules went to lastPass.
   */
  let last = { at: 0, harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: false };
  let lastPass = null; // { at, trace, lines, errors, t }
  function tend() {
    const M = minigame();
    const p = active();
    if (!M || !p || M.freeze) return 0;
    const src = rulesOf(p);
    const { flow, errors } = compileRules(src);
    pass = { harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: 0 };
    let F;
    try {
      F = CA.Macros.runPass(flow);
    } finally {
      const did = pass;
      pass = null;
      const n = did.harvested + did.planted + did.saved + did.unlocked + did.soil;
      if (n) last = { at: Date.now(), ...did, soil: did.soil > 0 };
    }
    lastPass = {
      t: Date.now(),
      at: F.at,
      trace: F.trace,
      lines: F.trace.map((x) => x.line).filter(Boolean),
      error: F.error,
      errors,
      profile: p.id,
    };
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

  const serialize = () => profiles.map((p) => ({ id: p.id, name: p.name, soil: p.soil, plot: p.plot.map((r) => r.slice()), ...(typeof p.rules === 'string' ? { rules: p.rules } : {}) }));
  function load(data) {
    profiles = (Array.isArray(data) ? data : [])
      .filter((p) => p && p.id && Array.isArray(p.plot))
      .map((p) => ({
        id: String(p.id),
        name: String(p.name || 'Garden').slice(0, 40),
        soil: typeof p.soil === 'string' ? p.soil : 'dirt',
        plot: Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => (p.plot[y] && typeof p.plot[y][x] === 'string' ? p.plot[y][x] : null))),
        ...(typeof p.rules === 'string' ? { rules: p.rules.slice(0, 20000) } : {}),
      }));
    changed();
  }

  const GARDENER = 'gardener';

  function init() {
    S().defineOption({ key: 'gardenProfile', group: 'garden-hidden', name: 'Active garden profile', desc: '', default: '' });
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
    CA.Actions.register({
      id: 'garden.tend',
      name: 'Tend the garden (the active profile’s rules)',
      icon: 'leaf',
      group: 'Garden',
      unit: 'done',
      available: () => !!minigame() && !!active(),
      run: () => tend(),
    });
    CA.Macros.addBuiltin({
      id: GARDENER,
      name: 'Auto-gardener',
      desc: 'Keeps your garden like the active profile on the Garden page: replants, pulls out what doesn’t belong, saves plants about to die and unlocks new seeds.',
      icon: { sprite: [4, 0], sheet: 'img/gardenPlants.png' }, // mature Baker's wheat
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'garden.tend' }],
      defaultKey: '',
      section: 'garden',
    });
  }

  return { init, minigame, decayChance, snapshot, removeProfile, rename, use, active, profiles: () => profiles.slice(), tend, view, last: () => last, lastPass: () => lastPass, rulesOf, setRules, defaultRules, census, compileRules, serialize, load, GARDENER, nextTickIn };
})();
