// The store tooltip's block follows the buy amount selected (×1, ×10, ×100, rounded up to a multiple
// with Round to multiples), and the store starts a session at the minimum bulk when that's ×10 or ×100.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const S = CA.Settings;
const Sh = CA.Shop;

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: [37, 5, 0][i], locked: false });
});
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.cookies = 1e9;
Game.buyMode = 1;
await sleep(700);
let st = 0;
const at = (bulk) => {
  Game.buyBulk = bulk;
  Game.pledges = 300 + ++st;
  const t = CA.UI.StoreInsight.buildingBlock(Game.Objects.Grandma).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return t;
};

// ---- the tooltip, for what a click buys
S.set('roundUpBulk', false);
assert(/Bonus income \(×1\) \+1\/s/.test(at(1)), 'at ×1: one grandma');
assert(/Bonus income \(×10\) \+10\/s/.test(at(10)), 'at ×10: ten');
assert(/Bonus income \(×100\) \+100\/s/.test(at(100)), 'at ×100: a hundred');
S.set('roundUpBulk', true);
assert(/Bonus income \(×5\) \+5\/s/.test(at(10)), 'at ×10, rounded: 5 owned → 5, to 10');

// ---- the store starts at the minimum bulk
const bulkButtons = [1, 10, 100].map((n) => {
  const el = w.document.createElement('div');
  el.id = `storeBulk${n}`;
  if (n === 1) el.className = 'selected';
  w.document.body.appendChild(el);
  return el;
});
const fresh = () => {
  Game.buyBulk = 1;
  bulkButtons.forEach((el, i) => el.classList.toggle('selected', i === 0));
};
fresh();
S.set('roundUpBulk', false);
S.set('minBulk', 0);
assert(S.get('startAtMinBulk') === true, 'on by default');
assert(!Sh.startBulk() && Game.buyBulk === 1, 'auto without Round to multiples (×1): stays at ×1');
S.set('minBulk', 10);
assert(Sh.startBulk() && Game.buyBulk === 10, 'minimum bulk ×10: starts at ×10');
assert(bulkButtons[1].classList.contains('selected') && !bulkButtons[0].classList.contains('selected'), 'and the store shows ×10 selected');
fresh();
S.set('minBulk', 100);
assert(Sh.startBulk() && Game.buyBulk === 100, 'minimum bulk ×100: starts at ×100');
fresh();
S.set('minBulk', 0);
S.set('roundUpBulk', true);
assert(Sh.startBulk() && Game.buyBulk === 10, 'auto with Round to multiples (×10): starts at ×10');
Game.buyBulk = 100;
assert(!Sh.startBulk() && Game.buyBulk === 100, 'a store already off ×1 is left alone');
fresh();
S.set('startAtMinBulk', false);
assert(!Sh.startBulk() && Game.buyBulk === 1, 'option off: stays at ×1');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
