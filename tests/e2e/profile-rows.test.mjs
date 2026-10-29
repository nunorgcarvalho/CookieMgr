// Profile rows, the same everywhere: one Use button, or a green "In use" badge in its place on the
// profile in use (CA.UI.C.useButton), and a trash can instead of a Delete button (CA.UI.C.trash).
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w, Game } = g;
const doc = w.document;
const CA = w.CookieMgr;
await sleep(400);
const D = CA.Dragon;

// ---- a dragon at the last level, every aura trained, 300 of each building
Game.Has = () => false;
Game.ObjectsById = Object.values(Game.Objects);
Game.ObjectsById.forEach((o, i) => {
  o.id = i;
  o.single = o.name.toLowerCase();
  o.amount = 300;
  o.sacrifice = (n) => (o.amount -= n);
});
const NAMES = ['No aura', 'Breath of Milk', 'Dragon Cursor', 'Elder Battalion', 'Reaper of Fields', 'Earth Shatterer', 'Master of the Armory', 'Fierce Hoarder', 'Dragon God', 'Arcane Aura', 'Dragonflight', 'Ancestral Metamorphosis', 'Unholy Dominion', 'Epoch Manipulator', 'Mind Over Matter', 'Radiant Appetite', "Dragon's Fortune", "Dragon's Curve", 'Reality Bending', 'Dragon Orbs', 'Supreme Intellect', 'Dragon Guts'];
Game.dragonAuras = {};
Game.dragonAurasBN = {};
NAMES.forEach((name, i) => {
  Game.dragonAuras[i] = { id: i, name, dname: name, pic: [i, 25], desc: `${name} does things.` };
  Game.dragonAurasBN[name] = Game.dragonAuras[i];
});
Game.dragonLevels = [];
for (let i = 0; i < 28; i++) Game.dragonLevels.push({ name: 'Krumblor, cookie dragon', pic: 0, cost: () => false, buy: () => 0, costStr: () => '' });
Game.dragonLevel = 27;
Game.dragonAura = 14; // Mind Over Matter + Dragon Guts: the Drops profile
Game.dragonAura2 = 21;

CA.UI.Menu.openPage('dragon');
await sleep(50);
const row = (id) => doc.querySelector(`[data-dragon-prof="${id}"]`);
const use = (id) => row(id).querySelector('[data-dragon-act="use"]');
assert(row('drops').querySelector('.ca-inuse') && !use('drops') && row('drops').classList.contains('on'), 'the profile in use: an In use badge, no Use button');
assert(use('dropsFlight') && !row('dropsFlight').querySelector('.ca-inuse'), 'the others: a Use button');
assert(/^Put its auras in — 1 switch, each costs 1 /.test(use('dropsFlight').dataset.tip) && /2 switches/.test(use('dragonFlightHarvest').dataset.tip), `what Use takes is on its tip (${use('dropsFlight').dataset.tip})`);
assert(!/switch/.test(row('dropsFlight').textContent) && !row('dropsFlight').querySelector('.ca-pill'), 'no switch-count pill in the row');
assert(doc.querySelectorAll('[data-dragon-prof] .ca-btn-off').length === 3 && [...doc.querySelectorAll('[data-dragon-act="delete"]')].every((b) => b.classList.contains('ca-btn-trash') && b.querySelector('svg') && !/Delete/.test(b.textContent)), 'a trash can each, no Delete word');

click(w, use('dropsFlight'));
await sleep(1100);
assert(Game.dragonAura2 === 10 && row('dropsFlight').querySelector('.ca-inuse') && use('drops'), 'Use: the badge moves to it, Drops gets its Use button back');

const trash = () => row('dragonFlightHarvest').querySelector('[data-dragon-act="delete"]');
click(w, trash());
assert(D.find('dragonFlightHarvest') && /Delete this profile\?/.test(trash().textContent), 'the trash can asks first');
click(w, trash());
await sleep(30);
assert(!D.find('dragonFlightHarvest') && !row('dragonFlightHarvest'), 'and deletes on the second click');

// ---- managers: the same Use / In use and trash can
const yours = CA.Managers.add('Mine');
CA.UI.Menu.openPage('managers');
await sleep(50);
const m = doc.querySelector('.ca-mgr-row');
const mine = doc.querySelector(`[data-mgr-name="${yours.id}"]`).closest('.ca-mgr-row');
assert(m.querySelector('.ca-inuse, [data-mgr-act="use"]') && mine.querySelector('[data-mgr-act="use"]') && mine.querySelector('[data-mgr-act="delete"].ca-btn-trash'), 'a manager row: Use or In use, and a trash can');
assert(!m.querySelector('[data-mgr-act="delete"]'), 'a built-in (Nunix late game): no trash can');
assert(!/active ·/.test(m.textContent), 'no "active ·" pill');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
