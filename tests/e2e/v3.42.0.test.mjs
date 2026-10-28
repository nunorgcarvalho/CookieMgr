// v3.42.0: the Chart widget (the Garden's charts) is customizable like Golden cookies: Show picks Stats and
// either or both charts (stacked), Stats picks the garden's statistics — each plant effect now (golden cookie
// frequency ticked to start), plants, mature, next tick. A chart widget saved before shows its one chart.
// Also: a chart's hover line follows the pointer in browsers with the older CSS zoom rules (ui/dom.js pointIn).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const idb = { factory: new IDBFactory(), IDBKeyRange };
const g = boot({ idb });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const GM = makeGarden(Game);
await sleep(400);
const W = CA.UI.Widgets;
const eq = (got, want, what) => assert(JSON.stringify(got) === JSON.stringify(want), `${what}: ${JSON.stringify(got)}${JSON.stringify(got) === JSON.stringify(want) ? '' : ` (wanted ${JSON.stringify(want)})`}`);

GM.effs = { cps: 1.05, goldenCookieFreq: 1.0435 };
GM.plot[2][1] = [1, 40];
GM.plot[2][2] = [2, 2];
CA.GardenHistory.sample();
CA.Settings.set('widgetsShown', true);
W.list().forEach((x) => W.remove(x.id));

// ---- a chart widget from before: its one chart
W.load([{ id: 'old', type: 'chart', x: 0.1, y: 0.2, plot: 'gardenEffects' }]);
W.render();
await sleep(10);
const a = W.get('old');
const el = () => doc.querySelector(`#CookieMgrWidgets [data-widget="${a.id}"]`);
assert(CA.UI.Plot.get(`gardenEffects~${a.id}`) && CA.UI.Plot.get(`gardenEffects~${a.id}`).isMounted() && !el().querySelector('.ca-tl-nums'), 'a chart widget saved before v3.42 shows its one chart, no stats');
eq(el().querySelector('.ca-w-title').textContent, 'Garden effects', '…under its name');

// ---- the settings: Show (Stats + a tile per chart), lit as it is
W.openSettings(a.id);
const editor = () => doc.querySelector(`[data-w-editor="${a.id}"]`);
const tiles = (key) => [...editor().querySelectorAll(`[data-w-multi="${key}"]`)].map((i) => i.closest('.ca-wopt'));
const tile = (key, v) => tiles(key).find((t) => t.querySelector('input').value === v);
eq(
  tiles('stats').map((t) => [t.querySelector('.ca-wopt-head').textContent, t.classList.contains('on')]),
  [
    ['Stats', false],
    ['Garden growth', false],
    ['Garden effects', true],
  ],
  'Show: Stats and the two charts, Garden effects lit'
);
assert(tiles('stats').every((t) => t.querySelector('.ca-wsample')), '…each tile with its sample (a chart’s is its picture, where a canvas can draw)');
assert(!tiles('nums').length, 'Stats hidden while Stats is off');

// Stats on: golden cookie frequency to start, its value from the game's Garden information
click(w, tile('stats', 'numbers').querySelector('input'));
eq(a.stats, ['gardenEffects', 'numbers'], 'ticking Stats: saved');
const nums = tiles('nums');
assert(nums.length >= 24 && nums.some((t) => /Golden cookie frequency/.test(t.textContent)) && nums.some((t) => /Next tick/.test(t.textContent)), 'Stats: a small tile per plant effect, then plants, mature, next tick');
eq(nums.filter((t) => t.classList.contains('on')).map((t) => t.querySelector('input').value), ['goldenCookieFreq'], '…golden cookie frequency ticked to start');
assert(/\+4\.4%/.test(tile('nums', 'goldenCookieFreq').textContent) && /\+5%/.test(tile('nums', 'cps').textContent), '…each with its value now (+4.4%, +5%)');
assert(tile('nums', 'goldenCookieFreq').dataset.tip && /golden cookie frequency/.test(tile('nums', 'goldenCookieFreq').dataset.tip), '…explained on hover (CA.StatInfo garden.goldenCookieFreq)');
W.tick();
const cells = () => [...el().querySelectorAll('.ca-tl-nums span')].map((s) => [s.querySelector('em').textContent, s.querySelector('b').textContent]);
eq(cells(), [['Golden cookie frequency', '+4.4%']], 'the widget: golden cookie frequency over the chart');
assert(el().querySelector('.ca-tl-nums span').dataset.wOpen === 'garden', '…clicking it opens the Garden page');

