// Prestige: what ascending now would bring — Cookie Monster's "Prestige" statistics, from the game's
// own rules (main.js HowMuchPrestige: level = ∛(cookies baked in all runs ÷ 10¹²)):
//
//   gain        prestige levels you'd get if you ascended now
//   toNext      cookies still to bake for one more
//   perSecond   levels a second at the rate you're baking (the derivative of the cube root × cookies a
//               second — your CpS, or what the history recorder saw you earn, clicks and golden cookies too)
//   cpsGain     the CpS those new levels would add (+1% each × the heavenly multiplier) — asked of the
//               game, like the payback numbers
//   lucky…      the next total level ending in 7, 777, 777777 — what the Lucky digit, Lucky number and
//               Lucky payout heavenly upgrades need
// and a target of your own (prestigeTarget): the cookies it takes, and how long at this rate.

CA.Prestige = (() => {
  const levelOf = (cookies) => (typeof Game.HowMuchPrestige === 'function' ? Game.HowMuchPrestige(cookies) : Math.cbrt(cookies / 1e12));
  const cookiesFor = (level) => (typeof Game.HowManyCookiesReset === 'function' ? Game.HowManyCookiesReset(level) : Math.pow(level, 3) * 1e12);
  const baked = () => (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);

  /** Prestige levels owned (as the game counts them before this run). */
  const owned = () => Math.floor(levelOf(Game.cookiesReset || 0));
  /** Total level if you ascended now. */
  const total = () => Math.floor(levelOf(baked()));
  const gain = () => Math.max(0, total() - owned());
  /** Cookies still to bake for the next level. */
  const toNext = () => Math.max(0, cookiesFor(total() + 1) - baked());
  /** Cookies baked a second: what the recorder saw over the last minute (clicks, golden cookies…), else CpS. */
  function bakeRate() {
    const r = CA.Recorder && typeof CA.Recorder.recent === 'function' ? CA.Recorder.recent(60) : null;
    return r && Number.isFinite(r.actual) && r.actual > 0 ? r.actual : Game.cookiesPs || 0;
  }
  /** Levels a second at that rate: d∛(c/10¹²)/dc × rate. */
  function perSecond() {
    const c = baked();
    if (!(c > 0)) return 0;
    const lvl = levelOf(c);
    return lvl > 0 ? (bakeRate() * lvl) / (3 * c) : 0;
  }
  /** Seconds until a total level at the current rate (0: reached). */
  function secondsTo(level) {
    const need = cookiesFor(level) - baked();
    if (need <= 0) return 0;
    const r = bakeRate();
    return r > 0 ? need / r : Infinity;
  }

  /** The CpS the levels you'd gain would add — asked of the game (Game.prestige raised, CpS recomputed, put back). */
  let gainCache = { key: '', v: 0 };
  function cpsGain() {
    const g = gain();
    if (!g || typeof Game.CalculateGains !== 'function' || !CA.Payback) return 0;
    const key = `${g}|${Game.cookiesPs}|${Game.prestige}`;
    if (gainCache.key !== key) {
      const was = Game.prestige;
      const [base, r] = CA.Payback.measureAll([
        () => {
          Game.prestige = was + g;
          return () => (Game.prestige = was);
        },
      ]);
      gainCache = { key, v: r.cps - base.cps };
    }
    return gainCache.v;
  }

  /** The next total level (≥ now) whose digits end in `ending` (7, 777, 777777). */
  function nextEnding(ending) {
    const t = total();
    const mod = Math.pow(10, String(ending).length);
    let n = t - (t % mod) + Number(ending);
    if (n < t) n += mod;
    return n;
  }
  const LUCKY = [
    { name: 'Lucky digit', ending: 7 },
    { name: 'Lucky number', ending: 777 },
    { name: 'Lucky payout', ending: 777777 },
  ];
  /** The Lucky heavenly upgrades: { name, owned, level (the next total level that qualifies), toGo (levels to bake) }. */
  const lucky = () =>
    LUCKY.map((l) => {
      const level = nextEnding(l.ending);
      return { name: l.name, owned: typeof Game.Has === 'function' && !!Game.Has(l.name), level, toGo: level - total() };
    });

  function init() {
    CA.Settings.defineOption({
      key: 'prestigeTarget',
      group: 'prestige-hidden',
      name: 'Prestige target',
      desc: 'A total prestige level to bake towards (0: none) — how many cookies and how long it takes.',
      default: 0,
    });
    const V = (id, desc, get, params) => CA.Script.defineValue({ id, desc, get, params });
    V('prestige.ifAscended', 'prestige levels you’d gain if you ascended now', gain);
    V('prestige.toNext', 'cookies still to bake for one more prestige level', toNext);
    V('prestige.perSecond', 'prestige levels a second at the rate you’re baking', perSecond);
    V('prestige.cpsGain', 'the CpS the levels you’d gain would add', cpsGain);
    V('prestige.cookiesFor', 'cookies baked in all, to reach a total prestige level', (l) => cookiesFor(Number(l) || 0), ['level']);
    V('prestige.secondsTo', 'seconds until a total prestige level at the rate you’re baking', (l) => secondsTo(Number(l) || 0), ['level']);
  }

  return { init, owned, total, gain, toNext, perSecond, secondsTo, cpsGain, cookiesFor, levelOf, nextEnding, lucky, bakeRate };
})();
