// v1.4.0: the data backbone — IndexedDB store, states, recorder, event log.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, waitFor, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const browser = { factory: new IDBFactory(), IDBKeyRange };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// a fake game loop: production via Earn, plus some clicking
function runGame(Game, ms = 100) {
  return setInterval(() => {
    const p = (Game.cookiesPs * ms) / 1000;
    Game.cookies += p;
    Game.cookiesEarned += p;
    Game.handmadeCookies += 5;
    Game.cookies += 5;
    Game.cookiesEarned += 5;
  }, ms);
}

// ---------------------------------------------------------------- first session
const legacyStocks = JSON.stringify({ holdings: { 0: { shares: 5, avgCost: 8, realized: 2 } }, priceHistory: { 0: [{ t: 1, v: 1 }] } });
const a = boot({ idb: browser, localStorageSeed: { 'CookieMgr.history.v1': '{"samples":[]}', 'CookieMgr.stocks.v1': legacyStocks } });
const CA = a.window.CookieMgr;
a.goods[0].stock = 5; // matches the migrated holdings
const loop = runGame(a.Game);
await sleep(1500);

assert(!a.window.localStorage.getItem('CookieMgr.history.v1'), 'legacy history key removed from localStorage');
assert(!a.window.localStorage.getItem('CookieMgr.stocks.v1'), 'legacy stocks key removed from localStorage');
const row0 = CA.Stocks.portfolioNow().rows[0];
assert(row0.shares === 5 && row0.avgCost === 8 && row0.realized === 2, 'legacy holdings migrated to IndexedDB');

// golden pop + trades
a.Game.shimmerTypes.golden.popFunc({ gain: 5000 });
a.M.buyGood(1, 3);
a.M.sellGood(1, 1);
await sleep(2600);

const frames = CA.Recorder.frames();
assert(frames.length >= 3, `frames recorded (${frames.length})`);
const f = frames[frames.length - 1];
['cps', 'base', 'click', 'cookies', 'baked', 'prestigeTotal', 'price:0', 'portfolioValue', 'portfolioCost', 'magic', 'earned'].forEach((k) =>
  assert(Number.isFinite(f[k]), `frame has ${k}`)
);
assert(f.a > 0 && f.dt > 0, 'frame has active time and dt');

// flow attribution: parts add up; golden payout attributed to golden
let sum = { earned: 0, earnProduction: 0, earnClick: 0, earnGolden: 0, earnOther: 0 };
frames.forEach((fr) => Object.keys(sum).forEach((k) => (sum[k] += fr[k] || 0)));
const parts = sum.earnProduction + sum.earnClick + sum.earnGolden + sum.earnOther;
assert(near(parts, sum.earned), `earning sources add up to baked (${parts} vs ${sum.earned})`);
assert(near(sum.earnGolden, 5000), `golden payout attributed to golden (${sum.earnGolden})`);
assert(sum.earnClick > 0 && frames.some((fr) => fr.click > 0), 'clicking attributed');
assert(sum.earnProduction > 0, 'production attributed');
const bakedDelta = frames[frames.length - 1].baked - frames[0].baked;
assert(near(sum.earned - (frames[0].earned || 0), bakedDelta, 1e-9), 'earned flow matches the baked counter');

// events
const golden = CA.EventLog.list(['golden']);
assert(golden.length === 1 && golden[0].cookies === 5000, 'golden pop logged with its payout');
assert(CA.History.events.length === 1, 'History.events exposes markers from the event log');
const trades = CA.EventLog.list(['trade']);
assert(trades.length === 2 && trades[0].cookies < 0 && trades[1].cookies > 0, 'trades logged with signed cookies');
assert(trades[0].title === 'Bought 3 Chocolate' && /^@ \$15/.test(trades[0].text), `trade title/text (${trades[0].title} ${trades[0].text})`);
const sl = CA.StockLog.list();
assert(sl.length === 2 && sl[0].kind === 'buy' && sl[0].shares === 3 && sl[0].cookies > 0, 'StockLog.list flat shape, unsigned cookies');
assert(CA.StockLog.list() === sl, 'StockLog.list cached until the log changes');

// recorder series
const ps = CA.Recorder.series('price:0');
assert(ps.length === frames.length && ps[0].v === 10, 'Recorder.series gives points per frame');
assert(CA.Recorder.series('price:0') === ps, 'series cached for the same revision');

// UI: stock + graphs + settings pages render with recorder data
CA.UI.Menu.openPage('stocks');
CA.UI.Menu.render();
await sleep(1100);
CA.Settings.set('stockGraphMode', 'perStock');
await sleep(300);
CA.UI.Menu.openPage('graphs');
await sleep(1100);
CA.UI.Menu.openPage('settings');
const doc = a.window.document;
const info = doc.querySelector('[data-ca-history-info]');
assert(info && /active play/.test(info.textContent), `history info shown (${info && info.textContent})`);
assert(doc.querySelector('[data-ca="hexport"]') && doc.querySelector('[data-ca="himport"]'), 'export/import buttons');

// ---------------------------------------------------------------- persistence across reloads
const before = { frames: CA.Recorder.frames().length, events: CA.EventLog.list().length, active: CA.Recorder.activeNow(), buffsKV: null };
clearInterval(loop);
a.window.dispatchEvent(new a.window.Event('pagehide'));
await sleep(300);
a.window.close();

