// The Grimoire's refill time: CookieMgr's closed form against the game's own formula, simulated
// frame by frame (minigameGrimoire.js: magic += max(0.002, (magic / max(M, 100)) ^ 0.5) × 0.002, 30 fps).
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({});
await sleep(300);
const G = g.window.CookieMgr.Grimoire;

function simulate(magic, max, target) {
  if (magic >= target) return 0;
  if (target > max) return Infinity;
  let s = 0;
  while (magic < target && s < 86400) {
    for (let f = 0; f < 30 && magic < target; f++) magic += Math.max(0.002, Math.pow(magic / Math.max(max, 100), 0.5)) * 0.002;
    s++;
  }
  return magic >= target ? s : Infinity;
}

const CASES = [
  [5, 100, 70],
  [0, 100, 10],
  [0, 50, 40],
  [79.9, 80, 80],
  [1, 300, 290],
  [150, 400, 160],
  [0.0001, 1000, 1],
  [20, 100, 20],
  [20, 100, 150],
];
CASES.forEach(([m, max, t]) => {
  const want = simulate(m, max, t);
  const got = G.refillSeconds(m, max, t);
  const ok = want === got || (Number.isFinite(want) && Math.abs(got - want) <= Math.max(1, want * 0.002));
  assert(ok, `magic ${m} of ${max} → ${t}: ${got}s (the game: ${want}s)`);
});

// and it's quick: every spell, every half second, on the Grimoire page and widgets
const t0 = Date.now();
for (let i = 0; i < 2000; i++) G.refillSeconds(0, 1000, 999);
assert(Date.now() - t0 < 50, `2000 estimates in ${Date.now() - t0} ms`);

done();
process.exit();
