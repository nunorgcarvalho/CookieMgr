// v3.4.2: the Full-garden replanter starts a new round fertilizer first — the next tick comes within
// 3 minutes, and the old plants keep working until then — and harvests and replants the whole layout
// in the last `plantWindow` seconds before that tick, so the new plants grow on it straight away.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const M = makeGarden(Game); // 12 tiles: x 1–4, y 2–4
await sleep(400);
const G = CA.Garden;
const LY = CA.GardenLayers;
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const at = (x, y) => (M.plot[y][x][0] ? M.plantsById[M.plot[y][x][0] - 1].key : null);
const tiles = [];
for (let y = 2; y <= 4; y++) for (let x = 1; x <= 4; x++) tiles.push([x, y]);
const soil = () => M.soilsById[M.soil].key;
const tickIn = (s) => (M.nextStep = Date.now() + s * 1000);
const young = () => tiles.filter(([x, y]) => at(x, y) && M.plot[y][x][1] === 0).length;
Game.cookies = 1e12;
LY.pick('profile', 'goldenCombos');
LY.pick('seeds', 'bakerWheat');
assert(/^plantWindow = 15\b/m.test(G.rulesOf()) && LY.get('gardener', 'cohort').data.knobs.plantWindow.unit === 's', 'plantWindow: a variable (with its knob, in seconds)');

// ---- an empty garden: fertilizer first, planted just before the tick
M.soil = 2; // clay
tickIn(600);
M.nextSoil = 0;
G.tend();
assert(soil() === 'fertilizer' && young() === 0, 'a round due, the tick far off: fertilizer first, nothing planted yet');
tickIn(170); // (the game brings the tick within 3 minutes on fertilizer)
G.tend();
assert(young() === 0, '…still more than 15 s before the tick: waits');
tickIn(10);
G.tend();
assert(young() === 12 && soil() === 'fertilizer', 'in the last 15 s before the tick: the whole layout planted (it grows on that tick)');

// ---- the end of a round: the old plants keep working until the tick
tiles.forEach(([x, y]) => set(x, y, 'bakerWheat', 60));
M.soil = 2;
[[1, 2], [2, 2], [3, 2], [4, 2]].forEach(([x, y]) => set(x, y, null)); // 8 of 12 left: under 75%
tickIn(600);
M.nextSoil = 0;
const before = M.harvestLog.length;
G.tend();
assert(soil() === 'fertilizer' && M.harvestLog.length === before && tiles.filter(([x, y]) => at(x, y)).length === 8, 'too few left: fertilizer at once, the 8 mature plants kept (not harvested yet)');
tickIn(10);
G.tend();
assert(M.harvestLog.length - before === 8 && young() === 12 && soil() === 'fertilizer', 'just before the tick: all harvested, the whole layout replanted');

// ---- fertilizer held back (the game's 10-minute soil cooldown): it still replants before the next tick
tiles.forEach(([x, y]) => set(x, y, 'bakerWheat', 60));
[[1, 2], [2, 2], [3, 2], [4, 2]].forEach(([x, y]) => set(x, y, null));
M.soil = 2;
M.nextSoil = Date.now() + 5 * 60e3;
tickIn(400);
G.tend();
assert(soil() === 'clay' && young() === 0, 'no fertilizer yet (cooldown): the old plants keep working on clay');
tickIn(10);
G.tend();
assert(young() === 12, '…and the round is planted before the next tick anyway');

// ---- mid-round: as before (the soil rule)
tiles.forEach(([x, y]) => set(x, y, 'bakerWheat', 60));
M.nextSoil = 0;
tickIn(600);
G.tend();
assert(soil() === 'clay' && young() === 0, 'a full, mature round: clay, nothing replanted');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
