// The store, with what each purchase is worth (features/payback.js) — what Cookie Monster adds to it:
//
//   colours    each building's price in its payback colour, for what a click buys now (×1, ×10,
//              ×100, or to the next multiple), and a small dot in each upgrade's corner
//   tooltips   under the game's own building and upgrade tooltips, a CookieMgr block: the CpS it
//              adds (and what share of your CpS that is), its payback period and colour, when you can
//              afford it, the achievements it wins; a building's share of your production, and how
//              many more win its next achievement
//   warnings   in the same block: buying it would take your bank below what a Lucky! (or a Lucky! in
//              a Frenzy, or Conjure Baked Goods) needs to pay its most
//
// Options (Settings → Store): storeColours, storeTooltips, storeWarnings.

CA.UI = CA.UI || {};

CA.UI.StoreInsight = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const P = () => CA.Payback;
  const COLOURS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'gray'];
  const S = (k) => CA.Settings.get(k);
  const ppText = (v) => (Number.isFinite(v) ? F().short(v) : '∞');

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
    (Game.UpgradesInStore || []).forEach((u, i) => {
      const el = document.getElementById(`upgrade${i}`);
      if (!el) return;
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
  const share = (v) => (Game.cookiesPs > 0 ? ` (${((v / Game.cookiesPs) * 100).toFixed(2)}%)` : '');
  const afford = (price) => {
    const s = P().timeTo(price);
    return s <= 0 ? 'now' : Number.isFinite(s) ? F().span(s) : 'not at this CpS';
  };

  function buildingBlock(b) {
    if (!S('storeTooltips') || Game.buyMode !== 1) return '';
    const t = P().table();
    const r = rowFor(b, t);
    const next = P().nextAchievement(b.name);
    const produce = b.storedTotalCps && Game.cookiesPs ? (b.storedTotalCps * (Game.globalCpsMult || 1)) / Game.cookiesPs : 0;
    const rows = [
      [`Bonus income (×${r.n})`, `+${F().beautify(r.bonus)}/s${share(r.bonus)}`],
      ['Payback period', ppText(r.pp), `ca-pp-${r.colour}`],
      ['Affordable', afford(r.price)],
      ['Share of production', `${(produce * 100).toFixed(2)}%`],
      ['Next achievement', next.n <= 100 ? `${next.n} more (${F().beautify(next.price)})` : 'none within 100'],
    ];
    if (r.won.length) rows.push(['Wins', esc(r.won.join(', '))]);
    return block(rows, warnings(r.price));
  }
  function upgradeBlock(u) {
    if (!S('storeTooltips')) return '';
    const r = P().table().upgrades[u.name];
    if (!r) return '';
    const rows = [];
    if (r.bonus) rows.push(['Bonus income', `${r.bonus > 0 ? '+' : ''}${F().beautify(r.bonus)}/s${share(r.bonus)}`]);
    if (r.mouse > 0) rows.push(['Per click', `+${F().beautify(r.mouse)} (≈ ${F().beautify(r.mouse * P().clickRate())}/s at your clicking)`]);
    rows.push(['Payback period', ppText(r.pp), `ca-pp-${r.colour}`]);
    rows.push(['Affordable', afford(r.price)]);
    if (r.won.length) rows.push(['Wins', esc(r.won.join(', '))]);
    return block(rows, warnings(r.price));
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
    D('storeWarnings', 'bell', 'Bank warnings', 'In those tooltips: a warning when buying would take your bank below what a Lucky! (in a Frenzy too) or Conjure Baked Goods needs to pay its most.');
    wrapTooltips();
    setInterval(() => {
      try {
        wrapTooltips();
        paint();
      } catch (e) {
        /* a store mid-rebuild: next time */
      }
    }, 500);
    CA.Events.on('settings', (k) => (k === 'storeColours' || k === null) && paint());
  }

  return { init, paint, buildingBlock, upgradeBlock, warnings };
})();
