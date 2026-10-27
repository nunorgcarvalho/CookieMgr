// Statistics: named bits of algorithmic code (features/script.js) that work out one thing to show —
// the lines under the store's tooltips (ui/storeInsight.js) are statistics, and so are yours.
//
//   a statistic   { id, key, label, desc, scope, format, colour, source, group }
//                 scope: 'building' | 'upgrade' | 'item' (either) | 'game' — what it's about; in a
//                 statistic about an item, `item` is the name of the building / upgrade, and the
//                 item.* words read it (its price, what it adds, its payback period…)
//                 source: code compiled as a statistic — it reads, never acts, and ends with
//                 `return <value>` (no return, or "": nothing to show). It may set `label` (the line's
//                 label instead of its own), `note` (small print after the value) and `colour` (a
//                 payback colour for the value — or a list of them, one per item of a list)
//                 format: how the value reads — auto, number, time, chance, payback, text
//                 colour: 'payback' — the value in the item's payback colour (or none)
//                 group: the catalog's shelf (GROUPS: Payback, Production, Achievements, Bank)
//   built-ins     the lines CookieMgr shows, written in the language like any other (BUILTINS)
//   yours         saved in the "stats" part of the save: { v, mine: [statistic…], builtin: { id:
//                 { label, source, format, colour } } (your changes to a built-in), favs: [id…] }
//
// Every statistic is a value word too — stat.<key>(item) (or stat.<key>() for one about the game) —
// so macros and other statistics can use it. Formatting words (fmt.number(x), fmt.time(s)…) build
// text; finite(x) and known(x) are yes / no.
//
// bestOf(scope) is the best item to show one about (the Tooltips page's cards, a Statistic widget
// set to "the best"); about(c, fn) runs fn with the item words about c.
//
// Nothing here reads the seed: statistics see what the value words see.

