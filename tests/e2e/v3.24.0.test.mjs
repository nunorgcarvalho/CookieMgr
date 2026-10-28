// v3.24.0: ☆ stars that put a ready-made widget on the left panel — the Garden page's two charts
// (a Chart widget: a live copy of the chart) and the Stats page's golden cookie frequency (a Golden
// cookie frequency widget); a second click takes it away, and every star follows the widgets.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const GM = makeGarden(Game);
await sleep(400);
const W = CA.UI.Widgets;
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

// some garden history for the charts
const H = CA.GardenHistory;
GM.plot[2][1] = [1, 5];
H.sample();
for (let i = 0; i < 4; i++) {
  await sleep(20);
  GM.nextStep += GM.stepT * 1000;
  H.sample();
}

// ---- the Garden page: a ☆ on each chart
CA.UI.Menu.openPage('garden');
await sleep(50);
const star = (plot) => doc.querySelector(`[data-plot="${plot}"] .ca-card-head [data-w-star]`);
assert(star('garden') && star('gardenEffects'), 'Growth and Effects each have a ☆');
assert(!star('garden').classList.contains('on') && /Garden growth/.test(star('garden').dataset.tip), '…empty to start, its tip naming the widget');
W.list().forEach((x) => W.remove(x.id));
click(w, star('garden'));
const chart = () => W.list().find((x) => x.type === 'chart');
assert(chart() && chart().plot === 'garden', 'clicking it adds a Chart widget showing the Growth chart');
assert(doc.getElementsByClassName('ca-wstar on').length === 1 && star('garden').classList.contains('on'), '…and fills that star (only that one)');
assert(CA.Settings.get('widgetsShown'), '…widgets shown');

// the widget: the chart's own canvas and legend, drawn by the chart's copy
const el = () => doc.querySelector(`#CookieMgrWidgets [data-widget="${chart().id}"]`);
assert(el() && el().querySelector('.ca-w-title').textContent === 'Garden growth', 'the widget is titled Garden growth');
const mini = CA.UI.Plot.get(`garden~${chart().id}`);
assert(mini && mini.isMounted(), 'a copy of the chart is mounted in the widget');
const canvas = el().querySelector('canvas[data-plot-canvas]');
assert(canvas && !el().querySelector('.ca-toolbar'), '…just the canvas, no toolbar');
W.tick();
assert(el().querySelector('canvas[data-plot-canvas]') === canvas, 'a refresh keeps the same canvas (data-keep)');
W.render();
await sleep(10);
W.tick();
assert(mini.isMounted() && el().contains(doc.querySelector(`[data-plot="garden~${chart().id}"]`)), 'a full re-render mounts it again');

// the same window as the page's chart: they share the settings
CA.Settings.set('plot.garden.axis', 'ticks');
mini.tick();
assert(mini.layout() && mini.layout().v.custom, 'the copy follows the page chart’s X axis choice');
CA.Settings.set('plot.garden.axis', 'time');

// the widget's settings: which chart
const opts = W.types().find((t) => t.id === 'chart').settings[0].options().map((o) => o.v);
assert(opts.includes('garden') && opts.includes('gardenEffects'), 'its settings offer the Garden’s two charts');

// saved and loaded
const saved = W.serialize().find((x) => x.type === 'chart');
eq(saved.plot, 'garden', 'the chart it shows is saved');

// a second click takes it away (and lets go of the copy)
click(w, star('garden'));
assert(!chart() && !star('garden').classList.contains('on'), 'clicking the full star takes it away');
assert(!CA.UI.Plot.get(`garden~${saved.id}`), '…and its chart copy');
click(w, star('gardenEffects'));
assert(chart() && chart().plot === 'gardenEffects' && el().querySelector('.ca-w-title').textContent === 'Garden effects', 'the Effects ☆ adds the Effects chart');

// ---- golden cookie frequency
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 40, minTime: 30 * 30, maxTime: 30 * 120, spawned: 0, n: 0, spawnConditions: () => true });
Game.Has = (n) => n === 'Lucky day' || n === 'Serendipity';
CA.UI.Menu.openPage('stats');
await sleep(50);
const fstar = () => doc.querySelector('[data-st-spawn] .ca-sp-factors [data-w-star]');
assert(fstar(), 'the golden cookie frequency row has a ☆');
click(w, fstar());
const fInst = () => W.list().find((x) => x.type === 'goldenCookies');
assert(fInst() && fInst().stats.join() === 'numbers,helping' && fInst().nums.join() === 'frequency,every', 'clicking it adds the Golden cookie frequency widget (since v3.39.0 a Golden cookies widget: the multiplier, the frequency, what’s helping)');
W.tick();
const fw = () => doc.querySelector(`#CookieMgrWidgets [data-widget="${fInst().id}"]`);
const mult = () => [...fw().querySelectorAll('.ca-tl-nums span')].find((s) => s.querySelector('em').textContent === 'multiplier').querySelector('b').textContent;
eq(mult(), '×4', 'Lucky day and Serendipity: four times as often');
eq(fw().querySelectorAll('.ca-wfq-row').length, 2, 'a row for each');
assert(/×2/.test(fw().querySelector('.ca-wfq-row b').textContent), '…each ×2');
CA.UI.Menu.openPage('stats');
assert(fstar().classList.contains('on'), 'the star stays full when the page is drawn again');
Game.Has = () => false;
W.tick();
eq(mult(), '×1', 'nothing helping: ×1');
assert(/Nothing is making them come more often/.test(fw().textContent), '…and says so');
CA.UI.Menu.openPage('stats');
assert(/none yet/.test(doc.querySelector('[data-st-spawn] .ca-sp-factors').textContent) && fstar(), 'the row (and its ☆) shows with nothing helping too');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
