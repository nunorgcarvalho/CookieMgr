// Garden mutation odds (features/mutations.js) against the game itself: set a plot up, predict what
// each empty tile grows at the next tick, then run the game's own tick (M.logic) thousands of times
// from that same plot and count — on fertilizer with mature parents, on wood chips (three loops a
// tick, fungi needing the tile's boost), on clay with parents about to mature or die of old age as
// the tick ages them, and on a bare plot growing weeds. And the add-on's recipe list (gardenLayers'
// RECIPES) says what the game's M.getMuts says.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 9 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
const farm = Game.Objects.Farm;
Game.cookies = 1e12;
farm.buy(50);
farm.level = 9;
if (!farm.minigameLoaded) {
  Game.LoadMinigames && Game.LoadMinigames();
  sim.run({ seconds: 2 });
}
const M = farm.minigame;
assert(M && M.plot && M.getMuts, 'the garden is there');

const N = 2500;
/** Set the plot from rows of letters (map: letter → [key, age]); '.' empty. */
function plant(rows, map, soil) {
  M.soil = M.soils[soil].id;
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < 6; x++) {
      const c = rows[y][x];
      M.plot[y][x] = c === '.' ? [0, 0] : [M.plants[map[c][0]].id + 1, map[c][1]];
    }
}
/** Run the game's tick n times from the same plot; count what each empty tile grew. */
function empirical(n) {
  const saved = M.plot.map((r) => r.map((t) => t.slice()));
  const counts = {};
  for (let i = 0; i < n; i++) {
    M.nextStep = 0;
    M.logic();
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        if (saved[y][x][0] !== 0 || !M.isTileUnlocked(x, y)) continue;
        const t = M.plot[y][x];
        if (t[0] > 0) {
          const k = `${x},${y}|${M.plantsById[t[0] - 1].key}`;
          counts[k] = (counts[k] || 0) + 1;
        }
      }
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) M.plot[y][x] = saved[y][x].slice();
  }
  return counts;
}
/** Every prediction within 4.5 standard errors of the game's frequency (and nothing grown that wasn't predicted). */
function compare(label) {
  const pred = CA.Mutations.all();
  const counts = empirical(N);
  const bad = [];
  let checked = 0;
  pred.tiles.forEach((t) =>
    t.plants.forEach((p) => {
      const k = `${t.x},${t.y}|${p.key}`;
      const f = (counts[k] || 0) / N;
      const se = Math.sqrt(Math.max(p.chance * (1 - p.chance), 1 / N) / N);
      checked++;
      if (Math.abs(f - p.chance) > 4.5 * se + 1e-9) bad.push(`${k}: predicted ${(p.chance * 100).toFixed(2)}%, game ${(f * 100).toFixed(2)}%`);
      delete counts[k];
    })
  );
  const stray = Object.entries(counts).filter(([, c]) => c > 2);
  assert(!bad.length && !stray.length, `${label}: ${checked} tile × plant odds match the game's own ticks (${N} each)${bad.length ? ` — ${bad.slice(0, 4).join('; ')}` : ''}${stray.length ? ` — not predicted: ${stray.slice(0, 4).join('; ')}` : ''}`);
  return pred;
}
const mature = (key, extra = 0) => [key, Math.ceil(M.plants[key].mature) + extra];

// ---- fertilizer, mature parents in rows: Baker's wheat × Thumbcorn
plant(['AAAAAA', '......', 'BBBBBB', 'AAAAAA', '......', 'BBBBBB'], { A: mature('bakerWheat'), B: mature('thumbcorn') }, 'fertilizer');
let p = compare('fertilizer, wheat × thumbcorn');
const t1 = p.tiles.find((t) => t.x === 2 && t.y === 1);
assert(t1 && t1.plants.some((x) => x.key === 'cronerice') && t1.plants.some((x) => x.key === 'thumbcorn'), `a middle tile: cronerice, thumbcorn, … (${t1 && t1.plants.map((x) => `${x.key} ${(x.chance * 100).toFixed(2)}%`).join(', ')})`);

// ---- wood chips (three loops), fungi: crumbspore × brown mold
plant(['AAAAAA', '......', 'BBBBBB', 'AAAAAA', '......', 'BBBBBB'], { A: mature('crumbspore'), B: mature('brownMold') }, 'woodchips');
assert(CA.Mutations.loops(M).some((l) => l.n === 3), 'wood chips: three loops a tick');
compare('wood chips, crumbspore × brown mold');

// ---- clay, parents the tick will age: some about to mature, some about to die
plant(['ABABAB', 'C.C.C.', 'ABABAB', 'D.D.D.', 'BABABA', '......'], { A: mature('bakerWheat', -1), B: ['thumbcorn', 98], C: mature('bakerWheat'), D: ['thumbcorn', Math.ceil(M.plants.thumbcorn.mature) - 2] }, 'clay');
compare('clay, parents maturing and dying as the tick ages them');

// ---- a bare plot: meddleweed, where nothing is around
plant(['A.....', '......', '......', '......', '......', '......'], { A: mature('bakerWheat') }, 'fertilizer');
const bare = CA.Mutations.all();
const weedTiles = bare.tiles.filter((t) => t.plants.some((x) => x.key === 'meddleweed'));
const expected = weedTiles.reduce((s, t) => s + t.plants.find((x) => x.key === 'meddleweed').chance, 0) * N * 4;
const counts = empirical(N * 4);
const got = Object.entries(counts)
  .filter(([k]) => k.endsWith('|meddleweed'))
  .reduce((s, [, c]) => s + c, 0);
