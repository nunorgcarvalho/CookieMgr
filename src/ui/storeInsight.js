// The store, with what each purchase is worth (features/payback.js) — what Cookie Monster adds to it:
//
//   colours    each building's price in its payback colour, for what a click buys now (×1, ×10,
//              ×100, or to the next multiple), and a small dot in each upgrade's corner
//   tooltips   under the game's own building and upgrade tooltips, a CookieMgr block — by default
//              Cookie Monster's: the CpS it adds (and what share of your CpS that is), its payback period
//              and colour (and by actual income), when you can afford it, the achievements it wins; a
//              building's share of your production, and how many more win its next achievement. Every
//              line is a statistic (features/stats.js); which, in what order — any value word too — is
//              chosen on the Payback page.
//   warnings   warning statistics (features/stats.js, warn) — by default, buying it would take your bank
//              below what a Lucky! (Conjure Baked Goods, a Lucky! in a Frenzy) needs to pay its most:
//              a small mark on the item in the store, in the colour of the first that warns, and one
//              line in the block with a tag for each (option storeWarningList: which, in what order)
//
//   sort       optionally, the upgrades in payback order (colour group, then payback period)
//
// Options (Settings → Store): storeColours, storeTooltips, storeWarnings, storeUpgradeSort (and,
// chosen on the Tooltips page: storeTooltipLines, storeWarningList).

CA.UI = CA.UI || {};

