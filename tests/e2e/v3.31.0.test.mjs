// v3.31.0: the dragon. Training it (Auto dragon, dragon.train), its auras (dragon.setAura) and aura
// profiles (dragon.profile, three seeded: drops, dropsFlight, golden), saved with the game, on a new
// Dragon page under the Grimoire.
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w, Game } = g;
const doc = w.document;
const CA = w.CookieMgr;
await sleep(400);
const D = CA.Dragon;

// ---- a dragon like main.js's: levels 0–4 cost cookies, 5–24 100 of a building, 25 50 and 26 200 of every one
const owned = new Set();
Game.Has = (n) => owned.has(n);
Game.ObjectsById = Object.values(Game.Objects);
Game.ObjectsById.forEach((o, i) => {
  o.id = i;
  o.single = o.name.toLowerCase();
  o.sacrifice = (n) => (o.amount = Math.max(0, o.amount - n));
});
const NAMES = ['No aura', 'Breath of Milk', 'Dragon Cursor', 'Elder Battalion', 'Reaper of Fields', 'Earth Shatterer', 'Master of the Armory', 'Fierce Hoarder', 'Dragon God', 'Arcane Aura', 'Dragonflight', 'Ancestral Metamorphosis', 'Unholy Dominion', 'Epoch Manipulator', 'Mind Over Matter', 'Radiant Appetite', "Dragon's Fortune", "Dragon's Curve", 'Reality Bending', 'Dragon Orbs', 'Supreme Intellect', 'Dragon Guts'];
Game.dragonAuras = {};
NAMES.forEach((name, i) => (Game.dragonAuras[i] = { id: i, name, dname: name, pic: [i, 25], desc: `${name} does things.` }));
Game.dragonAurasBN = {};
NAMES.forEach((n, i) => (Game.dragonAurasBN[n] = Game.dragonAuras[i]));
const every = (n) => ({
  cost: () => Game.ObjectsById.every((o) => o.amount >= n),
  buy: () => Game.ObjectsById.forEach((o) => o.sacrifice(n)),
  costStr: () => `${n} of every building`,
});
Game.dragonLevels = [];
for (let i = 0; i < 28; i++) {
  const lv = { name: i < 4 ? 'Dragon egg' : 'Krumblor, cookie dragon', pic: 0 };
  if (i < 5) Object.assign(lv, { cost: () => Game.cookies >= 1e6 * 2 ** i, buy: () => (Game.cookies -= 1e6 * 2 ** i), costStr: () => `${1e6 * 2 ** i} cookies` });
  else if (i < 25) {
    const b = Game.ObjectsById[(i - 5) % Game.ObjectsById.length];
    Object.assign(lv, { cost: () => b.amount >= 100, buy: () => b.sacrifice(100), costStr: () => `100 ${b.single}` });
  } else if (i < 27) Object.assign(lv, every(i === 25 ? 50 : 200));
  Game.dragonLevels.push(lv);
}
Game.dragonLevel = 0;
Game.dragonAura = 0;
Game.dragonAura2 = 0;
const egg = { name: 'A crumbly egg', unlocked: 0, bought: 0, basePrice: 25, getPrice: () => 25, buy() {
  if (Game.cookies < 25) return;
  Game.cookies -= 25;
  this.bought = 1;
  owned.add('A crumbly egg');
} };
Game.Upgrades = { ...(Game.Upgrades || {}), 'A crumbly egg': egg };

// ---- seeded profiles
assert(D.list().map((p) => p.id).join() === 'drops,dropsFlight,golden', 'three seeded profiles');
assert(D.find('drops').auras.join() === 'Mind Over Matter,Dragon Guts', 'Drops: Mind Over Matter + Dragon Guts');
assert(D.find('dropsFlight').auras.join() === 'Mind Over Matter,Dragonflight', 'Drops & flight: Mind Over Matter + Dragonflight');
assert(D.find('golden').auras.join() === 'Dragonflight,Reaper of Fields', 'Golden: Dragonflight + Reaper of Fields');
assert(D.find('GOLDEN') === D.find('golden') && D.find('Drops & flight').id === 'dropsFlight', 'found by id or name, any case');

// ---- training: the egg, then cookies
assert(!D.canTrain('all') && D.train('all') === 0, 'no egg: nothing to train');
egg.unlocked = 1;
Game.cookies = 100;
assert(D.nextAction() === 'Buy the egg' && D.canTrain('none') && D.train('none') === 1 && owned.has('A crumbly egg'), 'buys A crumbly egg');
Game.cookies = 1e8;
const m = CA.Macros.get('autoDragon');
assert(m && m.builtin && m.section === 'upkeep', 'the Auto dragon macro, with the upkeep ones');
for (let i = 0; i < 5; i++) CA.Macros.runOnce('autoDragon');
assert(Game.dragonLevel === 5 && Game.cookies === 1e8 - 31e6, `chips and hatches the egg with cookies (level ${Game.dragonLevel}, ${Game.cookies})`);
assert(D.slots() === 1, 'one aura slot from level 5');

