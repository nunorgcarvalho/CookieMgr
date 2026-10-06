// **Widgets**: small things on the game's left panel (around the big cookie) that you drag around.
//
//   macro    one per ★ favourite macro: a single icon button — click to switch it on/off or run
//            it; hovering shows its name. Favouriting a macro adds it, un-favouriting (or its ×)
//            removes it.
//   status   "Running now" as a status bar: an icon per running macro, pulsing while its actions
//            are doing something; hover one for the details, click to open the Macros page
//   stats    CpS, actual CpS, run, upgrades, prestige, achievements at a glance (a framed box)
//   events   the latest events — how many and which types are up to you; add as many as you like
//   garden / market / grimoire   one per minigame: its state at a glance, click to open it
//
// Two looks: framed boxes (dragged by their title bar) and bare widgets — buttons and bars with
// no frame, dragged from anywhere (a press that doesn't move is a click). Every widget resizes from
// its bottom-right corner: buttons and the status bar scale (keeping their shape), framed boxes
// take any width and height.
//
// Positions are fractions of the panel, applied with CSS percentages (left: x·100% plus a
// translate of −x·100% of the widget's own size), so a widget follows the panel's layout by
// itself — nothing is measured or re-placed in JavaScript, so nothing jumps when the game (or
// Cookie Monster) resizes the panel while loading. The list is saved with your settings.
// The layer sits above the game's big-cookie click target but below its popups and golden cookies.
//
//   CA.UI.Widgets.defineType({ id, name, icon, desc, bare, width, single, hidden, html(inst) })

CA.UI = CA.UI || {};

