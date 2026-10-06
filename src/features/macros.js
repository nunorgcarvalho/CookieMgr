// **Macros**: automations built by chaining actions (core/actions.js). hotkey → macro(s) → action(s).
//
// A macro has a trigger mode:
//   repeat   while it's on, runs its steps every `every` ms              (the autoclickers)
//   when     while it's on, checks a condition (core/conditions.js) every `every` ms and runs its
//            steps when it becomes true ("rise") or on every check while it holds ("while")
//   once     no on/off — a button or hotkey runs its steps one time       (Sell all stocks)
//   group    a switch for several other macros: on turns them all on, off turns them all off.
//            It has no steps or timer of its own; it counts as on while all its members are on,
//            so it stays right however its members get switched.
//
// Built-in macros (the original autoclickers, the stock autobuyer, Sell all…) can't be removed or
// edited, only duplicated. Your own macros are saved in the game save with the rest of the
// settings. Every macro is also a hotkey bindable ('macro.<id>'): repeat/when macros toggle,
// once macros run.

CA.Macros = (() => {
  const MIN_EVERY = 20;
  const MAX_DEPTH = 4; // macros running macros running macros…

  const sprite = (x, y, img) => ({ sprite: [x, y], img });

  const BUILTINS = [
    {
      id: 'bigCookie',
      name: 'Big cookie',
      desc: 'Clicks the big cookie 20 times a second.',
      icon: sprite(11, 0, 'img/perfectCookie.png'),
      mode: 'repeat',
      every: 50,
      steps: [{ action: 'click.bigCookie', params: { anim: 'default' } }],
      options: [{ step: 0, key: 'anim' }],
      defaultKey: 'KeyC',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'golden',
      name: 'Golden cookies',
      desc: 'Pops golden cookies the moment they appear.',
      icon: sprite(10, 14, 'img/goldCookie.png'),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.golden' }],
      defaultKey: 'KeyG',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'wrath',
      name: 'Wrath cookies',
      desc: 'Pops red wrath cookies too (they can be good or bad).',
      icon: sprite(15, 5, 'img/wrathCookie.png'),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.wrath' }],
      defaultKey: 'KeyW',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'reindeer',
      name: 'Reindeer',
      desc: 'Pops reindeer during the Christmas season.',
      icon: sprite(12, 9, 'img/frostedReindeer.png'),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.reindeer' }],
      defaultKey: 'KeyR',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'fortune',
      name: 'Fortune news',
      desc: 'Clicks fortunes as they scroll through the news ticker.',
      icon: sprite(29, 8),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'click.fortune' }],
      defaultKey: 'KeyF',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'wrinklers',
      name: 'Wrinklers',
      desc: 'Pops wrinklers once they’ve eaten something (so they can drop Halloween cookies and such) — or the moment they latch on. Shift-click its button to switch.',
      icon: sprite(19, 8),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.wrinklers', params: { fed: true } }],
      shift: { step: 0, key: 'fed', on: 'pops them once they’ve eaten (drops count)', off: 'pops them at once' },
      defaultKey: 'KeyK',
      inAll: true,
      section: 'autoclickers',
    },
    {
      id: 'stockTrader',
      name: 'Stock market autobuyer',
      desc: 'Once a second: buys the max it can afford of fast-rising stocks, then slow-rising ones, and sells anything it holds that isn’t rising.',
      icon: sprite(9, 33),
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'stocks.trade', params: { buy: true } }],
      shift: { step: 0, key: 'buy', on: 'buys and sells', off: 'only sells what you hold' },
      defaultKey: '',
      section: 'stocks',
    },
    {
      id: 'sellAll',
      name: 'Sell all stocks',
      desc: 'Turns the autobuyer off (so it doesn’t buy it all straight back), then sells every stock you hold.',
      icon: { ico: 'dollar' },
      mode: 'once',
      steps: [{ action: 'macro.set', params: { macro: 'stockTrader', to: 'off' } }, { action: 'stocks.sellAll' }],
      noOptions: true,
      defaultKey: '',
      section: 'stocks',
    },
    {
      id: 'elderPledge',
      name: 'Elder Pledge',
      desc: 'Keeps the elders pledged: buys the Elder Pledge whenever the Grandmapocalypse is on and it’s for sale (it lasts a while, then wears off).',
      icon: sprite(9, 9),
      mode: 'repeat',
      every: 2000,
      steps: [{ action: 'grandma.exit', params: { how: 'pledge' } }],
      defaultKey: '',
      section: 'upkeep',
    },
    {
      id: 'lumps',
      name: 'Sugar lump harvester',
      desc: 'Harvests your sugar lump when it’s ripe (always pays) — or as soon as it’s mature, a little earlier but with the game’s 50% chance of getting nothing.',
      icon: sprite(29, 14),
      mode: 'repeat',
      every: 1000,
      steps: [{ action: 'lump.harvest', params: { when: 'ripe' } }],
      options: [{ step: 0, key: 'when' }],
      defaultKey: '',
      section: 'upkeep',
    },
  ];

  const macros = []; // builtins first, then yours, in order
  const byId = {};
  const running = {}; // id -> { timer, since, condWas, lastFire }
  const status = {}; // id -> { runs, lastRun, steps: [{ total, runs, last, lastAt, error }] }
  let prefs = {}; // id -> { fav }
  let depth = 0;
  // how busy each macro has been: an exponentially decaying count of the things it did
  // (time constant ACTIVITY_S), so rate() ≈ things per second over the last few minutes
  const ACTIVITY_S = 300;
  const activity = {}; // id -> { h, t }

  // ---- definitions --------------------------------------------------------------------

  function clean(def) {
    const mode = ['repeat', 'when', 'once', 'group', 'flow'].includes(def.mode) ? def.mode : 'repeat';
    const m = {
      id: String(def.id),
      name: String(def.name || 'Macro').slice(0, 60),
      desc: String(def.desc || '').slice(0, 300),
      icon: def.icon && typeof def.icon === 'object' ? def.icon : { ico: 'bolt' },
      mode,
      every: Math.max(MIN_EVERY, Math.round(Number(def.every) || (mode === 'when' ? 250 : 1000))),
      steps: (Array.isArray(def.steps) ? def.steps : [])
        .filter((s) => s && typeof s.action === 'string')
        .map((s) => ({ action: s.action, params: s.params && typeof s.params === 'object' ? { ...s.params } : {} })),
      builtin: !!def.builtin,
    };
    if (mode === 'group') {
      m.steps = [];
      m.members = (Array.isArray(def.members) ? def.members : []).map(String).filter((id) => id !== m.id);
    }
    if (mode === 'flow') {
      m.steps = [];
      // an algorithmic macro: its code (features/script.js compiles it when it starts) — v2.22
      // saved blocks instead, written out as code here
      if (typeof def.source === 'string') m.source = def.source.slice(0, 50000);
      else if (Array.isArray(def.flow) && def.flow.length) m.source = CA.Script.decompile(cleanFlow(def.flow));
      if (def.builtin && typeof def.defaultSource === 'string') m.defaultSource = def.defaultSource;
    }
    if (mode === 'when') {
      // { all: [{ cond, params, not }, …], edge } — v2.0 saved a single condition at the top level
      const w = def.when || {};
      const list = (Array.isArray(w.all) ? w.all : [w]).filter((c) => c && c.cond);
      m.when = {
        all: (list.length ? list : [{ cond: 'buff' }]).map((c) => ({
          cond: String(c.cond),
          params: c.params && typeof c.params === 'object' ? { ...c.params } : {},
          not: !!c.not,
        })),
        edge: w.edge === 'while' ? 'while' : 'rise',
      };
    }
    ['defaultKey', 'section', 'spell', 'needsCM', 'holdRepeat'].forEach((k) => def[k] !== undefined && (m[k] = def[k]));
    // built-ins can let you choose some of their steps' params right on their row (saved in prefs);
    // by default every param of their actions — worked out after every feature has registered its
    // actions (ready()), since a built-in can use an action registered after it
    if (m.builtin) {
      const auto = def.spell || def.noOptions ? [] : [].concat(...m.steps.map((st, i) => ((CA.Actions.get(st.action) || {}).params || []).map((p) => ({ step: i, key: p.key }))));
      m.options = (Array.isArray(def.options) ? def.options : auto).filter((o) => m.steps[o.step]);
      // a setting that shift-clicking its left-panel button flips: { step, key, on, off } (labels)
      if (def.shift) m.shift = def.shift;
    }
    return m;
  }

  function add(def) {
    const m = clean(def);
    if (byId[m.id]) {
      macros[macros.indexOf(byId[m.id])] = m;
    } else macros.push(m);
    byId[m.id] = m;
    status[m.id] = status[m.id] || freshStatus(m);
    if (status[m.id].steps.length !== m.steps.length) status[m.id] = freshStatus(m);
    CA.Hotkeys.register({
      id: `macro.${m.id}`,
      name: m.name,
      group: 'macros',
      defaultKey: m.defaultKey || '',
      run: () => trigger(m.id),
    });
    return m;
  }

  const freshStatus = (m) => ({ runs: 0, lastRun: 0, steps: m.steps.map(() => ({ total: 0, runs: 0, last: 0, lastAt: 0, error: '' })) });

  const newId = () => `m${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

  /** For features that bring their own built-in macros (e.g. features/grimoire.js). Call during init. */
  // Built-ins can be edited like your own macros: your version is kept in prefs[id].custom and
  // laid over the original (baseDefs) — "Revert to default" just drops it.
  const baseDefs = {};
  const CUSTOM_FIELDS = ['name', 'desc', 'icon', 'mode', 'every', 'steps', 'when', 'members', 'source'];
  function applyBuiltin(id) {
    const base = baseDefs[id];
    if (!base) return null;
    const c = prefs[id] && prefs[id].custom;
    const wasOn = !!running[id];
    if (wasOn) stop(id);
    const m = add({ ...base, ...(c || {}), builtin: true });
    m.customized = !!c;
    if (wasOn && m.mode !== 'once' && m.mode !== 'group') start(id);
    return m;
  }
  const addBuiltin = (def) => {
    baseDefs[def.id] = def;
    return applyBuiltin(def.id);
  };
  /** Saves your version of a built-in (its steps, kind, code… as the editor has them). */
  function customize(id, def) {
    if (!baseDefs[id]) return null;
    const custom = {};
    CUSTOM_FIELDS.forEach((k) => def[k] !== undefined && (custom[k] = JSON.parse(JSON.stringify(def[k]))));
    // the editor's version already holds the row choices, interval and code: drop the separate ones
    const fav = prefs[id] && prefs[id].fav;
    prefs[id] = { custom, ...(fav ? { fav } : {}) };
    const m = applyBuiltin(id);
    changed(id);
    return m;
  }
  /** Back to the built-in as it comes (keeping only whether it's a favourite). */
  function revert(id) {
    if (!baseDefs[id]) return null;
    const fav = prefs[id] && prefs[id].fav;
    prefs[id] = fav ? { fav } : {};
    const m = applyBuiltin(id);
    changed(id);
    return m;
  }
  /** Whether a built-in has been changed from how it comes (edited, or its settings changed). */
  const isCustomized = (id) => !!(baseDefs[id] && prefs[id] && Object.keys(prefs[id]).some((k) => k !== 'fav'));

  /** Creates or updates one of your macros; returns it. Built-ins can't be changed. */
  function save(def) {
    if (def.id && byId[def.id] && byId[def.id].builtin) return customize(def.id, def);
    const wasOn = def.id && isOn(def.id);
    if (wasOn) stop(def.id);
    const m = add({ ...def, id: def.id || newId(), builtin: false });
    if (wasOn && m.mode !== 'once') start(m.id);
    changed(m.id);
    return m;
  }

  function remove(id) {
    const m = byId[id];
    if (!m || m.builtin) return false;
    stop(id);
    macros.splice(macros.indexOf(m), 1);
    delete byId[id];
    delete status[id];
    delete prefs[id];
    delete flowRuns[id];
    delete activity[id];
    delete problems[id];
    CA.Hotkeys.unregister(`macro.${id}`);
    changed(id);
    return true;
  }

  function duplicate(id) {
    const m = byId[id];
    if (!m) return null;
    // the copy gets the steps (and a flow's blocks) as they are now, settings applied
    const copy = JSON.parse(JSON.stringify({ ...m, steps: stepsOf(m), every: everyOf(m), source: m.mode === 'flow' ? sourceOf(m) : undefined }));
    delete copy.defaultSource;
    delete copy.options;
    delete copy.shift;
    delete copy.defaultKey;
    delete copy.section;
    return save({ ...copy, id: null, builtin: false, name: `${m.name} (copy)`.slice(0, 60) });
  }

  // ---- running ----------------------------------------------------------------------------

  const ascending = () => CA.Ascension.inProgress();

  function runSteps(m) {
    if (ascending() || depth >= MAX_DEPTH) return 0;
    const st = status[m.id];
    let done = 0;
    depth++;
    try {
      stepsOf(m).forEach((step, i) => {
        const s = st.steps[i];
        try {
          const n = CA.Actions.run(step.action, step.params);
          s.runs++;
          s.last = n;
          if (n > 0) {
            s.total += n;
            s.lastAt = Date.now();
          }
          s.error = '';
          done += n;
        } catch (e) {
          s.error = String((e && e.message) || e);
          console.error(`[CookieMgr] macro "${m.name}" step ${i + 1} failed`, e);
        }
      });
    } finally {
      depth--;
    }
    st.runs++;
    st.lastRun = Date.now();
    if (done > 0) bump(m.id, done);
    return done;
  }

  // ---- flows --------------------------------------------------------------------------------
  //
  // A flow is a list of blocks run in order; each block finishes now or waits for a later pass:
  //   { type: 'do', action, params }               runs the action once
  //   { type: 'wait', cond }                       waits until the condition holds
  //   { type: 'until', cond, body: [...] }         runs body (again each pass) until cond holds
  //   { type: 'if', cond, then: [...], else: [...] }   picks a branch when it gets there
  //   { type: 'parallel', branches: [[...], ...] } runs the branches side by side; done when all are
  //   { type: 'forever', body: [...] }             runs body again and again
  // (cond is { all: [{ cond, params, not }] }, like a "When…" macro's.) Every pass (the macro's
  // interval) advances each running branch as far as it can without waiting, but never repeats
  // a body twice in one pass, so nothing can spin. A flow that reaches its end switches itself off.

  const FLOW_TYPES = ['do', 'wait', 'until', 'if', 'parallel', 'forever', 'sleep', 'times', 'stop', 'log'];
  const MAX_FLOW_DEPTH = 12;
  function cleanCond(c) {
    const list = (c && Array.isArray(c.all) ? c.all : []).filter((x) => x && x.cond).map((x) => ({ cond: String(x.cond), params: x.params && typeof x.params === 'object' ? { ...x.params } : {}, not: !!x.not }));
    return { all: list.length ? list : [{ cond: 'buff', params: {}, not: false }] };
  }
  function cleanFlow(list, d = 0) {
    if (!Array.isArray(list) || d > MAX_FLOW_DEPTH) return [];
    return list
      .filter((n) => n && FLOW_TYPES.includes(n.type))
      .map((n) => {
        if (n.type === 'do') return { type: 'do', action: String(n.action || 'pop.golden'), params: n.params && typeof n.params === 'object' ? { ...n.params } : {} };
        if (n.type === 'wait') return { type: 'wait', cond: cleanCond(n.cond) };
        if (n.type === 'until') return { type: 'until', cond: cleanCond(n.cond), body: cleanFlow(n.body, d + 1) };
        if (n.type === 'if') return { type: 'if', cond: cleanCond(n.cond), then: cleanFlow(n.then, d + 1), else: cleanFlow(n.else, d + 1) };
        if (n.type === 'parallel') return { type: 'parallel', branches: (Array.isArray(n.branches) ? n.branches : [[], []]).slice(0, 8).map((b) => cleanFlow(b, d + 1)) };
        if (n.type === 'sleep') return { type: 'sleep', secs: Math.max(0, Number(n.secs) || 0) };
        if (n.type === 'times') return { type: 'times', n: Math.max(0, Math.floor(Number(n.n) || 0)), body: cleanFlow(n.body, d + 1) };
        if (n.type === 'stop') return { type: 'stop' };
        if (n.type === 'log') return { type: 'log', text: String(n.text || '') };
        return { type: 'forever', body: cleanFlow(n.body, d + 1) };
      });
  }

  /** An algorithmic macro's code: yours, or a built-in's (as you edited it, else its default). */
  const sourceOf = (m) => (typeof m.source === 'string' ? m.source : (m.builtin && m.defaultSource) || '');
  /** Its code compiled: { flow, errors } (lines kept, for its status). */
  const compiledOf = (m) => CA.Script.compile(sourceOf(m));
  /** The blocks a flow runs. */
  const flowOf = (m) => compiledOf(m).flow;
  /** Why a macro couldn't start or stopped by itself (code with a problem), else ''. */
  const problems = {};
  const problemOf = (id) => problems[id] || '';

  const flowRuns = {}; // id -> { prog, S (per-block state by path), at: [what it waits on], done, error }

  /** { ok, text } for a block's condition — the text says what it saw. */
  const check = (c) => (CA.Script ? CA.Script.evaluate(c) : { ok: CA.Conditions.test(c), text: CA.Conditions.describe(c) });
  const at = (F, n, text) => F.at.push(n.line ? `line ${n.line}: ${text}` : text);
  /** A line in the flow's trace (the decisions it took), newest last, the last TRACE_MAX kept. */
  const TRACE_MAX = 40;
  function trace(F, n, text) {
    const last = F.trace[F.trace.length - 1];
    const entry = n.line ? `line ${n.line}: ${text}` : text;
    if (last && last.text === entry) return;
    F.trace.push({ t: Date.now(), text: entry, line: n.line || 0 });
    if (F.trace.length > TRACE_MAX) F.trace.shift();
  }
  function resetUnder(S, path) {
    Object.keys(S).forEach((k) => (k === path || k.startsWith(`${path}.`)) && delete S[k]);
  }
  function execSeq(F, nodes, path) {
    const st = F.S[path] || (F.S[path] = { i: 0 });
    while (st.i < nodes.length) {
      if (!execNode(F, nodes[st.i], `${path}.${st.i}`) || F.stopped) return false;
      st.i++;
    }
    return true;
  }
  function execNode(F, n, path) {
    switch (n.type) {
      case 'do': {
        try {
          const k = CA.Actions.run(n.action, n.params) || 0;
          F.done += k;
          F.error = '';
          if (F.pass && k) trace(F, n, `${n.action}: ${k}`);
        } catch (e) {
          F.error = String((e && e.message) || e);
        }
        return true;
      }
      case 'wait': {
        const r = check(n.cond);
        if (r.ok) {
          trace(F, n, `waited until ${r.text}`);
          return true;
        }
        at(F, n, `waiting until ${r.text}`);
        return false;
      }
      case 'sleep': {
        const st = F.S[path] || (F.S[path] = { until: Date.now() + n.secs * 1000 });
        if (Date.now() >= st.until) return true;
        at(F, n, `waiting ${Math.ceil((st.until - Date.now()) / 1000)}s`);
        return false;
      }
      case 'until': {
        const r = check(n.cond);
        if (r.ok) {
          trace(F, n, `done: ${r.text}`);
          return true;
        }
        at(F, n, `until ${r.text}`);
        if (execSeq(F, n.body, `${path}.b`)) resetUnder(F.S, `${path}.b`);
        return false;
      }
      case 'times': {
        const st = F.S[path] || (F.S[path] = { k: 0 });
        if (st.k >= n.n) return true;
        at(F, n, `round ${st.k + 1} of ${n.n}`);
        if (execSeq(F, n.body, `${path}.b`)) {
          resetUnder(F.S, `${path}.b`);
          st.k++;
        }
        return st.k >= n.n;
      }
      case 'if': {
        let st = F.S[path];
        if (!st) {
          const r = check(n.cond);
          st = F.S[path] = { branch: r.ok ? 'then' : 'else' };
          trace(F, n, `if ${r.text} → ${r.ok ? 'yes' : n.else && n.else.length ? 'no: else' : 'no: skipped'}`);
        }
        return execSeq(F, n[st.branch] || [], `${path}.${st.branch}`);
      }
      case 'stop':
        trace(F, n, 'stop');
        F.stopped = true;
        return false;
      case 'log':
        trace(F, n, n.text);
        return true;
      case 'parallel': {
        let all = true;
        n.branches.forEach((b, i) => {
          if (F.stopped) return;
          if (!execSeq(F, b, `${path}.p${i}`)) all = false;
        });
        return all;
      }
      case 'forever':
      default:
        if (execSeq(F, n.body || [], `${path}.b`)) resetUnder(F.S, `${path}.b`);
        at(F, n, 'repeating');
        return false;
    }
  }
  function runFlow(m) {
    const F = flowRuns[m.id];
    if (!F || ascending() || depth >= MAX_DEPTH) return;
    F.at = [];
    const before = F.done;
    depth++;
    let finished = false;
    let failed = false;
    try {
      finished = execSeq(F, F.prog, 'r') || F.stopped;
    } catch (e) {
      failed = true;
      F.error = String((e && e.message) || e);
      console.error(`[CookieMgr] macro "${m.name}" stopped`, e);
    } finally {
      depth--;
    }
    status[m.id].runs++;
    status[m.id].lastRun = Date.now();
    if (F.done > before) bump(m.id, F.done - before);
    if (failed) {
      problems[m.id] = F.error;
      set(m.id, false, { silent: true });
      CA.Util.notify(m.name, `Stopped — ${CA.Util.escapeHtml(F.error)}`, CA.ICON, 5);
      return;
    }
    if (finished) {
      set(m.id, false, { silent: true });
      if (CA.Settings.get('notifications')) CA.Util.notify(m.name, 'Finished — it got to the end of its flow.', CA.ICON, 3);
    }
  }
  /**
   * Runs compiled code once, from the top, as one pass (rules that are checked every second, like
   * a garden profile's). Returns { done, at, trace, error } — what it did and where it stopped.
   */
  function runPass(prog) {
    const F = { prog, S: {}, at: [], trace: [], done: 0, error: '', stopped: false, pass: true };
    if (depth >= MAX_DEPTH) return F;
    depth++;
    try {
      execSeq(F, prog, 'r');
    } finally {
      depth--;
    }
    return F;
  }

  /** Where a running flow is: { at: ['until Christmas is complete', …], done, error }. */
  const flowStatus = (id) =>
    flowRuns[id]
      ? {
          at: flowRuns[id].at.slice(),
          // the lines it's on right now (for the editor's gutter)
          lines: flowRuns[id].at.map((a) => Number((a.match(/^line (\d+):/) || [])[1])).filter(Boolean),
          trace: flowRuns[id].trace.slice(),
          done: flowRuns[id].done,
          error: flowRuns[id].error,
        }
      : null;

  function tick(m) {
    const r = running[m.id];
    if (!r) return;
    if (m.mode === 'flow') {
      runFlow(m);
      return;
    }
    if (m.mode === 'repeat') {
      runSteps(m);
      return;
    }
    // when
    const now = CA.Conditions.test(m.when);
    const fire = now && (m.when.edge === 'while' || !r.condWas);
    r.condWas = now;
    if (fire) {
      r.lastFire = Date.now();
      runSteps(m);
    }
  }

  /** Starts a macro's timer; false when it can't run (code with a problem: problemOf(id) says why). */
  function start(id) {
    const m = byId[id];
    if (!m || m.mode === 'once' || running[id]) return false;
    if (m.mode === 'flow') {
      const { flow, errors } = compiledOf(m);
      if (errors.length) {
        problems[id] = `line ${errors[0].line}: ${errors[0].message}`;
        return false;
      }
      flowRuns[id] = { prog: flow, S: {}, at: [], trace: [], done: 0, error: '', stopped: false };
    }
    delete problems[id];
    running[id] = { since: Date.now(), condWas: false, lastFire: 0, timer: setInterval(() => tick(m), everyOf(m)) };
    return true;
  }

  function stop(id) {
    const r = running[id];
    if (!r) return;
    clearInterval(r.timer);
    delete running[id];
  }

  function announce(m, on) {
    if (!CA.Settings.get('notifications')) return;
    const icon = m.icon && m.icon.sprite ? m.icon.sprite : CA.ICON;
    CA.Util.notify(m.name, on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', icon, 2);
  }

  function changed(id) {
    CA.Events.emit('macros', id);
  }

  /** A group's members that exist and can be switched (no once macros, no other groups). */
  const membersOf = (m) => (m && m.mode === 'group' ? m.members.map((id) => byId[id]).filter((x) => x && x.mode !== 'once' && x.mode !== 'group') : []);

  /** Turns a repeat/when macro — or every member of a group — on or off. */
  function set(id, on, { silent = false } = {}) {
    const m = byId[id];
    if (!m || m.mode === 'once') return;
    on = !!on;
    if (m.mode === 'group') {
      const members = membersOf(m);
      if (!members.length || (isOn(id) === on && members.every((x) => isOn(x.id) === on))) return;
      members.forEach((x) => set(x.id, on, { silent: true }));
      if (!silent) announce(m, on);
      changed(id);
      return;
    }
    if (isOn(id) === on) return;
    if (on && !start(id)) {
      CA.Util.notify(m.name, `Can’t start — ${CA.Util.escapeHtml(problems[id] || 'its code has a problem')}. Edit it to fix that.`, CA.ICON, 5);
      changed(id);
      return;
    }
    if (!on) stop(id);
    if (!silent) announce(m, on);
    changed(id);
  }

  const toggle = (id) => set(id, !isOn(id));

  /** Runs a macro's steps one time right now (any mode). Returns how many things it did. */
  function runOnce(id) {
    const m = byId[id];
    if (!m) return 0;
    const n = runSteps(m);
    changed(id);
    return n;
  }

  /** What a hotkey or shortcut button does: once macros run, the others switch on/off. */
  function trigger(id) {
    const m = byId[id];
    if (!m) return;
    if (m.mode === 'once') runOnce(id);
    else toggle(id);
  }

  // ---- queries --------------------------------------------------------------------------------

  function isOn(id) {
    const m = byId[id];
    if (m && m.mode === 'group') {
      const members = membersOf(m);
      return members.length > 0 && members.every((x) => !!running[x.id]);
    }
    return !!running[id];
  }
  const list = () => macros.slice();
  const get = (id) => byId[id] || null;
  const activeCount = () => Object.keys(running).length;
  const runningIds = () => Object.keys(running);
  const statusOf = (id) => status[id] || null;
  const since = (id) => (running[id] ? running[id].since : 0);
  function bump(id, n) {
    const now = Date.now();
    const a = activity[id] || { h: 0, t: now };
    a.h = a.h * Math.exp(-(now - a.t) / 1000 / ACTIVITY_S) + n;
    a.t = now;
    activity[id] = a;
  }
  /** Things done per second lately (a group: its members together). */
  function rate(id) {
    const m = byId[id];
    if (m && m.mode === 'group') return membersOf(m).reduce((s, x) => s + rate(x.id), 0);
    const a = activity[id];
    return a ? (a.h * Math.exp(-(Date.now() - a.t) / 1000 / ACTIVITY_S)) / ACTIVITY_S : 0;
  }
  /** rate() in six bands (0 idle … 5 many per second), for the activity ring on macro buttons. */
  function activityLevel(id) {
    const r = rate(id);
    return r < 0.0005 ? 0 : r < 0.01 ? 1 : r < 0.1 ? 2 : r < 1 ? 3 : r < 10 ? 4 : 5;
  }

  /** A macro's steps with the choices you made on a built-in's row applied. */
  function stepsOf(m) {
    const chosen = (prefs[m.id] && prefs[m.id].params) || {};
    if (!m.options || !m.options.length) return m.steps;
    return m.steps.map((s, i) => {
      const own = {};
      m.options.forEach((o) => o.step === i && chosen[`${i}.${o.key}`] !== undefined && (own[o.key] = chosen[`${i}.${o.key}`]));
      return Object.keys(own).length ? { ...s, params: { ...s.params, ...own } } : s;
    });
  }
  /** How often a macro runs (ms): a built-in's interval can be changed in its settings. */
  const everyOf = (m) => (m.builtin && prefs[m.id] && prefs[m.id].every >= MIN_EVERY ? prefs[m.id].every : m.every);
  /** Sets a built-in's interval (restarting it if it's running). */
  function setEvery(id, ms) {
    const m = byId[id];
    if (!m || !m.builtin || m.mode === 'once' || m.mode === 'group') return;
    prefs[id] = { ...(prefs[id] || {}), every: Math.max(MIN_EVERY, Math.round(ms)) };
    if (running[id]) {
      stop(id);
      start(id);
    }
    changed(id);
  }
  /** Flips a built-in's shift-click setting; returns the new value (or null if it has none). */
  function shiftToggle(id) {
    const m = byId[id];
    if (!m || !m.shift) return null;
    const step = stepsOf(m)[m.shift.step];
    const now = CA.Actions.paramsFor(step.action, step.params)[m.shift.key];
    setParam(id, m.shift.step, m.shift.key, !now);
    return !now;
  }
  /** The current value of a built-in's shift-click setting. */
  function shiftValue(id) {
    const m = byId[id];
    if (!m || !m.shift) return null;
    const step = stepsOf(m)[m.shift.step];
    return !!CA.Actions.paramsFor(step.action, step.params)[m.shift.key];
  }

  /** Sets one of a built-in's row choices (one of its `options`). */
  function setParam(id, step, key, value) {
    const m = byId[id];
    if (!m || !(m.options || []).some((o) => o.step === step && o.key === key)) return;
    const p = { ...(prefs[id] || {}) };
    p.params = { ...(p.params || {}), [`${step}.${key}`]: value };
    prefs[id] = p;
    changed(id);
  }
  const isFav = (id) => !!(prefs[id] && prefs[id].fav);
  function setFav(id, on) {
    if (!byId[id]) return;
    prefs[id] = { ...(prefs[id] || {}), fav: !!on };
    changed(id);
  }

  /** Human summary of when a macro runs: "every 0.1s", "when Click frenzy is active", "on demand". */
  function triggerText(m) {
    const secs = (ms) => (ms < 1000 ? `${ms / 1000}s` : `${Math.round(ms / 100) / 10}s`);
    if (m.mode === 'once') return 'on demand';
    if (m.mode === 'group') return `group of ${membersOf(m).length}`;
    if (m.mode === 'repeat') return `every ${secs(everyOf(m))}`;
    if (m.mode === 'flow') return `flow · every ${secs(everyOf(m))}`;
    return `${m.when.edge === 'while' ? 'while' : 'when'} ${CA.Conditions.describe(m.when)}`;
  }

  // ---- save / load ---------------------------------------------------------------------------

  function serialize() {
    return {
      custom: macros.filter((m) => !m.builtin).map(({ builtin, ...rest }) => rest),
      prefs: { ...prefs },
    };
  }

  /** Loads your macros and preferences from a save (replacing the ones defined now). */
  function load(data) {
    if (!data || typeof data !== 'object') return;
    macros.filter((m) => !m.builtin).forEach((m) => remove(m.id));
    (Array.isArray(data.custom) ? data.custom : []).forEach((d) => {
      if (d && d.id && !(byId[d.id] && byId[d.id].builtin)) add({ ...d, builtin: false });
    });
    prefs = data.prefs && typeof data.prefs === 'object' ? { ...data.prefs } : {};
    // before v2.28: a built-in's edited code in prefs.source, and v2.22's flow settings in prefs.flow
    Object.keys(prefs).forEach((id) => {
      const p = prefs[id];
      if (!p || typeof p !== 'object') return delete prefs[id];
      if (typeof p.source === 'string') p.custom = { ...(p.custom || {}), source: p.source };
      delete p.source;
      delete p.flow;
      if (p.custom && typeof p.custom === 'object') delete p.custom.flow;
    });
    // your versions of the built-ins (and back to the originals where you had none)
    Object.keys(baseDefs).forEach((id) => {
      if ((prefs[id] && prefs[id].custom) || (byId[id] && byId[id].customized)) applyBuiltin(id);
    });
    changed(null);
  }

  /** Turns on the macros that were running when the game was saved (rememberStates). */
  function restore(ids) {
    (ids || []).forEach((id) => set(id, true, { silent: true }));
  }

  /** Once every feature has started: built-ins' row choices can use any action now. */
  function ready() {
    Object.keys(baseDefs).forEach((id) => {
      const m = byId[id];
      if (m && !(baseDefs[id].options || baseDefs[id].spell || baseDefs[id].noOptions)) applyBuiltin(id);
    });
  }

  function init() {
    BUILTINS.forEach((d) => addBuiltin(d));
    CA.Settings.registerSection('macros', { serialize, load, event: 'macros' });
    // which were running (when "Remember on/off states" is on) — v1.x saved { clickers: { id: true }, stockTrader }
    CA.Settings.registerSection('running', {
      serialize: () => (CA.Settings.get('rememberStates') ? runningIds() : undefined),
      load(ids, whole) {
        if (!CA.Settings.get('rememberStates')) return;
        if (Array.isArray(ids)) return restore(ids);
        const legacy = Object.keys((whole && whole.clickers) || {}).filter((id) => whole.clickers[id] === true);
        if (whole && whole.stockTrader === true) legacy.push('stockTrader');
        restore(legacy);
      },
    });

    CA.Settings.defineOption({
      key: 'disableOnAscend',
      icon: 'ascend',
      group: 'macros',
      name: 'Turn off when ascending',
      desc: 'Switches every running macro off as soon as you ascend.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'rememberStates',
      icon: 'save',
      group: 'macros',
      name: 'Remember on/off states',
      desc: 'Restores which macros were running when you reload the game.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'notifications',
      icon: 'bell',
      group: 'macros',
      name: 'Macro on/off notifications',
      desc: 'Shows a small ON/OFF popup whenever a macro is switched.',
      default: true,
    });

    CA.Events.on('ascend', () => {
      if (!CA.Settings.get('disableOnAscend')) return;
      const stopping = runningIds();
      if (!stopping.length) return;
      stopping.forEach((id) => set(id, false, { silent: true }));
      CA.Util.notify('CookieMgr', 'Your macros were turned off for your ascension.', [20, 7], 4);
    });
  }

  return {
    init,
    ready,
    list,
    get,
    addBuiltin,
    save,
    remove,
    duplicate,
    set,
    toggle,
    trigger,
    runOnce,
    isOn,
    since,
    activeCount,
    runningIds,
    status: statusOf,
    membersOf,
    isFav,
    setFav,
    customize,
    revert,
    isCustomized,
    stepsOf,
    setParam,
    everyOf,
    setEvery,
    shiftToggle,
    shiftValue,
    flowOf,
    compiledOf,
    problemOf,
    sourceOf,
    flowStatus,
    runPass,
    rate,
    activityLevel,
    triggerText,
    serialize,
    load,
    restore,
    MIN_EVERY,
  };
})();
