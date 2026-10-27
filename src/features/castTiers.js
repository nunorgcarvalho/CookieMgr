// Cast tiers: when "Force the Hand of Fate on combos" casts. Combos (effects that must all be on at
// once) go into tiers, and each tier casts only once magic is far enough up the bar — 0% is the
// spell's cost (cast the moment it's affordable), 100% a full bar. Magic refills with the square
// root of how full the bar is, so the best combos cast at once and the rest wait for a full bar,
// where refill would go to waste anyway.
//
//   Combos     a list of effects: frenzy, click frenzy, dragonflight, building special, elder frenzy,
//              dragon harvest. A combo is on when at least those effects are (others can be on too;
//              "building special" twice wants two different ones), each with at least the profile's
//              time left (so the golden cookie the spell brings still finds them).
//   Deciding   the tiers from the lowest threshold up: the first with a combo on decides — it casts
//              when there's magic for the spell and the bar is at its threshold or more. Only what's
//              on now counts: nothing here reads the seed or guesses what the spell will do.
//   Profiles   everything above (tiers, combos, time left) as named profiles, saved with the game;
//              one is in use. Two come seeded, with stable ids a macro can count on after a rename:
//                default    Strongest combos at 0% (Frenzy or a building special, with Click frenzy or
//                           Dragonflight), Regular combos at 100% (Frenzy + a building special, two
//                           building specials, Elder frenzy)
//                savingUp   the strongest combos only
//
//   For algorithmic code:
//     grimoire.fthofReady()          whether a tier would cast Force the Hand of Fate now
//     grimoire.fthofTier()           the name of the tier with a combo on ("" none)
//     grimoire.fthofCombo()          that combo, e.g. "Frenzy + Click frenzy" ("" none)
//     grimoire.fill()                how far up the bar magic is, 0–100 (0: the spell's cost)
//     grimoire.profile(profile)      uses a profile — its id or name (an action)
//     grimoire.profileActive(p)      whether that profile is the one in use
//     grimoire.activeProfile()       the id of the profile in use
//     grimoire.profiles()            a list: the profiles' ids

