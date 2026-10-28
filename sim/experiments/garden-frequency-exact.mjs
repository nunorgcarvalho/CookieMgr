// The Garden page's fast model against the real game: each gardener kept in the exact simulator, side by side with the model.
//
//   npm run sim -- experiment garden-frequency-exact [--level 8] [--hours 200] [--seeds 2] [--tulips 4,8] [--only goldenCombos,tulips4] [--fps 1] [--json]
//
// models/gardenExact.mjs: the game's own garden code on a Farm level's plot, a driver doing what each
// gardener does (the model's rules), the golden cookie frequency bonus read off the game every
// simulated second, in the model's bookkeeping. Gardeners × seeds run in parallel processes. For each
// gardener, the exact simulator's mean, share of the time at +100% or more, CpS and golden zone next
// to the fast model's (models/gardenFrequency.mjs, 1000 h × 3). --json: { exact, model } in the shape
// the Garden page reads (frequencyStudy's).
import os from 'node:os';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gardenData } from '../models/gardenData.mjs';
import { exactGarden } from '../models/gardenExact.mjs';
import { frequencyStudy, BIN } from '../models/gardenFrequency.mjs';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const level = Number(arg('level', 8));
const hours = Number(arg('hours', 200));
const seeds = Number(arg('seeds', 2));
const fps = Number(arg('fps', 1));
const tulips = String(arg('tulips', '4,8')).split(',').filter(Boolean).map(Number);
const only = arg('only', '') ? String(arg('only', '')).split(',') : null;
const data = await gardenData();

// a child process: one gardener, one seed
if (arg('one', null)) {
  const [id, seed] = arg('one').split(':');
  const r = await exactGarden(data, { id, level, tulips, hours, seed: Number(seed), fps });
  process.send(r);
  process.exit(0);
}

const model = frequencyStudy(data, { level, hours: 1000, seeds: 3, tulips, only });
const jobs = model.results.flatMap((g) => Array.from({ length: seeds }, (_, s) => ({ id: g.id, seed: s + 1 })));
const out = {};
const wall = Date.now();
await new Promise((resolve, reject) => {
  let next = 0;
  let running = 0;
  const start = () => {
    if (next >= jobs.length) return running || resolve();
    const j = jobs[next++];
    running++;
    const args = ['--one', `${j.id}:${j.seed}`, '--level', level, '--hours', hours, '--fps', fps, '--tulips', tulips.join(',')].map(String);
    const child = fork(fileURLToPath(import.meta.url), args, { silent: true });
    child.on('message', (r) => ((out[j.id] = out[j.id] || []).push(r)));
    child.on('exit', (code) => {
      if (code) return reject(new Error(`${j.id} seed ${j.seed} failed (exit ${code})`));
      running--;
      process.stderr.write(`\r  ${jobs.length - next + running} to go (${((Date.now() - wall) / 1000).toFixed(0)} s)   `);
      start();
    });
  };
  for (let k = 0; k < Math.max(1, os.cpus().length); k++) start();
});
process.stderr.write('\n');

const avg = (runs, f) => runs.reduce((a, r) => a + f(r), 0) / runs.length;
const exact = {
  ...model,
  hours,
  seeds,
  fps,
  results: model.results.map((g) => {
    const runs = out[g.id];
    const nBins = Math.max(...runs.map((r) => r.bins.length));
    return {
      ...g,
      mean: avg(runs, (r) => r.mean),
      cps: avg(runs, (r) => r.cps),
      fert: avg(runs, (r) => r.fert),
      peak: Math.max(...runs.map((r) => r.peak)),
      bins: Array.from({ length: nBins }, (_, k) => avg(runs, (r) => r.bins[k] || 0)),
      zone: runs[0].zone
        ? { share: avg(runs, (r) => r.zone.share), stretch: avg(runs, (r) => r.zone.stretch), first: avg(runs, (r) => r.zone.first || 0), cloversMax: avg(runs, (r) => r.zone.cloversMax) }
        : null,
      plantings: { G: avg(runs, (r) => r.plantings.G), N: avg(runs, (r) => r.plantings.N) },
      seedMeans: runs.map((r) => r.mean),
      strays: runs.reduce((a, r) => a + r.strays, 0),
    };
  }),
};
if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ exact, model }));
} else {
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const atLeast = (r, x) => r.bins.reduce((a, v, k) => a + (k * BIN >= x - 1e-9 ? v : 0), 0);
  console.log(`Farm level ${level} (${model.w}×${model.h}): the real game ${hours} h × ${seeds} seeds (fps ${fps}) | the fast model 1000 h × 3\n`);
  for (const e of exact.results) {
    const m = model.results.find((x) => x.id === e.id);
    console.log(e.name);
    console.log(`  mean          +${pct(e.mean).padEnd(8)} | +${pct(m.mean)}   (seeds: ${e.seedMeans.map((x) => '+' + pct(x)).join(', ')})`);
    console.log(`  ≥ +100%        ${pct(atLeast(e, 1)).padEnd(8)} |  ${pct(atLeast(m, 1))}`);
    console.log(`  CpS           ×${e.cps.toFixed(3).padEnd(8)} | ×${m.cps.toFixed(3)}`);
    console.log(`  fertilizer     ${pct(e.fert).padEnd(8)} |  ${pct(m.fert)}`);
    if (e.zone) console.log(`  golden zone    ${pct(e.zone.share).padEnd(8)} |  ${pct(m.zone.share)}`);
    console.log('');
  }
}
