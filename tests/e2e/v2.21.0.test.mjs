// v2.21.0: buying macros (best building / best upgrade by payback period — v3.5: CookieMgr's own, research, cheap
// upgrades) and petting the dragon; readiness tint on buttons.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';
import { cpsModel } from '../harness/cps.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;

// ---- the game, as the buyers see it
const priceAt = (base, n) => Math.ceil(base * Math.pow(1.15, n));
function building(b, base) {
  b.amount = b.amount || 0;
  b.getPrice = function () {
    return priceAt(base, this.amount);
  };
  b.getSumPrice = function (n) {
    let s = 0;
    for (let i = 0; i < n; i++) s += priceAt(base, this.amount + i);
    return s;
  };
  b.buy = function (n) {
    if (Game.buyMode == -1) return;
    if (!n) n = Game.buyBulk;
    for (let i = 0; i < n; i++) {
      if (Game.cookies < this.getPrice()) break;
      Game.cookies -= this.getPrice();
      this.amount++;
    }
  };
}
building(Game.Objects.Cursor, 15);
building(Game.Objects.Grandma, 100);
Game.buyMode = 1;
Game.buyBulk = 1;
function upgrade(name, price, pool = '', extra = {}) {
  return Object.assign(
    {
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
    },
    extra
  );
}
const plastic = upgrade('Plastic mouse', 5000);
const kitten = upgrade('Kitten helpers', 9000);
const lucky = upgrade('Lucky day', 50);
Game.UpgradesInStore = [plastic, kitten, lucky, upgrade('Festive biscuit', 1, 'toggle'), upgrade('Specialized chocolate chips', 10, 'tech'), upgrade('One mind', 10, 'tech')];
// v3.5: payback periods are CookieMgr's own (features/payback.js asks the game what each thing adds)
// — a CpS model stands in for the game: Cursor +0.1/s, Grandma +1/s on a base of 1000; Kitten helpers
// ×1.15, Lucky day ×1.0001; Plastic mouse: +1% of CpS per click
cpsModel(Game, { base: 1000, each: { Cursor: 0.1, Grandma: 1 }, mults: { 'Kitten helpers': 1.15, 'Lucky day': 1.0001 }, mouse: { 'Plastic mouse': 0.01 } });
await sleep(400);

// ---- no Cookie Monster needed (v3.5)
CA.UI.Menu.openPage('clickers');
const card = (id) => doc.querySelector(`[data-page="clickers"] .ca-mtile[data-macro-row="${id}"]`);
// v3.43: Best building + Best upgrade → the Auto buyer (its profiles: buildings, upgrades, payback = both)
assert(card('autoBuyer') && card('research') && card('cheapUpgrades') && card('petDragon'), 'the new built-ins');
assert(!doc.querySelector('[data-page="clickers"] [data-ca="cm-load"]') && !card('autoBuyer').querySelector('.ca-switch[disabled]'), 'v3.5: the buyers work without Cookie Monster — no warning, switch enabled');
const BU = CA.AutoBuyer;

Game.cookies = 1e6;
const AB = CA.AutoBuy;
// PP (bank covers the price): Cursor 15 / 0.1 = 150, Grandma 100 / 1 = 100; Kitten helpers 9000 / 150 = 60, Lucky day 50 / 0.1 = 500
assert(AB.best(['building'], false).name === 'Grandma' && Math.abs(AB.best(['building'], false).pp - 100) < 1e-6, `best building: lowest PP (${AB.best(['building'], false).pp})`);
assert(AB.best(['upgrade'], false).name === 'Kitten helpers' && Math.abs(AB.best(['upgrade'], false).pp - 60) < 1e-6, 'best upgrade: lowest PP (Plastic mouse adds nothing without clicking)');
// clicking: 10 clicks/s → Plastic mouse adds 10 × 1%×1000 = 100 cookies/s for 5000: PP 50
CA.Recorder.recent = () => ({ clickRate: 10, actual: 1000 }); // v2.29: recent averages live in the Recorder
const pm = AB.candidates(['upgrade']).find((c) => c.name === 'Plastic mouse');
assert(pm && pm.estimated && Math.abs(pm.pp - 50) < 1e-9, `clicking upgrade priced by clicks/s (PP ${pm && pm.pp})`);
assert(!plastic.bought, 'estimating doesn’t buy it');

// buying; buildings and upgrades together → only the overall best is bought
BU.use('payback');
CA.Macros.runOnce('autoBuyer');
assert(Game.Objects.Grandma.amount === 0 && plastic.bought === 1, 'both kinds: the best of all (an upgrade) is bought, not a building');
BU.use('buildings');
CA.Macros.runOnce('autoBuyer');
assert(Game.Objects.Grandma.amount === 1, 'buildings only: its best');
// round to multiples: ranked by what reaching the next multiple of 10 is worth, bought that far
CA.Shop.setRoundUp(true);
CA.Macros.runOnce('autoBuyer');
assert(Game.Objects.Grandma.amount === 10, `round to multiples: buys 9 to reach 10 (${Game.Objects.Grandma.amount})`);
CA.Shop.setRoundUp(false);

