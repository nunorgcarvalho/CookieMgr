// v2.28.0: the save is made of sections features register; loading is guarded (a section that
// fails keeps a copy, the rest load; nothing mirrored mid-load); the local mirror only wins on a
// session's first load, for the same bakery, when it isn't older; late options keep their saved
// values; code with a problem won't start, a runtime throw stops the macro; v2.22's blocks and
// prefs.source are migrated; garden history per save; titles escaped.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const idb = () => ({ factory: new IDBFactory(), IDBKeyRange });
const g = boot({ idb: idb() });
const { window: w, calls } = g;
const CA = w.CookieMgr;
await sleep(400);
const M = CA.Macros;

// ---- sections
assert(['macros', 'running', 'widgets', 'garden'].every((k) => k in JSON.parse(CA.Settings.serialize()) || k === 'running'), 'macros, widgets, garden: sections of the save');
M.setEvery('golden', 400);
const good = CA.Settings.serialize();
let boomData = null;
CA.Settings.registerSection('boom', {
  serialize: () => ({ ok: true }),
  load(d) {
    boomData = d;
    if (d && d.explode) throw new Error('kaboom');
  },
});
const withBoom = JSON.stringify({ ...JSON.parse(good), boom: { explode: 1, keep: 'me' }, macros: { ...JSON.parse(good).macros, prefs: { golden: { every: 900 } } } });
CA.Settings.load(withBoom);
assert(boomData && boomData.keep === 'me' && M.everyOf(M.get('golden')) === 900, 'a section that throws: the others still load');
const unreadable = JSON.parse(w.localStorage.getItem('CookieMgr.unreadable') || '{}');
assert(unreadable.boom && unreadable.boom.data.keep === 'me' && /kaboom/.test(unreadable.boom.error), 'what it couldn’t read is kept in localStorage');
assert(calls.notify.some((n) => /couldn’t be read/.test(n.desc)), 'and you’re told');
assert(JSON.parse(CA.Settings.serialize()).boom.ok === true, 'its own serialize still saves');

// ---- late options, unknown options
const withLate = JSON.parse(good);
withLate.options.zzLate = 7;
withLate.options.zzNobody = 'kept';
CA.Settings.load(JSON.stringify(withLate));
CA.Settings.defineOption({ key: 'zzLate', group: 'test-hidden', default: 1 });
assert(CA.Settings.get('zzLate') === 7, 'an option defined after the load gets its saved value');
assert(JSON.parse(CA.Settings.serialize()).options.zzNobody === 'kept', 'an option nobody defines (yet) survives saving');

// ---- the local mirror
M.setEvery('golden', 600); // mirrored now
const mirror = w.localStorage.getItem('CookieMgr.settings.v1');
const wrap = JSON.parse(mirror);
assert(wrap.saveId === CA.Store.saveId() && JSON.parse(wrap.payload).macros.prefs.golden.every === 600, 'mirrored with its bakery and time');
const staleGame = JSON.stringify({ ...JSON.parse(good), savedAt: Date.now() - 60000 }); // the game's minute-old save
const b1 = boot({ idb: idb(), save: staleGame, localStorageSeed: { 'CookieMgr.settings.v1': mirror } });
await sleep(350);
assert(b1.window.CookieMgr.Macros.everyOf(b1.window.CookieMgr.Macros.get('golden')) === 600, 'a refresh: the mirror (newer) wins over the game’s save');
const b2 = boot({ idb: idb(), save: staleGame, localStorageSeed: { 'CookieMgr.settings.v1': mirror }, fullDate: 1600000000000 });
await sleep(350);
assert(b2.window.CookieMgr.Macros.everyOf(b2.window.CookieMgr.Macros.get('golden')) === 400, 'another bakery’s mirror is ignored');
const newerGame = JSON.stringify({ ...JSON.parse(good), savedAt: Date.now() + 60000 });
const b3 = boot({ idb: idb(), save: newerGame, localStorageSeed: { 'CookieMgr.settings.v1': mirror } });
await sleep(350);
assert(b3.window.CookieMgr.Macros.everyOf(b3.window.CookieMgr.Macros.get('golden')) === 400, 'a newer game save (cloud, another device) wins over the mirror');
// an import, later in the session: the game's data, whatever the mirror holds
M.setEvery('golden', 800);
CA.Settings.load(good);
assert(M.everyOf(M.get('golden')) === 400, 'an import (a second load): the imported data');
const mid = [];
CA.Events.on('macros', () => mid.push(w.localStorage.getItem('CookieMgr.settings.v1')));
CA.Settings.load(good);
assert(mid.every((x) => x === mid[0]), 'nothing is mirrored while a save is being read');

