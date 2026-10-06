// v2.21.0: buying macros (best building / best upgrade via Cookie Monster PP, research, cheap
// upgrades) and petting the dragon; Cookie Monster-dependent cards; readiness tint on buttons.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

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
// clicking: Plastic mouse adds 1% of CpS per click
Game.cookiesPs = 1000;
Game.cookiesPsRaw = 1000;
Game.mouseCps = () => 1 + (plastic.bought ? Game.cookiesPs * 0.01 : 0);
await sleep(400);

// ---- without Cookie Monster
CA.UI.Menu.openPage('clickers');
const card = (id) => doc.querySelector(`[data-page="clickers"] .ca-mtile[data-macro-row="${id}"]`);
assert(card('cmBuildings') && card('cmUpgrades') && card('research') && card('cheapUpgrades') && card('petDragon'), 'the new built-ins');
assert(card('cmBuildings').querySelector('.ca-mtile-warn [data-ca="cm-load"]') && card('cmBuildings').querySelector('.ca-switch[disabled]'), 'Cookie Monster ones: a warning, Load it, switch disabled');
assert(!card('research').querySelector('.ca-mtile-warn'), 'the others don’t need it');

// ---- with Cookie Monster's data (PP per building for ×1 / ×10, per upgrade)
Game.mods.CookieMonster = {};
w.CookieMonsterData = {
  Objects1: { Cursor: { pp: 900, price: 15 }, Grandma: { pp: 400, price: 100 } },
  Objects10: { Cursor: { pp: 950, price: 300 }, Grandma: { pp: 300, price: 2000 } },
  Upgrades: { 'Kitten helpers': { pp: 350 }, 'Plastic mouse': { pp: Infinity }, 'Lucky day': { pp: Infinity } },
};
CA.Events.emit('integrations', 'cookieMonster');
assert(!card('cmBuildings').querySelector('.ca-mtile-warn') && !card('cmBuildings').querySelector('.ca-switch[disabled]'), 'Cookie Monster running: unlocked');

Game.cookies = 1e6;
const AB = CA.AutoBuy;
assert(AB.best(['building'], false).name === 'Grandma', 'best building: lowest PP');
assert(AB.best(['upgrade'], false).name === 'Kitten helpers', 'best upgrade: lowest PP (Plastic mouse has none and no clicking yet)');
// clicking: 10 clicks/s → Plastic mouse adds 10 × 1%×1000 = 100 cookies/s for 5000: PP 50
CA.UI.Graphs.recent = () => ({ clickRate: 10, actual: 1000 });
const pm = AB.candidates(['upgrade']).find((c) => c.name === 'Plastic mouse');
assert(pm && pm.estimated && Math.abs(pm.pp - 50) < 1e-9, `clicking upgrade priced by clicks/s (PP ${pm && pm.pp})`);
assert(!plastic.bought, 'estimating doesn’t buy it');

// buying; both on → only the overall best is bought, by its kind
CA.Macros.set('cmUpgrades', true, { silent: true });
CA.Macros.runOnce('cmBuildings');
assert(Game.Objects.Grandma.amount === 0, 'with Best upgrade on, a building isn’t bought while an upgrade is better');
CA.Macros.runOnce('cmUpgrades');
assert(plastic.bought === 1, 'the best upgrade is bought');
CA.Macros.set('cmUpgrades', false, { silent: true });
CA.Macros.runOnce('cmBuildings');
assert(Game.Objects.Grandma.amount === 1, 'alone, Best building buys its best');
// round to multiples: ranked by ×10, bought up to the next multiple of 10
CA.Shop.setRoundUp(true);
CA.Macros.runOnce('cmBuildings');
assert(Game.Objects.Grandma.amount === 10, `round to multiples: buys 9 to reach 10 (${Game.Objects.Grandma.amount})`);
CA.Shop.setRoundUp(false);

// can't afford: saves up, or skips (shift setting)
Game.cookies = 2000; // Kitten helpers 9000 is best, Lucky day 50 affordable but no PP
w.CookieMonsterData.Upgrades['Lucky day'] = { pp: 9000 };
assert(CA.Macros.runOnce('cmUpgrades') === 0 && !kitten.bought && !lucky.bought, 'saves up for the best by default');
CA.Macros.shiftToggle('cmUpgrades');
CA.Macros.runOnce('cmUpgrades');
assert(lucky.bought && !kitten.bought, 'skip: buys the best it can afford');
CA.Macros.shiftToggle('cmUpgrades');

// ---- the button: tinted by whether the next buy is affordable; pressing it says so
CA.Macros.setFav('cmUpgrades', true);
CA.UI.Widgets.tick();
const btn = () => doc.querySelector('#CookieMgrWidgets [data-w-trigger="cmUpgrades"]');
assert(btn().classList.contains('spell-cant') && /next: Kitten helpers — in/.test(btn().parentNode.textContent), `can’t afford yet: muted red, says what and when (${btn().parentNode.textContent})`);
g.calls.notify.length = 0;
click(w, btn());
assert(CA.Macros.isOn('cmUpgrades') && btn().classList.contains('ca-shake') && g.calls.notify.some((n) => /nothing it can do yet/.test(n.desc)), 'switching it on: shakes and says why');
CA.Macros.set('cmUpgrades', false, { silent: true });
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
CA.Macros.setParam('cheapUpgrades', 0, 'secs', 2);
CA.Macros.runOnce('cheapUpgrades');
assert(!names().includes('Pricey one'), '2s: that one too');

// ---- the dragon
w.Math.seedrandom = () => {};
w.shuffle = (a) => a.reverse(); // the save's order: teddy bear, fang, claw, scale (quarters 0–3)
Game.seed = 'abc';
Game.dragonLevel = 8;
const owned = new Set(['Pet the dragon']);
const unlocked = new Set();
Game.Has = (n) => owned.has(n);
Game.HasUnlocked = (n) => unlocked.has(n);
Game.specialTab = '';
let menuOn = 0;
Game.ToggleSpecialMenu = (on) => (menuOn = on ? 1 : 0);
let pets = 0;
const quarter = Math.floor(new Date().getMinutes() / 15);
const dueNow = ['Dragon teddy bear', 'Dragon fang', 'Dragon claw', 'Dragon scale'][quarter];
Game.ClickSpecialPic = () => {
  pets++;
  if (Game.specialTab === 'dragon' && pets === 7) unlocked.add(dueNow); // drops on the 7th pet
};
const sched = AB.petSchedule();
assert(sched.length === 4 && sched.find((x) => x.now).name === dueNow, `knows this quarter's drop (${dueNow})`);
assert(sched.filter((x) => !x.now).every((x) => x.inSec > 0 && x.inSec < 3600), 'and when the others come');
const r = CA.Macros.runOnce('petDragon');
assert(r === 1 && unlocked.has(dueNow) && pets === 7, `pets until it drops (${pets} pets)`);
assert(menuOn === 0 && Game.specialTab === '', 'closes the dragon after');
pets = 0;
CA.Macros.runOnce('petDragon');
assert(pets === 0, 'nothing due this quarter any more: leaves it alone');
assert(/in \d/.test(CA.Actions.get('dragon.pet').ready({}).text), 'says when the next one comes');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
