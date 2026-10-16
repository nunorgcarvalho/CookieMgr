// The real Cookie Clicker, headless: the game's own scripts (sim/.game/, see fetch.mjs) run in a
// Node vm context that looks enough like a browser page — a do-nothing DOM (dom.mjs), virtual time
// (clock.mjs) and a seeded Math.random (rng.mjs). Nothing is re-implemented: cookies, CpS, upgrades,
// golden cookies, buffs, the minigames are the game's code, so what happens here is what happens in
// the game. Only Game.Logic runs (one call per frame, as Game.Loop does); nothing is ever drawn.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ensureGame, GAME_VERSION } from './fetch.mjs';
import { makeClock } from './clock.mjs';
import { makeDom } from './dom.mjs';
import { makeRng } from './rng.mjs';

/**
 * Boots the game. Options:
 *   seed     Math.random's seed (same seed + same actions → same game)
 *   fps      logic frames per simulated second (the game's 30 — fewer is faster, and the game's own
 *            timers are in frames × Game.fps so they keep their length)
 *   start    the clock's start (ms since 1970) — the date matters for seasons
 *   save     a save string (Game.ExportSave()'s) to start from; none = a new game
 *   quiet    swallow the game's console.log
 * Returns { Game, ctx (the page's global), clock, run(code, name), frame(), dir }.
 */
