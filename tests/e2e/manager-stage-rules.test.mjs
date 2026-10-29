// Manager stage rules: stages build on each other. Stage 1 sets things up; each stage after it keeps only what it
// changes, and the rest carries over until a later stage changes it back. The code has a block per
// stage for it and every stage after it (manager.arriving(N) on its first pass); a jump runs the blocks
// before it too. Nunix late game clicks the big cookie and reindeer from the start (golden cookies only in
// the combos) and buys all the research, the Elder Pact too (Reindeer's Elder Pledge comes with it).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const G = CA.Managers;
const M = CA.Macros;
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

// ---- Nunix late game, as changes ----
const nunix = G.find('nunixLateGame');
const [s1, s2, s3] = nunix.stages;
assert(Object.keys(s2.macros).join() === 'elderPledge' && Object.keys(s2.profiles).join() === 'dragon', 'Reindeer: the pledge and the dragon');
assert(s1.macros.reindeer === 'on' && s1.macros.bigCookie === 'on' && s1.macros.upgradeUnlocker === 'on', 'stage 1: the big cookie and reindeer clicked; the Upgrade unlocker on');
assert(s1.macros.golden === 'off' && s1.macros.wrath === 'off', 'stage 1: no golden or wrath cookies (Scorn makes them all wrath)');
assert(s1.inputs.research.stopBefore === 'none' && s1.macros.elderPledge === 'off', 'all the research, the Elder Pact too; no pledge (the Grandmapocalypse, for the drops)');
assert(['gardener', 'fthofOnClickFrenzy', 'stockTrader'].every((id) => s1.macros[id] === 'off'), 'no garden, spells or stocks at first');
assert(s3.macros.golden === 'on' && s3.macros.wrath === 'on', 'Golden cookie combos: golden and wrath cookies on again');
const e3 = G.effective(nunix, 2);
assert(e3.macros.reindeer === 'on' && e3.macros.bigCookie === 'on' && e3.macros.golden === 'on' && e3.macros.elderPledge === 'on' && e3.macros.gardener === 'on' && e3.profiles.buyer === 'combos' && e3.profiles.pantheon === 'golden', 'what stage 3 runs with: everything before it, and its own changes');
assert(e3.inputs.research.stopBefore === 'none', 'settings carry over too');

// ---- its code ----
const code = G.codeOf(nunix);
assert(!CA.Script.compile(code).errors.length, 'the code reads fine');
assert(code.split('\n').length < 55, `short: a stage lists only its changes (${code.split('\n').length} lines)`);
assert(/if manager\.stage\(\) >= 2:\n {2}if manager\.arriving\(2\):\n {4}switch on elderPledge\n/.test(code), 'stage 2’s block: the pledge on');
assert((code.match(/switch on autoBuyer/g) || []).length === 1, 'stage 1’s setup is written once');

// ---- running: changes carry over; moving on runs only the new stage's changes ----
const has = Game.Has;
G.updateStage('nunixLateGame', 0, { until: 'cookies() > 100' });
Game.cookies = 10;
G.step();
assert(value('manager.stage') === 1 && M.isOn('reindeer') && M.isOn('bigCookie') && !M.isOn('golden'), 'stage 1: the big cookie and reindeer on, golden cookies off');
M.set('lumps', false, { silent: true }); // switched off by hand
Game.cookies = 1000;
G.step();
G.step();
assert(value('manager.stage') === 2 && M.isOn('elderPledge') && M.isOn('bigCookie') && M.isOn('reindeer'), 'stage 2: the pledge on, the big cookie and reindeer still on');
assert(!M.isOn('lumps'), 'moving on runs only the new stage’s changes: lumps, switched off by hand, stays off');
// a jump sets up what the stages before it did too
M.set('autoBuyer', false, { silent: true });
G.goTo(3);
G.step();
assert(value('manager.stage') === 3 && M.isOn('autoBuyer') && M.isOn('lumps') && M.isOn('gardener') && M.isOn('elderPledge') && M.isOn('golden'), 'a jump to stage 3: stages 1–2 set up again, then its own');
assert(CA.AutoBuyer.activeProfile() === 'combos', 'profiles: the last stage’s wins (combos, not stage 1’s payback)');
assert(value('manager.arriving', 1) === false && value('manager.arriving', 3) === false, 'arriving: only on the first pass');
// Revert to default on the one at work: its stage sets up again, as it comes
M.set('autoBuyer', false, { silent: true });
G.updateStage('nunixLateGame', 2, { macros: { ...G.find('nunixLateGame').stages[2].macros, autoBuyer: 'off' } });
G.revert('nunixLateGame');
G.step();
assert(!G.isEdited('nunixLateGame') && value('manager.stage') === 3 && M.isOn('autoBuyer') && CA.AutoBuyer.activeProfile() === 'combos', 'reverting the manager at work: its stage set up again');
G.resetSeeds();

