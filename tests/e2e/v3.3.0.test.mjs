// v3.3.0: the auto-gardener as four layers — gardener (code), soil rule (code the gardener calls),
// template (letters on the plot), seeds (a seed per letter) — and profiles that pick all four.
// Built-ins of every layer (editable, revertable) and yours; templates laid on the plot from its
// top-left unlocked tile; "From the garden" reusing a template you have (Fill for one seed); the
// Garden page's slots and editors; the Macros page's card; saved; v3.2 saves moved over.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
const M = makeGarden(Game); // tiles x 1–4, y 2–4: the origin is (1, 2)
await sleep(400);
const G = CA.Garden;
const LY = CA.GardenLayers;
const set = (x, y, key, age = 0) => (M.plot[y][x] = key ? [M.plants[key].id + 1, age] : [0, 0]);
const at = (x, y) => (M.plot[y][x][0] ? M.plantsById[M.plot[y][x][0] - 1].key : null);
const clear = () => M.plot.forEach((r) => r.forEach((t) => ((t[0] = 0), (t[1] = 0))));
const soil = () => M.soilsById[M.soil].key;
const ids = (layer) => LY.list(layer).map((x) => x.id);
Game.cookies = 1e12;

// ---- the layers and their built-ins
assert(ids('gardener').join() === 'effects,cohort,tulipRounds,weeds,mutations', 'gardeners: the built-ins (v3.4: the Full-garden replanter too; v3.40: Tulip and clover rounds)');
assert(['effects', 'mutations', 'fertilizer', 'clay', 'woodchips', 'none'].every((id) => ids('soil').includes(id)), `soil rules (${ids('soil')})`);
assert(['current', 'fill', 'bare', 'checker', 'rows', 'rings'].every((id) => ids('template').includes(id)), `templates (${ids('template')})`);
assert(['current', 'goldenClover', 'bakerWheat', 'to-thumbcorn', 'to-cronerice', 'to-nursetulip'].every((id) => ids('seeds').includes(id)) && LY.get('seeds', 'to-cronerice').data.map.B === 'thumbcorn', 'seed sets: for their effects, and the game’s mutation recipes');
assert(['maxEffects', 'goldenClovers', 'mutationHunt', 'juicyQueenbeet', 'weedFarm'].every((id) => ids('profile').includes(id)), `profiles (${ids('profile')})`);
LY.list('gardener')
  .concat(LY.list('soil'))
  .forEach((x) => {
    const src = (LY.get('gardener', x.id) && LY.list('gardener').some((y) => y.id === x.id) ? LY.get('gardener', x.id) : LY.get('soil', x.id)).data.rules;
    assert(G.compileRules(src).errors.length === 0, `${x.name}: compiles`);
  });
assert(LY.list('gardener').every((x) => /garden\.soilRule\(\)/.test(LY.get('gardener', x.id).data.rules)), 'every built-in gardener calls the soil rule');
assert(LY.list('profile').every((p) => LY.PARTS.every((k) => LY.has(k, LY.get('profile', p.id).data[k]))), 'every built-in profile picks things that exist');

// ---- a template on the plot: from its top-left unlocked tile
LY.pick('template', 'rows');
LY.pick('seeds', 'to-cronerice');
let lay = G.active();
assert(lay.plot[2][1] === 'bakerWheat' && lay.plot[2][4] === 'bakerWheat' && lay.plot[3][2] === null && lay.plot[4][3] === 'thumbcorn' && lay.name === 'Mutation rows · → Cronerice', 'Mutation rows on a small plot: A row, empty row, B row from its top-left');
clear();
M.nextStep = Date.now() + 200e3;
G.tend();
assert(at(1, 2) === 'bakerWheat' && at(1, 3) === null && at(4, 4) === 'thumbcorn' && at(0, 0) === null, 'planted as laid out');