// ---- code with a problem won't start; a throw while running stops it
const bad = M.save({ name: 'Broken', mode: 'flow', every: 100, source: 'pop.golden()\nbogus.thing()\n' });
M.set(bad.id, true);
assert(!M.isOn(bad.id) && /line 2/.test(M.problemOf(bad.id)) && calls.notify.some((n) => /Can’t start/.test(n.desc)), `code with a problem: not started, and why (${M.problemOf(bad.id)})`);
CA.UI.Menu.openPage('clickers');
const row = w.document.querySelector(`[data-macro-row="${bad.id}"]`);
assert(row && /line 2/.test(row.querySelector('.ca-step-problem').textContent), 'its row says what’s wrong');
// conditions that throw count as false (and their text falls back to their name)…
CA.Conditions.register({ id: 'test.throws', name: 'Throws', params: [], describe: () => { throw new Error('x'); }, test: () => { throw new Error('x'); } });
assert(CA.Conditions.describe({ all: [{ cond: 'test.throws' }] }) === 'Throws' && CA.Conditions.test({ all: [{ cond: 'test.throws' }] }) === false, 'a condition that throws: false, described by its name');
// …and anything else that throws while a flow runs stops it, with the error
const thrower = M.save({ name: 'Thrower', mode: 'flow', every: 50, source: 'wait until lumps() > 1000\n' });
const realEval = CA.Script.evaluate;
CA.Script.evaluate = () => {
  throw new Error('condition blew up');
};
M.set(thrower.id, true, { silent: true });
await sleep(300);
CA.Script.evaluate = realEval;
assert(!M.isOn(thrower.id) && /blew up/.test(M.problemOf(thrower.id)), `a throw while running: stopped, with its error (${M.problemOf(thrower.id)})`);
M.save({ ...M.get(thrower.id), source: 'log "fine"\nwait until lumps() > 1000\n' });
M.set(thrower.id, true, { silent: true });
assert(M.isOn(thrower.id) && !M.problemOf(thrower.id), 'fixed: starts again');
M.set(thrower.id, false, { silent: true });

// ---- built-ins' row choices with actions registered later (Elder Pledge's "how")
assert(M.get('elderPledge').options.some((o) => o.key === 'how'), 'Elder Pledge has its “how” choice from the start');

// ---- migrations: v2.22 blocks → code; a built-in's code in prefs.source → its edit
const legacy = JSON.parse(good);
legacy.macros = {
  custom: [{ id: 'old1', name: 'Old blocks', mode: 'flow', every: 1000, flow: [{ type: 'do', action: 'pop.golden', params: {} }, { type: 'wait', cond: { all: [{ cond: 'buff', params: { name: 'Frenzy' }, not: false }] } }] }],
  prefs: { seasonCompletion: { source: 'log "mine"\n', flow: { order: ['easter'] } } },
};
const b4 = boot({ idb: idb(), save: JSON.stringify(legacy) });
await sleep(350);
const M4 = b4.window.CookieMgr.Macros;
assert(/pop\.golden\(\)\nwait until buff\(Frenzy\)/.test(M4.sourceOf(M4.get('old1'))), `v2.22 blocks: written out as code (${JSON.stringify(M4.sourceOf(M4.get('old1')))})`);
assert(M4.sourceOf(M4.get('seasonCompletion')) === 'log "mine"\n' && M4.isCustomized('seasonCompletion'), 'a built-in’s old code: kept, as your edit');
b4.Game.WriteSave();
const s4 = JSON.parse(b4.Game.modSaveData.CookieMgr).macros;
assert(!('flow' in s4.custom[0]) && !('source' in s4.prefs.seasonCompletion) && !('flow' in s4.prefs.seasonCompletion) && s4.prefs.seasonCompletion.custom.source === 'log "mine"\n', 'saved the new way (code only)');

// ---- garden history: one per save
const g5 = boot({ idb: idb() });
makeGarden(g5.Game);
await sleep(400);
const GH = g5.window.CookieMgr.GardenHistory;
GH.sample();
await sleep(50);
assert(GH.list().length > 0, 'garden history recording');
g5.Game.fullDate = 1500000000000; // another save loaded
g5.window.CookieMgr.Events.emit('history', 'load');
await sleep(100);
assert(GH.list().length === 0, 'another save: its own (empty) garden history');

// ---- notification titles are text
CA.Util.notify('<img src=x>', 'ok');
assert(calls.notify[calls.notify.length - 1].title === '&lt;img src=x&gt;', 'notification titles are escaped');

g.errors.splice(0, g.errors.length, ...g.errors.filter((e) => !/macro "Thrower" stopped/.test(e))); // logged on purpose above
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
