// Payback: what buying something is worth — CookieMgr's own version of Cookie Monster's numbers, so
// nothing needs Cookie Monster loaded. (Grown from the simulator's staging module, sim/mgr/staging;
// the model follows Cookie Monster — MIT — src/Sim and src/Cache/PP.)
//
// **Bonus income** — the CpS a purchase adds, asked of the game itself: make the change (one more
// building, or ten, or an upgrade bought), run the game's own Game.CalculateGains(), read the CpS,
// undo. Exact for any game version, any mod that hooks CpS. Like Cookie Monster, it counts the
// achievements the purchase would win (their milk feeds the kittens): building-count tiers, the
// totals (Builder…, Centennial…, Mathematician, Base 10), upgrade counts (Enhancer…), sets
// (Spooky cookies, Let it snow, O Fortuna, Elder…) and the CpS milestones the new CpS passes
// (CalculateGains awards those itself — here they're won only in the hypothetical, then undone).
// Nothing about the real game changes: amounts, achievements, the highest CpS are put back and the
// CpS recomputed once after a batch.
//
// **Payback period** (PP), Cookie Monster's formula: the time until you can afford it at your CpS,
// plus how long it takes to earn its price back:
//
//     PP = max(price − bank, 0) ÷ CpS + price ÷ bonus income            (bonus ≤ 0 → ∞)
//
// with CpS the game's (buffs included, so a Frenzy shrinks every PP alike) and the bank optionally
// counting what your wrinklers would give back. An upgrade that only makes clicks stronger is worth
// its extra cookies per click × your clicks per second.
//
// **Colours** (Cookie Monster's): blue — better than the best building (only upgrades can be);
// green — the best building; yellow / orange / red — within the 10 / 20 / 30 best building PPs (one,
// ten and a hundred of each count, sixty in all); purple — worse; gray — never pays back.
//
// The expensive part (the bonus incomes — about 90 CpS computations) is kept until the game state
// changes (what's owned, buffs, the store, CpS by more than 0.1%) or a second has passed with CpS drifting; PPs and colours
// are worked out from it on every read, so they follow your bank as it grows.