// ---- profiles: load all four; changed; save into a built-in (edited) and revert
LY.pick('profile', 'goldenClovers');
assert(LY.picked('gardener') === 'effects' && LY.picked('soil') === 'effects' && LY.picked('template') === 'fill' && LY.picked('seeds') === 'goldenClover' && !LY.profileChanged(), 'loading a profile picks its four');
LY.pick('seeds', 'bakerWheat');
assert(LY.profileChanged(), 'a slot changed: the profile shows it');
LY.saveProfile();
assert(LY.get('profile', 'goldenClovers').edited && LY.get('profile', 'goldenClovers').data.seeds === 'bakerWheat' && !LY.profileChanged(), 'Save: into the profile (a built-in: edited)');
LY.set('profile', 'goldenClovers', null);
assert(!LY.get('profile', 'goldenClovers').edited && LY.get('profile', 'goldenClovers').data.seeds === 'goldenClover', 'Revert: the built-in again');

// ---- the soil rule: the gardener calls it
LY.pick('profile', 'maxEffects');
LY.pick('soil', 'clay');
M.soil = 0;
M.nextSoil = 0;
G.tend();
assert(soil() === 'clay' && G.soilPass().soil === 'clay', 'Always clay: the gardener’s garden.soilRule() switched to clay');
LY.pick('soil', 'none');
M.nextSoil = 0;
G.tend();
assert(soil() === 'clay', 'Leave the soil: unchanged');
const myRule = LY.add('soil', 'Dirt please', { rules: 'garden.soil(dirt)\n' });
LY.pick('soil', myRule);
M.nextSoil = 0;
G.tend();
assert(soil() === 'dirt', 'a soil rule of your own');

// ---- "From the garden": a template you have, if it lays out the same
clear();
for (let y = 2; y <= 4; y++) for (let x = 1; x <= 4; x++) set(x, y, 'bakerWheat', 5);
const nT = LY.list('template').length;
const nS = LY.list('seeds').length;
const one = G.snapshot('Wheat field');
assert(one.data.template === 'fill' && one.data.seeds === 'bakerWheat' && LY.list('template').length === nT && LY.list('seeds').length === nS && one.data.soil === myRule, 'one seed everywhere: Fill and the Baker’s wheat seeds — nothing new; the gardener and soil rule picked now');
clear();
for (let y = 2; y <= 4; y++) for (let x = 1; x <= 4; x++) set(x, y, (x + y) % 2 ? 'bakerWheat' : 'thumbcorn', 5);
const chk = G.snapshot('Checks');
assert(chk.data.template === 'checker' && LY.get('seeds', chk.data.seeds).data.map.A === 'bakerWheat' && LY.get('seeds', chk.data.seeds).data.map.B === 'thumbcorn' && chk.data.seeds === 'to-cronerice', 'a checkerboard: the Checkerboard template, and seeds you have with the same letters');
set(1, 2, null);
set(2, 2, null);
G.tend();
assert(at(1, 2) === 'bakerWheat' && at(2, 2) === 'thumbcorn', '…and kept as it was');
clear();
set(1, 2, 'bakerWheat', 5);
set(3, 3, 'thumbcorn', 5);
const odd = G.snapshot('Odd');
const oddT = LY.get('template', odd.data.template);
assert(!oddT.builtin && oddT.data.plot[0][0] === 'A' && oddT.data.plot[1][2] === 'B' && !oddT.data.abs, 'otherwise a new template, from the plot’s top-left');

