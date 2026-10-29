// Seasons and the Grandmapocalypse, for flows: what each season has to collect, conditions for
// "season is on" / "season is complete" / "research is done", actions to buy a season's drops,
// upgrade Santa and leave the Grandmapocalypse — and the built-in **SeasonCompletion** flow.
//
// A season is complete (main.js lists) when you own:
//   christmas   A festive hat, every Santa gift (santaDrops), every reindeer cookie (reindeerDrops),
//               and Santa is at his last level (14)
//   halloween   every Halloween cookie (halloweenDrops — from popping wrinklers)
//   easter      every egg (easterEggs — from golden and wrath cookies)
//   valentines  every heart biscuit (heartDrops)
//   fools       nothing to collect (Business day): always complete
//
// Leaving the Grandmapocalypse: the Elder Pledge appears after the Elder Pact; buying one unlocks
// the Elder Covenant, which ends it for good (−5% CpS). "pledge" keeps re-buying the Pledge instead.
//
// **Plain Business Day** (option): Business day without its look. The game checks
// Game.season === 'fools' for it in a handful of its own functions (main.js): each building's store
// row and tooltip (business names, descriptions and icons), the golden cookie's picture and pulse,
// the falling dollars, the news ticker, the money background — and the tab title ("Cookie Baker").
// Those run as if no season were on; everything that counts (golden cookie timing, Everything must
// go, Startrade, the season itself) still sees Business day. Switching it re-skins the golden cookies
// already on screen, and the Stats menu drops its two business lines (cookie dollars, TV seasons).

