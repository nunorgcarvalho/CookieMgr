/*! CookieMgr v0.2.0 */
(function () {
'use strict';
const CA = {};
CA.VERSION = "0.2.0";
CA.CSS = "/* ==========================================================================\n   CookieMgr — styles\n   Colours and borders borrow from the game's own \"framed\" look so the panel\n   feels native. Everything is scoped under #CookieMgrTab / #CookieMgrMenu.\n   ========================================================================== */\n\n/* ---------- Side tab (sticks out of the left beam) ---------- */\n\n#CookieMgrTab {\n  position: absolute;\n  left: 30%;\n  top: 128px;\n  margin-left: 3px; /* tuck slightly under the beam */\n  transform: translateX(-100%);\n  z-index: 110;\n  box-sizing: border-box;\n  width: 30px;\n  padding: 10px 0 12px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  cursor: pointer;\n  user-select: none;\n  background: linear-gradient(to right, #3d2716, #221409);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-right: none;\n  border-radius: 10px 0 0 10px;\n  box-shadow: -3px 3px 10px rgba(0, 0, 0, 0.65), inset 1px 1px 0 rgba(255, 255, 255, 0.18);\n  transition: width 0.15s ease-out, background 0.2s, box-shadow 0.2s;\n  outline: none;\n}\n#CookieMgrTab:hover,\n#CookieMgrTab:focus-visible {\n  width: 34px;\n  box-shadow: -3px 3px 12px rgba(0, 0, 0, 0.75), 0 0 12px rgba(255, 215, 110, 0.35), inset 1px 1px 0 rgba(255, 255, 255, 0.25);\n}\n#CookieMgrTab.selected {\n  background: linear-gradient(to right, #7a4f22, #43290f);\n  box-shadow: -3px 3px 12px rgba(0, 0, 0, 0.75), 0 0 14px rgba(255, 215, 110, 0.55), inset 1px 1px 0 rgba(255, 255, 255, 0.3);\n}\n#CookieMgrTab .ca-tab-cookie {\n  width: 20px;\n  height: 20px;\n  background: url(img/perfectCookie.png) center / contain no-repeat;\n  filter: drop-shadow(0 1px 1px #000);\n  transition: transform 0.35s ease-out;\n}\n#CookieMgrTab:hover .ca-tab-cookie,\n#CookieMgrTab.selected .ca-tab-cookie {\n  transform: rotate(-30deg) scale(1.12);\n}\n#CookieMgrTab .ca-tab-label {\n  writing-mode: vertical-rl;\n  transform: rotate(180deg);\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 13px;\n  letter-spacing: 1px;\n  color: #f4e6c3;\n  text-shadow: 0 1px 2px #000, 0 0 6px rgba(255, 200, 120, 0.25);\n  white-space: nowrap;\n}\n#CookieMgrTab .ca-tab-badge {\n  display: none;\n  min-width: 16px;\n  height: 16px;\n  padding: 0 3px;\n  box-sizing: border-box;\n  border-radius: 8px;\n  font: bold 10px/16px Tahoma, Arial, sans-serif;\n  text-align: center;\n  color: #fff;\n  background: linear-gradient(#63c64a, #2f7d24);\n  box-shadow: 0 0 6px rgba(120, 240, 100, 0.8), 0 1px 1px #000;\n  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);\n}\n#CookieMgrTab.active .ca-tab-badge {\n  display: block;\n  animation: caBadgeGlow 2s infinite ease-in-out;\n}\n@keyframes caBadgeGlow {\n  0%, 100% { box-shadow: 0 0 4px rgba(120, 240, 100, 0.6), 0 1px 1px #000; }\n  50% { box-shadow: 0 0 10px rgba(120, 240, 100, 1), 0 1px 1px #000; }\n}\n#game.ascending #CookieMgrTab,\n#game.ascendIntro #CookieMgrTab,\n#game.reincarnating #CookieMgrTab {\n  display: none;\n}\n\n/* ---------- Panel ---------- */\n\n#CookieMgrMenu {\n  max-width: 780px;\n  margin: 0 auto;\n  padding: 0 12px 120px;\n  color: #ddd;\n}\n#CookieMgrMenu .ca-tagline {\n  text-align: center;\n  margin: -6px 0 14px;\n  font-size: 12px;\n  font-style: italic;\n  color: #b9ab93;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Cards */\n#CookieMgrMenu .ca-card {\n  margin: 14px 4px;\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  background: rgba(0, 0, 0, 0.38);\n  box-shadow: 0 0 1px #000, inset 0 0 1px #000, 0 6px 16px rgba(0, 0, 0, 0.35);\n  overflow: hidden;\n}\n#CookieMgrMenu .ca-card-head {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 10px;\n  padding: 9px 14px;\n  background: linear-gradient(to right, rgba(255, 235, 190, 0.09), rgba(255, 235, 190, 0));\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-card-title {\n  flex: 1;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-size: 20px;\n  color: #fff;\n  text-shadow: 0 -1px 5px rgba(255, 255, 200, 0.35), 0 1px 3px #000;\n}\n#CookieMgrMenu .ca-pill {\n  font-size: 11px;\n  white-space: nowrap;\n  padding: 3px 10px;\n  border-radius: 10px;\n  color: #bbb;\n  background: rgba(255, 255, 255, 0.07);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  transition: all 0.2s;\n}\n#CookieMgrMenu .ca-pill.on {\n  color: #cfc;\n  background: rgba(80, 200, 90, 0.16);\n  border-color: rgba(130, 235, 120, 0.5);\n}\n\n/* Rows */\n#CookieMgrMenu .ca-row {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px 12px;\n  padding: 8px 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n  transition: background 0.2s;\n}\n#CookieMgrMenu .ca-list .ca-row:first-child {\n  border-top: none;\n}\n#CookieMgrMenu .ca-row:hover {\n  background: rgba(255, 255, 255, 0.035);\n}\n#CookieMgrMenu .ca-row.on {\n  background: linear-gradient(to right, rgba(255, 210, 90, 0.12), rgba(255, 210, 90, 0) 65%);\n}\n#CookieMgrMenu .ca-row-master {\n  background: rgba(0, 0, 0, 0.22);\n  border-top: none;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n#CookieMgrMenu .ca-row-option {\n  padding-top: 10px;\n  padding-bottom: 10px;\n}\n#CookieMgrMenu .ca-row-text {\n  flex: 1 1 160px;\n  min-width: 0;\n}\n#CookieMgrMenu .ca-row-option {\n  flex-wrap: nowrap;\n}\n#CookieMgrMenu .ca-row-option .ca-row-text {\n  flex-basis: 0;\n}\n#CookieMgrMenu .ca-controls {\n  flex: 0 1 auto;\n  max-width: 100%;\n  margin-left: auto;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  align-items: center;\n  gap: 8px;\n}\n#CookieMgrMenu .ca-row-name {\n  font-family: 'Merriweather', Georgia, serif;\n  font-weight: bold;\n  font-size: 14px;\n  color: #f2ead2;\n  text-shadow: 0 1px 2px #000;\n}\n#CookieMgrMenu .ca-row-desc {\n  margin-top: 2px;\n  font-size: 11px;\n  color: #b3a590;\n  text-shadow: 0 1px 1px #000;\n}\n\n/* Icons */\n#CookieMgrMenu .ca-icon {\n  flex: 0 0 36px;\n  width: 36px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: filter 0.25s, transform 0.25s;\n  filter: grayscale(0.55) brightness(0.8);\n}\n#CookieMgrMenu .ca-row.on .ca-icon,\n#CookieMgrMenu .ca-row-master .ca-icon {\n  filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.75));\n}\n#CookieMgrMenu .ca-row.on .ca-icon {\n  transform: scale(1.06);\n}\n#CookieMgrMenu .ca-img {\n  width: 36px;\n  height: 36px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}\n#CookieMgrMenu .ca-sprite {\n  flex: none;\n  width: 48px;\n  height: 48px;\n  background-image: url(img/icons.png);\n  transform: scale(0.75);\n}\n\n/* Toggle switch */\n#CookieMgrMenu .ca-switch {\n  flex: none;\n  padding: 2px;\n  background: none;\n  border: none;\n  cursor: pointer;\n}\n#CookieMgrMenu .ca-switch:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-switch-track {\n  display: block;\n  position: relative;\n  width: 42px;\n  height: 22px;\n  box-sizing: border-box;\n  border-radius: 11px;\n  background: #2a211c;\n  border: 1px solid rgba(255, 255, 255, 0.22);\n  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.75);\n  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n#CookieMgrMenu .ca-switch-knob {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, #fff, #c9c1b5 55%, #8a8178);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);\n  transition: left 0.18s ease-out;\n}\n#CookieMgrMenu .ca-switch:hover .ca-switch-track {\n  border-color: rgba(255, 225, 150, 0.6);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-track {\n  background: linear-gradient(#66c84b, #2f7d24);\n  border-color: #a5ea93;\n  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35), 0 0 9px rgba(110, 230, 90, 0.45);\n}\n#CookieMgrMenu .ca-switch.on .ca-switch-knob {\n  left: 22px;\n}\n#CookieMgrMenu .ca-switch:focus-visible .ca-switch-track {\n  outline: 2px solid #ffd76a;\n  outline-offset: 2px;\n}\n\n/* Hotkey chips */\n#CookieMgrMenu .ca-hotkey {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n}\n#CookieMgrMenu .ca-key {\n  min-width: 46px;\n  height: 26px;\n  padding: 0 10px;\n  font: bold 12px Tahoma, Arial, sans-serif;\n  color: #f4e6c3;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#4d3c2d, #2a2018);\n  border: 1px solid;\n  border-color: #9a7d5b #3b2c1f #2a1f15 #74604a;\n  border-radius: 5px;\n  box-shadow: 0 2px 0 #140d08, inset 0 1px 0 rgba(255, 255, 255, 0.16);\n  cursor: pointer;\n  transition: color 0.15s, border-color 0.15s, box-shadow 0.15s;\n}\n#CookieMgrMenu .ca-key:hover {\n  color: #fff;\n  border-color: #e0c08a #5a4430 #3d2e20 #b39468;\n}\n#CookieMgrMenu .ca-key:active {\n  transform: translateY(1px);\n  box-shadow: 0 1px 0 #140d08, inset 0 1px 0 rgba(255, 255, 255, 0.16);\n}\n#CookieMgrMenu .ca-key:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key {\n  color: #8f877a;\n  font-weight: normal;\n  font-style: italic;\n  background: rgba(0, 0, 0, 0.3);\n  border: 1px dashed rgba(255, 255, 255, 0.22);\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-hotkey.capturing .ca-key {\n  color: #ffe9a6;\n  border-color: #ffd76a;\n  animation: caCapture 1.1s infinite ease-in-out;\n}\n@keyframes caCapture {\n  0%, 100% { box-shadow: 0 2px 0 #140d08, 0 0 0 0 rgba(255, 215, 106, 0.5); }\n  50% { box-shadow: 0 2px 0 #140d08, 0 0 12px 2px rgba(255, 215, 106, 0.55); }\n}\n#CookieMgrMenu .ca-key-clear {\n  width: 18px;\n  height: 18px;\n  margin-left: 3px;\n  padding: 0;\n  border: none;\n  border-radius: 50%;\n  background: transparent;\n  color: #b09a8a;\n  font-size: 14px;\n  line-height: 18px;\n  cursor: pointer;\n  opacity: 0;\n  transition: opacity 0.15s, background 0.15s;\n}\n#CookieMgrMenu .ca-row:hover .ca-key-clear {\n  opacity: 0.8;\n}\n#CookieMgrMenu .ca-key-clear:hover {\n  color: #fff;\n  background: rgba(255, 80, 80, 0.35);\n}\n#CookieMgrMenu .ca-hotkey.unset .ca-key-clear,\n#CookieMgrMenu .ca-hotkey.capturing .ca-key-clear {\n  visibility: hidden;\n}\n\n/* Buttons */\n#CookieMgrMenu .ca-btn {\n  padding: 4px 12px;\n  font-family: 'Merriweather', Georgia, serif;\n  font-variant: small-caps;\n  font-weight: bold;\n  font-size: 12px;\n  color: #ddd;\n  text-shadow: 0 1px 1px #000;\n  background: linear-gradient(#3e2f23, #1d140f);\n  border: 1px solid;\n  border-color: #ece2b6 #875526 #733726 #dfbc9a;\n  border-radius: 4px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);\n  cursor: pointer;\n  transition: color 0.15s, box-shadow 0.15s, opacity 0.15s;\n}\n#CookieMgrMenu .ca-btn:focus {\n  outline: none;\n}\n#CookieMgrMenu .ca-btn:not(:disabled):hover {\n  color: #fff;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 9px rgba(255, 220, 120, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);\n}\n#CookieMgrMenu .ca-btn:not(:disabled):active {\n  transform: translateY(1px);\n}\n#CookieMgrMenu .ca-btn-on:not(:disabled):hover {\n  color: #d6ffcc;\n}\n#CookieMgrMenu .ca-btn-off:not(:disabled):hover {\n  color: #ffd2cc;\n}\n#CookieMgrMenu .ca-btn:disabled {\n  opacity: 0.38;\n  cursor: default;\n  box-shadow: none;\n}\n#CookieMgrMenu .ca-btn-small {\n  font-size: 11px;\n  padding: 3px 10px;\n}\n\n/* Footer */\n#CookieMgrMenu .ca-footer {\n  margin: 18px 8px 0;\n  font-size: 11px;\n  line-height: 1.7;\n  text-align: center;\n  color: #9b907f;\n  text-shadow: 0 1px 1px #000;\n}\n#CookieMgrMenu .ca-footer b {\n  color: #c9bba3;\n}\n#CookieMgrMenu kbd {\n  display: inline-block;\n  padding: 0 5px;\n  font: bold 10px/16px Tahoma, Arial, sans-serif;\n  color: #e8dcc2;\n  background: #2a2018;\n  border: 1px solid #5a4632;\n  border-radius: 3px;\n  box-shadow: 0 1px 0 #140d08;\n}\n#CookieMgrMenu .ca-footer-actions {\n  margin-top: 8px;\n}\n";

// ---- src/core/util.js ------------------------------------------------
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

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
      Game.Notify(title, desc || '', icon || CA.ICON, quick, 1);
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
};

// ---- src/core/events.js ----------------------------------------------
// Tiny publish/subscribe bus so features and UI stay decoupled.
//
// Events currently emitted:
//   'clickers'  (id)          an autoclicker was switched on/off
//   'settings'  (key)         an option changed
//   'hotkeys'   (actionId)    a hotkey binding changed (or capture started/stopped)
//   'ascend'    ()            the player just started ascending

CA.Events = (() => {
  const handlers = {};

  function on(event, fn) {
    (handlers[event] = handlers[event] || []).push(fn);
    return () => off(event, fn);
  }

  function off(event, fn) {
    const list = handlers[event];
    if (!list) return;
    const i = list.indexOf(fn);
    if (i !== -1) list.splice(i, 1);
  }

  function emit(event, ...args) {
    (handlers[event] || []).slice().forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        console.error('[CookieMgr] event handler error', event, e);
      }
    });
  }

  return { on, off, emit };
})();

