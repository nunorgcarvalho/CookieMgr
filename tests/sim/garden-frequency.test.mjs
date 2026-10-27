// The Garden page's fast model (sim/models/gardenFrequency.mjs): golden cookie frequency over game
// time, gardener by gardener — histograms that add up, means that match them, the game's limits,
// the nursetulips' golden zone, and the same garden for the same seed.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { gardenData } from '../../sim/models/gardenData.mjs';
import { frequencyStudy, runGarden, gardeners } from '../../sim/models/gardenFrequency.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();
const data = await gardenData();

const st = frequencyStudy(data, { level: 8, hours: 400, seeds: 2, tulips: [4] });
assert(st.w === 6 && st.h === 5, `Farm level 8: a 6×5 plot (${st.w}×${st.h})`);
const by = Object.fromEntries(st.results.map((r) => [r.id, r]));
assert(
  ['goldenClovers', 'goldenCombos', 'tulips4', 'tulips4Fert', 'tulips4Together'].every((id) => by[id]),
  `the gardeners: ${st.results.map((r) => r.id)}`
);
for (const r of st.results) {
  const sum = r.bins.reduce((a, b) => a + b, 0);
  const mid = r.bins.reduce((a, v, k) => a + v * (k + 0.5) * st.bin, 0);
  assert(Math.abs(sum - 1) < 1e-9, `${r.id}: the histogram covers all the time (${sum})`);
  assert(Math.abs(mid - r.mean) <= st.bin / 2, `${r.id}: its mean (+${(r.mean * 100).toFixed(1)}%) sits inside its histogram`);
}
// 30 mature clovers on clay, nothing boosting them: 30 × 3% × 1.25 = +112.5% at most
assert(by.goldenClovers.peak <= 1.125 + 1e-9 && by.goldenCombos.peak <= 1.125 + 1e-9, 'without nursetulips, never above +112.5%');
assert(by.tulips4.peak > 1.125 && by.tulips4.cps < 1 && by.goldenClovers.cps === 1, 'nursetulips: higher peaks, at some CpS');
assert(
  by.goldenCombos.mean > by.goldenClovers.mean,
  `planted together beats replanted one by one (+${(by.goldenCombos.mean * 100).toFixed(0)}% against +${(by.goldenClovers.mean * 100).toFixed(0)}%)`
);
assert(
  by.tulips4.zone && by.tulips4.zone.share > 0 && by.tulips4.zone.share < 1 && !by.goldenClovers.zone,
  'the golden zone: only with nursetulips, some of the time'
);
assert(by.tulips4Together.zone.share > by.tulips4.zone.share, 'nursetulips replanted together are fully grown together more of the time');
assert(by.tulips4Fert.fert > by.tulips4.fert, 'fertilizer for the nursetulips too: more time on fertilizer');

const g = gardeners(6, 5, [4]).find((x) => x.id === 'tulips4');
const a = runGarden(data, { ...g, w: 6, h: 5, hours: 100, seed: 7 });
const b = runGarden(data, { ...g, w: 6, h: 5, hours: 100, seed: 7 });
assert(JSON.stringify(a) === JSON.stringify(b), 'the same seed, the same garden');
done();
