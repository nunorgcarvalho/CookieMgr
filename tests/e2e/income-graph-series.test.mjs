// Picking what the income charts show: Bank flows can hide its dashed line of the CpS the game shows (+ clicking),
// leaving the bars (e.g. building CpS alone); on Actual income, a click on a source's row in the table shows that
// source alone, the axis fitted to it, and a click on it again (or on the Actual income row) shows them all.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(1500);

// ---- history: 1000/s of production, 10/s of clicking, 200/s of golden cookies, 5/s of the rest
const fr = CA.Recorder.frames();
const tmpl = fr[fr.length - 1];
const now = Date.now();
const act = CA.Recorder.activeNow();
const syn = [];
for (let t = now - 20 * 60 * 1000, dt = 5; t <= now; t += dt * 1000)
  syn.push({
    ...tmpl,
    t,
    a: act - (now - t),
    dt,
    cps: 1000,
    base: 800,
    click: 10,
    earned: 1215 * dt,
    earnProduction: 1000 * dt,
    earnClick: 10 * dt,
    earnGolden: 200 * dt,
    earnOther: 5 * dt,
  });
fr.splice(0, fr.length, ...syn);

// ---- Bank flows: the game's CpS line, on by default, can be switched off
CA.UI.Menu.openPage('graphs:cookies');
if (Game.onMenu !== CA.MENU_ID) Game.ShowMenu(CA.MENU_ID);
CA.UI.Menu.render();
await sleep(100);
const flows = CA.UI.Plot.get('actual');
const flowKeys = () => (flows.tick(), flows.layout().data.series.map((s) => s.key));
const chip = () => doc.querySelector('[data-plot="actual"] [data-plot-toggle="actualShown"]');
assert(flowKeys().includes('shown'), 'Bank flows: the game’s CpS line by default');
assert(chip() && /Game’s CpS/.test(chip().textContent), 'a Game’s CpS chip');
assert(!doc.querySelector('[data-plot="ledgerCum"] [data-plot-toggle="actualShown"]'), 'not on the Cookie bank chart (it has no such line)');
click(w, chip());
await sleep(50);
assert(CA.Settings.get('actualShown') === false && !flowKeys().includes('shown'), 'clicked: the line is gone');
assert(flowKeys().includes('build'), 'the building CpS bars stay');
click(w, chip());
await sleep(50);
assert(flowKeys().includes('shown'), 'clicked again: back');

// ---- Actual income: a row of the table shows its source alone
CA.UI.Menu.openPage('graphs:income');
CA.UI.Menu.render();
await sleep(100);
const inc = CA.UI.Plot.get('income');
const card = () => doc.querySelector('[data-plot="income"]');
const row = (k) => card().querySelector(`[data-plot-footer] tr[data-income-only="${k}"]`);
const data = () => (inc.tick(), inc.layout().data);
const scale = () => (inc.tick(), inc.last().scale);
const yMaxAll = scale().yMax;
assert(yMaxAll > 1215, `all of it: the axis fits the total (${yMaxAll})`);
assert(row('earnClick') && row('earnClick').classList.contains('ca-pick'), 'the sources’ rows can be picked');

click(w, row('earnClick'));
await sleep(50);
assert(CA.Settings.get('incomeOnly') === 'earnClick', 'clicked Clicking: only it');
let d = data();
assert(d.series.map((s) => s.key).join() === 'earnClick', `only its bars, no unbuffed CpS line (${d.series.map((s) => s.key)})`);
assert(!d.hlines.some((l) => /payback/.test(l.label)), 'no payback line (it’s all of the income)');
assert(d.hlines.some((l) => /avg 10\/s/.test(l.label)), `its own average (${d.hlines.map((l) => l.label)})`);
const s = scale();
assert(s.yMax >= 10 && s.yMax < 20, `the axis fits clicking’s 10/s (${s.yMax})`);
assert(row('').classList.contains('on') && row('earnProduction').classList.contains('off'), 'its row marked, the others dimmed');
assert(/Only clicking/.test(card().querySelector('[data-plot-legend]').textContent), 'the legend says so');

click(w, row('earnProduction'));
await sleep(50);
d = data();
assert(d.series.map((s) => s.key).join() === 'earnProduction,base', `Production: its bars and unbuffed CpS (${d.series.map((s) => s.key)})`);

click(w, card().querySelector('[data-plot-footer] tr.on'));
await sleep(50);
assert(CA.Settings.get('incomeOnly') === '', 'its row again: every source');
assert(data().series.length === 5 && Math.abs(scale().yMax - yMaxAll) < 1e-6, 'the chart as before');

click(w, row('earnGolden'));
await sleep(50);
const total = [...card().querySelectorAll('[data-plot-footer] tr')].find((r) => /Actual income/.test(r.textContent));
click(w, total);
await sleep(50);
assert(CA.Settings.get('incomeOnly') === '', 'the Actual income row: every source');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
