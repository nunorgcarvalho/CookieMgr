// v3.0.0 (garden): the Auto-gardener is an algorithmic macro whose code is the active profile's
// rules, from the top every second; tile-by-tile building blocks — checked against the whole-plot
// actions on random gardens; its Edit goes to the Rules card.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const Mg = makeGarden(Game);
await sleep(400);
const G = CA.Garden;
const M = CA.Macros;
const S = CA.Script;
Game.cookies = 1e12;
const set = (x, y, key, age = 0) => (Mg.plot[y][x] = key ? [Mg.plants[key].id + 1, age] : [0, 0]);
const at = (x, y) => (Mg.plot[y][x][0] ? Mg.plantsById[Mg.plot[y][x][0] - 1].key : null);
const pass1 = (src) => M.runPass(S.compile(src).flow);
const logs = (F) => F.trace.map((t) => t.text.replace(/^line \d+: /, ''));

for (let x = 1; x <= 4; x++) {
  set(x, 2, 'bakerWheat', 5);
  set(x, 3, 'thumbcorn', 5);
}
const p1 = G.snapshot('Wheat');

// ---- tile by tile
let F = pass1('log count(garden.tiles())\nlog garden.plantAt("1,2")\nlog garden.wantAt("2,3")\nlog garden.age("1,2")');
assert(logs(F).join('|') === '12|bakerWheat|thumbcorn|5', `garden.tiles(), plantAt, wantAt, age (${logs(F)})`);
set(1, 2, 'bakerWheat', 40);
set(4, 4, 'meddleweed', 3);
F = pass1('for tile in garden.tiles():\n  if garden.isMature(tile):\n    log "mature " + tile\n  if garden.isOff(tile):\n    log "off " + tile');
assert(logs(F).filter((t) => !/^if /.test(t)).join('|') === 'mature 1,2|off 4,4', `isMature / isOff as conditions (${logs(F).filter((t) => !/^if /.test(t))})`);
assert(S.evaluate(S.compile('wait until garden.decay("1,2") >= 0').flow[0].cond).ok && pass1('log garden.isEmpty("3,4")').trace[0].text.endsWith('true'), 'decay, isEmpty');
assert(S.compile('wait until garden.age("1,2")').errors.length === 1, 'a number on its own still isn’t a condition');
F = pass1('garden.harvest("4,4")\ngarden.plant("4,4", thumbcorn)');
assert(at(4, 4) === 'thumbcorn' && F.done === 2, 'garden.harvest(tile), garden.plant(tile, seed)');
assert(pass1('log garden.seeds()').trace[0].text.includes('bakerWheat') && !pass1('log garden.seeds()').trace[0].text.includes('goldenClover'), 'garden.seeds(): the unlocked ones');
assert(S.lookups().some((l) => l.name === 'Seed' && l.items.some((i) => i.v === 'bakeberry')) && S.lookups().some((l) => l.name === 'Tile'), 'Lookup: seeds and tiles');

// ---- side by side: per-tile rules = the whole-plot actions, on random gardens
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const KEYS = ['bakerWheat', 'thumbcorn', 'bakeberry', 'meddleweed', null, null];
const perTile = `for tile in garden.tiles():
  if garden.isMature(tile) and not garden.isNew(tile) and not garden.isOff(tile):
    garden.harvest(tile)
for tile in garden.tiles():
  if garden.isEmpty(tile) and garden.wantAt(tile) != "":
    garden.plant(tile, garden.wantAt(tile))
`;
const whole = 'garden.harvestMature()\ngarden.plantEmpty()\n';
let same = 0;
let busy = 0;
const plotNow = () => JSON.stringify(Mg.plot);
for (let t = 0; t < 120; t++) {
  for (let y = 2; y <= 4; y++) for (let x = 1; x <= 4; x++) {
    const k = KEYS[Math.floor(rnd() * KEYS.length)];
    set(x, y, k, k ? Math.floor(rnd() * 100) : 0);
  }
  Game.cookies = rnd() < 0.15 ? 0 : 1e12;
  const start = plotNow();
  const cookies = Game.cookies;
  const a = pass1(whole);
  const A = plotNow();
  if (A !== start) busy++;
  Mg.plot.splice(0, Mg.plot.length, ...JSON.parse(start));
  Game.cookies = cookies;
  const b = pass1(perTile);
  if (plotNow() === A && a.done === b.done) same++;
}
assert(same === 120 && busy > 60, `per-tile rules do what harvestMature + plantEmpty do, on 120 random gardens (${same} the same, ${busy} with something to do)`);

