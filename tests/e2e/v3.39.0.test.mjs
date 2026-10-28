// v3.39.0: one Golden cookies widget (goldenCookies) instead of three — Next golden cookie, Golden timeline and
// Golden cookie frequency. Its settings pick the parts (numbers — and which —, the chart on this cycle's axis or
// from now, effect bars, what's helping); saved widgets of the old types load as it, showing what they did and
// keeping their names as titles; the Stats page's ☆ adds one showing the multiplier, the frequency and what's
// helping. Effect timers stays its own widget.
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
Game.Has = (n) => n === 'Lucky day' || n === 'Serendipity';
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 50, minTime: 30 * 75, maxTime: 30 * 225, spawned: 0, n: 0, spawnConditions: () => true });
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 60, maxTime: 30 * 77, multCpS: 7 } };
CA.Settings.set('widgetsShown', true);
W.list().forEach((x) => W.remove(x.id));

// ---- one type
const ids = W.types().map((t) => t.id);
assert(ids.includes('goldenCookies') && ids.includes('effectTimers'), 'the Golden cookies widget, and Effect timers on its own');
assert(!['goldenNext', 'goldenTimeline', 'goldenFrequency'].some((t) => ids.includes(t)), `the three old types are gone (${ids.join()})`);
CA.UI.Menu.openPage('widgets');
const shelf = [...doc.querySelectorAll('.ca-wpick .ca-wtile-name')].map((n) => n.textContent);
assert(shelf.filter((t) => /golden/i.test(t)).length === 1 && shelf.some((t) => /^Golden cookies/.test(t)) && shelf.some((t) => /^Effect timers/.test(t)), `the picker: one Golden cookies tile, Effect timers beside it (${shelf.join(' | ')})`);

// ---- a new one: the numbers you'd want most and this cycle's chart
const box = (inst) => doc.querySelector(`#CookieMgrWidgets [data-widget="${inst.id}"]`);
const labels = (inst) => [...box(inst).querySelectorAll('.ca-tl-nums em')].map((e) => e.textContent);
const a = W.add('goldenCookies');
W.render();
W.tick();
eq(labels(a), ['Expected wait', 'Within minute %', 'Frequency', 'Multiplier'], 'new: expected wait, within minute %, frequency, multiplier');
const tipOf = (inst, label) => [...box(inst).querySelectorAll('.ca-tl-nums span')].find((x) => x.querySelector('em').textContent === label).getAttribute('data-tip');
assert(tipOf(a, 'Multiplier').startsWith(CA.StatInfo.desc('golden.frequency')) && /Lucky day, Serendipity/.test(tipOf(a, 'Multiplier')), 'hovering a statistic: its description from CA.StatInfo, and what’s helping now');
assert(box(a).querySelector('.ca-sp-cycle .ca-sp-now') && !box(a).querySelector('.ca-sp-pdf') && !box(a).querySelector('.ca-wfq-row'), '…over this cycle’s chart; no helping bars');
assert(box(a).querySelector('.ca-w-title').textContent === 'Golden cookies', '…titled Golden cookies');
// the chart from now, with the effect bars
a.axis = 'now';
a.stats = ['chart', 'bars'];
W.tick();
assert(box(a).querySelector('.ca-sp-pdf rect') && box(a).querySelector('.ca-sp-lane.up') && !box(a).querySelector('.ca-sp-cycle') && !box(a).querySelector('.ca-tl-nums'), 'Chart: From now — the timeline, a bar for the Frenzy on its axis');
a.stats = ['helping'];
W.tick();
const rows = [...box(a).querySelectorAll('.ca-wfq-row')];
assert(rows.length === 2 && rows.every((r) => /×2/.test(r.querySelector('b').textContent)), 'What’s helping: a bar each for Lucky day and Serendipity, ×2');
// its settings
W.openSettings(a.id);
const opts = (k) => [...doc.querySelectorAll(`[data-w-multi="${k}"]`)].map((x) => x.closest('label'));
eq(opts('stats').map((l) => l.textContent), ['Stats', 'Graph', 'Effects', 'Frequency Factors'], 'settings, Show: Stats, Graph (top), Effects, Frequency Factors (bottom) — short, a tip each');
assert(opts('stats').every((l) => l.dataset.tip), '…each with a tip');
eq(opts('nums').map((l) => l.textContent), ['Expected wait', 'Within minute %', 'Window', 'Frequency', 'Multiplier', 'Median wait'], 'Stats: the six, named by CA.StatInfo');
assert(opts('nums').every((l, i) => l.dataset.tip === CA.StatInfo.desc(['golden.wait', 'golden.minute', 'golden.window', 'golden.interval', 'golden.frequency', 'golden.median'][i])), '…each hovering its description');
const axisSel = doc.querySelector('select[data-w-opt="axis"]');
assert(axisSel && [...axisSel.options].map((o) => o.textContent).join() === 'This cycle,From now' && axisSel.value === 'now', 'and Graph: This cycle / From now');
const saved = W.serialize().find((x) => x.id === a.id);
eq([saved.axis, saved.stats], ['now', ['helping']], 'saved with the widget');

