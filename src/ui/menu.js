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

  /** Its own card, apart from the autoclicker row, so it isn't lost among other controls —
   *  selling everything is a bigger deal than flipping a toggle. The button's tip (what the
   *  hover shows) is filled in with a live cookie estimate on mouseenter; see wireSellAll(). */
  function sellAllCard() {
    return (
      '<div class="ca-card ca-card-danger">' +
      '<div class="ca-row ca-row-sellall">' +
      '<div class="ca-row-text"><div class="ca-row-name">Sell everything</div>' +
      '<div class="ca-row-desc">Sells every stock you hold right now and turns the autobuyer off first, ' +
      'so it doesn\'t just buy it all straight back. Also a macro, so it can have a hotkey.</div></div>' +
      C.button('Sell all', 'data-ca="sell-all-stocks" data-ca-sellall', 'ca-btn-danger ca-btn-lg') +
      '</div>' +
      '</div>'
    );
  }

  /** The small round icon at the start of every settings row. */
  const rowIcon = (name) => `<span class="ca-row-ico">${CA.UI.Icons.html(name || 'settings', 16)}</span>`;

  function optionRow(def) {
    return (
      `<div class="ca-row ca-row-option" data-option="${def.key}">` +
      rowIcon(def.icon) +
      `<div class="ca-row-text"><div class="ca-row-name">${C.esc(def.name)}</div><div class="ca-row-desc">${C.esc(def.desc)}</div></div>` +
      C.toggle(false, `data-ca="option" data-key="${def.key}"`, def.name) +
      '</div>'
    );
  }

  /** An option as a tile (icon, name, what it does, switch) — option cards lay these out in a grid. */
  function optionTile(def) {
    return (
      `<div class="ca-opt" data-option="${def.key}">` +
      `<span class="ca-opt-ico">${CA.UI.Icons.html(def.icon || 'settings', 15)}</span>` +
      `<div class="ca-opt-text"><b>${C.esc(def.name)}</b><span>${C.esc(def.desc)}</span></div>` +
      C.toggle(false, `data-ca="option" data-key="${def.key}"`, def.name) +
      '</div>'
    );
  }

  /** A compact on/off chip for an option (the All options index). */
  const optionChip = (def) =>
    `<button type="button" class="ca-chip ca-optchip" data-ca="option" data-key="${def.key}" data-pressed-key="${def.key}" data-tip="${C.esc(def.desc)}">${CA.UI.Icons.html(def.icon || 'settings', 12)} ${C.esc(def.name)}</button>`;

  // ---- pages ---------------------------------------------------------------------
  // The current page id is kept in the 'tab' setting (the name predates the page registry;
  // keeping it means existing saves still reopen on the page you last had open).

  const currentTab = () => {
    const t = CA.Settings.get('tab');
    if (CA.UI.Pages.get(t)) return t;
    const first = CA.UI.Pages.list()[0];
    return first ? first.id : 'clickers';
  };

  function stocksPage() {
    return (
      sellAllCard() +
      '<div class="ca-card">' +
      C.cardHead('Autobuyer', 'bolt', `<div class="ca-card-meta"><button type="button" class="ca-btn ca-btn-small" data-ca="open-macros">All macros</button>${C.gameLink('Bank')}</div>`) +
      `<div class="ca-list">${CA.UI.MacrosPage.row(CA.Macros.get('stockTrader'))}</div>` +
      '</div>' +
      optionsCard('Options', 'settings', 'stocks') +
      CA.UI.StockGraph.html() +
      CA.UI.StockPerf.html() +
      CA.UI.StockLog.html()
    );
  }

  const cardHead = C.cardHead;

  /** A page's options card: its options as a grid of tiles (nothing when the group has none). */
  function optionsCard(title, icon, group, extra = '') {
    const opts = CA.Settings.optionsIn(group).filter((d) => typeof d.default === 'boolean');
    if (!opts.length && !extra) return '';
    return `<div class="ca-card">${cardHead(title, icon)}<div class="ca-optgrid">${opts.map(optionTile).join('')}</div>${extra}</div>`;
  }

  // Where each page's options live (the All options index on the Settings page links to them).
  const OPTION_HOMES = [
    { page: 'events', label: 'Events', icon: 'events', group: 'events' },
    { page: 'graphs', label: 'Graphs', icon: 'graphs', group: 'graph' },
    { page: 'garden', label: 'Garden', icon: 'leaf', group: 'garden' },
    { page: 'stocks', label: 'Stock market', icon: 'stocks', group: 'stocks' },
    { page: 'wizard', label: 'Grimoire', icon: 'wizard', group: 'grimoire' },
    { page: 'clickers', label: 'Macros', icon: 'bolt', group: 'macros' },
    { page: 'widgets', label: 'Widgets', icon: 'widget', group: 'widgets' },
  ];

  /** Every option of every page, as quick on/off chips under a link to its page. */
  function indexCard() {
    const blocks = OPTION_HOMES.map((h) => {
      const opts = CA.Settings.optionsIn(h.group).filter((d) => typeof d.default === 'boolean');
      if (!opts.length) return '';
      return (
        '<div class="ca-index-block">' +
        `<div class="ca-index-head">${CA.UI.Icons.html(h.icon, 13)} ${C.link(h.label, h.page)}</div>` +
        `<div class="ca-index-chips">${opts.map(optionChip).join('')}</div>` +
        '</div>'
      );
    }).join('');
    return (
      '<div class="ca-card">' +
      cardHead('All options', 'filter', '<div class="ca-card-meta"><span class="ca-hint">each lives on its own page — click a title to go there</span></div>') +
      `<div class="ca-index">${blocks}</div>` +
      '</div>'
    );
  }

  /** At-a-glance tiles at the top of the Settings page. */
  function overviewCard() {
    const tile = CA.UI.Plot.fmt.tile;
    const cm = CA.CookieMonster.isLoaded();
    const running = CA.Macros.activeCount();
    const placed = CA.UI.Widgets.list().length;
    return (
      '<div class="ca-card ca-overview">' +
      `<div class="ca-overview-brand"><span class="ca-overview-logo">${C.icon({ icon: CA.ICON })}</span><div><b>CookieMgr</b><span>v${CA.VERSION}</span></div></div>` +
      '<div class="ca-stats">' +
      tile('Recording', CA.Settings.get('trackHistory') ? 'on' : 'off', '<span data-ca-history-short></span>') +
      tile('Macros running', String(running), C.link('Macros', 'clickers')) +
      tile('Widgets placed', String(placed), C.link('Widgets', 'widgets')) +
      tile('Cookie Monster', cm ? 'running' : 'not loaded', cm ? '' : 'needed for the store’s building sort') +
      '</div></div>'
    );
  }

  function settingsPage() {
    return (
      overviewCard() +
      '<div class="ca-card">' +
      cardHead('General', 'settings') +
      `<div class="ca-optgrid">${CA.Settings.optionsIn('general').map(optionTile).join('')}</div>` +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('panel') +
      '<div class="ca-row-text"><div class="ca-row-name">Open / close this panel</div>' +
      '<div class="ca-row-desc">Optional hotkey for the CookieMgr panel.</div></div>' +
      C.hotkey('panel.toggle') +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('keyboard') +
      '<div class="ca-row-text"><div class="ca-row-name">Hotkeys</div>' +
      '<div class="ca-row-desc">Click a key chip, then press the new key. <kbd>Esc</kbd> cancels, <kbd>Backspace</kbd> removes it; modifiers work too.</div></div>' +
      C.button('Reset to defaults', 'data-ca="reset-hotkeys"', 'ca-btn-small') +
      '</div>' +
      '</div>' +
      '</div>' +
      historyCard() +
      optionsCard('Store', 'dollar', 'store') +
      integrationsCard() +
      indexCard() +
      '<div class="ca-footer">' +
      `<div>CookieMgr v${CA.VERSION} &middot; <a href="https://github.com/nunorgcarvalho/CookieMgr" target="_blank" rel="noopener">GitHub</a></div>` +
      '<div>Settings are stored inside your Cookie Clicker save; recorded history stays in this browser.</div>' +
      '</div>'
    );
  }

  // ---- history data ---------------------------------------------------------------
  // Recorded history lives in this browser's IndexedDB, never in the game save (see
  // core/store.js), so this card is the way to move it between browsers or back it up.

  function historyCard() {
    return (
      '<div class="ca-card">' +
      cardHead('History data', 'timeline') +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('clock') +
      '<div class="ca-row-text"><div class="ca-row-name">Recorded for this save</div>' +
      '<div class="ca-row-desc" data-ca-history-info></div></div>' +
      '</div>' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('save') +
      '<div class="ca-row-text"><div class="ca-row-name">Back up or move</div>' +
      '<div class="ca-row-desc">Export saves everything recorded for this save to a file. Importing a file <b>replaces</b> what this save has recorded.</div></div>' +
      '<div class="ca-controls">' +
      C.button(`${CA.UI.Icons.html('download', 14)} Export`, 'data-ca="hexport"', 'ca-btn-small') +
      C.button(`${CA.UI.Icons.html('upload', 14)} Import`, 'data-ca="himport" data-arm-label="Replace history?"', 'ca-btn-small') +
      C.button(`${CA.UI.Icons.html('trash', 14)} Clear`, 'data-ca="gclear" data-arm-label="Erase everything?"', 'ca-btn-small ca-btn-off') +
      '<input type="file" accept=".json,application/json" data-ca-history-file hidden>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function duration(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 1) return `${Math.floor(ms / 1000)} s`;
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h} h ${m % 60} min`;
    return `${Math.floor(h / 24)} d ${h % 24} h`;
  }

  function historyInfo() {
    const r = CA.Recorder.summary();
    if (!r.ready) return 'Loading…';
    if (!r.frames) return 'Nothing recorded yet.';
    const tiers = r.perTier
      .filter((t) => t.frames)
      .map((t) => `${t.frames.toLocaleString()} × ${t.label}`)
      .join(', ');
    const ev = CA.EventLog.list().length;
    const fx = CA.History.intervals.length;
    return (
      `${duration(r.active)} of active play since ${new Date(r.first.t).toLocaleString()} — ` +
      `${tiers} frames, ${ev.toLocaleString()} event${ev === 1 ? '' : 's'}, ${fx.toLocaleString()} buff${fx === 1 ? '' : 's'}.`
    );
  }

  const armed = (btn) => CA.UI.Dom.armed(btn); // ui/dom.js

  function onHistoryFile(e) {
    const input = e.target;
    if (!input.matches || !input.matches('[data-ca-history-file]') || !input.files || !input.files[0]) return;
    const file = input.files[0];
    input.value = '';
    CA.Recorder.importFile(file)
      .then((n) => {
        CA.Util.notify('History imported', `${n.chunks} chunks and ${n.events} events from ${C.esc(file.name)}.`, CA.ICON, 3);
        sync();
      })
      .catch((err) => CA.Util.notify('Import failed', C.esc(err.message || String(err)), CA.ICON, 4));
  }

  function integrationsCard() {
    const loaded = CA.CookieMonster.isLoaded();
    return (
      '<div class="ca-card">' +
      cardHead('Integrations', 'plug') +
      '<div class="ca-list">' +
      '<div class="ca-row ca-row-option">' +
      rowIcon('puzzle') +
      '<div class="ca-row-text"><div class="ca-row-name">Cookie Monster</div>' +
      `<div class="ca-row-desc" data-ca-cm-status>${loaded ? 'Running.' : 'Not loaded.'} Loads the latest release straight from Cookie Monster's own site.</div>` +
      `<div class="ca-row-desc">${loaded ? '' : '⚠ '}Needed for the store's building sort switch${loaded ? '' : ' (locked until it runs)'}.</div></div>` +
      C.button(loaded ? 'Loaded' : 'Load now', 'data-ca="cm-load" data-ca-cm-load' + (loaded ? ' disabled' : ''), 'ca-btn-small') +
      '</div>' +
      CA.Settings.optionsIn('integrations').map(optionRow).join('') +
      '</div>' +
      '</div>'
    );
  }

  // Built-in pages. Other modules register their own pages the same way (CA.UI.Pages).
  CA.UI.Pages.register({
    id: 'graphs',
    label: 'Graphs',
    icon: 'graphs',
    order: 20,
    group: 'data',
    html: () => CA.UI.Graphs.html(),
    mount: (root) => CA.UI.Graphs.mount(root),
    unmount: () => CA.UI.Graphs.unmount(),
    tick: () => CA.UI.Graphs.tick(),
  });
  CA.UI.Pages.register({
    id: 'stocks',
    label: 'Stock market',
    icon: 'stocks',
    order: 40,
    group: 'minigames',
    html: () => stocksPage(),
    parts: [CA.UI.StockGraph, CA.UI.StockPerf, CA.UI.StockLog, { mount: wireSellAll, unmount() {}, tick() {} }],
  });
  CA.UI.Pages.register({ id: 'settings', label: 'Settings', icon: 'settings', order: 90, group: 'custom', html: () => settingsPage() });

  let mounted = null; // the page whose mount() ran for the current render

  function unmountPage() {
    if (mounted) mounted.unmount();
    mounted = null;
  }

  function html() {
    const page = CA.UI.Pages.get(currentTab());
    return (
      '<div class="close menuClose" data-ca="close">x</div>' +
      '<div id="CookieMgrMenu">' +
      `<div class="ca-page" data-page="${page.id}">${page.html()}</div>` +
      '</div>'
    );
  }

  function render() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    unmountPage();
    menu.innerHTML = html();
    const page = CA.UI.Pages.get(currentTab());
    page.mount(menu.querySelector('.ca-page'));
    mounted = page;
    sync();
  }

  /** Opens the panel on page `id` (or switches to it if the panel is already open). */
  function openPage(id) {
    if (!CA.UI.Pages.get(id)) return;
    const wasOpen = isOpen();
    CA.Settings.set('tab', id);
    if (wasOpen) render();
    else open(); // Game.ShowMenu -> Game.UpdateMenu -> render()
  }

  /** The Sell All button's tip: a live cookie estimate, worked out while it shows (ui/tips.js). */
  function wireSellAll(root) {
    const btn = root.querySelector('[data-ca-sellall]');
    if (btn) btn.dataset.tipLive = 'sellAll';
  }

  /** Updates the dynamic bits of an already rendered panel (no re-render, keeps scroll). */
  function sync() {
    const root = document.getElementById('CookieMgrMenu');
    if (!root) return;

    // macro rows, wherever they are (Macros page, Stock market page, …)
    CA.UI.MacrosPage.sync(root);

    // chips / pills bound to a setting
    root.querySelectorAll('[data-pressed-key]').forEach((el) => {
      const v = CA.Settings.get(el.dataset.pressedKey);
      const on = 'pressedVal' in el.dataset ? String(v) === el.dataset.pressedVal : !!v;
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', String(on));
    });

    const info = root.querySelector('[data-ca-history-info]');
    if (info) info.textContent = historyInfo();
    const short = root.querySelector('[data-ca-history-short]');
    if (short) short.textContent = historyInfo().split('.')[0];

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
      case 'sell-all-stocks':
        CA.Util.sound('snd/clickOff2.mp3');
        CA.StockTrader.sellAll();
        break;
      case 'open-macros':
        CA.Util.sound('snd/tick.mp3');
        openPage('clickers');
        break;
      case 'goto':
        CA.Util.sound('snd/tick.mp3');
        openPage(t.dataset.page);
        break;
      case 'open-mg':
        CA.Util.sound('snd/tick.mp3');
        CA.UI.WidgetTypes.openMinigame(t.dataset.building);
        break;
      case 'option': {
        const key = t.dataset.key;
        const next = !CA.Settings.get(key);
        CA.Util.sound(next ? 'snd/clickOn2.mp3' : 'snd/clickOff2.mp3');
        CA.Settings.set(key, next);
        break;
      }
      case 'gclear':
        CA.Util.sound('snd/tick.mp3');
        if (armed(t)) CA.History.clear().then(sync);
        break;
      case 'hexport':
        CA.Util.sound('snd/tick.mp3');
        CA.Recorder.exportFile().catch((err) => CA.Util.notify('Export failed', C.esc(err.message || String(err)), CA.ICON, 4));
        break;
      case 'himport': {
        CA.Util.sound('snd/tick.mp3');
        const input = t.parentNode.querySelector('[data-ca-history-file]');
        if (armed(t) && input) input.click();
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
      case 'cm-load':
        CA.Util.sound('snd/tick.mp3');
        CA.CookieMonster.load();
        break;
      default:
        CA.UI.MacrosPage.handle(kind, t); // macro-toggle, macro-run, macro-fav, all-on, …
    }
  }

  function onBound(combo, shared) {
    CA.Util.sound('snd/tick.mp3');
    if (combo && shared.length) {
      const names = shared.map((id) => (CA.Hotkeys.get(id) || { name: id }).name).join(', ');
      CA.Util.notify('Shared hotkey', `<b>${CA.Hotkeys.format(combo)}</b> also triggers: ${C.esc(names)}`, CA.ICON, 3);
    }
  }

  // ---- wiring ----------------------------------------------------------------------

  function init() {
    CA.Hotkeys.register({ id: 'panel.toggle', name: 'Open / close panel', group: 'general', defaultKey: '', run: toggle });
    CA.Settings.defineOption({ key: 'tab', group: 'ui', name: 'Panel tab', desc: '', default: 'clickers' });

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
      if (!isOpen()) {
        CA.Hotkeys.cancelCapture();
        unmountPage();
      }
      CA.UI.Tab.update();
      return result;
    });

    const menu = document.getElementById('menu');
    if (menu) {
      menu.addEventListener('click', onClick);
      menu.addEventListener('change', onHistoryFile);
      // a macro row's settings, on whichever page shows the row
      menu.addEventListener('change', (e) => CA.UI.MacrosPage.handleSetting(e));
    }

    const refresh = () => {
      if (!isOpen()) return;
      sync();
      if (mounted) mounted.tick();
    };
    CA.Events.on('macros', refresh);
    CA.Events.on('settings', refresh);
    CA.Events.on('hotkeys', refresh);
    CA.Events.on('history', () => {
      const info = isOpen() && currentTab() === 'settings' && document.querySelector('#CookieMgrMenu [data-ca-history-info]');
      if (info) info.textContent = historyInfo();
    });
    CA.Events.on('integrations', () => {
      if (isOpen() && currentTab() === 'settings') render();
    });
  }

  return { init, open, close, toggle, isOpen, openPage, render, sync, optionRow, optionTile, optionsCard, currentTab };
})();
