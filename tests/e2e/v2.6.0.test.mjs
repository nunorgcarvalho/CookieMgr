// v2.6.0: the ledger (7 categories, boosts), mega Actual CpS + Cookie bank (integration),
// signed log, shared settings, resizable widgets with CSS positioning, sidebar order.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, M } = g;
const CA = w.CookieMgr;
const doc = w.document;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// ---- sidebar order
await sleep(400);
const items = [...doc.querySelectorAll('#CookieMgrTab [data-tab-item]')].map((i) => i.dataset.tabItem);
assert(items.join() === 'events,graphs,garden,stocks,pantheon,wizard,clickers,widgets,settings', `sidebar: Events on top, Macros above Widgets (${items})`);

// ---- a busy game: production, clicks, a Frenzy + Click frenzy, drops, trades, buildings, upgrades, wrinklers
Game.cookies = 1e7;
const loop = setInterval(() => {
  const p = Game.cookiesPs / 10;
  Game.cookies += p;
  Game.cookiesEarned += p;
  Game.ClickCookie();
}, 100);
await sleep(1600);
Game.buffs.Frenzy = { name: 'Frenzy', time: 3000, maxTime: 3000, multCpS: 7, icon: [10, 14] };
Game.buffs['Click frenzy'] = { name: 'Click frenzy', time: 3000, maxTime: 3000, multClick: 777, icon: [0, 1] };
Game.cookiesPs = 7000;
await sleep(1100);
Game.shimmerTypes.golden.popFunc({ gain: 5000 }); // Lucky!
Game.shimmerTypes.golden.popFunc({ gain: -2000, wrath: 1 }); // Ruin
M.buyGood(0, 10);
M.sellGood(0, 4);
Game.Objects.Cursor.buy(5);
Game.Objects.Cursor.sell(2);
Game.UpgradesByName['Reinforced index finger'].buy();
Game.wrinklers[0].phase = 1;
Game.wrinklers[0].sucked = 3000;
await sleep(450);
Game.popWrinkler(0);
await sleep(1100);
delete Game.buffs.Frenzy;
delete Game.buffs['Click frenzy'];
Game.cookiesPs = 1000;
await sleep(1100);

// ---- events for purchases
const ev = (t) => CA.EventLog.list([t]);
assert(ev('building').length === 2 && ev('building')[0].title === 'Bought 5 Cursors' && ev('building')[0].cookies === -75, `building buys/sells logged (${ev('building').map((e) => e.title)})`);
assert(ev('building')[1].cookies > 0 && /Sold 2 Cursors/.test(ev('building')[1].title), 'sale logged with its refund');
assert(ev('upgrade').length === 1 && ev('upgrade')[0].cookies === -1000, 'upgrade purchase logged');

// ---- the ledger adds up to exactly what the bank did, every second
const frames = CA.Recorder.frames();
const K = CA.GameStates.LEDGER_KEYS;
const id = CA.GameStates.ledgerId;
let checked = 0;
let worst = 0;
for (let i = 1; i < frames.length; i++) {
  const f = frames[i];
  if (!Number.isFinite(f.lBuild)) continue;
  const inn = ['build', 'buildBoost', 'click', 'clickBoost', 'dropsIn', 'dropsBoost', 'stocksIn', 'bldIn', 'otherIn'].reduce((n, k) => n + f[id(k)], 0);
  const out = ['dropsOut', 'stocksOut', 'bldOut', 'upgOut', 'otherOut'].reduce((n, k) => n + f[id(k)], 0);
  const bank = f.cookies - frames[i - 1].cookies;
  worst = Math.max(worst, Math.abs(inn - out - bank) / Math.max(1, Math.abs(bank)));
  checked++;
}
assert(checked >= 4 && worst < 1e-9, `every second: categories in − out = bank change (${checked} frames, worst ${worst})`);
const total = (k) => frames.reduce((n, f) => n + (f[id(k)] || 0), 0);
assert(total('buildBoost') > 0 && total('clickBoost') > 0, 'CpS boost split out for building CpS and clicking');
assert(near(total('dropsIn') + total('dropsBoost'), 5000) && near(total('dropsOut'), 2000), `drops in/out (${total('dropsIn')} / ${total('dropsOut')})`);
assert(total('stocksOut') > 0 && total('stocksIn') > 0, 'stocks bought / sold');
assert(near(total('bldOut'), 75) && total('bldIn') > 0, 'buildings bought / sold');
assert(near(total('upgOut'), 1000), 'upgrades');
assert(total('otherIn') >= 3300 - 1e-6, `wrinkler payout lands in Other (${total('otherIn')})`);
assert(K.length === 16, 'ledger keys');