// ---- src/core/actions.js ---------------------------------------------
// Registry of things a hotkey can trigger.
// Each feature registers its actions; the hotkey system and the settings panel read from here.
//
//   CA.Actions.register({
//     id: 'clicker.golden',     // unique, stable (it is stored in the save)
//     name: 'Golden cookies',   // shown in the UI
//     group: 'autoclickers',
//     defaultKey: 'KeyG',       // KeyboardEvent.code combo, '' for unbound
//     run() { ... },
//   });

CA.Actions = (() => {
  const list = [];
  const byId = {};

  function register(action) {
    if (byId[action.id]) throw new Error(`Action "${action.id}" already registered`);
    const a = { group: 'general', defaultKey: '', ...action };
    list.push(a);
    byId[a.id] = a;
    return a;
  }

  function get(id) {
    return byId[id];
  }

  function all(group) {
    return group ? list.filter((a) => a.group === group) : list.slice();
  }

  function run(id) {
    const a = byId[id];
    if (a && a.run) a.run();
  }

  return { register, get, all, run };
})();

// ---- src/core/settings.js --------------------------------------------
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
    if (options.rememberStates && CA.Autoclickers) data.clickers = CA.Autoclickers.snapshot();
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

// ---- src/core/hotkeys.js ---------------------------------------------
// Global keyboard shortcuts + "press a key to bind" capture mode.
//
// A combo is stored as a string of optional modifiers followed by a KeyboardEvent.code,
// e.g. 'KeyG', 'Shift+KeyG', 'Ctrl+Alt+Digit1'. Using `code` (physical key) keeps
// bindings stable across keyboard layouts and Shift states.

