// A small dip to one side of zero only stretches a linear axis as far as it goes: the Garden effects chart with
// +60% golden cookie frequency and nursetulips' −11% CpS ends just under −11%, not a whole tick step down (−20%).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const M = makeGarden(Game);
const CA = w.CookieMgr;
M.plot[2][1] = [M.plants.nursetulip.id + 1, 70];
const effs = (o) => (M.effs = Object.assign({ cps: 1, click: 1, goldenCookieFreq: 1 }, o));
// a garden that has only ever had these effects
const only = (o) => {
  effs(o);
  CA.GardenHistory.list().length = 0;
  CA.GardenHistory.sample();
};
effs({ cps: 0.886, goldenCookieFreq: 1.6 });
await sleep(1600);
CA.GardenHistory.sample();

CA.UI.Menu.openPage('garden');
await sleep(100);
const E = CA.UI.Plot.get('gardenEffects');
const scale = () => (E.tick(), E.last().scale);
let s = scale();
assert(s.yMin < -11.4 && s.yMin > -15, `the axis ends just under the CpS dip (${s.yMin.toFixed(1)}%)`);
assert(s.yMax >= 60 && s.ticks[0] === 0 && s.ticks.every((t) => t >= s.yMin && t <= s.yMax), `ticks from 0 up, all on the axis (${s.ticks.join(', ')})`);

// mostly below zero, a small rise above it: the same, flipped
only({ cps: 0.4, goldenCookieFreq: 1.05 });
s = scale();
assert(s.yMax > 5 && s.yMax < 10 && s.yMin <= -60 && s.ticks[s.ticks.length - 1] === 0, `a small rise: the axis ends just over it (${s.yMin.toFixed(1)} to ${s.yMax.toFixed(1)}; ${s.ticks.join(', ')})`);

// both sides big: round ticks both ways, as before
only({ cps: 0.5, goldenCookieFreq: 1.6 });
s = scale();
assert(s.yMin <= -50 && s.ticks.includes(0) && s.ticks.some((t) => t < 0), `both sides big: whole steps both ways (${s.ticks.join(', ')})`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
