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
  /**
   * The Stock market autobuyer's code (its default — yours to change): the same strategy as trade()
   * below, written with the market's building blocks. Its inputs `buy` and `brokers` are the
   * choices on its card.
   */
  const SOURCE = `# The stock market autobuyer, once a second: hire the stockbrokers you can afford
# (each makes buying 5% cheaper), sell what stopped rising, then buy what's rising.
# buy and brokers are its choices (on its card; shift-click its button flips buy).
# Stock modes: 0 stable · 1 slow rise · 2 slow fall · 3 fast rise · 4 fast fall · 5 chaotic
forever:
  if buy and brokers:
    stocks.hireBrokers()
  # sell anything held that isn't rising
  for good in stocks():
    if stock.held(good) > 0 and stock.mode(good) != 1 and stock.mode(good) != 3:
      stock.sell(good)
  if buy:
    # buy the max you can afford: fast risers first, then slow risers
    for good in stocks():
      if stock.mode(good) == 3:
        stock.buy(good)
    for good in stocks():
      if stock.mode(good) == 1:
        stock.buy(good)
`;

  /** The same strategy in JavaScript (the stocks.trade action) — the reference the code is tested against. */
  function trade({ buy = true, brokers = true } = {}) {
    const m = CA.Stocks.minigame();
    if (!m) return 0;
    let n = buy && brokers ? hireBrokers() : 0; // first: each broker cuts the overhead on what's bought next
    const goods = m.goodsById.filter((g) => g.active !== false);
    goods.forEach((g) => {
      if (g.stock > 0 && !RISING.includes(g.mode) && m.sellGood(g.id, 10000)) n++;
    });
    if (!buy) return n;
    RISING.forEach((mode) =>
      goods.forEach((g) => {
        if (g.mode === mode && m.buyGood(g.id, 10000)) n++;
      })
    );
    return n;
  }

  /**
   * Hires stockbrokers while there's room for one and you can afford it (minigameMarket.js: at most
   * the highest grandma count this run ÷ 10 + the grandma level; each costs 20 minutes of raw CpS and
   * cuts the overhead on buying goods by 5%). Through the Bank's own Hire button when it's there.
   */
  function hireBrokers() {
    const m = CA.Stocks.minigame();
    if (!m || typeof m.getMaxBrokers !== 'function' || typeof m.getBrokerPrice !== 'function') return 0;
    let n = 0;
    while (n < 100 && m.brokers < m.getMaxBrokers() && Game.cookies >= m.getBrokerPrice()) {
      const before = m.brokers;
      const btn = document.getElementById('bankBrokersBuy');
      if (btn) btn.click();
      if (m.brokers === before) {
        Game.Spend(m.getBrokerPrice());
        m.brokers += 1;
      }
      n++;
    }
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

  return { SOURCE, trade, hireBrokers, sellEverything, set, toggle, isOn, sellAll, previewSellAllCookies, sellAllTitle };
})();
