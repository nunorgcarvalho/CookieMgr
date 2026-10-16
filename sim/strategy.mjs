// Strategies: what CookieMgr does in a simulation, from a file.
//
//   name.cmgr   CookieMgr's algorithmic code — paste it into an algorithmic macro in the add-on and
//               it does the same there. Header comments set it up:
//                 # every: 500          a pass every 500 ms (default 1000)
//                 # with: golden, bigCookie     built-in macros switched on alongside it
//                 # profile: goldenClovers      a garden profile loaded (the Auto-gardener's)
//   name.mjs    export default { name, desc, setup(sim) } — anything sim.* can do
//
// A strategy may also be a built-in macro's id ("golden"), or several joined with "+"
// ("golden+bigCookie+payback.cmgr").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const STRATEGIES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'strategies');

/** Where a strategy name points: a file (as given, or in sim/strategies/), else null. */
export function findStrategy(name) {
  for (const p of [name, path.join(STRATEGIES, name), path.join(STRATEGIES, `${name}.cmgr`), path.join(STRATEGIES, `${name}.mjs`)]) if (fs.existsSync(p) && fs.statSync(p).isFile()) return path.resolve(p);
  return null;
}

/** A .cmgr file's code and its header settings: { source, every, with: [], profile }. */
export function parseCmgr(text) {
  const head = {};
  for (const line of String(text).split('\n')) {
    const m = line.match(/^#\s*(every|with|profile|name)\s*:\s*(.+?)\s*$/i);
    if (m) head[m[1].toLowerCase()] = m[2];
    else if (line.trim() && !line.trim().startsWith('#')) break;
  }
  return {
    source: String(text).replace(/\r\n/g, '\n'),
    name: head.name || null,
    every: head.every ? Number(String(head.every).replace(/ms$/, '')) : 1000,
    with: head.with ? head.with.split(/[,\s]+/).filter(Boolean) : [],
    profile: head.profile || null,
  };
}

/** Loads a strategy: { name, setup(sim) }. */
export async function loadStrategy(spec) {
  const parts = String(spec).split('+').filter(Boolean);
  if (parts.length > 1) {
    const subs = [];
    for (const p of parts) subs.push(await loadStrategy(p));
    return { name: subs.map((s) => s.name).join(' + '), setup: (sim) => subs.forEach((s) => s.setup(sim)) };
  }
  const file = findStrategy(spec);
  if (!file) return { name: spec, setup: (sim) => sim.macro(spec) }; // a built-in macro's id
  if (file.endsWith('.mjs')) {
    const mod = (await import(pathToFileURL(file).href)).default;
    return { name: mod.name || path.basename(file), desc: mod.desc, setup: mod.setup, file };
  }
  const c = parseCmgr(fs.readFileSync(file, 'utf8'));
  const name = c.name || path.basename(file, path.extname(file));
  return {
    name,
    file,
    setup(sim) {
      if (c.profile) sim.CA.GardenLayers.loadProfile(c.profile);
      c.with.forEach((id) => sim.macro(id));
      sim.macro({ name, source: c.source, every: c.every });
    },
  };
}
