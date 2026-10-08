// Buying macros, and petting the dragon.
//
//   Best building (Cookie Monster)   buys the building with the lowest payback period (PP) — one at
//                                    a time, or up to the next multiple of 10 when the store's
//                                    "Round to multiples" is on (ranked by Cookie Monster's ×10 PP)
//   Best upgrade (Cookie Monster)    buys the upgrade with the lowest PP. Upgrades Cookie Monster
//                                    gives no PP (clicking upgrades: no CpS) are estimated from
//                                    what they add per click × your clicks per second
//   With both on, each buys only when the best of the two is its kind — so together they always
//   buy the lowest PP overall. Each can skip what you can't afford yet (otherwise it saves up for
//   the best one); shift-click its left-panel button to switch.
//   Research                         buys research (the Bingo center's tech upgrades) as it comes,
//                                    optionally stopping before one you pick (One mind starts the
//                                    Grandmapocalypse)
//   Cheap upgrades                   buys any upgrade costing less than N seconds (default 1) of
//                                    your unbuffed production
//   Pet the dragon                   the dragon drops one of four upgrades when petted (1 in 20 per
//                                    pet, dragon level 8+, "Pet the dragon" bought); which one
//                                    depends only on the quarter of the hour, in an order fixed by
//                                    your save's seed (main.js ClickSpecialPic). It works that order
//                                    out, and in a quarter whose drop you're missing it opens the
//                                    dragon, pets it until it drops, and closes it again.
//
// Payback period, as Cookie Monster computes it: (time to afford it) + price ÷ CpS it adds.

