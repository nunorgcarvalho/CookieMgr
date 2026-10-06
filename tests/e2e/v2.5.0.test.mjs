// v2.5.0: raw clicking from clicks × unbuffed per-click value, Actual CpS gains/losses + table,
// axes that fit only what's shown (hidden lines, inactive bars), prestige ETA from the chart window,
// full-width panel / fixed tables.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
Game.cookiesReset = 1e21;

// production + 10 clicks/s, then a Frenzy (×7 CpS) with a Click frenzy (×777 clicks)
const loop = setInterval(() => {
  const p = Game.cookiesPs / 10;
  Game.cookies += p;
  Game.cookiesEarned += p;
  Game.ClickCookie();
  Game.cookies -= 30; // a little spending
}, 100);
await sleep(2300);
Game.buffs.Frenzy = { name: 'Frenzy', time: 3000, maxTime: 3000, multCpS: 7 };
Game.buffs['Click frenzy'] = { name: 'Click frenzy', time: 3000, maxTime: 3000, multClick: 777 };
Game.cookiesPs = 7000; // buffed; unbuffedCps stays 1000
await sleep(2300);

// ---- raw clicking
const fr = CA.Recorder.frames();
const f = fr[fr.length - 1];
assert(Math.abs(f.clickRate - 10) < 2.5, `clicks per second measured (${f.clickRate})`);
assert(Math.abs(f.perClickRaw - (10 + 1000 * 0.01)) < 1e-9, `a click's worth with no effects, from the game's own formula (${f.perClickRaw})`);
assert(Math.abs(f.perClick - (10 + 7000 * 0.01) * 777) < 1e-6, `actual per-click value (${f.perClick})`);
assert(Math.abs(f.clickRaw - f.clickRate * f.perClickRaw) < 1e-9, 'raw clicking = clicks/s × raw per click');
assert(Game.cookiesPs === 7000 && Game.buffs['Click frenzy'], 'game state restored after the raw calculation');
const r = CA.UI.Graphs.recent(3);
assert(r.base < r.base + r.clickRaw && r.base + r.clickRaw < r.actual, `stages increase under effects (${Math.round(r.base)} < ${Math.round(r.base + r.clickRaw)} < ${Math.round(r.actual)})`);

// ---- tables + layout
CA.UI.Menu.openPage('graphs');
click(w, doc.querySelector('[data-graph-tab="cookies"]'));
CA.UI.Graphs.tick();
const cpsTable = doc.querySelector('[data-plot="cps"] .ca-stages');
assert(/Clicks per second/.test(cpsTable.textContent), 'clicks per second row');
const css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
assert(/#CookieMgrMenu \{\s*max-width: none/.test(css), 'panel uses the full width');
assert(/\.ca-table\.ca-stages \{\s*table-layout: fixed/.test(css) && /\.ca-table-wrap \{[^}]*overflow: hidden/.test(css), 'tables: fixed layout, no scrollbar');

// engine: a line that isn't a drawn series never sizes the axis; a mostly-inactive bar doesn't
// set a log axis's floor
function probe(id, spec) {
  const pl = CA.UI.Plot.create({ id, title: id, windows: [60], ...spec });
  const host = doc.createElement('div');
  host.innerHTML = pl.html();
  doc.body.appendChild(host);
  pl.mount(host);
  pl.tick();
  const sc = pl.last().scale;
  pl.unmount();
  host.remove();
  return sc;
}
const s1 = probe('probeHidden', {
  build: (v) => ({ series: [{ key: 'a', name: 'a', color: '#fff', type: 'line' }], lines: { a: [{ x: v.x1 - 1000, v: 5 }], hidden: [{ x: v.x1 - 1000, v: -1e9 }] } }),
});
assert(s1.yMin >= 0, `hidden line doesn't stretch the axis (yMin ${s1.yMin})`);
const s2 = probe('probeLog', {
  log: true,
  build: (v) => ({
    series: [{ key: 'a', name: 'a', color: '#fff', type: 'bar' }],
    bars: [
      { x0: v.x1 - 40000, x1: v.x1 - 20000, parts: { a: 1000 }, raw: { secs: 20 } },
      { x0: v.x1 - 20000, x1: v.x1, parts: { a: 3 }, raw: { secs: 1 } }, // the game ran 1 of these 20 s
    ],
  }),
});
assert(s2.log && s2.yMin > 100, `log axis floor ignores the mostly-inactive bar (yMin ${s2.yMin})`);

// ---- prestige ETA follows the chart window
click(w, doc.querySelector('[data-graph-tab="prestige"]'));
await sleep(50);
const ptxt = () => doc.querySelector('[data-plot="prestige"] [data-plot-stats]').textContent;
CA.UI.Graphs.tick();
assert(/actual CpS of the last 3h/.test(ptxt()), `ETA uses the chart window (${ptxt().slice(-60)})`);
click(w, doc.querySelector('[data-plot="prestige"] [data-plot-set="plot.prestige.win"][data-val="900"]'));
CA.UI.Graphs.tick();
assert(/last 15m/.test(ptxt()), 'and changes with it');
doc.querySelector('[data-ptarget-num]').value = '2';
doc.querySelector('[data-ptarget-num]').dispatchEvent(new w.Event('input', { bubbles: true }));
doc.querySelector('[data-ptarget-unit]').value = '3';
doc.querySelector('[data-ptarget-unit]').dispatchEvent(new w.Event('change', { bubbles: true }));
assert(/actual CpS of the last 15m/.test(doc.querySelector('[data-ptarget-out]').textContent), 'target card too');
click(w, doc.querySelector('[data-plot="prestige"] [data-plot-set="plot.prestige.win"][data-val="0"]'));
assert(/all recorded play/.test(doc.querySelector('[data-ptarget-out]').textContent), 'All = all recorded play');

clearInterval(loop);
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
