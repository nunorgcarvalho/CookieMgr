// The simulator's foundation: virtual time, the seeded random, the headless page — and the real
// game running in it, deterministically.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { makeClock } from '../../sim/game/clock.mjs';
import { makeRng } from '../../sim/game/rng.mjs';
import { makeDom } from '../../sim/game/dom.mjs';
import { bootGame } from '../../sim/game/boot.mjs';

const { assert, done } = makeAssert();

// ---- the clock: timers fire in time order, intervals repeat, Date follows it
{
  const c = makeClock(1000);
  const seen = [];
  c.setTimeout(() => seen.push('b@' + c.now), 20);
  c.setTimeout(() => seen.push('a@' + c.now), 10);
  const iv = c.setInterval(() => seen.push('i@' + c.now), 15);
  c.runUntil(1050);
  c.clearInterval(iv);
  c.runUntil(2000);
  assert(seen.join() === 'a@1010,i@1015,b@1020,i@1030,i@1045', `timers in order, intervals repeat (${seen})`);
  assert(c.now === 2000 && c.Date.now() === 2000 && new c.Date().getTime() === 2000 && new c.Date(5).getTime() === 5, 'Date is the clock (and a real Date otherwise)');
  const c2 = makeClock(0);
  c2.setTimeout(() => {
    throw new Error('boom');
  }, 1);
  const err = console.error;
  console.error = () => {};
  c2.runUntil(5);
  console.error = err;
  assert(c2.errors.length === 1 && c2.now === 5, 'a timer that throws is kept, not fatal');
}

// ---- the random: seeded, in [0, 1), different per seed
{
  const a = makeRng(42);
  const b = makeRng(42);
  const c = makeRng(43);
  const xs = Array.from({ length: 1000 }, () => a());
  assert(xs.every((x, i) => x === b() && x >= 0 && x < 1), 'same seed, same numbers, in [0, 1)');
  assert(xs.slice(0, 5).some((x) => x !== c()), 'another seed, other numbers');
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  assert(Math.abs(mean - 0.5) < 0.05, `about uniform (mean ${mean.toFixed(3)})`);
}

// ---- the page: elements take anything; added scripts run
{
  let ran = null;
  const { document } = makeDom({ onScript: (src) => ((ran = src), true) });
  const el = document.getElementById('x');
  el.style.width = '10px';
  el.innerHTML += 'hi';
  el.foo.bar.baz = 3;
  assert(document.getElementById('x') === el && el.style.width === '10px' && el.foo.bar.baz === 3 && `${el.nope}` === '' && +el.nope === 0, 'elements keep what is set on them; anything else is a harmless sink');
  assert(el.childNodes[4] && typeof el.childNodes[4].setAttribute === 'function', 'children that aren’t there are blank elements');
  let loaded = false;
  const s = document.createElement('script');
  s.onload = () => (loaded = true);
  s.setAttribute('src', 'minigameGarden.js?r=1');
  document.head.appendChild(s);
  assert(ran === 'minigameGarden.js?r=1' && loaded, 'a script added to the page runs, then its onload');
  assert(document.getElementById('minigameScript-2') === null, 'a script tag that was never added isn’t there');
}

await gameOrSkip();

// ---- the real game, headless
const g = await bootGame({ seed: 5 });
const G = g.Game;
assert(String(G.version) === g.version && Object.keys(G.Objects).length >= 20 && G.UpgradesN > 700, `the real game booted (v${G.version}: ${Object.keys(G.Objects).length} buildings, ${G.UpgradesN} upgrades)`);
assert(G.fps === 30 && G.cookies === 0, 'a new game, at the game’s own 30 fps');
G.cookies = 1000;
G.Objects.Cursor.buy(5);
G.Objects.Grandma.buy(3);
g.frame(); // the CpS is recomputed on the next logic frame
const bank = G.cookies;
for (let i = 0; i < 30 * 60; i++) g.frame();
assert(G.Objects.Cursor.amount === 5 && G.Objects.Grandma.amount === 3 && G.cookiesPs > 0, `buildings bought with the game’s own buy() (CpS ${G.cookiesPs})`);
const gain = G.cookies - bank;
assert(Math.abs(gain - G.cookiesPs * 60) / (G.cookiesPs * 60) < 0.02, `a minute of simulated time bakes a minute of CpS (${gain.toFixed(1)} vs ${(G.cookiesPs * 60).toFixed(1)})`);
// clicks: the game's own rule — closer than 20 ms are ignored
const before = G.cookieClicks;
G.ClickCookie();
G.ClickCookie();
g.clock.runUntil(g.clock.now + 25);
G.ClickCookie();
assert(G.cookieClicks - before === 2, `clicks 20 ms apart count, closer ones don't (${G.cookieClicks - before})`);
// the store unlocks buildings as the game does while drawing
assert(G.Objects.Cursor.locked === 0 && G.Objects['Wizard tower'].locked === 1, 'the store unlocks what you’ve baked enough for');

// ---- deterministic: the same seed and the same actions, the same game
async function play(seed) {
  const x = await bootGame({ seed });
  x.Game.cookies = 1e4;
  const spawned = [];
  for (let f = 0; f < 30 * 900; f++) {
    x.frame();
    for (const s of x.Game.shimmers)
      if (!s.popped) {
        spawned.push(x.Game.T);
        s.pop();
      }
  }
  return { cookies: x.Game.cookies, golden: x.Game.goldenClicks, spawned };
}
const [p1, p2, p3] = [await play(9), await play(9), await play(10)];
assert(JSON.stringify(p1) === JSON.stringify(p2), `same seed, same game (${JSON.stringify(p1)})`);
assert(p1.spawned.length && p1.spawned.join() !== p3.spawned.join(), `another seed, another game (golden cookies at frames ${p1.spawned} vs ${p3.spawned})`);

// ---- a save loads as an import does
const save = G.WriteSave(1);
const g2 = await bootGame({ seed: 1, save });
assert(g2.Game.Objects.Cursor.amount === 5 && g2.Game.Objects.Grandma.amount === 3 && Math.abs(g2.Game.cookiesEarned - G.cookiesEarned) < 1, 'an exported save loads into a new simulation');

assert(g.clock.errors.length === 0, `no errors in the page's timers${g.clock.errors.length ? ': ' + g.clock.errors[0] : ''}`);
done();
process.exit();
