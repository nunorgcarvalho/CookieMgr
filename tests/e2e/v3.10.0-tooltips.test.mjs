// v3.10.0: the store tooltip's lines are yours to choose: which lines
// CookieMgr's block under the store's tooltips shows, in what order — the built-in lines (Cookie
// Monster's layout by default) and any value word taking the building / upgrade or nothing, read as a
// number, a time or a chance; edited on the Payback page (add, move, rename, remove, reset) with a
// live preview. The bank warnings are off by default now.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const SI = CA.UI.StoreInsight;

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  const b = Game.Objects[n];
  Object.assign(b, { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false });
  b.tooltip = () => `<div class="name">${n}</div>`;
});
const kitten = new Game.Upgrade('Kitten helpers', 5000);
kitten.type = 'upgrade';
Game.UpgradesInStore = [kitten];
Game.crateTooltip = (me) => `<div class="name">${me.name}</div>`;
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])), mults: { 'Kitten helpers': 1.5 } });
Game.cookies = 1e4;
Game.buyMode = 1;
Game.buyBulk = 1;
await sleep(700);
const rowsOf = (html) => [...html.matchAll(/<div class="ca-tt-row"><span>(.*?)<\/span><b[^>]*>(.*?)<\/b><\/div>/g)].map((m) => [m[1], m[2]]);
const tip = (n) => Game.Objects[n].tooltip();
const labels = (html) => rowsOf(html).map((r) => r[0]);

// ---- the default: Cookie Monster's layout, no bank warnings
assert(SI.isDefault() && SI.lines().join() === SI.DEFAULT_LINES.join(), 'the default lines');
let l = labels(tip('Grandma'));
assert(/^Bonus income/.test(l[0]) && l[1] === 'Payback period' && l.includes('Affordable') && l.includes('Share of production') && l.includes('Next achievement'), `Cookie Monster's layout: ${l.join(' · ')}`);
assert(!l.includes('Per click'), 'a building has no Per click line (an upgrade’s)');
assert(CA.Settings.get('storeWarnings') === false, 'bank warnings: off by default');

// ---- your lines, in your order
SI.setLines(['price', 'payback']);
l = labels(tip('Grandma'));
assert(l.join() === 'Price,Payback period', `just those, in that order (${l.join()})`);
assert(rowsOf(tip('Grandma'))[0][1] === CA.Format.beautify(CA.Payback.sumPrice(Game.Objects.Grandma, 1)), 'Price: what a click buys');

// ---- words as lines
SI.setLines(['payback', { word: 'building.toNextAchievement', label: 'To the next achievement' }, { word: 'building.payback', fmt: 'time' }, { word: 'clickRate', fmt: 'number' }, { word: 'golden.chanceWithin' }, { word: 'no.such.word' }]);
const r = rowsOf(tip('Farm'));
const by = Object.fromEntries(r);
assert(by['To the next achievement'] === String(CA.Script.VALUES.find((v) => v.id === 'building.toNextAchievement').get('Farm')), `a word of the building, renamed (${by['To the next achievement']})`);
assert(by['building.payback'] === CA.Format.span(CA.Script.VALUES.find((v) => v.id === 'building.payback').get('Farm')), `read as a time (${by['building.payback']})`);
assert('clickRate' in by, 'a word of nothing (the game): clickRate');
assert(!('golden.chanceWithin' in by) && !('no.such.word' in by), 'a word needing something else (seconds), or no word: left out');
// auto: seconds read as a time, 0–1 as a chance
SI.setLines([{ word: 'building.payback' }, { word: 'golden.chanceWithin' }]);
assert(rowsOf(tip('Farm'))[0][1] === CA.Format.span(CA.Script.VALUES.find((v) => v.id === 'building.payback').get('Farm')), 'auto: a word in seconds reads as a time');

// ---- an upgrade's block
SI.setLines(['share', 'payback', { word: 'upgrade.payback', fmt: 'time' }, { word: 'building.payback' }]);
const ul = labels(Game.crateTooltip(kitten, 'store'));
assert(ul.join() === 'Payback period,upgrade.payback', `an upgrade: only lines and words that fit it (${ul.join()})`);