CA.Seasons = (() => {
  const SEASONS = [
    { v: 'christmas', label: 'Christmas' },
    { v: 'easter', label: 'Easter' },
    { v: 'halloween', label: 'Halloween' },
    { v: 'valentines', label: 'Valentine’s day' },
    { v: 'fools', label: 'Business day' },
  ];
  const label = (s) => (SEASONS.find((x) => x.v === s) || { label: s }).label;

  /**
   * The upgrades a season has you collect (the game's own lists). part: 'all', 'upgrades' or
   * 'cookies' — Christmas has both (A festive hat + Santa's gifts are upgrades, the reindeer drops
   * are cookies); every other season's drops are all cookies.
   */
  function dropsOf(s, part = 'all') {
    if (s === 'christmas') {
      const ups = ['A festive hat'].concat(Game.santaDrops || []);
      const cookies = (Game.reindeerDrops || []).slice();
      return part === 'upgrades' ? ups : part === 'cookies' ? cookies : ups.concat(cookies);
    }
    if (part === 'upgrades') return [];
    if (s === 'halloween') return (Game.halloweenDrops || []).slice();
    if (s === 'easter') return (Game.easterEggs || []).slice();
    if (s === 'valentines') return (Game.heartDrops || []).slice();
    return [];
  }
  const has = (n) => CA.Util.has(n);

  function complete(s, part = 'all') {
    if (s === 'christmas' && part !== 'cookies' && (Game.santaLevel || 0) < 14) return false;
    return dropsOf(s, part).every(has);
  }
  /** "5 / 21" — how far a season is. */
  function progress(s, part = 'all') {
    const drops = dropsOf(s, part);
    return { have: drops.filter(has).length, of: drops.length };
  }
  /** The drops of a season still to get, in the game's order. */
  const missing = (s, part = 'all') => dropsOf(s, part).filter((n) => !has(n));

  /** Buys every one of a season's drops that's in the store and affordable. Returns how many. */
  function buyDrops(s, part = 'all') {
    let n = 0;
    dropsOf(s, part).forEach((name) => {
      const u = Game.Upgrades && Game.Upgrades[name];
      if (!u || u.bought || !u.unlocked) return;
      const price = typeof u.getPrice === 'function' ? u.getPrice() : u.basePrice || 0;
      if (Game.cookies < price) return;
      u.buy(1);
      if (u.bought) n++;
    });
    return n;
  }

  function upgradeSanta() {
    if (Game.season !== 'christmas' || !has('A festive hat') || (Game.santaLevel || 0) >= 14 || typeof Game.UpgradeSanta !== 'function') return 0;
    const cost = Math.pow((Game.santaLevel || 0) + 1, (Game.santaLevel || 0) + 1);
    if (Game.cookies <= cost) return 0;
    const before = Game.santaLevel;
    const prevTab = Game.specialTab;
    Game.UpgradeSanta();
    // the game redraws the Santa/dragon menu after a level whatever is open: with none, that puts up an
    // empty one whose × does nothing (its close only acts while a tab is set), so close it again
    if (!prevTab && typeof Game.ToggleSpecialMenu === 'function') {
      Game.specialTab = 'santa';
      Game.ToggleSpecialMenu(0);
    }
    return Game.santaLevel > before ? 1 : 0;
  }

  /** One step towards leaving the Grandmapocalypse: Pledge (to unlock the Covenant), then Covenant. */
  function exitGrandmapocalypse(how) {
    if (how === 'none') return 0;
    const U = Game.Upgrades || {};
    const buy = (name) => {
      const u = U[name];
      if (!u || u.bought || !u.unlocked) return 0;
      const price = typeof u.getPrice === 'function' ? u.getPrice() : u.basePrice || 0;
      if (Game.cookies < price) return 0;
      u.buy(1);
      return u.bought ? 1 : 0;
    };
    if (how !== 'pledge' && has('Elder Covenant')) return 0;
    if (how !== 'pledge' && buy('Elder Covenant')) return 1;
    if (!Game.elderWrath) return 0;
    return buy('Elder Pledge');
  }

  const researchDone = () => CA.AutoBuy.RESEARCH.every(has);

  // ---- the SeasonCompletion flow ------------------------------------------------------------

  /** SeasonCompletion's code (an algorithmic macro — features/script.js). */
  const DEFAULT_SOURCE = "# SeasonCompletion — each season in turn until its drops are in, buying them as they unlock:\n# Christmas's upgrades (Santa's gifts — the Santa macro levels Santa up), Easter (eggs, from golden\n# cookies), Halloween (cookies, from wrinklers that have eaten, in the Grandmapocalypse), Valentine's\n# day, Christmas again for the reindeer cookies, then `then` for good (none: leaves it be).\n# It only does the seasons: what drops them (shimmers, wrinklers, research, the dragon, the Pantheon)\n# is up to the other macros — a manager (Nunix late game) switches them.\nforever:\n  if not season.complete(christmas, upgrades):\n    season.keep(christmas)\n    season.buyDrops(christmas, upgrades)\n  elif not season.complete(easter):\n    season.keep(easter)\n    season.buyDrops(easter, all)\n  elif not season.complete(halloween):\n    season.keep(halloween)\n    season.buyDrops(halloween, all)\n  elif not season.complete(valentines):\n    season.keep(valentines)\n    season.buyDrops(valentines, all)\n  elif not season.complete(christmas, cookies):\n    season.keep(christmas)\n    season.buyDrops(christmas, cookies)\n  elif then != \"none\":\n    season.keep(then)\n";

  // ---- Plain Business Day ----------------------------------------------------------------------

  const plain = () => !!CA.Settings.get('foolsPlain') && Game.season === 'fools';
  /** fn, run as if no season were on while Plain Business Day applies. */
  function unfooled(fn) {
    const wrapped = function () {
      if (!plain()) return fn.apply(this, arguments);
      const was = Game.season;
      Game.season = '';
      try {
        return fn.apply(this, arguments);
      } finally {
        Game.season = was;
      }
    };
    wrapped.__caPlain = true;
    return wrapped;
  }
  const wrapIn = (obj, keys) => obj && keys.forEach((k) => typeof obj[k] === 'function' && !obj[k].__caPlain && (obj[k] = unfooled(obj[k])));
  /** The game's look-only functions, wrapped (once; again for anything new). */
  function wrapLook() {
    Object.values(Game.Objects || {}).forEach((o) => wrapIn(o, ['rebuild', 'tooltip']));
    wrapIn(Game.shimmerTypes && Game.shimmerTypes.golden, ['initFunc', 'updateFunc']);
    wrapIn(Game, ['particleAdd', 'getNewTicker', 'DrawBackground']);
  }
  /** The tab title: "Cookie Baker" back to "Cookie Clicker" (the game sets it in its main loop). */
  function fixTitle() {
    if (plain() && / - Cookie Baker$/.test(document.title)) document.title = document.title.replace(/ - Cookie Baker$/, ' - Cookie Clicker');
  }
  /** The Stats menu's business lines ("cookie dollars", "TV show seasons produced"), gone. */
  function plainStats() {
    if (!plain() || Game.onMenu !== 'stats') return;
    document.querySelectorAll('#menu .listing').forEach((el) => {
      if (/cookie dollars$|^TV show seasons produced/.test(el.textContent.trim())) el.remove();
    });
  }
  function wrapMenu() {
    const fn = Game.UpdateMenu;
    if (typeof fn !== 'function' || fn.__caPlainStats) return;
    Game.UpdateMenu = function () {
      const r = fn.apply(this, arguments);
      plainStats();
      return r;
    };
    Game.UpdateMenu.__caPlainStats = true;
  }
  /** The golden cookies on screen, in the look that applies now (they pick it when they spawn). */
  function reskinGolden() {
    if (Game.season !== 'fools') return;
    (Game.shimmers || []).forEach((me) => {
      if (me.type !== 'golden' || !me.l || !me.l.style) return;
      const size = plain() ? 96 : 128;
      const pic = plain() ? (me.wrath ? 'wrathCookie.png' : 'goldCookie.png') : 'spamCookies.gif';
      const x = plain() ? 0 : Math.floor(Math.random() * 4);
      me.l.style.width = me.l.style.height = size + 'px';
      me.l.style.backgroundImage = `url(${Game.resPath}img/${pic})`;
      me.l.style.backgroundPosition = `${-x * size}px ${plain() ? 0 : -(me.wrath ? 1 : 0) * size}px`;
    });
  }
  /** Redraws what shows the look now: the store's building rows (and its next refresh). */
  function redrawLook() {
    Object.values(Game.Objects || {}).forEach((o) => {
      try {
        if (typeof o.rebuild === 'function') o.rebuild();
      } catch (e) {
        /* a row the game hasn't built yet */
      }
    });
    Game.storeToRefresh = 1;
    reskinGolden();
    if (Game.onMenu === 'stats' && typeof Game.UpdateMenu === 'function') Game.UpdateMenu();
    fixTitle();
  }

  function init() {
    CA.Settings.defineOption({
      key: 'foolsPlain',
      group: 'misc',
      icon: 'calendar',
      name: 'Plain Business Day',
      desc: 'Turns off Business day’s corporate theme: the normal building names, descriptions and icons, golden cookies, background, news and title. The season and its effects stay.',
      default: false,
    });
    wrapLook();
    wrapMenu();
    CA.Events.on('settings', (key) => {
      if (key !== 'foolsPlain' && key != null) return;
      wrapLook();
      wrapMenu();
      redrawLook();
    });
    // the title changes (and the <title> itself may come later): watch the head
    const head = document.head || document.documentElement;
    if (head && typeof MutationObserver === 'function') new MutationObserver(fixTitle).observe(head, { childList: true, characterData: true, subtree: true });
    const A = CA.Actions.register;
    const C = CA.Conditions.register;
    const seasonParam = { key: 'season', label: 'Season', type: 'select', default: 'christmas', options: () => SEASONS };
    C({
      id: 'season.is',
      name: 'A season is on',
      icon: 'calendar',
      params: [seasonParam],
      describe: (p) => `${label(p.season)} is on`,
      test: (p) => Game.season === p.season,
    });
    const partParam = {
      key: 'part',
      label: 'Which',
      type: 'select',
      default: 'all',
      options: () => [
        { v: 'all', label: 'everything' },
        { v: 'upgrades', label: 'its upgrades (Christmas: the hat, Santa’s gifts, Final Claus)' },
        { v: 'cookies', label: 'its cookies' },
      ],
    };
    C({
      id: 'season.complete',
      name: 'A season is complete (all its drops owned)',
      icon: 'calendar',
      params: [seasonParam, partParam],
      describe: (p) => {
        const pr = progress(p.season, p.part);
        return `${label(p.season)}${p.part && p.part !== 'all' ? ` ${p.part}` : ''} complete (${pr.have}/${pr.of})`;
      },
      test: (p) => complete(p.season, p.part),
    });
    C({
      id: 'research.done',
      name: 'All research is bought',
      icon: 'sparkle',
      describe: () => 'all research is bought',
      test: researchDone,
    });
    C({
      id: 'grandmapocalypse',
      name: 'The Grandmapocalypse is on',
      icon: 'wrinkler',
      describe: () => 'the Grandmapocalypse is on',
      test: () => (Game.elderWrath || 0) > 0,
    });
    A({
      id: 'season.buyDrops',
      name: 'Buy a season’s drops',
      icon: 'calendar',
      group: 'Other',
      unit: 'bought',
      params: [seasonParam, partParam],
      describe: (p) => `Buy ${label(p.season)}’s ${p.part === 'upgrades' ? 'upgrades' : p.part === 'cookies' ? 'cookies' : 'drops'}`,
      run: (p) => buyDrops(p.season, p.part),
    });
    A({
      id: 'santa.upgrade',
      name: 'Upgrade Santa',
      icon: 'star',
      group: 'Other',
      unit: 'levels',
      run: () => upgradeSanta(),
    });
    A({
      id: 'grandma.exit',
      name: 'Leave the Grandmapocalypse',
      icon: 'wrinkler',
      group: 'Other',
      unit: 'bought',
      params: [
        {
          key: 'how',
          label: 'How',
          type: 'select',
          default: 'covenant',
          options: () => [
            { v: 'covenant', label: 'Elder Covenant (for good, −5% CpS)' },
            { v: 'pledge', label: 'keep buying the Elder Pledge' },
            { v: 'none', label: 'don’t' },
          ],
        },
      ],
      describe: (p) => (p.how === 'pledge' ? 'Keep the elders pledged' : p.how === 'none' ? 'Stay in the Grandmapocalypse' : 'Leave the Grandmapocalypse (Elder Covenant)'),
      run: (p) => exitGrandmapocalypse(p.how),
    });

    CA.Macros.addBuiltin({
      id: 'seasonCompletion',
      name: 'SeasonCompletion',
      desc: 'Collects every season: keeps the next unfinished one on and buys its drops as they unlock — Christmas’s upgrades, Easter, Halloween, Valentine’s day, Christmas again for its cookies — then Business day for good. Only the seasons: what drops them (shimmers, wrinklers, research, the dragon, the Pantheon) is up to the other macros, or a manager. Its code is yours to change — “Edit its code”.',
      icon: { sprite: [16, 6] },
      mode: 'flow',
      every: 1000,
      defaultSource: DEFAULT_SOURCE,
      inputs: [{ key: 'then', label: 'Then, for good', type: 'select', default: 'fools', options: () => SEASONS.concat({ v: 'none', label: 'leave it be' }) }],
      section: 'upkeep',
    });
    CA.Macros.addBuiltin({
      id: 'santa',
      name: 'Santa',
      desc: 'Levels Santa up during Christmas whenever you can afford it, all the way to Final Claus (needs A festive hat).',
      icon: { sprite: [19, 9] },
      mode: 'flow',
      every: 1000,
      defaultSource: '# Level Santa up during Christmas whenever it’s affordable, up to Final Claus (level 14).\nforever:\n  if santaLevel() < 14:\n    santa.upgrade()\n',
      section: 'upkeep',
    });
  }

  return { init, SEASONS, dropsOf, complete, progress, missing, DEFAULT_SOURCE };
})();
