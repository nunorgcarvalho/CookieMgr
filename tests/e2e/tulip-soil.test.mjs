// Tulip soil: the "Tulips grow, then clay" soil rule — fertilizer while any nursetulip is still growing
// (so they're mature sooner and longer), clay once they're all mature; with cloversToo (on), fertilizer
// as well while a round of golden clovers grows. 8 nursetulips together + clover combos picks it.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w } = g;
const CA = w.CookieMgr;
const M = makeGarden(g.Game);
M.plotLimits = [[2, 2, 4, 4], [2, 2, 5, 4], [2, 2, 5, 5], [1, 2, 5, 5], [1, 1, 5, 5], [1, 1, 6, 5], [1, 1, 6, 6], [0, 1, 6, 6], [0, 0, 6, 6]];
g.Game.Objects.Farm.level = 8;
await sleep(400);
const LY = CA.GardenLayers;
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const soil = () => M.soilsById[M.soil].key;
const TULIPS = [];
const CLOVERS = [];
for (let y = 1; y <= 5; y++) for (let x = 0; x <= 5; x++) ((y === 2 || y === 4) && x >= 1 && x <= 4 ? TULIPS : CLOVERS).push([x, y]);
LY.pick('profile', 'tulipCombos');
assert(LY.picks().soil === 'tulips', `8 nursetulips together + clover combos: Tulips grow, then clay (${LY.picks().soil})`);
const rule = LY.get('soil', 'tulips').data;
assert(CA.Script.compile(rule.rules).errors.length === 0 && rule.knobs.cloversToo && rule.knobs.clayAt, 'it compiles; knobs cloversToo, clayAt');
/** The soil the rule picks for a garden of tulips aged t and clovers aged c (55+: mature). */
function pick(t, c) {
  TULIPS.forEach(([x, y]) => set(x, y, 'nursetulip', t));
  CLOVERS.forEach(([x, y]) => set(x, y, 'goldenClover', c));
  M.soil = 2;
  M.nextSoil = 0;
  CA.Macros.runPass(CA.Script.compile('garden.soilRule()').flow);
  return soil();
}
assert(pick(10, 60) === 'fertilizer', 'the tulips growing, the clovers mature: fertilizer');
assert(pick(70, 60) === 'clay', 'everything mature: clay');
assert(pick(70, 10) === 'fertilizer', 'cloversToo: a clover round growing keeps fertilizer on');
LY.set('soil', 'tulips', { rules: rule.rules.replace('cloversToo = true', 'cloversToo = false') });
assert(pick(70, 10) === 'clay', 'cloversToo off: the tulips alone pick the soil');
assert(pick(10, 60) === 'fertilizer', '…fertilizer while they grow');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
