// How long a golden cookie's effect lasts (CA.Timers.effectDuration) against the game itself: for each
// effect, from golden and wrath cookies, a cookie forced to it is popped and the effect the game grants is
// timed — with no upgrades, then with the duration upgrades (Get lucky, Lasting fortune, the Lucky ones,
// Green yeast digestives), the Epoch Manipulator aura, and Vomitrax in each Pantheon slot.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 31 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
Game.cookies = 1e15;
Game.cookiesEarned = 1e15;
Game.buyMode = 1;
Object.values(Game.Objects).forEach((o) => o.buy(20));
Game.Objects.Temple.level = Math.max(1, Game.Objects.Temple.level);
Game.LoadMinigames && Game.LoadMinigames();
sim.run({ seconds: 3 });
const T = Game.Objects.Temple.minigame;
const fps = Game.fps;

const clear = () => {
  Object.values(Game.buffs).forEach((b) => (b.time = 0));
  Game.shimmers.slice().forEach((s) => s.die && s.die());
  sim.run({ ms: 100 });
};
/** Pop a cookie forced to `type`; the seconds the effect it starts lasts (the newest buff's maxTime). */
function granted(type, wrath) {
  clear();
  const before = new Set(Object.keys(Game.buffs));
  const s = new Game.shimmer('golden', wrath ? { wrath: true, type } : { noWrath: true, type });
  s.pop();
  const name = Object.keys(Game.buffs).find((k) => !before.has(k));
  return name ? Game.buffs[name].maxTime / fps : NaN;
}
const CASES = [
  ['frenzy', false],
  ['building special', false],
  ['click frenzy', false],
  ['dragonflight', false],
  ['dragon harvest', false],
  ['everything must go', false],
  ['blood frenzy', true],
  ['clot', true],
  ['cursed finger', true],
  ['frenzy', true],
  ['building special', true],
];
const wrong = [];
let checked = 0;
function check(label) {
  CASES.forEach(([type, wrath]) => {
    const want = CA.Timers.effectDuration(type, wrath);
    const got = granted(type, wrath);
    checked++;
    if (want !== got) wrong.push(`${label}, ${type}${wrath ? ' (wrath)' : ''}: ${want} vs the game's ${got}`);
  });
}
const set = (names, on) => names.forEach((n) => Game.Upgrades[n] && (Game.Upgrades[n].bought = on ? 1 : 0));

check('no upgrades');
set(['Get lucky'], true);
check('Get lucky');
set(['Lasting fortune', 'Lucky digit', 'Lucky number', 'Lucky payout', 'Green yeast digestives'], true);
check('every duration upgrade');
const epoch = Game.dragonAurasBN && Game.dragonAurasBN['Epoch Manipulator'];
if (epoch) {
  Game.dragonLevel = Math.max(Game.dragonLevel, epoch.id + 4);
  Game.dragonAura = epoch.id;
  check('Epoch Manipulator');
  Game.dragonAura = 0;
}
if (T && T.gods && T.gods.decadence) {
  [0, 1, 2].forEach((slot) => {
    T.slotGod(T.gods.decadence, slot);
    check(`Vomitrax in slot ${slot}`);
  });
  T.slotGod(T.gods.decadence, -1);
}
set(['Get lucky'], false);
check('without Get lucky');
assert(!wrong.length && checked >= 60, `${checked} effects timed, ${checked - wrong.length} as the game grants them${wrong.length ? ` — ${wrong.slice(0, 4).join('; ')}` : ''}`);

// the word, and the names it knows
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
assert(V('golden.effectDuration', 'Frenzy') === CA.Timers.effectDuration('frenzy') && V('golden.effectDuration', 'elder frenzy') === CA.Timers.effectDuration('blood frenzy') && Number.isNaN(V('golden.effectDuration', 'nonsense')), 'golden.effectDuration: by name (any case, the game’s or ours); NaN for others');

done();
process.exit();