// ---- an old layout: each old widget becomes a Golden cookies widget showing what it did
W.list().forEach((x) => W.remove(x.id));
W.load([
  { id: 'n1', type: 'goldenNext', x: 0.1, y: 0.2, collapsed: false, w: 320 },
  { id: 'n2', type: 'goldenNext', x: 0.1, y: 0.3, collapsed: false, nums: ['next'], title: 'Mine' },
  { id: 't1', type: 'goldenTimeline', x: 0.2, y: 0.4, collapsed: true, stats: ['numbers', 'bars'] },
  { id: 't2', type: 'goldenTimeline', x: 0.2, y: 0.5, collapsed: false },
  { id: 'f1', type: 'goldenFrequency', x: 0.3, y: 0.6, collapsed: false, bg: 0.4 },
  { id: 'e1', type: 'effectTimers', x: 0.4, y: 0.7, collapsed: false },
]);
const L = W.list();
const by = (id) => L.find((x) => x.id === id);
eq(L.map((x) => x.type), ['goldenCookies', 'goldenCookies', 'goldenCookies', 'goldenCookies', 'goldenCookies', 'effectTimers'], 'every old golden widget loads as Golden cookies; Effect timers stays');
const all = ['next', 'minute', 'window', 'every', 'frequency', 'median'];
eq([by('n1').axis, by('n1').stats, by('n1').nums, by('n1').title, by('n1').w, by('n1').x], ['cycle', ['numbers', 'chart'], all, 'Next golden cookie', 320, 0.1], 'Next golden cookie: this cycle’s chart and all six numbers (as before), its name, size and place');
eq([by('n2').nums, by('n2').title], [['next'], 'Mine'], 'its numbers and title, when picked, kept');
eq([by('t1').axis, by('t1').stats, by('t1').collapsed], ['now', ['numbers', 'bars'], true], 'Golden timeline: from now, its picked parts, folded');
eq([by('t2').axis, by('t2').stats, by('t2').title], ['now', ['numbers', 'chart', 'bars'], 'Golden timeline'], 'Golden timeline with its defaults: numbers, chart, bars');
eq([by('f1').stats, by('f1').nums, by('f1').title, by('f1').bg], [['numbers', 'helping'], ['frequency', 'every'], 'Golden cookie frequency', 0.4], 'Golden cookie frequency: the multiplier, the frequency and what’s helping');
W.render();
W.tick();
assert(box(by('t2')).querySelector('.ca-sp-pdf rect') && box(by('t2')).querySelector('.ca-sp-lane.up'), 'the old timeline draws as before');
assert(box(by('n1')).querySelector('.ca-sp-cycle') && box(by('f1')).querySelectorAll('.ca-wfq-row').length === 2, 'the old Next golden cookie and frequency too');
assert(!JSON.stringify(W.serialize()).match(/goldenNext|goldenTimeline|goldenFrequency/), 'the next save has only the new type');
// adding by an old id (an old macro or script) gives the new one, set up the same
const old = W.add('goldenTimeline');
assert(old && old.type === 'goldenCookies' && old.axis === 'now' && old.title === 'Golden timeline', 'adding an old type adds its Golden cookies equivalent');

// ---- the Stats page's tiles explain themselves the same way
CA.UI.Menu.openPage('stats');
await sleep(50);
const tileTip = (label) => [...doc.querySelectorAll('[data-st-spawn] .ca-stat')].find((t) => t.querySelector('.ca-stat-label').textContent === label).getAttribute('data-tip');
eq([tileTip('Multiplier'), tileTip('Frequency'), tileTip('Expected wait')], ['golden.frequency', 'golden.interval', 'golden.wait'].map(CA.StatInfo.desc), 'the Stats page’s Multiplier, Frequency and Expected wait tiles: the same descriptions');

// ---- the Stats page's ☆: a Golden cookies widget showing how often they come
W.list().forEach((x) => W.remove(x.id));
CA.UI.Menu.openPage('stats');
await sleep(50);
const star = () => doc.querySelector('[data-st-spawn] .ca-sp-factors [data-w-star]');
assert(star() && /Golden cookies/.test(star().dataset.tip), 'the frequency row’s ☆ names the Golden cookies widget');
click(w, star());
const s = W.list()[0];
eq([W.list().length, s && s.type, s && s.stats, s && s.nums], [1, 'goldenCookies', ['numbers', 'helping'], ['frequency', 'every']], 'clicking it adds one: the multiplier, the frequency, what’s helping');
CA.UI.Menu.openPage('stats');
assert(star().classList.contains('on'), 'its star fills');
W.load(W.serialize());
CA.UI.Menu.openPage('stats');
assert(star().classList.contains('on'), '…still after a reload (lists match by value)');
W.list()[0].stats = ['numbers'];
CA.UI.Menu.openPage('stats');
assert(!star().classList.contains('on'), 'set up differently, it’s no longer that preset');

// ---- a saved layout profile (v3.38) with the old types: migrated the same way when the game loads
const save = JSON.parse(CA.Settings.serialize());
save.widgetProfiles = { profiles: [{ id: 'p1', name: 'Combo', widgets: [{ id: 'a', type: 'goldenTimeline', x: 0.1, y: 0.1 }, { id: 'b', type: 'goldenFrequency', x: 0.2, y: 0.2 }] }] };
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: JSON.stringify(save) });
await sleep(400);
const W2 = g2.window.CookieMgr.UI.Widgets;
const pw = W2.profileOf('p1').widgets;
eq(pw.map((x) => [x.type, x.title, x.axis || null]), [['goldenCookies', 'Golden timeline', 'now'], ['goldenCookies', 'Golden cookie frequency', null]], 'a saved layout’s old golden widgets become Golden cookies widgets');
eq(W2.useProfile('p1'), 2, '…and Use places them');
eq(W2.list().map((x) => x.type).join(), 'goldenCookies,goldenCookies', '…as Golden cookies widgets');
assert(g2.errors.length === 0, 'no runtime errors after loading' + (g2.errors.length ? `: ${g2.errors.slice(0, 3).join(' | ')}` : ''));

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
