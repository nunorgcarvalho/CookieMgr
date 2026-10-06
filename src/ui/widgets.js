// **Widgets**: small things on the game's left panel (around the big cookie) that you drag around.
// This is the engine — placing, dragging, sizing, settings, saving. What each widget shows lives in
// ui/widgetTypes.js.
//
// Two looks: framed boxes (dragged by their title bar) and bare widgets — buttons, the status bar
// and the round minigame widgets — with no frame, dragged from anywhere (a press that doesn't move
// is a click). Every widget resizes from its bottom-right corner: bare ones scale (keeping their
// shape), framed boxes take any width and height.
//
// Settings: every widget's ⚙ opens its own settings on the Widgets page (also reachable from the
// list of placed widgets there): text size for all, size for bare ones, a title for framed ones,
// and whatever its type adds (which Quick stats, how many events…).
//
// Positions are fractions of the panel, applied with CSS percentages (left: x·100% plus a
// translate of −x·100% of the widget's own size), so a widget follows the panel's layout by
// itself — nothing is measured or re-placed in JavaScript, so nothing jumps when the game (or
// Cookie Monster) resizes the panel while loading. The list is saved with your settings.
// The layer sits above the game's big-cookie click target but below its popups and golden cookies.
//
// Content refreshes twice a second by patching the existing DOM (morph()), never replacing it, so
// whatever is under the mouse — and its popup — stays put.
//
//   CA.UI.Widgets.defineType({ id, name, icon, desc, bare, width, single, hidden, resize, settings, html(inst) })

CA.UI = CA.UI || {};

