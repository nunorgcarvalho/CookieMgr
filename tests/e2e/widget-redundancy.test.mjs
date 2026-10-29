// No information twice in a widget. The Golden cookies widget's graph doesn't write again the numbers its Stats
// show above it: the expected line reads "expected" when Expected wait is on (its time otherwise), the next
// cookie's bar leaves out its window when Window is on. (The Manager widget's: manager-widget.test.mjs.)
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({});
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const W = CA.UI.Widgets;

Game.fps = 30;
Game.Has = (n) => n === 'Lucky day';
Object.assign(Game.shimmerTypes.golden || (Game.shimmerTypes.golden = {}), { time: 30 * 200, minTime: 30 * 300, maxTime: 30 * 900, spawned: 0, n: 0, spawnConditions: () => true });
W.list().forEach((x) => W.remove(x.id));
const html = (opts) => {
  const doc = new w.DOMParser().parseFromString(CA.UI.TimelineWidget.html(W.add('goldenCookies', null, opts)), 'text/html');
  return { expected: (doc.querySelector('text') && [...doc.querySelectorAll('.ca-sp-expect text')].map((t) => t.textContent).join()) || '', next: [...doc.querySelectorAll('.ca-sp-lane.next text')].map((t) => t.textContent).join() };
};

// ---- this cycle: the expected line
let h = html({ stats: ['numbers', 'chart'], nums: ['next', 'minute'] });
assert(h.expected === 'expected', `Expected wait shown above: the line says only “expected” (${h.expected})`);
h = html({ stats: ['numbers', 'chart'], nums: ['minute'] });
assert(/^expected · \d/.test(h.expected), `without it: the line has its time (${h.expected})`);
h = html({ stats: ['chart'] });
assert(/^expected · \d/.test(h.expected), `the graph alone: its time (${h.expected})`);

// ---- from now: the next cookie's bar
h = html({ stats: ['numbers', 'chart'], axis: 'now', nums: ['window'] });
assert(h.next === 'next', `Window shown above: the bar says only “next” (${h.next})`);
h = html({ stats: ['numbers', 'chart'], axis: 'now', nums: ['next'] });
assert(/^next · \d/.test(h.next), `without it: the bar has its window (${h.next})`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
