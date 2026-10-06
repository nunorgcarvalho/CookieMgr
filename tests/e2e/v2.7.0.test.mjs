// v2.7.0: boosted drops, stock equity, merged table rows, % of total, log only on line charts,
// new quick stats, CpS shown for effect pops.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, M, goods } = g;
const CA = w.CookieMgr;
const doc = w.document;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
Game.cookies = 1e8;
Game.startDate = Date.now() - 3 * 3600 * 1000;
Game.UpgradesOwned = 12;
Game.AchievementsOwned = 34;

const loop = setInterval(() => {
  const p = Game.cookiesPs / 10;
  Game.cookies += p;
  Game.cookiesEarned += p;
}, 100);
await sleep(1500);

// ---- boosted drops
Game.buffs.Frenzy = { name: 'Frenzy', time: 3000, maxTime: 3000, multCpS: 7 };
Game.cookiesPs = 7000; // unbuffedCps stays 1000
Game.shimmerTypes.golden.popFunc({ gain: 7000 }); // CpS-limited payout (tiny vs the bank)
const lucky = CA.EventLog.list(['golden']).pop();
assert(near(lucky.data.boost, 6000), `drop under a ×7 CpS effect: 6/7 of it is boost (${lucky.data.boost})`);
const bank = Game.cookies;
Game.shimmerTypes.golden.popFunc({ gain: 0.15 * bank + 13 }); // bank-capped Lucky!
assert(CA.EventLog.list(['golden']).pop().data.boost === 0, 'bank-capped Lucky!: no boost');
delete Game.buffs.Frenzy;
Game.cookiesPs = 1000;
// an effect pop: shows the CpS it adds
Game.shimmerTypes.golden.popFunc({ gain: 0, buff: { name: 'Frenzy', time: 3000, maxTime: 3000, multCpS: 7 } });
const fx = CA.EventLog.list(['golden']).pop();
assert(fx.data.cpsGain === 6000, `effect pop records the CpS it adds (${fx.data.cpsGain})`);
delete Game.buffs.Frenzy;

// ---- stock equity
M.buyGood(0, 10);
await sleep(1300);
goods[0].val *= 1.5; // prices move
await sleep(1100);
M.sellGood(0, 10);
await sleep(1300);
const frames = CA.Recorder.frames();
const id = CA.GameStates.ledgerId;
const sum = (k) => frames.reduce((n, f) => n + (f[id(k)] || 0), 0);
assert(near(sum('dropsBoost'), 6000) && sum('dropsIn') > 1000, `ledger: drops split raw / boost (${sum('dropsIn')} / ${sum('dropsBoost')})`);
// per frame: the purchase, the price move, the sale
const buyF = frames.find((f) => (f[id('stocksOut')] || 0) > 0);
assert(buyF && near(buyF[id('equityUp')], buyF[id('stocksOut')] / 1.2, 1e-9), `buy: equity up = cookies paid minus the 20% broker overhead (${buyF && Math.round(buyF[id('equityUp')])} vs ${buyF && Math.round(buyF[id('stocksOut')])})`);
const moveF = frames.find((f) => (f[id('equityUp')] || 0) > 0 && !f[id('stocksOut')] && !f[id('stocksIn')]);
assert(moveF && near(moveF[id('equityUp')], buyF[id('equityUp')] * 0.5, 1e-9), 'price +50%: equity up by half its value, no trade');
const sellF = frames.find((f) => (f[id('stocksIn')] || 0) > 0);
assert(sellF && near(sellF[id('equityDown')], sellF[id('stocksIn')], 1e-9), 'sale: equity down exactly what the bank received');
let worst = 0;
for (let i = 1; i < frames.length; i++) {
  const f = frames[i];
  if (!Number.isFinite(f.lBuild)) continue;
  const inn = ['build', 'buildBoost', 'click', 'clickBoost', 'dropsIn', 'dropsBoost', 'stocksIn', 'bldIn', 'otherIn'].reduce((n, k) => n + f[id(k)], 0);
  const out = ['dropsOut', 'stocksOut', 'bldOut', 'upgOut', 'otherOut'].reduce((n, k) => n + f[id(k)], 0);
  worst = Math.max(worst, Math.abs(inn - out - (f.cookies - frames[i - 1].cookies)) / Math.max(1, Math.abs(f.cookies)));
}
assert(worst < 1e-9, `bank still balances to the cookie with the new splits (${worst})`);