// ---- warnings, when on, under the lines
CA.Settings.set('storeWarnings', true);
const lucky = CA.GoldenMath.lucky().bank;
Game.cookies = lucky + CA.Payback.sumPrice(Game.Objects.Grandma, 1) / 2;
assert(/ca-tt-warn/.test(tip('Grandma')), 'warnings on: shown');
CA.Settings.set('storeWarnings', false);
assert(!/ca-tt-warn/.test(tip('Grandma')), 'off: none');
Game.cookies = 1e4;

// ---- the layout card (v3.25: on the Tooltips page)
SI.setLines(null);
CA.UI.Menu.openPage('tooltips');
await sleep(50);
const card = () => doc.querySelector('[data-page="tooltips"] [data-tl-lines]');
const names = () => [...card().querySelectorAll('.ca-tl-row')].map((x) => (x.querySelector('.ca-tl-name') || x.querySelector('.ca-tl-label')).textContent || x.querySelector('.ca-tl-label').value);
assert(card() && names().length === SI.DEFAULT_LINES.length, `a row per line (${names().length})`);
assert(!card().querySelector('[data-tl-reset]'), 'the default: no reset button');
const preview = () => doc.querySelector('[data-page="tooltips"] [data-tl-preview]');
assert(preview() && /ca-tt-row/.test(preview().innerHTML) && /Kitten helpers/.test(preview().textContent), 'a live preview: a building and the best upgrade');
// move the second up
click(w, card().querySelectorAll('[data-tl-up]')[1]);
assert(SI.lines()[0] === SI.DEFAULT_LINES[1] && SI.lines()[1] === SI.DEFAULT_LINES[0], 'move up');
assert(card().querySelector('[data-tl-reset]'), 'changed: a reset button');
// remove the first
click(w, card().querySelector('[data-tl-del]'));
assert(SI.lines().length === SI.DEFAULT_LINES.length - 1 && SI.lines()[0] === SI.DEFAULT_LINES[0], 'remove');
// add a word
const add = card().querySelector('[data-tl-add]');
add.value = 'w:building.toNextAchievement';
add.dispatchEvent(new w.Event('change', { bubbles: true }));
const last = SI.lines()[SI.lines().length - 1];
assert(last && last.word === 'building.toNextAchievement', 'add a word');
assert(/building\.toNextAchievement/.test(preview().textContent), 'the preview follows');
// rename it, and how it reads
const label = [...card().querySelectorAll('[data-tl-label]')].pop();
label.value = 'Until the next';
label.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(SI.lines()[SI.lines().length - 1].label === 'Until the next' && /Until the next/.test(tip('Grandma')), 'rename it: the tooltip says so');
const fmt = [...card().querySelectorAll('[data-tl-fmt]')].pop();
fmt.value = 'chance';
fmt.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(SI.lines()[SI.lines().length - 1].fmt === 'chance', 'choose how it reads');
// add a built-in back
add.value = 'bonus';
const add2 = card().querySelector('[data-tl-add]');
add2.value = 'bonus';
add2.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(SI.lines().includes('bonus'), 'add a line back');
assert(![...card().querySelectorAll('[data-tl-add] option')].some((o) => o.value === 'bonus'), 'a line in use isn’t offered again');
// the preview's building
const pick = preview().querySelector('[data-tl-b]');
pick.value = 'Cursor';
pick.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(/Bonus income \(×1\)/.test(preview().innerHTML) && preview().querySelector('[data-tl-b]').value === 'Cursor', 'preview another building');
// the warnings switch here
click(w, doc.querySelector('[data-page="tooltips"] [data-tl-opt="storeWarnings"]'));
assert(CA.Settings.get('storeWarnings') === true, 'the Bank warnings switch, on the card');
// back to Cookie Monster's
click(w, doc.querySelector('[data-page="tooltips"] [data-tl-reset]'));
assert(SI.isDefault() && names().length === SI.DEFAULT_LINES.length, 'reset: Cookie Monster’s layout');

// ---- kept with your settings
SI.setLines(['payback', { word: 'clickRate', fmt: 'number', label: 'Clicks/s' }]);
const saved = JSON.parse(JSON.stringify(CA.Settings.get('storeTooltipLines')));
assert(saved.length === 2 && saved[1].label === 'Clicks/s', 'a plain list: saved with the settings');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
