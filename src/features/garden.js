// The **auto-gardener**: keeps the Garden (Farm minigame) matching a saved layout.
//
// A **profile** is a snapshot of a garden: which seed is on every tile (or nothing) and the soil.
// While the "Auto-gardener" macro is on, once a second it tends the garden towards the active one:
//
//   - in the last `lead` seconds before a garden tick (15 by default):
//       · harvests plants that aren't the profile's seed for their tile (weeds, mutations, leftovers)
//       · harvests the profile's own mature plants when the chance that they die of old age on the
//         coming tick is above your threshold (50% by default; 100% = let them die)
//       · plants the profile's seed on every empty tile, when you can afford it
//       · switches the soil to the profile's, when the game lets you (10-minute cooldown)
//   - any time: harvests a plant whose seed you haven't unlocked yet as soon as it's mature, which
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

  /**
   * One pass of the auto-gardener over the active profile. Returns how many things it did and
   * logs them by kind in `last` (for the page).
   */
  let last = { at: 0, harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: false };
  function tend() {
    const M = minigame();
    const p = active();
    if (!M || !p || M.freeze) return 0;
    const lead = Math.max(1, Number(S().get('gardenLead')) || 15);
    const threshold = Math.max(0, Math.min(100, Number(S().get('gardenThreshold')))) / 100;
    const inWindow = nextTickIn(M) <= lead;
    const unlockNew = !!S().get('gardenUnlockNew');
    const did = { harvested: 0, planted: 0, saved: 0, unlocked: 0, soil: false };
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!unlockedTile(M, x, y)) continue;
        const want = (p.plot[y] && p.plot[y][x]) || null;
        const me = plantAt(M, x, y);
        if (me) {
          const mature = M.plot[y][x][1] >= me.mature;
          if (!me.unlocked && unlockNew) {
            // a new seed: let it grow, harvest it the moment it can unlock
            if (mature && M.harvest(x, y)) did.unlocked++;
            continue;
          }
          if (me.key !== want) {
            if (inWindow && M.harvest(x, y)) did.harvested++;
            else continue;
          } else if (mature && threshold < 1 && inWindow && decayChance(M, x, y) > threshold) {
            if (M.harvest(x, y)) did.saved++;
          } else continue;
        }
        if (inWindow && want && M.plants[want] && !plantAt(M, x, y) && plant(M, M.plants[want], x, y)) did.planted++;
      }
    }
    if (inWindow && p.soil) did.soil = setSoil(M, p.soil);
    const n = did.harvested + did.planted + did.saved + did.unlocked + (did.soil ? 1 : 0);
    if (n) last = { at: Date.now(), ...did };
    return n;
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

  const serialize = () => profiles.map((p) => ({ id: p.id, name: p.name, soil: p.soil, plot: p.plot.map((r) => r.slice()) }));
  function load(data) {
    profiles = (Array.isArray(data) ? data : [])
      .filter((p) => p && p.id && Array.isArray(p.plot))
      .map((p) => ({
        id: String(p.id),
        name: String(p.name || 'Garden').slice(0, 40),
        soil: typeof p.soil === 'string' ? p.soil : 'dirt',
        plot: Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => (p.plot[y] && typeof p.plot[y][x] === 'string' ? p.plot[y][x] : null))),
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
      group: 'garden',
      icon: 'leaf',
      name: 'Unlock new seeds',
      desc: 'Lets a seed you haven’t unlocked yet grow wherever it appears, and harvests it the moment it’s mature (which unlocks it) — instead of pulling it out as a mismatch.',
      default: true,
    });
    CA.Actions.register({
      id: 'garden.tend',
      name: 'Tend the garden (active profile)',
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
      icon: { sprite: [0, 0], img: 'img/gardenPlants.png' },
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'garden.tend' }],
      defaultKey: '',
      keepOnAscend: false,
      section: 'garden',
    });
  }

  return { init, minigame, decayChance, snapshot, removeProfile, rename, use, active, profiles: () => profiles.slice(), tend, view, last: () => last, serialize, load, GARDENER, nextTickIn };
})();
