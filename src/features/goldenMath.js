// What golden cookies (and a few spells and plants) pay, and the bank each needs to pay its most —
// Cookie Monster's "Lucky Cookies", "Chain Cookies", "Spells" and "Garden" statistics, from the game's
// own formulas (main.js shimmerTypes.golden.popFunc, minigameGrimoire.js, minigameGarden.js).
//
//   Lucky!            mult × min(bank × 15%, CpS × 15 min) + 13   → the bank for its most: CpS × 900 / 0.15
//                     (in a Frenzy CpS is ×7, so 7 times that bank)
//   Cookie chain      digits of 7 (wrath: 6) growing tenfold per cookie, each capped at min(CpS × 6 h,
//                     bank ÷ 2) × mult; the chain ends at the cap — so the bank that lets it run to the
//                     CpS cap is twice its last payout
//   Conjure Baked     min(bank × 15%, CpS × 30 min) (at least 7)  → bank: CpS × 1800 / 0.15
//   Goods
//   Spontaneous       a random building you have fewer than 400 of, fewer than of your most-owned
//   Edifice           building, costing at most twice your bank   → bank: the most expensive of them ÷ 2
//                     (Cookie Monster asks for twice the price — the game asks for half)
//   Bakeberry …       a mature harvest pays min(bank × p, CpS × t): Bakeberry 3% / 30 min, Chocoroot and
//                     White chocoroot 3% / 3 min, Queenbeet 4% / 1 h, Duketater 8% / 2 h
//
// "CpS" is what a golden cookie will see: no buffs (they'd be over by then — or are the point:
// "Frenzy" figures multiply by 7), the Golden switch off (golden cookies don't come while it's on),
// and with the Dragon's Fortune aura the cookie itself on screen. mult: Green yeast digestives,
// Dragon fang, the Ancestral Metamorphosis (Unholy Dominion for wrath) aura, garden effects.

