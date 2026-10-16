// v3.12.2: Force the Hand of Fate's forecast, cached: worked out once per state —
// the save's seed and spells cast, the backfire chance, the season's picture draw, Dragonflight, 10+ buildings —
// so a macro asking every tick costs nothing more; the same answers as worked out afresh. (In the real game,
// with real casts: tests/sim/fthof.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const F = CA.Fthof;
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);

const fthof = { name: 'Force the Hand of Fate', id: 0, costMin: 10, costPercent: 0.6, fail: () => 0 };
let fail = 0.15;
const G = { spells: { 'hand of fate': fthof }, spellsById: [fthof], magic: 100, magicM: 100, spellsCastTotal: 0, getSpellCost: () => 70, getFailChance: () => fail };
Game.Objects['Wizard tower'] = Game.Objects['Wizard tower'] || { name: 'Wizard tower', amount: 1, level: 1 };
Game.Objects['Wizard tower'].minigame = G;
Game.seed = 'cache';
Game.season = '';
Game.BuildingsOwned = 50;
let dragonflight = false;
Game.hasBuff = (n) => n === 'Dragonflight' && dragonflight;

const afresh = (k) => Array.from({ length: k }, (_, i) => F.castAt(`${Game.seed}/${G.spellsCastTotal + i}`, fail).outcome);
const agrees = (label) => {
  const want = afresh(100);
  assert(V('fthof.next') === want[0] && V('fthof.after', 5) === want[4] && ['frenzy', 'click frenzy', 'building special'].every((o) => V('fthof.castsUntil', o) === want.indexOf(o)), `the same as afresh: ${label}`);
};
agrees('as it is');
G.spellsCastTotal++;
agrees('a cast later');
Game.season = 'halloween';
agrees('Halloween');
Game.BuildingsOwned = 5;
agrees('5 buildings');
fail = 0.3;
agrees('a golden cookie on screen (30% to backfire)');
dragonflight = true;
agrees('Dragonflight');

const s0 = F.seedings();
for (let i = 0; i < 400; i++) {
  V('fthof.castsUntil', 'click frenzy');
  V('fthof.nextIs', 'frenzy');
  V('fthof.after', 3);
}
assert(F.seedings() - s0 === 0, `1200 asks of a state already worked out: ${F.seedings() - s0} seedings`);
G.spellsCastTotal++;
V('fthof.castsUntil', 'building special');
assert(F.seedings() - s0 <= 100, `a cast: worked out once more (${F.seedings() - s0})`);
assert(F.forecast(3).every((x) => 'gfd' in x) && F.forecast(3, { gfd: false }).every((x) => !('gfd' in x)), 'the table: with what Gambler’s Fever Dream would do, unless not asked');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
