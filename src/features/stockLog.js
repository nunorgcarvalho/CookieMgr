// Records every stock trade — bought or sold, by the "buy fast/slow rise" autoclicker or by you
// clicking the Bank minigame's own buy/sell buttons — so the Stock market tab can show a ticker
// and a transaction history. Session-only (not mirrored to localStorage like CA.History/
// CA.Stocks are, at least for now).
//
// There is no separate "manual trade" event to hook: the Bank minigame's own UI buttons call
// straight into `minigame.buyGood`/`minigame.sellGood` (verified against minigameMarket.js), the
// exact same functions our autoclicker calls. So we wrap those two functions once, the same way
// CA.Util.wrap() wraps Game.* elsewhere — one wrapper sees every trade regardless of who made it.

CA.StockLog = (() => {
  const POLL_MS = 1000;
  const MAX_RECORDS = 500;

  let timer = null;
  const records = []; // [{ t, kind: 'buy'|'sell', id, name, shares, price, cookies }]

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

  function record(kind, good, shares, cookies) {
    const entry = { t: Date.now(), kind, id: good.id, name: good.name, shares, price: good.val, cookies };
    records.push(entry);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    CA.Events.emit('stockTrade', entry);
  }

  function poll() {
    const m = CA.Stocks.minigame();
    if (m) wrap(m);
  }

  /** Every trade recorded this session, oldest first. */
  const list = () => records;

  function init() {
    timer = setInterval(poll, POLL_MS);
    poll();
  }

  return { init, list };
})();
