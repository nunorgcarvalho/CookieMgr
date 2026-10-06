// v2.26.0: garden rules — each profile's auto-gardener as algorithmic code (default rules carry the
// old settings + the fertilizer/clay soil rule), the garden's actions and values, the Rules card
// (code editor + library, Save / Discard / Revert to default), the last pass lit up, saved.
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
assert(p1 && G.active() === p1 && p1.rules === undefined, 'a new profile uses the default rules');

// ---- the default rules
const def = G.defaultRules();
assert(G.compileRules(def).errors.length === 0, `default rules compile (${JSON.stringify(G.compileRules(def).errors)})`);
assert(/garden\.plantEmpty\(\)/.test(def) && /garden\.harvestNew\(\)/.test(def) && /garden\.tickIn\(\) <= 15/.test(def) && /garden\.harvestDying\(0\.5\)/.test(def), 'default rules: plant, unlock new seeds, the 15s window, the 50% threshold');
assert(/if garden\.youngShare\(\) > 0\.67:\n\s+garden\.soil\(fertilizer\)\nelse:\n\s+garden\.soil\(clay\)/.test(def), 'default soil rule: fertilizer while > 0.67 is young, else clay');
CA.Settings.set('gardenLead', 30);
CA.Settings.set('gardenThreshold', 80);
CA.Settings.set('gardenUnlockNew', false);
assert(/tickIn\(\) <= 30/.test(G.defaultRules()) && /harvestDying\(0\.8\)/.test(G.defaultRules()) && !/harvestNew/.test(G.defaultRules()) && /pullMismatches\(false\)/.test(G.defaultRules()), 'the old settings carry into the default rules');
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
assert(CA.Script.isValue('garden.youngShare') && CA.Actions.get('garden.soil') && CA.Conditions.get('garden.soilIs'), 'registered: values, actions, the soilIs condition');

// ---- the soil rule, as the gardener runs it
M.nextSoil = 0;
G.tend();
assert(M.soil === 1, 'all young: fertilizer');
assert(ev('garden.soilIs(fertilizer)').ok && !ev('garden.soilIs(clay)').ok, 'garden.soilIs');
// 3 of 8 mature (37.5% ≥ 33%): clay — once its cooldown is over
[1, 2, 3].forEach((x) => set(x, 2, 'bakerWheat', 40));
G.tend();
assert(M.soil === 1, 'clay waits for the soil cooldown');
M.nextSoil = 0;
G.tend();
assert(M.soil === 2, `≥33% mature: clay (soil ${M.soil})`);
// back: only 2 of 8 mature → 75% young → fertilizer
set(3, 2, 'bakerWheat', 5);
M.nextSoil = 0;
G.tend();
assert(M.soil === 1, '75% young again: fertilizer');

// ---- the last pass: the lines it took, its decisions
const lp = G.lastPass();
assert(lp && lp.profile === p1.id && lp.errors.length === 0, 'lastPass recorded');
const lineOf = (re) => G.rulesOf(p1).split('\n').findIndex((l) => re.test(l)) + 1;
assert(lp.lines.includes(lineOf(/^if garden\.youngShare/)) && lp.trace.some((t) => /youngShare\(\) = 0\.75 > 0\.67 ✓ → yes/.test(t.text)), `trace: the soil if, taken (${lp.trace.map((t) => t.text).join(' | ')})`);
assert(lp.trace.some((t) => /garden\.soil: 1/.test(t.text)), 'trace: the actions that did something');
assert(!lp.trace.some((t) => /plantEmpty/.test(t.text)), 'actions with nothing to do are left out');

// ---- a profile's own rules
set(4, 2, 'bakerWheat', 40); // 3 mature wheat now: 1,2,4
G.setRules(p1.id, '# harvest everything that is mature, replant\ngarden.harvestMature()\ngarden.plantEmpty()\n');
assert(G.active().rules && /harvestMature/.test(G.rulesOf(G.active())), 'setRules: the profile has its own');
M.harvestLog.length = 0;
const n = G.tend();
assert(M.harvestLog.filter((h) => / mature$/.test(h)).length === 3 && at(1, 2) === 'bakerWheat' && M.plot[2][1][1] === 0 && n === 6, `custom rules: harvested 3 mature, replanted them (n=${n}, ${M.harvestLog})`);
assert(G.last().harvested === 3 && G.last().planted === 3, 'last: what it did, by kind');
// a second profile keeps the default rules
const p2 = G.snapshot('Second');
assert(p2.rules === undefined && G.rulesOf(p2) === G.defaultRules(), 'another profile: default rules');
G.use(p1.id);

// rules with an error: the rest still runs; flagged in lastPass
G.setRules(p1.id, 'garden.plantEmpty(\nbogus line here\n');
G.tend();
assert(G.lastPass().errors.length > 0, 'a broken rule is reported (lastPass.errors)');
G.setRules(p1.id, null);
assert(G.active().rules === undefined, 'setRules(null): back to the default');

// a frozen garden: hands off
M.freeze = 1;
set(1, 2, null);
assert(G.tend() === 0 && at(1, 2) === null, 'frozen: nothing');
M.freeze = 0;

