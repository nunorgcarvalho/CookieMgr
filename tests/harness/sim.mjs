// For the simulator's tests (tests/sim/): the game's scripts are downloaded on first use. Where that
// can't happen (offline, a blocked network) the test stops and says SKIPPED — the runner reports it
// as skipped, not passed. In CI (GitHub Actions sets CI=true) a skip is a failure: a gate that
// silently skips isn't one.
import { ensureGame } from '../../sim/game/fetch.mjs';

export function skipSim(why) {
  if (process.env.CI) {
    console.log(`FAIL: ${why} — in CI the simulator's tests must run`);
    process.exit(1);
  }
  console.log(`SKIPPED: ${why}`);
  process.exit(0);
}

export async function gameOrSkip() {
  try {
    await ensureGame({ quiet: true });
    return true;
  } catch (e) {
    skipSim(`the game's scripts couldn't be downloaded (${e.message})`);
  }
}
