// The fast garden model against the real thing: cookieMgr's Auto-gardener keeping a golden clover field in the real game.
//
//   npm run sim -- experiment garden-exact [--hours 12] [--seed 1] [--theta 0.67]
//
// The exact simulator — the game's own code with cookieMgr's own code in it — on the garden6
// scenario, the Auto-gardener running the built-in "Golden clover field" profile (Effect maximizer,
// its soil rule with fertilizerAbove = θ). Every simulated second the garden's golden cookie
// frequency effect is read off the game (Farm minigame M.effs, what Game.eff() multiplies in), and
// averaged; the model (models/garden.mjs cloverField) predicts the same number for the same policy.
// They should agree to within the noise of the run's length (garden ticks are 3–15 minutes).
import { createSim } from '../sim.mjs';
import scenario from '../scenarios/garden6.mjs';
import { gardenData, plotAt } from '../models/gardenData.mjs';
import { cloverField } from '../models/garden.mjs';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const hours = Number(arg('hours', 12));
const seed = Number(arg('seed', 1));
const theta = Number(arg('theta', 0.67));
const pct = (x) => `${(x * 100).toFixed(1)}%`;

const sim = await createSim({ seed, sampleEvery: 0 });
scenario.prepare(sim);
const L = sim.CA.GardenLayers;
L.loadProfile('goldenClovers');
// the soil rule's threshold, as you'd set it on the Garden page
const soil = L.get('soil', L.picked('soil'));
L.set('soil', soil.id, { rules: soil.data.rules.replace(/^fertilizerAbove = [\d.]+/m, `fertilizerAbove = ${theta}`) });
sim.macro('gardener');
const M = sim.Game.Objects.Farm.minigame;

let sum = 0;
let n = 0;
const wall = Date.now();
const total = hours * 3600;
while (sim.t < total) {
  sim.run({ seconds: 1 });
  // the first two hours: the field filling up (the model's numbers are for the long run)
  if (sim.t < 7200) {
    continue;
  }
  sum += (M.effs && M.effs.goldenCookieFreq ? M.effs.goldenCookieFreq : 1) - 1;
  n++;
  if (n % 3600 === 0) process.stderr.write(`\r  ${(sim.t / 3600).toFixed(0)} h: +${pct(sum / n)} so far (${((Date.now() - wall) / 1000).toFixed(0)} s)`);
}
process.stderr.write('\n');
const planted = sim.actions.filter((a) => /^garden\.(plantEmpty|plant)$/.test(a.id)).reduce((a, x) => a + x.n, 0);
const data = await gardenData();
const { w, h } = plotAt(data, sim.Game.Objects.Farm.level);
const model = cloverField(data, { layout: 'G'.repeat(w * h), w, h, theta, hours: 4000 });
console.log(`\nGolden clover field, level ${sim.Game.Objects.Farm.level} (${w}×${h}), soil rule θ = ${theta}, seed ${seed}`);
console.log(`  exact (the real game + cookieMgr's Auto-gardener), ${hours - 2} h after a 2 h start:  +${pct(sum / n)} golden cookie frequency, ${(planted / hours).toFixed(1)} plantings/h`);
console.log(`  model (models/garden.mjs, 4000 h):                                   +${pct(model.gc)} golden cookie frequency, ${model.plantings.G.toFixed(1)} plantings/h`);
console.log(`  simulated ${hours} h of game in ${((Date.now() - wall) / 1000).toFixed(0)} s`);
