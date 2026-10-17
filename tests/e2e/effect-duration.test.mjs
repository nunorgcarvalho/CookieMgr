// How long a golden cookie's effect lasts with your upgrades (renamed vX.Y.Z.test.mjs when it lands):
// CA.Timers.effectDuration and the word golden.effectDuration — ceil(base × the game's effectDurMod).
// (Against the durations the real game grants: tests/sim/effect-duration.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const T = CA.Timers;
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);

const owned = new Set();
Game.Has = (n) => owned.has(n);
Game.auraMult = () => 0;
Game.eff = () => 1;
Game.hasGod = () => false;

assert(T.effectDuration('frenzy') === 77 && T.effectDuration('building special') === 30 && T.effectDuration('click frenzy') === 13 && T.effectDuration('dragonflight') === 10 && T.effectDuration('clot') === 66, 'no upgrades: Frenzy 77 s, a building special 30 s, Click frenzy 13 s, Dragonflight 10 s, Clot 66 s');
owned.add('Get lucky');
assert(T.effectDuration('frenzy') === 154 && T.effectDuration('click frenzy') === 26, 'Get lucky: twice as long');
['Lasting fortune', 'Lucky digit', 'Lucky number', 'Lucky payout', 'Green yeast digestives'].forEach((n) => owned.add(n));
assert(T.effectDuration('frenzy') === Math.ceil(77 * 2 * 1.1 * 1.01 ** 4), `all of them: ${T.effectDuration('frenzy')} s (rounded up, as the game does)`);
Game.hasGod = (god) => (god === 'decadence' ? 1 : false);
assert(T.effectDuration('frenzy') === Math.ceil(77 * 2 * 1.1 * 1.01 ** 4 * 1.07), 'Vomitrax in the diamond slot: ×1.07');
Game.eff = (k) => (k === 'wrathCookieEffDur' ? 0.5 : 1);
assert(T.effectDuration('clot') === Math.ceil(66 * 2 * 1.1 * 1.01 ** 4 * 1.07 * 0.5) && T.effectDuration('frenzy', true) < T.effectDuration('frenzy'), 'a wrath cookie’s: its own effect-duration multiplier');
assert(V('golden.effectDuration', 'Click Frenzy') === T.effectDuration('click frenzy') && V('golden.effectDuration', 'elder frenzy') === T.effectDuration('blood frenzy') && Number.isNaN(V('golden.effectDuration', 'lucky')), 'the word: by name, any case; NaN for an effect that doesn’t last (Lucky)');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
