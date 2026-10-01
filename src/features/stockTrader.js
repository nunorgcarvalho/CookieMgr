// Stock market trading logic: buys the max it can afford of fast-rising stocks, then slow-rising
// ones, and sells anything it holds that isn't currently rising. That's the whole strategy —
// no price targets, no per-stock tuning.
//
// The logic lives here as two actions (features/gameActions.js: stocks.trade, stocks.sellAll);
// switching it on and off is the built-in "Stock market autobuyer" macro (features/macros.js), so
// the Stock market page, the Bank minigame toolbar and the Macros page all show the same switch.
// It isn't part of "All autoclickers" and keeps running through an ascension.
//
// Uses the Bank minigame's own buy/sell API (M.buyGood/M.sellGood with the amount `10000`,
// the same sentinel value the game's own "buy max"/"sell max" buttons use — verified against
// minigameMarket.js) rather than computing an affordable amount ourselves.

CA.StockTrader = (() => {
  const RISING = [3, 1]; // fast rise, then slow rise — good.mode values (see features/stocks.js)
  const MACRO = 'stockTrader';

  /** One trading pass. Returns how many buy/sell orders went through. */
  function trade() {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    let n = 0;
    const goods = m.goodsById.filter((g) => g.active !== false);
    goods.forEach((g) => {
      if (g.stock > 0 && !RISING.includes(g.mode) && m.sellGood(g.id, 10000)) n++;
    });
    RISING.forEach((mode) =>
      goods.forEach((g) => {
        if (g.mode === mode && m.buyGood(g.id, 10000)) n++;
      })
    );
    return n;
  }

  /** Sells every stock held. Returns how many stocks were sold. */
  function sellEverything() {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    let n = 0;
    m.goodsById.forEach((g) => {
      if (g.stock > 0 && m.sellGood(g.id, 10000)) n++;
    });
    return n;
  }

  const set = (on, opts) => CA.Macros.set(MACRO, on, opts);
  const toggle = () => CA.Macros.toggle(MACRO);
  const isOn = () => CA.Macros.isOn(MACRO);

  /** The built-in "Sell all stocks" macro: autobuyer off first, then sell everything. */
  const sellAll = () => CA.Macros.runOnce('sellAll');

  /** Cookies selling everything right now would actually pay out — the same formula the Bank
   *  minigame's own sellGood uses (cookiesPsRawHighest × price × shares, per stock), so this
   *  matches exactly rather than approximating. For a hover preview, not an action. */
  function previewSellAllCookies() {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    const cpsHighest = (typeof Game !== 'undefined' && Game.cookiesPsRawHighest) || 0;
    let total = 0;
    m.goodsById.forEach((g) => {
      if (g.stock > 0) total += cpsHighest * g.val * g.stock;
    });
    return total;
  }

  /** Hover text for any "Sell all" button: the live cookie payout, or that there's nothing held. */
  function sellAllTitle() {
    const cookies = previewSellAllCookies();
    const beautify = (v) => (typeof Beautify === 'function' ? Beautify(v) : Math.round(v).toString());
    return cookies > 0 ? `Sells for ~${beautify(cookies)} cookies right now` : 'Nothing to sell right now';
  }

  return { trade, sellEverything, set, toggle, isOn, sellAll, previewSellAllCookies, sellAllTitle };
})();
