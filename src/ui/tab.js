// The sidebar: a column of small icon tabs sticking out of the left beam (between the cookie
// panel and the middle panel), one per registered page (CA.UI.Pages). Hovering a tab slides its
// name out to the left. Clicking jumps straight to that page, opening the panel if it's closed;
// clicking the page that's already showing closes the panel.

CA.UI = CA.UI || {};

CA.UI.Tab = (() => {
  const BANNER_GAP = 14; // px below the game's cookie-count banner
  const PLACE_MS = 2000;
  let wrap = null;

  /** Pins the sidebar just under the game's darkened cookie-count banner (#cookies). The banner
   *  sits at 10% of the screen height and grows with its text, so a fixed offset overlaps it on
   *  taller windows; measured instead, on resize and every couple of seconds. */
  function place() {
    if (!wrap) return;
    const banner = document.getElementById('cookies');
    const host = wrap.offsetParent || wrap.parentNode;
    if (!banner || !host || !host.getBoundingClientRect) return;
    const b = banner.getBoundingClientRect();
    if (!b.height) return; // hidden (ascending) or not laid out
    const top = `${Math.round(b.bottom - host.getBoundingClientRect().top + BANNER_GAP)}px`;
    if (wrap.style.top !== top) wrap.style.top = top;
  }

  function go(id) {
    if (CA.UI.Menu.isOpen() && CA.Settings.get('tab') === id) CA.UI.Menu.close();
    else CA.UI.Menu.openPage(id);
  }

  function itemHtml(p) {
    return (
      `<div class="ca-tab-item" data-tab-item="${p.id}" role="button" tabindex="0" aria-label="${CA.Util.escapeHtml(p.label)}">` +
      `<span class="ca-tab-label">${CA.Util.escapeHtml(p.label)}</span>` +
      `<span class="ca-tab-icon">${CA.UI.Icons.html(p.icon, 18)}<span class="ca-tab-badge"></span></span>` +
      '</div>'
    );
  }

  function create() {
    wrap = document.createElement('div');
    wrap.id = 'CookieMgrTab';
    wrap.innerHTML = CA.UI.Pages.list().map(itemHtml).join('');
    wrap.addEventListener('click', (e) => {
      const item = e.target.closest('[data-tab-item]');
      if (item) go(item.dataset.tabItem);
    });
    wrap.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('[data-tab-item]');
      if (!item) return;
      e.preventDefault();
      go(item.dataset.tabItem);
    });
    (document.getElementById('game') || document.body).appendChild(wrap);
    update();
  }

  /** Small count bubble on a page's icon (e.g. running autoclickers); 0 hides it. */
  const badges = {
    clickers: () => CA.Autoclickers.activeCount(),
  };

  function update() {
    if (!wrap) return;
    const open = CA.UI.Menu.isOpen();
    const current = CA.Settings.get('tab');
    wrap.querySelectorAll('[data-tab-item]').forEach((item) => {
      const id = item.dataset.tabItem;
      item.classList.toggle('selected', open && current === id);
      const n = badges[id] ? badges[id]() : 0;
      const badge = item.querySelector('.ca-tab-badge');
      badge.textContent = n ? String(n) : '';
      item.classList.toggle('active', n > 0);
    });
  }

  function init() {
    create();
    place();
    addEventListener('resize', place);
    setInterval(place, PLACE_MS);
    CA.Events.on('clickers', update);
    CA.Events.on('settings', update);
  }

  return { init, update, place };
})();
