// The Manager widget. It shows what the active manager is doing: its stages in a strip, the one
// it's on (for how long, its profiles in or waiting), what moves it on (each condition of the stage's
// "until", ticked as it holds, a season's drops counted), the stage's own watched numbers, and the
// macros it switched on at work. Each stage carries a watch list (Managers page); Nunix late game's
// stages come with theirs, and a save from v4.0 gets them. The Managers page's ☆ adds the widget.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const G = CA.Managers;
const M = CA.Macros;
const Wd = CA.UI.Widgets;
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

// ---- the seeded stages watch things ----
const nunix = G.find('nunixLateGame');
assert(nunix.stages.every((st) => Array.isArray(st.watch) && st.watch.length), 'every Nunix stage watches something');
nunix.stages.forEach((st) =>
  G.watchOf(st).forEach((x) => assert(!x.error, `${st.name}: ${x.label} (${x.value}) works out${x.error ? `: ${x.error}` : ''}`))
);
// (not what their "until" counts already: Santa, the Easter eggs, the reindeer cookies)
const labels = nunix.stages.map((st) => st.watch.map((x) => x.label)).flat();
assert(!['Santa', 'Easter eggs', 'Reindeer cookies'].some((l) => labels.includes(l)), `no watch repeats the until: ${labels.join(', ')}`);

// ---- an until taken apart ----
const has = Game.Has;
Game.Has = (n) => n === 'Shimmering veil [off]' || has(n);
const veil = G.untilParts('not veil()');
assert(veil && veil.parts.length === 1 && !veil.parts[0].ok && /not veil\(\) \(now yes\)/.test(veil.parts[0].text), `not veil(): ${veil && veil.parts[0].text}`);
Game.Has = has;
const drops = G.untilParts(nunix.stages[0].until);
eq(drops.join, 'and', 'Drops: all of');
eq(drops.parts.length, 4, 'Drops: four seasons');
assert(drops.parts.every((p) => Number.isFinite(p.have) && Number.isFinite(p.of)), 'each counts its drops');
Game.cookies = 50;
const two = G.untilParts('cookies() > 10 or cookies() > 100');
assert(two.join === 'or' && two.parts[0].ok && !two.parts[1].ok, 'or: each part on its own');
assert(G.untilParts('') === null && G.untilParts('cookies( >') === null, 'none, or a broken one: null');

// ---- the widget ----
M.set('manager', false, { silent: true });
G.goTo(1);
G.step();
const inst = Wd.add('manager');
assert(inst && Wd.labelOf(inst) === 'Nunix late game', 'the widget is named after the manager');
let h = CA.UI.ManagerWidget.html(inst);
assert(/ca-mw-st on[^>]*>1<em>Drops<\/em>/.test(h), 'the strip lights stage 1 with its name');
assert(!/<b>Drops<\/b>/.test(h) && !/stage 1 of 3/.test(h) && /On this stage for/.test(h), 'Now, under the strip: only for how long (the strip names it)');
assert(!/>Santa</.test(h) && !/Easter eggs/.test(h), 'no Santa or Easter eggs: Next stage when counts them');
inst.stats = ['now'];
h = CA.UI.ManagerWidget.html(inst);
assert(/<b>Drops<\/b>/.test(h) && /stage 1 of 3/.test(h), 'Now on its own: the stage, and where it is');
delete inst.stats;
h = CA.UI.ManagerWidget.html(inst);
assert(/The Manager macro is off/.test(h), 'it says while the Manager macro is off');
assert(/0 of 4|[1-4] of 4/.test(h) && /ca-mw-bar/.test(h) && /Research/.test(h) && /Next research/.test(h), 'what moves it on (how many of its four conditions hold, with bars), and what it watches (the research)');
{
  // the research: how far along (all 9), and the next one
  const val = (id) => CA.Script.VALUES.find((v) => v.id === id).get();
  const before = Game.Has;
  Game.Has = (n) => ['Specialized chocolate chips', 'Designer cocoa beans', 'Ritual rolling pins'].includes(n) || before(n);
  const rw = G.watchOf(nunix.stages[0]).find((x) => x.label === 'Research');
  const nx = G.watchOf(nunix.stages[0]).find((x) => x.label === 'Next research');
  assert(JSON.stringify(rw.value) === '[3,9]' && rw.format === 'progress', `Research: 3 of 9 (${JSON.stringify(rw.value)})`);
  assert(nx.value === 'Underworld ovens' && val('researchNext') === 'Underworld ovens', `Next research: Underworld ovens (${nx.value})`);
  Game.Has = (n) => CA.AutoBuy.RESEARCH.includes(n) || before(n);
  assert(val('researchNext') === '', 'all done: ""');
  Game.Has = before;
}
assert(/ca-mw-mac/.test(h) && !/ca-mw-act/.test(h), 'the macros it switched on; not the activity by default');
G.goTo(2);
G.step();
h = CA.UI.ManagerWidget.html(inst);
assert(/ca-mw-st done[^>]*>✓/.test(h) && /ca-mw-st on[^>]*>2<em>Reindeer<\/em>/.test(h), 'on to stage 2: stage 1 done, Reindeer lit');
assert(/Next reindeer in/.test(h), 'Reindeer: its watches');
G.goTo(3);
G.step();
h = CA.UI.ManagerWidget.html(inst);
assert(!/The last stage/.test(h) && !/ca-mw-p-until/.test(h) && /Combo on/.test(h), 'the last stage, under the strip: no Next stage when; Combos watches the combo');
inst.stats = ['until'];
assert(/The last stage/.test(CA.UI.ManagerWidget.html(inst)), 'Next stage when on its own: the last stage lasts');
delete inst.stats;
inst.stats = ['activity'];
h = CA.UI.ManagerWidget.html(inst);
assert(/ca-mw-act|haven’t done anything/.test(h) && !/ca-mw-strip/.test(h), 'only the parts picked');
inst.stats = [];
assert(/Pick what to show/.test(CA.UI.ManagerWidget.html(inst)), 'none picked: says so');
delete inst.stats;
CA.UI.Widgets.render();
assert(doc.querySelector('#CookieMgrWidgets .ca-mw'), 'drawn on the left panel');

