// For the parity tests (tests/sim/*-parity): the real game with Cookie Monster loaded, ready to compare.
//
//   simWithCookieMonster(opts)   createSim({ cookieMonster: true }) — skipped (SKIPPED; a failure in CI) when the
//                                game's or Cookie Monster's scripts can't be downloaded; resolves once
//                                Cookie Monster's numbers cover every building
//   settle(sim, check)           lets the game award what it has pending and Cookie Monster refresh
//                                (6 s of game), then runs check() → [differences]; if any, gives them up
//                                to two more refreshes before reporting — Cookie Monster refreshes on its
//                                own schedule, and a parity check shouldn't fail on that
import { ensureGame, ensureMod } from '../../sim/game/fetch.mjs';
import { createSim } from '../../sim/sim.mjs';
import { skipSim as skip } from './sim.mjs';

export async function simWithCookieMonster(opts = {}) {
  try {
    await ensureGame({ quiet: true });
  } catch (e) {
    skip(`the game's scripts couldn't be downloaded (${e.message})`);
  }
  try {
    await ensureMod('CookieMonster.js', { quiet: true });
  } catch (e) {
    skip(`Cookie Monster couldn't be downloaded (${e.message})`);
  }
  const sim = await createSim({ ...opts, cookieMonster: true });
  const W = sim.game.ctx;
  const ready = () => {
    const D = W.CookieMonsterData;
    return !!(sim.Game.mods.CookieMonster && D && D.Objects1 && Object.keys(sim.Game.Objects).every((n) => D.Objects1[n]));
  };
  for (let i = 0; i < 30 && !ready(); i++) sim.run({ seconds: 1 });
  if (!ready()) throw new Error('Cookie Monster loaded but its numbers never came (30 s of game)');
  return sim;
}

export function settle(sim, check, tries = 3) {
  let bad = [];
  for (let i = 0; i < tries; i++) {
    sim.Game.recalculateGains = 1;
    sim.run({ seconds: 6 });
    bad = check();
    if (!bad.length) return bad;
  }
  return bad;
}