CA.UI.StoreInsight = (() => {
  const P = () => CA.Payback;
  const COLOURS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'gray'];
  const S = (k) => CA.Settings.get(k);

  // ---- colours -----------------------------------------------------------------------------------

  /** How many a click on a building buys now. */
  const clickAmount = (b) => CA.Shop.amountFor(b, Game.buyBulk === 10 || Game.buyBulk === 100 ? Game.buyBulk : 1) || 1;
  /** A building's row for what a click on it buys now. */
  function rowFor(b, t) {
    const n = clickAmount(b);
    if (t.buildings[n] && t.buildings[n][b.name]) return t.buildings[n][b.name];
    const price = P().sumPrice(b, n);
    const bonus = P().buildingBonus(b.name, n);
    const pp = P().pp(price, bonus);
    return { name: b.name, n, price, bonus, pp, colour: t.colourOf(pp, price), won: [] };
  }

  /** An item's mark in the store: the colour of its first warning (or none). */
  function mark(host, warns) {
    let el = host.querySelector(':scope > .ca-bank-mark');
    if (!warns.length) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      host.appendChild(el);
    }
    el.className = `ca-bank-mark ca-pp-bg-${warns[0].colour}`;
    el.textContent = '!';
  }

  function paint() {
    const on = S('storeColours') && Game.buyMode === 1;
    const warn = Game.buyMode === 1 && warningsOn();
    const t = on || warn ? P().table({ staleMs: 2000 }) : null;
    Object.values(Game.Objects || {}).forEach((b) => {
      const el = document.getElementById(`productPrice${b.id}`);
      if (!el) return;
      COLOURS.forEach((c) => el.classList.remove(`ca-pp-${c}`));
      if (on) el.classList.add(`ca-pp-${rowFor(b, t).colour}`);
      const host = document.getElementById(`product${b.id}`);
      if (host) mark(host, warn ? warnings({ kind: 'building', name: b.name, r: rowFor(b, t), t }) : []);
    });
    // the upgrades in payback order (colour group, then payback period) — or the game's
    const sorted = S('storeUpgradeSort') && Game.buyMode === 1;
    const tu = sorted ? t || P().table() : null;
    const rank = sorted
      ? (Game.UpgradesInStore || [])
          .map((u) => ({ u, r: tu.upgrades[u.name] }))
          .sort((a, b) => {
            const ca = COLOURS.indexOf(a.r ? a.r.colour : 'gray');
            const cb = COLOURS.indexOf(b.r ? b.r.colour : 'gray');
            return ca - cb || (a.r ? a.r.pp : Infinity) - (b.r ? b.r.pp : Infinity);
          })
          .map((x) => x.u)
      : null;
    (Game.UpgradesInStore || []).forEach((u, i) => {
      const el = document.getElementById(`upgrade${i}`);
      if (!el) return;
      if (sorted) el.style.order = String(rank.indexOf(u) + 1);
      else if (el.style.order) el.style.removeProperty('order');
      const ur = warn && t.upgrades[u.name];
      mark(el, ur ? warnings({ kind: 'upgrade', name: u.name, r: ur, t }) : []);
      let dot = el.querySelector('.ca-pp-updot');
      if (!on) {
        if (dot) dot.remove();
        return;
      }
      const r = t.upgrades[u.name];
      if (!r) return;
      if (!dot) {
        dot = document.createElement('div');
        el.appendChild(dot);
      }
      dot.className = `ca-pp-updot ca-pp-bg-${r.colour}`;
    });
  }

  // ---- tooltips ----------------------------------------------------------------------------------

  // Warnings: warning statistics (features/stats.js), in the order chosen (option storeWarningList,
  // ids — by default the three bank warnings, smallest bank first: the one you'd most want to keep).
  const DEFAULT_WARNINGS = ['warnLucky', 'warnConjure', 'warnFrenzy'];
  /** The warnings, in order: statistic ids (only warning statistics that still exist). */
  function warningList() {
    const v = S('storeWarningList');
    return (Array.isArray(v) ? v : DEFAULT_WARNINGS).filter((id) => typeof id === 'string' && (ST().get(id) || {}).warn);
  }
  function setWarnings(list) {
    CA.Settings.set('storeWarningList', Array.isArray(list) ? list.slice() : null);
  }
  const warningsDefault = () => !Array.isArray(S('storeWarningList'));
  const warningsOn = () => !!S('storeWarnings') && warningList().length > 0;
  /**
   * The warnings about an item (a context: { kind, name, r, t }), in order: [{ id, label, html,
   * colour }] — none with the option off (opts.force: whatever the option).
   */
  function warnings(c, opts = {}) {
    if (!c || (!opts.force && !S('storeWarnings'))) return [];
    const out = [];
    warningList().forEach((id) => {
      try {
        const w = ST().warning(ST().get(id), c);
        if (w) out.push(w);
      } catch (e) {
        /* a warning that fails here: left out */
      }
    });
    return out;
  }

  /** The tooltip's one warning line: a coloured tag for each warning, with what it shows. */
  function warnLine(warns) {
    if (!warns.length) return '';
    const tags = warns.map((w) => `<span class="ca-tt-bank ca-tt-bank-${w.colour}">${w.label} <small>${w.html}</small></span>`);
    return `<div class="ca-tt-row ca-tt-warn"><span>⚠</span><b>${tags.join('')}</b></div>`;
  }

  function block(rows, warns) {
    return (
      '<div class="ca-tt">' +
      '<div class="ca-tt-head">CookieMgr</div>' +
      rows.map(([k, v, cls]) => `<div class="ca-tt-row"><span>${k}</span><b${cls ? ` class="${cls}"` : ''}>${v}</b></div>`).join('') +
      warnLine(warns) +
      '</div>'
    );
  }
  // ---- the block's lines ------------------------------------------------------------------------
  //
  // Which lines the block shows, in what order, is yours to choose (the Payback page's Store tooltips
  // card; option storeTooltipLines): a list of statistics (features/stats.js) — the built-in ones by
  // id ('payback'…), yours as { stat: id } — and value words as { word, fmt, label } (one taking the
  // building / an upgrade, or nothing: a statistic that is just that word). Each line is worked out
  // about the building or upgrade hovered; one with nothing to say (no wins, nothing recorded yet), or
  // about the other kind, is left out. The default is Cookie Monster's layout.
  const ST = () => CA.Stats;
  /** The built-in lines, for the editor: [{ id, name, desc, scope }]. */
  const LINES = CA.Stats.BUILTINS.filter((b) => !b.warn).map((b) => ({ id: b.id, name: b.name, desc: b.desc, scope: b.scope }));
  const LINE = Object.fromEntries(LINES.map((l) => [l.id, l]));
  /** Cookie Monster's layout (its bank warnings are their own option). */
  const DEFAULT_LINES = ['bonus', 'click', 'payback', 'actual', 'afford', 'share', 'next', 'wins'];
  /** How a word's value is shown. */
  const FORMATS = CA.Stats.FORMATS.filter((f) => ['auto', 'number', 'time', 'chance'].includes(f.id));

  const entryOk = (x) => (typeof x === 'string' ? !!LINE[x] : !!x && (typeof x.word === 'string' || typeof x.stat === 'string'));
  /** The block's lines, in order: built-in ids, { stat } and { word, fmt, label } entries. */
  function lines() {
    const v = S('storeTooltipLines');
    if (!Array.isArray(v)) return DEFAULT_LINES.slice();
    return v.filter(entryOk);
  }
  function setLines(list) {
    CA.Settings.set('storeTooltipLines', Array.isArray(list) ? list.slice() : null);
  }
  const isDefault = () => !Array.isArray(S('storeTooltipLines'));

  /** Whether a word can be a line in a tooltip of this kind: it takes a building / an upgrade, or nothing. */
  function wordFits(v, kind) {
    const ps = v.params || [];
    return !v.context && (ps.length === 0 || (ps.length === 1 && ps[0] === kind));
  }
  /** The words a line could be, for a kind ('building' | 'upgrade' | null: either). */
  function words(kind) {
    return ((CA.Script && CA.Script.VALUES) || []).filter((v) => !/^stat\./.test(v.id) && (kind ? wordFits(v, kind) : wordFits(v, 'building') || wordFits(v, 'upgrade'))).sort((a, b) => a.id.localeCompare(b.id));
  }
  /** The statistic a line entry stands for (or null). */
  function statOf(entry) {
    if (typeof entry === 'string') return ST().get(entry);
    if (entry && typeof entry.stat === 'string') return ST().get(entry.stat);
    return entry ? ST().fromWord(entry) : null;
  }
  function rowsFor(c) {
    const out = [];
    lines().forEach((e) => {
      try {
        const row = ST().line(statOf(e), c);
        if (row) out.push(row);
      } catch (err) {
        /* a line that fails here: left out */
      }
    });
    return out;
  }

  /** The block under a building's tooltip (opts.force: whatever the options and buy mode — the editor's preview). */
  function buildingBlock(b, opts = {}) {
    if (!opts.force && (!S('storeTooltips') || Game.buyMode !== 1)) return '';
    const t = P().table();
    const c = { kind: 'building', name: b.name, r: rowFor(b, t), t };
    return block(rowsFor(c), warnings(c, opts));
  }
  function upgradeBlock(u, opts = {}) {
    if (!opts.force && !S('storeTooltips')) return '';
    const t = P().table();
    const r = t.upgrades[u.name];
    if (!r) return '';
    const c = { kind: 'upgrade', name: u.name, r, t };
    return block(rowsFor(c), warnings(c, opts));
  }

  const wrapped = new WeakSet();
  function wrapTooltips() {
    Object.values(Game.Objects || {}).forEach((b) => {
      if (!b || wrapped.has(b) || typeof b.tooltip !== 'function') return;
      const orig = b.tooltip;
      b.tooltip = function () {
        const html = orig.apply(this, arguments);
        try {
          return html + buildingBlock(this);
        } catch (e) {
          return html;
        }
      };
      wrapped.add(b);
    });
    if (typeof Game.crateTooltip === 'function' && !Game.crateTooltip.__ca) {
      const orig = Game.crateTooltip;
      Game.crateTooltip = function (me, context) {
        const html = orig.apply(this, arguments);
        try {
          return context === 'store' && me && me.type === 'upgrade' && !me.bought ? html + upgradeBlock(me) : html;
        } catch (e) {
          return html;
        }
      };
      Game.crateTooltip.__ca = true;
    }
  }

  function init() {
    const D = (key, icon, name, desc) => CA.Settings.defineOption({ key, group: 'store', icon, name, desc, default: true });
    D('storeColours', 'drop', 'Payback colours', 'Each building’s price in its payback colour (for what a click buys), and a dot in each upgrade’s corner — blue better than the best building, green the best, then yellow, orange, red, purple; gray never pays back.');
    D('storeTooltips', 'search', 'Payback in tooltips', 'Under the game’s building and upgrade tooltips: the CpS it adds, its payback period, when you can afford it, its share of production, the next achievement.');
    CA.Settings.defineOption({ key: 'storeUpgradeSort', group: 'store', icon: 'sortList', name: 'Upgrades: best first', desc: 'The store lists its upgrades by payback period (best first, in colour groups) instead of by price.', default: false });
    CA.Settings.defineOption({ key: 'storeTooltipLines', group: 'store-hidden', name: 'Tooltip lines', desc: '', default: null });
    // off by default since the tooltip's lines became yours to choose: Cookie Monster's layout, without them)
    CA.Settings.defineOption({ key: 'storeWarnings', group: 'store', icon: 'bell', name: 'Warnings', desc: 'A small coloured “!” on anything a warning is about — by default, whose purchase would take your bank below what a Lucky! (red), Conjure Baked Goods (orange) or a Lucky! in a Frenzy (yellow) needs to pay its most — and one line in its tooltip saying which, and by how much. Which warnings: the Tooltips page.', default: false });
    CA.Settings.defineOption({ key: 'storeWarningList', group: 'store-hidden', name: 'Warnings', desc: '', default: null });
    wrapTooltips();
    setInterval(() => {
      try {
        wrapTooltips();
        paint();
      } catch (e) {
        /* a store mid-rebuild: next time */
      }
    }, 500);
    CA.Events.on('settings', (k) => (k === 'storeColours' || k === 'storeUpgradeSort' || k === 'storeWarnings' || k === 'storeWarningList' || k === null) && paint());
    CA.Events.on('stats', () => paint());
  }

  return { init, paint, buildingBlock, upgradeBlock, warnings, warningList, setWarnings, warningsDefault, DEFAULT_WARNINGS, LINES, DEFAULT_LINES, FORMATS, lines, setLines, isDefault, words, statOf };
})();
