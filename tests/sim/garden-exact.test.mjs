// The Garden page's gardeners kept in the real game (sim/models/gardenExact.mjs), the check on the
// fast model: the game's garden code, the gardener's rules, the model's bookkeeping — and createSim's
// fps, which the game used to put back to 30.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';
import { gardenData } from '../../sim/models/gardenData.mjs';
import { exactGarden } from '../../sim/models/gardenExact.mjs';
import { frequencyStudy } from '../../sim/models/gardenFrequency.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();
const data = await gardenData();

const s1 = await createSim({ fps: 1, mgr: false });
s1.run({ seconds: 10 });
assert(s1.Game.fps === 1 && s1.t === 10, `fps 1: one frame a simulated second (Game.fps ${s1.Game.fps}, ${s1.t} s)`);

const model = frequencyStudy(data, { level: 8, hours: 1000, seeds: 2, tulips: [4], only: ['goldenCombos', 'tulips4'] });
for (const id of ['goldenCombos', 'tulips4']) {
  const e = await exactGarden(data, { id, level: 8, tulips: [4], hours: 24, seed: 1 });
  const m = model.results.find((r) => r.id === id);
  const sum = e.bins.reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 1) < 1e-9 && e.errors === 0, `${id}: the histogram covers all the time, no errors in the game (${sum}, ${e.errors})`);
  assert(
    Math.abs(e.mean - m.mean) < 0.08,
    `${id}: the real game, 24 h, near the model's long run (+${(e.mean * 100).toFixed(1)}% against +${(m.mean * 100).toFixed(1)}%)`
  );
  assert(e.cps <= 1 && Math.abs(e.cps - m.cps) < 0.02, `${id}: CpS ×${e.cps.toFixed(3)} against the model's ×${m.cps.toFixed(3)}`);
}
done();
