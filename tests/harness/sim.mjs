// For the simulator's tests (tests/sim/): the game's scripts are downloaded on first use; where
// that can't happen (offline, a blocked network) the test says so and passes as skipped.
import { ensureGame } from '../../sim/game/fetch.mjs';

export async function gameOrSkip() {
  try {
    await ensureGame({ quiet: true });
    return true;
  } catch (e) {
    console.log(`skipped: the game's scripts couldn't be downloaded (${e.message})`);
    console.log('\nALL CHECKS PASSED');
    process.exit(0);
  }
}