// ---- mega Actual CpS
CA.Settings.set('plot.actual.win', 60);
CA.Settings.set('plot.actual.smooth', 0);
CA.UI.Menu.openPage('graphs');
click(w, doc.querySelector('[data-graph-tab="cookies"]'));
const plots = [...doc.querySelectorAll('[data-plot]')].map((p) => p.dataset.plot);
assert(plots.join() === 'cps,actual,ledgerCum', `Cookies tab: CpS, Actual CpS, Cookie bank (${plots})`);
const card = doc.querySelector('[data-plot="actual"]');
assert(card.querySelectorAll('[data-plot-toggle^="cat."]').length === 8, 'eight category chips (stock equity added in v2.7)');
const act = () => CA.UI.Plot.get('actual').last().data;
const keys = () => act().series.filter((x) => x.type === 'bar').map((x) => x.key);
assert(keys().join() === 'build,buildBoost,click,clickBoost,drops,dropsBoost,stocks,buildings,other', `gains by default, with CpS boosts (${keys()})`);
click(w, card.querySelector('[data-plot-toggle="actualLosses"]'));
assert(keys().includes('upgradesOut') && keys().includes('buildingsOut') && keys().includes('dropsOut'), 'losses add the out parts');
assert(act().bars.some((b) => b.parts.upgradesOut < 0), 'losses drawn below zero');
click(w, card.querySelector('[data-plot-toggle="cpsBoosted"]'));
assert(!keys().some((k) => /Boost/.test(k)), 'CpS-boosted off: unboosted only');
click(w, card.querySelector('[data-plot-toggle="cpsBoosted"]'));
click(w, card.querySelector('[data-plot-toggle="cat.upgrades"]'));
assert(!keys().includes('upgradesOut'), 'category chip removes it');
click(w, card.querySelector('[data-plot-toggle="cat.upgrades"]'));
const table = card.querySelector('.ca-stages');
assert(/Building CpS \(raw · boosted\)/.test(table.textContent) && /Upgrades \(−bought\)/.test(table.textContent) && /Net/.test(table.textContent), 'table follows the chips');
// the axis snaps when a side is hidden
assert(CA.UI.Plot.get("actual").last().scale.yMin < 0, "losses shown: axis goes below zero");
click(w, card.querySelector("[data-plot-toggle=\"actualLosses\"]"));
assert(CA.UI.Plot.get("actual").last().scale.yMin === 0, "losses hidden: axis snaps back to zero");
click(w, card.querySelector("[data-plot-toggle=\"actualLosses\"]"));
// signed log (engine): a log chart with values below zero
{
  const pl = CA.UI.Plot.create({ id: 'probeSym', title: 'p', windows: [60], log: true, build: (v) => ({ series: [{ key: 'a', name: 'a', color: '#fff', type: 'bar' }], bars: [{ x0: v.x1 - 2000, x1: v.x1 - 1000, parts: { a: 500 } }, { x0: v.x1 - 1000, x1: v.x1, parts: { a: -300 } }] }) });
  CA.Settings.set('plot.probeSym.log', true);
  const host = doc.createElement('div');
  host.innerHTML = pl.html();
  doc.body.appendChild(host);
  pl.mount(host);
  pl.tick();
  const sc = pl.last().scale;
  assert(sc.log && sc.symlog && sc.yMin < 0 && sc.ticks.includes(0), `log with losses → signed log axis (${sc.yMin}, ${sc.yMax})`);
  pl.unmount();
  host.remove();
}
// effect icons in lanes
assert(act().intervals.some((iv) => iv.icon && iv.icon[0] === 10), 'effect lanes carry the effect icon');

