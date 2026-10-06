// v2.8.1: Quick stats works with the game's real UpgradesById / AchievementsById (objects, not arrays)
import { boot, sleep, makeAssert } from '../harness/game.mjs';
const { assert, done } = makeAssert();
const g = boot();
const CA = g.window.CookieMgr;
await sleep(400);
g.Game.UpgradesOwned = 1;
g.Game.AchievementsOwned = 2;
CA.UI.Widgets.add('stats');
CA.UI.Widgets.tick();
const txt = g.window.document.querySelector('#CookieMgrWidgets .ca-w:not(.ca-w-bare) [data-w-body]').textContent;
assert(!/Couldn’t draw/.test(txt), `quick stats draws (${txt.slice(0, 80)})`);
assert(/Upgrades\s*1\s*\/ 2/.test(txt) && /Achievements\s*2\s*\/ 2/.test(txt), 'totals counted from the id-keyed objects with the game’s own rules');
assert(g.errors.length === 0, 'no runtime errors');
done();
process.exit();
