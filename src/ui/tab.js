// The stack of little tabs that stick out of the left beam (between the cookie panel and the
// middle panel) — one per CookieMgr page, instead of one tab that opens a panel you then have to
// flip between pages inside. Clicking a tab jumps straight to that page, opening the panel if
// it's closed; clicking the page that's already showing closes the panel.

CA.UI = CA.UI || {};

CA.UI.Tab = (() => {
  let wrap = null;

  function go(id) {
    const wasOpen = CA.UI.Menu.isOpen();
    if (wasOpen && CA.Settings.get('tab') === id) {
      CA.UI.Menu.close();
      return;
    }
    CA.Settings.set('tab', id);
    if (wasOpen) CA.UI.Menu.render(); // already open on a different page — switch it directly
    else CA.UI.Menu.open(); // Game.ShowMenu triggers Game.UpdateMenu -> our render() for us
  }

  function flapHtml(t) {
    return (
      `<div class="ca-tab-flap" data-tab-flap="${t.id}" role="button" tabindex="0" title="${t.label}">` +
      `<span class="ca-tab-label">${t.label}</span>` +
      (t.id === 'clickers' ? '<span class="ca-tab-badge" aria-label="active autoclickers"></span>' : '') +
      '</div>'
    );
  }

  function create() {
    wrap = document.createElement('div');
    wrap.id = 'CookieMgrTab';
    wrap.innerHTML = CA.UI.Menu.TABS.map(flapHtml).join('');
    wrap.addEventListener('click', (e) => {
      const flap = e.target.closest('[data-tab-flap]');
      if (flap) go(flap.dataset.tabFlap);
    });
    wrap.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const flap = e.target.closest('[data-tab-flap]');
      if (flap) {
        e.preventDefault();
        go(flap.dataset.tabFlap);
      }
    });
    (document.getElementById('game') || document.body).appendChild(wrap);
    update();
  }

  function update() {
    if (!wrap) return;
    const open = CA.UI.Menu.isOpen();
    const current = CA.Settings.get('tab');
    wrap.querySelectorAll('[data-tab-flap]').forEach((flap) => {
      const id = flap.dataset.tabFlap;
      flap.classList.toggle('selected', open && current === id);
    });
    const n = CA.Autoclickers.activeCount();
    const badge = wrap.querySelector('[data-tab-flap="clickers"] .ca-tab-badge');
    if (badge) {
      badge.textContent = n ? String(n) : '';
      badge.closest('[data-tab-flap]').classList.toggle('active', n > 0);
    }
  }

  function init() {
    create();
    CA.Events.on('clickers', update);
    CA.Events.on('settings', update);
  }

  return { init, update };
})();
