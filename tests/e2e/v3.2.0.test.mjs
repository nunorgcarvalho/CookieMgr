// v3.2.0: the auto-gardener in two layers, picked separately — a layout (a garden profile, or the
// built-in Current garden: what's planted, kept as it is) and a gardener (its behaviour, as code:
// the built-in Effect maximizer, Weed collector and Mutation tracker, or your own). Both are picked
// on the Garden page and on the Auto-gardener's card on the Macros page.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game); // tiles x 1–4, y 2–4
await sleep(400);
const G = CA.Garden;
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const at = (x, y) => (M.plot[y][x][0] ? M.plantsById[M.plot[y][x][0] - 1].key : null);
const clear = () => M.plot.forEach((r) => r.forEach((t) => ((t[0] = 0), (t[1] = 0))));
const soil = () => M.soilsById[M.soil].key;
const tend = () => {
  M.nextSoil = 0;
  return G.tend();
};
Game.cookies = 1e12;

// ---- the built-in gardeners
const list = G.gardeners();
assert(list.map((x) => x.id).join() === 'effects,weeds,mutations' && list.every((x) => x.builtin && !x.edited && x.desc), `three built-in gardeners (${list.map((x) => x.name).join(', ')})`);
list.forEach((x) => assert(G.compileRules(G.gardenerRules(x.id)).errors.length === 0, `${x.name}: its code compiles (${JSON.stringify(G.compileRules(G.gardenerRules(x.id)).errors)})`));
assert(G.activeGardener().id === 'effects' && G.rulesOf() === G.defaultRules(), 'the Effect maximizer by default');

// ---- the Current garden: the layout when none is picked
set(1, 2, 'bakerWheat', 5);
set(2, 2, 'thumbcorn', 5);
set(3, 2, 'meddleweed', 5); // a weed: not adopted
assert(G.activeLayoutId() === G.CURRENT && G.active().name === 'Current garden', 'no profile picked: the Current garden');
const cur = G.active();
assert(cur.plot[2][1] === 'bakerWheat' && cur.plot[2][2] === 'thumbcorn' && cur.plot[2][3] === null, 'it takes what’s planted (not weeds)');
// a plant dies: replanted; an empty tile it didn't have stays empty
set(1, 2, null);
M.nextStep = Date.now() + 200 * 1000;
tend();
assert(at(1, 2) === 'bakerWheat' && at(4, 4) === null, 'a plant that died: replanted; other empty tiles stay empty');
// a mutation that springs up isn't adopted — the Effect maximizer leaves tiles the layout has nothing for
set(4, 2, 'thumbcorn', 0);
M.nextStep = Date.now() + 5000;
tend();
assert(G.active().plot[2][4] === null && at(4, 2) === 'thumbcorn' && at(3, 2) === 'meddleweed', 'a mutation isn’t adopted; tiles it has nothing for are left alone');
// your own clicks are: plant by hand, harvest by hand
M.seedSelected = M.plants.bakerWheat.id;
M.clickTile(4, 4);
M.seedSelected = -1;
M.clickTile(2, 2); // harvests the thumbcorn
assert(G.active().plot[4][4] === 'bakerWheat' && G.active().plot[2][2] === null, 'what you plant or harvest by hand, it follows');
tend();
assert(at(2, 2) === null && at(4, 4) === 'bakerWheat', '…and doesn’t replant what you harvested');

// ---- the Weed collector
clear();
G.useGardener('weeds');
set(1, 2, 'meddleweed', 20); // young weed: left to grow
set(2, 2, 'meddleweed', 95); // old: very likely to die on the tick → harvested
set(3, 2, 'goldenClover', 10); // a new seed: grows on
set(4, 2, 'goldenClover', 60); // …mature: harvested (unlocks it)
set(1, 3, 'thumbcorn', 30); // a plant you have: cleared
M.soil = 0;
tend();
assert(soil() === 'fertilizer', 'Weed collector: fertilizer');
assert(at(1, 2) === 'meddleweed' && at(2, 2) === null, 'old meddleweed harvested, young left');
assert(at(3, 2) === 'goldenClover' && at(4, 2) === null && M.plants.goldenClover.unlocked === 1, 'a new seed: grows until mature, then harvested (unlocked)');
assert(at(1, 3) === null && M.plot.flat().filter((t) => t[0]).length === 2, 'what you have: cleared; nothing planted');
assert(G.lastPass().gardener === 'weeds', 'the last pass says which gardener');

