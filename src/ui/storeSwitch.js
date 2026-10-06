// The store side switch: a small column sticking out of the left edge of the store (the right-hand
// panel), level with the building list.
//
//   sort      three buttons — best buy first, next achievement first, game order — that set Cookie
//             Monster's building sort; without Cookie Monster they're locked, and a click offers to
//             load it
//   round up  on/off: ×10 / ×100 buys stop at the next multiple (features/store.js)
//
// Placed like the sidebar: measured from the game's own panels on resize and every half second.

CA.UI = CA.UI || {};

CA.UI.StoreSwitch = (() => {
  const ID = 'CookieMgrStoreSwitch';
  const PLACE_MS = 500;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  let el = null;

  function pop(head, body, foot) {
    return `<span class="ca-sspop"><b>${head}</b><span>${body}</span>${foot ? `<em>${foot}</em>` : ''}</span>`;
  }

  function html() {
    const cm = CA.Shop.canSort();
    const cur = CA.Shop.sort();
    let h = `<div class="ca-ss-group${cm ? '' : ' locked'}">`;
    CA.Shop.SORTS.forEach((s) => {
      h +=
        `<div class="ca-ss-btn${cur === s.id ? ' on' : ''}" data-ss-sort="${s.id}" role="button" aria-label="${s.name}">${I(s.icon, 14)}` +
        (cm ? pop(s.name, s.desc, cur === s.id ? 'sorting this way now' : 'click to sort this way') : pop(s.name, s.desc, 'Needs Cookie Monster — click to load it')) +
        '</div>';
    });
    h += '</div>';
    const bulk = Game.buyBulk === 10 || Game.buyBulk === 100 ? Game.buyBulk : 10;
    const on = CA.Shop.roundUp();
    h +=
      `<div class="ca-ss-btn ca-ss-round${on ? ' on' : ''}${Game.buyMode !== 1 || (Game.buyBulk !== 10 && Game.buyBulk !== 100) ? ' idle' : ''}" data-ss-round role="button" aria-label="Round bulk buys up">` +
      `<span class="ca-ss-txt">⌈${bulk}⌉</span>` +
      pop(
        `Round up: ${on ? 'on' : 'off'}`,
        `×10 and ×100 buy only what it takes to reach the next multiple (37 owned, ×10 → buys 3).`,
        Game.buyBulk === 10 || Game.buyBulk === 100 ? 'click to switch' : 'select ×10 or ×100 to use it'
      ) +
      '</div>';
    return h;
  }

  function render() {
    if (!CA.Settings.get('storeSwitch')) {
      if (el) el.remove();
      el = null;
      return;
    }
    const host = document.getElementById('game') || document.body;
    if (!el || !el.isConnected) {
      el = document.createElement('div');
      el.id = ID;
      el.addEventListener('click', onClick);
      host.appendChild(el);
    }
    CA.UI.Widgets.morph(el, html());
    place();
  }

  /** Right edge on the store's left edge; top level with the building list, kept on screen. */
  function place() {
    if (!el) return;
    const store = document.getElementById('sectionRight');
    const list = document.getElementById('products');
    const host = el.offsetParent || el.parentNode;
    if (!store || !host || !host.getBoundingClientRect) return;
    const s = store.getBoundingClientRect();
    if (!s.width) return;
    const h = host.getBoundingClientRect();
    const l = list ? list.getBoundingClientRect() : s;
    const height = el.offsetHeight || 0;
    const top = Math.max(s.top + 8, Math.min(l.top, s.bottom - height - 8));
    el.style.left = `${Math.round(s.left - h.left)}px`;
    el.style.top = `${Math.round(top - h.top)}px`;
  }

  function onClick(e) {
    const sortBtn = e.target.closest('[data-ss-sort]');
    if (sortBtn) {
      e.stopPropagation();
      if (!CA.Shop.canSort()) {
        if (CA.CookieMonster.load()) CA.Util.notify('Cookie Monster', 'Loading Cookie Monster — the sort buttons unlock once it’s running.', CA.ICON, 3);
        else CA.Util.notify('Cookie Monster', CA.CookieMonster.isLoading() ? 'Still loading…' : 'Cookie Monster is running but its settings aren’t ready yet — try again in a moment.', CA.ICON, 3);
        CA.Util.sound('snd/tick.mp3');
        return;
      }
      CA.Util.sound('snd/tick.mp3');
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
    // the bulk buttons, Cookie Monster arriving, the store growing: cheap to redo
    setInterval(render, PLACE_MS);
    render();
  }

  return { init, render };
})();
