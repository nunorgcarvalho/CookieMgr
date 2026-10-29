// **Managers**: a layer above the macros and profiles. A manager plays a whole ascension in
// stages; each stage switches strategies on and off — macros, and the profiles of the Auto buyer,
// the Pantheon, the dragon, the Grimoire and the garden — and lasts until its "until" holds.
//
//   Manager   { id, name, desc, scope, stages, code? } — named, saved with the game; one is the active one.
//             scope 'ascension': its stages start over when you ascend (legacy managers, which carry
//             on from one ascension to the next, are for later — the scope is there for them).
//   Stage     { name, macros: { id: 'on'|'off' }, inputs: { id: { key: value } } (a macro's settings),
//             profiles: { buyer, pantheon, dragon, grimoire, garden } (''/missing: left as it is),
//             until } — until is a condition in the macro language (features/script.js); the last
//             stage lasts for good.
//
// A manager is code in the macro language (features/script.js), run pass by pass like a garden
// profile's rules: each pass runs the block of the stage it's on. The stage editor writes that code
// (codeOf) — or you write it yourself (code: then the stages are only names). On a stage's first pass
// (manager.entering()) its block sets its macros' settings and switches its macros, once, so you can
// still flip one by hand afterwards; manager.profile(kind, id) puts a profile in, retrying each pass
// until it's in and then leaving it alone (a Pantheon profile waits for the worship swaps to do it all
// at once, a dragon one for its aura slots); `if <until>: manager.next()` moves on.
//
// The built-in macro `manager` runs the active manager's code each second, so it has a switch, a
// hotkey and macro.set like any other. One seeded manager, Nunix late game:
//   Shimmering veil        while the veil lasts: golden and wrath cookies clicked (their upgrades bring
//                          more of them, so more drops), the big cookie and reindeer not; the Auto buyer
//                          spending freely (Payback), the Upgrade unlocker (Santa, research, the dragon
//                          trained and petted, fortunes, cheap upgrades), SeasonCompletion, wrinklers and
//                          sugar lumps; Pantheon wrinklers, dragon drops — until the veil breaks
//   Drops                  the same, the big cookie and reindeer clicked too — until Christmas's upgrades,
//                          Easter, Halloween and Valentine's are in
//   Reindeer               Christmas again for its cookies: the elders pledged, dragon drops & flight
//   Golden cookie combos   for good: the buyer ranks by actual income and never dips below the Lucky! and
//                          garden replant banks (buyer profile combos); the Auto-gardener (8 nursetulips
//                          together + clover combos), Pantheon golden, dragon Dragonflight & Harvest, and
//                          FtHoF on combos
//
//   For algorithmic code:
//     manager.use(manager)            makes a manager the active one (an action; its id or name)
//     manager.goTo(stage)             goes to a stage of the active manager (an action; 1 = the first)
//     manager.next()                  on to the next stage (an action)
//     manager.profile(kind, profile)  puts a profile in, once this stage (an action; kind: buyer,
//                                     pantheon, dragon, grimoire or garden)
//     macro.setting(macro, key, v)    changes a macro's setting (an action)
//     manager.active()                the active manager's id ("": none)
//     manager.stage()                 the stage it's on (1 = the first; 0: no manager)
//     manager.entering()              whether this is the stage's first pass
//     manager.stageName()             that stage's name
//     manager.stages()                how many stages the active manager has

