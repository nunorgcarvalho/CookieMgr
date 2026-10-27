// What the simulator starts of CookieMgr (sim/mgr/host.mjs), read from the source — no game needed,
// so this runs even where the game's scripts can't be downloaded.
import fs from 'node:fs';
import path from 'node:path';
import { makeAssert } from '../harness/game.mjs';
import { ROOT, headlessModules, startList } from '../../sim/mgr/host.mjs';

const { assert, done } = makeAssert();

const start = startList();
assert(start[0] === 'EventLog' && start.length > 25, `the init list, from src/main.js (${start.length}: ${start.join(' ')})`);
assert(!start.includes('UI') && !start.includes('Update') && !start.includes('CookieMonster'), 'not the UI, the update check or the Cookie Monster loader');
assert(['Dragon', 'Stats', 'Seasons', 'Pantheon', 'Garden', 'Macros'].every((k) => start.includes(k)), 'Dragon and Stats among them (missing before sim v0.4.0)');

// every module the add-on starts outside the UI is one the simulator loads (src/core, src/features)
const defined = new Set(
  headlessModules().flatMap((f) => [...fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').matchAll(/^CA\.(\w+) = /gm)].map((m) => m[1]))
);
const missing = start.filter((k) => !defined.has(k));
assert(!missing.length, `every one is defined in src/core or src/features${missing.length ? ` — not: ${missing.join(', ')}` : ''}`);

// the order is main.js's (the event log and actions before the macros built from them)
const main = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8');
const at = (k) => main.indexOf(`CA.${k},`);
assert(start.every((k, i) => i === 0 || at(start[i - 1]) < at(k)), 'in main.js’s order');

done();
