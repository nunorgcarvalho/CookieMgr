// v3.0.0 (pantheon): building blocks for the Temple — which spirit is where, and slotting them like
// dragging one in (a swap each, while there are any; back to the roster for free).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w, P } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const M = CA.Macros;
const S = CA.Script;
const pass1 = (src) => M.runPass(S.compile(src).flow);
const logs = (F) => F.trace.map((t) => t.text.replace(/^line \d+: /, ''));

// the Temple's own elements, as the game builds them: three slots and a roster
doc.body.insertAdjacentHTML(
  'beforeend',
  '<div id="templeSlots"><div id="templeSlot0"></div><div id="templeSlot1"></div><div id="templeSlot2"></div></div>' +
    '<div id="templeGods">' +
    [0, 1, 2].map((i) => `<div id="templeGodPlaceholder${i}" style="display:none"></div>`).join('') +
    '</div>'
);
P.godsById.forEach((god) => {
  const div = doc.createElement('div');
  div.id = `templeGod${god.id}`;
  (god.slot >= 0 ? doc.getElementById(`templeSlot${god.slot}`) : doc.getElementById('templeGods')).appendChild(div);
});

// ---- where everyone is
let F = pass1('log pantheon.gods()\nlog pantheon.god(diamond)\nlog pantheon.god(ruby)\nlog pantheon.god(jade)\nlog pantheon.slotOf(decadence)\nlog pantheon.swaps()');
assert(logs(F).join('|') === '[asceticism, decadence, ruin]|asceticism|ruin||none|1', `gods, god(slot), slotOf, swaps (${logs(F)})`);
assert(S.evaluate(S.compile('wait until pantheon.isSlotted(ruin) and not pantheon.isSlotted(decadence)').flow[0].cond).ok, 'isSlotted as a condition');

// ---- slotting: a swap each
F = pass1('pantheon.slot(decadence, jade)');
assert(F.done === 1 && P.slot.join() === '0,2,1' && P.swaps === 0 && doc.getElementById('templeSlot2').contains(doc.getElementById('templeGod1')), 'slot a spirit: uses a swap, its tile moves to the slot');
F = pass1('pantheon.slot(ruin, diamond)');
assert(F.done === 0 && P.slot.join() === '0,2,1', 'no swaps left: nothing moves');
F = pass1('pantheon.slot(decadence, none)');
assert(F.done === 1 && P.slot.join() === '0,2,-1' && P.swaps === 0 && doc.getElementById('templeGods').contains(doc.getElementById('templeGod1')), 'back to the roster: free, its tile back too');
P.swaps = 2;
F = pass1('pantheon.slot(ruin, diamond)');
assert(F.done === 1 && P.slot.join() === '2,0,-1' && P.godsById[0].slot === 1 && doc.getElementById('templeSlot0').contains(doc.getElementById('templeGod2')) && doc.getElementById('templeSlot1').contains(doc.getElementById('templeGod0')), 'onto a taken slot: the two swap places, as in the game');
assert(pass1('pantheon.slot(ruin, diamond)').done === 0 && P.swaps === 1, 'already there: no swap used');
assert(pass1('pantheon.slot("Vomitrax", ruby)').done === 1 && P.slot[1] === 1, 'a spirit by its name works too');

// ---- a macro with it: Godzamok in the diamond slot during a Frenzy, while swaps last
P.swaps = 3;
pass1('pantheon.slot(asceticism, diamond)'); // Holobore back in the diamond slot to start
P.swaps = 3;
w.Game.buffs = {};
const m = M.save({
  name: 'Ruin on Frenzy',
  mode: 'flow',
  every: 50,
  source: 'forever:\n  if buff(Frenzy) and pantheon.god(diamond) != "ruin" and pantheon.swaps() > 0:\n    pantheon.slot(ruin, diamond)\n',
});
M.set(m.id, true, { silent: true });
await sleep(150);
assert(P.slot[0] !== 2, 'no Frenzy: leaves it');
w.Game.buffs.Frenzy = { name: 'Frenzy', time: 100 };
await sleep(150);
M.set(m.id, false, { silent: true });
assert(P.slot[0] === 2 && P.swaps === 2, 'Frenzy: Godzamok in the diamond slot, one swap');
assert(S.lookups().some((l) => l.name === 'Spirit' && l.items.some((i) => i.v === 'ruin')) && S.lookups().some((l) => l.name === 'Slot' && l.items.some((i) => i.v === 'jade')), 'Lookup: spirits and slots');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