// ---- the settings: a live tile per part ----
CA.UI.Menu.openPage('widgets');
Wd.openSettings(inst.id);
CA.UI.Menu.render();
const ed = doc.querySelector('[data-page="widgets"] [data-w-editor]');
eq(ed && ed.querySelectorAll('.ca-wsample[data-w-sample^="stats:"]').length, CA.UI.ManagerWidget.PARTS.length, 'a sample tile per part');

// ---- the Managers page: ☆, and each stage's watch list ----
Wd.remove(inst.id);
CA.UI.Menu.openPage('managers');
const page = () => doc.querySelector('[data-page="managers"]');
const star = page().querySelector('.ca-wstar');
assert(star && !Wd.hasPreset(CA.UI.ManagerWidget.PRESET), 'the Manager card has a ☆');
click(w, star);
assert(Wd.hasPreset(CA.UI.ManagerWidget.PRESET), '☆ puts the widget on the left panel');
// (stage tabs: the shown stage's watches, folded away until opened)
click(w, page().querySelector('[data-mgr-act="tab"][data-i="0"]'));
assert(!page().querySelector('[data-mgr-watchbox]').open, 'folded away at first');
click(w, page().querySelector('[data-mgr-watchbox] > summary'));
CA.UI.Menu.render();
assert(page().querySelector('[data-mgr-watchbox]').open, 'opened, it stays open');
eq(page().querySelectorAll('.ca-mgr-watch').length, nunix.stages[0].watch.length, 'a row per watched value');
click(w, page().querySelector('[data-mgr-act="addWatch"][data-i="0"]'));
eq(G.find('nunixLateGame').stages[0].watch.length, 3, '+ Watch a value');
// the value is a line of code (its words hover like the editor's)
const input = page().querySelector('[data-code-ed="watch:0:2"] [data-code]');
input.value = 'lumps()';
input.dispatchEvent(new w.Event('input', { bubbles: true }));
input.dispatchEvent(new w.Event('change', { bubbles: true }));
const label = page().querySelector('[data-mgr-watch][data-i="0"][data-j="2"][data-field="label"]');
label.value = 'Lumps';
label.dispatchEvent(new w.Event('change', { bubbles: true }));
eq(JSON.stringify(G.find('nunixLateGame').stages[0].watch[2]), JSON.stringify({ label: 'Lumps', value: 'lumps()', format: 'auto' }), 'edited');
G.setStageWatch('nunixLateGame', 0, [{ label: 'Bad', value: 'cookies( >' }]);
CA.UI.Menu.render();
assert(page().querySelector('.ca-mgr-watch .ca-mgr-problem'), 'a broken value is reported');
click(w, page().querySelector('[data-mgr-act="delWatch"][data-i="0"][data-j="0"]'));
eq(G.find('nunixLateGame').stages[0].watch.length, 0, '× stops watching it');

// ---- saved; a v4.0 save gets the seed's lists, one you emptied stays empty ----
const S = CA.Settings;
const saved = JSON.parse(S.serialize());
S.load(JSON.stringify(saved));
eq(G.find('nunixLateGame').stages[0].watch.length, 0, 'an emptied list stays empty');
eq(G.find('nunixLateGame').stages[1].watch.length, 4, 'the others kept');
saved.managers.managers.forEach((m) => m.stages.forEach((st) => delete st.watch));
S.load(JSON.stringify(saved));
assert(G.find('nunixLateGame').stages.every((st, i) => st.watch.length === G.SEEDS[0].stages[i].watch.length), 'a save from v4.0: Nunix’s stages get their watch lists');
// a save with the watches since retired (they repeated the until): without them, the rest kept
saved.managers.managers.find((m) => m.id === 'nunixLateGame').stages[0].watch = [
  { label: 'Santa', value: '[santaLevel(), 14]', format: 'progress' },
  { label: 'Easter eggs', value: '[owned(easter), total(easter)]', format: 'progress' },
  { label: 'Lumps', value: 'lumps()', format: 'auto' },
];
saved.managers.managers.find((m) => m.id === 'nunixLateGame').stages[1].watch = [{ label: 'Reindeer cookies', value: '[owned(christmas, cookies), total(christmas, cookies)]', format: 'progress' }];
S.load(JSON.stringify(saved));
eq(G.find('nunixLateGame').stages[0].watch.map((x) => x.label).join(), 'Lumps', 'a save with Santa and the Easter eggs watched: without them');
eq(G.find('nunixLateGame').stages[1].watch.length, 0, '…and without the reindeer cookies');

M.list().forEach((m) => M.isOn(m.id) && M.set(m.id, false, { silent: true }));
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
