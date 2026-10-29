// Nunix's garden rounds: the Tulip and clover rounds gardener plants each round whole — once the bank
// covers all of it, and no effect makes seeds dearer — the nursetulips first (no clover round while a
// tulip round is due). The Auto buyer's Garden rounds bank keeps what those rounds need, at unbuffed
// prices: the tulips' round while they aren't all planted, plus roundsMargin (1.25) × the clovers'
// round; Golden cookie combos (Nunix's buyer profile) keeps it instead of the whole-layout replant.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const M = makeGarden(Game);
// Farm level 8: x 0–5, y 1–5 (6×5, Nuno's garden)
M.plotLimits = [[2, 2, 4, 4], [2, 2, 5, 4], [2, 2, 5, 5], [1, 2, 5, 5], [1, 1, 5, 5], [1, 1, 6, 5], [1, 1, 6, 6], [0, 1, 6, 6], [0, 0, 6, 6]];
Game.Objects.Farm.level = 8;
await sleep(400);
const G = CA.Garden;
const LY = CA.GardenLayers;
const B = CA.AutoBuyer;
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);
const at = (x, y) => (M.plot[y][x][0] ? M.plantsById[M.plot[y][x][0] - 1].key : null);
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const TULIPS = [];
const CLOVERS = [];
for (let y = 1; y <= 5; y++) for (let x = 0; x <= 5; x++) ((y === 2 || y === 4) && x >= 1 && x <= 4 ? TULIPS : CLOVERS).push([x, y]);
const count = (tiles, f) => tiles.filter(([x, y]) => f(x, y)).length;
const planted = (tiles, seed) => count(tiles, (x, y) => at(x, y) === seed);
const near = (a, b) => Math.abs(a - b) <= Math.abs(b) * 1e-9;
M.plants.goldenClover.unlocked = 1;
M.plants.nursetulip.unlocked = 1;
LY.pick('profile', 'tulipCombos');
M.soil = 2;
M.nextSoil = 0;
M.nextStep = Date.now() + 600e3;

// CpS 1e10: a nursetulip 40 min of it (2.4e13), a golden clover 125 min (7.5e13)
Game.cookiesPs = Game.unbuffedCps = 1e10;
const TULIP = 2.4e13 * 8;
const CLOVER = 7.5e13 * 22;
assert(near(value('garden.roundCost', 'nursetulip'), TULIP) && near(value('garden.roundCost', 'goldenClover'), CLOVER), `garden.roundCost: 8 tulips, 22 clovers (${value('garden.roundCost', 'nursetulip')}, ${value('garden.roundCost', 'goldenClover')})`);
assert(near(value('garden.roundCost'), G.layoutCost()), 'garden.roundCost(): the whole layout');

// ---- whole rounds: nothing while the bank can't cover the tulips' round
Game.cookies = TULIP * 0.9;
G.tend();
assert(planted(TULIPS, 'nursetulip') === 0 && planted(CLOVERS, 'goldenClover') === 0, 'short of the tulips’ round: nothing planted (not a few tulips)');
// the tulips first: their round down whole, the clovers waiting
Game.cookies = TULIP + CLOVER * 0.5;
G.tend();
assert(planted(TULIPS, 'nursetulip') === 8, 'the bank covers the tulips’ round: all 8 planted');
assert(planted(CLOVERS, 'goldenClover') === 0, 'the clovers wait: short of their round');
assert(near(Game.cookies, CLOVER * 0.5), 'only the tulips paid for');
// the tulips first even when the bank could pay either: none of the clovers while a tulip round is due
TULIPS.forEach(([x, y]) => set(x, y, null));
Game.cookies = CLOVER * 1.01;
G.tend();
assert(planted(TULIPS, 'nursetulip') === 8 && planted(CLOVERS, 'goldenClover') === 0, 'a tulip round due: the tulips go down, not the clovers');
Game.cookies = CLOVER * 1.01;
G.tend();
assert(planted(CLOVERS, 'goldenClover') === 22, 'the tulips down, the bank covers the clovers: all 22 planted');

// ---- an effect on the prices: no new round until it's over
CLOVERS.forEach(([x, y]) => set(x, y, null));
Game.cookies = 1e20;
Game.cookiesPs = 7e10; // a Frenzy: seeds 7 times dearer
assert(value('garden.priceBoost') === 7, 'garden.priceBoost: 7 in a Frenzy');
G.tend();
assert(planted(CLOVERS, 'goldenClover') === 0, 'a Frenzy on: the clover round waits');
Game.cookiesPs = 1e10;
G.tend();
assert(planted(CLOVERS, 'goldenClover') === 22, 'over: planted');