// ---- Actual CpS: table, % of total, categories
CA.Settings.set('plot.actual.win', 60);
CA.Settings.set('plot.actual.smooth', 0);
CA.Settings.set('actualLosses', true);
CA.UI.Menu.openPage('graphs');
click(w, doc.querySelector('[data-graph-tab="cookies"]'));
CA.UI.Graphs.tick();
const card = doc.querySelector('[data-plot="actual"]');
const labels = [...card.querySelectorAll('.ca-stages tbody tr td:first-child')].map((td) => td.textContent.trim());
assert(labels.includes('Building CpS (raw · boosted)') && labels.includes('Drops (−lost · raw · boosted)') && labels.includes('Stock trades (−bought · +sold)') && labels.includes('Upgrades (−bought)'), `one row per category (${labels.join(' | ')})`);
assert([...card.querySelectorAll('.ca-stages tr.thin')].length >= 3 && !card.querySelector('.ca-stages tr.thin .ca-row-sub'), 'In / Out / Net are thin rows without subtitles');
assert(!card.querySelector('[data-plot-toggle="cat.equity"].on') && card.querySelector('[data-plot-toggle="cat.equity"]'), 'Stock equity category, off by default');
assert(!card.querySelector('[data-plot-toggle="plot.actual.log"]') && card.querySelector('[data-plot-toggle="plot.actual.prop"]'), 'stacked chart: % of total, no log toggle');
click(w, card.querySelector('[data-plot-toggle="plot.actual.prop"]'));
const d = CA.UI.Plot.get('actual').last();
assert(d.data.bars.filter((b) => Object.values(b.parts).some((v) => v)).every((b) => near(Object.values(b.parts).reduce((n, v) => n + Math.abs(v), 0), 1, 1e-9)), '% of total: each bar adds up to 100%');
assert(d.data.series.every((x) => x.type === 'bar') && d.scale.yMax <= 1.5 && d.scale.yMin >= -1.5, `no lines, axis in shares (${d.scale.yMin}..${d.scale.yMax})`);
assert(doc.querySelector('[data-plot="ledgerCum"] [data-plot-toggle="plot.actual.prop"].on'), 'shared with the Cookie bank chart');
click(w, card.querySelector('[data-plot-toggle="plot.actual.prop"]'));
assert(!doc.querySelector('[data-plot="cps"] [data-plot-toggle="plot.cps.log"]') && doc.querySelector('[data-plot="cps"] [data-plot-toggle="plot.cps.prop"]'), 'CpS chart: % of total, no log');
click(w, doc.querySelector('[data-graph-tab="prestige"]'));
assert(doc.querySelector('[data-plot="prestige"] [data-plot-toggle="plot.prestige.log"]'), 'prestige (lines): log toggle');
CA.UI.Menu.openPage('stocks');
assert(doc.querySelector('[data-plot="stocks"] [data-plot-toggle="plot.stocks.log"]') && !doc.querySelector('[data-plot="stockperf"] [data-plot-toggle$=".log"]'), 'stock lines: log; performance bars: none');
CA.UI.StockGraph.tick();
assert(/Equity/.test(doc.querySelector('[data-plot="stocks"] [data-plot-stats]').textContent), 'portfolio tiles show equity in cookies');

// ---- Events page: trades one row; effect pops show CpS
CA.UI.Menu.openPage('events');
const tradeRow = [...doc.querySelectorAll('[data-ev-income] tbody tr')].find((tr) => /Stock trades/.test(tr.textContent));
assert(/−bought · \+sold/.test(tradeRow.textContent) && tradeRow.querySelector('span.neg') && tradeRow.querySelector('span.pos'), 'income table: stock trades as −bought · +sold');
assert([...doc.querySelectorAll('[data-ev-list] .ca-ev-cookies')].some((el) => /\+6,?000\/s CpS|\+6K\/s CpS|\/s CpS/.test(el.textContent)), 'effect pop shows its CpS gain in the log');

// ---- quick stats
CA.UI.Widgets.add('stats');
CA.UI.Widgets.tick();
const st = doc.querySelector('#CookieMgrWidgets .ca-w:not(.ca-w-bare) [data-w-body]').textContent;
['CpS + clicking', 'Actual CpS', 'Run started', 'Upgrades', 'Prestige level', 'Achievements', 'All time baked'].forEach((l) => assert(st.includes(l), `quick stats: ${l}`));
assert(/3h 00m ago/.test(st) && /12/.test(st) && /34/.test(st) && /max/.test(st), `quick stats values (${st})`);

clearInterval(loop);
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
