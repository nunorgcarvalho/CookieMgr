// The Macros page (formerly Autoclickers): every macro (features/macros.js) as a row with its
// trigger, steps, hotkey, favourite star and switch; a live "Running now" status of every active
// macro's actions; and an editor for building your own macros out of actions.
//
// The status block (status()) and macro rows (row()) are also used elsewhere: rows on the
// Stock market page, the status block as a widget (ui/widgets.js).

CA.UI = CA.UI || {};

CA.UI.MacrosPage = (() => {
  const C = () => CA.UI.C;
  const I = (name, size) => CA.UI.Icons.html(name, size);
  const esc = (s) => CA.Util.escapeHtml(s);
  const M = () => CA.Macros;
  const STATUS_MS = 500;

  const SECTIONS = [
    { id: 'autoclickers', title: 'Autoclickers', icon: 'cookie' },
    { id: 'stocks', title: 'Stock market', icon: 'stocks' },
    { id: 'grimoire', title: 'Wizard tower', icon: 'wizard' },
  ];
  const ICONS = ['bolt', 'cookie', 'star', 'sparkle', 'play', 'clock', 'stocks', 'dollar', 'wizard', 'wrinkler', 'lump', 'trophy', 'graphs', 'tag', 'marker', 'ascend'];
  const MODES = [
    { v: 'repeat', label: 'Repeat', icon: 'refresh', hint: 'While it’s on, runs its steps every so often.' },
    { v: 'when', label: 'When…', icon: 'filter', hint: 'While it’s on, watches for a condition and runs its steps when it happens.' },
    { v: 'once', label: 'Once', icon: 'play', hint: 'No on/off: its button or hotkey runs the steps one time.' },
  ];

  let root = null;
  let draft = null; // macro being edited (a copy), or null
  let draftError = '';
  let timer = null;

  // ---- pieces shared with other pages ----------------------------------------------------

  /** The picture for a macro: a game sprite/image, or one of our icons. */
  function icon(m, small) {
    const ic = m.icon || {};
    if (ic.ico) return `<span class="ca-icon ca-icon-ico${small ? ' small' : ''}">${I(ic.ico, small ? 16 : 24)}</span>`;
    return C().icon({ img: ic.img, icon: ic.sprite });
  }

  function ago(t) {
    if (!t) return 'never';
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 2) return 'just now';
    return `${CA.UI.Plot.fmt.span(s)} ago`;
  }

  function stepChip(step) {
    const a = CA.Actions.get(step.action);
    return `<span class="ca-step">${I(a ? a.icon : 'close', 12)}${esc(CA.Actions.describe(step))}</span>`;
  }

  /** One macro as a row: picture, name + trigger, steps, status, and its controls. */
  function row(m) {
    const once = m.mode === 'once';
    const fav = M().isFav(m.id);
    let h =
      `<div class="ca-row ca-macro" data-macro-row="${esc(m.id)}">` +
      icon(m) +
      '<div class="ca-row-text">' +
      `<div class="ca-row-name">${esc(m.name)} <span class="ca-badge ca-badge-${m.mode}">${esc(M().triggerText(m))}</span></div>` +
      (m.desc ? `<div class="ca-row-desc">${esc(m.desc)}</div>` : '') +
      `<div class="ca-steps">${m.steps.map(stepChip).join('<span class="ca-step-arrow">›</span>')}</div>` +
      '<div class="ca-macro-status" data-macro-status></div>' +
      '</div>' +
      '<div class="ca-controls">' +
      `<button type="button" class="ca-iconbtn ca-fav${fav ? ' on' : ''}" data-ca="macro-fav" data-id="${esc(m.id)}" title="${fav ? 'Remove from favourites' : 'Add to favourites (shortcut widgets)'}">${I(fav ? 'star' : 'starOutline', 15)}</button>`;
    if (m.builtin) h += `<button type="button" class="ca-iconbtn" data-ca="macro-dup" data-id="${esc(m.id)}" title="Duplicate into your own editable macro">${I('plus', 14)}</button>`;
    else {
      h += `<button type="button" class="ca-iconbtn" data-ca="macro-edit" data-id="${esc(m.id)}" title="Edit">${I('edit', 14)}</button>`;
      h += `<button type="button" class="ca-iconbtn" data-ca="macro-dup" data-id="${esc(m.id)}" title="Duplicate">${I('plus', 14)}</button>`;
    }
    h += C().hotkey(`macro.${m.id}`);
    h += once
      ? C().button(`${I('play', 12)} Run`, `data-ca="macro-run" data-id="${esc(m.id)}"`, 'ca-btn-small ca-btn-run')
      : C().toggle(false, `data-ca="macro-toggle" data-id="${esc(m.id)}"`, m.name);
    h += '</div></div>';
    return h;
  }

  /** Live status of every running macro and its actions — the "Running now" block / widget. */
  function status() {
    const ids = M().runningIds();
    if (!ids.length) return '<div class="ca-status-empty">Nothing running. Switch a macro on below, or press its hotkey.</div>';
    const { span, beautify } = CA.UI.Plot.fmt;
    return ids
      .map((id) => {
        const m = M().get(id);
        if (!m) return '';
        const st = M().status(id);
        const up = span((Date.now() - M().since(id)) / 1000);
        let h =
          `<div class="ca-status-macro" data-status-macro="${esc(id)}">` +
          `<div class="ca-status-head">${icon(m, true)}<b>${esc(m.name)}</b><span>${esc(M().triggerText(m))} · on for ${up}</span>` +
          `<button type="button" class="ca-iconbtn" data-ca="macro-toggle" data-id="${esc(id)}" title="Switch off">${I('close', 12)}</button></div>`;
        m.steps.forEach((step, i) => {
          const s = st.steps[i] || {};
          const a = CA.Actions.get(step.action) || {};
          const avail = a.available ? a.available() : true;
          h +=
            `<div class="ca-status-step${s.error ? ' err' : !avail ? ' idle' : s.lastAt && Date.now() - s.lastAt < 3000 ? ' hot' : ''}">` +
            `${I(a.icon || 'close', 12)}<span class="ca-status-name">${esc(CA.Actions.describe(step))}</span>` +
            `<span class="ca-status-val">${s.error ? esc(s.error) : !avail ? 'not available' : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + esc(a.unit) : ''} · ${ago(s.lastAt)}`}</span></div>`;
        });
        return h + '</div>';
      })
      .join('');
  }

  // ---- the editor ----------------------------------------------------------------------------

  function blankDraft() {
    return { id: null, name: '', desc: '', icon: { ico: 'bolt' }, mode: 'repeat', every: 1000, steps: [{ action: 'pop.golden', params: {} }], inAll: false, when: blankWhen() };
  }
  const blankCond = () => ({ cond: 'buff', params: {}, not: false });
  const blankWhen = () => ({ all: [blankCond()], edge: 'rise' });

  function field(p, value, path) {
    const opts = typeof p.options === 'function' ? p.options() : p.options || [];
    const v = value === undefined ? p.default : value;
    let input;
    if (p.type === 'select') {
      const has = opts.some((o) => String(o.v) === String(v));
      input =
        `<select data-edit="${path}" data-type="${typeof p.default === 'number' ? 'number' : 'string'}">` +
        (has || v === '' || v == null ? '' : `<option value="${esc(v)}" selected>${esc(v)}</option>`) +
        (v === '' ? '<option value="" selected disabled>Choose…</option>' : '') +
        opts.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(v) ? ' selected' : ''}>${esc(o.label)}</option>`).join('') +
        '</select>';
    } else if (p.type === 'bool') {
      input = `<input type="checkbox" data-edit="${path}" data-type="bool"${v ? ' checked' : ''}>`;
    } else {
      input = `<input type="number" step="any" data-edit="${path}" data-type="number" value="${esc(v)}"${p.min != null ? ` min="${p.min}"` : ''}>`;
    }
    return `<label class="ca-field"><span>${esc(p.label)}</span>${input}</label>`;
  }

  function actionSelect(step, i) {
    const groups = {};
    CA.Actions.all().forEach((a) => (groups[a.group] = groups[a.group] || []).push(a));
    return (
      `<select data-edit="steps.${i}.action" data-structural>` +
      Object.keys(groups)
        .map((g) => `<optgroup label="${esc(g)}">${groups[g].map((a) => `<option value="${a.id}"${a.id === step.action ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`)
        .join('') +
      '</select>'
    );
  }

  function editorHtml() {
    const d = draft;
    const mode = MODES.find((x) => x.v === d.mode);
    let h =
      '<div class="ca-card ca-editor" data-macro-editor>' +
      C().cardHead(d.id ? 'Edit macro' : 'New macro', 'edit') +
      '<div class="ca-editor-body">' +
      '<div class="ca-editor-row">' +
      `<label class="ca-field ca-grow"><span>Name</span><input type="text" maxlength="60" data-edit="name" value="${esc(d.name)}" placeholder="e.g. Pop everything"></label>` +
      `<label class="ca-field ca-grow"><span>Description</span><input type="text" maxlength="300" data-edit="desc" value="${esc(d.desc)}" placeholder="optional"></label>` +
      '</div>' +
      `<div class="ca-editor-row"><span class="ca-field-label">Icon</span><div class="ca-iconpick">${ICONS.map(
        (n) => `<button type="button" class="ca-iconbtn${(d.icon || {}).ico === n ? ' on' : ''}" data-edit-act="icon" data-val="${n}" title="${n}">${I(n, 16)}</button>`
      ).join('')}</div></div>` +
      `<div class="ca-editor-row"><span class="ca-field-label">Trigger</span><div class="ca-chipgroup">${MODES.map(
        (x) => `<button type="button" class="ca-chip${x.v === d.mode ? ' on' : ''}" data-edit-act="mode" data-val="${x.v}" title="${esc(x.hint)}">${I(x.icon, 12)} ${x.label}</button>`
      ).join('')}</div><span class="ca-hint">${esc(mode.hint)}</span></div>`;
    if (d.mode !== 'once') {
      h +=
        '<div class="ca-editor-row">' +
        `<label class="ca-field"><span>${d.mode === 'when' ? 'Check every' : 'Every'}</span><input type="number" step="any" min="${M().MIN_EVERY / 1000}" data-edit="everySec" data-type="number" value="${d.every / 1000}"><em>seconds</em></label>` +
        `<label class="ca-field ca-check"><input type="checkbox" data-edit="inAll" data-type="bool"${d.inAll ? ' checked' : ''}><span>Part of “All autoclickers”</span></label>` +
        '</div>';
    }
    if (d.mode === 'when') {
      const w = d.when;
      h += '<div class="ca-editor-block">';
      w.all.forEach((one, j) => {
        const cond = CA.Conditions.get(one.cond) || CA.Conditions.all()[0];
        h +=
          `<div class="ca-editor-row ca-cond"><span class="ca-field-label">${j ? 'and' : `${I('filter', 13)} When`}</span>` +
          `<select data-edit="when.all.${j}.cond" data-structural>${CA.Conditions.all()
            .map((c) => `<option value="${c.id}"${c.id === one.cond ? ' selected' : ''}>${esc(c.name)}</option>`)
            .join('')}</select>` +
          cond.params.map((p) => field(p, one.params[p.key], `when.all.${j}.params.${p.key}`)).join('') +
          `<label class="ca-field ca-check"><input type="checkbox" data-edit="when.all.${j}.not" data-type="bool"${one.not ? ' checked' : ''}><span>not</span></label>` +
          (w.all.length > 1 ? `<button type="button" class="ca-iconbtn" data-edit-act="cond-del" data-val="${j}" title="Remove this condition">${I('close', 12)}</button>` : '') +
          '</div>';
      });
      h +=
        '<div class="ca-editor-row">' +
        `<button type="button" class="ca-btn ca-btn-small" data-edit-act="cond-add">${I('plus', 12)} And…</button>` +
        `<label class="ca-field"><span>Run</span><select data-edit="when.edge"><option value="rise"${w.edge !== 'while' ? ' selected' : ''}>once each time it happens</option><option value="while"${w.edge === 'while' ? ' selected' : ''}>on every check while it holds</option></select></label>` +
        '</div></div>';
    }
    h += `<div class="ca-editor-row"><span class="ca-field-label">${I('bolt', 13)} Steps</span><span class="ca-hint">Run in order, every time the macro fires.</span></div><div class="ca-editor-steps">`;
    d.steps.forEach((s, i) => {
      const a = CA.Actions.get(s.action);
      h +=
        `<div class="ca-editor-step"><span class="ca-step-n">${i + 1}</span>` +
        actionSelect(s, i) +
        (a ? a.params.map((p) => field(p, s.params[p.key], `steps.${i}.params.${p.key}`)).join('') : '') +
        '<span class="ca-step-tools">' +
        `<button type="button" class="ca-iconbtn" data-edit-act="up" data-val="${i}" title="Move up"${i === 0 ? ' disabled' : ''}>▲</button>` +
        `<button type="button" class="ca-iconbtn" data-edit-act="down" data-val="${i}" title="Move down"${i === d.steps.length - 1 ? ' disabled' : ''}>▼</button>` +
        `<button type="button" class="ca-iconbtn" data-edit-act="del" data-val="${i}" title="Remove step">${I('close', 12)}</button>` +
        '</span></div>';
    });
    h +=
      `<button type="button" class="ca-btn ca-btn-small" data-edit-act="add">${I('plus', 12)} Add step</button></div>` +
      (draftError ? `<div class="ca-editor-error">${esc(draftError)}</div>` : '') +
      '<div class="ca-editor-actions">' +
      C().button(`${I('save', 13)} Save`, 'data-edit-act="save"', 'ca-btn-on') +
      C().button('Cancel', 'data-edit-act="cancel"') +
      (d.id ? C().button(`${I('trash', 13)} Delete`, 'data-edit-act="delete" data-arm-label="Delete this macro?"', 'ca-btn-off') : '') +
      '</div></div></div>';
    return h;
  }

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      o = o[k] = o[k] || {};
    }
    o[parts[parts.length - 1]] = value;
  }

  function onEditInput(e) {
    const el = e.target;
    if (!el.dataset || !el.dataset.edit || !draft) return;
    const type = el.dataset.type;
    let v = type === 'bool' ? el.checked : type === 'number' ? Number(el.value) : el.value;
    if (type === 'number' && !Number.isFinite(v)) return;
    if (el.dataset.edit === 'everySec') {
      draft.every = Math.round(v * 1000);
      return;
    }
    setPath(draft, el.dataset.edit, v);
    if ('structural' in el.dataset) {
      // a different action/condition: start from its own defaults
      const m = el.dataset.edit.match(/^steps\.(\d+)\.action$/);
      if (m) draft.steps[Number(m[1])].params = {};
      const c = el.dataset.edit.match(/^when\.all\.(\d+)\.cond$/);
      if (c) draft.when.all[Number(c[1])].params = {};
      renderEditor();
    }
  }

  function validate(d) {
    if (!d.name.trim()) return 'Give it a name.';
    if (!d.steps.length) return 'Add at least one step.';
    if (d.mode !== 'once' && !(d.every >= M().MIN_EVERY)) return `Run it at most every ${M().MIN_EVERY / 1000}s.`;
    const self = d.steps.find((s) => (s.action === 'macro.run' || s.action === 'macro.set') && d.id && s.params.macro === d.id);
    if (self) return 'A macro can’t switch or run itself.';
    const missing = d.steps.find((s) => (s.action === 'macro.run' || s.action === 'macro.set') && !s.params.macro);
    if (missing) return 'Pick which macro the step should switch or run.';
    return '';
  }

  function onEditAct(t) {
    const act = t.dataset.editAct;
    const i = Number(t.dataset.val);
    const d = draft;
    if (act === 'icon') d.icon = { ico: t.dataset.val };
    else if (act === 'mode') {
      d.mode = t.dataset.val;
      if (d.mode === 'when' && !(d.when && d.when.all && d.when.all.length)) d.when = blankWhen();
      if (d.mode === 'when' && d.every >= 1000) d.every = 250;
    } else if (act === 'cond-add') d.when.all.push(blankCond());
    else if (act === 'cond-del') d.when.all.splice(i, 1);
    else if (act === 'add') d.steps.push({ action: 'pop.golden', params: {} });
    else if (act === 'del') d.steps.splice(i, 1);
    else if (act === 'up' && i > 0) [d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]];
    else if (act === 'down' && i < d.steps.length - 1) [d.steps[i + 1], d.steps[i]] = [d.steps[i], d.steps[i + 1]];
    else if (act === 'cancel') {
      draft = null;
      draftError = '';
      return rerender();
    } else if (act === 'delete') {
      if (!CA.UI.Menu.armed(t)) return;
      M().remove(d.id);
      draft = null;
      return rerender();
    } else if (act === 'save') {
      // fill in each param's default so the saved macro is explicit
      d.steps.forEach((s) => (s.params = CA.Actions.paramsFor(s.action, s.params)));
      if (d.mode === 'when') d.when.all.forEach((c) => (c.params = CA.Conditions.paramsFor(c.cond, c.params)));
      draftError = validate(d);
      if (draftError) return renderEditor();
      try {
        const saved = M().save(d);
        CA.Util.notify('Macro saved', esc(saved.name), CA.ICON, 2);
        draft = null;
        return rerender();
      } catch (e) {
        draftError = e.message;
      }
    }
    renderEditor();
  }

  function renderEditor() {
    const el = root && root.querySelector('[data-macro-editor]');
    if (el) el.outerHTML = editorHtml();
  }

  /** Opens the editor on macro `id`, or a new macro (optionally starting from `preset` fields). */
  function edit(id, preset) {
    const m = id ? M().get(id) : null;
    draft = m ? JSON.parse(JSON.stringify(m)) : { ...blankDraft(), ...(preset || {}) };
    if (!draft.when || !Array.isArray(draft.when.all)) draft.when = blankWhen();
    if (CA.Settings.get('tab') !== 'clickers' && CA.UI.Menu.isOpen()) CA.Settings.set('tab', 'clickers');
    draftError = '';
    rerender();
    const el = root && root.querySelector('[data-macro-editor]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  // ---- page ------------------------------------------------------------------------------

  function sectionCard(sec, macros, extraHead, extraTop) {
    return (
      '<div class="ca-card">' +
      C().cardHead(sec.title, sec.icon, extraHead || '') +
      (extraTop || '') +
      `<div class="ca-list">${macros.map(row).join('')}</div>` +
      '</div>'
    );
  }

  function html() {
    const all = M().list();
    let h =
      '<div class="ca-card ca-card-status">' +
      C().cardHead(
        'Running now',
        'play',
        '<div class="ca-card-meta"><span class="ca-pill" data-ca-count></span>' +
          `<button type="button" class="ca-iconbtn" data-ca="widget-add" data-type="status" title="Pop this out as a widget on the left panel">${I('widget', 13)}</button>` +
          `<button type="button" class="ca-iconbtn" data-ca="widget-add" data-type="shortcuts" title="Put your ★ favourite macros on the left panel as shortcut buttons">${I('star', 13)}</button></div>`
      ) +
      `<div class="ca-status" data-macro-statusblock>${status()}</div>` +
      '</div>';
    if (draft) h += editorHtml();
    SECTIONS.forEach((sec) => {
      const list = all.filter((m) => m.builtin && m.section === sec.id);
      if (!list.length) return;
      const master =
        sec.id === 'autoclickers'
          ? '<div class="ca-row ca-row-master">' +
            C().icon({ icon: CA.ICON }) +
            '<div class="ca-row-text"><div class="ca-row-name">All autoclickers</div>' +
            '<div class="ca-row-desc">The hotkey turns everything on &mdash; or off, if everything is already running.</div></div>' +
            '<div class="ca-controls">' +
            C().button('All on', 'data-ca="all-on"', 'ca-btn-on') +
            C().button('All off', 'data-ca="all-off"', 'ca-btn-off') +
            C().hotkey('clickers.toggleAll') +
            '</div></div>'
          : '';
      h += sectionCard(sec, list, '', master);
    });
    const mine = all.filter((m) => !m.builtin);
    h +=
      '<div class="ca-card">' +
      C().cardHead('Your macros', 'edit', `<div class="ca-card-meta">${C().button(`${I('plus', 12)} New macro`, 'data-ca="macro-new"', 'ca-btn-small')}</div>`) +
      (mine.length
        ? `<div class="ca-list">${mine.map(row).join('')}</div>`
        : '<div class="ca-card-note">Chain actions into your own macros: pop everything at once, sell stocks when a value crosses a line, switch other macros on when an effect starts… Built-in macros can be duplicated as a starting point.</div>') +
      '</div>';
    h += `<div class="ca-card">${C().cardHead('Options', 'settings')}<div class="ca-list">${CA.Settings.optionsIn('macros').map(CA.UI.Menu.optionRow).join('')}</div></div>`;
    return h;
  }

  /** Brings every macro row and status block inside `el` up to date. */
  function sync(el) {
    if (!el) return;
    el.querySelectorAll('[data-macro-row]').forEach((r) => {
      const id = r.dataset.macroRow;
      const m = M().get(id);
      if (!m) return;
      const on = M().isOn(id);
      r.classList.toggle('on', on);
      const sw = r.querySelector('.ca-switch');
      if (sw) {
        sw.classList.toggle('on', on);
        sw.setAttribute('aria-checked', String(on));
      }
      const st = r.querySelector('[data-macro-status]');
      if (st) {
        const s = M().status(id);
        const n = s ? s.steps.reduce((x, y) => x + (y.total || 0), 0) : 0;
        st.textContent = on ? `Running · ${CA.UI.Plot.fmt.span((Date.now() - M().since(id)) / 1000)}${n ? ` · ${n.toLocaleString()} done` : ''}` : s && s.lastRun ? `Last ran ${ago(s.lastRun)}` : '';
      }
    });
    const block = el.querySelector('[data-macro-statusblock]');
    if (block) block.innerHTML = status();
    const count = el.querySelector('[data-ca-count]');
    if (count) {
      const n = M().activeCount();
      count.textContent = n ? `${n} running` : 'all off';
      count.classList.toggle('on', n > 0);
    }
    const allOn = el.querySelector('[data-ca="all-on"]');
    if (allOn) allOn.disabled = M().allOn();
    const allOff = el.querySelector('[data-ca="all-off"]');
    if (allOff) allOff.disabled = !M().inAll().some((m) => M().isOn(m.id));
  }

  function rerender() {
    if (CA.UI.Menu.isOpen()) CA.UI.Menu.render();
  }

  /** Clicks on macro controls anywhere in the panel (menu.js forwards data-ca="macro-…"). */
  function handle(kind, t) {
    const id = t.dataset.id;
    switch (kind) {
      case 'macro-toggle':
        CA.Util.sound(M().isOn(id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        M().toggle(id);
        return true;
      case 'macro-run':
        CA.Util.sound('snd/clickOn2.mp3');
        M().runOnce(id);
        return true;
      case 'macro-fav':
        CA.Util.sound('snd/tick.mp3');
        M().setFav(id, !M().isFav(id));
        rerender();
        return true;
      case 'macro-dup': {
        CA.Util.sound('snd/tick.mp3');
        const copy = M().duplicate(id);
        if (CA.Settings.get('tab') !== 'clickers') CA.UI.Menu.openPage('clickers');
        if (copy) edit(copy.id);
        return true;
      }
      case 'macro-edit':
        CA.Util.sound('snd/tick.mp3');
        edit(id);
        return true;
      case 'macro-new':
        CA.Util.sound('snd/tick.mp3');
        edit(null);
        return true;
      case 'widget-add': {
        CA.Util.sound('snd/tick.mp3');
        const type = t.dataset.type;
        const had = CA.UI.Widgets.has(type);
        CA.UI.Widgets.add(type);
        if (!CA.Settings.get('widgetsShown')) CA.Settings.set('widgetsShown', true);
        const name = (CA.UI.Widgets.types().find((x) => x.id === type) || {}).name || 'Widget';
        CA.Util.notify(name, had && type !== 'shortcuts' ? 'Already on the left panel.' : 'Added to the left panel — drag it by its title bar.', CA.ICON, 2);
        return true;
      }
      case 'all-on':
        CA.Util.sound('snd/clickOn2.mp3');
        M().setAll(true);
        return true;
      case 'all-off':
        CA.Util.sound('snd/clickOff2.mp3');
        M().setAll(false);
        return true;
      default:
        return false;
    }
  }

  function onRootClick(e) {
    const t = e.target.closest('[data-edit-act]');
    if (!t || !draft) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    onEditAct(t);
  }

  function mount(el) {
    unmount();
    root = el;
    root.addEventListener('click', onRootClick);
    root.addEventListener('change', onEditInput);
    root.addEventListener('input', onEditInput);
    sync(root);
    timer = setInterval(() => root && root.isConnected && sync(root), STATUS_MS);
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (root) {
      root.removeEventListener('click', onRootClick);
      root.removeEventListener('change', onEditInput);
      root.removeEventListener('input', onEditInput);
    }
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'clickers', label: 'Macros', icon: 'bolt', order: 10, html, mount, unmount, tick: () => sync(root) });
  }

  return { init, row, status, sync, handle, icon, edit, draft: () => draft };
})();
