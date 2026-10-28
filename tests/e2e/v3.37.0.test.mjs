// v3.37.0: a bank reserve for Best building and Best upgrade (v3.43: the Auto buyer's profiles) — "Bank reserve (minutes of unbuffed
// CpS)": each never buys what would take the bank below that many minutes of your unbuffed CpS. Saving up,
// it waits until it can buy the best and keep the reserve; skipping, it picks from what fits above it.
// Also on their actions (cm.buyBuilding, cm.buyUpgrade) and in code: pp.best(kind, skip, budget).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const M = CA.Macros;

const spec = { Cursor: [15, 0.1], Grandma: [100, 1], Farm: [1100, 8] };
Object.keys(spec).forEach((n, i) => {
  Object.assign(Game.Objects[n], { id: i, basePrice: spec[n][0], free: 0, amount: 5, locked: false });
});
Game.UpgradesInStore = [];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])) });
Game.CpsAchievements = [];
CA.Shop.setMinBulk(1);
CA.Settings.set('roundUpBulk', false);
let st = 0;
const newState = () => {
  Game.pledges = 300 + ++st;
  Game.CalculateGains();
};
// a minute of unbuffed CpS, as it is now (buying changes it)
const min1 = () => Game.cookiesPsRaw * 60;
const amounts = () => Object.keys(spec).map((n) => Game.Objects[n].amount).join(',');
const cursorPrice = () => 15 * Math.pow(1.15, Game.Objects.Cursor.amount);
const bestPick = () => CA.AutoBuy.best(['building'], false);

// v3.43: Best building / Best upgrade → the Auto buyer: the reserve is its profile's (Buildings only here)
const BU = CA.AutoBuyer;
BU.use('buildings');
const setIn = (key, v) => BU.update(BU.activeProfile(), { [key]: v });
assert(BU.find('buildings').reserve === 0 && BU.find('upgrades').reserve === 0, 'no reserve until you set one');
assert(/buyer\.budget/.test(M.sourceOf(M.get('autoBuyer'))) && !M.compiledOf(M.get('autoBuyer')).errors.length, 'the Auto buyer’s code keeps the reserve (buyer.budget) and compiles');
['cm.buyBuilding', 'cm.buyUpgrade'].forEach((id) => assert(CA.Actions.get(id).params.some((p) => p.key === 'reserve'), `${id}: a reserve option`));

// ---- on the Payback page: a number box in the profile, and the Next line says what it keeps
setIn('reserve', 15);
CA.UI.Menu.openPage('payback');
const box = w.document.querySelector('[data-ab-editor] input[data-ab-f="reserve"]');
assert(box && box.type === 'number' && box.value === '15', `the profile: a Bank reserve box (${box && box.value})`);
box.value = '0';
box.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(BU.find('buildings').reserve === 0, 'changing the box sets it');

// ---- no reserve: buys as before
newState();
const best = bestPick();
assert(best && best.price > cursorPrice(), `the best building costs more than a cursor (${best && best.name})`);
Game.cookies = min1() + cursorPrice() + 1;
let before = amounts();
setIn('skip', false);
M.runOnce('autoBuyer');
await sleep(30);
assert(amounts() !== before, `reserve 0: the Auto buyer buys (${before} → ${amounts()})`);

// ---- 1 minute kept: saving up, it waits for the best plus the reserve
newState();
setIn('reserve', 1);
Game.cookies = min1() + cursorPrice() + 1; // only a cursor fits above the reserve
before = amounts();
M.runOnce('autoBuyer');
await sleep(30);
assert(amounts() === before, `reserve 1 min, saving up: buys nothing that would dip below it (${amounts()})`);
const ready = M.get('autoBuyer').readiness(M.inputsOf(M.get('autoBuyer')));
assert(ready && !ready.ok && /keeping the reserve/.test(ready.text), `its button says it waits, keeping the reserve (${ready && ready.text})`);