// ---- the Garden page: the profile bar, four slots, the selected one in detail
LY.pick('profile', 'maxEffects');
CA.UI.Menu.openPage('garden');
const card = () => doc.querySelector('[data-page="garden"] [data-gp-rules]');
const q = (s) => card().querySelector(s);
assert([...card().querySelectorAll('[data-gp-slot]')].map((b) => b.dataset.gpSlot).join() === 'gardener,soil,template,seeds', 'four slots: gardener, soil rule, template, seeds');
assert(q('[data-gp-pick="profile"]').value === 'maxEffects' && /Current garden/.test(q('[data-gp-slot="template"]').textContent), 'the profile bar and the slots show the picks');
// the template slot: a grid to paint
click(w, q('[data-gp-slot="template"]'));
assert(q('[data-gp-detail="template"]') && q('[data-gp-cell="0,0"]').disabled, 'the Current garden: shown, not editable (live)');
const pickT = q('[data-gp-pick="template"]');
pickT.value = 'checker';
pickT.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(LY.picked('template') === 'checker' && /changed/.test(q('.ca-gprof').textContent), 'another template: picked; the profile says “changed”');
click(w, q('[data-gp-brush="C"]'));
click(w, q('[data-gp-cell="0,0"]'));
assert(/unsaved/.test(q('[data-gp-dhead]').textContent) && q('[data-gp-cell="0,0"]').textContent.includes('C'), 'painting a cell: a draft (unsaved)');
click(w, q('[data-gp-act="new"]'));
const myT = LY.picked('template');
assert(!LY.get('template', myT).builtin && LY.get('template', myT).data.plot[0][0] === 'C' && !LY.get('template', 'checker').edited, 'Save as new: a template of yours, picked; the built-in unchanged');
// the seeds slot: a tab per letter of the template, and the seeds to pick from (icons and names)
click(w, q('[data-gp-slot="seeds"]'));
const pickS = q('[data-gp-pick="seeds"]');
pickS.value = 'to-cronerice';
pickS.dispatchEvent(new w.Event('change', { bubbles: true }));
assert([...card().querySelectorAll('[data-gp-letter]')].map((b) => b.dataset.gpLetter).join() === 'A,B,C', 'Seeds: a tab per letter of the template (A, B, and the new C)');
assert(/Baker’s wheat|Baker's wheat/.test(q('[data-gp-letter="A"]').textContent) && q('[data-gp-letter="A"] .ca-gs'), 'each tab: its seed’s icon and name');
click(w, q('[data-gp-letter="C"]'));
const opts = () => [...card().querySelectorAll('[data-gp-seedpick]')].map((b) => b.dataset.gpSeedpick);
assert(q('[data-gp-letter="C"].on') && opts().includes('bakeberry') && opts().includes('') && !opts().includes('goldenClover') && q('[data-gp-seedpick="bakeberry"] .ca-gs') && /Bakeberry/.test(q('[data-gp-seedpick="bakeberry"]').textContent), 'C’s picker: the unlocked seeds as icons with names (and “nothing”); locked ones hidden');
const tog = q('[data-gp-showlocked]');
tog.checked = true;
tog.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(opts().includes('goldenClover') && q('[data-gp-seedpick="goldenClover"]').classList.contains('locked') && /not unlocked/.test(q('[data-gp-seedpick="goldenClover"]').dataset.tip), 'the toggle: locked seeds too, marked');
click(w, q('[data-gp-seedpick="bakeberry"]'));
assert(q('[data-gp-seedpick="bakeberry"].on') && /Bakeberry/.test(q('[data-gp-letter="C"]').textContent) && /unsaved/.test(q('[data-gp-dhead]').textContent), 'a pick: the letter’s tab shows it (unsaved)');
click(w, q('[data-gp-act="save"]'));
assert(LY.get('seeds', 'to-cronerice').edited && LY.get('seeds', 'to-cronerice').data.map.C === 'bakeberry', 'Save: a built-in seed set, edited');
assert(q('[data-gp-act="revert"]'), 'Revert offered');
click(w, q('[data-gp-act="revert"]'));
click(w, q('[data-gp-act="revert"]'));
assert(!LY.get('seeds', 'to-cronerice').edited, 'reverted (two clicks)');
// a profile of these
click(w, q('[data-gp-pact="new"]'));
const myP = LY.picked('profile');
assert(!LY.get('profile', myP).builtin && LY.get('profile', myP).data.template === myT && !LY.profileChanged(), 'Save as new profile: the four picks');
const rn = q('[data-gp-iname="profile"]');
rn.value = 'My mix';
rn.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(LY.get('profile', myP).name === 'My mix', 'rename it');
// the gardener slot: code, as before
click(w, q('[data-gp-slot="gardener"]'));
assert(q('[data-code-ed="garden"] textarea[data-code]').value === G.rulesOf(), 'the Gardener slot: its code');

// ---- the Macros page: the same picks on the Auto-gardener's card
CA.UI.Menu.openPage('clickers');
const inp = (key) => doc.querySelector(`[data-page="clickers"] [data-macro-input="gardener"][data-key="${key}"]`);
assert(['profile', 'gardener', 'soilRule', 'template', 'seedSet'].every((k) => inp(k)) && inp('profile').value === myP && inp('template').value === myT, 'the card: Profile, Gardener, Soil rule, Template, Seeds — as picked');
inp('profile').value = 'weedFarm';
inp('profile').dispatchEvent(new w.Event('change', { bubbles: true }));
assert(LY.picked('gardener') === 'weeds' && LY.picked('template') === 'bare' && inp('gardener').value === 'weeds', 'a profile picked there loads its four (and the card shows them)');
inp('seedSet').value = 'bakerWheat';
inp('seedSet').dispatchEvent(new w.Event('change', { bubbles: true }));
assert(LY.picked('seeds') === 'bakerWheat', 'one layer picked there');

// ---- saved and restored
LY.pick('profile', myP);
Game.WriteSave();
const data = JSON.parse(Game.modSaveData.CookieMgr);
assert(data.garden.v === 3 && data.options.gardenProfile === myP && data.options.gardenTemplate === myT && data.garden.template.some((t) => t.id === myT) && data.garden.soil.some((s) => s.id === myRule), 'saved: the picks and your items');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: Game.modSaveData.CookieMgr });
makeGarden(g2.Game);
await sleep(400);
const L2 = g2.window.CookieMgr.GardenLayers;
assert(L2.picked('profile') === myP && L2.get('profile', myP).name === 'My mix' && L2.get('template', myT).data.plot[0][0] === 'C' && L2.picked('soil') === 'effects' && L2.get('soil', myRule).name === 'Dirt please', 'restored');

