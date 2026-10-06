// v2.12.0 (store toolbar since v2.17): building sort through Cookie Monster (locked without it), and
// rounding ×10 / ×100 buys up to the next multiple.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, calls } = g;
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

// ---- sort without Cookie Monster: locked, offers to load it
CA.UI.StoreBar.render();
assert(sw().querySelector('.ca-sb-sort.locked') && /needs Cookie Monster/.test(sw().querySelector('[data-ss-sort="value"]').dataset.tip), 'no Cookie Monster: locked, says why');
click(w, sw().querySelector('[data-ss-sort="value"]'));
assert(calls.loadMod.some((u) => /CookieMonster/.test(u)), 'click loads Cookie Monster');
CA.UI.Menu.openPage('settings');
assert(/Needed for the store's building sort switch/.test(doc.querySelector('[data-page="settings"]').textContent), 'Settings: what needs Cookie Monster');
assert(doc.querySelector('[data-page="settings"] [data-key="roundUpBulk"]') && doc.querySelector('[data-page="settings"] [data-key="storeSwitch"]'), 'Settings: Store card');

// ---- with Cookie Monster's settings
const cm = { SortBuildings: 0 };
Game.mods.cookieMonsterFramework = { saveData: { cookieMonsterMod: { settings: cm } } };
CA.UI.StoreBar.render();
assert(!sw().querySelector('.ca-sb-sort.locked') && sw().querySelector('[data-ss-sort="default"]').classList.contains('on'), 'unlocked; game order selected');
click(w, sw().querySelector('[data-ss-sort="value"]'));
assert(cm.SortBuildings === 2 && Game.storeRefreshed > 0 && sw().querySelector('[data-ss-sort="value"]').classList.contains('on'), 'best buy → CM sort 2 (payback for the selected bulk)');
click(w, sw().querySelector('[data-ss-sort="achievement"]'));
assert(cm.SortBuildings === 3, 'next achievement → CM sort 3');
cm.SortBuildings = 1; // set in Cookie Monster's own menu
CA.UI.StoreBar.render();
assert(sw().querySelector('[data-ss-sort="value"]').classList.contains('on'), 'CM’s own “payback of one” shows as best buy');
click(w, sw().querySelector('[data-ss-sort="default"]'));
assert(cm.SortBuildings === 0, 'back to game order');

// ---- the option hides it; the store layer (CA.Store, IndexedDB) is untouched
CA.Settings.set('storeSwitch', false);
assert(!sw(), 'option off: gone');
assert(typeof CA.Store.ready === 'function' || typeof CA.Store.get === 'function' || typeof CA.Store.put === 'function', 'CA.Store is still the IndexedDB layer');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
