// Stock market autoclicker: buys the max it can afford of fast-rising stocks, then slow-rising
// ones, and sells anything it holds that isn't currently rising. That's the whole strategy —
// no price targets, no per-stock tuning.
//
// Kept separate from CA.Autoclickers (rather than another DEFS entry) on purpose: it lives on
// its own Stock market tab and must NOT be swept up by "All on/off" or the toggle-all hotkey.
//
// Uses the Bank minigame's own buy/sell API (M.buyGood/M.sellGood with the amount `10000`,
// the same sentinel value the game's own "buy max"/"sell max" buttons use — verified against
// minigameMarket.js) rather than computing an affordable amount ourselves.

CA.StockTrader = (() => {
  const TICK_MS = 1000;
  const RISING = [3, 1]; // fast rise, then slow rise — good.mode values (see features/stocks.js)

  let timer = null;
  let enabled = false;

  function trade(m) {
    const goods = m.goodsById.filter((g) => g.active);
    goods.forEach((g) => {
      if (g.stock > 0 && !RISING.includes(g.mode)) m.sellGood(g.id, 10000);
    });
    RISING.forEach((mode) => goods.forEach((g) => g.mode === mode && m.buyGood(g.id, 10000)));
  }

  function tick() {
    if (Game.OnAscend || Game.AscendTimer > 0) return;
    const m = CA.Stocks.minigame();
    if (!m) return;
    try {
      trade(m);
    } catch (e) {
      console.error('[CookieMgr] Stock market autoclicker error', e);
    }
  }

  function announce(on) {
    if (!CA.Settings.get('notifications')) return;
    CA.Util.notify('Stock market buy autoclicker', on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', [9, 33], 2);
  }

  function set(on, { silent = false } = {}) {
    on = !!on;
    if (enabled === on && (!on || timer)) return;
    clearInterval(timer);
    timer = null;
    enabled = on;
    if (on) timer = setInterval(tick, TICK_MS);
    if (!silent) announce(on);
    CA.Events.emit('clickers', 'stockTrader');
  }

  function toggle() {
    set(!enabled);
  }
  const isOn = () => enabled;

  function init() {
    CA.Actions.register({
      id: 'clicker.stockTrader',
      name: 'Stock market buy',
      group: 'stocks',
      defaultKey: '',
      run: toggle,
    });
  }

  return { init, set, toggle, isOn };
})();
