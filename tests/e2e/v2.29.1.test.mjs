// v2.29.1: the Grimoire's refill time is worked out, not simulated (unit/grimoire.test.mjs checks
// it against the game's formula); switching saves keeps each save's buff log its own.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(600);
const H = CA.History;
const names = () => H.intervals.map((iv) => iv.name);

// a Frenzy in save A
Game.buffs.Frenzy = { name: 'Frenzy', time: 3000, maxTime: 3000, multCpS: 7, icon: [10, 14] };
await sleep(1200);
delete Game.buffs.Frenzy;
await sleep(1200);
assert(names().includes('Frenzy'), `save A: its Frenzy recorded (${names()})`);

// another save is loaded (an import): A's log is written under A, B starts with its own
const A = Game.fullDate;
Game.fullDate = A + 12345;
CA.Events.emit('history', 'load');
await sleep(400);
assert(!names().includes('Frenzy'), `save B: its own (empty) buff log (${names()})`);
Game.buffs['Click frenzy'] = { name: 'Click frenzy', time: 3000, maxTime: 3000, multClick: 777, icon: [0, 1] };
await sleep(1200);
delete Game.buffs['Click frenzy'];
await sleep(1200);

// back to A: A's Frenzy is there, B's Click frenzy isn't
Game.fullDate = A;
CA.Events.emit('history', 'load');
await sleep(400);
assert(names().includes('Frenzy') && !names().includes('Click frenzy'), `back to save A: its own log, nothing of B’s (${names()})`);

// the Grimoire's estimate: instant even for a long refill
const t0 = Date.now();
for (let i = 0; i < 100; i++) CA.Grimoire.spells();
assert(Date.now() - t0 < 200, `100 spell lists (every spell’s refill time) in ${Date.now() - t0} ms`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
