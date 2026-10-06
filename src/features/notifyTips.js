// Tooltips on the game's notifications. When a notification is about an upgrade or an
// achievement (unlocked, dropped, found…), hovering it shows that upgrade's / achievement's own
// tooltip — the same one the store and the stats menu show (Game.crateTooltip). The game can attach
// a tooltip to its newest notification (Game.NotifyTooltip) but rarely does; this does it for every
// notification that names one, by wrapping Game.Notify.

CA.NotifyTips = (() => {
  let byName = null; // display name → { kind: 'upgrade' | 'achievement', id }

  function index() {
    if (byName) return byName;
    byName = new Map();
    Object.values(Game.UpgradesById || {}).forEach((u) => u && byName.set(String(u.dname || u.name), { kind: 'upgrade', id: u.id }));
    Object.values(Game.AchievementsById || {}).forEach((a) => a && byName.set(String(a.dname || a.name), { kind: 'achievement', id: a.id }));
    return byName;
  }

  const strip = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  /** The upgrade / achievement a notification is about: its title is the name, or its text names it. */
  function subjectOf(title, desc) {
    const map = index();
    const t = strip(title);
    if (map.has(t)) return map.get(t);
    const d = strip(desc);
    if (map.has(d)) return map.get(d);
    // "You also found <b>Wrinkler ambergris</b>!", "Unlocked Golden clover seed." …
    const bold = String(desc || '').match(/<(?:b|div)[^>]*>([^<]+)<\/(?:b|div)>/g) || [];
    for (const b of bold) {
      const n = strip(b);
      if (map.has(n)) return map.get(n);
    }
    return null;
  }

  function init() {
    if (typeof Game.Notify !== 'function' || Game.Notify.__caTips) return;
    const notify = Game.Notify;
    Game.Notify = function (title, desc, pic, quick, noLog) {
      const before = Game.noteId;
      const r = notify.apply(this, arguments);
      try {
        const note = Game.NotesById && Game.NotesById[Game.noteId - 1];
        // only for a note this call made, that the game didn't give a tooltip itself
        if (note && Game.noteId !== before && !note.tooltip && typeof Game.NotifyTooltip === 'function' && typeof Game.crateTooltip === 'function') {
          const s = subjectOf(title, desc);
          if (s) Game.NotifyTooltip(`function(){return Game.crateTooltip(Game.${s.kind === 'upgrade' ? 'UpgradesById' : 'AchievementsById'}[${s.id}]);}`);
        }
      } catch (e) {
        /* never break a notification over its tooltip */
      }
      return r;
    };
    Game.Notify.__caTips = true;
  }

  return { init, subjectOf };
})();
