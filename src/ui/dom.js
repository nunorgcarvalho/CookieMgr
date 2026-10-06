// Small DOM helpers every page uses.
//
//   morph(target, html)   makes target's children match html, keeping every node that's still the
//                         same kind — only text and attributes change — so hover states, focus and
//                         open popups survive a refresh (live numbers re-rendered every half second)
//   replay(el, cls, ms)   restarts a one-off animation class (a shake, a flash); with ms, removes it after
//   armed(btn)            two-click buttons for destructive things: the first click arms (and relabels)
//                         the button for a few seconds, the second returns true

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

  return { morph, replay, armed };
})();