// skipping: what fits above the reserve — a cursor
setIn('skip', true);
const cursors = Game.Objects.Cursor.amount;
const bank = Game.cookies;
M.runOnce('autoBuyer');
await sleep(30);
assert(Game.Objects.Cursor.amount === cursors + 1, `reserve 1 min, skipping: buys the cursor, the only thing above it (${amounts()})`);
assert(Game.cookies >= min1() && Game.cookies < bank, `…and the bank is still above the reserve (${Math.round(Game.cookies)} ≥ ${Math.round(min1())})`);
newState();
before = amounts();
M.runOnce('autoBuyer');
await sleep(30);
assert(amounts() === before, `…then nothing more: the bank is at the reserve (${Math.round(Game.cookies)})`);

// enough for the best and the reserve: buys it
newState();
setIn('skip', false);
const b2 = bestPick();
Game.cookies = min1() + b2.price + 1;
const had = Game.Objects[b2.name].amount;
M.runOnce('autoBuyer');
await sleep(30);
assert(Game.Objects[b2.name].amount === had + 1 && Game.cookies >= min1(), `with the best plus the reserve in the bank: buys the best (${b2.name})`);

// ---- it's minutes of unbuffed CpS: a frenzy doesn't move it
newState();
const rawNow = Game.cookiesPsRaw;
Game.buffs = { Frenzy: { name: 'Frenzy', multCpS: 7, time: 1000 } };
Game.CalculateGains();
assert(Math.abs(Game.cookiesPs - Game.cookiesPsRaw * 7) < 1e-6 && Game.cookiesPsRaw === rawNow, 'a Frenzy: CpS ×7, unbuffed CpS as it was');
setIn('skip', true);
Game.cookies = min1() + cursorPrice() + 1;
const c2 = Game.Objects.Cursor.amount;
M.runOnce('autoBuyer');
await sleep(30);
assert(Game.Objects.Cursor.amount === c2 + 1, 'in a Frenzy the reserve is still 1 minute of unbuffed CpS');
Game.buffs = {};
Game.CalculateGains();

// ---- the action, and code
newState();
const act = CA.Actions.get('cm.buyBuilding');
Game.cookies = min1() * 2;
before = amounts();
assert(act.run({ skip: false, reserve: 5 }) === 0 && amounts() === before, 'cm.buyBuilding, reserve 5 min with 2 in the bank: buys nothing');
assert(act.run({ skip: true, reserve: 0 }) === 1, 'cm.buyBuilding, no reserve: buys');
newState();
const ppBest = CA.Script.VALUES.find((v) => v.id === 'pp.best');
assert(ppBest.params.join(',') === 'kind,skip,budget', 'pp.best(kind, skip, budget)');
Game.cookies = 1e9;
assert(ppBest.get('building', true, 1) === '', 'pp.best(building, true, 1): nothing that cheap');
assert(ppBest.get('building', true, cursorPrice() + 1) === 'building:Cursor', 'pp.best(building, true, a cursor’s price): the cursor');
assert(ppBest.get('building', true) !== '' && ppBest.get('building', true) === ppBest.get('building', true, ''), 'without a budget: the whole bank, as before');

// ---- Best upgrade keeps it too
newState();
const u = new Game.Upgrade('Kitten helpers', 50);
Object.assign(u, { type: 'upgrade', pool: '', unlocked: 1, getPrice: () => 50 });
Game.Upgrades = { 'Kitten helpers': u };
Game.UpgradesInStore = [u];
cpsModel(Game, { base: 1000, each: Object.fromEntries(Object.keys(spec).map((n) => [n, spec[n][1]])), mults: { 'Kitten helpers': 2 } });
BU.use('upgrades');
setIn('reserve', 1);
setIn('skip', true);
Game.cookies = min1() + 49;
M.runOnce('autoBuyer');
await sleep(30);
assert(!u.bought, 'Upgrades only, 1 min kept and 49 above it: doesn’t buy a 50-cookie upgrade');
newState();
Game.cookies = min1() + 51;
const keep = min1(); // the reserve as it was when it bought (Kitten helpers doubles the CpS after)
M.runOnce('autoBuyer');
await sleep(30);
assert(u.bought && Game.cookies >= keep, 'with 51 above it: buys it, the reserve kept');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