CA.Hotkeys = (() => {
  const MODIFIER_CODES = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock'];
  const RESERVED = ['Ctrl+KeyS', 'Ctrl+KeyO']; // the game's own save/import shortcuts

  const PRETTY = {
    Space: 'Space', Enter: 'Enter', Tab: 'Tab', Backquote: '`', Minus: '-', Equal: '=',
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
    Comma: ',', Period: '.', Slash: '/', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    PageUp: 'PgUp', PageDown: 'PgDn', Insert: 'Ins', Home: 'Home', End: 'End',
    NumpadAdd: 'Num +', NumpadSubtract: 'Num -', NumpadMultiply: 'Num *', NumpadDivide: 'Num /',
    NumpadDecimal: 'Num .', NumpadEnter: 'Num Enter',
  };

  let capture = null; // { actionId, onDone }

  function fromEvent(e) {
    if (!e.code || MODIFIER_CODES.includes(e.code)) return null;
    let combo = '';
    if (e.ctrlKey) combo += 'Ctrl+';
    if (e.altKey) combo += 'Alt+';
    if (e.shiftKey) combo += 'Shift+';
    if (e.metaKey) combo += 'Meta+';
    return combo + e.code;
  }

  /** 'Shift+KeyG' -> 'Shift + G' (plain text) */
  function format(combo) {
    if (!combo) return '';
    return combo
      .split('+')
      .map((part) => {
        if (PRETTY[part]) return PRETTY[part];
        if (/^Key[A-Z]$/.test(part)) return part.slice(3);
        if (/^Digit\d$/.test(part)) return part.slice(5);
        if (/^Numpad\d$/.test(part)) return `Num ${part.slice(6)}`;
        return part;
      })
      .join(' + ');
  }

  function isTypingTarget(e) {
    const t = e.target;
    if (!t || !t.tagName) return false;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
  }

  // ---- capture mode ------------------------------------------------------------

  function startCapture(actionId, onDone) {
    capture = { actionId, onDone };
    CA.Events.emit('hotkeys', actionId);
  }

  function cancelCapture() {
    if (!capture) return;
    const { actionId } = capture;
    capture = null;
    CA.Events.emit('hotkeys', actionId);
  }

  function capturing() {
    return capture ? capture.actionId : null;
  }

  function handleCapture(e) {
    e.preventDefault();
    e.stopPropagation();
    if (MODIFIER_CODES.includes(e.code)) return; // wait for the actual key

    const { actionId, onDone } = capture;
    const noMods = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey;

    if (e.code === 'Escape' && noMods) {
      cancelCapture();
      return;
    }
    if ((e.code === 'Backspace' || e.code === 'Delete') && noMods) {
      capture = null;
      CA.Settings.setHotkey(actionId, '');
      if (onDone) onDone('', []);
      return;
    }

    const combo = fromEvent(e);
    if (!combo) return;
    if (RESERVED.includes(combo)) {
      CA.Util.notify('CookieMgr', `<b>${format(combo)}</b> is used by the game itself. Pick another key.`, [32, 17], 3);
      return; // keep listening
    }
    capture = null;
    const displaced = CA.Settings.setHotkey(actionId, combo);
    if (onDone) onDone(combo, displaced);
  }

  // ---- global listener -----------------------------------------------------------

  function onKeyDown(e) {
    if (capture) {
      handleCapture(e);
      return;
    }
    if (e.repeat || isTypingTarget(e)) return;
    if (typeof Game !== 'undefined' && Game.promptOn) return; // a game dialog is open

    const actionId = CA.Settings.actionForCombo(fromEvent(e));
    if (!actionId) return;
    e.preventDefault();
    CA.Actions.run(actionId);
  }

  function init() {
    // capture phase so binding mode can swallow the key before anything else reacts to it
    window.addEventListener('keydown', onKeyDown, true);
  }

  return { init, fromEvent, format, startCapture, cancelCapture, capturing };
})();

