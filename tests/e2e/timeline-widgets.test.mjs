// Force the Hand of Fate's forecast and the golden cookie widgets (renamed vX.Y.Z.test.mjs when it lands):
// the forecast from the save's seed (the words, the spell's tooltip, Gambler's Fever Dream's); the
// Golden timeline / Next golden cookie / Effect timers widgets — the Stats page's chart and bars at the
// widget's width, the next casts, each part picked in its settings and saved. (The forecast against
// real casts: tests/sim/fthof.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);

// ---- a Grimoire, a seed
const spell = (name, costMin, costPercent, fail) => ({ name, costMin, costPercent, fail: fail ? () => 0 : undefined });
const spells = { 'conjure baked goods': spell('Conjure Baked Goods', 2, 0.4, true), 'hand of fate': spell('Force the Hand of Fate', 10, 0.6, true), "haggler's charm": spell("Haggler's Charm", 10, 0.1, true), "gambler's fever dream": spell("Gambler's Fever Dream", 3, 0.05, false) };
Object.values(spells).forEach((s, i) => (s.id = i));
const G = { spells, spellsById: Object.values(spells), magic: 100, magicM: 100, spellsCastTotal: 7, getSpellCost: (s) => Math.floor(s.costMin + 100 * s.costPercent), getFailChance: () => 0.15, spellTooltip: () => () => '<div class="name">Spell</div>' };
Game.Objects['Wizard tower'] = Game.Objects['Wizard tower'] || { name: 'Wizard tower', amount: 1, level: 1 };
Game.Objects['Wizard tower'].minigame = G;
Game.seed = 'abcde';
Game.season = '';
Game.BuildingsOwned = 100;
Game.hasBuff = () => false;

const f = CA.Fthof.forecast(10);
assert(f && f.length === 10 && f.every((x, i) => x.n === i + 1 && CA.Fthof.OUTCOMES[x.outcome]), `ten casts forecast: ${f && f.map((x) => x.outcome).join(', ')}`);
assert(JSON.stringify(CA.Fthof.forecast(10)) === JSON.stringify(f), 'the same save: the same forecast');
G.spellsCastTotal = 8;
assert(CA.Fthof.forecast(9).map((x) => x.outcome).join() === f.slice(1).map((x) => x.outcome).join(), 'a spell cast moves it on by one');
G.spellsCastTotal = 7;
// a backfire: the same roll against a higher fail chance
G.getFailChance = () => 0.99;
assert(CA.Fthof.forecast(10).every((x, i) => (f[i].roll < 0.01 ? !x.wrath : x.wrath && x.outcome === f[i].backfire)), 'at 99% to backfire: the backfire outcomes');
G.getFailChance = () => 0.15;
// words
assert(V('fthof.next') === f[0].outcome && V('fthof.nextIs', f[0].outcome) === true && V('fthof.after', 4) === f[3].outcome && V('fthof.backfireChance') === 0.15, 'the words: next, nextIs, after, backfireChance');
const firstLucky = f.findIndex((x) => x.outcome === 'multiply cookies');
assert(V('fthof.castsUntil', 'multiply cookies') === (firstLucky >= 0 ? firstLucky : CA.Fthof.castsUntil('multiply cookies')) && V('fthof.castsUntil', 'Lucky') === V('fthof.castsUntil', 'multiply cookies'), 'castsUntil: by the game’s name or ours');
assert(f.every((x) => !x.gfd || G.spells[x.gfd.spell]), 'Gambler’s Fever Dream: the spell it would pick, at each cast');

// ---- the spell tooltips
await sleep(1100); // wrapped within a second
const tip = G.spellTooltip(1)();
assert(/Cast 1 \(next\)/.test(tip) && /Cast 8/.test(tip) && tip.includes(CA.Fthof.nameOf(f[0].outcome)) && /backfire chance/.test(tip), 'Force the Hand of Fate’s tooltip: the next eight casts');
const gtip = G.spellTooltip(3)();
assert(/Cast 1 \(next\)/.test(gtip) && !/Cast 5/.test(gtip), 'Gambler’s Fever Dream’s: what it would cast, four ahead');

// ---- the widgets
Game.fps = 30;
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, { time: 30 * 330, minTime: 30 * 300, maxTime: 30 * 900, spawned: 0, n: 0, spawnConditions: () => true });
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 60, maxTime: 30 * 77, multCpS: 7 } };
CA.Settings.set('widgetsShown', true);
['goldenTimeline', 'goldenNext', 'effectTimers'].forEach((t) => CA.UI.Widgets.add(t));
CA.UI.Widgets.render();
CA.UI.Widgets.tick();
const el = (t) => doc.querySelector(`#CookieMgrWidgets .ca-w-${t}`) || [...doc.querySelectorAll('#CookieMgrWidgets [data-widget]')].find((x) => x.querySelector('.ca-w-title') && x.querySelector('.ca-w-title').textContent === { goldenTimeline: 'Golden timeline', goldenNext: 'Next golden cookie', effectTimers: 'Effect timers' }[t]);
const tl = el('goldenTimeline');
assert(tl && tl.querySelector('.ca-tl-nums') && tl.querySelector('.ca-sp-chart .ca-sp-pdf rect') && tl.querySelector('.ca-sp-lane.next') && tl.querySelector('.ca-sp-lane.up') && tl.querySelectorAll('.ca-tl-cast').length === 5, 'Golden timeline: the numbers, the chart, the next cookie’s bar, the effect’s, five casts ahead');
const svg = tl.querySelector('.ca-sp-chart');
assert(Number(svg.getAttribute('viewBox').split(' ')[2]) === 300 - 18 && !svg.hasAttribute('data-sp-chart'), 'its chart drawn at the widget’s width (text unstretched), no hover readout');
const d = CA.Timers.distribution('golden', 60);
assert(tl.querySelector('.ca-tl-nums').textContent.includes(CA.Format.span(d.wait.mean)), 'the expected wait: the Stats page’s (CA.Timers)');
const nx = el('goldenNext');
assert(nx && nx.querySelector('.ca-sp-pdf rect') && !nx.querySelector('.ca-sp-lane.up') && !nx.querySelector('.ca-tl-cast'), 'Next golden cookie: numbers and chart, no effects, no forecast');
const et = el('effectTimers');
assert(et && et.querySelector('.ca-sp-lane.up') && !et.querySelector('.ca-sp-pdf') && /GC/.test(et.textContent), 'Effect timers: the bars alone, with the chance of a golden cookie');
// parts, by its settings
const inst = CA.UI.Widgets.list().find((x) => x.type === 'goldenTimeline');
inst.stats = ['fthof'];
inst.count = 3;
CA.UI.Widgets.tick();
assert(el('goldenTimeline').querySelectorAll('.ca-tl-cast').length === 3 && !el('goldenTimeline').querySelector('.ca-sp-chart'), 'settings: the forecast alone, three casts');
const saved = CA.UI.Widgets.serialize().find((x) => x.type === 'goldenTimeline');
assert(saved.stats.join() === 'fthof' && saved.count === 3, 'saved with the settings');
// nothing running
Game.buffs = {};
CA.UI.Widgets.tick();
assert(/No effects running/.test(el('effectTimers').textContent), 'Effect timers with nothing running: says so');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
