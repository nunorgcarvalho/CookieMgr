// v2.30.0: the store (and anything else meant to scroll) keeps its scroll position; the store
// sorts read Default, Bulk PP, Achievement; auto-FtHoF is an algorithmic macro casting on combos.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, G, calls } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- scrolling the store: left alone; a container the game keeps still: put back
const right = doc.getElementById('sectionRight') || doc.body.appendChild(Object.assign(doc.createElement('div'), { id: 'sectionRight' }));
right.style.overflowY = 'scroll'; // as in the game: the store scrolls
Object.defineProperty(right, 'scrollTop', { value: 800, writable: true, configurable: true });
const game = doc.getElementById('game');
game.style.overflow = 'hidden';
Object.defineProperty(game, 'scrollTop', { value: 120, writable: true, configurable: true });
CA.Util.unshift();
assert(right.scrollTop === 800, 'the store keeps its scroll position');
assert(game.scrollTop === 0, 'a shifted game container is still put back');
await sleep(2200);
assert(right.scrollTop === 800, '…every time the guard runs');

// ---- the store's sorts, in order
assert(CA.Shop.SORTS.map((s) => s.name).join() === 'Default,Bulk PP,Achievement', `sorts: ${CA.Shop.SORTS.map((s) => s.name)}`);
CA.UI.StoreBar.render();
const btns = [...doc.querySelectorAll('[data-ss-sort]')].map((b) => b.dataset.ssSort);
assert(btns.join() === 'default,value,achievement', `store bar buttons in that order (${btns})`);

// ---- auto FtHoF on combos
const M = CA.Macros;
const auto = M.get(CA.Grimoire.AUTO_ID);
assert(auto.mode === 'flow' && M.sourceOf(auto) === CA.Grimoire.COMBO_SOURCE && !CA.Script.compile(CA.Grimoire.COMBO_SOURCE).errors.length, 'an algorithmic macro, its code compiles');
const BUFFS = {
  F: { name: 'Frenzy', time: 300, maxTime: 300, multCpS: 7 },
  D: { name: 'Dragonflight', time: 300, maxTime: 300, multClick: 1111 },
  C: { name: 'Click frenzy', time: 300, maxTime: 300, multClick: 777 },
  B: { name: 'High-five', time: 300, maxTime: 300, multCpS: 2, type: { name: 'building buff' } },
  E: { name: 'Elder frenzy', time: 300, maxTime: 300, multCpS: 666 },
};
async function casts(keys) {
  Game.buffs = {};
  keys.split('').forEach((k) => (Game.buffs[BUFFS[k].name] = { ...BUFFS[k] }));
  calls.spells.length = 0;
  G.magic = 100;
  M.set(auto.id, true, { silent: true });
  await sleep(350);
  M.set(auto.id, false, { silent: true });
  Game.buffs = {};
  return calls.spells.filter((s) => s === 'Force the Hand of Fate').length;
}
for (const combo of ['FD', 'FC', 'FB', 'BD', 'BC']) assert((await casts(combo)) === 1, `casts on ${combo.split('').map((k) => BUFFS[k].name).join(' + ')}`);
for (const no of ['', 'F', 'C', 'D', 'B', 'DC', 'E', 'FE']) assert((await casts(no)) === 0, `not on ${no ? no.split('').map((k) => BUFFS[k].name).join(' + ') : 'nothing'}`);
// not enough magic: waits, then casts during the same combo
Game.buffs = { Frenzy: { ...BUFFS.F }, Dragonflight: { ...BUFFS.D } };
calls.spells.length = 0;
G.magic = 5;
M.set(auto.id, true, { silent: true });
await sleep(350);
assert(calls.spells.length === 0, 'not enough magic: waits');
G.magic = 100;
await sleep(350);
M.set(auto.id, false, { silent: true });
assert(calls.spells.length === 1, 'casts once the magic is there');
Game.buffs = {};

// its code is editable, and reverts
M.customize(auto.id, { ...auto, source: 'forever:\n  if buff(Frenzy):\n    spell.cast("hand of fate")\n' });
assert((await casts('F')) === 1 && M.isCustomized(auto.id), 'your own version runs');
M.revert(auto.id);
assert(M.sourceOf(M.get(auto.id)) === CA.Grimoire.COMBO_SOURCE && (await casts('F')) === 0, 'Revert to default: the combos again');

// the Grimoire toolbar says so
CA.UI.Menu.openPage('wizard');
await sleep(1100);
const tb = doc.querySelector('[data-cm-gt="auto"]');
assert(tb && /Auto FtHoF on combos/.test(tb.textContent), `toolbar label (${tb && tb.textContent})`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
