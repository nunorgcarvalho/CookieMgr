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
  const BUTTON_PX = 44; // macro button size incl. spacing, for laying out new ones
  const SCALE_MIN = 0.6;
  const SCALE_MAX = 3;
  const FONT_MIN = 60;
  const FONT_MAX = 200;
  const MIN_W = 140;
  const MIN_H = 60;
  const SAVED = ['count', 'types', 'stats', 'font', 'title']; // per-widget settings that are saved
  const TRANSIENT = ['ca-shake']; // classes a refresh leaves alone
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
    host.appendChild(layer);
    return layer;
  }

  const RESIZE = '<span class="ca-w-resize" data-w-resize aria-label="Resize"></span>';
  const fontOf = (w) => Math.max(FONT_MIN, Math.min(FONT_MAX, w.font || 100)) / 100;

  function frameHtml(w) {
    const t = typeById[w.type];
    const fs = `--wfs:${fontOf(w)}`;
    if (t.bare) {
      return (
        `<div class="ca-w ca-w-bare ca-w-${w.type}" data-widget="${w.id}" data-w-drag style="${fs}">` +
        `<div class="ca-w-body" data-w-body>${safeHtml(t, w)}</div>` +
        `<button type="button" class="ca-w-x" data-w-remove aria-label="${w.type === 'macro' ? 'Remove (un-favourites the macro)' : 'Remove widget'}">${I('close', 8)}</button>` +
        `<button type="button" class="ca-w-x ca-w-gear" data-w-settings aria-label="Settings">${I('settings', 8)}</button>` +
        RESIZE +
        '</div>'
      );
    }
    return (
      `<div class="ca-w${w.collapsed ? ' collapsed' : ''}${w.h ? ' sized' : ''}" data-widget="${w.id}" style="${fs};width:${w.w || t.width}px${w.h && !w.collapsed ? `;height:${w.h}px` : ''}">` +
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
      if (m.mode !== 'once') CA.Util.sound(CA.Macros.isOn(m.id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3'); // once macros: run() picks the sound
      if (m.mode === 'once') CA.UI.MacrosPage.run(m.id, trig);
      else CA.Macros.trigger(m.id);
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
  }

  /** Applies one setting change from the editor and redraws the widget. */
  function setOption(w, key, value) {
    w[key] = value;
    changed();
  }

  function editorHtml(w) {
    const t = typeById[w.type];
    const C = CA.UI.C;
    const field = (label, input, hint) => `<div class="ca-weditor-row"><span class="ca-field-label">${label}</span>${input}${hint ? `<span class="ca-hint">${hint}</span>` : ''}</div>`;
    let h =
      `<div class="ca-card ca-weditor" data-w-editor="${esc(w.id)}">` +
      C.cardHead(`${esc(nameOf(w))} — settings`, t.icon, `<div class="ca-card-meta">${C.button('Done', 'data-w-edit-done', 'ca-btn-small ca-btn-on')}</div>`) +
      '<div class="ca-weditor-body">';
    h += field('Text size', `<input type="range" min="${FONT_MIN}" max="${FONT_MAX}" step="5" value="${Math.round(fontOf(w) * 100)}" data-w-opt="font" data-type="number"><span class="ca-range-val">${Math.round(fontOf(w) * 100)}%</span>`);
    if (t.resize === 'scale') {
      h += field('Size', `<input type="range" min="${SCALE_MIN * 100}" max="${SCALE_MAX * 100}" step="5" value="${Math.round(scaleOf(w) * 100)}" data-w-opt="scale" data-type="percent"><span class="ca-range-val">${Math.round(scaleOf(w) * 100)}%</span>`, 'or drag its corner');
    } else {
      h += field('Title', `<input type="text" maxlength="40" value="${esc(w.title || '')}" placeholder="${esc(t.name)}" data-w-opt="title" data-type="text">`);
    }
    (t.settings || []).forEach((s) => {
      const cur = w[s.key] !== undefined ? w[s.key] : s.default;
      if (s.type === 'number') {
        h += field(esc(s.label), `<input type="number" min="${s.min}" max="${s.max}" value="${esc(cur)}" data-w-opt="${s.key}" data-type="number" data-min="${s.min}" data-max="${s.max}">${s.unit ? `<em>${esc(s.unit)}</em>` : ''}`);
      } else if (s.type === 'multi') {
        const chosen = new Set(cur || []);
        h +=
          `<div class="ca-weditor-row"><span class="ca-field-label">${esc(s.label)}</span></div><div class="ca-members">` +
          s
            .options()
            .map(
              (o) =>
                `<label class="ca-member${chosen.has(o.v) ? ' on' : ''}"><input type="checkbox" data-w-multi="${s.key}" value="${esc(o.v)}"${chosen.has(o.v) ? ' checked' : ''}>` +
                `${o.icon ? `<span style="color:${o.color || 'inherit'}">${I(o.icon, 13)}</span>` : ''}<span>${esc(o.label)}</span></label>`
            )
            .join('') +
          '</div>';
      }
    });
    h += '</div></div>';
    return h;
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
    } else v = String(v).trim().slice(0, 40);
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

    // what's placed, each with its settings
    if (widgets.length) {
      h += `<div class="ca-card">${C.cardHead('Your widgets', 'widget')}<div class="ca-list">`;
      widgets.forEach((w) => {
        const t = typeById[w.type];
        if (!t) return;
        h +=
          `<div class="ca-row${w.id === editing ? ' on' : ''}">` +
          `<span class="ca-row-ico">${I(t.icon, 16)}</span>` +
          `<div class="ca-row-text"><div class="ca-row-name">${esc(nameOf(w))}</div><div class="ca-row-desc">${esc(w.type === 'macro' ? 'Macro button' : t.name)}</div></div>` +
          '<div class="ca-controls">' +
          C.button(`${I('settings', 12)} Settings`, `data-w-page-edit="${esc(w.id)}"`, 'ca-btn-small') +
          `<button type="button" class="ca-iconbtn" data-w-page-del="${esc(w.id)}" title="Remove">${I('close', 12)}</button>` +
          '</div></div>';
      });
      h += '</div></div>';
    }

    h +=
      '<div class="ca-card">' +
      C.cardHead('Add a widget', 'plus') +
      '<div class="ca-card-note">Widgets sit on the left panel, around the big cookie. Drag them anywhere — framed ones by their title bar, the rest from anywhere — and resize them from their corner. Hover for × and ⚙.</div>' +
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
    const t = e.target.closest('[data-w-page-add],[data-w-page-remove],[data-w-page-clear],[data-w-page-edit],[data-w-page-del],[data-w-edit-done]');
    if (!t) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    const d = t.dataset;
    if ('wPageAdd' in d) {
      add(d.wPageAdd);
      if (!S().get('widgetsShown')) S().set('widgetsShown', true);
    } else if ('wPageRemove' in d) widgets.filter((w) => w.type === d.wPageRemove).forEach((w) => remove(w.id));
    else if ('wPageEdit' in d) editing = d.wPageEdit;
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
      html: pageHtml,
      mount: (root) => {
        pageRoot = root;
        root.addEventListener('click', onPageClick);
        root.addEventListener('input', onEditorInput);
        root.addEventListener('change', onEditorInput);
      },
      unmount: () => {
        if (pageRoot) {
          pageRoot.removeEventListener('click', onPageClick);
          pageRoot.removeEventListener('input', onEditorInput);
          pageRoot.removeEventListener('change', onEditorInput);
        }
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

  return { init, defineType, types: () => types.slice(), add, remove, list, get, has, serialize, load, render, tick, reconcile, openSettings, editing: () => editing, morph };
})();
