// Styled hover tips instead of the browser's native `title` tooltips, for everything CookieMgr
// draws (the panel, widgets, sidebar, store switch, the toolbars inside minigames).
//
// Markup keeps using `title="…"` (simple, and screen readers get it). On the first hover the
// attribute moves to data-tip, so the browser never shows its own tooltip, and a small popup in
// the panel's style appears next to the element instead.

CA.UI = CA.UI || {};

CA.UI.Tips = (() => {
  const ROOTS = '#CookieMgrMenu, #CookieMgrWidgets, #CookieMgrTab, #CookieMgrStoreSwitch, #cm-bank-toolbar, #cm-grimoire-toolbar, #CookieMgrStoreBar';
  let tip = null;
  let current = null;

  function el() {
    if (tip && tip.isConnected) return tip;
    tip = document.createElement('div');
    tip.id = 'CookieMgrTip';
    document.body.appendChild(tip);
    return tip;
  }

  function show(target) {
    const text = target.dataset.tip;
    if (!text) return hide();
    const t = el();
    t.textContent = text;
    t.style.display = 'block';
    const r = target.getBoundingClientRect();
    const W = window.innerWidth || 1000;
    const H = window.innerHeight || 800;
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(6, Math.min(W - tw - 6, left));
    let top = r.bottom + 8;
    if (top + th > H - 6) top = r.top - th - 8;
    t.style.left = `${Math.round(left)}px`;
    t.style.top = `${Math.round(Math.max(6, top))}px`;
    current = target;
  }

  function hide() {
    if (tip) tip.style.display = 'none';
    current = null;
  }

  function onOver(e) {
    const target = e.target && e.target.closest ? e.target.closest('[title], [data-tip]') : null;
    if (!target || !target.closest(ROOTS)) {
      if (current) hide();
      return;
    }
    if (target.hasAttribute('title')) {
      const text = target.getAttribute('title');
      target.removeAttribute('title');
      if (text) {
        target.dataset.tip = text;
        if (!target.hasAttribute('aria-label')) target.setAttribute('aria-label', text);
      }
    }
    if (target !== current) show(target);
  }

  function init() {
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mousedown', hide, true);
    addEventListener('scroll', hide, true);
  }

  return { init, hide };
})();
