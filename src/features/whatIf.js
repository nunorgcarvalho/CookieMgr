// What if: the CpS a change you could make would bring — Cookie Monster's pantheon and dragon aura
// tooltips, measured the way payback periods are (features/payback.js: make the change, run the
// game's own CpS calculation, put everything back):
//
//   a god in a slot      slotted as the game slots it (minigamePantheon.js slotGod: the god there
//                        swaps places with it, or leaves)
//   a dragon aura        switched into slot 1 or 2 — and, as the game charges for it, one of your
//                        highest buildings (the one furthest down the store that you own) gone
//
// Results are CpS deltas (negative: you'd lose that much), kept until the game state changes.

CA.WhatIf = (() => {
  const temple = () => CA.Util.minigame('Temple');

  const cache = { key: '', v: {} };
  const keyNow = () => `${Game.cookiesPs}|${Game.UpgradesOwned}|${Object.values(Game.Objects || {}).map((o) => o.amount).join(',')}|${Game.dragonAura}|${Game.dragonAura2}|${(temple() || { slot: [] }).slot.join(',')}`;
  function remember(k, fn) {
    const key = keyNow();
    if (cache.key !== key) {
      cache.key = key;
      cache.v = {};
    }
    if (!(k in cache.v)) cache.v[k] = fn();
    return cache.v[k];
  }
  const delta = (change) => {
    const [base, r] = CA.Payback.measureAll([change]);
    return r.cps - base.cps;
  };

  /** The CpS change of slotting a god (its key: 'mother', 'ages'…) into slot 0 (diamond), 1 (ruby), 2 (jade) or -1 (out). */
  function godGain(godKey, slot) {
    const M = temple();
    const god = M && M.gods && M.gods[godKey];
    if (!god || typeof M.slotGod !== 'function') return 0;
    const s = Number(slot);
    if (god.slot === s) return 0;
    return remember(`god|${godKey}|${s}`, () =>
      delta(() => {
        const slots = M.slot.slice();
        const where = Object.values(M.godsById || M.gods).map((g) => [g, g.slot]);
        M.slotGod(god, s);
        return () => {
          slots.forEach((v, i) => (M.slot[i] = v));
          where.forEach(([g, at]) => (g.slot = at));
        };
      })
    );
  }

  /** The building a new aura costs: the furthest down the store that you own (or null). */
  function auraCost() {
    const owned = Object.values(Game.Objects || {}).filter((o) => o.amount > 0);
    return owned.sort((a, b) => b.id - a.id)[0] || null;
  }
  /** The CpS change of putting an aura (its name) in slot 1 or 2 — counting the building it costs. */
  function auraGain(name, slot = 1) {
    const aura = Game.dragonAurasBN && Game.dragonAurasBN[name];
    if (!aura) return 0;
    const key = Number(slot) === 2 ? 'dragonAura2' : 'dragonAura';
    if (Game[key] === aura.id) return 0;
    return remember(`aura|${name}|${key}`, () =>
      delta(() => {
        const was = Game[key];
        const cost = auraCost();
        Game[key] = aura.id;
        if (cost) cost.amount--;
        return () => {
          Game[key] = was;
          if (cost) cost.amount++;
        };
      })
    );
  }

  function init() {
    const V = (id, desc, get, params) => CA.Script.defineValue({ id, desc, get, params });
    V('pantheon.cpsGain', 'the CpS slotting a god would bring (slot: diamond, ruby, jade or none)', (god, slot) => godGain(god, { diamond: 0, ruby: 1, jade: 2, none: -1 }[String(slot)] ?? Number(slot)), ['god', 'slot']);
    V('dragon.auraCpsGain', 'the CpS switching to a dragon aura would bring, counting the building it costs (slot 1 or 2)', (aura, slot) => auraGain(aura, slot), ['aura', 'slot']);
  }

  return { init, godGain, auraGain, auraCost };
})();
