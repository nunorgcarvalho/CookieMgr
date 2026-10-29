// Detects the moment the player ascends and emits an 'ascend' event.
//
// Primary signal: Game.Ascend(bypass) — the game calls it with a truthy argument once the
// player confirms the prompt. A light watchdog also checks Game.AscendTimer / Game.OnAscend
// in case another mod (or a future game version) starts the ascension some other way.
//
// times() lists every ascension cookieMgr knows of — the ones it saw (the event log), plus the
// start of this run (Game.startDate) when that ascension happened while it wasn't watching — for
// the charts' ascension lines and their "Since last ascension" window.

CA.Ascension = (() => {
  let ascending = false;

  function fire() {
    if (ascending) return;
    ascending = true;
    CA.Events.emit('ascend');
  }

  /** Whether an ascension is under way (the screen, or its animation). */
  const inProgress = () => !!(Game.OnAscend || Game.AscendTimer > 0);

  function watchdog() {
    if (inProgress()) fire();
    else ascending = false;
  }

  const MINUTE = 60 * 1000;
  const DAY = 24 * 60 * MINUTE;

  /** Every known ascension, oldest first: { t (wall ms), a (active-play ms, core/recorder.js) }. */
  function times() {
    const all = CA.EventLog.list(['ascend']).map((e) => ({ t: e.t, a: e.a }));
    // this run's start is an ascension too (none before the first run); the log already has it
    // when cookieMgr saw it begin, up to a day earlier (the ascension screen lasts until Reincarnate)
    const start = Game.resets > 0 ? Number(Game.startDate) || 0 : 0;
    if (start > 0 && start <= Date.now() && !all.some((x) => x.t <= start + MINUTE && x.t > start - DAY)) {
      all.push({ t: start, a: CA.Recorder.activeAt(start) });
      all.sort((x, y) => x.t - y.t);
    }
    return all;
  }

  /** The latest ascension ({ t, a }), or null when there hasn't been one. */
  function last() {
    const all = times();
    return all.length ? all[all.length - 1] : null;
  }

  function init() {
    CA.Util.wrap(Game, 'Ascend', (original, args, self) => {
      const result = original.apply(self, args);
      if (args[0]) fire();
      return result;
    });
    setInterval(watchdog, 500);
  }

  return { inProgress, times, last, init };
})();
