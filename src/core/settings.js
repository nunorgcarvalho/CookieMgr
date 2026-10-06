// Persistent settings: options (booleans for now) and hotkey bindings.
// Saved inside the regular Cookie Clicker save through the mod API (see main.js),
// so they follow exports/imports and cloud saves like any other game data.

CA.Settings = (() => {
  const SAVE_VERSION = 1;

  const optionDefs = []; // { key, name, desc, group, default }
  const options = {};
  let hotkeyOverrides = {}; // actionId -> combo ('' = explicitly unbound)

  // ---- options ---------------------------------------------------------------

  function defineOption(def) {
    optionDefs.push(def);
    if (!(def.key in options)) options[def.key] = def.default;
    return def;
  }

  function optionsIn(group) {
    return optionDefs.filter((d) => d.group === group);
  }
  /** Every option defined so far (for the Settings page and the tests). */
  const definitions = () => optionDefs.slice();

  function get(key) {
    return options[key];
  }

  function set(key, value) {
    if (options[key] === value) return;
    options[key] = value;
    CA.Events.emit('settings', key);
  }

  // ---- hotkeys ---------------------------------------------------------------

  // Hotkeys bind to bindables (CA.Hotkeys.register): macros and a few panel commands.
  // Up to v1.6 the autoclickers were bound as 'clicker.<id>'; they're macros now.
  const LEGACY_HOTKEY_IDS = { 'clicker.stockTrader': 'macro.stockTrader' };
  const migrateHotkeyId = (id) => LEGACY_HOTKEY_IDS[id] || (id.startsWith('clicker.') ? `macro.${id.slice(8)}` : id);

  function getHotkey(id) {
    if (id in hotkeyOverrides) return hotkeyOverrides[id];
    const b = CA.Hotkeys.get(id);
    return b ? b.defaultKey : '';
  }

  /** Every bindable a combo triggers (a key may be shared by several macros). */
  function targetsForCombo(combo) {
    if (!combo) return [];
    return CA.Hotkeys.all()
      .filter((b) => getHotkey(b.id) === combo)
      .map((b) => b.id);
  }

  /**
   * Binds `combo` to bindable `id`. Keys can be shared, so nothing else is unbound.
   * @returns {string[]} ids of the other bindables that the same key also triggers
   */
  function setHotkey(id, combo) {
    storeOverride(id, combo);
    CA.Events.emit('hotkeys', id);
    return combo ? targetsForCombo(combo).filter((x) => x !== id) : [];
  }

  function storeOverride(id, combo) {
    const b = CA.Hotkeys.get(id);
    if (b && b.defaultKey === combo) delete hotkeyOverrides[id];
    else hotkeyOverrides[id] = combo;
  }

  function resetHotkeys() {
    hotkeyOverrides = {};
    CA.Events.emit('hotkeys', null);
  }

  // ---- save / load -------------------------------------------------------------

  function serialize() {
    const data = { v: SAVE_VERSION, options: { ...options }, hotkeys: { ...hotkeyOverrides } };
    if (CA.Macros) {
      data.macros = CA.Macros.serialize(); // your own macros + per-macro preferences
      if (options.rememberStates) data.running = CA.Macros.runningIds();
    }
    if (CA.UI && CA.UI.Widgets) data.widgets = CA.UI.Widgets.serialize();
    if (CA.Garden) data.garden = CA.Garden.serialize(); // garden profiles
    return JSON.stringify(data);
  }

  /** @returns {object|null} the parsed save (so callers can read extra fields such as clickers) */
  function deserialize(str) {
    if (!str) return null;
    let data;
    try {
      data = JSON.parse(str);
    } catch (e) {
      CA.Util.log('Could not read saved settings, using defaults.', e);
      return null;
    }
    if (!data || typeof data !== 'object') return null;

    if (data.options && typeof data.options === 'object') {
      optionDefs.forEach((d) => {
        if (typeof data.options[d.key] === typeof d.default) options[d.key] = data.options[d.key];
      });
    }
    if (data.hotkeys && typeof data.hotkeys === 'object') {
      hotkeyOverrides = {};
      Object.keys(data.hotkeys).forEach((id) => {
        if (typeof data.hotkeys[id] === 'string') hotkeyOverrides[migrateHotkeyId(id)] = data.hotkeys[id];
      });
    }
    CA.Events.emit('settings', null);
    CA.Events.emit('hotkeys', null);
    return data;
  }

  // ---- local mirror (survives a quick refresh) ----------------------------------
  // Cookie Clicker only autosaves once every 60 real seconds (see Game.T%(fps*60) in its own
  // source) and does not force a save on tab close/refresh — so toggling a setting and
  // reloading soon after can lose it, through no fault of this mod (any mod's save data has
  // the same gap). We mirror our own serialized state to localStorage on every change (plus a
  // periodic safety net and on page hide), and prefer it over whatever came from the game's own
  // save on load, since ours is never more than moments out of date.

  const STORE_KEY = 'CookieMgr.settings.v1';
  const PERSIST_MS = 30000;
  let persistTimer = null;

  function persistToLocal() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), payload: serialize() }));
    } catch (e) {
      /* storage full/blocked (private mode, quota, ...) — this is a convenience mirror, never fatal */
    }
  }

  /** The mirrored payload string, or null. Read it *before* deserialize()ing anything: that
   *  emits 'settings', which re-mirrors the current (not yet restored) state over it. */
  function localPayload() {
    let raw;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    return data && typeof data.payload === 'string' ? data.payload : null;
  }

  /** @returns {object|null} same shape as deserialize()'s return, or null if nothing local */
  function restoreFromLocal() {
    const payload = localPayload();
    return payload ? deserialize(payload) : null;
  }

  function startAutoPersist() {
    CA.Events.on('settings', persistToLocal);
    CA.Events.on('hotkeys', persistToLocal);
    CA.Events.on('macros', persistToLocal);
    CA.Events.on('widgets', persistToLocal);
    CA.Events.on('garden', persistToLocal);
    persistTimer = setInterval(persistToLocal, PERSIST_MS);
    addEventListener('pagehide', persistToLocal);
    addEventListener('beforeunload', persistToLocal);
  }

  return {
    defineOption,
    optionsIn,
    definitions,
    get,
    set,
    getHotkey,
    setHotkey,
    targetsForCombo,
    resetHotkeys,
    serialize,
    deserialize,
    restoreFromLocal,
    localPayload,
    startAutoPersist,
  };
})();
