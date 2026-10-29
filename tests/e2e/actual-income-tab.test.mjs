// Actual income tab: Stats → Actual income charts what you really baked a second, by source — the income
// payback periods count in — with every window (Since last ascension too), a line at the income payback
// uses now and a table over spans of play. Its card picks the Actual income window, which can now be
// "since the last ascension" (on the Payback page too). Its ☆ puts the chart on the left panel as the
// Actual income widget, drawn the way it is on the tab. The old Actual CpS chart is now Bank flows.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(1500);
const P = CA.Payback;

// ---- history: the last run baked 1000/s, this one (10 min since the ascension) 100/s
const fr = CA.Recorder.frames();
const tmpl = fr[fr.length - 1];
const now = Date.now();
const act = CA.Recorder.activeNow();
Game.resets = 1;
Game.startDate = now - 10 * 60 * 1000;
const frame = (t, per, dt = 5) => ({
  ...tmpl,
  t,
  a: act - (now - t),
  dt,
  cps: per * 0.6,
  base: 50,
  click: per * 0.1,
  earned: per * dt,
  earnProduction: per * 0.6 * dt,
  earnClick: per * 0.1 * dt,
  earnGolden: per * 0.2 * dt,
  earnOther: per * 0.1 * dt,
});
const syn = [];
for (let t = now - 30 * 60 * 1000; t < Game.startDate; t += 5000) syn.push(frame(t, 1000));
for (let t = Game.startDate + 5000; t <= now; t += 5000) syn.push(frame(t, 100));
fr.splice(0, fr.length, ...syn);
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol * Math.abs(b);

// ---- the window: since the last ascension
assert(CA.Settings.definitions().find((d) => d.key === 'ppActualWindow').choices.some((c) => c.v === 'run' && c.label === 'Since last ascension'), 'the option offers Since last ascension');
P.setActualWindow('run');
assert(CA.Settings.get('ppActualWindow') === 'run', 'it can be set');
assert(Math.abs(P.actualWindow() - 600) <= 10, `the window: the play since the ascension (${P.actualWindow()} s)`);
assert(P.actualWindowText() === 'since ascension', 'it reads "since ascension"');
const run = P.incomeOver(P.actualWindow());
assert(run && near(run.actual, 100), `the income over it: this run only (${run && run.actual})`);
P.setActualWindow(15);
const q = P.incomeOver(P.actualWindow());
assert(q && q.actual > 300, `15m reaches back into the last run (${q && q.actual})`);
assert(P.actualWindowText() === '15m', 'lowercase units');

// ---- the tab
CA.UI.Menu.openPage('graphs:income');
if (Game.onMenu !== CA.MENU_ID) Game.ShowMenu(CA.MENU_ID);
CA.UI.Menu.render();
await sleep(100);
const tab = doc.querySelector('[data-graph-tab="income"]');
assert(tab && tab.classList.contains('on') && /Actual income/.test(tab.textContent), 'an Actual income tab');
const card = () => doc.querySelector('[data-plot="income"]');
assert(card() && /Actual income/.test(card().querySelector('.ca-card-title').textContent), 'its chart');
const Pl = CA.UI.Plot.get('income');
Pl.tick();
const data = Pl.layout().data;
assert(['earnProduction', 'earnClick', 'earnGolden', 'earnOther'].every((k) => data.series.some((s) => s.key === k)), 'bars by source');
assert(data.hlines.some((l) => /payback .*15m/.test(l.label) && near(l.v, q.actual)), `a line at the payback income (${data.hlines.map((l) => l.label)})`);
const wins = [...card().querySelectorAll('[data-plot-set="plot.income.win"]')].map((b) => b.textContent);
assert(['1h', '3h', '12h', '1d', 'Since last ascension'].every((x) => wins.includes(x)), `hourly windows and Since last ascension (${wins})`);
assert(/For payback/.test(card().querySelector('[data-plot-stats]').textContent), 'its figures');
const head = [...card().querySelectorAll('[data-plot-footer] th')].map((th) => th.textContent);
assert(head.includes('This run') && head.includes('1h'), `a table over spans of play (${head})`);
const row = [...card().querySelectorAll('[data-plot-footer] tr')].find((r) => /Actual income/.test(r.textContent));
assert(row && /×/.test(row.nextElementSibling.textContent), 'the actual income and × raw CpS rows');

// the card picks the window
const pick = (v) => doc.querySelector(`[data-income-window="${v}"]`);
assert(pick('15').classList.contains('on') && pick('run') && pick('run').textContent === 'Since ascension', 'the card: its windows, the one in use on');
click(w, pick('run'));
await sleep(50);
assert(CA.Settings.get('ppActualWindow') === 'run' && pick('run').classList.contains('on'), 'clicking one sets it');
Pl.tick();
assert(Pl.layout().data.hlines.some((l) => /since ascension/.test(l.label)), 'the line follows it');

// ---- the Payback page
CA.UI.Menu.openPage('payback');
await sleep(100);
const ppRun = doc.querySelector('[data-pp-pick="ppActualWindow"][data-v="run"]');
assert(ppRun && ppRun.classList.contains('on'), 'the Payback page’s Options: Since ascension, on');
assert(/Actual income · since ascension/.test(doc.querySelector('[data-pp-mode="actualIncome"]').textContent), 'the mode’s chip names it');
click(w, doc.querySelector('[data-pp-pick="ppActualWindow"][data-v="30"]'));
await sleep(50);
assert(CA.Settings.get('ppActualWindow') === '30', 'and a preset again');

// ---- the Cookies tab: Bank flows (what was Actual CpS)
CA.UI.Menu.openPage('graphs:cookies');
await sleep(100);
assert(/Bank flows/.test(doc.querySelector('[data-plot="actual"] .ca-card-title').textContent), 'the ledger chart is Bank flows');

// ---- the widget, from the tab's ☆
CA.UI.Menu.openPage('graphs:income');
await sleep(100);
const Wd = CA.UI.Widgets;
const star = card().querySelector('.ca-wstar');
assert(star && !Wd.hasPreset({ type: 'income' }), 'a ☆ on the chart');
click(w, star);
assert(Wd.hasPreset({ type: 'income' }), 'clicked: the Actual income widget');
const inst = Wd.list().find((x) => x.type === 'income');
Wd.render();
Wd.tick && Wd.tick();
await sleep(1200);
const mini = CA.UI.Plot.get(`income~${inst.id}`);
assert(mini && doc.querySelector(`#CookieMgrWidgets [data-plot="income~${inst.id}"] canvas`), 'it draws a copy of the chart');
CA.Settings.set('plot.income.win', 10800);
mini.tick();
assert(Math.abs(mini.layout().v.x1 - mini.layout().v.x0 - 10800 * 1000) < 5000, 'with the tab’s window');
click(w, card().querySelector('.ca-wstar'));
assert(!Wd.hasPreset({ type: 'income' }), 'clicked again: taken away');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
