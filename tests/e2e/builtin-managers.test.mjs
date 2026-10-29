// Built-in managers: the ones that come with cookieMgr (Nunix late game) are always there and can't be
// deleted; once changed, Revert to default puts one back as it comes. No more "Put Nunix late game back".
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const G = CA.Managers;
const ID = 'nunixLateGame';

// ---- the model ----
assert(G.isBuiltin(ID) && !G.isEdited(ID), 'Nunix late game: built-in, as it comes');
assert(G.remove(ID) === false && G.find(ID), 'it can’t be deleted');
const mine = G.add('Mine');
assert(!G.isBuiltin(mine) && G.remove(mine.id) === true, 'yours can');
G.setStageMacro(ID, 0, 'stockTrader', 'on');
G.update(ID, { name: 'Nunix, mine' });
assert(G.isEdited(ID), 'changed: edited');
const copy = G.add(null, ID);
assert(!G.isBuiltin(copy) && !G.isEdited(copy), 'its copy is yours (not built-in)');
G.use(ID);
G.revert(ID);
const n = G.find(ID);
assert(n.name === 'Nunix late game' && n.stages[0].macros.stockTrader === 'off' && !G.isEdited(ID), 'Revert: back as it comes');
assert(G.current() === n && G.list()[0] === n, 'still active, still where it was');
G.setCode(ID, 'if cookies() > 1:\n  manager.next()\n');
assert(G.isEdited(ID), 'your own code: edited too');
G.revert(ID);
assert(G.find(ID).code === undefined && !G.isEdited(ID), 'reverted: its stages again');

// ---- a save without it (deleted before built-ins) gets it back ----
const S = CA.Settings;
const saved = JSON.parse(S.serialize());
saved.managers.managers = saved.managers.managers.filter((m) => m.id !== ID);
saved.managers.active = copy.id;
S.load(JSON.stringify(saved));
assert(G.find(ID) && G.list()[0].id === ID && G.current().id === copy.id, 'a save without Nunix: it’s back (at the top), yours still active');

// ---- the page ----
const doc = w.document;
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const menu = () => doc.getElementById('CookieMgrMenu');
const q = (sel) => menu().querySelector(sel);
Game.resets = 1;
CA.UI.Menu.openPage('managers');
await sleep(50);
assert(!q('[data-mgr-act="seeds"]') && !/Put Nunix late game back/.test(menu().textContent), 'no “Put Nunix late game back”');
const row = (id) => q(`[data-mgr-name="${id}"]`).closest('.ca-mgr-row');
assert(!row(ID).querySelector('[data-mgr-act="delete"]') && /built-in/.test(row(ID).textContent), 'Nunix’s row: built-in, no Delete');
assert(row(copy.id).querySelector('[data-mgr-act="delete"].ca-btn-trash'), 'yours: a trash can');
const before = G.list().length;
click(row(ID).querySelector('[data-mgr-act="dup"]'));
const dup = G.list()[G.list().length - 1];
assert(G.list().length === before + 1 && dup.name === 'Nunix late game (copy)' && !G.isBuiltin(dup) && JSON.stringify(dup.stages) === JSON.stringify(G.find(ID).stages), 'Duplicate on Nunix: a copy of its stages, yours');
assert(row(dup.id).querySelector('[data-mgr-act="delete"].ca-btn-trash'), 'the copy can be deleted');
assert(!row(ID).querySelector('[data-mgr-act="revert"]'), 'as it comes: nothing to revert');
G.setStageMacro(ID, 0, 'stockTrader', 'on');
CA.UI.Menu.render();
const rv = row(ID).querySelector('[data-mgr-act="revert"]');
assert(rv && /Revert to default/.test(rv.textContent) && /edited/.test(row(ID).textContent), 'edited: marked, and Revert to default');
click(rv);
assert(G.isEdited(ID), 'the first click asks');
click(row(ID).querySelector('[data-mgr-act="revert"]'));
assert(!G.isEdited(ID) && !row(ID).querySelector('[data-mgr-act="revert"]'), 'the second reverts');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
