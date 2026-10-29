#!/usr/bin/env node
// The test runner: builds dist/CookieMgr.js, then runs every tests/**/*.test.mjs in its own Node
// process (a few at a time) and sums up.
//
//   npm test                     everything
//   npm test -- garden v2.26     only files whose path contains one of the words
//   npm test -- --verbose        print every check, not just the failures
//   npm test -- --no-build       test dist/ as it is
//   npm test -- --jobs=4         how many files run at once (default: half the cores, at most 6; or TEST_JOBS)
//   npm test -- --no-retry       a file that fails counts as failed (by default it gets one more
//                                run, alone, after the others — passing then, it's reported as flaky)
//   npm test -- --shard=2/4      only the 2nd quarter of the files (CI runs the quarters side by side), split
//                                by how long each file takes (tests/timings.json) so the quarters end together
//   npm test -- --save-timings   after a full run, write each file's time to tests/timings.json
//
// A test file is a plain script: it boots the fake game (tests/harness/game.mjs), checks things
// with makeAssert(), and ends with done() — which prints "ALL CHECKS PASSED" and exits 0, or the
// number of failures and exits 1 — or, when it can't run here (the simulator's tests without the game's
// scripts), prints "SKIPPED: why" and exits 0: reported as skipped, not passed. See tests/README.md.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const filters = args.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());
const TIMEOUT_MS = 180 * 1000;
// how many files at once: one per core (8 at most) — the files spend a good part of their time waiting
// (sleep, waitFor), so fewer leaves cores idle; a timing-sensitive check that fails under load is run again
// alone below. --jobs=N or TEST_JOBS=N to choose.
const jobsArg = (args.find((a) => a.startsWith('--jobs=')) || '').slice(7) || process.env.TEST_JOBS;
const JOBS = Math.max(1, Number(jobsArg) || Math.max(2, Math.min(8, os.cpus().length)));
const shardArg = (args.find((a) => a.startsWith('--shard=')) || '').slice(8);
const [SHARD, SHARDS] = shardArg ? shardArg.split('/').map(Number) : [1, 1];
if (!(SHARDS >= 1 && SHARD >= 1 && SHARD <= SHARDS)) {
  console.error(`--shard=${shardArg}: expected i/n, 1 ≤ i ≤ n`);
  process.exit(1);
}
// seconds each file took (npm test -- --save-timings): the slow ones start first, and the shards get equal shares
const TIMINGS = path.join(DIR, 'timings.json');
let timings = {};
try {
  timings = JSON.parse(fs.readFileSync(TIMINGS, 'utf8'));
} catch (e) {
  timings = {};
}

