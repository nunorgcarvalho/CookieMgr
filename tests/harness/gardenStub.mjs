// A garden like minigameGarden.js, shared by the garden tests.
export function makeGarden(Game) {
  const plants = {
    bakerWheat: { name: "Baker's wheat", icon: 0, ageTick: 7, ageTickR: 2, mature: 35, cost: 1, costM: 30, unlocked: 1 },
    thumbcorn: { name: 'Thumbcorn', icon: 1, ageTick: 6, ageTickR: 2, mature: 20, cost: 5, costM: 100, unlocked: 1 },
    bakeberry: { name: 'Bakeberry', icon: 3, ageTick: 1, ageTickR: 1, mature: 80, cost: 15, costM: 2e9, unlocked: 1 },
    meddleweed: { name: 'Meddleweed', icon: 8, ageTick: 10, ageTickR: 10, mature: 50, cost: 1, costM: 0, unlocked: 1, weed: true },
    goldenClover: { name: 'Golden clover', icon: 5, ageTick: 4, ageTickR: 12, mature: 50, cost: 125, costM: 777, unlocked: 0 },
    elderwort: { name: 'Elderwort', icon: 20, ageTick: 0.3, ageTickR: 0.5, mature: 90, cost: 60, costM: 1, unlocked: 1, immortal: 1 },
  };
  const plantsById = [];
  Object.keys(plants).forEach((k, i) => {
    plants[k].key = k;
    plants[k].id = i;
    plantsById.push(plants[k]);
  });
  const soils = {
    dirt: { name: 'Dirt', tick: 5, req: 0 },
    fertilizer: { name: 'Fertilizer', tick: 3, req: 50 },
    clay: { name: 'Clay', tick: 15, req: 100 },
  };
  const soilsById = [];
  Object.keys(soils).forEach((k, i) => {
    soils[k].key = k;
    soils[k].id = i;
    soilsById.push(soils[k]);
  });
  const M = {
    plants,
    plantsById,
    soils,
    soilsById,
    soil: 0,
    nextSoil: 0,
    freeze: 0,
    stepT: 300,
    nextStep: Date.now() + 200 * 1000,
    plot: Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [0, 0])),
    plotBoost: Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => [1, 1, 1])),
    parent: Game.Objects.Farm,
    harvestLog: [],
    plotLimits: [[2, 2, 4, 4], [2, 2, 5, 4], [2, 2, 5, 5], [1, 2, 5, 5]],
    isTileUnlocked(x, y) {
      const l = this.plotLimits[Math.max(1, Math.min(this.plotLimits.length, this.parent.level)) - 1];
      return x >= l[0] && x < l[2] && y >= l[1] && y < l[3];
    },
    getCost: (me) => Math.max(me.costM, Game.cookiesPs * me.cost * 60),
    canPlant(me) {
      return Game.cookies >= this.getCost(me);
    },
    unlockSeed(me) {
      if (me.unlocked) return false;
      me.unlocked = 1;
      return true;
    },
    harvest(x, y) {
      const tile = this.plot[y][x];
      if (tile[0] < 1) return false;
      const me = this.plantsById[tile[0] - 1];
      if (tile[1] >= me.mature) this.unlockSeed(me);
      this.harvestLog.push(`${me.key}@${x},${y}${tile[1] >= me.mature ? ' mature' : ''}`);
      this.plot[y][x] = [0, 0];
      return true;
    },
    computeStepT() {
      this.stepT = this.soilsById[this.soil].tick * 60;
    },
  };
  Game.Objects.Farm.level = 4; // tiles x 1–4, y 2–4
  Game.Objects.Farm.amount = 120;
  Game.Objects.Farm.minigame = M;
  Game.Spend = (n) => (Game.cookies -= n);
  Game.cookiesPs = 1;
  return M;
}
