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

  /** The upgrades a season has you collect (the game's own lists). */
  function dropsOf(s) {
    if (s === 'christmas') return ['A festive hat'].concat(Game.santaDrops || [], Game.reindeerDrops || []);
    if (s === 'halloween') return (Game.halloweenDrops || []).slice();
    if (s === 'easter') return (Game.easterEggs || []).slice();
    if (s === 'valentines') return (Game.heartDrops || []).slice();
    return [];
  }
  const has = (n) => typeof Game.Has === 'function' && Game.Has(n);

  function complete(s) {
    const drops = dropsOf(s);
    if (s === 'christmas' && (Game.santaLevel || 0) < 14) return false;
    return drops.every(has);
  }
  /** "5 / 21" — how far a season is. */
  function progress(s) {
    const drops = dropsOf(s);
    return { have: drops.filter(has).length, of: drops.length };
  }

  /** Buys every one of a season's drops that's in the store and affordable. Returns how many. */
  function buyDrops(s) {
    let n = 0;
    dropsOf(s).forEach((name) => {
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
    C({
      id: 'season.complete',
      name: 'A season is complete (all its drops owned)',
      icon: 'calendar',
      params: [seasonParam],
      describe: (p) => `${label(p.season)} is complete`,
      test: (p) => complete(p.season),
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
      params: [seasonParam],
      describe: (p) => `Buy ${label(p.season)}’s drops`,
      run: (p) => buyDrops(p.season),
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
      desc: 'An agent that collects every season: starts the research (and the Grandmapocalypse) right away, then goes through the seasons in your order, keeping each one on — and its drops collected and bought — until it’s complete, and stays on the last one, leaving the Grandmapocalypse. Duplicate it to change the flow itself.',
      icon: { sprite: [16, 6] },
      mode: 'flow',
      every: 1000,
      makeFlow,
      flowOptions: [
        { key: 'order', label: 'Seasons, in order (the last one is kept)', type: 'order', default: DEFAULT_ORDER, options: () => SEASONS },
        {
          key: 'exit',
          label: 'At the last season',
          type: 'select',
          default: 'pledge',
          options: () => [
            { v: 'covenant', label: 'leave the Grandmapocalypse for good' },
            { v: 'pledge', label: 'keep the elders pledged' },
            { v: 'none', label: 'stay in the Grandmapocalypse' },
          ],
        },
      ],
      section: 'upkeep',
    });
  }

  return { init, SEASONS, dropsOf, complete, progress, makeFlow, DEFAULT_ORDER };
})();
