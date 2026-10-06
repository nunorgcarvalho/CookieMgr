// v2.11.0: the Garden page and the auto-gardener (profiles, decay threshold, replant window,
// unlocking new seeds, soil).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();

/** A garden like minigameGarden.js: 6×6 plot (level-limited), plants by key, harvest/unlock, soils. */
function makeGarden(Game) {
  const plants = {
    bakerWheat: { name: "Baker's wheat", icon: 0, ageTick: 7, ageTickR: 2, mature: 35, cost: 1, costM: 30, unlocked: 1 },
    thumbcorn: { name: 'Thumbcorn', icon: 1, ageTick: 6, ageTickR: 2, mature: 20, cost: 5, costM: 100, unlocked: 1 },
    bakeberry: { name: 'Bakeberry', icon: 3, ageTick: 1, ageTickR: 1, mature: 80, cost: 15, costM: 2e9, unlocked: 1 },
    meddleweed: { name: 'Meddleweed', icon: 8, ageTick: 10, ageTickR: 10, mature: 50, cost: 1, costM: 0, unlocked: 1, weed: true },
    goldenClover: { name: 'Golden clover', icon: 5, ageTick: 4, ageTickR: 12, mature: 50, cost: 125, costM: 777, unlocked: 0 },
    elderwort: { name: 'Elderwort', icon: 20, ageTick: 0.3, ageTickR: 0.5, mature: 90, cost: 60, costM: 1, unlocked: 1, immortal: 1 },
  };
  const plantsById = [];
  Object.keys(plants).forEach((k, i) => {
    plants[k].key = k;
    plants[k].id = i;
    plantsById.push(plants[k]);
  });
  const soils = {
    dirt: { name: 'Dirt', tick: 5, req: 0 },
    fertilizer: { name: 'Fertilizer', tick: 3, req: 50 },
    clay: { name: 'Clay', tick: 15, req: 100 },
  };
  const soilsById = [];
  Object.keys(soils).forEach((k, i) => {
    soils[k].key = k;
    soils[k].id = i;
    soilsById.push(soils[k]);
  });
  const M = {
    plants,
    plantsById,
    soils,
    soilsById,
    soil: 0,
    nextSoil: 0,
    freeze: 0,
    stepT: 300,
    nextStep: Date.now() + 200 * 1000,
    plot: Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [0, 0])),
    plotBoost: Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [1, 1, 1])),
    parent: Game.Objects.Farm,
    harvestLog: [],
    plotLimits: [[2, 2, 4, 4], [2, 2, 5, 4], [2, 2, 5, 5], [1, 2, 5, 5]],
    isTileUnlocked(x, y) {
      const l = this.plotLimits[Math.max(1, Math.min(this.plotLimits.length, this.parent.level)) - 1];
      return x >= l[0] && x < l[2] && y >= l[1] && y < l[3];
    },
    getCost: (me) => Math.max(me.costM, Game.cookiesPs * me.cost * 60),
    canPlant(me) {
      return Game.cookies >= this.getCost(me);
    },
    unlockSeed(me) {
      if (me.unlocked) return false;
      me.unlocked = 1;
      return true;
    },
    harvest(x, y) {
      const tile = this.plot[y][x];
      if (tile[0] < 1) return false;
      const me = this.plantsById[tile[0] - 1];
      if (tile[1] >= me.mature) this.unlockSeed(me);
      this.harvestLog.push(`${me.key}@${x},${y}${tile[1] >= me.mature ? ' mature' : ''}`);
      this.plot[y][x] = [0, 0];
      return true;
    },
    computeStepT() {
      this.stepT = this.soilsById[this.soil].tick * 60;
    },
  };
  Game.Objects.Farm.level = 4; // tiles x 1–4, y 2–4
  Game.Objects.Farm.amount = 120;
  Game.Objects.Farm.minigame = M;
  Game.Spend = (n) => (Game.cookies -= n);
  Game.cookiesPs = 1;
  return M;
}

const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const M = makeGarden(Game);
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const set = (x, y, key, age) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const at = (x, y) => (M.plot[y][x][0] ? M.plantsById[M.plot[y][x][0] - 1].key : null);

