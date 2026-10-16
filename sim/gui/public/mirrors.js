// The simulation's data, where the add-on's pages look for it. The add-on's charts and pages (its
// Graphs page, its Events page, the plotting engine — loaded from src/ in /cm.js) read CookieMgr's
// recorder, event log and golden cookie history. In the game those modules record live; here the
// recording happens in the simulated game (CookieMgr's own Recorder and History running there), and
// what they recorded is streamed to the page. This file puts it in place:
//
//   CA.Recorder    the add-on's own recorder (core/recorder.js), loaded from a stand-in store that
//                  holds the streamed frames — its queries (frames, series, timeAt, activeAt, recent…)
//                  are the real ones
//   CA.EventLog    the simulated game's event log, as streamed (list, since, types)
//   CA.History     golden cookie effects as recorded there (intervalsIn); colours: the add-on's own
//   CA.UI.Menu     the two things the pages ask of the add-on's panel: render() and optionsCard()
//   Date.now()     inside the add-on's code, the simulated moment (CookieSimClock — see /cm.js)
//   Game           the few numbers the pages read straight from the game (bank, baked, prestige) and
//                  its prestige formulas, as the simulated game has them
//
//   CA.SimData.setup(meta) once; reset() for another simulation; feed(snapshot) for each snapshot.

(() => {
  const esc = (s) => CA.Util.escapeHtml(s);

  // ---- the store the recorder loads from: the streamed frames, as one chunk -------------------------
  let frames = [];
  let active = 0;
  const done = (v) => Promise.resolve(v);
  CA.Store = {
    saveId: () => 'sim',
    allFor: (store) => done(store === 'chunks' && frames.length ? [{ id: 'sim|0|0', s: 'sim', tier: 0, start: frames[0].a, frames }] : []),
    getKV: (k) => done(k === 'recorder' ? { active } : null),
    setKV: () => done(),
    putMany: () => done(),
    removeMany: () => done(),
    clearSave: () => done(),
  };
  /** The recorder takes the frames in as an import would (its own load) — then the charts tick. */
  const reload = () => CA.Recorder.importData({ format: 'cookiemgr-history', chunks: [] });

  // ---- the event log ---------------------------------------------------------------------------------
  let events = [];
  let version = 0;
  let TYPES = {};
  CA.EventLog = {
    init() {},
    add() {},
    flush: () => done(),
    clear: () => done(),
    defineType: (type, meta) => (TYPES[type] = meta),
    types: () => TYPES,
    version: () => version,
    list(types) {
      if (!types) return events;
      const set = new Set(types);
      return events.filter((e) => set.has(e.type));
    },
    since(t) {
      let lo = 0;
      let hi = events.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (events[mid].t <= t) lo = mid + 1;
        else hi = mid;
      }
      return events.slice(lo);
    },
  };

  // ---- golden cookie effects: the add-on's colours, the simulated game's intervals ---------------------
  const H = CA.History;
  let intervals = [];
  CA.History = {
    colorFor: H.colorFor,
    get intervals() {
      return intervals;
    },
    intervalsIn(t0, t1) {
      const now = Date.now();
      return intervals.filter((iv) => (iv.end || now) >= t0 && iv.start <= t1);
    },
  };

  // ---- the panel: what the pages ask of ui/menu.js ------------------------------------------------------
  const optionTile = (def) =>
    `<div class="ca-opt" data-option="${esc(def.key)}">` +
    `<span class="ca-opt-ico">${CA.UI.Icons.html(def.icon || 'settings', 15)}</span>` +
    `<div class="ca-opt-text"><b>${esc(def.name)}</b><span>${esc(def.desc)}</span></div>` +
    CA.UI.C.toggle(!!CA.Settings.get(def.key), `data-ca="option" data-key="${esc(def.key)}"`, def.name) +
    '</div>';
  let onRender = () => {};
  CA.UI.Menu = {
    render: () => onRender(),
    optionsCard(title, icon, group, extra = '') {
      const opts = CA.Settings.optionsIn(group).filter((d) => typeof d.default === 'boolean');
      if (!opts.length && !extra) return '';
      return `<div class="ca-card">${CA.UI.C.cardHead(title, icon)}<div class="ca-optgrid">${opts.map(optionTile).join('')}</div>${extra}</div>`;
    },
    openPage() {},
    isOpen: () => true,
    close() {},
  };

  CA.SimData = {
    /** Once: the recorded states' definitions and the event types (from the server's meta), then the pages. */
    setup(meta, { render } = {}) {
      if (render) onRender = render;
      (meta.vocab.states || []).forEach((d) => CA.States.get(d.id) || CA.States.define({ ...d, get: () => NaN }));
      TYPES = { ...meta.vocab.eventTypes };
      CA.Recorder.init();
      CA.UI.Graphs.init();
      CA.UI.EventsPage.init();
    },
    /** Another simulation: nothing recorded yet. */
    reset() {
      frames = [];
      active = 0;
      events = [];
      intervals = [];
      version++;
      window.CookieSimClock.now = 0;
      return reload();
    },
    /** A snapshot from the server: its clock, frames, events and effects into place, then the pages refresh. */
    async feed(snap) {
      window.CookieSimClock.now = snap.clock;
      const st = snap.stats || {};
      const hc = st.hcFactor || 3;
      Object.assign(window.Game, {
        cookies: st.cookies,
        cookiesEarned: st.cookiesEarned,
        cookiesReset: st.cookiesReset || 0,
        prestige: st.prestige || 0,
        HCfactor: hc,
        // minigames/main.js: Game.HowMuchPrestige / Game.HowManyCookiesReset
        HowMuchPrestige: (cookies) => Math.pow(cookies / 1e12, 1 / hc),
        HowManyCookiesReset: (chips) => Math.pow(chips, hc) * 1e12,
      });
      let newEvents = false;
      if (snap.events && snap.events.length) {
        snap.events.forEach((e) => events.push(e));
        version++;
        newEvents = true;
      }
      if (snap.intervals) intervals = snap.intervals;
      if (snap.rec) {
        const r = snap.rec;
        if (r.reset) frames = r.frames.slice();
        else {
          // the recorder merged a stretch of older frames (past 3 h of play): that stretch replaced; then what is new
          if (r.keep < frames.length) frames = frames.slice(0, r.keep).concat(r.head, frames.slice(r.drop));
          r.tail.forEach((f) => frames.push(f));
        }
        active = snap.rec.active;
        await reload();
      }
      if (newEvents) CA.Events.emit('eventLogged', null);
      CA.Events.emit('history', 'sample');
    },
  };
})();