CA.AutoBuy = (() => {
  const cm = () => (typeof window !== 'undefined' && window.CookieMonsterData) || null;
  const cmReady = () => !!(cm() && cm().Objects1 && cm().Upgrades && CA.CookieMonster.isLoaded());

  // ---- candidates ----------------------------------------------------------------------------

  /** Upgrades in the store you could buy with cookies (not seasons/toggles, research, vaulted or lump-priced). */
  function storeUpgrades(pools) {
    return (Game.UpgradesInStore || []).filter(
      (u) => u && !u.bought && !(u.priceLumps > 0) && !(typeof u.isVaulted === 'function' && u.isVaulted()) && (pools ? pools.includes(u.pool) : u.pool !== 'toggle' && u.pool !== 'tech')
    );
  }

  const priceOf = (u) => (typeof u.getPrice === 'function' ? u.getPrice() : u.basePrice || u.price || 0);
  const clicksPerSec = () => {
    const r = CA.Recorder.recent(60);
    return r && Number.isFinite(r.clickRate) ? r.clickRate : 0;
  };

  /** What an upgrade adds to each click (computed the way Cookie Monster does: buy it, recompute, undo). */
  function clickGain(u) {
    if (typeof Game.mouseCps !== 'function') return 0;
    const before = Game.mouseCps();
    let after = before;
    u.bought = 1;
    try {
      after = Game.mouseCps();
    } finally {
      u.bought = 0;
    }
    return Math.max(0, after - before);
  }

  /** Cookie Monster's PP formula, for a price and the cookies per second something adds. */
  function pp(price, gain) {
    if (!(gain > 0)) return Infinity;
    const wait = Game.cookiesPs > 0 ? Math.max(0, price - Game.cookies) / Game.cookiesPs : 0;
    return wait + price / gain;
  }

  /** Every building and upgrade the two Cookie Monster buyers could pick: { kind, name, price, pp, buy() }. */
  let memo = null; // { key, list } — the same list within one pass of a macro (worked out three times in one)
  function candidates(kinds) {
    const pass = CA.Macros.passKey();
    if (pass == null) return candidatesNow(kinds);
    const key = `${pass}|${kinds.join(',')}|${CA.Shop.roundUp()}|${Game.cookies}`;
    if (memo && memo.key === key) return memo.list;
    memo = { key, list: candidatesNow(kinds) };
    return memo.list;
  }
  function candidatesNow(kinds) {
    const data = cm();
    if (!cmReady()) return [];
    const out = [];
    if (kinds.includes('building')) {
      const ten = CA.Shop.roundUp();
      const table = ten ? data.Objects10 || data.Objects1 : data.Objects1;
      Object.keys(table || {}).forEach((name) => {
        const b = Game.Objects[name];
        const e = table[name];
        if (!b || b.locked || !e || !Number.isFinite(e.pp)) return;
        const amount = ten ? Math.max(1, 10 - ((b.amount || 0) % 10)) : 1;
        const price = typeof b.getSumPrice === 'function' ? b.getSumPrice(amount) : e.price;
        out.push({ kind: 'building', name, label: amount > 1 ? `${amount} × ${name}` : name, price, pp: e.pp, buy: () => buyBuilding(b, amount) });
      });
    }
    if (kinds.includes('upgrade')) {
      const cps = clicksPerSec();
      storeUpgrades().forEach((u) => {
        const price = priceOf(u);
        const e = data.Upgrades[u.name];
        let v = e && Number.isFinite(e.pp) ? e.pp : Infinity;
        let estimated = false;
        // no PP from Cookie Monster (it adds no CpS): price it by what it adds to your clicking
        if (!Number.isFinite(v) && cps > 0) {
          const gain = clickGain(u) * cps;
          if (gain > 0) {
            v = pp(price, gain);
            estimated = true;
          }
        }
        if (Number.isFinite(v)) out.push({ kind: 'upgrade', name: u.name, label: u.dname || u.name, price, pp: v, estimated, buy: () => buyUpgrade(u) });
      });
    }
    return out;
  }

  /** The lowest-PP choice among `kinds` (only affordable ones when `skip`). */
  function best(kinds, skip) {
    let list = candidates(kinds);
    if (skip) list = list.filter((c) => c.price <= Game.cookies);
    return list.sort((a, b) => a.pp - b.pp)[0] || null;
  }

  function buyBuilding(b, amount) {
    // the store's sell mode would make buy() sell: buy in buy mode
    const mode = Game.buyMode;
    Game.buyMode = 1;
    const before = b.amount;
    try {
      b.buy(amount);
    } finally {
      Game.buyMode = mode;
    }
    return b.amount - before;
  }
  function buyUpgrade(u) {
    if (u.bought || Game.cookies < priceOf(u)) return 0;
    u.buy(1);
    return u.bought ? 1 : 0;
  }

  /** One run of a Cookie Monster buyer: buys its pick if it's the best of what's switched on. */
  function runBuyer(kind, skip) {
    const other = kind === 'building' ? 'cmUpgrades' : 'cmBuildings';
    const kinds = [kind].concat(CA.Macros.isOn(other) ? [kind === 'building' ? 'upgrade' : 'building'] : []);
    const pick = best(kinds, skip);
    if (!pick || pick.kind !== kind || pick.price > Game.cookies) return 0;
    return pick.buy() > 0 ? 1 : 0;
  }

  /** For buttons: what a buyer would buy next, and whether it can now. */
  function readiness(kind, skip) {
    if (!cmReady()) return { ok: false, text: 'needs Cookie Monster' };
    const pick = best([kind], skip);
    if (!pick) return { ok: false, text: skip ? 'nothing affordable' : 'nothing to buy' };
    const ok = pick.price <= Game.cookies;
    const { span } = CA.Format;
    const wait = !ok && Game.cookiesPs > 0 ? ` — in ${span((pick.price - Game.cookies) / Game.cookiesPs)}` : '';
    return { ok, text: `next: ${pick.label}${pick.estimated ? ' (PP from your clicking)' : ''}${wait}` };
  }

  // ---- research --------------------------------------------------------------------------

  const RESEARCH = ['Specialized chocolate chips', 'Designer cocoa beans', 'Ritual rolling pins', 'Underworld ovens', 'One mind', 'Exotic nuts', 'Communal brainsweep', 'Arcane sugar', 'Elder Pact'];

  function researchPick(stopBefore) {
    const stop = stopBefore && stopBefore !== 'none' ? RESEARCH.indexOf(stopBefore) : -1;
    return storeUpgrades(['tech']).find((u) => {
      const i = RESEARCH.indexOf(u.name);
      return stop < 0 || i < 0 || i < stop;
    });
  }

  // ---- cheap upgrades ---------------------------------------------------------------------

  /** Upgrades costing less than `secs` seconds of unbuffed production, cheapest first. */
  function cheapUpgrades(secs) {
    const raw = Game.cookiesPsRaw || Game.cookiesPs || 0;
    const limit = raw * Math.max(0, secs);
    return storeUpgrades()
      .map((u) => ({ u, price: priceOf(u) }))
      .filter((x) => x.price <= limit)
      .sort((a, b) => a.price - b.price);
  }

  // ---- the dragon ---------------------------------------------------------------------------

  const DROPS = ['Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear'];
  let order = null; // the drops in quarter-hour order, as the game shuffles them for this save
  let orderSeed = null;

  /** Which drop each quarter of the hour gives (the game's own shuffle with this save's seed). */
  function dropOrder() {
    if (order && orderSeed === Game.seed) return order;
    if (typeof Math.seedrandom !== 'function' || typeof shuffle !== 'function') return null;
    Math.seedrandom(`${Game.seed}/dragonTime`);
    try {
      order = shuffle(DROPS.slice());
    } finally {
      Math.seedrandom();
    }
    orderSeed = Game.seed;
    return order;
  }
  const has = (n) => (typeof Game.Has === 'function' && Game.Has(n)) || (typeof Game.HasUnlocked === 'function' && Game.HasUnlocked(n));
  const missingDrops = () => DROPS.filter((d) => !has(d));
  const canPet = () => Game.dragonLevel >= 8 && typeof Game.Has === 'function' && Game.Has('Pet the dragon');

  /** For each missing drop: when its quarter of the hour comes next ({ name, inSec, now }). */
  function petSchedule() {
    const ord = dropOrder();
    const d = new Date();
    const secIntoHour = d.getMinutes() * 60 + d.getSeconds();
    return missingDrops().map((name) => {
      if (!ord) return { name, inSec: 0, now: true };
      const q = ord.indexOf(name);
      const start = q * 900;
      const now = secIntoHour >= start && secIntoHour < start + 900;
      return { name, now, inSec: now ? 0 : (start - secIntoHour + 3600) % 3600 };
    });
  }

  /** Pets the dragon if this quarter-hour's drop is one you're missing; returns 1 when it dropped. */
  function pet() {
    if (!canPet()) return 0;
    const due = petSchedule().find((x) => x.now);
    if (!due) return 0;
    // open the dragon (quietly), pet until it drops, put things back
    const prevTab = Game.specialTab;
    const vol = Game.volume;
    const parts = Game.prefs && Game.prefs.particles;
    Game.volume = 0;
    if (Game.prefs) Game.prefs.particles = 0;
    let got = 0;
    try {
      Game.specialTab = 'dragon';
      if (typeof Game.ToggleSpecialMenu === 'function') Game.ToggleSpecialMenu(1);
      for (let i = 0; i < 80 && !has(due.name); i++) Game.ClickSpecialPic();
      got = has(due.name) ? 1 : 0;
    } finally {
      Game.specialTab = prevTab;
      if (typeof Game.ToggleSpecialMenu === 'function') Game.ToggleSpecialMenu(prevTab ? 1 : 0);
      Game.volume = vol;
      if (Game.prefs) Game.prefs.particles = parts;
    }
    return got;
  }

  // ---- building blocks -----------------------------------------------------------------------
  //
  //   cm.best(kind, skip)     the lowest payback period of building / upgrade / all ("": nothing);
  //                           skip: only what you can afford now. Its result names a thing to buy:
  //   cm.kind(thing) · cm.price(thing) · cm.pp(thing) · cm.buy(thing)
  //   upgrades()              a list: the store's upgrades, cheapest first
  //   upgrade.price(u) · upgrade.owned(name) · buy.upgrade(u)
  //   research.next(stopBefore)  the next research to buy ("": none — or only what's at / after stopBefore)
  //   dragon.canPet() · dragon.dropNow() (this quarter-hour's drop, if you're missing it) · dragon.pet()

  const KINDS = { building: ['building'], upgrade: ['upgrade'], all: ['building', 'upgrade'] };
  const thingKey = (c) => `${c.kind}:${c.name}`;
  const thingOf = (k) => (k ? candidates(['building', 'upgrade']).find((c) => thingKey(c) === String(k)) || null : null);
  const upgradeNamed = (n) => (Game.UpgradesInStore || []).find((u) => u && u.name === n) || (Game.UpgradesByName && Game.UpgradesByName[n]) || (Game.Upgrades && Game.Upgrades[n]) || null;
  function blocks() {
    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, ...(more || {}) });
    V('cm.best', 'the lowest payback period (Cookie Monster) of a kind: building, upgrade or all ("": none)', (kind, skip) => {
      const b = best(KINDS[kind] || KINDS.all, !!skip && skip !== 'false');
      return b ? thingKey(b) : '';
    }, { params: ['kind', 'skip'] });
    V('cm.kind', 'what a thing to buy is: "building" or "upgrade"', (k) => String(k || '').split(':')[0], { params: ['thing'] });
    V('cm.price', 'cookies a thing to buy costs', (k) => (thingOf(k) || { price: NaN }).price, { params: ['thing'] });
    V('cm.pp', 'a thing’s payback period (Cookie Monster)', (k) => (thingOf(k) || { pp: NaN }).pp, { params: ['thing'] });
    V('upgrades', 'a list: the upgrades in the store, cheapest first', () => storeUpgrades().map((u) => ({ u, price: priceOf(u) })).sort((a, b) => a.price - b.price).map((x) => x.u.name), { list: true });
    V('upgrade.price', 'an upgrade’s price', (n) => {
      const u = upgradeNamed(n);
      return u ? priceOf(u) : NaN;
    }, { params: ['upgrade'] });
    V('upgrade.owned', 'whether you own an upgrade', (n) => has(n), { params: ['upgrade'], bool: true });
    V('research.next', 'the next research to buy, stopping before stopBefore ("": none)', (stop) => (researchPick(stop) || {}).name || '', { params: ['stopBefore'] });
    V('dragon.canPet', 'whether you can pet the dragon (level 8, “Pet the dragon”)', () => canPet(), { bool: true });
    V('dragon.dropNow', 'this quarter-hour’s dragon drop, if you’re missing it ("": none)', () => (petSchedule().find((x) => x.now) || {}).name || '');
    const A = CA.Actions.register;
    A({
      id: 'cm.buy',
      name: 'Buy a building or upgrade (from cm.best)',
      icon: 'building',
      group: 'Buying',
      unit: 'bought',
      params: [{ key: 'thing', label: 'Thing', type: 'select', default: '', options: () => candidates(['building', 'upgrade']).map((c) => ({ v: thingKey(c), label: c.label })) }],
      run: (p) => {
        const c = thingOf(p.thing);
        memo = null;
        return c && c.price <= Game.cookies && c.buy() > 0 ? 1 : 0;
      },
    });
    A({
      id: 'buy.upgrade',
      name: 'Buy an upgrade',
      icon: 'upgrade',
      group: 'Buying',
      unit: 'bought',
      params: [{ key: 'upgrade', label: 'Upgrade', type: 'select', default: '', options: () => storeUpgrades(null).concat(storeUpgrades(['tech'])).map((u) => ({ v: u.name, label: u.dname || u.name })) }],
      run: (p) => {
        const u = upgradeNamed(p.upgrade);
        memo = null;
        return u ? buyUpgrade(u) : 0;
      },
    });
  }

  // ---- actions and built-in macros -----------------------------------------------------------

  function init() {
    blocks();
    const A = CA.Actions.register;
    const skipParam = { key: 'skip', label: 'Skip what you can’t afford yet', type: 'bool', default: false };
    A({
      id: 'cm.buyBuilding',
      name: 'Buy the best building (Cookie Monster PP)',
      icon: 'building',
      group: 'Buying',
      unit: 'bought',
      params: [skipParam],
      available: cmReady,
      ready: (p) => readiness('building', p.skip),
      run: (p) => runBuyer('building', p.skip),
    });
    A({
      id: 'cm.buyUpgrade',
      name: 'Buy the best upgrade (Cookie Monster PP)',
      icon: 'upgrade',
      group: 'Buying',
      unit: 'bought',
      params: [skipParam],
      available: cmReady,
      ready: (p) => readiness('upgrade', p.skip),
      run: (p) => runBuyer('upgrade', p.skip),
    });
    A({
      id: 'buy.research',
      name: 'Buy research',
      icon: 'sparkle',
      group: 'Buying',
      unit: 'bought',
      params: [
        {
          key: 'stopBefore',
          label: 'Stop before',
          type: 'select',
          default: 'One mind',
          options: () => [{ v: 'none', label: 'never — buy it all' }].concat(RESEARCH.map((r) => ({ v: r, label: r === 'One mind' ? 'One mind (starts the Grandmapocalypse)' : r }))),
        },
      ],
      describe: (p) => (p.stopBefore && p.stopBefore !== 'none' ? `Buy research (up to before ${p.stopBefore})` : 'Buy all research'),
      ready: (p) => {
        const u = researchPick(p.stopBefore);
        return u ? { ok: Game.cookies >= priceOf(u), text: `next: ${u.dname || u.name}` } : { ok: false, text: 'no research to buy' };
      },
      run: (p) => {
        const u = researchPick(p.stopBefore);
        return u ? buyUpgrade(u) : 0;
      },
    });
    A({
      id: 'buy.cheapUpgrades',
      name: 'Buy cheap upgrades',
      icon: 'dollar',
      group: 'Buying',
      unit: 'bought',
      params: [{ key: 'secs', label: 'Costing less than (seconds of production)', type: 'number', default: 1, min: 0 }],
      describe: (p) => `Buy upgrades costing under ${p.secs}s of production`,
      ready: (p) => {
        const c = cheapUpgrades(p.secs)[0];
        return c ? { ok: Game.cookies >= c.price, text: `next: ${c.u.dname || c.u.name}` } : { ok: false, text: 'nothing that cheap' };
      },
      run: (p) => cheapUpgrades(p.secs).reduce((n, x) => n + buyUpgrade(x.u), 0),
    });
    A({
      id: 'dragon.pet',
      name: 'Pet the dragon for its drops',
      icon: 'sparkle',
      group: 'Other',
      unit: 'drops',
      available: canPet,
      ready: () => {
        if (!canPet()) return { ok: false, text: 'needs dragon level 8 and “Pet the dragon”' };
        const s = petSchedule();
        if (!s.length) return { ok: true, text: 'all four drops found' };
        const now = s.find((x) => x.now);
        const next = s.slice().sort((a, b) => a.inSec - b.inSec)[0];
        return { ok: !!now, text: now ? `${now.name} drops this quarter-hour` : `${next.name} in ${CA.Format.span(next.inSec)}` };
      },
      run: () => pet(),
    });

    const M = CA.Macros;
    const skipInput = { key: 'skip', label: 'Skip what you can’t afford yet', type: 'bool', default: false };
    M.addBuiltin({
      id: 'cmBuildings',
      name: 'Best building',
      desc: 'Buys the building with the lowest payback period (Cookie Monster) — 10 at a time to the next multiple when the store’s Round to multiples is on. With Best upgrade also on, buys only when a building beats every upgrade.',
      icon: { ico: 'building' },
      mode: 'flow',
      every: 500,
      defaultSource: "# Buy the building with the lowest payback period (Cookie Monster) — judged against the upgrades\n# too when Best upgrade is on, so together they always buy the best of both. skip: only what\n# you can afford now (otherwise it saves up for the best). Shift-click its button flips skip.\nforever:\n  if macro.isOn(cmUpgrades):\n    pick = cm.best(all, skip)\n  else:\n    pick = cm.best(building, skip)\n  if pick != \"\" and cm.kind(pick) == \"building\" and cm.price(pick) <= cookies():\n    cm.buy(pick)\n",
      inputs: [skipInput],
      shift: { input: 'skip', on: 'skips what you can’t afford', off: 'saves up for the best' },
      readiness: (ins) => readiness('building', ins.skip),
      needsCM: true,
      holdRepeat: true,
      section: 'buying',
    });
    M.addBuiltin({
      id: 'cmUpgrades',
      name: 'Best upgrade',
      desc: 'Buys the upgrade with the lowest payback period (Cookie Monster); clicking upgrades are judged by your clicks per second. With Best building also on, buys only when an upgrade beats every building.',
      icon: { ico: 'upgrade' },
      mode: 'flow',
      every: 500,
      defaultSource: "# Buy the upgrade with the lowest payback period (Cookie Monster; clicking upgrades are judged by\n# your clicks per second) — against the buildings too when Best building is on. skip: only what\n# you can afford now. Shift-click its button flips skip.\nforever:\n  if macro.isOn(cmBuildings):\n    pick = cm.best(all, skip)\n  else:\n    pick = cm.best(upgrade, skip)\n  if pick != \"\" and cm.kind(pick) == \"upgrade\" and cm.price(pick) <= cookies():\n    cm.buy(pick)\n",
      inputs: [skipInput],
      shift: { input: 'skip', on: 'skips what you can’t afford', off: 'saves up for the best' },
      readiness: (ins) => readiness('upgrade', ins.skip),
      needsCM: true,
      holdRepeat: true,
      section: 'buying',
    });
    M.addBuiltin({
      id: 'research',
      name: 'Research',
      desc: 'Buys the Bingo center’s research as soon as it shows up — stopping before One mind by default, so it never starts the Grandmapocalypse unless you say so.',
      icon: { sprite: [11, 9] },
      mode: 'flow',
      every: 2000,
      defaultSource: "# Buy the Bingo center's research as it shows up — stopping before stopBefore (One mind starts\n# the Grandmapocalypse; \"none\": buy it all).\nforever:\n  r = research.next(stopBefore)\n  if r != \"\" and upgrade.price(r) <= cookies():\n    buy.upgrade(r)\n",
      inputs: [{ key: 'stopBefore', label: 'Stop before', type: 'select', default: 'One mind', options: () => CA.Actions.get('buy.research').params[0].options() }],
      readiness: (ins) => CA.Actions.get('buy.research').ready({ stopBefore: ins.stopBefore }),
      holdRepeat: true,
      section: 'buying',
    });
    M.addBuiltin({
      id: 'cheapUpgrades',
      name: 'Cheap upgrades',
      desc: 'Buys any upgrade costing less than a second (or however many you set) of your unbuffed production — the small stuff, without thinking about it.',
      icon: { ico: 'dollar' },
      mode: 'flow',
      every: 1000,
      defaultSource: "# Buy every upgrade costing less than secs seconds of your unbuffed production — cheapest first.\nforever:\n  for u in upgrades():\n    if upgrade.price(u) <= rawCps() * secs:\n      buy.upgrade(u)\n",
      inputs: [{ key: 'secs', label: 'Costing less than (seconds of production)', type: 'number', default: 1, min: 0 }],
      readiness: (ins) => CA.Actions.get('buy.cheapUpgrades').ready({ secs: ins.secs }),
      holdRepeat: true,
      section: 'buying',
    });
    M.addBuiltin({
      id: 'petDragon',
      name: 'Pet the dragon',
      desc: 'Gets the dragon’s four drops: works out which quarter of the hour gives which, and in a quarter whose drop you’re missing opens the dragon, pets it until it drops, and closes it. Needs dragon level 8 and the “Pet the dragon” upgrade.',
      icon: { sprite: [30, 12] },
      mode: 'flow',
      every: 30000,
      defaultSource: "# Get the dragon's four drops: in a quarter of the hour whose drop you're missing, pet it until it\n# drops (dragon level 8 and the \"Pet the dragon\" upgrade).\nforever:\n  if dragon.canPet() and dragon.dropNow() != \"\":\n    dragon.pet()\n",
      readiness: () => CA.Actions.get('dragon.pet').ready({}),
      section: 'upkeep',
    });
  }

  return { init, best, candidates, readiness, petSchedule, dropOrder, cheapUpgrades, researchPick, clickGain, RESEARCH, DROPS };
})();