// ---- the death chance, against the game's own aging (randomFloor) simulated
const randomFloor = (x) => (x % 1 < Math.random() ? Math.floor(x) : Math.ceil(x));
function simulate(me, age, boost, n = 200000) {
  let dead = 0;
  for (let i = 0; i < n; i++) if (age + randomFloor((me.ageTick + me.ageTickR * Math.random()) * boost) >= 100) dead++;
  return dead / n;
}
set(1, 2, 'bakerWheat', 92);
assert(Math.abs(CA.Garden.decayChance(M, 1, 2) - 0.75) < 1e-9, `wheat at 92: 75% (${CA.Garden.decayChance(M, 1, 2)})`);
[
  ['bakerWheat', 92, 1],
  ['bakerWheat', 95, 1],
  ['bakerWheat', 90, 1.25],
  ['thumbcorn', 93, 0.8],
  ['bakeberry', 98, 1],
  ['meddleweed', 85, 1],
].forEach(([k, age, boost]) => {
  set(1, 2, k, age);
  M.plotBoost[2][1][0] = boost;
  const mine = CA.Garden.decayChance(M, 1, 2);
  const sim = simulate(M.plants[k], age, boost);
  assert(Math.abs(mine - sim) < 0.01, `${k} at ${age} ×${boost}: ${(mine * 100).toFixed(1)}% vs simulated ${(sim * 100).toFixed(1)}%`);
});
M.plotBoost[2][1][0] = 1;
set(1, 2, 'bakerWheat', 50);
assert(CA.Garden.decayChance(M, 1, 2) === 0, 'young plants: no chance');
set(1, 2, 'elderwort', 91);
assert(CA.Garden.decayChance(M, 1, 2) === 0, 'immortal plants never die');

// ---- a layout, saved as a profile from the Garden page
// row 2: wheat wheat thumbcorn [empty]; row 3: bakeberry ×2, empty ×2; row 4: empty
set(1, 2, 'bakerWheat', 10);
set(2, 2, 'bakerWheat', 10);
set(3, 2, 'thumbcorn', 5);
set(1, 3, 'bakeberry', 20);
set(2, 3, 'bakeberry', 20);
M.soil = 2; // clay
CA.UI.Menu.openPage('garden');
const page = () => doc.querySelector('[data-page="garden"]');
assert(page() && page().querySelectorAll('[data-gp-plot] .ca-gtile').length === 36 && page().querySelectorAll('[data-gp-plot] .ca-gtile.locked').length === 24, 'Garden page: the plot, locked tiles greyed');
assert(page().querySelector('[data-macro-row="gardener"]'), 'the Auto-gardener switch');
page().querySelector('[data-gp-name]').value = 'Bakeberries';
click(w, page().querySelector('[data-gp-save]'));
const prof = CA.Garden.profiles()[0];
assert(prof && prof.name === 'Bakeberries' && prof.soil === 'clay' && prof.plot[3][1] === 'bakeberry' && prof.plot[2][4] === null && CA.Garden.active() === prof, 'profile saved: seeds + soil, and made active');
assert(page().querySelector('.ca-gprofile.on') && page().querySelectorAll('.ca-gmini span').length === 36, 'listed with a mini plot');

// ---- tending
CA.Settings.set('gardenLead', 15);
Game.cookies = 1e6;
set(4, 2, 'meddleweed', 3); // a weed where the profile has nothing
set(1, 2, null); // a tile to replant
set(2, 3, 'bakeberry', 98); // about to die (bakeberry grows 1–2 a tick → 50%)
set(3, 3, 'goldenClover', 10); // a new seed, growing
M.soil = 0; // dirt (profile: clay)
M.nextStep = Date.now() + 200 * 1000; // tick far off
assert(CA.Garden.tend() === 2 && at(4, 2) === 'meddleweed' && at(1, 2) === 'bakerWheat' && M.soil === 1, 'outside the window: plants the empty tile at once, leaves the weed for the tick (v2.26: and fertilizer — every plant is young)');
M.nextStep = Date.now() + 10 * 1000; // within 15s
M.harvestLog.length = 0;
const n = CA.Garden.tend();
assert(at(4, 2) === null && M.harvestLog.includes('meddleweed@4,2'), 'pulls out what isn’t in the profile');
assert(at(1, 2) === 'bakerWheat', 'the replanted tile stays');
assert(at(3, 3) === 'goldenClover', 'a growing new seed is left alone');
assert(M.harvestLog.every((h) => !h.startsWith('bakeberry')), `bakeberry at 98 (50%) kept at threshold 50% (${M.harvestLog})`);
assert(M.soil === 1 && M.nextSoil > Date.now(), 'the soil stays (fertilizer, on its cooldown)');
assert(Game.cookies === 1e6 - M.getCost(M.plants.bakerWheat) && n === 1, `paid for the seed (${Game.cookies}), then 1 thing in the window (${n})`);

CA.Settings.set('gardenThreshold', 40);
Game.cookies = 1e10; // bakeberries cost 2e9 here
M.harvestLog.length = 0;
CA.Garden.tend();
assert(M.harvestLog.join() === 'bakeberry@2,3 mature' && at(2, 3) === 'bakeberry' && M.plot[3][2][1] === 0, `over the threshold: harvested and replanted (${M.harvestLog})`);
CA.Settings.set('gardenThreshold', 100);
set(2, 3, 'bakeberry', 99);
assert(CA.Garden.tend() === 0 && M.plot[3][2][1] === 99, '100% = let it die');
CA.Settings.set('gardenThreshold', 50);

