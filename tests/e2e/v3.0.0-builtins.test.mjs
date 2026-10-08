// v3.0.0 (built-ins): every built-in with a decision is algorithmic code over building blocks —
// golden / wrath cookies, reindeer, wrinklers, the lump harvester, Best building / upgrade, research,
// cheap upgrades, the dragon. Each is checked side by side against the JavaScript action it
// replaces, on random states: the same things popped, harvested, bought.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const M = CA.Macros;
await sleep(400);

let seed = 99;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (n) => Math.floor(rnd() * n);
/** Runs `trials` random states through the old action and the macro's code: { same, busy, diffs }. */
function sideBySide(trials, setup, runJs, runCode, outcome) {
  let same = 0;
  let busy = 0;
  const diffs = [];
  for (let t = 0; t < trials; t++) {
    const restore = setup(t);
    const before = outcome();
    const nJs = runJs();
    const js = outcome();
    if (js !== before) busy++;
    restore();
    const nCode = runCode();
    const code = outcome();
    if (js === code && nJs === nCode) same++;
    else if (diffs.length < 2) diffs.push(`#${t}: js ${js} ×${nJs} · code ${code} ×${nCode}`);
  }
  return { same, busy, diffs };
}

// ---- they're code
['golden', 'wrath', 'reindeer', 'wrinklers', 'lumps', 'cmBuildings', 'cmUpgrades', 'research', 'cheapUpgrades', 'petDragon', 'stockTrader'].forEach((id) => {
  const m = M.get(id);
  assert(m.mode === 'flow' && M.sourceOf(m).length > 20 && !M.compiledOf(m).errors.length, `${m.name}: algorithmic code that compiles`);
});
assert(M.get('bigCookie').mode === 'repeat' && M.get('fortune').mode === 'repeat', 'no decision to expose (Big cookie, Fortune news): shortcuts, as before');

// ---- golden cookies, wrath cookies, reindeer
let popped = [];
const shimmer = (id, type, wrath) => ({
  id,
  type,
  wrath,
  pop() {
    popped.push(this.id);
    Game.shimmers.splice(Game.shimmers.indexOf(this), 1);
  },
});
for (const [id, action] of [['golden', 'pop.golden'], ['wrath', 'pop.wrath'], ['reindeer', 'pop.reindeer']]) {
  const r = sideBySide(
    150,
    () => {
      const list = Array.from({ length: pick(6) }, (_, i) => [i + 1, rnd() < 0.3 ? 'reindeer' : 'golden', rnd() < 0.4 ? 1 : 0]);
      Game.shimmers = list.map((x) => shimmer(...x));
      popped = [];
      return () => {
        Game.shimmers = list.map((x) => shimmer(...x));
        popped = [];
      };
    },
    () => CA.Actions.run(action),
    () => M.runOnce(id),
    () => popped.slice().sort().join()
  );
  assert(r.same === 150 && r.busy > 50, `${M.get(id).name}: pops what ${action} pops (${r.same}/150 the same, ${r.busy} with something to pop) ${r.diffs}`);
}
Game.shimmers = [];

// ---- wrinklers (inputs shiny, fed)
let slots = [];
const wrinkSnap = () => slots.map((x) => ({ ...x }));
const r1 = sideBySide(
  200,
  () => {
    slots = Array.from({ length: 10 }, (_, id) => ({ id, phase: pick(3), hp: rnd() < 0.8 ? 3 : 0, type: rnd() < 0.2 ? 1 : 0, sucked: rnd() < 0.5 ? 0 : rnd() * 5 }));
    const shiny = rnd() < 0.5 ? 'pop' : 'keep';
    const fed = rnd() < 0.5;
    M.setInput('wrinklers', 'shiny', shiny);
    M.setInput('wrinklers', 'fed', fed);
    Game.wrinklers = wrinkSnap();
    const start = wrinkSnap();
    sideBySide.params = { shiny, fed };
    return () => {
      Game.wrinklers = start.map((x) => ({ ...x }));
    };
  },
  () => CA.Actions.run('pop.wrinklers', sideBySide.params),
  () => M.runOnce('wrinklers'),
  () => Game.wrinklers.map((x) => x.hp).join()
);
assert(r1.same === 200 && r1.busy > 80, `Wrinklers: pops what pop.wrinklers pops, for every shiny / fed choice (${r1.same}/200, ${r1.busy} busy) ${r1.diffs}`);
M.setInput('wrinklers', 'shiny', 'pop');
M.setInput('wrinklers', 'fed', true);

