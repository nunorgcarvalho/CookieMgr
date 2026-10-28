// v3.41.0: a widget's settings show what each choice looks like. A setting whose options come with samples
// is a picker of live tiles — the option's name over what picking it shows, drawn as the widget draws it,
// lit while picked, refreshed with the widget — and a setting can hide until another makes it matter.
// Golden cookies: a tile per part (its stats, the graph on its axis, the effect bars, the frequency factors),
// the two axes as two graphs, each statistic with its value now; Effect timers (a sample row per column, the
// bar at each scale), Quick stats (each number's value) and Latest events (the newest event of each type) too.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = CA.UI.Widgets;
const eq = (got, want, what) => assert(JSON.stringify(got) === JSON.stringify(want), `${what}: ${JSON.stringify(got)}${JSON.stringify(got) === JSON.stringify(want) ? '' : ` (wanted ${JSON.stringify(want)})`}`);

Game.fps = 30;
Game.Has = (n) => n === 'Lucky day';
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 50, minTime: 30 * 75, maxTime: 30 * 225, spawned: 0, n: 0, spawnConditions: () => true });
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 60, maxTime: 30 * 77, multCpS: 7 } };
CA.Settings.set('widgetsShown', true);
W.list().forEach((x) => W.remove(x.id));

// ---- Golden cookies: the Show picker, a live tile per part
const a = W.add('goldenCookies');
W.openSettings(a.id);
const editor = () => doc.querySelector(`[data-w-editor="${a.id}"]`);
const tiles = (key) => [...editor().querySelectorAll(`[data-w-multi="${key}"],[data-w-opt="${key}"]`)].map((i) => i.closest('.ca-wopt'));
const tile = (key, v) => tiles(key).find((t) => t.querySelector('input').value === v);
const sample = (key, v) => tile(key, v).querySelector(`[data-w-sample="${key}:${v}"]`);
eq(tiles('stats').map((t) => t.querySelector('.ca-wopt-head').textContent), ['Stats', 'Graph', 'Effects', 'Frequency Factors'], 'Show: a tile per part');
eq(tiles('stats').map((t) => t.classList.contains('on')), [true, true, false, false], 'Stats and Graph lit (the defaults)');
assert(sample('stats', 'numbers').querySelector('.ca-tl-nums') && [...sample('stats', 'numbers').querySelectorAll('.ca-tl-nums em')].map((e) => e.textContent).join() === 'Expected wait,Within minute %,Frequency,Multiplier', 'the Stats tile: the ticked statistics with their values, as the widget shows them');
assert(sample('stats', 'chart').querySelector('.ca-sp-chart.ca-sp-cycle'), 'the Graph tile: this cycle’s graph (the axis picked)');
assert(sample('stats', 'bars').querySelector('.ca-sp-lane') && /Frenzy/.test(sample('stats', 'bars').textContent), 'the Effects tile: the Frenzy’s bar, though Effects isn’t on');
assert(sample('stats', 'helping').querySelector('.ca-wfq-row') && /Lucky day/.test(sample('stats', 'helping').textContent), 'the Frequency Factors tile: Lucky day’s bar');
assert(tiles('stats').every((t) => t.dataset.tip), 'each tile explains itself on hover');

// the axis: two graphs, one lit; the statistics: each with its value now
const axes = tiles('axis');
eq(axes.map((t) => [t.querySelector('.ca-wopt-head').textContent, t.classList.contains('on')]), [['This cycle', true], ['From now', false]], 'Graph: This cycle (lit) and From now, as tiles');
assert(sample('axis', 'cycle').querySelector('.ca-sp-cycle') && sample('axis', 'now').querySelector('.ca-sp-pdf') && !sample('axis', 'now').querySelector('.ca-sp-cycle'), '…each a live graph on that axis');
const nums = tiles('nums');
assert(nums.length === 6 && nums.every((t) => t.querySelector('.ca-tl-nums b')), 'Stats: six tiles, each with its value');
assert(/×2/.test(sample('nums', 'frequency').textContent) && !/Multiplier/.test(sample('nums', 'frequency').textContent), 'the Multiplier tile: ×2 (Lucky day), its name only in the head');

