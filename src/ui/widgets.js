// **Widgets**: small framed boxes on the game's left panel (around the big cookie) that you add,
// drag around and remove. Each widget is an instance of a widget type:
//
//   shortcuts   buttons for your favourite macros (the ★ on the Macros page)
//   status      "Running now": every active macro and what its actions are doing
//   stats       CpS, actual CpS, bank and next prestige level at a glance
//   events      the latest events from the event log
//
// Positions are stored as fractions of the panel, so widgets stay put when the window resizes.
// The widget list is saved with your settings (game save + local mirror). The Widgets page adds
// them; a "Lock" option stops them being dragged by accident.
//
//   CA.UI.Widgets.defineType({ id, name, icon, desc, width, single, html(inst), onClick?(t, inst) })

CA.UI = CA.UI || {};

CA.UI.Widgets = (() => {
  const TICK_MS = 500;
  const S = () => CA.Settings;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);

  const types = [];
  const typeById = {};
  let widgets = []; // { id, type, x, y, collapsed }
  let layer = null;
  let drag = null;

  function defineType(t) {
    const d = { width: 220, single: false, icon: 'widget', ...t };
    types.push(d);
    typeById[d.id] = d;
    return d;
  }

  // ---- built-in widget types ----------------------------------------------------------------

  function shortcutsHtml() {
    const favs = CA.Macros.list().filter((m) => CA.Macros.isFav(m.id));
    if (!favs.length) return '<div class="ca-w-empty">Star macros on the Macros page (★) to put their buttons here.</div>';
    return (
      '<div class="ca-w-shortcuts">' +
      favs
        .map((m) => {
          const on = CA.Macros.isOn(m.id);
          const key = CA.Settings.getHotkey(`macro.${m.id}`);
          const title = `${m.name} — ${m.mode === 'once' ? 'click to run' : on ? 'on, click to switch off' : 'off, click to switch on'}${key ? ` (${CA.Hotkeys.format(key)})` : ''}`;
          return (
            `<button type="button" class="ca-w-sc${on ? ' on' : ''}${m.mode === 'once' ? ' once' : ''}" data-w-trigger="${esc(m.id)}" title="${esc(title)}">` +
            `${CA.UI.MacrosPage.icon(m, true)}<span>${esc(m.name)}</span></button>`
          );
        })
        .join('') +
      '</div>'
    );
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
    defineType({ id: 'shortcuts', name: 'Shortcuts', icon: 'star', desc: 'Buttons for your favourite macros: switch them on and off, or run them, without opening the panel.', width: 200, html: shortcutsHtml });
    defineType({ id: 'status', name: 'Running now', icon: 'play', desc: 'Every running macro and what each of its actions has done — the same as on the Macros page.', width: 260, single: true, html: () => CA.UI.MacrosPage.status() });
    defineType({ id: 'stats', name: 'Quick stats', icon: 'graphs', desc: 'CpS, actual CpS over the last minute, cookies in the bank, prestige this run and the time to the next level.', width: 190, single: true, html: statsHtml });
    defineType({ id: 'events', name: 'Latest events', icon: 'events', desc: 'The six newest entries in the event log.', width: 260, single: true, html: eventsHtml });
  }

  // ---- instances ------------------------------------------------------------------------------

  const newId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

  function add(type, pos) {
    const t = typeById[type];
    if (!t) return null;
    if (t.single) {
      const existing = widgets.find((w) => w.type === type);
      if (existing) return existing;
    }
    const n = widgets.length;
    const w = { id: newId(), type, x: pos ? pos.x : 0.04, y: pos ? pos.y : Math.min(0.85, 0.52 + n * 0.06), collapsed: false };
    widgets.push(w);
    changed();
    return w;
  }

  function remove(id) {
    const i = widgets.findIndex((w) => w.id === id);
    if (i < 0) return;
    widgets.splice(i, 1);
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
    const ew = el.offsetWidth || 0;
    const eh = el.offsetHeight || 0;
    const x = Math.max(0, Math.min(1, w.x)) * Math.max(0, W - ew);
    const y = Math.max(0, Math.min(1, w.y)) * Math.max(0, H - eh);
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
  }

  function render() {
    if (!ensureLayer()) return;
    const visible = S().get('widgetsShown');
    layer.classList.toggle('ca-hidden', !visible);
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
    if (!S().get('widgetsShown') || drag) return;
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
    // keep clicks on widgets from reaching the big cookie / the game's panel handlers
    e.stopPropagation();
    const head = e.target.closest('[data-w-drag]');
    if (!head || e.target.closest('button') || S().get('widgetsLocked') || e.button !== 0) return;
    const el = head.closest('[data-widget]');
    const w = widgets.find((x) => x.id === el.dataset.widget);
    if (!w) return;
    e.preventDefault();
    drag = { w, el, dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
    el.classList.add('dragging');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!drag) return;
    const host = layer.parentNode;
    const maxX = Math.max(0, host.clientWidth - drag.el.offsetWidth);
    const maxY = Math.max(0, host.clientHeight - drag.el.offsetHeight);
    const x = Math.max(0, Math.min(maxX, e.clientX - drag.dx));
    const y = Math.max(0, Math.min(maxY, e.clientY - drag.dy));
    drag.el.style.left = `${x}px`;
    drag.el.style.top = `${y}px`;
    drag.w.x = maxX ? x / maxX : 0;
    drag.w.y = maxY ? y / maxY : 0;
  }

  function onMouseUp() {
    if (!drag) return;
    drag.el.classList.remove('dragging');
    drag = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    CA.Events.emit('widgets');
  }

  function onClick(e) {
    e.stopPropagation();
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
    const ca = e.target.closest('[data-ca]');
    if (ca && CA.UI.MacrosPage.handle(ca.dataset.ca, ca)) tick();
  }

  // ---- save / load ------------------------------------------------------------------------

  function serialize() {
    return widgets.map(({ id, type, x, y, collapsed }) => ({ id, type, x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, collapsed }));
  }

  function load(data) {
    if (!Array.isArray(data)) return;
    widgets = data
      .filter((w) => w && typeById[w.type] && Number.isFinite(w.x) && Number.isFinite(w.y))
      .map((w) => ({ id: String(w.id || newId()), type: w.type, x: w.x, y: w.y, collapsed: !!w.collapsed }));
    render();
  }

  // ---- the Widgets page ------------------------------------------------------------------

  function pageHtml() {
    const C = CA.UI.C;
    let h =
      '<div class="ca-card">' +
      C.cardHead('Add a widget', 'plus') +
      '<div class="ca-card-note">Widgets sit on the left panel, around the big cookie. Drag one by its title bar; ▾ folds it up, × removes it.</div>' +
      '<div class="ca-list">';
    types.forEach((t) => {
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
    h += `<div class="ca-card">${C.cardHead('Options', 'settings')}<div class="ca-list">${S().optionsIn('widgets').map(CA.UI.Menu.optionRow).join('')}` +
      '<div class="ca-row ca-row-option">' +
      `<span class="ca-row-ico">${I('trash', 16)}</span>` +
      '<div class="ca-row-text"><div class="ca-row-name">Remove all widgets</div><div class="ca-row-desc">Clears the left panel.</div></div>' +
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
      widgets = [];
      changed();
    }
    CA.UI.Menu.render();
  }

  function init() {
    registerBuiltins();
    S().defineOption({ key: 'widgetsShown', group: 'widgets', icon: 'widget', name: 'Show widgets', desc: 'Show your widgets on the left panel (they stay saved while hidden).', default: true });
    S().defineOption({ key: 'widgetsLocked', group: 'widgets', icon: 'grip', name: 'Lock widgets', desc: 'Stop widgets from being dragged around by accident.', default: false });
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
    CA.Events.on('macros', tick);
    addEventListener('resize', render);
    setInterval(tick, TICK_MS);
    render();
  }

  return { init, defineType, types: () => types.slice(), add, remove, list, has, serialize, load, render, tick };
})();
