// Release B of the in-house Cookie Monster (renamed vX.Y.Z.test.mjs when it lands): the statistics
// back end. Cookie Monster's own numbers are matched in the real game (tests/sim/stats-parity,
// tests/sim/whatif); here, what has no Cookie Monster counterpart or needs no game: the golden cookie
// spawn odds (against the game's per-frame rule, played out), buffs, the sugar lump, autosave,
// what's missing, the garden's paying plants, prestige targets, and every new word registered.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const V = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

// ---- golden cookie spawn odds: exact, against the rule played out (main.js updateShimmers)
Game.fps = 30;
const golden = { time: 0, minTime: 30 * 60 * 5, maxTime: 30 * 60 * 15, spawned: 0, n: 0, spawnConditions: () => true };
Game.shimmerTypes.golden = Object.assign(Game.shimmerTypes.golden || {}, golden);
const G = Game.shimmerTypes.golden;
/** Frames until a spawn from `time`, as the game rolls it. */
function play(time) {
  let t = time;
  for (;;) {
    t++;
    if (Math.random() < Math.pow(Math.max(0, (t - G.minTime) / (G.maxTime - G.minTime)), 5)) return t - time;
  }
}
for (const start of [0, 30 * 60 * 8, 30 * 60 * 12]) {
  G.time = start;
  const s = CA.Timers.spawnOf('golden');
  const N = start ? 40000 : 4000; // short waits: cheap to play out many times
  const runs = Array.from({ length: N }, () => play(start) / 30).sort((a, b) => a - b);
  const mean = runs.reduce((a, b) => a + b, 0) / N;
  const within = (secs) => runs.filter((x) => x <= secs).length / N;
  const at = s.soonest + (s.median - s.soonest) * 0.8; // where the odds are still open
  assert(
    Math.abs(s.expected - mean) / mean < 0.03 && Math.abs(s.median - runs[N >> 1]) / runs[N >> 1] < 0.04 && Math.abs(s.within(at) - within(at)) < 0.03,
    `spawn from ${start / 30}s in: expected ${s.expected.toFixed(1)}s (played ${mean.toFixed(1)}), median ${s.median.toFixed(1)} (${runs[N >> 1].toFixed(1)}), within ${at.toFixed(0)}s ${s.within(at).toFixed(3)} (${within(at).toFixed(3)})`
  );
  assert(Math.abs(s.soonest - Math.max(0, G.minTime - start) / 30) < 1e-9 && Math.abs(s.latest - (G.maxTime - start) / 30) < 1e-9, 'soonest / latest: minTime and maxTime from now');
}
G.time = 0;
assert(Math.abs(V('golden.expected') - CA.Timers.spawnOf('golden').expected) < 1e-9 && V('golden.chanceWithin', 60) === 0, 'golden.expected, golden.chanceWithin (none before minTime)');
G.spawned = 1;
assert(CA.Timers.spawnOf('golden').spawned && V('golden.soonest') === 0, 'one on screen: now');
G.spawned = 0;
G.spawnConditions = () => false;
assert(CA.Timers.spawnOf('golden') === null, 'no timer running (the Golden switch): none');
G.spawnConditions = () => true;

// ---- buffs, the sugar lump, autosave
Game.buffs = { Frenzy: { name: 'Frenzy', time: 30 * 40, maxTime: 30 * 77, multCpS: 7 } };
assert(CA.Timers.buffs()[0].secs === 40 && CA.Timers.buffs()[0].cps === 7 && V('buff.timeLeft', 'frenzy') === 40 && V('buff.timeLeft', 'Clot') === 0, 'buffs: seconds left, multipliers');
Game.buffs = {};
const hour = 3600 * 1000;
Object.assign(Game, { lumpT: Date.now() - 21 * hour, lumpMatureAge: 20 * hour, lumpRipeAge: 23 * hour, lumpOverripeAge: 24 * hour, lumpCurrentType: 2 });
const L = CA.Timers.lump();
assert(L.type === 'golden' && L.matureIn === 0 && Math.abs(L.ripeIn - 7200) < 2 && Math.abs(L.fallsIn - 10800) < 2 && Math.abs(V('lump.ripeIn') - 7200) < 2, `the sugar lump: golden, mature, ripe in 2 h (${L.ripeIn})`);
Game.prefs = Object.assign(Game.prefs || {}, { autosave: 1 });
Game.T = 30 * 45;
assert(CA.Timers.autosave() === 15, 'autosave: 15 s to go');

