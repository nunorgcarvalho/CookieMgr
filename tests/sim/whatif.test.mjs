// What-if numbers in the real game, against doing it for real: slotting a god (CA.WhatIf.godGain),
// switching a dragon aura (auraGain, counting the building it costs), the CpS new prestige levels
// would add (CA.Prestige.cpsGain) — each predicted, then done, and the CpS compared.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 4 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
Game.cookies = 1e30;
Game.cookiesEarned = 1e30;
Game.buyMode = 1;
Object.values(Game.Objects).forEach((o) => o.buy(40));
sim.run({ seconds: 6 });
Game.UpgradesInStore.slice(0, 80).forEach((x) => x.pool !== 'toggle' && x.pool !== 'tech' && x.buy(1));
sim.run({ seconds: 6 });
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
// settled: the game wins CpS milestones inside CalculateGains, their milk counts from the next one
const cpsNow = () => {
  Game.CalculateGains();
  Game.CalculateGains();
  return Game.cookiesPs;
};

// ---- a god in a slot
const temple = Game.Objects.Temple;
if (!temple.minigameLoaded) {
  temple.level = Math.max(1, temple.level);
  temple.minigameUrl && temple.minigame === undefined && Game.LoadMinigames && Game.LoadMinigames();
  sim.run({ seconds: 2 });
}
const M = temple.minigame;
if (M && M.gods) {
  for (const [god, slot] of [['mother', 0], ['ages', 1], ['industry', 0], ['decadence', 2], ['labor', 1]]) {
    if (!M.gods[god]) continue;
    const predicted = CA.WhatIf.godGain(god, slot);
    const before = cpsNow();
    M.slotGod(M.gods[god], slot);
    const real = cpsNow() - before;
    assert(close(predicted, real), `${god} in slot ${slot}: predicted ${predicted.toPrecision(6)}, real ${real.toPrecision(6)}`);
  }
} else assert(true, 'no Pantheon in this game (skipped)');

// ---- a dragon aura (with the building it costs)
Game.dragonLevel = 25;
for (const [aura, slot] of [['Radiant Appetite', 1], ['Breath of Milk', 2], ['Dragon Cursor', 1]]) {
  const predicted = CA.WhatIf.auraGain(aura, slot);
  const before = cpsNow();
  const cost = CA.WhatIf.auraCost();
  Game[slot === 2 ? 'dragonAura2' : 'dragonAura'] = Game.dragonAurasBN[aura].id;
  if (cost) cost.amount--; // as the game charges it
  const real = cpsNow() - before;
  assert(close(predicted, real), `${aura} in slot ${slot}: predicted ${predicted.toPrecision(6)}, real ${real.toPrecision(6)}`);
}

// ---- new prestige levels (they add CpS through the heavenly upgrades that unlock it)
['Legacy', 'Heavenly chip secret', 'Heavenly cookie stand', 'Heavenly bakery', 'Heavenly confectionery', 'Heavenly key'].forEach((n) => Game.Upgrades[n] && (Game.Upgrades[n].bought = 1));
Game.cookiesReset = 2e15;
Game.cookiesEarned = 3e16;
// let the game award what's pending (it checks achievements every 5 s): CookieMgr counts their milk as
// won already, the game only once it has awarded them
Game.recalculateGains = 1;
sim.run({ seconds: 6 });
const gain = CA.Prestige.gain();
const predicted = CA.Prestige.cpsGain();
const before = cpsNow();
Game.prestige += gain;
const real = cpsNow() - before;
Game.prestige -= gain;
assert(gain > 0 && predicted > 0 && close(predicted, real), `prestige: ${gain} levels would add ${predicted.toPrecision(6)} CpS (real ${real.toPrecision(6)})`);
const c = Game.cookiesReset + Game.cookiesEarned;
const t = CA.Prestige.toNext();
const lvl = (x) => Math.floor(CA.Prestige.levelOf(x));
assert(t > 0 && lvl(c + t * (1 + 1e-9)) === CA.Prestige.total() + 1 && lvl(c + t * (1 - 1e-6)) === CA.Prestige.total(), 'toNext: what the next level needs (just under it: not yet)');

assert(sim.game.errors ? sim.game.errors.length === 0 : true, 'no errors in the game');
done();
process.exit();
