// v3.11.0: garden mutation odds in the game's own garden: under an empty
// tile's tooltip what it can grow at the next tick (a seed not unlocked yet starred), under a seed's the
// chance it grows somewhere and how long that takes, a chip on each empty tile — each with its option.
// (The odds themselves are checked against the real game's ticks in tests/sim/mutations.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// a small garden: wheat (mature) next to empty tiles; the game's recipe for two wheats, simplified
const plants = {
  bakerWheat: { key: 'bakerWheat', name: 'Baker’s wheat', id: 0, mature: 35, ageTick: 7, ageTickR: 2, unlocked: 1 },
  thumbcorn: { key: 'thumbcorn', name: 'Thumbcorn', id: 1, mature: 20, ageTick: 6, ageTickR: 2, unlocked: 0 },
};
const plot = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [0, 0]));
plot[0][0] = [1, 50];
plot[0][1] = [1, 50];
const M = {
  plants,
  plantsById: [plants.bakerWheat, plants.thumbcorn],
  plot,
  soil: 0,
  soilsById: [{ key: 'dirt', weedMult: 1 }],
  plotBoost: Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [1, 1, 1])),
  loopsMult: 1,
  stepT: 300,
  nextStep: Date.now() + 60000,
  getTile: (x, y) => (x < 0 || y < 0 || x > 5 || y > 5 ? [0, 0] : plot[y][x]),
  isTileUnlocked: () => true,
  getMuts: (n, nm) => (nm.bakerWheat >= 2 ? [['bakerWheat', 0.2], ['thumbcorn', 0.05]] : nm.bakerWheat >= 1 ? [['bakerWheat', 0.1]] : []),
  tileTooltip: () => () => '<div class="name">Empty tile</div>',
  seedTooltip: () => () => '<div class="name">Seed</div>',
};
Game.Objects.Farm.minigame = M;
Game.auraMult = () => 0;
for (let y = 0; y < 6; y++)
  for (let x = 0; x < 6; x++) {
    const el = doc.createElement('div');
    el.id = `gardenTile-${x}-${y}`;
    doc.body.appendChild(el);
  }
await sleep(1100); // the painter runs every second

// ---- the odds: (1,1) has both wheats above it, mature (the tick ages them first — still mature, far from 100)
const t = CA.Mutations.tile(1, 1);
assert(t && t.plants.length === 2 && t.plants[0].key === 'bakerWheat', `an empty tile next to two mature wheats: wheat, thumbcorn (${t && t.plants.map((p) => `${p.key} ${(p.chance * 100).toFixed(2)}%`)})`);
// one loop, entries 0.2 and 0.05 drawn independently, one of those that came up grows
const wheat = 0.2 * (0.95 + 0.05 / 2);
const thumb = 0.05 * (0.8 + 0.2 / 2);
assert(Math.abs(t.plants[0].chance - wheat) < 1e-12 && Math.abs(t.plants[1].chance - thumb) < 1e-12, 'each: its draw × the chance it’s the one picked');
assert(CA.Mutations.tile(0, 0) === null, 'a planted tile: none');

// ---- the tile tooltip
const tip = M.tileTooltip(1, 1)();
assert(/Empty tile/.test(tip) && /CookieMgr · next tick/.test(tip) && /Thumbcorn <span class="ca-gi-new">★ new/.test(tip) && /Something grows/.test(tip) && /next tick in 1m 0\ds|next tick in 59s|next tick in 1m/.test(tip), 'an empty tile’s tooltip: the game’s, then what can grow, a new seed starred, the next tick');
const far = M.tileTooltip(5, 5)();
assert(/nothing can/.test(far) || /Meddleweed|meddleweed/.test(far), 'a tile with nothing around: nothing (or weeds)');
// ---- the seed tooltip
const st = M.seedTooltip(1)();
assert(/Grows next tick/.test(st) && /on \d+ tiles?/.test(st) && /On average in/.test(st), 'a seed’s tooltip: the chance it grows somewhere, on how many tiles, how long on average');
// ---- the chips
const chip = doc.querySelector('#gardenTile-1-1 .ca-gi-chip');
assert(chip && /%$/.test(chip.textContent) && chip.classList.contains('new'), `a chip on an empty tile: ${chip && chip.textContent}, gold (a new seed among it)`);
assert(!doc.querySelector('#gardenTile-0-0 .ca-gi-chip'), 'none on a planted tile');
// ---- options
CA.Settings.set('gardenOddsTiles', false);
assert(!doc.querySelector('.ca-gi-chip'), 'chips off: gone');
CA.Settings.set('gardenOddsTips', false);
assert(!/CookieMgr/.test(M.tileTooltip(1, 1)()), 'tooltips off: the game’s alone');
// ---- the words
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
assert(Math.abs(V('garden.mutationChance', 1, 1) - t.any) < 1e-12 && V('garden.growChance', 'thumbcorn') > 0 && Number.isFinite(V('garden.growIn', 'thumbcorn')), 'the words');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
