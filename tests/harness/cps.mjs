// A CpS model for the fake game (harness/game.mjs), for tests of what buying is worth
// (features/payback.js asks the game: change something, Game.CalculateGains(), read the CpS).
//
//   cpsModel(Game, { base, each: { Cursor: 0.1, … }, mults: { 'Kitten helpers': 1.15, … },
//                    mouse: { 'Plastic mouse': 0.01, … } })
//
// CpS = (base + Σ amount × each) × Π mults of the upgrades bought, × the buffs' multCpS; a click is
// worth 1 + Σ (CpS × mouse) of the upgrades bought. Buildings price like main.js (basePrice ×
// 1.15^amount) when they have a basePrice. Returns the model (change it, then Game.CalculateGains()).
export function cpsModel(Game, { base = 1000, each = {}, mults = {}, mouse = {} } = {}) {
  const m = { base, each, mults, mouse };
  const bought = (name) => {
    const u = (Game.Upgrades && Game.Upgrades[name]) || (Game.UpgradesInStore || []).find((x) => x && x.name === name);
    return !!(u && u.bought);
  };
  Game.priceIncrease = 1.15;
  Game.modifyBuildingPrice = (b, p) => p;
  Game.CalculateGains = () => {
    let s = m.base;
    Object.values(Game.Objects).forEach((b) => (s += (b.amount || 0) * (m.each[b.name] || 0)));
    let mult = 1;
    Object.keys(m.mults).forEach((n) => bought(n) && (mult *= m.mults[n]));
    Game.unbuffedCps = s * mult;
    let buffs = 1;
    Object.values(Game.buffs || {}).forEach((b) => b.multCpS !== undefined && (buffs *= b.multCpS));
    Game.cookiesPs = Game.unbuffedCps * buffs;
    Game.cookiesPsRaw = Game.unbuffedCps;
  };
  Game.mouseCps = () => 1 + Object.keys(m.mouse).reduce((a, n) => a + (bought(n) ? Game.cookiesPs * m.mouse[n] : 0), 0);
  Game.CalculateGains();
  return m;
}
