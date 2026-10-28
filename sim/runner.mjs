// Running strategies: one simulation (runOne), or many side by side in separate processes
// (runMany — strategies × seeds, a few at a time), and what came out of them (report).
import { fork } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createSim } from './sim.mjs';
import { loadStrategy } from './strategy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SCENARIOS = path.join(HERE, 'scenarios');

/** A scenario (the state a simulation starts from): a file in sim/scenarios/, or "fresh" (a new game). */
export async function loadScenario(name = 'fresh') {
  if (!name || name === 'fresh') return { name: 'fresh', options: {}, prepare: () => {} };
  const file = [name, path.join(SCENARIOS, name), path.join(SCENARIOS, `${name}.mjs`)].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!file) throw new Error(`No scenario "${name}" (sim/scenarios/)`);
  const mod = (await import(pathToFileURL(path.resolve(file)).href)).default;
  return { name: mod.name || name, desc: mod.desc, options: mod.options || {}, prepare: mod.prepare || (() => {}) };
}

/** Spans like "2h", "30m", "90s", "1d" (or a number of hours). */
export function parseSpan(s) {
  if (typeof s === 'number') return { hours: s };
  const m = String(s).match(/^([\d.]+)\s*(d|h|m|s)?$/i);
  if (!m) throw new Error(`Not a span: ${s} (try 2h, 30m, 90s)`);
  const n = Number(m[1]);
  const u = (m[2] || 'h').toLowerCase();
  return u === 'd' ? { days: n } : u === 'm' ? { minutes: n } : u === 's' ? { seconds: n } : { hours: n };
}

/**
 * One simulation: the scenario prepared, the strategy set up, played for `span`. Returns a report
 * (plain data — it crosses process boundaries).
 */
export async function runOne({ strategy, scenario = 'fresh', seed = 1, span = '1h', fps = 30, sampleEvery = 60, save = null, saveOut = null, onProgress } = {}) {
  const sc = await loadScenario(scenario);
  const st = await loadStrategy(strategy);
  const wall = Date.now();
  // save: a file with an exported save (Options → Export save) — your own game, cookieMgr's settings included
  const saveText = save ? fs.readFileSync(save, 'utf8').trim() : null;
  const sim = await createSim({ seed, fps, sampleEvery, ...sc.options, ...(saveText ? { save: saveText } : {}) });
  await sc.prepare(sim);
  st.setup(sim);
  sim.run(parseSpan(span), { onProgress });
  if (saveOut) fs.writeFileSync(saveOut, sim.exportSave());
  return report(sim, { strategy: st.name, scenario: save ? `${sc.name} + ${path.basename(save)}` : sc.name, seed, wallMs: Date.now() - wall });
}

/** What a simulation did, as plain data. */
export function report(sim, meta = {}) {
  const tally = {};
  sim.actions.forEach((a) => (tally[a.id] = (tally[a.id] || 0) + (a.n || 0)));
  const events = {};
  sim.events().forEach((e) => {
    const k = e.type === 'golden' || e.type === 'wrath' ? `${e.type}: ${((e.data && e.data.effects) || []).map((x) => x.name).join('+') || e.title}` : e.type;
    events[k] = (events[k] || 0) + 1;
  });
  const G = sim.Game;
  return {
    ...meta,
    simSeconds: sim.t,
    final: sim.stats(),
    buildings: Object.fromEntries(Object.values(G.Objects).filter((o) => o.amount).map((o) => [o.name, o.amount])),
    upgrades: Object.values(G.Upgrades).filter((u) => u.bought && u.pool !== 'prestige').map((u) => u.name),
    actions: tally,
    events,
    samples: sim.samples.map((s) => ({ t: s.t, cookiesEarned: s.cookiesEarned, cps: s.cps })),
    errors: sim.errors().length,
  };
}