CA.UI.Widgets = (() => {
  const TICK_MS = 500;
  const DRAG_PX = 4; // a press that moves less than this is a click, not a drag
  const BUTTON_PX = 44; // macro button size incl. spacing, for laying out new ones
  const HOT_MS = 1500;
  const SCALE_MIN = 0.6;
  const SCALE_MAX = 3;
  const MIN_W = 140;
  const MIN_H = 60;
  const S = () => CA.Settings;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);

  const types = [];
  const typeById = {};
  let widgets = []; // { id, type, x, y, collapsed, macro? }
  let layer = null;
  let press = null; // { w, el, sx, sy, dx, dy, moved }
  let swallowClick = false;
  let anchor = null; // where a v2.1 Shortcuts widget was, for laying out its buttons

  function defineType(t) {
    const d = { width: 220, single: false, bare: false, hidden: false, icon: 'widget', ...t };
    types.push(d);
    typeById[d.id] = d;
    return d;
  }

  // ---- built-in widget types ----------------------------------------------------------------

  function macroHtml(inst) {
    const m = CA.Macros.get(inst.macro);
    if (!m) return '';
    const on = CA.Macros.isOn(m.id);
    const key = CA.Settings.getHotkey(`macro.${m.id}`);
    const state = m.mode === 'once' ? 'click to run' : on ? 'on' : 'off';
    return (
      `<button type="button" class="ca-wb${on ? ' on' : ''}${m.mode === 'once' ? ' once' : ''}" data-w-trigger="${esc(m.id)}" aria-label="${esc(m.name)}">` +
      `${CA.UI.MacrosPage.icon(m, true)}</button>` +
      `<span class="ca-wb-label"><b>${esc(m.name)}</b><em class="${on ? 'on' : ''}">${state}${key ? ` · ${esc(CA.Hotkeys.format(key))}` : ''}</em></span>`
    );
  }

  /** The popup shown while hovering a running macro's icon on the status bar. */
  function statusPop(m) {
    const st = CA.Macros.status(m.id);
    const { beautify, span } = CA.UI.Plot.fmt;
    let h =
      '<span class="ca-wpop">' +
      `<span class="ca-wpop-head">${CA.UI.MacrosPage.icon(m, true)}<b>${esc(m.name)}</b></span>` +
      `<span class="ca-wpop-sub">${esc(CA.Macros.triggerText(m))} · on for ${span((Date.now() - CA.Macros.since(m.id)) / 1000)}</span>`;
    m.steps.forEach((step, i) => {
      const s = (st && st.steps[i]) || {};
      const a = CA.Actions.get(step.action) || {};
      const hot = s.lastAt && Date.now() - s.lastAt < HOT_MS;
      const val = s.error ? esc(s.error) : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + esc(a.unit) : ''} · ${s.lastAt ? `${span((Date.now() - s.lastAt) / 1000)} ago` : 'nothing yet'}`;
      h +=
        `<span class="ca-wpop-row${hot ? ' hot' : ''}${s.error ? ' err' : ''}">${I(a.icon || 'close', 11)}` +
        `<span class="ca-wpop-name">${esc(CA.Actions.describe(step))}</span><span class="ca-wpop-val">${val}</span></span>`;
    });
    return h + '<span class="ca-wpop-foot">click to open the Macros page</span></span>';
  }

  function statusHtml() {
    const ids = CA.Macros.runningIds();
    let h = `<span class="ca-wbar-lead">${I('play', 11)}</span>`;
    if (!ids.length) return `${h}<span class="ca-wbar-idle">idle</span>`;
    ids.forEach((id) => {
      const m = CA.Macros.get(id);
      if (!m) return;
      const st = CA.Macros.status(id);
      const hot = st && st.steps.some((s) => s.lastAt && Date.now() - s.lastAt < HOT_MS);
      const err = st && st.steps.some((s) => s.error);
      h += `<span class="ca-wbar-item${hot ? ' hot' : ''}${err ? ' err' : ''}" data-w-open="clickers" aria-label="${esc(m.name)}">${CA.UI.MacrosPage.icon(m, true)}${statusPop(m)}</span>`;
    });
    return h;
  }

  function statsHtml() {
    const { beautify, span } = CA.UI.Plot.fmt;
    const frames = CA.Recorder.frames();
    const f = frames[frames.length - 1];
    const r = CA.UI.Graphs.recent(60);
    const allTime = (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);
    const max = Math.floor(Game.HowMuchPrestige(allTime));
    const row = (label, value) => `<div class="ca-w-stat"><span>${label}</span><b>${value}</b></div>`;
    const count = (owned, total) => (Number.isFinite(owned) ? `${beautify(owned, 0)}${total ? ` <em>/ ${beautify(total, 0)}</em>` : ''}` : '—');
    return (
      row('CpS + clicking', f ? `${beautify((f.cps || 0) + (f.click || 0))}/s` : '—') +
      row('Actual CpS', r ? `${beautify(r.actual)}/s <em>last min</em>` : '—') +
      row('Run started', Game.startDate ? `${span((Date.now() - Game.startDate) / 1000)} <em>ago</em>` : '—') +
      row('Upgrades', count(Game.UpgradesOwned, upgradesTotal())) +
      row('Prestige level', `${beautify(Game.prestige || 0, 0)} <em>(max ${beautify(max, 0)})</em>`) +
      row('Achievements', count(Game.AchievementsOwned, achievementsTotal())) +
      row('All time baked', beautify(allTime))
    );
  }

  // totals counted with the game's own rules (the same ones behind UpgradesOwned / AchievementsOwned);
  // UpgradesById / AchievementsById are plain objects keyed by id, not arrays
  let upTotal = 0;
  let achTotal = 0;
  function upgradesTotal() {
    if (!upTotal && Game.UpgradesById && Game.CountsAsUpgradeOwned) upTotal = Object.values(Game.UpgradesById).filter((u) => u && Game.CountsAsUpgradeOwned(u.pool)).length;
    return upTotal;
  }
  function achievementsTotal() {
    if (!achTotal && Game.AchievementsById && Game.CountsAsAchievementOwned) achTotal = Object.values(Game.AchievementsById).filter((a) => a && Game.CountsAsAchievementOwned(a.pool)).length;
    return achTotal;
  }

  // ---- latest events (configurable) ----------------------------------------------------------

  const DEFAULT_EVENTS = 8;
  const eventCount = (inst) => Math.max(1, Math.min(200, Math.round(inst.count || DEFAULT_EVENTS)));

  function eventsHtml(inst) {
    if (inst.config) return eventsConfigHtml(inst);
    const types = Array.isArray(inst.types) && inst.types.length ? inst.types : null;
    const list = CA.EventLog.list(types).slice(-eventCount(inst)).reverse();
    if (!list.length) return `<div class="ca-w-empty">${types ? 'No events of the chosen types yet.' : 'Nothing has happened yet.'}</div>`;
    return `<div class="ca-w-events">${list.map((e) => CA.UI.EventsPage.rowHtml(e)).join('')}</div>`;
  }

  function eventsConfigHtml(inst) {
    const chosen = new Set(inst.types || []);
    const t = CA.EventLog.types();
    return (
      '<div class="ca-w-config">' +
      `<label class="ca-w-field"><span>Keep the last</span><input type="number" min="1" max="200" value="${eventCount(inst)}" data-w-count><span>events</span></label>` +
      '<div class="ca-w-field-label">Show (none ticked = all)</div>' +
      '<div class="ca-w-chips">' +
      Object.keys(t)
        .map(
          (k) =>
            `<button type="button" class="ca-w-chip${chosen.has(k) ? ' on' : ''}" data-w-type="${esc(k)}" style="--c:${t[k].color}">${I(t[k].icon, 11)}${esc(t[k].name)}</button>`
        )
        .join('') +
      '</div>' +
      '<button type="button" class="ca-w-done" data-w-config-done>Done</button>' +
      '</div>'
    );
  }

  // ---- minigame widgets ---------------------------------------------------------------------
  // Garden (Farm), Stock market (Bank) and Grimoire (Wizard tower): each shows its minigame's
  // state; a click opens that minigame in the game and scrolls to it.

  function openMinigame(building) {
    const b = Game.Objects && Game.Objects[building];
    if (!b || !b.minigame || typeof b.switchMinigame !== 'function') {
      CA.Util.notify(building, 'This minigame isn’t unlocked yet (the building needs level 1 — a sugar lump).', CA.ICON, 3);
      return;
    }
    if (!b.onMinigame) b.switchMinigame(1);
    const row = document.getElementById(`row${b.id}`);
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  const STAGES = ['bud', 'sprout', 'bloom', 'mature'];

  /** Plants per growth stage — the game's own thresholds: ⅓, ⅔ and all of a plant's maturity. */
  function gardenInfo() {
    const farm = Game.Objects && Game.Objects.Farm;
    const M = farm && farm.minigame;
    if (!M || !M.plot || !M.plantsById) return null;
    const counts = [0, 0, 0, 0];
    M.plot.forEach((rowTiles) =>
      (rowTiles || []).forEach((tile) => {
        if (!tile || !tile[0]) return;
        const me = M.plantsById[tile[0] - 1];
        if (!me) return;
        const age = tile[1];
        counts[age >= me.mature ? 3 : age >= me.mature * 0.666 ? 2 : age >= me.mature * 0.333 ? 1 : 0]++;
      })
    );
    const next = M.nextStep ? Math.max(0, (M.nextStep - Date.now()) / 1000) : null;
    return { counts, next, step: M.stepT || 0 };
  }

  const bar = (frac) => `<div class="ca-mg-bar"><i style="width:${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%"></i></div>`;
  const locked = (what) => `<div class="ca-w-empty">${what} isn’t unlocked yet.</div>`;

  function gardenHtml() {
    const { span } = CA.UI.Plot.fmt;
    const g = gardenInfo();
    if (!g) return locked('The Garden');
    return (
      '<div class="ca-mg" data-w-open-mg="Farm">' +
      `<div class="ca-mg-stages">${STAGES.map((st, i) => `<span class="ca-mg-stage s${i}"><b>${g.counts[i]}</b><em>${st}</em></span>`).join('')}</div>` +
      `<div class="ca-mg-line"><span>Next tick</span><b>${g.next == null ? '—' : span(g.next)}</b></div>` +
      (g.next != null && g.step ? bar(1 - g.next / g.step) : '') +
      '</div>'
    );
  }

  function marketHtml() {
    const { span, beautify } = CA.UI.Plot.fmt;
    const m = CA.Stocks.minigame();
    if (!m) return locked('The Stock market');
    const owned = m.goodsById.filter((g) => g.stock > 0).length;
    const last = CA.Stocks.lastTick();
    const next = CA.Stocks.nextTickIn();
    const signed = (v, unit) => `${v < 0 ? '−' : '+'}${unit}${beautify(Math.abs(v), unit ? 2 : 1)}`;
    return (
      '<div class="ca-mg" data-w-open-mg="Bank">' +
      `<div class="ca-mg-line big"><span>Holding</span><b>${owned} <em>of ${m.goodsById.length} stocks</em></b></div>` +
      `<div class="ca-mg-line"><span>Last tick</span>${
        last && last.held
          ? `<b class="${last.dollars < 0 ? 'neg' : 'pos'}">${signed(last.dollars, '$')} <em>${signed(last.cookies, '')} cookies</em></b>`
          : '<b><em>no stocks held into it</em></b>'
      }</div>` +
      `<div class="ca-mg-line"><span>Next tick</span><b>${next == null ? '—' : span(next)}</b></div>` +
      (next != null && m.secondsPerTick ? bar(1 - next / m.secondsPerTick) : '') +
      '</div>'
    );
  }

  function grimoireHtml() {
    const { span } = CA.UI.Plot.fmt;
    const mg = CA.Grimoire.magicNow();
    if (!mg) return locked('The Grimoire');
    return (
      '<div class="ca-mg" data-w-open-mg="Wizard tower">' +
      `<div class="ca-mg-magic"><i style="width:${Math.round((mg.magic / mg.max) * 100)}%"></i><span>${Math.floor(mg.magic)} / ${Math.floor(mg.max)} magic</span></div>` +
      `<div class="ca-mg-line"><span>Full in</span><b>${mg.fullIn === 0 ? 'full' : Number.isFinite(mg.fullIn) ? span(mg.fullIn) : '—'}</b></div>` +
      '</div>'
    );
  }

  function registerBuiltins() {
    defineType({ id: 'macro', name: 'Macro button', icon: 'star', bare: true, hidden: true, resize: 'scale', html: macroHtml, update: macroUpdate });
    defineType({ id: 'status', name: 'Running now', icon: 'play', desc: 'A status bar: an icon for each running macro, pulsing while it works. Hover an icon for what its actions have done.', bare: true, single: true, resize: 'scale', html: statusHtml, update: statusUpdate });
    defineType({ id: 'stats', name: 'Quick stats', icon: 'graphs', desc: 'CpS + clicking, actual CpS, when this run started, upgrades, prestige level (and the most you could reach now), achievements and all-time cookies baked.', width: 190, single: true, resize: 'free', html: statsHtml });
    defineType({ id: 'events', name: 'Latest events', icon: 'events', desc: 'The newest entries in the event log — ⚙ to choose how many and which types. Add as many as you like (one for golden cookies, one for trades…).', width: 260, resize: 'free', config: true, html: eventsHtml });
    defineType({ id: 'garden', name: 'Garden', icon: 'leaf', theme: 'garden', desc: 'Plants at each stage of growth (bud, sprout, bloom, mature) and a countdown to the next garden tick. Click it to open the Garden.', width: 210, single: true, resize: 'free', html: gardenHtml });
    defineType({ id: 'market', name: 'Stock market', icon: 'stocks', theme: 'market', desc: 'How many different stocks you hold, what the last market tick did to them, and when the next one comes. Click it to open the Stock market.', width: 220, single: true, resize: 'free', html: marketHtml });
    defineType({ id: 'grimoire', name: 'Grimoire', icon: 'wizard', theme: 'grimoire', desc: 'Your magic meter and how long until it’s full. Click it to open the Grimoire.', width: 200, single: true, resize: 'free', html: grimoireHtml });
  }

  // ---- instances ------------------------------------------------------------------------------

  const newId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

  function add(type, pos, extra) {
    const t = typeById[type];
    if (!t) return null;
    if (t.single) {
      const existing = widgets.find((w) => w.type === type);
      if (existing) return existing;
    }
    const n = widgets.filter((w) => !typeById[w.type].bare).length;
    const w = { id: newId(), type, x: pos ? pos.x : 0.04, y: pos ? pos.y : Math.min(0.85, 0.52 + n * 0.06), collapsed: false, ...(extra || {}) };
    widgets.push(w);
    changed();
    return w;
  }

  /** Where columns of buttons stop going up: just below the CookieMgr sidebar on the right edge
   *  of the panel (or a third of the way down if it can't be measured). */
  function columnTop(host, H) {
    const tab = document.getElementById('CookieMgrTab');
    if (tab && tab.getBoundingClientRect && host.getBoundingClientRect) {
      const r = tab.getBoundingClientRect();
      if (r.height) return Math.max(0, r.bottom - host.getBoundingClientRect().top + 8);
    }
    return H * 0.35;
  }

  /** The next free spot for a macro button: from the bottom-right corner upwards (clear of the
   *  bottom-left, where the dragon and Santa live), then the next column to the left, again from
   *  the bottom. A v2.1 Shortcuts widget's buttons start where it was instead. */
  function nextButtonPos() {
    const host = layer && layer.parentNode;
    const W = (host && host.clientWidth) || 400;
    const H = (host && host.clientHeight) || 800;
    const fx = (px) => (W > BUTTON_PX ? px / (W - BUTTON_PX) : 0);
    const fy = (py) => (H > BUTTON_PX ? py / (H - BUTTON_PX) : 0);
    const taken = widgets.filter((w) => w.type === 'macro').map((w) => ({ x: w.x * (W - BUTTON_PX), y: w.y * (H - BUTTON_PX) }));
    const free = (x, y) => !taken.some((t) => Math.abs(t.x - x) < BUTTON_PX / 2 && Math.abs(t.y - y) < BUTTON_PX / 2);
    if (anchor) return { x: Math.min(1, fx(anchor.x * (W - BUTTON_PX) + taken.length * BUTTON_PX)), y: anchor.y };
    const bottom = H - BUTTON_PX - 12;
    const rows = Math.max(1, Math.floor((bottom - columnTop(host, H)) / BUTTON_PX) + 1);
    const cols = Math.max(1, Math.floor((W - 8) / BUTTON_PX));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = W - BUTTON_PX - 8 - c * BUTTON_PX;
        const y = bottom - r * BUTTON_PX;
        if (free(x, y)) return { x: fx(x), y: fy(y) };
      }
    }
    return { x: fx(W - BUTTON_PX - 8), y: fy(bottom) };
  }

  /** Keeps macro buttons in step with ★ favourites: one button per favourite, none for the rest. */
  function reconcile() {
    let dirty = false;
    widgets = widgets.filter((w) => {
      if (w.type !== 'macro') return true;
      const keep = CA.Macros.get(w.macro) && CA.Macros.isFav(w.macro);
      if (!keep) dirty = true;
      return keep;
    });
    CA.Macros.list().forEach((m) => {
      if (!CA.Macros.isFav(m.id) || widgets.some((w) => w.type === 'macro' && w.macro === m.id)) return;
      widgets.push({ id: newId(), type: 'macro', macro: m.id, ...nextButtonPos(), collapsed: false });
      dirty = true;
    });
    anchor = null;
    if (dirty) changed();
  }

  function remove(id) {
    const w = widgets.find((x) => x.id === id);
    if (!w) return;
    if (w.type === 'macro') {
      CA.Macros.setFav(w.macro, false); // → reconcile() takes the button away
      return;
    }
    widgets.splice(widgets.indexOf(w), 1);
    changed();
  }

  function changed() {
    render();
    CA.Events.emit('widgets');
  }

  const list = () => widgets.slice();
  const has = (type) => widgets.some((w) => w.type === type);

  // ---- rendering ------------------------------------------------------------------------------

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    const host = document.getElementById('sectionLeft');
    if (!host) return null;
    layer = document.createElement('div');
    layer.id = 'CookieMgrWidgets';
    layer.addEventListener('mousedown', onMouseDown);
    layer.addEventListener('click', onClick);
    layer.addEventListener('input', onInput);
    host.appendChild(layer);
    return layer;
  }

  const RESIZE = '<span class="ca-w-resize" data-w-resize aria-label="Resize"></span>';

  function frameHtml(w) {
    const t = typeById[w.type];
    if (t.bare) {
      return (
        `<div class="ca-w ca-w-bare ca-w-${w.type}" data-widget="${w.id}" data-w-drag>` +
        `<div class="ca-w-body" data-w-body>${safeHtml(t, w)}</div>` +
        `<button type="button" class="ca-w-x" data-w-remove aria-label="${w.type === 'macro' ? 'Remove (un-favourites the macro)' : 'Remove widget'}">${I('close', 8)}</button>` +
        RESIZE +
        '</div>'
      );
    }
    return (
      `<div class="ca-w${w.collapsed ? ' collapsed' : ''}${w.h ? ' sized' : ''}${t.theme ? ` ca-w-theme-${t.theme}` : ''}" data-widget="${w.id}" style="width:${w.w || t.width}px${w.h && !w.collapsed ? `;height:${w.h}px` : ''}">` +
      '<div class="ca-w-head" data-w-drag>' +
      `${I(t.icon, 12)}<span class="ca-w-title">${esc(t.name)}</span>` +
      (t.config ? `<button type="button" class="ca-w-btn" data-w-config aria-label="Settings">${I('settings', 10)}</button>` : '') +
      `<button type="button" class="ca-w-btn" data-w-collapse aria-label="${w.collapsed ? 'Expand' : 'Collapse'}">${w.collapsed ? '▸' : '▾'}</button>` +
      `<button type="button" class="ca-w-btn" data-w-remove aria-label="Remove widget">${I('close', 10)}</button>` +
      '</div>' +
      `<div class="ca-w-body" data-w-body>${w.collapsed ? '' : safeHtml(t, w)}</div>` +
      (w.collapsed ? '' : RESIZE) +
      '</div>'
    );
  }

  function safeHtml(t, w) {
    try {
      return t.html(w);
    } catch (e) {
      return `<div class="ca-w-empty">Couldn’t draw this widget (${esc(e.message)}).</div>`;
    }
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const scaleOf = (w) => (typeById[w.type] && typeById[w.type].resize === 'scale' ? w.scale || 1 : 1);

  /** Positions a widget purely with CSS (see the top of this file): it follows the panel by itself. */
  function place(el, w) {
    const sc = scaleOf(w);
    const x = clamp01(w.x);
    const y = clamp01(w.y);
    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    el.style.transform = `translate(${-x * sc * 100}%, ${-y * sc * 100}%)${sc !== 1 ? ` scale(${sc})` : ''}`;
    el.classList.toggle('pop-below', y < 0.25);
    el.classList.toggle('pop-left', x > 0.5);
  }

  /** Where a widget actually is right now, in px (for dragging and resizing). */
  function geom(w, el) {
    const host = layer.parentNode;
    const W = host.clientWidth || 0;
    const H = host.clientHeight || 0;
    const sc = scaleOf(w);
    const vw = (el.offsetWidth || 0) * sc;
    const vh = (el.offsetHeight || 0) * sc;
    return { W, H, sc, vw, vh, left: clamp01(w.x) * Math.max(0, W - vw), top: clamp01(w.y) * Math.max(0, H - vh) };
  }

  /** Sets the fractions so the widget's top-left lands at (left, top) px. */
  function moveTo(w, el, left, top) {
    const g = geom(w, el);
    w.x = g.W > g.vw ? clamp01(left / (g.W - g.vw)) : 0;
    w.y = g.H > g.vh ? clamp01(top / (g.H - g.vh)) : 0;
    place(el, w);
  }

  function render() {
    if (!ensureLayer()) return;
    layer.classList.toggle('ca-hidden', !S().get('widgetsShown'));
    layer.classList.toggle('locked', !!S().get('widgetsLocked'));
    layer.innerHTML = widgets.filter((w) => typeById[w.type]).map(frameHtml).join('');
    widgets.forEach((w) => {
      const el = layer.querySelector(`[data-widget="${w.id}"]`);
      if (el) place(el, w);
    });
  }

  /** Refreshes each widget's content in place (positions untouched). */
  function tick() {
    if (!layer || !layer.isConnected) return render();
    if (!S().get('widgetsShown') || (press && press.moved)) return;
    widgets.forEach((w) => {
      if (w.collapsed || w.config) return;
      const body = layer.querySelector(`[data-widget="${w.id}"] [data-w-body]`);
      const t = typeById[w.type];
      if (!body || !t) return;
      // types with update() patch themselves in place, so whatever is hovered (and its popup)
      // isn't replaced under the mouse
      if (t.update && body.firstChild && t.update(body, w)) return;
      const html = safeHtml(t, w);
      if (body.innerHTML !== html) body.innerHTML = html;
    });
  }

  /** Status bar in place: rebuilt only when which macros run (or their pulse/error) changes. */
  function statusUpdate(body) {
    const ids = CA.Macros.runningIds();
    const items = body.querySelectorAll('.ca-wbar-item');
    if (items.length !== ids.length || !ids.length) return false;
    for (let i = 0; i < ids.length; i++) {
      const m = CA.Macros.get(ids[i]);
      const el = items[i];
      if (!m || el.getAttribute('aria-label') !== m.name) return false;
      const st = CA.Macros.status(m.id);
      el.classList.toggle('hot', !!(st && st.steps.some((s) => s.lastAt && Date.now() - s.lastAt < HOT_MS)));
      el.classList.toggle('err', !!(st && st.steps.some((s) => s.error)));
      const pop = el.querySelector('.ca-wpop');
      const fresh = statusPop(m);
      const inner = fresh.slice(fresh.indexOf('>') + 1, fresh.lastIndexOf('</span>'));
      if (pop && pop.innerHTML !== inner) pop.innerHTML = inner;
    }
    return true;
  }

  /** Macro button in place: just its on/off look and its label. */
  function macroUpdate(body, inst) {
    const m = CA.Macros.get(inst.macro);
    const btn = body.querySelector('.ca-wb');
    const em = body.querySelector('.ca-wb-label em');
    if (!m || !btn || !em) return false;
    const on = CA.Macros.isOn(m.id);
    btn.classList.toggle('on', on);
    const key = CA.Settings.getHotkey(`macro.${m.id}`);
    const text = `${m.mode === 'once' ? 'click to run' : on ? 'on' : 'off'}${key ? ` · ${CA.Hotkeys.format(key)}` : ''}`;
    if (em.textContent !== text) em.textContent = text;
    em.classList.toggle('on', on);
    return true;
  }

  // ---- interaction ----------------------------------------------------------------------------

  function onMouseDown(e) {
    // keep presses on widgets from reaching the big cookie / the game's panel handlers
    e.stopPropagation();
    if (S().get('widgetsLocked') || e.button !== 0) return;
    const grip = e.target.closest('[data-w-resize]');
    const handle = grip || e.target.closest('[data-w-drag]');
    if (!handle || e.target.closest('[data-w-remove],[data-w-collapse]')) return;
    const el = handle.closest('[data-widget]');
    const w = widgets.find((x) => x.id === el.dataset.widget);
    if (!w) return;
    // framed widgets: buttons in the title bar aren't drag handles; bare ones drag from anywhere
    if (!grip && !typeById[w.type].bare && e.target.closest('button')) return;
    e.preventDefault();
    const g = geom(w, el);
    press = {
      mode: grip ? 'resize' : 'move',
      w,
      el,
      sx: e.clientX,
      sy: e.clientY,
      left: g.left,
      top: g.top,
      sc: g.sc,
      baseW: el.offsetWidth || 1,
      baseH: el.offsetHeight || 1,
      moved: false,
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!press) return;
    const dx = e.clientX - press.sx;
    const dy = e.clientY - press.sy;
    if (!press.moved) {
      if (Math.abs(dx) < DRAG_PX && Math.abs(dy) < DRAG_PX) return;
      press.moved = true;
      press.el.classList.add(press.mode === 'resize' ? 'resizing' : 'dragging');
    }
    const { w, el } = press;
    if (press.mode === 'move') {
      moveTo(w, el, press.left + dx, press.top + dy);
      return;
    }
    // resize from the bottom-right corner, keeping the top-left where it is
    if (typeById[w.type].resize === 'scale') {
      const grow = Math.max(dx / press.baseW, dy / press.baseH); // keeps the shape
      w.scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, press.sc + grow));
    } else {
      const g = geom(w, el);
      w.w = Math.round(Math.max(MIN_W, Math.min(g.W - press.left, press.baseW + dx)));
      w.h = Math.round(Math.max(MIN_H, Math.min(g.H - press.top, press.baseH + dy)));
      el.style.width = `${w.w}px`;
      el.style.height = `${w.h}px`;
      el.classList.add('sized');
    }
    moveTo(w, el, press.left, press.top);
  }

  function onMouseUp() {
    if (!press) return;
    const moved = press.moved;
    press.el.classList.remove('dragging', 'resizing');
    press = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (moved) {
      swallowClick = true; // the click that follows a drag isn't a click
      setTimeout(() => (swallowClick = false), 0);
      CA.Events.emit('widgets');
    }
  }

  function onClick(e) {
    e.stopPropagation();
    if (swallowClick) {
      swallowClick = false;
      return;
    }
    const el = e.target.closest('[data-widget]');
    const w = el && widgets.find((x) => x.id === el.dataset.widget);
    if (!w) return;
    if (e.target.closest('[data-w-remove]')) {
      CA.Util.sound('snd/tick.mp3');
      remove(w.id);
      return;
    }
    if (e.target.closest('[data-w-collapse]')) {
      CA.Util.sound('snd/tick.mp3');
      w.collapsed = !w.collapsed;
      changed();
      return;
    }
    const trig = e.target.closest('[data-w-trigger]');
    if (trig) {
      const m = CA.Macros.get(trig.dataset.wTrigger);
      if (!m) return;
      if (m.mode !== 'once') CA.Util.sound(CA.Macros.isOn(m.id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3'); // once macros: run() picks the sound
      if (m.mode === 'once') CA.UI.MacrosPage.run(m.id, trig);
      else CA.Macros.trigger(m.id);
      tick();
      return;
    }
    if (e.target.closest('[data-w-config]')) {
      CA.Util.sound('snd/tick.mp3');
      w.config = !w.config;
      changed();
      return;
    }
    if (e.target.closest('[data-w-config-done]')) {
      CA.Util.sound('snd/tick.mp3');
      w.config = false;
      changed();
      return;
    }
    const typeChip = e.target.closest('[data-w-type]');
    if (typeChip) {
      CA.Util.sound('snd/tick.mp3');
      const set = new Set(w.types || []);
      const k = typeChip.dataset.wType;
      if (set.has(k)) set.delete(k);
      else set.add(k);
      w.types = [...set];
      typeChip.classList.toggle('on', set.has(k));
      CA.Events.emit('widgets');
      return;
    }
    const mg = e.target.closest('[data-w-open-mg]');
    if (mg) {
      CA.Util.sound('snd/tick.mp3');
      openMinigame(mg.dataset.wOpenMg);
      return;
    }
    const open = e.target.closest('[data-w-open]');
    if (open) {
      CA.Util.sound('snd/tick.mp3');
      CA.UI.Menu.openPage(open.dataset.wOpen);
      return;
    }
    const ca = e.target.closest('[data-ca]');
    if (ca && CA.UI.MacrosPage.handle(ca.dataset.ca, ca)) tick();
  }

  function onInput(e) {
    const el = e.target;
    if (!el.matches || !el.matches('[data-w-count]')) return;
    const box = el.closest('[data-widget]');
    const w = box && widgets.find((x) => x.id === box.dataset.widget);
    const n = Math.round(Number(el.value));
    if (!w || !Number.isFinite(n) || n < 1) return;
    w.count = Math.min(200, n);
    CA.Events.emit('widgets');
  }

  // ---- save / load ------------------------------------------------------------------------

  const round = (v) => Math.round(v * 1000) / 1000;

  function serialize() {
    return widgets.map(({ id, type, x, y, collapsed, macro, scale, w, h, count, types: kinds }) => ({
      id,
      type,
      x: round(x),
      y: round(y),
      collapsed,
      ...(macro ? { macro } : {}),
      ...(scale && scale !== 1 ? { scale: round(scale) } : {}),
      ...(w ? { w } : {}),
      ...(h ? { h } : {}),
      ...(count ? { count } : {}),
      ...(kinds && kinds.length ? { types: kinds.slice() } : {}),
    }));
  }

  function load(data) {
    if (!Array.isArray(data)) return;
    const ok = (w) => w && Number.isFinite(w.x) && Number.isFinite(w.y);
    // v2.1 had one Shortcuts widget for all favourites; its buttons now start where it was
    const old = data.find((w) => ok(w) && w.type === 'shortcuts');
    anchor = old ? { x: old.x, y: old.y } : null;
    widgets = data
      .filter((w) => ok(w) && typeById[w.type])
      .map((w) => ({
        id: String(w.id || newId()),
        type: w.type,
        x: w.x,
        y: w.y,
        collapsed: !!w.collapsed,
        ...(w.macro ? { macro: String(w.macro) } : {}),
        ...(Number.isFinite(w.scale) ? { scale: Math.max(SCALE_MIN, Math.min(SCALE_MAX, w.scale)) } : {}),
        ...(Number.isFinite(w.w) ? { w: Math.max(MIN_W, w.w) } : {}),
        ...(Number.isFinite(w.h) ? { h: Math.max(MIN_H, w.h) } : {}),
        ...(Number.isFinite(w.count) ? { count: w.count } : {}),
        ...(Array.isArray(w.types) ? { types: w.types.map(String) } : {}),
      }));
    render();
    reconcile();
  }

  // ---- the Widgets page ------------------------------------------------------------------

  function pageHtml() {
    const C = CA.UI.C;
    const favs = CA.Macros.list().filter((m) => CA.Macros.isFav(m.id));
    let h =
      '<div class="ca-card">' +
      C.cardHead('Add a widget', 'plus') +
      '<div class="ca-card-note">Widgets sit on the left panel, around the big cookie. Drag them anywhere — framed ones by their title bar, buttons and bars from anywhere. Hover for ×.</div>' +
      '<div class="ca-list">' +
      '<div class="ca-row">' +
      `<span class="ca-row-ico">${I('star', 16)}</span>` +
      `<div class="ca-row-text"><div class="ca-row-name">Macro buttons${favs.length ? ` <span class="ca-badge">${favs.length} placed</span>` : ''}</div>` +
      '<div class="ca-row-desc">★ a macro (or a spell on the Wizard tower page) and it gets its own button here: click to switch it on/off or run it, hover for its name. Un-star it to take it away.</div></div>' +
      `<div class="ca-controls">${C.button(`${I('open', 12)} Macros`, 'data-ca="open-macros"', 'ca-btn-small')}</div>` +
      '</div>';
    types
      .filter((t) => !t.hidden)
      .forEach((t) => {
        const placed = widgets.filter((w) => w.type === t.id).length;
        h +=
          '<div class="ca-row">' +
          `<span class="ca-row-ico">${I(t.icon, 16)}</span>` +
          `<div class="ca-row-text"><div class="ca-row-name">${esc(t.name)}${placed ? ` <span class="ca-badge">${placed} placed</span>` : ''}</div><div class="ca-row-desc">${esc(t.desc)}</div></div>` +
          '<div class="ca-controls">' +
          (t.single && placed
            ? C.button('Remove', `data-w-page-remove="${t.id}"`, 'ca-btn-small ca-btn-off')
            : C.button(`${I('plus', 12)} Add`, `data-w-page-add="${t.id}"`, 'ca-btn-small ca-btn-on')) +
          '</div></div>';
      });
    h += '</div></div>';
    h +=
      `<div class="ca-card">${C.cardHead('Options', 'settings')}<div class="ca-list">${S().optionsIn('widgets').map(CA.UI.Menu.optionRow).join('')}` +
      '<div class="ca-row ca-row-option">' +
      `<span class="ca-row-ico">${I('trash', 16)}</span>` +
      '<div class="ca-row-text"><div class="ca-row-name">Remove all widgets</div><div class="ca-row-desc">Clears the left panel (and un-stars your macros).</div></div>' +
      C.button('Remove all', 'data-w-page-clear data-arm-label="Remove them all?"', 'ca-btn-small ca-btn-off') +
      '</div></div></div>';
    return h;
  }

  let pageRoot = null;
  function onPageClick(e) {
    const add_ = e.target.closest('[data-w-page-add]');
    const rem = e.target.closest('[data-w-page-remove]');
    const clr = e.target.closest('[data-w-page-clear]');
    if (!add_ && !rem && !clr) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    if (add_) {
      add(add_.dataset.wPageAdd);
      if (!S().get('widgetsShown')) S().set('widgetsShown', true);
    } else if (rem) widgets.filter((w) => w.type === rem.dataset.wPageRemove).forEach((w) => remove(w.id));
    else if (clr) {
      if (!CA.UI.Menu.armed(clr)) return;
      widgets = widgets.filter((w) => w.type === 'macro');
      widgets.forEach((w) => CA.Macros.setFav(w.macro, false));
      changed();
    }
    CA.UI.Menu.render();
  }

  function init() {
    registerBuiltins();
    S().defineOption({ key: 'widgetsShown', group: 'widgets', icon: 'widget', name: 'Show widgets', desc: 'Show your widgets on the left panel (they stay saved while hidden).', default: true });
    S().defineOption({ key: 'widgetsLocked', group: 'widgets', icon: 'grip', name: 'Lock widgets', desc: 'Stop widgets from being dragged around by accident (buttons still work).', default: false });
    CA.UI.Pages.register({
      id: 'widgets',
      label: 'Widgets',
      icon: 'widget',
      order: 80,
      html: pageHtml,
      mount: (root) => {
        pageRoot = root;
        root.addEventListener('click', onPageClick);
      },
      unmount: () => {
        if (pageRoot) pageRoot.removeEventListener('click', onPageClick);
        pageRoot = null;
      },
    });
    CA.Events.on('settings', (k) => {
      if (k === 'widgetsShown' || k === 'widgetsLocked' || k === null) render();
    });
    CA.Events.on('macros', () => {
      reconcile();
      tick();
    });
    setInterval(tick, TICK_MS);
    render();
  }

  return { init, defineType, types: () => types.slice(), add, remove, list, has, serialize, load, render, tick, reconcile };
})();
