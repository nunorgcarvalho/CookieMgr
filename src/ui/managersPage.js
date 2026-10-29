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
//   Stages     the manager being edited (the active one unless you pick another): each stage's
//              name, its macros (click a chip: left as it is → on → off), their settings (left as
//              it is, or a value the stage sets), its profiles, and its
//              "until" condition in the macro language (the last stage lasts for good)

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
      C().cardHead('Manager', 'ascend', `<div class="ca-card-meta"><label class="ca-field"><span>Active</span><select data-mgr-active>${opts}</select></label></div>`) +
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

  function macroChips(m, i) {
    const s = m.stages[i];
    const macros = CA.Macros.list().filter((x) => x.mode !== 'once' && x.id !== G().MACRO);
    const groups = {};
    macros.forEach((x) => {
      const k = SECTION_TITLES[x.section || ''] != null ? x.section || '' : '';
      (groups[k] = groups[k] || []).push(x);
    });
    return SECTION_ORDER.filter((k) => groups[k])
      .map((k) => {
        const chips = groups[k]
          .map((x) => {
            const to = s.macros[x.id] || '';
            const tip = to === 'on' ? 'switched on in this stage — click: off' : to === 'off' ? 'switched off in this stage — click: left as it is' : 'left as it is — click: on';
            return `<button type="button" class="ca-mgr-macro ${to || 'leave'}" data-mgr-act="macro" data-id="${esc(m.id)}" data-i="${i}" data-macro="${esc(x.id)}" data-tip="${esc(`${x.name}: ${tip}`)}">${CA.UI.MacrosPage.icon(x, true)}<span>${esc(x.name)}</span>${to ? `<i>${to}</i>` : ''}</button>`;
          })
          .join('');
        return `<div class="ca-mgr-group"><span class="ca-mgr-group-name">${esc(SECTION_TITLES[k])}</span>${chips}</div>`;
      })
      .join('');
  }

  /** The settings of the macros this stage switches on (each: left as it is, or a value it sets). */
  function inputFields(m, i) {
    const s = m.stages[i];
    const fields = [];
    // a group switched on (the Upgrade unlocker): its macros' settings too
    const on = [];
    Object.keys(s.macros)
      .filter((id) => s.macros[id] === 'on')
      .forEach((id) => {
        const x = CA.Macros.get(id);
        on.push(...(x && x.mode === 'group' ? x.members : [id]));
      });
    [...new Set(on.concat(Object.keys(s.inputs)))]
      .forEach((id) => {
        const x = CA.Macros.get(id);
        if (!x) return;
        (x.inputs || [])
          .filter((p) => typeof p.get !== 'function')
          .forEach((p) => {
            const cur = s.inputs[id] && s.inputs[id][p.key] !== undefined ? s.inputs[id][p.key] : '';
            const attrs = `data-mgr-input="${esc(m.id)}" data-i="${i}" data-macro="${esc(id)}" data-key="${esc(p.key)}" data-type="${p.type || 'select'}"`;
            let field;
            if (p.type === 'number') field = `<input type="number" step="any" ${attrs} value="${esc(cur)}" placeholder="as it is">`;
            else {
              const list = p.type === 'bool' ? [{ v: 'true', label: 'yes' }, { v: 'false', label: 'no' }] : typeof p.options === 'function' ? p.options() : p.options || [];
              const opts = `<option value=""${cur === '' ? ' selected' : ''}>left as it is</option>` + list.map((o) => `<option value="${esc(o.v)}"${cur !== '' && String(o.v) === String(cur) ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
              field = `<select ${attrs}>${opts}</select>`;
            }
            fields.push(`<label class="ca-field ca-mgr-input${cur !== '' ? ' set' : ''}" data-tip="${esc(`${x.name}: ${p.label}`)}"><span><b>${esc(x.name)}</b> · ${esc(p.label)}</span>${field}</label>`);
          });
      });
    return fields.join('');
  }

  function profileFields(m, i) {
    const s = m.stages[i];
    return G()
      .KINDS.map((k) => {
        const kind = G().P[k];
        let list = [];
        try {
          list = kind.list();
        } catch (e) {
          list = [];
        }
        const cur = s.profiles[k] || '';
        const missing = cur && !list.some((p) => p.id === cur) ? `<option value="${esc(cur)}" selected>${esc(cur)} (missing)</option>` : '';
        const opts = `<option value=""${cur ? '' : ' selected'}>left as it is</option>${missing}` + list.map((p) => `<option value="${esc(p.id)}"${p.id === cur ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
        return `<label class="ca-field ca-mgr-prof">${I(kind.icon, 12)}<span>${esc(kind.label)}</span><select data-mgr-profile="${esc(m.id)}" data-i="${i}" data-kind="${k}">${opts}</select></label>`;
      })
      .join('');
  }

  function stageHtml(m, i) {
    const s = m.stages[i];
    const last = i === m.stages.length - 1;
    const w = G().where();
    const here = w && w.manager === m && w.started && w.index === i;
    const problem = G().untilProblem(s.until);
    const inputs = inputFields(m, i);
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
      C().button(`${I('plus', 12)} After`, `data-mgr-act="addStage" data-id="${esc(m.id)}" data-i="${i}" data-tip="A new stage after this one (a copy of it)"`, 'ca-btn-small') +
      C().button('Delete', `data-mgr-act="delStage" data-id="${esc(m.id)}" data-i="${i}" data-arm-label="Delete this stage?"${m.stages.length > 1 ? '' : ' disabled'}`, 'ca-btn-small ca-btn-off') +
      '</span></div>' +
      `<div class="ca-mgr-sub">Macros</div><div class="ca-mgr-macros">${macroChips(m, i)}</div>` +
      (inputs ? `<div class="ca-mgr-sub">Their settings</div><div class="ca-mgr-inputs">${inputs}</div>` : '') +
      `<div class="ca-mgr-sub">Profiles</div><div class="ca-mgr-profs">${profileFields(m, i)}</div>` +
      until +
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
        '</div>'
      );
    return (
      '<div class="ca-card">' +
      C().cardHead(`Stages · ${esc(m.name)}`, 'sortList', '<div class="ca-card-meta"><span class="ca-hint">a stage switches its macros once on entering it, then puts its profiles in</span></div>') +
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
      CA.UI.CodeEditor.html('manager', src, { title: `${m.name}, as code`, hint: 'a block per stage · manager.entering(): its first pass · manager.profile(kind, id) · manager.next()' }) +
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
      case 'macro': {
        const m = G().find(d.id);
        const cur = (m && m.stages[i] && m.stages[i].macros[d.macro]) || '';
        G().setStageMacro(d.id, i, d.macro, cur === '' ? 'on' : cur === 'on' ? 'off' : '');
        break;
      }
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
    else if (d.mgrInput) {
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