// ---- Cookie bank: same settings, and it integrates back to the bank
const cum = () => CA.UI.Plot.get('ledgerCum').last();
const bankCard = doc.querySelector('[data-plot="ledgerCum"]');
assert(cum().v.W === 60000, 'shares the window');
click(w, bankCard.querySelector('[data-plot-toggle="cat.other"]'));
assert(!CA.Settings.get('cat.other') && !keys().includes('other'), 'a chip on the bank chart changes Actual CpS too');
click(w, bankCard.querySelector('[data-plot-toggle="cat.other"]'));
click(w, bankCard.querySelector('[data-plot-set="plot.actual.from"][data-val="window"]'));
CA.UI.Graphs.tick();
const d = cum().data;
const last = d.bars0[d.bars0.length - 1];
const net = Object.values(last.parts).reduce((n, y) => n + y, 0);
const actual = d.lines.bank[d.lines.bank.length - 1].v;
assert(near(net, actual, 1e-6), `all categories, gains + losses: the added-up chart = the real bank change (${Math.round(net)} vs ${Math.round(actual)})`);
assert(/Bank now/.test(bankCard.querySelector('[data-plot-stats]').textContent), 'bank tiles');

// ---- widgets: CSS positioning, resizing
CA.Macros.setFav('golden', true);
CA.UI.Widgets.add('stats');
const btn = () => doc.querySelector('#CookieMgrWidgets .ca-w-macro');
assert(/%$/.test(btn().style.left) && /translate\(/.test(btn().style.transform), 'positioned with CSS percentages (follows the panel, no re-placing)');
const left = doc.getElementById('sectionLeft');
Object.defineProperty(left, 'clientWidth', { get: () => 600, configurable: true });
Object.defineProperty(left, 'clientHeight', { get: () => 900, configurable: true });
const P = w.HTMLElement.prototype;
Object.defineProperty(P, 'offsetWidth', { get() { return this.classList && this.classList.contains('ca-w') ? (this.classList.contains('ca-w-bare') ? 40 : parseFloat(this.style.width) || 190) : 0; }, configurable: true });
Object.defineProperty(P, 'offsetHeight', { get() { return this.classList && this.classList.contains('ca-w') ? (this.classList.contains('ca-w-bare') ? 40 : parseFloat(this.style.height) || 120) : 0; }, configurable: true });
const before = btn().style.left;
w.dispatchEvent(new w.Event('resize'));
assert(btn().style.left === before, 'a window resize doesn’t re-place widgets (no bounce)');
const inst = () => CA.UI.Widgets.list().find((x) => x.type === 'macro');
const grip = btn().querySelector('[data-w-resize]');
grip.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 100, clientY: 100 }));
w.dispatchEvent(new w.MouseEvent('mousemove', { clientX: 140, clientY: 110 }));
w.dispatchEvent(new w.MouseEvent('mouseup', {}));
assert(Math.abs(inst().scale - 2) < 1e-9 && /scale\(2\)/.test(btn().style.transform), `button scales from the corner, keeping its shape (${inst().scale})`);
assert(!CA.Macros.isOn('golden'), 'resizing isn’t a click');
const stats = () => CA.UI.Widgets.list().find((x) => x.type === 'stats');
const statsEl = () => doc.querySelector(`[data-widget="${stats().id}"]`);
statsEl().querySelector('[data-w-resize]').dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 300, clientY: 300 }));
w.dispatchEvent(new w.MouseEvent('mousemove', { clientX: 380, clientY: 330 }));
w.dispatchEvent(new w.MouseEvent('mouseup', {}));
assert(stats().w === 270 && stats().h === 150 && statsEl().classList.contains('sized'), `framed box: free width and height (${stats().w}×${stats().h})`);
Game.WriteSave();
const saved = JSON.parse(Game.modSaveData.CookieMgr).widgets;
assert(saved.some((x) => x.type === 'macro' && x.scale === 2) && saved.some((x) => x.type === 'stats' && x.w === 270 && x.h === 150), 'sizes saved');

clearInterval(loop);
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
