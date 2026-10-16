// Replant a golden clover field tile by tile, or all at once? Steady replanting against planting the whole field together.
//
//   npm run sim -- experiment garden-clover-cohort [--level 6] [--hours 6000]
//
// Steady: the Effect maximizer (replant each tile at once; fertilizer while more than θ is young).
// Cohort: the whole field on fertilizer, clay once `matureAt` of it is mature, replanted all at
// once when fewer than `below` of the tiles hold a mature clover. Combos go with frequency squared,
// so (1+gc)² is reported as well as the average bonus.
import { gardenData, plotAt } from '../models/gardenData.mjs';
import { cloverField } from '../models/garden.mjs';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const level = Number(arg('level', 6));
const hours = Number(arg('hours', 6000));
const data = await gardenData();
const { w, h } = plotAt(data, level);
const layout = 'G'.repeat(w * h);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const line = (name, r) => console.log(name.padEnd(46), `avg +${pct(r.gc)}`.padEnd(13), `(1+gc)² ${r.gc2.toFixed(3)}`.padEnd(16), `≥+60%: ${pct(r.hi)}`.padEnd(14), `${r.plantings.G.toFixed(1)} plantings/h`);
console.log(`level ${level} (${w}×${h}) golden clover field, ${hours} h each\n`);
line('steady, θ = 0.9', cloverField(data, { layout, w, h, theta: 0.9, hours }));
line('steady, θ = 0.67 (the built-in soil rule)', cloverField(data, { layout, w, h, theta: 0.67, hours }));
for (const matureAt of [0.6, 0.7, 0.8])
  for (const below of [0.6, 0.7, 0.8]) line(`cohort: clay at ${matureAt * 100}% mature, replant < ${below * 100}%`, cloverField(data, { layout, w, h, policy: 'cohort', matureAt, below, hours }));
