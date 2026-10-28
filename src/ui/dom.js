// Small DOM helpers every page uses.
//
//   morph(target, html)   makes target's children match html, keeping every node that's still the
//                         same kind — only text and attributes change — so hover states, focus and
//                         open popups survive a refresh (live numbers re-rendered every half second);
//                         a node marked data-keep is left exactly as it is (a chart's canvas)
//   replay(el, cls, ms)   restarts a one-off animation class (a shake, a flash); with ms, removes it after
//   armed(btn)            two-click buttons for destructive things: the first click arms (and relabels)
//                         the button for a few seconds, the second returns true
//   rect(el)              el's box on screen, whichever way the browser does CSS zoom (a widget's text size)
//   pointIn(el, e)        where the mouse is over el, in el's own CSS px (a canvas's drawing px): { x, y }

CA.UI = CA.UI || {};

CA.UI.Dom = (() => {
  const TRANSIENT = ['ca-shake', 'ca-holding']; // classes a refresh leaves alone

  function morph(target, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    morphChildren(target, tpl.content);
  }
  function morphChildren(target, source) {
    const a = target.childNodes;
    const b = source.childNodes;
    for (let i = 0; i < b.length; i++) {
      const want = b[i];
      const have = a[i];
      if (!have) {
        target.appendChild(want.cloneNode(true));
        continue;
      }
      if (have.nodeType !== want.nodeType || have.nodeName !== want.nodeName) {
        target.replaceChild(want.cloneNode(true), have);
        continue;
      }
      if (want.nodeType === 3) {
        if (have.nodeValue !== want.nodeValue) have.nodeValue = want.nodeValue;
        continue;
      }
      if (want.nodeType !== 1) continue;
      if (have.hasAttribute('data-keep')) continue; // drawn by its own code: not ours to patch
      for (const attr of [...have.attributes]) if (!want.hasAttribute(attr.name)) have.removeAttribute(attr.name);
      for (const attr of [...want.attributes]) {
        let v = attr.value;
        // keep feedback a click added (a shake) until its own timer takes it away
        if (attr.name === 'class') TRANSIENT.forEach((c) => have.classList.contains(c) && !want.classList.contains(c) && (v += ` ${c}`));
        if (have.getAttribute(attr.name) !== v) have.setAttribute(attr.name, v);
      }
      morphChildren(have, want);
    }
    while (a.length > b.length) target.removeChild(target.lastChild);
  }

  function replay(el, cls, ms) {
    if (!el || !el.classList) return;
    el.classList.remove(cls);
    void el.offsetWidth; // restart the animation
    el.classList.add(cls);
    if (ms) setTimeout(() => el.classList.remove(cls), ms);
  }

  function armed(btn) {
    if (btn.dataset.armed) {
      clearTimeout(Number(btn.dataset.armed));
      delete btn.dataset.armed;
      btn.innerHTML = btn.dataset.idleHtml;
      btn.classList.remove('ca-armed');
      return true;
    }
    btn.dataset.idleHtml = btn.innerHTML;
    btn.textContent = btn.dataset.armLabel;
    btn.classList.add('ca-armed');
    btn.dataset.armed = String(
      setTimeout(() => {
        if (!btn.dataset.armed) return;
        delete btn.dataset.armed;
        btn.innerHTML = btn.dataset.idleHtml;
        btn.classList.remove('ca-armed');
      }, 4000)
    );
    return false;
  }

  // A widget's text size is CSS zoom. Browsers that follow the standard (Chrome 128+, Firefox) give
  // getBoundingClientRect() on screen; older ones (Safari, Chrome before 128) give it in the zoomed
  // element's own px — divided by the zoom — while the mouse's clientX stays on screen, so a chart's hover
  // line drifted: left of the pointer at text sizes under 100%, right of it above.
  let legacyZoom = null;
  function isLegacyZoom() {
    if (legacyZoom === null) {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:-100px;top:0;width:10px;height:1px;visibility:hidden;zoom:2';
      document.body.appendChild(d);
      const w = d.getBoundingClientRect().width;
      d.remove();
      legacyZoom = w > 0 && w < 15; // 20 on screen; 0 without layout (tests)
    }
    return legacyZoom;
  }
  /** The CSS zoom el is drawn at (its own and its ancestors', multiplied). */
  function zoomOf(el) {
    let z = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const v = parseFloat(getComputedStyle(n).zoom);
      if (v > 0) z *= v;
    }
    return z;
  }
  function rect(el) {
    const r = el.getBoundingClientRect();
    const z = isLegacyZoom() ? zoomOf(el) : 1;
    if (z === 1) return r;
    return { left: r.left * z, top: r.top * z, right: r.right * z, bottom: r.bottom * z, width: r.width * z, height: r.height * z };
  }
  /** { x, y } over el in its own px (zoom and any transform scale taken out), plus kx/ky: on-screen px per own px. */
  function pointIn(el, e) {
    const r = rect(el);
    const kx = el.clientWidth ? r.width / el.clientWidth || 1 : 1;
    const ky = el.clientHeight ? r.height / el.clientHeight || 1 : 1;
    return { x: (e.clientX - r.left) / kx, y: (e.clientY - r.top) / ky, kx, ky, r };
  }

  return { morph, replay, armed, rect, pointIn };
})();