// ---- a v3.2 save: its layouts become templates + seeds and profiles; its gardeners stay
const v32 = JSON.parse(Game.modSaveData.CookieMgr);
const plot = Array.from({ length: 6 }, (_, y) => Array.from({ length: 6 }, (_, x) => (y === 2 && x >= 1 && x <= 4 ? 'bakerWheat' : y === 3 && x === 1 ? 'thumbcorn' : null)));
v32.garden = {
  profiles: [{ id: 'gOld', name: 'Old layout', soil: 'clay', plot }],
  gardeners: [{ id: 'effects', rules: '# edited\ngarden.plantEmpty()\n' }, { id: 'rMine', name: 'Mine', rules: 'garden.harvestNew()\n' }],
};
v32.options.gardenProfile = 'gOld';
v32.options.gardenGardener = 'rMine';
const g3 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: JSON.stringify(v32) });
makeGarden(g3.Game);
await sleep(400);
const L3 = g3.window.CookieMgr.GardenLayers;
const G3 = g3.window.CookieMgr.Garden;
const old = L3.get('profile', 'gOld');
assert(old && old.name === 'Old layout' && old.data.gardener === 'rMine' && L3.picked('profile') === 'gOld' && L3.picked('gardener') === 'rMine', 'v3.2: a layout became a profile (same id), with the gardener in use; loaded');
assert(G3.active().plot[2][1] === 'bakerWheat' && G3.active().plot[3][1] === 'thumbcorn' && G3.active().plot[3][2] === null && L3.get('template', old.data.template).data.abs, '…its template + seeds lay it out as it was (where it was)');
assert(L3.get('gardener', 'effects').edited && L3.get('gardener', 'rMine').name === 'Mine', '…the gardeners as they were');

assert(g.errors.length + g2.errors.length + g3.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
