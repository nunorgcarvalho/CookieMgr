// Force the Hand of Fate, forecast: what the next casts will give. The Grimoire seeds every cast:
// castSpell runs Math.seedrandom(Game.seed + '/' + M.spellsCastTotal) before the spell rolls, so the
// n-th cast from now is fixed by your save — CookieMgr replays the same draws, in the game's order
// (minigameGrimoire.js 'hand of fate', main.js golden initFunc):
//
//   1  backfire?        a draw < 1 − fail chance wins (the fail chance as it is at the cast: +15% per
//                       golden cookie on screen, Magic adept/inept, Supreme Intellect)
//   2  the cookie       new Game.shimmer('golden', …): a picture draw in Valentine's, Business day,
//                       Easter and Halloween; then its x and y (a forced cookie draws nothing for wrath)
//   3  the outcome      a win: Cookie storm + Blab (10%), Building special (25%, with 10+ buildings — no
//                       draw with fewer), Cookie storm drop instead of all (15%), Free sugar lump (0.01%),
//                       then one of the list (Click frenzy left out under Dragonflight). A backfire: Cursed
//                       finger + Elder frenzy (10%), Free sugar lump (0.3%), Blab instead of all (10%), then
//                       one of the list.
//
// Every spell cast (but a passthrough) moves the seed on, so casting something cheap skips an outcome.
// Gambler's Fever Dream casts at seed N, picks a spell with its first draw (from what's affordable at
// half cost), and a second later casts it at seed N + 1 with at least a 50% fail chance — a passthrough,
// so the next cast is at N + 1 too: the same outcome, at the normal fail chance.
//
// The generator is seedrandom 2.0 (ARC4, by David Bau, MIT — the one in main.js), reimplemented here as
// a pure function: the game's own Math.seedrandom swaps the global Math.random, which a forecast mustn't
// do. tests/sim/fthof checks it against the game's, and every forecast against real casts.
//
// Words: fthof.next(), fthof.nextIs(outcome), fthof.after(n), fthof.castsUntil(outcome), fthof.backfireChance().

