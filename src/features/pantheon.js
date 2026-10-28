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
// Profiles: named combinations of the three slots (a spirit's key, or "" for an empty slot), saved
// with the game. Two to start with, ordinary ones (rename them, delete them) whose ids stay put:
//   wrinklers   Skruuia (Scorn) in the diamond slot, nothing else
//   golden      Vomitrax (Decadence), Selebrak (Festivities), Muridal (Labor)
//
//   pantheon.profile(p)        slots a profile (its id or its name): its spirits, diamond to jade,
//                              while swaps last, then empties the rest (free); call it again to finish
//   pantheon.profileActive(p)  whether the three slots are the profile's
//   pantheon.profileSwaps(p)   worship swaps it still takes
//   pantheon.activeProfile()   the profile the slots are now ("" when none)
//   pantheon.profiles()        a list: every profile's id
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

  // ---- profiles ------------------------------------------------------------------------------

  const DEFAULTS = () => [
    { id: 'wrinklers', name: 'Wrinklers', slots: ['scorn', '', ''] },
    { id: 'golden', name: 'Golden', slots: ['decadence', 'seasons', 'labor'] },
  ];
  let profiles = DEFAULTS();
  const changed = () => CA.Events.emit('pantheon');
  const cleanSlots = (a) => {
    const out = [0, 1, 2].map((i) => (Array.isArray(a) && typeof a[i] === 'string' ? a[i].slice(0, 40) : ''));
    // a spirit sits in one slot at most
    return out.map((k, i) => (k && out.indexOf(k) < i ? '' : k));
  };
  const cleanName = (n, fallback) => String(n == null ? '' : n).trim().slice(0, 40) || fallback;

  /** A profile from its id or its name (any case), or null. */
  function profileOf(x) {
    if (x == null || x === '') return null;
    const k = String(x).toLowerCase();
    return profiles.find((p) => p.id === String(x)) || profiles.find((p) => p.name.toLowerCase() === k) || null;
  }
  const list = () => profiles.map((p) => ({ id: p.id, name: p.name, slots: p.slots.slice() }));
  /** What's in the three slots now, as keys ("" empty). */
  function current() {
    const M = minigame();
    return M ? M.slot.map((id) => (id >= 0 && M.godsById[id] ? keyOf(M, M.godsById[id]) : '')) : ['', '', ''];
  }
  /** Spirits a profile names, as this game's keys (one it doesn't know: left as it is). */
  const wanted = (p) => p.slots.map((k) => (k ? (godOf(k) ? keyOf(minigame(), godOf(k)) : k) : ''));
  const isActive = (x) => {
    const p = profileOf(x);
    if (!p || !minigame()) return false;
    const now = current();
    return wanted(p).every((k, i) => k === now[i]);
  };
  /** Swaps a profile still takes from the slots now: each spirit it moves in (as the game swaps them). */
  function swapsFor(x) {
    const p = profileOf(x);
    if (!p || !minigame()) return 0;
    const now = current();
    let n = 0;
    wanted(p).forEach((k, i) => {
      if (!k || k === now[i]) return;
      n++;
      const j = now.indexOf(k);
      if (j >= 0) now[j] = now[i];
      now[i] = k;
    });
    return n;
  }
  /**
   * Slots a profile: its spirits first, diamond to jade, while swaps last (one already in another
   * slot trades places with what's there, as in the game), then empties the slots it leaves empty
   * (free). How many spirits moved: 0 when it's on, or nothing could move.
   */
  function apply(x) {
    const p = profileOf(x);
    if (!p || !minigame()) return 0;
    const want = wanted(p);
    let n = 0;
    want.forEach((k, i) => {
      if (k && k !== current()[i] && godOf(k)) n += slot(k, SLOTS[i]);
    });
    want.forEach((k, i) => {
      const now = current()[i];
      if (!k && now) n += slot(now, 'none');
    });
    return n;
  }
  /** A new profile (the slots now when none are given): its id. */
  function add(name, slots) {
    let id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    while (profileOf(id)) id += 'x';
    profiles.push({ id, name: cleanName(name, 'My spirits'), slots: cleanSlots(slots || current()) });
    changed();
    return id;
  }
  function rename(id, name) {
    const p = profiles.find((x) => x.id === id);
    if (!p || !String(name).trim()) return;
    p.name = cleanName(name, p.name);
    changed();
  }
  function remove(id) {
    const n = profiles.length;
    profiles = profiles.filter((x) => x.id !== id);
    if (profiles.length !== n) changed();
  }
  /** One slot of a profile (a spirit already in another of its slots leaves that one). */
  function setSlot(id, i, key) {
    const p = profiles.find((x) => x.id === id);
    if (!p || !(i >= 0 && i < 3)) return;
    const k = String(key || '');
    p.slots = p.slots.map((s, j) => (j === i ? k : k && s === k ? '' : s));
    changed();
  }
  const serialize = () => ({ profiles: list() });
  function load(data) {
    const ps = data && Array.isArray(data.profiles) ? data.profiles : null;
    profiles = ps
      ? ps
          .filter((x) => x && x.id)
          .map((x) => ({ id: String(x.id), name: cleanName(x.name, 'Spirits'), slots: cleanSlots(x.slots) }))
          .filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i)
      : DEFAULTS();
    changed();
  }

  function init() {
    CA.Settings.registerSection('pantheon', { serialize, load, event: 'pantheon' });
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

    V('pantheon.profiles', 'a list: every Pantheon profile (its id)', () => profiles.map((p) => p.id), { list: true });
    V('pantheon.activeProfile', 'the Pantheon profile the three slots are now ("" when none)', () => {
      const p = profiles.find((x) => isActive(x.id));
      return p ? p.id : '';
    });
    V('pantheon.profileActive', 'whether the three slots are a profile’s (its id or name)', (x) => isActive(x), { params: ['profile'], bool: true });
    V('pantheon.profileSwaps', 'worship swaps a profile still takes (0 when it’s on)', (x) => swapsFor(x), { params: ['profile'] });
    CA.Actions.register({
      id: 'pantheon.profile',
      name: 'Use a Pantheon profile',
      icon: 'pantheon',
      group: 'Pantheon',
      unit: 'moved',
      params: [{ key: 'profile', label: 'Pantheon profile', type: 'select', default: 'golden', options: () => profiles.map((p) => ({ v: p.id, label: p.name })) }],
      available: () => !!minigame(),
      run: (p) => apply(p.profile),
    });
  }

  // a profile's id in code (pantheon.profile(golden)…), and a spirit's key: the code editors' hover cards
  const strip = (html) =>
    String(html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const godName = (k) => (godOf(k) ? strip(godOf(k).name).split(',')[0] : k);
  CA.Words.defineKind('profile.pantheon', {
    name: 'Pantheon profile',
    info: (id) => {
      const p = profileOf(id);
      if (!p) return null;
      return {
        title: p.name,
        sig: p.id,
        desc: 'Puts these spirits in the Pantheon’s slots.',
        rows: SLOTS.map((s, i) => [s, p.slots[i] ? godName(p.slots[i]) : '(left as it is)']).concat(minigame() ? [['in now', isActive(p.id) ? 'yes' : `no · ${swapsFor(p.id)} swap${swapsFor(p.id) === 1 ? '' : 's'} to go`]] : []),
        note: 'Pantheon page.',
      };
    },
  });
  CA.Words.defineKind('spirit', {
    name: 'Pantheon spirit',
    info: (id) => {
      const g = godOf(id);
      if (!g) return null;
      const M = minigame();
      const at = M ? M.slot.indexOf(g.id != null ? g.id : M.godsById.indexOf(g)) : -1;
      return {
        title: strip(g.name),
        desc: strip(g.descBefore),
        rows: [g.desc1 && ['diamond', strip(g.desc1)], g.desc2 && ['ruby', strip(g.desc2)], g.desc3 && ['jade', strip(g.desc3)], ['slotted', at >= 0 ? SLOTS[at] : 'no']].filter(Boolean),
      };
    },
  });

  return { init, minigame, slot, godOf, SLOTS, profiles: list, profileOf, current, isActive, swapsFor, apply, add, rename, remove, setSlot };
})();
