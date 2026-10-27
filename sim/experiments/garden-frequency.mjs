// How the golden cookie frequency bonus is spread over the time, gardener by gardener (golden clovers, with and without nursetulips).
//
//   npm run sim -- experiment garden-frequency [--level 8] [--hours 1000] [--seeds 3] [--tulips 4,8] [--json]
//
// The fast model models/gardenFrequency.mjs: each gardener kept on the plot of a Farm level for
// `hours` × `seeds`, the bonus weighed by game time. For each: its mean, the share of the time at
// +50% / +100% / +125% or more, its CpS (nursetulips take 2% each when grown), fertilizer time, and
// with nursetulips the golden zone — every nursetulip fully grown: how much of the time, how long a
// stretch lasts, how soon the first comes, and how much of it has every clover mature as well.
// CookieSimMgr's Garden page draws the same results as histograms (--json is what it reads).
import { gardenData } from '../models/gardenData.mjs';
import { frequencyStudy } from '../models/gardenFrequency.mjs';
import { showLayout } from '../models/garden.mjs';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const level = Number(arg('level', 8));
const hours = Number(arg('hours', 1000));
const seeds = Number(arg('seeds', 3));
const tulips = String(arg('tulips', '4,8')).split(',').filter(Boolean).map(Number);
const only = arg('only', '') ? String(arg('only', '')).split(',') : null;

const study = frequencyStudy(await gardenData(), { level, hours, seeds, tulips, only });
if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(study));
} else {
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const atLeast = (r, x) => r.bins.reduce((a, v, k) => a + (k * study.bin >= x - 1e-9 ? v : 0), 0);
  console.log(`Farm level ${level} (${study.w}×${study.h}), ${hours} h × ${seeds} seeds per gardener\n`);
  for (const r of study.results) {
    console.log(`${r.name}\n${showLayout(r.layout, study.w).replace(/^/gm, '    ')}`);
    console.log(
      `  golden cookie frequency +${pct(r.mean)} on average (best +${pct(r.peak)}); ≥ +50% ${pct(atLeast(r, 0.5))}, ≥ +100% ${pct(atLeast(r, 1))}, ≥ +125% ${pct(atLeast(r, 1.25))} of the time`
    );
    console.log(
      `  CpS ×${r.cps.toFixed(3)}, fertilizer ${pct(r.fert)} of the time, ${(r.plantings.G + r.plantings.N).toFixed(1)} plantings an hour`
    );
    if (r.zone)
      console.log(
        `  golden zone (every nursetulip grown): ${pct(r.zone.share)} of the time, ${r.zone.stretch.toFixed(1)} h at a stretch, the first after ${r.zone.first.toFixed(1)} h; every clover mature too ${pct(r.zone.cloversMax)} of it`
      );
    console.log('');
  }
}
