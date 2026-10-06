// v2.13.0: every macro off on ascend, click animation choice, activity rings, spell readiness
// tint, Grimoire countdown target, the gardener's icon.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, G } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = () => doc.getElementById('CookieMgrWidgets');

// ---- ascend: all of them
['stockTrader', 'lumps', 'golden', 'season'].forEach((id) => CA.Macros.set(id, true, { silent: true }));
CA.Events.emit('ascend');
assert(CA.Macros.runningIds().length === 0, `ascending switches every macro off (${CA.Macros.runningIds()})`);
CA.Settings.set('disableOnAscend', false);
CA.Macros.set('stockTrader', true, { silent: true });
CA.Events.emit('ascend');
assert(CA.Macros.isOn('stockTrader'), 'unless the option is off');
CA.Macros.set('stockTrader', false, { silent: true });

// ---- click animation
Game.prefs = { particles: 1, numbers: 1 };
const seen = [];
const realClick = Game.ClickCookie;
Game.ClickCookie = (...a) => {
  seen.push(`${Game.prefs.particles}${Game.prefs.numbers}`);
  return realClick.apply(Game, a);
};
CA.Macros.runOnce('bigCookie');
CA.UI.Menu.openPage('clickers');
const sel = doc.querySelector('[data-macro-row="bigCookie"] select[data-macro-param]');
assert(sel && [...sel.options].map((o) => o.value).join() === 'default,noText,none', 'Big cookie row: animation choice');
sel.value = 'noText';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
CA.Macros.runOnce('bigCookie');
sel.value = 'none';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
CA.Macros.runOnce('bigCookie');
assert(seen.join() === '11,10,00', `default / no number / nothing (${seen})`);
assert(Game.prefs.particles === 1 && Game.prefs.numbers === 1, 'your own clicks keep the game’s settings');
assert(/no animation/.test(CA.Actions.describe(CA.Macros.stepsOf(CA.Macros.get('bigCookie'))[0])), 'the step says so');

// ---- activity rings
for (let i = 0; i < 400; i++) CA.Macros.runOnce('bigCookie');
assert(CA.Macros.activityLevel('bigCookie') >= 3 && CA.Macros.activityLevel('wrath') === 0, `busy vs idle (${CA.Macros.rate('bigCookie').toFixed(2)}/s)`);
['bigCookie', 'wrath'].forEach((id) => CA.Macros.setFav(id, true));
CA.UI.Widgets.tick();
const heat = (id) => W().querySelector(`[data-w-trigger="${id}"] .ca-wb-heat`).className;
assert(/h[3-5]/.test(heat('bigCookie')) && /h0/.test(heat('wrath')), `rings: ${heat('bigCookie')} / ${heat('wrath')}`);
assert(/lately/.test(W().querySelector('[data-w-trigger="bigCookie"]').parentNode.textContent), 'hover says how often');

// ---- spell readiness on spell buttons
CA.Macros.setFav('castFthof', true);
G.magic = 5;
CA.UI.Widgets.tick();
const fthof = () => W().querySelector('[data-w-trigger="castFthof"]');
assert(fthof().classList.contains('spell-cant') && /not enough magic yet/.test(fthof().parentNode.textContent), 'not enough magic: muted red');
G.magic = 100;
CA.UI.Widgets.tick();
assert(fthof().classList.contains('spell-can'), 'enough: muted green');
assert(!W().querySelector('[data-w-trigger="bigCookie"]').className.includes('spell-'), 'other buttons untouched');

// ---- Grimoire target
CA.UI.Widgets.add('grimoire');
const grim = () => CA.UI.Widgets.list().find((x) => x.type === 'grimoire');
const gbox = () => W().querySelector(`[data-widget="${grim().id}"]`);
G.magic = 40;
CA.UI.Widgets.tick();
assert(!gbox().querySelector('.ca-orb-mark'), 'default: counts down to full, no mark');
CA.UI.Widgets.openSettings(grim().id);
const tsel = doc.querySelector('[data-w-editor] select[data-w-opt="target"]');
assert(tsel && /Force the Hand of Fate \(\d+ magic now\)/.test(tsel.textContent), 'settings: pick a spell');
tsel.value = 'hand of fate';
tsel.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(grim().target === 'hand of fate', 'saved on the widget');
const cost = CA.Grimoire.spells().find((s) => s.key === 'hand of fate').cost;
const label = () => gbox().querySelector('.ca-orb-label').textContent;
assert(gbox().querySelector('.ca-orb-mark') && label() === CA.UI.Plot.fmt.span(CA.Grimoire.secondsUntil(cost)), `counts down to the spell's ${cost} magic (${label()})`);
assert(new RegExp(`Target\\s*Force the Hand of Fate \\(${cost}\\)`).test(gbox().textContent), 'popup names the target');
G.magic = cost + 1;
CA.UI.Widgets.tick();
assert(label() === 'ready' && gbox().querySelector('.ca-orb.ready'), 'enough: ready, glowing');
grim().target = 'custom';
grim().targetMagic = 30;
G.magic = 10;
CA.UI.Widgets.tick();
assert(label() === CA.UI.Plot.fmt.span(CA.Grimoire.secondsUntil(30)), 'a fixed amount');
Game.WriteSave();
const sw = JSON.parse(Game.modSaveData.CookieMgr).widgets.find((x) => x.type === 'grimoire');
assert(sw.target === 'custom' && sw.targetMagic === 30, 'target saved');

// ---- the gardener has an icon (a cell of gardenPlants.png, not the whole sheet)
CA.UI.Menu.openPage('clickers');
const gi = doc.querySelector('[data-macro-row="gardener"] .ca-sprite');
assert(gi && /gardenPlants\.png/.test(gi.getAttribute('style')) && /-192px 0px/.test(gi.getAttribute('style')), 'Auto-gardener: mature wheat icon');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