assert(weedTiles.length >= 30 && Math.abs(got - expected) <= 4.5 * Math.sqrt(expected) + 1, `a bare plot: ${got} meddleweeds grown in ${N * 4} ticks, ${expected.toFixed(1)} expected`);

// ---- the live garden is only read (v3.11.2): the boosts plants give their neighbours change at a tick,
// never because the odds were worked out — a nursetulip that matured since the last tick boosts nothing
// until the next one, though the odds use what the next tick will see
plant(['NA....', 'A.....', '......', '......', '......', '......'], { N: ['nursetulip', 1], A: mature('bakerWheat') }, 'fertilizer');
M.computeBoostPlot(); // as the last tick left it: a young nursetulip (a tenth of its effect)
const liveRef = M.plotBoost;
const rows = M.plotBoost.slice();
const before = JSON.stringify(M.plotBoost);
M.plot[0][0][1] = Math.ceil(M.plants.nursetulip.mature) + 1; // it matured since
M.computeEffs && M.computeEffs();
const effsBefore = JSON.stringify(M.effs || {});
CA.Mutations.all();
CA.Mutations.tile(1, 1);
CA.Mutations.growChance('thumbcorn');
assert(M.plotBoost === liveRef && M.plotBoost.every((r, i) => r === rows[i]) && JSON.stringify(M.plotBoost) === before, 'after the odds: M.plotBoost the same arrays, the same numbers (the matured nursetulip boosts nothing yet)');
M.computeEffs && M.computeEffs();
assert(JSON.stringify(M.effs || {}) === effsBefore, 'and the garden’s effects as they were');
const next = CA.Mutations.nextBoost(M);
const eff = M.soilsById[M.soil].effMult; // the soil scales what plants do
assert(Math.abs(next[1][1][1] - (1 + 0.2 * eff)) < 1e-9 && Math.abs(M.plotBoost[1][1][1] - (1 + 0.2 * 0.1 * eff)) < 1e-9, `the odds use the next tick's boosts (×${next[1][1][1].toFixed(2)} next to it), the game keeps its own (×${M.plotBoost[1][1][1].toFixed(3)})`);
// even if the game's function throws, its grid is put back
const cbp = M.computeBoostPlot;
M.computeBoostPlot = () => {
  M.plotBoost[0][0] = 'broken';
  throw new Error('boom');
};
let threw = false;
try {
  CA.Mutations.nextBoost(M);
} catch (e) {
  threw = true;
}
M.computeBoostPlot = cbp;
assert(threw && M.plotBoost === liveRef && JSON.stringify(M.plotBoost) === before, 'a failure inside: the game’s grid put back untouched');

// ---- words
const word = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
plant(['AAAAAA', '......', 'BBBBBB', 'AAAAAA', '......', 'BBBBBB'], { A: mature('bakerWheat'), B: mature('thumbcorn') }, 'fertilizer');
const cr = CA.Mutations.all().plants.find((x) => x.key === 'cronerice');
assert(Math.abs(word('garden.growChance', 'cronerice') - cr.chance) < 1e-12 && cr.chance > 0, `garden.growChance(cronerice) ${(cr.chance * 100).toFixed(1)}%`);
assert(word('garden.growIn', 'everdaisy') === Infinity && Number.isFinite(word('garden.growIn', 'cronerice')), 'garden.growIn: seconds on average (∞ when it can’t)');
assert(word('garden.mutationChance', 0, 1) > 0 && word('garden.mutationChance', 0, 0) === 0, 'garden.mutationChance(x, y): an empty tile’s, 0 for a planted one');

// ---- the add-on's recipe list says what the game says
const src = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/features/gardenLayers.js'), 'utf8');
const block = src.slice(src.indexOf('const RECIPES = ['), src.indexOf('];', src.indexOf('const RECIPES = [')));
const recipes = [...block.matchAll(/\['(\w+)', '(\w+)', '(\w+)', '([\d.]+)%/g)].map((m) => ({ out: m[1], a: m[2], b: m[3], pct: Number(m[4]) }));
const zero = Object.fromEntries(Object.keys(M.plants).map((k) => [k, 0]));
const wrong = recipes.filter((r) => {
  const n = { ...zero };
  n[r.a] += r.a === r.b ? 2 : 1;
  if (r.a !== r.b) n[r.b] += 1;
  // three of each for the ones that need more (Everdaisy: 3 tidygrass, 3 elderwort)
  if (r.out === 'everdaisy') (n[r.a] = 3), (n[r.b] = 3);
  const m = M.getMuts({ ...n }, { ...n }).find(([k]) => k === r.out);
  return !m || Math.abs(m[1] * 100 - r.pct) > 1e-9;
});
assert(recipes.length >= 25 && !wrong.length, `the add-on's ${recipes.length} recipes: the game's chances${wrong.length ? ` — differ: ${wrong.map((r) => r.out).join(', ')}` : ''}`);

done();
process.exit();
