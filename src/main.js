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

let loaded = false;

const mod = {
  init() {
    const hadLegacy = removeLegacyBookmarklet();

    // data backbone first: the event log and states must exist before the recorder's first tick
    CA.EventLog.init();
    CA.GameActions.init(); // actions + conditions, then the macros built from them
    CA.Macros.init();
    CA.Grimoire.init();
    CA.Garden.init();
    CA.GardenHistory.init();
    CA.Shop.init();
    CA.AutoBuy.init();
    CA.Seasons.init();
    CA.Stocks.init();
    CA.StockLog.init();
    CA.History.init();
    CA.GameStates.init();
    CA.Recorder.init();
    CA.GameEvents.init();
    CA.NotifyTips.init();
    CA.UI.Graphs.init();
    CA.UI.EventsPage.init();
    CA.UI.MacrosPage.init();
    CA.UI.Widgets.init();
    CA.UI.WizardPage.init();
    CA.UI.GardenPage.init();
    CA.UI.PantheonPage.init();
    CA.UI.StoreBar.init();
    CA.UI.StockGraph.init();
    CA.UI.StockPerf.init();
    CA.UI.StockLog.init();
    CA.UI.BankToolbar.init();
    CA.Hotkeys.init();
    CA.Ascension.init();
    CA.UI.Menu.init();
    CA.UI.Tab.init();
    CA.UI.Tips.init();
    setInterval(() => CA.Util.unshift(), 2000); // see CA.Util.unshift
    CA.Update.init();
    CA.CookieMonster.init();
    migrateOldSaveData();
    CA.Settings.startAutoPersist();

    CA.Util.notify(
      `CookieMgr v${CA.VERSION} loaded`,
      hadLegacy
        ? 'Replaced the old v0.1 bookmarklet. Open the tab on the left beam for settings.'
        : 'Open the tab on the left beam for settings.',
      CA.ICON,
      4
    );
  },

  save() {
    return CA.Settings.serialize();
  },

  load(str) {
    loaded = true;
    // Prefer our own localStorage mirror when we have one — it's updated the moment anything
    // changes, while the game's save can be up to 60s stale or skipped by a quick reload.
    // Read it first: deserializing re-mirrors the current, not-yet-restored state over it.
    const local = CA.Settings.localPayload();
    const data = (local && CA.Settings.deserialize(local)) || CA.Settings.deserialize(str);
    if (!data) return;
    CA.Macros.load(data.macros);
    CA.UI.Widgets.load(data.widgets);
    CA.Garden.load(data.garden);
    if (!CA.Settings.get('rememberStates')) return;
    if (Array.isArray(data.running)) CA.Macros.restore(data.running);
    else {
      // saved by v1.x: { clickers: { bigCookie: true, … }, stockTrader: true }
      const ids = Object.keys(data.clickers || {}).filter((id) => data.clickers[id] === true);
      if (data.stockTrader === true) ids.push('stockTrader');
      CA.Macros.restore(ids);
    }
  },
};

function register() {
  Game.registerMod(CA.ID, mod);
  // The game only calls load() when its save already holds data for this mod (main.js:
  // `if (mod.load && Game.modSaveData[id]) mod.load(...)`), and it only autosaves once a minute.
  // Without this, a refresh before that first save skipped our local mirror entirely and started
  // from defaults — and the next change then overwrote the mirror with them.
  if (!loaded) mod.load('');
}

if (window.CookieMgr) {
  if (typeof Game !== 'undefined' && Game.Notify)
    Game.Notify('CookieMgr', 'Already loaded — reload the page to load a new version.', CA.ICON, 3, 1);
} else {
  window.CookieMgr = CA; // handy for debugging from the console
  const start = () => {
    if (typeof Steam !== 'undefined')
      setTimeout(register, 2000); // same delay Cookie Monster uses on Steam
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
