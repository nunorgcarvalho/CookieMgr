// CookieMgr's statistics (goldenMath, wrinklers, payback's next achievement, prestige) against Cookie
// Monster's, in the real game with Cookie Monster loaded: Lucky! / Lucky! in a Frenzy (bank and
// payout), Conjure Baked Goods, cookie chains, wrinkler rewards, buildings to the next achievement —
// in a plain state, in a Frenzy, with the Golden switch on, with wrinklers. Where CookieMgr follows
// the game and Cookie Monster doesn't, the difference is checked to be exactly that:
// Spontaneous Edifice (the game needs half the price in the bank; Cookie Monster asks for twice it),
// the Dragon Guts aura on wrinklers (Cookie Monster leaves it out).
import { makeAssert } from '../harness/game.mjs';
import { simWithCookieMonster, settle } from '../harness/cmSim.mjs';

const { assert, done } = makeAssert();
const sim = await simWithCookieMonster({ seed: 11 }); // v3.7.2: waits for Cookie Monster's numbers; skips if it can't be downloaded
const { Game, CA } = sim;
const W = sim.game.ctx;
sim.run({ seconds: 3 });
const close = (a, b, tol = 1e-6) => (a === b ? true : Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)));
const fmt = (x) => (typeof x === 'number' ? x.toPrecision(6) : JSON.stringify(x));

// a mid game, with upgrades that touch golden cookies
Game.cookies = 1e20;
Game.cookiesEarned = 1e20;
Game.buyMode = 1;
Object.values(Game.Objects).slice(0, 12).forEach((o, i) => o.buy(60 - i * 4));
sim.run({ seconds: 6 });
Game.UpgradesInStore.slice(0, 60).forEach((x) => x.pool !== 'toggle' && x.pool !== 'tech' && x.buy(1));
['Lucky day', 'Serendipity', 'Get lucky', 'Green yeast digestives'].forEach((n) => Game.Upgrades[n] && (Game.Upgrades[n].bought = 1));
Game.cookies = 3e13;

function compare(label) {
  // v3.7.2: given up to three refreshes (settle) — Cookie Monster refreshes on its own schedule
  const bad = settle(sim, differences);
  assert(!bad.length, `${label}: Lucky, Conjure, chains, wrinklers, next achievements match Cookie Monster${bad.length ? ` — ${bad.length} differ: ${bad.slice(0, 6).join('; ')}` : ''}`);
}
function differences() {
  const C = W.CookieMonsterData.Cache;
  const G = CA.GoldenMath;
  const bad = [];
  const check = (name, mine, theirs, tol) => !close(mine, theirs, tol) && bad.push(`${name} ${fmt(mine)} vs CM ${fmt(theirs)}`);
  check('Lucky bank', G.lucky().bank, C.Lucky);
  check('Lucky reward', G.lucky().reward, C.LuckyReward);
  check('Lucky wrath reward', G.lucky().wrathReward, C.LuckyWrathReward);
  check('Lucky (Frenzy) bank', G.lucky(true).bank, C.LuckyFrenzy);
  check('Lucky (Frenzy) reward', G.lucky(true).reward, C.LuckyRewardFrenzy);
  check('Conjure bank', G.conjure().bank, C.Conjure);
  check('Conjure reward', G.conjure().reward, C.ConjureReward);
  check('chain total', G.chain().total, C.ChainMaxReward[0]);
  check('chain bank', G.chain().bank, C.ChainRequired);
  check('wrath chain total', G.chain(true).total, C.ChainWrathMaxReward[0]);
  check('Frenzy chain bank', G.chain(false, true).bank, C.ChainFrenzyRequired);
  const ed = G.edifice();
  if (C.Edifice > 0) check('Edifice (game ÷ CM = 1/4)', ed.bank * 4, C.Edifice);
  const s = CA.Wrinklers.summary();
  check('wrinklers total', s.total, C.WrinklersTotal);
  check('wrinklers normal', s.normal, C.WrinklersNormal);
  check('fattest wrinkler', s.fattest ? s.fattest.reward : 0, C.WrinklersFattest[0]);
  const next = C.ObjectsNextAchievement || {};
  Object.keys(next).forEach((n) => check(`${n} to next achievement`, CA.Payback.nextAchievement(n).n, next[n].AmountNeeded, 0));
  return bad;
}

compare('mid game');

// ---- a Frenzy: Cookie Monster (and CookieMgr) take the buff out
Game.gainBuff('frenzy', 77, 7);
compare('in a Frenzy');
Object.values(Game.buffs).forEach((b) => (b.time = 0));
sim.run({ seconds: 1 });

// ---- wrinklers (one shiny), with Wrinklerspawn
Game.elderWrath = 1;
Game.Upgrades.Wrinklerspawn.bought = 1;
Game.wrinklers.slice(0, 5).forEach((w, i) => {
  w.phase = 2;
  w.hp = 3;
  w.sucked = 1e9 * (i + 1);
  w.type = i === 2 ? 1 : 0;
});
compare('with wrinklers');
// the Dragon Guts aura: the game pays 20% more, Cookie Monster doesn't know
const guts = Game.dragonAurasBN['Dragon Guts'];
if (guts) {
  const before = CA.Wrinklers.summary().total;
  const was = Game.dragonAura;
  Game.dragonLevel = Math.max(Game.dragonLevel, guts.id + 4);
  Game.dragonAura = guts.id;
  assert(close(CA.Wrinklers.summary().total, before * 1.2), 'Dragon Guts: wrinklers give 20% more, as the game pays it');
  Game.dragonAura = was;
}

// ---- the Golden switch on: golden cookie figures as if it were off
Game.Upgrades['Golden switch'].unlocked = 1;
Game.Upgrades['Golden switch [off]'].bought = 1;
Game.recalculateGains = 1;
compare('Golden switch on');

assert(sim.game.errors ? sim.game.errors.length === 0 : true, 'no errors in the game');
done();
process.exit();
