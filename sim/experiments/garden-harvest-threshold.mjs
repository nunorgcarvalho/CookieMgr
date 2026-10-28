// Harvest a mature plant before it dies of old age — or let it die? Every mortal plant, its average effect under each policy.
//
//   npm run sim -- experiment garden-harvest-threshold [--ticks 150000]
//
// A plant kept on one tile forever, harvested-and-replanted just before a tick when it's more than
// θ likely to die on it (cookieMgr's garden.harvestDying(θ); the Effect maximizer uses 0.5), or let
// die. Ages and death chances are the game's (models/garden.mjs, numbers from minigameGarden.js).
import { gardenData } from '../models/gardenData.mjs';
import { plantPolicy } from '../models/garden.mjs';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const ticks = Number(arg('ticks', 150000));
const data = await gardenData();
const pc = (x) => `${(x * 100).toFixed(1)}%`.padStart(7);
console.log(`${'plant'.padEnd(18)} let die   >50%   best    (θ)         gain of >50% over letting die`);
const rows = Object.entries(data.plants)
  .filter(([, p]) => !p.immortal)
  .map(([key, p]) => {
    const never = plantPolicy(p, 2, ticks);
    const half = plantPolicy(p, 0.5, ticks);
    let best = { theta: 2, ...never };
    for (let th = 0; th < 1; th += 0.05) {
      const r = plantPolicy(p, th, Math.round(ticks / 2));
      if (r.effect > best.effect) best = { theta: th, ...r };
    }
    return { key, name: p.name, never, half, best };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
rows.forEach((r) =>
  console.log(r.name.padEnd(18), pc(r.never.effect), pc(r.half.effect), pc(r.best.effect), (r.best.theta > 1 ? '(let die)' : `(over ${Math.round(r.best.theta * 100)}%)`).padEnd(11), `${((r.half.effect / r.never.effect - 1) * 100).toFixed(1)}%`)
);
