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
    { id: 'stocks', title: 'Stock market', icon: 'stocks', page: 'stocks' },
    { id: 'grimoire', title: 'Grimoire', icon: 'wizard', page: 'wizard' },
    { id: 'garden', title: 'Garden', icon: 'leaf', page: 'garden' },
    { id: 'buying', title: 'Buying', icon: 'dollar' },
    { id: 'upkeep', title: 'Seasons, lumps & the dragon', icon: 'calendar' },
  ];
  const ICONS = ['bolt', 'cookie', 'star', 'sparkle', 'play', 'clock', 'stocks', 'dollar', 'wizard', 'wrinkler', 'lump', 'trophy', 'graphs', 'tag', 'marker', 'ascend'];
  const MODES = [
    { v: 'repeat', label: 'Repeat', icon: 'refresh', hint: 'While it’s on, runs its steps every so often.' },
    { v: 'when', label: 'When…', icon: 'filter', hint: 'While it’s on, watches for a condition and runs its steps when it happens.' },
    { v: 'once', label: 'Once', icon: 'play', hint: 'No on/off: its button or hotkey runs the steps one time.' },
    { v: 'group', label: 'Group', icon: 'widget', hint: 'A switch for several macros at once: on turns them all on, off turns them all off.' },
    { v: 'flow', label: 'Flow', icon: 'play', hint: 'An agent: blocks in order, with waits, ifs, loops and branches side by side.' },
  ];

  let root = null;
  const openSettings = new Set(); // cards whose ⚙ settings are unfolded
  let draft = null; // macro being edited (a copy), or null
  let draftError = '';
  let timer = null;

  // ---- pieces shared with other pages ----------------------------------------------------

  /** The picture for a macro: a game sprite/image, or one of our icons. */
  function icon(m, small) {
    const ic = m.icon || {};
    if (ic.ico) return `<span class="ca-icon ca-icon-ico${small ? ' small' : ''}">${I(ic.ico, small ? 16 : 24)}</span>`;
    return C().icon({ img: ic.img, icon: ic.sprite, sheet: ic.sheet });
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

  function memberChips(m) {
    const members = M().membersOf(m);
    if (!members.length) return '<span class="ca-step">no members</span>';
    return members.map((x) => `<span class="ca-step ca-step-member">${icon(x, true)}${esc(x.name)}</span>`).join('');
  }

  // how often a built-in can run (ms), offered in its settings
  const EVERY = [50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000];
  const everyLabel = (ms) => (ms < 1000 ? `${Math.round(1000 / ms)}× a second` : ms < 60000 ? `every ${ms / 1000}s` : `every ${ms / 60000} min`);

  /** A built-in's settings as [{ label, html, summary }]: how often it runs, then its actions' choices. */
  function settingsOf(m) {
    if (!m.builtin) return [];
    const out = [];
    if (m.mode === 'repeat' || m.mode === 'when' || m.mode === 'flow') {
      const cur = M().everyOf(m);
      const opts = EVERY.filter((ms) => ms >= M().MIN_EVERY).concat(EVERY.includes(cur) ? [] : [cur]).sort((a, b) => a - b);
      out.push({
        label: m.mode === 'when' ? 'Check' : m.mode === 'flow' ? 'A pass' : 'Run',
        summary: everyLabel(cur),
        html: `<select data-macro-every="${esc(m.id)}">${opts.map((ms) => `<option value="${ms}"${ms === cur ? ' selected' : ''}>${everyLabel(ms)}</option>`).join('')}</select>`,
      });
    }
    const fo = M().flowOptsOf(m);
    (m.flowOptions || []).forEach((o) => {
      const cur = fo[o.key];
      const list = typeof o.options === 'function' ? o.options() : o.options || [];
      const name = (v) => (list.find((x) => x.v === v) || { label: v }).label;
      if (o.type === 'order') {
        // the chosen ones in order (▲ ▼ ×), then the rest to add back
        const chosen = (Array.isArray(cur) ? cur : []).filter((v) => list.some((x) => x.v === v));
        const rest = list.filter((x) => !chosen.includes(x.v));
        const btn = (op, v, label, title, dis) => `<button type="button" class="ca-iconbtn" data-ca="macro-order" data-id="${esc(m.id)}" data-key="${esc(o.key)}" data-op="${op}" data-v="${esc(v)}" title="${title}"${dis ? ' disabled' : ''}>${label}</button>`;
        out.push({
          label: o.label,
          wide: true,
          summary: chosen.map(name).join(' → '),
          html:
            '<div class="ca-order">' +
            chosen
              .map((v, i) => `<div class="ca-order-item"><span class="ca-order-n">${i + 1}</span><span class="ca-order-name">${esc(name(v))}${i === chosen.length - 1 ? ' <em>kept</em>' : ''}</span>${btn('up', v, '▲', 'Earlier', i === 0)}${btn('down', v, '▼', 'Later', i === chosen.length - 1)}${btn('del', v, I('close', 10), 'Leave it out', chosen.length < 2)}</div>`)
              .join('') +
            (rest.length ? `<div class="ca-order-rest">${rest.map((x) => `<button type="button" class="ca-chip" data-ca="macro-order" data-id="${esc(m.id)}" data-key="${esc(o.key)}" data-op="add" data-v="${esc(x.v)}">${I('plus', 10)} ${esc(x.label)}</button>`).join('')}</div>` : '') +
            '</div>',
        });
      } else {
        out.push({
          label: o.label,
          summary: name(cur),
          html: `<select data-macro-flowopt="${esc(m.id)}" data-key="${esc(o.key)}">${list.map((x) => `<option value="${esc(x.v)}"${x.v === cur ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select>`,
        });
      }
    });
    const steps = M().stepsOf(m);
    (m.options || []).forEach((o) => {
      const a = CA.Actions.get(steps[o.step].action);
      const p = a && a.params.find((x) => x.key === o.key);
      if (!p) return;
      const cur = CA.Actions.paramsFor(steps[o.step].action, steps[o.step].params)[o.key];
      const attrs = `data-macro-param="${esc(m.id)}" data-step="${o.step}" data-key="${esc(o.key)}"`;
      let html;
      let summary;
      if (p.type === 'bool') {
        html = `<input type="checkbox" ${attrs} data-type="bool"${cur ? ' checked' : ''}>`;
        summary = cur ? p.label : `no: ${p.label.toLowerCase()}`;
      } else if (p.type === 'number') {
        html = `<input type="number" step="any" ${attrs} data-type="number" value="${esc(cur)}"${p.min != null ? ` min="${p.min}"` : ''}>`;
        summary = `${p.label}: ${cur}`;
      } else {
        const list = typeof p.options === 'function' ? p.options() : p.options || [];
        const sel = list.find((x) => String(x.v) === String(cur));
        html = `<select ${attrs}>${list.map((x) => `<option value="${esc(x.v)}"${String(x.v) === String(cur) ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select>`;
        summary = sel ? sel.label : String(cur);
      }
      out.push({ label: p.label, html, summary, shift: !!(m.shift && m.shift.step === o.step && m.shift.key === o.key) });
    });
    return out;
  }

  /** A built-in's settings as fields (rows show them inline; cards in their ⚙ panel). */
  function optionsHtml(m) {
    const set = settingsOf(m);
    if (!set.length) return '';
    return (
      '<div class="ca-macro-options">' +
      set.map((x) => (x.wide ? `<div class="ca-field ca-field-wide"><span>${esc(x.label)}</span>${x.html}</div>` : `<label class="ca-field"><span>${esc(x.label)}</span>${x.html}${x.shift ? '<em class="ca-shift-hint">shift-click its button</em>' : ''}</label>`)).join('') +
      '</div>'
    );
  }

  /** The settings in a few words, for a card with its settings folded away. */
  const settingsSummary = (m) =>
    settingsOf(m)
      .map((x) => x.summary)
      .join(' · ');

  /** What each step has done, for a macro that's running (on its card / row). */
  function stepLines(m) {
    if (m.mode === 'flow') {
      const f = M().flowStatus(m.id);
      if (!f) return '';
      return (
        (f.at.length ? f.at.map((a) => `<div class="ca-status-step hot">${I('play', 11)}<span class="ca-status-name">${esc(a)}</span></div>`).join('') : '') +
        `<div class="ca-status-step${f.error ? ' err' : ''}">${I('bolt', 11)}<span class="ca-status-name">${f.error ? esc(f.error) : 'things done'}</span><span class="ca-status-val">${CA.UI.Plot.fmt.beautify(f.done, 0)}</span></div>`
      );
    }
    const st = M().status(m.id);
    const { beautify } = CA.UI.Plot.fmt;
    return M()
      .stepsOf(m)
      .map((step, i) => {
        const s = (st && st.steps[i]) || {};
        const a = CA.Actions.get(step.action) || {};
        const avail = a.available ? a.available() : true;
        return (
          `<div class="ca-status-step${s.error ? ' err' : !avail ? ' idle' : s.lastAt && Date.now() - s.lastAt < 3000 ? ' hot' : ''}">` +
          `${I(a.icon || 'close', 11)}<span class="ca-status-name">${esc(CA.Actions.describe(step))}</span>` +
          `<span class="ca-status-val">${s.error ? esc(s.error) : !avail ? 'not available' : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + esc(a.unit) : ''} · ${ago(s.lastAt)}`}</span></div>`
        );
      })
      .join('');
  }

  /** After a settings change: the card's folded summary and its trigger badge. */
  function refreshSummary(el) {
    const card = el.closest('[data-macro-row]');
    const m = card && M().get(card.dataset.macroRow);
    if (!m) return;
    const sum = card.querySelector('.ca-mtile-sum span');
    if (sum) sum.textContent = settingsSummary(m);
    const badge = card.querySelector('.ca-badge');
    if (badge) badge.textContent = M().triggerText(m);
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
      `<div class="ca-steps">${m.mode === 'group' ? memberChips(m) : m.mode === 'flow' ? `<span class="ca-step">${I('widget', 12)}${M().flowOf(m).length} block${M().flowOf(m).length === 1 ? '' : 's'}</span>` : M().stepsOf(m).map(stepChip).join('<span class="ca-step-arrow">›</span>')}</div>` +
      optionsHtml(m) +
      '<div class="ca-macro-status" data-macro-status></div>' +
      '</div>' +
      '<div class="ca-controls">' +
      `<button type="button" class="ca-iconbtn ca-fav${fav ? ' on' : ''}" data-ca="macro-fav" data-id="${esc(m.id)}" title="${fav ? 'Un-favourite (removes its button from the left panel)' : 'Favourite: gives it its own button on the left panel'}">${I(fav ? 'star' : 'starOutline', 15)}</button>`;
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

  /**
   * A built-in macro as a card (the built-in sections lay these out in a grid): picture, name and
   * trigger, its switch or Run button, what it does, its choices, an activity meter, and ★ /
   * duplicate / hotkey along the bottom. Same data attributes as a row, so sync() keeps it live.
   */
  function tile(m) {
    const once = m.mode === 'once';
    const noCM = m.needsCM && !CA.CookieMonster.isLoaded(); // needs Cookie Monster, which isn't running
    const fav = M().isFav(m.id);
    return (
      `<div class="ca-mtile ca-macro" data-macro-row="${esc(m.id)}">` +
      '<div class="ca-mtile-head">' +
      icon(m) +
      `<div class="ca-mtile-name"><b>${esc(m.name)}</b><span class="ca-badge ca-badge-${m.mode}">${esc(M().triggerText(m))}</span></div>` +
      (once
        ? C().button(`${I('play', 12)} Run`, `data-ca="macro-run" data-id="${esc(m.id)}"`, 'ca-btn-small ca-btn-run')
        : C().toggle(false, `data-ca="macro-toggle" data-id="${esc(m.id)}"${noCM ? ' disabled' : ''}`, m.name)) +
      '</div>' +
      (noCM ? `<div class="ca-mtile-warn">${I('plug', 12)} Needs Cookie Monster ${C().button('Load it', 'data-ca="cm-load"', 'ca-btn-small')}</div>` : '') +
      (m.desc ? `<div class="ca-mtile-desc">${esc(m.desc)}</div>` : '') +
      (settingsOf(m).length
        ? `<div class="ca-mtile-settings${openSettings.has(m.id) ? ' open' : ''}">` +
          `<div class="ca-mtile-sum" data-ca="macro-settings" data-id="${esc(m.id)}" title="Change its settings">${I('settings', 11)} <span>${esc(settingsSummary(m))}</span></div>` +
          optionsHtml(m) +
          '</div>'
        : '') +
      '<div class="ca-mtile-heat" data-macro-heat title="How busy it has been lately"><i></i></div>' +
      '<div class="ca-macro-status" data-macro-status></div>' +
      '<div class="ca-mtile-foot">' +
      `<button type="button" class="ca-iconbtn ca-fav${fav ? ' on' : ''}" data-ca="macro-fav" data-id="${esc(m.id)}" title="${fav ? 'Un-favourite (removes its button from the left panel)' : 'Favourite: gives it its own button on the left panel'}">${I(fav ? 'star' : 'starOutline', 14)}</button>` +
      `<button type="button" class="ca-iconbtn" data-ca="macro-dup" data-id="${esc(m.id)}" title="Duplicate into your own editable macro">${I('plus', 13)}</button>` +
      C().hotkey(`macro.${m.id}`) +
      '</div></div>'
    );
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
        void st;
        void beautify;
        h += stepLines(m);
        return h + '</div>';
      })
      .join('');
  }

  // ---- the editor ----------------------------------------------------------------------------
  //
  // A header (the icon, name and description, Save / Cancel / Delete), the kind of macro as five
  // cards, how often it runs, then what it does: numbered step cards, the conditions of a "When…"
  // macro, a group's members, or a flow's blocks — nested cards, each with its type, what it
  // does, and ▲ ▼ × to move or remove it; "+ Do · Wait · Until · If · Parallel · Forever" under
  // every list adds one. Inputs carry data-edit="path.in.draft"; buttons data-edit-act + data-path.

  function blankDraft() {
    return { id: null, name: '', desc: '', icon: { ico: 'bolt' }, mode: 'repeat', every: 1000, steps: [{ action: 'pop.golden', params: {} }], members: [], when: blankWhen(), flow: [] };
  }
  const blankCond = () => ({ cond: 'buff', params: {}, not: false });
  const blankWhen = () => ({ all: [blankCond()], edge: 'rise' });
  const FLOW_BLOCKS = [
    { v: 'do', label: 'Do', icon: 'bolt', hint: 'run an action' },
    { v: 'wait', label: 'Wait', icon: 'clock', hint: 'until something holds' },
    { v: 'until', label: 'Until', icon: 'refresh', hint: 'repeat steps until something holds' },
    { v: 'if', label: 'If', icon: 'filter', hint: 'one way or the other' },
    { v: 'parallel', label: 'Parallel', icon: 'widget', hint: 'branches side by side' },
    { v: 'forever', label: 'Forever', icon: 'refresh', hint: 'repeat steps for good' },
  ];
  function blankNode(type) {
    const doNode = () => ({ type: 'do', action: 'pop.golden', params: {} });
    if (type === 'wait') return { type, cond: { all: [blankCond()] } };
    if (type === 'until') return { type, cond: { all: [blankCond()] }, body: [doNode()] };
    if (type === 'if') return { type, cond: { all: [blankCond()] }, then: [doNode()], else: [] };
    if (type === 'parallel') return { type, branches: [[doNode()], [doNode()]] };
    if (type === 'forever') return { type, body: [doNode()] };
    return doNode();
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[/^\d+$/.test(k) ? Number(k) : k]), obj);
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

  function actionSelect(action, path) {
    const groups = {};
    CA.Actions.all().forEach((a) => (groups[a.group] = groups[a.group] || []).push(a));
    return (
      `<select class="ca-ed-main" data-edit="${path}" data-structural>` +
      Object.keys(groups)
        .map((g) => `<optgroup label="${esc(g)}">${groups[g].map((a) => `<option value="${a.id}"${a.id === action ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`)
        .join('') +
      '</select>'
    );
  }

  const tools = (act, listPath, i, n) =>
    '<span class="ca-ed-tools">' +
    `<button type="button" class="ca-iconbtn" data-edit-act="${act}-up" data-path="${listPath}" data-val="${i}" title="Move up"${i === 0 ? ' disabled' : ''}>▲</button>` +
    `<button type="button" class="ca-iconbtn" data-edit-act="${act}-down" data-path="${listPath}" data-val="${i}" title="Move down"${i === n - 1 ? ' disabled' : ''}>▼</button>` +
    `<button type="button" class="ca-iconbtn" data-edit-act="${act}-del" data-path="${listPath}" data-val="${i}" title="Remove">${I('close', 12)}</button>` +
    '</span>';

  /** A step: its action and the action's choices. */
  function stepBody(s, path) {
    const a = CA.Actions.get(s.action);
    return (
      `<span class="ca-ed-aico">${I((a && a.icon) || 'bolt', 14)}</span>` +
      actionSelect(s.action, `${path}.action`) +
      (a && a.params.length ? `<div class="ca-ed-params">${a.params.map((p) => field(p, (s.params || {})[p.key], `${path}.params.${p.key}`)).join('')}</div>` : '')
    );
  }

  /** Conditions that must all hold (each can be negated), with "And…". */
  function condsHtml(listPath, list) {
    return (
      '<div class="ca-ed-conds">' +
      list
        .map((one, j) => {
          const cond = CA.Conditions.get(one.cond) || CA.Conditions.all()[0];
          return (
            `<div class="ca-ed-cond"><span class="ca-ed-and">${j ? 'and' : 'when'}</span>` +
            `<select class="ca-ed-main" data-edit="${listPath}.${j}.cond" data-structural>${CA.Conditions.all()
              .map((c) => `<option value="${c.id}"${c.id === one.cond ? ' selected' : ''}>${esc(c.name)}</option>`)
              .join('')}</select>` +
            cond.params.map((p) => field(p, (one.params || {})[p.key], `${listPath}.${j}.params.${p.key}`)).join('') +
            `<label class="ca-field ca-check"><input type="checkbox" data-edit="${listPath}.${j}.not" data-type="bool"${one.not ? ' checked' : ''}><span>not</span></label>` +
            (list.length > 1 ? `<button type="button" class="ca-iconbtn" data-edit-act="cond-del" data-path="${listPath}" data-val="${j}" title="Remove this condition">${I('close', 12)}</button>` : '') +
            '</div>'
          );
        })
        .join('') +
      `<button type="button" class="ca-btn ca-btn-small ca-ed-add" data-edit-act="cond-add" data-path="${listPath}">${I('plus', 11)} And…</button>` +
      '</div>'
    );
  }

  /** A list of flow blocks, with the "+ block" bar under it. */
  function blocksHtml(nodes, listPath) {
    return (
      '<div class="ca-fb-list">' +
      nodes.map((n, i) => blockHtml(n, `${listPath}.${i}`, listPath, i, nodes.length)).join('') +
      '<div class="ca-fb-add">' +
      FLOW_BLOCKS.map((b) => `<button type="button" class="ca-chip" data-edit-act="node-add" data-path="${listPath}" data-val="${b.v}" title="${esc(b.hint)}">${I(b.icon, 11)} ${b.label}</button>`).join('') +
      '</div></div>'
    );
  }

  function blockHtml(n, path, listPath, i, count) {
    const kind = FLOW_BLOCKS.find((b) => b.v === n.type) || FLOW_BLOCKS[0];
    let h =
      `<div class="ca-fb ca-fb-${n.type}">` +
      '<div class="ca-fb-head">' +
      `<span class="ca-fb-kind">${I(kind.icon, 12)}<select data-edit="${path}.type" data-structural>${FLOW_BLOCKS.map((b) => `<option value="${b.v}"${b.v === n.type ? ' selected' : ''}>${b.label}</option>`).join('')}</select></span>` +
      (n.type === 'do' ? `<div class="ca-ed-step-body">${stepBody(n, path)}</div>` : `<span class="ca-fb-hint">${esc(kind.hint)}</span>`) +
      tools('node', listPath, i, count) +
      '</div>';
    if (n.type === 'wait' || n.type === 'until' || n.type === 'if') h += condsHtml(`${path}.cond.all`, (n.cond && n.cond.all) || []);
    if (n.type === 'until' || n.type === 'forever') h += `<div class="ca-fb-sub"><span class="ca-fb-label">${n.type === 'until' ? 'each pass, until then' : 'each pass'}</span>${blocksHtml(n.body || [], `${path}.body`)}</div>`;
    if (n.type === 'if') {
      h += `<div class="ca-fb-sub"><span class="ca-fb-label">then</span>${blocksHtml(n.then || [], `${path}.then`)}</div>`;
      h += `<div class="ca-fb-sub ca-fb-else"><span class="ca-fb-label">else</span>${blocksHtml(n.else || [], `${path}.else`)}</div>`;
    }
    if (n.type === 'parallel') {
      h += '<div class="ca-fb-branches">';
      (n.branches || []).forEach((b, j) => {
        h +=
          `<div class="ca-fb-branch"><div class="ca-fb-branch-head"><span class="ca-fb-label">branch ${j + 1}</span>` +
          ((n.branches || []).length > 1 ? `<button type="button" class="ca-iconbtn" data-edit-act="branch-del" data-path="${path}.branches" data-val="${j}" title="Remove this branch">${I('close', 11)}</button>` : '') +
          `</div>${blocksHtml(b, `${path}.branches.${j}`)}</div>`;
      });
      h += `<button type="button" class="ca-btn ca-btn-small ca-ed-add" data-edit-act="branch-add" data-path="${path}.branches">${I('plus', 11)} Branch</button></div>`;
    }
    return h + '</div>';
  }

  // how often presets for the interval row
  const EVERY_PRESETS = [100, 250, 1000, 5000, 30000];

  function editorHtml() {
    const d = draft;
    const mode = MODES.find((x) => x.v === d.mode) || MODES[0];
    let h =
      '<div class="ca-card ca-editor ca-editor2" data-macro-editor>' +
      // header: icon, name, description, the buttons
      '<div class="ca-ed-head">' +
      `<span class="ca-ed-icon">${icon({ icon: d.icon })}</span>` +
      '<div class="ca-ed-names">' +
      `<input type="text" class="ca-ed-name" maxlength="60" data-edit="name" value="${esc(d.name)}" placeholder="${d.id ? 'Name' : 'Name your macro…'}">` +
      `<input type="text" class="ca-ed-desc" maxlength="300" data-edit="desc" value="${esc(d.desc)}" placeholder="What it does (optional)">` +
      '</div>' +
      '<div class="ca-ed-actions">' +
      C().button(`${I('save', 13)} Save`, 'data-edit-act="save"', 'ca-btn-on') +
      C().button('Cancel', 'data-edit-act="cancel"') +
      (d.id ? C().button(`${I('trash', 13)}`, 'data-edit-act="delete" data-arm-label="Delete it?" title="Delete this macro"', 'ca-btn-off') : '') +
      '</div></div>' +
      (draftError ? `<div class="ca-editor-error">${esc(draftError)}</div>` : '') +
      '<div class="ca-editor-body">' +
      // the kind of macro, as cards
      `<div class="ca-ed-kinds">${MODES.map(
        (x) => `<button type="button" class="ca-ed-kind${x.v === d.mode ? ' on' : ''}" data-edit-act="mode" data-val="${x.v}">${I(x.icon, 16)}<b>${x.label}</b><span>${esc(x.hint)}</span></button>`
      ).join('')}</div>`;
    if (d.mode !== 'once' && d.mode !== 'group') {
      const secs = d.every / 1000;
      h +=
        '<div class="ca-ed-row">' +
        `<span class="ca-ed-label">${I('clock', 12)} ${d.mode === 'when' ? 'Check every' : d.mode === 'flow' ? 'A pass every' : 'Every'}</span>` +
        `<input type="number" class="ca-ed-secs" step="any" min="${M().MIN_EVERY / 1000}" data-edit="everySec" data-type="number" value="${secs}"><em>seconds</em>` +
        `<span class="ca-chipgroup">${EVERY_PRESETS.map((ms) => `<button type="button" class="ca-chip${ms === d.every ? ' on' : ''}" data-edit-act="every" data-val="${ms}">${ms < 1000 ? `${ms / 1000}s` : `${ms / 1000}s`}</button>`).join('')}</span>` +
        '</div>';
    }
    if (d.mode === 'when') {
      h +=
        `<div class="ca-ed-sec"><div class="ca-ed-sec-head">${I('filter', 12)} When</div>` +
        condsHtml('when.all', d.when.all) +
        `<label class="ca-field"><span>Run</span><select data-edit="when.edge"><option value="rise"${d.when.edge !== 'while' ? ' selected' : ''}>once each time it happens</option><option value="while"${d.when.edge === 'while' ? ' selected' : ''}>on every check while it holds</option></select></label>` +
        '</div>';
    }
    if (d.mode === 'group') {
      const choices = M()
        .list()
        .filter((m) => m.mode !== 'once' && m.mode !== 'group' && m.id !== d.id);
      h +=
        `<div class="ca-ed-sec"><div class="ca-ed-sec-head">${I('widget', 12)} Members <span class="ca-hint">switching the group switches all of these together</span></div><div class="ca-members">` +
        choices
          .map(
            (m) =>
              `<label class="ca-member${d.members.includes(m.id) ? ' on' : ''}"><input type="checkbox" data-member="${esc(m.id)}"${d.members.includes(m.id) ? ' checked' : ''}>` +
              `${icon(m, true)}<span>${esc(m.name)}</span></label>`
          )
          .join('') +
        '</div></div>';
    } else if (d.mode === 'flow') {
      h +=
        `<div class="ca-ed-sec"><div class="ca-ed-sec-head">${I('widget', 12)} Flow <span class="ca-hint">blocks run top to bottom; a pass moves each branch on as far as it can</span></div>` +
        blocksHtml(d.flow, 'flow') +
        '</div>';
    } else {
      h +=
        `<div class="ca-ed-sec"><div class="ca-ed-sec-head">${I('bolt', 12)} Steps <span class="ca-hint">run in order, every time it ${d.mode === 'once' ? 'runs' : 'fires'}</span></div><div class="ca-ed-steps">` +
        d.steps.map((s, i) => `<div class="ca-ed-step"><span class="ca-step-n">${i + 1}</span><div class="ca-ed-step-body">${stepBody(s, `steps.${i}`)}</div>${tools('step', 'steps', i, d.steps.length)}</div>`).join('') +
        `<button type="button" class="ca-btn ca-btn-small ca-ed-add" data-edit-act="step-add" data-path="steps">${I('plus', 12)} Add step</button></div></div>`;
    }
    h +=
      `<div class="ca-ed-sec ca-ed-icons"><div class="ca-ed-sec-head">${I('star', 12)} Icon</div><div class="ca-iconpick">${ICONS.map(
        (n) => `<button type="button" class="ca-iconbtn${(d.icon || {}).ico === n ? ' on' : ''}" data-edit-act="icon" data-val="${n}" title="${n}">${I(n, 16)}</button>`
      ).join('')}</div></div>` +
      '</div></div>';
    return h;
  }

  function onEditInput(e) {
    const el = e.target;
    if (el.dataset && el.dataset.macroFlowopt) {
      if (e.type !== 'change') return;
      CA.Util.sound('snd/tick.mp3');
      M().setFlowOpt(el.dataset.macroFlowopt, el.dataset.key, el.value);
      refreshSummary(el);
      return;
    }
    if (el.dataset && el.dataset.macroEvery) {
      if (e.type !== 'change') return;
      CA.Util.sound('snd/tick.mp3');
      M().setEvery(el.dataset.macroEvery, Number(el.value));
      refreshSummary(el);
      return;
    }
    if (el.dataset && el.dataset.macroParam) {
      if (e.type !== 'change') return;
      CA.Util.sound('snd/tick.mp3');
      const v = el.dataset.type === 'bool' ? el.checked : el.dataset.type === 'number' ? Number(el.value) : el.value;
      if (el.dataset.type === 'number' && !Number.isFinite(v)) return;
      M().setParam(el.dataset.macroParam, Number(el.dataset.step), el.dataset.key, v);
      refreshSummary(el);
      // the row's step chip says what it does now
      const row = el.closest('[data-macro-row]');
      const m = M().get(el.dataset.macroParam);
      const chips = row && row.querySelector('.ca-steps');
      if (chips && m) chips.innerHTML = M().stepsOf(m).map(stepChip).join('<span class="ca-step-arrow">›</span>');
      return;
    }
    if (el.dataset && el.dataset.member && draft) {
      const id = el.dataset.member;
      draft.members = (draft.members || []).filter((x) => x !== id);
      if (el.checked) draft.members.push(id);
      el.closest('.ca-member').classList.toggle('on', el.checked);
      return;
    }
    if (!el.dataset || !el.dataset.edit || !draft) return;
    const type = el.dataset.type;
    let v = type === 'bool' ? el.checked : type === 'number' ? Number(el.value) : el.value;
    if (type === 'number' && !Number.isFinite(v)) return;
    if (el.dataset.edit === 'everySec') {
      draft.every = Math.round(v * 1000);
      return;
    }
    const path = el.dataset.edit;
    if ('structural' in el.dataset) {
      // a block of another type: a fresh one; another action / condition: its own defaults
      if (/\.type$/.test(path)) setPath(draft, path.slice(0, -5), blankNode(v));
      else {
        setPath(draft, path, v);
        if (/\.action$/.test(path)) setPath(draft, path.replace(/action$/, 'params'), {});
        if (/\.cond$/.test(path)) setPath(draft, path.replace(/cond$/, 'params'), {});
      }
      renderEditor();
      return;
    }
    setPath(draft, path, v);
  }

  /** Every "do" block of a flow (to check and fill them in), however deep. */
  function flowDos(nodes, out = []) {
    (nodes || []).forEach((n) => {
      if (n.type === 'do') out.push(n);
      flowDos(n.body, out);
      flowDos(n.then, out);
      flowDos(n.else, out);
      (n.branches || []).forEach((b) => flowDos(b, out));
    });
    return out;
  }
  function flowConds(nodes, out = []) {
    (nodes || []).forEach((n) => {
      if (n.cond && Array.isArray(n.cond.all)) out.push(...n.cond.all);
      flowConds(n.body, out);
      flowConds(n.then, out);
      flowConds(n.else, out);
      (n.branches || []).forEach((b) => flowConds(b, out));
    });
    return out;
  }

  function validate(d) {
    if (!d.name.trim()) return 'Give it a name.';
    if (d.mode === 'group') return d.members && d.members.length ? '' : 'Tick at least one macro for the group.';
    if (d.mode === 'flow' && !d.flow.length) return 'Add at least one block.';
    if (d.mode !== 'flow' && !d.steps.length) return 'Add at least one step.';
    if (d.mode !== 'once' && !(d.every >= M().MIN_EVERY)) return `Run it at most every ${M().MIN_EVERY / 1000}s.`;
    const steps = d.mode === 'flow' ? flowDos(d.flow) : d.steps;
    const self = steps.find((s) => (s.action === 'macro.run' || s.action === 'macro.set') && d.id && s.params.macro === d.id);
    if (self) return 'A macro can’t switch or run itself.';
    const missing = steps.find((s) => (s.action === 'macro.run' || s.action === 'macro.set') && !s.params.macro);
    if (missing) return 'Pick which macro the step should switch or run.';
    return '';
  }

  function onEditAct(t) {
    const act = t.dataset.editAct;
    const i = Number(t.dataset.val);
    const d = draft;
    const list = t.dataset.path ? getPath(d, t.dataset.path) : null;
    const swap = (arr, x, y) => ([arr[x], arr[y]] = [arr[y], arr[x]]);
    if (act === 'icon') d.icon = { ico: t.dataset.val };
    else if (act === 'every') d.every = Number(t.dataset.val);
    else if (act === 'mode') {
      const was = d.mode;
      d.mode = t.dataset.val;
      if (d.mode === 'when' && !(d.when && d.when.all && d.when.all.length)) d.when = blankWhen();
      if (d.mode === 'when' && d.every >= 1000) d.every = 250;
      // a flow starts from the steps it had (and steps from a flow's top-level "do" blocks)
      if (d.mode === 'flow' && !(d.flow && d.flow.length)) d.flow = d.steps.map((x) => ({ type: 'do', action: x.action, params: { ...x.params } }));
      if (was === 'flow' && d.mode !== 'flow' && d.mode !== 'group') {
        const dos = d.flow.filter((n) => n.type === 'do').map((n) => ({ action: n.action, params: { ...n.params } }));
        if (dos.length) d.steps = dos;
      }
    } else if (list && /-(up|down|del)$/.test(act)) {
      if (act.endsWith('-up') && i > 0) swap(list, i - 1, i);
      else if (act.endsWith('-down') && i < list.length - 1) swap(list, i, i + 1);
      else if (act.endsWith('-del')) list.splice(i, 1);
    } else if (act === 'step-add' && list) list.push({ action: 'pop.golden', params: {} });
    else if (act === 'node-add' && list) list.push(blankNode(t.dataset.val));
    else if (act === 'cond-add' && list) list.push(blankCond());
    else if (act === 'cond-del' && list) list.splice(i, 1);
    else if (act === 'branch-add' && list) list.push([blankNode('do')]);
    else if (act === 'branch-del' && list && list.length > 1) list.splice(i, 1);
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
      d.steps.forEach((x) => (x.params = CA.Actions.paramsFor(x.action, x.params)));
      if (d.mode === 'when') d.when.all.forEach((c) => (c.params = CA.Conditions.paramsFor(c.cond, c.params)));
      if (d.mode === 'flow') {
        flowDos(d.flow).forEach((x) => (x.params = CA.Actions.paramsFor(x.action, x.params)));
        flowConds(d.flow).forEach((c) => (c.params = CA.Conditions.paramsFor(c.cond, c.params)));
      }
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
    if (!Array.isArray(draft.members)) draft.members = [];
    if (!draft.steps.length) draft.steps = [{ action: 'pop.golden', params: {} }]; // a group switched to another mode
    if (!Array.isArray(draft.flow)) draft.flow = [];
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
      C().cardHead(sec.page ? C().link(sec.title, sec.page) : sec.title, sec.icon, extraHead || '') +
      (extraTop || '') +
      `<div class="ca-mtiles">${macros.map(tile).join('')}</div>` +
      '</div>'
    );
  }

  function html() {
    const all = M().list();
    // what's running, at a glance: a chip per running macro (click to find its card, × to stop it);
    // each card shows its own details while it runs
    let h =
      '<div class="ca-card ca-runbar">' +
      '<div class="ca-runbar-head">' +
      `<span class="ca-runbar-title">${I('play', 13)} Running</span><span class="ca-pill" data-ca-count></span>` +
      '<div class="ca-runchips" data-macro-runbar></div>' +
      `<button type="button" class="ca-iconbtn" data-ca="widget-add" data-type="status" title="Put this on the left panel as a status bar">${I('widget', 13)}</button>` +
      C().button(`${I('close', 11)} Stop all`, 'data-ca="stop-all"', 'ca-btn-small ca-btn-off') +
      '</div></div>';
    if (draft) h += editorHtml();
    SECTIONS.forEach((sec) => {
      const list = all.filter((m) => m.builtin && m.section === sec.id);
      if (!list.length) return;
      h += sectionCard(sec, list, '', '');
    });
    const mine = all.filter((m) => !m.builtin);
    h +=
      '<div class="ca-card">' +
      C().cardHead('Your macros', 'edit', `<div class="ca-card-meta">${C().button(`${I('plus', 12)} New macro`, 'data-ca="macro-new"', 'ca-btn-small')}</div>`) +
      (mine.length
        ? `<div class="ca-list">${mine.map(row).join('')}</div>`
        : '<div class="ca-card-note">Chain actions into your own macros: pop everything at once, sell stocks when a value crosses a line, switch other macros on when an effect starts… Built-in macros can be duplicated as a starting point.</div>') +
      '</div>';
    h += CA.UI.Menu.optionsCard('Options', 'settings', 'macros');
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
      const heat = r.querySelector('[data-macro-heat]');
      if (heat) {
        const lvl = M().activityLevel(id);
        heat.className = `ca-mtile-heat h${lvl}`;
        heat.firstChild.style.width = `${(lvl / 5) * 100}%`;
      }
      const st = r.querySelector('[data-macro-status]');
      if (st) {
        const s = M().status(id);
        const n = s ? s.steps.reduce((x, y) => x + (y.total || 0), 0) : 0;
        if (on && m.mode !== 'group') {
          // running: what each of its steps has done (morphed, so nothing flickers)
          CA.UI.Widgets.morph(st, `<div class="ca-status-up">on for ${CA.UI.Plot.fmt.span((Date.now() - M().since(id)) / 1000)}${n ? ` · ${n.toLocaleString()} done` : ''}</div>${stepLines(m)}`);
        } else st.textContent = on ? `Running · ${CA.UI.Plot.fmt.span((Date.now() - M().since(id)) / 1000)}` : s && s.lastRun ? `Last ran ${ago(s.lastRun)}` : '';
      }
    });
    const block = el.querySelector('[data-macro-statusblock]');
    if (block) block.innerHTML = status();
    const strip = el.querySelector('[data-macro-runbar]');
    if (strip) {
      const ids = M().runningIds();
      CA.UI.Widgets.morph(
        strip,
        ids.length
          ? ids
              .map((rid) => {
                const m = M().get(rid);
                if (!m) return '';
                const lvl = M().activityLevel(rid);
                return (
                  `<span class="ca-runchip h${lvl}" data-ca="macro-locate" data-id="${esc(rid)}" title="${esc(m.name)} — click to find it">${icon(m, true)}<b>${esc(m.name)}</b>` +
                  `<button type="button" class="ca-runchip-x" data-ca="macro-toggle" data-id="${esc(rid)}" title="Stop ${esc(m.name)}">${I('close', 9)}</button></span>`
                );
              })
              .join('')
          : '<span class="ca-runbar-idle">nothing — switch a macro on below, or press its hotkey</span>'
      );
    }
    const stopAll = el.querySelector('[data-ca="stop-all"]');
    if (stopAll) stopAll.disabled = !M().activeCount();
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

  /**
   * Runs a once-macro from a button — with feedback when it couldn't do anything because a spell
   * it casts needs more magic than there is: the button shakes, the game's spell-fail sound plays,
   * and a notice says how much it costs and when it'll be ready.
   */
  function run(id, el) {
    const m = M().get(id);
    if (!m) return 0;
    const spells = m.steps.filter((x) => x.action === 'spell.cast').map((x) => x.params && x.params.spell);
    const n = M().runOnce(id);
    if (n > 0 || !spells.length) {
      CA.Util.sound('snd/clickOn2.mp3');
      return n;
    }
    CA.Util.sound('snd/spellFail.mp3');
    if (el && el.classList) {
      el.classList.remove('ca-shake');
      void el.offsetWidth; // restart the animation
      el.classList.add('ca-shake');
      setTimeout(() => el.classList.remove('ca-shake'), 500);
    }
    const mg = CA.Grimoire.magicNow();
    if (!mg) {
      CA.Util.notify(m.name, 'The Grimoire isn’t open yet (Wizard tower level 1).', [22, 11], 3);
      return 0;
    }
    const s = CA.Grimoire.spells().find((x) => spells.includes(x.key) && !x.affordable);
    if (s) {
      const { span } = CA.UI.Plot.fmt;
      const when = Number.isFinite(s.wait) ? `ready in ${span(s.wait)}` : `more than your maximum of ${Math.floor(mg.max)}`;
      CA.Util.notify('Not enough magic', `${esc(s.name)} needs <b>${s.cost}</b> magic — you have ${Math.floor(mg.magic)} (${when}).`, s.icon, 3);
    }
    return 0;
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
        run(id, t);
        return true;
      case 'macro-fav': {
        CA.Util.sound('snd/tick.mp3');
        const fav = !M().isFav(id);
        M().setFav(id, fav); // → its own button widget appears / goes (ui/widgets.js)
        if (fav) {
          if (!CA.Settings.get('widgetsShown')) CA.Settings.set('widgetsShown', true);
          CA.Util.notify(M().get(id).name, 'Added as a button on the left panel — drag it wherever you like.', CA.ICON, 2);
        }
        rerender();
        return true;
      }
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
        CA.Util.notify(name, had ? 'Already on the left panel.' : 'Added to the left panel — drag it wherever you like.', CA.ICON, 2);
        return true;
      }
      case 'stop-all':
        CA.Util.sound('snd/clickOff2.mp3');
        M()
          .runningIds()
          .forEach((rid) => M().set(rid, false, { silent: true }));
        return true;
      case 'macro-settings': {
        CA.Util.sound('snd/tick.mp3');
        const box = t.closest('.ca-mtile-settings');
        const open = !openSettings.has(id);
        if (open) openSettings.add(id);
        else openSettings.delete(id);
        if (box) box.classList.toggle('open', open);
        return true;
      }
      case 'macro-order': {
        CA.Util.sound('snd/tick.mp3');
        const m = M().get(id);
        const key = t.dataset.key;
        const v = t.dataset.v;
        const cur = (M().flowOptsOf(m)[key] || []).slice();
        const i = cur.indexOf(v);
        const op = t.dataset.op;
        if (op === 'up' && i > 0) [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]];
        else if (op === 'down' && i >= 0 && i < cur.length - 1) [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]];
        else if (op === 'del' && i >= 0 && cur.length > 1) cur.splice(i, 1);
        else if (op === 'add' && i < 0) cur.push(v);
        M().setFlowOpt(id, key, cur);
        openSettings.add(id);
        rerender();
        return true;
      }
      case 'macro-locate': {
        const card = root && [...root.querySelectorAll('.ca-macro[data-macro-row]')].find((c) => c.dataset.macroRow === id);
        if (card) {
          if (card.scrollIntoView) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          card.classList.remove('ca-flash');
          void card.offsetWidth;
          card.classList.add('ca-flash');
        }
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
    CA.UI.Pages.register({ id: 'clickers', label: 'Macros', icon: 'bolt', order: 70, group: 'custom', html, mount, unmount, tick: () => sync(root) });
    // Cookie Monster arriving unlocks the macros that need it
    CA.Events.on('integrations', () => CA.Settings.get('tab') === 'clickers' && rerender());
  }

  return { init, row, tile, status, sync, handle, icon, edit, run, draft: () => draft };
})();
