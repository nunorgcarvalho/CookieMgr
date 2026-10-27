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
//   warnings   in the same block: buying it would take your bank below what a Lucky! (or a Lucky! in
//              a Frenzy, or Conjure Baked Goods) needs to pay its most
//
//   sort       optionally, the upgrades in payback order (colour group, then payback period)
//
// Options (Settings → Store): storeColours, storeTooltips, storeWarnings, storeUpgradeSort.

CA.UI = CA.UI || {};

CA.UI.StoreInsight = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const P = () => CA.Payback;
  const COLOURS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'gray'];
  const S = (k) => CA.Settings.get(k);

  // ---- colours -----------------------------------------------------------------------------------

  /** A building's row for what a click on it buys now. */
  function rowFor(b, t) {
    const bulk = Game.buyBulk === 10 || Game.buyBulk === 100 ? Game.buyBulk : 1;
    const n = CA.Shop.amountFor(b, bulk) || 1;
    if (t.buildings[n] && t.buildings[n][b.name]) return t.buildings[n][b.name];
    const price = P().sumPrice(b, n);
    const bonus = P().buildingBonus(b.name, n);
    const pp = P().pp(price, bonus);
    return { name: b.name, n, price, bonus, pp, colour: t.colourOf(pp, price), won: [] };
  }

  function paint() {
    const on = S('storeColours') && Game.buyMode === 1;
    const t = on ? P().table({ staleMs: 2000 }) : null;
    Object.values(Game.Objects || {}).forEach((b) => {
      const el = document.getElementById(`productPrice${b.id}`);
      if (!el) return;
      COLOURS.forEach((c) => el.classList.remove(`ca-pp-${c}`));
      if (on) el.classList.add(`ca-pp-${rowFor(b, t).colour}`);
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

  /** Warnings: buying for `price` takes the bank below what these need. */
  function warnings(price) {
    if (!S('storeWarnings') || !CA.GoldenMath) return [];
    const after = (Game.cookies || 0) - price;
    const G = CA.GoldenMath;
    const out = [];
    [
      ['Lucky!', G.lucky().bank],
      ['Lucky! in a Frenzy', G.lucky(true).bank],
      ['Conjure Baked Goods', G.conjure().bank],
    ].forEach(([name, need]) => {
      if (after < need && Game.cookies >= need) out.push(`takes your bank below what a ${name} needs (${F().beautify(need)}) — short ${F().beautify(need - after)}`);
    });
    return out;
  }

  function block(rows, warns) {
    return (
      '<div class="ca-tt">' +
      '<div class="ca-tt-head">CookieMgr</div>' +
      rows.map(([k, v, cls]) => `<div class="ca-tt-row"><span>${k}</span><b${cls ? ` class="${cls}"` : ''}>${v}</b></div>`).join('') +
      warns.map((w) => `<div class="ca-tt-warn">⚠ ${esc(w)}</div>`).join('') +
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
  const LINES = CA.Stats.BUILTINS.map((b) => ({ id: b.id, name: b.name, desc: b.desc, scope: b.scope }));
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
    const r = rowFor(b, t);
    return block(rowsFor({ kind: 'building', name: b.name, r, t }), warnings(r.price));
  }
  function upgradeBlock(u, opts = {}) {
    if (!opts.force && !S('storeTooltips')) return '';
    const t = P().table();
    const r = t.upgrades[u.name];
    if (!r) return '';
    return block(rowsFor({ kind: 'upgrade', name: u.name, r, t }), warnings(r.price));
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
    CA.Settings.defineOption({ key: 'storeWarnings', group: 'store', icon: 'bell', name: 'Bank warnings', desc: 'In those tooltips: a warning when buying would take your bank below what a Lucky! (in a Frenzy too) or Conjure Baked Goods needs to pay its most.', default: false });
    wrapTooltips();
    setInterval(() => {
      try {
        wrapTooltips();
        paint();
      } catch (e) {
        /* a store mid-rebuild: next time */
      }
    }, 500);
    CA.Events.on('settings', (k) => (k === 'storeColours' || k === 'storeUpgradeSort' || k === null) && paint());
  }

  return { init, paint, buildingBlock, upgradeBlock, warnings, LINES, DEFAULT_LINES, FORMATS, lines, setLines, isDefault, words, statOf };
})();
