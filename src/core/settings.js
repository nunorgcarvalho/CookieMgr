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

  function get(key) {
    return options[key];
  }

  function set(key, value) {
    if (options[key] === value) return;
    options[key] = value;
    CA.Events.emit('settings', key);
  }

  // ---- hotkeys ---------------------------------------------------------------

  function getHotkey(actionId) {
    if (actionId in hotkeyOverrides) return hotkeyOverrides[actionId];
    const action = CA.Actions.get(actionId);
    return action ? action.defaultKey : '';
  }

  function actionForCombo(combo) {
    if (!combo) return null;
    const hit = CA.Actions.all().find((a) => getHotkey(a.id) === combo);
    return hit ? hit.id : null;
  }

  /**
   * Binds `combo` to `actionId`. Any other action already using that combo is unbound.
   * @returns {string[]} ids of actions that lost their binding
   */
  function setHotkey(actionId, combo) {
    const displaced = [];
    if (combo) {
      CA.Actions.all().forEach((a) => {
        if (a.id !== actionId && getHotkey(a.id) === combo) {
          storeOverride(a.id, '');
          displaced.push(a.id);
        }
      });
    }
    storeOverride(actionId, combo);
    CA.Events.emit('hotkeys', actionId);
    return displaced;
  }

  function storeOverride(actionId, combo) {
    const action = CA.Actions.get(actionId);
    if (action && action.defaultKey === combo) delete hotkeyOverrides[actionId];
    else hotkeyOverrides[actionId] = combo;
  }

  function resetHotkeys() {
    hotkeyOverrides = {};
    CA.Events.emit('hotkeys', null);
  }

  // ---- save / load -------------------------------------------------------------

  function serialize() {
    const data = { v: SAVE_VERSION, options: { ...options }, hotkeys: { ...hotkeyOverrides } };
    if (options.rememberStates) {
      if (CA.Autoclickers) data.clickers = CA.Autoclickers.snapshot();
      if (CA.StockTrader) data.stockTrader = CA.StockTrader.isOn();
    }
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
        if (typeof data.hotkeys[id] === 'string') hotkeyOverrides[id] = data.hotkeys[id];
      });
    }
    CA.Events.emit('settings', null);
    CA.Events.emit('hotkeys', null);
    return data;
  }

  return { defineOption, optionsIn, get, set, getHotkey, setHotkey, actionForCombo, resetHotkeys, serialize, deserialize };
})();
