// v3.47.1: the repo was renamed to cookieMgr, so GitHub Pages serves it under /cookieMgr/ — every
// address the add-on and userscript hand out uses the new path. The name is written cookieMgr
// throughout; the ids saves and scripts rely on (window.CookieMgr, the mod id, storage keys) stay.
import fs from 'node:fs';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const read = (f) => fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
for (const f of ['dist/CookieMgr.js', 'CookieMgr.user.js']) assert(!read(f).includes('github.io/CookieMgr/'), `${f} has no old /CookieMgr/ Pages address`);
assert(read('dist/CookieMgr.js').includes("'https://nunorgcarvalho.github.io/cookieMgr/dist/version.txt'"), 'update check polls the new address');
assert(read('CookieMgr.user.js').includes("'https://nunorgcarvalho.github.io/cookieMgr/dist/CookieMgr.js'"), 'userscript loads from the new address');

const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
await sleep(400);
const CA = w.CookieMgr;
assert(CA && w.cookieMgr === CA, 'window.CookieMgr still there, window.cookieMgr beside it');
assert(CA.ID === 'CookieMgr' && Game.mods.CookieMgr, 'the mod id (where the save keeps its data) is unchanged');
const loadedNote = g.calls.notify.find((n) => n.title.includes(`v${CA.VERSION} loaded`));
assert(loadedNote && loadedNote.title.startsWith('cookieMgr'), `the loaded note says cookieMgr (${loadedNote && loadedNote.title})`);
assert(CA.Stats.toText({ label: 'X', source: 'return 1' }).startsWith('# cookieMgr statistic'), 'statistics export with the new name');
const old = CA.Stats.fromText('# CookieMgr statistic\n# label: Old one\nreturn 2');
assert(old && old.label === 'Old one' && old.source === 'return 2', 'a statistic exported by v3.47.0 still imports');
done();
process.exit();