CA.Fthof = (() => {
  const grimoire = () => CA.Util.minigame('Wizard tower');

  // ---- seedrandom 2.0 (ARC4): width 256, chunks 6, significance 52 ----------------------------------
  const WIDTH = 256;
  const CHUNKS = 6;
  const MASK = WIDTH - 1;
  const STARTDENOM = WIDTH ** CHUNKS;
  const SIGNIFICANCE = 2 ** 52;
  const OVERFLOW = SIGNIFICANCE * 2;
  /** A generator of the numbers Math.seedrandom(seed) would make Math.random give. */
  function seeded(seed) {
    const key = [];
    const s = String(seed);
    let smear = 0;
    for (let i = 0; i < s.length; i++) {
      smear ^= (key[MASK & i] || 0) * 19;
      key[MASK & i] = MASK & (smear + s.charCodeAt(i));
    }
    const S = [];
    let i = 0;
    let j = 0;
    const k = key.length ? key : [0];
    for (let n = 0; n < WIDTH; n++) S[n] = n;
    for (let n = 0, g = 0; n < WIDTH; n++) {
      const t = S[n];
      g = MASK & (g + k[n % k.length] + t);
      S[n] = S[g];
      S[g] = t;
    }
    const next = (count) => {
      let c = 0;
      while (count--) {
        i = MASK & (i + 1);
        const t = S[i];
        j = MASK & (j + t);
        S[i] = S[j];
        S[j] = t;
        c = c * WIDTH + S[MASK & (S[i] + S[j])];
      }
      return c;
    };
    next(WIDTH); // RC4-drop[256]
    return () => {
      let n = next(CHUNKS);
      let d = STARTDENOM;
      let x = 0;
      while (n < SIGNIFICANCE) {
        n = (n + x) * WIDTH;
        d *= WIDTH;
        x = next(1);
      }
      while (n >= OVERFLOW) {
        n /= 2;
        d /= 2;
        x >>>= 1;
      }
      return (n + x) / d;
    };
  }

  // ---- the outcomes -----------------------------------------------------------------------------
  const OUTCOMES = {
    frenzy: { name: 'Frenzy', good: true },
    'multiply cookies': { name: 'Lucky', good: true },
    'click frenzy': { name: 'Click frenzy', good: true },
    'cookie storm': { name: 'Cookie storm', good: true },
    blab: { name: 'Blab (nothing)', good: false },
    'building special': { name: 'Building special', good: true },
    'cookie storm drop': { name: 'Cookie (a storm drop)', good: false },
    'free sugar lump': { name: 'Free sugar lump', good: true },
    clot: { name: 'Clot', good: false },
    'ruin cookies': { name: 'Ruin', good: false },
    'cursed finger': { name: 'Cursed finger', good: false },
    'blood frenzy': { name: 'Elder frenzy', good: true },
  };
  const nameOf = (type) => (OUTCOMES[type] ? OUTCOMES[type].name : type);
  const PICTURE_SEASONS = ['valentines', 'fools', 'easter', 'halloween'];
  const choose = (rng, list) => list[Math.floor(rng() * list.length)];

  /** The draws `new Game.shimmer('golden', …)` makes before the outcome: a picture (some seasons), x, y. */
  function cookieDraws(rng) {
    if (PICTURE_SEASONS.includes(Game.season)) rng();
    rng();
    rng();
  }
  function winOf(rng) {
    cookieDraws(rng);
    let choices = ['frenzy', 'multiply cookies'];
    if (!(typeof Game.hasBuff === 'function' && Game.hasBuff('Dragonflight'))) choices.push('click frenzy');
    if (rng() < 0.1) choices.push('cookie storm', 'cookie storm', 'blab');
    if ((Game.BuildingsOwned || 0) >= 10 && rng() < 0.25) choices.push('building special');
    if (rng() < 0.15) choices = ['cookie storm drop'];
    if (rng() < 0.0001) choices.push('free sugar lump');
    return choose(rng, choices);
  }
  function backfireOf(rng) {
    cookieDraws(rng);
    let choices = ['clot', 'ruin cookies'];
    if (rng() < 0.1) choices.push('cursed finger', 'blood frenzy');
    if (rng() < 0.003) choices.push('free sugar lump');
    if (rng() < 0.1) choices = ['blab'];
    return choose(rng, choices);
  }

  const seedOf = (M, n) => `${Game.seed}/${(M.spellsCastTotal || 0) + n}`;
  const failChance = (M) => (M && M.spells && typeof M.getFailChance === 'function' ? M.getFailChance(M.spells['hand of fate']) : 0.15);

  /** What Force the Hand of Fate gives cast at seed `seed` with fail chance `fc`: { roll, win, backfire, outcome, wrath }. */
  function castAt(seed, fc) {
    const roll = seeded(seed)();
    const w = seeded(seed);
    w();
    const b = seeded(seed);
    b();
    const win = winOf(w);
    const backfire = backfireOf(b);
    const ok = roll < 1 - fc;
    return { roll, win, backfire, outcome: ok ? win : backfire, wrath: !ok };
  }

  /** Gambler's Fever Dream cast at seed `seed`: the spell it picks (by its key) from what's affordable now, or null. */
  function feverDreamPick(M, seed) {
    const self = M.spells["gambler's fever dream"];
    if (!self) return null;
    const selfCost = M.getSpellCost(self);
    const list = Object.keys(M.spells).filter((k) => k !== "gambler's fever dream" && M.magic - selfCost >= M.getSpellCost(M.spells[k]) * 0.5);
    if (!list.length) return null;
    return choose(seeded(seed), list);
  }

  /**
   * The next `count` casts: [{ n (1: the next cast), roll, failChance, outcome, name, good, wrath, win,
   * backfire, gfd: { spell, name, fthof?: { outcome, name, wrath } } }] — each row is what Force the Hand
   * of Fate would give as that cast (the casts before it being anything); gfd: what Gambler's Fever Dream
   * would do as that cast, and if it picks Force the Hand of Fate, what that gives (seed + 1, ≥ 50% fail).
   * null without the Grimoire.
   */
  function forecast(count = 10) {
    const M = grimoire();
    if (!M || !M.spells || !M.spells['hand of fate'] || Game.seed === undefined) return null;
    const fc = failChance(M);
    const out = [];
    for (let n = 1; n <= count; n++) {
      const c = castAt(seedOf(M, n - 1), fc);
      const pick = feverDreamPick(M, seedOf(M, n - 1));
      const gfd = pick ? { spell: pick, name: M.spells[pick].name } : null;
      if (gfd && pick === 'hand of fate') {
        const inner = castAt(seedOf(M, n), Math.max(fc, 0.5));
        gfd.fthof = { outcome: inner.outcome, name: nameOf(inner.outcome), wrath: inner.wrath };
      }
      out.push({ n, roll: c.roll, failChance: fc, outcome: c.outcome, name: nameOf(c.outcome), good: !!(OUTCOMES[c.outcome] || {}).good, wrath: c.wrath, win: c.win, backfire: c.backfire, gfd });
    }
    return out;
  }

  /** How many casts before Force the Hand of Fate gives `outcome` (0: the next one), within `within` casts; -1: not that soon. */
  function castsUntil(outcome, within = 100) {
    const want = String(outcome).toLowerCase();
    const f = forecast(within) || [];
    const i = f.findIndex((x) => x.outcome === want || x.name.toLowerCase() === want);
    return i;
  }

  function init() {
    const V = (id, desc, params, get, more) => CA.Script.defineValue({ id, desc, params, get, ...(more || {}) });
    const next = () => (forecast(1) || [{ outcome: '' }])[0].outcome;
    V('fthof.next', 'what Force the Hand of Fate gives cast next (the game’s name: frenzy, click frenzy, building special, multiply cookies, cookie storm, clot…; "" without the Grimoire)', [], next);
    V('fthof.nextIs', 'whether Force the Hand of Fate cast next gives an outcome (frenzy, click frenzy, building special…)', ['outcome'], (o) => next() === String(o).toLowerCase(), { bool: true });
    V('fthof.after', 'what Force the Hand of Fate gives as the n-th cast from now (1: the next; other spells cast before it count)', ['n'], (n) => {
      const k = Math.max(1, Math.floor(Number(n)) || 1);
      const f = forecast(k);
      return f ? f[k - 1].outcome : '';
    });
    V('fthof.castsUntil', 'how many casts (of anything) before Force the Hand of Fate gives an outcome (0: the next; -1: not within 100)', ['outcome'], (o) => castsUntil(o));
    V('fthof.backfireChance', 'Force the Hand of Fate’s chance to backfire now (0–1)', [], () => failChance(grimoire()));
  }

  return { init, forecast, castAt, castsUntil, seeded, feverDreamPick, OUTCOMES, nameOf };
})();
