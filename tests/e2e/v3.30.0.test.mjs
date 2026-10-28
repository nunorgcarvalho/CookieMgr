// v3.30.0: the golden cookie frequency multiplier (× vs nothing helping) is called Multiplier, and a new
// Frequency says how long between golden cookies on average with what's helping now (a fresh cycle's mean
// wait: static, not a countdown) — on the Stats page's card and the Next golden cookie widget's numbers;
// the value word golden.interval.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

Game.fps = 30;
Game.Has = () => false;
Game.hasBuff = () => false;
Game.buffs = {};
// this cycle: 5–15 min, 4 min in
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 240, minTime: 30 * 300, maxTime: 30 * 900, spawned: 0, n: 0, spawnConditions: () => true });
const span = CA.Format.span;
const V = (id) => CA.Script.VALUES.find((v) => v.id === id).get();

let d = CA.Timers.distribution('golden');
assert(Math.abs(V('golden.interval') - d.next.mean) < 1e-9 && d.next.mean > 300 && d.next.mean < 900, `golden.interval: a fresh cycle's mean (${span(d.next.mean)})`);

CA.UI.Menu.openPage('stats');
const card = () => doc.querySelector('[data-page="stats"] [data-st-spawn]');
const flat = () => card().textContent.replace(/\s+/g, '');
assert(flat().includes('Multiplier×1') && flat().includes(`Frequency${span(d.next.mean).replace(/\s+/g, '')}`), 'the card: a Multiplier tile (×1) and a Frequency tile (the time between)');
const before = d.next.mean;

// Lucky day + Serendipity: ×4 as often, a quarter of the time between
Game.Has = (n) => n === 'Lucky day' || n === 'Serendipity';
d = CA.Timers.distribution('golden');
assert(Math.abs(d.frequency - 4) < 1e-9 && d.next.mean >= before / 4 && d.next.mean < before / 3, `Lucky day + Serendipity: ×4 (the game's spawn odds ramp up in a cycle, so not quite a quarter of the time), one every ${span(d.next.mean)} (was ${span(before)})`);
CA.UI.Menu.render();
assert(flat().includes('Multiplier×4') && flat().includes(`Frequency${span(d.next.mean).replace(/\s+/g, '')}`), 'the card follows');

// static: time passing in the cycle moves the countdown, not the frequency
Game.shimmerTypes.golden.time = 30 * 60;
const d2 = CA.Timers.distribution('golden');
assert(d2.next.mean === d.next.mean && d2.wait.mean !== d.wait.mean, 'not a countdown: the cycle moving changes next in, not the frequency');

// the widget
CA.Settings.set('widgetsShown', true);
CA.UI.Widgets.add('goldenNext');
CA.UI.Widgets.render();
CA.UI.Widgets.tick();
const nums = () => [...doc.querySelectorAll('#CookieMgrWidgets [data-widget]')].find((x) => /Next golden cookie/.test(x.textContent)).querySelector('.ca-tl-nums');
const cell = (label) => [...nums().querySelectorAll('span')].find((s) => s.querySelector('em').textContent === label);
assert(cell('multiplier') && cell('multiplier').querySelector('b').textContent === '×4', 'the widget: multiplier ×4');
assert(cell('frequency') && cell('frequency').querySelector('b').textContent === span(d.next.mean) && /on average/.test(cell('frequency').getAttribute('data-tip')), `and frequency ${span(d.next.mean)}`);
const inst = CA.UI.Widgets.list().find((x) => x.title === 'Next golden cookie');
inst.nums = ['every'];
CA.UI.Widgets.tick();
assert(nums().querySelectorAll('span').length === 1 && cell('frequency'), 'picked alone in its settings (every)');
inst.nums = ['frequency'];
CA.UI.Widgets.tick();
assert(nums().querySelectorAll('span').length === 1 && cell('multiplier'), 'a saved pick from before (frequency) is the multiplier');
CA.UI.Widgets.openSettings(inst.id);
const labels = [...doc.querySelectorAll('[data-w-multi="nums"]')].map((x) => x.closest('label') ? x.closest('label').textContent : '').join(' | ');
assert(/Multiplier/.test(labels) && /Frequency \(one every/.test(labels), `its settings: ${labels}`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
