// Strategies and models: every strategy file is code CookieMgr's own compiler accepts (so it can be
// pasted into the add-on as it is), a strategy runs to a report, and the fast garden models take
// their numbers from the game and agree with its rules.
import fs from 'node:fs';
import path from 'node:path';
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';
import { STRATEGIES, parseCmgr, loadStrategy } from '../../sim/strategy.mjs';
import { runOne, parseSpan } from '../../sim/runner.mjs';
import { gardenData, plotAt } from '../../sim/models/gardenData.mjs';
import { decayChance, cloverField, plantPolicy, bestNurseLayout } from '../../sim/models/garden.mjs';

const { assert, done } = makeAssert();

// ---- the .cmgr format
const c = parseCmgr('# A strategy.\n# with: golden, bigCookie\n# every: 250\n# profile: goldenClovers\nbuy.best(all)\n# every: 9\n');
assert(c.every === 250 && c.with.join() === 'golden,bigCookie' && c.profile === 'goldenClovers', 'header comments: every, with, profile (only the leading ones)');
assert(JSON.stringify(parseSpan('90m')) === '{"minutes":90}' && JSON.stringify(parseSpan('2')) === '{"hours":2}' && JSON.stringify(parseSpan('1d')) === '{"days":1}', 'spans');

await gameOrSkip();

// ---- every strategy compiles with CookieMgr's compiler
const sim = await createSim({ seed: 1 });
const files = fs.readdirSync(STRATEGIES).filter((f) => f.endsWith('.cmgr'));
assert(files.length >= 3, `strategy files (${files.join(', ')})`);
for (const f of files) {
  const { errors } = sim.CA.Script.compile(parseCmgr(fs.readFileSync(path.join(STRATEGIES, f), 'utf8')).source);
  assert(!errors.length, `${f} compiles with CookieMgr's own compiler${errors.length ? ` — line ${errors[0].line}: ${errors[0].message}` : ''}`);
}
const combo = await loadStrategy('golden+payback');
assert(/golden \+ payback/.test(combo.name), 'strategies join with +');

// ---- a strategy runs to a report
const r = await runOne({ strategy: 'payback', span: '10m', seed: 4, sampleEvery: 60 });
assert(Math.round(r.simSeconds) === 600 && r.final.cookiesEarned > 0 && r.actions['click.bigCookie'] > 10000 && r.actions['buy.best'] > 5 && r.samples.length >= 10, `payback: ${Math.round(r.final.cookiesEarned)} baked, ${r.actions['buy.best']} purchases`);
assert(Object.keys(r.buildings).length >= 2 && r.errors === 0, `buildings: ${JSON.stringify(r.buildings)}`);

// ---- the garden's numbers, from the game's own minigameGarden.js
const data = await gardenData();
const gc = data.plants.goldenClover;
const nt = data.plants.nursetulip;
assert(gc.ageTick === 4 && gc.ageTickR === 12 && gc.mature === 50 && nt.ageTick === 0.5 && nt.ageTickR === 2 && nt.mature === 60, 'golden clover and nursetulip, as the game has them');
assert(data.soils.fertilizer.tick === 3 && data.soils.fertilizer.effMult === 0.75 && data.soils.clay.tick === 15 && data.soils.clay.effMult === 1.25 && data.soils.woodchips.req === 300, 'soils, as the game has them');
const p6 = plotAt(data, 6);
assert(p6.w === 5 && p6.h === 4 && plotAt(data, 9).w === 6 && plotAt(data, 9).h === 6, 'plot sizes by Farm level');
assert(Object.keys(data.plants).length >= 34 && /golden cookie frequency/.test(gc.effects), `${Object.keys(data.plants).length} plants, with their effects`);

// ---- the models follow the game's rules
const wheat = data.plants.bakerWheat;
const rf = (x) => Math.floor(x) + (Math.random() < x - Math.floor(x) ? 1 : 0);
let dead = 0;
for (let i = 0; i < 200000; i++) if (92 + rf(wheat.ageTick + wheat.ageTickR * Math.random()) >= 100) dead++;
assert(Math.abs(decayChance(wheat, 92) - dead / 200000) < 0.01, `death chance: exact against the game's aging, simulated (${decayChance(wheat, 92).toFixed(3)} vs ${(dead / 200000).toFixed(3)})`);
assert(plantPolicy(gc, 0.5, 50000).effect > plantPolicy(gc, 2, 50000).effect, 'golden clover: harvesting before death beats letting it die');
const field = cloverField(data, { layout: 'G'.repeat(20), w: 5, h: 4, theta: 0.9, hours: 1500 });
assert(field.gc > 0.45 && field.gc < 0.53 && field.cps === 1, `a level-6 golden clover field: about +49% (${(field.gc * 100).toFixed(1)}%)`);
const cohort = cloverField(data, { layout: 'G'.repeat(20), w: 5, h: 4, policy: 'cohort', matureAt: 0.7, below: 0.7, hours: 1500 });
assert(cohort.gc > field.gc, `replanting the whole field together beats tile by tile (${(cohort.gc * 100).toFixed(1)}%)`);
assert(bestNurseLayout(5, 4, 4) === 'GGGGGGNGNGGNGNGGGGGG', 'the best 4-nursetulip layout on a 5 × 4 plot: the middle');

done();
process.exit();