// ---- the sugar lump (input when)
let clicked = 0;
Object.assign(Game, { lumpRipeAge: 3600e3, lumpMatureAge: 2400e3, canLumps: () => true, clickLump: () => clicked++ });
const r2 = sideBySide(
  200,
  () => {
    Game.lumpT = Date.now() - rnd() * 5000e3;
    const when = rnd() < 0.5 ? 'ripe' : 'mature';
    M.setInput('lumps', 'when', when);
    sideBySide.params = { when };
    clicked = 0;
    return () => (clicked = 0);
  },
  () => CA.Actions.run('lump.harvest', sideBySide.params),
  () => M.runOnce('lumps'),
  () => String(clicked)
);
assert(r2.same === 200 && r2.busy > 50, `Sugar lumps: harvests when lump.harvest would, ripe or mature (${r2.same}/200, ${r2.busy} harvested) ${r2.diffs}`);
M.setInput('lumps', 'when', 'ripe');

// ---- the store: upgrades, research
const RESEARCH = CA.AutoBuy.RESEARCH;
const upgrade = (name, price, pool = '') => ({
  name,
  dname: name,
  pool,
  bought: 0,
  getPrice: () => price,
  buy() {
    if (this.bought || Game.cookies < price) return;
    Game.cookies -= price;
    this.bought = 1;
    Game.UpgradesInStore.splice(Game.UpgradesInStore.indexOf(this), 1);
  },
});
const storeNow = () => `${Game.UpgradesInStore.map((u) => u.name).join(',')}|${Math.round(Game.cookies)}`;
Game.cookiesPs = 1000;
Game.cookiesPsRaw = 1000;
Game.unbuffedCps = 1000;
const r3 = sideBySide(
  200,
  () => {
    const n = pick(RESEARCH.length);
    const list = RESEARCH.slice(n, n + 1 + pick(3)).map((r) => [r, 10 + pick(100), 'tech']);
    const stop = rnd() < 0.3 ? 'none' : RESEARCH[pick(RESEARCH.length)];
    const cookies = rnd() < 0.2 ? 20 : 1e6;
    M.setInput('research', 'stopBefore', stop);
    sideBySide.params = { stopBefore: stop };
    const build = () => {
      Game.UpgradesInStore = list.map((x) => upgrade(...x));
      Game.cookies = cookies;
    };
    build();
    return build;
  },
  () => CA.Actions.run('buy.research', sideBySide.params),
  () => M.runOnce('research'),
  storeNow
);
assert(r3.same === 200 && r3.busy > 50, `Research: buys what buy.research buys, for any “stop before” (${r3.same}/200, ${r3.busy} bought) ${r3.diffs}`);
const r4 = sideBySide(
  200,
  () => {
    const list = Array.from({ length: 1 + pick(5) }, (_, i) => [`U${i}`, 100 + pick(4000), rnd() < 0.15 ? 'toggle' : '']);
    const secs = [0, 1, 2, 3, 0.5][pick(5)];
    const cookies = rnd() < 0.2 ? 500 : 1e6;
    M.setInput('cheapUpgrades', 'secs', secs);
    sideBySide.params = { secs };
    const build = () => {
      Game.UpgradesInStore = list.map((x) => upgrade(...x));
      Game.cookies = cookies;
    };
    build();
    return build;
  },
  () => CA.Actions.run('buy.cheapUpgrades', sideBySide.params),
  () => M.runOnce('cheapUpgrades'),
  storeNow
);
assert(r4.same === 200 && r4.busy > 50, `Cheap upgrades: buys what buy.cheapUpgrades buys, cheapest first (${r4.same}/200, ${r4.busy} bought) ${r4.diffs}`);
M.setInput('cheapUpgrades', 'secs', 1);

