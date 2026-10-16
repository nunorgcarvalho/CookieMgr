// The spawn distribution (features/timers.js) against the real game's spawning: in the simulated
// game, the game's own Game.updateShimmers() is run frame by frame from a timer state until a
// golden cookie (or reindeer) appears — thousands of times, seeded — and the waits' empirical CDF is
// compared with CookieMgr's (Kolmogorov–Smirnov distance), and the mean and the chance within a
// minute too. In four states: a fresh cycle, one sped up by Lucky day + Serendipity, one part-way
// through (the conditional distribution), and a reindeer's.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 21 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
const fps = Game.fps;

/** Frames until a `type` appears from { time, minTime, maxTime }, by the game's own updateShimmers. */
function play(type, state) {
  const me = Game.shimmerTypes[type];
  Object.assign(me, state, { spawned: 0 });
  let n = 0;
  while (!me.spawned && n < 1e7) {
    Game.updateShimmers();
    n++;
  }
  Game.killShimmers(); // clears the one that came (and resets the timers — the next run sets its own)
  return n;
}

function check(label, type, state, N, setup) {
  if (setup) setup();
  const dist = CA.Timers.waitFrom(state);
  const waits = Array.from({ length: N }, () => play(type, state) / fps).sort((a, b) => a - b);
  // Kolmogorov–Smirnov: the largest gap between the empirical CDF and ours
  let ks = 0;
  waits.forEach((x, i) => {
    const F = dist.within(x);
    ks = Math.max(ks, Math.abs((i + 1) / N - F), Math.abs(i / N - F));
  });
  const crit = 1.63 / Math.sqrt(N); // 1% level
  const mean = waits.reduce((a, b) => a + b, 0) / N;
  const sd = Math.sqrt(waits.reduce((a, b) => a + (b - mean) ** 2, 0) / N);
  const in60 = waits.filter((x) => x <= 60).length / N;
  assert(ks < crit, `${label}: the game's waits follow CookieMgr's distribution (KS ${ks.toFixed(4)} < ${crit.toFixed(4)}, ${N} runs)`);
  assert(Math.abs(mean - dist.mean) < (4 * sd) / Math.sqrt(N), `${label}: mean ${mean.toFixed(2)} s played, ${dist.mean.toFixed(2)} s predicted`);
  assert(Math.abs(in60 - dist.within(60)) < 4 * Math.sqrt(Math.max(1e-4, dist.within(60) * (1 - dist.within(60))) / N) + 1 / N, `${label}: within a minute ${(in60 * 100).toFixed(1)}% played, ${(dist.within(60) * 100).toFixed(1)}% predicted`);
}

// golden cookies are spawned only without the Golden switch; reindeer only at Christmas
Game.Upgrades['Golden switch [off]'].bought = 0;
const g = Game.shimmerTypes.golden;
check('a fresh cycle (5–15 min)', 'golden', { time: 0, minTime: 5 * 60 * fps, maxTime: 15 * 60 * fps }, 600);
check('Lucky day + Serendipity (1.25–3.75 min)', 'golden', { time: 0, minTime: Math.ceil(1.25 * 60 * fps), maxTime: Math.ceil(3.75 * 60 * fps) }, 2500);
check('part-way (9 min into a 5–15)', 'golden', { time: 9 * 60 * fps, minTime: 5 * 60 * fps, maxTime: 15 * 60 * fps }, 3000);
Game.season = 'christmas';
check('a reindeer (3–6 min)', 'reindeer', { time: 0, minTime: 3 * 60 * fps, maxTime: 6 * 60 * fps }, 1200);
Game.season = '';

// ---- the bounds of the next cycle: CookieMgr's factors give the game's getMinTime / getMaxTime
for (const ups of [[], ['Lucky day'], ['Lucky day', 'Serendipity', 'Heavenly luck', 'Golden goose egg', 'Green yeast digestives']]) {
  Object.values(Game.Upgrades).forEach((u) => ['Lucky day', 'Serendipity', 'Heavenly luck', 'Golden goose egg', 'Green yeast digestives'].includes(u.name) && (u.bought = 0));
  ups.forEach((n) => (Game.Upgrades[n].bought = 1));
  const d = CA.Timers.distribution('golden');
  const fake = { wrath: 0 };
  assert(Math.abs(d.next.min * fps - g.getMinTime(fake)) < 1e-9 && Math.abs(d.next.max * fps - g.getMaxTime(fake)) < 1e-9, `next cycle with ${ups.join(', ') || 'nothing'}: ${d.next.min}–${d.next.max} s, as the game sets it`);
}

assert(sim.game.errors ? sim.game.errors.length === 0 : true, 'no errors in the game');
done();
process.exit();
