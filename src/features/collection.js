// What's left to collect — Cookie Monster's "missing upgrades / achievements" lists and its "Season
// Specials" and garden drop statistics:
//
//   upgrades       the ones you don't own, in the game's order, by kind: regular, cookies, heavenly
//                  (not switches, debug or unused ones)
//   achievements   the regular ones you haven't won (not shadow achievements)
//   seasons        each season's drops you're missing (features/seasons.js has the lists)
//   plant drops    the garden's rare drops (main.js, the plants that drop an upgrade when harvested)

CA.Collection = (() => {
  const PLANT_DROPS = ['Elderwort biscuits', 'Bakeberry cookies', 'Duketater cookies', 'Green yeast digestives', 'Wheat slims', 'Fern tea', 'Ichor syrup'];
  const SKIP_POOLS = ['toggle', 'unused', 'debug'];
  const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
  const hasOrUnlocked = (n) => has(n) || (typeof Game.HasUnlocked === 'function' && !!Game.HasUnlocked(n));

  const byOrder = (a, b) => (a.order || 0) - (b.order || 0) || (a.id || 0) - (b.id || 0);
  /** Upgrades you don't own: { regular, cookie, prestige } — lists of names, in the game's order. */
  function missingUpgrades() {
    const out = { regular: [], cookie: [], prestige: [] };
    Object.values(Game.Upgrades || {})
      .filter((u) => u && !u.bought && !SKIP_POOLS.includes(u.pool))
      .sort(byOrder)
      .forEach((u) => (u.pool === 'prestige' ? out.prestige : u.pool === 'cookie' ? out.cookie : out.regular).push(u.name));
    return out;
  }
  /** Regular achievements you haven't won (names, in the game's order). */
  const missingAchievements = () =>
    Object.values(Game.Achievements || {})
      .filter((a) => a && !a.won && a.pool !== 'shadow' && a.pool !== 'dungeon')
      .sort(byOrder)
      .map((a) => a.name);

  /** Each season's drops you're missing: { christmas: [...], halloween, easter, valentines }. */
  function missingSeasonDrops() {
    const out = {};
    ['christmas', 'halloween', 'easter', 'valentines'].forEach((s) => (out[s] = (CA.Seasons && CA.Seasons.dropsOf ? CA.Seasons.dropsOf(s) : []).filter((n) => !hasOrUnlocked(n))));
    return out;
  }
  const missingPlantDrops = () => PLANT_DROPS.filter((n) => !hasOrUnlocked(n));

  function init() {
    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, ...(more || {}) });
    V('missing.upgrades', 'how many upgrades you don’t own yet (regular, cookies and heavenly)', () => {
      const m = missingUpgrades();
      return m.regular.length + m.cookie.length + m.prestige.length;
    });
    V('missing.achievements', 'how many regular achievements you haven’t won', () => missingAchievements().length);
    V('missing.seasonDrops', 'how many of a season’s drops you’re missing (christmas, halloween, easter, valentines)', (s) => (missingSeasonDrops()[s] || []).length, { params: ['season'] });
    V('missing.plantDrops', 'how many of the garden’s rare drops you’re missing', () => missingPlantDrops().length);
  }

  return { init, missingUpgrades, missingAchievements, missingSeasonDrops, missingPlantDrops, PLANT_DROPS };
})();
