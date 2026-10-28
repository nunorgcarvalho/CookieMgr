// v3.48.0: "Buy all upgrades" ranked by payback. The game's button (Inspired checklist) — every store
// upgrade the bank affords, cheapest first — gets its own payback period, measured as one purchase:
// all of them bought at once in the hypothetical, the game's CpS read, undone (so upgrades that
// multiply each other count together). It's one thing in the Auto buyer's queue ("allUpgrades"),
// rankable by rules, and words: payback.allUpgrades / allUpgradesIn / Gain / Price / Count.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const B = CA.AutoBuyer;
const P = CA.Payback;
const value = (id, ...args) => CA.Script.VALUES.find((v) => v.id === id).get(...args);

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false }));
const mk = (name, price, pool = '') => ({ name, dname: name, pool, bought: 0, unlocked: 1, icon: [0, 0], getPrice: () => price, buy() { if (Game.cookies >= price) { Game.cookies -= price; this.bought = 1; } }, isVaulted: () => false });
const ups = [mk('A', 1000), mk('B', 2000), mk('Switch', 1, 'toggle'), mk('Dear', 1e30)];
Game.Upgrades = { ...(Game.Upgrades || {}), ...Object.fromEntries(ups.map((u) => [u.name, u])) };
Game.UpgradesInStore = ups.slice();
const model = cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])), mults: { A: 1.1, B: 1.2 } });
Game.CpsAchievements = [];
Game.cookies = 3500;
Game.CalculateGains();
const cps = Game.cookiesPs;

// ---- measured together ----
const all = P.allUpgrades();
assert(all.names.join() === 'A,B' && all.n === 2 && all.price === 3000, `what it would buy: the affordable ones, cheapest first (${all.names})`);
const together = cps * (1.1 * 1.2 - 1);
assert(Math.abs(all.gain - together) < 1e-6, `its gain is both bought at once: ×1.32, not ×1.1 + ×1.2 (${all.gain} vs ${together})`);
assert(all.gain > P.upgradeWorth('A').gain + P.upgradeWorth('B').gain, 'more than the two apart (they multiply)');
const expect = P.parts(3000, all.worth).pp;
assert(Number.isFinite(all.pp) && all.pp === expect && Math.abs(all.pp - 3000 / together) < 1e-6, `its PP: price ÷ gain, all affordable (${all.pp})`);
assert(Game.cookiesPs === cps && !ups[0].bought && !ups[1].bought, 'the game is put back');
assert(value('payback.allUpgrades') === all.pp && value('payback.allUpgradesPrice') === 3000 && value('payback.allUpgradesCount') === 2, 'its words');
assert(Math.abs(value('payback.allUpgradesGain') - together) < 1e-6, 'payback.allUpgradesGain');
assert(Number.isFinite(value('payback.allUpgradesIn', 'raw')), 'payback.allUpgradesIn(mode)');
Game.cookies = 1500;
assert(P.allUpgrades().names.join() === 'A', 'only what the bank affords');
Game.cookies = 3500;