/** Runs many simulations in child processes, `jobs` at a time: [{ strategy, scenario, seed, span }] → reports. */
export function runMany(specs, { jobs = Math.max(1, Math.min(os.cpus().length - 1, 6)), onDone } = {}) {
  const cli = path.join(HERE, 'cli.mjs');
  const results = new Array(specs.length);
  let next = 0;
  let running = 0;
  return new Promise((resolve) => {
    const launch = () => {
      if (next >= specs.length) {
        if (!running) resolve(results);
        return;
      }
      const i = next++;
      const s = specs[i];
      running++;
      const child = fork(cli, ['run', s.strategy, '--scenario', s.scenario || 'fresh', '--seed', String(s.seed || 1), '--span', String(s.span || '1h'), '--fps', String(s.fps || 30), ...(s.save ? ['--save', s.save] : []), '--json', '-'], { silent: true });
      let out = '';
      let err = '';
      child.stdout.on('data', (d) => (out += d));
      child.stderr.on('data', (d) => (err += d));
      child.on('close', (code) => {
        running--;
        try {
          results[i] = JSON.parse(out.slice(out.indexOf('{')));
        } catch (e) {
          results[i] = { ...s, failed: true, error: (err || out || `exit ${code}`).slice(-2000) };
        }
        if (onDone) onDone(results[i], i);
        launch();
      });
    };
    for (let k = 0; k < jobs && k < specs.length; k++) launch();
    if (!specs.length) resolve(results);
  });
}

// ---- printing ---------------------------------------------------------------------------------

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
export function fmt(n) {
  if (!Number.isFinite(n)) return String(n);
  const a = Math.abs(n);
  if (a < 1000) return (Math.round(n * 10) / 10).toString();
  const k = Math.min(SUFFIX.length - 1, Math.floor(Math.log10(a) / 3));
  return `${(n / 10 ** (3 * k)).toFixed(2)}${SUFFIX[k]}`;
}
export const span = (s) => (s >= 3600 ? `${(s / 3600).toFixed(s % 3600 ? 1 : 0)} h` : s >= 60 ? `${(s / 60).toFixed(0)} min` : `${s.toFixed(0)} s`);

export function printReport(r) {
  const f = r.final;
  console.log(`\n${r.strategy}  ·  scenario ${r.scenario}  ·  seed ${r.seed}  ·  ${span(r.simSeconds)} simulated in ${(r.wallMs / 1000).toFixed(1)} s (${Math.round(r.simSeconds / (r.wallMs / 1000))}× real time)`);
  console.log(`  baked ${fmt(f.cookiesEarned)}  ·  bank ${fmt(f.cookies)}  ·  CpS ${fmt(f.cps)}  ·  ${f.buildings} buildings, ${f.upgrades} upgrades, ${f.achievements} achievements  ·  ${fmt(f.clicks)} clicks, ${f.goldenClicks} golden cookies`);
  const b = Object.entries(r.buildings);
  if (b.length) console.log(`  buildings: ${b.map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const a = Object.entries(r.actions).sort((x, y) => y[1] - x[1]);
  if (a.length) console.log(`  actions:   ${a.map(([k, v]) => `${k} ×${fmt(v)}`).join(', ')}`);
  const e = Object.entries(r.events).sort((x, y) => y[1] - x[1]);
  if (e.length) console.log(`  events:    ${e.slice(0, 10).map(([k, v]) => `${k} ×${v}`).join(', ')}`);
  if (r.errors) console.log(`  ${r.errors} error(s) in timers — run with --verbose to see them`);
}

/** Many reports, grouped by strategy: mean ± sd of what was baked and the final CpS. */
export function printComparison(reports) {
  const by = new Map();
  reports.forEach((r) => {
    if (!by.has(r.strategy)) by.set(r.strategy, []);
    by.get(r.strategy).push(r);
  });
  const stat = (xs) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
    return { m, sd };
  };
  const rows = [...by].map(([name, rs]) => {
    const ok = rs.filter((r) => !r.failed);
    return { name, n: ok.length, failed: rs.length - ok.length, baked: stat(ok.map((r) => r.final.cookiesEarned)), cps: stat(ok.map((r) => r.final.cps)) };
  });
  rows.sort((a, b) => b.baked.m - a.baked.m);
  const w = Math.max(...rows.map((r) => r.name.length), 8);
  console.log(`\n${'strategy'.padEnd(w)}  runs   baked (mean ± sd)        final CpS (mean ± sd)`);
  rows.forEach((r) => console.log(`${r.name.padEnd(w)}  ${String(r.n).padStart(4)}   ${`${fmt(r.baked.m)} ± ${fmt(r.baked.sd)}`.padEnd(24)} ${fmt(r.cps.m)} ± ${fmt(r.cps.sd)}${r.failed ? `   (${r.failed} failed)` : ''}`));
  const failed = reports.filter((r) => r.failed);
  failed.slice(0, 3).forEach((r) => console.log(`\nfailed: ${r.strategy} seed ${r.seed}\n${r.error}`));
}
