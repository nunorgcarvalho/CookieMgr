// Registry of CookieMgr pages (one sidebar entry each). A page is
//   { id, label, icon, order, group, html(), mount(root), unmount(), tick(), parts }
// `group` ('data' | 'minigames' | 'custom') puts a small gap in the sidebar between kinds of page.
// html() returns the page markup; mount/unmount/tick are optional lifecycle hooks for pages
// with live parts (charts, logs) — or `parts: [a, b]`, objects with their own mount/unmount/tick,
// for a page made of several. The panel (ui/menu.js) and the sidebar (ui/tab.js) both read
// this list, so adding a page is just one register() call from the page's own module.
//
// scope(root) is what a page's mount() uses to set itself up: everything added through it —
// listeners, intervals, charts and other parts, unbind functions — is undone by close():
//
//   function mount(el) { life = CA.UI.Pages.scope(el); life.on('click', onClick); life.every(500, sync); life.child(plot); }
//   function unmount() { if (life) life.close(); life = null; }

CA.UI = CA.UI || {};

CA.UI.Pages = (() => {
  const pages = [];
  const noop = () => {};

  function register(page) {
    if (pages.some((p) => p.id === page.id)) throw new Error(`Page "${page.id}" already registered`);
    const parts = page.parts || [];
    const all = (k) => (root) => parts.forEach((p) => p[k](root));
    pages.push({ order: 100, icon: '', mount: parts.length ? all('mount') : noop, unmount: parts.length ? all('unmount') : noop, tick: parts.length ? all('tick') : noop, ...page });
    pages.sort((a, b) => a.order - b.order);
  }

  /** A page's mounted state: what it sets up through this, close() undoes (in reverse). */
  function scope(root) {
    let undo = [];
    const s = {
      root,
      on(type, fn, opts) {
        root.addEventListener(type, fn, opts);
        undo.push(() => root.removeEventListener(type, fn, opts));
        return s;
      },
      /** fn every ms, while the page is on screen. */
      every(ms, fn) {
        const t = setInterval(() => root.isConnected && fn(), ms);
        undo.push(() => clearInterval(t));
        return s;
      },
      /** A part with mount(root) / unmount() (a chart…), mounted now. */
      child(part) {
        part.mount(root);
        undo.push(() => part.unmount());
        return s;
      },
      /** Something else to undo (an unbind function). */
      add(off) {
        if (typeof off === 'function') undo.push(off);
        return s;
      },
      close() {
        const list = undo.reverse();
        undo = [];
        list.forEach((f) => {
          try {
            f();
          } catch (e) {
            console.error('[CookieMgr] page clean-up failed', e);
          }
        });
      },
    };
    return s;
  }

  const list = () => pages.slice();
  const get = (id) => pages.find((p) => p.id === id) || null;

  return { register, list, get, scope };
})();
