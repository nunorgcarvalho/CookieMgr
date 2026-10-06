// v2.17.0: the store toolbar along the bottom of the store; rounding to multiples for selling too.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;

// Cursor like main.js: buy(), sell(amount, bypass), and the store's two price functions
const cur = Game.Objects.Cursor;
const priceAt = (n) => Math.ceil(15 * Math.pow(1.15, n));
cur.amount = 37;
cur.getPrice = function () {
  return priceAt(this.amount);
};
cur.getSumPrice = function (n) {
  let s = 0;
  for (let i = 0; i < n; i++) s += priceAt(this.amount + i);
  return s;
};
cur.getReverseSumPrice = function (n) {
  let s = 0;
  for (let i = 1; i <= Math.min(n, this.amount); i++) s += Math.floor(priceAt(this.amount - i) / 4);
  return s;
};
cur.refresh = function () {
  this.bulkPrice = Game.buyMode === 1 ? this.getSumPrice(Game.buyBulk) : this.getReverseSumPrice(Game.buyBulk);
};
cur.buy = function (amount) {
  if (Game.buyMode == -1) {
    this.sell(Game.buyBulk, 1);
    return 0;
  }
  if (!amount) amount = Game.buyBulk;
  for (let i = 0; i < amount; i++) {
    if (Game.cookies < this.getPrice()) break;
    Game.cookies -= this.getPrice();
    this.amount++;
  }
};
cur.sell = function (amount) {
  if (amount == -1) amount = this.amount;
  if (!amount) amount = Game.buyBulk;
  for (let i = 0; i < amount && this.amount > 0; i++) this.amount--;
};
Game.buyMode = 1;
Game.buyBulk = 10;
Game.cookies = 1e12;
const right = doc.createElement('div');
right.id = 'sectionRight';
right.innerHTML = '<div id="store"><div id="products"></div></div>';
doc.getElementById('game').appendChild(right);
await sleep(400);

// ---- the toolbar
const bar = () => doc.getElementById('CookieMgrStoreBar');
assert(bar() && !doc.getElementById('CookieMgrStoreSwitch'), 'a toolbar instead of the side switch');
assert(bar().querySelectorAll('.ca-sb-sort [data-ss-sort]').length === 3 && bar().querySelector('[data-ss-round]'), 'sort buttons + multiples');
assert(doc.body.classList.contains('ca-has-storebar'), 'the building list gets room for it');

// ---- selling rounds down to a multiple
CA.Shop.setRoundUp(true);
Game.buyMode = -1;
CA.UI.StoreBar.render();
assert(bar().querySelector('.ca-sb-txt').textContent === '⌊10⌋', 'sell mode: shows rounding down');
cur.refresh();
assert(cur.bulkPrice === cur.getReverseSumPrice(7), `sell price for 7 (${cur.bulkPrice})`);
cur.buy(); // the store's click in sell mode
assert(cur.amount === 30, `37 → 30 (${cur.amount})`);
cur.buy();
assert(cur.amount === 20, 'on a multiple: a full 10');
Game.buyBulk = 100;
cur.amount = 250;
cur.buy();
assert(cur.amount === 200, '×100: 250 → 200');
cur.sell(5);
assert(cur.amount === 195, 'explicit amounts untouched');
// buying still rounds up (Cursor 195 costs ~1e13)
Game.cookies = 1e20;
Game.buyMode = 1;
Game.buyBulk = 10;
cur.buy();
assert(cur.amount === 200, `buy: 195 → 200 (${cur.amount})`);
CA.Shop.setRoundUp(false);
Game.buyMode = -1;
cur.buy();
assert(cur.amount === 190, 'off: sells the full 10');
Game.buyMode = 1;

// ---- labels / option
const opt = CA.Settings.optionsIn('store').find((d) => d.key === 'roundUpBulk');
assert(opt.name === 'Round to multiples' && /selling/.test(opt.desc), 'option renamed: Round to multiples');
assert(CA.Settings.optionsIn('store').find((d) => d.key === 'storeSwitch').name === 'Store toolbar', 'option: Store toolbar');
CA.Settings.set('storeSwitch', false);
assert(!bar() && !doc.body.classList.contains('ca-has-storebar'), 'option off: gone, list padding gone');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