// level 5 costs 100 Cursors
Game.Objects.Cursor.amount = 150;
assert(D.nextAction() === 'Train Dragon Cursor' && /100 cursor/.test(D.nextCost().text), `next: Dragon Cursor for 100 cursors (${D.nextAction()})`);
assert(!D.canTrain('none') && D.canTrain('one'), 'buildings: none skips it, one allows it');
assert(CA.Actions.run('dragon.train', { buildings: 'one' }) === 1 && Game.dragonLevel === 6 && Game.Objects.Cursor.amount === 50, 'trains it, sacrificing 100 cursors');
Game.dragonLevel = 25;
Game.ObjectsById.forEach((o) => (o.amount = 300));
assert(!D.canTrain('one') && D.canTrain('all'), 'the every-building levels: only with all');

// ---- auras and profiles, one slot (level 18: Mind Over Matter trained, Dragon Guts not)
Game.dragonLevel = 18;
const wiz = Game.Objects['Wizard tower'];
const before = wiz.amount;
assert(!D.isActive('drops') && D.status('drops').untrained.join() === 'Dragon Guts', 'Drops: Dragon Guts not trained yet');
assert(CA.Actions.run('dragon.profile', { profile: 'drops' }) === 1 && Game.dragonAura === 14 && Game.dragonAura2 === 0, 'one slot: its first trained aura (Mind Over Matter)');
assert(wiz.amount === before - 1, 'costs one of the highest building');
assert(D.isActive('drops') && D.apply('drops') === 0 && wiz.amount === before - 1, 'in: using it again does nothing, for free');
assert(D.activeProfile() === 'drops', 'the active profile');
assert(D.apply('golden') === 1 && Game.dragonAura === 10, 'Golden: Dragonflight');
assert(D.setAura('Dragon Guts', 1) === 0, 'an aura not trained yet can’t go in');
assert(D.setAura('Reaper of Fields', 2) === 0, 'nor slot 2 before level 27');

// ---- two slots
Game.dragonLevel = 27;
assert(D.slots() === 2 && D.status('golden').switches === 1, 'two slots: Golden needs one more switch');
assert(D.apply('golden') === 1 && Game.dragonAura === 10 && Game.dragonAura2 === 4, 'puts Reaper of Fields beside Dragonflight');
Game.dragonAura = 4;
Game.dragonAura2 = 10;
assert(D.isActive('golden') && D.apply('golden') === 0, 'swapped round, still in: no switch');
assert(D.apply('dropsFlight') === 1 && Game.dragonAura === 14 && Game.dragonAura2 === 10, 'Drops & flight keeps Dragonflight, swaps Reaper for Mind Over Matter');
assert(D.apply('drops') === 1 && Game.dragonAura === 14 && Game.dragonAura2 === 21, 'Drops: Dragon Guts in for Dragonflight');

// ---- script words
['dragon.level', 'dragon.aura', 'dragon.canTrain', 'dragon.profileActive', 'dragon.activeProfile', 'dragon.profiles'].forEach((id) => assert(CA.Script.VALUES.some((v) => v.id === id), `value ${id}`));
const code = 'if not dragon.profileActive(golden):\n  dragon.profile(golden)\n';
const comp = CA.Script.compile(code, { vars: [] });
assert(comp && !(comp.errors && comp.errors.length), `a macro can use a profile (${JSON.stringify(comp && comp.errors)})`);

// ---- yours: add, rename, change, delete — saved with the game
const mine = D.add('Mine', true);
assert(mine.auras.join() === 'Mind Over Matter,Dragon Guts' && D.isActive(mine.id), 'From current: the auras in now');
D.update(mine.id, { name: 'Lumps', auras: ["Dragon's Curve", ''] });
D.remove('dropsFlight');
const saved = CA.Settings.serialize();
D.remove('golden');
CA.Settings.load(saved);
assert(D.list().map((p) => p.name).join() === 'Drops,Golden,Lumps' && D.find('Lumps').auras.join() === "Dragon's Curve,", `restored from the save (${D.list().map((p) => p.name).join()})`);

// ---- the page
CA.UI.Menu.openPage('dragon');
await sleep(50);
const page = () => doc.querySelector('[data-page="dragon"]');
assert(page() && page().querySelectorAll('.ca-aura-slot').length === 2, 'the Dragon page: two aura slots');
assert(page().querySelectorAll('[data-dragon-prof]').length === 3, 'a row per profile');
assert(page().querySelector('[data-id="autoDragon"]'), 'the Auto dragon macro on it');
click(w, page().querySelector('[data-dragon-act="new"]'));
await sleep(30);
assert(D.list().length === 4 && page().querySelectorAll('[data-dragon-prof]').length === 4, 'New profile adds a row');
const last = D.list()[3];
const sel = page().querySelector(`[data-dragon-aura="${last.id}:0"]`);
sel.value = 'Radiant Appetite';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(D.find(last.id).auras[0] === 'Radiant Appetite', 'picking an aura changes the profile');
const del = page().querySelector(`[data-dragon-act="delete"][data-id="${last.id}"]`);
click(w, del);
assert(D.list().length === 4, 'Delete arms first');
click(w, del);
await sleep(30);
assert(D.list().length === 3, 'then deletes');
Game.dragonAura = 0;
Game.dragonAura2 = 0;
click(w, page().querySelector('[data-dragon-act="use"][data-id="golden"]'));
assert(Game.dragonAura === 10 && Game.dragonAura2 === 4, 'Use puts its auras in');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
