// Reading a word of algorithmic code where it's written: what it is, from CA.Words (core/words.js).
// The code editors' hover cards ask this; it knows the language's own words (keywords, actions,
// conditions, values, variables, named blocks, numbers) and, for a name inside ( ), which choice of
// which call it is — a macro, a profile, a spell… — and asks that kind's owner about it.
//
//   CA.ScriptWords.at(source, line, col, { vars })    the word at line (from 1) and col (from 0):
//                                                     { kind, id, from, to, ctx } or null
//   CA.ScriptWords.explain(source, line, col, opts)   its info (CA.Words.lookup), with from / to: the
//                                                     columns it spans; null when there's nothing to say
//
// A choice's kind: its param's `word` (a kind, or fn(v, params) → { kind, id }), a value's
// `paramWords` ({ param: kind }), else by the param's key: profile → 'profile.<the call's prefix>'
// (buyer.queue(profile) → profile.buyer), macro, spell, season, god → spirit, aura, building,
// upgrade, name of an effect → effect, thing → building / upgrade. A kind no one describes, or a
// name it doesn't know, falls back to the choice's own list ("a Spell — one of …").

CA.ScriptWords = (() => {
  const W = () => CA.Words;
  const S = () => CA.Script;
  const fmtNum = (v) => CA.Format.beautify(v, Number.isInteger(v) ? 0 : 2);
  const strip = (html) =>
    String(html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const valueDef = (id) => S().VALUES.find((v) => v.id === id) || null;
  const callDef = (id) => CA.Actions.get(id) || CA.Conditions.get(id) || valueDef(id);
  const paramsOf = (def) => ((def && def.params) || []).map((p) => (typeof p === 'string' ? { key: p } : p));

  // ---- tokens, with where each ends ------------------------------------------------------------------

  /** The line's tokens with `end` (the column after each); a line that doesn't tokenize: its words alone. */
  function tokens(text) {
    let toks;
    try {
      toks = S().tokenize(text);
    } catch (e) {
      toks = [];
      const re = /[A-Za-z_][\w.\-']*\w|[A-Za-z_]|[()[\],:=]/g;
      let m;
      const hash = text.indexOf('#');
      while ((m = re.exec(text)) && (hash < 0 || m.index < hash)) toks.push(/^[A-Za-z_]/.test(m[0]) ? { t: 'id', v: m[0], col: m.index } : { t: m[0] === '=' ? 'op' : 'p', v: m[0], col: m.index });
    }
    return toks.map((t, i) => {
      const next = i + 1 < toks.length ? toks[i + 1].col : text.length;
      let end = t.col + text.slice(t.col, next).replace(/\s*(#.*)?$/, '').length;
      if (t.t === 'id' || t.t === 'op' || t.t === 'p') end = t.col + String(t.v).length;
      return { ...t, end };
    });
  }

  /** Names the code gives itself: variables (x = …, for x in …, a def's params) and named blocks (def). */
  function declared(source) {
    const vars = {};
    const defs = {};
    String(source || '')
      .split('\n')
      .forEach((l, i) => {
        let m;
        if ((m = l.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
          defs[m[1]] = defs[m[1]] || { line: i + 1, params: m[2].split(',').map((s) => s.trim()).filter(Boolean), text: l.trim() };
          m[2]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((p) => (vars[p] = vars[p] || { line: i + 1, text: l.trim(), how: `a parameter of ${m[1]}()` }));
        } else if ((m = l.match(/^\s*for\s+([A-Za-z_]\w*)\s+in\s+(.+?):?\s*$/))) vars[m[1]] = vars[m[1]] || { line: i + 1, text: l.trim(), how: `each item of ${m[2]}` };
        else if ((m = l.match(/^\s*([A-Za-z_]\w*)\s*=(?!=)\s*(.+)$/))) vars[m[1]] = vars[m[1]] || { line: i + 1, text: l.trim(), how: m[2].replace(/\s*#.*$/, '') };
      });
    return { vars, defs };
  }

  /** The call a token sits inside: { call, index (its argument), key (named: key=…), tok } or null. */
  function enclosing(toks, i) {
    let depth = 0;
    let commas = 0;
    let argStart = -1; // the first token of the argument the token is in
    for (let j = i - 1; j >= 0; j--) {
      const t = toks[j];
      if (t.t !== 'p') continue;
      if (t.v === ')' || t.v === ']') depth++;
      else if (t.v === '(' || t.v === '[') {
        if (depth > 0) {
          depth--;
          continue;
        }
        const fn = toks[j - 1];
        if (t.v === '[' || !fn || fn.t !== 'id') return null;
        if (argStart < 0) argStart = j + 1;
        const a = toks[argStart];
        const eq = toks[argStart + 1];
        const key = a && a.t === 'id' && eq && eq.t === 'op' && eq.v === '=' && argStart < i ? a.v : '';
        return { call: fn.v, index: commas, key };
      } else if (t.v === ',' && depth === 0) {
        if (argStart < 0) argStart = j + 1;
        commas++;
      }
    }
    return null;
  }

  /** The call starting at token i (its name): its plain arguments by param key ({} when they aren't plain). */
  function argsAt(toks, i, def) {
    const ps = paramsOf(def);
    const out = {};
    let depth = 0;
    let k = 0;
    let named = '';
    for (let j = i + 2; j < toks.length; j++) {
      const t = toks[j];
      if (t.t === 'p' && (t.v === '(' || t.v === '[')) depth++;
      else if (t.t === 'p' && (t.v === ')' || t.v === ']')) {
        if (!depth--) break;
      } else if (!depth && t.t === 'p' && t.v === ',') {
        k++;
        named = '';
      } else if (!depth && t.t === 'id' && toks[j + 1] && toks[j + 1].v === '=') {
        named = t.v;
        j++;
      } else if (!depth && (t.t === 'id' || t.t === 'str' || t.t === 'num')) {
        const p = named ? ps.find((x) => x.key === named) : ps[k];
        if (p) out[p.key] = t.v;
      }
    }
    return out;
  }

  // the kind of word a param names, by its key (see the top)
  const BY_KEY = { macro: 'macro', spell: 'spell', season: 'season', god: 'spirit', aura: 'aura', building: 'building', upgrade: 'upgrade' };
  function choiceKind(call, def, p, v) {
    if (!p) return null;
    if (p.word) {
      const r = typeof p.word === 'function' ? p.word(v) : { kind: p.word, id: v };
      if (r) return r;
    }
    if (def && def.paramWords && def.paramWords[p.key]) return { kind: def.paramWords[p.key], id: v };
    if (p.key === 'profile') return { kind: `profile.${call.split('.')[0]}`, id: v };
    if (p.key === 'thing' || /^(building|upgrade):/.test(v)) {
      const m = String(v).match(/^(building|upgrade):(.+)$/);
      return m ? { kind: m[1], id: m[2] } : null;
    }
    if (p.key === 'name' && call === 'building') return { kind: 'building', id: v };
    if (p.key === 'name' && /^(buff|effect)/.test(call)) return { kind: 'effect', id: v };
    return BY_KEY[p.key] ? { kind: BY_KEY[p.key], id: v } : null;
  }

  /**
   * The word at `line` (from 1), `col` (from 0) of the code: { kind, id, from, to, ctx }, or null
   * (a space, a comment, a bracket). opts.vars: names the code is given (item, thing).
   */
  function at(source, line, col, opts = {}) {
    const lines = String(source || '').split('\n');
    const text = lines[line - 1];
    if (text == null) return null;
    const toks = tokens(text);
    const i = toks.findIndex((t) => col >= t.col && col < t.end);
    if (i < 0) return null;
    const t = toks[i];
    const prev = toks[i - 1];
    const next = toks[i + 1];
    const base = { from: t.col, to: t.end };
    const ctx = { line, source, text };
    const out = (kind, id, more) => ({ kind, id, ...base, ctx: { ...ctx, ...(more || {}) } });
    if (t.t === 'num') return /[a-z]/i.test(text.slice(t.col, t.end)) ? out('number', text.slice(t.col, t.end), { value: t.v, unit: t.unit }) : null;
    if (t.t === 'op' || t.t === 'p') return null;
    const v = t.v;
    // switch on <macro>
    if (prev && prev.t === 'id' && (prev.v === 'on' || prev.v === 'off') && toks[i - 2] && toks[i - 2].v === 'switch') return out('macro', v, { switch: prev.v });
    if (t.t === 'id' && S().KEYWORDS.includes(v) && !(next && next.v === '(')) return out('keyword', v);
    if (t.t === 'id' && (v === 'true' || v === 'false')) return out('keyword', v);
    const { vars, defs } = declared(source);
    if (t.t === 'id' && next && next.t === 'p' && next.v === '(') {
      if (prev && prev.v === 'def') return out('function', v, { def: defs[v] });
      if (CA.Actions.get(v)) return out('action', v, { args: argsAt(toks, i, CA.Actions.get(v)) });
      if (CA.Conditions.get(v)) return out('condition', v, { args: argsAt(toks, i, CA.Conditions.get(v)) });
      if (S().isValue(v)) return out('value', v, { args: argsAt(toks, i, valueDef(v)) });
      if (defs[v]) return out('function', v, { def: defs[v] });
      return out('unknown', v);
    }
    // key=… inside a call: that param
    const enc = enclosing(toks, i);
    if (enc && t.t === 'id' && next && next.t === 'op' && next.v === '=') {
      const def = callDef(enc.call);
      const p = paramsOf(def).find((x) => x.key === v);
      return p ? out('param', v, { call: enc.call, param: p }) : null;
    }
    if (t.t === 'id' && (vars[v] || (opts.vars || []).includes(v))) return out('variable', v, { decl: vars[v], given: (opts.vars || []).includes(v) });
    if (enc) {
      const def = callDef(enc.call);
      const ps = paramsOf(def);
      const p = enc.key ? ps.find((x) => x.key === enc.key) : ps[enc.index];
      const ck = choiceKind(enc.call, def, p, v);
      return out(ck ? ck.kind : 'choice', ck ? ck.id : v, { call: enc.call, param: p, index: enc.index, value: v, choice: true });
    }
    if (t.t === 'id' && CA.Actions.get(v)) return out('action', v);
    if (t.t === 'id' && CA.Conditions.get(v)) return out('condition', v);
    if (t.t === 'id' && S().isValue(v)) return out('value', v);
    return out('choice', v, { value: v });
  }

  /** What the word at line / col is (CA.Words info, plus from / to), or null. */
  function explain(source, line, col, opts = {}) {
    const w = at(source, line, col, opts);
    if (!w) return null;
    let info = W().lookup(w.kind, w.id, w.ctx);
    // a choice no one describes: what its list says about it
    if (!info && w.ctx.choice !== undefined) info = W().lookup('choice', w.ctx.value != null ? w.ctx.value : w.id, w.ctx);
    if (!info && w.kind !== 'choice' && w.kind !== 'unknown') info = W().lookup('choice', w.id, w.ctx);
    return info ? { ...info, from: w.from, to: w.to, line } : null;
  }

  // ---- the language's own words -----------------------------------------------------------------------

  const KEYWORDS = {
    if: ['if <condition>:', 'Runs the block under it when the condition holds.'],
    elif: ['elif <condition>:', 'After an if: runs its block when the ones above didn’t and this condition holds.'],
    else: ['else:', 'After an if: runs its block when none of the conditions above held.'],
    for: ['for x in [a, b] / list():', 'Runs the block once per item, the name standing for that item.'],
    in: ['for x in …', 'What a for goes through: a [list] or a live list such as stocks().'],
    repeat: ['repeat until … / repeat N times:', 'Runs the block on every pass until the condition holds, or N times.'],
    until: ['repeat until … / wait until …', 'Until the condition after it holds.'],
    while: ['while <condition>:', 'Runs the block on every pass as long as the condition holds.'],
    times: ['repeat N times:', 'The block N times (one per pass).'],
    forever: ['forever:', 'The block again and again, for as long as the macro is on.'],
    parallel: ['parallel:', 'Branches side by side: each branch: block runs at the same time as the others.'],
    branch: ['branch [name]:', 'One branch of a parallel: block.'],
    wait: ['wait until … / wait N seconds', 'Waits for something to hold, or pauses.'],
    seconds: ['wait N seconds', 'A pause in seconds.'],
    second: ['wait 1 second', 'A pause in seconds.'],
    minutes: ['wait N minutes', 'A pause in minutes.'],
    minute: ['wait 1 minute', 'A pause in minutes.'],
    stop: ['stop', 'Ends the macro here.'],
    log: ['log "text" / log <value>', 'Writes to the macro’s trace (under the editor while it runs).'],
    switch: ['switch on / off <macro>', 'Switches another macro on or off, by its id or "its name".'],
    on: ['switch on <macro>', 'Switches the macro after it on.'],
    off: ['switch off <macro>', 'Switches the macro after it off.'],
    and: ['… and …', 'Both conditions hold.'],
    or: ['… or …', 'Either condition holds.'],
    not: ['not …', 'The condition after it doesn’t hold.'],
    true: ['true', 'Yes: a condition that always holds.'],
    false: ['false', 'No: a condition that never holds.'],
    def: ['def name(x):', 'A named block, called like an action: name(…).'],
    return: ['return <value>', 'A statistic’s result: what it shows (no return: nothing to show).'],
  };
  W().defineKind('keyword', {
    name: 'Keyword',
    info: (id) => (KEYWORDS[id] ? { title: id, sig: KEYWORDS[id][0], desc: KEYWORDS[id][1] } : null),
  });

  const optionsOf = (p) => {
    try {
      return (typeof p.options === 'function' ? p.options() : p.options) || [];
    } catch (e) {
      return [];
    }
  };
  const paramRow = (p, args) => {
    if (args && args[p.key] !== undefined) return [p.key, `${S().litText(args[p.key])}${p.label && p.label !== p.key ? ` (${p.label})` : ''}`];
    const opts = p.type === 'select' ? optionsOf(p) : [];
    const what = p.label && p.label !== p.key ? p.label : '';
    const def = p.default !== undefined && p.default !== '' ? `default ${S().litText(p.default)}` : '';
    return [p.key, [what, opts.length ? `${opts.length} choices` : p.type === 'number' ? 'a number' : p.type === 'bool' ? 'yes / no' : '', def].filter(Boolean).join(' · ') || ' '];
  };
  const sigOf = (id, def) => `${id}(${paramsOf(def)
    .map((p) => p.key)
    .join(', ')})`;

  W().defineKind('action', {
    name: 'Action',
    info: (id, ctx) => {
      const a = CA.Actions.get(id);
      if (!a) return null;
      let here = '';
      try {
        here = ctx.args && Object.keys(ctx.args).length ? CA.Actions.describe({ action: id, params: ctx.args }) : '';
      } catch (e) {
        here = '';
      }
      let avail = true;
      try {
        avail = a.available();
      } catch (e) {
        avail = false;
      }
      return {
        title: a.name,
        tag: `Action · ${a.group}`,
        sig: sigOf(id, a),
        desc: a.desc || (here && here !== a.name ? `Here: ${here[0].toLowerCase()}${here.slice(1)}.` : ''),
        rows: paramsOf(a).map((p) => paramRow(p, ctx.args)),
        note: avail ? '' : 'Can’t run right now (its minigame or upgrade isn’t there yet).',
      };
    },
  });
  W().defineKind('condition', {
    name: 'Condition',
    info: (id, ctx) => {
      const c = CA.Conditions.get(id);
      if (!c) return null;
      let here = '';
      try {
        here = c.describe && ctx.args && Object.keys(ctx.args).length ? c.describe(CA.Conditions.paramsFor(id, ctx.args)) : '';
      } catch (e) {
        here = '';
      }
      return { title: c.name, sig: sigOf(id, c), desc: c.desc || (here ? `Here: holds when ${here}.` : 'Holds or not: use it after if, while, until…'), rows: paramsOf(c).map((p) => paramRow(p, ctx.args)) };
    },
  });
  const showNow = (v) => (typeof v === 'boolean' ? (v ? 'yes' : 'no') : typeof v === 'number' ? (Number.isFinite(v) ? fmtNum(v) : '—') : Array.isArray(v) ? `${v.length} item${v.length === 1 ? '' : 's'}` : v === '' ? '(nothing)' : String(v));
  W().defineKind('value', {
    name: 'Value',
    info: (id) => {
      const v = valueDef(id);
      if (!v) return null;
      const rows = (v.params || []).map((p) => [p, ' ']);
      if (!(v.params || []).length && !v.context) {
        try {
          rows.push(['now', showNow(v.get())]);
        } catch (e) {
          /* not available yet */
        }
      }
      const desc = String(v.desc || '').replace(/([^.!?…)])$/, '$1.');
      return {
        title: id,
        tag: v.group ? `Value · ${v.group}` : v.list ? 'Value · a list' : v.bool ? 'Value · yes / no' : 'Value',
        sig: `${id}(${(v.params || []).join(', ')})`,
        desc: desc ? desc[0].toUpperCase() + desc.slice(1) : '',
        rows,
        note: v.context ? 'Only in a statistic about an item: the hovered building or upgrade.' : '',
      };
    },
  });
  W().defineKind('variable', {
    name: 'Variable',
    info: (id, ctx) => {
      if (ctx.decl) return { title: id, sig: ctx.decl.text, desc: /^each item/.test(ctx.decl.how) || /^a parameter/.test(ctx.decl.how) ? `Stands for ${ctx.decl.how}.` : `Set to ${ctx.decl.how}.`, rows: [['set on', `line ${ctx.decl.line}`]] };
      if (ctx.given) return { title: id, desc: id === 'item' ? 'The item a statistic is about: the hovered building or upgrade.' : id === 'thing' ? 'What the rule is ranking: "building:Cursor" or "upgrade:Kitten helpers".' : 'A name the code is given.' };
      return null;
    },
  });
  W().defineKind('function', {
    name: 'Named block',
    info: (id, ctx) => (ctx.def ? { title: id, sig: ctx.def.text, desc: `A block of this code, written under def ${id}(…): calling it runs that block.`, rows: [['written on', `line ${ctx.def.line}`]] } : null),
  });
  W().defineKind('param', {
    name: 'Option',
    info: (id, ctx) => {
      const p = ctx.param;
      if (!p) return null;
      const r = paramRow(p);
      return { title: `${id}=`, sig: `${ctx.call}(${id}=…)`, desc: `${p.label || id}: an option of ${ctx.call}(), by name.`, rows: [[id, r[1]]] };
    },
  });
  W().defineKind('number', {
    name: 'Number',
    info: (id, ctx) => {
      if (ctx.unit) return { title: id, desc: `${ctx.value} ${ctx.unit === 's' ? 'seconds' : 'minutes'}.` };
      return { title: id, desc: `${Number(ctx.value).toLocaleString('en-US', { maximumFractionDigits: 3 })} (${fmtNum(ctx.value)}).` };
    },
  });

  /** A choice no one describes: the list it's from, and what it's called there. */
  W().defineKind('choice', {
    name: 'Name',
    info: (id, ctx) => {
      const p = ctx.param;
      if (p && p.type === 'select') {
        const opts = optionsOf(p);
        const o = opts.find((x) => String(x.v) === String(id)) || opts.find((x) => String(x.label).toLowerCase() === String(id).toLowerCase());
        const others = opts.slice(0, 8).map((x) => S().litText(x.v));
        return {
          title: o ? String(o.label) : String(id),
          tag: p.label || p.key,
          sig: `${ctx.call}(${paramsOf(callDef(ctx.call))
            .map((x) => (x === p ? S().litText(id) : x.key))
            .join(', ')})`,
          desc: o ? `${o.tip || `One of the ${opts.length} choices for ${p.key}`}.` : `Not one of the choices for ${p.key}.`,
          note: `Choices: ${others.join(', ')}${opts.length > others.length ? ', …' : ''}`,
        };
      }
      // a name written alone, or for a param without a list: the Lookup's lists
      const groups = S()
        .lookups()
        .filter((g) => g.items.some((it) => String(it.v) === String(id)));
      if (!groups.length) return p ? { title: String(id), tag: p.label || p.key, desc: `What ${ctx.call}() is given as ${p.key}.` } : null;
      const it = groups[0].items.find((x) => String(x.v) === String(id));
      return { title: it.label, tag: groups.map((g) => g.name).join(' · '), desc: `A name for ${groups[0].uses.slice(0, 2).join(', ')}.` };
    },
  });

  // ---- game things named in the code ------------------------------------------------------------------

  W().defineKind('building', {
    name: 'Building',
    info: (id) => {
      const b = Game.Objects && Game.Objects[id];
      if (!b) return null;
      return { title: id, desc: strip(b.desc), rows: [['owned', fmtNum(b.amount || 0)], ['price', fmtNum(b.price || 0)]] };
    },
  });
  W().defineKind('upgrade', {
    name: 'Upgrade',
    info: (id) => {
      const u = Game.Upgrades && Game.Upgrades[id];
      if (!u) return null;
      return { title: id, desc: strip(u.desc), card: { pop: 'upgrade', data: { upgrade: id } } };
    },
  });
  W().defineKind('season', {
    name: 'Season',
    info: (id) => {
      const s = Game.seasons && Game.seasons[id];
      if (!s && !CA.Seasons.SEASONS.some((x) => x.v === id)) return null;
      const all = CA.Seasons.dropsOf(id, 'all');
      const owned = all.filter((n) => CA.Util.has(n)).length;
      return {
        title: (s && s.name) || (CA.Seasons.SEASONS.find((x) => x.v === id) || { label: id }).label,
        desc: strip(s && s.desc) || 'A season.',
        rows: [all.length ? ['drops owned', `${owned} of ${all.length}`] : null, ['on now', Game.season === id ? 'yes' : 'no']].filter(Boolean),
      };
    },
  });
  W().defineKind('effect', {
    name: 'Effect',
    info: (id) => {
      const b = Game.buffs && Game.buffs[id];
      return { title: id, desc: b ? strip(b.desc) : 'A golden cookie, spell or other temporary effect, by its name in the game.', rows: [['active', b ? `${Math.ceil((b.time || 0) / (Game.fps || 30))}s left` : 'no']] };
    },
  });

  return { at, explain, declared, tokens };
})();