function find(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? (e.name === 'harness' ? [] : find(path.join(dir, e.name))) : e.name.endsWith('.test.mjs') ? [path.join(dir, e.name)] : []));
}
// contract tests first, then the release suites in version order
const verKey = (f) => (path.basename(f).match(/^v(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
const order = (a, b) => {
  const [ka, kb] = [verKey(a), verKey(b)];
  if (!ka.length || !kb.length) return ka.length - kb.length || a.localeCompare(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
};
const rel = (f) => path.relative(DIR, f).replace(/\\/g, '/');
const matching = find(DIR)
  .filter((f) => !filters.length || filters.some((w) => rel(f).toLowerCase().includes(w)))
  .sort(order);
// a file not timed yet (a new one) counts as an average one
const known = Object.values(timings).sort((a, b) => a - b);
const typical = known.length ? known[known.length >> 1] : 1;
const cost = (f) => timings[rel(f)] ?? typical;
// longest first, each onto the shard with the least so far: every shard gets the same files wherever it runs
const shares = Array.from({ length: SHARDS }, () => ({ secs: 0, files: [] }));
[...matching]
  .sort((a, b) => cost(b) - cost(a) || order(a, b))
  .forEach((f) => {
    const s = shares.reduce((m, x) => (x.secs < m.secs ? x : m));
    s.secs += cost(f);
    s.files.push(f);
  });
const files = shares[SHARD - 1].files;
if (SHARDS > 1) console.log(`Shard ${SHARD}/${SHARDS}: ${files.length} of ${matching.length} files (~${Math.round(shares[SHARD - 1].secs)} s of tests)`);
if (!files.length) {
  console.error(`No test files match ${filters.join(', ')}`);
  process.exit(1);
}

if (!args.includes('--no-build')) {
  const b = spawnSync(process.execPath, [path.join(ROOT, 'build.mjs')], { cwd: ROOT, encoding: 'utf8' });
  if (b.status !== 0) {
    console.error(b.stdout, b.stderr);
    process.exit(1);
  }
}
// a bundle that doesn't parse fails every test the same way: say so once
const parse = spawnSync(process.execPath, ['--check', path.join(ROOT, 'dist', 'CookieMgr.js')], { encoding: 'utf8' });
if (parse.status !== 0) {
  console.error(`dist/CookieMgr.js does not parse:\n${parse.stderr}`);
  process.exit(1);
}

const color = process.stdout.isTTY ? (c, s) => `\x1b[${c}m${s}\x1b[0m` : (_c, s) => s;
const results = [];

function run(file, again = false) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [file], { cwd: DIR });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => {
      out += `\nTIMEOUT after ${TIMEOUT_MS / 1000}s`;
      child.kill();
    }, TIMEOUT_MS);
    child.on('close', (code) => {
      clearTimeout(timer);
      // a file that couldn't run (the simulator's, without the game's scripts) says SKIPPED: why
      const skipped = code === 0 && (out.match(/^SKIPPED: (.*)$/m) || [])[1];
      const ok = !!skipped || (code === 0 && /ALL CHECKS PASSED/.test(out));
      const checks = (out.match(/^ok:/gm) || []).length;
      const r = { file, ok, skipped, out, checks, secs: (Date.now() - t0) / 1000 };
      if (!again) results.push(r);
      const mark = skipped ? color(33, '○') : ok ? color(again ? 33 : 32, '✓') : color(31, '✗');
      console.log(`${mark} ${rel(file)}  ${color(90, `${checks} checks · ${r.secs.toFixed(1)}s${again ? ' · run again, alone' : ''}`)}${skipped ? color(33, `  skipped: ${skipped}`) : ''}`);
      if (!ok || verbose) {
        const lines = out.split(/\r?\n/).filter((l) => verbose || !/^ok:/.test(l));
        const shown = verbose ? lines : lines.filter((l) => l.trim()).slice(-25);
        console.log(shown.map((l) => `    ${/^FAIL/.test(l) ? color(31, l) : l}`).join('\n'));
      }
      resolve(r);
    });
  });
}

const t0 = Date.now();
// slowest first, so a long file doesn't start last and run on alone
const queue = files.slice().sort((a, b) => cost(b) - cost(a));
await Promise.all(
  Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
    while (queue.length) await run(queue.shift());
  })
);
// a failure under load (the suites side by side) gets one more run, alone: a real failure fails again
const flaky = [];
const retry = args.includes('--no-retry') ? [] : results.filter((r) => !r.ok);
if (retry.length) console.log(color(33, '\nRunning the failures again, one at a time…'));
for (const r of retry) {
  const again = await run(r.file, true);
  if (!again.ok) continue;
  r.ok = true;
  r.checks = again.checks;
  flaky.push(r.file);
}
const failed = results.filter((r) => !r.ok);
const skipped = results.filter((r) => r.skipped);
const checks = results.reduce((a, r) => a + r.checks, 0);
const ran = results.length - skipped.length;
console.log(
  `\n${failed.length ? color(31, `${failed.length} of ${results.length} files failed`) : color(32, `All ${ran} files ${skipped.length ? 'that ran ' : ''}passed`)}${skipped.length ? color(33, ` · ${skipped.length} skipped`) : ''} · ${checks} checks · ${((Date.now() - t0) / 1000).toFixed(1)}s`
);
if (skipped.length) console.log(color(33, `skipped — couldn't run here (in CI they must):\n${skipped.map((r) => `  ${rel(r.file)}: ${r.skipped}`).join('\n')}`));
if (flaky.length) console.log(color(33, `flaky — failed side by side, passed alone (wait with waitFor, not sleep):\n${flaky.map((f) => `  ${rel(f)}`).join('\n')}`));
if (failed.length) console.log(failed.map((r) => `  ${rel(r.file)}`).join('\n'));
if (args.includes('--save-timings')) {
  // a full run only (no filter, no shard), so files that no longer exist drop out
  if (filters.length || SHARDS > 1) console.log(color(33, '--save-timings: only after a full run (no filter, no --shard)'));
  else {
    const out = Object.fromEntries(results.sort((a, b) => order(a.file, b.file)).map((r) => [rel(r.file), Math.round(r.secs * 10) / 10]));
    fs.writeFileSync(TIMINGS, JSON.stringify(out, null, 2) + '\n');
    console.log(`Wrote ${rel(TIMINGS)}`);
  }
}
process.exit(failed.length ? 1 : 0);
