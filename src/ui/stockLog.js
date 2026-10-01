// Views onto CA.StockLog's trade records, all on the Stock market tab:
//   - summary stat tiles (bought/sold/spent/earned/net) for the whole session
//   - "tick bars": a compact bought/sold bar per each of the last 5 one-second ticks with trades
//   - a scrollable transaction history table (time, action, stock, shares, price, total)
//   - a scrolling ticker — a running "here's what just got bought/sold" feed, at the bottom
// All four read the same underlying log, so a manual trade and an autoclicker trade show up
// identically everywhere.

CA.UI = CA.UI || {};

CA.UI.StockLog = (() => {
  const TICK_MS = 1000;
  const MAX_LOG_ROWS = 100; // the underlying log keeps more (CA.StockLog's own cap); this is just what's rendered
  const MAX_TICKER_ITEMS = 30;
  const PX_PER_SEC = 55; // ticker scroll speed
  const TICK_BUCKET_MS = 1000; // matches the stock-trader autoclicker's own cadence
  const MAX_TICK_BARS = 5;

  let root = null;
  let timer = null;
  let lastCount = -1;

  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  // Trades are priced in the Bank minigame's own "$" units (good.val, same as its own "for $X
  // each" tooltip) — not raw cookies, which would scale with CpS and quickly overflow a tile.
  const dollars = (v, floats) => '$' + beautify(v, floats);
  const signedDollars = (v) => (v < 0 ? '-$' : '+$') + beautify(Math.abs(v));
  /** The $ value of one trade — shares × price, not the actual cookies spent/earned (which
   *  scale with your CpS via the game's own buy/sell overhead formula and aren't comparable
   *  trade-to-trade the way a nominal $ value is). */
  const tradeValue = (r) => r.shares * r.price;
  const esc = (s) => CA.Util.escapeHtml(s);

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  }
  function clockShort(t) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}`;
  }

  function statTile(label, value, sub) {
    return `<div class="ca-stat"><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;
  }

  // ---- summary (whole session) ------------------------------------------------------

  function summary() {
    let bought = 0,
      sold = 0,
      spent = 0,
      earned = 0,
      buys = 0,
      sells = 0;
    CA.StockLog.list().forEach((r) => {
      if (r.kind === 'buy') {
        bought += r.shares;
        spent += tradeValue(r);
        buys++;
      } else {
        sold += r.shares;
        earned += tradeValue(r);
        sells++;
      }
    });
    return { bought, sold, spent, earned, net: earned - spent, buys, sells };
  }

  function summaryHtml() {
    const s = summary();
    return (
      statTile('Bought', beautify(s.bought), s.buys + (s.buys === 1 ? ' buy' : ' buys')) +
      statTile('Sold', beautify(s.sold), s.sells + (s.sells === 1 ? ' sell' : ' sells')) +
      statTile('Spent', dollars(s.spent)) +
      statTile('Earned', dollars(s.earned)) +
      statTile('Net', signedDollars(s.net), 'earned − spent')
    );
  }

  // ---- tick bars (last 5 one-second ticks that had a trade) -------------------------

  function tickBuckets() {
    const map = new Map();
    CA.StockLog.list().forEach((r) => {
      const idx = Math.floor(r.t / TICK_BUCKET_MS);
      let b = map.get(idx);
      if (!b) {
        b = { idx, bought: 0, sold: 0, spent: 0, earned: 0 };
        map.set(idx, b);
      }
      if (r.kind === 'buy') {
        b.bought += r.shares;
        b.spent += tradeValue(r);
      } else {
        b.sold += r.shares;
        b.earned += tradeValue(r);
      }
    });
    return [...map.values()]
      .sort((a, b) => a.idx - b.idx)
      .slice(-MAX_TICK_BARS);
  }

  function tickBarHtml(b, maxShares) {
    const t = b.idx * TICK_BUCKET_MS;
    const buyPct = Math.round((b.bought / maxShares) * 100);
    const sellPct = Math.round((b.sold / maxShares) * 100);
    const net = b.earned - b.spent;
    return (
      `<div class="cm-tickbar" title="${esc(clock(t))} — bought ${beautify(b.bought)}, sold ${beautify(b.sold)}">` +
      `<div class="cm-tickbar-time">${clockShort(t)}</div>` +
      `<div class="cm-tickbar-row"><span class="cm-tickbar-fill cm-tickbar-buy" style="width:${buyPct}%"></span></div>` +
      `<div class="cm-tickbar-row"><span class="cm-tickbar-fill cm-tickbar-sell" style="width:${sellPct}%"></span></div>` +
      `<div class="cm-tickbar-net ${net >= 0 ? 'cm-tx-buy' : 'cm-tx-sell'}">${signedDollars(net)}</div>` +
      '</div>'
    );
  }

  function tickBarsHtml() {
    const buckets = tickBuckets();
    if (!buckets.length) return '<div class="cm-ticks-empty">No recent ticks with trades.</div>';
    const maxShares = Math.max(1, ...buckets.map((b) => Math.max(b.bought, b.sold)));
    return buckets.map((b) => tickBarHtml(b, maxShares)).join('');
  }

  // ---- ticker + transaction table -----------------------------------------------------

  function tickerItemHtml(e) {
    const arrow = e.kind === 'buy' ? '▲' : '▼';
    const verb = e.kind === 'buy' ? 'Bought' : 'Sold';
    return `<span class="cm-tick-item cm-tick-${e.kind}">${arrow} ${verb} ${beautify(e.shares)} ${esc(e.name)} @ ${dollars(e.price, 2)}</span>`;
  }

  function logRowHtml(e) {
    return (
      '<tr class="cm-tx-row">' +
      `<td>${clock(e.t)}</td>` +
      `<td class="cm-tx-${e.kind}">${e.kind === 'buy' ? 'Buy' : 'Sell'}</td>` +
      `<td>${esc(e.name)}</td>` +
      `<td>${beautify(e.shares)}</td>` +
      `<td>${dollars(e.price, 2)}</td>` +
      `<td>${dollars(tradeValue(e))}</td>` +
      '</tr>'
    );
  }

  function html() {
    return (
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Transaction history</div></div>' +
      '<div class="ca-stats" data-cm-tx-stats></div>' +
      '<div class="cm-tx-wrap">' +
      '<table class="cm-tx-table">' +
      '<thead><tr><th>Time</th><th>Action</th><th>Stock</th><th>Shares</th><th>Price</th><th>Total</th></tr></thead>' +
      '<tbody data-cm-tx-body></tbody>' +
      '</table>' +
      '<div class="cm-tx-empty" data-cm-tx-empty>No trades yet this session.</div>' +
      '</div>' +
      '</div>' +
      '<div class="cm-tickbars" data-cm-tickbars title="Bought/sold per second, last 5 ticks with activity"></div>' +
      '<div class="cm-ticker" data-cm-ticker title="Every buy/sell, from the autoclicker or from clicking the Bank\'s own buttons">' +
      '<div class="cm-ticker-track" data-cm-ticker-track></div>' +
      '</div>'
    );
  }

  function renderStats() {
    const box = root.querySelector('[data-cm-tx-stats]');
    if (box) box.innerHTML = summaryHtml();
  }

  function renderTickBars() {
    const box = root.querySelector('[data-cm-tickbars]');
    if (box) box.innerHTML = tickBarsHtml();
  }

  function renderLog() {
    const body = root.querySelector('[data-cm-tx-body]');
    const empty = root.querySelector('[data-cm-tx-empty]');
    if (!body) return;
    const rows = CA.StockLog.list().slice(-MAX_LOG_ROWS).reverse();
    body.innerHTML = rows.map(logRowHtml).join('');
    if (empty) empty.style.display = rows.length ? 'none' : '';
  }

  function renderTicker() {
    const track = root.querySelector('[data-cm-ticker-track]');
    if (!track) return;
    const items = CA.StockLog.list().slice(-MAX_TICKER_ITEMS);
    if (!items.length) {
      track.style.animation = 'none';
      track.innerHTML = '<span class="cm-tick-item cm-tick-empty">No trades yet — waiting for the market…</span>';
      return;
    }
    const sep = '<span class="cm-tick-sep">&bull;</span>';
    const strip = items.map(tickerItemHtml).join(sep);
    // Doubled back-to-back so the loop point (translateX -50%) is seamless.
    track.style.animation = 'none';
    track.innerHTML = strip + sep + strip + sep;
    void track.offsetWidth; // force layout so scrollWidth reflects the new content before restarting
    const duration = Math.max(8, track.scrollWidth / 2 / PX_PER_SEC);
    track.style.animation = `cmTickerScroll ${duration}s linear infinite`;
  }

  function tick() {
    if (!root) return;
    const count = CA.StockLog.list().length;
    if (count === lastCount) return;
    lastCount = count;
    renderStats();
    renderTickBars();
    renderLog();
    renderTicker();
  }

  function mount(el) {
    unmount();
    root = el;
    lastCount = -1;
    timer = setInterval(tick, TICK_MS);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    root = null;
  }

  function init() {
    CA.Events.on('stockTrade', tick);
  }

  return { init, html, mount, unmount, tick };
})();
