// The Garden page: the auto-gardener and its profiles (features/garden.js).
//
//   Effects         the plants' combined effects over time (the game's Garden information figures)
//   Growth          a stacked bar chart over time: how many of each seed were at each stage (each
//                   seed its own colour, young stages darker) — features/gardenHistory.js
//   Garden          your plot as it is now, against the active profile: each tile's plant and growth
//                   stage, the profile's seed faded in on empty tiles, a red ring on tiles that don't
//                   match, and the chance a mature plant dies on the coming tick; hover a tile for details
//   Auto-gardener   its on/off switch (★ for its button on the left panel), the profile it keeps, what
//                   it last did
//   Rules           what the auto-gardener does for the active profile, as algorithmic code (the
//                   macros' language, with the garden's own actions and values) — save, or revert to
//                   the default rules; while it runs, the lines it took light up with its decisions
//   Profiles        save the current garden (seeds + soil) as a profile; use, rename or delete them

CA.UI = CA.UI || {};

CA.UI.GardenPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const G = () => CA.Garden;
  const SYNC_MS = 500;

  let root = null;
  let life = null; // the mounted page (CA.UI.Pages.scope)
  let plot = null;
  let effectsPlot = null;
  let draft = null; // { profile, src } — rules being edited, not saved yet
  let rulesError = '';

  const stageOf = (me, age) => (age >= me.mature ? 4 : age >= me.mature * 0.666 ? 3 : age >= me.mature * 0.333 ? 2 : 1);
  const STAGE_NAMES = ['seed', 'bud', 'sprout', 'bloom', 'mature'];
  const pct = (v) => `${v >= 0.995 ? 100 : v < 0.005 && v > 0 ? '<1' : Math.round(v * 100)}%`;

  /** A garden sprite (img/gardenPlants.png): column = growth stage (0 = seed), row = the plant's icon. */
  const sprite = (me, stage, cls = '') =>
    `<i class="ca-gs ${cls}" style="background-image:url(${CA.Util.res('img/gardenPlants.png')});background-position:${-stage * 48}px ${-me.icon * 48}px"></i>`;

  // ---- the plot -----------------------------------------------------------------------------

  function tileHtml(t, profile) {
    if (!t.open) return '<div class="ca-gtile locked"></div>';
    const me = t.plant;
    let inner = '';
    let pop = '';
    if (me) {
      const st = stageOf(me, t.age);
      inner += sprite(me, st);
      if (st === 4 && !me.immortal && t.decay > 0) inner += `<b class="ca-gdecay${t.decay >= 0.5 ? ' hi' : ''}">${pct(t.decay)}</b>`;
      if (!me.unlocked) inner += `<b class="ca-gnew">${I('sparkle', 9)}</b>`;
      pop +=
        `<span class="ca-wpop-head"><b>${esc(me.name)}</b></span>` +
        `<span class="ca-wpop-row"><span class="ca-wpop-name">Growth</span><span class="ca-wpop-val">${STAGE_NAMES[st]} · ${t.age} / ${me.mature}</span></span>` +
        (me.immortal
          ? '<span class="ca-wpop-row"><span class="ca-wpop-name">Lifespan</span><span class="ca-wpop-val">immortal</span></span>'
          : `<span class="ca-wpop-row"><span class="ca-wpop-name">Dies next tick</span><span class="ca-wpop-val">${pct(t.decay)}</span></span>`) +
        (!me.unlocked ? '<span class="ca-wpop-row"><span class="ca-wpop-name">New seed</span><span class="ca-wpop-val">harvest when mature to unlock</span></span>' : '');
    } else {
      if (t.want) inner += sprite(t.want, 0, 'ghost');
      pop += '<span class="ca-wpop-head"><b>Empty</b></span>';
    }
    if (profile) pop += `<span class="ca-wpop-row"><span class="ca-wpop-name">Profile</span><span class="ca-wpop-val">${t.want ? esc(t.want.name) : 'empty'}</span></span>`;
    return `<div class="ca-gtile${t.match ? '' : ' off'}" data-pop>${inner}<span class="ca-wpop ca-gpop">${pop}</span></div>`;
  }

  function plotHtml(v) {
    return v.tiles.map((t) => tileHtml(t, v.profile)).join('');
  }

  function statsHtml(v) {
    const { span, tile } = CA.UI.Plot.fmt;
    const off = v.profile ? v.tiles.filter((t) => t.open && !t.match).length : 0;
    const mature = v.tiles.filter((t) => t.plant && t.age >= t.plant.mature).length;
    return (
      tile('Next tick', Number.isFinite(v.next) ? span(v.next) : '—', v.step ? `every ${span(v.step)}` : '') +
      tile('Soil', v.soil ? esc(v.soil.name) : '—', v.profile && v.soil && v.soil.key !== v.profile.soil ? `profile: ${esc(soilName(v.profile.soil))}` : '') +
      tile('Mature', String(mature), `of ${v.tiles.filter((t) => t.plant).length} plants`) +
      (v.profile ? tile('Off-profile', String(off), off ? 'tiles to fix' : 'all as planned') : '')
    );
  }

  const soilName = (key) => {
    const M = G().minigame();
    return (M && M.soils && M.soils[key] && M.soils[key].name) || key;
  };

  function gardenCard() {
    return (
      '<div class="ca-card">' +
      C().cardHead('Garden', 'leaf', `<div class="ca-card-meta"><span class="ca-pill" data-gp-profile></span>${C().gameLink('Farm')}</div>`) +
      '<div class="ca-garden-wrap"><div class="ca-gplot" data-gp-plot></div><div class="ca-stats ca-gstats" data-gp-stats></div></div>' +
      '</div>'
    );
  }

  // ---- auto-gardener -----------------------------------------------------------------------------

  function gardenerCard() {
    const profs = G().profiles();
    const act = G().active();
    return (
      '<div class="ca-card">' +
      C().cardHead('Auto-gardener', 'bolt', `<div class="ca-card-meta"><span class="ca-hint">also on the ${C().link('Macros', 'clickers')} page · ★ for a button on the left panel</span></div>`) +
      `<div class="ca-list">${CA.UI.MacrosPage.row(CA.Macros.get(G().GARDENER))}</div>` +
      '<div class="ca-gsettings">' +
      '<label class="ca-field"><span>Keep the garden like</span>' +
      (profs.length
        ? `<select data-gp-active>${profs.map((p) => `<option value="${esc(p.id)}"${act && act.id === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`
        : '<em>no profile yet — save one below</em>') +
      '</label>' +
      (act ? `<span class="ca-hint">what it does: the profile’s <a class="ca-link" data-gp-rules-go>rules</a>${act.rules != null ? ' (edited)' : ''}</span>` : '') +
      '</div>' +
      '<div class="ca-card-note" data-gp-last></div>' +
      '</div>'
    );
  }

  // ---- rules: the active profile's, as code ------------------------------------------------

  const CE = () => CA.UI.CodeEditor;
  const RULES_HINT = 'run from the top every second while the Auto-gardener is on · Tab indents · click the library to insert';
  /** The rules shown in the editor: the unsaved draft if it's this profile's, else the saved ones. */
  const rulesText = (p) => (draft && draft.profile === p.id ? draft.src : G().rulesOf(p));

  function rulesCard() {
    const p = G().active();
    if (!p) return '';
    const edited = p.rules != null;
    const dirty = !!draft && draft.profile === p.id && draft.src !== G().rulesOf(p);
    return (
      `<div class="ca-card ca-editor2 ca-grules" data-gp-rules data-edits="${G().GARDENER}">` +
      C().cardHead(
        `Rules · ${esc(p.name)}`,
        'edit',
        '<div class="ca-card-meta">' +
          (edited ? '<span class="ca-badge ca-badge-edited">edited</span>' : '<span class="ca-pill">default rules</span>') +
          (dirty ? '<span class="ca-pill ca-pill-warn">unsaved</span>' : '') +
          C().button(`${I('save', 12)} Save`, 'data-gp-rules-act="save"', `ca-btn-small${dirty ? ' ca-btn-on' : ''}`) +
          (dirty ? C().button('Discard', 'data-gp-rules-act="discard"', 'ca-btn-small') : '') +
          (edited ? C().button(`${I('refresh', 12)} Revert to default`, 'data-gp-rules-act="revert" data-arm-label="Back to the default rules?"', 'ca-btn-small') : '') +
          '</div>'
      ) +
      (rulesError ? `<div class="ca-editor-error">${esc(rulesError)}</div>` : '') +
      '<div class="ca-ed-layout"><div class="ca-editor-body">' +
      CE().html('garden', rulesText(p), { title: 'What the auto-gardener does', hint: RULES_HINT }) +
      '</div>' +
      CE().libraryHtml('garden', { first: ['Garden', 'Values'] }) +
      '</div></div>'
    );
  }

  /** What the last pass did, under the code (and its lines lit in the gutter). */
  function syncRules() {
    const p = G().active();
    const lp = G().lastPass();
    const on = CA.Macros.isOn(G().GARDENER);
    const live = on && lp && p && lp.profile === p.id && !(draft && draft.profile === p.id && draft.src !== G().rulesOf(p));
    CE().setLive(
      root,
      'garden',
      live
        ? {
            lines: lp.lines,
            html:
              `<div class="ca-code-live-head">${I('play', 11)} last pass · ${CA.UI.Plot.fmt.span(Math.max(0, (Date.now() - lp.t) / 1000))} ago</div>` +
              (lp.error ? `<div class="ca-code-live-at">${esc(lp.error)}</div>` : '') +
              lp.at.map((a) => `<div class="ca-code-live-at">${esc(a)}</div>`).join('') +
              (lp.trace.length ? lp.trace.map((x) => `<div class="ca-code-live-tr">${esc(x.text)}</div>`).join('') : '<div class="ca-code-live-tr">nothing to do</div>'),
          }
        : null
    );
  }

  function rulesAct(act) {
    const p = G().active();
    if (!p) return;
    rulesError = '';
    if (act === 'save') {
      const src = rulesText(p);
      const { errors } = G().compileRules(src);
      if (errors.length) {
        rulesError = `Not saved — line ${errors[0].line}: ${errors[0].message}`;
        return;
      }
      G().setRules(p.id, src.trim() === G().defaultRules().trim() ? null : src);
      draft = null;
      CA.Util.notify('Garden rules saved', `“${esc(p.name)}” — the auto-gardener follows them from its next pass.`, CA.ICON, 3);
    } else if (act === 'discard') draft = null;
    else if (act === 'revert') {
      G().setRules(p.id, null);
      draft = null;
    }
  }

  function lastText() {
    const l = G().last();
    if (!l.at) return 'It harvests and replants in the last seconds before each garden tick, so new plants start growing right away and plants about to die are picked first.';
    const parts = [];
    if (l.planted) parts.push(`planted ${l.planted}`);
    if (l.harvested) parts.push(`pulled out ${l.harvested} off-profile`);
    if (l.saved) parts.push(`harvested ${l.saved} about to die`);
    if (l.unlocked) parts.push(`harvested ${l.unlocked} new seed${l.unlocked === 1 ? '' : 's'}`);
    if (l.soil) parts.push('changed the soil');
    return `Last: ${parts.join(', ')} — ${CA.UI.Plot.fmt.span((Date.now() - l.at) / 1000)} ago.`;
  }

  // ---- profiles ------------------------------------------------------------------------------

  function miniPlot(p) {
    const M = G().minigame();
    let h = '<div class="ca-gmini">';
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const key = p.plot[y][x];
        const me = M && key && M.plants[key];
        h += `<span>${me ? sprite(me, 4) : ''}</span>`;
      }
    }
    return h + '</div>';
  }

  function profilesCard() {
    const profs = G().profiles();
    const act = G().active();
    let h =
      '<div class="ca-card">' +
      C().cardHead('Profiles', 'save') +
      '<div class="ca-gsave">' +
      `<input type="text" maxlength="40" placeholder="Garden ${profs.length + 1}" data-gp-name>` +
      C().button(`${I('plus', 12)} Save current garden`, 'data-gp-save', 'ca-btn-small ca-btn-on') +
      '</div>';
    if (!profs.length) h += '<div class="ca-card-note">A profile remembers the seed on every tile and the soil. Plant your garden the way you want it, then save it here.</div>';
    else {
      h += '<div class="ca-gprofiles">';
      profs.forEach((p) => {
        const on = act && act.id === p.id;
        const n = p.plot.flat().filter(Boolean).length;
        h +=
          `<div class="ca-gprofile${on ? ' on' : ''}">` +
          miniPlot(p) +
          '<div class="ca-gprofile-text">' +
          `<input type="text" maxlength="40" value="${esc(p.name)}" data-gp-rename="${esc(p.id)}">` +
          `<div class="ca-row-desc">${n} plant${n === 1 ? '' : 's'} · ${esc(soilName(p.soil))}${on ? ' · <b>active</b>' : ''}</div>` +
          '<div class="ca-controls">' +
          (on ? '' : C().button('Use', `data-gp-use="${esc(p.id)}"`, 'ca-btn-small')) +
          C().button('Delete', `data-gp-del="${esc(p.id)}" data-arm-label="Delete it?"`, 'ca-btn-small ca-btn-off') +
          '</div></div></div>';
      });
      h += '</div>';
    }
    return h + '</div>';
  }

  // ---- page ------------------------------------------------------------------------------

  function html() {
    if (!G().minigame())
      return (
        '<div class="ca-card ca-card-note-only">' +
        C().cardHead('Garden', 'leaf') +
        '<div class="ca-card-note">The Garden opens once you have a level-1 Farm (spend a sugar lump on it). The auto-gardener and its profiles will be here.</div>' +
        '</div>'
      );
    return `<div class="ca-garden-row">${gardenCard()}${plot.html()}</div>` + effectsPlot.html() + gardenerCard() + rulesCard() + profilesCard();
  }

  function sync() {
    if (!root || !root.isConnected) return;
    const v = G().view();
    if (!v) return;
    const plot = root.querySelector('[data-gp-plot]');
    if (plot) CA.UI.Dom.morph(plot, plotHtml(v));
    const stats = root.querySelector('[data-gp-stats]');
    if (stats) CA.UI.Dom.morph(stats, statsHtml(v));
    const pill = root.querySelector('[data-gp-profile]');
    if (pill) pill.textContent = v.profile ? `profile: ${v.profile.name}` : 'no profile';
    const last = root.querySelector('[data-gp-last]');
    if (last) last.textContent = lastText();
    syncRules();
    CA.UI.MacrosPage.sync(root);
  }

  function onClick(e) {
    const t = e.target.closest('[data-gp-save],[data-gp-use],[data-gp-del],[data-gp-rules-act],[data-gp-rules-go]');
    if (!t) return;
    e.stopPropagation();
    const d = t.dataset;
    if ('gpRulesGo' in d) {
      const card = root.querySelector('[data-gp-rules]');
      if (card) {
        CA.Util.scrollInPanel(card, 'start');
        CA.UI.Dom.replay(card, 'ca-flash');
      }
      return;
    }
    if (d.gpRulesAct) {
      if (d.gpRulesAct === 'revert' && !CA.UI.Dom.armed(t)) return;
      rulesAct(d.gpRulesAct);
    } else if ('gpDel' in d) {
      if (!CA.UI.Dom.armed(t)) return;
      G().removeProfile(d.gpDel);
    } else if ('gpUse' in d) G().use(d.gpUse);
    else if ('gpSave' in d) {
      const name = root.querySelector('[data-gp-name]');
      const p = G().snapshot(name && name.value.trim());
      if (p) CA.Util.notify('Garden profile saved', `“${esc(p.name)}” — ${p.plot.flat().filter(Boolean).length} plants on ${esc(soilName(p.soil))}.`, CA.ICON, 3);
    }
    CA.Util.sound('snd/tick.mp3');
    CA.UI.Menu.render();
  }

  function onChange(e) {
    const el = e.target;
    const d = el.dataset || {};
    if ('gpActive' in d) {
      if (e.type !== 'change') return;
      G().use(el.value);
    }
    else if (d.gpRename) {
      if (e.type !== 'change') return;
      G().rename(d.gpRename, el.value);
      return;
    } else return;
    CA.UI.Menu.render();
  }

  function mount(el) {
    unmount();
    root = el;
    life = CA.UI.Pages.scope(el).on('click', onClick).on('change', onChange);
    life.add(
      CE().bind(root, {
      onChange: (key, src) => {
        const p = G().active();
        if (key !== 'garden' || !p) return;
        const was = !!draft && draft.src !== G().rulesOf(p);
        draft = { profile: p.id, src };
        // the Save button lights up (and the "unsaved" pill shows) on the first change
        if (was !== (src !== G().rulesOf(p))) {
          const card = root.querySelector('[data-gp-rules] .ca-card-head');
          const tmp = document.createElement('div');
          tmp.innerHTML = rulesCard();
          const head = tmp.querySelector('.ca-card-head');
          if (card && head) card.replaceWith(head);
        }
      },
      })
    );
    if (G().minigame()) life.child(plot).child(effectsPlot);
    sync();
    life.every(SYNC_MS, sync);
  }

  function unmount() {
    if (life) life.close();
    life = null;
    root = null;
  }

  // ---- charts: growth and effects ---------------------------------------------------------

  const H = () => CA.GardenHistory;
  const STAGE_COLORS = ['#6b8a52', '#8fc25e', '#b5ec6e', '#eaff8a'];
  const AXES = [
    { v: 'time', label: 'Time' },
    { v: 'ticks', label: 'Garden ticks' },
  ];
  const plantName = (key) => {
    const M = G().minigame();
    return (M && M.plants && M.plants[key] && M.plants[key].name) || key;
  };

  /** Snapshot in force at `x` (along key 't' / 'a'), or null — snapshots are in time order. */
  function stateAt(all, k, x, from) {
    let i = from;
    while (i + 1 < all.length && all[i + 1][k] <= x) i++;
    return i;
  }

  /**
   * The garden over the chart's window as bars, each with the snapshot in force: { x0, x1, c, e }.
   * Time axis: a bar per slot of the window (the garden as it was at the end of it — it only
   * changes at ticks, plantings and harvests). Ticks axis: a bar per garden tick, plus the x axis
   * for it (xAxis — ticks counted back from now).
   */
  function stateBars(v) {
    const all = H().list();
    const k = v.key;
    if (!all.length) return { bars: [] };
    if (v.opt('axis') !== 'ticks') {
      const bars = [];
      let i = -1;
      const start = Math.floor(v.x0 / v.bucket) * v.bucket;
      for (let x = start; x < v.x1; x += v.bucket) {
        const end = Math.min(x + v.bucket, v.x1);
        i = stateAt(all, k, end, i);
        if (i < 0) continue;
        bars.push({ x0: Math.max(x, v.x0), x1: end, c: all[i].c, e: all[i].e || {} });
      }
      return { bars };
    }
    // garden ticks: which ticks fall in the window, and the snapshot in force in each
    const ticks = H().ticks();
    const inWin = ticks.filter((t) => t[k] >= v.x0 && t[k] <= v.x1);
    const firstSample = all.find((s) => s[k] >= v.x0) || all[all.length - 1];
    const kEnd = v.live ? H().tickNow() : inWin.length ? inWin[inWin.length - 1].k : firstSample.k || 0;
    const kStart = Math.min(kEnd, inWin.length ? inWin[0].k - 1 : firstSample.k || 0);
    const bars = [];
    let i = -1;
    for (let n = kStart; n <= kEnd; n++) {
      while (i + 1 < all.length && (all[i + 1].k || 0) <= n) i++;
      if (i < 0) continue;
      bars.push({ x0: n, x1: n + 1, c: all[i].c, e: all[i].e || {}, tick: n });
    }
    const span = kEnd + 1 - kStart;
    const step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find((s) => span / s <= 7) || 10000;
    const labels = [];
    for (let n = kEnd - Math.floor((kEnd - kStart) / step) * step; n <= kEnd; n += step) labels.push({ x: n + 0.5, label: n === kEnd ? 'now' : `−${kEnd - n}` });
    const tickTime = (n) => {
      const t = ticks.find((x) => x.k === n);
      return t ? ` <span>${CA.UI.Plot.fmt.clock(t.t, true)}</span>` : '';
    };
    const xAxis = {
      x0: kStart,
      x1: kEnd + 1,
      labels,
      head: (bar) => (bar ? `${bar.tick === kEnd ? 'This tick' : `${kEnd - bar.tick} tick${kEnd - bar.tick === 1 ? '' : 's'} ago`}${tickTime(bar.tick)}` : 'Garden ticks'),
    };
    // a position on this axis back to the view's time (zooming into a stretch of ticks)
    const tickAt = (n) => {
      const x = ticks.find((tt) => tt.k === n);
      return x ? x[k] : null;
    };
    xAxis.timeAt = (x) => {
      const n = Math.floor(x);
      const a = tickAt(n);
      const b = n + 1 > kEnd ? v.x1 : tickAt(n + 1);
      const from = a == null ? v.x0 : a;
      const to = b == null ? v.x1 : b;
      return from + (to - from) * (x - n);
    };
    // things that happened at a time, placed in the tick they happened in
    xAxis.at = (t) => {
      let n = kStart;
      ticks.forEach((x) => x.t <= t && (n = x.k));
      return n + 0.5;
    };
    return { bars, xAxis };
  }

  /** Seed-unlock markers, on either axis. */
  function unlockMarkers(v, xAxis) {
    return CA.EventLog.list(['garden'])
      .map((ev) => ({ ev, x: xAxis ? xAxis.at(ev.t) : v.active ? ev.a : ev.t }))
      .filter((m) => (xAxis ? m.x >= xAxis.x0 && m.x <= xAxis.x1 : m.x >= v.x0 && m.x <= v.x1))
      .map(({ ev, x }) => ({
        x,
        color: '#ffe36a',
        tip: () => `<div class="ca-tip-head">${esc(ev.title)}<span>${CA.UI.Plot.fmt.clock(ev.t, true)}</span></div>`,
      }));
  }

  const axisChoice = { key: 'axis', label: 'X axis', options: AXES, default: 'time' };

  function createPlots() {
    plot = CA.UI.Plot.create({
      id: 'garden',
      title: 'Growth',
      icon: 'leaf',
      height: 210,
      windows: [3600, 6 * 3600, 86400, 3 * 86400, 0],
      window: 6 * 3600,
      smooth: false,
      stacked: true,
      choices: [
        {
          key: 'by',
          label: 'Show',
          options: [
            { v: 'both', label: 'Seed × stage' },
            { v: 'seed', label: 'Seeds' },
            { v: 'stage', label: 'Stages' },
          ],
          default: 'both',
        },
        axisChoice,
      ],
      fmt: (v) => CA.UI.Plot.fmt.beautify(v, 0),
      tipFmt: (v) => String(Math.round(v * 10) / 10),
      totalLabel: 'Plants',
      build(v) {
        const by = v.opt('by') || 'both';
        const { bars: raw, xAxis } = stateBars(v);
        const totals = {}; // seed → plant-slots shown, to put the biggest at the bottom
        raw.forEach((b) => Object.keys(b.c).forEach((kk) => (totals[kk.split(':')[0]] = (totals[kk.split(':')[0]] || 0) + b.c[kk])));
        const seeds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
        let series;
        let partOf;
        if (by === 'stage') {
          series = [3, 2, 1, 0].map((s) => ({ key: `stage:${s}`, name: H().STAGES[s][0].toUpperCase() + H().STAGES[s].slice(1), color: STAGE_COLORS[s], type: 'bar' }));
          partOf = (kk) => `stage:${kk.split(':')[1]}`;
        } else if (by === 'seed') {
          series = seeds.map((s) => ({ key: s, name: plantName(s), color: H().colorOf(s), type: 'bar' }));
          partOf = (kk) => kk.split(':')[0];
        } else {
          // each seed's stages together, mature at the bottom: bars "ripen" upwards
          series = [].concat(
            ...seeds.map((s) =>
              [3, 2, 1, 0].map((st) => ({
                key: `${s}:${st}`,
                name: `${plantName(s)} (${H().STAGES[st]})`,
                color: H().shade(s, st),
                type: 'bar',
                merge: { id: s, name: plantName(s), label: H().STAGES[st], order: st },
              }))
            )
          );
          partOf = (kk) => kk;
        }
        const bars = raw.map((b) => {
          const parts = {};
          Object.keys(b.c).forEach((kk) => {
            const p = partOf(kk);
            parts[p] = (parts[p] || 0) + b.c[kk];
          });
          return { x0: b.x0, x1: b.x1, parts, tick: b.tick };
        });
        const used = new Set([].concat(...bars.map((b) => Object.keys(b.parts))));
        series = series.filter((s) => used.has(s.key));
        const legend =
          by === 'stage'
            ? series
            : seeds.filter((s) => series.some((x) => x.key.split(':')[0] === s)).map((s) => ({ name: plantName(s), color: H().colorOf(s) }));
        return {
          series,
          bars,
          xAxis,
          legend,
          legendExtra:
            by === 'both'
              ? '<span class="ca-legend-item ca-legend-stages">darker = younger: ' +
                H()
                  .STAGES.map((st, i) => `<i class="ca-sw" style="background:${H().shade('bakerWheat', i)}"></i>${st}`)
                  .join(' ') +
                '</span>'
              : '',
          markers: unlockMarkers(v, xAxis),
          empty: 'Recording your garden — the chart fills in as it grows (a snapshot each time the plot changes).',
        };
      },
      stats() {
        const M = G().minigame();
        if (!M) return '';
        const { tile, beautify } = CA.UI.Plot.fmt;
        const c = H().countsNow(M);
        const n = Object.values(c).reduce((a, b) => a + b, 0);
        const mature = Object.keys(c)
          .filter((kk) => kk.endsWith(':3'))
          .reduce((a, kk) => a + c[kk], 0);
        const unlocked = Object.values(M.plants || {}).filter((p) => p.unlocked).length;
        return (
          tile('Plants now', String(n), `${mature} mature`) +
          tile('Seeds unlocked', `${unlocked} / ${Object.keys(M.plants || {}).length}`) +
          tile('Harvests', beautify(M.harvests || 0, 0), `${beautify(M.harvestsTotal || 0, 0)} in total`)
        );
      },
    });

    const pctFmt = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v) >= 10 ? Math.round(Math.abs(v)) : Math.round(Math.abs(v) * 10) / 10}%`;
    effectsPlot = CA.UI.Plot.create({
      id: 'gardenEffects',
      settingsOf: 'garden', // same window and x axis as the growth chart
      title: 'Effects',
      icon: 'sparkle',
      note: 'What your plants do, as the game’s Garden information adds it up (soil, growth stage and tile boosts included).',
      height: 190,
      windows: [3600, 6 * 3600, 86400, 3 * 86400, 0],
      window: 6 * 3600,
      smooth: false,
      choices: [axisChoice],
      fmt: pctFmt,
      tipFmt: (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.round(Math.abs(v) * 100) / 100}%`,
      build(v) {
        const { bars, xAxis } = stateBars(v);
        const used = H().EFFECTS.filter((ef) => bars.some((b) => b.e[ef.k]));
        const lines = {};
        used.forEach((ef) => {
          // steps: the value holds from one snapshot to the next
          lines[ef.k] = [].concat(...bars.map((b) => [{ x: b.x0, v: (b.e[ef.k] || 0) * 100 }, { x: b.x1, v: (b.e[ef.k] || 0) * 100 }]));
        });
        return {
          series: used.map((ef) => ({ key: ef.k, name: ef.rev ? `${ef.n} (lower is better)` : ef.n, color: ef.color, type: 'line', width: 1.8 })),
          lines,
          xAxis,
          markers: unlockMarkers(v, xAxis),
          zero: true,
          empty: 'No plant effects in this window — plant something, or wait for the garden to be recorded.',
        };
      },
      stats() {
        const M = G().minigame();
        if (!M) return '';
        const { tile } = CA.UI.Plot.fmt;
        const e = H().effectsNow(M);
        const top = H()
          .EFFECTS.filter((ef) => e[ef.k])
          .sort((a, b) => Math.abs(e[b.k]) - Math.abs(e[a.k]))
          .slice(0, 3);
        if (!top.length) return tile('Effects now', 'none', M.freeze ? 'the garden is frozen' : 'nothing planted gives any');
        return top.map((ef) => tile(ef.n, pctFmt(e[ef.k] * 100), 'now')).join('');
      },
    });
  }

  function init() {
    createPlots();
    CA.UI.Pages.register({ id: 'garden', label: 'Garden', icon: 'leaf', order: 30, group: 'minigames', html, mount, unmount, tick: sync });
  }

  return { init, sync };
})();
