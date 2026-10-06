// The store toolbar: a row of small icon buttons along the bottom of the store (the right-hand
// panel), over the building rows, stretching across the panel.
//
//   sort        best buy first · next achievement first · game order — Cookie Monster's building
//               sort (features/shop.js); without Cookie Monster they're locked, and a click offers
//               to load it
//   multiples   on/off: ×10 / ×100 buys and sells stop at a multiple of it
//
// Placed like the sidebar: measured from the game's panels on resize and every half second. The
// building list gets a little room at the bottom so its last row can scroll clear of the toolbar.

CA.UI = CA.UI || {};

CA.UI.StoreBar = (() => {
  const ID = 'CookieMgrStoreBar';
  const PLACE_MS = 500;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  let el = null;

  function html() {
    const cm = CA.Shop.canSort();
    const cur = CA.Shop.sort();
    const bulk = Game.buyBulk === 10 || Game.buyBulk === 100 ? Game.buyBulk : 10;
    const on = CA.Shop.roundUp();
    const usable = Game.buyBulk === 10 || Game.buyBulk === 100;
    const selling = Game.buyMode === -1;
    let h = `<div class="ca-sb-group ca-sb-sort${cm ? '' : ' locked'}"><span class="ca-sb-label">${I('sortList', 11)} sort</span>`;
    CA.Shop.SORTS.forEach((s) => {
      const tip = cm ? `${s.name} — ${s.desc}` : `${s.name} — needs Cookie Monster: click to load it`;
      h += `<button type="button" class="ca-sb-btn${cur === s.id ? ' on' : ''}" data-ss-sort="${s.id}" data-tip="${CA.Util.escapeHtml(tip)}">${I(s.icon, 14)}${cm ? '' : `<span class="ca-sb-lock">${I('plug', 8)}</span>`}</button>`;
    });
    h += '</div>';
    h +=
      `<div class="ca-sb-group"><button type="button" class="ca-sb-btn ca-sb-round${on ? ' on' : ''}${usable ? '' : ' idle'}" data-ss-round ` +
      `data-tip="${CA.Util.escapeHtml(
        `Round to multiples: ${on ? 'on' : 'off'} — with ×10 or ×100, buying stops at the next multiple (37 → 40) and selling at the one below (37 → 30).${usable ? '' : ' Select ×10 or ×100 to use it.'}`
      )}">` +
      `<span class="ca-sb-txt">${selling ? '⌊' : '⌈'}${bulk}${selling ? '⌋' : '⌉'}</span></button></div>`;
    return h;
  }

  function render() {
    if (!CA.Settings.get('storeSwitch')) {
      if (el) el.remove();
      el = null;
      document.body.classList.remove('ca-has-storebar');
      return;
    }
    const host = document.getElementById('game') || document.body;
    if (!el || !el.isConnected) {
      el = document.createElement('div');
      el.id = ID;
      el.addEventListener('click', onClick);
      host.appendChild(el);
    }
    document.body.classList.add('ca-has-storebar');
    CA.UI.Widgets.morph(el, html());
    place();
  }

  /** Across the store's width (minus its scrollbar), at the bottom of the screen. */
  function place() {
    if (!el) return;
    const store = document.getElementById('sectionRight');
    const host = el.offsetParent || el.parentNode;
    if (!store || !host || !host.getBoundingClientRect) return;
    const s = store.getBoundingClientRect();
    if (!s.width) return;
    const h = host.getBoundingClientRect();
    const list = document.getElementById('store');
    const inner = list && list.clientWidth ? Math.min(s.width, list.clientWidth) : s.width;
    el.style.left = `${Math.round(s.left - h.left)}px`;
    el.style.width = `${Math.round(inner)}px`;
    el.style.top = `${Math.round(s.bottom - h.top - (el.offsetHeight || 0))}px`;
  }

  function onClick(e) {
    const sortBtn = e.target.closest('[data-ss-sort]');
    if (sortBtn) {
      e.stopPropagation();
      CA.Util.sound('snd/tick.mp3');
      if (!CA.Shop.canSort()) {
        if (CA.CookieMonster.load()) CA.Util.notify('Cookie Monster', 'Loading Cookie Monster — the sort buttons unlock once it’s running.', CA.ICON, 3);
        else CA.Util.notify('Cookie Monster', CA.CookieMonster.isLoading() ? 'Still loading…' : 'Cookie Monster is running but its settings aren’t ready yet — try again in a moment.', CA.ICON, 3);
        return;
      }
      CA.Shop.setSort(sortBtn.dataset.ssSort);
      render();
      return;
    }
    if (e.target.closest('[data-ss-round]')) {
      e.stopPropagation();
      CA.Util.sound(CA.Shop.roundUp() ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
      CA.Shop.setRoundUp(!CA.Shop.roundUp());
      render();
    }
  }

  function init() {
    CA.Events.on('settings', (k) => (k === 'storeSwitch' || k === 'roundUpBulk' || k === null) && render());
    CA.Events.on('integrations', render);
    CA.Events.on('shop', render);
    addEventListener('resize', place);
    // bulk / buy-sell mode, Cookie Monster arriving, the window resizing: cheap to redo
    setInterval(render, PLACE_MS);
    render();
  }

  return { init, render };
})();