CA.GoldenMath = (() => {
  const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
  const aura = (n) => (typeof Game.auraMult === 'function' ? Game.auraMult(n) : 0);
  const eff = (n) => (typeof Game.eff === 'function' ? Game.eff(n) : 1);

  /** What a golden (or wrath) cookie multiplies its payout by. */
  function mult(wrath) {
    let m = 1;
    if (has('Green yeast digestives')) m *= 1.01;
    if (has('Dragon fang')) m *= 1.03;
    if (wrath) m *= (1 + aura('Unholy Dominion') * 0.1) * eff('wrathCookieGain');
    else m *= (1 + aura('Ancestral Metamorphosis') * 0.1) * eff('goldenCookieGain');
    return m;
  }

  const buffMult = () => Object.values(Game.buffs || {}).reduce((m, b) => (b && b.multCpS !== undefined ? m * b.multCpS : m), 1);
  /** CpS with the Golden switch off (golden cookies only come then) — asked of the game when it's on. */
  let switchCache = { key: '', v: 0 };
  function cpsSwitchOff() {
    if (!has('Golden switch [off]')) return Game.cookiesPs || 0;
    const key = `${Game.cookiesPs}|${Game.UpgradesOwned}`;
    if (switchCache.key !== key) {
      const u = Game.Upgrades['Golden switch [off]'];
      const [, r] = CA.Payback.measureAll([
        () => {
          u.bought = 0;
          return () => (u.bought = 1);
        },
      ]);
      switchCache = { key, v: r.cps };
    }
    return switchCache.v;
  }
  /** The CpS a golden cookie's payout is worked out with (see the top). */
  function baseCps() {
    const b = buffMult();
    if (!(b > 0)) return 0;
    let cps = cpsSwitchOff() / b;
    const golden = Game.shimmerTypes && Game.shimmerTypes.golden;
    if (golden && golden.n === 0) cps *= 1 + aura("Dragon's Fortune") * 1.23;
    return cps;
  }

  // ---- Lucky!, Conjure Baked Goods ------------------------------------------------------------

  function lucky(frenzy = false) {
    const cps = baseCps() * (frenzy ? 7 : 1);
    const bank = (cps * 900) / 0.15;
    return { bank, reward: mult(false) * cps * 900 + 13, wrathReward: mult(true) * cps * 900 + 13 };
  }
  function conjure(frenzy = false) {
    const cps = baseCps() * (frenzy ? 7 : 1);
    return { bank: (cps * 1800) / 0.15, reward: Math.max(7, cps * 1800) };
  }

  // ---- cookie chains -----------------------------------------------------------------------------

  /**
   * A chain run to the end (main.js "chain cookie"): { total, last, nextBank } — what it pays in all, its
   * last payout, and the bank that would let it go one digit further. maxPayout: the CpS cap.
   */
  function chainRun(digit, maxPayout, m) {
    let total = 0;
    let moni = 0;
    let next = 0;
    let nextRequired = 0;
    let chain = 1 + Math.max(0, Math.ceil(Math.log(Math.max(1, Game.cookies || 0)) / Math.LN10) - 10);
    let guard = 0;
    while (next < maxPayout * m && guard++ < 400) {
      moni = Math.max(digit, Math.min(Math.floor((1 / 9) * Math.pow(10, chain) * digit * m), maxPayout * m));
      next = Math.max(digit, Math.min(Math.floor((1 / 9) * Math.pow(10, chain + 1) * digit * m), maxPayout * m));
      nextRequired = Math.floor((1 / 9) * Math.pow(10, chain + 1) * digit * m);
      total += moni;
      chain++;
    }
    return { total, last: moni, nextRequired };
  }
  /** A chain's most: { total, bank } — bank: what lets it run to the CpS cap (twice its last payout). */
  function chain(wrath = false, frenzy = false) {
    const m = mult(wrath);
    const cap = baseCps() * 60 * 60 * 6 * (frenzy ? 7 : 1);
    const r = chainRun(wrath ? 6 : 7, cap, m);
    return { total: r.total, last: r.last, bank: (r.last * 2) / m, nextBank: r.nextRequired / 60 / 60 / 6 };
  }

  // ---- Spontaneous Edifice ------------------------------------------------------------------------

  /** The best building Spontaneous Edifice can give and the bank it needs: { building, price, bank } (or null). */
  function edifice() {
    const all = Object.values(Game.Objects || {});
    let max = 0;
    let n = 0;
    all.forEach((o) => {
      if (o.amount > max) max = o.amount;
      if (o.amount > 0) n++;
    });
    let best = null;
    all.forEach((o) => {
      const price = typeof o.getPrice === 'function' ? o.getPrice() : o.price;
      if ((o.amount < max || n === 1) && o.amount < 400 && Number.isFinite(price) && (!best || price > best.price)) best = { building: o.name, price, bank: price / 2 };
    });
    return best;
  }

  // ---- plants that pay when harvested -------------------------------------------------------------

  const PLANTS = { bakeberry: [0.03, 30 * 60], chocoroot: [0.03, 3 * 60], whiteChocoroot: [0.03, 3 * 60], queenbeet: [0.04, 3600], duketater: [0.08, 7200] };
  /** A plant's harvest at its most: { bank, reward } (null for a plant that doesn't pay). Uses the game's CpS as it is. */
  function plant(key) {
    const p = PLANTS[key];
    if (!p) return null;
    const cps = Game.cookiesPs || 0;
    return { bank: (cps * p[1]) / p[0], reward: cps * p[1] };
  }

  function init() {
    const V = (id, desc, get, params) => CA.Script.defineValue({ id, desc, get, params });
    V('bank.lucky', 'the bank a Lucky! needs to pay its most (15 min of CpS)', () => lucky().bank);
    V('bank.luckyFrenzy', 'the bank a Lucky! in a Frenzy needs to pay its most', () => lucky(true).bank);
    V('bank.conjure', 'the bank Conjure Baked Goods needs to pay its most (30 min of CpS)', () => conjure().bank);
    V('bank.chain', 'the bank a cookie chain needs to run to its cap (6 h of CpS)', () => chain().bank);
    V('bank.chainFrenzy', 'the bank a cookie chain in a Frenzy needs to run to its cap', () => chain(false, true).bank);
    V('bank.edifice', 'the bank Spontaneous Edifice needs to give your most expensive eligible building', () => (edifice() || { bank: 0 }).bank);
    V('bank.plant', 'the bank a plant’s harvest needs to pay its most (bakeberry, chocoroot, queenbeet, duketater…)', (k) => (plant(k) || { bank: 0 }).bank, ['plant']);
    V('reward.lucky', 'what a Lucky! pays at its most', () => lucky().reward);
    V('reward.luckyFrenzy', 'what a Lucky! in a Frenzy pays at its most', () => lucky(true).reward);
    V('reward.chain', 'what a cookie chain pays in all, at its most', () => chain().total);
    V('reward.conjure', 'what Conjure Baked Goods pays at its most', () => conjure().reward);
  }

  return { init, mult, baseCps, lucky, conjure, chain, chainRun, edifice, plant, PLANTS };
})();
