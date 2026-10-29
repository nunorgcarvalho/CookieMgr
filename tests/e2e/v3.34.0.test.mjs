// v3.34.0: SeasonCompletion switches the dragon's auras and the Pantheon to their profiles as it goes:
// drops + wrinklers while it hunts drops, dropsFlight on the second Christmas, and on Business day the
// dragonFlightHarvest auras, with the golden Pantheon once there are swaps enough to put it all in at once.
// (v4.0: that's Nunix late game's stages now — the manager switches the profiles, SeasonCompletion
// only does the seasons; a profile is put in once per stage, so a switch by hand stays.)
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ withPantheon: true });
const { window: w, P, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const M = CA.Macros;
// a pass of the manager: the stage it's on, and on to the next once its "until" holds
const pass = () => {
  CA.Managers.step();
  CA.Managers.step();
};
const stopAll = () => M.list().forEach((m) => M.isOn(m.id) && M.set(m.id, false, { silent: true }));

// ---- what's owned
const owned = new Set(CA.AutoBuy.RESEARCH);
Game.Has = (n) => owned.has(n);
Game.santaDrops = ['Santa gift'];
Game.reindeerDrops = ['Reindeer cookie'];
Game.easterEggs = ['Egg'];
Game.halloweenDrops = ['Ghost cookie'];
Game.heartDrops = ['Heart biscuit'];
Game.santaLevel = 0;

// ---- a dragon with both slots and every aura trained
Game.ObjectsById = Object.values(Game.Objects);
Game.ObjectsById.forEach((o) => (o.sacrifice = (n) => (o.amount = Math.max(0, o.amount - n))));
const NAMES = ['No aura', 'Breath of Milk', 'Dragon Cursor', 'Elder Battalion', 'Reaper of Fields', 'Earth Shatterer', 'Master of the Armory', 'Fierce Hoarder', 'Dragon God', 'Arcane Aura', 'Dragonflight', 'Ancestral Metamorphosis', 'Unholy Dominion', 'Epoch Manipulator', 'Mind Over Matter', 'Radiant Appetite', "Dragon's Fortune", "Dragon's Curve", 'Reality Bending', 'Dragon Orbs', 'Supreme Intellect', 'Dragon Guts'];
Game.dragonAuras = {};
NAMES.forEach((name, i) => (Game.dragonAuras[i] = { id: i, name, dname: name, pic: [i, 25] }));
Game.dragonLevels = Array.from({ length: 28 }, () => ({ name: 'Krumblor', cost: () => false, buy() {}, costStr: () => '' }));
Game.dragonLevel = 27;
Game.dragonAura = 0;
Game.dragonAura2 = 0;
const auras = () => [Game.dragonAura, Game.dragonAura2].map((i) => NAMES[i]).sort().join(' + ');

// ---- the Pantheon's other spirits
[
  ['seasons', 'Selebrak, Spirit of Festivities'],
  ['labor', 'Muridal, Spirit of Labor'],
  ['scorn', 'Skruuia, Spirit of Scorn'],
].forEach(([k, name], i) => {
  P.gods[k] = { id: 3 + i, slot: -1, name, icon: [24 + i, 18] };
  P.godsById.push(P.gods[k]);
});
const temple = () => P.slot.map((id) => (id >= 0 ? Object.keys(P.gods).find((k) => P.gods[k].id === id) : '')).join();

// ---- the first Christmas: hunting drops
P.swaps = 3;
pass();
assert(auras() === 'Dragon Guts + Mind Over Matter', `first Christmas: Mind Over Matter + Dragon Guts (${auras()})`);
assert(temple() === 'scorn,,' && CA.Pantheon.isActive('wrinklers'), `first Christmas: Skruuia alone, in the diamond slot (${temple()})`);
const swapsLeft = P.swaps;
pass();
assert(P.swaps === swapsLeft && auras() === 'Dragon Guts + Mind Over Matter', 'a second pass changes nothing (no swaps, no buildings spent)');

// ---- Easter, Halloween, Valentine's day: still hunting drops
['A festive hat', 'Santa gift'].forEach((n) => owned.add(n));
Game.santaLevel = 14;
Game.dragonAura = 10; // someone switched to Dragonflight by hand
P.slotGod(P.gods.labor, 1);
pass();
assert(auras() === 'Dragon Guts + Dragonflight' && temple() === 'scorn,labor,', `Easter, same stage: a switch by hand stays (${auras()}; ${temple()})`);
CA.Managers.goTo(1); // Drops again
pass();
assert(auras() === 'Dragon Guts + Mind Over Matter' && temple() === 'scorn,,', `going into the stage again puts its profiles back (${auras()}; ${temple()})`);
['Egg', 'Ghost cookie'].forEach((n) => owned.add(n));
pass();
assert(auras() === 'Dragon Guts + Mind Over Matter' && CA.Managers.where().index === 0, 'Valentine’s day: still the drops stage');

// ---- the second Christmas: reindeer only, Dragonflight in for Dragon Guts
owned.add('Heart biscuit');
pass();
assert(auras() === 'Dragonflight + Mind Over Matter', `second Christmas: Mind Over Matter + Dragonflight (${auras()})`);
assert(Game.dragonAura === 14 || Game.dragonAura2 === 14, 'Mind Over Matter stays where it was (one switch)');
assert(temple() === 'scorn,,', 'second Christmas: the Pantheon left alone');

// ---- Business day: the golden auras; the golden Pantheon only with swaps for all of it
owned.add('Reindeer cookie');
P.swaps = 2;
pass();
assert(auras() === 'Dragonflight + Reaper of Fields', `Business day: Dragonflight + Reaper of Fields (${auras()})`);
assert(temple() === 'scorn,,' && P.swaps === 2, `Business day, 2 swaps: waits for the third (${temple()})`);
P.swaps = 3;
pass();
assert(temple() === 'decadence,seasons,labor' && P.swaps === 0, `Business day, 3 swaps: Vomitrax, Selebrak, Muridal (${temple()})`);
P.swaps = 3;
pass();
assert(P.swaps === 3 && temple() === 'decadence,seasons,labor', 'then left as it is');

stopAll();

// ---- no dragon, no Pantheon: the seasons still go on
const g2 = boot();
await sleep(400);
const M2 = g2.window.CookieMgr.Macros;
const F = M2.runPass(g2.window.CookieMgr.Script.compile(M2.get('seasonCompletion').defaultSource).flow);
g2.window.CookieMgr.Managers.step();
assert(F && !g2.errors.length, 'without a dragon or a Temple: runs, no errors');
M2.list().forEach((m) => M2.isOn(m.id) && M2.set(m.id, false, { silent: true }));

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
