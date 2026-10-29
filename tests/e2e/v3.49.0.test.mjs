// v3.49.0: payback periods read in time units by default — since payback-short-units, the largest
// two of s/m/h/d (45s, 16m 40s, 3h 12m, 2d 5h; days the largest unit) — with a Payback page option for the
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
  [0, '0s'],
  [0.5, '0.5s'],
  [9.94, '9.9s'],
  [12.34, '12s'],
  [59.4, '59s'],
  [59.6, '1m'],
  [1000, '16m 40s'],
  [3599.6, '1h'],
  [11520, '3h 12m'],
  [86399, '1d'],
  [2 * 86400 + 5 * 3600, '2d 5h'],
  [99 * 86400 + 23.6 * 3600, '100d'],
  [365 * 86400, '365d'],
  [12345 * 86400, '12,345d'],
  [5e6 * 86400, '5M d'],
  [-90, '-1m 30s'],
  [Infinity, '∞'],
];
for (const [v, want] of cases) assert(F.payback(v) === want, `${v} s → ${want} (${F.payback(v)})`);

// ---- the old display ----
CA.Settings.set('ppUnits', 'seconds');
assert(F.payback(999) === '999' && F.payback(1000) === '1K' && F.payback(150000) === '150K', `plain seconds (${F.payback(1000)})`);
assert(F.payback(Infinity) === '∞', '∞ either way');
CA.Settings.set('ppUnits', 'time');

// ---- statistics and the script word use it ----
assert(CA.Stats.format(1000, 'payback') === '16m 40s', `the payback format (${CA.Stats.format(1000, 'payback')})`);

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
assert(cells().some((t) => t !== '∞') && cells().every((t) => /^(∞|[\d.,]+[smhd]( \d+[smh])?)$/.test(t)), `building cells in units (${cells().slice(0, 4)})`);
click(w, chips().find((c) => c.dataset.v === 'seconds'));
await sleep(50);
assert(CA.Settings.get('ppUnits') === 'seconds', 'the chip sets seconds');
assert(cells().every((t) => !/[smhd]$/.test(t)), `building cells in plain seconds (${cells().slice(0, 4)})`);

done();
process.exit();
