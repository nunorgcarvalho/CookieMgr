// Autoclickers: the original v0.1 bookmarklet features, one timer each.

CA.Autoclickers = (() => {
  const popShimmers = (filter) => {
    Game.shimmers.filter(filter).forEach((s) => s.pop());
  };

  /**
   * Clicker definitions. To add a new one, append an entry here — the panel,
   * hotkeys and save data pick it up automatically.
   *   icon: [x, y] on the game's img/icons.png (used in notifications)
   *   img:  optional nicer picture for the panel
   */
  const DEFS = [
    {
      id: 'bigCookie',
      name: 'Big cookie',
      desc: 'Clicks the big cookie 20 times a second.',
      interval: 50,
      defaultKey: 'KeyC',
      icon: [11, 0],
      img: 'img/perfectCookie.png',
      tick() {
        Game.ClickCookie();
      },
    },
    {
      id: 'golden',
      name: 'Golden cookies',
      desc: 'Pops golden cookies the moment they appear.',
      interval: 100,
      defaultKey: 'KeyG',
      icon: [10, 14],
      img: 'img/goldCookie.png',
      tick() {
        popShimmers((s) => s.type === 'golden' && !s.wrath);
      },
    },
    {
      id: 'wrath',
      name: 'Wrath cookies',
      desc: 'Pops red wrath cookies too (they can be good or bad).',
      interval: 100,
      defaultKey: 'KeyW',
      icon: [15, 5],
      img: 'img/wrathCookie.png',
      tick() {
        popShimmers((s) => s.type === 'golden' && s.wrath);
      },
    },
    {
      id: 'reindeer',
      name: 'Reindeer',
      desc: 'Pops reindeer during the Christmas season.',
      interval: 100,
      defaultKey: 'KeyR',
      icon: [12, 9],
      img: 'img/frostedReindeer.png',
      tick() {
        popShimmers((s) => s.type === 'reindeer');
      },
    },
    {
      id: 'fortune',
      name: 'Fortune news',
      desc: 'Clicks fortunes as they scroll through the news ticker.',
      interval: 100,
      defaultKey: 'KeyF',
      icon: [29, 8],
      tick() {
        if (Game.TickerEffect && Game.TickerEffect.type === 'fortune' && Game.tickerL) Game.tickerL.click();
      },
    },
    {
      id: 'wrinklers',
      name: 'Wrinklers',
      desc: 'Pops wrinklers as soon as they latch onto the cookie.',
      interval: 100,
      defaultKey: 'KeyK',
      icon: [19, 8],
      tick() {
        Game.wrinklers.forEach((w) => {
          if (w.phase > 0) w.hp = 0;
        });
      },
    },
  ];

  const byId = {};
  const enabled = {};
  const timers = {};

  DEFS.forEach((d) => {
    byId[d.id] = d;
    enabled[d.id] = false;
  });

  function runTick(def) {
    if (Game.OnAscend || Game.AscendTimer > 0) return;
    try {
      def.tick();
    } catch (e) {
      console.error(`[CookieMgr] ${def.name} autoclicker error`, e);
    }
  }

  function announce(title, on, icon) {
    if (!CA.Settings.get('notifications')) return;
    CA.Util.notify(title, on ? '<b style="color:#8f8">ON</b>' : '<b style="color:#f88">OFF</b>', icon, 2);
  }

  /** Turns one autoclicker on or off. */
  function set(id, on, { silent = false } = {}) {
    const def = byId[id];
    if (!def) return;
    on = !!on;
    if (enabled[id] === on && (!on || timers[id])) return;

    clearInterval(timers[id]);
    timers[id] = null;
    enabled[id] = on;
    if (on) timers[id] = setInterval(() => runTick(def), def.interval);

    if (!silent) announce(`${def.name} autoclicker`, on, def.icon);
    CA.Events.emit('clickers', id);
  }

  function toggle(id) {
    set(id, !enabled[id]);
  }

  function setAll(on, { silent = false } = {}) {
    DEFS.forEach((d) => set(d.id, on, { silent: true }));
    if (!silent) announce('All autoclickers', on, CA.ICON);
  }

  /** Same behaviour as v0.1: if anything is off, turn everything on; otherwise turn all off. */
  function toggleAll() {
    setAll(!allOn());
  }

  const isOn = (id) => !!enabled[id];
  const allOn = () => DEFS.every((d) => enabled[d.id]);
  const activeCount = () => DEFS.filter((d) => enabled[d.id]).length;
  const list = () => DEFS.slice();
  const snapshot = () => ({ ...enabled });

  function restore(states) {
    if (!states || typeof states !== 'object') return;
    DEFS.forEach((d) => {
      if (typeof states[d.id] === 'boolean') set(d.id, states[d.id], { silent: true });
    });
  }

  function init() {
    DEFS.forEach((d) =>
      CA.Actions.register({
        id: `clicker.${d.id}`,
        name: d.name,
        group: 'autoclickers',
        defaultKey: d.defaultKey,
        run: () => toggle(d.id),
      })
    );
    CA.Actions.register({
      id: 'clickers.toggleAll',
      name: 'Toggle all autoclickers',
      group: 'general',
      defaultKey: 'KeyA',
      run: toggleAll,
    });

    CA.Settings.defineOption({
      key: 'disableOnAscend',
      icon: 'ascend',
      group: 'autoclickers',
      name: 'Turn off when ascending',
      desc: 'Switches every autoclicker off as soon as you ascend.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'rememberStates',
      icon: 'save',
      group: 'autoclickers',
      name: 'Remember on/off states',
      desc: 'Restores which autoclickers were running when you reload the game.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'notifications',
      icon: 'bell',
      group: 'autoclickers',
      name: 'Toggle notifications',
      desc: 'Shows a small ON/OFF popup whenever an autoclicker is switched.',
      default: true,
    });

    CA.Events.on('ascend', () => {
      if (!CA.Settings.get('disableOnAscend') || activeCount() === 0) return;
      setAll(false, { silent: true });
      CA.Util.notify('CookieMgr', 'All autoclickers were turned off for your ascension.', [20, 7], 4);
    });
  }

  return { init, set, toggle, setAll, toggleAll, isOn, allOn, activeCount, list, snapshot, restore, get: (id) => byId[id] };
})();
