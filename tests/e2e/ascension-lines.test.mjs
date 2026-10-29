// Ascension lines: every chart draws a bold line at each ascension (seen by cookieMgr, or this run's
// start when it wasn't watching), with a hover note, and offers a "Since last ascension" window.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
makeGarden(Game);
await sleep(1500); // a few recorded seconds

// ---- the ascensions cookieMgr knows of
Game.resets = 0;
assert(CA.Ascension.times().length === 0 && CA.Ascension.last() === null, 'no ascension yet: none');
Game.resets = 3;
Game.startDate = Date.now() - 3600 * 1000; // this run began an hour ago, unseen
let all = CA.Ascension.times();
assert(all.length === 1 && all[0].t === Game.startDate, 'a run that began while cookieMgr wasn’t watching: its start');
CA.Events.emit('ascend');
const seen = CA.EventLog.list(['ascend']).slice(-1)[0];
Game.startDate = seen.t + 20 * 1000; // Reincarnate a little later
all = CA.Ascension.times();
assert(all.length === 1 && CA.Ascension.last().t === seen.t, `one it saw: from the event log, not counted twice (${all.length})`);
await sleep(1200);

// ---- every chart: a bold line at it, and no ascension diamond any more
CA.UI.Menu.openPage('graphs');
await sleep(100);
const P = CA.UI.Plot.get('cps');
P.tick();
const card = () => doc.querySelector('[data-plot="cps"]');
const L = () => P.layout();
assert(L().ascRects.length === 1 && Math.abs(L().ascRects[0].t - seen.t) < 1, 'the CpS chart: a line at the ascension');
assert(!L().evRects.some((r) => r.m.line), 'the old dashed ascension marker is gone');

// hover it: an Ascension section
const x = L().ascRects[0].x;
card().querySelector('[data-plot-canvas]').dispatchEvent(new w.MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: 80 }));
const tip = doc.querySelector('[data-plot-tip="cps"]');
assert(tip && /Ascension/.test(tip.textContent) && /A new run began here/.test(tip.textContent), `hovering the line: Ascension (${tip && tip.textContent.slice(0, 80)})`);

// ---- the window: Since last ascension
const chip = card().querySelector(`[data-plot-set="plot.cps.win"][data-val="${CA.UI.Plot.SINCE_ASCENSION}"]`);
assert(chip && chip.textContent === 'Since last ascension', 'a Since last ascension chip');
// a while ago: the last run's history (big CpS) up to it, this run's (small) after the run began
const fr = CA.Recorder.frames();
const tmpl = fr[fr.length - 1];
const now = Date.now();
const act = CA.Recorder.activeNow();
seen.t = now - 10 * 60 * 1000;
seen.a = act - 10 * 60 * 1000;
Game.startDate = seen.t + 20 * 1000; // left the ascension screen 20 s later
const frame = (t, cps, dt = 5) => ({ ...tmpl, t, a: act - (now - t), dt, cps, base: cps, click: 0 });
const syn = [];
for (let t = now - 20 * 60 * 1000; t < seen.t; t += 5000) syn.push(frame(t, 1e12));
for (let t = Game.startDate + 5000; t < now - 3000; t += 5000) syn.push(frame(t, 1000));
// older history is merged into wide frames: one that began before the run counts as the last run's
syn.push(frame(Game.startDate + 60 * 1000, 1e12, 120));
syn.sort((x, y) => x.t - y.t);
fr.splice(0, fr.length, ...syn);
click(w, chip);
P.tick();
let v = L().v;
assert(Math.abs(v.x0 - Game.startDate) < 1000 && Math.abs(v.x1 - Date.now()) < 2000, 'the window: from the run’s start to now');
assert(v.frames.length > 50 && v.frames.every((f) => f.t - f.dt * 1000 >= Game.startDate - 1000), 'only this run’s frames, not even part of the last run’s');
assert(L().data.bars.every((b) => b.parts.cps < 1e6) && P.last().scale.yMax < 1e5, `the scale: this run’s CpS only (top ${P.last().scale.yMax})`);
CA.Settings.set('plot.cps.win', 900);
P.tick();
assert(L().ascRects.length === 1 && P.last().scale.yMax > 1e11, 'a 15 min window: the line, and the last run too');
click(w, chip);
P.tick();
// the active-time axis too
CA.Settings.set('graphActiveTime', true);
P.tick();
v = L().v;
assert(v.active && Math.abs(v.x0 - CA.Recorder.activeAt(Game.startDate)) < 1000 && v.frames.every((f) => f.cps < 1e6), 'active time: from the run’s start too');
CA.Settings.set('graphActiveTime', false);
// no ascension known: all history
const prev = Game.resets;
Game.resets = 0;
CA.EventLog.list().splice(0); // forget them (in memory)
P.tick();
assert(CA.Ascension.last() === null && L().v.W >= 1000, 'no ascension: the whole history');
Game.resets = prev;
Game.startDate = Date.now() - 2000;
P.tick();
assert(L().ascRects.length === 1, 'back: the run’s start');

// the prestige ETAs follow the Prestige chart's window
CA.Settings.set('plot.prestige.win', CA.UI.Plot.SINCE_ASCENSION);
CA.UI.Menu.openPage('graphs:prestige');
await sleep(100);
assert(/since your last ascension/.test(doc.querySelector('#CookieMgrMenu').textContent), 'the prestige ETAs: at the CpS since the last ascension');

// ---- the garden charts (their own ticks axis included)
CA.UI.Menu.openPage('garden');
await sleep(100);
const GE = CA.UI.Plot.get('gardenEffects');
GE.tick();
assert(GE.layout() && Array.isArray(GE.layout().ascRects), 'the Garden effects chart checks for ascensions');
assert(doc.querySelector(`[data-plot="garden"] [data-plot-set="plot.garden.win"][data-val="${CA.UI.Plot.SINCE_ASCENSION}"]`), 'the garden charts offer it too');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
