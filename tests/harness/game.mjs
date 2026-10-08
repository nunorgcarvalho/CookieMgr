// A fake Cookie Clicker for end-to-end testing the built CookieMgr bundle in jsdom.
// Mirrors only the game APIs CookieMgr actually touches, with the same contracts as the real
// game (verified against orteil.dashnet.org/cookieclicker/main.js + minigame*.js):
//   - Game.registerMod(id, mod): mod.init() then mod.load(savedStr) synchronously
//   - Game.ShowMenu(id) toggles Game.onMenu and calls Game.UpdateMenu()
//   - Bank minigame buyGood/sellGood(id, n), n=10000 meaning "max"
//   - Grimoire castSpell(spell), magic/magicM, spellsById, getSpellCost(spell)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

export const BUNDLE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist/CookieMgr.js');

function canvasStub() {
  const noop = () => {};
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'measureText') return (s) => ({ width: String(s).length * 6 });
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop: noop });
        if (prop === 'getImageData') return () => ({ data: [] });
        return noop;
      },
      set: () => true,
    }
  );
}

/** `idb`: an IDBFactory (fake-indexeddb) shared across boots to test persistence; omit for none. */
export function boot({ save = null, localStorageSeed = {}, withGrimoire = true, idb = null, fullDate = 1700000000000, withPantheon = false } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(String(e && (e.stack || e.message || e))));
  vc.on('error', (...a) => errors.push(a.map(String).join(' ')));
  const goods = ['Cereals', 'Chocolate', 'Butter', 'Sugar', 'Nuts'].map((name, id) => ({
    id,
    name,
    symbol: ['CRL', 'CHC', 'BTR', 'SUG', 'NUT'][id], // as in minigameMarket.js
    val: 10 + id * 5,
    stock: 0,
    mode: id % 6,
    active: true,
    last: 0,
  }));
  const html =
    '<!doctype html><html><body><div id="game">' +
    '<div id="sectionLeft"><div id="cookies">0 cookies</div><div id="cookieAnchor"></div></div>' +
    '<div id="menu"></div><div id="buffs"></div>' +
    '<div id="bankHeader"></div><div id="bankGoods">' +
    goods.map((g) => `<div class="bankGood" id="bankGood-${g.id}"></div>`).join('') +
    '</div><div id="grimoireSpells"></div><div id="grimoireBar"></div><div id="grimoireInfo"></div></div></body></html>';
  const dom = new JSDOM(html, { url: 'https://orteil.dashnet.org/cookieclicker/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = function () {
    return this.__ctx || (this.__ctx = canvasStub());
  };
  // jsdom has no layout: give canvases a real-looking size so charts actually draw
  Object.defineProperty(w.HTMLCanvasElement.prototype, 'clientWidth', { get: () => 640 });
  Object.defineProperty(w.HTMLCanvasElement.prototype, 'clientHeight', { get: () => 220 });
  Object.entries(localStorageSeed).forEach(([k, v]) => w.localStorage.setItem(k, v));
  if (idb) {
    w.indexedDB = idb.factory;
    w.IDBKeyRange = idb.IDBKeyRange;
  }

  const calls = { loadMod: [], notify: [], sounds: [], spells: [] };
  const M = {
    goodsById: goods,
    // like minigameMarket.js: M.ticks counts market ticks; M.tickT counts frames toward the next
    ticks: 0,
    tickT: 0,
    secondsPerTick: 60,
    // like minigameMarket.js: cost = price × cookiesPsRawHighest × broker overhead (1 + 20% × 0.95^brokers)
    brokers: 0,
    // like minigameMarket.js: at most the highest grandma count / 10 + the grandma level; 20 min of raw CpS each
    getMaxBrokers: () => Math.ceil((Game.Objects.Grandma.highest || 0) / 10 + (Game.Objects.Grandma.level || 0)),
    getBrokerPrice: () => Game.cookiesPsRawHighest * 60 * 20,
    buyGood(id, n) {
      const g = goods[id];
      const cost = g.val * Game.cookiesPsRawHighest * (1 + 0.01 * (20 * Math.pow(0.95, M.brokers)));
      if (n === 10000) n = Math.min(50, Math.floor(Game.cookies / cost));
      if (n <= 0 || Game.cookies < cost * n) return false;
      g.stock += n;
      Game.cookies -= cost * n;
      return true;
    },
    sellGood(id, n) {
      const g = goods[id];
      if (n === 10000) n = g.stock;
      if (!n) return false;
      g.stock -= n;
      Game.cookies += n * g.val * Game.cookiesPsRawHighest;
      return true;
    },
  };
  // like main.js: switchMinigame(on) flips onMinigame (and does nothing without a minigame)
  function withMinigame(b) {
    b.onMinigame = 0;
    b.switchMinigame = function (on) {
      if (!this.minigame) on = false;
      if (on === -1) on = !this.onMinigame;
      this.onMinigame = on ? 1 : 0;
    };
    return b;
  }
  // like minigamePantheon.js: slot[0..2] = god ids (-1 empty), swaps left, swapT = last swap
  const P = {
    slot: [0, 2, -1],
    swaps: 1,
    swapT: Date.now() - 3600 * 1000,
    gods: {
      asceticism: { id: 0, slot: 0, name: 'Holobore, Spirit of Asceticism', icon: [21, 18] },
      decadence: { id: 1, slot: -1, name: 'Vomitrax, Spirit of Decadence', icon: [22, 18] },
      ruin: { id: 2, slot: 1, name: 'Godzamok, Spirit of Ruin', icon: [23, 18] },
    },
    // as in minigamePantheon.js
    useSwap(n) {
      P.swapT = Date.now();
      P.swaps -= n;
      if (P.swaps < 0) P.swaps = 0;
    },
    slotGod(god, slot) {
      if (slot == god.slot) return false;
      if (slot != -1 && P.slot[slot] != -1) {
        P.godsById[P.slot[slot]].slot = god.slot; // swap
        if (god.slot != -1) P.slot[god.slot] = P.slot[slot];
      } else if (god.slot != -1) P.slot[god.slot] = -1;
      if (slot != -1) P.slot[slot] = god.id;
      god.slot = slot;
    },
  };
  P.godsById = Object.values(P.gods);
  // like minigameGarden.js: M.plot[y][x] = [plant id + 1, age]; stages at ⅓, ⅔, 1 × mature
  const garden = {
    plot: [
      [[1, 5], [1, 40], [0, 0]],
      [[2, 70], [2, 100], [1, 10]],
    ],
    plantsById: [{ mature: 60 }, { mature: 80 }],
    nextStep: Date.now() + 30000,
    stepT: 180,
  };

  // like main.js: buy/sell are defined per building instance (Game.Spend; selling refunds into the bank)
  function building(name, plural, price) {
    const b = { name, dname: name, plural, amount: 0, level: 0 };
    b.buy = function (n = 1) {
      for (let i = 0; i < n; i++) {
        if (Game.cookies < price) break;
        Game.cookies -= price;
        b.amount++;
        b.highest = Math.max(b.highest || 0, b.amount);
      }
    };
    b.sell = function (n = 1) {
      for (let i = 0; i < n && b.amount > 0; i++) {
        Game.cookies += price / 4;
        b.amount--;
      }
    };
    return b;
  }
  // like main.js: Game.Upgrade, with buy() on the prototype
  function Upgrade(name, price) {
    this.name = name;
    this.dname = name;
    this.price = price;
    this.bought = 0;
  }
  Upgrade.prototype.buy = function () {
    if (this.bought || Game.cookies < this.price) return 0;
    Game.cookies -= this.price;
    this.bought = 1;
    return 1;
  };

  // keys / costs / icons as in minigameGrimoire.js (a subset of the nine spells)
  const spells = {
    'conjure baked goods': { name: 'Conjure Baked Goods', icon: [21, 11], costMin: 2, costPercent: 0.4, win() {}, fail() {} },
    'hand of fate': { name: 'Force the Hand of Fate', icon: [22, 11], costMin: 10, costPercent: 0.6, win() {}, fail() {} },
    'stretch time': { name: 'Stretch Time', icon: [23, 11], costMin: 8, costPercent: 0.2, win() {}, fail() {} },
  };
  const G = {
    goodsById: null,
    spells,
    spellsById: Object.values(spells).map((s, i) => Object.assign(s, { id: i })),
    magic: 80,
    magicM: 100,
    spellsCast: 0,
    spellsCastTotal: 0,
    forceFail: false,
    getSpellCost(spell) {
      return Math.floor(spell.costMin + spell.costPercent * this.magicM);
    },
    getFailChance() {
      return 0.15;
    },
    // like the game: true when the spell went off (win or backfire), false if not enough magic
    castSpell(spell) {
      const cost = this.getSpellCost(spell);
      if (this.magic < cost) return false;
      if (this.forceFail) spell.fail();
      else spell.win();
      this.spellsCast++;
      this.spellsCastTotal++;
      this.magic -= cost;
      calls.spells.push(spell.name);
      return true;
    },
  };
  const Game = {
    ready: 0,
    fullDate,
    bakeryName: 'Test',
    mods: {},
    sortedMods: [],
    modSaveData: save ? { CookieMgr: save } : {},
    onMenu: '',
    buffs: {},
    shimmers: [],
    // like main.js: a fixed array of slots; phase 0 = empty, >0 = eating; pop pays sucked × 1.1
    wrinklers: [0, 1, 2].map((id) => ({ id, phase: 0, sucked: 0, type: 0, hp: 3 })),
    wrinklersPopped: 0,
    popWrinkler(i) {
      const me = Game.wrinklers[i];
      Game.wrinklersPopped++;
      me.phase = 0;
      me.sucked *= 1.1 * (me.type === 1 ? 3 : 1);
      Game.cookies += me.sucked;
      Game.cookiesEarned += me.sucked;
      me.sucked = 0;
    },
    lumps: 5,
    lumpCurrentType: 0,
    harvestLumps(amount) {
      Game.lumps += amount;
    },
    Achievements: { 'Wake and bake': { id: 0, name: 'Wake and bake', dname: 'Wake and bake', won: 0, icon: [0, 0] } },
    Has: () => false,
    auraMult: () => 0,
    cookies: 1e6,
    cookiesEarned: 5e6,
    cookiesReset: 1e9,
    cookiesPs: 1000,
    unbuffedCps: 1000,
    cookiesPsRawHighest: 1000,
    cpsSucked: 0,
    handmadeCookies: 0,
    prestige: 10,
    heavenlyChips: 3,
    OnAscend: 0,
    AscendTimer: 0,
    resPath: '',
    T: 0,
    fps: 30,
    HowMuchPrestige: (c) => Math.cbrt(c / 1e12),
    HowManyCookiesReset: (chips) => Math.pow(chips, 3) * 1e12,
    Objects: {
      Cursor: building('Cursor', 'Cursors', 15),
      Grandma: building('Grandma', 'Grandmas', 100),
      Farm: withMinigame({ name: 'Farm', id: 2, minigame: garden, level: 1, amount: 5 }),
      Bank: withMinigame({ name: 'Bank', id: 5, minigame: M, level: 1, amount: 10 }),
      ...(withPantheon ? { Temple: withMinigame({ name: 'Temple', id: 6, minigame: P, level: 1, amount: 10 }) } : {}),
      'Wizard tower': withMinigame(withGrimoire ? { name: 'Wizard tower', id: 7, minigame: G, level: 1, amount: 10 } : { name: 'Wizard tower', id: 7, amount: 0 }),
    },
    shimmerTypes: {
      // like the real game: a "Lucky!" payout goes through Game.Earn (bank + baked); "Ruin"
      // through Game.Spend (bank only)
      golden: {
        popFunc(me) {
          const g = (me && me.gain) || 0;
          Game.cookies += g;
          if (g > 0) Game.cookiesEarned += g;
          if (me && me.buff) Game.buffs[me.buff.name] = me.buff; // an effect pop (Frenzy, Clot…)
        },
      },
      reindeer: { popFunc() {} },
    },
    registerMod(id, mod) {
      Game.mods[id] = mod;
      Game.sortedMods.push(mod);
      mod.init();
      if (mod.load && Game.modSaveData[id]) mod.load(Game.modSaveData[id]);
    },
    WriteSave() {
      Game.sortedMods.forEach((m) => {
        if (m.save) Game.modSaveData[Object.keys(Game.mods).find((k) => Game.mods[k] === m)] = m.save();
      });
    },
    ShowMenu(what) {
      if (!what || Game.onMenu === what) Game.onMenu = '';
      else Game.onMenu = what;
      Game.UpdateMenu();
    },
    UpdateMenu() {
      w.document.getElementById('menu').innerHTML = Game.onMenu ? `<div class="vanilla">${Game.onMenu}</div>` : '';
    },
    Notify(title, desc) {
      calls.notify.push({ title, desc });
    },
    Popup() {},
    Spend(n) {
      Game.cookies -= n;
    },
    Win(what) {
      const a = Game.Achievements[what];
      if (a && !a.won) a.won = 1;
    },
    // like the game: a click is worth mouseCps() — a flat part plus 1% of the *buffed* CpS, times
    // every buff's multClick — and counts in cookieClicks
    cookieClicks: 0,
    computedMouseCps: 10,
    mouseCps() {
      let mult = 1;
      for (const i in Game.buffs) if (typeof Game.buffs[i].multClick !== 'undefined') mult *= Game.buffs[i].multClick;
      return (10 + Game.cookiesPs * 0.01) * mult;
    },
    ClickCookie() {
      Game.computedMouseCps = Game.mouseCps();
      Game.handmadeCookies += Game.computedMouseCps;
      Game.cookies += Game.computedMouseCps;
      Game.cookiesEarned += Game.computedMouseCps;
      Game.cookieClicks++;
    },
    Ascend() {},
    LoadMod(url, cb) {
      calls.loadMod.push(url);
      if (url.includes('CookieMonster')) Game.mods.CookieMonster = {};
      if (cb) cb();
    },
    hasBuff: (n) => (Game.buffs[n] && Game.buffs[n].time > 0 ? Game.buffs[n] : 0),
    Upgrade,
    // like main.js: plain objects keyed by id (not arrays), and the pools that count as owned
    UpgradesById: { 0: { pool: '' }, 1: { pool: '' }, 2: { pool: 'prestige' }, 3: { pool: 'debug' } },
    AchievementsById: { 0: { pool: 'normal' }, 1: { pool: 'normal' }, 2: { pool: 'shadow' } },
    CountsAsUpgradeOwned: (pool) => pool === '' || pool === 'cookie' || pool === 'tech',
    CountsAsAchievementOwned: (pool) => pool === 'normal',
    UpgradesByName: { 'Reinforced index finger': new Upgrade('Reinforced index finger', 1000) },
  };
  w.Game = Game;
  w.Beautify = (v, floats) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(floats == null ? 1 : floats) + 'M' : Number(v).toFixed(floats || 0));
  w.PlaySound = (s) => calls.sounds.push(s);
  w.l = (id) => w.document.getElementById(id);

  w.eval(fs.readFileSync(BUNDLE, 'utf8'));
  Game.ready = 1; // main.js polls for this every 250ms
  return { dom, window: w, Game, M, G, P, goods, calls, errors };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Waits until fn() is true (checking every `step` ms), at most `ms`; returns whether it became true.
 * For anything asynchronous (IndexedDB reads, macros stepping through passes): a fixed sleep is
 * outrun by a busy machine — CI, or the suites running side by side.
 */
export async function waitFor(fn, ms = 4000, step = 25) {
  const t0 = Date.now();
  for (;;) {
    let ok = false;
    try {
      ok = !!fn();
    } catch (e) {
      ok = false;
    }
    if (ok) return true;
    if (Date.now() - t0 >= ms) return false;
    await sleep(step);
  }
}

export function makeAssert() {
  let failed = 0;
  const assert = (cond, msg) => {
    if (!cond) {
      failed++;
      console.error('FAIL:', msg);
    } else console.log('ok:', msg);
  };
  const done = () => {
    console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
    process.exitCode = failed ? 1 : 0;
  };
  return { assert, done };
}

export function click(w, el) {
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}
