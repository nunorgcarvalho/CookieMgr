// The minigames' and the Legacy button's tooltips, with CookieMgr's additions (renamed vX.Y.Z.test.mjs
// when it lands): a spell's wait for magic and recovery, a stock's resting value and worth, a god's
// CpS in each slot — under the game's own tooltips, each wrapped once; the Legacy tooltip's block put
// back after the game rewrites it; each with its option. (The numbers are checked against the real
// game in tests/sim/minigame-info.)
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- small minigames
const fthof = { name: 'Force the Hand of Fate', id: 0, costMin: 10, costPercent: 0.6 };
const G = {
  spells: { 'hand of fate': fthof },
  spellsById: [fthof],
  magic: 20,
  magicM: 50,
  getSpellCost: (s) => Math.floor(s.costMin + 50 * s.costPercent),
  getFailChance: () => 0.15,
  spellTooltip: () => () => '<div class="name">Force the Hand of Fate</div>',
};
const good = { id: 0, symbol: 'CRL', val: 15, stock: 4, mode: 1 };
const B = {
  goodsById: [good],
  getRestingVal: () => 10,
  getGoodMaxStock: () => 100,
  getGoodPrice: (x) => x.val,
  goodDelta: () => 1.5,
  goodTooltip: () => () => '<div class="name">Cereals</div>',
};
const industry = { name: 'Holobore', id: 0, slot: -1 };
const T = { gods: { industry }, godsById: [industry], slot: [-1, -1, -1], godTooltip: () => () => '<div class="name">Holobore</div>' };
['Wizard tower', 'Bank', 'Temple'].forEach((n) => (Game.Objects[n] = Game.Objects[n] || { name: n, amount: 1, level: 1 }));
Game.Objects['Wizard tower'].minigame = G;
Game.Objects.Bank.minigame = B;
Game.Objects.Temple.minigame = T;
Game.cookiesPsRawHighest = 1000;
Game.cookiesPs = 1000;
CA.WhatIf.godGain = (key, slot) => (slot === 0 ? 100 : slot === 1 ? 60 : slot === 2 ? 30 : -100);
await sleep(1100); // wrapped within a second

// ---- a spell
const sp = G.spellTooltip(0)();
assert(/Force the Hand of Fate/.test(sp) && /CookieMgr/.test(sp) && /Magic enough in/.test(sp), 'a spell you can’t cast yet: the game’s tooltip, then when there’s magic enough');
G.magic = 50;
const sp2 = G.spellTooltip(0)();
assert(/Magic after casting/.test(sp2) && /Back to where it is in/.test(sp2) && /Full again in/.test(sp2), 'one you can: magic after, back to where it is, full again');
const info = CA.MinigameInfo.spell('hand of fate');
assert(info.cost === 40 && info.affordable && info.recover === CA.Grimoire.refillSeconds(10, 50, 50), `the numbers: cost ${info.cost}, recovery = the Grimoire's refill from 10 to 50`);
// ---- a stock
const st = B.goodTooltip(0)();
assert(/Resting value/.test(st) && /\+50\.0%/.test(st) && /slow rise/.test(st) && /Worth/.test(st) && /4 \/ 100/.test(st), 'a stock: resting value (price +50%), trend, held / max, worth');
assert(CA.MinigameInfo.stock(0).worth === 4 * 15 * 1000, 'its worth: held × price × the highest raw CpS (what selling pays)');
// ---- a god
const gd = T.godTooltip(0)();
assert(/Diamond/.test(gd) && /Ruby/.test(gd) && /Jade/.test(gd) && /\+10\.0%/.test(gd) && /\+3\.00%/.test(gd), 'a god: the CpS in each slot');
// ---- wrapped once
const again = G.spellTooltip;
await sleep(1100);
assert(G.spellTooltip === again && (G.spellTooltip(0)().match(/CookieMgr/g) || []).length === 1, 'wrapped once (one block)');
// ---- the option
CA.Settings.set('minigameTips', false);
assert(!/CookieMgr/.test(G.spellTooltip(0)()) && !/CookieMgr/.test(B.goodTooltip(0)()), 'off: the game’s tooltips alone');
CA.Settings.set('minigameTips', true);

// ---- the Legacy button's tooltip
Game.cookiesReset = 1e15; // level 10
Game.cookiesEarned = 2e15;
Game.HowMuchPrestige = (c) => Math.cbrt(c / 1e12);
Game.HowManyCookiesReset = (l) => Math.pow(l, 3) * 1e12;
Game.heavenlyChips = 3;
const button = doc.createElement('div');
button.id = 'legacyButton';
const tip = doc.createElement('div');
tip.id = 'ascendTooltip';
tip.getClientRects = () => [1]; // showing (jsdom lays nothing out)
button.appendChild(tip);
doc.body.appendChild(button);
tip.innerHTML = 'You’ve been on this run for <b>an hour</b>.';
await sleep(1100);
const block = () => doc.getElementById('CookieMgrAscendTip');
assert(block() && /Next level in/.test(block().textContent) && /Levels an hour/.test(block().textContent) && /Heavenly chips after/.test(block().textContent) && /Lucky digit/.test(block().textContent), 'the Legacy tooltip: next level in, levels an hour, chips after, the Lucky upgrades');
// the game rewrites it: the block comes back at once
tip.innerHTML = 'You’ve been on this run for <b>an hour and a second</b>.';
await sleep(0);
assert(block() && block().parentNode === tip && /a second/.test(tip.textContent), 'the game rewrote it: the block is back, under the game’s text');
CA.Settings.set('ascendTips', false);
tip.innerHTML = 'again';
await sleep(0);
assert(!block(), 'off: the game’s alone');
const V = (id, ...a) => CA.Script.VALUES.find((v) => v.id === id).get(...a);
assert(V('prestige.nextIn') > 0 && V('spell.cost', 'hand of fate') === 40 && Math.abs(V('stock.restingRatio', 'CRL') - 1.5) < 1e-12, 'the words: prestige.nextIn, spell.cost, stock.restingRatio');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
