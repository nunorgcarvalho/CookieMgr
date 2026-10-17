// v3.12.1: Force the Hand of Fate on combos reads the forecast (features/fthof.js — fthof.* words):
// with Forecast on it casts only when the next cast gives a click frenzy or a building special (or a
// frenzy, for a combo without one), and Skip ahead casts Haggler's Charm — with magic to spare — to
// bring a good cast closer. (The forecast itself is checked against the real game in tests/sim.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, G, calls } = g;
const CA = w.CookieMgr;
await sleep(400);
const M = CA.Macros;
const id = CA.Grimoire.AUTO_ID;

// the cheapest spell, as in minigameGrimoire.js
G.spells["haggler's charm"] = { name: "Haggler's Charm", icon: [25, 11], costMin: 10, costPercent: 0.1, win() {}, fail() {} };
G.spellsById.push(Object.assign(G.spells["haggler's charm"], { id: G.spellsById.length }));

// the forecast, scripted: what the next casts give — every cast (of any spell) moves it on
let queue = [];
const cast = G.castSpell.bind(G);
G.castSpell = (spell) => {
  const ok = cast(spell);
  if (ok) queue.shift();
  return ok;
};
// (the words are features/fthof.js's — defineValue hands back the one defined; its reading is swapped here)
CA.Script.defineValue({ id: 'fthof.nextIs' }).get = (o) => queue[0] === String(o).toLowerCase();
CA.Script.defineValue({ id: 'fthof.castsUntil' }).get = (o) => queue.indexOf(String(o).toLowerCase());

const BUFFS = {
  F: { name: 'Frenzy', time: 300, maxTime: 300, multCpS: 7 },
  D: { name: 'Dragonflight', time: 300, maxTime: 300, multClick: 1111 },
  B: { name: 'High-five', time: 300, maxTime: 300, multCpS: 2, type: { name: 'building buff' } },
};
/** Runs the macro a moment on `keys` (buffs) with `next` (the forecast): the spells it cast. */
async function run(keys, next, magic = 100) {
  Game.buffs = {};
  keys.split('').forEach((k) => k && (Game.buffs[BUFFS[k].name] = { ...BUFFS[k] }));
  queue = next.slice();
  calls.spells.length = 0;
  G.magic = magic;
  M.set(id, true, { silent: true });
  await sleep(650); // (a few passes: it runs every 250 ms)
  M.set(id, false, { silent: true });
  Game.buffs = {};
  return calls.spells.slice();
}
const fthofs = (s) => s.filter((x) => x === 'Force the Hand of Fate').length;
const hagglers = (s) => s.filter((x) => x === "Haggler's Charm").length;

// ---- the inputs, and today's behaviour by default
const ins = M.get(id).inputs.map((i) => `${i.key}=${i.default}`).join();
assert(ins === 'forecast=off,skipAhead=0', `its card: Forecast (off) and Skip ahead (0) — ${ins}`);
assert(!CA.Script.compile(M.sourceOf(M.get(id)), { vars: ['forecast', 'skipAhead'] }).errors.length, 'its code compiles');
assert(fthofs(await run('FD', ['clot'])) === 1, 'Forecast off: casts on a combo whatever comes (as before)');

// ---- Forecast: only on a good cast
M.setInput(id, 'forecast', 'good');
// (v3.12.3: skipping has no limit by default — capped at 1 here, the good casts out of its reach)
M.setInput(id, 'skipAhead', 1);
assert(fthofs(await run('FD', ['clot', 'clot', 'click frenzy'])) === 0, 'Forecast on, Frenzy + Dragonflight, the next a Clot: no cast');
assert(fthofs(await run('FD', ['click frenzy'])) === 1, '…the next a Click frenzy: cast');
assert(fthofs(await run('FD', ['building special'])) === 1, '…a building special: cast');
assert(fthofs(await run('FD', ['frenzy'])) === 0, '…a Frenzy, with a Frenzy on already: no cast');
assert(fthofs(await run('BD', ['frenzy'])) === 1, 'a building special + Dragonflight (no Frenzy): a Frenzy is good — cast');
assert(fthofs(await run('', ['click frenzy'])) === 0, 'no combo: nothing, however good the forecast');

// ---- Skip ahead: Haggler's Charm to bring a good cast closer, with spare magic
M.setInput(id, 'skipAhead', 2);
let s = await run('', ['blab', 'click frenzy', 'clot']);
assert(hagglers(s) === 1 && fthofs(s) === 0 && queue[0] === 'click frenzy', `a Click frenzy one cast away: Haggler’s Charm once, then it waits on the good one (${s})`);
s = await run('', ['blab', 'clot', 'building special'], 200);
assert(hagglers(s) === 2 && queue[0] === 'building special', `two casts away (Skip ahead 2), magic to spare: twice (${s})`);
s = await run('', ['blab', 'clot', 'building special'], 100);
assert(hagglers(s) === 1, `…with 100 magic only once: a second would leave less than Force the Hand of Fate needs (${s})`);
s = await run('', ['blab', 'clot', 'ruin cookies', 'click frenzy']);
assert(hagglers(s) === 0, `three casts away: past Skip ahead 2 — nothing (${s})`);
s = await run('', ['blab', 'click frenzy'], 85);
assert(hagglers(s) === 0, `85 magic: Haggler’s Charm (20) would leave less than Force the Hand of Fate (70) needs — nothing (${s})`);
s = await run('FD', ['blab', 'click frenzy']);
assert(hagglers(s) === 1 && fthofs(s) === 1 && s.indexOf("Haggler's Charm") < s.indexOf('Force the Hand of Fate'), `during a combo: skips the bad cast, then casts on the good one (${s})`);
M.setInput(id, 'forecast', 'off');
s = await run('', ['blab', 'click frenzy']);
assert(hagglers(s) === 0, 'Forecast off: never skips ahead');

// ---- the real words are there (features/fthof.js)
['fthof.next', 'fthof.nextIs', 'fthof.castsUntil'].forEach((v) => assert(CA.Script.isValue(v), `${v}: a word`));

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
