// v3.30.0: Pantheon profiles — named combinations of the three slots (two to start: Wrinklers and
// Golden), a row each on the Pantheon page (rename, a spirit per slot, Use, Delete, New profile,
// From current), saved with the game; pantheon.profile(p) slots one while swaps last, and the
// profileActive / profileSwaps / activeProfile / profiles values tell where it stands.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const idb = { factory: new IDBFactory(), IDBKeyRange };
const g = boot({ idb, withPantheon: true });
const { window: w, P, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const S = CA.Script;
const PA = CA.Pantheon;
const pass1 = (src) => CA.Macros.runPass(S.compile(src).flow);
const val = (src) => S.evaluate(S.compile(`wait until ${src}`).flow[0].cond).ok;

// the rest of the spirits, as minigamePantheon.js has them
[
  ['seasons', 'Selebrak, Spirit of Festivities'],
  ['labor', 'Muridal, Spirit of Labor'],
  ['scorn', 'Skruuia, Spirit of Scorn'],
].forEach(([k, name], i) => {
  P.gods[k] = { id: 3 + i, slot: -1, name, icon: [24 + i, 18] };
  P.godsById.push(P.gods[k]);
});
const keys = () => P.slot.map((id) => (id >= 0 ? Object.keys(P.gods).find((k) => P.gods[k].id === id) : '')).join();

// ---- the two to start with
const ps = PA.profiles();
assert(ps.map((p) => `${p.id}:${p.name}:${p.slots.join('/')}`).join(' ') === 'wrinklers:Wrinklers:scorn// golden:Golden:decadence/seasons/labor', `seeded profiles (${ps.map((p) => p.id)})`);
assert(pass1('log pantheon.profiles()').trace.some((t) => /\[wrinklers, golden\]/.test(t.text)), 'pantheon.profiles()');
assert(S.lookups().some((l) => l.name === 'Pantheon profile' && l.items.some((i) => i.v === 'golden')), 'Lookup: Pantheon profile');

// ---- swaps it takes; applying while swaps last
// now: asceticism, ruin, empty — with 1 swap
assert(keys() === 'asceticism,ruin,' && P.swaps === 1, 'start');
assert(PA.swapsFor('golden') === 3 && PA.swapsFor('Wrinklers') === 1, `swaps needed (${PA.swapsFor('golden')}, ${PA.swapsFor('wrinklers')})`);
assert(!val('pantheon.profileActive(golden)'), 'Golden not on');
let F = pass1('pantheon.profile(golden)');
assert(F.done === 1 && keys() === 'decadence,ruin,' && P.swaps === 0, `one swap: diamond first (${keys()})`);
F = pass1('pantheon.profile(golden)');
assert(F.done === 0 && keys() === 'decadence,ruin,', 'no swaps left: waits');
assert(val('pantheon.profileSwaps("Golden") == 2'), 'still takes 2');
P.swaps = 3;
F = pass1('pantheon.profile("golden")');
assert(F.done === 2 && keys() === 'decadence,seasons,labor' && P.swaps === 1, `finished as swaps come back (${keys()})`);
assert(val('pantheon.profileActive(golden)') && val('pantheon.activeProfile() == "golden"'), 'in use; activeProfile');
assert(pass1('pantheon.profile(golden)').done === 0 && P.swaps === 1, 'already on: nothing, no swap');

// ---- Wrinklers: Skruuia in the diamond slot, the others emptied (free)
F = pass1('pantheon.profile(Wrinklers)');
assert(F.done === 3 && keys() === 'scorn,,' && P.swaps === 0, `by its name; emptying is free (${keys()}, ${P.swaps})`);
assert(val('pantheon.activeProfile() == "wrinklers"'), 'Wrinklers in use');

// ---- a spirit already slotted elsewhere: the game swaps the two (one swap)
const mine = PA.add('Swap test', ['', 'scorn', '']);
P.swaps = 1;
assert(PA.swapsFor(mine) === 1 && PA.apply(mine) === 1 && keys() === ',scorn,', `moved across (${keys()})`);

// ---- the page: a row each
PA.remove(mine);
P.swaps = 3;
CA.UI.Menu.openPage('pantheon');
const page = () => doc.querySelector('[data-page="pantheon"]');
const rows = () => [...page().querySelectorAll('[data-pp-row]')];
assert(rows().length === 2 && /needs 1 swap/.test(rows()[0].textContent) && /needs 3 swaps/.test(rows()[1].textContent), `rows and their states (${rows().map((r) => r.textContent.replace(/\s+/g, ' ')).join(' | ')})`);
click(w, rows()[0].querySelector('[data-pp-act="use"]'));
assert(keys() === 'scorn,,' && rows()[0].classList.contains('on') && /in use/.test(rows()[0].textContent), 'Use');
// change a slot; a spirit picked twice leaves its other slot
const sel = (row, i) => row.querySelector(`[data-pp-slot][data-i="${i}"]`);
const change = (el, v) => {
  el.value = v;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};
change(sel(rows()[1], 2), 'ruin');
change(sel(rows()[1], 0), 'ruin');
assert(PA.profileOf('golden').slots.join('/') === 'ruin/seasons/', `a slot picked; ruin left jade (${PA.profileOf('golden').slots})`);
change(rows()[1].querySelector('[data-pp-name]'), 'Golden 2');
assert(PA.profileOf('golden').name === 'Golden 2' && PA.profileOf('golden 2').id === 'golden' && val('pantheon.profileSwaps("golden 2") == 2'), 'renamed; found by its new name');
click(w, page().querySelector('[data-pp-act="current"]'));
assert(rows().length === 3 && PA.profiles()[2].slots.join('/') === 'scorn//' && /in use/.test(rows()[2].textContent), 'From current');
click(w, page().querySelector('[data-pp-act="new"]'));
assert(rows().length === 4 && PA.profiles()[3].slots.join('/') === '//', 'New profile: empty');
const del = () => rows()[3].querySelector('[data-pp-act="delete"]');
click(w, del());
assert(rows().length === 4, 'Delete: armed first');
click(w, del());
assert(rows().length === 3, 'deleted');

// ---- in the Temple: the page follows
P.swaps = 3;
PA.slot('asceticism', 'diamond');
await sleep(1200);
assert(!rows()[0].classList.contains('on') && /needs 1 swap/.test(rows()[0].textContent), 'slots changed elsewhere: the page redraws');

// ---- saved with the game
Game.WriteSave();
const raw = Game.modSaveData.CookieMgr;
w.localStorage.clear();
w.close();
const g2 = boot({ idb, save: raw, withPantheon: true });
await sleep(400);
const back = g2.window.CookieMgr.Pantheon.profiles();
assert(back.length === 3 && back[1].name === 'Golden 2' && back[1].slots.join('/') === 'ruin/seasons/', `restored after a reload (${back.map((p) => p.name)})`);
g2.window.close();

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
