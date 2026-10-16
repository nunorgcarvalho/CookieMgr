// The minigames' additions (features/minigameInfo.js) against the game itself: a spell's wait for
// magic and its recovery after casting, as long as the game takes; what Conjure Baked Goods gives, as
// the game pays it; a stock's worth, as the game pays for selling it; a god's CpS in a slot, as
// CA.WhatIf measures it.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 12 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
Game.cookies = 1e15;
Game.cookiesEarned = 1e15;
Game.buyMode = 1;
Object.values(Game.Objects).forEach((o) => o.buy(30));
['Wizard tower', 'Bank', 'Temple'].forEach((n) => (Game.Objects[n].level = Math.max(1, Game.Objects[n].level)));
Game.LoadMinigames && Game.LoadMinigames();
sim.run({ seconds: 3 });
const I = CA.MinigameInfo;
const now = () => sim.game.ctx.Date.now();

// ---- a spell: the wait for magic, as long as the game takes
const G = Game.Objects['Wizard tower'].minigame;
assert(G && G.spells, 'the Grimoire is there');
G.magic = 2;
const s = I.spell('hand of fate');
assert(s && !s.affordable && s.waitFor > 0 && Number.isFinite(s.waitFor), `Force the Hand of Fate: magic enough in ${s && s.waitFor.toFixed(1)} s`);
let t0 = now();
while (G.magic < s.cost && now() - t0 < 3600e3) sim.run({ seconds: 1 });
const took = (now() - t0) / 1000;
assert(Math.abs(took - s.waitFor) <= 1.5, `…the game took ${took} s`);
// recovery after casting: back to where it was
G.magic = G.magicM;
const before = G.magic;
const s2 = I.spell("haggler's charm");
G.castSpell(G.spells["haggler's charm"]);
t0 = now();
while (G.magic < before - 1e-9 && now() - t0 < 3600e3) sim.run({ seconds: 1 });
const back = (now() - t0) / 1000;
assert(Math.abs(back - s2.recover) <= 1.5 && s2.refull === s2.recover, `Haggler’s Charm from full: back to full in ${s2.recover.toFixed(1)} s predicted, ${back} s in the game`);

// ---- Conjure Baked Goods: what it gives now, as the game pays it
G.magic = G.magicM;
const failChance = G.getFailChance;
G.getFailChance = () => 0; // a win, for the comparison
Game.cookies = 1e13;
const c = I.spell('conjure baked goods');
const bank = Game.cookies;
G.castSpell(G.spells['conjure baked goods']);
G.getFailChance = failChance;
assert(c.conjure && Math.abs(Game.cookies - bank - c.conjure.now) <= 1e-6 * c.conjure.now, `Conjure Baked Goods gives ${c.conjure.now.toExponential(4)} — the game paid ${(Game.cookies - bank).toExponential(4)}`);
assert(c.conjure.bank > 0 && c.conjure.reward > 0, 'and the bank for its most');

// ---- a stock: its worth, as the game pays for it
const B = Game.Objects.Bank.minigame;
assert(B && B.goodsById, 'the Stock market is there');
const good = B.goodsById[0];
Game.cookies = 1e15;
B.buyGood(good.id, 5);
const st = I.stock(good.id);
assert(st.held === 5 && Math.abs(st.resting - B.getRestingVal(good.id)) < 1e-12 && Math.abs(st.ratio - B.getGoodPrice(good) / st.resting) < 1e-12, `${good.symbol}: held 5, resting value $${st.resting}, price ÷ resting ${st.ratio.toFixed(3)}`);
good.last = 0; // the game won’t sell what was bought this tick
const cookiesBefore = Game.cookies;
B.sellGood(good.id, 5);
assert(Math.abs(Game.cookies - cookiesBefore - st.worth) <= 1e-6 * st.worth, `its worth ${st.worth.toExponential(4)} — selling paid ${(Game.cookies - cookiesBefore).toExponential(4)}`);
assert(I.MODES.includes(st.mode), `its trend: ${st.mode}`);

// ---- a god: the CpS in each slot
const T = Game.Objects.Temple.minigame;
assert(T && T.gods, 'the Pantheon is there');
const g = I.god(T.gods.industry.id);
assert(g && g.gains.length === 3 && g.gains.every((x) => Math.abs(x.cps - CA.WhatIf.godGain('industry', x.slot)) < 1e-9) && g.gains[0].cps > 0, `Holobore: ${g && g.gains.map((x) => `${x.name} ${x.cps.toExponential(3)}/s`).join(', ')}`);

// ---- words
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
G.magic = 0;
assert(V('spell.waitFor', 'hand of fate') > 0 && V('spell.cost', 'hand of fate') === G.getSpellCost(G.spells['hand of fate']) && Number.isNaN(V('spell.recover', 'hand of fate')), 'spell.waitFor / cost / recover (NaN when it can’t be cast)');
assert(Math.abs(V('stock.restingRatio', good.symbol) - B.getGoodPrice(good) / B.getRestingVal(good.id)) < 1e-12, 'stock.restingRatio');

done();
process.exit();
