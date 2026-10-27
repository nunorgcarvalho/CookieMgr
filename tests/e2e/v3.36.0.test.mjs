// v3.36.0: cast tiers. "Force the Hand of Fate on combos" casts by the Grimoire profile in use: combos in
// tiers, each casting once magic is far enough up the bar (0% the spell's cost, 100% full) — the strongest
// combos at once, the regular ones on a full bar. A combo is on when at least its effects are, each with
// the profile's time left. The Cast tiers card on the Grimoire page edits it all.
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({});
const { window: w, Game, G, calls } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const T = CA.CastTiers;
const M = CA.Macros;
const auto = M.get(CA.Grimoire.AUTO_ID);
Game.fps = 30;

// ---- the seeds
let def = T.find('default');
assert(T.activeId() === 'default' && T.list().map((p) => p.id).join() === 'default,savingUp', 'two profiles, Default in use');
assert(def.minLeft === 5, 'time left: 5 seconds');
assert(def.tiers.map((t) => `${t.name} ${t.pct}`).join() === 'Strongest combos 0,Regular combos 100', `Default: two tiers (${def.tiers.map((t) => t.name)})`);
assert(def.tiers[0].combos.map((c) => c.join('+')).join() === 'frenzy+click frenzy,frenzy+dragonflight,click frenzy+building special,dragonflight+building special', `the strongest: today's four (${def.tiers[0].combos.map((c) => c.join('+'))})`);
assert(def.tiers[1].combos.map((c) => c.join('+')).join() === 'frenzy+building special,building special+building special,elder frenzy', 'the regular: Frenzy + BS, two BS, Elder frenzy');
assert(T.find('savingUp').tiers.length === 1, 'Saving up: the strongest only');

// ---- deciding
const BUFFS = {
  F: { name: 'Frenzy', time: 300, maxTime: 300, multCpS: 7 },
  D: { name: 'Dragonflight', time: 300, maxTime: 300, multClick: 1111 },
  C: { name: 'Click frenzy', time: 300, maxTime: 300, multClick: 777 },
  B: { name: 'High-five', time: 300, maxTime: 300, multCpS: 2, type: { name: 'building buff' } },
  b: { name: 'Fertile minds', time: 300, maxTime: 300, multCpS: 2, type: { name: 'building buff' } },
  E: { name: 'Elder frenzy', time: 300, maxTime: 300, multCpS: 666 },
};
const set = (keys) => {
  Game.buffs = {};
  keys.split('').forEach((k) => (Game.buffs[BUFFS[k].name] = { ...BUFFS[k] }));
};
const cost = G.getSpellCost(G.spells['hand of fate']); // 70 of 100
const at = (keys, magic) => {
  set(keys);
  G.magic = magic;
  return T.decide();
};
let d = at('FC', cost);
assert(d && d.ready && d.tier.name === 'Strongest combos', 'Frenzy + Click frenzy, magic at the cost: casts');
d = at('FB', cost);
assert(d && !d.ready && d.tier.name === 'Regular combos', 'Frenzy + a building special at the cost: waits for its tier');
d = at('FB', 99);
assert(d && !d.ready, '…at 99 of 100 too');
d = at('FB', 100);
assert(d && d.ready, '…casts on a full bar');
assert(at('FCDB', cost).ready && T.comboName(at('FCDB', cost).combo) === 'Frenzy + Click frenzy', 'other effects on too: still the combo (at least its effects)');
assert(!at('B', 100) && at('Bb', 100).ready, 'two building specials: one isn’t enough, two are');
assert(at('E', 100).ready && !at('F', 100) && !at('C', cost), 'Elder frenzy alone (regular); Frenzy or Click frenzy alone: nothing');
assert(!at('FC', cost - 1).ready, 'not enough magic for the spell: waits');
// time left
set('FC');
Game.buffs['Click frenzy'].time = 4 * 30;
G.magic = 100;
assert(!T.decide(), 'Click frenzy with 4s left: the combo isn’t on (5s wanted)');
T.update('default', { minLeft: 3 });
assert(T.decide() && T.decide().ready, 'time left 3s: it is');
T.update('default', { minLeft: 5 });
// the bar
G.magic = 85;
assert(Math.round(T.fill()) === 50 && T.magicAt(50) === 85, `fill: half-way from the cost to full (${T.fill()})`);
assert(T.recharge(100) === CA.Grimoire.refillSeconds(100 - cost, 100, 100) && T.recharge(0) === CA.Grimoire.refillSeconds(0, 100, cost), 'recharge: from a cast at the threshold back to it');
assert(T.recharge(0) > T.recharge(100), `…longer from an empty bar (${T.recharge(0)}s vs ${T.recharge(100)}s)`);

