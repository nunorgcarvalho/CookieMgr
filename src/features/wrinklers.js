// Wrinklers: what popping each would give back, and what they're doing to your CpS — Cookie Monster's
// "Wrinklers" statistics and its "calculate with wrinklers" bank, from the game's own pop formula
// (main.js, the wrinkler's death):
//
//   eaten × 1.1 × 1.05 (Sacrilegious corruption) × (1 + 0.2 × Dragon Guts) × 3 (shiny)
//         × 1.05 (Wrinklerspawn) × Skruuia (1.15 / 1.1 / 1.05 in the diamond / ruby / jade slot)
//
// (Cookie Monster leaves out the Dragon Guts aura — this follows the game.) Each eats 5% of your CpS
// (× Dragon Guts, × garden effects) while it's attached; all of them can't eat more than all of it.

CA.Wrinklers = (() => {
  const has = (n) => typeof Game.Has === 'function' && !!Game.Has(n);
  const list = () => (Game.wrinklers || []).filter((w) => w && w.phase > 0);

  /** What one wrinkler has eaten comes back as this many times over. */
  function popMult(w) {
    let m = 1.1;
    if (has('Sacrilegious corruption')) m *= 1.05;
    m *= 1 + (typeof Game.auraMult === 'function' ? Game.auraMult('Dragon Guts') : 0) * 0.2;
    if (w && w.type === 1) m *= 3;
    if (has('Wrinklerspawn')) m *= 1.05;
    if (Game.hasGod) {
      const lvl = Game.hasGod('scorn');
      if (lvl === 1) m *= 1.15;
      else if (lvl === 2) m *= 1.1;
      else if (lvl === 3) m *= 1.05;
    }
    return m;
  }
  /** What popping a wrinkler gives now. */
  const reward = (w) => (w ? (w.sucked || 0) * popMult(w) : 0);

  /** { total, normal, shiny, fattest: { i, reward } | null, count, shinies, eating } — eating: those attached. */
  function summary() {
    const s = { total: 0, normal: 0, shiny: 0, fattest: null, count: 0, shinies: 0, eating: 0 };
    list().forEach((w) => {
      const r = reward(w);
      s.total += r;
      s.count++;
      if (w.phase === 2) s.eating++;
      if (w.type === 1) {
        s.shiny += r;
        s.shinies++;
      } else {
        s.normal += r;
        if (!s.fattest || r > s.fattest.reward) s.fattest = { i: w.id !== undefined ? w.id : Game.wrinklers.indexOf(w), reward: r };
      }
    });
    return s;
  }
  /** The wrinkler bank for payback periods: 'all' (every one), 'fattest' (the fattest non-shiny), else 0. */
  function bank(mode) {
    const s = summary();
    if (mode === 'all') return s.total;
    if (mode === 'fattest') return s.fattest ? s.fattest.reward : 0;
    return 0;
  }
  /** Cookies a second your wrinklers eat right now. */
  const eatingRate = () => (Game.cookiesPs || 0) * (Game.cpsSucked || 0);

  function init() {
    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, ...(more || {}) });
    // a wrinkler is named as wrinklers() names it (gameActions.js): its id, else its place
    const named = (k) => (Game.wrinklers || []).find((w, i) => String(w.id != null ? w.id : i) === String(k) && w.phase > 0) || null;
    V('wrinkler.reward', 'what popping a wrinkler would give back now', (k) => reward(named(k)), { params: ['wrinkler'] });
    V('wrinklers.reward', 'what popping every wrinkler would give back now', () => summary().total);
    V('wrinklers.rewardFattest', 'what popping the fattest (non-shiny) wrinkler would give back', () => bank('fattest'));
    V('wrinklers.eating', 'cookies a second your wrinklers eat', eatingRate);
  }

  return { init, popMult, reward, summary, bank, eatingRate };
})();
