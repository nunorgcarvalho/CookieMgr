// The little tab that sticks out of the left beam (between the cookie panel and the
// middle panel). Clicking it opens/closes the CookieMgr panel.

CA.UI = CA.UI || {};

CA.UI.Tab = (() => {
  let el = null;

  function create() {
    el = document.createElement('div');
    el.id = 'CookieMgrTab';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.title = 'CookieMgr';
    el.innerHTML =
      '<span class="ca-tab-cookie"></span>' +
      '<span class="ca-tab-label">CookieMgr</span>' +
      '<span class="ca-tab-badge" aria-label="active autoclickers"></span>';
    el.addEventListener('click', () => CA.UI.Menu.toggle());
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        CA.UI.Menu.toggle();
      }
    });
    (document.getElementById('game') || document.body).appendChild(el);
    update();
  }

  function update() {
    if (!el) return;
    el.classList.toggle('selected', CA.UI.Menu.isOpen());
    const n = CA.Autoclickers.activeCount();
    const badge = el.querySelector('.ca-tab-badge');
    badge.textContent = n ? String(n) : '';
    el.classList.toggle('active', n > 0);
    el.title = n ? `CookieMgr — ${n} autoclicker${n === 1 ? '' : 's'} running` : 'CookieMgr';
  }

  function init() {
    create();
    CA.Events.on('clickers', update);
  }

  return { init, update };
})();
