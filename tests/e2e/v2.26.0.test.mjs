// v2.26.0: garden rules — the auto-gardener as algorithmic code (default rules carry the old
// settings + the fertilizer/clay soil rule), the garden's actions and values, the code card
// (code editor + library, Save / Discard / Revert to default), the last pass lit up, saved.
// (v3.2: the code is a gardener's; v3.3: the soil is a soil rule of its own, the card a slot.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game);
await sleep(400);
const G = CA.Garden;
const LY = CA.GardenLayers;
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const at = (x, y) => (M.plot[y][x][0] ? M.plantsById[M.plot[y][x][0] - 1].key : null);
const page = () => doc.querySelector('[data-page="garden"]');
Game.cookies = 1e12;

// ---- a profile: wheat on row 2, thumbcorn on row 3
for (let x = 1; x <= 4; x++) {
  set(x, 2, 'bakerWheat', 5);
  set(x, 3, 'thumbcorn', 5);
}
M.soil = 0;
const p1 = G.snapshot('Wheat & corn');
assert(p1 && LY.picked('profile') === p1.id && p1.data.gardener === 'effects' && p1.data.soil === 'effects', 'a new profile: the default gardener and soil rule');

// ---- the default rules
const def = G.defaultRules();
assert(G.compileRules(def).errors.length === 0, `default rules compile (${JSON.stringify(G.compileRules(def).errors)})`);
assert(/garden\.plantEmpty\(\)/.test(def) && /garden\.harvestNew\(\)/.test(def) && /tickWindow = 15\b/.test(def) && /garden\.tickIn\(\) <= tickWindow/.test(def) && /dyingOver = 0\.5\b/.test(def) && /garden\.harvestDying\(dyingOver\)/.test(def), 'default rules: plant, unlock new seeds, the 15s window, the 50% threshold (v3.1.1: as variables at the top)');
const soil = G.soilRules();
assert(/garden\.soilRule\(\)/.test(def) && /fertilizerAbove = 0\.9\b/.test(soil) && /if garden\.youngShare\(\) > fertilizerAbove:\n\s+garden\.soil\(fertilizer\)\nelse:\n\s+garden\.soil\(clay\)/.test(soil), 'default soil rule (v3.3: its own, called by the gardener): fertilizer while > 0.9 is young, else clay');
CA.Settings.set('gardenLead', 30);
CA.Settings.set('gardenThreshold', 80);
CA.Settings.set('gardenUnlockNew', false);
assert(/tickWindow = 30\b/.test(G.defaultRules()) && /dyingOver = 0\.8\b/.test(G.defaultRules()) && /unlockNewSeeds = false\b/.test(G.defaultRules()), 'the old settings carry into the default rules (v3.2: unlockNewSeeds a variable)');
CA.Settings.set('gardenThreshold', 100);
assert(!/harvestDying/.test(G.defaultRules()), '100% threshold: no harvesting before death');
CA.Settings.set('gardenLead', 15);
CA.Settings.set('gardenThreshold', 50);
CA.Settings.set('gardenUnlockNew', true);

// ---- the garden's values
const ev = (src) => CA.Script.evaluate(CA.Script.compile(`wait until ${src}`).flow[0].cond);
let c = G.census();
assert(c.planted === 8 && c.young === 8 && c.mature === 0 && c.empty === 4 && c.off === 0, `census (${JSON.stringify(c)})`);
assert(ev('garden.youngShare() > 0.67').ok && !ev('garden.matureShare() >= 0.33').ok, 'youngShare / matureShare');
assert(ev('garden.plants() == 8').ok && ev('garden.empty() == 4').ok && ev('garden.mature() == 0').ok && ev('garden.offProfile() == 0').ok, 'plants / empty / mature / offProfile');
M.nextStep = Date.now() + 100 * 1000;
assert(ev('garden.tickIn() > 90').ok && ev('garden.tickIn() <= 100').ok, 'tickIn');
assert(CA.Script.isValue('garden.youngShare') && CA.Actions.get('garden.soil') && CA.Actions.get('garden.soilRule') && CA.Conditions.get('garden.soilIs'), 'registered: values, actions, the soilIs condition');

