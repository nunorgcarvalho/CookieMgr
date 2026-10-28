// The Auto buyer's cards — the top of the Payback page (features/autoBuyer.js):
//
//   Auto buyer   its on/off switch (the autoBuyer macro), what it buys next (a bar filling as you save
//                for it), the profiles (click one to make it active), the payback mode, Buy all upgrades
//   Queue        the active profile's queue: place, what (icon, name; an upgrade's info card on hover;
//                Buy all upgrades as one row, the upgrades it buys on hover),
//                payback period in its color, score, price, when, the rules that touched it — the first
//                ten (all on "show all"), then what's held back, grayed, with why
//   Profile      the active profile: name, what it buys, the bulk, save up or skip, the reserve
//                (minutes of CpS and banks — the highest is kept), what it ranks by, and its rules
//                (what → does, when …), reordered with ↑ ↓
//
// The first two follow the game every second (sync); the profile editor redraws only when it changes,
// so typing into it isn't interrupted.

CA.UI = CA.UI || {};

CA.UI.AutoBuyerCard = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const B = () => CA.AutoBuyer;
  const P = () => CA.Payback;
  const F = () => CA.Format;
  const SHOW = 10;
  let showAll = false;

  const ppText = (v) => F().payback(v);
  const sprite = (pos) => `<span class="ca-pp-ico" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-pos[0] * 48}px ${-pos[1] * 48}px"></span>`;
  /** A queue entry's name: a building's icon and name, an upgrade's (hoverable: its info card). */
  function thingName(x) {
    if (x.kind === 'upgrade') return CA.UpgradeInfo.ref(x.name);
    if (x.kind === 'allUpgrades') {
      const names = (x.names || []).map((n) => (Game.Upgrades && Game.Upgrades[n] && Game.Upgrades[n].dname) || n);
      const tip = names.length ? `The game’s Buy all upgrades: ${names.join(', ')} — bought at once, their payback period measured together` : 'The game’s Buy all upgrades: every store upgrade the budget affords';
      const box = Game.Upgrades && Game.Upgrades['Inspired checklist'];
      return `<span class="ca-ab-thing" data-tip="${esc(tip)}">${box && box.icon ? sprite(box.icon) : I('upgrade', 14)}${esc(x.label)}</span>`;
    }
    const b = (Game.Objects || {})[x.name];
    return `<span class="ca-ab-thing">${b ? sprite([b.iconColumn || 0, 0]) : ''}${esc(x.label)}</span>`;
  }
  const when = (price) => {
    const s = P().timeTo(price);
    return s <= 0 ? 'now' : Number.isFinite(s) ? F().span(s) : 'not at this income';
  };

  // ---- the Auto buyer card ----

  function nextHtml() {
    const p = B().find();
    const f = B().next();
    if (!f) return `<div class="ca-ab-next"><div class="ca-ab-next-text"><b>Nothing to buy</b><span class="ca-hint">${esc(B().readiness().text)}</span></div></div>`;
    const keep = B().keepOf(p.id);
    const top = B().reserveParts(p.id).find((q) => q.wins);
    const need = f.price + keep;
    const pct = need > 0 ? Math.max(0, Math.min(1, (Game.cookies || 0) / need)) : 1;
    return (
      `<div class="ca-ab-next${pct >= 1 ? ' can' : ''}">` +
      `<div class="ca-ab-next-text"><b>Next: ${thingName(f)}</b>` +
      `<span class="ca-hint">PP ${ppText(f.pp)} · +${F().short(f.gain)}/s · ${F().beautify(f.price)} · ${pct >= 1 ? 'affordable now' : `in ${when(need)}`}${keep > 0 ? ` · keeps ${F().short(keep)} in the bank (${esc(top.label)})` : ''}</span>` +
      `<span class="ca-ab-bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span></div></div>`
    );
  }
  function profileChips() {
    const act = B().activeProfile();
    return (
      B()
        .list()
        .map((p) => `<button type="button" class="ca-chip${p.id === act ? ' on' : ''}" data-ab-use="${esc(p.id)}" data-tip="${esc(`${p.name} (id ${p.id}) — click to make it the active profile; macros: buyer.profile(${p.id})`)}">${esc(p.name)}</button>`)
        .join('') + `<button type="button" class="ca-chip" data-ab-act="new" data-tip="A new profile, a copy of the active one">${I('plus', 11)} New</button>`
    );
  }
  function allUpgradesButton() {
    const all = B().allUpgrades();
    const can = all.filter((x) => x.price <= (Game.cookies || 0)).length;
    return C().button(
      `${I('upgrade', 12)} Buy all upgrades${all.length ? ` <small>${can}/${all.length}</small>` : ''}`,
      `data-ab-act="all"${can ? '' : ' disabled'} data-tip="${esc('Buys every upgrade in the store you can afford, cheapest first — the game’s Inspired checklist button: not switches, research, or what you’ve vaulted. Macros: buy.allUpgrades()')}"`,
      'ca-btn-small'
    );
  }
  /** Buy all upgrades' own payback period, measured as one purchase (the store upgrades the bank affords, together). */
  function allUpgradesPp() {
    const x = P().allUpgrades();
    if (!x.n) return '';
    const t = P().table({ staleMs: 1000 });
    return `<span class="ca-hint" data-tip="${esc('Its payback period in the mode in use: the upgrades it would buy, measured together as one purchase. Macros: payback.allUpgrades()')}"><span class="ca-pp-dot ${t.colourOf(x.pp, x.price)}"></span>PP ${ppText(x.pp)} · +${F().short(x.gain)}/s · ${F().beautify(x.price)}</span>`;
  }
  function buyerHtml() {
    const on = CA.Macros.isOn('autoBuyer');
    const key = CA.Settings.getHotkey('macro.autoBuyer');
    return (
      '<div class="ca-ab-hero">' +
      C().toggle(on, 'data-ab-act="toggle"', 'Auto buyer on/off') +
      `<span class="ca-ab-state ${on ? 'on' : ''}">${on ? 'on' : 'off'}${key ? ` · ${esc(CA.Hotkeys.format(key))}` : ''}</span>` +
      nextHtml() +
      '</div>' +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Profile</span><span class="ca-pp-chips">${profileChips()}</span></div>` +
      `<div class="ca-ab-row ca-pp-modebar" data-pp-modes>${CA.UI.PaybackPage.modeBar()}</div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Upgrades</span>${allUpgradesButton()}${allUpgradesPp()}</div>`
    );
  }
  function buyerCard() {
    return (
      '<div class="ca-card ca-ab">' +
      C().cardHead('Auto buyer', 'dollar', `<div class="ca-card-meta"><span class="ca-hint">buys the front of the queue — the ${C().link('Auto buyer macro', 'clickers')}</span></div>`) +
      `<div data-ab-buyer>${buyerHtml()}</div></div>`
    );
  }

  // ---- the queue ----

  function row(x, i, t) {
    const held = i < 0;
    const colour = x.colour || (t ? t.colourOf(x.pp, x.price) : 'gray');
    const can = x.price <= (Game.cookies || 0);
    const score = held ? '—' : x.first ? 'first' : ppText(x.score);
    // a held row's last rule is the one that held it: its why says it in full
    const rules = held && (x.rules || []).length && x.why.includes(x.rules[x.rules.length - 1]) ? x.rules.slice(0, -1) : x.rules || [];
    const badges = rules.map((r) => `<span class="ca-ab-badge ${badgeClass(r)}">${esc(r)}</span>`).join('') + (held ? `<span class="ca-ab-why">${esc(x.why)}</span>` : '');
    return (
      `<tr class="${i === 0 ? 'front' : ''}${held ? ' held' : ''}">` +
      `<td class="n">${held ? '–' : i + 1}</td>` +
      `<td>${thingName(x)}</td>` +
      `<td class="n"><span class="ca-pp-dot ${colour}"></span>${ppText(x.pp)}</td>` +
      `<td class="n">${score}</td>` +
      `<td class="n">${F().short(x.price)}</td>` +
      `<td class="${can ? 'ca-ab-can' : ''}">${held ? '' : when(x.price)}</td>` +
      `<td class="ca-ab-badges">${badges}</td></tr>`
    );
  }
  const badgeClass = (r) => (/^buy first|^cheap/.test(r) ? 'first' : /^weight/.test(r) ? 'weight' : /^up to/.test(r) ? 'cap' : 'never');
  function queueHtml() {
    const q = B().queue();
    if (!q.profile) return '<div class="ca-card-note">No profile.</div>';
    const shown = showAll ? q.items : q.items.slice(0, SHOW);
    // the colors: the full table's scale (worked out at most a second ago — the page shows it anyway)
    const t = P().table({ staleMs: 1000 });
    const more = q.items.length - shown.length;
    return (
      '<div class="ca-ab-scroll"><table class="ca-ab-queue"><thead><tr><th>#</th><th>What</th><th class="n">PP</th><th class="n" data-tip="its payback period after the rules’ weights — the queue’s order">Score</th><th class="n">Price</th><th>When</th><th>Rules</th></tr></thead><tbody>' +
      (shown.length ? shown.map((x, i) => row(x, i, t)).join('') : `<tr><td colspan="7" class="ca-hint">Nothing in the queue${q.profile.skip ? ' you can afford' : ''}.</td></tr>`) +
      (more > 0 ? `<tr><td colspan="7"><a class="ca-link" data-ab-act="all-rows" role="link" tabindex="0">${more} more — show all</a></td></tr>` : showAll && q.items.length > SHOW ? `<tr><td colspan="7"><a class="ca-link" data-ab-act="all-rows" role="link" tabindex="0">show the first ${SHOW}</a></td></tr>` : '') +
      q.held.map((x) => row(x, -1, t)).join('') +
      '</tbody></table></div>'
    );
  }
  function queueMeta() {
    const q = B().queue();
    return q.profile ? `${esc(q.profile.name)} · ${q.items.length} in the queue${q.held.length ? `, ${q.held.length} held back` : ''} · hover an upgrade for its card` : '';
  }
  function queueCard() {
    return (
      '<div class="ca-card">' +
      C().cardHead('Queue', 'sortList', `<div class="ca-card-meta"><span class="ca-hint" data-ab-qmeta>${queueMeta()}</span></div>`) +
      `<div data-ab-queue>${queueHtml()}</div></div>`
    );
  }

  // ---- the profile editor ----

  const opt = (v, label, sel) => `<option value="${esc(v)}"${String(sel) === String(v) ? ' selected' : ''}>${esc(label)}</option>`;
  function whatOptions(r) {
    const kinds = B().WHATS.map((w) => opt(w, B().whatText({ what: w, secs: r.secs }).replace(/ under .*/, ' under N s of CpS'), r.what));
    const bs = Object.values(Game.Objects || {}).map((b) => opt(`b:${b.name}`, b.dname || b.name, r.what));
    // the store's upgrades, and the one the rule names (it may not be in the store now)
    const names = new Set((Game.UpgradesInStore || []).filter((u) => u && u.pool !== 'toggle').map((u) => u.name));
    if (r.what.startsWith('u:')) names.add(r.what.slice(2));
    const us = [...names].map((n) => opt(`u:${n}`, (Game.Upgrades && Game.Upgrades[n] && Game.Upgrades[n].dname) || n, r.what));
    return `<optgroup label="Kinds">${kinds.join('')}</optgroup><optgroup label="A building">${bs.join('')}</optgroup>${us.length ? `<optgroup label="An upgrade (in the store)">${us.join('')}</optgroup>` : ''}`;
  }
  function ruleRow(p, r, i) {
    const n = p.rules.length;
    const problem = B().whenProblem(r.when);
    const num = (key, v, step, tip) => `<input type="number" class="ca-pp-num" min="0" step="${step}" value="${v}" data-ab-rule="${i}" data-k="${key}" data-tip="${esc(tip)}">`;
    return (
      `<div class="ca-ab-rule${r.on ? '' : ' off'}">` +
      `<span class="ca-ab-rule-mv">` +
      `<button type="button" class="ca-ab-mini" data-ab-mv="${i}" data-d="-1"${i ? '' : ' disabled'} aria-label="Move up">↑</button>` +
      `<button type="button" class="ca-ab-mini" data-ab-mv="${i}" data-d="1"${i < n - 1 ? '' : ' disabled'} aria-label="Move down">↓</button></span>` +
      '<span class="ca-ab-rule-body">' +
      `<select data-ab-rule="${i}" data-k="what">${whatOptions(r)}</select>` +
      (r.what === 'cheap' ? num('secs', r.secs, 1, 'seconds of unbuffed CpS') + '<span class="ca-hint">s</span>' : '') +
      '<span class="ca-ab-arrow">→</span>' +
      `<select data-ab-rule="${i}" data-k="effect">${B()
        .EFFECTS.map((e) => opt(e, { first: 'buy first', weight: 'weight ×', cap: 'up to … owned', never: 'never' }[e], r.effect))
        .join('')}</select>` +
      (r.effect === 'weight' ? num('k', r.k, 0.1, 'multiplies its payback period: below 1 prefers it, above 1 puts it off') : '') +
      (r.effect === 'cap' ? num('n', r.n, 1, 'no more than this many owned (a building)') : '') +
      `<span class="ca-ab-when"><span class="ca-hint">when</span><input type="text" class="ca-ab-code${problem ? ' bad' : ''}" value="${esc(r.when)}" placeholder="always" spellcheck="false" data-ab-rule="${i}" data-k="when" data-tip="${esc(problem ? `Problem: ${problem}` : 'A condition in the macro language — e.g. cookies() > 1e12, buff(Frenzy), pp.price(thing) < cps() * 60 — `thing` is what’s ranked. Empty: always.')}"></span>` +
      '</span>' +
      `<span class="ca-ab-rule-end">${C().toggle(r.on, `data-ab-rule-on="${i}"`, 'Rule on/off')}` +
      C().button('✕', `data-ab-rm="${i}" data-arm-label="Remove?"`, 'ca-btn-small ca-btn-off') +
      '</span></div>'
    );
  }
  /** The reserve's thresholds now, the highest (what it keeps) in bold. */
  function keepHtml(p) {
    const parts = B().reserveParts(p.id);
    if (!parts.length) return 'no reserve: it may spend the whole bank';
    return `keeps the highest — so the bank never drops below any of them: ${parts
      .map((q) => (q.wins ? `<b>${esc(q.label)} ${F().beautify(q.amount)}</b>` : `${esc(q.label)} ${F().beautify(q.amount)}`))
      .join(' · ')}`;
  }
  function editorHtml() {
    const p = B().find();
    if (!p) return '';
    const chip = (attr, v, label, on, tip = '') => `<button type="button" class="ca-chip${on ? ' on' : ''}" ${attr}="${esc(String(v))}"${tip ? ` data-tip="${esc(tip)}"` : ''}>${label}</button>`;
    const modes = [opt('', `the payback mode in use (${P().mode().label})`, p.mode)].concat(P().modes().map((m) => opt(m.id, m.label, p.mode))).join('');
    return (
      '<div class="ca-list">' +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Name</span><input type="text" class="ca-gname" maxlength="40" value="${esc(p.name)}" data-ab-f="name" data-tip="${esc(`macros use its name or its id: ${p.id}`)}"><span class="ca-hint">id ${esc(p.id)}</span></div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Buys</span><span class="ca-pp-chips">${chip('data-ab-kind', 'building', 'Buildings', p.kinds.building)}${chip('data-ab-kind', 'upgrade', 'Upgrades', p.kinds.upgrade)}${chip('data-ab-kind', 'allUpgrades', 'Buy all upgrades', p.kinds.allUpgrades, 'Every store upgrade the budget affords, bought at once — ranked by its own payback period, measured together')}</span></div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Building bulk</span><span class="ca-pp-chips">${B()
        .BULKS.map((b) => chip('data-ab-bulk', b, b === 'auto' ? 'auto' : `×${b}`, p.bulk === b, b === 'auto' ? `The store’s minimum bulk (Options below), rounded up with Round to multiples — now ×${CA.Shop.minBulk()}` : ''))
        .join('')}</span></div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Can’t afford</span><span class="ca-pp-chips">${chip('data-ab-skip', 0, 'save up for the front', !p.skip)}${chip('data-ab-skip', 1, 'skip to what I can afford', p.skip)}</span></div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Bank reserve</span><input type="number" min="0" step="1" class="ca-pp-num" value="${p.reserve}" data-ab-f="reserve"><span class="ca-hint">minutes of unbuffed CpS</span>` +
      `<span class="ca-pp-chips">${B()
        .BANKS.map((b) => chip('data-ab-bank', b.id, esc(b.label), p.banks.includes(b.id), `Also keep ${b.tip}`))
        .join('')}</span></div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl"></span><span class="ca-hint" data-ab-keep>${keepHtml(p)}</span></div>` +
      `<div class="ca-ab-row"><span class="ca-ab-lbl">Rank by</span><select data-ab-f="mode">${modes}</select><span class="ca-hint">the payback period the queue sorts on</span></div>` +
      `<div class="ca-ab-row ca-ab-rules-head"><span class="ca-ab-lbl">Rules</span><span class="ca-hint">top to bottom: what it applies to → what it does, when its condition holds. “never” and a reached cap stop there.</span></div>` +
      `<div class="ca-ab-rules">${p.rules.map((r, i) => ruleRow(p, r, i)).join('') || '<div class="ca-card-note">No rules: the queue is the payback ranking as it is.</div>'}</div>` +
      `<div class="ca-ab-row">${C().button(`${I('plus', 12)} Add rule`, 'data-ab-act="rule"', 'ca-btn-small')}${C().button(`${I('plus', 12)} Cheap first`, 'data-ab-act="rule-cheap"', 'ca-btn-small')}` +
      `<span class="ca-ab-grow"></span>${B().list().length > 1 ? C().button('Delete profile', `data-ab-act="delete" data-arm-label="Delete ${esc(p.name)}?"`, 'ca-btn-small ca-btn-off') : ''}</div>` +
      '</div>'
    );
  }
  function editorCard() {
    const p = B().find();
    return (
      '<div class="ca-card">' +
      C().cardHead(`Profile: ${p ? esc(p.name) : '—'}`, 'settings', '<div class="ca-card-meta"><span class="ca-hint">the active profile — macros: buyer.next(), buyer.queue(), buyer.profile(id)</span></div>') +
      `<div data-ab-editor>${editorHtml()}</div></div>`
    );
  }

  const html = () => buyerCard() + queueCard() + editorCard();

  function sync(root) {
    [
      ['[data-ab-buyer]', buyerHtml],
      ['[data-ab-queue]', queueHtml],
      ['[data-ab-qmeta]', queueMeta],
      ['[data-ab-keep]', () => (B().find() ? keepHtml(B().find()) : '')],
    ].forEach(([sel, fn]) => {
      const el = root.querySelector(sel);
      if (el) CA.UI.Dom.morph(el, fn());
    });
  }

  const redraw = () => CA.UI.Menu.render();
  const tick = () => CA.Util.sound('snd/tick.mp3');

  /** The page's clicks: true when it was one of these cards'. */
  function onClick(e) {
    const t = e.target.closest('[data-ab-act],[data-ab-use],[data-ab-kind],[data-ab-bulk],[data-ab-skip],[data-ab-bank],[data-ab-mv],[data-ab-rm],[data-ab-rule-on]');
    if (!t) return false;
    e.stopPropagation();
    const d = t.dataset;
    const p = B().find();
    if (d.abUse) {
      tick();
      B().use(d.abUse);
    } else if (d.abKind) {
      B().update(p.id, { kinds: { ...p.kinds, [d.abKind]: !p.kinds[d.abKind] } });
    } else if (d.abBulk) {
      B().update(p.id, { bulk: d.abBulk === 'auto' ? 'auto' : Number(d.abBulk) });
    } else if (d.abSkip !== undefined) {
      B().update(p.id, { skip: d.abSkip === '1' });
    } else if (d.abBank) {
      B().update(p.id, { banks: p.banks.includes(d.abBank) ? p.banks.filter((b) => b !== d.abBank) : p.banks.concat(d.abBank) });
    } else if (d.abMv !== undefined) {
      B().moveRule(p.id, Number(d.abMv), Number(d.abMv) + Number(d.d));
    } else if (d.abRm !== undefined) {
      if (!CA.UI.Dom.armed(t)) return true;
      B().removeRule(p.id, Number(d.abRm));
    } else if (d.abRuleOn !== undefined) {
      const i = Number(d.abRuleOn);
      B().setRule(p.id, i, { on: !p.rules[i].on });
    } else if (d.abAct === 'toggle') {
      CA.Macros.toggle('autoBuyer');
    } else if (d.abAct === 'new') {
      B().use(B().create(null).id);
    } else if (d.abAct === 'delete') {
      if (!CA.UI.Dom.armed(t)) return true;
      B().remove(p.id);
    } else if (d.abAct === 'rule') {
      B().addRule(p.id, { what: 'upgrade', effect: 'weight', k: 1 });
    } else if (d.abAct === 'rule-cheap') {
      B().addRule(p.id, { what: 'cheap', secs: 60, effect: 'first' });
    } else if (d.abAct === 'all') {
      const n = B().buyAllUpgrades();
      CA.Util.sound(n ? 'snd/buy1.mp3' : 'snd/tick.mp3');
    } else if (d.abAct === 'all-rows') {
      showAll = !showAll;
    }
    redraw();
    return true;
  }
  /** The editor's fields and selects: true when it was one of them. */
  function onChange(e) {
    const el = e.target;
    const d = el.dataset || {};
    if (d.abF === undefined && d.abRule === undefined) return false;
    const p = B().find();
    if (!p) return true;
    if (d.abF === 'name') B().update(p.id, { name: el.value.trim() || p.name });
    else if (d.abF === 'reserve') B().update(p.id, { reserve: Math.max(0, Number(el.value) || 0) });
    else if (d.abF === 'mode') B().update(p.id, { mode: el.value });
    else if (d.abRule !== undefined) {
      const v = d.k === 'what' || d.k === 'effect' || d.k === 'when' ? el.value : Number(el.value);
      B().setRule(p.id, Number(d.abRule), { [d.k]: v });
    }
    redraw();
    return true;
  }

  return { html, sync, onClick, onChange, thingName };
})();