// ---- Best building / Best upgrade (Cookie Monster's payback periods)
const priceAt = (base, n) => Math.ceil(base * Math.pow(1.15, n));
for (const [name, base] of [['Cursor', 15], ['Grandma', 100]]) {
  const b = Game.Objects[name];
  b.getPrice = function () {
    return priceAt(base, this.amount);
  };
  b.getSumPrice = function (n) {
    let s = 0;
    for (let i = 0; i < n; i++) s += priceAt(base, this.amount + i);
    return s;
  };
  b.buy = function (n) {
    for (let i = 0; i < (n || 1); i++) {
      if (Game.cookies < this.getPrice()) break;
      Game.cookies -= this.getPrice();
      this.amount++;
    }
  };
}
Game.buyMode = 1;
Game.buyBulk = 1;
Game.mods.CookieMonster = {};
CA.Recorder.recent = () => ({ clickRate: 0, actual: 1000 });
const buyNow = () => `${Game.Objects.Cursor.amount},${Game.Objects.Grandma.amount}|${Game.UpgradesInStore.map((u) => u.name).join(',')}|${Math.round(Game.cookies)}`;
M.setEvery('cmBuildings', 60000); // the other one is switched on in some trials: no timer runs in between
M.setEvery('cmUpgrades', 60000);
for (const [id, action] of [['cmBuildings', 'cm.buyBuilding'], ['cmUpgrades', 'cm.buyUpgrade']]) {
  const other = id === 'cmBuildings' ? 'cmUpgrades' : 'cmBuildings';
  const r = sideBySide(
    200,
    () => {
      const amounts = [pick(15), pick(15)];
      const pps = [100 + rnd() * 900, 100 + rnd() * 900, 100 + rnd() * 900, 100 + rnd() * 900];
      const skip = rnd() < 0.5;
      const cookies = [30, 400, 5000, 1e6][pick(4)];
      M.set(other, rnd() < 0.5, { silent: true });
      M.setInput(id, 'skip', skip);
      sideBySide.params = { skip };
      w.CookieMonsterData = {
        Objects1: { Cursor: { pp: pps[0], price: 15 }, Grandma: { pp: pps[1], price: 100 } },
        Objects10: { Cursor: { pp: pps[0], price: 300 }, Grandma: { pp: pps[1], price: 2000 } },
        Upgrades: { 'Kitten helpers': { pp: pps[2] }, 'Lucky day': { pp: pps[3] } },
      };
      const build = () => {
        Game.Objects.Cursor.amount = amounts[0];
        Game.Objects.Grandma.amount = amounts[1];
        Game.UpgradesInStore = [upgrade('Kitten helpers', 900), upgrade('Lucky day', 50)];
        Game.cookies = cookies;
      };
      build();
      return build;
    },
    () => CA.Actions.run(action, sideBySide.params),
    () => M.runOnce(id),
    buyNow
  );
  assert(r.same === 200 && r.busy > 50, `${M.get(id).name}: buys what ${action} buys — with the other on or off, skipping or saving up (${r.same}/200, ${r.busy} bought) ${r.diffs}`);
}
M.set('cmBuildings', false, { silent: true });
M.set('cmUpgrades', false, { silent: true });

// ---- the dragon: nothing to do without level 8
Game.dragonLevel = 0;
assert(M.runOnce('petDragon') === 0 && !M.compiledOf(M.get('petDragon')).errors.length, 'Pet the dragon: code that waits for its level');

// ---- their buttons still say what's next
M.setFav('research', true); // its own button on the left panel
M.setInput('research', 'stopBefore', 'none');
Game.UpgradesInStore = [upgrade('One mind', 10, 'tech')];
Game.cookies = 1e6;
CA.Settings.set('widgetsShown', true);
CA.UI.Widgets.render();
CA.UI.Widgets.tick();
const btn = w.document.querySelector('#CookieMgrWidgets [data-w-trigger="research"]');
assert(btn && /next: One mind/.test(btn.parentNode.textContent), `a code built-in’s button: what it would buy next (${btn && btn.parentNode.textContent.slice(0, 80)})`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
