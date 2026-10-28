// The Auto-gardener keeping a golden clover field (its Golden clover field profile) — for the garden6 scenario.
export default {
  name: 'Golden clover field',
  desc: 'cookieMgr’s Auto-gardener with the built-in “Golden clover field” profile (Effect maximizer, Fill, Golden clover).',
  setup(sim) {
    sim.CA.GardenLayers.loadProfile('goldenClovers');
    sim.macro('gardener');
  },
};
