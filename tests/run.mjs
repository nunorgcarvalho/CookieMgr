#!/usr/bin/env node
// The test runner: builds dist/CookieMgr.js, then runs every tests/**/*.test.mjs in its own Node
// process (a few at a time) and sums up.
//
//   npm test                     everything
//   npm test -- garden v2.26     only files whose path contains one of the words
//   npm test -- --verbose        print every check, not just the failures
//   npm test -- --no-build       test dist/ as it is
//
// A test file is a plain script: it boots the fake game (tests/harness/game.mjs), checks things
// with makeAssert(), and ends with done() — which prints "ALL CHECKS PASSED" and exits 0, or the
// number of failures and exits 1. See tests/README.md.
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
const JOBS = Math.max(2, Math.min(8, os.cpus().length));

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
const files = find(DIR)
  .filter((f) => !filters.length || filters.some((w) => rel(f).toLowerCase().includes(w)))
  .sort(order);
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

function run(file) {
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
      const ok = code === 0 && /ALL CHECKS PASSED/.test(out);
      const checks = (out.match(/^ok:/gm) || []).length;
      const r = { file, ok, out, checks, secs: (Date.now() - t0) / 1000 };
      results.push(r);
      const mark = ok ? color(32, '✓') : color(31, '✗');
      console.log(`${mark} ${rel(file)}  ${color(90, `${checks} checks · ${r.secs.toFixed(1)}s`)}`);
      if (!ok || verbose) {
        const lines = out.split(/\r?\n/).filter((l) => verbose || !/^ok:/.test(l));
        const shown = verbose ? lines : lines.filter((l) => l.trim()).slice(-25);
        console.log(shown.map((l) => `    ${/^FAIL/.test(l) ? color(31, l) : l}`).join('\n'));
      }
      resolve();
    });
  });
}

const t0 = Date.now();
const queue = files.slice();
await Promise.all(
  Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
    while (queue.length) await run(queue.shift());
  })
);
const failed = results.filter((r) => !r.ok);
const checks = results.reduce((a, r) => a + r.checks, 0);
console.log(
  `\n${failed.length ? color(31, `${failed.length} of ${results.length} files failed`) : color(32, `All ${results.length} files passed`)} · ${checks} checks · ${((Date.now() - t0) / 1000).toFixed(1)}s`
);
if (failed.length) console.log(failed.map((r) => `  ${rel(r.file)}`).join('\n'));
process.exit(failed.length ? 1 : 0);
