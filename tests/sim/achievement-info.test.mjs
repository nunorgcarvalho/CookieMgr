// Achievement info cards in the real game: every achievement that counts something is matched to its
// count (features/achievementInfo.js reads main.js's own lists) — the card the Stats page's "Still to
// collect" shows on hover says where you stand, what the buildings cost, how long the
// cookies take, and the milk it adds (the card itself: tests/e2e/achievement-info-cards.test.mjs).
import { makeAssert } from '../harness/game.mjs';
import { gameOrSkip } from '../harness/sim.mjs';
import { createSim } from '../../sim/sim.mjs';

const { assert, done } = makeAssert();
await gameOrSkip();

const sim = await createSim({ seed: 3 });
const { Game, CA } = sim;
sim.run({ seconds: 2 });
Game.cookies = 1e6;
Game.cookiesEarned = 2e6;
Game.Objects.Farm.buy(30);
sim.run({ seconds: 2 });
const AI = CA.AchievementInfo;

// every name the lists know is a real achievement (a typo would leave its card without progress)
const all = Object.values(Game.Achievements);
const counted = all.filter((a) => AI.progress(a).length);
const named = ['Clicktastic', "What's not clicking", 'Sacrifice', 'No more room in hell', 'Seven horseshoes', 'Moistburster', 'Endless cycle', "Year's worth of cavities", 'Veteran', 'Jellicles', 'All the stars in heaven', 'The elder scrolls', 'Polymath', 'Myriad', 'Kaizen', 'Septcentennial', 'A round of applause', 'Tabloid addiction', 'Hide & seek champion'];
named.forEach((n) => assert(Game.Achievements[n] && AI.progress(n).length, `${n}: a counting achievement`));
// every building's count, production and level achievements, and the cookies/CpS thresholds
const want = new Set([...Game.BankAchievements, ...Game.CpsAchievements]);
Object.values(Game.Objects).forEach((b) => {
  Object.values(b.tieredAchievs).forEach((a) => want.add(a));
  b.productionAchievs.forEach((p) => want.add(p.achiev));
  if (b.levelAchiev10) want.add(b.levelAchiev10);
});
const missed = [...want].filter((a) => !AI.progress(a).length).map((a) => a.name);
assert(missed.length === 0, `every threshold, building and level achievement counts (missed: ${missed.slice(0, 5).join(', ')})`);
assert(counted.length > 250, `${counted.length} of ${all.length} achievements count something`);

// where you stand, in the game's own numbers: 30 of 50 farms (Farm is the building to buy); cookies baked
// this ascension and the CpS that bakes them
const farm50 = Object.values(Game.Objects.Farm.tieredAchievs).find((a) => Game.Tiers[a.tier].achievUnlock === 50);
const [f] = AI.progress(farm50);
assert(f.what === 'farms' && f.have === 30 && f.need === 50 && f.b === Game.Objects.Farm, `${farm50.name}: ${f.what} ${f.have} of ${f.need}`);
const bank = Game.BankAchievements.find((a) => !a.won && a.threshold > Game.cookiesEarned);
const [k] = AI.progress(bank);
assert(k.have === Game.cookiesEarned && k.need === bank.threshold && k.rate === Game.cookiesPs && k.rate > 0, `${bank.name}: ${k.have} of ${k.need} at ${k.rate}/s`);
const prod = Game.Objects.Farm.productionAchievs[0];
const [p] = AI.progress(prod.achiev);
assert(p.need === prod.pow && p.have === Game.Objects.Farm.totalCookies && p.rate > 0, `${prod.achiev.name}: made by farms ${p.have} of ${p.need}`);
const won = all.find((a) => a.won);
assert(won && AI.status(won) === 'won' && AI.status(bank) === 'missing', `status: won (${won && won.name}) / missing`);

done();
