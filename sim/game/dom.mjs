// A page with no screen: a document whose elements accept anything — properties, styles, children,
// canvases, listeners — and draw nothing. The game builds its whole interface into it and never
// knows. Two things are real: a <script src> added to the page is run (that's how the game loads its
// minigames), and an element keeps what's set on it (the game reads some of it back).

/**
 * `onScript(src, el)` runs a script added to the page; return true when it ran (its onload is
 * called then), false to report an error (its onerror).
 */
export function makeDom({ onScript = () => false } = {}) {
  const PRIM = Symbol.toPrimitive;
  /** Anything: every property is another sink (kept, so what's set stays set), every call returns one. */
  function sink(extra) {
    const target = function () {};
    if (extra) Object.assign(target, extra);
    return new Proxy(target, {
      get(t, p) {
        if (p === PRIM) return (hint) => (hint === 'number' ? 0 : '');
        if (p === 'then' || p === 'toJSON') return undefined; // not a promise; JSON as nothing
        if (p === 'valueOf') return () => 0;
        if (p === 'toString') return () => '';
        if (p === Symbol.iterator) return function* () {};
        if (typeof p === 'symbol') return undefined;
        if (Object.prototype.hasOwnProperty.call(t, p)) return t[p];
        const child = sink();
        t[p] = child;
        return child;
      },
      set(t, p, v) {
        t[p] = v;
        return true;
      },
      apply: () => sink(),
      construct: () => sink(),
      has: () => true,
    });
  }

  const byId = new Map();
  function element(tag, id) {
    const attrs = {};
    const kids = [];
    // the page's own children are unknown: one that isn't there yet is a blank element
    const kidsView = new Proxy(kids, { get: (t, p) => (typeof p === 'string' && /^\d+$/.test(p) && !(p in t) ? element('div') : t[p]) });
    const classes = new Set();
    let el = null;
    const self = {
      tagName: String(tag || 'div').toUpperCase(),
      nodeName: String(tag || 'div').toUpperCase(),
      id: id || '',
      children: kidsView,
      childNodes: kidsView,
      innerHTML: '',
      textContent: '',
      value: '',
      checked: false,
      offsetWidth: 0,
      offsetHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
      scrollTop: 0,
      scrollLeft: 0,
      width: 0,
      height: 0,
      setAttribute(k, v) {
        attrs[k] = String(v);
        if (k === 'id') self.id = String(v);
        if (k === 'src') el.src = String(v);
      },
      getAttribute: (k) => (k in attrs ? attrs[k] : null),
      removeAttribute: (k) => delete attrs[k],
      hasAttribute: (k) => k in attrs,
      appendChild(c) {
        kids.push(c);
        if (c && typeof c === 'function') c.parentNode = el;
        if (c && String(c.tagName).toUpperCase() === 'SCRIPT' && c.src) {
          let ok = false;
          try {
            ok = onScript(String(c.src), c);
          } catch (e) {
            console.error('[sim] a script failed:', c.src, e && e.stack ? e.stack.split('\n').slice(0, 5).join('\n') : e);
            ok = false;
          }
          const cb = ok ? c.onload : c.onerror;
          if (typeof cb === 'function' && !cb.__isSink) cb.call(c);
        }
        if (c && c.id && typeof c.id === 'string') byId.set(c.id, c);
        return c;
      },
      insertBefore(c) {
        return self.appendChild(c);
      },
      removeChild(c) {
        const i = kids.indexOf(c);
        if (i >= 0) kids.splice(i, 1);
        return c;
      },
      remove() {},
      cloneNode: () => element(tag),
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => true,
      focus() {},
      blur() {},
      click() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }),
      querySelector: () => element('div'),
      querySelectorAll: () => [],
      getElementsByTagName: () => [],
      getElementsByClassName: () => [],
      insertAdjacentHTML() {},
      classList: {
        add: (...c) => c.forEach((x) => classes.add(x)),
        remove: (...c) => c.forEach((x) => classes.delete(x)),
        contains: (c) => classes.has(c),
        toggle: (c, on) => ((on === undefined ? !classes.has(c) : on) ? (classes.add(c), true) : (classes.delete(c), false)),
      },
      getContext: () => sink(),
      toDataURL: () => '',
    };
    el = sink(self);
    return el;
  }

  const body = element('body', 'body');
  const head = element('head', 'head');
  const documentElement = element('html', 'html');
  const document = sink({
    body,
    head,
    documentElement,
    getElementById(id) {
      if (byId.has(id)) return byId.get(id);
      // the page's own elements are all there; a script tag is only there once it's been added (the
      // game checks for one before loading a minigame)
      if (/^minigameScript-/.test(id)) return null;
      byId.set(id, element('div', id));
      return byId.get(id);
    },
    createElement: (tag) => element(tag),
    createElementNS: (_ns, tag) => element(tag),
    createTextNode: () => element('#text'),
    createDocumentFragment: () => element('#fragment'),
    querySelector: () => element('div'),
    querySelectorAll: () => [],
    getElementsByTagName: (t) => (String(t).toLowerCase() === 'head' ? [head] : String(t).toLowerCase() === 'body' ? [body] : []),
    getElementsByClassName: () => [],
    addEventListener() {},
    removeEventListener() {},
    hasFocus: () => true,
    visibilityState: 'visible',
    hidden: false,
    cookie: '',
    title: '',
  });
  return { document, element, sink };
}