// ---- the Mutation tracker, with a profile (the parents): wheat on 1,2 and 3,2
M.plants.goldenClover.unlocked = 0;
clear();
set(1, 2, 'bakerWheat', 5);
set(3, 2, 'bakerWheat', 5);
const parents = G.snapshot('Parents');
assert(G.activeLayoutId() === parents.id, 'none picked: a new profile becomes the layout (as before)');
G.use(G.CURRENT);
G.snapshot('Spare');
assert(G.activeLayoutId() === G.CURRENT, 'the Current garden picked: it stays picked');
G.removeProfile(G.profiles()[1].id);
G.use(parents.id);
G.useGardener('mutations');
set(3, 2, null);
M.soil = 0;
tend();
assert(at(3, 2) === 'bakerWheat' && soil() === 'fertilizer', 'plants the parents; fertilizer while they grow');
set(1, 2, 'bakerWheat', 40);
set(3, 2, 'bakerWheat', 40);
tend();
assert(soil() === 'fertilizer', 'parents mature but no wood chips (300 farms): fertilizer');
Game.Objects.Farm.amount = 400;
tend();
assert(soil() === 'woodchips', 'with 300 farms: wood chips');
// mutations on the other tiles
set(2, 2, 'thumbcorn', 0); // a seed you have: out at once
set(2, 3, 'goldenClover', 10); // new: kept
set(4, 3, 'goldenClover', 10); // a second one: kept
tend();
assert(at(2, 2) === null && at(2, 3) === 'goldenClover' && at(4, 3) === 'goldenClover', 'a seed you have: cleared at once; a new one: kept');
set(2, 3, 'goldenClover', 55);
tend();
assert(at(2, 3) === null && M.plants.goldenClover.unlocked === 1, 'once mature: harvested (unlocked)');
assert(at(4, 3) === 'goldenClover' && G.compileRules('x = garden.unlockedAgo("goldenClover")').errors.length === 0, 'a copy of a just-unlocked seed: still kept');
set(4, 3, 'goldenClover', 55);
tend();
assert(at(4, 3) === null && at(1, 2) === 'bakerWheat' && at(3, 2) === 'bakerWheat', '…until it’s mature too; the parents stay');

// ---- the values the gardeners use
const ev = (src) => CA.Script.evaluate(CA.Script.compile(`wait until ${src}`).flow[0].cond);
assert(ev('garden.isUnlocked(bakerWheat)').ok && !ev('garden.isUnlocked(elderwort) == false').ok, 'garden.isUnlocked');
assert(ev('garden.unlockedAgo(goldenClover) < 60').ok && ev('garden.unlockedAgo(thumbcorn) > 1000000').ok, 'garden.unlockedAgo: seconds since, huge when never seen');
assert(ev('garden.soilAvailable(woodchips)').ok && ev('garden.soilAvailable(clay)').ok, 'garden.soilAvailable');
assert(ev('garden.layoutYoungShare() == 0').ok, 'garden.layoutYoungShare: the layout’s own plants');

// ---- the Garden page: both picks, the gardener's code
CA.UI.Menu.openPage('garden');
const page = () => doc.querySelector('[data-page="garden"]');
const layoutSel = () => page().querySelector('[data-gp-active]');
const gardenerSel = () => page().querySelector('[data-gp-gardener]');
assert(
  [...layoutSel().options].map((o) => o.value).join() === `current,${parents.id}` && layoutSel().value === parents.id,
  'Layout: the Current garden, then your profiles'
);
assert([...gardenerSel().options].map((o) => o.textContent).join() === 'Effect maximizer,Weed collector,Mutation tracker' && gardenerSel().value === 'mutations', 'Gardener: the built-ins');
assert(/Gardener · Mutation tracker/.test(page().querySelector('[data-gp-rules] .ca-card-title').textContent), 'its code, on the card below');
gardenerSel().value = 'weeds';
gardenerSel().dispatchEvent(new w.Event('change', { bubbles: true }));
assert(G.activeGardener().id === 'weeds' && /Weed collector/.test(page().querySelector('[data-gp-rules] .ca-card-title').textContent), 'pick another: its code shows');
// Save as new: a gardener of your own, from the code in the editor
const ta = () => page().querySelector('[data-gp-rules] textarea[data-code]');
ta().value = G.gardenerRules('weeds').replace('oldWeedOver = 0.5', 'oldWeedOver = 0.9');
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
click(w, page().querySelector('[data-gp-rules-act="new"]'));
const mine = G.activeGardener();
assert(!mine.builtin && mine.name === 'Weed collector (copy)' && /oldWeedOver = 0\.9/.test(G.rulesOf()) && !G.gardener('weeds').edited, 'Save as new: yours, in use; the built-in unchanged');
const rn = page().querySelector(`[data-gp-grename="${mine.id}"]`);
rn.value = 'Patient weeder';
rn.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(G.gardener(mine.id).name === 'Patient weeder' && [...gardenerSel().options].some((o) => o.textContent === 'Patient weeder'), 'rename yours');
assert(!page().querySelector('[data-gp-rules-act="revert"]'), 'yours: no Revert');
// the Current garden in the profiles list
assert(page().querySelector('[data-gp-current]') && !page().querySelector('[data-gp-current].on'), 'Profiles: the Current garden, first');
click(w, page().querySelector('[data-gp-use="current"]'));
assert(G.activeLayoutId() === G.CURRENT && page().querySelector('[data-gp-current].on') && layoutSel().value === 'current', 'Use it: picked, here and in the Layout list');