CA.Stats = (() => {
  const F = () => CA.Format;
  const esc = (s) => CA.Util.escapeHtml(s);
  const COLOURS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'gray'];
  const SCOPES = ['building', 'upgrade', 'item', 'game'];
  const FORMATS = [
    { id: 'auto', name: 'as it reads', desc: 'a time for seconds, a chance for 0–1, else a number' },
    { id: 'number', name: 'number' },
    { id: 'time', name: 'time (seconds)' },
    { id: 'chance', name: 'chance (0–1)' },
    { id: 'payback', name: 'payback period', desc: 'seconds, short, ∞ when it never pays back' },
    { id: 'text', name: 'text', desc: 'as written (numbers as numbers)' },
  ];
  const MAX_DEPTH = 8;
  /** The catalog's groups (a statistic of yours keeps the group of the one it was duplicated from). */
  const GROUPS = ['Payback', 'Production', 'Achievements', 'Bank'];

  // ---- the built-ins: Cookie Monster's lines -----------------------------------------------------

  const BUILTINS = [
    {
      id: 'bonus',
      group: 'Production',
      name: 'Bonus income',
      label: 'Bonus income',
      desc: 'the CpS it adds, and its share of your CpS',
      scope: 'item',
      format: 'text',
      source: `# the CpS it adds, and what share of your CpS that is
gain = item.gain()
if item.kind() == "upgrade" and gain == 0:
  return
sign = ""
if item.kind() == "building":
  label = "Bonus income (×" + item.bulk() + ")"
  sign = "+"
elif gain > 0:
  sign = "+"
share = ""
if cps() > 0:
  share = " (" + fmt.pct(gain / cps(), 2) + ")"
return sign + fmt.number(gain) + "/s" + share`,
    },
    {
      id: 'click',
      group: 'Production',
      name: 'Per click',
      label: 'Per click',
      desc: 'what a clicking upgrade adds per click, and per second at your clicking',
      scope: 'upgrade',
      format: 'text',
      source: `m = item.clickGain()
if m > 0:
  return "+" + fmt.number(m) + " (≈ " + fmt.number(m * clickRate()) + "/s at your clicking)"`,
    },
    { id: 'payback', group: 'Payback', name: 'Payback period', label: 'Payback period', desc: 'in its payback colour', scope: 'item', format: 'payback', colour: 'payback', source: 'return item.payback()' },
    {
      id: 'actual',
      group: 'Payback',
      name: 'Payback, actual income',
      label: 'Payback, actual income',
      desc: 'the payback period by what you’ve really been taking in (once a minute of play is recorded)',
      scope: 'item',
      format: 'payback',
      source: `a = paybackActual(item.payback())
if known(a):
  note = "(×" + fmt.fixed(paybackActualRatio(item.payback()), 2) + " CpS)"
  return a`,
    },
    {
      id: 'bulks',
      group: 'Payback',
      name: 'Payback ×1 / ×10 / ×100',
      label: 'Payback ×1 / 10 / 100',
      desc: 'the payback period of one, ten and a hundred more, each in its colour',
      scope: 'building',
      format: 'payback',
      source: `colour = [item.colourOf(1), item.colourOf(10), item.colourOf(100)]
return [item.paybackOf(1), item.paybackOf(10), item.paybackOf(100)]`,
    },
    { id: 'price', group: 'Bank', name: 'Price', label: 'Price', desc: 'what it costs (what a click buys)', scope: 'item', format: 'number', source: 'return item.price()' },
    {
      id: 'afford',
      group: 'Bank',
      name: 'Affordable',
      label: 'Affordable',
      desc: 'when you can afford it at your CpS',
      scope: 'item',
      format: 'text',
      source: `s = timeTo(item.price())
if s <= 0:
  return "now"
if finite(s):
  return fmt.time(s)
return "not at this CpS"`,
    },
    { id: 'share', group: 'Production', name: 'Share of production', label: 'Share of production', desc: 'what share of your CpS the building makes', scope: 'building', format: 'text', source: 'return fmt.pct(item.share(), 2)' },
    {
      id: 'next',
      group: 'Achievements',
      name: 'Next achievement',
      label: 'Next achievement',
      desc: 'how many more win the next achievement, and for how much',
      scope: 'building',
      format: 'text',
      source: `n = building.toNextAchievement(item)
if n > 100:
  return "none within 100"
return n + " more (" + fmt.number(building.priceOf(item, n)) + ")"`,
    },
    { id: 'wins', group: 'Achievements', name: 'Wins', label: 'Wins', desc: 'the achievements buying it wins', scope: 'item', format: 'text', source: 'return item.wins()' },
  ].map((b) => ({ ...b, key: b.id, builtin: true, colour: b.colour || 'none' }));
  const BUILTIN = Object.fromEntries(BUILTINS.map((b) => [b.id, b]));

  // ---- yours ---------------------------------------------------------------------------------

  let mine = [];
  let overrides = {}; // your changes to built-ins
  let favs = [];

  const OVERRIDABLE = ['label', 'source', 'format', 'colour'];
  /** A built-in as you have it (your changes on top). */
  function builtinAsIs(b) {
    const o = overrides[b.id];
    if (!o) return b;
    const out = { ...b, customized: true };
    OVERRIDABLE.forEach((k) => typeof o[k] === 'string' && (out[k] = o[k]));
    return out;
  }

  /** Every statistic: the built-ins (as you have them), then yours. */
  const all = () => BUILTINS.map(builtinAsIs).concat(mine);
  const get = (id) => (BUILTIN[id] ? builtinAsIs(BUILTIN[id]) : mine.find((s) => s.id === id) || null);
  const byKey = (key) => all().find((s) => s.key === key) || null;

  const KEY = /^[A-Za-z_]\w*$/;
  /** A label as a code name: "Price in CpS" → priceInCps. */
  const camel = (label) =>
    String(label)
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
      .join('')
      .replace(/^[0-9]+/, '') || 'statistic';
  function clean(def, old) {
    const s = { ...(old || {}), ...def };
    s.label = String(s.label || s.key || 'Statistic').slice(0, 80);
    s.key = KEY.test(String(s.key || '')) ? String(s.key) : camel(s.label);
    s.desc = String(s.desc || '');
    s.scope = SCOPES.includes(s.scope) ? s.scope : 'item';
    s.format = FORMATS.some((f) => f.id === s.format) ? s.format : 'auto';
    s.colour = s.colour === 'payback' ? 'payback' : 'none';
    s.source = String(s.source || '');
    s.group = GROUPS.includes(s.group) ? s.group : '';
    return s;
  }
  /** A key no other statistic has: paybackVsBest, paybackVsBest2… */
  function freeKey(key, id) {
    let k = key;
    for (let i = 2; all().some((s) => s.key === k && s.id !== id); i++) k = `${key}${i}`;
    return k;
  }

  const changed = () => {
    cache.clear();
    CA.Events.emit('stats');
  };

  /** Adds one of yours: the statistic, with its id. */
  function add(def) {
    const s = clean(def);
    s.id = `st_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    s.key = freeKey(s.key, s.id);
    mine.push(s);
    defineWord(s);
    changed();
    return s;
  }
  /** Changes one of yours (or a built-in: your version of it, kept beside the original). */
  function update(id, patch) {
    if (BUILTIN[id]) {
      const o = { ...(overrides[id] || {}) };
      OVERRIDABLE.forEach((k) => patch[k] !== undefined && (o[k] = String(patch[k])));
      overrides[id] = o;
      changed();
      return get(id);
    }
    const i = mine.findIndex((s) => s.id === id);
    if (i < 0) return null;
    const old = mine[i];
    const s = clean(patch, old);
    s.id = id;
    s.key = freeKey(s.key, id);
    CA.Script.removeValue(`stat.${old.key}`);
    mine[i] = s;
    defineWord(s);
    changed();
    return s;
  }
  /** Deletes one of yours; a built-in goes back to how it came. */
  function remove(id) {
    if (BUILTIN[id]) {
      delete overrides[id];
      return changed();
    }
    const s = mine.find((x) => x.id === id);
    if (!s) return;
    mine = mine.filter((x) => x !== s);
    favs = favs.filter((x) => x !== id);
    CA.Script.removeValue(`stat.${s.key}`);
    changed();
  }

  /** A copy of any statistic, yours to change: "Payback period (copy)". */
  function duplicate(id) {
    const s = get(id);
    if (!s) return null;
    const { label, desc, scope, format, colour, source, group } = s;
    return add({ label: `${label} (copy)`, desc, scope, format, colour, source, group });
  }

  // ---- running one ------------------------------------------------------------------------------
  //
  // A context: what a statistic is about — { kind: 'building' | 'upgrade', name, r, t }: r its row of
  // the payback table t (CA.Payback.table(): price, bonus, pp, colour, won…).

  let cur = null;
  let depth = 0;
  const cache = new Map(); // scope|source → compiled

  function compiled(s) {
    const item = s.scope !== 'game';
    const k = `${s.scope}|${s.source}`;
    if (!cache.has(k)) cache.set(k, CA.Script.compile(s.source, { mode: 'stat', item, vars: item ? ['item'] : [] }));
    return cache.get(k);
  }
  const fits = (s, kind) => s.scope === 'game' || s.scope === 'item' || s.scope === kind;

  /**
   * Works a statistic out, about `c` (a context, or null): { returned, value, vars, error }. A
   * statistic about an item of the other kind (a building's, for an upgrade) returns nothing.
   */
  function run(s, c) {
    if (!s) return { returned: false, error: 'no such statistic' };
    if (s.scope !== 'game' && !(c && fits(s, c.kind))) return { returned: false };
    const comp = compiled(s);
    if (comp.errors.length) return { returned: false, error: `line ${comp.errors[0].line}: ${comp.errors[0].message}` };
    if (depth >= MAX_DEPTH) return { returned: false, error: 'statistics call each other too deeply' };
    const prev = cur;
    cur = c;
    depth++;
    try {
      return CA.Script.runStat(comp.flow, s.scope === 'game' ? {} : { item: c.name });
    } finally {
      cur = prev;
      depth--;
    }
  }

  /** The context for an item by name (from a macro, or another statistic): one more of a building, or a store upgrade. */
  function contextOf(name, scope) {
    if (cur && cur.name === name) return cur;
    const t = CA.Payback.table();
    if (scope !== 'upgrade' && Game.Objects && Game.Objects[name]) {
      const r = t.buildings[1] && t.buildings[1][name];
      return r ? { kind: 'building', name, r, t } : null;
    }
    const r = t.upgrades[name];
    return r ? { kind: 'upgrade', name, r, t } : null;
  }
  /**
   * The best item a statistic of this scope could be about, as a context: the building or the store
   * upgrade with the lowest payback period (an item's: the lower of the two) — or null.
   */
  function bestOf(scope) {
    const t = CA.Payback.table();
    const low = (rows, kind) =>
      Object.keys(rows || {}).reduce((m, name) => {
        const r = rows[name];
        return r && Number.isFinite(r.pp) && (!m || r.pp < m.r.pp) ? { kind, name, r, t } : m;
      }, null);
    const b = scope === 'upgrade' ? null : low(t.buildings[1], 'building');
    const u = scope === 'building' ? null : low(t.upgrades, 'upgrade');
    return b && u ? (u.r.pp < b.r.pp ? u : b) : b || u;
  }
  /** fn() with the item words about `c` (the Values list's live values). */
  function about(c, fn) {
    const prev = cur;
    cur = c;
    try {
      return fn();
    } finally {
      cur = prev;
    }
  }

  /** A statistic's value, as a value word gives it (NaN: nothing to show). */
  function valueOf(s, name) {
    const r = run(s, s.scope === 'game' ? cur : contextOf(String(name), s.scope));
    return r.returned && r.value !== undefined ? r.value : NaN;
  }

  // ---- how it reads ------------------------------------------------------------------------------

  /** One value as HTML, in a format; `desc` (a value word's) tells `auto` seconds and chances apart. */
  function format(x, fmt, desc) {
    if (typeof x === 'boolean') return x ? 'yes' : 'no';
    if (typeof x === 'string') return esc(x) || '—';
    if (typeof x !== 'number' || Number.isNaN(x)) return '—';
    let f = fmt || 'auto';
    if (f === 'auto') f = /\bseconds\b/.test(desc || '') ? 'time' : /0–1|0-1/.test(desc || '') ? 'chance' : 'number';
    if (f === 'payback') return Number.isFinite(x) ? F().short(x) : '∞';
    if (f === 'time') return !Number.isFinite(x) ? 'never' : x <= 0 ? 'now' : F().span(x);
    if (f === 'chance') return `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;
    return Number.isFinite(x) ? F().beautify(x) : '∞';
  }
  const colourClass = (c) => (COLOURS.includes(c) ? `ca-pp-${c}` : '');

  /**
   * A statistic as a tooltip line about `c`: [label html, value html, class] — or null when it has
   * nothing to show (no return, "", an empty list; or it fails: error, in opts.errors).
   */
  function line(s, c) {
    const r = run(s, c);
    if (r.error || !r.returned) return null;
    const v = r.value;
    if (v === undefined || v === null || (v === '' && !s.showEmpty) || (Array.isArray(v) && !v.length)) return null;
    const vars = r.vars || {};
    const label = typeof vars.label === 'string' || typeof vars.label === 'number' ? String(vars.label) : s.label;
    let colour = vars.colour !== undefined ? vars.colour : s.colour === 'payback' && c && c.r ? c.r.colour : '';
    let html;
    let cls = '';
    if (Array.isArray(v)) {
      const cs = Array.isArray(colour) ? colour : v.map(() => colour);
      html = v
        .map((x, i) => {
          const one = format(x, s.format, s.wordDesc);
          return typeof x === 'number' && !Number.isNaN(x) && colourClass(cs[i]) ? `<span class="${colourClass(cs[i])}">${one}</span>` : one;
        })
        .join(' · ');
    } else {
      html = format(v, s.format, s.wordDesc);
      if (Array.isArray(colour)) colour = colour[0];
      cls = colourClass(colour);
    }
    if (vars.note !== undefined && vars.note !== '') html += ` <small>${esc(String(vars.note))}</small>`;
    return [esc(label), html, cls];
  }

  // ---- a value word as a statistic (a tooltip line that's one word: { word, fmt, label }) -----------

  const wordCache = new Map();
  /** The statistic a word line amounts to: return word(item) — or null (no such word; one that takes something else). */
  function fromWord(entry) {
    const k = `${entry.word}|${entry.fmt || ''}|${entry.label || ''}`;
    if (wordCache.has(k)) return wordCache.get(k);
    const v = CA.Script.VALUES.find((x) => x.id === entry.word);
    const ps = (v && v.params) || [];
    let s = null;
    if (v && !v.context && (ps.length === 0 || (ps.length === 1 && (ps[0] === 'building' || ps[0] === 'upgrade')))) {
      s = clean({ key: 'word', label: entry.label || entry.word, scope: ps.length ? ps[0] : 'game', format: entry.fmt || 'auto', source: `return ${entry.word}(${ps.length ? 'item' : ''})` });
      s.id = `word:${entry.word}`;
      s.word = entry.word;
      s.wordDesc = v.desc;
      s.showEmpty = true;
    }
    wordCache.set(k, s);
    return s;
  }

  // ---- words ---------------------------------------------------------------------------------

  function defineWord(s) {
    CA.Script.defineValue({
      id: `stat.${s.key}`,
      desc: `the statistic “${s.label}”${s.desc ? ` — ${s.desc}` : ''}`,
      params: s.scope === 'game' ? [] : ['item'],
      group: 'Statistics',
      get: (name) => valueOf(get(s.id) || s, name),
    });
  }

  function defineItemWords() {
    const V = (id, desc, get, more) => CA.Script.defineValue({ id, desc, get, context: true, group: 'This item', ...(more || {}) });
    const r = () => (cur && cur.r) || null;
    const isB = () => !!cur && cur.kind === 'building';
    V('item.kind', 'what the item is: building or upgrade', () => (cur ? cur.kind : ''));
    V('item.price', 'what it costs (for a building: what a click buys)', () => (r() ? r().price : NaN));
    V('item.gain', 'the CpS it adds (an upgrade’s clicks not counted)', () => (r() ? r().bonus : NaN));
    V('item.payback', 'its payback period (seconds)', () => (r() ? r().pp : NaN));
    V('item.colour', 'its payback colour: blue, green, yellow, orange, red, purple or gray', () => (r() ? r().colour || '' : ''));
    V('item.bulk', 'how many a click buys (an upgrade: 1)', () => (isB() ? r().n || 1 : cur ? 1 : NaN));
    V('item.owned', 'how many you own (an upgrade: 1 or 0)', () => {
      if (!cur) return NaN;
      if (isB()) return (Game.Objects[cur.name] || {}).amount || 0;
      const u = Game.Upgrades && Game.Upgrades[cur.name];
      return u && u.bought ? 1 : 0;
    });
    V('item.wins', 'the achievements buying it wins, as text ("" when none)', () => (r() && r().won ? r().won.join(', ') : ''));
    V('item.share', 'what share of your CpS the building makes (0–1; an upgrade: 0)', () => {
      if (!isB()) return cur ? 0 : NaN;
      const b = Game.Objects[cur.name];
      return b && b.storedTotalCps && Game.cookiesPs ? (b.storedTotalCps * (Game.globalCpsMult || 1)) / Game.cookiesPs : 0;
    });
    V('item.clickGain', 'what an upgrade adds to each click (a building: 0)', () => (cur && cur.kind === 'upgrade' ? r().mouse || 0 : cur ? 0 : NaN));
    const bulkRow = (n) => {
      if (!isB()) return null;
      const k = Math.max(1, Math.floor(Number(n)) || 1);
      const row = cur.t.buildings[k] && cur.t.buildings[k][cur.name];
      if (row) return row;
      const b = Game.Objects[cur.name];
      if (!b) return null;
      const price = CA.Payback.sumPrice(b, k);
      const pp = CA.Payback.pp(price, CA.Payback.buildingBonus(cur.name, k));
      return { pp, colour: cur.t.colourOf ? cur.t.colourOf(pp, price) : '' };
    };
    V('item.paybackOf', 'the payback period of n more of the building (seconds; an upgrade: NaN)', (n) => (bulkRow(n) || { pp: NaN }).pp, { params: ['n'] });
    V('item.colourOf', 'the payback colour of n more of the building', (n) => (bulkRow(n) || { colour: '' }).colour, { params: ['n'] });
  }

  function defineFormatWords() {
    const V = (id, desc, params, get, more) => CA.Script.defineValue({ id, desc, params, get, group: 'Text', ...(more || {}) });
    const n = (x) => Number(x);
    V('fmt.number', 'a number as text, as the game writes it (1.23 M)', ['x'], (x) => F().beautify(n(x)));
    V('fmt.short', 'a number as short text (1.23M)', ['x'], (x) => F().short(n(x)));
    V('fmt.time', 'seconds as a time (3m 20s)', ['seconds'], (x) => F().span(n(x)));
    V('fmt.pct', 'a share (0–1) as a percentage, with so many decimals: fmt.pct(0.0741, 2) is 7.41%', ['x', 'decimals'], (x, d) => `${(n(x) * 100).toFixed(Math.max(0, Math.min(10, Math.floor(n(d)) || 0)))}%`);
    V('fmt.fixed', 'a number with so many decimals', ['x', 'decimals'], (x, d) => n(x).toFixed(Math.max(0, Math.min(10, Math.floor(n(d)) || 0))));
    V('finite', 'whether a number is finite (not ∞, not NaN)', ['x'], (x) => typeof x === 'number' && Number.isFinite(x), { bool: true, group: 'Numbers' });
    V('known', 'whether a value is known: not NaN, not empty', ['x'], (x) => x !== undefined && x !== null && x !== '' && !(typeof x === 'number' && Number.isNaN(x)), { bool: true, group: 'Numbers' });
  }

  // ---- save / load ---------------------------------------------------------------------------

  function serialize() {
    if (!mine.length && !Object.keys(overrides).length && !favs.length) return undefined;
    return { v: 1, mine: mine.map((s) => ({ id: s.id, key: s.key, label: s.label, desc: s.desc, scope: s.scope, format: s.format, colour: s.colour, source: s.source, group: s.group || undefined })), builtin: overrides, favs };
  }
  function load(data) {
    mine.forEach((s) => CA.Script.removeValue(`stat.${s.key}`));
    mine = [];
    overrides = {};
    favs = [];
    if (data && typeof data === 'object') {
      (Array.isArray(data.mine) ? data.mine : []).forEach((d) => {
        if (!d || typeof d !== 'object' || typeof d.id !== 'string') return;
        const s = clean(d);
        s.id = d.id;
        s.key = freeKey(s.key, s.id);
        mine.push(s);
        defineWord(s);
      });
      if (data.builtin && typeof data.builtin === 'object')
        Object.keys(data.builtin).forEach((id) => {
          const o = data.builtin[id];
          if (!BUILTIN[id] || !o || typeof o !== 'object') return;
          overrides[id] = {};
          OVERRIDABLE.forEach((k) => typeof o[k] === 'string' && (overrides[id][k] = o[k]));
        });
      if (Array.isArray(data.favs)) favs = data.favs.filter((x) => typeof x === 'string');
    }
    changed();
  }

  function init() {
    defineItemWords();
    defineFormatWords();
    BUILTINS.forEach(defineWord);
    CA.Settings.registerSection('stats', { serialize, load, event: 'stats' });
  }

  return { init, all, get, byKey, add, update, remove, duplicate, run, line, format, fromWord, compiled, contextOf, bestOf, about, favs: () => favs.slice(), BUILTINS, FORMATS, SCOPES, GROUPS };
})();
