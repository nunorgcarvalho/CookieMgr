// What payback costs (v3.7.1): buying asks only for what it can buy — the unlocked buildings at the
// amount a buy takes, and the store's upgrades — never the sixty rows of the colour table (every
// building at ×1, ×10 and ×100, locked ones too), which only the store's colours and the Payback page
// need. Counted in the real game: the game's CpS computations (Game.CalculateGains) per best() after a
// purchase, in a fresh game and a late one; per buy.best pass with a bank that buys on every one (the
// simulator's garden6 case); and the ranking the same as the full table's.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 3 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
let n = 0;
const calc = Game.CalculateGains;
Game.CalculateGains = function () {
  n++;
  return calc.apply(this, arguments);
};
const unlocked = () => Object.values(Game.Objects).filter((b) => !b.locked).length;
const store = () => CA.Payback.storeUpgrades().length;
/** CpS computations for one best() right after a purchase (a state not seen before). */
let fresh0 = 0;
function costOfBest(kind = 'all', opts) {
  Game.pledges = 1000 + ++fresh0; // in the cache's key, not in the CpS: a new state, as after a purchase
  n = 0;
  CA.Payback.best(kind, opts);
  return n;
}

// ---- a fresh game: a couple of buildings to buy, nothing else measured
Game.cookies = 500;
Game.buyMode = 1;
Game.Objects.Cursor.buy(3);
sim.run({ seconds: 1 });
const fresh = costOfBest();
const bound = (u, s) => u + s + 4; // one per thing + a baseline and putting the game back, for the buildings and for the upgrades
assert(fresh <= bound(unlocked(), store()), `fresh game: ${fresh} CpS computations for best() (≤ ${bound(unlocked(), store())}: ${unlocked()} unlocked buildings, ${store()} upgrades) — was 60+`);

// ---- a late game: every building, many upgrades
Game.cookies = 1e40;
Game.cookiesEarned = 1e40;
Object.values(Game.Objects).forEach((o) => o.buy(50));
sim.run({ seconds: 6 });
Game.UpgradesInStore.slice(0, 80).forEach((x) => x.pool !== 'toggle' && x.pool !== 'tech' && x.buy(1));
sim.run({ seconds: 6 });
const late = costOfBest();
assert(late <= bound(unlocked(), store()) && late < 60 + store(), `late game: ${late} for best() (≤ ${bound(unlocked(), store())}: ${unlocked()} buildings, ${store()} upgrades — not the 60 rows of the colour table)`);
const onlyB = costOfBest('building');
assert(onlyB > 0 && onlyB <= unlocked() + 3, `best(building): the buildings only (${onlyB})`);
// a bank too small for most upgrades: those whose wait alone outlasts the best building aren't measured
Game.cookies = 1;
const pruned = costOfBest('all');
assert(pruned < unlocked() + store(), `a small bank: ${pruned} — upgrades that can't beat the best building on their wait alone aren't measured (of ${unlocked() + store()})`);
const skipped = costOfBest('all', { skip: true });
assert(skipped <= 3, `skip what you can't afford, with nothing affordable: ${skipped}`);
// the same answer as the full table
Game.cookies = 1e25;
const lazy = CA.Payback.ranking('all').slice(0, 10).map((x) => `${x.kind}:${x.name}`);
const t = CA.Payback.table();
const full = Object.values(t.buildings[1])
  .filter((r) => !Game.Objects[r.name].locked)
  .map((r) => ({ k: `building:${r.name}`, pp: r.pp }))
  .concat(
    CA.Payback.storeUpgrades()
      .filter((u) => t.upgrades[u.name])
      .map((u) => ({ k: `upgrade:${u.name}`, pp: t.upgrades[u.name].pp }))
  )
  .filter((x) => Number.isFinite(x.pp))
  .sort((a, b) => a.pp - b.pp)
  .slice(0, 10)
  .map((x) => x.k);
assert(lazy.join() === full.join(), `the ranking is the full table’s (${lazy.slice(0, 3).join(', ')}…)`);

// ---- a bank that buys on every pass: buy.best every 500 ms for two minutes
Game.cookies = 1e30;
let passes = 0;
n = 0;
for (let s = 0; s < 120; s += 0.5) {
  CA.Actions.run('buy.best', { kind: 'all' });
  passes++;
  sim.run({ seconds: 0.5 });
}
const per = n / passes;
assert(per <= unlocked() + store() + 6, `buy.best on every pass: ${per.toFixed(1)} CpS computations a pass (≤ ${unlocked() + store() + 6}; was ~158 in the simulator's garden6)`);

Game.CalculateGains = calc;
assert(sim.game.errors ? sim.game.errors.length === 0 : true, 'no errors in the game');
done();
process.exit();
