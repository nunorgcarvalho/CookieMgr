// Two views onto CA.StockLog's trade records, both on the Stock market tab: a scrolling ticker
// (a running "here's what just got bought/sold" feed, auto or manual) and a scrollable
// transaction history table (time, action, stock, shares, price, total).

CA.UI = CA.UI || {};

CA.UI.StockLog = (() => {
  const TICK_MS = 1000;
  const MAX_LOG_ROWS = 100; // the underlying log keeps more (CA.StockLog.MAX_RECORDS); this is just what's rendered
  const MAX_TICKER_ITEMS = 30;
  const PX_PER_SEC = 55; // ticker scroll speed

  let root = null;
  let timer = null;
  let lastCount = -1;

  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  const esc = (s) => CA.Util.escapeHtml(s);

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  }

  function tickerItemHtml(e) {
    const arrow = e.kind === 'buy' ? '▲' : '▼';
    const verb = e.kind === 'buy' ? 'Bought' : 'Sold';
    return `<span class="cm-tick-item cm-tick-${e.kind}">${arrow} ${verb} ${beautify(e.shares)} ${esc(e.name)} @ ${beautify(e.price, 2)}</span>`;
  }

  function logRowHtml(e) {
    return (
      '<tr class="cm-tx-row">' +
      `<td>${clock(e.t)}</td>` +
      `<td class="cm-tx-${e.kind}">${e.kind === 'buy' ? 'Buy' : 'Sell'}</td>` +
      `<td>${esc(e.name)}</td>` +
      `<td>${beautify(e.shares)}</td>` +
      `<td>${beautify(e.price, 2)}</td>` +
      `<td>${beautify(e.cookies)}</td>` +
      '</tr>'
    );
  }

  function html() {
    return (
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Transaction history</div></div>' +
      '<div class="cm-tx-wrap">' +
      '<table class="cm-tx-table">' +
      '<thead><tr><th>Time</th><th>Action</th><th>Stock</th><th>Shares</th><th>Price</th><th>Total</th></tr></thead>' +
      '<tbody data-cm-tx-body></tbody>' +
      '</table>' +
      '<div class="cm-tx-empty" data-cm-tx-empty>No trades yet this session.</div>' +
      '</div>' +
      '</div>' +
      '<div class="cm-ticker" data-cm-ticker title="Every buy/sell, from the autoclicker or from clicking the Bank\'s own buttons">' +
      '<div class="cm-ticker-track" data-cm-ticker-track></div>' +
      '</div>'
    );
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
