// v3.11.1: the Garden page's plot shows the mutation odds too (CA.Mutations, the engine the game's
// garden uses): a badge on each empty tile that can grow something at the next tick — gold when a
// seed you haven't unlocked could — a "Next tick" section in its details, and a "Grows next tick"
// stat; the same two options as the game's garden switch them. Worked out again only when the plot
// (or the soil, or the tick) changes.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game); // tiles x 1–4, y 2–4
Game.auraMult = () => 0;
// the game's recipe for two mature wheats, simplified — with a seed not unlocked yet (golden clover)
M.getMuts = (n, nm) => (nm.bakerWheat >= 2 ? [['bakerWheat', 0.2], ['goldenClover', 0.05]] : nm.bakerWheat >= 1 ? [['bakerWheat', 0.1]] : []);
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
set(1, 2, 'bakerWheat', 50);
set(2, 2, 'bakerWheat', 50);
await sleep(400);

const S = CA.Settings;
assert(S.get('gardenOddsTiles') === true && S.get('gardenOddsTips') === true, 'the odds options (the game garden’s): on');
let calls = 0;
const all = CA.Mutations.all;
CA.Mutations.all = function () {
  calls++;
  return all.apply(this, arguments);
};

CA.UI.Menu.openPage('garden');
CA.UI.GardenPage.sync();
const page = () => doc.querySelector('[data-page="garden"]');
const tileEl = (x, y) => page().querySelectorAll('[data-gp-plot] .ca-gtile')[y * 6 + x];
const expect = CA.Mutations.tile(1, 3);
assert(expect && expect.plants.some((p) => p.key === 'goldenClover'), `(the engine: the tile under the wheats can grow ${expect && expect.plants.map((p) => p.key)})`);
const pct = (p) => `${(p * 100).toFixed(p < 0.01 ? 2 : p < 0.1 ? 1 : 0)}%`;

// ---- the badge on an empty tile
const badge = tileEl(1, 3).querySelector('.ca-godds');
assert(badge && badge.textContent === pct(expect.any), `an empty tile next to two mature wheats: its odds of growing something (${badge && badge.textContent} vs ${pct(expect.any)})`);
assert(badge.classList.contains('new'), '…gold: a seed you haven’t unlocked could grow there');
assert(!tileEl(1, 2).querySelector('.ca-godds'), 'a planted tile: no badge');
assert(!tileEl(0, 0).querySelector('.ca-godds'), 'a locked tile: none');

// ---- its details: what can grow, each with its chance
const pop = tileEl(1, 3).querySelector('.ca-gpop').textContent;
const clover = expect.plants.find((p) => p.key === 'goldenClover');
assert(/Next tick/.test(pop) && new RegExp(`Golden clover ★ new seed${pct(clover.chance).replace('.', '\\.')}`).test(pop), `the details: “Next tick”, the new seed marked, with its chance (${pop})`);
assert(/Baker.s wheat/.test(pop) && /Something grows/.test(pop), '…every plant that can grow, and the total');

// ---- the stat
const stats = () => page().querySelector('[data-gp-stats]').textContent;
assert(/Grows next tick/.test(stats()) && /new seed: /.test(stats()), `the Garden card: how many plants grow next tick, the chance of a new seed (${stats()})`);

// ---- worked out when the plot changes, not on every refresh
const c0 = calls;
CA.UI.GardenPage.sync();
CA.UI.GardenPage.sync();
assert(calls === c0, `refreshing the page doesn’t work the odds out again (${calls - c0} more)`);
set(4, 3, 'bakerWheat', 5);
CA.UI.GardenPage.sync();
assert(calls === c0 + 1, 'a change on the plot does');

// ---- the options switch it, here as in the game's garden
S.set('gardenOddsTiles', false);
CA.UI.GardenPage.sync();
assert(!page().querySelector('[data-gp-plot] .ca-godds') && !/Grows next tick/.test(stats()), 'Mutation odds on tiles off: no badges, no stat');
assert(/Next tick/.test(tileEl(1, 3).querySelector('.ca-gpop').textContent), '…the details still have them (the tooltip option)');
S.set('gardenOddsTips', false);
CA.UI.GardenPage.sync();
assert(!/Next tick/.test(tileEl(1, 3).querySelector('.ca-gpop').textContent), 'Mutation odds in tooltips off too: not in the details');
const c1 = calls;
CA.UI.GardenPage.sync();
assert(calls === c1, 'both off: not worked out at all');
S.set('gardenOddsTiles', true);
S.set('gardenOddsTips', true);
CA.UI.GardenPage.sync();
assert(tileEl(1, 3).querySelector('.ca-godds'), 'back on: back');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