// ---- the gardener's knobs turn it back into the old ways
const rules = LY.get('gardener', 'tulipRounds').data;
assert(rules.knobs.wholeRounds && rules.knobs.tulipsFirst && rules.knobs.waitOutEffects, 'knobs: wholeRounds, tulipsFirst, waitOutEffects');
assert(CA.Script.compile(rules.rules).errors.length === 0, 'the gardener compiles');
G.setRules('tulipRounds', rules.rules.replace('wholeRounds = true', 'wholeRounds = false'));
TULIPS.forEach(([x, y]) => set(x, y, null));
Game.cookies = 2.4e13 * 3.5;
G.tend();
assert(planted(TULIPS, 'nursetulip') === 3, `wholeRounds off: what it can afford (${planted(TULIPS, 'nursetulip')})`);
G.setRules('tulipRounds', null);

// ---- the Garden rounds reserve (unbuffed prices)
TULIPS.forEach(([x, y]) => set(x, y, 'nursetulip', 10));
assert(near(G.roundsReserve(), 1.25 * CLOVER), `the tulips down: 1.25 × the clovers’ round (${G.roundsReserve()})`);
set(1, 2, null);
assert(near(G.roundsReserve(), TULIP + 1.25 * CLOVER), 'a tulip tile empty: + the tulips’ round');
Game.cookiesPs = 7e10;
assert(near(G.roundsReserve(), TULIP + 1.25 * CLOVER), 'a Frenzy doesn’t move it');
Game.cookiesPs = 1e10;
assert(near(value('garden.roundsReserve'), G.roundsReserve()), 'the word garden.roundsReserve');
set(1, 2, 'nursetulip', 10);

// ---- the Auto buyer: Golden cookie combos keeps it
const combos = B.find('combos');
assert(combos.banks.join() === 'lucky,gardenRounds' && combos.roundsMargin === 1.25, `Golden cookie combos: the Lucky! and Garden rounds banks (${combos.banks}, ${combos.roundsMargin})`);
let part = B.reserveParts('combos').find((q) => q.id === 'gardenRounds');
assert(part && near(part.amount, 1.25 * CLOVER), 'its reserve part: the rounds reserve');
B.update('combos', { roundsMargin: 2 });
part = B.reserveParts('combos').find((q) => q.id === 'gardenRounds');
assert(near(part.amount, 2 * CLOVER), 'roundsMargin 2: two clover rounds');
Game.cookies = 2 * CLOVER + 5e14;
assert(near(B.budget('combos'), 5e14), 'the buyer spends what’s above');

// the editor: the margin shows with the chip
const doc = w.document;
const menu = () => doc.getElementById('CookieMgrMenu');
B.use('combos');
CA.UI.Menu.openPage('payback');
await sleep(50);
const input = menu().querySelector('[data-ab-f="roundsMargin"]');
assert(input && input.value === '2', 'Rounds margin in the editor');
input.value = '1.5';
input.dispatchEvent(new w.Event('change', { bubbles: true }));
await sleep(20);
assert(B.find('combos').roundsMargin === 1.5, 'edited there');
B.update('combos', { banks: ['lucky'] });
CA.UI.Menu.render();
await sleep(20);
assert(!menu().querySelector('[data-ab-f="roundsMargin"]'), 'not without the Garden rounds bank');

// ---- a save from before: Golden cookie combos with the garden replant bank gets Garden rounds
const saved = JSON.parse(CA.Settings.serialize());
saved.buyer.profiles = saved.buyer.profiles.map((p) => (p.id === 'combos' ? { ...p, banks: ['lucky', 'garden'], roundsMargin: undefined } : p));
saved.buyer.profiles.push({ id: 'mine', name: 'Mine', banks: ['lucky', 'garden'] });
CA.Settings.load(JSON.stringify(saved));
assert(B.find('combos').banks.join() === 'lucky,gardenRounds' && B.find('combos').roundsMargin === 1.25, 'old Golden cookie combos: Garden rounds, margin 1.25');
assert(B.find('mine').banks.join() === 'lucky,garden', 'a profile of yours keeps its garden replant');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