// ---- src/core/ascension.js -------------------------------------------
// Detects the moment the player ascends and emits an 'ascend' event.
//
// Primary signal: Game.Ascend(bypass) — the game calls it with a truthy argument once the
// player confirms the prompt. A light watchdog also checks Game.AscendTimer / Game.OnAscend
// in case another mod (or a future game version) starts the ascension some other way.

CA.Ascension = (() => {
  let ascending = false;

  function fire() {
    if (ascending) return;
    ascending = true;
    CA.Events.emit('ascend');
  }

  function watchdog() {
    const inAscension = Game.OnAscend || Game.AscendTimer > 0;
    if (inAscension) fire();
    else ascending = false;
  }

  function init() {
    CA.Util.wrap(Game, 'Ascend', (original, args, self) => {
      const result = original.apply(self, args);
      if (args[0]) fire();
      return result;
    });
    setInterval(watchdog, 500);
  }

  return { init };
})();

// ---- src/features/autoclickers.js ------------------------------------
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
      group: 'autoclickers',
      name: 'Turn off when ascending',
      desc: 'Switches every autoclicker off as soon as you ascend.',
      default: true,
    });
    CA.Settings.defineOption({
      key: 'rememberStates',
      group: 'autoclickers',
      name: 'Remember on/off states',
      desc: 'Restores which autoclickers were running when you reload the game.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'notifications',
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

// ---- src/ui/components.js --------------------------------------------
// HTML snippets for the CookieMgr panel. Everything is plain strings; interactivity
// is handled by one delegated click listener in menu.js via data-ca="…" attributes.

CA.UI = CA.UI || {};

CA.UI.C = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);

  /** Picture for a clicker/action: a standalone image, or a sprite from img/icons.png. */
  function icon({ img, icon }) {
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
      `<button type="button" class="ca-key" data-ca="bind" data-action="${esc(actionId)}" title="Click, then press a key to rebind"></button>` +
      `<button type="button" class="ca-key-clear" data-ca="unbind" data-action="${esc(actionId)}" title="Remove hotkey">&times;</button>` +
      '</span>'
    );
  }

  function button(label, attrs, extraClass = '') {
    return `<button type="button" class="ca-btn ${extraClass}" ${attrs}>${label}</button>`;
  }

  return { icon, toggle, hotkey, button, esc };
})();

