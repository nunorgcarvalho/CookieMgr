// The Full-garden replanter's two ways of starting a round, in the real game: at once, or just before the next tick — and the Steady replanter beside them.
//
//   npm run sim -- experiment garden-replant-modes [--hours 24] [--seeds 3] [--jobs N]
//
// The exact simulator (the game's code, CookieMgr's code) on the garden6 scenario: a level-6
// golden clover field. Three ways of keeping it, each the add-on's own built-ins as they come:
//   end      the "Golden clover combos" profile — Full-garden replanter (replantAtTick = false: a
//            new round planted the moment too few mature clovers are left) + "Grow together, then clay"
//   tick     the same with replantAtTick = true (fertilizer first; the old clovers keep working until
//            the next tick; everything replanted in its last plantWindow seconds)
//   steady   the "Golden clover field" profile — Steady replanter (each clover replanted as it dies)
// Every simulated second the garden's golden cookie frequency effect is read off the game (Farm
// minigame M.effs, what Game.eff() multiplies in), after a first hour of filling up. Combos need two
// effects at once, so they go with frequency squared: (1 + bonus)² is reported too, and the share
// of the time at +60% or more. Each mode × seed runs in its own process.
import { fork } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const hours = Number(arg('hours', 24));
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const MODES = ['end', 'tick', 'steady'];

/** One run: { mode, seed, gc, gc2, hi, plantings, wallS }. */
async function one(mode, seed) {
  const { createSim } = await import('../sim.mjs');
  const scenario = (await import('../scenarios/garden6.mjs')).default;
  const sim = await createSim({ seed, sampleEvery: 0 });
  scenario.prepare(sim);
  const L = sim.CA.GardenLayers;
  L.loadProfile(mode === 'steady' ? 'goldenClovers' : 'goldenCombos');
  if (mode === 'tick') {
    const g = L.get('gardener', 'cohort');
    L.set('gardener', 'cohort', { ...g.data, rules: g.data.rules.replace(/^replantAtTick = false/m, 'replantAtTick = true') });
    if (!/^replantAtTick = true/m.test(L.get('gardener', 'cohort').data.rules)) throw new Error('replantAtTick not set');
  }
  sim.macro('gardener');
  const M = sim.Game.Objects.Farm.minigame;
  const wall = Date.now();
  let s1 = 0;
  let s2 = 0;
  let hi = 0;
  let n = 0;
  while (sim.t < hours * 3600) {
    sim.run({ seconds: 1 });
    if (sim.t < 3600) continue;
    const gc = (M.effs && M.effs.goldenCookieFreq ? M.effs.goldenCookieFreq : 1) - 1;
    s1 += gc;
    s2 += (1 + gc) ** 2;
    if (gc >= 0.6) hi++;
    n++;
  }
  const planted = sim.actions.filter((a) => /^garden\.(plantEmpty|plant)$/.test(a.id)).reduce((a, x) => a + x.n, 0);
  return { mode, seed, gc: s1 / n, gc2: s2 / n, hi: hi / n, plantings: planted / hours, wallS: (Date.now() - wall) / 1000 };
}

if (process.argv.includes('--one')) {
  const r = await one(arg('mode', 'end'), Number(arg('seed', 1)));
  process.send(r);
  process.exit(0);
} else {
  const seeds = Number(arg('seeds', 3));
  const jobs = Number(arg('jobs', Math.max(1, Math.min(6, Math.floor(os.cpus().length / 2)))));
  const specs = [];
  for (let s = 1; s <= seeds; s++) MODES.forEach((m) => specs.push([m, s]));
  const me = fileURLToPath(import.meta.url);
  const results = [];
  let next = 0;
  const t0 = Date.now();
  await new Promise((resolve) => {
    let running = 0;
    const launch = () => {
      if (next >= specs.length) return running || resolve();
      const [m, s] = specs[next++];
      running++;
      const c = fork(me, ['--one', '--mode', m, '--seed', String(s), '--hours', String(hours)], { silent: true });
      c.on('message', (r) => results.push(r));
      c.on('exit', () => {
        running--;
        process.stderr.write(`\r  ${results.length}/${specs.length} runs (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
        launch();
      });
    };
    for (let k = 0; k < jobs; k++) launch();
  });
  process.stderr.write('\n');
  const stat = (xs) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
    return { m, sd };
  };
  console.log(`Level-6 golden clover field (garden6), ${hours} h per run (the first hour left out), ${seeds} seeds\n`);
  console.log(`${'mode'.padEnd(8)} ${'golden cookie freq'.padEnd(22)} ${'(1+bonus)²'.padEnd(18)} ${'≥ +60% of the time'.padEnd(20)} plantings/h   per seed`);
  MODES.forEach((m) => {
    const rs = results.filter((r) => r.mode === m).sort((a, b) => a.seed - b.seed);
    if (!rs.length) return;
    const g = stat(rs.map((r) => r.gc));
    const g2 = stat(rs.map((r) => r.gc2));
    const h = stat(rs.map((r) => r.hi));
    const p = stat(rs.map((r) => r.plantings));
    console.log(`${m.padEnd(8)} ${`+${pct(g.m)} ± ${(g.sd * 100).toFixed(1)}`.padEnd(22)} ${`${g2.m.toFixed(3)} ± ${g2.sd.toFixed(3)}`.padEnd(18)} ${`${pct(h.m)} ± ${(h.sd * 100).toFixed(1)}`.padEnd(20)} ${p.m.toFixed(1).padEnd(12)} ${rs.map((r) => `+${pct(r.gc)}`).join(' ')}`);
  });
  const by = (m) => results.filter((r) => r.mode === m).sort((a, b) => a.seed - b.seed);
  const [e, t] = [by('end'), by('tick')];
  if (e.length && e.length === t.length) {
    const d = e.map((r, i) => r.gc - t[i].gc);
    const ds = stat(d);
    console.log(`\nend − tick, seed by seed (same seed, same golden cookies to start with): ${d.map((x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}`).join(' ')} points → mean ${ds.m >= 0 ? '+' : ''}${(ds.m * 100).toFixed(2)} ± ${((ds.sd / Math.sqrt(d.length)) * 100).toFixed(2)} (standard error)`);
  }
  console.log(`\n${results.length} runs in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