// clicking a tile: the setting changes, the widget follows, the tiles follow
const panel = () => doc.querySelector(`#CookieMgrWidgets [data-widget="${a.id}"]`);
click(w, tile('axis', 'now').querySelector('input'));
eq([a.axis, tile('axis', 'now').classList.contains('on'), tile('axis', 'cycle').classList.contains('on')], ['now', true, false], 'picking From now: saved, lit');
assert(sample('stats', 'chart').querySelector('.ca-sp-pdf') && !sample('stats', 'chart').querySelector('.ca-sp-cycle'), '…the Graph tile redrawn from now');
W.tick();
assert(panel().querySelector('.ca-sp-pdf'), '…and the widget itself');
click(w, tile('nums', 'window').querySelector('input'));
assert(a.nums.includes('window') && tile('nums', 'window').classList.contains('on'), 'ticking Window: saved, lit');
assert(/Window/.test([...sample('stats', 'numbers').querySelectorAll('em')].map((e) => e.textContent).join()), '…the Stats tile shows it too');
// a part off: what depends on it goes away
click(w, tile('stats', 'chart').querySelector('input'));
assert(!a.stats.includes('chart') && !tile('stats', 'chart').classList.contains('on'), 'Graph off: saved');
assert(tiles('axis').length === 0 && tiles('nums').length === 6, '…its axis picker gone; the Stats picker stays');
click(w, tile('stats', 'numbers').querySelector('input'));
assert(tiles('nums').length === 0, 'Stats off: its picker gone too');
click(w, tile('stats', 'chart').querySelector('input'));
assert(tiles('axis').length === 2 && tile('axis', 'now').classList.contains('on'), 'Graph back on: its axis picker is back, From now still picked');

// live: the samples refresh with the page's tick
Game.Has = (n) => n === 'Lucky day' || n === 'Serendipity';
CA.UI.Pages.get('widgets').tick();
assert(/Serendipity/.test(sample('stats', 'helping').textContent), 'a tick later: the Frequency Factors tile shows Serendipity');
assert(tile('stats', 'helping').querySelector('.ca-wsample') && tile('stats', 'helping').classList.contains('on') === false, '…refreshed in place, still unlit');

// ---- the other widgets' settings, through the same picker
W.list().forEach((x) => W.remove(x.id));
const et = W.add('effectTimers');
W.openSettings(et.id);
const etTiles = (key) => [...doc.querySelectorAll(`[data-w-editor="${et.id}"] [data-w-multi="${key}"],[data-w-editor="${et.id}"] [data-w-opt="${key}"]`)].map((i) => i.closest('.ca-wopt'));
eq(etTiles('stats').map((t) => !!t.querySelector('.ca-et')), [true, true, true], 'Effect timers, Show: a sample row per column');
assert(etTiles('stats')[0].querySelector('.ca-et-ico') && !etTiles('stats')[0].querySelector('.ca-et-gc') && etTiles('stats')[2].querySelector('.ca-et-gc'), '…the icon in the icon tile, the chance in the chance tile');
assert(etTiles('barScale').length === 2 && etTiles('barScale').every((t) => t.querySelector('.ca-et-bar i')), 'A full bar is: a bar at each scale');
assert(doc.querySelector(`[data-w-editor="${et.id}"] select[data-w-opt="sort"]`), 'Order stays a drop-down (nothing to draw)');

const qs = W.add('stats');
W.openSettings(qs.id);
const qsTiles = [...doc.querySelectorAll(`[data-w-editor="${qs.id}"] [data-w-multi="stats"]`)].map((i) => i.closest('.ca-wopt'));
assert(qsTiles.length === CA.UI.WidgetTypes.STATS.length && qsTiles.every((t) => t.querySelector('.ca-w-stat b')), 'Quick stats: a tile per number, with its value');
assert(qsTiles.find((t) => t.querySelector('input').value === 'bank').querySelector('.ca-w-stat b').textContent === CA.Format.beautify(Game.cookies), '…the bank: your cookies');

CA.EventLog.add({ type: 'trade', title: 'Sold Cereal', cookies: -5 });
const ev = W.add('events');
W.openSettings(ev.id);
const evTiles = [...doc.querySelectorAll(`[data-w-editor="${ev.id}"] [data-w-multi="types"]`)].map((i) => i.closest('.ca-wopt'));
const trade = evTiles.find((t) => t.querySelector('input').value === 'trade');
assert(trade && /Sold Cereal/.test(trade.querySelector('.ca-ev-row').textContent), 'Latest events: the trade tile shows the newest trade');
assert(evTiles.some((t) => /None yet/.test(t.querySelector('.ca-wsample').textContent)), '…a type with no event yet says so');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
