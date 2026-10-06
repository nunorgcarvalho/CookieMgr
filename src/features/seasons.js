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
  const has = (n) => typeof Game.Has === 'function' && Game.Has(n);

  function complete(s, part = 'all') {
    if (s === 'christmas' && part !== 'cookies' && (Game.santaLevel || 0) < 14) return false;
    return dropsOf(s, part).every(has);
  }
  /** "5 / 21" — how far a season is. */
  function progress(s, part = 'all') {
    const drops = dropsOf(s, part);
    return { have: drops.filter(has).length, of: drops.length };
  }

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
    Game.UpgradeSanta();
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

  // what to switch on in each season so its drops get collected
  const HELPERS = { christmas: ['reindeer'], halloween: ['wrinklers'], easter: ['golden', 'wrath'], valentines: [] };
  const DEFAULT_ORDER = ['christmas', 'easter', 'halloween', 'valentines', 'fools'];

  /** SeasonCompletion's code (an algorithmic macro — features/script.js). */
  const DEFAULT_SOURCE = "# SeasonCompletion — every season's cookies and upgrades, one season after another.\n# The research starts right away, alongside: One mind starts the Grandmapocalypse,\n# and Halloween's cookies come from popping wrinklers.\nparallel:\n  branch research:\n    repeat until researchOwned() >= 9:\n      buy.research(none)\n  branch seasons:\n    # Christmas, first visit: Santa's upgrades, and Santa all the way to Final Claus\n    # (its reindeer cookies wait for a second visit, near the end)\n    switch on reindeer\n    repeat until owned(christmas, upgrades) >= total(christmas, upgrades) and santaLevel() >= 14:\n      season.keep(christmas)\n      season.buyDrops(christmas, upgrades)\n      santa.upgrade()\n    for season in [easter, halloween, valentines]:\n      if season == easter:\n        # eggs drop from golden and wrath cookies\n        switch on golden\n        switch on wrath\n      elif season == halloween:\n        # Halloween cookies drop from wrinklers that have eaten\n        switch on wrinklers\n      repeat until owned(season, all) >= total(season, all):\n        season.keep(season)\n        season.buyDrops(season, all)\n    # Christmas again, for the reindeer cookies — they don't need wrinklers, so the\n    # Grandmapocalypse can end here\n    repeat until owned(christmas, cookies) >= total(christmas, cookies):\n      season.keep(christmas)\n      season.buyDrops(christmas, cookies)\n      grandma.exit(pledge)\n    # and Business day for good, with the elders kept pledged\n    forever:\n      season.keep(fools)\n      grandma.exit(pledge)\n";

  const cond = (id, params) => ({ all: [{ cond: id, params, not: false }] });
  const doIt = (action, params) => ({ type: 'do', action, params });

  /** The flow for an order of seasons: research alongside; each season until complete; the last held, then out of the Grandmapocalypse. */
  function makeFlow(opts) {
    const order = (Array.isArray(opts.order) && opts.order.length ? opts.order : DEFAULT_ORDER).filter((s) => SEASONS.some((x) => x.v === s));
    const exit = opts.exit || 'pledge';
    const seasonsBranch = [];
    order.forEach((s, i) => {
      (HELPERS[s] || []).forEach((m) => seasonsBranch.push(doIt('macro.set', { macro: m, to: 'on' })));
      if (i < order.length - 1) {
        const body = [doIt('season.keep', { season: s }), doIt('season.buyDrops', { season: s })];
        if (s === 'christmas') body.push(doIt('santa.upgrade', {}));
        seasonsBranch.push({ type: 'until', cond: cond('season.complete', { season: s }), body });
      } else {
        // the last season: stay there for good, and leave the Grandmapocalypse
        seasonsBranch.push({ type: 'forever', body: [doIt('season.keep', { season: s }), doIt('season.buyDrops', { season: s }), doIt('grandma.exit', { how: exit })] });
      }
    });
    return [
      {
        type: 'parallel',
        branches: [[{ type: 'until', cond: cond('research.done', {}), body: [doIt('buy.research', { stopBefore: 'none' })] }], seasonsBranch],
      },
    ];
  }

  function init() {
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
      desc: 'An algorithmic macro that collects every season: research (and the Grandmapocalypse) right away, then Christmas’s upgrades and Final Claus, Easter, Halloween and Valentine’s day until each is complete, Christmas again for its cookies, and Business day for good, the elders kept pledged. Its code is yours to change — “Edit its code”.',
      icon: { sprite: [16, 6] },
      mode: 'flow',
      every: 1000,
      defaultSource: DEFAULT_SOURCE,
      section: 'upkeep',
    });
  }

  return { init, SEASONS, dropsOf, complete, progress, makeFlow, DEFAULT_ORDER, DEFAULT_SOURCE };
})();
