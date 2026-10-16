// STAGING — a CookieMgr feature module written for the simulator first. It follows the add-on's
// conventions (a CA.* module with init(), registering actions and values in CookieMgr's registries)
// and runs headless, so promoting it is: move it to src/features/, add it to build.mjs's MODULES
// and to main.js's init list. Until then strategies that use these words run in the simulator only.
//
// Buying by payback period without Cookie Monster: what a building or an upgrade adds to your CpS,
// asked of the game itself — make the change, Game.CalculateGains(), read Game.unbuffedCps, undo
// (CpS achievements can't be won by the hypothetical, and the "highest raw CpS" isn't raised by it).
//
//   actions   building.buy(building, n)      buy n of a building (as many as you can afford, up to n)
//             building.sell(building, n)
//             buy.best(kind)                 buy what has the lowest payback period, if you can afford it
//   values    building.price(building)       its price now
//             building.gain(building)        the CpS one more adds (unbuffed)
//             building.payback(building)     Cookie Monster's payback period, in seconds
//             upgrade.gain(upgrade)          the CpS an upgrade adds (+ its clicks' worth at clickRate())
//             upgrade.payback(upgrade)
//             best(kind)                     the name with the lowest payback: kind building | upgrade | all
//             clickRate()                    your clicks per second over the last 10 s

