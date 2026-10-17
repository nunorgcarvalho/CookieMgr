// Force the Hand of Fate on combos, Forecast on (v3.12.1), in the real game: combo after combo
// (Frenzy + Dragonflight), the macro running on the game's clock — every Force the Hand of Fate it
// casts gives a click frenzy or a building special, Skip ahead (Haggler's Charm) brings good casts
// closer — with no limit (v3.12.3) as with a cap — and the same combos with Forecast off get whatever comes (some bad).
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 7 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
Game.cookies = 1e60; // enough for 400 wizard towers (a magic bar of ~90: room for one skip)
Game.cookiesEarned = 1e60;
Game.buyMode = 1;
Game.Objects['Wizard tower'].buy(400);
Game.Objects['Wizard tower'].level = Math.max(1, Game.Objects['Wizard tower'].level);
['Cursor', 'Grandma', 'Farm', 'Mine', 'Factory', 'Bank', 'Temple'].forEach((b) => Game.Objects[b].buy(20)); // building specials can come
Game.LoadMinigames && Game.LoadMinigames();
sim.run({ seconds: 3 });
const M = Game.Objects['Wizard tower'].minigame;
assert(M && M.spells && M.spells['hand of fate'] && M.spells["haggler's charm"], 'the Grimoire is there');
assert(M.magicM - M.getSpellCost(M.spells["haggler's charm"]) >= M.getSpellCost(M.spells["hand of fate"]), `a magic bar with room to skip ahead once (${Math.round(M.magicM)}: Force the Hand of Fate ${Math.round(M.getSpellCost(M.spells['hand of fate']))}, Haggler’s Charm ${Math.round(M.getSpellCost(M.spells["haggler's charm"]))})`);

// every cast, as it happens: the spell, and what Force the Hand of Fate's golden cookie gives
const casts = [];
const castSpell = M.castSpell;
M.castSpell = function (spell) {
  const n0 = Game.shimmers.length;
  const ok = castSpell.apply(this, arguments);
  if (ok) {
    const s = Game.shimmers.length > n0 ? Game.shimmers[Game.shimmers.length - 1] : null;
    casts.push({ spell: spell.name, force: spell === M.spells['hand of fate'] && s ? s.force : '' });
  }
  return ok;
};
const clear = () => {
  Game.shimmers.slice().forEach((s) => s.die && s.die());
  Object.values(Game.buffs).forEach((b) => (b.time = 0));
  sim.run({ ms: 200 });
};
const GOOD = ['click frenzy', 'building special'];
const id = CA.Grimoire.AUTO_ID;
/** n combos of Frenzy + Dragonflight, the macro on: what Force the Hand of Fate gave, and how many Haggler's Charms. */
function combos(n) {
  casts.length = 0;
  CA.Macros.set(id, true, { silent: true });
  for (let i = 0; i < n; i++) {
    clear();
    M.magic = M.magicM; // a full bar for each combo
    Game.gainBuff('frenzy', 30, 7);
    Game.gainBuff('dragonflight', 30, 1111);
    sim.run({ seconds: 6 });
  }
  CA.Macros.set(id, false, { silent: true });
  clear();
  const forces = casts.filter((c) => c.spell === 'Force the Hand of Fate').map((c) => c.force);
  return { forces, hagglers: casts.filter((c) => c.spell === "Haggler's Charm").length };
}

// ---- Forecast off: whatever comes
CA.Macros.setInput(id, 'forecast', 'off');
CA.Macros.setInput(id, 'skipAhead', 0);
const off = combos(24);
const offBad = off.forces.filter((f) => !GOOD.includes(f));
assert(off.forces.length >= 20 && off.hagglers === 0, `Forecast off: casts on every combo (${off.forces.length} casts) and never skips ahead`);
assert(offBad.length > 0, `…and gets some bad ones (${offBad.length} of ${off.forces.length}: ${[...new Set(offBad)].join(', ')})`);

// ---- Forecast on, Skip ahead 1 (a full bar has room for one): only good casts
CA.Macros.setInput(id, 'forecast', 'good');
CA.Macros.setInput(id, 'skipAhead', 1);
const on = combos(24);
const onBad = on.forces.filter((f) => !GOOD.includes(f));
assert(on.forces.length > 0 && onBad.length === 0, `Forecast on: every Force the Hand of Fate a click frenzy or a building special (${on.forces.length} casts: ${on.forces.join(', ')})`);
assert(on.hagglers > 0, `Skip ahead: Haggler’s Charm moved the forecast on toward good casts (${on.hagglers} times)`);

// ---- Skip ahead 0 (v3.12.3: no limit, the default) — never stalls: at least as many good casts, all good
CA.Macros.setInput(id, 'skipAhead', 0);
const free = combos(24);
const freeBad = free.forces.filter((f) => !GOOD.includes(f));
assert(freeBad.length === 0 && free.forces.length >= on.forces.length && free.hagglers >= on.hagglers, `no limit: ${free.forces.length} casts, all good (${free.forces.join(', ')}), ${free.hagglers} skips — capped at 1: ${on.forces.length} casts, ${on.hagglers} skips`);

assert(sim.errors().length === 0, 'no errors in the game' + (sim.errors().length ? `: ${sim.errors().slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