// ---- src/ui/tab.js ---------------------------------------------------
// The little tab that sticks out of the left beam (between the cookie panel and the
// middle panel). Clicking it opens/closes the CookieMgr panel.

CA.UI = CA.UI || {};

CA.UI.Tab = (() => {
  let el = null;

  function create() {
    el = document.createElement('div');
    el.id = 'CookieMgrTab';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.title = 'CookieMgr';
    el.innerHTML =
      '<span class="ca-tab-cookie"></span>' +
      '<span class="ca-tab-label">CookieMgr</span>' +
      '<span class="ca-tab-badge" aria-label="active autoclickers"></span>';
    el.addEventListener('click', () => CA.UI.Menu.toggle());
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        CA.UI.Menu.toggle();
      }
    });
    (document.getElementById('game') || document.body).appendChild(el);
    update();
  }

  function update() {
    if (!el) return;
    el.classList.toggle('selected', CA.UI.Menu.isOpen());
    const n = CA.Autoclickers.activeCount();
    const badge = el.querySelector('.ca-tab-badge');
    badge.textContent = n ? String(n) : '';
    el.classList.toggle('active', n > 0);
    el.title = n ? `CookieMgr — ${n} autoclicker${n === 1 ? '' : 's'} running` : 'CookieMgr';
  }

  function init() {
    create();
    CA.Events.on('clickers', update);
  }

  return { init, update };
})();

