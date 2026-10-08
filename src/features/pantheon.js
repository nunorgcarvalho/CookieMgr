// The Temple's Pantheon: building blocks for algorithmic macros — which spirit is in which slot,
// and slotting them (the same as dragging one in the Temple: a swap each, while you have one).
//
//   pantheon.gods()            a list: every spirit (its key: asceticism, decadence, ruin…)
//   pantheon.god(slot)         the spirit in a slot — diamond, ruby or jade ("" when empty)
//   pantheon.slotOf(god)       where a spirit is: diamond, ruby, jade or none
//   pantheon.isSlotted(god)    whether it's in one of the three
//   pantheon.swaps()           worship swaps left (0–3; they come back over hours)
//   pantheon.slot(god, slot)   puts a spirit in a slot (slot none: back to the roster, free)
//
// Game facts (minigamePantheon.js): M.gods by key, M.godsById, M.slot[0..2] = god id or -1 (diamond,
// ruby, jade); dropping a spirit on a slot costs M.useSwap(1) and only works with swaps left;
// M.slotGod(god, slot) swaps out whoever was there; taking one off a slot is free.

CA.Pantheon = (() => {
  const SLOTS = ['diamond', 'ruby', 'jade'];
  const minigame = () => {
    const M = CA.Util.minigame('Temple');
    return M && Array.isArray(M.slot) && M.godsById ? M : null;
  };
  /** A spirit from its key (asceticism), its name (Holobore…), or its number. */
  function godOf(key) {
    const M = minigame();
    if (!M || key == null || key === '') return null;
    const k = String(key).toLowerCase();
    if (M.gods) {
      const byKey = Object.keys(M.gods).find((x) => x.toLowerCase() === k);
      if (byKey) return M.gods[byKey];
    }
    return M.godsById.find((g, i) => String(g.id != null ? g.id : i) === k || (g.name && g.name.toLowerCase().startsWith(k))) || null;
  }
  const keyOf = (M, g) => (M.gods && Object.keys(M.gods).find((k) => M.gods[k] === g)) || String(g.id != null ? g.id : M.godsById.indexOf(g));
  const slotIndex = (s) => (s === 'none' || s === -1 || s === '-1' ? -1 : SLOTS.indexOf(String(s).toLowerCase()) >= 0 ? SLOTS.indexOf(String(s).toLowerCase()) : Number.isInteger(Number(s)) && Number(s) >= 0 && Number(s) < 3 ? Number(s) : null);
  const idOf = (M, g) => (g.id != null ? g.id : M.godsById.indexOf(g));
  const slotOfGod = (M, g) => M.slot.indexOf(idOf(M, g));

  /** Puts a spirit's tile where its slot is, or back in the roster (as the game does when it loads). */
  function place(g) {
    const div = document.getElementById(`templeGod${g.id}`);
    if (!div) return;
    if (g.slot !== -1) {
      const s = document.getElementById(`templeSlot${g.slot}`);
      if (s) s.appendChild(div);
    } else {
      const ph = document.getElementById(`templeGodPlaceholder${g.id}`);
      if (ph && ph.parentNode) {
        ph.parentNode.insertBefore(div, ph);
        ph.style.display = 'none';
      }
    }
  }

  /** Slots a spirit like dragging it there: 1 when it moved, 0 when it couldn't (no swaps left, already there). */
  function slot(godKey, slotKey) {
    const M = minigame();
    const g = godOf(godKey);
    const s = slotIndex(slotKey);
    if (!M || !g || s == null || typeof M.slotGod !== 'function') return 0;
    if (slotOfGod(M, g) === s) return 0;
    if (s !== -1) {
      if (!(M.swaps > 0)) return 0;
      M.useSwap(1);
      M.lastSwapT = 0;
    }
    const prev = s !== -1 && M.slot[s] !== -1 ? M.godsById[M.slot[s]] : null;
    M.slotGod(g, s);
    place(g);
    if (prev) place(prev);
    return 1;
  }

  function init() {
    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, ...(more || {}) });
    V('pantheon.gods', 'a list: every spirit of the Pantheon', () => {
      const M = minigame();
      return M ? M.godsById.map((g) => keyOf(M, g)) : [];
    }, { list: true });
    V('pantheon.god', 'the spirit in a slot — diamond, ruby or jade ("" when empty)', (s) => {
      const M = minigame();
      const i = slotIndex(s);
      return M && i != null && i >= 0 && M.slot[i] !== -1 ? keyOf(M, M.godsById[M.slot[i]]) : '';
    }, { params: ['slot'] });
    V('pantheon.slotOf', 'where a spirit is: diamond, ruby, jade or none', (k) => {
      const M = minigame();
      const g = godOf(k);
      return M && g ? SLOTS[slotOfGod(M, g)] || 'none' : 'none';
    }, { params: ['god'] });
    V('pantheon.isSlotted', 'whether a spirit is in one of the three slots', (k) => {
      const M = minigame();
      const g = godOf(k);
      return !!(M && g && slotOfGod(M, g) >= 0);
    }, { params: ['god'], bool: true });
    V('pantheon.swaps', 'worship swaps left (0–3)', () => (minigame() || {}).swaps || 0);
    const godOptions = () => {
      const M = minigame();
      return M ? M.godsById.map((g) => ({ v: keyOf(M, g), label: g.name })) : [];
    };
    CA.Actions.register({
      id: 'pantheon.slot',
      name: 'Put a spirit in a slot',
      icon: 'pantheon',
      group: 'Pantheon',
      unit: 'swapped',
      params: [
        { key: 'god', label: 'Spirit', type: 'select', default: '', options: godOptions },
        { key: 'slot', label: 'Slot', type: 'select', default: 'diamond', options: () => SLOTS.concat('none').map((v) => ({ v, label: v === 'none' ? 'none (back to the roster)' : v })) },
      ],
      available: () => !!minigame(),
      run: (p) => slot(p.god, p.slot),
    });
  }

  return { init, minigame, slot, godOf, SLOTS };
})();