// ---- the Rules card
CA.UI.Menu.openPage('garden');
CA.UI.GardenPage.sync();
const card = () => page().querySelector('[data-gp-rules]');
const ta = () => card().querySelector('[data-code-ed="garden"] textarea[data-code]');
assert(card() && /Wheat & corn/.test(card().querySelector('.ca-card-title').textContent), 'a Rules card for the active profile');
assert(ta() && ta().value === G.defaultRules() && /default rules/.test(card().textContent), 'its code: the default rules');
assert(card().querySelector('[data-ed-lib="garden"]') && /garden\.plantEmpty/.test(card().querySelector('[data-ed-lib="garden"]').textContent) && /garden\.youngShare/.test(card().querySelector('[data-ed-lib="garden"]').textContent), 'the library beside it, with the garden’s words');
assert(!card().querySelector('[data-gp-rules-act="revert"]'), 'no Revert while default');
// the link from the Auto-gardener card
click(w, page().querySelector('[data-gp-rules-go]'));
assert(card().classList.contains('ca-flash'), 'the rules link finds the card');

// typing: unsaved
ta().value = G.defaultRules().replace('> 0.67', '> 0.5');
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
assert(/unsaved/.test(card().querySelector('.ca-card-head').textContent) && card().querySelector('[data-gp-rules-act="save"]').classList.contains('ca-btn-on'), 'an edit: “unsaved”, Save lights up');
CA.UI.GardenPage.sync();
assert(ta().value.includes('> 0.5'), 'the draft survives the page’s refresh');
CA.UI.Menu.render();
assert(ta().value.includes('> 0.5'), '…and a re-render');
click(w, card().querySelector('[data-gp-rules-act="save"]'));
assert(/> 0\.5/.test(G.active().rules || '') && card().querySelector('.ca-badge-edited') && card().querySelector('[data-gp-rules-act="revert"]'), 'Save: the profile’s rules; “edited” and Revert');
assert(/\(edited\)/.test(page().querySelector('[data-gp-rules-go]').parentNode.textContent), 'the Auto-gardener card says so');

// an error: not saved
ta().value = 'garden.soil(fertilizer)\nwait until\n';
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
click(w, card().querySelector('[data-gp-rules-act="save"]'));
assert(/> 0\.5/.test(G.active().rules) && /Not saved — line 2/.test(card().textContent), `a broken rule isn’t saved (${(card().querySelector('.ca-editor-error') || {}).textContent})`);
click(w, card().querySelector('[data-gp-rules-act="discard"]'));
assert(ta().value === G.active().rules && !/unsaved/.test(card().textContent), 'Discard: back to the saved rules');

// the library inserts into the garden's code
ta().value = '';
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
ta().setSelectionRange(0, 0);
const lib = card().querySelector('[data-ed-lib="garden"]');
const ins = [...lib.querySelectorAll('[data-lib-insert]')].find((b) => /garden\.harvestMature/.test(b.textContent));
click(w, ins);
assert(/garden\.harvestMature\(\)/.test(ta().value), `library click inserts (${JSON.stringify(ta().value)})`);
click(w, card().querySelector('[data-gp-rules-act="discard"]'));

// live: the last pass under the code, its lines lit
CA.Macros.set('gardener', true, { silent: true });
await sleep(1150);
CA.UI.GardenPage.sync();
assert(/last pass/.test(card().querySelector('[data-code-live]').textContent) && card().querySelectorAll('[data-code-gutter] span.run').length > 0, 'while on: the last pass, its lines lit');
CA.Macros.set('gardener', false, { silent: true });
CA.UI.GardenPage.sync();
assert(!card().querySelector('[data-code-live]').textContent && !card().querySelectorAll('[data-code-gutter] span.run').length, 'off: nothing lit');

// saving the default text again = default
click(w, card().querySelector('[data-gp-rules-act="revert"]'));
assert(G.active().rules != null, 'Revert asks first');
click(w, card().querySelector('[data-gp-rules-act="revert"]'));
assert(G.active().rules === undefined && ta().value === G.defaultRules() && !card().querySelector('.ca-badge-edited'), 'then reverts to the default rules');
ta().value = G.defaultRules();
ta().dispatchEvent(new w.Event('input', { bubbles: true }));
click(w, card().querySelector('[data-gp-rules-act="save"]'));
assert(G.active().rules === undefined, 'saving the default text keeps it default (follows the settings)');

// ---- saved and restored
G.setRules(p1.id, 'garden.plantEmpty()\n');
Game.WriteSave();
const saved = Game.modSaveData.CookieMgr;
const data = JSON.parse(saved);
assert(data.garden.find((p) => p.id === p1.id).rules === 'garden.plantEmpty()\n' && !('rules' in data.garden.find((p) => p.id === p2.id)), 'rules saved (only where a profile has its own)');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: saved });
makeGarden(g2.Game);
await sleep(400);
const G2 = g2.window.CookieMgr.Garden;
assert(G2.profiles().find((p) => p.id === p1.id).rules === 'garden.plantEmpty()\n' && G2.profiles().find((p) => p.id === p2.id).rules === undefined, 'restored');

assert(g.errors.length + g2.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