// ---- the soil rule, as the gardener runs it
M.nextSoil = 0;
G.tend();
assert(M.soil === 1, 'all young: fertilizer');
assert(ev('garden.soilIs(fertilizer)').ok && !ev('garden.soilIs(clay)').ok && ev('garden.soilIs(profile)').ok, 'garden.soilIs (profile: what the soil rule asked for)');
// 3 of 8 mature (37.5% ≥ 33%): clay — once its cooldown is over
[1, 2, 3].forEach((x) => set(x, 2, 'bakerWheat', 40));
G.tend();
assert(M.soil === 1, 'clay waits for the soil cooldown');
M.nextSoil = 0;
G.tend();
assert(M.soil === 2, `≥33% mature: clay (soil ${M.soil})`);
// back: all young (a fresh planting) → fertilizer (v3.4: the threshold is 0.9 — 75% young stays on clay)
[1, 2, 3].forEach((x) => set(x, 2, 'bakerWheat', 5));
M.nextSoil = 0;
G.tend();
assert(M.soil === 1, 'all young again: fertilizer');

// ---- the last pass: the lines it took, its decisions
const lp = G.lastPass();
assert(lp && lp.gardener === 'effects' && lp.errors.length === 0, 'lastPass recorded');
assert(lp.trace.some((t) => /garden\.soilRule: 1/.test(t.text)), 'trace: the actions that did something (the soil rule switched the soil)');
assert(!lp.trace.some((t) => /plantEmpty/.test(t.text)), 'actions with nothing to do are left out');
const sp = G.soilPass();
const lineOf = (re) => G.soilRules().split('\n').findIndex((l) => re.test(l)) + 1;
assert(sp && sp.soil === 'effects' && sp.lines.includes(lineOf(/^if garden\.youngShare/)) && sp.trace.some((t) => /youngShare\(\) = 1(?:\.0+)? > fertilizerAbove = 0\.90? ✓ → yes/.test(t.text)), `the soil rule's own run: the if, taken (${sp && sp.trace.map((t) => t.text).join(' | ')})`);

// ---- your own code
[1, 2, 4].forEach((x) => set(x, 2, 'bakerWheat', 40)); // 3 mature wheat now: 1,2,4
const mine = LY.add('gardener', 'Harvest all', { rules: '# harvest everything that is mature, replant\ngarden.harvestMature()\ngarden.plantEmpty()\n' });
G.useGardener(mine);
assert(G.activeGardener().id === mine && /harvestMature/.test(G.rulesOf()), 'a gardener of your own, in use');
M.harvestLog.length = 0;
const n = G.tend();
assert(M.harvestLog.filter((h) => / mature$/.test(h)).length === 3 && at(1, 2) === 'bakerWheat' && M.plot[2][1][1] === 0 && n === 6, `custom rules: harvested 3 mature, replanted them (n=${n}, ${M.harvestLog})`);
assert(G.last().harvested === 3 && G.last().planted === 3, 'last: what it did, by kind');
G.useGardener('effects');

// rules with an error: the rest still runs; flagged in lastPass
G.setRules('effects', 'garden.plantEmpty(\nbogus line here\n');
G.tend();
assert(G.lastPass().errors.length > 0, 'a broken rule is reported (lastPass.errors)');
G.setRules('effects', null);
assert(!G.activeGardener().edited && G.rulesOf() === G.defaultRules(), 'setRules(null): back to the default');

// a frozen garden: hands off
M.freeze = 1;
set(1, 2, null);
assert(G.tend() === 0 && at(1, 2) === null, 'frozen: nothing');
M.freeze = 0;

// ---- the code, in the Gardener slot
CA.UI.Menu.openPage('garden');
CA.UI.GardenPage.sync();
const card = () => page().querySelector('[data-gp-rules]');
const head = () => card().querySelector('[data-gp-dhead]');
const ta = () => card().querySelector('[data-code-ed="garden"] textarea[data-code]');
const act = (a) => card().querySelector(`[data-gp-act="${a}"]`);
assert(card().querySelector('[data-gp-slot="gardener"].on') && head().querySelector('select').value === 'effects', 'the Gardener slot, open: the Effect maximizer');
assert(ta() && ta().value === G.defaultRules() && /built-in/.test(head().textContent), 'its code: the default rules');
assert(card().querySelector('[data-ed-lib="garden"]') && /garden\.plantEmpty/.test(card().querySelector('[data-ed-lib="garden"]').textContent) && /garden\.youngShare/.test(card().querySelector('[data-ed-lib="garden"]').textContent), 'the library beside it, with the garden’s words');
assert(!act('revert'), 'no Revert while default');

