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
  // The bonus incomes are measured lazily, in batches, only as something asks for them: buying (the
  // ranking) asks for the buildings you can buy, at the amount you'd buy, and the store's upgrades;
  // the full table (the colours, the Payback page) for every building at ×1, ×10 and ×100 — Cookie
  // Monster's colour scale ranks all sixty. Whatever has been measured is kept until the state changes.
  let cache = null; // { key, t, cps, b: { 'name|n': income }, u: { name: { bonus, mouse, won } }, won: { 'name|n': [...] } }

  function fresh() {
    const k = structKey();
    const moved = cache ? Math.abs((Game.cookiesPs || 0) - cache.cps) / Math.max(1e-9, Math.abs(cache.cps)) : 1;
    // a real change of CpS (a god, an aura, a lump…): now; a drift (the god of Ages wobbles it every frame): once a second
    if (!cache || cache.key !== k || moved > 1e-3 || (moved > 0 && Date.now() - cache.t > 1000)) cache = { key: k, t: Date.now(), cps: Game.cookiesPs, b: {}, u: {}, won: {} };
    return cache;
  }
  let calls = 0; // CpS computations so far (for the tests' and the simulator's benefit)
  /**
   * A cookie upgrade's worth without asking the game: the game counts the cookie upgrades in one
   * place only (main.js CalculateGains: mult × (1 + power%)), so one that wins no achievement (no
   * upgrade-count milestone, no set like Spooky cookies, no CpS milestone) adds exactly CpS × power%
   * — and to a click, a fixed share of that (a click is worth a fixed part plus 1% of CpS per mouse
   * upgrade). Its power, or null when it has to be measured.
   */
  function cookiePower(u) {
    if (!u || !(Game.cookieUpgrades || []).includes(u)) return null;
    const p = typeof u.power === 'function' ? u.power(u) : u.power;
    if (!Number.isFinite(p)) return null;
    const owned = Game.UpgradesOwned || 0;
    const counts = typeof Game.CountsAsUpgradeOwned === 'function' ? Game.CountsAsUpgradeOwned(u.pool) : u.pool === 'cookie';
    if (counts && UPGRADE_ACHIEVS.some(([k, a]) => owned < k && owned + 1 >= k && !hasAchiev(a))) return null;
    const raw = Game.cookiesPsRaw || 0;
    if ((Game.CpsAchievements || []).some((a) => !a.won && raw < a.threshold && raw * (1 + p / 100) >= a.threshold)) return null;
    // the sets and other checks of the game: anything they'd win with it bought?
    const wins = () => {
      const out = [];
      otherWins((w) => [].concat(w).forEach((n) => Game.Achievements[n] && !Game.Achievements[n].won && out.push(n)));
      return out.join('|');
    };
    const before = wins();
    const was = u.bought;
    u.bought = 1;
    let after;
    try {
      after = wins();
    } finally {
      u.bought = was;
    }
    return before === after ? p : null;
  }

  /**
   * Measures what `c` doesn't have yet — buildings [[name, n]…] and upgrades (names) — in one batch.
   * Cookie upgrades that win nothing are worked out (cookiePower) — after one of them is measured
   * with the rest as a check: should it not come out the same (a mod, a game change), they're all
   * measured.
   */
  function ensure(c, bs, us) {
    const needB = bs.filter(([n, k]) => !(`${n}|${k}` in c.b) && buildingNamed(n));
    let needU = us.filter((n) => !(n in c.u) && measurable(upgradeNamed(n)));
    if (!needB.length && !needU.length) return;
    const easy = needU.map((n) => [n, cookiePower(upgradeNamed(n))]).filter(([, p]) => p !== null);
    const sample = easy.length > 1 ? easy[0] : null;
    const derived = sample ? easy.slice(1) : [];
    if (derived.length) needU = needU.filter((n) => !derived.some(([d]) => d === n));
    const res = measureAll(needB.map(([n, k]) => buyBuildingChange(buildingNamed(n), k)).concat(needU.map((n) => buyUpgradeChange(upgradeNamed(n)))));
    calls += res.length + 1;
    const base = res.shift();
    needB.forEach(([n, k], i) => {
      c.b[`${n}|${k}`] = res[i].cps - base.cps;
      c.won[`${n}|${k}`] = res[i].won;
    });
    needU.forEach((n, i) => {
      const r = res[needB.length + i];
      c.u[n] = { bonus: r.cps - base.cps, mouse: r.mouse - base.mouse, won: r.won };
    });
    if (!derived.length) return;
    const s = c.u[sample[0]];
    const predicted = (base.cps * sample[1]) / 100;
    if (s && Math.abs(s.bonus - predicted) <= 1e-9 * Math.max(1, Math.abs(predicted))) {
      const clickShare = s.bonus ? s.mouse / s.bonus : 0;
      derived.forEach(([n, p]) => {
        const bonus = (base.cps * p) / 100;
        c.u[n] = { bonus, mouse: bonus * clickShare, won: [] };
      });
    } else ensure(c, [], derived.map(([n]) => n)); // not as expected: measure them all
  }
  /** The bonus income of n of a building. */
  function buildingBonus(name, n = 1) {
    const b = buildingNamed(name);
    if (!b) return 0;
    const c = fresh();
    ensure(c, [[b.name, n]], []);
    return c.b[`${b.name}|${n}`];
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

  /**
   * An upgrade's measured worth: { bonus, mouse, gain } — gain counts its clicks at your click rate.
   * opts.any: one not in the store yet too (locked: what it would add if you had it now).
   */
  function upgradeWorth(name, c = fresh(), opts = {}) {
    const u = upgradeNamed(name);
    if (!u || isSwitch(u)) return null;
    ensure(c, [], [u.name]);
    if (opts.any && !(u.name in c.u) && !u.bought && u.pool !== 'prestige') {
      const [base, r] = measureAll([buyUpgradeChange(u)]);
      calls += 2;
      c.u[u.name] = { bonus: r.cps - base.cps, mouse: r.mouse - base.mouse, won: r.won };
    }
    const e = c.u[u.name];
    if (!e) return null;
    return { bonus: e.bonus, mouse: e.mouse, gain: e.bonus + Math.max(0, e.mouse) * clickRate(), won: e.won };
  }

  /** Every building at every bulk, and every store upgrade: PP, price, bonus, colour — Cookie Monster's table. */
  let memo = null; // { c, key, t, at } — the table, until the bank, the CpS or the settings move
  /**
   * The table. opts.staleMs: one worked out at most that long ago will do (the store's colours and
   * sort, redrawn every half second: while purchases come one after another — an autobuyer with a
   * big bank — they'd otherwise measure sixty rows on each).
   */
  function table(opts = {}) {
    if (opts.staleMs && memo && Date.now() - memo.at < opts.staleMs) return memo.t;
    const c = fresh();
    const mk = [Game.cookies, Game.cookiesPs, clickRate(), CA.Settings.get('ppWrinklers'), CA.Settings.get('ppOnlyBuyable'), CA.Settings.get('ppSecondsLowerLimit'), CA.Wrinklers ? CA.Wrinklers.bank('all') : 0].join('|');
    if (memo && memo.c === c && memo.key === mk) return memo.t;
    memo = { c, key: mk, t: tableFrom(c), at: Date.now() };
    return memo.t;
  }
  function tableFrom(c) {
    // every building at every bulk, and the store's upgrades: one batch for whatever isn't measured yet
    ensure(
      c,
      BULKS.flatMap((n) => objects().map((b) => [b.name, n])),
      (Game.UpgradesInStore || []).map((u) => u.name)
    );
    const rows = { 1: {}, 10: {}, 100: {} };
    const ranked = [];
    BULKS.forEach((n) =>
      objects().forEach((b) => {
        const price = sumPrice(b, n);
        const bonus = c.b[`${b.name}|${n}`];
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
   * 'building' | 'upgrade' | 'all'; opts.bulk: 1 (default), 10, 100, 'round' (to the next multiple of 10)
   * or 'auto' — what CookieMgr's buyers buy (CA.Shop.buyAmount: the minimum bulk, rounded up with
   * Round to multiples); opts.skip: only what you can afford now (with opts.budget cookies, when
   * given: the bank less what a buyer keeps in it);
   * opts.top: only the best has to be right (best()) — what can't beat it isn't measured: an upgrade
   * whose wait to afford alone is longer than the best building's payback period (a payback period is
   * at least that wait), anything you can't afford when skipping.
   */
  function ranking(kind = 'all', opts = {}) {
    const c = fresh();
    // only what can be bought: the unlocked buildings at the amount a buy would take, the store's upgrades
    let bs =
      kind === 'upgrade'
        ? []
        : objects()
            .filter((b) => !b.locked)
            .map((b) => [b.name, opts.bulk === 'auto' ? (CA.Shop ? CA.Shop.buyAmount(b) : 1) : opts.bulk === 'round' ? Math.max(1, 10 - ((b.amount || 0) % 10)) : opts.bulk === 10 || opts.bulk === 100 ? opts.bulk : 1]);
    let us = kind === 'building' ? [] : storeUpgrades();
    const budget = Number.isFinite(opts.budget) ? opts.budget : Game.cookies;
    const affordable = (price) => price <= budget;
    if (opts.skip && opts.top) {
      bs = bs.filter(([name, n]) => affordable(sumPrice(buildingNamed(name), n)));
      us = us.filter((u) => affordable(upgradePrice(u)));
    }
    ensure(c, bs, []);
    if (opts.top && us.length) {
      const bestB = bs.reduce((m, [name, n]) => Math.min(m, pp(sumPrice(buildingNamed(name), n), c.b[`${name}|${n}`])), Infinity);
      if (Number.isFinite(bestB)) us = us.filter((u) => timeTo(upgradePrice(u)) < bestB);
    }
    ensure(
      c,
      [],
      us.map((u) => u.name)
    );
    // colours come from the full table — when it's been worked out for this state (the store, the Payback page)
    const t = memo && memo.c === c ? memo.t : null;
    const out = [];
    bs.forEach(([name, n]) => {
      const b = buildingNamed(name);
      const price = sumPrice(b, n);
      const bonus = c.b[`${name}|${n}`];
      const v = pp(price, bonus);
      const row = t && t.buildings[n] && t.buildings[n][name];
      out.push({ kind: 'building', name, n, label: n > 1 ? `${n} × ${b.dname || name}` : b.dname || name, price, bonus, pp: v, colour: row ? row.colour : t ? t.colourOf(v, price) : null });
    });
    us.forEach((u) => {
      const w = upgradeWorth(u.name, c);
      if (!w) return;
      const price = upgradePrice(u);
      const v = pp(price, w.gain);
      const row = t && t.upgrades[u.name];
      out.push({ kind: 'upgrade', name: u.name, n: 1, label: u.dname || u.name, price, bonus: w.gain, pp: v, colour: row ? row.colour : t ? t.colourOf(v, price) : null, estimated: !(w.bonus > 0) && w.mouse > 0 });
    });
    return out.filter((x) => Number.isFinite(x.pp) && (!opts.skip || affordable(x.price))).sort((a, b) => a.pp - b.pp);
  }
  /** The lowest PP: { kind, name, n, price, pp, … } or null — buildings in the minimum bulk unless opts.bulk says otherwise. */
  const best = (kind = 'all', opts = {}) => ranking(kind, { bulk: 'auto', ...opts, top: true })[0] || null;

  // ---- by actual income ------------------------------------------------------------------------
  // A payback period counts in CpS: what the game says you make. What you actually take in — the
  // Recorder's baked cookies: clicking, golden cookies, wrinklers, everything — can be more (an
  // active player) or less. The payback period by actual income scales it by that:
  //   PPa = PP × CpS ÷ A(W)      A(W): the actual income averaged over the last W seconds of play
  // (both the wait to afford and the earning back go at A instead of CpS), with W the period itself —
  // what you made over a stretch as long as the wait is the best guess for it — and at least 5
  // minutes: W = max(300 s, PPa), worked out by iterating. A(W) comes from the Recorder, in windows
  // 25% apart (300 s, 375 s, 469 s…), each read at most every 5 s. History is only read.
  const ACTUAL_MIN = 300;
  const ACTUAL_STEP = 1.25;
  const ACTUAL_STALE_MS = 5000;
  let actualMemo = { at: -Infinity, m: new Map() };
  const windowBucket = (secs) => Math.max(0, Math.ceil(Math.log(Math.max(secs, ACTUAL_MIN) / ACTUAL_MIN) / Math.log(ACTUAL_STEP) - 1e-9));
  /** The actual income over (about) the last secs seconds of play: { actual, secs (recorded), window } or null — under a minute recorded. */
  function actualIncome(secs) {
    const R = CA.Recorder;
    if (!R || typeof R.recent !== 'function') return null;
    const now = Date.now();
    if (now - actualMemo.at > ACTUAL_STALE_MS) actualMemo = { at: now, m: new Map() };
    const k = windowBucket(secs);
    if (!actualMemo.m.has(k)) {
      const window = ACTUAL_MIN * ACTUAL_STEP ** k;
      const r = R.recent(window);
      actualMemo.m.set(k, r && r.secs >= 60 && Number.isFinite(r.actual) ? { actual: r.actual, secs: r.secs, window } : null);
    }
    return actualMemo.m.get(k);
  }
  /**
   * A payback period by actual income: { pp, ratio (actual ÷ CpS), actual, window, secs } — or null
   * when there's too little recorded (under a minute) or no CpS. ∞ stays ∞.
   */
  function ppActual(ppc) {
    const C = Game.cookiesPs;
    if (!(C > 0) || Number.isNaN(ppc)) return null;
    let W = Math.max(ACTUAL_MIN, Number.isFinite(ppc) ? ppc : ACTUAL_MIN);
    let r = null;
    let v = NaN;
    for (let i = 0; i < 16; i++) {
      r = actualIncome(W);
      if (!r) return null;
      v = r.actual > 0 ? (ppc * C) / r.actual : Infinity;
      const next = Math.max(ACTUAL_MIN, Number.isFinite(v) ? v : W);
      if (windowBucket(next) === windowBucket(W)) break;
      W = next;
    }
    return { pp: Number.isFinite(ppc) ? v : ppc, ratio: r.actual / C, actual: r.actual, window: r.window, secs: r.secs };
  }

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
      key: 'ppActual',
      group: 'payback',
      icon: 'graphs',
      name: 'Payback by actual income',
      desc: 'The Payback page shows payback periods by what you’ve actually been taking in (clicking, golden cookies, wrinklers — the Recorder’s baked cookies) instead of by CpS.',
      default: false,
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
    V('paybackActual', 'a payback period by actual income: the period × CpS ÷ what you took in over a stretch as long (NaN: too little recorded)', ['seconds'], (p) => (ppActual(Number(p)) || { pp: NaN }).pp);
    V('paybackActualRatio', 'what you actually took in over a payback period’s stretch, as a multiple of your CpS (NaN: too little recorded)', ['seconds'], (p) => (ppActual(Number(p)) || { ratio: NaN }).ratio);
    V('actualIncome', 'cookies a second you actually took in over about the last seconds of play (at least 5 minutes; NaN: too little recorded)', ['seconds'], (p) => (actualIncome(Number(p) || 0) || { actual: NaN }).actual);
  }

  return { init, isSwitch, ppActual, actualIncome, calls: () => calls, table, ranking, best, buy, buyBuilding, buyUpgrade, buildingBonus, upgradeWorth, pp, timeTo, sumPrice, clickRate, nextAchievement, storeUpgrades, measureAll, COLOURS, BULKS };
})();
