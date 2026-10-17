// v3.12.3: Force the Hand of Fate on combos never stalls in "good" mode — the forecast only moves
// when something is cast, so while the next cast isn't good it keeps skipping with Haggler's Charm
// (spare magic only), however far the good one is; Skip ahead 0 is no limit (a limit can stall).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, waitFor, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, G, calls } = g;
const CA = w.CookieMgr;
await sleep(400);
const M = CA.Macros;
const id = CA.Grimoire.AUTO_ID;
G.spells["haggler's charm"] = { name: "Haggler's Charm", icon: [25, 11], costMin: 10, costPercent: 0.1, win() {}, fail() {} };
G.spellsById.push(Object.assign(G.spells["haggler's charm"], { id: G.spellsById.length }));

// the forecast, scripted (as features/fthof.js reads the game's): it reaches 100 casts ahead
let queue = [];
const cast = G.castSpell.bind(G);
G.castSpell = (spell) => {
  const ok = cast(spell);
  if (ok) queue.shift();
  return ok;
};
CA.Script.defineValue({ id: 'fthof.nextIs' }).get = (o) => queue[0] === String(o).toLowerCase();
CA.Script.defineValue({ id: 'fthof.castsUntil' }).get = (o) => {
  const i = queue.indexOf(String(o).toLowerCase());
  return i > 100 ? -1 : i; // beyond its reach: not found
};
const bad = (n) => Array.from({ length: n }, (_, i) => ['clot', 'blab', 'ruin cookies', 'cookie storm drop'][i % 4]);
const fthofs = () => calls.spells.filter((x) => x === 'Force the Hand of Fate').length;
const hagglers = () => calls.spells.filter((x) => x === "Haggler's Charm").length;

assert(M.get(id).inputs.find((i) => i.key === 'skipAhead').default === 0 && /no limit/.test(M.get(id).inputs.find((i) => i.key === 'skipAhead').label), 'Skip ahead: 0 = no limit, the default; its label says a limit can stall');
M.setInput(id, 'forecast', 'good');
M.setEvery(id, 20); // quick passes, so many skips fit in a test

// ---- a good cast 50 casts away, a combo on: skipped to, then cast
Game.buffs = { Frenzy: { name: 'Frenzy', time: 1e6, maxTime: 1e6, multCpS: 7 }, Dragonflight: { name: 'Dragonflight', time: 1e6, maxTime: 1e6, multClick: 1111 } };
queue = bad(50).concat(['click frenzy']);
calls.spells.length = 0;
G.magic = 5000;
M.set(id, true, { silent: true });
await waitFor(() => fthofs() >= 1, 8000);
// (and right after, the next cast bad again: it carries on skipping toward the next good one)
assert(calls.spells.indexOf('Force the Hand of Fate') === 50 && calls.spells.slice(0, 50).every((x) => x === "Haggler's Charm"), `a good cast 50 away: 50 skips, then Force the Hand of Fate on it (${hagglers()} skips, ${fthofs()} cast)`);
M.set(id, false, { silent: true });

// ---- past the forecast's reach (castsUntil says -1): still skipping, until one comes into reach
queue = bad(150).concat(['building special']);
calls.spells.length = 0;
G.magic = 10000;
M.set(id, true, { silent: true });
await waitFor(() => fthofs() >= 1, 12000);
assert(fthofs() === 1 && calls.spells.indexOf('Force the Hand of Fate') === 150, `150 away (beyond the 100 it sees): skips on all the same, and casts on it (${hagglers()} skips, ${fthofs()} cast)`);
M.set(id, false, { silent: true });

// ---- the spare-magic rule holds throughout: it stops where a skip would leave too little
queue = bad(50).concat(['click frenzy']);
calls.spells.length = 0;
G.magic = 70 + 20 * 5; // five skips' worth above Force the Hand of Fate's 70
M.set(id, true, { silent: true });
await sleep(600);
M.set(id, false, { silent: true });
assert(hagglers() === 5 && fthofs() === 0 && G.magic >= 70, `with five skips of spare magic: five, then it waits — Force the Hand of Fate still affordable (${hagglers()} skips, ${G.magic} magic left)`);

// ---- a limit can stall (as its label warns)
M.setInput(id, 'skipAhead', 10);
queue = bad(50).concat(['click frenzy']);
calls.spells.length = 0;
G.magic = 5000;
M.set(id, true, { silent: true });
await sleep(600);
M.set(id, false, { silent: true });
assert(hagglers() === 0 && fthofs() === 0, 'Skip ahead 10, the good cast 50 away: nothing (a limit stalls — hence no limit by default)');
M.setInput(id, 'skipAhead', 0);

// ---- Forecast off: no skipping at all
M.setInput(id, 'forecast', 'off');
queue = bad(5).concat(['click frenzy']);
calls.spells.length = 0;
G.magic = 100;
M.set(id, true, { silent: true });
await sleep(300);
M.set(id, false, { silent: true });
assert(hagglers() === 0 && fthofs() === 1, 'Forecast off: casts on the combo, never skips');
Game.buffs = {};

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
