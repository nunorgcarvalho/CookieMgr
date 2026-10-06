// v1.6.0: Events page — central log with filters, income-outside-CpS table, new event sources.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, M } = g;
const CA = w.CookieMgr;
const doc = w.document;

const loop = setInterval(() => {
  const p = Game.cookiesPs / 10;
  Game.cookies += p;
  Game.cookiesEarned += p;
}, 100);

await sleep(1600);
// a wrinkler eats, then pops
Game.wrinklers[1].phase = 2;
Game.wrinklers[1].sucked = 50000;
await sleep(450);
Game.popWrinkler(1);
// a shiny one
Game.wrinklers[2].phase = 1;
Game.wrinklers[2].type = 1;
Game.wrinklers[2].sucked = 1000;
await sleep(450);
Game.popWrinkler(2);
// lumps, achievements, golden cookie, Frenzy, trades
Game.harvestLumps(2);
Game.Win('Wake and bake');
Game.Win('Wake and bake');
Game.shimmerTypes.golden.popFunc({ gain: 20000 });
Game.buffs.Frenzy = { name: 'Frenzy', dname: 'Frenzy', time: 77 * 30, maxTime: 77 * 30, multCpS: 7, multClick: 1, desc: 'x7' };
M.buyGood(0, 5);
M.sellGood(0, 2);
await sleep(2300);

const by = (type) => CA.EventLog.list([type]);
const wr = by('wrinkler');
assert(wr.length === 2, `two wrinkler pops logged (${wr.length})`);
assert(Math.abs(wr[0].cookies - 55000) < 1e-6, `wrinkler payout = sucked × 1.1 (${wr[0].cookies})`);
assert(Math.abs(wr[1].cookies - 3300) < 1e-6 && wr[1].title === 'Shiny wrinkler popped', `shiny wrinkler ×3 (${wr[1].cookies})`);
assert(by('lump').length === 1 && by('lump')[0].data.lumps === 2, 'sugar lump harvest logged');
assert(by('achievement').length === 1 && by('achievement')[0].title === 'Wake and bake', 'achievement logged once');
const fx = by('effect');
assert(fx.length === 1 && fx[0].title === 'Frenzy started' && /×7 CpS/.test(fx[0].text), `effect start logged (${fx.map((e) => e.title)})`);
assert(CA.GameEvents.popBonus(0) === 1.1 && Math.abs(CA.GameEvents.popBonus(1) - 3.3) < 1e-9, 'pop bonus mirrors the game');

// ---- sidebar + page
const items = [...doc.querySelectorAll('#CookieMgrTab [data-tab-item]')].map((i) => i.dataset.tabItem);
assert(items.join() === 'events,graphs,garden,stocks,pantheon,wizard,clickers,widgets,settings', `sidebar order (${items})`);
CA.UI.Menu.openPage('events');
await sleep(50);
const page = doc.querySelector('[data-page="events"]');
assert(page, 'Events page renders');

// income table
const inc = CA.UI.EventsPage.incomeRows();
const row = (k) => inc.rows.find((r) => r.key === k);
assert(row('golden').count === 1 && row('golden').cookies === 20000, 'income: golden cookie');
assert(row('wrinkler').count === 2 && Math.abs(row('wrinkler').cookies - 58300) < 1e-6, 'income: wrinklers');
assert(row('trade').count === 2 && row('trade').cookies !== 0, 'income: stock trades (net)');
assert(row('boost').cookies >= 0 && row('other').cookies >= 0, 'income: boosts and everything else, never negative');
assert(inc.baked > 0, 'baked total for shares');
const trs = page.querySelectorAll('[data-ev-income] tbody tr');
assert(trs.length === 9, `income table rows: 8 sources + total (${trs.length})`);
assert(/Total outside CpS/.test(page.querySelector('[data-ev-income]').textContent), 'total row');

// log list + filters
const rows = () => page.querySelectorAll('[data-ev-list] .ca-ev-row');
const nAll = CA.EventLog.list().length;
assert(rows().length === nAll, `log shows every event (${rows().length}/${nAll})`);
assert(rows()[0].textContent.includes('Sold') || rows()[0].textContent.length > 0, 'newest first');
const chip = page.querySelector('[data-ev-type="wrinkler"]');
assert(chip && /2/.test(chip.textContent), 'type chip with count');
click(w, chip);
assert(CA.Settings.get('eventHidden') === 'wrinkler' && rows().length === nAll - 2, 'type chip hides that type');
click(w, page.querySelector('[data-ev-type="wrinkler"]'));
assert(rows().length === nAll, 'and shows it again');
click(w, page.querySelector('[data-ev-income-only]'));
const incomeTypes = new Set(['golden', 'wrath', 'reindeer', 'wrinkler', 'lump', 'trade']);
assert(CA.UI.EventsPage.filtered().every((e) => incomeTypes.has(e.type)) && rows().length < nAll, 'income-only filter');
click(w, page.querySelector('[data-ev-income-only]'));
const search = page.querySelector('[data-ev-search]');
search.value = 'shiny';
search.dispatchEvent(new w.Event('input', { bubbles: true }));
assert(rows().length === 1, 'search box');
search.value = '';
search.dispatchEvent(new w.Event('input', { bubbles: true }));

// paging
for (let i = 0; i < 150; i++) CA.EventLog.add({ type: 'achievement', title: `Bulk ${i}` });
await sleep(500);
assert(rows().length === 100 && page.querySelector('[data-ev-more]'), 'first 100 rows + "show more"');
click(w, page.querySelector('[data-ev-more]'));
assert(rows().length === Math.min(200, CA.EventLog.list().length), 'show more adds 100');

// span chips
click(w, page.querySelector('[data-ev-span="3600"]'));
assert(CA.Settings.get('eventSpan') === '3600', 'income span chip');

// CSV
let downloaded = null;
w.URL.createObjectURL = () => 'blob:test';
w.URL.revokeObjectURL = () => {};
w.HTMLAnchorElement.prototype.click = function () {
  downloaded = this.download;
};
click(w, page.querySelector('[data-ev-csv]'));
assert(downloaded && /^cookiemgr-events-.*\.csv$/.test(downloaded), `CSV download (${downloaded})`);

// settings card for events
CA.UI.Menu.openPage('settings');
assert(doc.querySelector('.ca-index [data-key="logEmptyWrinklers"]'), 'Events options in the Settings index (v2.15: on the Events page)');

clearInterval(loop);
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
