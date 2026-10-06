// Registry of CookieMgr pages (one sidebar entry each). A page is
//   { id, label, icon, order, group, html(), mount(root), unmount(), tick() }
// `group` ('data' | 'minigames' | 'custom') puts a small gap in the sidebar between kinds of page.
// html() returns the page markup; mount/unmount/tick are optional lifecycle hooks for pages
// with live parts (charts, logs). The panel (ui/menu.js) and the sidebar (ui/tab.js) both read
// this list, so adding a page is just one register() call from the page's own module.

CA.UI = CA.UI || {};

CA.UI.Pages = (() => {
  const pages = [];
  const noop = () => {};

  function register(page) {
    if (pages.some((p) => p.id === page.id)) throw new Error(`Page "${page.id}" already registered`);
    pages.push({ order: 100, icon: '', mount: noop, unmount: noop, tick: noop, ...page });
    pages.sort((a, b) => a.order - b.order);
  }

  const list = () => pages.slice();
  const get = (id) => pages.find((p) => p.id === id) || null;

  return { register, list, get };
})();
