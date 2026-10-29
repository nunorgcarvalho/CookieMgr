// Manager stage rules: stages build on each other. Stage 1 sets things up; each stage after it keeps only what it
// changes, and the rest carries over until a later stage changes it back. The code has a block per
// stage for it and every stage after it (manager.arriving(N) on its first pass); a jump runs the blocks
// before it too. Nunix late game clicks reindeer from the start and researches up to the Elder Pact.
// The stage editor shows rules: switch on / off, settings, profiles — each with × and a "+" list.
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
assert(Object.keys(s2.macros).join() === 'bigCookie' && s2.macros.bigCookie === 'on', 'Drops only changes the big cookie: on');
assert(Object.keys(s3.macros).join() === 'elderPledge' && Object.keys(s3.profiles).join() === 'dragon', 'Reindeer: the pledge and the dragon');
assert(s1.macros.reindeer === 'on' && s1.macros.bigCookie === 'off' && s1.macros.upgradeUnlocker === 'on', 'stage 1: reindeer clicked, not the big cookie; the Upgrade unlocker on');
assert(s1.inputs.research.stopBefore === 'Elder Pact' && s1.macros.elderPledge === 'off', 'research up to the Elder Pact, no pledge (the Grandmapocalypse, for the drops)');
assert(['gardener', 'fthofOnClickFrenzy', 'stockTrader'].every((id) => s1.macros[id] === 'off'), 'no garden, spells or stocks at first');
const e4 = G.effective(nunix, 3);
assert(e4.macros.reindeer === 'on' && e4.macros.bigCookie === 'on' && e4.macros.gardener === 'on' && e4.profiles.buyer === 'combos' && e4.profiles.pantheon === 'golden', 'what stage 4 runs with: everything before it, and its own changes');
assert(e4.inputs.research.stopBefore === 'Elder Pact', 'settings carry over too');

// ---- its code ----
const code = G.codeOf(nunix);
assert(!CA.Script.compile(code).errors.length, 'the code reads fine');
assert(code.split('\n').length < 55, `short: a stage lists only its changes (${code.split('\n').length} lines)`);
assert(/if manager\.stage\(\) >= 2:\n {2}if manager\.arriving\(2\):\n {4}switch on bigCookie\n/.test(code), 'stage 2’s block: the big cookie on');
assert((code.match(/switch on autoBuyer/g) || []).length === 1, 'stage 1’s setup is written once');

// ---- running: changes carry over; moving on runs only the new stage's changes ----
const has = Game.Has;
Game.Has = (n) => n === 'Shimmering veil [off]' || has(n); // the veil is up
Game.cookies = 10;
G.step();
assert(value('manager.stage') === 1 && M.isOn('reindeer') && !M.isOn('bigCookie'), 'stage 1: reindeer on, big cookie off');
M.set('lumps', false, { silent: true }); // switched off by hand
Game.Has = has; // the veil breaks
G.step();
G.step();
assert(value('manager.stage') === 2 && M.isOn('bigCookie') && M.isOn('reindeer'), 'the veil broke: stage 2, the big cookie on, reindeer still on');
assert(!M.isOn('lumps'), 'moving on runs only the new stage’s changes: lumps, switched off by hand, stays off');
// a jump sets up what the stages before it did too
M.set('autoBuyer', false, { silent: true });
G.goTo(4);
G.step();
assert(value('manager.stage') === 4 && M.isOn('autoBuyer') && M.isOn('lumps') && M.isOn('gardener') && M.isOn('elderPledge'), 'a jump to stage 4: stages 1–3 set up again, then its own');
assert(CA.AutoBuyer.activeProfile() === 'combos', 'profiles: the last stage’s wins (combos, not stage 1’s payback)');
assert(value('manager.arriving', 1) === false && value('manager.arriving', 4) === false, 'arriving: only on the first pass');

// ---- editing: changes, not copies ----
const copy = G.add(null, 'nunixLateGame');
const ns = G.addStage(copy.id, 3);
assert(!Object.keys(ns.macros).length && !Object.keys(ns.profiles).length, 'a new stage changes nothing (what’s before it carries over)');
G.setStageMacro(copy.id, 4, 'gardener', 'on');
assert(copy.stages[4].macros.gardener === undefined, 'switching on what’s already on is no change');
G.setStageMacro(copy.id, 4, 'gardener', 'off');
assert(copy.stages[4].macros.gardener === 'off', 'switching it off is one');
G.setStageProfile(copy.id, 4, 'buyer', 'combos');
assert(copy.stages[4].profiles.buyer === undefined, 'the profile it already has: no change');
// deleting a stage: what it changed moves to the next one
G.removeStage(copy.id, 1);
assert(copy.stages[1].name === 'Reindeer' && copy.stages[1].macros.bigCookie === 'on' && copy.stages[1].macros.elderPledge === 'on', 'deleting Drops: Reindeer takes its change over');
assert(JSON.stringify(G.effective(copy, 2).macros) === JSON.stringify({ ...G.effective(nunix, 3).macros }), 'so the stages after it run as before');

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

// ---- the page: rules ----
const doc = w.document;
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const change = (el, v) => {
  el.value = v;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};
const menu = () => doc.getElementById('CookieMgrMenu');
G.use('nunixLateGame');
CA.UI.Menu.openPage('managers');
await sleep(50);
const cards = () => menu().querySelectorAll('.ca-mgr-stagecard');
assert(cards().length === 4, 'four stage cards');
assert(!cards()[0].querySelector('.ca-mgr-carry') && cards()[1].querySelector('.ca-mgr-carry'), 'later stages say what carries over');
assert(/Carries over from stage 1: \d+ on/.test(cards()[1].querySelector('.ca-mgr-carry summary').textContent), 'counted');
assert(cards()[1].querySelectorAll('.ca-mgr-macro').length === 1, 'Drops shows only its change');
change(cards()[1].querySelector('[data-mgr-addmacro][data-to="off"]'), 'wrinklers');
assert(G.find('nunixLateGame').stages[1].macros.wrinklers === 'off', '“+ switch off…” adds a change');
click(cards()[1].querySelector('[data-mgr-act="unmacro"][data-macro="wrinklers"]'));
assert(G.find('nunixLateGame').stages[1].macros.wrinklers === undefined, '× drops it');
change(cards()[1].querySelector('[data-mgr-addprofile]'), 'grimoire');
assert(G.find('nunixLateGame').stages[1].profiles.grimoire, '“+ a profile…” adds one');
click(cards()[1].querySelector('[data-mgr-act="unprofile"][data-kind="grimoire"]'));
assert(!G.find('nunixLateGame').stages[1].profiles.grimoire, '× drops it');
change(cards()[1].querySelector('[data-mgr-addinput]'), 'research|stopBefore');
assert(G.find('nunixLateGame').stages[1].inputs.research && G.find('nunixLateGame').stages[1].inputs.research.stopBefore === 'Elder Pact', '“+ a setting…” adds one, at what carries over');
change(cards()[1].querySelector('[data-mgr-input][data-macro="research"]'), 'none');
assert(G.find('nunixLateGame').stages[1].inputs.research.stopBefore === 'none', 'and it changes there');
const opt = [...cards()[1].querySelectorAll('[data-mgr-addmacro][data-to="on"] option')].find((o) => o.value === 'autoBuyer');
assert(opt && opt.disabled && /already on/.test(opt.textContent), 'what’s already on can’t be switched on again');

Game.Has = has;
M.list().forEach((m) => M.isOn(m.id) && M.set(m.id, false, { silent: true }));
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
