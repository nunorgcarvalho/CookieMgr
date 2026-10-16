// A level-6 Farm (a 5 × 4 garden) with 300 farms, every basic seed plus golden clover and nursetulip unlocked, and plenty of cookies to plant with.
export default {
  name: 'garden6',
  desc: 'A garden ready to farm: level 6, 300 farms (wood chips), golden clover and nursetulip unlocked, 1e20 cookies.',
  prepare(sim) {
    const G = sim.Game;
    G.cookies = 1e20;
    G.cookiesEarned = 1e20;
    G.Objects.Farm.getFree(300);
    G.Objects.Farm.level = 6;
    G.LoadMinigames();
    sim.run({ seconds: 1 }); // the minigame's script loads on a short timer
    const M = G.Objects.Farm.minigame;
    if (!M) throw new Error('The garden did not load');
    ['bakerWheat', 'thumbcorn', 'cronerice', 'gildmillet', 'clover', 'goldenClover', 'nursetulip'].forEach((k) => M.unlockSeed(M.plants[k]));
    M.computeStepT();
  },
};