// ---- src/ui/menu.js --------------------------------------------------
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

// ---- src/main.js -----------------------------------------------------
// Entry point: waits for the game, then registers CookieMgr through the official mod API
// (Game.registerMod), which gives us init/save/load hooks tied to the game's save file.

function removeLegacyBookmarklet() {
  // v0.1 was a bookmarklet that stored itself on window.cookieHelper — stop it if it's running.
  const h = window.cookieHelper;
  if (!h) return false;
  try {
    Object.values(h.timers || {}).forEach(clearInterval);
    if (h.key) removeEventListener('keydown', h.key);
  } catch (e) {
    /* ignore */
  }
  delete window.cookieHelper;
  return true;
}

// Settings saved before the rename live under the old mod id — carry them over once.
function migrateOldSaveData() {
  const OLD_ID = 'CookieAgent';
  const old = Game.modSaveData && Game.modSaveData[OLD_ID];
  if (!old) return;
  if (!Game.modSaveData[CA.ID]) mod.load(old);
  delete Game.modSaveData[OLD_ID];
}

const mod = {
  init() {
    const hadLegacy = removeLegacyBookmarklet();

    CA.Autoclickers.init();
    CA.Hotkeys.init();
    CA.Ascension.init();
    CA.UI.Menu.init();
    CA.UI.Tab.init();
    migrateOldSaveData();

    CA.Util.notify(
      `CookieMgr v${CA.VERSION} loaded`,
      hadLegacy ? 'Replaced the old v0.1 bookmarklet. Open the tab on the left beam for settings.' : 'Open the tab on the left beam for settings.',
      CA.ICON,
      4
    );
  },

  save() {
    return CA.Settings.serialize();
  },

  load(str) {
    const data = CA.Settings.deserialize(str);
    if (data && data.clickers && CA.Settings.get('rememberStates')) CA.Autoclickers.restore(data.clickers);
  },
};

function register() {
  Game.registerMod(CA.ID, mod);
}

if (window.CookieMgr) {
  if (typeof Game !== 'undefined' && Game.Notify) Game.Notify('CookieMgr', 'Already loaded — reload the page to load a new version.', CA.ICON, 3, 1);
} else {
  window.CookieMgr = CA; // handy for debugging from the console
  const start = () => {
    if (typeof Steam !== 'undefined') setTimeout(register, 2000); // same delay Cookie Monster uses on Steam
    else register();
  };
  if (typeof Game !== 'undefined' && Game.ready) start();
  else {
    const wait = setInterval(() => {
      if (typeof Game !== 'undefined' && Game.ready) {
        clearInterval(wait);
        start();
      }
    }, 250);
  }
}
})();
