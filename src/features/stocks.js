// Stock market helper: shows every stock's trend right on its box in the Bank minigame,
// so you can trade at a glance instead of hovering for the tooltip.
//
//   - a coloured strip with a symbol + label (Stable, Slow rise, Fast rise, ...)
//   - the whole box is tinted in the trend's colour, and glows brighter while you own the stock
//
// The game keeps each stock's trend in `good.mode`:
//   0 stable · 1 slow rise · 2 slow fall · 3 fast rise · 4 fast fall · 5 chaotic

CA.Stocks = (() => {
  const TICK_MS = 250;

  // Colours are paired with distinct symbols so the trend never depends on colour alone.
  const MODES = [
    { key: 'stable', label: 'Stable', sym: '▬', color: '#7fa6c9', hint: 'Barely moves.' },
    { key: 'rise', label: 'Slow rise', sym: '▲', color: '#a6e35a', hint: 'Drifting up.' },
    { key: 'fall', label: 'Slow fall', sym: '▼', color: '#ffa640', hint: 'Drifting down.' },
    { key: 'surge', label: 'Fast rise', sym: '▲▲', color: '#2fe07a', hint: 'Climbing quickly, but can turn into a fast fall.' },
    { key: 'crash', label: 'Fast fall', sym: '▼▼', color: '#ff4d4d', hint: 'Dropping quickly.' },
    { key: 'chaos', label: 'Chaotic', sym: '↯', color: '#c77dff', hint: 'Swings wildly in both directions.' },
  ];

  const CSS = `
.bankGood.cm-stock { background-image: linear-gradient(var(--cm-tint), var(--cm-tint)); transition: box-shadow .25s, background-image .25s; }
.bankGood.cm-stock.cm-owned { background-image: linear-gradient(var(--cm-tint-strong), var(--cm-tint-strong)); }
.bankGood.cm-stock {
  --cm-tint: color-mix(in srgb, var(--cm-c) 15%, transparent);
  --cm-tint-strong: color-mix(in srgb, var(--cm-c) 40%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cm-c) 40%, transparent), 2px 2px 4px rgba(0,0,0,.5) inset;
}
.bankGood.cm-stock.cm-owned {
  box-shadow: 0 0 0 2px var(--cm-c), 0 0 10px 1px color-mix(in srgb, var(--cm-c) 70%, transparent), 2px 2px 4px rgba(0,0,0,.5) inset;
}
.bankGood.cm-stock.cm-notint, .bankGood.cm-stock.cm-notint.cm-owned { background-image: none; }
.cm-stockbadge {
  display: block; box-sizing: border-box; width: 100%; padding: 2px 20px 2px 22px; position: relative; margin: 0 0 1px;
  font: bold 10px/14px Tahoma, Arial, sans-serif; letter-spacing: .04em; text-transform: uppercase; text-align: center;
  color: #10141a; background: var(--cm-c); text-shadow: none; white-space: nowrap; overflow: hidden;
}
.cm-stockbadge b { font-size: 11px; margin-right: 4px; letter-spacing: 0; }
.bankGood.cm-owned .cm-stockbadge { box-shadow: 0 0 6px var(--cm-c); }
.bankGood.cm-owned .cm-stockbadge::before { content: '\\2605'; color: #fff; margin-right: 4px; text-shadow: 0 0 3px #000; }
`;

  let timer = null;
  let sampleTimer = null;

  const minigame = () => {
    const bank = typeof Game !== 'undefined' && Game.Objects && Game.Objects.Bank;
    const m = bank && bank.minigame;
    return m && m.goodsById ? m : null;
  };

  // ---- price history --------------------------------------------------------------
  // Session-only, one sample per second per stock, same rolling window as CA.History
  // so the price graph can cover the same time range as the CpS graph.

  const SAMPLE_MS = 1000;
  const MAX_SAMPLES = 4 * 3600; // 4 hours
  const priceHistory = {}; // good.id -> [{ t, v }]

  const priceOf = (good) => (typeof good.val === 'number' ? good.val : 0);

  // ---- portfolio (cost basis + realized/unrealized gain) ---------------------------
  // The game only shows you the current price and share count, not what you paid for
  // them, so we watch `good.stock` ourselves: any increase is a buy at the current price
  // (rolled into a running average cost), any decrease is a sell that realizes the gap
  // between that average cost and the current price. Session-only, same as price history —
  // there is no way to know what happened before the mod was loaded.
  const holdings = {}; // good.id -> { shares, avgCost, realized }
  const portfolioHistory = []; // [{ t, value, cost, unrealized, realized, gain }]

  function holdingOf(id) {
    return holdings[id] || (holdings[id] = { shares: 0, avgCost: 0, realized: 0 });
  }

  function updateHolding(good) {
    const h = holdingOf(good.id);
    const shares = good.stock || 0;
    const price = priceOf(good);
    const delta = shares - h.shares;
    if (delta > 0) {
      h.avgCost = (h.avgCost * h.shares + delta * price) / shares;
    } else if (delta < 0) {
      h.realized += -delta * (price - h.avgCost);
    }
    h.shares = shares;
    return h;
  }

  function sample() {
    const m = minigame();
    if (!m) return;
    const now = Date.now();
    let value = 0;
    let cost = 0;
    let realized = 0;
    m.goodsById.forEach((good) => {
      const arr = priceHistory[good.id] || (priceHistory[good.id] = []);
      const price = priceOf(good);
      arr.push({ t: now, v: price });
      if (arr.length > MAX_SAMPLES + 200) arr.splice(0, arr.length - MAX_SAMPLES);

      const h = updateHolding(good);
      value += h.shares * price;
      cost += h.shares * h.avgCost;
      realized += h.realized;
    });
    const unrealized = value - cost;
    portfolioHistory.push({ t: now, value, cost, unrealized, realized, gain: unrealized + realized });
    if (portfolioHistory.length > MAX_SAMPLES + 200) portfolioHistory.splice(0, portfolioHistory.length - MAX_SAMPLES);
  }

  /** Current totals plus a per-stock breakdown, for stat tiles / tooltips. */
  function portfolioNow() {
    const m = minigame();
    const rows = (m ? m.goodsById : []).map((good) => {
      const h = holdingOf(good.id);
      const price = priceOf(good);
      return {
        id: good.id,
        name: good.name,
        shares: h.shares,
        price,
        value: h.shares * price,
        avgCost: h.avgCost,
        unrealized: h.shares * (price - h.avgCost),
        realized: h.realized,
      };
    });
    const last = portfolioHistory[portfolioHistory.length - 1];
    return {
      value: last ? last.value : 0,
      cost: last ? last.cost : 0,
      unrealized: last ? last.unrealized : 0,
      realized: last ? last.realized : 0,
      gain: last ? last.gain : 0,
      rows,
    };
  }

  /** Every stock, with its display name and whether you currently hold any. */
  function list() {
    const m = minigame();
    if (!m) return [];
    return m.goodsById.map((good) => ({ id: good.id, name: good.name, owned: good.stock > 0 }));
  }

  /** Recorded price samples for one stock (empty if never seen). */
  function history(id) {
    return priceHistory[id] || [];
  }

  function clear(el) {
    el.classList.remove('cm-stock', 'cm-owned', 'cm-notint');
    el.style.removeProperty('--cm-c');
    const badge = el.querySelector('.cm-stockbadge');
    if (badge) badge.remove();
    delete el.dataset.cmMode;
  }

  function decorate(el, good) {
    const info = MODES[good.mode];
    if (!info) return clear(el);
    el.classList.add('cm-stock');
    el.classList.toggle('cm-owned', good.stock > 0);
    el.classList.toggle('cm-notint', !CA.Settings.get('stockTint'));
    if (el.dataset.cmMode !== String(good.mode) || !el.querySelector('.cm-stockbadge')) {
      el.dataset.cmMode = String(good.mode);
      el.style.setProperty('--cm-c', info.color);
      let badge = el.querySelector('.cm-stockbadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'cm-stockbadge';
        el.insertBefore(badge, el.firstChild);
      }
      badge.title = `${info.label}: ${info.hint}`;
      badge.innerHTML = `<b>${info.sym}</b>${info.label}`;
    }
  }

  function refresh() {
    const m = minigame();
    if (!m) return;
    const on = CA.Settings.get('stockIndicators');
    m.goodsById.forEach((good) => {
      const el = document.getElementById(`bankGood-${good.id}`);
      if (!el) return;
      if (on && good.active !== false) decorate(el, good);
      else clear(el);
    });
  }

  function init() {
    CA.Settings.defineOption({
      key: 'stockIndicators',
      group: 'stocks',
      name: 'Stock market trend indicators',
      desc: 'Shows each stock’s trend (stable, rising, falling, chaotic) on its box in the Bank minigame.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockTint',
      group: 'stocks',
      name: 'Tint stock boxes',
      desc: 'Colours each stock box by its trend; boxes glow brighter while you hold that stock.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockGraphSync',
      group: 'stocks',
      name: 'Sync graph to owned stocks',
      desc: 'The per-stock price view only plots stocks you currently hold; turn off to show all of them.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'stockGraphMode',
      group: 'graph-select',
      name: 'Stock graph view',
      desc: '',
      default: 'portfolio', // 'portfolio' | 'perStock'
    });
    CA.Settings.defineOption({
      key: 'bankGraphEnabled',
      group: 'stocks',
      name: 'Graph in the Bank minigame',
      desc: 'Shows a small graph underneath the stock market itself, not just on the Graphs tab.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'bankGraphMode',
      group: 'graph-select',
      name: 'Bank graph view',
      desc: '',
      default: 'portfolio', // 'portfolio' | 'cps'
    });
    CA.Util.injectCss('CookieMgrStocksStyles', CSS);
    CA.Events.on('settings', refresh);
    timer = setInterval(refresh, TICK_MS);
    sampleTimer = setInterval(sample, SAMPLE_MS);
    refresh();
    sample();
  }

  return { init, refresh, MODES, list, history, portfolioNow, portfolioHistory: () => portfolioHistory, minigame };
})();
