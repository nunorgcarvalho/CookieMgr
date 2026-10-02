// **Widgets**: small things on the game's left panel (around the big cookie) that you drag around.
//
//   macro    one per ★ favourite macro: a single icon button — click to switch it on/off or run
//            it; hovering shows its name. Favouriting a macro adds it, un-favouriting (or its ×)
//            removes it.
//   status   "Running now" as a status bar: an icon per running macro, pulsing while its actions
//            are doing something; hover one for the details, click to open the Macros page
//   stats    CpS, actual CpS, bank and next prestige level at a glance (a framed box)
//   events   the latest events from the event log (a framed box)
//
// Two looks: framed boxes (dragged by their title bar) and bare widgets — buttons and bars with
// no frame, dragged from anywhere (a press that doesn't move is a click). Positions are fractions
// of the panel, so widgets stay put when the window resizes; the list is saved with your settings.
// The layer sits above the game's big-cookie click target but below its popups and golden cookies.
//
//   CA.UI.Widgets.defineType({ id, name, icon, desc, bare, width, single, hidden, html(inst) })

CA.UI = CA.UI || {};

CA.UI.Widgets = (() => {
  const TICK_MS = 500;
  const DRAG_PX = 4; // a press that moves less than this is a click, not a drag
  const BUTTON_PX = 44; // macro button size incl. spacing, for laying out new ones
  const HOT_MS = 1500;
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

  function macroTitle(m) {
    const on = CA.Macros.isOn(m.id);
    const key = CA.Settings.getHotkey(`macro.${m.id}`);
    const what = m.mode === 'once' ? 'click to run' : on ? 'on — click to switch off' : 'off — click to switch on';
    return `${m.name} (${what})${key ? ` · ${CA.Hotkeys.format(key)}` : ''}`;
  }

  function macroHtml(inst) {
    const m = CA.Macros.get(inst.macro);
    if (!m) return '';
    const on = CA.Macros.isOn(m.id);
    return (
      `<button type="button" class="ca-wb${on ? ' on' : ''}${m.mode === 'once' ? ' once' : ''}" data-w-trigger="${esc(m.id)}" title="${esc(macroTitle(m))}">` +
      `${CA.UI.MacrosPage.icon(m, true)}</button>` +
      `<span class="ca-wb-label">${esc(m.name)}</span>`
    );
  }

  function statusTitle(m) {
    const st = CA.Macros.status(m.id);
    const { beautify, span } = CA.UI.Plot.fmt;
    const lines = [`${m.name} — ${CA.Macros.triggerText(m)} · on for ${span((Date.now() - CA.Macros.since(m.id)) / 1000)}`];
    m.steps.forEach((step, i) => {
      const s = (st && st.steps[i]) || {};
      const a = CA.Actions.get(step.action) || {};
      const last = s.lastAt ? `${span((Date.now() - s.lastAt) / 1000)} ago` : 'nothing yet';
      lines.push(`• ${CA.Actions.describe(step)}: ${s.error ? s.error : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + a.unit : ''}, ${last}`}`);
    });
    return lines.join('\n');
  }

  function statusHtml() {
    const ids = CA.Macros.runningIds();
    let h = `<span class="ca-wbar-lead" title="Running now">${I('play', 11)}</span>`;
    if (!ids.length) return `${h}<span class="ca-wbar-idle" title="No macros running">idle</span>`;
    ids.forEach((id) => {
      const m = CA.Macros.get(id);
      if (!m) return;
      const st = CA.Macros.status(id);
      const hot = st && st.steps.some((s) => s.lastAt && Date.now() - s.lastAt < HOT_MS);
      const err = st && st.steps.some((s) => s.error);
      h += `<span class="ca-wbar-item${hot ? ' hot' : ''}${err ? ' err' : ''}" data-w-open="clickers" title="${esc(statusTitle(m))}">${CA.UI.MacrosPage.icon(m, true)}</span>`;
    });
    return h;
  }

  function statsHtml() {
    const { beautify, span } = CA.UI.Plot.fmt;
    const frames = CA.Recorder.frames();
    const f = frames[frames.length - 1];
    const r = CA.UI.Graphs.recent(60);
    const total = (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);
    const lvl = Math.floor(Game.HowMuchPrestige(total));
    const need = typeof Game.HowManyCookiesReset === 'function' ? Game.HowManyCookiesReset(lvl + 1) - total : NaN;
    const eta = r && r.actual > 0 && need > 0 ? need / r.actual : NaN;
    const row = (label, value, title) => `<div class="ca-w-stat"${title ? ` title="${esc(title)}"` : ''}><span>${label}</span><b>${value}</b></div>`;
    return (
      row('CpS', f ? `${beautify((f.cps || 0) + (f.click || 0))}/s` : '—', 'Production + clicking, now') +
      row('Actual, 1 min', r ? `${beautify(r.actual)}/s` : '—', 'What really got baked per second over the last minute of play') +
      row('Bank', beautify(Game.cookies || 0)) +
      row('Prestige', `${beautify(lvl - (Game.prestige || 0), 0)} <em>this run</em>`) +
      row('Next level', Number.isFinite(eta) ? span(eta) : '—', 'At the last minute’s actual CpS')
    );
  }

  function eventsHtml() {
    const list = CA.EventLog.list().slice(-6).reverse();
    if (!list.length) return '<div class="ca-w-empty">Nothing has happened yet.</div>';
    return `<div class="ca-w-events">${list.map((e) => CA.UI.EventsPage.rowHtml(e)).join('')}</div>`;
  }

  function registerBuiltins() {
    defineType({ id: 'macro', name: 'Macro button', icon: 'star', bare: true, hidden: true, html: macroHtml });
    defineType({ id: 'status', name: 'Running now', icon: 'play', desc: 'A status bar: an icon for each running macro, pulsing while it works. Hover an icon for what its actions have done.', bare: true, single: true, html: statusHtml });
    defineType({ id: 'stats', name: 'Quick stats', icon: 'graphs', desc: 'CpS, actual CpS over the last minute, cookies in the bank, prestige this run and the time to the next level.', width: 190, single: true, html: statsHtml });
    defineType({ id: 'events', name: 'Latest events', icon: 'events', desc: 'The six newest entries in the event log.', width: 260, single: true, html: eventsHtml });
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

  /** The next free spot for a macro button: a row along the bottom of the panel (or where an old
   *  Shortcuts widget was), wrapping upwards. */
  function nextButtonPos() {
    const host = layer && layer.parentNode;
    const W = (host && host.clientWidth) || 400;
    const H = (host && host.clientHeight) || 800;
    const n = widgets.filter((w) => w.type === 'macro').length;
    const perRow = Math.max(1, Math.floor((W - 16) / BUTTON_PX));
    const ox = anchor ? anchor.x * (W - BUTTON_PX) : 8;
    const oy = anchor ? anchor.y * (H - BUTTON_PX) : H - BUTTON_PX - 70;
    const px = Math.min(W - BUTTON_PX, ox + (n % perRow) * BUTTON_PX);
    const py = Math.max(0, oy - Math.floor(n / perRow) * BUTTON_PX);
    return { x: W > BUTTON_PX ? px / (W - BUTTON_PX) : 0, y: H > BUTTON_PX ? py / (H - BUTTON_PX) : 0 };
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
    host.appendChild(layer);
    return layer;
  }

  function frameHtml(w) {
    const t = typeById[w.type];
    if (t.bare) {
      return (
        `<div class="ca-w ca-w-bare ca-w-${w.type}" data-widget="${w.id}" data-w-drag>` +
        `<div class="ca-w-body" data-w-body>${safeHtml(t, w)}</div>` +
        `<button type="button" class="ca-w-x" data-w-remove title="${w.type === 'macro' ? 'Remove (un-favourites the macro)' : 'Remove widget'}">${I('close', 8)}</button>` +
        '</div>'
      );
    }
    return (
      `<div class="ca-w${w.collapsed ? ' collapsed' : ''}" data-widget="${w.id}" style="width:${t.width}px">` +
      '<div class="ca-w-head" data-w-drag>' +
      `${I(t.icon, 12)}<span class="ca-w-title">${esc(t.name)}</span>` +
      `<button type="button" class="ca-w-btn" data-w-collapse title="${w.collapsed ? 'Expand' : 'Collapse'}">${w.collapsed ? '▸' : '▾'}</button>` +
      `<button type="button" class="ca-w-btn" data-w-remove title="Remove widget">${I('close', 10)}</button>` +
      '</div>' +
      `<div class="ca-w-body" data-w-body>${w.collapsed ? '' : safeHtml(t, w)}</div>` +
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

  function place(el, w) {
    const host = layer.parentNode;
    const W = host.clientWidth || 0;
    const H = host.clientHeight || 0;
    const x = Math.max(0, Math.min(1, w.x)) * Math.max(0, W - (el.offsetWidth || 0));
    const y = Math.max(0, Math.min(1, w.y)) * Math.max(0, H - (el.offsetHeight || 0));
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
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
      if (w.collapsed) return;
      const body = layer.querySelector(`[data-widget="${w.id}"] [data-w-body]`);
      const t = typeById[w.type];
      if (!body || !t) return;
      const html = safeHtml(t, w);
      if (body.innerHTML !== html) body.innerHTML = html;
    });
  }

  // ---- interaction ----------------------------------------------------------------------------

  function onMouseDown(e) {
    // keep presses on widgets from reaching the big cookie / the game's panel handlers
    e.stopPropagation();
    const handle = e.target.closest('[data-w-drag]');
    if (!handle || e.target.closest('[data-w-remove],[data-w-collapse]') || S().get('widgetsLocked') || e.button !== 0) return;
    const el = handle.closest('[data-widget]');
    const w = widgets.find((x) => x.id === el.dataset.widget);
    if (!w) return;
    // framed widgets: buttons in the title bar aren't drag handles; bare ones drag from anywhere
    if (!typeById[w.type].bare && e.target.closest('button')) return;
    e.preventDefault();
    press = { w, el, sx: e.clientX, sy: e.clientY, dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop, moved: false };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!press) return;
    if (!press.moved) {
      if (Math.abs(e.clientX - press.sx) < DRAG_PX && Math.abs(e.clientY - press.sy) < DRAG_PX) return;
      press.moved = true;
      press.el.classList.add('dragging');
    }
    const host = layer.parentNode;
    const maxX = Math.max(0, host.clientWidth - press.el.offsetWidth);
    const maxY = Math.max(0, host.clientHeight - press.el.offsetHeight);
    const x = Math.max(0, Math.min(maxX, e.clientX - press.dx));
    const y = Math.max(0, Math.min(maxY, e.clientY - press.dy));
    press.el.style.left = `${x}px`;
    press.el.style.top = `${y}px`;
    press.w.x = maxX ? x / maxX : 0;
    press.w.y = maxY ? y / maxY : 0;
  }

  function onMouseUp() {
    if (!press) return;
    const moved = press.moved;
    press.el.classList.remove('dragging');
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
      CA.Util.sound(m.mode === 'once' || !CA.Macros.isOn(m.id) ? 'snd/clickOn2.mp3' : 'snd/clickOff2.mp3');
      CA.Macros.trigger(m.id);
      tick();
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

  // ---- save / load ------------------------------------------------------------------------

  const round = (v) => Math.round(v * 1000) / 1000;

  function serialize() {
    return widgets.map(({ id, type, x, y, collapsed, macro }) => ({ id, type, x: round(x), y: round(y), collapsed, ...(macro ? { macro } : {}) }));
  }

  function load(data) {
    if (!Array.isArray(data)) return;
    const ok = (w) => w && Number.isFinite(w.x) && Number.isFinite(w.y);
    // v2.1 had one Shortcuts widget for all favourites; its buttons now start where it was
    const old = data.find((w) => ok(w) && w.type === 'shortcuts');
    anchor = old ? { x: old.x, y: old.y } : null;
    widgets = data
      .filter((w) => ok(w) && typeById[w.type])
      .map((w) => ({ id: String(w.id || newId()), type: w.type, x: w.x, y: w.y, collapsed: !!w.collapsed, ...(w.macro ? { macro: String(w.macro) } : {}) }));
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
    addEventListener('resize', render);
    setInterval(tick, TICK_MS);
    render();
  }

  return { init, defineType, types: () => types.slice(), add, remove, list, has, serialize, load, render, tick, reconcile };
})();
