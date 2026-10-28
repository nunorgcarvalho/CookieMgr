// Minimum bulk: one store setting — auto / ×1 / ×10 / ×100 — for what CookieMgr's buyers buy a building
// in (Best building, buy.best, best(), the Payback page's Best of all), with Round to multiples rounding
// it up to the next multiple; the store's Best buy sort ranks at least that many. Auto is what was there
// before: ×10 with Round to multiples on, else ×1.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const P = CA.Payback;
const Sh = CA.Shop;

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: [37, 5, 0][i], locked: false });
});
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 1e9;
let st = 0;
const newState = () => (Game.pledges = 200 + ++st);
const S = CA.Settings;
const cursor = Game.Objects.Cursor;

// ---- the amount a buy takes
S.set('roundUpBulk', false);
S.set('minBulk', 0);
assert(Sh.minBulk() === 1 && Sh.buyAmount(cursor) === 1, 'auto, Round to multiples off: ×1');
S.set('roundUpBulk', true);
assert(Sh.minBulk() === 10 && Sh.buyAmount(cursor) === 3, 'auto, Round to multiples on: up to the next 10 (37 → 40: 3)');
S.set('minBulk', 100);
assert(Sh.buyAmount(cursor) === 63, '×100, rounded: 37 → 100 (63)');
S.set('roundUpBulk', false);
assert(Sh.buyAmount(cursor) === 100, '×100, not rounded: exactly 100');
S.set('minBulk', 10);
assert(Sh.buyAmount(Game.Objects.Farm) === 10, '×10: 10 farms');
S.set('roundUpBulk', true);
assert(Sh.buyAmount(Game.Objects.Farm) === 10, '×10 rounded with none owned: 10');
Sh.setMinBulk(7);
assert(S.get('minBulk') === 0, 'setMinBulk: anything else is auto');

// ---- best() and the ranking buy in it
S.set('roundUpBulk', false);
Sh.setMinBulk(10);
newState();
const r = P.ranking('building', { bulk: 'auto' });
assert(r.length === 3 && r.every((x) => x.n === 10), `ranking({ bulk: 'auto' }) at ×10: every building ×10 (${r.map((x) => x.n)})`);
const b = P.best('building');
assert(b && b.n === 10 && b.label.startsWith('10 ×'), `best(): 10 at a time (${b && b.label})`);
assert(Math.abs(b.price - P.sumPrice(Game.Objects[b.name], 10)) < 1e-6, 'best(): priced for 10');
Sh.setMinBulk(1);
newState();
assert(P.best('building').n === 1, '×1: one at a time');

// ---- the autobuyer's pick is in the minimum bulk
Sh.setMinBulk(10);
S.set('roundUpBulk', true);
newState();
const before = cursor.amount;
const farmsBefore = Game.Objects.Farm.amount;
const grBefore = Game.Objects.Grandma.amount;
CA.AutoBuyer.use('buildings'); // v3.43: Best building → the Auto buyer, Buildings only
CA.Macros.runOnce('autoBuyer');
await sleep(50);
const bought = [cursor.amount - before, Game.Objects.Grandma.amount - grBefore, Game.Objects.Farm.amount - farmsBefore];
const got = bought.find((x) => x > 0);
assert(got !== undefined && [3, 5, 10].includes(got) && bought.filter((x) => x > 0).length === 1, `Best building bought one building up to its next 10 (${bought})`);
const which = Object.keys(spec)[bought.findIndex((x) => x > 0)];
assert(which && Game.Objects[which].amount % 10 === 0, `…and it's at a multiple of 10 now (${which}: ${which && Game.Objects[which].amount})`);

// ---- the store's Best buy sort: at least the minimum bulk
Sh.setSort('value');
Game.buyMode = 1;
Game.buyBulk = 1;
Sh.setMinBulk(100);
S.set('roundUpBulk', false);
newState();
Sh.order();
const t = P.table();
const at100 = Object.keys(spec).every((n) => t.buildings[100][n]);
assert(at100, 'the table has every building ×100 (what the sort looks up)');
Sh.setMinBulk(0);
assert(Sh.order().length === Object.keys(Game.Objects).length, 'auto: the sort as before (the selected bulk)');

// ---- the Payback page and the store toolbar show it
CA.UI.Menu.openPage('payback');
await sleep(100);
const page = w.document.querySelector('[data-pp-bulk="10"]');
assert(!!page, 'the Payback page: a Minimum bulk choice');
page.click();
await sleep(50);
assert(S.get('minBulk') === 10, 'clicking ×10 on the Payback page sets it');
CA.UI.Menu.close && CA.UI.Menu.close();

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
