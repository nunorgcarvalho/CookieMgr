// The store toolbar: a row of small icon buttons along the bottom of the store (the right-hand
// panel), over the building rows, stretching across the panel.
//
//   sort        best buy first · next achievement first · game order (features/shop.js works the
//               order out; laySort() lays the store's building rows out in it, as Cookie Monster
//               does: the building list as a grid, a row number per building)
//   multiples   on/off: ×10 / ×100 buys and sells stop at a multiple of it
//   min bulk    auto → ×1 → ×10 → ×100: what cookieMgr's buyers buy a building in (features/shop.js)
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
    const cur = CA.Shop.sort();
    const bulk = Game.buyBulk === 10 || Game.buyBulk === 100 ? Game.buyBulk : 10;
    const on = CA.Shop.roundUp();
    const usable = Game.buyBulk === 10 || Game.buyBulk === 100;
    const selling = Game.buyMode === -1;
    let h = `<div class="ca-sb-group ca-sb-sort"><span class="ca-sb-label">${I('sortList', 11)} sort</span>`;
    CA.Shop.SORTS.forEach((s) => {
      const tip = `${s.name} — ${s.desc}`;
      h += `<button type="button" class="ca-sb-btn${cur === s.id ? ' on' : ''}" data-ss-sort="${s.id}" data-tip="${CA.Util.escapeHtml(tip)}">${I(s.icon, 14)}</button>`;
    });
    h += '</div>';
    h +=
      `<div class="ca-sb-group"><button type="button" class="ca-sb-btn ca-sb-round${on ? ' on' : ''}${usable ? '' : ' idle'}" data-ss-round ` +
      `data-tip="${CA.Util.escapeHtml(
        `Round to multiples: ${on ? 'on' : 'off'} — with ×10 or ×100, buying stops at the next multiple (37 → 40) and selling at the one below (37 → 30).${usable ? '' : ' Select ×10 or ×100 to use it.'}`
      )}">` +
      `<span class="ca-sb-txt">${selling ? '⌊' : '⌈'}${bulk}${selling ? '⌋' : '⌉'}</span></button>`;
    const mb = Number(CA.Settings.get('minBulk')) || 0;
    h +=
      `<button type="button" class="ca-sb-btn ca-sb-min${mb ? ' on' : ''}" data-ss-min data-tip="${CA.Util.escapeHtml(
        `Minimum bulk: ${mb ? `×${mb}` : `auto (×${CA.Shop.minBulk()})`} — what cookieMgr’s buyers (the Auto buyer, buy.best, the Payback page) buy a building in${CA.Shop.roundUp() ? ', up to the next multiple of it' : ''}. Click for the next: auto, ×1, ×10, ×100.`
      )}"><span class="ca-sb-txt">≥${CA.Shop.minBulk()}</span></button></div>`;
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
    CA.UI.Dom.morph(el, html());
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
      CA.Shop.setSort(sortBtn.dataset.ssSort);
      render();
      laySort();
      return;
    }
    if (e.target.closest('[data-ss-min]')) {
      e.stopPropagation();
      CA.Util.sound('snd/tick.mp3');
      const all = CA.Shop.MIN_BULKS;
      CA.Shop.setMinBulk(all[(all.indexOf(Number(CA.Settings.get('minBulk')) || 0) + 1) % all.length]);
      render();
      laySort();
      return;
    }
    if (e.target.closest('[data-ss-round]')) {
      e.stopPropagation();
      CA.Util.sound(CA.Shop.roundUp() ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
      CA.Shop.setRoundUp(!CA.Shop.roundUp());
      render();
    }
  }

  // ---- the store's building rows, in the sort's order ------------------------------------------

  let laid = false; // whether the rows carry our layout (to undo it for the game's own order)
  let lastOrder = '';
  function laySort() {
    const products = document.getElementById('products');
    if (!products) return;
    const names = CA.Shop.order();
    const own = CA.Shop.sort() === 'default' || Game.buyMode !== 1;
    if (own) {
      if (!laid) return;
      products.style.removeProperty('display');
      const bulk = document.getElementById('storeBulk');
      if (bulk) bulk.style.removeProperty('grid-row');
      Object.values(Game.Objects || {}).forEach((b) => b.l && b.l.style.removeProperty('grid-row'));
      laid = false;
      lastOrder = '';
      return;
    }
    const key = names.join('|');
    if (laid && key === lastOrder) return;
    products.style.display = 'grid';
    const bulk = document.getElementById('storeBulk');
    if (bulk) bulk.style.gridRow = '1/1';
    names.forEach((n, i) => {
      const b = Game.Objects[n];
      if (b && b.l) b.l.style.gridRow = `${i + 2}/${i + 2}`;
    });
    laid = true;
    lastOrder = key;
  }

  function init() {
    CA.Events.on('settings', (k) => (k === 'storeSwitch' || k === 'roundUpBulk' || k === 'minBulk' || k === null) && render());
    CA.Events.on('shop', render);
    addEventListener('resize', place);
    // bulk / buy-sell mode, Cookie Monster arriving, the window resizing: cheap to redo
    setInterval(render, PLACE_MS);
    setInterval(() => {
      try {
        laySort();
      } catch (e) {
        /* a store mid-rebuild: next time */
      }
    }, PLACE_MS);
    CA.Events.on('settings', (k) => k === 'storeSort' && laySort());
    render();
  }

  return { init, render, laySort };
})();
