// v3.1.1: the garden charts' time view with "Active time" on places snapshots by when they happened
// (their own active-time stamps could be far off — taken before the recorder loaded, or counting
// time the game was closed); the default rules' numbers are variables at the top, the soil first;
// saved rules with the soil threshold in their if get it lifted into a variable.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, waitFor, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const GM = makeGarden(Game);
await waitFor(() => CA.Recorder.frames().length >= 3, 6000); // a few recorded seconds: active time to map onto
const H = CA.GardenHistory;
const G = CA.Garden;

// ---- the chart: snapshots with bad active-time stamps, as older saves have them
const now = Date.now();
const list = H.list();
list.length = 0;
const ticks = H.ticks();
ticks.length = 0;
[
  [now - 2500, 1, now], // stamped with wall-clock ms (taken before the recorder had loaded)
  [now - 1800, 2, 9e15], // with an offline gap counted in
  [now - 900, 3, 5],
  [now - 200, 4, now * 2],
].forEach(([t, n, a], k) => {
  ticks.push({ k: k + 1, t: t - 50, a });
  list.push({ t, a, k: k + 1, c: { 'bakerWheat:3': n }, e: {} });
});
CA.Settings.set('graphActiveTime', true);
CA.UI.Menu.openPage('garden');
await sleep(50);
const P = CA.UI.Plot.get('garden');
const totals = () => P.last().data.bars.map((b) => Object.values(b.parts).reduce((a, x) => a + x, 0));
for (const axis of ['time', 'ticks']) {
  click(w, g.window.document.querySelector(`[data-plot="garden"] [data-plot-set][data-val="${axis}"]`));
  P.tick();
  const t = totals();
  assert(t.length && t[t.length - 1] === 4, `Active time, ${axis} axis: the latest bar is the garden now, whatever the stamps say (${t.slice(-5)})`);
}
assert(totals().join() === '1,2,3,4', `ticks axis: one bar per tick, in order (${totals()})`);
CA.Settings.set('graphActiveTime', false);
P.tick();
assert(totals()[totals().length - 1] === 4, 'and with Active time off');

// ---- the default rules: their numbers as variables, the soil first
for (let x = 1; x <= 4; x++) {
  GM.plot[2][x] = [1, 5];
  GM.plot[3][x] = [2, 5];
}
const p1 = G.snapshot('Rules');
const def = G.defaultRules();
assert(/^fertilizerAbove = 0\.67\b/m.test(def) && /^tickWindow = 15\b/m.test(def) && /^dyingOver = 0\.5\b/m.test(def), 'the numbers at the top, as variables');
assert(def.indexOf('garden.soil(fertilizer)') < def.indexOf('if garden.tickIn()'), 'the soil before the tick window (its effects count the whole time)');
assert(!G.compileRules(def).errors.length, 'they compile');
// editing the variable is all it takes
GM.nextSoil = 0;
GM.soil = 0;
G.tend();
assert(GM.soil === 1, 'all growing, over 0.67: fertilizer');
G.setRules(p1.id, def.replace('fertilizerAbove = 0.67', 'fertilizerAbove = 1.5'));
GM.nextSoil = 0;
G.tend();
assert(GM.soil === 2, 'fertilizerAbove = 1.5 (never): clay');

// ---- saved rules: the soil threshold lifted out of the if (the rules as you edited them)
const yours = `# These rules run from the top every second while the Auto-gardener is on.
# Plant the profile's seed on every empty tile, right away.
garden.plantEmpty()
# A seed you haven't unlocked: let it grow, harvest it once it's mature (that unlocks it).
garden.harvestNew()
# Soil: fertilizer while most plants are still growing, clay once a third of them are mature.
if garden.youngShare() > 0.67:
  garden.soil(fertilizer)
else:
  garden.soil(clay)
# In the last 15 seconds before a garden tick:
if garden.tickIn() <= 15:
  # pull out what isn't the profile's seed for its tile
  garden.pullMismatches(true)
  # harvest mature plants more likely than 50% to die on the tick, then replant
  garden.harvestDying(0.5)
  garden.plantEmpty()
`;
G.setRules(p1.id, yours);
const other = G.snapshot('Other');
G.setRules(other.id, 'garden.plantEmpty()\n');
const save = JSON.parse(CA.Settings.serialize());
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: JSON.stringify(save) });
makeGarden(g2.Game);
await sleep(400);
const G2 = g2.window.CookieMgr.Garden;
const r = G2.profiles().find((p) => p.name === 'Rules').rules;
const lines = r.split('\n');
assert(/^fertilizerAbove = 0\.67\b/.test(lines[1]) && lines[0].startsWith('# These rules') && /^# Plant/.test(lines[2]), `your rules: the threshold a variable at the top (${JSON.stringify(lines.slice(0, 3))})`);
assert(r.includes('if garden.youngShare() > fertilizerAbove:') && !r.includes('> 0.67'), '…read by the if');
assert(r.replace(/^fertilizerAbove = .*\n/m, '').replace('> fertilizerAbove:', '> 0.67:') === yours, 'nothing else changed');
assert(!G2.compileRules(r).errors.length, 'and they compile');
assert(G2.profiles().find((p) => p.name === 'Other').rules === 'garden.plantEmpty()\n', 'rules without it: left alone');
// loaded again: not lifted twice
const g3 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: g2.window.CookieMgr.Settings.serialize() });
makeGarden(g3.Game);
await sleep(400);
assert(g3.window.CookieMgr.Garden.profiles().find((p) => p.name === 'Rules').rules === r, 'loaded again: as it was');

assert(g.errors.length + g2.errors.length + g3.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
