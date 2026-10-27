// v3.12.0: the golden cookie widgets: Golden timeline / Next golden cookie / Effect timers — the Stats
// page's chart and bars at the widget's width, each part picked in its settings and saved. (v3.12.0's
// Force the Hand of Fate forecast, read from the save's seed, is gone since v3.13.0: tests/e2e/v3.13.0.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- the widgets
Game.fps = 30;
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 330, minTime: 30 * 300, maxTime: 30 * 900, spawned: 0, n: 0, spawnConditions: () => true });
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 60, maxTime: 30 * 77, multCpS: 7 } };
CA.Settings.set('widgetsShown', true);
['goldenTimeline', 'goldenNext', 'effectTimers'].forEach((t) => CA.UI.Widgets.add(t));
CA.UI.Widgets.render();
CA.UI.Widgets.tick();
const el = (t) => doc.querySelector(`#CookieMgrWidgets .ca-w-${t}`) || [...doc.querySelectorAll('#CookieMgrWidgets [data-widget]')].find((x) => x.querySelector('.ca-w-title') && x.querySelector('.ca-w-title').textContent === { goldenTimeline: 'Golden timeline', goldenNext: 'Next golden cookie', effectTimers: 'Effect timers' }[t]);
const tl = el('goldenTimeline');
assert(tl && tl.querySelector('.ca-tl-nums') && tl.querySelector('.ca-sp-chart .ca-sp-pdf rect') && tl.querySelector('.ca-sp-lane.next') && tl.querySelector('.ca-sp-lane.up'), 'Golden timeline: the numbers, the chart, the next cookie’s bar, the effect’s');
const svg = tl.querySelector('.ca-sp-chart');
assert(Number(svg.getAttribute('viewBox').split(' ')[2]) === 300 - 18 && !svg.hasAttribute('data-sp-chart'), 'its chart drawn at the widget’s width (text unstretched), no hover readout');
const d = CA.Timers.distribution('golden', 60);
assert(tl.querySelector('.ca-tl-nums').textContent.includes(CA.Format.span(d.wait.mean)), 'the expected wait: the Stats page’s (CA.Timers)');
const nx = el('goldenNext');
assert(nx && nx.querySelector('.ca-sp-cycle .ca-sp-now') && !nx.querySelector('.ca-sp-lane.up'), 'Next golden cookie: numbers and chart, no effects');
const et = el('effectTimers');
assert(et && et.querySelector('.ca-et') && !et.querySelector('.ca-sp-pdf'), 'Effect timers: the bars alone');
// parts, by its settings
const inst = CA.UI.Widgets.list().find((x) => x.type === 'goldenTimeline');
inst.stats = ['numbers'];
CA.UI.Widgets.tick();
assert(el('goldenTimeline').querySelector('.ca-tl-nums') && !el('goldenTimeline').querySelector('.ca-sp-chart'), 'settings: the numbers alone');
const saved = CA.UI.Widgets.serialize().find((x) => x.type === 'goldenTimeline');
assert(saved.stats.join() === 'numbers', 'saved with the settings');
// nothing running
Game.buffs = {};
CA.UI.Widgets.tick();
assert(/No effects running/.test(el('effectTimers').textContent), 'Effect timers with nothing running: says so');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
