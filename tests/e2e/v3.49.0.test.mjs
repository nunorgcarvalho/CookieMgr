// v3.49.0: payback periods read in time units by default — seconds, then minutes, hours, days,
// years, the next unit only past 999 (999 s, then 16.7 min) — with a Payback page option for the
// old plain seconds (Cookie Monster's 999, 1K).
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({});
const { window: w, Game } = g;
const doc = w.document;
const CA = w.CookieMgr;
await sleep(300);
const F = CA.Format;

// ---- the formatter ----
assert(CA.Settings.get('ppUnits') === 'time', 'time units by default');
const cases = [
  [0, '0 s'],
  [0.5, '0.5 s'],
  [12.34, '12.3 s'],
  [999, '999 s'],
  [999.4, '999 s'],
  [999.6, '16.7 min'],
  [1000, '16.7 min'],
  [59940, '999 min'],
  [60000, '16.7 h'],
  [999 * 3600, '999 h'],
  [1000 * 3600, '41.7 d'],
  [1000 * 86400, '2.74 y'],
  [5000 * 365 * 86400, '5K y'],
  [Infinity, '∞'],
];
for (const [v, want] of cases) assert(F.payback(v) === want, `${v} s → ${want} (${F.payback(v)})`);

// ---- the old display ----
CA.Settings.set('ppUnits', 'seconds');
assert(F.payback(999) === '999' && F.payback(1000) === '1K' && F.payback(150000) === '150K', `plain seconds (${F.payback(1000)})`);
assert(F.payback(Infinity) === '∞', '∞ either way');
CA.Settings.set('ppUnits', 'time');

// ---- statistics and the script word use it ----
assert(CA.Stats.format(1000, 'payback') === '16.7 min', `the payback format (${CA.Stats.format(1000, 'payback')})`);

// ---- the Payback page: its option, and the tables in units ----
const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false }));
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.cookies = 1e4;
await sleep(1200);
CA.UI.Menu.openPage('payback');
await sleep(50);
const page = () => doc.querySelector('#CookieMgrMenu [data-page="payback"]');
const chips = () => [...page().querySelectorAll('[data-pp-pick="ppUnits"]')];
assert(chips().length === 2, 'Payback periods in: two chips');
assert(chips().find((c) => c.dataset.v === 'time').classList.contains('on'), 'time units on');
const cells = () => [...page().querySelectorAll('[data-pp-buildings] b')].map((b) => b.textContent);
assert(cells().some((t) => t !== '∞') && cells().every((t) => /^(∞|[\d.]+K? (s|min|h|d|y))$/.test(t)), `building cells in units (${cells().slice(0, 4)})`);
click(w, chips().find((c) => c.dataset.v === 'seconds'));
await sleep(50);
assert(CA.Settings.get('ppUnits') === 'seconds', 'the chip sets seconds');
assert(cells().every((t) => !/ (s|min|h|d|y)$/.test(t)), `building cells in plain seconds (${cells().slice(0, 4)})`);

done();
process.exit();
