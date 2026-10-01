// Loads Cookie Monster (https://github.com/CookieMonsterTeam/CookieMonster) on request, or
// automatically when CookieMgr starts. Its dist URL always serves the latest release, and it
// registers itself with the game as mod "CookieMonster" (verified against its built bundle),
// which is how we tell whether it's already running.

CA.CookieMonster = (() => {
  const URL = 'https://cookiemonsterteam.github.io/CookieMonster/dist/CookieMonster.js';
  let loading = false;

  const isLoaded = () =>
    typeof Game !== 'undefined' && !!((Game.mods && Game.mods.CookieMonster) || window.CookieMonsterData);

  /** Loads Cookie Monster unless it's already running (or already on its way). */
  function load() {
    if (isLoaded() || loading) return false;
    loading = true;
    Game.LoadMod(
      URL,
      () => {
        loading = false;
        CA.Events.emit('integrations', 'cookieMonster');
      },
      () => {
        loading = false;
        CA.Util.notify('CookieMgr', "Couldn't load Cookie Monster — check your connection.", CA.ICON, 4);
      }
    );
    CA.Events.emit('integrations', 'cookieMonster');
    return true;
  }

  function init() {
    CA.Settings.defineOption({
      key: 'cmAutoLoad',
      group: 'integrations',
      name: 'Load Cookie Monster on start-up',
      desc: 'Whenever CookieMgr starts, also load the latest Cookie Monster release — unless it is already running.',
      default: false,
    });
    // The game calls our load() (restoring saved settings) right after init(), synchronously,
    // so wait a moment before reading the setting — and give a separately-bookmarked Cookie
    // Monster a chance to register first so we don't load it twice.
    setTimeout(() => {
      if (CA.Settings.get('cmAutoLoad')) load();
    }, 1500);
  }

  return { init, load, isLoaded, isLoading: () => loading };
})();