// ---- in the Auto buyer's queue ----
// the rule profiles that buy upgrades come with: 20+ affordable → buy them all first
const bulk = B.ruleText(B.BULK_RULE);
assert(B.find('payback').rules.length === 1 && B.ruleText(B.find('payback').rules[0]) === bulk && B.find('upgrades').rules.length === 1 && !B.find('buildings').rules.length, `seeded rule: ${bulk}`);
assert(!B.whenProblem(B.BULK_RULE.when), 'its condition compiles');
assert(B.find('payback').rules[0].on === true && B.find('payback').rules[0].k === 1, 'a whole rule, switched on');
assert(value('payback.allUpgradesCount', 1500) === 1, 'payback.allUpgradesCount(budget)');
assert(!B.queue().items.find((x) => x.key === 'allUpgrades').first, 'two affordable: the rule waits (it ranks by its payback period)');
const many = Array.from({ length: 20 }, (_, i) => mk(`Cheap ${i}`, 1));
Game.UpgradesInStore = ups.concat(many);
assert(B.next().key === 'allUpgrades' && B.next().n === 22, `20+ affordable: Buy all upgrades goes first (${B.next().key})`);
Game.UpgradesInStore = ups.slice();
// a save from before v3.48: profiles that buy upgrades get the rule, the others don't
const S = CA.Settings;
const saved = JSON.parse(S.serialize());
saved.buyer = { active: 'mine', profiles: [{ id: 'mine', name: 'Mine', kinds: { building: true, upgrade: true }, rules: [{ what: 'cheap', effect: 'first' }] }, { id: 'b', name: 'B', kinds: { building: true, upgrade: false }, rules: [] }] };
S.load(JSON.stringify(saved));
assert(B.find('mine').rules.length === 2 && B.ruleText(B.find('mine').rules[1]) === bulk && B.find('mine').kinds.allUpgrades, 'an old profile with upgrades: the rule added at the end');
assert(!B.find('b').rules.length && !B.find('b').kinds.allUpgrades, 'one without: nothing');
S.load(JSON.stringify({ ...saved, buyer: JSON.parse(S.serialize()).buyer }));
assert(B.find('mine').rules.length === 2, 'saved again, it isn’t added twice');
saved.buyer = { active: 'payback', profiles: B.SEEDS };
S.load(JSON.stringify(saved));
B.update('payback', { rules: [] });
assert(B.find('payback').kinds.allUpgrades && B.find('upgrades').kinds.allUpgrades && !B.find('buildings').kinds.allUpgrades, 'seeded: on where upgrades are bought');
const old = B.SEEDS.map((p) => ({ ...p, kinds: { building: p.kinds.building, upgrade: p.kinds.upgrade } }));
B.update('buildings', { kinds: old[1].kinds });
assert(!B.find('buildings').kinds.allUpgrades, 'a profile saved before v3.48 without upgrades: still none');
B.update('payback', { kinds: old[0].kinds });
assert(B.find('payback').kinds.allUpgrades, 'one with upgrades: buys it too');
let q = B.queue();
let row = q.items.find((x) => x.key === 'allUpgrades');
assert(row && row.pp === all.pp && row.label === 'Buy all upgrades (2)', `a queue row of its own (${row && row.label})`);
assert(value('pp.kind', 'allUpgrades') === 'allUpgrades' && value('pp.price', 'allUpgrades') === 3000 && value('pp.of', 'allUpgrades') === all.pp, 'pp.kind / pp.price / pp.of');
assert(value('buyer.rank', 'allUpgrades') > 0, 'buyer.rank');

// a rule can target it
B.update('payback', { rules: [{ what: 'allUpgrades', effect: 'first' }] });
assert(B.next().key === 'allUpgrades' && value('buyer.next') === 'allUpgrades', 'a "first" rule puts it at the front');
assert(B.ruleText(B.find().rules[0]) === 'Buy all upgrades → buy first', B.ruleText(B.find().rules[0]));
B.update('payback', { rules: [{ what: 'upgrade', effect: 'never' }] });
assert(B.queue().items.some((x) => x.key === 'allUpgrades'), '"Upgrades" rules don’t touch it');
B.update('payback', { rules: [{ what: 'allUpgrades', effect: 'never' }] });
assert(B.queue().held.some((x) => x.key === 'allUpgrades'), '"never" holds it back');
B.update('payback', { kinds: { building: true, upgrade: true, allUpgrades: false } });
assert(!B.queue().items.concat(B.queue().held).some((x) => x.key === 'allUpgrades'), 'off: not in the queue');

// the reserve: what it buys is what the budget affords
B.update('payback', { kinds: { building: false, upgrade: false, allUpgrades: true }, rules: [], reserve: 0, banks: [] });
Game.cookies = 2500;
q = B.queue();
row = q.held.find((x) => x.key === 'allUpgrades');
assert(q.items.length === 0 && row && /only one/.test(row.why), `affording one: held, it’s just that one (${row && row.why})`);

// the page
const doc = w.document;
CA.UI.Menu.openPage('payback');
await sleep(50);
const menu = () => doc.getElementById('CookieMgrMenu');
assert(menu().querySelector('[data-ab-kind="allUpgrades"]'), 'the profile’s Buys chips have it');
Game.cookies = 3500;
CA.UI.Menu.render();
await sleep(20);
assert(/Buy all upgrades \(2\)/.test(menu().querySelector('[data-ab-queue]').textContent), 'its queue row');
assert(/PP /.test(menu().querySelector('[data-ab-act="all"]').parentNode.textContent), 'the Buy all upgrades button shows its PP');

// buying it buys them all
const got = B.buyNext();
assert(got === 1 && ups[0].bought && ups[1].bought && Game.cookies === 500, `the buyer buys the lot (${Game.cookies})`);
model.mults = {};
B.update('payback', { kinds: { building: true, upgrade: true, allUpgrades: true } });
Game.UpgradesInStore = [];
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
