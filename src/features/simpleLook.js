// Simple cookie background (option simpleLook): turns off the game's own visual extras around the big
// cookie — the circling cursors, falling cookies and season snow/hearts, the cookies and "+N" numbers
// that pop out of each click (yours and the autoclickers'), the cookie's flares and sparkles, and the
// milk. These are the game's Options switches (Game.prefs cursors/particles/numbers/milk): turning it
// on remembers how they were (option simpleLookWas) and switches them off; turning it off puts them
// back. The background picture is left as it is.

CA.SimpleLook = (() => {
  const PREFS = ['cursors', 'particles', 'numbers', 'milk'];

  const on = () => !!CA.Settings.get('simpleLook');

  /** The prefs as they were before it was turned on ({} when nothing is remembered). */
  function remembered() {
    try {
      return JSON.parse(CA.Settings.get('simpleLookWas') || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function refreshOptions() {
    if (Game.onMenu === 'prefs' && typeof Game.UpdateMenu === 'function') Game.UpdateMenu();
  }

  /** Brings the game's prefs in line with the option. */
  function apply() {
    const prefs = Game.prefs;
    if (!prefs) return;
    const was = remembered();
    if (on()) {
      if (!Object.keys(was).length) CA.Settings.set('simpleLookWas', JSON.stringify(Object.fromEntries(PREFS.map((k) => [k, prefs[k] ? 1 : 0]))));
      if (PREFS.every((k) => !prefs[k])) return;
      PREFS.forEach((k) => (prefs[k] = 0));
    } else {
      if (!Object.keys(was).length) return;
      PREFS.forEach((k) => {
        if (k in was) prefs[k] = was[k];
      });
      CA.Settings.set('simpleLookWas', '');
    }
    refreshOptions();
  }

  function toggle() {
    CA.Settings.set('simpleLook', !on());
  }

  function init() {
    CA.Settings.defineOption({
      key: 'simpleLook',
      group: 'general',
      icon: 'sparkle',
      name: 'Simple cookie background',
      desc: 'Turns off the extras around the big cookie: the circling cursors, falling cookies and season snow, the cookies and numbers clicks pop out, the flares and the milk. The background stays; turning it off puts the game’s own settings back.',
      default: false,
    });
    CA.Settings.defineOption({ key: 'simpleLookWas', group: 'ui', name: 'Game settings before Simple cookie background', desc: '', default: '' });
    CA.Hotkeys.register({ id: 'look.simple', name: 'Simple cookie background on / off', group: 'general', defaultKey: '', run: toggle });
    CA.Events.on('settings', (key) => {
      if (key === 'simpleLook' || key == null) apply();
    });
    apply();
  }

  return { init, apply, toggle, PREFS };
})();