// new seeds: harvested the moment they're mature (any time), which unlocks them
M.nextStep = Date.now() + 200 * 1000;
set(3, 3, 'goldenClover', 50);
M.harvestLog.length = 0;
CA.Garden.tend();
assert(M.harvestLog.join() === 'goldenClover@3,3 mature' && M.plants.goldenClover.unlocked === 1, 'mature new seed harvested → unlocked');
// with the option off, a new seed is a mismatch like any other
M.plants.goldenClover.unlocked = 0;
CA.Settings.set('gardenUnlockNew', false);
set(3, 3, 'goldenClover', 5);
M.nextStep = Date.now() + 5000;
CA.Garden.tend();
assert(at(3, 3) === null, 'option off: pulled out in the window');
CA.Settings.set('gardenUnlockNew', true);

// can't afford: leaves it empty
set(1, 3, null);
Game.cookies = 10;
CA.Garden.tend();
assert(at(1, 3) === null && Game.cookies === 10, 'no cookies, no planting');
Game.cookies = 1e10;
// soil cooldown respected
M.soil = 0;
M.nextSoil = Date.now() + 60000;
CA.Garden.tend();
assert(M.soil === 0, 'soil waits for its cooldown');
M.nextSoil = 0;
M.freeze = 1;
set(1, 3, null);
assert(CA.Garden.tend() === 0, 'frozen garden: hands off');
M.freeze = 0;

// as a macro: on → tends every second
M.nextStep = Date.now() + 5000;
set(1, 3, null);
CA.Macros.set('gardener', true);
await sleep(1100);
assert(at(1, 3) === 'bakeberry', 'Auto-gardener macro tends while on');
CA.Macros.set('gardener', false);

// ---- the plot view: mismatches and decay chances
set(4, 3, 'thumbcorn', 1);
set(2, 3, 'bakeberry', 98);
CA.UI.Menu.openPage('garden');
CA.UI.GardenPage.sync();
const tiles = page().querySelectorAll('[data-gp-plot] .ca-gtile');
assert(tiles[3 * 6 + 4].classList.contains('off'), 'off-profile tile ringed');
assert(/50%/.test(tiles[3 * 6 + 2].querySelector('.ca-gdecay').textContent) && /Dies next tick\s*50%/.test(tiles[3 * 6 + 2].textContent), 'mature plant: its death chance');
assert(tiles[2 * 6 + 4].querySelector('.ca-gs') === null, 'empty tile with nothing planned');

// ---- profiles: rename, a second one, use, delete (two clicks)
const rn = page().querySelector(`[data-gp-rename="${prof.id}"]`);
rn.value = 'Berry farm';
rn.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(CA.Garden.profiles()[0].name === 'Berry farm', 'rename');
click(w, page().querySelector('[data-gp-save]'));
const p2 = CA.Garden.profiles()[1];
assert(p2 && p2.name === 'Garden 2' && CA.Garden.active().id === prof.id, 'second profile; the active one stays');
click(w, page().querySelector(`[data-gp-use="${p2.id}"]`));
assert(CA.Garden.active().id === p2.id, 'use another profile');
const sel = page().querySelector('[data-gp-active]');
sel.value = prof.id;
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(CA.Garden.active().id === prof.id, 'or pick it in the Auto-gardener card');
// v2.26: the threshold and lead are written into the default rules now (no fields of their own)
assert(!page().querySelector('[data-gp-num]'), 'no threshold / lead fields (v2.26: rules)');
CA.Settings.set('gardenThreshold', 35);
click(w, page().querySelector(`[data-gp-del="${p2.id}"]`));
assert(CA.Garden.profiles().length === 2, 'delete asks first');
click(w, page().querySelector(`[data-gp-del="${p2.id}"]`));
assert(CA.Garden.profiles().length === 1, 'then deletes');

// ---- saved and restored
Game.WriteSave();
const saved = Game.modSaveData.CookieMgr;
const data = JSON.parse(saved);
assert(data.garden.length === 1 && data.garden[0].plot[3][1] === 'bakeberry' && data.options.gardenThreshold === 35 && data.options.gardenProfile === prof.id, 'profiles and settings saved');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: saved });
makeGarden(g2.Game);
await sleep(400);
const CA2 = g2.window.CookieMgr;
assert(CA2.Garden.active() && CA2.Garden.active().name === 'Berry farm' && CA2.Settings.get('gardenThreshold') === 35, 'restored');

// ---- no garden yet
const g3 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
g3.Game.Objects.Farm.minigame = null;
await sleep(400);
g3.window.CookieMgr.UI.Menu.openPage('garden');
assert(/Garden opens once you have a level-1 Farm/.test(g3.window.document.querySelector('[data-page="garden"]').textContent) && g3.window.CookieMgr.Garden.tend() === 0, 'no Garden: explains, does nothing');

assert(g.errors.length + g2.errors.length + g3.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
