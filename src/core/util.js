// Small helpers shared by every module.

CA.ID = 'CookieMgr';
CA.MENU_ID = 'cookiemgr';
CA.ICON = [10, 14]; // default notification icon (golden cookie)

CA.Util = {
  /** document.getElementById shorthand (the game has `l()` too, but keep ours self-contained). */
  $(id) {
    return document.getElementById(id);
  },

  /** Resolves a game asset path such as 'img/icons.png' the same way the game does. */
  res(path) {
    const base = typeof Game !== 'undefined' && Game.resPath ? Game.resPath : '';
    return base + path;
  },

  /** Whether you own upgrade `name` (false before the game is ready). */
  has(name) {
    return typeof Game !== 'undefined' && typeof Game.Has === 'function' && !!Game.Has(name);
  },

  /** A building's minigame once it's open (Farm, Bank, Temple, Wizard tower), else null. */
  minigame(building) {
    const b = typeof Game !== 'undefined' && Game.Objects && Game.Objects[building];
    return (b && b.minigame) || null;
  },

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  },

  /** Plays one of the game's built-in sounds, e.g. 'snd/tick.mp3'. Never throws. */
  sound(name) {
    try {
      if (typeof PlaySound === 'function') PlaySound(name);
    } catch (e) {
      /* ignore */
    }
  },

  /**
   * Game notification (bottom of the screen).
   * @param {string} title
   * @param {string} desc   HTML allowed
   * @param {number[]} icon [x, y] on img/icons.png
   * @param {number} quick  seconds-ish before auto-dismiss (game caps at 6)
   */
  notify(title, desc, icon, quick = 2) {
    try {
      // the game shows the title as HTML: titles are plain text (macro names…), so escape them; desc may hold markup
      Game.Notify(CA.Util.escapeHtml(String(title)), desc || '', icon || CA.ICON, quick, 1);
    } catch (e) {
      console.log(`[CookieMgr] ${title}: ${desc}`);
    }
  },

  injectCss(id, css) {
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.textContent = css;
  },

  /** Replaces obj[name] with a wrapper; `wrapper(original, args, thisArg)` decides what to call. */
  wrap(obj, name, wrapper) {
    const original = obj[name];
    if (typeof original !== 'function') return false;
    obj[name] = function (...args) {
      return wrapper(original, args, this);
    };
    obj[name].caOriginal = original;
    return true;
  },

  log(...args) {
    console.log('[CookieMgr]', ...args);
  },

  /** Widest rendered width among `texts` in the given canvas font (0 if ctx/texts is empty). */
  maxTextWidth(ctx, font, texts) {
    const prevFont = ctx.font;
    ctx.font = font;
    let max = 0;
    texts.forEach((t) => {
      const w = ctx.measureText(t).width;
      if (w > max) max = w;
    });
    ctx.font = prevFont;
    return max;
  },

  /**
   * Scrolls `el` into view inside its own scroll area only (the CookieMgr panel, the middle
   * panel's building list…). Element.scrollIntoView also scrolls every ancestor — including the
   * game's overflow-hidden containers, which you then can't scroll back: the whole screen shifts.
   * block: 'start' | 'nearest'.
   */
  scrollInPanel(el, block = 'nearest', offset = 8) {
    if (!el || !el.getBoundingClientRect) return;
    let box = el.parentElement;
    while (box && box !== document.body && box !== document.documentElement) {
      const oy = getComputedStyle(box).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && box.scrollHeight > box.clientHeight) break;
      box = box.parentElement;
    }
    if (!box || box === document.body || box === document.documentElement) return;
    const r = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    let top = box.scrollTop;
    if (block === 'start') top += r.top - b.top - offset;
    else if (r.top < b.top) top += r.top - b.top - offset;
    else if (r.bottom > b.bottom) top += Math.min(r.bottom - b.bottom + offset, r.top - b.top - offset);
    else return;
    top = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, top));
    if (typeof box.scrollTo === 'function') box.scrollTo({ top, behavior: 'smooth' });
    else box.scrollTop = top;
  },

  /**
   * Puts the game's fixed containers back at scroll 0. They're overflow: hidden, so if anything
   * (a focus, an old scrollIntoView) ever scrolls them, the screen stays shifted with no way to
   * scroll back. Runs every couple of seconds; does nothing when nothing moved.
   */
  unshift() {
    // only what the game keeps from scrolling (overflow hidden): the store (#sectionRight) and the
    // menu scroll on purpose, and must keep their place
    const fixed = (el, axis) => {
      try {
        const cs = getComputedStyle(el);
        return (cs[axis] || cs.overflow || '').startsWith('hidden');
      } catch (e) {
        return false;
      }
    };
    ['game', 'sectionLeft', 'sectionMiddle', 'sectionRight', 'wrapper']
      .map((id) => document.getElementById(id))
      .concat([document.documentElement, document.body])
      .forEach((el) => {
        if (!el) return;
        if (el.scrollTop && fixed(el, 'overflowY')) el.scrollTop = 0;
        if (el.scrollLeft && fixed(el, 'overflowX')) el.scrollLeft = 0;
      });
  },
};