CA.UI.Widgets = (() => {
  const TICK_MS = 500;
  const DRAG_PX = 4; // a press that moves less than this is a click, not a drag
  const HOLD_DELAY_MS = 350; // holding a buying macro's button this long…
  const HOLD_MS = 80; // …runs it this often until you let go
  const BUTTON_PX = 44; // macro button size incl. spacing, for laying out new ones
  const SCALE_MIN = 0.6;
  const SCALE_MAX = 3;
  const FONT_MIN = 60;
  const FONT_MAX = 200;
  const MIN_W = 140;
  const MIN_H = 60;
  const SAVED = ['count', 'types', 'stats', 'font', 'title', 'target', 'targetMagic']; // per-widget settings that are saved
  const TRANSIENT = ['ca-shake', 'ca-holding']; // classes a refresh leaves alone
  const S = () => CA.Settings;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);

  const types = [];
  const typeById = {};
  let widgets = []; // { id, type, x, y, collapsed, macro?, scale?, w?, h?, count?, types?, stats?, font?, title? }
  let layer = null;
  let press = null; // { w, el, sx, sy, dx, dy, moved }
  let swallowClick = false;
  let anchor = null; // where a v2.1 Shortcuts widget was, for laying out its buttons
  let editing = null; // id of the widget whose settings the Widgets page shows

  function defineType(t) {
    const d = { width: 220, single: false, bare: false, hidden: false, icon: 'widget', settings: [], ...t };
    types.push(d);
    typeById[d.id] = d;
    return d;
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
    let p = pos;
    if (!p && t.bare) p = nextButtonPos(); // round widgets line up with the buttons
    if (!p) {
      const n = widgets.filter((w) => !typeById[w.type].bare).length;
      p = { x: 0.04, y: Math.min(0.85, 0.52 + n * 0.06) };
    }
    const w = { id: newId(), type, x: p.x, y: p.y, collapsed: false, ...(extra || {}) };
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

  /** The next free spot for a small widget: from the bottom-right corner upwards (clear of the
   *  bottom-left, where the dragon and Santa live), then the next column to the left, again from
   *  the bottom. A v2.1 Shortcuts widget's buttons start where it was instead. */
  function nextButtonPos() {
    const host = layer && layer.parentNode;
    const W = (host && host.clientWidth) || 400;
    const H = (host && host.clientHeight) || 800;
    const fx = (px) => (W > BUTTON_PX ? px / (W - BUTTON_PX) : 0);
    const fy = (py) => (H > BUTTON_PX ? py / (H - BUTTON_PX) : 0);
    const taken = widgets.filter((w) => typeById[w.type] && typeById[w.type].bare && w.type !== 'status').map((w) => ({ x: w.x * (W - BUTTON_PX), y: w.y * (H - BUTTON_PX) }));
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
    if (editing === id) editing = null;
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
  const get = (id) => widgets.find((w) => w.id === id) || null;
  /** The name a widget shows (its title, or its type's name — a macro button: the macro's). */
  function nameOf(w) {
    if (w.title) return w.title;
    if (w.type === 'macro') {
      const m = CA.Macros.get(w.macro);
      return m ? m.name : 'Macro button';
    }
    return (typeById[w.type] || {}).name || w.type;
  }

  // ---- rendering ------------------------------------------------------------------------------

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    const host = document.getElementById('sectionLeft');
    if (!host) return null;
    layer = document.createElement('div');
    layer.id = 'CookieMgrWidgets';
    layer.addEventListener('mousedown', onMouseDown);
    layer.addEventListener('click', onClick);
    layer.addEventListener('mouseover', onLayerHover);
    layer.addEventListener('mouseleave', () => setLinked(null));
    host.appendChild(layer);
    return layer;
  }

  const RESIZE = '<span class="ca-w-resize" data-w-resize aria-label="Resize"></span>';
  const fontOf = (w) => Math.max(FONT_MIN, Math.min(FONT_MAX, w.font || 100)) / 100;

  // glowing: hovered on the Widgets page, or its settings open there
  const glow = (w) => (w.id === linked || (w.id === editing && pageRoot) ? ' ca-w-linked' : '');

  function frameHtml(w) {
    const t = typeById[w.type];
    const fs = `--wfs:${fontOf(w)}`;
    if (t.bare) {
      return (
        `<div class="ca-w ca-w-bare ca-w-${w.type}${glow(w)}" data-widget="${w.id}" data-w-drag style="${fs}">` +
        `<div class="ca-w-body" data-w-body>${safeHtml(t, w)}</div>` +
        `<button type="button" class="ca-w-x" data-w-remove aria-label="${w.type === 'macro' ? 'Remove (un-favourites the macro)' : 'Remove widget'}">${I('close', 8)}</button>` +
        `<button type="button" class="ca-w-x ca-w-gear" data-w-settings aria-label="Settings">${I('settings', 8)}</button>` +
        RESIZE +
        '</div>'
      );
    }
    return (
      `<div class="ca-w${w.collapsed ? ' collapsed' : ''}${w.h ? ' sized' : ''}${glow(w)}" data-widget="${w.id}" style="${fs};width:${w.w || t.width}px${w.h && !w.collapsed ? `;height:${w.h}px` : ''}">` +
      '<div class="ca-w-head" data-w-drag>' +
      `${I(t.icon, 12)}<span class="ca-w-title">${esc(nameOf(w))}</span>` +
      `<button type="button" class="ca-w-btn" data-w-settings aria-label="Settings">${I('settings', 10)}</button>` +
      `<button type="button" class="ca-w-btn" data-w-collapse aria-label="${w.collapsed ? 'Expand' : 'Collapse'}">${w.collapsed ? '▸' : '▾'}</button>` +
      `<button type="button" class="ca-w-btn" data-w-remove aria-label="Remove widget">${I('close', 10)}</button>` +
      '</div>' +
      `<div class="ca-w-body ca-wt" data-w-body>${w.collapsed ? '' : safeHtml(t, w)}</div>` +
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

  /**
   * Makes `target`'s children match `html` while keeping every node that's still the same kind of
   * node — only text and attributes change — so hover states and open popups survive an update.
   */
  function morph(target, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    morphChildren(target, tpl.content);
  }
  function morphChildren(target, source) {
    const a = target.childNodes;
    const b = source.childNodes;
    for (let i = 0; i < b.length; i++) {
      const want = b[i];
      const have = a[i];
      if (!have) {
        target.appendChild(want.cloneNode(true));
        continue;
      }
      if (have.nodeType !== want.nodeType || have.nodeName !== want.nodeName) {
        target.replaceChild(want.cloneNode(true), have);
        continue;
      }
      if (want.nodeType === 3) {
        if (have.nodeValue !== want.nodeValue) have.nodeValue = want.nodeValue;
        continue;
      }
      if (want.nodeType !== 1) continue;
      for (const attr of [...have.attributes]) if (!want.hasAttribute(attr.name)) have.removeAttribute(attr.name);
      for (const attr of [...want.attributes]) {
        let v = attr.value;
        // keep feedback a click added (a shake) until its own timer takes it away
        if (attr.name === 'class') TRANSIENT.forEach((c) => have.classList.contains(c) && !want.classList.contains(c) && (v += ` ${c}`));
        if (have.getAttribute(attr.name) !== v) have.setAttribute(attr.name, v);
      }
      morphChildren(have, want);
    }
    while (a.length > b.length) target.removeChild(target.lastChild);
  }

  /** Refreshes each widget's content in place (positions untouched). */
  function tick() {
    if (!layer || !layer.isConnected) return render();
    if (!S().get('widgetsShown') || (press && press.moved)) return;
    widgets.forEach((w) => {
      if (w.collapsed) return;
      const body = layer.querySelector(`[data-widget="${w.id}"] [data-w-body]`);
      const t = typeById[w.type];
      if (body && t) morph(body, safeHtml(t, w));
    });
  }

  // ---- interaction ----------------------------------------------------------------------------

  function onMouseDown(e) {
    // keep presses on widgets from reaching the big cookie / the game's panel handlers
    e.stopPropagation();
    if (S().get('widgetsLocked') || e.button !== 0) return;
    const grip = e.target.closest('[data-w-resize]');
    const handle = grip || e.target.closest('[data-w-drag]');
    if (!handle || e.target.closest('[data-w-remove],[data-w-collapse],[data-w-settings]')) return;
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
    // holding down a buying macro's button buys fast (one run of its steps every HOLD_MS)
    const m = w.type === 'macro' && !grip ? CA.Macros.get(w.macro) : null;
    if (m && m.holdRepeat) {
      const p = press;
      p.holdStart = setTimeout(() => {
        p.holding = true;
        const btn = el.querySelector('[data-w-trigger]');
        if (btn) btn.classList.add('ca-holding');
        const once = () => {
          if (CA.Macros.runOnce(m.id) > 0) CA.Util.sound('snd/buy1.mp3');
        };
        once();
        p.holdTimer = setInterval(once, HOLD_MS);
      }, HOLD_DELAY_MS);
    }
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
      stopHold(press);
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

  function stopHold(p) {
    clearTimeout(p.holdStart);
    clearInterval(p.holdTimer);
    const btn = p.el.querySelector('[data-w-trigger]');
    if (btn) btn.classList.remove('ca-holding');
  }

  function onMouseUp() {
    if (!press) return;
    const moved = press.moved;
    const held = !!press.holding;
    stopHold(press);
    press.el.classList.remove('dragging', 'resizing');
    press = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (moved || held) {
      swallowClick = true; // the click that follows a drag (or a hold) isn't a click
      setTimeout(() => (swallowClick = false), 0);
    }
    if (moved) CA.Events.emit('widgets');
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
    if (e.target.closest('[data-w-settings]')) {
      CA.Util.sound('snd/tick.mp3');
      openSettings(w.id);
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
      // shift-click: flip the macro's shift setting (e.g. the stock autobuyer: buy or only sell)
      if (e.shiftKey && m.shift) {
        const v = CA.Macros.shiftToggle(m.id);
        CA.Util.sound(v ? 'snd/clickOn2.mp3' : 'snd/clickOff2.mp3');
        CA.Util.notify(m.name, `Now ${v ? m.shift.on : m.shift.off}.`, CA.ICON, 2);
        tick();
        return;
      }
      if (m.mode !== 'once') CA.Util.sound(CA.Macros.isOn(m.id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3'); // once macros: run() picks the sound
      if (m.mode === 'once') CA.UI.MacrosPage.run(m.id, trig);
      else {
        CA.Macros.trigger(m.id);
        // switched on but it can't do anything yet (a buyer that can't afford its pick): say so
        const r = CA.Macros.isOn(m.id) && CA.UI.WidgetTypes.readyState(m);
        if (r && r.cls === 'cant') {
          trig.classList.remove('ca-shake');
          void trig.offsetWidth;
          trig.classList.add('ca-shake');
          setTimeout(() => trig.classList.remove('ca-shake'), 500);
          CA.Util.notify(m.name, `On — but nothing it can do yet: ${esc(r.text)}.`, CA.ICON, 3);
        }
      }
      tick();
      return;
    }
    const mg = e.target.closest('[data-w-open-mg]');
    if (mg) {
      CA.Util.sound('snd/tick.mp3');
      CA.UI.WidgetTypes.openMinigame(mg.dataset.wOpenMg);
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

  // ---- settings ------------------------------------------------------------------------------

  /** Opens the Widgets page on widget `id`'s settings. */
  function openSettings(id) {
    editing = id;
    if (CA.UI.Menu.isOpen() && CA.Settings.get('tab') === 'widgets') CA.UI.Menu.render();
    else CA.UI.Menu.openPage('widgets');
    revealEditor();
  }

  /** Scrolls the panel to a widget's settings (at the top of the Widgets page) and flashes them. */
  function revealEditor() {
    const ed = document.querySelector('#CookieMgrMenu [data-w-editor]');
    if (!ed) return;
    CA.Util.scrollInPanel(ed, 'start');
    ed.classList.remove('ca-reveal');
    void ed.offsetWidth;
    ed.classList.add('ca-reveal');
  }

  /** Applies one setting change from the editor and redraws the widget. */
  function setOption(w, key, value) {
    w[key] = value;
    changed();
  }

  /**
   * A widget's settings: a header (what it is, Remove, Done) over two sections — Look (text size,
   * size or title) and Shows (what its type lets you choose). Changes apply at once; the widget
   * glows on the left panel while its settings are open.
   */
  function editorHtml(w) {
    const t = typeById[w.type];
    const C = CA.UI.C;
    const field = (label, input, hint) =>
      `<div class="ca-wf"><span class="ca-wf-label">${label}</span><div class="ca-wf-input">${input}</div>${hint ? `<span class="ca-wf-hint">${hint}</span>` : ''}</div>`;
    const range = (key, min, max, val, type) =>
      `<input type="range" min="${min}" max="${max}" step="5" value="${val}" data-w-opt="${key}" data-type="${type}"><span class="ca-range-val">${val}%</span>`;
    // one-click sizes beside each slider
    const presets = (key, list, cur) =>
      `<div class="ca-wpresets">${list.map(([v, label]) => `<button type="button" class="ca-chip${Math.round(cur) === v ? ' on' : ''}" data-w-preset="${key}" data-val="${v}">${label}</button>`).join('')}</div>`;
    const font = Math.round(fontOf(w) * 100);
    let look = field('Text size', presets('font', [[80, 'S'], [100, 'M'], [130, 'L'], [170, 'XL']], font) + range('font', FONT_MIN, FONT_MAX, font, 'number'));
    if (t.resize === 'scale') {
      const sc = Math.round(scaleOf(w) * 100);
      look += field('Size', presets('scale', [[75, 'S'], [100, 'M'], [150, 'L'], [200, 'XL']], sc) + range('scale', SCALE_MIN * 100, SCALE_MAX * 100, sc, 'percent'), 'or drag its corner');
    }
    else look += field('Title', `<input type="text" maxlength="40" value="${esc(w.title || '')}" placeholder="${esc(t.name)}" data-w-opt="title" data-type="text">`);
    let shows = '';
    (t.settings || []).forEach((s) => {
      const cur = w[s.key] !== undefined ? w[s.key] : s.default;
      if (s.type === 'select') {
        shows += field(
          esc(s.label),
          `<select data-w-opt="${s.key}" data-type="choice">${s
            .options()
            .map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(cur) ? ' selected' : ''}>${esc(o.label)}</option>`)
            .join('')}</select>`
        );
      } else if (s.type === 'number') {
        shows += field(esc(s.label), `<input type="number" min="${s.min}" max="${s.max}" value="${esc(cur)}" data-w-opt="${s.key}" data-type="number" data-min="${s.min}" data-max="${s.max}">${s.unit ? `<em>${esc(s.unit)}</em>` : ''}`);
      } else if (s.type === 'multi') {
        const chosen = new Set(cur || []);
        shows +=
          `<div class="ca-wf ca-wf-wide"><span class="ca-wf-label">${esc(s.label)}</span><div class="ca-members">` +
          s
            .options()
            .map(
              (o) =>
                `<label class="ca-member${chosen.has(o.v) ? ' on' : ''}"><input type="checkbox" data-w-multi="${s.key}" value="${esc(o.v)}"${chosen.has(o.v) ? ' checked' : ''}>` +
                `${o.icon ? `<span style="color:${o.color || 'inherit'}">${I(o.icon, 13)}</span>` : ''}<span>${esc(o.label)}</span></label>`
            )
            .join('') +
          '</div></div>';
      }
    });
    // where it sits: snap to a corner, an edge or the middle of the left panel
    const spots = [0, 0.5, 1];
    const at = (v) => spots.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
    const place =
      `<div class="ca-wsnap">${[].concat(
        ...spots.map((y) =>
          spots.map((x) => `<button type="button" class="ca-wsnap-cell${at(w.x) === x && at(w.y) === y && Math.abs(w.x - x) < 0.02 && Math.abs(w.y - y) < 0.02 ? ' on' : ''}" data-w-snap="${x},${y}" title="Move it here"><i></i></button>`)
        )
      ).join('')}</div><span class="ca-wf-hint">snap it to a corner, an edge or the middle — or drag it anywhere</span>`;
    return (
      `<div class="ca-card ca-weditor ca-wtheme-${esc(w.type)}" data-w-editor="${esc(w.id)}" data-wlink="${esc(w.id)}">` +
      '<div class="ca-weditor-head">' +
      `<span class="ca-weditor-ico">${I(t.icon, 20)}</span>` +
      `<div class="ca-weditor-title"><b>${esc(nameOf(w))}</b><span>${esc(w.type === 'macro' ? 'Macro button' : t.name)} · glowing on the left panel</span></div>` +
      C.button(`${I('close', 11)} Remove`, `data-w-page-del="${esc(w.id)}"`, 'ca-btn-small ca-btn-off') +
      C.button('Done', 'data-w-edit-done', 'ca-btn-small ca-btn-on') +
      '</div>' +
      '<div class="ca-weditor-body">' +
      `<div class="ca-weditor-sec"><div class="ca-weditor-sec-head">${I('widget', 12)} Look</div>${look}</div>` +
      (shows ? `<div class="ca-weditor-sec"><div class="ca-weditor-sec-head">${I('filter', 12)} Shows</div>${shows}</div>` : '') +
      `<div class="ca-weditor-sec ca-weditor-place"><div class="ca-weditor-sec-head">${I('grip', 12)} Place</div>${place}</div>` +
      '</div></div>'
    );
  }

  // ---- linking: a widget on the page ⇄ the same widget on the left panel ------------------

  let linked = null; // the widget hovered on either side

  /** Puts the glow on the widgets that should have it (without redrawing them). */
  function refreshGlow() {
    if (layer) layer.querySelectorAll('[data-widget]').forEach((el) => el.classList.toggle('ca-w-linked', el.dataset.widget === linked || (el.dataset.widget === editing && !!pageRoot)));
  }

  function setLinked(id) {
    if (id === linked) return;
    linked = id;
    refreshGlow();
    if (pageRoot) pageRoot.querySelectorAll('[data-wlink]').forEach((el) => el.classList.toggle('linked', el.dataset.wlink === id));
  }

  /** Where each widget sits on the left panel, in % of it (measured; from its saved place when it can't be). */
  function placeOf(w) {
    const host = layer && layer.parentNode;
    const el = layer && layer.querySelector(`[data-widget="${w.id}"]`);
    if (host && el && host.getBoundingClientRect) {
      const H = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (H.width && H.height && r.width) {
        return { l: ((r.left - H.left) / H.width) * 100, t: ((r.top - H.top) / H.height) * 100, w: (r.width / H.width) * 100, h: (r.height / H.height) * 100 };
      }
    }
    const bare = typeById[w.type] && typeById[w.type].bare;
    const sw = bare ? 10 : 40;
    const sh = bare ? 5 : 14;
    return { l: clamp01(w.x) * (100 - sw), t: clamp01(w.y) * (100 - sh), w: sw, h: sh };
  }

  /** A small map of the left panel with every widget where it is (and the big cookie, to get your bearings). */
  function mapHtml() {
    const host = layer && layer.parentNode;
    const H = host && host.getBoundingClientRect ? host.getBoundingClientRect() : null;
    const ratio = H && H.width && H.height ? H.width / H.height : 0.55;
    const cookie = document.getElementById('bigCookie');
    let ck = '';
    if (H && H.width && cookie && cookie.getBoundingClientRect) {
      const c = cookie.getBoundingClientRect();
      if (c.width) ck = `<i class="ca-wmap-cookie" style="left:${((c.left - H.left) / H.width) * 100}%;top:${((c.top - H.top) / H.height) * 100}%;width:${(c.width / H.width) * 100}%;height:${(c.height / H.height) * 100}%"></i>`;
    }
    return (
      `<div class="ca-wmap" style="aspect-ratio:${ratio.toFixed(3)}">${ck}` +
      widgets
        .filter((w) => typeById[w.type])
        .map((w) => {
          const p = placeOf(w);
          const t = typeById[w.type];
          const icon = w.type === 'macro' && CA.Macros.get(w.macro) ? CA.UI.MacrosPage.icon(CA.Macros.get(w.macro), true) : I(t.icon, 12);
          return (
            `<button type="button" class="ca-wmap-item${t.bare ? ' bare' : ''}${w.id === linked ? ' linked' : ''}${w.id === editing ? ' editing' : ''}" data-wlink="${esc(w.id)}" data-w-page-edit="${esc(w.id)}" ` +
            `style="left:${p.l.toFixed(2)}%;top:${p.t.toFixed(2)}%;width:${p.w.toFixed(2)}%;height:${p.h.toFixed(2)}%" title="${esc(nameOf(w))} — click for its settings">${icon}</button>`
          );
        })
        .join('') +
      '</div>'
    );
  }

  /** The placed widgets as chips: icon, name, ⚙, ×. */
  function chipsHtml() {
    return widgets
      .filter((w) => typeById[w.type])
      .map((w) => {
        const t = typeById[w.type];
        const icon = w.type === 'macro' && CA.Macros.get(w.macro) ? CA.UI.MacrosPage.icon(CA.Macros.get(w.macro), true) : I(t.icon, 13);
        return (
          `<span class="ca-wchip${w.id === editing ? ' editing' : ''}${w.id === linked ? ' linked' : ''}" data-wlink="${esc(w.id)}">` +
          `<button type="button" class="ca-wchip-main" data-w-page-edit="${esc(w.id)}" title="Settings">${icon}<b>${esc(nameOf(w))}</b>${I('settings', 11)}</button>` +
          `<button type="button" class="ca-wchip-x" data-w-page-del="${esc(w.id)}" title="Remove">${I('close', 9)}</button></span>`
        );
      })
      .join('');
  }

  /** Keeps the map in step with the left panel while the page is open. */
  function syncPage() {
    if (!pageRoot || !pageRoot.isConnected) return;
    const map = pageRoot.querySelector('[data-w-map]');
    if (map) morph(map, mapHtml());
  }

  function onEditorInput(e) {
    const el = e.target;
    const box = el.closest && el.closest('[data-w-editor]');
    const w = box && get(box.dataset.wEditor);
    if (!w) return;
    if (el.dataset.wMulti) {
      const key = el.dataset.wMulti;
      const t = typeById[w.type];
      const def = (t.settings.find((s) => s.key === key) || {}).default || [];
      const set = new Set(w[key] !== undefined ? w[key] : def);
      if (el.checked) set.add(el.value);
      else set.delete(el.value);
      el.closest('.ca-member').classList.toggle('on', el.checked);
      setOption(w, key, [...set]);
      return;
    }
    const key = el.dataset.wOpt;
    if (!key) return;
    let v = el.value;
    if (el.dataset.type === 'number' || el.dataset.type === 'percent') {
      v = Number(v);
      if (!Number.isFinite(v)) return;
      if (el.dataset.min) v = Math.max(Number(el.dataset.min), Math.min(Number(el.dataset.max), Math.round(v)));
      if (el.dataset.type === 'percent') v /= 100;
    } else v = el.dataset.type === 'choice' ? String(v) : String(v).trim().slice(0, 40);
    const label = el.parentNode.querySelector('.ca-range-val');
    if (label) label.textContent = `${Math.round(el.dataset.type === 'percent' ? v * 100 : v)}%`;
    setOption(w, key, v);
  }

  // ---- save / load ------------------------------------------------------------------------

  const round = (v) => Math.round(v * 1000) / 1000;

  function serialize() {
    return widgets.map((wd) => {
      const out = { id: wd.id, type: wd.type, x: round(wd.x), y: round(wd.y), collapsed: wd.collapsed };
      if (wd.macro) out.macro = wd.macro;
      if (wd.scale && wd.scale !== 1) out.scale = round(wd.scale);
      if (wd.w) out.w = wd.w;
      if (wd.h) out.h = wd.h;
      SAVED.forEach((k) => {
        if (wd[k] === undefined || wd[k] === '' || (Array.isArray(wd[k]) && !wd[k].length && k === 'types')) return;
        out[k] = Array.isArray(wd[k]) ? wd[k].slice() : wd[k];
      });
      return out;
    });
  }

  function load(data) {
    if (!Array.isArray(data)) return;
    const ok = (w) => w && Number.isFinite(w.x) && Number.isFinite(w.y);
    // v2.1 had one Shortcuts widget for all favourites; its buttons now start where it was
    const old = data.find((w) => ok(w) && w.type === 'shortcuts');
    anchor = old ? { x: old.x, y: old.y } : null;
    widgets = data
      .filter((w) => ok(w) && typeById[w.type])
      .map((w) => {
        const out = { id: String(w.id || newId()), type: w.type, x: w.x, y: w.y, collapsed: !!w.collapsed };
        if (w.macro) out.macro = String(w.macro);
        if (Number.isFinite(w.scale)) out.scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, w.scale));
        if (Number.isFinite(w.w)) out.w = Math.max(MIN_W, w.w);
        if (Number.isFinite(w.h)) out.h = Math.max(MIN_H, w.h);
        if (Number.isFinite(w.count)) out.count = w.count;
        if (typeof w.target === 'string') out.target = w.target.slice(0, 40);
        if (Number.isFinite(w.targetMagic)) out.targetMagic = w.targetMagic;
        if (Number.isFinite(w.font)) out.font = Math.max(FONT_MIN, Math.min(FONT_MAX, w.font));
        if (typeof w.title === 'string') out.title = w.title.slice(0, 40);
        if (Array.isArray(w.types)) out.types = w.types.map(String);
        if (Array.isArray(w.stats)) out.stats = w.stats.map(String);
        return out;
      });
    render();
    reconcile();
  }

  // ---- the Widgets page ------------------------------------------------------------------

  function pageHtml() {
    const C = CA.UI.C;
    const favs = CA.Macros.list().filter((m) => CA.Macros.isFav(m.id));
    let h = '';
    const ed = editing && get(editing);
    if (ed) h += editorHtml(ed);
    else editing = null;

    // what's placed: a map of the left panel, and the same widgets as chips — hover either (or the
    // widget itself) and they light up together; click for its settings
    if (widgets.length) {
      h +=
        '<div class="ca-card">' +
        C.cardHead('Your widgets', 'widget', `<div class="ca-card-meta"><span class="ca-pill">${widgets.length} placed</span></div>`) +
        `<div class="ca-wplaced"><div class="ca-wmap-wrap" data-w-map>${mapHtml()}</div><div class="ca-wchips">${chipsHtml()}</div></div>` +
        '</div>';
    }

    h +=
      '<div class="ca-card">' +
      C.cardHead('Add a widget', 'plus') +
      '<div class="ca-card-note">Widgets sit on the left panel, around the big cookie. Drag them anywhere — framed ones by their title bar, the rest from anywhere — and resize them from their corner. Hover for × and ⚙.</div>' +
      '<div class="ca-wgallery">' +
      // a card per kind of widget: picture, name, what it shows, Add / Remove
      '<div class="ca-wcard">' +
      `<div class="ca-wcard-ico">${I('star', 26)}</div>` +
      `<div class="ca-wcard-name">Macro buttons${favs.length ? ` <span class="ca-badge">${favs.length} placed</span>` : ''}</div>` +
      `<div class="ca-wcard-desc">★ a macro (or a spell on the ${C.link('Grimoire', 'wizard')} page) and it gets its own round button here: click to switch it on/off or run it.</div>` +
      `<div class="ca-wcard-foot">${C.button(`${I('open', 12)} Macros`, 'data-ca="open-macros"', 'ca-btn-small')}</div>` +
      '</div>';
    types
      .filter((t) => !t.hidden)
      .forEach((t) => {
        const placed = widgets.filter((w) => w.type === t.id).length;
        h +=
          `<div class="ca-wcard${placed ? ' placed' : ''}">` +
          `<div class="ca-wcard-ico">${I(t.icon, 26)}</div>` +
          `<div class="ca-wcard-name">${esc(t.name)}${placed ? ` <span class="ca-badge">${placed} placed</span>` : ''}</div>` +
          `<div class="ca-wcard-desc">${esc(t.desc)}</div>` +
          '<div class="ca-wcard-foot">' +
          (t.single && placed
            ? C.button('Remove', `data-w-page-remove="${t.id}"`, 'ca-btn-small ca-btn-off')
            : C.button(`${I('plus', 12)} Add`, `data-w-page-add="${t.id}"`, 'ca-btn-small ca-btn-on')) +
          '</div></div>';
      });
    h += '</div></div>';
    h +=
      `<div class="ca-card">${C.cardHead('Options', 'settings')}<div class="ca-optgrid">${S().optionsIn('widgets').map(CA.UI.Menu.optionTile).join('')}</div><div class="ca-list">` +
      '<div class="ca-row ca-row-option">' +
      `<span class="ca-row-ico">${I('trash', 16)}</span>` +
      '<div class="ca-row-text"><div class="ca-row-name">Remove all widgets</div><div class="ca-row-desc">Clears the left panel (and un-stars your macros).</div></div>' +
      C.button('Remove all', 'data-w-page-clear data-arm-label="Remove them all?"', 'ca-btn-small ca-btn-off') +
      '</div></div></div>';
    return h;
  }

  let pageRoot = null;
  function onPageHover(e) {
    const el = e.target.closest && e.target.closest('[data-wlink]');
    setLinked(el ? el.dataset.wlink : null);
  }
  function onLayerHover(e) {
    const el = e.target.closest && e.target.closest('[data-widget]');
    setLinked(el ? el.dataset.widget : null);
  }
  function onPageClick(e) {
    const pre = e.target.closest('[data-w-preset],[data-w-snap]');
    if (pre) {
      e.stopPropagation();
      CA.Util.sound('snd/tick.mp3');
      const w = get(editing);
      if (!w) return;
      if (pre.dataset.wPreset === 'font') w.font = Number(pre.dataset.val);
      else if (pre.dataset.wPreset === 'scale') w.scale = Number(pre.dataset.val) / 100;
      else if (pre.dataset.wSnap) {
        const [x, y] = pre.dataset.wSnap.split(',').map(Number);
        w.x = x;
        w.y = y;
      }
      changed();
      CA.UI.Menu.render();
      return;
    }
    const t = e.target.closest('[data-w-page-add],[data-w-page-remove],[data-w-page-clear],[data-w-page-edit],[data-w-page-del],[data-w-edit-done]');
    if (!t) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    const d = t.dataset;
    if ('wPageAdd' in d) {
      add(d.wPageAdd);
      if (!S().get('widgetsShown')) S().set('widgetsShown', true);
    } else if ('wPageRemove' in d) widgets.filter((w) => w.type === d.wPageRemove).forEach((w) => remove(w.id));
    else if ('wPageEdit' in d) {
      editing = d.wPageEdit;
      CA.UI.Menu.render();
      revealEditor();
      return;
    }
    else if ('wPageDel' in d) remove(d.wPageDel);
    else if ('wEditDone' in d) editing = null;
    else if ('wPageClear' in d) {
      if (!CA.UI.Menu.armed(t)) return;
      widgets = widgets.filter((w) => w.type === 'macro');
      widgets.forEach((w) => CA.Macros.setFav(w.macro, false));
      editing = null;
      changed();
    }
    CA.UI.Menu.render();
  }

  function init() {
    CA.UI.WidgetTypes.register();
    S().defineOption({ key: 'widgetsShown', group: 'widgets', icon: 'widget', name: 'Show widgets', desc: 'Show your widgets on the left panel (they stay saved while hidden).', default: true });
    S().defineOption({ key: 'widgetsLocked', group: 'widgets', icon: 'grip', name: 'Lock widgets', desc: 'Stop widgets from being dragged around by accident (buttons still work).', default: false });
    CA.UI.Pages.register({
      id: 'widgets',
      label: 'Widgets',
      icon: 'widget',
      order: 80,
      group: 'custom',
      html: pageHtml,
      mount: (root) => {
        pageRoot = root;
        root.addEventListener('click', onPageClick);
        root.addEventListener('input', onEditorInput);
        root.addEventListener('change', onEditorInput);
        root.addEventListener('mouseover', onPageHover);
        refreshGlow(); // the edited widget glows
      },
      unmount: () => {
        if (pageRoot) {
          pageRoot.removeEventListener('click', onPageClick);
          pageRoot.removeEventListener('input', onEditorInput);
          pageRoot.removeEventListener('change', onEditorInput);
          pageRoot.removeEventListener('mouseover', onPageHover);
        }
        pageRoot = null;
        linked = null;
        refreshGlow();
      },
      tick: syncPage,
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

  return { init, defineType, types: () => types.slice(), add, remove, list, get, has, serialize, load, render, tick, reconcile, openSettings, editing: () => editing, morph };
})();
