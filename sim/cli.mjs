#!/usr/bin/env node
// The simulator's command line (npm run sim -- …):
//
//   run <strategy> [--span 2h] [--seed 1] [--scenario fresh] [--save file] [--save-out file] [--json file|-]
//         one simulation, and what happened in it — --save starts from an exported save (your own
//         game, cookieMgr's settings included); --save-out writes the end state as one
//   compare <strategy> <strategy>… [--span 2h] [--seeds 5] [--scenario fresh] [--jobs N]
//         each strategy over several seeds, side by side (in parallel processes)
//   vocab [actions|values|conditions]
//         cookieMgr's words — the actions, values and conditions a strategy is written in
//         (staging ones marked: sim-only until moved into the add-on)
//   experiment <name> [args…]
//         one of sim/experiments/ (garden models, …)
//   list
//         strategies, scenarios, experiments
//   fetch [--force]
//         download the game's scripts (done automatically on first use)
//
// A strategy is a file in sim/strategies/ (.cmgr — cookieMgr's own algorithmic code — or .mjs),
// a built-in macro's id, or several joined with "+" ("golden+payback").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runOne, runMany, printReport, printComparison, parseSpan, SCENARIOS } from './runner.mjs';
import { STRATEGIES } from './strategy.mjs';
import { ensureGame } from './game/fetch.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : def;
};
const has = (name) => argv.includes(`--${name}`);
const positional = () => {
  const out = [];
  for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      if (!['force', 'verbose'].includes(argv[i].slice(2))) i++;
      continue;
    }
    out.push(argv[i]);
  }
  return out;
};

async function main() {
  if (cmd === 'run') {
    const strategy = positional()[0];
    if (!strategy) throw new Error('run <strategy> — see `list`');
    const json = flag('json', null);
    const spanText = flag('span', '1h');
    parseSpan(spanText);
    const quietProgress = json === '-';
    const r = await runOne({
      strategy,
      scenario: flag('scenario', 'fresh'),
      seed: Number(flag('seed', 1)),
      span: spanText,
      fps: Number(flag('fps', 30)),
      save: flag('save', null),
      saveOut: flag('save-out', null),
      onProgress: quietProgress ? null : (t) => process.stderr.write(`\r  ${(t / 3600).toFixed(2)} h simulated…`),
    });
    if (!quietProgress) process.stderr.write('\r' + ' '.repeat(40) + '\r');
    if (json === '-') process.stdout.write(JSON.stringify(r));
    else {
      printReport(r);
      if (json) {
        fs.writeFileSync(json, JSON.stringify(r, null, 1));
        console.log(`  report written to ${json}`);
      }
    }
    return;
  }
  if (cmd === 'compare') {
    const strategies = positional();
    if (!strategies.length) throw new Error('compare <strategy> <strategy>… — see `list`');
    const seeds = Number(flag('seeds', 3));
    const spanText = flag('span', '1h');
    parseSpan(spanText);
    const specs = [];
    strategies.forEach((strategy) => {
      for (let s = 1; s <= seeds; s++) specs.push({ strategy, seed: s, span: spanText, scenario: flag('scenario', 'fresh'), fps: Number(flag('fps', 30)), save: flag('save', null) });
    });
    let done = 0;
    const t0 = Date.now();
    const reports = await runMany(specs, {
      jobs: flag('jobs') ? Number(flag('jobs')) : undefined,
      onDone: () => process.stderr.write(`\r  ${++done}/${specs.length} simulations done (${((Date.now() - t0) / 1000).toFixed(0)} s)`),
    });
    process.stderr.write('\n');
    console.log(`${strategies.length} strategies × ${seeds} seeds, ${spanText} each, scenario ${flag('scenario', 'fresh')}`);
    printComparison(reports);
    if (flag('json')) fs.writeFileSync(flag('json'), JSON.stringify(reports, null, 1));
    return;
  }
  if (cmd === 'vocab') {
    const { createSim } = await import('./sim.mjs');
    const { stagingModules } = await import('./mgr/host.mjs');
    const sim = await createSim({ seed: 1 });
    const C = sim.CA;
    const staged = new Set();
    stagingModules().forEach((m) => [...m.code.matchAll(/id: '([\w.]+)'|V\('([\w.]+)'/g)].forEach((x) => staged.add(x[1] || x[2])));
    const which = positional()[0];
    const lib = C.Script.library('macro');
    const groups = { actions: 'action', values: 'value', conditions: 'cond' };
    for (const [title, kind] of Object.entries(groups)) {
      if (which && which !== title) continue;
      const items = lib.filter((x) => x.kind === kind);
      console.log(`\n${title.toUpperCase()} (${items.length})`);
      items.forEach((x) => console.log(`  ${(x.sig + (staged.has(x.id) ? '  [staging]' : '')).padEnd(46)} ${x.desc || ''}`));
    }
    return;
  }
  if (cmd === 'experiment') {
    const name = positional()[0];
    const file = path.join(HERE, 'experiments', `${name}.mjs`);
    if (!name || !fs.existsSync(file)) throw new Error(`experiment <name> — one of: ${fs.readdirSync(path.join(HERE, 'experiments')).map((f) => f.replace(/\.mjs$/, '')).join(', ')}`);
    process.argv = [process.argv[0], file, ...argv.slice(2)];
    await import(pathToFileURL(file).href);
    return;
  }
  if (cmd === 'list') {
    const ls = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)) : []);
    const firstLine = (f) => (fs.readFileSync(f, 'utf8').split('\n').find((l) => /^\s*(#|\/\/)/.test(l)) || '').replace(/^\s*(#|\/\/)\s*/, '');
    console.log('\nSTRATEGIES (sim/strategies/)');
    ls(STRATEGIES, /\.(cmgr|mjs)$/).forEach((f) => console.log(`  ${f.padEnd(28)} ${firstLine(path.join(STRATEGIES, f))}`));
    console.log('  …or a built-in macro id (golden, bigCookie, gardener, autoBuyer…), or several joined with +');
    console.log('\nSCENARIOS (sim/scenarios/)');
    console.log(`  ${'fresh'.padEnd(28)} a new game`);
    ls(SCENARIOS, /\.mjs$/).forEach((f) => console.log(`  ${f.replace(/\.mjs$/, '').padEnd(28)} ${firstLine(path.join(SCENARIOS, f))}`));
    console.log('\nEXPERIMENTS (sim/experiments/)');
    ls(path.join(HERE, 'experiments'), /\.mjs$/).forEach((f) => console.log(`  ${f.replace(/\.mjs$/, '').padEnd(28)} ${firstLine(path.join(HERE, 'experiments', f))}`));
    return;
  }
  if (cmd === 'fetch') {
    await ensureGame({ force: has('force') });
    return;
  }
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
}

main().catch((e) => {
  console.error(has('verbose') ? e : `error: ${e.message}`);
  process.exit(1);
});