CA.Managers = (() => {
  const MACRO = 'manager';
  const SCOPES = [{ v: 'ascension', label: 'This ascension' }];
  const KINDS = ['buyer', 'pantheon', 'dragon', 'grimoire', 'garden'];

  // the profiles a stage can pick, by kind: their list, whether one is in, and putting it in
  const P = {
    buyer: {
      label: 'Auto buyer',
      icon: 'dollar',
      list: () => (CA.AutoBuyer ? CA.AutoBuyer.list() : []),
      isIn: (id) => CA.AutoBuyer.activeProfile() === id,
      use: (id) => CA.AutoBuyer.use(id),
    },
    pantheon: {
      label: 'Pantheon',
      icon: 'pantheon',
      list: () => (CA.Pantheon ? CA.Pantheon.profiles() : []),
      isIn: (id) => CA.Pantheon.isActive(id),
      // all of it at once: wait until the worship swaps are back for every spirit it moves
      use: (id) => (CA.Pantheon.minigame() && (CA.Pantheon.minigame().swaps || 0) >= CA.Pantheon.swapsFor(id) ? CA.Pantheon.apply(id) : 0),
      waits: (id) => (!CA.Pantheon.minigame() ? 'the Pantheon' : `${CA.Pantheon.swapsFor(id)} worship swaps`),
    },
    dragon: {
      label: 'Dragon auras',
      icon: 'dragon',
      list: () => (CA.Dragon ? CA.Dragon.list() : []),
      isIn: (id) => CA.Dragon.isActive(id),
      use: (id) => CA.Dragon.apply(id),
      waits: () => (CA.Dragon.slots() ? 'auras' : 'an aura slot (dragon level 5)'),
    },
    grimoire: {
      label: 'Grimoire',
      icon: 'wizard',
      list: () => (CA.CastTiers ? CA.CastTiers.list() : []),
      isIn: (id) => CA.CastTiers.isActive(id),
      use: (id) => CA.CastTiers.use(id),
    },
    garden: {
      label: 'Garden',
      icon: 'leaf',
      list: () => (CA.GardenLayers ? CA.GardenLayers.list('profile') : []),
      isIn: (id) => CA.GardenLayers.picked('profile') === id && !CA.GardenLayers.profileChanged(),
      use: (id) => (CA.GardenLayers.loadProfile(id), 1),
    },
  };

  // Upgrade unlocker: the macros that unlock (and buy the cheap) upgrades, one switch for them all
  const UNLOCKER = { id: 'upgradeUnlocker', members: ['santa', 'research', 'autoDragon', 'petDragon', 'fortune', 'cheapUpgrades'] };

  // Nunix late game: what every stage switches on (or off), then what each changes
  const NUNIX_SHARED = {
    autoBuyer: 'on',
    upgradeUnlocker: 'on',
    seasonCompletion: 'on',
    golden: 'on',
    wrath: 'on',
    wrinklers: 'on',
    lumps: 'on',
    stockTrader: 'off',
  };
  const NUNIX_INPUTS = {
    research: { stopBefore: 'none' }, // One mind and on: the Grandmapocalypse, for Halloween's wrinklers
    seasonCompletion: { then: 'fools' },
    wrinklers: { fed: true },
  };
  // the Shimmering veil's stage clicks only golden and wrath cookies (for their upgrades, which bring
  // more of them and so more drops): the big cookie and reindeer wait until it breaks
  const NUNIX_LATER = { bigCookie: 'on', reindeer: 'on' };
  const SEEDS = [
    {
      id: 'nunixLateGame',
      name: 'Nunix late game',
      desc: 'Keeps the Shimmering veil as long as it lasts, clicking only golden and wrath cookies; then hunts every season’s drops, the Auto buyer spending freely and the Upgrade unlocker on; then Christmas again for the reindeer cookies, the elders pledged; then golden cookie combos for good: the buyer ranks by actual income and keeps the Lucky! and garden replant banks, with the garden, the golden Pantheon, Dragonflight & Harvest and Force the Hand of Fate on combos.',
      scope: 'ascension',
      stages: [
        {
          name: 'Shimmering veil',
          macros: { ...NUNIX_SHARED, bigCookie: 'off', reindeer: 'off', elderPledge: 'off', gardener: 'off', fthofOnClickFrenzy: 'off' },
          inputs: NUNIX_INPUTS,
          profiles: { buyer: 'payback', pantheon: 'wrinklers', dragon: 'drops' },
          until: 'not veil()',
        },
        {
          name: 'Drops',
          macros: { ...NUNIX_SHARED, ...NUNIX_LATER, elderPledge: 'off', gardener: 'off', fthofOnClickFrenzy: 'off' },
          inputs: NUNIX_INPUTS,
          profiles: { buyer: 'payback', pantheon: 'wrinklers', dragon: 'drops' },
          until: 'season.complete(christmas, upgrades) and season.complete(easter) and season.complete(halloween) and season.complete(valentines)',
        },
        {
          name: 'Reindeer',
          macros: { ...NUNIX_SHARED, ...NUNIX_LATER, elderPledge: 'on', gardener: 'off', fthofOnClickFrenzy: 'off' },
          inputs: NUNIX_INPUTS,
          profiles: { buyer: 'payback', dragon: 'dropsFlight' },
          until: 'season.complete(christmas)',
        },
        {
          name: 'Golden cookie combos',
          macros: { ...NUNIX_SHARED, ...NUNIX_LATER, elderPledge: 'on', gardener: 'on', fthofOnClickFrenzy: 'on' },
          inputs: NUNIX_INPUTS,
          profiles: { buyer: 'combos', pantheon: 'golden', dragon: 'dragonFlightHarvest', grimoire: 'default', garden: 'tulipCombos' },
          until: '',
        },
      ],
    },
  ];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  let managers = copy(SEEDS);
  let active = 'nunixLateGame';
  // where the active manager is: its stage, the ascension it's for (Game.resets), and the profiles
  // of the stage still to put in
  let run = cleanRun(null);

  // ---- managers -----------------------------------------------------------------------------

  function cleanStage(s, i) {
    s = s && typeof s === 'object' ? s : {};
    const macros = {};
    Object.keys(s.macros || {}).forEach((id) => (s.macros[id] === 'on' || s.macros[id] === 'off') && id !== MACRO && (macros[id] = s.macros[id]));
    const profiles = {};
    KINDS.forEach((k) => s.profiles && s.profiles[k] && (profiles[k] = String(s.profiles[k])));
    // a macro's settings (its inputs) the stage sets on entering it: { macroId: { key: value } }
    const inputs = {};
    Object.keys(s.inputs && typeof s.inputs === 'object' ? s.inputs : {}).forEach((id) => {
      const v = s.inputs[id];
      if (id === MACRO || !v || typeof v !== 'object') return;
      const keep = {};
      Object.keys(v).forEach((k) => ['string', 'number', 'boolean'].includes(typeof v[k]) && (keep[k] = v[k]));
      if (Object.keys(keep).length) inputs[id] = keep;
    });
    return { name: String(s.name || `Stage ${i + 1}`).slice(0, 40), macros, inputs, profiles, until: typeof s.until === 'string' ? s.until.slice(0, 500) : '' };
  }
  function clean(m) {
    const stages = (Array.isArray(m.stages) ? m.stages : []).slice(0, 20).map(cleanStage);
    return {
      id: String(m.id),
      name: String(m.name || 'Manager').slice(0, 40),
      desc: String(m.desc || '').slice(0, 400),
      scope: SCOPES.some((s) => s.v === m.scope) ? m.scope : 'ascension',
      stages: stages.length ? stages : [cleanStage({}, 0)],
      ...(typeof m.code === 'string' ? { code: m.code.slice(0, 50000) } : {}),
    };
  }

  const list = () => managers.slice();
  /** A manager by id, or by name (any case). */
  function find(x) {
    if (x == null || x === '') return null;
    const k = String(x).toLowerCase();
    return managers.find((m) => m.id === String(x)) || managers.find((m) => m.name.toLowerCase() === k) || null;
  }
  const current = () => find(active);
  const changed = () => CA.Events.emit('managers');

  /** Makes a manager the active one (from its first stage): 1 when it changed, 0 when it already was. */
  function use(x) {
    const m = find(x);
    if (!m || m.id === active) return 0;
    active = m.id;
    run = cleanRun(null);
    changed();
    return 1;
  }
  const newId = () => {
    let i = managers.length + 1;
    while (managers.some((m) => m.id === `m${i}`)) i++;
    return `m${i}`;
  };
  /** A new manager — a copy of another, or one empty stage. Returns it. */
  function add(name, from) {
    const src = find(from);
    const m = clean({ ...(src ? copy(src) : { stages: [{ name: 'Stage 1' }] }), id: newId(), name: name || (src ? `${src.name} (copy)` : `Manager ${managers.length + 1}`) });
    managers.push(m);
    changed();
    return m;
  }
  function update(id, patch) {
    const m = managers.find((x) => x.id === id);
    if (!m) return null;
    if (patch.name != null && String(patch.name).trim()) m.name = String(patch.name).trim().slice(0, 40);
    if (patch.desc != null) m.desc = String(patch.desc).slice(0, 400);
    if (patch.scope && SCOPES.some((s) => s.v === patch.scope)) m.scope = patch.scope;
    changed();
    return m;
  }
  function remove(id) {
    const i = managers.findIndex((x) => x.id === id);
    if (i < 0) return false;
    managers.splice(i, 1);
    if (active === id) active = managers.length ? managers[0].id : '';
    changed();
    return true;
  }
  /** Puts the seeded managers back as they came (yours are kept). */
  function resetSeeds() {
    SEEDS.forEach((s) => {
      const i = managers.findIndex((m) => m.id === s.id);
      if (i >= 0) managers[i] = copy(s);
      else managers.unshift(copy(s));
    });
    changed();
  }

  // ---- stages ---------------------------------------------------------------------------------

  const stageOf = (id, i) => {
    const m = managers.find((x) => x.id === id);
    return m && m.stages[i] ? m.stages[i] : null;
  };
  function addStage(id, after) {
    const m = managers.find((x) => x.id === id);
    if (!m || m.stages.length >= 20) return null;
    const at = after == null ? m.stages.length : Math.min(m.stages.length, Number(after) + 1);
    const base = m.stages[at - 1];
    const s = cleanStage({ ...(base ? copy(base) : {}), name: `Stage ${m.stages.length + 1}`, until: '' }, at);
    m.stages.splice(at, 0, s);
    if (run.id === id && at <= run.stage) run.stage++;
    changed();
    return s;
  }
  function updateStage(id, i, patch) {
    const s = stageOf(id, i);
    if (!s) return null;
    if (patch.name != null && String(patch.name).trim()) s.name = String(patch.name).trim().slice(0, 40);
    if (patch.until != null) s.until = String(patch.until).slice(0, 500);
    changed();
    return s;
  }
  /** A macro in a stage: 'on', 'off', or '' (left as it is). */
  function setStageMacro(id, i, macro, to) {
    const s = stageOf(id, i);
    if (!s || macro === MACRO) return;
    if (to === 'on' || to === 'off') s.macros[macro] = to;
    else delete s.macros[macro];
    changed();
  }
  /** A macro's setting in a stage (undefined / '' : left as it is). */
  function setStageInput(id, i, macro, key, value) {
    const s = stageOf(id, i);
    if (!s || macro === MACRO) return;
    const cur = { ...(s.inputs[macro] || {}) };
    if (value === undefined || value === '') delete cur[key];
    else cur[key] = value;
    if (Object.keys(cur).length) s.inputs[macro] = cur;
    else delete s.inputs[macro];
    changed();
  }
  /** A profile in a stage ('' : left as it is). */
  function setStageProfile(id, i, kind, profile) {
    const s = stageOf(id, i);
    if (!s || !P[kind]) return;
    if (profile) s.profiles[kind] = String(profile);
    else delete s.profiles[kind];
    changed();
  }
  function removeStage(id, i) {
    const m = managers.find((x) => x.id === id);
    if (!m || m.stages.length <= 1 || !m.stages[i]) return false;
    m.stages.splice(i, 1);
    if (run.id === id && run.stage >= m.stages.length) run.stage = m.stages.length - 1;
    changed();
    return true;
  }
  function moveStage(id, i, by) {
    const m = managers.find((x) => x.id === id);
    const j = i + by;
    if (!m || !m.stages[i] || !m.stages[j]) return false;
    [m.stages[i], m.stages[j]] = [m.stages[j], m.stages[i]];
    changed();
    return true;
  }

  // ---- "until" ----------------------------------------------------------------------------------

  const compiled = new Map();
  function compileUntil(code) {
    if (!compiled.has(code)) {
      if (compiled.size > 100) compiled.clear();
      compiled.set(code, CA.Script.compile(`return ${code}`, { mode: 'stat' }));
    }
    return compiled.get(code);
  }
  /** What's wrong with an "until" condition ("": nothing). */
  function untilProblem(code) {
    if (!code || !code.trim()) return '';
    const c = compileUntil(code);
    return c.errors.length ? c.errors[0].message : '';
  }
  /** Whether an "until" holds now (none, or one with a problem: never). */
  function untilHolds(code) {
    if (!code || !code.trim()) return false;
    const c = compileUntil(code);
    if (c.errors.length) return false;
    const out = CA.Script.runStat(c.flow, {});
    return !out.error && !!out.value && !(typeof out.value === 'number' && !Number.isFinite(out.value));
  }

  // ---- the code ---------------------------------------------------------------------------------

  // a name or value as the macro language reads it: plain when it's a simple word, else in quotes
  const word = (v) => (typeof v === 'boolean' || typeof v === 'number' ? String(v) : /^[A-Za-z_]\w*$/.test(String(v)) && !['true', 'false'].includes(String(v)) ? String(v) : JSON.stringify(String(v)));

  /** A manager's stages written out as code (what runs, unless you wrote its code yourself). */
  function codeOf(m) {
    const out = [
      `# ${m.name}: its stages as code (the stage editor writes this; edit it to make it yours).`,
      '# Each pass runs the stage the manager is on, manager.stage(): on its first pass (manager.entering())',
      '# it switches macros and their settings; manager.profile() puts a profile in once per stage (a',
      '# Pantheon one waits for the worship swaps to do it all at once); manager.next() moves on.',
    ];
    m.stages.forEach((st, i) => {
      out.push('', `# ---- stage ${i + 1}: ${st.name}`, `if manager.stage() == ${i + 1}:`);
      const body = [];
      const entering = [];
      Object.keys(st.inputs).forEach((id) => {
        if (!CA.Macros.get(id)) return;
        Object.keys(st.inputs[id]).forEach((k) => entering.push(`macro.setting(${word(id)}, ${word(k)}, ${word(st.inputs[id][k])})`));
      });
      // switch on a, b, c: one line for each way (wrapped when long)
      ['on', 'off'].forEach((to) => {
        let line = '';
        stageMacros(st)
          .filter((id) => st.macros[id] === to)
          .forEach((id) => {
            if (line && line.length + word(id).length > 110) entering.push(line), (line = '');
            line = line ? `${line}, ${word(id)}` : `switch ${to} ${word(id)}`;
          });
        if (line) entering.push(line);
      });
      if (entering.length) body.push('if manager.entering():', ...entering.map((l) => `  ${l}`));
      KINDS.forEach((k) => st.profiles[k] && body.push(`manager.profile(${k}, ${word(st.profiles[k])})`));
      if (i < m.stages.length - 1 && st.until.trim()) body.push(`if ${st.until.trim()}:`, '  manager.next()');
      if (!body.length) body.push(`log ${JSON.stringify(st.name)}`);
      body.forEach((l) => out.push(`  ${l}`));
    });
    return `${out.join('\n')}\n`;
  }
  /** The code a manager runs: yours (written by hand), else its stages'. */
  const sourceOf = (m) => (m && typeof m.code === 'string' ? m.code : m ? codeOf(m) : '');
  /** A manager's code, compiled: { flow, errors }. */
  const compiledCode = new Map();
  function compiledOf(m) {
    const src = sourceOf(m);
    if (!compiledCode.has(src)) {
      if (compiledCode.size > 30) compiledCode.clear();
      compiledCode.set(src, CA.Script.compile(src));
    }
    return compiledCode.get(src);
  }
  /** Gives a manager code of yours (a problem: not saved, the message returned), or null back to its stages. */
  function setCode(id, code) {
    const m = managers.find((x) => x.id === id);
    if (!m) return 'no such manager';
    if (code == null) delete m.code;
    else {
      const { errors } = CA.Script.compile(String(code));
      if (errors.length) return `line ${errors[0].line}: ${errors[0].message}`;
      m.code = String(code).slice(0, 50000);
    }
    changed();
    return '';
  }

  // ---- running ----------------------------------------------------------------------------------

  const resets = () => Game.resets || 0;
  /** The macros a stage switches, that exist (one you deleted is skipped). */
  const stageMacros = (s) => Object.keys(s.macros).filter((id) => CA.Macros.get(id) && CA.Macros.get(id).mode !== 'once');
  const fresh = (id, stage) => ({ id, stage, resets: resets(), since: Date.now(), entering: true, entered: false, put: {}, waiting: {} });
  let lastPass = null; // the last pass of the manager's code: { t, lines, trace, at, error, done }

  /** Goes into stage i (0 = the first) of the active manager: its next pass is that stage's first. */
  function enter(i) {
    const m = current();
    if (!m) return 0;
    const at = Math.max(0, Math.min(19, Math.floor(Number(i) || 0)));
    run = fresh(m.id, at);
    const st = m.stages[at];
    CA.EventLog.add({ type: 'manager', title: `${m.name}: ${st ? st.name : `stage ${at + 1}`}`, text: `stage ${at + 1} of ${m.stages.length}`, data: { manager: m.id, stage: at + 1 } });
    changed();
    return 1;
  }
  /** Before a pass: a new manager or a new ascension starts at stage 1. False: no manager. */
  function ready() {
    const m = current();
    if (!m) return false;
    if (run.id !== m.id || (m.scope === 'ascension' && run.resets !== resets())) enter(0);
    return true;
  }
  /** After a pass: its first pass is over (unless it just moved on, so the next is the new stage's first). */
  function afterPass(F) {
    if (run.entered) run.entered = false;
    else run.entering = false;
    lastPass = { t: Date.now(), lines: (F.trace || []).map((x) => x.line).filter(Boolean), trace: F.trace || [], at: F.at || [], error: F.error || '', done: F.done || 0 };
  }

  /** Puts a profile in (once per stage: once it's in, it's left alone): what changed. */
  function putProfile(k, id) {
    const kind = P[k];
    if (!kind || run.put[k] === String(id)) return 0;
    const p = kind.list().find((x) => x.id === String(id) || String(x.name).toLowerCase() === String(id).toLowerCase());
    if (!p) return 0;
    let n = 0;
    try {
      if (!kind.isIn(p.id)) n = kind.use(p.id) || 0;
      if (kind.isIn(p.id)) {
        run.put[k] = String(id);
        delete run.waiting[k];
      } else run.waiting[k] = p.id;
    } catch (e) {
      run.waiting[k] = p.id; // a minigame that isn't there yet: next pass
    }
    return n;
  }

  /** One pass of the active manager's code, by hand (the Manager macro runs it each second). Returns what it did. */
  function step() {
    if (!ready()) return 0;
    const { flow, errors } = compiledOf(current());
    if (errors.length) return 0;
    const F = CA.Macros.runPass(flow);
    afterPass(F || {});
    return (F && F.done) || 0;
  }

  /** Goes to stage n (1 = the first) of the active manager. */
  const goTo = (n) => (current() ? enter(Math.floor(Number(n) || 1) - 1) : 0);

  /** Where the active manager is: { manager, stage, index, of, since, started, pending: [{ kind, label, id, name, waits }] } or null. */
  function where() {
    const m = current();
    if (!m) return null;
    const on = run.id === m.id && (m.scope !== 'ascension' || run.resets === resets());
    const index = on ? run.stage : 0;
    const pending = on
      ? Object.keys(run.waiting).map((k) => {
          const id = run.waiting[k];
          const p = P[k].list().find((x) => x.id === id);
          let waits = '';
          try {
            waits = P[k].waits ? P[k].waits(id) : '';
          } catch (e) {
            waits = '';
          }
          return { kind: k, label: P[k].label, id, name: p ? p.name : id, waits };
        })
      : [];
    const stage = m.stages[index] || { name: `Stage ${index + 1}`, until: '', macros: {}, inputs: {}, profiles: {} };
    return { manager: m, stage, index, of: Math.max(m.stages.length, index + 1), started: !!on, since: on ? run.since : 0, pending, coded: typeof m.code === 'string' };
  }

  function readiness() {
    const m = current();
    if (!m) return { ok: false, text: 'no manager picked (the Managers page)' };
    const c = compiledOf(m);
    if (c.errors.length) return { ok: false, text: `${m.name}: line ${c.errors[0].line}: ${c.errors[0].message}` };
    const w = where();
    return { ok: true, text: `${m.name} · ${w.started ? `stage ${w.index + 1} of ${w.of}: ${w.stage.name}` : 'starts at stage 1'}` };
  }

  // ---- save -------------------------------------------------------------------------------------

  function cleanRun(r) {
    r = r && typeof r === 'object' ? r : {};
    const obj = (x) => (x && typeof x === 'object' ? { ...x } : {});
    return { id: String(r.id || ''), stage: Math.max(0, Number(r.stage) || 0), resets: Number.isFinite(Number(r.resets)) ? Number(r.resets) : -1, since: Number(r.since) || 0, entering: !!r.entering, entered: false, put: obj(r.put), waiting: obj(r.waiting) };
  }
  function load(data) {
    if (data && Array.isArray(data.managers)) {
      managers = data.managers.filter((m) => m && m.id).map(clean);
      active = typeof data.active === 'string' && (data.active === '' || managers.some((m) => m.id === data.active)) ? data.active : managers.length ? managers[0].id : '';
      run = cleanRun(data.run);
    } else {
      managers = copy(SEEDS);
      active = 'nunixLateGame';
      run = cleanRun(null);
    }
    changed();
  }
  const serialize = () => ({ managers, active, run });

  // ---- building blocks ----------------------------------------------------------------------------

  const managerOptions = () => managers.map((m) => ({ v: m.id, label: m.name }));
  const kindOptions = () => KINDS.map((k) => ({ v: k, label: P[k].label }));

  function init() {
    CA.Settings.registerSection('managers', { serialize, load, event: 'managers' });
    CA.EventLog.defineType('manager', { name: 'Manager', icon: 'ascend', color: '#ffb74d' });
    // a new ascension: the stages start over (the next pass enters the first)
    CA.Events.on('ascend', () => {
      const m = current();
      if (m && m.scope === 'ascension') run = cleanRun(null);
    });

    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, group: 'Managers', ...(more || {}) });
    V('manager.active', 'the active manager’s id ("": none)', () => active);
    V('manager.stage', 'the stage the active manager is on (1 = the first; 0: no manager)', () => {
      const w = where();
      return w ? w.index + 1 : 0;
    });
    V('manager.stageName', 'the name of the stage the active manager is on ("": no manager)', () => {
      const w = where();
      return w ? w.stage.name : '';
    });
    V('manager.entering', 'whether this is the first pass of the stage the manager is on (when it switches its macros)', () => !!run.entering, { bool: true });
    V('manager.stages', 'how many stages the active manager has', () => (current() ? current().stages.length : 0));
    V('manager.list', 'a list: every manager’s id', () => managers.map((m) => m.id), { list: true });

    const A = CA.Actions.register;
    A({
      id: 'manager.use',
      name: 'Use a manager',
      icon: 'ascend',
      group: 'Managers',
      unit: 'switched',
      params: [{ key: 'manager', label: 'Manager', type: 'select', default: 'nunixLateGame', options: managerOptions, word: 'manager' }],
      describe: (p) => `Use the manager ${(find(p.manager) || { name: p.manager }).name}`,
      run: (p) => use(p.manager),
    });
    A({
      id: 'manager.goTo',
      name: 'Go to a stage of the manager',
      icon: 'ascend',
      group: 'Managers',
      unit: 'stages',
      params: [{ key: 'stage', label: 'Stage (1 = the first)', type: 'number', default: 1, min: 1 }],
      describe: (p) => `Go to stage ${p.stage} of the manager`,
      run: (p) => goTo(p.stage),
    });
    A({
      id: 'manager.next',
      name: 'On to the manager’s next stage',
      icon: 'ascend',
      group: 'Managers',
      unit: 'stages',
      run: () => {
        if (!current()) return 0;
        enter(run.stage + 1);
        run.entered = true; // this pass is the old stage's: the next is the new one's first
        return 1;
      },
    });
    A({
      id: 'manager.profile',
      name: 'Put a profile in, once this stage',
      icon: 'ascend',
      group: 'Managers',
      unit: 'switched',
      params: [
        { key: 'kind', label: 'Of', type: 'select', default: 'buyer', options: kindOptions },
        { key: 'profile', label: 'Profile (id or name)', type: 'text', default: '', word: (v, a) => ({ kind: `profile.${a.kind || 'buyer'}`, id: v }) },
      ],
      describe: (p) => `Put the ${(P[p.kind] || { label: p.kind }).label} profile ${p.profile} in`,
      run: (p) => putProfile(p.kind, p.profile),
    });
    A({
      id: 'macro.setting',
      name: 'Change a macro’s setting',
      icon: 'bolt',
      group: 'Macros',
      unit: 'changed',
      params: [
        { key: 'macro', label: 'Macro', type: 'select', default: '', options: () => CA.Macros.list().filter((x) => (x.inputs || []).length).map((x) => ({ v: x.id, label: x.name })) },
        { key: 'key', label: 'Setting', type: 'text', default: '', word: (v, a) => ({ kind: 'setting', id: `${a.macro || ''}.${v}` }) },
        { key: 'value', label: 'To', type: 'text', default: '' },
      ],
      describe: (p) => `Set ${(CA.Macros.get(p.macro) || { name: p.macro }).name}’s ${p.key} to ${p.value}`,
      run: (p) => {
        const x = CA.Macros.get(p.macro);
        if (!x || !(x.inputs || []).some((i) => i.key === p.key) || CA.Macros.inputsOf(x)[p.key] === p.value) return 0;
        CA.Macros.setInput(x.id, p.key, p.value);
        return 1;
      },
    });

    CA.Macros.addBuiltin({
      id: UNLOCKER.id,
      name: 'Upgrade unlocker',
      desc: 'One switch for the macros that unlock upgrades and buy the cheap ones: Santa, Research, Auto dragon, Pet the dragon, Fortunes and Cheap upgrades (the Auto buyer is its own).',
      icon: { ico: 'sparkle' },
      mode: 'group',
      members: UNLOCKER.members,
      section: 'upkeep',
    });
    CA.Macros.addBuiltin({
      id: MACRO,
      name: 'Manager',
      desc: 'Plays the ascension in stages, as the active manager on the Managers page says: its code (written from its stages, or by you) switches macros and their settings, puts in Auto buyer, Pantheon, dragon, Grimoire and garden profiles, and moves on stage by stage.',
      icon: { ico: 'ascend' },
      mode: 'flow',
      pass: true,
      every: 1000,
      sourceFrom: () => sourceOf(current()),
      ready,
      afterPass,
      readiness: () => readiness(),
      editAt: 'managers',
      section: 'managers',
    });
  }

  // the code editors' hover cards: a manager's id (manager.use(nunixLateGame)), a macro's setting
  // (macro.setting(research, stopBefore, none)), and a garden profile (manager.profile(garden, tulipCombos))
  CA.Words.defineKind('manager', {
    name: 'Manager',
    info: (id) => {
      const m = find(id);
      if (!m) return null;
      return {
        title: m.name,
        sig: m.id,
        desc: m.desc || 'Plays the ascension in stages, switching macros and profiles.',
        rows: m.stages
          .map((st, i) => [`stage ${i + 1}`, `${st.name}${i < m.stages.length - 1 && st.until ? ` · until ${st.until}` : ''}`])
          .concat([
            ['code', typeof m.code === 'string' ? 'yours' : 'written from its stages'],
            ['in use', m.id === active ? `yes, on stage ${run.id === m.id ? run.stage + 1 : 1}` : 'no'],
          ]),
        note: 'Managers page.',
      };
    },
  });
  CA.Words.defineKind('setting', {
    name: 'Macro setting',
    info: (id) => {
      const [mid, key] = [id.slice(0, id.indexOf('.')), id.slice(id.indexOf('.') + 1)];
      const x = CA.Macros.get(mid);
      const inp = x && (x.inputs || []).find((i) => i.key === key);
      if (!inp) return null;
      const opts = typeof inp.options === 'function' ? inp.options() : inp.options;
      return {
        title: inp.label || key,
        sig: key,
        desc: `${x.name}’s setting${inp.desc ? `: ${inp.desc}` : ''}.`,
        rows: [['now', String(CA.Macros.inputsOf(x)[key])]].concat(Array.isArray(opts) && opts.length ? [['one of', opts.map((o) => (o && typeof o === 'object' ? o.v : o)).join(', ')]] : []),
        note: 'Its card on the Macros page.',
      };
    },
  });
  if (!CA.Words.kinds().includes('profile.garden'))
    CA.Words.defineKind('profile.garden', {
      name: 'Garden profile',
      info: (id) => {
        const p = CA.GardenLayers && CA.GardenLayers.list('profile').find((x) => x.id === id || x.name.toLowerCase() === String(id).toLowerCase());
        if (!p) return null;
        return {
          title: p.name,
          sig: p.id,
          desc: p.desc || 'A garden profile: its layout, gardener and rules, loaded together.',
          rows: [['in use', CA.GardenLayers.picked('profile') === p.id ? 'yes' : 'no']],
          note: 'Garden page, Profiles.',
        };
      },
    });

  return { init, list, find, current, use, add, update, remove, resetSeeds, addStage, updateStage, setStageMacro, setStageInput, setStageProfile, removeStage, moveStage, untilProblem, untilHolds, codeOf, sourceOf, setCode, step, enter, goTo, where, readiness, lastPass: () => lastPass, P, KINDS, SCOPES, SEEDS, MACRO, UNLOCKER };
})();
