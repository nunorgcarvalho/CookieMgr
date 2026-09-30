// CookieMgr build script — zero dependencies, just Node 18+.
//
//   node build.mjs            -> writes dist/CookieMgr.js
//   node build.mjs --watch    -> rebuilds whenever src/ changes
//   node build.mjs --serve    -> also serves dist/ on http://localhost:8080 (for local testing)
//
// Source files are plain scripts that attach themselves to a shared `CA` namespace.
// They are concatenated in the order listed in MODULES and wrapped in a single IIFE,
// so nothing leaks into the page except `window.CookieMgr`.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist', 'CookieMgr.js');

// Load order matters: later modules may reference earlier ones at load time.
const MODULES = [
  'core/util.js',
  'core/events.js',
  'core/actions.js',
  'core/settings.js',
  'core/hotkeys.js',
  'core/ascension.js',
  'features/autoclickers.js',
  'ui/components.js',
  'ui/tab.js',
  'ui/menu.js',
  'main.js',
];
const STYLES = ['ui/styles.css'];

function build() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const css = STYLES.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');

  const parts = [];
  parts.push(`/*! CookieMgr v${pkg.version} */`);
  parts.push('(function () {');
  parts.push("'use strict';");
  parts.push('const CA = {};');
  parts.push(`CA.VERSION = ${JSON.stringify(pkg.version)};`);
  parts.push(`CA.CSS = ${JSON.stringify(css)};`);
  for (const file of MODULES) {
    const code = fs.readFileSync(path.join(SRC, file), 'utf8').trimEnd();
    parts.push(`\n// ---- src/${file} ${'-'.repeat(Math.max(4, 60 - file.length))}\n${code}`);
  }
  parts.push('})();\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, parts.join('\n'));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`[build] dist/CookieMgr.js  v${pkg.version}  ${kb} KB`);
}

function safeBuild() {
  try {
    build();
  } catch (err) {
    console.error('[build] failed:', err.message);
  }
}

const args = new Set(process.argv.slice(2));
safeBuild();

if (args.has('--watch') || args.has('--serve')) {
  let pending = null;
  fs.watch(SRC, { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(safeBuild, 100);
  });
  console.log('[build] watching src/ for changes…');
}

if (args.has('--serve')) {
  const port = 8080;
  http
    .createServer((req, res) => {
      const file = path.join(ROOT, 'dist', path.normalize(decodeURIComponent(req.url.split('?')[0])));
      if (!file.startsWith(path.join(ROOT, 'dist')) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, () => {
      console.log(`[serve] http://localhost:${port}/CookieMgr.js`);
      console.log(`[serve] bookmarklet: javascript:(function(){Game.LoadMod('http://localhost:${port}/CookieMgr.js?'+Date.now());}());`);
    });
}