CA.Payback = (() => {
  const objects = () => Object.values(Game.Objects || {});
  const building = (name) => (Game.Objects || {})[name] || objects().find((o) => o.dname === name) || null;
  const upgradeOf = (name) => (Game.Upgrades || {})[name] || null;

  /** Recent clicks: the big cookie's click count, sampled once a second. */
  const clicks = [];
  function sampleClicks() {
    clicks.push([Date.now(), Game.cookieClicks || 0]);
    while (clicks.length > 11) clicks.shift();
  }
  const clickRate = () => (clicks.length < 2 ? 0 : (clicks[clicks.length - 1][1] - clicks[0][1]) / Math.max(1, (clicks[clicks.length - 1][0] - clicks[0][0]) / 1000));

  // What things add is asked of the game once per state of the game (what's owned, and the CpS that
  // comes of it — any other change, an aura, a god, the garden, moves the CpS and so the key) and
  // kept: { key, b: { name: cps }, u: { name: { cps, click } } }.
  let cache = { key: '', b: {}, u: {} };
  const keyNow = () => `${objects().map((o) => o.amount).join(',')}|${Game.UpgradesOwned}|${Game.AchievementsOwned}|${Game.unbuffedCps}`;
  function fresh() {
    const k = keyNow();
    if (cache.key !== k) cache = { key: k, b: {}, u: {} };
    return cache;
  }
  /**
   * Unbuffed CpS and a click's worth with each change applied in turn, as the game computes them
   * ([change(on)…] → [{ cps, click }…]); the game is put back (and recomputed once) after.
   */
  function measureAll(changes) {
    const win = Game.Win;
    const highest = Game.cookiesPsRawHighest;
    Game.Win = () => {};
    const out = [];
    try {
      for (const change of changes) {
        change(true);
        try {
          Game.CalculateGains();
          out.push({ cps: Game.unbuffedCps, click: typeof Game.mouseCps === 'function' ? Game.mouseCps() : 0 });
        } finally {
          change(false);
        }
      }
    } finally {
      Game.CalculateGains();
      Game.Win = win;
      Game.cookiesPsRawHighest = highest;
    }
    return out;
  }
  /** Fills the cache for these buildings / upgrades (names), in one go. */
  function fill(bNames, uNames) {
    const c = fresh();
    const bs = bNames.filter((n) => !(n in c.b) && building(n));
    const us = uNames.filter((n) => !(n in c.u) && upgradeOf(n) && !upgradeOf(n).bought);
    if (!bs.length && !us.length) return c;
    // the first "change" changes nothing: the baseline, computed fresh (Game.unbuffedCps can lag a
    // purchase until the next logic frame)
    const res = measureAll(
      [() => {}].concat(
        bs.map((n) => (on) => (building(n).amount += on ? 1 : -1)),
        us.map((n) => (on) => (upgradeOf(n).bought = on ? 1 : 0))
      )
    );
    const b0 = res.shift();
    bs.forEach((n, i) => (c.b[n] = Math.max(0, res[i].cps - b0.cps)));
    us.forEach((n, i) => (c.u[n] = { cps: Math.max(0, res[bs.length + i].cps - b0.cps), click: Math.max(0, res[bs.length + i].click - b0.click) }));
    cache = { ...c, key: keyNow() };
    return cache;
  }

  /** The CpS one more of a building adds. */
  const buildingGain = (name) => fill([name], []).b[name] || 0;
  /** The CpS an upgrade adds, counting what it adds to each click at your click rate. */
  function upgradeGain(name) {
    const g = fill([], [name]).u[name];
    return g ? g.cps + g.click * clickRate() : 0;
  }
  /** Cookie Monster's payback period: the time to afford it, then its price over what it adds. */
  function pp(price, gain) {
    if (!(gain > 0)) return Infinity;
    const cps = Math.max(1e-9, Game.unbuffedCps || 0);
    return Math.max(0, price - (Game.cookies || 0)) / cps + price / gain;
  }
  const buildingPrice = (name) => (building(name) ? building(name).getPrice() : NaN);
  const upgradePrice = (name) => (upgradeOf(name) ? upgradeOf(name).getPrice() : NaN);
  const storeUpgrades = () => (Game.UpgradesInStore || []).filter((u) => u && !u.bought && u.pool !== 'toggle' && u.pool !== 'tech' && !(u.priceLumps > 0));

  /** The lowest payback: { name, kind, pp, price } — kind 'building' | 'upgrade' | 'all'. */
  function best(kind = 'all') {
    let top = null;
    const consider = (name, k, price, gain) => {
      const v = pp(price, gain);
      if (Number.isFinite(v) && (!top || v < top.pp)) top = { name, kind: k, pp: v, price };
    };
    const bs = kind !== 'upgrade' ? objects().filter((b) => !b.locked) : [];
    const us = kind !== 'building' ? storeUpgrades() : [];
    const c = fill(
      bs.map((b) => b.name),
      us.map((u) => u.name)
    );
    const rate = clickRate();
    bs.forEach((b) => consider(b.name, 'building', b.getPrice(), c.b[b.name]));
    us.forEach((u) => c.u[u.name] && consider(u.name, 'upgrade', u.getPrice(), c.u[u.name].cps + c.u[u.name].click * rate));
    return top;
  }

  function buyBuilding(name, n) {
    const b = building(name);
    if (!b) return 0;
    const had = b.amount;
    const mode = Game.buyMode;
    Game.buyMode = 1;
    try {
      b.buy(Math.max(1, Math.floor(Number(n) || 1)));
    } finally {
      Game.buyMode = mode;
    }
    return b.amount - had;
  }

  function init() {
    setInterval(sampleClicks, 1000);
    const kinds = () => [{ v: 'all', label: 'buildings and upgrades' }, { v: 'building', label: 'buildings' }, { v: 'upgrade', label: 'upgrades' }];
    const buildings = () => objects().map((b) => ({ v: b.name, label: b.dname || b.name }));
    const A = CA.Actions.register;
    A({
      id: 'building.buy',
      name: 'Buy a building',
      icon: 'building',
      group: 'Buying',
      unit: 'bought',
      params: [
        { key: 'building', label: 'Building', type: 'select', default: 'Cursor', options: buildings },
        { key: 'n', label: 'How many', type: 'number', default: 1, min: 1 },
      ],
      run: (p) => buyBuilding(p.building, p.n),
    });
    A({
      id: 'building.sell',
      name: 'Sell a building',
      icon: 'building',
      group: 'Buying',
      unit: 'sold',
      params: [
        { key: 'building', label: 'Building', type: 'select', default: 'Cursor', options: buildings },
        { key: 'n', label: 'How many', type: 'number', default: 1, min: 1 },
      ],
      run: (p) => {
        const b = building(p.building);
        if (!b) return 0;
        const had = b.amount;
        b.sell(Math.max(1, Math.floor(Number(p.n) || 1)));
        return had - b.amount;
      },
    });
    A({
      id: 'buy.best',
      name: 'Buy the lowest payback period',
      icon: 'building',
      group: 'Buying',
      unit: 'bought',
      params: [{ key: 'kind', label: 'Of', type: 'select', default: 'all', options: kinds }],
      run: (p) => {
        const top = best(p.kind);
        if (!top || top.price > Game.cookies) return 0;
        if (top.kind === 'building') return buyBuilding(top.name, 1);
        return upgradeOf(top.name).buy(1) ? 1 : 0;
      },
    });
    const V = (id, desc, params, get) => CA.Script.defineValue({ id, desc, params, get });
    V('building.price', 'what one more of a building costs now', ['building'], buildingPrice);
    V('building.gain', 'the CpS one more of a building adds (unbuffed)', ['building'], buildingGain);
    V('building.payback', 'payback period of one more of a building, in seconds', ['building'], (n) => pp(buildingPrice(n), buildingGain(n)));
    V('upgrade.gain', 'the CpS an upgrade adds (its clicks counted at your click rate)', ['upgrade'], upgradeGain);
    V('upgrade.payback', 'payback period of an upgrade, in seconds', ['upgrade'], (n) => pp(upgradePrice(n), upgradeGain(n)));
    V('best', 'what has the lowest payback period ("" when nothing does): kind building, upgrade or all', ['kind'], (k) => (best(k || 'all') || {}).name || '');
    V('clickRate', 'big cookie clicks per second (last 10 s)', [], clickRate);
  }

  return { init, best, buildingGain, upgradeGain, pp, clickRate, buyBuilding };
})();
