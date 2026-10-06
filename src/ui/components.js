// HTML snippets for the CookieMgr panel. Everything is plain strings; interactivity
// is handled by one delegated click listener in menu.js via data-ca="…" attributes.

CA.UI = CA.UI || {};

CA.UI.C = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);

  /** Picture for a clicker/action: a standalone image, or a sprite from img/icons.png. */
  function icon({ img, icon, sheet }) {
    // a 48px cell of another sprite sheet (e.g. img/gardenPlants.png)
    if (sheet) {
      const [x, y] = icon || [0, 0];
      return `<span class="ca-icon"><span class="ca-sprite" style="background-image:url(${CA.Util.res(sheet)});background-position:${-x * 48}px ${-y * 48}px"></span></span>`;
    }
    if (img) return `<span class="ca-icon"><span class="ca-img" style="background-image:url(${CA.Util.res(img)})"></span></span>`;
    const [x, y] = icon || CA.ICON;
    return `<span class="ca-icon"><span class="ca-sprite" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-x * 48}px ${-y * 48}px"></span></span>`;
  }

  /** On/off switch. `attrs` is extra attribute text (data-ca etc.). */
  function toggle(on, attrs, label) {
    return (
      `<button type="button" class="ca-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label || '')}" ${attrs}>` +
      '<span class="ca-switch-track"><span class="ca-switch-knob"></span></span>' +
      '</button>'
    );
  }

  /** Hotkey chip: click to rebind, small × to clear. */
  function hotkey(actionId) {
    return (
      `<span class="ca-hotkey" data-hotkey="${esc(actionId)}">` +
      `<button type="button" class="ca-key" data-ca="bind" data-action="${esc(actionId)}" data-tip="Click, then press a key to rebind"></button>` +
      `<button type="button" class="ca-key-clear" data-ca="unbind" data-action="${esc(actionId)}" data-tip="Remove hotkey">&times;</button>` +
      '</span>'
    );
  }

  function button(label, attrs, extraClass = '') {
    return `<button type="button" class="ca-btn ${extraClass}" ${attrs}>${label}</button>`;
  }

  /** Card header: optional leading icon (from ui/icons.js), title, optional right-hand `meta` HTML. */
  function cardHead(title, iconName, meta = '') {
    const ico = iconName ? CA.UI.Icons.html(iconName, 15, 'ca-card-ico') : '';
    return `<div class="ca-card-head"><div class="ca-card-title">${ico}${title}</div>${meta}</div>`;
  }

  /** A link to another CookieMgr page (menu.js handles data-ca="goto"). */
  const link = (label, page) => `<a class="ca-link" data-ca="goto" data-page="${esc(page)}" role="link" tabindex="0">${label}</a>`;

  /** A small "open it in the game" button for a minigame page (closes the panel). */
  const gameLink = (building, label = 'Open in game') =>
    `<button type="button" class="ca-btn ca-btn-small ca-btn-game" data-ca="open-mg" data-building="${esc(building)}">${CA.UI.Icons.html('open', 12)} ${label}</button>`;

  return { icon, toggle, hotkey, button, cardHead, esc, link, gameLink };
})();
