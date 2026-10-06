// The Wizard tower's Grimoire minigame: spells as actions and macros.
//
//   action      spell.cast {spell}             casts one spell (if there's enough magic)
//   conditions  spellAffordable {spell}        there's enough magic for that spell right now
//               magicPct {op, value}           magic as a % of the maximum
//   macros      one built-in "Cast …" macro per spell (buttons, hotkeys, shortcut widgets), and the
//               hardcoded, non-removable "Force the Hand of Fate on Click frenzy"
//   events      'spell' — every cast (yours, a macro's, or the Grimoire's own buttons), and whether
//               it backfired
//
// Game facts (minigameGrimoire.js): spells live in M.spells keyed by lowercase name and in
// M.spellsById; M.castSpell(spell) returns true when the spell went off (win or backfire) and
// false when there wasn't enough magic; M.getSpellCost(spell) and M.getFailChance(spell) give
// the live cost and backfire chance; magic refills by M.magicPS per logic frame (30 fps), which
// is max(0.002, (magic / max(magicM, 100))^0.5) × 0.002.

CA.Grimoire = (() => {
  const POLL_MS = 1000;
  const FPS = 30;

  // Every spell, in the Grimoire's own order (keys/names/icons verified against minigameGrimoire.js).
  const SPELLS = [
    { key: 'conjure baked goods', id: 'castConjure', name: 'Conjure Baked Goods', icon: [21, 11] },
    { key: 'hand of fate', id: 'castFthof', name: 'Force the Hand of Fate', icon: [22, 11] },
    { key: 'stretch time', id: 'castStretch', name: 'Stretch Time', icon: [23, 11] },
    { key: 'spontaneous edifice', id: 'castEdifice', name: 'Spontaneous Edifice', icon: [24, 11] },
    { key: "haggler's charm", id: 'castHaggler', name: "Haggler's Charm", icon: [25, 11] },
    { key: 'summon crafty pixies', id: 'castPixies', name: 'Summon Crafty Pixies', icon: [26, 11] },
    { key: "gambler's fever dream", id: 'castGfd', name: "Gambler's Fever Dream", icon: [27, 11] },
    { key: 'resurrect abomination', id: 'castResurrect', name: 'Resurrect Abomination', icon: [28, 11] },
    { key: 'diminish ineptitude', id: 'castDiminish', name: 'Diminish Ineptitude', icon: [29, 11] },
  ];
  const byKey = {};
  SPELLS.forEach((s) => (byKey[s.key] = s));
  const AUTO_ID = 'fthofOnClickFrenzy';

  function minigame() {
    const m = CA.Util.minigame('Wizard tower');
    return m && m.spells && typeof m.castSpell === 'function' ? m : null;
  }

  const spellOf = (key) => {
    const m = minigame();
    return m ? m.spells[key] || null : null;
  };
  const nameOf = (key) => (byKey[key] ? byKey[key].name : key);
  const costOf = (key) => {
    const m = minigame();
    const sp = spellOf(key);
    return m && sp ? m.getSpellCost(sp) : Infinity;
  };
  const failOf = (key) => {
    const m = minigame();
    const sp = spellOf(key);
    return m && sp && typeof m.getFailChance === 'function' ? m.getFailChance(sp) : null;
  };

  /** Seconds until magic reaches `target`, following the game's own refill formula. */
  function secondsUntil(target) {
    const m = minigame();
    if (!m) return Infinity;
    let magic = m.magic;
    const max = m.magicM;
    if (magic >= target) return 0;
    if (target > max) return Infinity;
    let s = 0;
    while (magic < target && s < 86400) {
      for (let f = 0; f < FPS && magic < target; f++) magic += Math.max(0.002, Math.pow(magic / Math.max(max, 100), 0.5)) * 0.002;
      s++;
    }
    return magic >= target ? s : Infinity;
  }

  /** Live info about every spell for the Wizard tower page. */
  function spells() {
    const m = minigame();
    return SPELLS.map((s) => {
      const cost = costOf(s.key);
      return { ...s, cost, fail: failOf(s.key), affordable: !!m && m.magic >= cost, wait: m ? secondsUntil(cost) : Infinity, macro: s.id };
    });
  }

  function magicNow() {
    const m = minigame();
    if (!m) return null;
    const perSec = Math.max(0.002, Math.pow(m.magic / Math.max(m.magicM, 100), 0.5)) * 0.002 * FPS;
    return { magic: m.magic, max: m.magicM, perSec: m.magic < m.magicM ? perSec : 0, fullIn: secondsUntil(m.magicM), cast: m.spellsCast || 0, castTotal: m.spellsCastTotal || 0 };
  }

  // ---- logging every cast ----------------------------------------------------------------

  let backfired = false;

  function watch() {
    const m = minigame();
    if (!m || m.__cmWatched) return;
    m.__cmWatched = true;
    Object.keys(m.spells).forEach((key) => {
      const sp = m.spells[key];
      if (typeof sp.fail !== 'function') return;
      const fail = sp.fail;
      sp.fail = function () {
        backfired = true;
        return fail.apply(this, arguments);
      };
    });
    const cast = m.castSpell;
    m.castSpell = function (spell, obj) {
      backfired = false;
      const cookies = Game.cookies;
      const ok = cast.apply(this, arguments);
      try {
        if (ok && spell && !(obj && obj.passthrough)) {
          const key = Object.keys(m.spells).find((k) => m.spells[k] === spell);
          const name = nameOf(key) || spell.name;
          CA.EventLog.add({
            type: 'spell',
            title: backfired ? `${name} backfired` : `Cast ${name}`,
            text: backfired ? 'Backfire!' : '',
            cookies: Game.cookies - cookies,
            data: { spell: key, backfired },
          });
        }
      } catch (e) {
        /* never break the game over a log entry */
      }
      return ok;
    };
  }

  // ---- actions, conditions, macros ------------------------------------------------------------

  const spellOptions = () => SPELLS.map((s) => ({ v: s.key, label: s.name }));

  function register() {
    CA.Actions.register({
      id: 'spell.cast',
      name: 'Cast a spell',
      icon: 'wizard',
      group: 'Wizard tower',
      unit: 'cast',
      params: [{ key: 'spell', label: 'Spell', type: 'select', default: 'hand of fate', options: spellOptions }],
      describe: (p) => `Cast ${nameOf(p.spell)}`,
      available: () => !!minigame(),
      run: (p) => {
        const m = minigame();
        const sp = spellOf(p.spell);
        if (!m || !sp || m.magic < m.getSpellCost(sp)) return 0;
        return m.castSpell(sp) ? 1 : 0;
      },
    });
    CA.Conditions.register({
      id: 'spellAffordable',
      name: 'Enough magic for a spell',
      icon: 'wizard',
      params: [{ key: 'spell', label: 'Spell', type: 'select', default: 'hand of fate', options: spellOptions }],
      describe: (p) => `there's magic for ${nameOf(p.spell)}`,
      test: (p) => {
        const m = minigame();
        return !!m && m.magic >= costOf(p.spell);
      },
    });
    CA.Conditions.register({
      id: 'magicPct',
      name: 'Magic is at a % of the maximum',
      icon: 'wizard',
      params: [
        {
          key: 'op',
          label: 'Is',
          type: 'select',
          default: '>=',
          options: () => [
            { v: '>=', label: '≥' },
            { v: '<=', label: '≤' },
          ],
        },
        { key: 'value', label: '% of max', type: 'number', default: 100, min: 0 },
      ],
      describe: (p) => `magic ${p.op === '<=' ? '≤' : '≥'} ${p.value}%`,
      test: (p) => {
        const m = minigame();
        if (!m || !m.magicM) return false;
        const pct = (m.magic / m.magicM) * 100;
        return p.op === '<=' ? pct <= p.value : pct >= p.value - 1e-9;
      },
    });

    SPELLS.forEach((s) =>
      CA.Macros.addBuiltin({
        id: s.id,
        name: `Cast ${s.name}`,
        desc: '',
        icon: { sprite: s.icon },
        mode: 'once',
        steps: [{ action: 'spell.cast', params: { spell: s.key } }],
        defaultKey: '',
        section: 'grimoire',
        spell: s.key,
      })
    );
    CA.Macros.addBuiltin({
      id: AUTO_ID,
      name: 'Force the Hand of Fate on Click frenzy',
      desc: 'While on: as soon as a Click frenzy is running and there’s enough magic, casts Force the Hand of Fate — its golden cookie can stack another effect on top. Pair it with the Golden cookies macro to pop it.',
      icon: { sprite: [22, 11] },
      mode: 'when',
      noOptions: true, // it's about this one spell
      every: 250,
      when: {
        all: [
          { cond: 'buff', params: { name: 'Click frenzy' } },
          { cond: 'spellAffordable', params: { spell: 'hand of fate' } },
        ],
        edge: 'rise',
      },
      steps: [{ action: 'spell.cast', params: { spell: 'hand of fate' } }],
      defaultKey: '',
      section: 'grimoire',
    });
  }

  function init() {
    CA.EventLog.defineType('spell', { name: 'Spell', icon: 'wizard', color: '#b388ff' });
    register();
    setInterval(watch, POLL_MS);
    watch();
  }

  return { init, minigame, spells, magicNow, secondsUntil, SPELLS, AUTO_ID };
})();
