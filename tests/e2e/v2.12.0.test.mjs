// v2.12.0 (store toolbar since v2.17): building sort (v3.5: CookieMgr's own, no Cookie Monster), and
// rounding ×10 / ×100 buys up to the next multiple.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;

// Cursor's buy / getSumPrice exactly like main.js (buy() with no amount = Game.buyBulk; price ×1.15)
const cur = Game.Objects.Cursor;
const priceAt = (n) => Math.ceil(15 * Math.pow(1.15, n));
cur.amount = 37;
cur.getPrice = function () {
  return priceAt(this.amount);
};
cur.getSumPrice = function (amount) {
  let s = 0;
  for (let i = 0; i < amount; i++) s += priceAt(this.amount + i);
  return s;
};
cur.refreshes = 0;
cur.refresh = function () {
  this.bulkPrice = Game.buyMode === 1 ? this.getSumPrice(Game.buyBulk) : 0;
  this.refreshes++;
};
cur.buy = function (amount) {
  if (Game.buyMode == -1) return 0;
  if (!amount) amount = Game.buyBulk;
  if (amount == -1) amount = 1000;
  for (let i = 0; i < amount; i++) {
    const p = this.getPrice();
    if (Game.cookies < p) break;
    Game.cookies -= p;
    this.amount++;
  }
};
Game.buyMode = 1;
Game.buyBulk = 1;
Game.RefreshStore = () => (Game.storeRefreshed = (Game.storeRefreshed || 0) + 1);
// the store panel and its building list, for placing the switch
const right = doc.createElement('div');
right.id = 'sectionRight';
right.innerHTML = '<div id="store"><div id="products"></div></div>';
doc.getElementById('game').appendChild(right);
await sleep(400);

const sw = () => doc.getElementById('CookieMgrStoreBar');
assert(sw() && sw().querySelectorAll('[data-ss-sort]').length === 3 && sw().querySelector('[data-ss-round]'), 'side switch: three sorts + round up');

// ---- round up
Game.cookies = 1e12;
Game.buyBulk = 10;
cur.buy();
assert(cur.amount === 47, `off: ×10 buys 10 (${cur.amount})`);
click(w, sw().querySelector('[data-ss-round]'));
assert(CA.Settings.get('roundUpBulk') === true && sw().querySelector('[data-ss-round]').classList.contains('on'), 'click switches it on');
assert(cur.refreshes > 0 && cur.bulkPrice === priceAt(47) + priceAt(48) + priceAt(49), `store price shows the rounded amount (${cur.bulkPrice})`);
cur.buy();
assert(cur.amount === 50, `on: 47 → 50 (${cur.amount})`);
cur.buy();
assert(cur.amount === 60, 'on a multiple: a full 10');
Game.buyBulk = 100;
cur.buy();
assert(cur.amount === 100, `×100: 60 → 100 (${cur.amount})`);
Game.buyBulk = 1;
cur.buy();
assert(cur.amount === 101, '×1 untouched');
cur.buy(5);
assert(cur.amount === 106, 'explicit amounts untouched');
Game.buyBulk = 10;
assert(sw().querySelector('.ca-sb-txt').textContent === '⌈10⌉', 'shows the bulk it rounds to');
Game.cookies = priceAt(106) + priceAt(107); // can afford 2 of the 4
cur.buy();
assert(cur.amount === 108, 'buys what it can afford, like the game');

// ---- sort (v3.5: CookieMgr's own — no Cookie Monster): the store's building rows laid out in order
// the store's rows, as the game builds them: the bulk selector, then a row per building
const products = doc.getElementById('products');
products.innerHTML = '<div id="storeBulk"></div>';
Object.values(Game.Objects).forEach((b) => {
  b.l = doc.createElement('div');
  b.l.className = 'product';
  products.appendChild(b.l);
});
// a CpS model: Grandma pays back fastest, then Farm, then the Cursor; Bank and Wizard tower add nothing
const prices = { Grandma: 100, Farm: 1100, Bank: 1.4e6, 'Wizard tower': 3.3e8 };
Object.keys(prices).forEach((n, i) => {
  const b = Game.Objects[n];
  b.id = i + 1;
  b.basePrice = prices[n];
  b.free = 0;
});
Game.Objects.Cursor.id = 0;
cpsModel(Game, { base: 1000, each: { Cursor: 0.0001, Grandma: 5, Farm: 8 } });
Game.cookies = 1e12;
Game.buyBulk = 1;
CA.Shop.setRoundUp(false);
CA.UI.StoreBar.render();
assert(!sw().querySelector('.ca-sb-sort.locked') && sw().querySelector('[data-ss-sort="default"]').classList.contains('on') && !/Cookie Monster/.test(sw().textContent), 'v3.5: never locked; game order selected');
const rowOf = (n) => Game.Objects[n].l.style.gridRow.replace(/ /g, '');
click(w, sw().querySelector('[data-ss-sort="value"]'));
assert(CA.Settings.get('storeSort') === 'value' && sw().querySelector('[data-ss-sort="value"]').classList.contains('on'), 'best buy: selected (CookieMgr’s own setting)');
const order = CA.Shop.order();
assert(order.slice(0, 3).join() === 'Grandma,Farm,Cursor', `best buy: shortest payback period first (${order})`);
assert(products.style.display === 'grid' && doc.getElementById('storeBulk').style.gridRow.replace(/ /g, '') === '1/1' && rowOf('Grandma') === '2/2' && rowOf('Farm') === '3/3' && rowOf('Cursor') === '4/4', `the store's rows follow it, under the bulk selector (${['Grandma', 'Farm', 'Cursor'].map(rowOf)})`);
Game.buyMode = -1;
CA.UI.StoreBar.laySort();
assert(rowOf('Grandma') === '' && products.style.display === '', 'selling: the game’s own order');
Game.buyMode = 1;
CA.UI.StoreBar.laySort();
click(w, sw().querySelector('[data-ss-sort="achievement"]'));
assert(CA.Settings.get('storeSort') === 'achievement' && CA.Shop.order().length === Object.keys(Game.Objects).length, 'next achievement: selected, every building placed');
click(w, sw().querySelector('[data-ss-sort="default"]'));
assert(CA.Settings.get('storeSort') === 'default' && rowOf('Grandma') === '' && products.style.display === '', 'back to game order: our layout undone');
CA.UI.Menu.openPage('settings:store');
assert(doc.querySelector('[data-page="settings"] [data-key="roundUpBulk"]') && doc.querySelector('[data-page="settings"] [data-key="storeSwitch"]'), 'Settings: Store card');
assert(!/Needed for the store's building sort/.test(doc.querySelector('[data-page="settings"]').textContent), 'v3.5: Settings no longer says the sort needs Cookie Monster');

// ---- the option hides it; the store layer (CA.Store, IndexedDB) is untouched
CA.Settings.set('storeSwitch', false);
assert(!sw(), 'option off: gone');
assert(typeof CA.Store.ready === 'function' || typeof CA.Store.get === 'function' || typeof CA.Store.put === 'function', 'CA.Store is still the IndexedDB layer');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
