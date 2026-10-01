// **Macros**: automations built by chaining actions (core/actions.js). hotkey → macro(s) → action(s).
//
// A macro has a trigger mode:
//   repeat   while it's on, runs its steps every `every` ms              (the autoclickers)
//   when     while it's on, checks a condition (core/conditions.js) every `every` ms and runs its
//            steps when it becomes true ("rise") or on every check while it holds ("while")
//   once     no on/off — a button or hotkey runs its steps one time       (Sell all stocks)
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
      steps: [{ action: 'click.bigCookie' }],
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
      desc: 'Pops wrinklers as soon as they latch onto the cookie.',
      icon: sprite(19, 8),
      mode: 'repeat',
      every: 100,
      steps: [{ action: 'pop.wrinklers' }],
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
      steps: [{ action: 'stocks.trade' }],
      defaultKey: '',
      keepOnAscend: true,
      section: 'stocks',
    },
    {
      id: 'sellAll',
      name: 'Sell all stocks',
      desc: 'Turns the autobuyer off (so it doesn’t buy it all straight back), then sells every stock you hold.',
      icon: { ico: 'dollar' },
      mode: 'once',
      steps: [{ action: 'macro.set', params: { macro: 'stockTrader', to: 'off' } }, { action: 'stocks.sellAll' }],
      defaultKey: '',
      section: 'stocks',
    },
  ];

  const macros = []; // builtins first, then yours, in order
  const byId = {};
  const running = {}; // id -> { timer, since, condWas, lastFire }
  const status = {}; // id -> { runs, lastRun, steps: [{ total, runs, last, lastAt, error }] }
  let prefs = {}; // id -> { fav }
  let depth = 0;

  // ---- definitions --------------------------------------------------------------------

  function clean(def) {
    const mode = ['repeat', 'when', 'once'].includes(def.mode) ? def.mode : 'repeat';
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
      inAll: !!def.inAll,
      builtin: !!def.builtin,
    };
    if (mode === 'when') {
      const w = def.when || {};
      m.when = { cond: String(w.cond || 'buff'), params: w.params && typeof w.params === 'object' ? { ...w.params } : {}, not: !!w.not, edge: w.edge === 'while' ? 'while' : 'rise' };
    }
    ['defaultKey', 'keepOnAscend', 'section'].forEach((k) => def[k] !== undefined && (m[k] = def[k]));
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

  /** Creates or updates one of your macros; returns it. Built-ins can't be changed. */
  function save(def) {
    if (def.id && byId[def.id] && byId[def.id].builtin) throw new Error('Built-in macros can’t be edited — duplicate it instead.');
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
    CA.Hotkeys.unregister(`macro.${id}`);
    changed(id);
    return true;
  }

  function duplicate(id) {
    const m = byId[id];
    if (!m) return null;
    const copy = JSON.parse(JSON.stringify(m));
    delete copy.defaultKey;
    delete copy.section;
    delete copy.keepOnAscend;
    return save({ ...copy, id: null, builtin: false, name: `${m.name} (copy)`.slice(0, 60) });
  }

  // ---- running ----------------------------------------------------------------------------

  const ascending = () => Game.OnAscend || Game.AscendTimer > 0;

  function runSteps(m) {
    if (ascending() || depth >= MAX_DEPTH) return 0;
    const st = status[m.id];
    let done = 0;
    depth++;
    try {
      m.steps.forEach((step, i) => {
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
    return done;
  }

  function tick(m) {
    const r = running[m.id];
    if (!r) return;
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

  function start(id) {
    const m = byId[id];
    if (!m || m.mode === 'once' || running[id]) return;
    running[id] = { since: Date.now(), condWas: false, lastFire: 0, timer: setInterval(() => tick(m), m.every) };
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

  /** Turns a repeat/when macro on or off. */
  function set(id, on, { silent = false } = {}) {
    const m = byId[id];
    if (!m || m.mode === 'once') return;
    on = !!on;
    if (isOn(id) === on) return;
    if (on) start(id);
    else stop(id);
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

  // ---- "All autoclickers" -------------------------------------------------------------------

  const inAll = () => macros.filter((m) => m.inAll && m.mode !== 'once');
  const allOn = () => inAll().every((m) => isOn(m.id));
  function setAll(on, { silent = false } = {}) {
    inAll().forEach((m) => set(m.id, on, { silent: true }));
    if (!silent && CA.Settings.get('notifications')) CA.Util.notify('All autoclickers', on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', CA.ICON, 2);
  }
  /** Same as v0.1: if anything is off, turn everything on; otherwise turn all off. */
  const toggleAll = () => setAll(!allOn());

  // ---- queries --------------------------------------------------------------------------------

  const isOn = (id) => !!running[id];
  const list = () => macros.slice();
  const get = (id) => byId[id] || null;
  const activeCount = () => Object.keys(running).length;
  const runningIds = () => Object.keys(running);
  const statusOf = (id) => status[id] || null;
  const since = (id) => (running[id] ? running[id].since : 0);
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
    if (m.mode === 'repeat') return `every ${secs(m.every)}`;
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
    changed(null);
  }

  /** Turns on the macros that were running when the game was saved (rememberStates). */
  function restore(ids) {
    (ids || []).forEach((id) => set(id, true, { silent: true }));
  }

  function init() {
    BUILTINS.forEach((d) => add({ ...d, builtin: true }));
    CA.Hotkeys.register({ id: 'clickers.toggleAll', name: 'All autoclickers', group: 'macros', defaultKey: 'KeyA', run: toggleAll });

    CA.Settings.defineOption({
      key: 'disableOnAscend',
      icon: 'ascend',
      group: 'macros',
      name: 'Turn off when ascending',
      desc: 'Switches every running macro off as soon as you ascend (the stock autobuyer keeps going).',
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
      name: 'On/off notifications',
      desc: 'Shows a small ON/OFF popup whenever a macro is switched.',
      default: true,
    });

    CA.Events.on('ascend', () => {
      if (!CA.Settings.get('disableOnAscend')) return;
      const stopping = runningIds().filter((id) => !byId[id].keepOnAscend);
      if (!stopping.length) return;
      stopping.forEach((id) => set(id, false, { silent: true }));
      CA.Util.notify('CookieMgr', 'Your macros were turned off for your ascension.', [20, 7], 4);
    });
  }

  return {
    init,
    list,
    get,
    save,
    remove,
    duplicate,
    set,
    toggle,
    trigger,
    runOnce,
    isOn,
    since,
    setAll,
    toggleAll,
    allOn,
    inAll,
    activeCount,
    runningIds,
    status: statusOf,
    isFav,
    setFav,
    triggerText,
    serialize,
    load,
    restore,
    MIN_EVERY,
  };
})();