// ---- the macro
const src = M.sourceOf(auto);
assert(src === CA.Grimoire.COMBO_SOURCE && /grimoire\.fthofReady\(\)/.test(src) && !CA.Script.compile(src).errors.length, 'its code asks the tiers, and compiles');
async function casts(keys, magic) {
  set(keys);
  calls.spells.length = 0;
  G.magic = magic;
  M.set(auto.id, true, { silent: true });
  await sleep(350);
  M.set(auto.id, false, { silent: true });
  Game.buffs = {};
  return calls.spells.filter((s) => s === 'Force the Hand of Fate').length;
}
assert((await casts('BD', cost)) === 1, 'casts on Building special + Dragonflight with just enough magic');
assert((await casts('FB', 90)) === 0, 'not on Frenzy + a building special at 90 magic');
assert((await casts('FB', 100)) === 1, '…but on a full bar');

// ---- profiles
assert(CA.Actions.run('grimoire.profile', { profile: 'Saving up' }) === 1 && T.activeId() === 'savingUp', 'a macro uses a profile (by name here)');
assert((await casts('FB', 100)) === 0 && (await casts('FC', cost)) === 1, 'Saving up: only the strongest combos');
['grimoire.fthofReady', 'grimoire.fthofTier', 'grimoire.fthofCombo', 'grimoire.fill', 'grimoire.profileActive', 'grimoire.activeProfile', 'grimoire.profiles'].forEach((id) => assert(CA.Script.VALUES.some((v) => v.id === id), `value ${id}`));
const comp = CA.Script.compile('if not grimoire.profileActive(default):\n  grimoire.profile(default)\n', { vars: [] });
assert(comp && !(comp.errors && comp.errors.length), `script: switching profiles (${JSON.stringify(comp && comp.errors)})`);
T.use('default');

const mine = T.add('Mine', 'default');
assert(mine.tiers.length === 2 && T.activeId() === mine.id && mine.tiers[0].combos.length === 4, 'Copy: the same tiers, in use at once');
assert(T.addCombo(mine.id, 1, ['dragon harvest', 'frenzy']) && mine.tiers[1].combos.slice(-1)[0].join() === 'frenzy,dragon harvest', 'add a combo (kept in the picker’s order)');
assert(!T.addCombo(mine.id, 0, ['frenzy', 'dragon harvest']), '…not twice in one profile');
assert(T.moveCombo(mine.id, 1, 0, 0) && mine.tiers[0].combos.slice(-1)[0].join() === 'frenzy,building special' && mine.tiers[1].combos.length === 3, 'move a combo to another tier');
T.updateTier(mine.id, 1, { pct: 40, name: 'Halfway' });
T.addTier(mine.id);
const saved = CA.Settings.serialize();
T.remove(mine.id);
assert(T.activeId() === 'default', 'deleting the profile in use: back to the first');
CA.Settings.load(saved);
const back = T.find('Mine');
assert(back && T.activeId() === back.id && back.tiers.map((t) => `${t.name} ${t.pct}`).join() === 'Strongest combos 0,Halfway 40,Tier 3 50', `restored from the save, in use (${back && back.tiers.map((t) => t.name)})`);
T.use('default');