// can't afford: saves up, or skips (the profile's setting). At 2000: Kitten helpers (7000 / 1000 + 60 = 67) is
// best; Lucky day (500) is all it can afford
Game.cookies = 2000;
BU.use('upgrades');
assert(CA.Macros.runOnce('autoBuyer') === 0 && !kitten.bought && !lucky.bought, 'saves up for the best by default');
BU.update('upgrades', { skip: true });
CA.Macros.runOnce('autoBuyer');
assert(lucky.bought && !kitten.bought, 'skip: buys the best it can afford');
BU.update('upgrades', { skip: false });

// ---- the button: tinted by whether the next buy is affordable; pressing it says so
CA.Macros.setFav('autoBuyer', true);
CA.UI.Widgets.tick();
const btn = () => doc.querySelector('#CookieMgrWidgets [data-w-trigger="autoBuyer"]');
assert(btn().classList.contains('spell-cant') && /next: Kitten helpers — in/.test(btn().parentNode.textContent), `can’t afford yet: muted red, says what and when (${btn().parentNode.textContent})`);
g.calls.notify.length = 0;
click(w, btn());
assert(CA.Macros.isOn('autoBuyer') && btn().classList.contains('ca-shake') && g.calls.notify.some((n) => /nothing it can do yet/.test(n.desc)), 'switching it on: shakes and says why');
CA.Macros.set('autoBuyer', false, { silent: true });
Game.cookies = 1e6;
CA.UI.Widgets.tick();
assert(btn().classList.contains('spell-can'), 'affordable: muted green');

// ---- research
Game.cookies = 1000;
CA.Macros.runOnce('research');
const names = () => Game.UpgradesInStore.map((u) => u.name);
assert(!names().includes('Specialized chocolate chips') && names().includes('One mind'), 'buys research, stops before One mind');
const sel = card('research').querySelector('select[data-key="stopBefore"]');
sel.value = 'none';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
CA.Macros.runOnce('research');
assert(!names().includes('One mind'), '“never”: buys it too');

// ---- cheap upgrades (under N seconds of unbuffed production)
Game.UpgradesInStore.push(upgrade('Cheap one', 800), upgrade('Pricey one', 1500));
Game.cookies = 1e6;
CA.Macros.runOnce('cheapUpgrades');
assert(!names().includes('Cheap one') && names().includes('Pricey one'), 'under 1s of production (1000): bought; over: not');
CA.Macros.setInput('cheapUpgrades', 'secs', 2); // v3: an input of its code
CA.Macros.runOnce('cheapUpgrades');
assert(!names().includes('Pricey one'), '2s: that one too');

// ---- the dragon (since v3.13.0 it learns the quarters' drops by petting, never from the seed)
Game.dragonLevel = 8;
const owned = new Set(['Pet the dragon']);
const unlocked = new Set();
Game.Has = (n) => owned.has(n);
Game.HasUnlocked = (n) => unlocked.has(n);
Game.specialTab = '';
let menuOn = 0;
// as the game's: closing only acts while a tab is set, and clears it (main.js ToggleSpecialMenu)
Game.ToggleSpecialMenu = (on) => {
  if (on) menuOn = 1;
  else if (Game.specialTab !== '') (Game.specialTab = ''), (menuOn = 0);
};
let pets = 0;
const quarter = Math.floor(new Date().getMinutes() / 15);
const dueNow = ['Dragon teddy bear', 'Dragon fang', 'Dragon claw', 'Dragon scale'][quarter];
Game.ClickSpecialPic = () => {
  pets++;
  if (Game.specialTab === 'dragon' && pets === 7) unlocked.add(dueNow); // drops on the 7th pet
};
let sched = AB.petSchedule();
assert(sched.length === 4 && sched.find((x) => x.now).open && sched.find((x) => x.now).drop === '', 'this quarter: not tried yet, worth petting');
const r = CA.Macros.runOnce('petDragon');
assert(r === 1 && unlocked.has(dueNow) && pets === 7, `pets until it drops (${pets} pets)`);
assert(menuOn === 0 && Game.specialTab === '', 'closes the dragon after');
sched = AB.petSchedule();
assert(sched.find((x) => x.now).drop === dueNow && !sched.find((x) => x.now).open, `learned this quarter's drop (${dueNow})`);
pets = 0;
CA.Macros.runOnce('petDragon');
assert(pets === 0, 'nothing due this quarter any more: leaves it alone');
assert(/in \d/.test(CA.Actions.get('dragon.pet').ready({}).text), 'says when the next quarter worth trying comes');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