click(w, tile('nums', 'plants').querySelector('input'));
click(w, tile('nums', 'mature').querySelector('input'));
W.tick();
eq(cells(), [['Golden cookie frequency', '+4.4%'], ['Plants', '2'], ['Mature', '1']], 'ticking Plants and Mature: in the game’s order');

// both charts: stacked, each a copy; named after what they're of
click(w, tile('stats', 'garden').querySelector('input'));
W.render();
await sleep(10);
W.tick();
assert(CA.UI.Plot.get(`garden~${a.id}`).isMounted() && CA.UI.Plot.get(`gardenEffects~${a.id}`).isMounted(), 'both charts: a copy of each, mounted');
eq(el().querySelectorAll('canvas[data-plot-canvas]').length, 2, '…two canvases, stacked');
assert(el().querySelector('.ca-wcharts.two'), '…sized for two');
eq(el().querySelector('.ca-w-title').textContent, 'Garden', '…the widget named Garden');

// a chart off: its copy let go
click(w, tile('stats', 'gardenEffects').querySelector('input'));
W.tick();
assert(!CA.UI.Plot.get(`gardenEffects~${a.id}`) || !CA.UI.Plot.get(`gardenEffects~${a.id}`).isMounted(), 'unticking Garden effects lets go of its copy');
eq(el().querySelector('.ca-w-title').textContent, 'Garden growth', '…named after the chart left');

// just the stats
click(w, tile('stats', 'garden').querySelector('input'));
W.tick();
assert(!el().querySelector('canvas[data-plot-canvas]') && el().querySelector('.ca-tl-nums'), 'Stats alone: no chart');
click(w, tile('stats', 'numbers').querySelector('input'));
W.tick();
assert(/Pick what to show/.test(el().textContent), 'nothing picked: it says to pick something');
click(w, tile('stats', 'numbers').querySelector('input'));
click(w, tile('stats', 'gardenEffects').querySelector('input'));

// saved and loaded
const saved = W.serialize().find((x) => x.id === a.id);
eq([saved.stats, saved.nums], [['numbers', 'gardenEffects'], ['goldenCookieFreq', 'plants', 'mature']], 'Show and Stats are saved');
g.Game.WriteSave();
const g2 = boot({ idb, save: g.Game.modSaveData.CookieMgr });
await sleep(500);
const b = g2.window.CookieMgr.UI.Widgets.get(a.id);
eq(b && [b.stats, b.nums], [['numbers', 'gardenEffects'], ['goldenCookieFreq', 'plants', 'mature']], '…and loaded the same');

// the ☆ still adds the one chart
W.list().forEach((x) => W.remove(x.id));
const s = W.add('chart', null, { plot: 'garden' }); // what the Growth ☆ adds
W.render();
await sleep(10);
assert(s && !s.stats && CA.UI.Plot.get(`garden~${s.id}`).isMounted() && !doc.querySelector(`[data-widget="${s.id}"] .ca-tl-nums`), 'the Growth ☆ still adds a widget showing just that chart');
assert(W.hasPreset({ type: 'chart', plot: 'garden' }), '…and its star lights');

// ---- the hover point: the mouse over a canvas in its own px (zoom and scale taken out)
const fake = { getBoundingClientRect: () => ({ left: 100, top: 50, width: 300, height: 150, right: 400, bottom: 200 }), clientWidth: 200, clientHeight: 100 };
const pt = CA.UI.Dom.pointIn(fake, { clientX: 250, clientY: 80 });
eq([pt.x, pt.y], [100, 20], 'pointIn: 150 px on screen into a canvas drawn at ×1.5 is its own x 100');

assert(g.errors.length === 0 && g2.errors.length === 0, `no runtime errors ${g.errors.concat(g2.errors).join(' | ')}`);
done();
process.exit();