CA.Payback = (() => {
  const objects = () => Object.values(Game.Objects || {});
  const buildingNamed = (name) => (Game.Objects || {})[name] || objects().find((o) => o.dname === name) || null;
  const upgradeNamed = (name) => (Game.Upgrades || {})[name] || (Game.UpgradesInStore || []).find((u) => u && u.name === name) || null;
  const BULKS = [1, 10, 100];
  const COLOURS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'gray'];

  // ---- clicks per second (for upgrades that make clicks stronger) ----------------------------------

  const clicks = [];
  function sampleClicks() {
    clicks.push([Date.now(), Game.cookieClicks || 0]);
    while (clicks.length > 11) clicks.shift();
  }
  /** Big cookie clicks per second over the last ten seconds (the history recorder's, when it runs). */
  function clickRate() {
    const r = CA.Recorder && typeof CA.Recorder.recent === 'function' ? CA.Recorder.recent(10) : null;
    return r && Number.isFinite(r.clickRate) && r.clickRate > 0 ? r.clickRate : sampledRate();
  }
  const sampledRate = () => (clicks.length < 2 ? 0 : (clicks[clicks.length - 1][1] - clicks[0][1]) / Math.max(1, (clicks[clicks.length - 1][0] - clicks[0][0]) / 1000));

  // ---- prices ----------------------------------------------------------------------------------

  /** What n more of a building cost, as the game prices them (main.js getSumPrice — not the store's rounding). */
  function sumPrice(b, n) {
    if (!Number.isFinite(b.basePrice)) return typeof b.getSumPrice === 'function' ? b.getSumPrice(n) : (typeof b.getPrice === 'function' ? b.getPrice() : NaN) * n;
    let p = 0;
    for (let i = Math.max(0, b.amount); i < Math.max(0, b.amount + n); i++) p += b.basePrice * Math.pow(Game.priceIncrease, Math.max(0, i - (b.free || 0)));
    p = typeof Game.modifyBuildingPrice === 'function' ? Game.modifyBuildingPrice(b, p) : p;
    return Math.ceil(p);
  }
  const upgradePrice = (u) => (typeof u.getPrice === 'function' ? u.getPrice() : u.basePrice || u.price || 0);

  // ---- the hypothetical --------------------------------------------------------------------------

  const SPOOKY = ['Skull cookies', 'Ghost cookies', 'Bat cookies', 'Slime cookies', 'Pumpkin cookies', 'Eyeball cookies', 'Spider cookies'];
  const SNOW = ['Christmas tree biscuits', 'Snowflake biscuits', 'Snowman biscuits', 'Holly biscuits', 'Candy cane biscuits', 'Bell biscuits', 'Present biscuits'];
  const CURSOR_ACHIEVS = [
    [1, 'Click'], [2, 'Double-click'], [50, 'Mouse wheel'], [100, 'Of Mice and Men'], [200, 'The Digital'], [300, 'Extreme polydactyly'], [400, 'Dr. T'],
    [500, 'Thumbs, phalanges, metacarpals'], [600, 'With her finger and her thumb'], [700, 'Gotta hand it to you'], [800, "The devil's workshop"], [900, 'All on deck'], [1000, 'A round of applause'],
  ];
  const MIN_ACHIEVS = [
    [1, 'One with everything'], [100, 'Centennial'], [150, 'Centennial and a half'], [200, 'Bicentennial'], [250, 'Bicentennial and a half'], [300, 'Tricentennial'], [350, 'Tricentennial and a half'],
    [400, 'Quadricentennial'], [450, 'Quadricentennial and a half'], [500, 'Quincentennial'], [550, 'Quincentennial and a half'], [600, 'Sexcentennial'], [650, 'Sexcentennial and a half'], [700, 'Septcentennial'],
  ];
  const TOTAL_ACHIEVS = [[100, 'Builder'], [500, 'Architect'], [1000, 'Engineer'], [2500, 'Lord of Constructs'], [5000, 'Grand design'], [7500, 'Ecumenopolis'], [10000, 'Myriad']];
  const UPGRADE_ACHIEVS = [[20, 'Enhancer'], [50, 'Augmenter'], [100, 'Upgrader'], [200, 'Lord of Progress'], [300, 'The full picture'], [400, "When there's nothing left to add"], [500, 'Kaizen'], [600, 'Beyond quality'], [700, "Oft we mar what's well"]];
  const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
  const hasAchiev = (n) => !!(Game.Achievements && Game.Achievements[n] && Game.Achievements[n].won);

  /** The building-count achievements a building's amount reaches (Cursor's own list; the others' tiers). */
  function tierWins(b, win) {
    if (b.name === 'Cursor') CURSOR_ACHIEVS.forEach(([n, a]) => b.amount >= n && win(a));
    else Object.values(b.tieredAchievs || {}).forEach((a) => Game.Tiers && Game.Tiers[a.tier] && b.amount >= Game.Tiers[a.tier].achievUnlock && win(a.name));
  }
  /** The achievements of the game's own checks that the state as it is now reaches (main.js Logic; CM CheckOtherAchiev). */
  function otherWins(win) {
    let total = 0;
    let min = Infinity;
    let math = !hasAchiev('Mathematician');
    let base10 = !hasAchiev('Base 10');
    const n = (Game.ObjectsById || objects()).length;
    objects().forEach((o) => {
      total += o.amount;
      min = Math.min(min, o.amount);
      if (o.amount < Math.min(128, Math.pow(2, n - o.id - 1))) math = false;
      if (o.amount < (n - o.id) * 10) base10 = false;
    });
    MIN_ACHIEVS.forEach(([k, a]) => min >= k && win(a));
    if (math) win('Mathematician');
    if (base10) win('Base 10');
    TOTAL_ACHIEVS.forEach(([k, a]) => total >= k && win(a));
    const ups = Game.UpgradesOwned || 0;
    UPGRADE_ACHIEVS.forEach(([k, a]) => ups >= k && win(a));
    if (total >= 4000 && ups >= 300) win('Polymath');
    if (total >= 8000 && ups >= 400) win('Renaissance baker');
    const grandmas = (Game.GrandmaSynergies || []).filter(has).length;
    if (grandmas >= 7) win('Elder');
    if (grandmas >= 14) win('Veteran');
    if (Game.Objects.Cursor && Game.Objects.Grandma && Game.Objects.Cursor.amount + Game.Objects.Grandma.amount >= 777) win('The elder scrolls');
    if (SPOOKY.every(has)) win('Spooky cookies');
    if (SNOW.every(has)) win('Let it snow');
    if (has('Fortune cookies') && Game.Tiers && Game.Tiers.fortune && Game.Tiers.fortune.upgrades.every((u) => has(u.name))) win('O Fortuna');
    if (has('Heavenly key')) win('Wholesome');
    if (!hasAchiev('Jellicles') && Game.UpgradesByPool && Game.UpgradesByPool.kitten && Game.UpgradesByPool.kitten.filter((u) => has(u.name)).length >= 10) win('Jellicles');
  }

  /**
   * Runs `changes` — each (win) → undo: makes a change to the game (calling win(name) for an
   * achievement it wins outright), then measures — and returns [{ cps, unbuffed, mouse, won }] in
   * order, the first entry the state as it is (the baseline). The game is put back after each, and
   * recomputed once at the end.
   */
  function measureAll(changes) {
    // no game to ask (a page without Cookie Clicker's engine): everything adds nothing
    if (typeof Game.CalculateGains !== 'function') return [null].concat(changes).map(() => ({ cps: Game.cookiesPs || 0, unbuffed: Game.unbuffedCps || 0, mouse: 0, won: [] }));
    const real ={ win: Game.Win, owned: Game.AchievementsOwned, highest: Game.cookiesPsRawHighest, recalc: Game.recalculateGains };
    const out = [];
    try {
      for (const change of [() => () => {}].concat(changes)) {
        const won = [];
        const win = (what) => {
          if (Array.isArray(what)) return what.forEach(win);
          const a = Game.Achievements && Game.Achievements[what];
          if (!a || a.won) return;
          a.won = 1;
          won.push(a);
          if (typeof Game.CountsAsAchievementOwned === 'function' ? Game.CountsAsAchievementOwned(a.pool) : a.pool !== 'shadow') Game.AchievementsOwned++;
        };
        Game.Win = win;
        const undo = change(win);
        try {
          const before = Game.AchievementsOwned;
          Game.CalculateGains(); // wins the CpS milestones it reaches — into `won`
          otherWins(win);
          if (Game.AchievementsOwned !== before) Game.CalculateGains();
          out.push({ cps: Game.cookiesPs, unbuffed: Game.unbuffedCps, mouse: typeof Game.mouseCps === 'function' ? Game.mouseCps() : 0, won: won.map((a) => a.name) });
        } finally {
          if (typeof undo === 'function') undo();
          won.forEach((a) => (a.won = 0));
          Game.AchievementsOwned = real.owned;
        }
      }
    } finally {
      Game.Win = real.win;
      Game.CalculateGains();
      Game.AchievementsOwned = real.owned;
      Game.cookiesPsRawHighest = real.highest;
      Game.recalculateGains = real.recalc;
    }
    return out;
  }

  /** The change "buy n of a building". */
  const buyBuildingChange = (b, n) => (win) => {
    b.amount += n;
    tierWins(b, win);
    return () => (b.amount -= n);
  };
  /** Whether an upgrade can be measured: unbought and unlocked (not heavenly), or a switch. */
  /**
   * Switches: the game's toggle upgrades (main.js pool 'toggle') — Elder Pledge, Elder Covenant and
   * its revoking, the Golden switch, Shimmering veil, Sugar frenzy, the season biscuits, the milk /
   * background / sound selectors, the Jukebox. Things you flip, not things you own: they get no
   * payback period, no colour, no place in the rankings — never "the best buy". (A Chocolate egg is a
   * real upgrade — owned once, it pays out once — so it isn't one: it just adds no CpS.)
   */
  const isSwitch = (u) => !!u && u.pool === 'toggle';
  /** Whether an upgrade can be measured: unbought, unlocked, not heavenly, not a switch. */
  const measurable = (u) => !!u && !isSwitch(u) && !u.bought && u.unlocked !== 0 && u.unlocked !== false && u.pool !== 'prestige';
  /** The change "buy an upgrade" (a switch flips; "… [on]" turns its "[off]" twin off — switches aren't measured now, see isSwitch, but code can still ask). */
  const buyUpgradeChange = (u) => (win) => {
    const twin = /\[on\]$/.test(u.name) ? upgradeNamed(u.name.replace('[on]', '[off]')) : null;
    const target = twin && (u.name === 'Golden switch [on]' || u.name === 'Shimmering veil [on]') ? twin : u;
    const was = target.bought;
    target.bought = target === twin ? 0 : (u.bought + 1) % 2;
    const counts = typeof Game.CountsAsUpgradeOwned === 'function' ? Game.CountsAsUpgradeOwned(u.pool) : u.pool === '' || u.pool === 'cookie' || u.pool === 'tech';
    if (counts) Game.UpgradesOwned++;
    const pledges = Game.pledges;
    if (u.name === 'Elder Pledge') {
      Game.pledges = (Game.pledges || 0) + 1;
      win('Elder nap');
      if (Game.pledges >= 5) win('Elder slumber');
    } else if (u.name === 'Elder Covenant') win('Elder calm');
    else if (u.name === 'Prism heart biscuits') win('Lovely cookies');
    return () => {
      target.bought = was;
      if (counts) Game.UpgradesOwned--;
      Game.pledges = pledges;
    };
  };

  // ---- the cache -----------------------------------------------------------------------------

  // structural: what's owned, buffs, the store, golden cookies on screen; plus the CpS (refreshed at
  // most once a second when only it moves — a god of Ages wobbles it every frame)
  const structKey = () =>
    [
      objects().map((o) => `${o.amount}/${o.level || 0}`).join(','),
      Game.UpgradesOwned,
      Game.AchievementsOwned,
      Object.keys(Game.buffs || {}).join(','),
      (Game.UpgradesInStore || []).map((u) => u.name).join(','),
      Game.shimmerTypes && Game.shimmerTypes.golden ? Game.shimmerTypes.golden.n : 0,
      Game.pledges,
      Game.dragonAura,
      Game.dragonAura2,
      Game.prestige,
    ].join('|');
  let cache = null; // { key, t, cps, base, b: { 1: { name: income }, 10, 100 }, u: { name: { bonus, mouse } }, won: { 'b|name|n': [...] } }

  /** The bonus incomes, fresh: every building ×1, ×10, ×100 and every measurable upgrade in the store. */
  function compute() {
    const bs = objects();
    const us = (Game.UpgradesInStore || []).filter(measurable);
    const changes = [];
    BULKS.forEach((n) => bs.forEach((b) => changes.push(buyBuildingChange(b, n))));
    us.forEach((u) => changes.push(buyUpgradeChange(u)));
    const res = measureAll(changes);
    const base = res.shift();
    const c = { key: structKey(), t: Date.now(), cps: Game.cookiesPs, base, b: {}, u: {}, won: {}, extra: {} };
    let i = 0;
    BULKS.forEach((n) => {
      c.b[n] = {};
      bs.forEach((b) => {
        const r = res[i++];
        c.b[n][b.name] = r.cps - base.cps;
        c.won[`${b.name}|${n}`] = r.won;
      });
    });
    us.forEach((u) => {
      const r = res[i++];
      c.u[u.name] = { bonus: r.cps - base.cps, mouse: r.mouse - base.mouse, won: r.won };
    });
    return c;
  }
  function fresh() {
    const k = structKey();
    const moved = cache ? Math.abs((Game.cookiesPs || 0) - cache.cps) / Math.max(1e-9, Math.abs(cache.cps)) : 1;
    // a real change of CpS (a god, an aura, a lump…): now; a drift (the god of Ages wobbles it every frame): once a second
    if (!cache || cache.key !== k || moved > 1e-3 || (moved > 0 && Date.now() - cache.t > 1000)) cache = compute();
    return cache;
  }
  /** The bonus income of n of a building (×1/×10/×100 from the batch, other amounts measured as asked). */
  function buildingBonus(name, n = 1) {
    const b = buildingNamed(name);
    if (!b) return 0;
    const c = fresh();
    if (c.b[n] && b.name in c.b[n]) return c.b[n][b.name];
    const k = `${b.name}|${n}`;
    if (!(k in c.extra)) {
      const [base, r] = measureAll([buyBuildingChange(b, n)]);
      c.extra[k] = r.cps - base.cps;
      c.won[k] = r.won;
    }
    return c.extra[k];
  }

  // ---- payback periods, colours -------------------------------------------------------------------

  /** Cookies that count as the bank: the cookies in hand, plus your wrinklers' when that's chosen. */
  function bank() {
    const mode = CA.Settings.get('ppWrinklers');
    if (mode === 'all' || mode === 'fattest') return (Game.cookies || 0) + (CA.Wrinklers ? CA.Wrinklers.bank(mode) : 0);
    return Game.cookies || 0;
  }
  /** Cookie Monster's payback period: the wait to afford it, then its price over what it adds. */
  function pp(price, bonus) {
    if (!(bonus > 0) || !Number.isFinite(price)) return Infinity;
    const cps = Game.cookiesPs || 0;
    return cps > 0 ? Math.max(0, price - bank()) / cps + price / bonus : price / bonus;
  }
  /** Seconds until you can afford a price at your CpS (0: you can now; ∞: never). */
  function timeTo(price) {
    const short = price - bank();
    if (short <= 0) return 0;
    return Game.cookiesPs > 0 ? short / Game.cookiesPs : Infinity;
  }

  /** An upgrade's measured worth: { bonus, mouse, gain } — gain counts its clicks at your click rate. */
  function upgradeWorth(name, c = fresh()) {
    const u = upgradeNamed(name);
    if (!u || isSwitch(u)) return null;
    let e = c.u[u.name];
    if (!e && measurable(u)) {
      const [base, r] = measureAll([buyUpgradeChange(u)]);
      e = c.u[u.name] = { bonus: r.cps - base.cps, mouse: r.mouse - base.mouse, won: r.won };
    }
    if (!e) return null;
    return { bonus: e.bonus, mouse: e.mouse, gain: e.bonus + Math.max(0, e.mouse) * clickRate(), won: e.won };
  }

  /** Every building at every bulk, and every store upgrade: PP, price, bonus, colour — Cookie Monster's table. */
  let memo = null; // { c, key, t } — the table, until the bank, the CpS or the settings move
  function table() {
    const c = fresh();
    const mk = [Game.cookies, Game.cookiesPs, clickRate(), CA.Settings.get('ppWrinklers'), CA.Settings.get('ppOnlyBuyable'), CA.Settings.get('ppSecondsLowerLimit'), CA.Wrinklers ? CA.Wrinklers.bank('all') : 0].join('|');
    if (memo && memo.c === c && memo.key === mk) return memo.t;
    memo = { c, key: mk, t: tableFrom(c) };
    return memo.t;
  }
  function tableFrom(c) {
    const rows = { 1: {}, 10: {}, 100: {} };
    const ranked = [];
    BULKS.forEach((n) =>
      objects().forEach((b) => {
        const price = sumPrice(b, n);
        const bonus = c.b[n][b.name];
        const v = pp(price, bonus);
        rows[n][b.name] = { name: b.name, n, price, bonus, pp: v, won: c.won[`${b.name}|${n}`] || [] };
        ranked.push([v, n, price]);
      })
    );
    ranked.sort((a, b) => a[0] - b[0]);
    // the best building (optionally only what you can afford now)
    let at = 0;
    if (CA.Settings.get('ppOnlyBuyable')) while (at < ranked.length - 1 && ranked[at][2] > Game.cookies) at++;
    const min = ranked.length ? ranked[at][0] : Infinity;
    const minBulk = ranked.length ? ranked[at][1] : 1;
    const rank = (i) => (ranked[i] ? ranked[i][0] : Infinity);
    const colourOf = (v, price) => {
      let col;
      if (!(v > 0) || v === Infinity) col = 'gray';
      else if (v < min) col = 'blue';
      else if (v === min) col = 'green';
      else if (v < rank(10)) col = 'yellow';
      else if (v < rank(20)) col = 'orange';
      else if (v < rank(30)) col = 'red';
      else col = 'purple';
      const lower = Number(CA.Settings.get('ppSecondsLowerLimit')) || 0;
      if (lower > 0 && Game.cookiesPs > 0 && price / Game.cookiesPs < lower) col = 'blue';
      if (CA.Settings.get('ppOnlyBuyable') && price > Game.cookies) col = 'red';
      return col;
    };
    BULKS.forEach((n) => Object.values(rows[n]).forEach((r) => (r.colour = colourOf(r.pp, r.price))));
    const upgrades = {};
    const switches = [];
    (Game.UpgradesInStore || []).forEach((u) => {
      if (isSwitch(u)) return switches.push(u.name);
      const w = upgradeWorth(u.name, c);
      const price = upgradePrice(u);
      const v = w ? pp(price, w.gain) : Infinity;
      upgrades[u.name] = { name: u.name, price, bonus: w ? w.bonus : 0, mouse: w ? w.mouse : 0, gain: w ? w.gain : 0, pp: v, colour: colourOf(v, price), won: w ? w.won : [] };
    });
    return { buildings: rows, upgrades, switches, min, minBulk, colourOf };
  }

  // ---- the best thing to buy -----------------------------------------------------------------------

  /** Upgrades you could buy with cookies now (not switches, research, vaulted or lump-priced). */
  function storeUpgrades(pools) {
    return (Game.UpgradesInStore || []).filter(
      (u) => u && !u.bought && !(u.priceLumps > 0) && !(typeof u.isVaulted === 'function' && u.isVaulted()) && (pools ? pools.includes(u.pool) : u.pool !== 'toggle' && u.pool !== 'tech')
    );
  }
  /**
   * What to buy, lowest PP first: [{ kind, name, n, label, price, pp, bonus, colour }]. kind
   * 'building' | 'upgrade' | 'all'; opts.bulk: 1 (default) or 'round' — buildings to the next
   * multiple of 10 (the store's Round to multiples); opts.skip: only what you can afford now.
   */
  function ranking(kind = 'all', opts = {}) {
    const t = table();
    const out = [];
    if (kind !== 'upgrade')
      objects().forEach((b) => {
        if (b.locked) return;
        const n = opts.bulk === 'round' ? Math.max(1, 10 - ((b.amount || 0) % 10)) : opts.bulk === 10 || opts.bulk === 100 ? opts.bulk : 1;
        const row = t.buildings[n] && t.buildings[n][b.name];
        const price = row ? row.price : sumPrice(b, n);
        const bonus = row ? row.bonus : buildingBonus(b.name, n);
        const v = row ? row.pp : pp(price, bonus);
        out.push({ kind: 'building', name: b.name, n, label: n > 1 ? `${n} × ${b.dname || b.name}` : b.dname || b.name, price, bonus, pp: v, colour: row ? row.colour : 'gray' });
      });
    if (kind !== 'building')
      storeUpgrades().forEach((u) => {
        const r = t.upgrades[u.name];
        if (r) out.push({ kind: 'upgrade', name: u.name, n: 1, label: u.dname || u.name, price: r.price, bonus: r.gain, pp: r.pp, colour: r.colour, estimated: !(r.bonus > 0) && r.mouse > 0 });
      });
    return out.filter((x) => Number.isFinite(x.pp) && (!opts.skip || x.price <= Game.cookies)).sort((a, b) => a.pp - b.pp);
  }
  /** The lowest PP: { kind, name, n, price, pp, … } or null. */
  const best = (kind = 'all', opts = {}) => ranking(kind, opts)[0] || null;

  // ---- buying ------------------------------------------------------------------------------

  /** Buys n of a building (in buy mode, whatever the store is set to); how many it bought. */
  function buyBuilding(name, n) {
    const b = buildingNamed(name);
    if (!b || typeof b.buy !== 'function') return 0;
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
  function buyUpgrade(name) {
    const u = upgradeNamed(name);
    if (!u || u.bought || Game.cookies < upgradePrice(u)) return 0;
    u.buy(1);
    return u.bought ? 1 : 0;
  }
  /** Buys a ranking entry; how many things it bought. */
  const buy = (x) => (!x ? 0 : x.kind === 'building' ? buyBuilding(x.name, x.n) : buyUpgrade(x.name));

  // ---- the next building-count achievement (the store's "Achievement" sort) -------------------------

  /** How many more of a building win an achievement (counting what the others' totals reach), up to 100; 101: none within 100. */
  function toNextAchievement(name) {
    const b = buildingNamed(name);
    if (!b) return 101;
    for (let k = 1; k <= 100; k++) {
      let any = false;
      const win = (what) => {
        if (Array.isArray(what)) return what.forEach(win);
        const a = Game.Achievements && Game.Achievements[what];
        if (a && !a.won) any = true;
      };
      b.amount += k;
      try {
        tierWins(b, win);
        otherWins(win);
      } finally {
        b.amount -= k;
      }
      if (any) return k;
    }
    return 101;
  }
  const nextCache = { key: '', v: {} };
  function nextAchievement(name) {
    const k = `${objects().map((o) => o.amount).join(',')}|${Game.AchievementsOwned}|${Game.UpgradesOwned}`;
    if (nextCache.key !== k) {
      nextCache.key = k;
      nextCache.v = {};
    }
    if (!(name in nextCache.v)) nextCache.v[name] = toNextAchievement(name);
    const n = nextCache.v[name];
    const b = buildingNamed(name);
    return { n, price: n <= 100 && b ? sumPrice(b, n) : Infinity };
  }

  // ---- building blocks -------------------------------------------------------------------------------

  function init() {
    setInterval(sampleClicks, 1000);
    CA.Settings.defineOption({
      key: 'ppWrinklers',
      group: 'payback',
      icon: 'wrinkler',
      name: 'Count wrinklers in the bank',
      desc: 'Payback periods count what popping your wrinklers would give as part of your bank: none, all of them, or only the fattest (Cookie Monster’s “calculate with wrinklers”).',
      default: 'none',
      choices: [
        { v: 'none', label: 'No' },
        { v: 'all', label: 'All wrinklers' },
        { v: 'fattest', label: 'The fattest' },
      ],
    });
    CA.Settings.defineOption({
      key: 'ppOnlyBuyable',
      group: 'payback',
      icon: 'dollar',
      name: 'Best = what you can afford',
      desc: 'The best (green) building is the lowest payback period you can afford right now; anything you can’t afford yet shows red.',
      default: false,
    });
    CA.Settings.defineOption({ key: 'ppShowSwitches', group: 'payback', icon: 'filter', name: 'Show switches on the Payback page', desc: 'Switches (Elder Pledge, the Golden switch, season biscuits…) have no payback period; this shows them anyway, greyed.', default: false });
    CA.Settings.defineOption({
      key: 'ppSecondsLowerLimit',
      group: 'payback',
      icon: 'clock',
      name: 'Cheap enough to just buy (seconds)',
      desc: 'Anything costing less than this many seconds of CpS shows as blue — worth buying whatever its payback period (0: off).',
      default: 0,
    });

    const kinds = () => [
      { v: 'all', label: 'buildings and upgrades' },
      { v: 'building', label: 'buildings' },
      { v: 'upgrade', label: 'upgrades' },
    ];
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
        const b = buildingNamed(p.building);
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
        return top && top.price <= Game.cookies && buy(top) > 0 ? 1 : 0;
      },
    });
    const V = (id, desc, params, get, more) => CA.Script.defineValue({ id, desc, params, get, ...(more || {}) });
    const b1 = (n) => buildingNamed(n);
    V('building.price', 'what one more of a building costs now', ['building'], (n) => (b1(n) ? sumPrice(b1(n), 1) : NaN));
    V('building.gain', 'the CpS one more of a building adds (its bonus income)', ['building'], (n) => buildingBonus(n, 1));
    V('building.payback', 'the payback period of one more of a building (seconds)', ['building'], (n) => (b1(n) ? pp(sumPrice(b1(n), 1), buildingBonus(n, 1)) : Infinity));
    V('building.priceOf', 'what n more of a building cost now', ['building', 'n'], (n, k) => (b1(n) ? sumPrice(b1(n), Math.max(1, Math.floor(k) || 1)) : NaN));
    V('building.gainOf', 'the CpS n more of a building add', ['building', 'n'], (n, k) => buildingBonus(n, Math.max(1, Math.floor(k) || 1)));
    V('building.paybackOf', 'the payback period of n more of a building (seconds)', ['building', 'n'], (n, k) => {
      const m = Math.max(1, Math.floor(k) || 1);
      return b1(n) ? pp(sumPrice(b1(n), m), buildingBonus(n, m)) : Infinity;
    });
    V('building.toNextAchievement', 'how many more of a building win an achievement (101: none within 100)', ['building'], (n) => nextAchievement(n).n);
    // a switch has neither: NaN
    V('upgrade.gain', 'the CpS an upgrade adds (clicks counted at your click rate; NaN for a switch)', ['upgrade'], (n) => (isSwitch(upgradeNamed(n)) ? NaN : (upgradeWorth(n) || { gain: 0 }).gain));
    V('upgrade.payback', 'the payback period of an upgrade (seconds; NaN for a switch)', ['upgrade'], (n) => {
      const u = upgradeNamed(n);
      if (isSwitch(u)) return NaN;
      const w = upgradeWorth(n);
      return u && w ? pp(upgradePrice(u), w.gain) : Infinity;
    });
    V('best', 'what has the lowest payback period ("" when nothing does): kind building, upgrade or all', ['kind'], (k) => (best(k || 'all') || {}).name || '');
    V('clickRate', 'big cookie clicks per second (last 10 s)', [], clickRate);
    V('timeTo', 'seconds until you can afford a price at your CpS (0: now)', ['price'], (p) => timeTo(Number(p)));
  }

  return { init, isSwitch, table, ranking, best, buy, buyBuilding, buyUpgrade, buildingBonus, upgradeWorth, pp, timeTo, sumPrice, clickRate, nextAchievement, storeUpgrades, measureAll, COLOURS, BULKS };
})();
