// actual-income depths: payback modes by actual income at three set depths — Actual, 15 min / 1 h / 3 h
// (actualIncome15m, actualIncome1h, actualIncome3h; short names actual15m, actual1h, actual3h): what
// you took in over the last 15 minutes, hour or 3 hours of play. The old Actual income mode stays,
// as Actual, custom, on the ppActualWindow option. payback.actualIncome(minutes) takes a window.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const P = CA.Payback;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false });
});
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 50;
Game.CalculateGains();
Game.computedMouseCps = Game.mouseCps();
const RAW = Game.cookiesPsRaw;

// the Recorder, stubbed: the shorter the window, the more you took in (a combo just now)
const R = CA.Recorder;
let recorded = 1e6;
const ratio = (secs) => (secs <= 900 ? 20 : secs <= 3600 ? 8 : secs <= 10800 ? 3 : 5);
R.recent = (secs) => ({ actual: ratio(secs) * RAW, secs: Math.min(secs, recorded), cps: RAW, clickRate: 0 });
const realNow = Date.now;
let offset = 0;
Date.now = () => realNow() + offset;
w.Date.now = Date.now;
const later = () => (offset += 6000); // past the 5 s memo

// ---- the modes
const ids = ['actualIncome15m', 'actualIncome1h', 'actualIncome3h'];
assert(P.modes().map((m) => m.id).join() === `rawCps,cps,cpsClicking,${ids.join()},actualIncome`, `three more modes, before the custom one (${P.modes().map((m) => m.id)})`);
assert(ids.map((id) => P.modeOf(id).label).join() === 'Actual, 15 min,Actual, 1 h,Actual, 3 h', 'labelled by their window');
assert(P.modeOf('actualIncome').label === 'Actual, custom', 'the old one: Actual, custom');
assert(P.modeOf('actual15m').id === ids[0] && P.modeOf('actual1h').id === ids[1] && P.modeOf('actual3h').id === ids[2] && P.modeOf('actual').id === 'actualIncome', 'short names');
assert(ids.every((id) => CA.Stats.get(id).mode && CA.Stats.get(id).group === 'Payback modes'), 'each is a statistic on the Payback modes shelf');

// ---- each reads its own window, whatever the option says
CA.Settings.set('ppActualWindow', '30');
later();
assert(near(P.income('actual15m'), 20 * RAW) && near(P.income('actual1h'), 8 * RAW) && near(P.income('actual3h'), 3 * RAW), 'income over 15 min, 1 h, 3 h');
assert(near(P.income('actual'), 8 * RAW), 'the custom one: the option’s 30 minutes');
CA.Settings.set('ppActualWindow', '180');
later();
assert(near(P.income('actual'), 3 * RAW) && near(P.income('actual15m'), 20 * RAW), 'the option moves the custom one only');

// ---- payback periods and gains scale by each one's ratio
const farm = () => P.table().buildings[1].Farm;
const raw = farm().bonus;
[['actualIncome15m', 20], ['actualIncome1h', 8], ['actualIncome3h', 3]].forEach(([id, k]) => {
  CA.Settings.set('ppMode', id);
  later();
  const row = farm();
  assert(row.mode === id && near(row.gain, k * raw), `${id}: the gain is ${k}× its raw gain`);
  assert(near(row.pp, (row.price - 50) / (k * RAW) + row.price / row.gain), `${id}: the payback period in that income`);
});
const c = CA.Stats.contextOf('Farm', 'building');
const inMode = (m) => CA.Stats.about(c, () => value('item.paybackIn', m));
assert(inMode('actual15m') < inMode('actual1h') && inMode('actual1h') < inMode('actual3h'), 'item.paybackIn takes them: more income, shorter');

// ---- the word
assert(near(value('payback.actualIncome', 15), 20 * RAW) && near(value('payback.actualIncome', 180), 3 * RAW), 'payback.actualIncome(minutes)');
assert(near(value('payback.actualIncome'), 3 * RAW), 'payback.actualIncome(): the custom window');
const compiled = CA.Script.compile('return payback.actualIncome(60)', { mode: 'stat' });
assert(!compiled.errors.length, 'it compiles with a window');

// ---- too little recorded: not ready; under the window, what there is
recorded = 30;
later();
assert(P.mode().id === 'cps', 'under a minute recorded: cps until it is');
recorded = 1200;
later();
assert(P.mode().id === 'actualIncome3h' && near(P.income(), 3 * RAW), '20 minutes recorded: the 3 h mode averages what there is');

// ---- the Payback page: a chip each
CA.UI.Menu.openPage('payback');
await sleep(100);
const chips = () => [...doc.querySelectorAll('[data-pp-mode]')];
assert(ids.every((id) => chips().some((b) => b.dataset.ppMode === id)), 'a chip each on the Payback page');
chips()
  .find((b) => b.dataset.ppMode === 'actualIncome1h')
  .click();
await sleep(50);
assert(CA.Settings.get('ppMode') === 'actualIncome1h', 'clicking one picks it');

Date.now = realNow;
w.Date.now = realNow;
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
