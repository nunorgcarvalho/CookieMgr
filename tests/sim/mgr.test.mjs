// CookieMgr inside the simulated game: the add-on's own core and features, from src/, playing the
// real game in CookieMgr's words — actions, values, algorithmic code, macros — with every action
// logged and the add-on's event log filling up as it does in the browser.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';
import { headlessModules, stagingModules } from '../../sim/mgr/host.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

// ---- what's loaded
const mods = headlessModules();
assert(mods.length > 20 && mods.every((f) => f.startsWith('core/') || f.startsWith('features/')) && mods.includes('features/garden.js'), `the add-on's headless modules, from build.mjs (${mods.length})`);
const staging = stagingModules();
assert(!staging.some((m) => m.name === 'Payback') && mods.includes('features/payback.js'), 'Payback promoted from staging to src/features (cm-native)');
assert(staging.every((m) => !/CA\.UI\b/.test(m.code.replace(/\/\/.*$/gm, ''))), 'staging modules stay headless (no CA.UI), like core/ and features/');

const sim = await createSim({ seed: 2 });
const { Game, CA } = sim;
assert(CA && CA.VERSION && Game.mods.CookieMgr, `CookieMgr ${CA.VERSION} registered with the game (Game.registerMod)`);
assert(CA.Actions.get('click.bigCookie') && CA.Actions.get('garden.plant') && CA.Actions.get('building.buy') && CA.Macros.get('golden') && CA.Macros.get('gardener'), 'its actions and built-in macros, and the staging ones');

// ---- actions, values, code
sim.run({ seconds: 1 });
const n = sim.act('click.bigCookie');
assert(n === 1 && Game.cookieClicks === 1, 'an action, by its CookieMgr id');
assert(sim.actions.length === 1 && sim.actions[0].id === 'click.bigCookie' && sim.actions[0].n === 1 && sim.actions[0].t === sim.clock.now, 'logged in sim.actions, at simulated time');
assert(sim.value('cookies') === Game.cookies && sim.value('building', 'Cursor') === 0, 'values, by their CookieMgr ids');
Game.cookies = 1000;
const r = sim.code('building.buy(Cursor, 3)\nif building(Cursor) >= 3:\n  building.buy(Grandma, 1)\n');
assert(Game.Objects.Cursor.amount === 3 && Game.Objects.Grandma.amount === 1 && r.done === 4 && !r.error, `algorithmic code, one pass (${JSON.stringify(r)})`);
let threw = false;
try {
  sim.code('building.buy(\n');
} catch (e) {
  threw = /line 1/.test(e.message);
}
assert(threw, 'code that doesn’t compile says where');

// ---- payback (src/features/payback.js, once staging): asked of the game itself
sim.run({ seconds: 2 });
const gain = sim.value('building.gain', 'Grandma');
const before = Game.unbuffedCps;
Game.Objects.Grandma.getFree(1);
Game.CalculateGains();
assert(gain > 0 && Math.abs(Game.unbuffedCps - before - gain) < 1e-6, `building.gain is what one more really adds (${gain})`);
Game.Objects.Grandma.amount--;
Game.Objects.Grandma.bought--;
Game.CalculateGains();
const owned = Game.AchievementsOwned;
const highest = Game.cookiesPsRawHighest;
const big = sim.value('building.gain', 'Wizard tower'); // a wizard tower would pass a CpS milestone
assert(Game.unbuffedCps === before && Game.AchievementsOwned === owned && Game.cookiesPsRawHighest === highest && big > gain, 'measuring changes nothing (CpS back, no achievement won by the hypothetical, highest CpS untouched)');
assert(sim.value('best', 'building') !== '' && Number.isFinite(sim.value('building.payback', 'Cursor')), `best(building) = ${sim.value('best', 'building')}`);

// ---- macros: built-ins and your own, on the virtual clock
sim.macro('bigCookie');
sim.macro('golden');
const id = sim.macro({ name: 'buyer', source: 'buy.best(all)\n', every: 500 });
sim.run({ minutes: 20 });
const tally = {};
sim.actions.forEach((a) => (tally[a.id] = (tally[a.id] || 0) + a.n));
assert(tally['click.bigCookie'] > 20 * 60 * 19, `Big cookie clicks 20 times a simulated second (${tally['click.bigCookie']})`);
assert(tally['buy.best'] > 10 && CA.Macros.isOn(id), `your algorithmic macro buys (${tally['buy.best']})`);
assert(Game.goldenClicks >= 1 && tally['shimmer.pop'] >= 1, `golden cookies popped (${Game.goldenClicks})`);
const evs = sim.events();
const types = new Set(evs.map((e) => e.type));
assert(types.has('golden') && types.has('building') && types.has('achievement'), `CookieMgr's event log, as in the browser (${[...types]})`);
assert(sim.samples.length >= 20 && sim.samples[sim.samples.length - 1].cookiesEarned > sim.samples[1].cookiesEarned, 'stats sampled every simulated minute');

// ---- saves: the game's (CookieMgr's part in it) into a new simulation
const save = sim.exportSave();
const sim2 = await createSim({ seed: 3, save });
assert(sim2.Game.Objects.Cursor.amount === Game.Objects.Cursor.amount && sim2.CA.Macros.get(id) && sim2.CA.Macros.get(id).name === 'buyer', 'an exported save carries the game and CookieMgr (your macro too) into another simulation');

assert(sim.errors().length === 0 && sim2.errors().length === 0, `no errors${sim.errors().length ? ': ' + sim.errors()[0] : ''}`);
done();
process.exit();
