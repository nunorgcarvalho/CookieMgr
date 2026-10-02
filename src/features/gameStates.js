// The built-in states (core/states.js) — what the recorder samples every second and what the
// graphs are built from. Grouped:
//
//   CpS        cps, base (unbuffed), click (cookies/s from clicking)
//   cookies    cookies (bank), baked (this ascension), bakedAllTime, handmade
//   earnings   per-frame flows splitting "baked" by source — see attribute() below
//   bank       per-frame flows for what else moves the bank: spending, wrinkler withering, other
//   ledger     every change to the bank in seven categories, in and out separately — see ledger()
//   prestige   prestige, prestigeTotal (level if you ascended now), prestigeGain, heavenlyChips
//   stocks     portfolioValue/Cost/Realized (+ one price:<id> per stock, see features/stocks.js)
//   magic      grimoire magic, when the Wizard tower minigame is open
//
// Game facts this relies on (from the game's own source): each logic frame does
// Game.Earn(Game.cookiesPs / fps), adding to both Game.cookies and Game.cookiesEarned; wrinklers
// then dissolve cookiesPs × cpsSucked from the bank only; clicks add to handmadeCookies;
// ascending resets cookiesEarned (so a negative delta means "new run", not negative income).

CA.GameStates = (() => {
  const S = (def) => CA.States.define(def);
  const shown = () => 1 - (Game.cpsSucked || 0);
  const delta = (ctx, id) => (ctx.prev && Number.isFinite(ctx.prev[id]) && Number.isFinite(ctx.frame[id]) ? ctx.frame[id] - ctx.prev[id] : 0);
  const INCOME_TYPES = new Set(['golden', 'wrath', 'reindeer']);

  /**
   * Splits this frame's increase in cookies baked into sources, in this order (each takes at
   * most what's left, so the parts always add up to the total):
   *   click       what clicking added (handmadeCookies)
   *   golden      instant golden/wrath/reindeer payouts logged this frame, plus the extra
   *               production buffs added on top of unbuffed CpS (Frenzy & co.)
   *   production  unbuffed CpS × time
   *   other       whatever's left (wrinkler pops, sugar lumps, …)
   * Computed once per frame and cached on ctx.
   */
  // The first frame after a gap (page load, closed tab…) has nothing to compare against: its
  // flows are unknown, not zero — recording 0 would drag every average down.
  const UNKNOWN_EARN = { total: undefined, click: undefined, golden: undefined, production: undefined, other: undefined };
  const UNKNOWN_BANK = { withered: undefined, spent: undefined, otherIn: undefined };

  function attribute(ctx) {
    if (ctx._earn) return ctx._earn;
    if (!ctx.prev) return (ctx._earn = UNKNOWN_EARN);
    const total = Math.max(0, delta(ctx, 'baked'));
    let left = total;
    const take = (want) => {
      const v = Math.max(0, Math.min(left, want));
      left -= v;
      return v;
    };
    const click = take(delta(ctx, 'handmade'));
    let instant = 0;
    (ctx.events || []).forEach((e) => {
      if (INCOME_TYPES.has(e.type) && e.cookies > 0) instant += e.cookies;
    });
    const buffExtra = Math.max(0, (Game.cookiesPs || 0) - (Game.unbuffedCps || Game.cookiesPs || 0)) * ctx.dt;
    const golden = take(instant + buffExtra);
    const production = take((Game.unbuffedCps || Game.cookiesPs || 0) * ctx.dt);
    const other = left;
    ctx._earn = { total, click, golden, production, other };
    return ctx._earn;
  }

  /** What one click would be worth with no temporary effects (see clickRaw). */
  function rawPerClick() {
    if (typeof Game.mouseCps !== 'function') return undefined;
    const cps = Game.cookiesPs;
    const buffs = Game.buffs;
    try {
      Game.cookiesPs = Game.unbuffedCps || cps;
      Game.buffs = {};
      const v = Game.mouseCps();
      return Number.isFinite(v) ? v : undefined;
    } catch (e) {
      return undefined;
    } finally {
      Game.cookiesPs = cps;
      Game.buffs = buffs;
    }
  }

  /**
   * The ledger: this frame's change to the bank split into the categories the Actual CpS chart
   * shows, money in and money out kept apart (outs are positive amounts):
   *   building CpS   production; split into unboosted (unbuffed CpS) and the extra from CpS
   *                  effects (Frenzy & co.)
   *   clicking       split into unboosted (clicks × a click's no-effects worth) and the extra
   *   drops          golden / wrath cookies and reindeer: Lucky!, chains, storms… and Ruin's losses
   *   stocks         buying (out) and selling (in) stocks
   *   buildings      buying (out) and selling (in) buildings
   *   upgrades       buying upgrades (out)
   *   other          whatever is left: wrinklers, sugar lumps, spells, Santa, the dragon…
   * "Other" is the bank change minus everything else, so the categories always add up to exactly
   * what the bank did — integrating the chart gives back the bank.
   */
  const UNKNOWN_LEDGER = {};
  const LEDGER_KEYS = ['build', 'buildBoost', 'click', 'clickBoost', 'dropsIn', 'dropsOut', 'stocksIn', 'stocksOut', 'bldIn', 'bldOut', 'upgOut', 'otherIn', 'otherOut'];
  LEDGER_KEYS.forEach((k) => (UNKNOWN_LEDGER[k] = undefined));
  const DROP_TYPES = new Set(['golden', 'wrath', 'reindeer']);

  function ledger(ctx) {
    if (ctx._ledger) return ctx._ledger;
    if (!ctx.prev) return (ctx._ledger = UNKNOWN_LEDGER);
    const baked = delta(ctx, 'baked');
    const bank = delta(ctx, 'cookies');
    if (baked < 0) return (ctx._ledger = UNKNOWN_LEDGER); // ascended mid-frame
    const sums = { dropsIn: 0, dropsOut: 0, stocksIn: 0, stocksOut: 0, bldIn: 0, bldOut: 0, upgOut: 0 };
    (ctx.events || []).forEach((e) => {
      const c = e.cookies || 0;
      if (DROP_TYPES.has(e.type)) c >= 0 ? (sums.dropsIn += c) : (sums.dropsOut -= c);
      else if (e.type === 'trade') c >= 0 ? (sums.stocksIn += c) : (sums.stocksOut -= c);
      else if (e.type === 'building') c >= 0 ? (sums.bldIn += c) : (sums.bldOut -= c);
      else if (e.type === 'upgrade' && c < 0) sums.upgOut -= c;
    });
    // clicking: what handmadeCookies says, the unboosted part from clicks × raw per-click worth
    const click = Math.max(0, delta(ctx, 'handmade'));
    const rawRate = ctx.frame && Number.isFinite(ctx.frame.clickRaw) ? ctx.frame.clickRaw : click / ctx.dt;
    const clickBase = Math.min(click, rawRate * ctx.dt);
    // building CpS: the rest of what was baked, up to what CpS would bake in this time
    const left = Math.max(0, baked - click - sums.dropsIn - sums.bldIn);
    const production = Math.min(left, (Game.cookiesPs || 0) * ctx.dt);
    const base = Math.min(production, (Game.unbuffedCps || Game.cookiesPs || 0) * ctx.dt);
    const known = production + click + sums.dropsIn - sums.dropsOut + sums.stocksIn - sums.stocksOut + sums.bldIn - sums.bldOut - sums.upgOut;
    const other = bank - known;
    ctx._ledger = {
      build: base,
      buildBoost: production - base,
      click: clickBase,
      clickBoost: click - clickBase,
      ...sums,
      otherIn: Math.max(0, other),
      otherOut: Math.max(0, -other),
    };
    return ctx._ledger;
  }

  function bankFlows(ctx) {
    if (ctx._bank) return ctx._bank;
    if (!ctx.prev) return (ctx._bank = UNKNOWN_BANK);
    const earned = attribute(ctx).total;
    const withered = (Game.cookiesPs || 0) * (Game.cpsSucked || 0) * ctx.dt;
    const change = delta(ctx, 'cookies');
    const expected = earned - withered;
    ctx._bank = {
      withered,
      spent: Math.max(0, expected - change), // buildings, upgrades, stock purchases, …
      otherIn: Math.max(0, change - expected), // stock sales and anything else not "baked"
    };
    return ctx._bank;
  }

  /** 'buildBoost' → 'lBuildBoost' */
  const ledgerId = (k) => 'l' + k[0].toUpperCase() + k.slice(1);

  function init() {
    // cookies — defined first: states below compute deltas of these within the same frame
    S({ id: 'cookies', name: 'Cookies in bank', group: 'cookies', kind: 'gauge', get: () => Game.cookies });
    S({ id: 'baked', name: 'Cookies baked (this ascension)', group: 'cookies', kind: 'counter', get: () => Game.cookiesEarned });
    S({ id: 'bakedAllTime', name: 'Cookies baked (all time)', group: 'cookies', kind: 'counter', get: () => (Game.cookiesEarned || 0) + (Game.cookiesReset || 0) });
    S({ id: 'handmade', name: 'Cookies from clicking (total)', group: 'cookies', kind: 'counter', get: () => Game.handmadeCookies });
    S({ id: 'clicks', name: 'Big cookie clicks (total)', group: 'cookies', kind: 'counter', get: () => Game.cookieClicks });

    // CpS — field names match what the CpS graph has always read (s.cps, s.base, s.click)
    S({ id: 'cps', name: 'CpS', unit: '/s', group: 'cps', kind: 'gauge', get: () => (Game.cookiesPs || 0) * shown() });
    S({ id: 'base', name: 'Unbuffed CpS', unit: '/s', group: 'cps', kind: 'gauge', get: () => (Game.unbuffedCps || Game.cookiesPs || 0) * shown() });
    S({ id: 'click', name: 'Clicking', unit: '/s', group: 'cps', kind: 'gauge', get: (ctx) => (ctx.prev && ctx.dt ? Math.max(0, delta(ctx, 'handmade')) / ctx.dt : undefined) });
    // Raw clicking = clicks per second × what one click would give with no temporary effects.
    // A click's value depends on effects twice over: buffs' multClick (Click frenzy…) and, through
    // the mouse upgrades' "+1% of CpS", on the *buffed* CpS (Frenzy…). So rather than dividing,
    // ask the game's own Game.mouseCps() with CpS set to unbuffed CpS and no buffs active —
    // swapped in and restored within this one synchronous call.
    S({ id: 'clickRate', name: 'Clicks per second', unit: '/s', group: 'cps', kind: 'gauge', get: (ctx) => (ctx.prev && ctx.dt ? Math.max(0, delta(ctx, 'clicks')) / ctx.dt : undefined) });
    S({ id: 'perClick', name: 'Cookies per click', group: 'cps', kind: 'gauge', get: () => Game.computedMouseCps });
    S({ id: 'perClickRaw', name: 'Cookies per click, no effects', group: 'cps', kind: 'gauge', get: rawPerClick });
    S({
      id: 'clickRaw',
      name: 'Clicking without effects',
      unit: '/s',
      group: 'cps',
      kind: 'gauge',
      get: (ctx) => {
        const f = ctx.frame || {};
        if (Number.isFinite(f.clickRate) && Number.isFinite(f.perClickRaw)) return f.clickRate * f.perClickRaw;
        return undefined;
      },
    });

    // earnings — where this frame's baked cookies came from
    S({ id: 'earned', name: 'Baked', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).total });
    S({ id: 'earnProduction', name: 'Production', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).production });
    S({ id: 'earnClick', name: 'Clicking', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).click });
    S({ id: 'earnGolden', name: 'Golden cookies & reindeer', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).golden });
    S({ id: 'earnOther', name: 'Other', group: 'earnings', kind: 'flow', get: (ctx) => attribute(ctx).other });

    // bank — what else moves the bank besides baking
    S({ id: 'spent', name: 'Spent', group: 'bank', kind: 'flow', get: (ctx) => bankFlows(ctx).spent });
    S({ id: 'withered', name: 'Withered by wrinklers', group: 'bank', kind: 'flow', get: (ctx) => bankFlows(ctx).withered });
    S({ id: 'bankOtherIn', name: 'Other income (stock sales, …)', group: 'bank', kind: 'flow', get: (ctx) => bankFlows(ctx).otherIn });

    // ledger — every change to the bank by category (state ids: 'l' + key, e.g. lBuildBoost)
    const LEDGER_NAMES = {
      build: 'Building CpS (unboosted)',
      buildBoost: 'Building CpS: extra from CpS effects',
      click: 'Clicking (unboosted)',
      clickBoost: 'Clicking: extra from effects',
      dropsIn: 'Drops (golden cookies, reindeer…)',
      dropsOut: 'Drops lost (wrath)',
      stocksIn: 'Stocks sold',
      stocksOut: 'Stocks bought',
      bldIn: 'Buildings sold',
      bldOut: 'Buildings bought',
      upgOut: 'Upgrades bought',
      otherIn: 'Other in',
      otherOut: 'Other out',
    };
    LEDGER_KEYS.forEach((k) =>
      S({ id: ledgerId(k), name: LEDGER_NAMES[k], group: 'ledger', kind: 'flow', get: (ctx) => ledger(ctx)[k] })
    );

    // prestige
    const totalLevel = () => Math.floor(Game.HowMuchPrestige((Game.cookiesReset || 0) + (Game.cookiesEarned || 0)));
    S({ id: 'prestige', name: 'Prestige level', group: 'prestige', kind: 'counter', get: () => Game.prestige });
    S({ id: 'prestigeTotal', name: 'Prestige level if you ascended now', group: 'prestige', kind: 'counter', get: totalLevel });
    S({ id: 'prestigeGain', name: 'Prestige gained this run', group: 'prestige', kind: 'counter', get: () => totalLevel() - (Game.prestige || 0) });
    S({ id: 'heavenlyChips', name: 'Heavenly chips', group: 'prestige', kind: 'counter', get: () => Game.heavenlyChips });

    // stocks (undefined while the Bank minigame isn't open — the recorder then skips them)
    const p = (k) => () => {
      const now = CA.Stocks.portfolioNow();
      return now ? now[k] : undefined;
    };
    S({ id: 'portfolioValue', name: 'Portfolio value', unit: '$', group: 'stocks', kind: 'gauge', get: p('value') });
    S({ id: 'portfolioCost', name: 'Portfolio cost basis', unit: '$', group: 'stocks', kind: 'gauge', get: p('cost') });
    S({ id: 'portfolioRealized', name: 'Realized stock profit', unit: '$', group: 'stocks', kind: 'counter', get: p('realized') });

    // magic
    S({
      id: 'magic',
      name: 'Magic',
      group: 'magic',
      kind: 'gauge',
      get: () => {
        const tower = Game.Objects && Game.Objects['Wizard tower'];
        const m = tower && tower.minigame;
        return m && Number.isFinite(m.magic) ? m.magic : undefined;
      },
    });
    S({
      id: 'magicMax',
      name: 'Maximum magic',
      group: 'magic',
      kind: 'gauge',
      get: () => {
        const tower = Game.Objects && Game.Objects['Wizard tower'];
        const m = tower && tower.minigame;
        return m && Number.isFinite(m.magicM) ? m.magicM : undefined;
      },
    });
  }

  return { init, attribute, LEDGER_KEYS, ledgerId };
})();