// ---- the card
def = T.find('default'); // (loading the save made new profiles)
Game.buffs = {};
G.magic = 80;
CA.UI.Menu.openPage('wizard');
await sleep(50);
const page = () => doc.querySelector('[data-page="wizard"]');
const card = () => page().querySelector('[data-ct]');
assert(card(), 'the Cast tiers card on the Grimoire page');
assert([...card().querySelectorAll('.ca-ct-prof')].map((b) => b.textContent).join() === 'Default,Saving up,Mine', 'a tab per profile');
assert(card().querySelector('.ca-ct-prof.on').dataset.id === 'default', '…the one in use lit');
const rows = () => [...card().querySelectorAll('[data-ct-tier]')];
assert(rows().length === 2 && rows()[0].querySelector('.ca-ct-tname').value === 'Strongest combos', 'a row per tier, lowest threshold first');
const chip = rows()[0].querySelector('.ca-ct-combo');
assert(chip.dataset.tip === 'Frenzy + Click frenzy' && chip.textContent.replace('×', '') === 'F+CF', `combos as icons with the abbreviation, full names on hover (${chip.textContent})`);
assert(/back in/.test(rows()[1].querySelector('[data-ct-recharge]').textContent), 'each tier: how long until it recharges');
assert(card().querySelectorAll('.ca-ct-tick').length === 2 && card().querySelector('.ca-ct-cost'), 'the magic bar: the cost and a mark per tier');

// live: a combo on
set('FB');
G.magic = 100;
CA.UI.WizardPage.sync();
assert(rows()[1].classList.contains('firing') && /casting/.test(rows()[1].querySelector('[data-ct-status]').textContent), 'Frenzy + a building special on a full bar: its tier says casting');
assert(rows()[1].querySelector('.ca-ct-combo').classList.contains('match'), '…and the combo lights up');
G.magic = 80;
CA.UI.WizardPage.sync();
assert(/waits for 100%/.test(rows()[1].querySelector('[data-ct-status]').textContent), '…waits for 100% with less');
Game.buffs = {};

// add a combo with the picker
click(w, rows()[1].querySelector('[data-ct-act="pick"]'));
await sleep(20);
const tile = (k) => card().querySelector(`.ca-ct-tile[data-key="${k}"]`);
assert(card().querySelectorAll('.ca-ct-tile').length === 6, 'the picker: every effect');
click(w, tile('building special'));
click(w, tile('building special'));
click(w, tile('dragon harvest'));
assert(/×2/.test(tile('building special').textContent), 'building special twice');
click(w, card().querySelector('[data-ct-act="add"]'));
await sleep(20);
assert(def.tiers[1].combos.slice(-1)[0].join() === 'building special,building special,dragon harvest' && rows()[1].querySelectorAll('.ca-ct-combo').length === 4, 'Add combo: in the tier');

// drag a combo onto the other tier
const fire = (el, type) => el.dispatchEvent(new w.Event(type, { bubbles: true, cancelable: true }));
const elder = [...rows()[1].querySelectorAll('.ca-ct-combo')].find((c) => c.dataset.tip === 'Elder frenzy');
fire(elder, 'dragstart');
fire(rows()[0], 'dragover');
assert(rows()[0].classList.contains('drop'), 'dragging over a tier marks it');
fire(rows()[0], 'drop');
await sleep(20);
assert(def.tiers[0].combos.some((c) => c.join() === 'elder frenzy') && !def.tiers[1].combos.some((c) => c.join() === 'elder frenzy'), 'dropped: moved to Strongest combos');

// the threshold slider
const range = rows()[1].querySelector('[data-ct-pct]');
range.value = '60';
fire(range, 'input');
assert(rows()[1].querySelector('[data-ct-pct-out]').textContent === '60%' && /≥ 88 magic/.test(rows()[1].querySelector('[data-ct-abs]').textContent), 'moving it: the labels follow');
fire(range, 'change');
await sleep(20);
assert(def.tiers[1].pct === 60, 'let go: saved');

// switch profiles from the tabs, delete one (two clicks)
click(w, card().querySelector('.ca-ct-prof[data-id="savingUp"]'));
await sleep(20);
assert(T.activeId() === 'savingUp' && rows().length === 1, 'a tab: uses that profile');
const del = card().querySelector('[data-ct-act="delprof"]');
click(w, del);
assert(T.find('savingUp'), 'Delete: armed first');
click(w, card().querySelector('[data-ct-act="delprof"]'));
await sleep(20);
assert(!T.find('savingUp') && card().querySelectorAll('.ca-ct-prof').length === 2, '…then gone');

// a macro switching profiles: the card follows
T.use('Mine');
CA.UI.WizardPage.sync();
await sleep(20);
assert(card().querySelector('.ca-ct-prof.on').dataset.id === T.find('Mine').id, 'switched by a macro: the card follows');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
