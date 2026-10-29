// The Managers page (custom group, between Macros and Widgets): managers (features/managers.js)
// play an ascension in stages, switching macros and profiles on and off.
//
//   Manager    the Manager macro's switch, the active manager, and where it is: its stages in a
//              strip (the one it's on lit; click one to go there), what the stage still has to
//              put in, and what moves it on
//   Managers   one row per manager: its name (and id, for manager.use), its scope, Use, Duplicate
//              and Delete; New manager, and Put Nunix late game back
//   Code       what the Manager macro runs: the shown manager as code — written from its stages, or
//              by you (Save makes it yours; the stage editor is then off until Back to stages); its
//              last pass's lines lit while it runs
//   Stages     the manager being edited (the active one unless you pick another), as rules: stage 1
//              sets things up, each later stage lists only what it changes (the rest carries over —
//              its "Carries over" line says what): macros it switches on and off (click a chip to
//              flip it, × to drop it, the "+" lists to add one), macro settings, profiles, and its
//              "until" condition in the macro language (the last stage lasts for good)
//              It also lists what the Manager widget watches while it's on (a label, a value in the macro
//              language, a format).
//
// The Manager card's ☆ puts the Manager widget (ui/managerWidget.js) on the left panel.

CA.UI = CA.UI || {};

CA.UI.ManagersPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const G = () => CA.Managers;
  const SYNC_MS = 1000;
  let root = null;
  let life = null;
  let editing = ''; // the manager whose stages are shown ('' : the active one)
  let draft = null; // code being edited: { id, code }
  let codeError = '';

  const SECTION_TITLES = {
    autoclickers: 'Autoclickers',
    buying: 'Buying',
    upkeep: 'Seasons, lumps & the dragon',
    garden: 'Garden',
    grimoire: 'Grimoire',
    stocks: 'Stock market',
    alerts: 'Alerts',
    '': 'Your macros',
  };
  const SECTION_ORDER = ['autoclickers', 'buying', 'upkeep', 'garden', 'grimoire', 'stocks', 'alerts', ''];

  const shown = () => G().find(editing) || G().current() || G().list()[0] || null;

  // ---- the manager -----------------------------------------------------------------------------

  function stripHtml() {
    const w = G().where();
    if (!w) return '<div class="ca-card-note">No manager is active — pick one below (Use).</div>';
    const on = CA.Macros.isOn(G().MACRO);
    const chips = w.manager.stages
      .map((s, i) => {
        const cls = i === w.index && w.started ? ' on' : i < w.index && w.started ? ' done' : '';
        return (
          (i ? `<span class="ca-mgr-arrow" data-tip="${esc(w.manager.stages[i - 1].until ? `until ${w.manager.stages[i - 1].until}` : 'no “until”: stays here')}">›</span>` : '') +
          `<button type="button" class="ca-mgr-stage${cls}" data-mgr-act="goto" data-i="${i}" data-tip="Go to this stage (switches its macros and profiles now)"><b>${i + 1}</b> ${esc(s.name)}</button>`
        );
      })
      .join('');
    const pending = w.pending.length
      ? `<div class="ca-mgr-now"><em>Still to put in:</em> ${w.pending.map((p) => `<span class="ca-step">${esc(p.label)}: ${esc(p.name)}${p.waits ? ` <i>(waits for ${esc(p.waits)})</i>` : ''}</span>`).join(' ')}</div>`
      : '';
    const last = w.index >= w.of - 1;
    const until = last ? 'the last stage — it lasts for good' : w.stage.until ? `moves on once <code>${esc(w.stage.until)}</code>` : 'no “until” — it stays here until you move it on';
    const state = !on ? 'switched off — switch the Manager macro on to run it' : w.started ? `on stage ${w.index + 1} of ${w.of} since ${CA.UI.Plot.fmt.span(Math.max(0, (Date.now() - w.since) / 1000))} ago` : 'starts at stage 1 on its next pass';
    return (
      `<div class="ca-mgr-strip">${chips}</div>` +
      `<div class="ca-mgr-now"><em>${esc(w.manager.name)}:</em> ${esc(state)} · ${until}</div>` +
      pending
    );
  }

  function managerCard() {
    const m = CA.Macros.get(G().MACRO);
    const opts = G()
      .list()
      .map((x) => `<option value="${esc(x.id)}"${G().current() === x ? ' selected' : ''}>${esc(x.name)}</option>`)
      .join('');
    return (
      '<div class="ca-card">' +
      C().cardHead('Manager', 'ascend', `<div class="ca-card-meta">${C().widgetStar(CA.UI.ManagerWidget.PRESET, 'Manager')}<label class="ca-field"><span>Active</span><select data-mgr-active>${opts}</select></label></div>`) +
      (m ? `<div class="ca-list">${CA.UI.MacrosPage.row(m)}</div>` : '') +
      `<div class="ca-mgr-live" data-mgr-live>${stripHtml()}</div>` +
      '</div>'
    );
  }

  // ---- managers --------------------------------------------------------------------------------

  function managerRow(m) {
    const isActive = G().current() === m;
    const isShown = shown() === m;
    const scope = G()
      .SCOPES.map((s) => `<option value="${s.v}"${m.scope === s.v ? ' selected' : ''}>${esc(s.label)}</option>`)
      .join('');
    return (
      `<div class="ca-row ca-dprof ca-mgr-row${isActive ? ' on' : ''}${isShown ? ' ca-mgr-shown' : ''}">` +
      `<div class="ca-dprof-name"><input type="text" class="ca-gname" maxlength="40" value="${esc(m.name)}" data-mgr-name="${esc(m.id)}" aria-label="Manager name"><code data-tip="Its id, for macros: manager.use(${esc(m.id)})">${esc(m.id)}</code></div>` +
      `<label class="ca-field" data-tip="Legacy managers, which carry on across ascensions, come later"><span>Scope</span><select data-mgr-scope="${esc(m.id)}">${scope}</select></label>` +
      `<span class="ca-pill${isActive ? ' on' : ''}">${isActive ? 'active · ' : ''}${m.stages.length} stage${m.stages.length === 1 ? '' : 's'}</span>` +
      '<span class="ca-dprof-acts">' +
      C().button('Stages', `data-mgr-act="show" data-id="${esc(m.id)}"`, `ca-btn-small${isShown ? ' on' : ''}`) +
      C().button('Use', `data-mgr-act="use" data-id="${esc(m.id)}"`, 'ca-btn-small ca-btn-run') +
      C().button('Duplicate', `data-mgr-act="dup" data-id="${esc(m.id)}"`, 'ca-btn-small') +
      C().button('Delete', `data-mgr-act="delete" data-id="${esc(m.id)}" data-arm-label="Delete this manager?"`, 'ca-btn-small ca-btn-off') +
      '</span>' +
      (m.desc ? `<div class="ca-mgr-desc">${esc(m.desc)}</div>` : '') +
      '</div>'
    );
  }

  function managersCard() {
    const list = G().list();
    return (
      '<div class="ca-card ca-gardener">' +
      C().cardHead('Managers', 'save', '<div class="ca-card-meta"><span class="ca-hint">ascension managers start over each time you ascend</span></div>') +
      (list.length ? `<div class="ca-list">${list.map(managerRow).join('')}</div>` : '<div class="ca-card-note">No managers — make one below.</div>') +
      '<div class="ca-dprof-foot">' +
      C().button(`${I('plus', 12)} New manager`, 'data-mgr-act="new"', 'ca-btn-small') +
      C().button(`${I('refresh', 12)} Put Nunix late game back`, 'data-mgr-act="seeds" data-arm-label="Put it back as it came?"', 'ca-btn-small') +
      '</div></div>'
    );
  }

  // ---- stages -------------------------------------------------------------------------------------

  const macroList = () => CA.Macros.list().filter((x) => x.mode !== 'once' && x.id !== G().MACRO);
  const sectionOf = (x) => (SECTION_TITLES[x.section || ''] != null ? x.section || '' : '');
  /** Options grouped by the Macros page's sections: items [{ x, v, label, off }]. */
  function grouped(items) {
    const groups = {};
    items.forEach((it) => (groups[sectionOf(it.x)] = groups[sectionOf(it.x)] || []).push(it));
    return SECTION_ORDER.filter((k) => groups[k])
      .map((k) => `<optgroup label="${esc(SECTION_TITLES[k])}">${groups[k].map((it) => `<option value="${esc(it.v)}"${it.off ? ' disabled' : ''}>${esc(it.label)}</option>`).join('')}</optgroup>`)
      .join('');
  }
  const x = (act, attrs, tip) => `<button type="button" class="ca-mgr-x" data-mgr-act="${act}" ${attrs} data-tip="${esc(tip)}">×</button>`;

  /** The macros a stage switches one way: chips (click: the other way; ×: no change) and a list to add one. */
  function switchRule(m, i, to) {
    const s = m.stages[i];
    const was = i ? G().effective(m, i - 1).macros : {};
    const at = `data-id="${esc(m.id)}" data-i="${i}"`;
    const chips = Object.keys(s.macros)
      .filter((id) => s.macros[id] === to && CA.Macros.get(id))
      .map((id) => {
        const mc = CA.Macros.get(id);
        return (
          `<span class="ca-mgr-macro ${to}">` +
          `<button type="button" class="ca-mgr-flip" data-mgr-act="flip" ${at} data-macro="${esc(id)}" data-tip="${esc(`${mc.name}: switched ${to} here — click: switch it ${to === 'on' ? 'off' : 'on'} instead`)}">${CA.UI.MacrosPage.icon(mc, true)}<span>${esc(mc.name)}</span></button>` +
          x('unmacro', `${at} data-macro="${esc(id)}"`, i ? 'No change here: as the stage before has it' : 'Leave it as it is') +
          '</span>'
        );
      })
      .join('');
    const items = macroList().map((mc) => ({ x: mc, v: mc.id, label: `${mc.name}${was[mc.id] === to ? ` (already ${to})` : s.macros[mc.id] ? ` (switched ${s.macros[mc.id]} here)` : ''}`, off: was[mc.id] === to || !!s.macros[mc.id] }));
    const add = `<select class="ca-mgr-add" data-mgr-addmacro="${esc(m.id)}" data-i="${i}" data-to="${to}"><option value="">+ switch ${to}…</option>${grouped(items)}</select>`;
    return `<div class="ca-mgr-rule"><span class="ca-mgr-rule-name">Switch ${to}</span><div class="ca-mgr-macros">${chips || '<span class="ca-hint">—</span>'}${add}</div></div>`;
  }

  /** A setting's choices (yes / no for a switch). */
  const choices = (p) => (p.type === 'bool' ? [{ v: 'true', label: 'yes' }, { v: 'false', label: 'no' }] : typeof p.options === 'function' ? p.options() : p.options || []);
  /** A macro setting's field: its value as the stage sets it. */
  function inputField(m, i, id, p, cur) {
    const attrs = `data-mgr-input="${esc(m.id)}" data-i="${i}" data-macro="${esc(id)}" data-key="${esc(p.key)}" data-type="${p.type || 'select'}"`;
    if (p.type === 'number') return `<input type="number" step="any" ${attrs} value="${esc(cur)}">`;
    const list = choices(p);
    const missing = !list.some((o) => String(o.v) === String(cur)) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '';
    return `<select ${attrs}>${missing}${list.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(cur) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  }
  const settable = (mc) => (mc.inputs || []).filter((p) => typeof p.get !== 'function');
  /** How a setting's value reads: its option's label (yes / no for a switch). */
  function valueLabel(p, v) {
    const o = choices(p).find((x) => String(x.v) === String(v));
    return o ? o.label : String(v);
  }

  /** The macro settings a stage sets: one row each (×: no change), and a list to add one. */
  function settingRule(m, i) {
    const s = m.stages[i];
    const rows = [];
    Object.keys(s.inputs).forEach((id) => {
      const mc = CA.Macros.get(id);
      if (!mc) return;
      Object.keys(s.inputs[id]).forEach((k) => {
        const p = settable(mc).find((q) => q.key === k);
        if (!p) return;
        rows.push(
          `<label class="ca-field ca-mgr-input set" data-tip="${esc(`${mc.name}: ${p.label}`)}"><span><b>${esc(mc.name)}</b> · ${esc(p.label)}</span>${inputField(m, i, id, p, s.inputs[id][k])}` +
            `${x('uninput', `data-id="${esc(m.id)}" data-i="${i}" data-macro="${esc(id)}" data-key="${esc(k)}"`, 'No change here')}</label>`
        );
      });
    });
    const items = [];
    macroList().forEach((mc) => settable(mc).forEach((p) => items.push({ x: mc, v: `${mc.id}|${p.key}`, label: `${mc.name} · ${p.label}`, off: !!(s.inputs[mc.id] && s.inputs[mc.id][p.key] !== undefined) })));
    const add = `<select class="ca-mgr-add" data-mgr-addinput="${esc(m.id)}" data-i="${i}"><option value="">+ a setting…</option>${grouped(items)}</select>`;
    return `<div class="ca-mgr-rule"><span class="ca-mgr-rule-name">Settings</span><div class="ca-mgr-inputs">${rows.join('')}${add}</div></div>`;
  }

  const profilesOf = (k) => {
    try {
      return G().P[k].list();
    } catch (e) {
      return [];
    }
  };
  /** The profiles a stage puts in: one row each (×: no change), and a list to add one. */
  function profileRule(m, i) {
    const s = m.stages[i];
    const rows = G()
      .KINDS.filter((k) => s.profiles[k])
      .map((k) => {
        const kind = G().P[k];
        const list = profilesOf(k);
        const cur = s.profiles[k];
        const missing = !list.some((p) => p.id === cur) ? `<option value="${esc(cur)}" selected>${esc(cur)} (missing)</option>` : '';
        const opts = missing + list.map((p) => `<option value="${esc(p.id)}"${p.id === cur ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
        return `<label class="ca-field ca-mgr-prof set">${I(kind.icon, 12)}<span>${esc(kind.label)}</span><select data-mgr-profile="${esc(m.id)}" data-i="${i}" data-kind="${k}">${opts}</select>${x('unprofile', `data-id="${esc(m.id)}" data-i="${i}" data-kind="${k}"`, 'No change here')}</label>`;
      });
    const free = G().KINDS.filter((k) => !s.profiles[k]);
    const add = free.length ? `<select class="ca-mgr-add" data-mgr-addprofile="${esc(m.id)}" data-i="${i}"><option value="">+ a profile…</option>${free.map((k) => `<option value="${k}">${esc(G().P[k].label)}</option>`).join('')}</select>` : '';
    return `<div class="ca-mgr-rule"><span class="ca-mgr-rule-name">Profiles</span><div class="ca-mgr-profs">${rows.join('')}${add}</div></div>`;
  }

  /** What a later stage starts with: the stages before it, added up (a line, opened for the list). */
  function carryHtml(m, i) {
    if (!i) return '';
    const e = G().effective(m, i - 1);
    const names = (to) =>
      Object.keys(e.macros)
        .filter((id) => e.macros[id] === to && CA.Macros.get(id))
        .map((id) => CA.Macros.get(id).name);
    const on = names('on');
    const off = names('off');
    const sets = [];
    Object.keys(e.inputs).forEach((id) => {
      const mc = CA.Macros.get(id);
      if (!mc) return;
      Object.keys(e.inputs[id]).forEach((k) => {
        const p = settable(mc).find((q) => q.key === k) || { key: k, label: k };
        sets.push(`${mc.name} · ${p.label}: ${valueLabel(p, e.inputs[id][k])}`);
      });
    });
    const profs = G()
      .KINDS.filter((k) => e.profiles[k])
      .map((k) => `${G().P[k].label}: ${(profilesOf(k).find((p) => p.id === e.profiles[k]) || { name: e.profiles[k] }).name}`);
    const line = (label, xs) => (xs.length ? `<div><em>${label}</em> ${xs.map(esc).join(' · ')}</div>` : '');
    return (
      `<details class="ca-mgr-carry"><summary>Carries over from stage ${i}: ${on.length} on, ${off.length} off, ${sets.length} setting${sets.length === 1 ? '' : 's'}, ${profs.length} profile${profs.length === 1 ? '' : 's'}</summary>` +
      line('On:', on) +
      line('Off:', off) +
      line('Settings:', sets) +
      line('Profiles:', profs) +
      '</details>'
    );
  }

  /** What the Manager widget watches while the stage is on: label, value (code), format; its value now. */
  function watchFields(m, i) {
    const s = m.stages[i];
    const at = (j) => `data-mgr-watch="${esc(m.id)}" data-i="${i}" data-j="${j}"`;
    const now = G().watchOf(s);
    const rows = s.watch
      .map((x, j) => {
        const fmts = G()
          .FORMATS.map((f) => `<option value="${f.v}"${x.format === f.v ? ' selected' : ''}>${esc(f.label)}</option>`)
          .join('');
        const v = now[j] || {};
        const shown = v.error ? `<em class="ca-mgr-problem">${esc(v.error)}</em>` : `<em>now ${CA.UI.ManagerWidget.watchText(v)}</em>`;
        return (
          '<div class="ca-mgr-watch">' +
          `<input type="text" class="ca-gname" maxlength="40" placeholder="label" value="${esc(x.label)}" ${at(j)} data-field="label" aria-label="Label">` +
          `<input type="text" spellcheck="false" class="ca-code-input${v.error ? ' bad' : ''}" placeholder="a value, e.g. santaLevel()" value="${esc(x.value)}" ${at(j)} data-field="value" aria-label="Value">` +
          `<select ${at(j)} data-field="format" aria-label="Shown as">${fmts}</select>` +
          shown +
          C().button('×', `data-mgr-act="delWatch" data-id="${esc(m.id)}" data-i="${i}" data-j="${j}" data-tip="Stop watching it"`, 'ca-btn-small ca-btn-off') +
          '</div>'
        );
      })
      .join('');
    const add = s.watch.length < 8 ? C().button(`${I('plus', 12)} Watch a value`, `data-mgr-act="addWatch" data-id="${esc(m.id)}" data-i="${i}"`, 'ca-btn-small') : '';
    return `<div class="ca-mgr-watches">${rows}${add}</div>`;
  }

  function stageHtml(m, i) {
    const s = m.stages[i];
    const last = i === m.stages.length - 1;
    const w = G().where();
    const here = w && w.manager === m && w.started && w.index === i;
    const problem = G().untilProblem(s.until);
    const until = last
      ? '<div class="ca-mgr-until"><span class="ca-hint">The last stage: it lasts for good.</span></div>'
      : `<label class="ca-mgr-until"><span>Until</span><input type="text" spellcheck="false" class="ca-code-input${problem ? ' bad' : ''}" value="${esc(s.until)}" placeholder="a condition, e.g. season.complete(christmas)" data-mgr-until="${esc(m.id)}" data-i="${i}">` +
        (problem ? `<em class="ca-mgr-problem">${esc(problem)}</em>` : s.until ? `<em>${G().untilHolds(s.until) ? 'holds now' : 'not yet'}</em>` : '<em>no “until”: it stays here</em>') +
        '</label>';
    return (
      `<div class="ca-mgr-stagecard${here ? ' on' : ''}">` +
      '<div class="ca-mgr-stagehead">' +
      `<b class="ca-mgr-num">${i + 1}</b><input type="text" class="ca-gname" maxlength="40" value="${esc(s.name)}" data-mgr-stage-name="${esc(m.id)}" data-i="${i}" aria-label="Stage name">` +
      (here ? '<span class="ca-pill on">on it now</span>' : '') +
      '<span class="ca-dprof-acts">' +
      C().button('▲', `data-mgr-act="up" data-id="${esc(m.id)}" data-i="${i}" data-tip="Move up"${i ? '' : ' disabled'}`, 'ca-btn-small') +
      C().button('▼', `data-mgr-act="down" data-id="${esc(m.id)}" data-i="${i}" data-tip="Move down"${last ? ' disabled' : ''}`, 'ca-btn-small') +
      C().button(`${I('plus', 12)} After`, `data-mgr-act="addStage" data-id="${esc(m.id)}" data-i="${i}" data-tip="A new stage after this one (it changes nothing until you add to it)"`, 'ca-btn-small') +
      C().button('Delete', `data-mgr-act="delStage" data-id="${esc(m.id)}" data-i="${i}" data-arm-label="Delete this stage?"${m.stages.length > 1 ? '' : ' disabled'}`, 'ca-btn-small ca-btn-off') +
      '</span></div>' +
      carryHtml(m, i) +
      `<div class="ca-mgr-sub">${i ? 'What it changes' : 'What it sets up'}</div>` +
      switchRule(m, i, 'on') +
      switchRule(m, i, 'off') +
      settingRule(m, i) +
      profileRule(m, i) +
      until +
      `<div class="ca-mgr-sub" data-tip="What the Manager widget shows while this stage is on">Widget watches</div>${watchFields(m, i)}` +
      '</div>'
    );
  }

  function stagesCard() {
    const m = shown();
    if (!m) return '';
    if (typeof m.code === 'string')
      return (
        '<div class="ca-card">' +
        C().cardHead(`Stages · ${esc(m.name)}`, 'sortList') +
        `<div class="ca-card-note">Its code is yours (the Code card below), so these stages are only names: ${m.stages.map((s, i) => `<b>${i + 1}</b> ${esc(s.name)}`).join(' · ')}. ` +
        `${C().button(`${I('refresh', 12)} Back to stages`, `data-mgr-act="uncode" data-id="${esc(m.id)}" data-arm-label="Drop your code, back to the stages’ own?"`, 'ca-btn-small')}</div>` +
        // what the Manager widget watches still goes by stage
        `<div class="ca-mgr-stages">${m.stages.map((s, i) => `<div class="ca-mgr-watchcard"><div class="ca-mgr-stagehead"><b class="ca-mgr-num">${i + 1}</b> ${esc(s.name)}</div><div class="ca-mgr-sub">Widget watches</div>${watchFields(m, i)}</div>`).join('')}</div>` +
        '</div>'
      );
    return (
      '<div class="ca-card">' +
      C().cardHead(`Stages · ${esc(m.name)}`, 'sortList', '<div class="ca-card-meta"><span class="ca-hint">stage 1 sets things up; each stage after it only changes things, the rest carries over</span></div>') +
      `<div class="ca-mgr-stages">${m.stages.map((s, i) => stageHtml(m, i)).join('')}</div>` +
      '</div>'
    );
  }

  // ---- its code ----------------------------------------------------------------------------------

  /** The code card's head: whose code it is, and Save / Discard while it's changed. */
  function codeMeta(m) {
    const mine = typeof m.code === 'string';
    return (
      '<div class="ca-card-meta">' +
      `<span class="ca-pill${mine ? ' on' : ''}">${mine ? 'your code' : 'written from its stages'}</span>` +
      (isDirty(m) ? C().button(`${I('save', 12)} Save`, `data-mgr-act="saveCode" data-id="${esc(m.id)}"`, 'ca-btn-small ca-btn-on') + C().button('Discard', 'data-mgr-act="discardCode"', 'ca-btn-small') : '') +
      '</div>'
    );
  }
  const isDirty = (m) => !!draft && draft.id === m.id && draft.code !== G().sourceOf(m);
  function codeCard() {
    const m = shown();
    if (!m) return '';
    const mine = typeof m.code === 'string';
    const src = draft && draft.id === m.id ? draft.code : G().sourceOf(m);
    const head = codeMeta(m);
    return (
      `<div class="ca-card ca-editor2" data-edits="${G().MACRO}" data-mgr-code>` +
      C().cardHead(`Code · ${esc(m.name)}`, 'edit', head) +
      `<div class="ca-hint ca-mgr-codehint">What the Manager macro runs each second. ${mine ? 'You wrote it: the stage editor is off until you go back to the stages.' : 'The stage editor writes it; change it and Save to make it yours.'}</div>` +
      (codeError ? `<div class="ca-editor-error">${esc(codeError)}</div>` : '') +
      '<div class="ca-ed-layout"><div class="ca-editor-body">' +
      CA.UI.CodeEditor.html('manager', src, { title: `${m.name}, as code`, hint: 'a block per stage · manager.arriving(N): stage N’s first pass · manager.profile(kind, id) · manager.next()' }) +
      '</div>' +
      CA.UI.CodeEditor.libraryHtml('manager', { first: ['Managers', 'Macros', 'Values'] }) +
      '</div></div>'
    );
  }

  /** The lines its last pass went through, lit, when the shown manager is the one running. */
  function syncCode() {
    if (!root) return;
    const m = shown();
    const lp = G().lastPass();
    const live = m && G().current() === m && CA.Macros.isOn(G().MACRO) && lp && !isDirty(m);
    CA.UI.CodeEditor.setLive(
      root,
      'manager',
      live
        ? {
            lines: lp.lines,
            html:
              `<div class="ca-code-live-head">${I('play', 11)} last pass · ${CA.UI.Plot.fmt.span(Math.max(0, (Date.now() - lp.t) / 1000))} ago</div>` +
              (lp.error ? `<div class="ca-code-live-at">${esc(lp.error)}</div>` : '') +
              (lp.trace.length ? lp.trace.slice(-12).map((x) => `<div class="ca-code-live-tr">${esc(x.text)}</div>`).join('') : '<div class="ca-code-live-tr">nothing to do</div>'),
          }
        : null
    );
  }

  const html = () => managerCard() + managersCard() + stagesCard() + codeCard();

  // ---- live --------------------------------------------------------------------------------------

  function sync() {
    if (!root || !root.isConnected) return;
    const live = root.querySelector('[data-mgr-live]');
    if (live) CA.UI.Dom.morph(live, stripHtml());
    CA.UI.MacrosPage.sync(root);
    syncCode();
  }

  function act(t) {
    const d = t.dataset;
    if ((d.mgrAct === 'delete' || d.mgrAct === 'delStage' || d.mgrAct === 'seeds' || d.mgrAct === 'uncode') && !CA.UI.Dom.armed(t)) return;
    const i = Number(d.i);
    switch (d.mgrAct) {
      case 'goto':
        G().goTo(i + 1);
        break;
      case 'use':
        if (!G().use(d.id)) {
          CA.UI.Dom.replay(t, 'ca-shake', 400);
          return;
        }
        editing = '';
        break;
      case 'show':
        editing = d.id;
        draft = null;
        codeError = '';
        break;
      case 'dup':
        editing = G().add(null, d.id).id;
        break;
      case 'new':
        editing = G().add().id;
        break;
      case 'delete':
        G().remove(d.id);
        if (editing === d.id) editing = '';
        break;
      case 'seeds':
        G().resetSeeds();
        break;
      case 'flip': {
        const m = G().find(d.id);
        const cur = (m && m.stages[i] && m.stages[i].macros[d.macro]) || '';
        G().setStageMacro(d.id, i, d.macro, cur === 'on' ? 'off' : 'on');
        break;
      }
      case 'unmacro':
        G().setStageMacro(d.id, i, d.macro, '');
        break;
      case 'uninput':
        G().setStageInput(d.id, i, d.macro, d.key, '');
        break;
      case 'unprofile':
        G().setStageProfile(d.id, i, d.kind, '');
        break;
      case 'up':
        G().moveStage(d.id, i, -1);
        break;
      case 'down':
        G().moveStage(d.id, i, 1);
        break;
      case 'addStage':
        G().addStage(d.id, i);
        break;
      case 'delStage':
        G().removeStage(d.id, i);
        break;
      case 'addWatch': {
        const st = G().find(d.id) && G().find(d.id).stages[i];
        if (st) G().setStageWatch(d.id, i, st.watch.concat([{ label: '', value: '', format: 'auto' }]));
        break;
      }
      case 'delWatch': {
        const st = G().find(d.id) && G().find(d.id).stages[i];
        if (st) G().setStageWatch(d.id, i, st.watch.filter((x, j) => j !== Number(d.j)));
        break;
      }
      case 'saveCode': {
        if (!draft || draft.id !== d.id) return;
        codeError = G().setCode(d.id, draft.code);
        if (codeError) codeError = `Not saved — ${codeError}`;
        else draft = null;
        break;
      }
      case 'discardCode':
        draft = null;
        codeError = '';
        break;
      case 'uncode':
        G().setCode(d.id, null);
        draft = null;
        codeError = '';
        break;
      default:
        return;
    }
    CA.Util.sound('snd/tick.mp3');
    CA.UI.Menu.render();
  }

  function onClick(e) {
    const t = e.target.closest('[data-mgr-act]');
    if (!t || !root || !root.contains(t) || t.disabled) return;
    e.stopPropagation();
    act(t);
  }

  function onChange(e) {
    const t = e.target;
    const d = t.dataset || {};
    if (d.mgrActive != null) {
      G().use(t.value);
      editing = '';
    } else if (d.mgrName) G().update(d.mgrName, { name: t.value });
    else if (d.mgrScope) G().update(d.mgrScope, { scope: t.value });
    else if (d.mgrStageName) G().updateStage(d.mgrStageName, Number(d.i), { name: t.value });
    else if (d.mgrUntil) G().updateStage(d.mgrUntil, Number(d.i), { until: t.value });
    else if (d.mgrProfile) G().setStageProfile(d.mgrProfile, Number(d.i), d.kind, t.value);
    else if (d.mgrAddmacro) {
      if (!t.value) return;
      G().setStageMacro(d.mgrAddmacro, Number(d.i), t.value, d.to);
    } else if (d.mgrAddinput) {
      if (!t.value) return;
      // a new setting starts at what the stage would have anyway (or the macro's own value)
      const [id, key] = t.value.split('|');
      const mgr = G().find(d.mgrAddinput);
      const i = Number(d.i);
      const was = i ? (G().effective(mgr, i - 1).inputs[id] || {})[key] : undefined;
      const mc = CA.Macros.get(id);
      G().setStageInput(d.mgrAddinput, i, id, key, was !== undefined ? was : CA.Macros.inputsOf(mc)[key]);
    } else if (d.mgrAddprofile) {
      if (!t.value) return;
      const mgr = G().find(d.mgrAddprofile);
      const i = Number(d.i);
      const was = i ? G().effective(mgr, i - 1).profiles[t.value] : '';
      const pick = profilesOf(t.value).find((p) => p.id !== was);
      if (pick) G().setStageProfile(d.mgrAddprofile, i, t.value, pick.id);
    } else if (d.mgrWatch) {
      const st = G().find(d.mgrWatch) && G().find(d.mgrWatch).stages[Number(d.i)];
      if (!st) return;
      G().setStageWatch(d.mgrWatch, Number(d.i), st.watch.map((x, j) => (j === Number(d.j) ? { ...x, [d.field]: t.value } : x)));
    } else if (d.mgrInput) {
      const v = t.value === '' ? '' : d.type === 'bool' ? t.value === 'true' : d.type === 'number' ? Number(t.value) : t.value;
      G().setStageInput(d.mgrInput, Number(d.i), d.macro, d.key, v);
    }
    else return;
    CA.UI.Menu.render();
  }

  function mount(el) {
    unmount();
    root = el;
    life = CA.UI.Pages.scope(el).on('click', onClick).on('change', onChange);
    life.add(
      CA.UI.CodeEditor.bind(root, {
        onChange: (key, src) => {
          const m = shown();
          if (key !== 'manager' || !m) return;
          const was = isDirty(m);
          draft = { id: m.id, code: src };
          // the Save button shows on the first change
          if (was !== isDirty(m)) {
            const meta = root.querySelector('[data-mgr-code] .ca-card-meta');
            if (meta) meta.outerHTML = codeMeta(m);
          }
        },
      })
    );
    sync();
    life.every(SYNC_MS, sync);
  }
  function unmount() {
    if (life) life.close();
    life = null;
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'managers', label: 'Managers', icon: 'ascend', order: 72, group: 'custom', html, mount, unmount, tick: sync });
    // a hover card's link from any code (manager.use(nunixLateGame)): this page, that manager shown
    const reopen = (fn) => () => {
      fn();
      CA.UI.Menu.openPage('managers');
      CA.UI.Menu.render();
    };
    CA.UI.CodeEditor.defineOpen('manager', (id) => {
      const m = G().find(id);
      return m ? { label: 'Open it on the Managers page', go: reopen(() => (editing = m.id)), focus: '[data-mgr-code]' } : null;
    });
    CA.UI.CodeEditor.defineOpen('profile.garden', () => ({ label: 'Open the Garden page', page: 'garden' }));
    // leaving the Code card with unsaved changes: asked first (ui/codeEditor.js)
    CA.UI.CodeEditor.guard('managers', {
      dirty: () => !!draft && !!G().find(draft.id) && isDirty(G().find(draft.id)),
      name: () => (draft && G().find(draft.id) ? G().find(draft.id).name : 'Managers'),
      leave(how) {
        const d = draft;
        if (!d) return { back: reopen(() => {}) };
        if (how === 'save') {
          const err = G().setCode(d.id, d.code);
          if (err) return { error: err };
          draft = null;
          return { back: reopen(() => (editing = d.id)) };
        }
        if (how === 'discard') {
          draft = null;
          return { back: reopen(() => (editing = d.id)) };
        }
        return { back: reopen(() => ((editing = d.id), (draft = d))) };
      },
    });
  }

  return { init, html };
})();