CA.CastTiers = (() => {
  const SPELL = 'hand of fate';
  // Game facts (main.js Game.buffType): the names Game.buffs keys them by, their icons; building
  // specials are type 'building buff', each named after its building (icon: the building's column, row 14).
  const EFFECTS = [
    { key: 'frenzy', name: 'Frenzy', abbr: 'F', buff: 'Frenzy', icon: [10, 14] },
    { key: 'click frenzy', name: 'Click frenzy', abbr: 'CF', buff: 'Click frenzy', icon: [0, 14] },
    { key: 'dragonflight', name: 'Dragonflight', abbr: 'DF', buff: 'Dragonflight', icon: [0, 25] },
    { key: 'building special', name: 'Building special', abbr: 'BS', icon: [2, 14] },
    { key: 'elder frenzy', name: 'Elder frenzy', abbr: 'EF', buff: 'Elder frenzy', icon: [29, 6] },
    { key: 'dragon harvest', name: 'Dragon Harvest', abbr: 'DH', buff: 'Dragon Harvest', icon: [10, 25] },
  ];
  const byKey = {};
  EFFECTS.forEach((e) => (byKey[e.key] = e));
  const MIN_LEFT = 5; // seconds, the seeds' time left
  const MAX_LEFT = 30;
  const STRONGEST = [
    ['frenzy', 'click frenzy'],
    ['frenzy', 'dragonflight'],
    ['building special', 'click frenzy'],
    ['building special', 'dragonflight'],
  ];
  const REGULAR = [['frenzy', 'building special'], ['building special', 'building special'], ['elder frenzy']];
  const SEEDS = [
    {
      id: 'default',
      name: 'Default',
      minLeft: MIN_LEFT,
      tiers: [
        { name: 'Strongest combos', pct: 0, combos: STRONGEST },
        { name: 'Regular combos', pct: 100, combos: REGULAR },
      ],
    },
    { id: 'savingUp', name: 'Saving up', minLeft: MIN_LEFT, tiers: [{ name: 'Strongest combos', pct: 0, combos: STRONGEST }] },
  ];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  let profiles = [];
  let active = 'default';

  // ---- clean data ------------------------------------------------------------------------------

  const clampPct = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const clampLeft = (v) => Math.max(0, Math.min(MAX_LEFT, Math.round(Number(v) || 0)));
  /** A combo: known effects only, in the picker's order; [] when none is left. */
  function cleanCombo(c) {
    const keys = (Array.isArray(c) ? c : []).map((k) => String(k).toLowerCase()).filter((k) => byKey[k]);
    return keys.sort((a, b) => EFFECTS.indexOf(byKey[a]) - EFFECTS.indexOf(byKey[b]));
  }
  const comboKey = (c) => cleanCombo(c).join('+');
  function cleanTier(t) {
    const combos = [];
    (t && Array.isArray(t.combos) ? t.combos : []).forEach((c) => {
      const k = cleanCombo(c);
      if (k.length && !combos.some((x) => x.join('+') === k.join('+'))) combos.push(k);
    });
    return { name: String((t && t.name) || 'Tier').slice(0, 40), pct: clampPct(t && t.pct), combos };
  }
  function cleanProfile(p) {
    return {
      id: String(p.id),
      name: String(p.name).slice(0, 40),
      minLeft: p.minLeft == null ? MIN_LEFT : clampLeft(p.minLeft),
      tiers: (Array.isArray(p.tiers) ? p.tiers : []).map(cleanTier),
    };
  }

  profiles = SEEDS.map(cleanProfile);

  // ---- the game now ----------------------------------------------------------------------------

  const grimoire = () => CA.Grimoire.minigame();
  /** { magic, max, cost } for Force the Hand of Fate, or null without the Grimoire. */
  function bar() {
    const m = grimoire();
    const sp = m && m.spells[SPELL];
    if (!sp) return null;
    return { magic: m.magic, max: m.magicM, cost: m.getSpellCost(sp) };
  }
  /** How far up the bar magic is: 0 at the spell's cost, 100 full (null without the Grimoire). */
  function fill() {
    const b = bar();
    if (!b) return null;
    if (b.max <= b.cost) return b.magic >= b.cost ? 100 : 0;
    return Math.max(0, Math.min(100, ((b.magic - b.cost) / (b.max - b.cost)) * 100));
  }
  /** The magic a threshold stands for, now. */
  function magicAt(pct) {
    const b = bar();
    return b ? b.cost + Math.max(0, b.max - b.cost) * (pct / 100) : null;
  }
  /** After a cast at this threshold, seconds until magic is back at it (the game's refill; Infinity: never). */
  function recharge(pct) {
    const b = bar();
    if (!b) return null;
    const at = magicAt(pct);
    return CA.Grimoire.refillSeconds(at - b.cost, b.max, at);
  }

  const isSpecial = (b) => !!(b && b.type && b.type.name === 'building buff');
  /** Effects on now, counted: { key: n }, only those with at least minLeft seconds left. */
  function effectsOn(minLeft = 0) {
    const fps = Game.fps || 30;
    const out = {};
    Object.values(Game.buffs || {}).forEach((b) => {
      if (!b || !(b.time > 0) || b.time / fps < minLeft) return;
      const e = isSpecial(b) ? byKey['building special'] : EFFECTS.find((x) => x.buff === b.name);
      if (e) out[e.key] = (out[e.key] || 0) + 1;
    });
    return out;
  }
  /** Whether a combo is on: at least its effects (building special as many times as it's listed). */
  function comboOn(c, on) {
    const need = {};
    c.forEach((k) => (need[k] = (need[k] || 0) + 1));
    return c.length > 0 && Object.keys(need).every((k) => (on[k] || 0) >= need[k]);
  }

  /** A profile's tiers, lowest threshold first: [{ tier, i }] (i: its place in the profile). */
  const ordered = (p) => p.tiers.map((tier, i) => ({ tier, i })).sort((a, b) => a.tier.pct - b.tier.pct || a.i - b.i);

  /**
   * What the profile in use says now: the first tier (lowest threshold up) with a combo on —
   * { tier, i, combo, ready } — or null when no combo is on. ready: there's magic for the spell and
   * the bar is at the tier's threshold.
   */
  function decide(x) {
    const p = (x && find(x)) || current();
    if (!p) return null;
    const on = effectsOn(p.minLeft);
    const b = bar();
    const f = fill();
    for (const { tier, i } of ordered(p)) {
      const combo = tier.combos.find((c) => comboOn(c, on));
      if (combo) return { tier, i, combo, ready: !!b && b.magic >= b.cost && f >= tier.pct - 1e-9 };
    }
    return null;
  }
  const comboName = (c) => c.map((k) => byKey[k].name).join(' + ');

  // ---- profiles --------------------------------------------------------------------------------

  const list = () => profiles.slice();
  function find(x) {
    if (x == null || x === '') return null;
    if (typeof x === 'object') return profiles.includes(x) ? x : null;
    const k = String(x).toLowerCase();
    return profiles.find((p) => p.id === String(x)) || profiles.find((p) => p.name.toLowerCase() === k) || null;
  }
  const current = () => find(active) || profiles[0] || null;
  const activeId = () => (current() || { id: '' }).id;
  const isActive = (x) => !!find(x) && find(x) === current();

  const changed = () => CA.Events.emit('grimoire');
  /** Uses a profile: 1 when that changed which one is in use, 0 when it already was (or there's no such profile). */
  function use(x) {
    const p = find(x);
    if (!p || p === current()) return 0;
    active = p.id;
    changed();
    return 1;
  }
  const newId = () => {
    let i = profiles.length + 1;
    while (profiles.some((p) => p.id === `p${i}`)) i++;
    return `p${i}`;
  };
  /** A new profile — a copy of another, or the two default tiers with no combos — in use at once. */
  function add(name, from) {
    const src = find(from);
    const base = src ? copy(src) : { minLeft: MIN_LEFT, tiers: SEEDS[0].tiers.map((t) => ({ name: t.name, pct: t.pct, combos: [] })) };
    const p = cleanProfile({ ...base, id: newId(), name: name || (src ? `${src.name} copy` : `Profile ${profiles.length + 1}`) });
    profiles.push(p);
    active = p.id;
    changed();
    return p;
  }
  function update(id, patch) {
    const p = find(id);
    if (!p) return null;
    if (patch.name != null && String(patch.name).trim()) p.name = String(patch.name).trim().slice(0, 40);
    if (patch.minLeft != null) p.minLeft = clampLeft(patch.minLeft);
    changed();
    return p;
  }
  function remove(id) {
    const p = find(id);
    if (!p || profiles.length < 2) return false;
    profiles.splice(profiles.indexOf(p), 1);
    if (active === p.id) active = profiles[0].id;
    changed();
    return true;
  }

  // tiers and combos of a profile (i: a tier's place in p.tiers)
  function addTier(id) {
    const p = find(id);
    if (!p) return null;
    const t = { name: `Tier ${p.tiers.length + 1}`, pct: 50, combos: [] };
    p.tiers.push(t);
    changed();
    return t;
  }
  function updateTier(id, i, patch) {
    const t = find(id) && find(id).tiers[i];
    if (!t) return null;
    if (patch.name != null && String(patch.name).trim()) t.name = String(patch.name).trim().slice(0, 40);
    if (patch.pct != null) t.pct = clampPct(patch.pct);
    changed();
    return t;
  }
  function removeTier(id, i) {
    const p = find(id);
    if (!p || !p.tiers[i]) return false;
    p.tiers.splice(i, 1);
    changed();
    return true;
  }
  /** The tier of a profile a combo is already in (-1: none). */
  const tierOf = (p, c) => p.tiers.findIndex((t) => t.combos.some((x) => x.join('+') === comboKey(c)));
  /** Adds a combo to a tier — false when it's empty or already in one of the profile's tiers. */
  function addCombo(id, i, combo) {
    const p = find(id);
    const c = cleanCombo(combo);
    if (!p || !p.tiers[i] || !c.length || tierOf(p, c) >= 0) return false;
    p.tiers[i].combos.push(c);
    changed();
    return true;
  }
  function removeCombo(id, i, j) {
    const t = find(id) && find(id).tiers[i];
    if (!t || !t.combos[j]) return false;
    t.combos.splice(j, 1);
    changed();
    return true;
  }
  /** Moves combo j of tier i to tier to (the end of its list). */
  function moveCombo(id, i, j, to) {
    const p = find(id);
    if (!p || !p.tiers[i] || !p.tiers[to] || i === to || !p.tiers[i].combos[j]) return false;
    p.tiers[to].combos.push(p.tiers[i].combos.splice(j, 1)[0]);
    changed();
    return true;
  }

  function serialize() {
    return { profiles, active };
  }
  function load(data) {
    if (!data || !Array.isArray(data.profiles)) return;
    const ps = data.profiles.filter((p) => p && p.id && p.name).map(cleanProfile);
    if (!ps.length) return;
    profiles = ps;
    active = find(data.active) ? String(data.active) : profiles[0].id;
    changed();
  }

  // ---- blocks ----------------------------------------------------------------------------------

  const profileOptions = () => profiles.map((p) => ({ v: p.id, label: p.name }));

  function init() {
    CA.Settings.registerSection('grimoire', { serialize, load, event: 'grimoire' });
    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, ...(more || {}) });
    V('grimoire.fthofReady', 'whether a cast tier says to cast Force the Hand of Fate now: a combo is on and magic is at its tier (Grimoire page, Cast tiers)', () => {
      const d = decide();
      return !!(d && d.ready);
    }, { bool: true });
    V('grimoire.fthofTier', 'the name of the cast tier with a combo on ("" none)', () => {
      const d = decide();
      return d ? d.tier.name : '';
    });
    V('grimoire.fthofCombo', 'the combo that’s on, e.g. "Frenzy + Click frenzy" ("" none)', () => {
      const d = decide();
      return d ? comboName(d.combo) : '';
    });
    V('grimoire.fill', 'how far up the bar magic is, 0–100: 0 at Force the Hand of Fate’s cost, 100 full', () => {
      const f = fill();
      return f == null ? 0 : Math.floor(f);
    });
    V('grimoire.profileActive', 'whether a Grimoire profile (its id or name) is the one in use', (x) => isActive(x), { params: ['profile'], bool: true });
    V('grimoire.activeProfile', 'the id of the Grimoire profile in use', () => activeId());
    V('grimoire.profiles', 'a list: the Grimoire profiles’ ids', () => profiles.map((p) => p.id), { list: true });
    CA.Actions.register({
      id: 'grimoire.profile',
      name: 'Use a Grimoire profile',
      icon: 'wizard',
      group: 'Wizard tower',
      unit: 'switched',
      params: [{ key: 'profile', label: 'Profile', type: 'select', default: 'default', options: profileOptions }],
      describe: (p) => `Use the Grimoire profile ${(find(p.profile) || { name: p.profile }).name}`,
      ready: (p) => (find(p.profile) ? { ok: !isActive(p.profile), text: isActive(p.profile) ? 'in use' : '' } : { ok: false, text: 'no such profile' }),
      run: (p) => use(p.profile),
    });
  }

  return {
    init,
    EFFECTS,
    SEEDS,
    MAX_LEFT,
    effect: (k) => byKey[k] || null,
    bar,
    fill,
    magicAt,
    recharge,
    effectsOn,
    comboOn,
    comboName,
    comboKey,
    ordered,
    decide,
    list,
    find,
    current,
    activeId,
    isActive,
    use,
    add,
    update,
    remove,
    addTier,
    updateTier,
    removeTier,
    tierOf,
    addCombo,
    removeCombo,
    moveCombo,
  };
})();
