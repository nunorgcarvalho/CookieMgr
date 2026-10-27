// The store, with what each purchase is worth (features/payback.js) — what Cookie Monster adds to it:
//
//   colours    each building's price in its payback colour, for what a click buys now (×1, ×10,
//              ×100, or to the next multiple), and a small dot in each upgrade's corner
//   tooltips   under the game's own building and upgrade tooltips, a CookieMgr block — by default
//              Cookie Monster's: the CpS it adds (and what share of your CpS that is), its payback period
//              and colour (and by actual income), when you can afford it, the achievements it wins; a
//              building's share of your production, and how many more win its next achievement. Which
//              lines, in what order — any value word too — is chosen on the Payback page.
//   warnings   buying it would take your bank below what a Lucky! (Conjure Baked Goods, a Lucky! in a
//              Frenzy) needs to pay its most: a small coloured mark on the item in the store, and one
//              line in the block naming the banks it breaks and by how much
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
  const ppText = (v) => (Number.isFinite(v) ? F().short(v) : '∞');

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

  /** An item's bank mark in the store: the colour of the smallest bank buying it breaks (or none). */
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
    const t = on ? P().table({ staleMs: 2000 }) : null;
    const bk = Game.buyMode === 1 ? banks() : [];
    Object.values(Game.Objects || {}).forEach((b) => {
      const el = document.getElementById(`productPrice${b.id}`);
      if (!el) return;
      COLOURS.forEach((c) => el.classList.remove(`ca-pp-${c}`));
      if (on) el.classList.add(`ca-pp-${rowFor(b, t).colour}`);
      const host = document.getElementById(`product${b.id}`);
      if (host) mark(host, bk.length ? warnings(t ? rowFor(b, t).price : P().sumPrice(b, clickAmount(b)), bk) : []);
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
      mark(el, bk.length ? warnings(typeof u.getPrice === 'function' ? u.getPrice() : u.basePrice || u.price || 0, bk) : []);
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

  // Bank warnings: the banks a golden cookie (or a spell) needs to pay its most, smallest first —
  // the one you'd want to keep the most. Each has its colour, on the store's marks and in the tooltip.
  const BANKS = [
    { id: 'lucky', name: 'Lucky!', colour: 'red', need: (G) => G.lucky().bank },
    { id: 'conjure', name: 'Conjure', full: 'Conjure Baked Goods', colour: 'orange', need: (G) => G.conjure().bank },
    { id: 'luckyFrenzy', name: 'Frenzy Lucky!', full: 'Lucky! in a Frenzy', colour: 'yellow', need: (G) => G.lucky(true).bank },
  ];
  /** The banks as they stand now: [{ id, name, colour, need }] (none with the option off). */
  function banks() {
    if (!S('storeWarnings') || !CA.GoldenMath) return [];
    return BANKS.map((k) => ({ id: k.id, name: k.name, full: k.full || k.name, colour: k.colour, need: k.need(CA.GoldenMath) }));
  }
  /**
   * The banks buying for `price` takes you below — only those you have now — smallest first:
   * [{ id, name, colour, need, short }] (short: how much under it you'd be).
   */
  function warnings(price, list) {
    const have = Game.cookies || 0;
    const after = have - price;
    return (list || banks()).filter((k) => have >= k.need && after < k.need).map((k) => ({ ...k, short: k.need - after }));
  }

  /** The tooltip's one warning line: the banks it breaks, as coloured tags with how far under. */
  function warnLine(warns) {
    if (!warns.length) return '';
    const tags = warns.map((w) => `<span class="ca-tt-bank ca-tt-bank-${w.colour}">${esc(w.name)} <small>−${F().beautify(w.short)}</small></span>`);
    return `<div class="ca-tt-row ca-tt-warn"><span>⚠ Drops bank below</span><b>${tags.join('')}</b></div>`;
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
  const share = (v) => (Game.cookiesPs > 0 ? ` (${((v / Game.cookiesPs) * 100).toFixed(2)}%)` : '');
  const afford = (price) => {
    const s = P().timeTo(price);
    return s <= 0 ? 'now' : Number.isFinite(s) ? F().span(s) : 'not at this CpS';
  };

  // ---- the block's lines ------------------------------------------------------------------------
  //
  // Which lines the block shows, in what order, is yours to choose (the Payback page's Store tooltips
  // card; option storeTooltipLines): any of the lines below, and any value word — one taking a
  // building (an upgrade, in an upgrade's tooltip) or nothing — shown as a number, a time, a chance or
  // as it comes. A line with nothing to say (no wins, nothing recorded yet) is left out. The default is
  // Cookie Monster's layout. Each line: (c) → [label, value html, class?] or null, where c is
  // { kind, b | u, r (the payback row), t (the table) }.
  const LINES = [
    {
      id: 'bonus',
      name: 'Bonus income',
      desc: 'the CpS it adds, and its share of your CpS',
      building: (c) => [`Bonus income (×${c.r.n})`, `+${F().beautify(c.r.bonus)}/s${share(c.r.bonus)}`],
      upgrade: (c) => (c.r.bonus ? ['Bonus income', `${c.r.bonus > 0 ? '+' : ''}${F().beautify(c.r.bonus)}/s${share(c.r.bonus)}`] : null),
    },
    {
      id: 'click',
      name: 'Per click',
      desc: 'what a clicking upgrade adds per click, and per second at your clicking',
      upgrade: (c) => (c.r.mouse > 0 ? ['Per click', `+${F().beautify(c.r.mouse)} (≈ ${F().beautify(c.r.mouse * P().clickRate())}/s at your clicking)`] : null),
    },
    { id: 'payback', name: 'Payback period', desc: 'in its payback colour', both: (c) => ['Payback period', ppText(c.r.pp), `ca-pp-${c.r.colour}`] },
    {
      id: 'actual',
      name: 'Payback, actual income',
      desc: 'the payback period by what you’ve really been taking in (once a minute of play is recorded)',
      both: (c) => {
        const a = P().ppActual(c.r.pp);
        return a ? ['Payback, actual income', `${ppText(a.pp)} <small>(×${a.ratio.toFixed(2)} CpS)</small>`] : null;
      },
    },
    {
      id: 'bulks',
      name: 'Payback ×1 / ×10 / ×100',
      desc: 'the payback period of one, ten and a hundred more, each in its colour',
      building: (c) => {
        const cells = [1, 10, 100].map((n) => {
          const x = c.t.buildings[n] && c.t.buildings[n][c.b.name];
          return x ? `<span class="ca-pp-${x.colour}">${ppText(x.pp)}</span>` : '—';
        });
        return ['Payback ×1 / 10 / 100', cells.join(' · ')];
      },
    },
    { id: 'price', name: 'Price', desc: 'what it costs (what a click buys)', both: (c) => ['Price', F().beautify(c.r.price)] },
    { id: 'afford', name: 'Affordable', desc: 'when you can afford it at your CpS', both: (c) => ['Affordable', afford(c.r.price)] },
    {
      id: 'share',
      name: 'Share of production',
      desc: 'what share of your CpS the building makes',
      building: (c) => {
        const b = c.b;
        const produce = b.storedTotalCps && Game.cookiesPs ? (b.storedTotalCps * (Game.globalCpsMult || 1)) / Game.cookiesPs : 0;
        return ['Share of production', `${(produce * 100).toFixed(2)}%`];
      },
    },
    {
      id: 'next',
      name: 'Next achievement',
      desc: 'how many more win the next achievement, and for how much',
      building: (c) => {
        const next = P().nextAchievement(c.b.name);
        return ['Next achievement', next.n <= 100 ? `${next.n} more (${F().beautify(next.price)})` : 'none within 100'];
      },
    },
    { id: 'wins', name: 'Wins', desc: 'the achievements buying it wins', both: (c) => (c.r.won.length ? ['Wins', esc(c.r.won.join(', '))] : null) },
  ];
  const LINE = Object.fromEntries(LINES.map((l) => [l.id, l]));
  /** Cookie Monster's layout (its bank warnings are their own option). */
  const DEFAULT_LINES = ['bonus', 'click', 'payback', 'actual', 'afford', 'share', 'next', 'wins'];
  /** How a word's value is shown. */
  const FORMATS = [
    { id: 'auto', name: 'as it reads', desc: 'a time for seconds, a chance for 0–1, else a number' },
    { id: 'number', name: 'number' },
    { id: 'time', name: 'time (seconds)' },
    { id: 'chance', name: 'chance (0–1)' },
  ];

  /** The block's lines, in order: built-in ids and { word, fmt, label } entries. */
  function lines() {
    const v = S('storeTooltipLines');
    if (!Array.isArray(v)) return DEFAULT_LINES.slice();
    return v.filter((x) => (typeof x === 'string' ? !!LINE[x] : x && typeof x.word === 'string'));
  }
  function setLines(list) {
    CA.Settings.set('storeTooltipLines', Array.isArray(list) ? list.slice() : null);
  }
  const isDefault = () => !Array.isArray(S('storeTooltipLines'));

  const valueWord = (id) => (CA.Script && CA.Script.VALUES ? CA.Script.VALUES.find((v) => v.id === id) : null);
  /** Whether a word can be a line in a tooltip of this kind: it takes a building / an upgrade, or nothing. */
  function wordFits(v, kind) {
    const ps = v.params || [];
    return ps.length === 0 || (ps.length === 1 && ps[0] === kind);
  }
  /** The words a line could be, for a kind ('building' | 'upgrade' | null: either). */
  function words(kind) {
    return ((CA.Script && CA.Script.VALUES) || []).filter((v) => (kind ? wordFits(v, kind) : wordFits(v, 'building') || wordFits(v, 'upgrade'))).sort((a, b) => a.id.localeCompare(b.id));
  }
  function fmtValue(x, fmt, desc) {
    if (typeof x === 'boolean') return x ? 'yes' : 'no';
    if (typeof x === 'string') return esc(x) || '—';
    if (typeof x !== 'number' || Number.isNaN(x)) return '—';
    let f = fmt || 'auto';
    if (f === 'auto') f = /\bseconds\b/.test(desc || '') ? 'time' : /0–1|0-1/.test(desc || '') ? 'chance' : 'number';
    if (f === 'time') return !Number.isFinite(x) ? 'never' : x <= 0 ? 'now' : F().span(x);
    if (f === 'chance') return `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;
    return Number.isFinite(x) ? F().beautify(x) : '∞';
  }
  /** One entry's line for this tooltip, or null. */
  function lineFor(entry, c) {
    if (typeof entry === 'string') {
      const l = LINE[entry];
      const fn = l && (l[c.kind] || l.both);
      return fn ? fn(c) : null;
    }
    const v = valueWord(entry.word);
    if (!v || !wordFits(v, c.kind)) return null;
    const ps = v.params || [];
    const x = ps.length ? v.get(c.kind === 'building' ? c.b.name : c.u.name) : v.get();
    return [esc(entry.label || entry.word), fmtValue(x, entry.fmt, v.desc)];
  }
  function rowsFor(c) {
    const out = [];
    lines().forEach((e) => {
      try {
        const row = lineFor(e, c);
        if (row) out.push(row);
      } catch (err) {
        /* a word that fails here: left out */
      }
    });
    return out;
  }

  /** The block under a building's tooltip (opts.force: whatever the options and buy mode — the editor's preview). */
  function buildingBlock(b, opts = {}) {
    if (!opts.force && (!S('storeTooltips') || Game.buyMode !== 1)) return '';
    const t = P().table();
    const r = rowFor(b, t);
    return block(rowsFor({ kind: 'building', b, r, t }), warnings(r.price));
  }
  function upgradeBlock(u, opts = {}) {
    if (!opts.force && !S('storeTooltips')) return '';
    const t = P().table();
    const r = t.upgrades[u.name];
    if (!r) return '';
    return block(rowsFor({ kind: 'upgrade', u, r, t }), warnings(r.price));
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
    CA.Settings.defineOption({ key: 'storeWarnings', group: 'store', icon: 'bell', name: 'Bank warnings', desc: 'A small coloured “!” on anything whose purchase would take your bank below what a Lucky! (red), Conjure Baked Goods (orange) or a Lucky! in a Frenzy (yellow) needs to pay its most — and one line in its tooltip saying which, and by how much.', default: false });
    wrapTooltips();
    setInterval(() => {
      try {
        wrapTooltips();
        paint();
      } catch (e) {
        /* a store mid-rebuild: next time */
      }
    }, 500);
    CA.Events.on('settings', (k) => (k === 'storeColours' || k === 'storeUpgradeSort' || k === 'storeWarnings' || k === null) && paint());
  }

  return { init, paint, buildingBlock, upgradeBlock, warnings, banks, LINES, DEFAULT_LINES, FORMATS, lines, setLines, isDefault, words };
})();
