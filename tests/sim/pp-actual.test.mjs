// Payback by actual income in the real game, on what CookieMgr's own Recorder recorded there
// (createSim({ record: true })): left alone, what you take in is your CpS — the payback periods are
// CpS's; clicking, it's more — by exactly what the game baked, and the periods shrink by that. The
// Recorder's frames are only read.
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 5, record: true });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
Game.cookies = 1e9;
Game.cookiesEarned = 1e9;
Game.buyMode = 1;
// a small economy, where a click is worth something next to the CpS
Game.Objects.Cursor.buy(10);
Game.Objects.Grandma.buy(3);
Game.cookies = 1e6;
sim.run({ seconds: 6 });
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ---- left alone: you take in your CpS
sim.run({ minutes: 7 });
const cps = Game.cookiesPs;
const a = CA.Payback.actualIncome(300);
assert(a && a.secs >= 290, `the Recorder has the last 5 minutes (${a && a.secs} s)`);
assert(near(a.actual, cps, 0.02), `left alone: actual income ${a.actual.toPrecision(5)}/s ≈ CpS ${cps.toPrecision(5)}/s`);
const best = CA.Payback.best('building');
const pa = CA.Payback.ppActual(best.pp);
assert(pa && near(pa.pp, best.pp, 0.02), `…so the payback period by actual income is CpS's (${pa && pa.pp.toPrecision(5)} vs ${best.pp.toPrecision(5)})`);

// ---- clicking: more — what the game baked
const framesBefore = CA.Recorder.frames().length;
const earned0 = Game.cookiesEarned;
const now = () => sim.game.ctx.Date.now();
const t0 = now();
// the game ignores clicks closer than 20 ms apart: one every 100 ms (three frames — run() moves in whole frames)
for (let i = 0; i < 3600; i++) {
  sim.act('click.bigCookie');
  sim.run({ ms: 100 });
}
const earned1 = Game.cookiesEarned;
const secs = (now() - t0) / 1000;
sim.run({ seconds: 6 }); // the memo's 5 s, on the game's clock
const c = CA.Payback.actualIncome(300);
const baked = (earned1 - earned0) / secs;
assert(c && c.actual > Game.cookiesPs * 1.05, `clicking 10 a second: you take in more than CpS (×${c && (c.actual / Game.cookiesPs).toFixed(3)})`);
assert(near(c.actual, baked, 0.05), `…what the game baked: ${c.actual.toPrecision(5)}/s vs ${baked.toPrecision(5)}/s over the ${secs.toFixed(0)} s of clicking`);
const best2 = CA.Payback.best('building');
const pc = CA.Payback.ppActual(best2.pp);
assert(pc && pc.pp < best2.pp && near(pc.pp, (best2.pp * Game.cookiesPs) / CA.Payback.actualIncome(pc.window).actual, 1e-9), `the period shrinks by it: ${best2.pp.toPrecision(5)} s → ${pc.pp.toPrecision(5)} s`);

// ---- only read
const n = CA.Recorder.frames().length;
const last = JSON.stringify(CA.Recorder.frames().at(-1));
for (let i = 0; i < 50; i++) CA.Payback.ppActual(100 * i);
assert(CA.Recorder.frames().length === n && JSON.stringify(CA.Recorder.frames().at(-1)) === last && n > framesBefore, 'the Recorder’s frames: untouched');

assert(sim.game.errors ? sim.game.errors.length === 0 : true, 'no errors in the game');
done();
process.exit();
