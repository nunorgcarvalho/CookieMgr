// The language of **algorithmic macros**: a little pseudo-code, indented like Python, compiled to
// the flow blocks features/macros.js runs.
//
//   # a comment
//   pop.golden()                      run an action — its options by position or by name:
//   season.keep(christmas)            season.keep(season=christmas)
//   switch on reindeer                switch another macro on / off (by id or "its name")
//   wait until magic() >= 80          wait for something
//   wait 30 seconds                   (or minutes)
//   repeat until <condition>:         run the block on every pass until the condition holds
//   while <condition>:                …as long as it holds
//   repeat 5 times:                   the block 5 times (one per pass)
//   forever:                          the block again and again
//   if <condition>:  elif …:  else:
//   for season in [easter, halloween]:   the block once per item, with `season` standing for it
//   parallel:                         branches side by side (each one a `branch [name]:` block)
//   stop                              end the macro here
//   log "text"                        write to its trace
//
// Conditions: condition calls (season.complete(christmas), buff(Frenzy)), comparisons of values
// (owned(christmas, upgrades) >= total(christmas, upgrades), cookies() > 1e12, season == easter),
// joined with and / or / not and brackets. Numbers can be written 1e12, 25K, 2.5M, 3B, 1T…
// Values: see VALUES below (and any recorded state: state(cookies)).
//
// Every block keeps the line it came from, so a running macro can show where it is.