// ---- the Auto-gardener is its profile's rules
Game.cookies = 1e12; // the random gardens above may have left the bank empty
const gm = M.get('gardener');
assert(gm.mode === 'flow' && gm.pass && M.sourceOf(gm) === G.rulesOf(p1), 'the Auto-gardener: algorithmic, its code the active profile’s rules');
for (let x = 1; x <= 4; x++) {
  set(x, 2, 'bakerWheat', 5);
  set(x, 3, 'thumbcorn', 5);
}
G.setRules(p1.id, perTile);
assert(M.sourceOf(gm) === perTile, 'new rules: its code');
set(2, 2, 'bakerWheat', 40); // mature
set(3, 3, null);
M.set('gardener', true, { silent: true });
await sleep(1150);
assert(Mg.plot[2][2][1] === 0 && at(2, 2) === 'bakerWheat' && at(3, 3) === 'thumbcorn', 'running: follows the rules (harvested the mature wheat and replanted, planted the empty tile)');
assert(G.lastPass() && G.lastPass().lines.length > 0 && M.flowStatus('gardener').lines.length > 0, 'its last pass: the lines it took (the Garden page, the card)');
// another profile: its rules, from the next pass
const p2 = G.snapshot('Second');
G.use(p2.id);
G.setRules(p2.id, 'log "second profile"\n');
await sleep(1100);
assert(M.flowStatus('gardener').trace.some((t) => /second profile/.test(t.text)), 'switching profile: the gardener follows its rules');
// a wait only ends that pass: the next one starts from the top again
G.setRules(p2.id, 'log "top"\nwait until lumps() > 999\nlog "never"\n');
await sleep(2200);
const fs = M.flowStatus('gardener');
assert(fs.trace.some((t) => /top/.test(t.text)) && !fs.trace.some((t) => /never/.test(t.text)) && M.isOn('gardener'), 'a wait ends the pass; it keeps running');
// frozen: no passes
const runs = M.status('gardener').runs;
Mg.freeze = 1;
await sleep(1100);
assert(M.status('gardener').runs === runs, 'a frozen garden: no passes');
Mg.freeze = 0;
// rules that can't run: it stops and says why
G.setRules(p2.id, 'garden.plantEmpty(\n');
await sleep(1100);
assert(!M.isOn('gardener') && /line 1/.test(M.problemOf('gardener')), `broken rules: stopped, with the reason (${M.problemOf('gardener')})`);
G.setRules(p2.id, null);
assert(M.set('gardener', true, { silent: true }) === undefined && M.isOn('gardener'), 'fixed: runs again');
M.set('gardener', false, { silent: true });

// ---- its Edit: the Rules card on the Garden page
CA.UI.Menu.openPage('clickers');
click(w, doc.querySelector('[data-page="clickers"] [data-ca="macro-edit"][data-id="gardener"]'));
assert(CA.Settings.get('tab') === 'garden' && doc.querySelector('[data-gp-rules]').classList.contains('ca-flash') && !doc.querySelector('[data-macro-editor]'), 'Edit on the Auto-gardener opens its Rules card');
// tend(): the same pass by hand
G.use(p1.id);
set(1, 2, null);
assert(G.tend() >= 1 && at(1, 2) === 'bakerWheat', 'garden.tend(): a pass of the active rules, by hand');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