// ---- the Macros page: the same two picks on the Auto-gardener's card
CA.UI.Menu.openPage('clickers');
const inp = (key) => doc.querySelector(`[data-page="clickers"] [data-macro-input="gardener"][data-key="${key}"]`);
assert(inp('layout') && inp('gardener') && inp('layout').value === 'current' && inp('gardener').value === mine.id, 'the Auto-gardener’s card: Layout and Gardener, as picked');
inp('layout').value = parents.id;
inp('layout').dispatchEvent(new w.Event('change', { bubbles: true }));
inp('gardener').value = 'effects';
inp('gardener').dispatchEvent(new w.Event('change', { bubbles: true }));
assert(G.activeLayoutId() === parents.id && G.activeGardener().id === 'effects', 'picked there: the garden’s own settings');
assert(!(CA.Macros.serialize().prefs || {}).gardener || !(CA.Macros.serialize().prefs.gardener || {}).inputs, 'not kept twice (not in the macro’s own settings)');
CA.UI.Menu.openPage('garden');
assert(layoutSel().value === parents.id && gardenerSel().value === 'effects', 'the Garden page shows them');
// the Auto-gardener runs the pick
G.useGardener(mine.id);
CA.Macros.set('gardener', true, { silent: true });
await sleep(1150);
assert(CA.Macros.flowStatus('gardener').lines.length > 0 && G.lastPass().gardener === mine.id, 'running: the gardener picked');
CA.Macros.set('gardener', false, { silent: true });

// ---- delete yours (asks first)
CA.UI.Menu.openPage('garden');
click(w, page().querySelector('[data-gp-rules-act="delete"]'));
assert(G.gardener(mine.id), 'Delete asks first');
const keep = G.newGardener('Keeper', 'garden.plantEmpty()\n');
CA.UI.Menu.render();
click(w, page().querySelector('[data-gp-rules-act="delete"]'));
click(w, page().querySelector('[data-gp-rules-act="delete"]'));
assert(!G.gardener(mine.id) && G.activeGardener().id === 'effects', 'then deletes; back to the Effect maximizer');
assert(!page().querySelector('[data-gp-rules-act="delete"]'), 'a built-in can’t be deleted');

// ---- saved and restored
G.use(G.CURRENT);
G.useGardener(keep);
G.setGardenerRules('mutations', '# mine\ngarden.plantEmpty()\n');
Game.WriteSave();
const data = JSON.parse(Game.modSaveData.CookieMgr);
assert(data.options.gardenProfile === 'current' && data.options.gardenGardener === keep && Array.isArray(data.garden.current) && data.garden.gardeners.length === 2, 'saved: the picks, the Current garden’s memory, your gardener and the edited built-in');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: Game.modSaveData.CookieMgr });
makeGarden(g2.Game);
await sleep(400);
const G2 = g2.window.CookieMgr.Garden;
assert(G2.activeLayoutId() === 'current' && JSON.stringify(G2.active().plot) === JSON.stringify(G.active().plot), 'restored: the Current garden as it was');
assert(G2.activeGardener().name === 'Keeper' && G2.gardener('mutations').edited && G2.gardenerRules('mutations').startsWith('# mine'), 'restored: the gardeners');

assert(g.errors.length + g2.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