export async function bootGame({ seed = 1, fps = 30, start, save = null, quiet = true } = {}) {
  const dir = await ensureGame({ quiet: true });
  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  const clock = makeClock(start);
  const rng = makeRng(seed);
  let context = null;
  const run = (code, filename) => vm.runInContext(code, context, { filename });
  const { document, sink } = makeDom({
    onScript(src) {
      const file = src.split('?')[0].replace(/^.*cookieclicker\//, '').replace(/^\.?\//, '');
      const local = [file, path.basename(file), path.join('mods', path.basename(file))].find((f) => fs.existsSync(path.join(dir, f)));
      if (!local) return false;
      run(read(local), local);
      return true;
    },
  });
  const store = new Map();
  const localStorage = {
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: (k) => store.delete(String(k)),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  const noop = () => {};
  // an image "loads" as soon as it's given a source (the game waits for its pictures)
  class Image {
    constructor() {
      this.width = 48;
      this.height = 48;
      this._src = '';
    }
    get src() {
      return this._src;
    }
    set src(v) {
      this._src = String(v);
      clock.setTimeout(() => typeof this.onload === 'function' && this.onload({ target: this }), 0);
    }
  }
  class XMLHttpRequest {
    open() {}
    send() {}
    setRequestHeader() {}
    abort() {}
  }
  const page = {
    document,
    localStorage,
    sessionStorage: localStorage,
    navigator: { userAgent: 'Mozilla/5.0 (CookieMgr simulator)', platform: 'sim', language: 'en-US', languages: ['en-US'] },
    location: { href: 'https://orteil.dashnet.org/cookieclicker/', pathname: '/cookieclicker/', protocol: 'https:', host: 'orteil.dashnet.org', hostname: 'orteil.dashnet.org', search: '', hash: '', origin: 'https://orteil.dashnet.org', reload: noop },
    Date: clock.Date,
    setTimeout: clock.setTimeout,
    setInterval: clock.setInterval,
    clearTimeout: clock.clearTimeout,
    clearInterval: clock.clearInterval,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: noop,
    performance: { now: () => clock.now - clock.start },
    getComputedStyle: () => sink(),
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => true,
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    scrollTo: noop,
    open: noop,
    alert: noop,
    confirm: () => true,
    prompt: () => null,
    Image,
    Audio: function () {
      return sink();
    },
    XMLHttpRequest,
    // DOM classes the game extends or checks against
    Element: function Element() {},
    HTMLElement: function HTMLElement() {},
    HTMLCanvasElement: function HTMLCanvasElement() {},
    CanvasRenderingContext2D: function CanvasRenderingContext2D() {},
    Node: function Node() {},
    Event: function Event() {},
    CustomEvent: function CustomEvent() {},
    MouseEvent: function MouseEvent() {},
    KeyboardEvent: function KeyboardEvent() {},
    MutationObserver: class MutationObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
    ResizeObserver: class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    URL,
    URLSearchParams,
    btoa,
    atob,
    TextEncoder,
    TextDecoder,
    console: quiet ? { log: noop, info: noop, warn: noop, error: (...a) => console.error('[game]', ...a), debug: noop, trace: noop, table: noop, time: noop, timeEnd: noop } : console,
    // index.html's globals
    VERSION: Number(GAME_VERSION),
    BETA: 0,
    SAVESUFFIX: '',
    App: 0,
    LOCAL: false,
  };
  context = vm.createContext(page);
  page.window = context;
  page.self = context;
  page.top = context;
  page.parent = context;
  page.globalThis = context;
  context.__simRandom = rng;
  run('Math.random = __simRandom;', 'sim:rng');

  // as index.html, then window.onload's launch steps, without the image loader
  run(read('main.js'), 'main.js');
  // The game swaps Math.random for a seeded one for what must be repeatable (a golden cookie's or
  // Force the Hand of Fate's outcome comes from Game.seed — that's real game behaviour, kept), then
  // calls Math.seedrandom() to go back to "random" — reseeded from the clock. Here that means
  // back to the simulation's own seeded generator, so a run depends on its seed.
  run(
    `(function () {
       var seeded = Math.seedrandom;
       Math.seedrandom = function (seed) {
         if (!arguments.length) { Math.random = __simRandom; return ''; }
         return seeded.apply(this, arguments);
       };
     })();`,
    'sim:seedrandom'
  );
  run(read('loc/EN.js'), 'loc/EN.js');
  run(
    `locStringsFallback = locStrings;
     Game.mods = {}; Game.sortedMods = []; Game.brokenMods = []; Game.modSaveData = {}; Game.modHooks = {};
     for (var i = 0; i < Game.modHooksNames.length; i++) Game.modHooks[Game.modHooksNames[i]] = [];
     Game.Launch();`,
    'sim:launch'
  );
  const Game = context.Game;
  Game.Loop = noop; // the simulator calls Game.Logic itself
  Game.fps = fps;
  run("Game.Loader = new Loader(); Game.Loader.domain = Game.resPath + 'img/';", 'sim:loader');
  Game.Init();
  // a save (Options → Export save, mods' data included) loads as the game loads an import
  if (save) Game.LoadSave(String(save).trim());
  Game.Loop = noop;
  Game.Draw = noop;
  Game.visible = false;
  Game.prefs.timeout = 0;
  // eye candy, which nothing reads back: particles, floating text, sparkles
  const particle = { x: 0, y: 0, xd: 0, yd: 0, life: -1, dur: 1, z: 0, size: 1, text: '', pic: '' };
  Game.particleAdd = () => particle;
  Game.particlesUpdate = noop;
  if (Game.textParticlesAdd) Game.textParticlesAdd = () => particle;
  if (Game.textParticlesUpdate) Game.textParticlesUpdate = noop;
  Game.SparkleAt = noop;
  clock.runUntil(clock.now + 100); // the minigames load on a short timer

  // The one piece of bookkeeping the game does while drawing (Game.Draw, every 5 frames): a
  // building unlocks in the store once you've baked its base price (and "Cookie Clicker" is won
  // with the last one) — the same rule, without the drawing.
  let drawT = 0;
  const syncStore = () => {
    for (const me of Game.ObjectsById) {
      if (Game.cookiesEarned >= me.basePrice || me.bought > 0) {
        me.locked = 0;
        if (me.id == 19) Game.Win('Cookie Clicker');
      } else me.locked = 1;
    }
  };
  const frame = () => {
    clock.runUntil(clock.now + 1000 / Game.fps);
    Game.Logic();
    if (drawT++ % 5 === 0) syncStore();
  };
  return { Game, ctx: context, clock, run, frame, dir, version: GAME_VERSION };
}