const b = boot({ idb: browser });
const CB = b.window.CookieMgr;
b.goods[0].stock = 5;
b.goods[1].stock = 2;
await waitFor(() => CB.Recorder.isReady() && CB.Recorder.frames().length >= before.frames && CB.EventLog.list().length === before.events && CB.StockLog.list().length === 2);
assert(CB.Recorder.isReady(), 'recorder loaded');
assert(CB.Recorder.frames().length >= before.frames, `frames survive a reload (${CB.Recorder.frames().length} >= ${before.frames})`);
assert(CB.EventLog.list().length === before.events, `events survive a reload (${CB.EventLog.list().length})`);
assert(CB.Recorder.activeNow() >= before.active, 'active time continues');
assert(CB.StockLog.list().length === 2, 'trade log survives');
const r0 = CB.Stocks.portfolioNow().rows[0];
assert(r0.shares === 5 && r0.avgCost === 8, 'holdings survive from IndexedDB (localStorage now empty)');
assert(b.window.localStorage.length === 0, `nothing written to localStorage (${b.window.localStorage.length} keys)`);

// export
const exported = await CB.Recorder.exportData();
assert(exported.format === 'cookiemgr-history' && exported.chunks.length && exported.events.length === 3, 'exportData has chunks and events');

// Clear needs two clicks
CB.UI.Menu.openPage('settings');
const clr = b.window.document.querySelector('[data-ca="gclear"]');
click(b.window, clr);
await sleep(50);
assert(CB.Recorder.frames().length > 0 && clr.classList.contains('ca-armed'), 'first Clear click only arms');
click(b.window, clr);
await sleep(300);
assert(CB.Recorder.frames().length <= 1 && CB.EventLog.list().length === 0, 'second Clear click erases history');
b.window.close();

// ---------------------------------------------------------------- another save in the same browser
const c = boot({ idb: browser, fullDate: 1600000000000 });
const CC = c.window.CookieMgr;
await sleep(300);
assert(CC.Recorder.frames().length === 0 && CC.EventLog.list().length === 0, 'a different save starts with its own empty history');
const imported = await CC.Recorder.importData(exported);
await sleep(100);
assert(imported.chunks === exported.chunks.length && CC.Recorder.frames().length >= before.frames, 'import brings the frames over');
assert(CC.EventLog.list(['trade']).length === 2, 'import brings the events over');
assert(CC.Recorder.frames().every((fr) => fr.t > 0) && CC.EventLog.list().every((e) => e.s === '1600000000000'), 'imported records re-keyed to this save');
let threw = false;
await CC.Recorder.importData({ nope: 1 }).catch(() => (threw = true));
assert(threw, 'import rejects non-exports');

// ---------------------------------------------------------------- tiers
const M = CC.Recorder._merge;
const merged = M([
  { t: 1, a: 1000, dt: 1, cps: 10, baked: 100, earned: 5 },
  { t: 2, a: 2000, dt: 3, cps: 30, baked: 200, earned: 7 },
]);
assert(merged.cps === 25 && merged.baked === 200 && merged.earned === 12 && merged.dt === 4 && merged.t === 2, 'merge: gauge dt-weighted mean, counter last, flow sum');

// 4 hours of 1 s frames → oldest hour should compact into 15 s frames
const s = '1600000000000';
const chunks = [];
for (let k = 0; k < 24; k++) {
  const fr = [];
  for (let i = 0; i < 600; i++) {
    const n = k * 600 + i + 1;
    fr.push({ t: 1e12 + n * 1000, a: n * 1000, dt: 1, cps: 100, baked: n * 100, earned: 100 });
  }
  chunks.push({ id: `x|0|${k}`, s, tier: 0, start: fr[0].a, frames: fr });
}
await CC.Recorder.importData({ format: 'cookiemgr-history', version: 1, chunks, events: [], kv: [] });
const sum2 = CC.Recorder.summary();
assert(sum2.perTier[0].frames < 14400 && sum2.perTier[1].frames > 0, `old frames compacted (${sum2.perTier.map((t) => t.frames).join('/')})`);
const all = CC.Recorder.frames();
let ok = true;
for (let i = 1; i < all.length; i++) if (all[i].t <= all[i - 1].t) ok = false;
assert(ok, 'frames stay in time order across tiers');
const earnedTotal = all.reduce((x, fr) => x + (fr.earned || 0), 0);
assert(near(earnedTotal, 14400 * 100), `flows conserved through compaction (${earnedTotal})`);
assert(all[1].dt === 15 && all[0].dt <= 15 && all[1].cps === 100 && all[1].t - all[0].t === 15000, 'compacted frames cover 15 s buckets');
c.window.close();

// ---------------------------------------------------------------- no IndexedDB at all
const d = boot();
await sleep(1500);
assert(d.window.CookieMgr.Recorder.frames().length >= 1, 'records in memory even without IndexedDB');
d.window.close();

[a, b, c, d].forEach((x, i) => assert(x.errors.length === 0, `no runtime errors in session ${i + 1}` + (x.errors.length ? `: ${x.errors[0]}` : '')));
done();
process.exit();
