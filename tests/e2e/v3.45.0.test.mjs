// v3.45.0: the Auto buyer's reserve combines thresholds. A profile keeps the highest of its minutes of
// unbuffed CpS and the banks it picks — Lucky!, Conjure, Frenzy Lucky! (the bank warnings' own) and
// Garden replant (garden.layoutCost: planting the whole layout) — so the bank never drops below any.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, errors } = g;
const CA = w.CookieMgr;
const M = makeGarden(Game);
M.plotLimits = [[2, 2, 4, 4], [2, 2, 5, 4], [2, 2, 5, 5], [1, 2, 5, 5], [1, 1, 5, 5], [1, 1, 6, 5], [1, 1, 6, 6], [0, 1, 6, 6], [0, 0, 6, 6]];
Game.Objects.Farm.level = 8;
await sleep(400);
const B = CA.AutoBuyer;
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false }));
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
Game.cookies = 1e6;
Game.CalculateGains();

// ---- the garden's replant cost ----
M.plants.goldenClover.unlocked = 1;
M.plants.nursetulip.unlocked = 1;
CA.Garden.use('tulipCombos');
const tiles = value('garden.layoutTiles');
const want = 8 * M.getCost(M.plants.nursetulip) + (tiles - 8) * M.getCost(M.plants.goldenClover);
assert(tiles === 30 && CA.Garden.layoutCost() === want && value('garden.layoutCost') === want, `garden.layoutCost: 8 tulips + 22 clovers (${value('garden.layoutCost')} vs ${want})`);

// ---- the thresholds ----
const p = B.find('payback');
assert(Array.isArray(p.banks) && p.banks.length === 0, 'a profile starts with no banks');
assert(B.keepOf('payback') === 0 && value('buyer.reserve') === 0 && value('buyer.budget') === Game.cookies, 'no reserve: the whole bank');
B.update('payback', { reserve: 10, banks: ['lucky', 'nonsense', 'garden'] });
assert(B.find('payback').banks.join() === 'lucky,garden', `unknown banks are dropped (${B.find('payback').banks})`);
const mins = B.reserveOf(10);
const lucky = value('bank.lucky');
const parts = B.reserveParts('payback');
assert(parts.map((q) => q.id).join() === 'cps,lucky,garden', `one part a threshold (${parts.map((q) => q.id)})`);
const most = Math.max(mins, lucky, want);
assert(B.keepOf('payback') === most && value('buyer.reserve') === most, `keeps the highest (${B.keepOf('payback')} vs ${most})`);
assert(parts.filter((q) => q.wins).length === 1 && parts.find((q) => q.wins).amount === most, 'the winner is marked');
assert(value('buyer.budget') === Game.cookies - most, 'the budget is the bank less it');

// each threshold can be the winner
B.update('payback', { reserve: 1e9, banks: ['lucky', 'garden'] });
assert(B.reserveParts('payback').find((q) => q.wins).id === 'cps', 'many minutes: the minutes win');
B.update('payback', { reserve: 0, banks: ['conjure', 'luckyFrenzy'] });
const frenzy = value('bank.luckyFrenzy');
assert(B.keepOf('payback') === Math.max(value('bank.conjure'), frenzy) && frenzy > value('bank.lucky'), 'Conjure and Frenzy Lucky!');

// the buyer holds back what would dip below it
Game.cookies = B.keepOf('payback') + 1;
const had = Object.values(Game.Objects).reduce((s, b) => s + b.amount, 0);
assert(CA.Actions.get('buyer.buyNext').run({ profile: '' }) === 0 && Object.values(Game.Objects).reduce((s, b) => s + b.amount, 0) === had, 'it doesn’t buy into the reserve');
Game.cookies = B.keepOf('payback') + 1e9;
assert(CA.Actions.get('buyer.buyNext').run({ profile: '' }) === 1, 'and buys above it');

// saved and loaded
const S = CA.Settings;
const saved = JSON.parse(S.serialize());
B.update('payback', { banks: [] });
S.load(JSON.stringify(saved));
assert(B.find('payback').banks.join() === 'conjure,luckyFrenzy', 'banks are saved');

// ---- the profile editor ----
const doc = w.document;
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const menu = () => doc.getElementById('CookieMgrMenu');
B.use('payback');
CA.UI.Menu.openPage('payback');
await sleep(50);
assert(menu().querySelectorAll('[data-ab-bank]').length === 5, 'a chip a bank');
assert(menu().querySelector('[data-ab-bank="conjure"]').classList.contains('on'), 'picked banks are on');
click(menu().querySelector('[data-ab-bank="garden"]'));
assert(B.find('payback').banks.includes('garden'), 'a chip picks a bank');
click(menu().querySelector('[data-ab-bank="conjure"]'));
assert(!B.find('payback').banks.includes('conjure'), 'and clicked again drops it');
const keep = menu().querySelector('[data-ab-keep]');
assert(keep && /Garden replant/.test(keep.textContent) && /Frenzy Lucky!/.test(keep.textContent), `the editor lists the thresholds (${keep && keep.textContent})`);
assert(keep.querySelector('b') && keep.querySelector('b').textContent.startsWith(B.reserveParts('payback').find((q) => q.wins).label), 'the winner in bold');
B.update('payback', { reserve: 0, banks: [] });
CA.UI.Menu.render();
await sleep(20);
assert(/no reserve/.test(menu().querySelector('[data-ab-keep]').textContent), 'none: no reserve');

assert(errors.length === 0, `no runtime errors (${errors.length}): ${errors.slice(0, 3).join(' | ')}`);
done();
process.exit();
