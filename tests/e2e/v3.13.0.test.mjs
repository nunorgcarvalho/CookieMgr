// v3.13.0: no Force the Hand of Fate forecast. CookieMgr doesn't read the save's seed to say what a cast
// will give: no CA.Fthof, no fthof.next / nextIs / after / castsUntil words, no next casts in the spell
// tooltips or the Golden timeline (a widget saved with them shows its default parts), and Force the Hand
// of Fate on combos casts on every combo, with no Forecast or Skip ahead on its card. The backfire chance
// (a probability, not a prediction) stays: fthof.backfireChance, and spell.failChance for any spell.
// Pet the dragon learns which quarter-hour gives which drop by petting, instead of from the seed.
import fs from 'node:fs';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, BUNDLE } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, G, calls } = g;
const CA = w.CookieMgr;
const doc = w.document;
G.spellTooltip = () => () => '<div class="name">Spell</div>';
await sleep(400);
const word = (id) => CA.Script.VALUES.find((v) => v.id === id);
const AB = () => CA.AutoBuy;

// ---- the forecast is gone
assert(CA.Fthof === undefined, 'no CA.Fthof');
assert(['fthof.next', 'fthof.nextIs', 'fthof.after', 'fthof.castsUntil'].every((id) => !word(id)), 'no fthof.next / nextIs / after / castsUntil words');
const bundle = fs.readFileSync(BUNDLE, 'utf8');
assert(!/STARTDENOM|arc4/i.test(bundle) && !/Game\.seed\}\/\$\{/.test(bundle), 'the bundle has no copy of the game’s seeded generator, and works out no cast’s seed');

// ---- the backfire chance stays
assert(word('fthof.backfireChance').get() === 0.15 && word('spell.failChance').get('hand of fate') === 0.15, 'fthof.backfireChance and spell.failChance: the chance to backfire now');

// ---- the spell tooltips: no next casts
await sleep(1100); // wrapped within a second
const tip = G.spellTooltip(1)();
assert(!/Cast 1/.test(tip) && /Magic after casting/.test(tip), 'Force the Hand of Fate’s tooltip: magic and timing, no next casts');

// ---- Force the Hand of Fate on combos: casts on every combo, no choices
const M = CA.Macros;
const id = CA.Grimoire.AUTO_ID;
assert(!(M.get(id).inputs || []).length, 'no Forecast / Skip ahead on its card');
assert(!/fthof\./.test(M.sourceOf(M.get(id))) && !CA.Script.compile(M.sourceOf(M.get(id))).errors.length, 'its code reads no forecast and compiles');
Game.buffs = { Frenzy: { name: 'Frenzy', time: 300, maxTime: 300, multCpS: 7 }, Dragonflight: { name: 'Dragonflight', time: 300, maxTime: 300, multClick: 1111 } };
G.magic = 100;
calls.spells.length = 0;
M.set(id, true, { silent: true });
await sleep(400);
M.set(id, false, { silent: true });
Game.buffs = {};
assert(calls.spells.join() === 'Force the Hand of Fate', `Frenzy + Dragonflight: cast once (${calls.spells.join()})`);

// ---- the Golden timeline: no Force the Hand of Fate part; one saved with it shows the rest
Game.fps = 30;
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 330, minTime: 30 * 300, maxTime: 30 * 900, spawned: 0, n: 0, spawnConditions: () => true });
assert(!CA.UI.TimelineWidget.PARTS.some((p) => p.v === 'fthof'), 'no Force the Hand of Fate part to pick');
CA.Settings.set('widgetsShown', true);
CA.UI.Widgets.add('goldenTimeline');
CA.UI.Widgets.render();
const inst = CA.UI.Widgets.list().find((x) => x.title === 'Golden timeline');
const box = () => [...doc.querySelectorAll('#CookieMgrWidgets [data-widget]')].find((x) => x.querySelector('.ca-tl-w'));
inst.stats = ['fthof'];
CA.UI.Widgets.tick();
assert(box().querySelector('.ca-tl-nums') && box().querySelector('.ca-sp-chart') && !box().querySelector('.ca-tl-cast'), 'saved with the forecast alone: its default parts instead');
inst.stats = ['numbers', 'fthof'];
CA.UI.Widgets.tick();
assert(box().querySelector('.ca-tl-nums') && !box().querySelector('.ca-sp-chart') && !box().querySelector('.ca-tl-cast'), 'saved with numbers + the forecast: the numbers');

// ---- Pet the dragon learns by petting, never from the seed
assert(!/dragonTime/.test(bundle), 'the bundle never works out the dragon’s drop order from the seed');
let seeded = 0;
w.Math.seedrandom = () => seeded++;
Game.dragonLevel = 8;
const owned = new Set(['Pet the dragon']);
Game.Has = (n) => owned.has(n);
Game.HasUnlocked = () => false;
let pets = 0;
Game.ClickSpecialPic = () => pets++; // this quarter's drop is one you already have: nothing drops
const dropNow = () => word('dragon.dropNow').get();
assert(dropNow() === '?', 'dragon.dropNow: "?" — this quarter not tried yet');
assert(CA.Macros.runOnce('petDragon') === 0 && pets === 200, `nothing drops: gives up after 200 pets (${pets})`);
assert(dropNow() === '' && AB().petSchedule().find((x) => x.now).open === false, '…and knows this quarter gives nothing new');
pets = 0;
CA.Macros.runOnce('petDragon');
assert(pets === 0, 'so it doesn’t pet again this quarter');
Game.resets = (Game.resets || 0) + 1;
assert(dropNow() === '?', 'a new run (an ascension): learned anew');
assert(seeded === 0, 'never seeds the game’s generator');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