// ---- what's missing
Game.Upgrades = {
  'Plastic mouse': { name: 'Plastic mouse', bought: 0, pool: '', order: 2 },
  'Chocolate chip cookie': { name: 'Chocolate chip cookie', bought: 0, pool: 'cookie', order: 3 },
  'Heavenly chip secret': { name: 'Heavenly chip secret', bought: 1, pool: 'prestige', order: 4 },
  'Golden switch [off]': { name: 'Golden switch [off]', bought: 0, pool: 'toggle', order: 5 },
  'Reinforced index finger': { name: 'Reinforced index finger', bought: 0, pool: '', order: 1 },
};
const mu = CA.Collection.missingUpgrades();
assert(mu.regular.join() === 'Reinforced index finger,Plastic mouse' && mu.cookie.join() === 'Chocolate chip cookie' && !mu.prestige.length && V('missing.upgrades') === 3, 'missing upgrades: by kind, in the game’s order, switches left out');
Game.Achievements = { A: { name: 'A', won: 0, pool: 'normal', order: 1 }, B: { name: 'B', won: 1, pool: 'normal', order: 2 }, S: { name: 'S', won: 0, pool: 'shadow', order: 3 } };
assert(CA.Collection.missingAchievements().join() === 'A' && V('missing.achievements') === 1, 'missing achievements: not shadow ones');
Game.halloweenDrops = ['Skull cookies', 'Ghost cookies'];
Game.Has = (n) => n === 'Ghost cookies';
assert(CA.Collection.missingSeasonDrops().halloween.join() === 'Skull cookies' && V('missing.seasonDrops', 'halloween') === 1, 'a season’s missing drops');
assert(CA.Collection.missingPlantDrops().length === 7, 'the garden’s rare drops');
Game.Has = () => false;

// ---- the garden's paying plants; prestige targets
Game.cookiesPs = 1e6;
const qb = CA.GoldenMath.plant('queenbeet');
assert(qb.reward === 1e6 * 3600 && qb.bank === (1e6 * 3600) / 0.04 && V('bank.plant', 'duketater') === (1e6 * 7200) / 0.08 && CA.GoldenMath.plant('bakerWheat') === null, 'plants: the bank for their most (Queenbeet 4% / 1 h, Duketater 8% / 2 h)');
Game.cookiesReset = 1e15; // level 10
Game.cookiesEarned = 7e15; // 20 if ascended now
Game.HowMuchPrestige = (c) => Math.cbrt(c / 1e12);
Game.HowManyCookiesReset = (l) => Math.pow(l, 3) * 1e12;
assert(CA.Prestige.gain() === 10 && CA.Prestige.total() === 20 && Math.abs(CA.Prestige.toNext() - (21 ** 3 * 1e12 - 8e15)) < 1, 'prestige: levels if ascended now, cookies to the next');
assert(CA.Prestige.nextEnding(7) === 27 && CA.Prestige.nextEnding(777) === 777 && CA.Prestige.lucky().map((x) => x.level).join() === '27,777,777777', 'the Lucky digit / number / payout levels');

// ---- every new word
['bank.lucky', 'bank.luckyFrenzy', 'bank.conjure', 'bank.chain', 'bank.chainFrenzy', 'bank.edifice', 'bank.plant', 'reward.lucky', 'reward.luckyFrenzy', 'reward.chain', 'reward.conjure', 'wrinkler.reward', 'wrinklers.reward', 'wrinklers.rewardFattest', 'wrinklers.eating', 'prestige.ifAscended', 'prestige.toNext', 'prestige.perSecond', 'prestige.cpsGain', 'prestige.cookiesFor', 'prestige.secondsTo', 'golden.soonest', 'golden.latest', 'golden.expected', 'golden.chanceWithin', 'reindeer.expected', 'buff.timeLeft', 'lump.ripeIn', 'autosave.in', 'magic.fullIn', 'missing.upgrades', 'missing.achievements', 'missing.seasonDrops', 'missing.plantDrops', 'pantheon.cpsGain', 'dragon.auraCpsGain'].forEach((id) =>
  assert(CA.Script.isValue(id) && CA.Script.library().some((x) => x.id === id), `${id}: a word, in the library`)
);
const { errors } = CA.Script.compile('if cookies() < bank.lucky() and golden.chanceWithin(60) > 0.5:\n  log "save up"\n');
assert(!errors.length, 'they compile in code');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
