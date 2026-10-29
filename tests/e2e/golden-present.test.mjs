// A golden cookie on screen: the Golden cookies widget and the Stats page's card keep their graph and layout,
// held at the beginning of the cycle that starts when it leaves (today's factors, 0 s in — they don't move while
// it's there), under a "Golden cookie present" overlay; when it leaves they carry on from there.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = CA.UI.Widgets;

Game.fps = 30;
Game.Has = (n) => n === 'Lucky day';
const G = (Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 200, minTime: 30 * 300, maxTime: 30 * 900, spawned: 0, n: 0, spawnConditions: () => true }));
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 60, maxTime: 30 * 77, multCpS: 7 } };
CA.Settings.set('widgetsShown', true);
W.list().forEach((x) => W.remove(x.id));

// ---- the numbers: the fresh cycle's, from 0
assert(CA.Timers.distribution('golden').start === null, 'none on screen: no start');
G.spawned = 1;
const d = CA.Timers.distribution('golden');
assert(d.spawned && d.wait === null && d.start, 'one on screen: still spawned, no wait from now — and the next cycle’s start');
assert(d.start.cycle.elapsed === 0 && d.start.cycle.by === 0 && d.start.cycle.min === d.next.min && d.start.cycle.max === d.next.max, `…at 0 s into the next cycle, with today’s bounds (Lucky day: ${d.next.min}–${d.next.max} s)`);
assert(Math.abs(d.start.wait.mean - d.next.mean) < 0.5 && d.start.wait.soonest === d.next.min, `…its expected wait the frequency (${d.start.wait.mean.toFixed(1)} s)`);
const v = CA.UI.SpawnView.atStart(d);
assert(v.present && !v.spawned && v.wait === d.start.wait && v.cycle === d.start.cycle, 'atStart: the view the charts draw');
G.spawned = 0;
assert(!CA.UI.SpawnView.atStart(CA.Timers.distribution('golden')).present, '…and none on screen: as it is');

// ---- the widget keeps its layout
const a = W.add('goldenCookies', null, { stats: ['numbers', 'chart', 'bars'] });
W.render();
W.tick();
const box = () => doc.querySelector(`#CookieMgrWidgets [data-widget="${a.id}"]`);
const labels = () => [...box().querySelectorAll('.ca-tl-nums em')].map((e) => e.textContent).join();
const before = labels();
assert(box().querySelector('.ca-sp-cycle .ca-sp-now') && !box().querySelector('.ca-sp-present'), 'before: this cycle’s chart, no overlay');
G.spawned = 1;
W.tick();
assert(labels() === before, `on screen: the same statistics (${labels()})`);
assert(box().querySelector('.ca-sp-cycle .ca-sp-now') && box().querySelector('.ca-sp-lane'), '…the same chart, its effect bar');
const now = box().querySelector('.ca-sp-now circle');
assert(Number(now.getAttribute('cx')) === 8 && box().querySelector('.ca-sp-since').textContent === '0s', '…the now line at the beginning (0s)');
assert(/Golden cookie present/.test(box().querySelector('.ca-tl-w.ca-present > .ca-sp-present').textContent), '…under a “Golden cookie present” overlay');
assert(!/on screen!/.test(box().textContent), '…not the old one-liner');
const html = box().innerHTML;
G.time += 30 * 10; // the game's timer doesn't matter while it's there
W.tick();
assert(box().innerHTML === html, 'it holds still while the cookie is there');
a.axis = 'now';
W.tick();
assert(box().querySelector('.ca-sp-pdf rect') && box().querySelector('.ca-sp-lane.next') && box().querySelector('.ca-sp-present'), 'From now: the wait from when it leaves, overlaid too');
G.spawned = 0;
G.time = 0;
W.tick();
assert(!box().querySelector('.ca-sp-present') && box().querySelector('.ca-sp-pdf rect'), 'it leaves: the overlay goes, the chart carries on');

// ---- the settings' samples
a.axis = 'cycle';
G.spawned = 1;
W.openSettings(a.id);
const tiles = [...doc.querySelectorAll('[data-w-multi="stats"]')].map((x) => x.closest('label'));
assert(tiles.find((l) => /Graph/.test(l.textContent)).querySelector('.ca-sp-cycle'), 'the Graph tile: the held chart too');
CA.UI.Menu.close && CA.UI.Menu.close();

// ---- the Stats page's card
CA.UI.Menu.openPage('stats');
await sleep(20);
const card = () => doc.querySelector('[data-page="graphs"] [data-st-spawn]');
const text = () => card().textContent.replace(/\s+/g, ' ');
assert(card().querySelector('.ca-sp-held [data-sp-chart="golden"].ca-sp-cycle') && /Golden cookie present/.test(card().querySelector('.ca-sp-held .ca-sp-present').textContent), 'the card: the chart, held under the overlay');
assert(/Expected wait/.test(text()) && /from when it leaves/.test(text()) && /Odds so far/.test(text()) && /0%/.test(text()), `…the same tiles, from the next cycle’s beginning`);
assert(card().querySelector('.ca-sp-lane.up'), '…with the Frenzy running');
G.spawned = 0;
CA.UI.Menu.render();
assert(!card().querySelector('.ca-sp-present') && /from now/.test(text()), 'it leaves: as before');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
