// A small toolbar inside the Bank minigame itself, right under its own header: Sell all, the
// stock autobuyer switch, and a shortcut to the CookieMgr Stock market page. It reuses the
// game's own .bankButton styling so it reads as part of the minigame, not an overlay.
//
// NOTE: this reaches into the Bank minigame's DOM (there's no mod API for adding to it), by
// inserting itself right after #bankHeader. If a future game update changes that markup, it
// quietly stops appearing rather than breaking anything else.

CA.UI = CA.UI || {};

CA.UI.BankToolbar = (() => {
  const ID = 'cm-bank-toolbar';
  const I = (name) => CA.UI.Icons.html(name, 12);

  function header() {
    return CA.Stocks.minigame() ? document.getElementById('bankHeader') : null;
  }

  function onClick(e) {
    const b = e.target.closest('[data-cm-bt]');
    if (!b) return;
    switch (b.dataset.cmBt) {
      case 'sell':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.StockTrader.sellAll();
        b.title = CA.StockTrader.sellAllTitle();
        break;
      case 'auto':
        CA.Util.sound(CA.StockTrader.isOn() ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        CA.StockTrader.toggle();
        break;
      case 'open':
        CA.UI.Menu.openPage('stocks');
        break;
      default:
    }
    sync();
  }

  function ensure() {
    const head = header();
    let bar = document.getElementById(ID);
    if (!head || !CA.Settings.get('bankToolbar')) {
      if (bar) bar.remove();
      return null;
    }
    if (bar && bar.previousElementSibling !== head) {
      bar.remove();
      bar = null;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = ID;
      bar.innerHTML =
        `<div class="bankButton bankButtonSell" data-cm-bt="sell">${I('dollar')}Sell all stocks</div>` +
        '<div class="bankButton bankButtonBuy" data-cm-bt="auto"></div>' +
        `<div class="bankButton cm-bt-open" data-cm-bt="open" title="Open the CookieMgr Stock market page">${I('open')}CookieMgr</div>`;
      bar.addEventListener('click', onClick);
      const sell = bar.querySelector('[data-cm-bt="sell"]');
      sell.addEventListener('mouseenter', () => {
        sell.title = CA.StockTrader.sellAllTitle();
      });
      head.insertAdjacentElement('afterend', bar);
    }
    return bar;
  }

  function sync() {
    const bar = ensure();
    if (!bar) return;
    const on = CA.StockTrader.isOn();
    const auto = bar.querySelector('[data-cm-bt="auto"]');
    auto.innerHTML = `${I('bolt')}Autobuyer: ${on ? 'on' : 'off'}`;
    auto.classList.toggle('bankButtonOff', !on);
    auto.title = 'Buys fast/slow-rising stocks and sells the rest, every second (same switch as on the CookieMgr page)';
  }

  function init() {
    CA.Settings.defineOption({
      key: 'bankToolbar',
      icon: 'toolbar',
      group: 'stocks',
      name: 'Toolbar in the Bank minigame',
      desc: 'Sell all, the autobuyer switch and a CookieMgr shortcut, right under the stock market header.',
      default: true,
    });
    CA.Events.on('macros', sync);
    CA.Events.on('settings', sync);
    setInterval(sync, 1000); // the minigame redraws/opens on its own schedule
    sync();
  }

  return { init };
})();