// typing: unsaved
ta().value = G.defaultRules().replace('tickWindow = 15', 'tickWindow = 20');
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
assert(/unsaved/.test(head().textContent) && act('save').classList.contains('ca-btn-on'), 'an edit: “unsaved”, Save lights up');
CA.UI.GardenPage.sync();
assert(ta().value.includes('tickWindow = 20'), 'the draft survives the page’s refresh');
CA.UI.Menu.render();
assert(ta().value.includes('tickWindow = 20'), '…and a re-render');
click(w, act('save'));
assert(/tickWindow = 20/.test(G.rulesOf()) && G.activeGardener().edited && head().querySelector('.ca-badge-edited') && act('revert'), 'Save: the gardener’s code; “edited” and Revert');
assert(/edited/.test(card().querySelector('[data-gp-slot="gardener"]').textContent), 'the slot says so');

// an error: not saved
ta().value = 'garden.soil(fertilizer)\nwait until\n';
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
click(w, act('save'));
assert(/tickWindow = 20/.test(G.rulesOf()) && /Not saved — line 2/.test(card().textContent), `a broken rule isn’t saved (${(card().querySelector('.ca-editor-error') || {}).textContent})`);
click(w, act('discard'));
assert(ta().value === G.rulesOf() && !/unsaved/.test(head().textContent), 'Discard: back to the saved rules');

// the library inserts into the garden's code
ta().value = '';
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
ta().setSelectionRange(0, 0);
const lib = card().querySelector('[data-ed-lib="garden"]');
const ins = [...lib.querySelectorAll('[data-lib-insert]')].find((b) => /garden\.harvestMature/.test(b.textContent));
click(w, ins);
assert(/garden\.harvestMature\(\)/.test(ta().value), `library click inserts (${JSON.stringify(ta().value)})`);
click(w, act('discard'));

// live: the last pass under the code, its lines lit
CA.Macros.set('gardener', true, { silent: true });
await sleep(1150);
CA.UI.GardenPage.sync();
assert(/last pass/.test(card().querySelector('[data-code-live]').textContent) && card().querySelectorAll('[data-code-gutter] span.run').length > 0, 'while on: the last pass, its lines lit');
// the soil rule's slot: its own last run
click(w, card().querySelector('[data-gp-slot="soil"]'));
CA.UI.GardenPage.sync();
assert(ta().value === G.soilRules() && /last run/.test(card().querySelector('[data-code-live]').textContent), 'the Soil rule slot: its code, its last run');
click(w, card().querySelector('[data-gp-slot="gardener"]'));
CA.Macros.set('gardener', false, { silent: true });
CA.UI.GardenPage.sync();
assert(!card().querySelector('[data-code-live]').textContent && !card().querySelectorAll('[data-code-gutter] span.run').length, 'off: nothing lit');

// saving the default text again = default
click(w, act('revert'));
assert(G.activeGardener().edited, 'Revert asks first');
click(w, act('revert'));
assert(!G.activeGardener().edited && ta().value === G.defaultRules() && !head().querySelector('.ca-badge-edited'), 'then reverts to the default rules');
ta().value = G.defaultRules();
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
click(w, act('save'));
assert(!G.activeGardener().edited, 'saving the default text keeps it default (follows the settings)');

// ---- saved and restored
G.setRules('weeds', 'garden.plantEmpty()\n');
Game.WriteSave();
const saved = Game.modSaveData.CookieMgr;
const data = JSON.parse(saved);
const ids = data.garden.gardener.map((x) => x.id).join();
assert(ids === `${mine},weeds` && data.garden.gardener[1].data.rules === 'garden.plantEmpty()\n' && !('name' in data.garden.gardener[1]), `code saved: yours, and built-ins only when edited (${ids})`);
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: saved });
makeGarden(g2.Game);
await sleep(400);
const L2 = g2.window.CookieMgr.GardenLayers;
assert(L2.get('gardener', 'weeds').data.rules === 'garden.plantEmpty()\n' && L2.get('gardener', 'weeds').edited && !L2.get('gardener', 'effects').edited && L2.get('gardener', mine).name === 'Harvest all', 'restored');

assert(g.errors.length + g2.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
