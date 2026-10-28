// v3.48.0: the Events page leads with the Event log; the "Income outside CpS" card moved to the
// Stats page's Cookies tab, below the charts (span chips and the live table work as before).
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w } = g;
const doc = w.document;
const CA = w.CookieMgr;
await sleep(300);

CA.EventLog.add({ type: 'golden', title: 'Lucky!', cookies: 20000 });
CA.EventLog.add({ type: 'wrinkler', title: 'Wrinkler popped', cookies: 500 });

// ---- Events: the event log first, no income card ----
CA.UI.Menu.openPage('events');
await sleep(50);
let page = doc.querySelector('#CookieMgrMenu [data-page="events"]');
const heads = [...page.querySelectorAll('.ca-card')].map((c) => (c.querySelector('.ca-card-title, h3, .ca-card-head') || c).textContent.trim());
assert(/^Event log/.test(heads[0]), `Events leads with the Event log (${heads})`);
assert(!page.querySelector('[data-ev-income]') && !page.querySelector('[data-ev-span]'), 'no income card on Events');
assert(page.querySelectorAll('[data-ev-list] .ca-ev-row').length === CA.EventLog.list().length, 'the log still lists everything');

// ---- Stats → Cookies: the income card below the charts ----
CA.UI.Menu.openPage('graphs');
click(w, doc.querySelector('[data-graph-tab="cookies"]'));
await sleep(50);
page = doc.querySelector('#CookieMgrMenu .ca-page[data-page="graphs"]');
const card = page.querySelector('[data-ev-income-card]');
assert(card, 'Income outside CpS on the Cookies tab');
const kids = [...page.children];
const lastPlot = kids.filter((c) => c.matches('[data-plot]')).pop();
assert(lastPlot && kids.indexOf(card) > kids.indexOf(lastPlot), 'below the charts');
const trs = card.querySelectorAll('[data-ev-income] tbody tr');
assert(trs.length === 9, `income table rows: 8 sources + total (${trs.length})`);
assert(/Total outside CpS/.test(card.textContent) && /\+20/.test(card.querySelector('[data-ev-income]').textContent), 'live table with the golden cookie');

click(w, card.querySelector('[data-ev-span="3600"]'));
assert(CA.Settings.get('eventSpan') === '3600', 'span chip sets the span');
assert(card.querySelector('[data-ev-span="3600"]').classList.contains('on') && !card.querySelector('[data-ev-span="session"]').classList.contains('on'), 'and lights up');

// other tabs don't carry it
click(w, doc.querySelector('[data-graph-tab="misc"]'));
await sleep(50);
assert(!doc.querySelector('#CookieMgrMenu [data-ev-income-card]'), 'only on Cookies');

done();
process.exit();
