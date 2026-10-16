// Are nursetulips worth it in a golden clover field? The best layouts with k nursetulips, at every Farm level.
//
//   npm run sim -- experiment garden-nursetulips [--levels 6,7,8,9] [--hours 6000] [--theta 0.9]
//
// Each layout run as the Effect maximizer runs it (models/garden.mjs cloverField): replanted at
// once, harvested before dying at 50%, fertilizer while more than θ of the field is young.
import { gardenData, plotAt } from '../models/gardenData.mjs';
import { cloverField, bestNurseLayout, showLayout } from '../models/garden.mjs';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const levels = String(arg('levels', '6,7,8,9')).split(',').map(Number);
const hours = Number(arg('hours', 6000));
const theta = Number(arg('theta', 0.9));
const data = await gardenData();
const pct = (x) => `${(x * 100).toFixed(1)}%`;
for (const level of levels) {
  const { w, h } = plotAt(data, level);
  const layouts = new Set();
  for (const s of [0.35, 0.6, 1]) for (let k = 0; k <= Math.floor((w * h) / 2); k++) layouts.add(bestNurseLayout(w, h, k, s));
  const rows = [...layouts].map((layout) => ({ layout, k: layout.split('N').length - 1, ...cloverField(data, { layout, w, h, theta, hours }) }));
  rows.sort((a, b) => b.gc - a.gc);
  const base = rows.find((r) => r.k === 0);
  console.log(`\nlevel ${level} (${w}×${h}): golden clover only +${pct(base.gc)} golden cookie frequency, ${(base.plantings.G).toFixed(1)} plantings/h`);
  rows.slice(0, 3).forEach((r) =>
    console.log(`\n  ${r.k} nursetulips: +${pct(r.gc)} (${(((1 + r.gc) / (1 + base.gc)) * 100 - 100).toFixed(1)}% more golden cookies), CpS ×${r.cps.toFixed(3)}, ${(r.plantings.G + r.plantings.N).toFixed(1)} plantings/h\n${showLayout(r.layout, w).replace(/^/gm, '    ')}`)
  );
}
