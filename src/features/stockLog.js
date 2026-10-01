// Records every stock trade — bought or sold, by the "buy fast/slow rise" autoclicker or by you
// clicking the Bank minigame's own buy/sell buttons — as 'trade' events in the central event log
// (core/eventLog.js), so they're persisted per save and show up anywhere events are listed.
//
// There is no separate "manual trade" event to hook: the Bank minigame's own UI buttons call
// straight into `minigame.buyGood`/`minigame.sellGood` (verified against minigameMarket.js), the
// exact same functions our autoclicker calls. So we wrap those two functions once, the same way
// CA.Util.wrap() wraps Game.* elsewhere — one wrapper sees every trade regardless of who made it.

CA.StockLog = (() => {
  const POLL_MS = 1000;

  let cache = { version: -1, list: [] };

  function wrap(m) {
    if (m.__cmLogWrapped) return;
    m.__cmLogWrapped = true;

    const origBuy = m.buyGood;
    const origSell = m.sellGood;

    m.buyGood = function (id, n) {
      const good = m.goodsById[id];
      const beforeStock = good ? good.stock : 0;
      const beforeCookies = Game.cookies;
      const ok = origBuy.call(this, id, n);
      if (ok && good) {
        const shares = good.stock - beforeStock;
        if (shares > 0) record('buy', good, shares, beforeCookies - Game.cookies);
      }
      return ok;
    };

    m.sellGood = function (id, n) {
      const good = m.goodsById[id];
      const beforeStock = good ? good.stock : 0;
      const beforeCookies = Game.cookies;
      const ok = origSell.call(this, id, n);
      if (ok && good) {
        const shares = beforeStock - good.stock;
        if (shares > 0) record('sell', good, shares, Game.cookies - beforeCookies);
      }
      return ok;
    };
  }

  /** `cookies` is the unsigned amount the trade cost or paid out. */
  function record(kind, good, shares, cookies) {
    const verb = kind === 'buy' ? 'Bought' : 'Sold';
    const e = CA.EventLog.add({
      type: 'trade',
      title: `${verb} ${shares} ${good.name}`,
      text: `@ $${Math.round(good.val * 100) / 100}`,
      cookies: kind === 'buy' ? -cookies : cookies,
      data: { kind, id: good.id, name: good.name, shares, price: good.val },
    });
    CA.Events.emit('stockTrade', e);
  }

  function poll() {
    const m = CA.Stocks.minigame();
    if (m) wrap(m);
  }

  /** Every logged trade, oldest first, in the flat shape the Stock market page uses:
   *  { t, kind: 'buy'|'sell', id, name, shares, price, cookies (unsigned) }. */
  function list() {
    const v = CA.EventLog.version();
    if (cache.version !== v) {
      cache = {
        version: v,
        list: CA.EventLog.list(['trade']).map((e) => ({ t: e.t, ...e.data, cookies: Math.abs(e.cookies) })),
      };
    }
    return cache.list;
  }

  function init() {
    setInterval(poll, POLL_MS);
    poll();
  }

  return { init, list };
})();
