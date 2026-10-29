// Payback by actual income: PPa = PP × CpS ÷ A(W), A(W) what the Recorder says you took in over the last
// W seconds of play, W = max(5 min, PPa) (a fixed point); null with under a minute recorded; read from
// the Recorder in windows 25% apart, each at most every 5 s. Shown by the Payback page's "actual
// income" chip and as a line in the store's tooltips. The Recorder's data is only read.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const P = CA.Payback;

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false });
});
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 1e4;
Game.CalculateGains();
const C = Game.cookiesPs;
assert(C > 0, `a CpS (${C})`);

// the Recorder, stubbed: what you took in depends on the window asked for
const R = CA.Recorder;
const recent = R.recent;
let calls = 0;
let income = () => 2 * C;
let recorded = 1e6;
R.recent = (secs) => (calls++, { actual: income(secs), secs: Math.min(secs, recorded), cps: C });
// a new 5 s period for the memo: the clock moved on 6 s
const realNow = Date.now;
let offset = 0;
Date.now = () => realNow() + offset;
w.Date.now = Date.now;
const fresh = () => {
  offset += 6000;
};
const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

// ---- twice the CpS: half the period
fresh();
let a = P.ppActual(1000);
assert(a && near(a.pp, 500) && near(a.ratio, 2), `2× CpS taken in: 1000 s → ${a && a.pp} s`);
assert(P.ppActual(Infinity).pp === Infinity, 'never pays back stays never');
assert(P.ppActual(NaN) === null, 'NaN (a switch): none');

// ---- the window is the period: 2× over the last 10 minutes, 1× over longer
income = (secs) => (secs <= 600 ? 2 * C : C);
fresh();
a = P.ppActual(1000);
assert(a && near(a.pp, 1000) && a.window >= 1000, `a 1000 s period: judged on ${a && a.window} s (1×) → ${a && a.pp}`);
a = P.ppActual(400);
assert(a && near(a.pp, 200) && a.window === 300, `a 400 s period: 2× → 200 s, judged on the 5-minute floor (${a && a.window})`);
a = P.ppActual(100);
assert(a && near(a.pp, 50) && a.window === 300, 'a short period: still at least 5 minutes of income');

// ---- the fixed point: W = max(300, PPa), to the 25% window step
income = (secs) => C * (1 + 3000 / secs); // the shorter the window, the more above CpS
fresh();
a = P.ppActual(5000);
const W = Math.max(300, a.pp);
assert(a.window >= W / 1.25 - 1e-6 && a.window <= W * 1.25 + 1e-6, `fixed point: window ${a.window.toFixed(0)} s ≈ PPa ${a.pp.toFixed(0)} s (within a step)`);
assert(near(a.pp, (5000 * C) / income(a.window)), 'PPa = PP × CpS ÷ A(window)');

// ---- read sparingly
fresh();
calls = 0;
for (let i = 0; i < 60; i++) P.ppActual(100 + i * 50);
const first = calls;
for (let i = 0; i < 60; i++) P.ppActual(100 + i * 50);
assert(first > 0 && first <= 20 && calls === first, `60 periods: ${first} Recorder reads (one per window), then none within 5 s`);

// ---- too little recorded
recorded = 30;
fresh();
assert(P.ppActual(1000) === null, 'under a minute recorded: none');
recorded = 1e6;
income = () => 0;
fresh();
assert(P.ppActual(1000).pp === Infinity, 'nothing taken in: never');
income = () => 1.5 * C;
fresh();

// ---- words
assert(near(CA.Script.VALUES.find((v) => v.id === 'paybackActual').get(1500), 1000), 'paybackActual(1500) at 1.5×: 1000');
assert(near(CA.Script.VALUES.find((v) => v.id === 'actualIncome').get(600), 1.5 * C), 'actualIncome(600)');

// ---- the Payback page: the chip, the cells (v3.43: the chip is the Actual income payback mode)
CA.Settings.set('ppMode', 'cps');
CA.UI.Menu.openPage('payback');
await sleep(100);
const chip = w.document.querySelector('[data-pp-mode="actualIncome"]');
assert(chip && chip.textContent.includes(CA.Format.short(1.5 * C)), `the chip: actual income ${CA.Format.short(1.5 * C)}/s (${chip && chip.textContent.trim()})`);
const cellPP = () => w.document.querySelector('.ca-pp-cell b').textContent;
const cps = cellPP();
chip.click();
await sleep(100);
assert(CA.Settings.get('ppMode') === 'actualIncome', 'clicking it: by actual income');
const t = P.table();
const row = t.buildings[1].Cursor;
assert(cellPP() !== cps && cellPP() === CA.Format.payback(row.pp) && row.mode === 'actualIncome', `cells show the actual-income period (${cps} → ${cellPP()})`);
assert(/by Actual income/.test(w.document.querySelector('.ca-pp-cell').dataset.tip), 'and say so in their tip'); // actual-income window: the one mode is Actual income again
CA.Settings.set('ppMode', 'cps');

// ---- the store tooltip: a line
CA.Settings.set('storeTooltips', true);
Game.buyMode = 1;
const tt = CA.UI.StoreInsight.buildingBlock(Game.Objects.Grandma);
assert(/Payback period, actual income/.test(tt) && !/×1\.50 CpS/.test(tt), 'the store tooltip: Payback period, actual income (upgrade income line: no ×CpS note)');

R.recent = recent;
Date.now = realNow;
w.Date.now = realNow;
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
