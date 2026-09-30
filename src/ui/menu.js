// The CookieMgr panel. It lives in the game's own menu slot (the same place as
// Options / Stats / Info), so it inherits the game's look and closes like any other menu.

CA.UI = CA.UI || {};

CA.UI.Menu = (() => {
  const C = CA.UI.C;
  const isOpen = () => typeof Game !== 'undefined' && Game.onMenu === CA.MENU_ID;

  function toggle() {
    Game.ShowMenu(CA.MENU_ID); // ShowMenu closes the menu if it is already the open one
  }
  function open() {
    if (!isOpen()) Game.ShowMenu(CA.MENU_ID);
  }
  function close() {
    if (isOpen()) Game.ShowMenu(CA.MENU_ID);
  }

  // ---- rendering ---------------------------------------------------------------

  function clickerRow(def) {
    return (
      `<div class="ca-row" data-clicker="${def.id}">` +
      C.icon(def) +
      `<div class="ca-row-text"><div class="ca-row-name">${C.esc(def.name)}</div><div class="ca-row-desc">${C.esc(def.desc)}</div></div>` +
      '<div class="ca-controls">' +
      C.hotkey(`clicker.${def.id}`) +
      C.toggle(false, `data-ca="clicker" data-id="${def.id}"`, def.name) +
      '</div>' +
      '</div>'
    );
  }

  function optionRow(def) {
    return (
      `<div class="ca-row ca-row-option" data-option="${def.key}">` +
      `<div class="ca-row-text"><div class="ca-row-name">${C.esc(def.name)}</div><div class="ca-row-desc">${C.esc(def.desc)}</div></div>` +
      C.toggle(false, `data-ca="option" data-key="${def.key}"`, def.name) +
      '</div>'
    );
  }

  function html() {
    const clickers = CA.Autoclickers.list();
    return (
      '<div class="close menuClose" data-ca="close">x</div>' +
      '<div id="CookieMgrMenu">' +
      '<div class="section">CookieMgr</div>' +
      `<div class="ca-tagline">v${CA.VERSION} &middot; automation &amp; insights for your bakery</div>` +
      // --- Autoclickers ---
      '<div class="ca-card">' +
      '<div class="ca-card-head">' +
      '<div class="ca-card-title">Autoclickers</div>' +
      '<div class="ca-card-meta"><span class="ca-pill" data-ca-count></span></div>' +
      '</div>' +
      '<div class="ca-row ca-row-master">' +
      C.icon({ icon: CA.ICON }) +
      '<div class="ca-row-text"><div class="ca-row-name">All autoclickers</div>' +
      '<div class="ca-row-desc">The hotkey turns everything on &mdash; or off, if everything is already running.</div></div>' +
      '<div class="ca-controls">' +
      C.button('All on', 'data-ca="all-on"', 'ca-btn-on') +
      C.button('All off', 'data-ca="all-off"', 'ca-btn-off') +
      C.hotkey('clickers.toggleAll') +
      '</div>' +
      '</div>' +
      `<div class="ca-list">${clickers.map(clickerRow).join('')}</div>` +
      '</div>' +
      // --- Settings ---
      '<div class="ca-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Settings</div></div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('autoclickers').map(optionRow).join('')}` +
      '<div class="ca-row ca-row-option">' +
      '<div class="ca-row-text"><div class="ca-row-name">Open / close this panel</div>' +
      '<div class="ca-row-desc">Optional hotkey for the CookieMgr panel.</div></div>' +
      C.hotkey('panel.toggle') +
      '</div>' +
      '</div>' +
      '</div>' +
      // --- Footer ---
      '<div class="ca-footer">' +
      '<div><b>Hotkeys:</b> click a key, then press the new one. <kbd>Esc</kbd> cancels, <kbd>Backspace</kbd> removes it. Modifiers (Shift, Ctrl, Alt) work too.</div>' +
      '<div>Settings are stored inside your Cookie Clicker save.</div>' +
      `<div class="ca-footer-actions">${C.button('Reset hotkeys to defaults', 'data-ca="reset-hotkeys"', 'ca-btn-small')}</div>` +
      '</div>' +
      '</div>'
    );
  }

  function render() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    menu.innerHTML = html();
    sync();
  }

  /** Updates the dynamic bits of an already rendered panel (no re-render, keeps scroll). */
  function sync() {
    const root = document.getElementById('CookieMgrMenu');
    if (!root) return;

    CA.Autoclickers.list().forEach((def) => {
      const on = CA.Autoclickers.isOn(def.id);
      const row = root.querySelector(`[data-clicker="${def.id}"]`);
      if (!row) return;
      row.classList.toggle('on', on);
      setSwitch(row.querySelector('.ca-switch'), on);
    });

    const total = CA.Autoclickers.list().length;
    const active = CA.Autoclickers.activeCount();
    const pill = root.querySelector('[data-ca-count]');
    pill.textContent = `${active} / ${total} running`;
    pill.classList.toggle('on', active > 0);
    root.querySelector('[data-ca="all-on"]').disabled = active === total;
    root.querySelector('[data-ca="all-off"]').disabled = active === 0;

    root.querySelectorAll('[data-option]').forEach((row) => {
      setSwitch(row.querySelector('.ca-switch'), !!CA.Settings.get(row.dataset.option));
    });

    const capturing = CA.Hotkeys.capturing();
    root.querySelectorAll('[data-hotkey]').forEach((wrap) => {
      const id = wrap.dataset.hotkey;
      const combo = CA.Settings.getHotkey(id);
      const key = wrap.querySelector('.ca-key');
      const isCapturing = capturing === id;
      wrap.classList.toggle('capturing', isCapturing);
      wrap.classList.toggle('unset', !combo && !isCapturing);
      key.textContent = isCapturing ? 'Press a key…' : combo ? CA.Hotkeys.format(combo) : 'Set key';
    });
  }

  function setSwitch(btn, on) {
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', String(on));
  }

  // ---- interaction ---------------------------------------------------------------

  function onClick(e) {
    if (!isOpen()) return;
    const t = e.target.closest('[data-ca]');
    if (!t) {
      CA.Hotkeys.cancelCapture();
      return;
    }
    const kind = t.getAttribute('data-ca');
    if (kind !== 'bind') CA.Hotkeys.cancelCapture();
    // Don't leave buttons focused: a later Space/Enter would "click" them again.
    if (t.blur) t.blur();

    switch (kind) {
      case 'close':
        Game.ShowMenu();
        break;
      case 'clicker': {
        const id = t.dataset.id;
        CA.Util.sound(CA.Autoclickers.isOn(id) ? 'snd/clickOff2.mp3' : 'snd/clickOn2.mp3');
        CA.Autoclickers.toggle(id);
        break;
      }
      case 'all-on':
        CA.Util.sound('snd/clickOn2.mp3');
        CA.Autoclickers.setAll(true);
        break;
      case 'all-off':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.Autoclickers.setAll(false);
        break;
      case 'option': {
        const key = t.dataset.key;
        const next = !CA.Settings.get(key);
        CA.Util.sound(next ? 'snd/clickOn2.mp3' : 'snd/clickOff2.mp3');
        CA.Settings.set(key, next);
        break;
      }
      case 'bind': {
        const id = t.dataset.action;
        CA.Util.sound('snd/tick.mp3');
        if (CA.Hotkeys.capturing() === id) CA.Hotkeys.cancelCapture();
        else CA.Hotkeys.startCapture(id, onBound);
        break;
      }
      case 'unbind':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.setHotkey(t.dataset.action, '');
        break;
      case 'reset-hotkeys':
        CA.Util.sound('snd/tick.mp3');
        CA.Settings.resetHotkeys();
        CA.Util.notify('CookieMgr', 'Hotkeys reset to defaults.', CA.ICON, 2);
        break;
      default:
    }
  }

  function onBound(combo, displaced) {
    CA.Util.sound('snd/tick.mp3');
    if (combo && displaced.length) {
      const names = displaced.map((id) => (CA.Actions.get(id) || { name: id }).name).join(', ');
      CA.Util.notify('Hotkey moved', `<b>${CA.Hotkeys.format(combo)}</b> was removed from: ${C.esc(names)}`, CA.ICON, 3);
    }
  }

  // ---- wiring ----------------------------------------------------------------------

  function init() {
    CA.Actions.register({ id: 'panel.toggle', name: 'Open / close panel', group: 'general', defaultKey: '', run: toggle });

    // Game.resPath points at wherever the game serves its images from (CDN on the web, local on Steam).
    CA.Util.injectCss('CookieMgrStyles', CA.CSS.replace(/url\(img\//g, `url(${CA.Util.res('img/')}`));

    // Draw our panel when the game asks the menu to redraw while it's ours.
    CA.Util.wrap(Game, 'UpdateMenu', (original, args, self) => {
      if (isOpen()) {
        render();
        return undefined;
      }
      return original.apply(self, args);
    });

    // Keep the tab highlight in sync, and stop listening for keys when leaving.
    CA.Util.wrap(Game, 'ShowMenu', (original, args, self) => {
      const result = original.apply(self, args);
      if (!isOpen()) CA.Hotkeys.cancelCapture();
      CA.UI.Tab.update();
      return result;
    });

    const menu = document.getElementById('menu');
    if (menu) menu.addEventListener('click', onClick);

    const refresh = () => {
      if (isOpen()) sync();
    };
    CA.Events.on('clickers', refresh);
    CA.Events.on('settings', refresh);
    CA.Events.on('hotkeys', refresh);
  }

  return { init, open, close, toggle, isOpen, render, sync };
})();