CA.Script = (() => {
  const KEYWORDS = ['if', 'elif', 'else', 'for', 'in', 'repeat', 'until', 'while', 'times', 'forever', 'parallel', 'branch', 'wait', 'seconds', 'second', 'minutes', 'minute', 'stop', 'log', 'switch', 'on', 'off', 'and', 'or', 'not'];
  const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15, qi: 1e18 };

  // ---- values: numbers a condition can compare -------------------------------------------------

  const has = (n) => typeof Game.Has === 'function' && Game.Has(n);
  const VALUES = [
    { id: 'cookies', desc: 'cookies in the bank', get: () => Game.cookies || 0 },
    { id: 'cps', desc: 'cookies per second (as the game shows it)', get: () => Game.cookiesPs || 0 },
    { id: 'rawCps', desc: 'cookies per second without effects', get: () => Game.cookiesPsRaw || Game.unbuffedCps || 0 },
    { id: 'magic', desc: 'Grimoire magic', get: () => ((Game.Objects && Game.Objects['Wizard tower'] && Game.Objects['Wizard tower'].minigame) || {}).magic || 0 },
    { id: 'lumps', desc: 'sugar lumps', get: () => Game.lumps || 0 },
    { id: 'santaLevel', desc: 'Santa’s level (14 = Final Claus)', get: () => Game.santaLevel || 0 },
    { id: 'elderWrath', desc: 'the Grandmapocalypse’s stage (0 none … 3 angered)', get: () => Game.elderWrath || 0 },
    { id: 'researchOwned', desc: 'research upgrades owned (of 9)', get: () => (CA.AutoBuy ? CA.AutoBuy.RESEARCH.filter(has).length : 0) },
    {
      id: 'owned',
      desc: 'how many of a season’s drops you own — part: all, upgrades or cookies',
      params: ['season', 'part'],
      get: (season, part) => CA.Seasons.dropsOf(season, part || 'all').filter(has).length,
    },
    {
      id: 'total',
      desc: 'how many drops a season has — part: all, upgrades or cookies',
      params: ['season', 'part'],
      get: (season, part) => CA.Seasons.dropsOf(season, part || 'all').length,
    },
    {
      id: 'building',
      desc: 'how many of a building you own',
      params: ['name'],
      get: (name) => ((Game.Objects && Game.Objects[name]) || {}).amount || 0,
    },
    {
      id: 'state',
      desc: 'a recorded state (CpS, cookies, prestige…), as on the Graphs page',
      params: ['id'],
      get: (id) => {
        const fr = CA.Recorder.frames();
        const last = fr[fr.length - 1];
        return last && Number.isFinite(last[id]) ? last[id] : NaN;
      },
    },
  ];
  const valueById = {};
  VALUES.forEach((v) => (valueById[v.id] = v));

  // ---- tokens ---------------------------------------------------------------------------------

  /** One line → tokens { t: 'id' | 'num' | 'str' | 'op' | 'p', v }. Throws { col, message }. */
  function tokenize(text) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === ' ' || c === '\t') {
        i++;
        continue;
      }
      if (c === '#') break;
      if (c === '"' || c === "'") {
        const end = text.indexOf(c, i + 1);
        if (end < 0) throw { col: i, message: 'a quote that isn’t closed' };
        out.push({ t: 'str', v: text.slice(i + 1, end), col: i });
        i = end + 1;
        continue;
      }
      const dur = text.slice(i).match(/^(\d+(?:\.\d+)?)(s|sec|secs|min|mins)(?![A-Za-z_])/i);
      if (dur) {
        out.push({ t: 'num', v: Number(dur[1]), base: Number(dur[1]), unit: /^s/i.test(dur[2]) ? 's' : 'min', col: i });
        i += dur[0].length;
        continue;
      }
      const num = text.slice(i).match(/^(\d+(?:\.\d+)?(?:e[+-]?\d+)?)(qa|qi|k|m|b|t)?(?![A-Za-z_])/i);
      if (num) {
        out.push({ t: 'num', v: Number(num[1]) * (num[2] ? SUFFIX[num[2].toLowerCase()] : 1), base: Number(num[1]), sfx: (num[2] || '').toLowerCase(), col: i });
        i += num[0].length;
        continue;
      }
      const id = text.slice(i).match(/^[A-Za-z_][\w.\-']*\w|^[A-Za-z_]/);
      if (id) {
        out.push({ t: 'id', v: id[0], col: i });
        i += id[0].length;
        continue;
      }
      const op = text.slice(i).match(/^(>=|<=|==|!=|>|<|=)/);
      if (op) {
        out.push({ t: 'op', v: op[0], col: i });
        i += op[0].length;
        continue;
      }
      if ('()[],:'.includes(c)) {
        out.push({ t: 'p', v: c, col: i });
        i++;
        continue;
      }
      throw { col: i, message: `“${c}” isn’t something I understand here` };
    }
    return out;
  }

  // ---- lines → a tree by indentation --------------------------------------------------------------

  /** The line without its comment (a # outside quotes and everything after it). */
  function withoutComment(text) {
    let q = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === q) q = '';
      } else if (c === '"' || c === "'") q = c;
      else if (c === '#') return text.slice(0, i);
    }
    return text;
  }

  function lineTree(source) {
    const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
    const root = { indent: -1, children: [] };
    const stack = [root];
    const errors = [];
    lines.forEach((raw, i) => {
      const text = raw.replace(/\t/g, '  ');
      const body = withoutComment(text);
      if (!body.trim()) return;
      const indent = text.length - text.trimStart().length;
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
      const parent = stack[stack.length - 1];
      let tokens = [];
      try {
        tokens = tokenize(body);
      } catch (e) {
        errors.push({ line: i + 1, message: e.message });
        return;
      }
      const node = { line: i + 1, indent, tokens, text: text.trim(), children: [] };
      parent.children.push(node);
      stack.push(node);
    });
    return { root, errors };
  }

  // ---- parsing statements and expressions -----------------------------------------------------------

  class Err extends Error {
    constructor(message) {
      super(message);
      this.script = true;
    }
  }

  /** A cursor over one line's tokens, with the loop variables in scope substituted. */
  function cursor(tokens, scope) {
    const toks = tokens.map((t) => (t.t === 'id' && scope && Object.prototype.hasOwnProperty.call(scope, t.v) ? { ...t, t: 'id', v: scope[t.v], sub: true } : t));
    let i = 0;
    return {
      peek: (k = 0) => toks[i + k],
      next: () => toks[i++],
      done: () => i >= toks.length,
      is: (t, v) => toks[i] && toks[i].t === t && (v === undefined || toks[i].v === v),
      take(t, v, what) {
        if (!this.is(t, v)) throw new Err(`expected ${what || v || t}${toks[i] ? `, found “${toks[i].v}”` : ' at the end of the line'}`);
        return toks[i++];
      },
      rest: () => toks.slice(i),
    };
  }

  /** "(a, b=c)" → { pos: [...], named: {...} } (the opening "(" already taken). */
  function args(c) {
    const pos = [];
    const named = {};
    if (c.is('p', ')')) {
      c.next();
      return { pos, named };
    }
    for (;;) {
      if (c.is('id') && c.peek(1) && c.peek(1).t === 'op' && c.peek(1).v === '=') {
        const k = c.next().v;
        c.next();
        named[k] = literal(c);
      } else pos.push(literal(c));
      if (c.is('p', ',')) {
        c.next();
        continue;
      }
      c.take('p', ')', '“)”');
      return { pos, named };
    }
  }
  function literal(c) {
    const t = c.next();
    if (!t) throw new Err('expected a value');
    if (t.t === 'num' || t.t === 'str') return t.v;
    if (t.t === 'id') return t.v === 'true' ? true : t.v === 'false' ? false : t.v;
    throw new Err(`expected a value, found “${t.v}”`);
  }

  /** Positional + named arguments → an action's / condition's params object. */
  function bind(def, a, what) {
    const params = {};
    const list = def.params || [];
    a.pos.forEach((v, k) => {
      if (!list[k]) throw new Err(`${what} takes ${list.length || 'no'} option${list.length === 1 ? '' : 's'}`);
      params[list[k].key] = v;
    });
    Object.keys(a.named).forEach((k) => {
      if (!list.some((p) => p.key === k)) throw new Err(`${what} has no option “${k}” (it has: ${list.map((p) => p.key).join(', ') || 'none'})`);
      params[k] = a.named[k];
    });
    return params;
  }

  // expressions: or > and > not > comparison / call
  function expr(c) {
    let a = andExpr(c);
    while (c.is('id', 'or')) {
      c.next();
      a = { t: 'or', a, b: andExpr(c) };
    }
    return a;
  }
  function andExpr(c) {
    let a = notExpr(c);
    while (c.is('id', 'and')) {
      c.next();
      a = { t: 'and', a, b: notExpr(c) };
    }
    return a;
  }
  function notExpr(c) {
    if (c.is('id', 'not')) {
      c.next();
      return { t: 'not', a: notExpr(c) };
    }
    return atom(c);
  }
  function operand(c) {
    const t = c.peek();
    if (!t) throw new Err('expected something to compare');
    if (t.t === 'num' || t.t === 'str') return { v: 'lit', x: c.next().v };
    if (t.t === 'id') {
      c.next();
      if (c.is('p', '(')) {
        c.next();
        const a = args(c);
        const def = valueById[t.v];
        if (!def) throw new Err(`“${t.v}” isn’t a value (values: ${VALUES.map((v) => v.id).join(', ')})`);
        return { v: 'fn', id: t.v, args: a.pos.concat(Object.values(a.named)) };
      }
      if (valueById[t.v] && !t.sub) return { v: 'fn', id: t.v, args: [] };
      return { v: 'lit', x: t.v };
    }
    throw new Err(`expected something to compare, found “${t.v}”`);
  }
  /** At an id: is it (with its call, if any) followed by a comparison? — then it's a value. */
  function comparedAfter(c) {
    let k = 1;
    if (c.peek(1) && c.peek(1).t === 'p' && c.peek(1).v === '(') {
      for (let depth = 0; c.peek(k); k++) {
        const t = c.peek(k);
        if (t.t === 'p' && t.v === '(') depth++;
        else if (t.t === 'p' && t.v === ')' && --depth === 0) break;
      }
      k++;
    }
    const nx = c.peek(k);
    return !!nx && nx.t === 'op' && nx.v !== '=';
  }
  function atom(c) {
    if (c.is('p', '(')) {
      c.next();
      const e = expr(c);
      c.take('p', ')', '“)”');
      return e;
    }
    const t = c.peek();
    // a condition call: an id with "(" that is a known condition (and isn't followed by a comparison)
    if (t && t.t === 'id' && CA.Conditions.get(t.v) && !(valueById[t.v] && comparedAfter(c))) {
      c.next();
      let a = { pos: [], named: {} };
      if (c.is('p', '(')) {
        c.next();
        a = args(c);
      }
      const def = CA.Conditions.get(t.v);
      return { t: 'cond', id: t.v, params: bind(def, a, t.v) };
    }
    const l = operand(c);
    const op = c.peek();
    if (!op || op.t !== 'op' || op.v === '=') throw new Err(`“${t ? t.v : ''}” isn’t a condition — compare it with >=, <=, >, <, == or !=`);
    c.next();
    return { t: 'cmp', op: op.v, l, r: operand(c) };
  }

  /** The blocks for a list of lines (siblings), with `scope` (loop variables). */
  function block(lines, scope, errors) {
    const out = [];
    for (let k = 0; k < lines.length; k++) {
      const ln = lines[k];
      try {
        const node = statement(ln, scope, errors, lines, k);
        if (node && node.skip) k += node.skip;
        if (node && node.node) out.push(...[].concat(node.node));
      } catch (e) {
        if (!e.script) throw e;
        errors.push({ line: ln.line, message: e.message });
      }
    }
    return out;
  }

  function needBlock(ln, what) {
    if (!ln.children.length) throw new Err(`${what} needs an indented block under it`);
  }
  const endColon = (c) => {
    c.take('p', ':', '“:”');
    if (!c.done()) throw new Err('nothing should come after the “:”');
  };

  function statement(ln, scope, errors, siblings, k) {
    const c = cursor(ln.tokens, scope);
    const t = c.peek();
    const line = ln.line;
    const sub = (s) => block(ln.children, s || scope, errors);
    if (t.t !== 'id') throw new Err(`a line should start with an action or a keyword, not “${t.v}”`);
    const kw = t.v;
    if (kw === 'if') {
      c.next();
      const cond = expr(c);
      endColon(c);
      needBlock(ln, 'if');
      // elif / else chain
      const node = { type: 'if', cond, then: sub(), else: [], line };
      let tail = node;
      let used = 0;
      for (let j = k + 1; j < siblings.length; j++) {
        const nx = siblings[j];
        const nc = cursor(nx.tokens, scope);
        if (nc.is('id', 'elif')) {
          nc.next();
          const cond2 = expr(nc);
          endColon(nc);
          needBlock(nx, 'elif');
          const n2 = { type: 'if', cond: cond2, then: block(nx.children, scope, errors), else: [], line: nx.line };
          tail.else = [n2];
          tail = n2;
          used++;
        } else if (nc.is('id', 'else')) {
          nc.next();
          endColon(nc);
          needBlock(nx, 'else');
          tail.else = block(nx.children, scope, errors);
          used++;
          break;
        } else break;
      }
      return { node, skip: used };
    }
    if (kw === 'elif' || kw === 'else') throw new Err(`“${kw}” without an “if” before it`);
    if (kw === 'repeat') {
      c.next();
      if (c.is('id', 'until')) {
        c.next();
        const cond = expr(c);
        endColon(c);
        needBlock(ln, 'repeat until');
        return { node: { type: 'until', cond, body: sub(), line } };
      }
      const n = c.take('num', undefined, 'a number of times, or “until”').v;
      c.take('id', 'times', '“times”');
      endColon(c);
      needBlock(ln, 'repeat');
      return { node: { type: 'times', n: Math.max(0, Math.floor(n)), body: sub(), line } };
    }
    if (kw === 'while') {
      c.next();
      const cond = expr(c);
      endColon(c);
      needBlock(ln, 'while');
      return { node: { type: 'until', cond: { t: 'not', a: cond }, body: sub(), line } };
    }
    if (kw === 'forever') {
      c.next();
      endColon(c);
      needBlock(ln, 'forever');
      return { node: { type: 'forever', body: sub(), line } };
    }
    if (kw === 'for') {
      c.next();
      const name = c.take('id', undefined, 'a name for each item').v;
      c.take('id', 'in', '“in”');
      c.take('p', '[', '“[”');
      const items = [];
      while (!c.is('p', ']')) {
        items.push(literal(c));
        if (c.is('p', ',')) c.next();
        else if (!c.is('p', ']')) throw new Err('items are separated by commas');
      }
      c.next();
      endColon(c);
      needBlock(ln, 'for');
      // once per item, with `name` standing for it (unrolled: each keeps its own lines)
      const nodes = [];
      items.forEach((it) => nodes.push(...block(ln.children, { ...scope, [name]: String(it) }, errors)));
      return { node: nodes };
    }
    if (kw === 'parallel') {
      c.next();
      endColon(c);
      needBlock(ln, 'parallel');
      const branches = [];
      const labels = [];
      ln.children.forEach((ch) => {
        const bc = cursor(ch.tokens, scope);
        if (!bc.is('id', 'branch')) {
          errors.push({ line: ch.line, message: 'inside “parallel:” every block starts with “branch:” (or “branch name:”)' });
          return;
        }
        bc.next();
        labels.push(bc.is('id') ? bc.next().v : `${labels.length + 1}`);
        try {
          endColon(bc);
          needBlock(ch, 'branch');
        } catch (e) {
          errors.push({ line: ch.line, message: e.message });
          return;
        }
        branches.push(block(ch.children, scope, errors));
      });
      return { node: { type: 'parallel', branches, labels, line } };
    }
    if (kw === 'branch') throw new Err('“branch:” only goes inside “parallel:”');
    if (kw === 'wait') {
      c.next();
      if (c.is('id', 'until')) {
        c.next();
        const cond = expr(c);
        if (!c.done()) throw new Err('something extra at the end of the line');
        return { node: { type: 'wait', cond, line } };
      }
      const tok = c.take('num', undefined, '“until …” or a time');
      // 30s / 2min written together; 5m is five minutes here (not five million seconds)
      if (tok.unit) return { node: { type: 'sleep', secs: tok.unit === 's' ? tok.base : tok.base * 60, line } };
      if (tok.sfx === 'm' && !c.is('id')) return { node: { type: 'sleep', secs: tok.base * 60, line } };
      if (tok.sfx) throw new Err(`a time is in seconds or minutes — “${tok.base}${tok.sfx}” isn’t one`);
      const n = tok.v;
      const unit = c.is('id') ? c.next().v : 'seconds';
      if (!/^(second|seconds|s|sec|secs|minute|minutes|min|mins|m)$/.test(unit)) throw new Err('a time is in seconds or minutes');
      return { node: { type: 'sleep', secs: /^m/.test(unit) ? n * 60 : n, line } };
    }
    if (kw === 'stop') {
      c.next();
      return { node: { type: 'stop', line } };
    }
    if (kw === 'log') {
      c.next();
      const v = c.next();
      return { node: { type: 'log', text: v ? String(v.v) : '', line } };
    }
    if (kw === 'switch') {
      c.next();
      const to = c.take('id', undefined, '“on” or “off”').v;
      if (to !== 'on' && to !== 'off') throw new Err('switch on … / switch off …');
      const which = c.next();
      if (!which) throw new Err('which macro? (its id, or its name in quotes)');
      const m = CA.Macros.get(which.v) || CA.Macros.list().find((x) => x.name.toLowerCase() === String(which.v).toLowerCase());
      if (!m) throw new Err(`there’s no macro “${which.v}”`);
      return { node: { type: 'do', action: 'macro.set', params: { macro: m.id, to }, line } };
    }
    // an action
    const a = CA.Actions.get(kw);
    if (!a) {
      if (KEYWORDS.includes(kw)) throw new Err(`“${kw}” can’t start a line`);
      throw new Err(`“${kw}” isn’t an action — pick one from the list beside the editor`);
    }
    c.next();
    let ar = { pos: [], named: {} };
    if (c.is('p', '(')) {
      c.next();
      ar = args(c);
    }
    if (!c.done()) throw new Err('something extra at the end of the line');
    return { node: { type: 'do', action: kw, params: bind(a, ar, kw), line } };
  }

  /** Source → { flow: blocks, errors: [{ line, message }] }. */
  function compile(source) {
    const { root, errors } = lineTree(source);
    let flow = [];
    try {
      flow = block(root.children, {}, errors);
    } catch (e) {
      errors.push({ line: 0, message: String(e.message || e) });
    }
    errors.sort((x, y) => x.line - y.line);
    return { flow, errors };
  }

  // ---- evaluating conditions (with an explanation) ---------------------------------------------

  const fmtNum = (v) => (CA.UI && CA.UI.Plot ? CA.UI.Plot.fmt.beautify(v, Number.isInteger(v) ? 0 : 2) : String(v));
  function valueOf(o) {
    if (o.v === 'lit') return o.x;
    const def = valueById[o.id];
    try {
      return def ? def.get(...o.args) : NaN;
    } catch (e) {
      return NaN;
    }
  }
  const showOperand = (o, v) => (o.v === 'lit' ? String(o.x) : `${o.id}(${o.args.join(', ')}) = ${typeof v === 'number' ? fmtNum(v) : v}`);

  /** Evaluates a condition: { ok, text } — text with the values it saw ("owned(christmas, upgrades) = 12 ≥ 15 ✗"). */
  function evaluate(e) {
    if (!e) return { ok: false, text: '?' };
    if (e.all) return { ok: CA.Conditions.test(e), text: CA.Conditions.describe(e) }; // blocks from before v2.24
    if (e.t === 'and' || e.t === 'or') {
      const a = evaluate(e.a);
      // short-circuit like the words say
      if (e.t === 'and' && !a.ok) return { ok: false, text: `${a.text} and …` };
      if (e.t === 'or' && a.ok) return { ok: true, text: `${a.text} or …` };
      const b = evaluate(e.b);
      return { ok: e.t === 'and' ? a.ok && b.ok : a.ok || b.ok, text: `${a.text} ${e.t} ${b.text}` };
    }
    if (e.t === 'not') {
      const a = evaluate(e.a);
      return { ok: !a.ok, text: `not (${a.text})` };
    }
    if (e.t === 'cond') {
      const ok = CA.Conditions.test({ all: [{ cond: e.id, params: e.params, not: false }] });
      return { ok, text: `${CA.Conditions.describe({ all: [{ cond: e.id, params: e.params, not: false }] })} ${ok ? '✓' : '✗'}` };
    }
    const l = valueOf(e.l);
    const r = valueOf(e.r);
    let ok = false;
    const nl = Number(l);
    const nr = Number(r);
    const numeric = Number.isFinite(nl) && Number.isFinite(nr) && typeof l !== 'string' && typeof r !== 'string';
    if (e.op === '==') ok = numeric ? nl === nr : String(l) === String(r);
    else if (e.op === '!=') ok = numeric ? nl !== nr : String(l) !== String(r);
    else if (numeric) ok = e.op === '>=' ? nl >= nr : e.op === '<=' ? nl <= nr : e.op === '>' ? nl > nr : nl < nr;
    const sym = { '>=': '≥', '<=': '≤', '==': '=', '!=': '≠', '>': '>', '<': '<' }[e.op];
    return { ok, text: `${showOperand(e.l, l)} ${sym} ${showOperand(e.r, r)} ${ok ? '✓' : '✗'}` };
  }

  // ---- blocks → source (for macros made with the v2.22 block editor) -----------------------------

  /** A value as code: bare when it's a plain word (hand → hand), quoted otherwise ("hand of fate", ">="). */
  const litText = (v) => (typeof v === 'string' && !/^[A-Za-z_][\w.\-']*$/.test(v) ? `"${v}"` : String(v));
  function argText(def, params) {
    const list = (def && def.params) || [];
    const vals = list.map((p) => (params && params[p.key] !== undefined ? params[p.key] : p.default));
    // trailing defaults are left out — unless they were written out (params has them)
    const given = (k) => !!params && params[list[k].key] !== undefined;
    while (vals.length && list[vals.length - 1] && vals[vals.length - 1] === list[vals.length - 1].default && !given(vals.length - 1)) vals.pop();
    return vals.map(litText).join(', ');
  }
  function condText(c) {
    if (!c) return 'true';
    if (c.all) return c.all.map((x) => `${x.not ? 'not ' : ''}${x.cond}(${argText(CA.Conditions.get(x.cond), x.params)})`).join(' and ');
    if (c.t === 'and' || c.t === 'or') return `${condText(c.a)} ${c.t} ${condText(c.b)}`;
    if (c.t === 'not') return `not ${condText(c.a)}`;
    if (c.t === 'cond') return `${c.id}(${argText(CA.Conditions.get(c.id), c.params)})`;
    const op = (o) => (o.v === 'lit' ? String(o.x) : `${o.id}(${o.args.join(', ')})`);
    return `${op(c.l)} ${c.op} ${op(c.r)}`;
  }
  function decompile(nodes, depth = 0) {
    const pad = '  '.repeat(depth);
    return (nodes || [])
      .map((n) => {
        if (n.type === 'do') return `${pad}${n.action}(${argText(CA.Actions.get(n.action), n.params)})`;
        if (n.type === 'wait') return `${pad}wait until ${condText(n.cond)}`;
        if (n.type === 'sleep') return `${pad}wait ${n.secs} seconds`;
        if (n.type === 'until') return `${pad}repeat until ${condText(n.cond)}:\n${decompile(n.body, depth + 1) || `${pad}  log "…"`}`;
        if (n.type === 'times') return `${pad}repeat ${n.n} times:\n${decompile(n.body, depth + 1)}`;
        if (n.type === 'forever') return `${pad}forever:\n${decompile(n.body, depth + 1)}`;
        if (n.type === 'stop') return `${pad}stop`;
        if (n.type === 'log') return `${pad}log "${n.text}"`;
        if (n.type === 'if') return `${pad}if ${condText(n.cond)}:\n${decompile(n.then, depth + 1)}${n.else && n.else.length ? `\n${pad}else:\n${decompile(n.else, depth + 1)}` : ''}`;
        if (n.type === 'parallel') return `${pad}parallel:\n${(n.branches || []).map((b, i) => `${pad}  branch${n.labels && n.labels[i] ? ` ${n.labels[i]}` : ''}:\n${decompile(b, depth + 2)}`).join('\n')}`;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  // ---- the library beside the editor ------------------------------------------------------------

  /** Everything you can write, for the side table: [{ kind, id, sig, desc, group, insert }]. */
  function library() {
    const items = [];
    const sig = (id, def) => `${id}(${((def && def.params) || []).map((p) => p.key).join(', ')})`;
    const snippet = (id, def) => `${id}(${argText(def, {}) || ((def && def.params) || []).map((p) => (p.default !== undefined && p.default !== '' ? litText(p.default) : p.key)).join(', ')})`;
    CA.Actions.all().forEach((a) => items.push({ kind: 'action', id: a.id, sig: sig(a.id, a), desc: a.name, group: a.group, icon: a.icon, insert: snippet(a.id, a) }));
    CA.Conditions.all().forEach((c) => items.push({ kind: 'condition', id: c.id, sig: sig(c.id, c), desc: c.name, group: 'Conditions', icon: c.icon, insert: snippet(c.id, c) }));
    VALUES.forEach((v) => items.push({ kind: 'value', id: v.id, sig: `${v.id}(${(v.params || []).join(', ')})`, desc: v.desc, group: 'Values', icon: 'graphs', insert: `${v.id}(${(v.params || []).join(', ')})` }));
    [
      ['repeat until …:', 'run the block each pass until something holds', 'repeat until cookies() >= 1e12:\n  '],
      ['while …:', 'run the block each pass while something holds', 'while buff(Frenzy):\n  '],
      ['if … / elif … / else:', 'one way or another', 'if cookies() > 1e12:\n  \nelse:\n  '],
      ['for … in [ … ]:', 'the block once per item', 'for season in [easter, halloween]:\n  '],
      ['repeat N times:', 'the block N times', 'repeat 5 times:\n  '],
      ['forever:', 'the block again and again', 'forever:\n  '],
      ['parallel:', 'branches side by side', 'parallel:\n  branch a:\n    \n  branch b:\n    '],
      ['wait until …', 'wait for something', 'wait until magic() >= 80'],
      ['wait N seconds', 'pause', 'wait 30 seconds'],
      ['switch on / off …', 'switch another macro', 'switch on golden'],
      ['stop', 'end the macro here', 'stop'],
      ['log "…"', 'write to its trace', 'log "here"'],
    ].forEach(([s, d, ins]) => items.push({ kind: 'keyword', id: s, sig: s, desc: d, group: 'Keywords', icon: 'edit', insert: ins }));
    return items;
  }

  /** Adds a value conditions can compare (e.g. the garden's): { id, desc, params, get(...args) }. */
  function defineValue(v) {
    if (valueById[v.id]) return valueById[v.id];
    VALUES.push(v);
    valueById[v.id] = v;
    return v;
  }
  const isValue = (id) => !!valueById[id];

  return { compile, evaluate, decompile, library, defineValue, isValue, VALUES, KEYWORDS, tokenize };
})();
