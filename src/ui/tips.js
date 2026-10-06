// Hover popups, drawn in one floating layer on top of everything (#CookieMgrLayer, a child of
// <body>), so the game's panels and beams never cover them and card edges never clip them.
//
//   simple tips   anything with data-tip="…" inside CookieMgr's elements: a small styled tip next
//                 to it (CookieMgr never emits title="…" — the browser's own tooltips; one that
//                 slips through is converted on hover). data-tip-live="key" takes its text from
//                 provide(key, fn(el)) instead, worked out while it shows (live numbers)
//   rich popups   an element marked data-pop keeps its popup as a hidden child (.ca-gpop /
//                 .ca-wpop / .ca-orb-pop); on hover a copy of it is shown in the layer, refreshed
//                 while the mouse stays (the content behind it updates live)
//   chart tips    plots put their hover box in the layer too (float())

CA.UI = CA.UI || {};

CA.UI.Tips = (() => {
  const ROOTS = '#CookieMgrMenu, #CookieMgrWidgets, #CookieMgrTab, #cm-bank-toolbar, #cm-grimoire-toolbar, #CookieMgrStoreBar, .cm-stockbadge';
  const POPS = ':scope > .ca-gpop, :scope > .ca-wpop, :scope > .ca-orb-pop';
  const REFRESH_MS = 400;
  let layer = null;
  let tip = null;
  let box = null;
  let current = null; // element whose tip / popup is showing
  let timer = null;
  const providers = {};

  /** Live tip text for elements marked data-tip-live="key": fn(el) → text. */
  const provide = (key, fn) => (providers[key] = fn);
  function textOf(el) {
    const live = el.dataset.tipLive;
    if (live && providers[live]) {
      try {
        return String(providers[live](el) || '');
      } catch (e) {
        return '';
      }
    }
    return el.dataset.tip || '';
  }

  /** The floating layer (created on first use). */
  function getLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div');
    layer.id = 'CookieMgrLayer';
    document.body.appendChild(layer);
    return layer;
  }

  /** A new element in the layer, for a component that positions it itself (chart tooltips). */
  function float(className) {
    const el = document.createElement('div');
    el.className = className;
    getLayer().appendChild(el);
    return el;
  }

  function place(el, target, below) {
    const r = target.getBoundingClientRect();
    const W = window.innerWidth || 1000;
    const H = window.innerHeight || 800;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(6, Math.min(W - w - 6, left));
    let top = below ? r.bottom + 8 : r.top - h - 8;
    if (below && top + h > H - 6) top = r.top - h - 8;
    if (!below && top < 6) top = r.bottom + 8;
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(Math.max(6, Math.min(H - h - 6, top)))}px`;
  }

  function showTip(target) {
    const text = textOf(target);
    if (!text) return hide();
    if (!tip || !tip.isConnected) tip = float('ca-simple-tip');
    tip.id = 'CookieMgrTip';
    if (tip.textContent !== text) {
      tip.textContent = text;
      tip.style.display = 'block';
      place(tip, target, true);
    } else tip.style.display = 'block';
  }

  function popOf(target) {
    return target.querySelector(POPS);
  }

  function showPop(target) {
    const src = popOf(target);
    if (!src) return hide();
    if (!box || !box.isConnected) box = float('ca-float');
    box.innerHTML = src.outerHTML;
    // a widget's text size (its --wfs zoom) applied to its popups too, out here in the layer
    const w = target.closest('[data-widget]');
    const size = w && w.style.getPropertyValue('--wfs');
    box.style.zoom = size && (src.classList.contains('ca-wt') || target.closest('.ca-wt')) ? size : '';
    box.style.display = 'block';
    place(box, target, false);
  }

  function hide() {
    if (tip) tip.style.display = 'none';
    if (box) box.style.display = 'none';
    current = null;
    clearInterval(timer);
    timer = null;
  }

  function onOver(e) {
    const t = e.target && e.target.closest ? e.target : null;
    const pop = t && t.closest('[data-pop]');
    if (pop && pop.closest(ROOTS)) {
      if (pop === current) return;
      hide();
      current = pop;
      showPop(pop);
      // the popup's source re-renders live (garden ticks, magic…): keep the copy current
      timer = setInterval(() => (current && current.isConnected ? showPop(current) : hide()), REFRESH_MS);
      return;
    }
    const target = t && t.closest('[title], [data-tip], [data-tip-live]');
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
    if (target === current) return;
    hide();
    if (!textOf(target)) return;
    if (!target.hasAttribute('aria-label')) target.setAttribute('aria-label', textOf(target));
    current = target;
    if (tip) tip.textContent = '';
    showTip(target);
    // its text can change while it shows (a live number, a re-render): keep it current
    timer = setInterval(() => (current && current.isConnected ? showTip(current) : hide()), REFRESH_MS);
  }

  function init() {
    getLayer();
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mousedown', hide, true);
    addEventListener('scroll', hide, true);
  }

  return { init, hide, float, provide, layer: getLayer };
})();