// ---- editing: changes, not copies ----
const copy = G.add(null, 'nunixLateGame');
const ns = G.addStage(copy.id, 2);
assert(!Object.keys(ns.macros).length && !Object.keys(ns.profiles).length, 'a new stage changes nothing (what’s before it carries over)');
G.setStageMacro(copy.id, 3, 'gardener', 'on');
assert(copy.stages[3].macros.gardener === undefined, 'switching on what’s already on is no change');
G.setStageMacro(copy.id, 3, 'gardener', 'off');
assert(copy.stages[3].macros.gardener === 'off', 'switching it off is one');
G.setStageProfile(copy.id, 3, 'buyer', 'combos');
assert(copy.stages[3].profiles.buyer === undefined, 'the profile it already has: no change');
// deleting a stage: what it changed moves to the next one
G.removeStage(copy.id, 1);
assert(copy.stages[1].name === 'Golden cookie combos' && copy.stages[1].macros.elderPledge === 'on' && copy.stages[1].profiles.dragon === 'dragonFlightHarvest', 'deleting Reindeer: Golden cookie combos takes its change over (its own dragon kept)');
assert(JSON.stringify(G.effective(copy, 1).macros) === JSON.stringify({ ...G.effective(G.find('nunixLateGame'), 2).macros }), 'so the stages after it run as before');

// ---- a v4.0 save: each stage its full list → changes ----
const S = CA.Settings;
const snap = S.serialize();
const full = { macros: { autoBuyer: 'on', lumps: 'on', bigCookie: 'off' }, inputs: { research: { stopBefore: 'none' } }, profiles: { buyer: 'payback' } };
const old = JSON.parse(snap);
old.managers = {
  managers: [{ id: 'mine', name: 'Mine', scope: 'ascension', stages: [{ name: 'A', ...full, until: 'cookies() > 1' }, { name: 'B', macros: { ...full.macros, bigCookie: 'on' }, inputs: full.inputs, profiles: { buyer: 'combos' }, until: '' }] }],
  active: 'mine',
};
S.load(JSON.stringify(old));
const mine = G.find('mine');
assert(mine && JSON.stringify(mine.stages[1].macros) === '{"bigCookie":"on"}' && JSON.stringify(mine.stages[1].profiles) === '{"buyer":"combos"}' && !Object.keys(mine.stages[1].inputs).length, 'v4.0 stages become changes');
assert(G.effective(mine, 1).macros.autoBuyer === 'on' && G.effective(mine, 1).inputs.research.stopBefore === 'none', 'and run as they did');
S.load(snap);

// ---- a save whose Nunix stopped the research before the Elder Pact (so Reindeer's pledge never came up): all of it ----
const pact = JSON.parse(snap);
const nx = JSON.parse(JSON.stringify(G.SEEDS[0]));
nx.stages[0].inputs.research.stopBefore = 'Elder Pact';
nx.stages[0].watch[0].value = '[researchOwned(), 8]';
pact.managers = { managers: [nx], active: 'nunixLateGame' };
S.load(JSON.stringify(pact));
const drops = G.find('nunixLateGame').stages[0];
assert(drops.inputs.research.stopBefore === 'none' && drops.watch[0].value === '[researchOwned(), 9]' && !G.isEdited('nunixLateGame'), 'saved Nunix: all the research, as seeded now');
S.load(snap);

// ---- a game Nunix had set to stop before the Elder Pact: the Research macro's setting too, once ----
G.goTo(1);
G.step();
M.setInput('research', 'stopBefore', 'Elder Pact');
const pact2 = JSON.parse(S.serialize());
delete pact2.managers.fixes;
S.load(JSON.stringify(pact2));
G.step();
assert(M.inputsOf(M.get('research')).stopBefore === 'none', 'Research: all of it (it kept the old stop, set on the stage’s first pass)');
M.setInput('research', 'stopBefore', 'Elder Pact');
S.load(S.serialize());
G.step();
assert(M.inputsOf(M.get('research')).stopBefore === 'Elder Pact', 'once: set by hand afterwards, it stays');
S.load(snap);

// (the page: tests/e2e/manager-stage-tabs.test.mjs)

Game.Has = has;
M.list().forEach((m) => M.isOn(m.id) && M.set(m.id, false, { silent: true }));
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
