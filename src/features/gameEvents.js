// Feeds more of what happens in the game into the central event log (core/eventLog.js), beyond
// golden cookies (features/history.js) and stock trades (features/stockLog.js):
//
//   wrinkler      a wrinkler popped, with what it gave back
//   lump          sugar lumps harvested (and the cookies a caramelized/golden lump paid)
//   achievement   an achievement unlocked
//   effect        a golden cookie effect / buff started (logged by features/history.js)
//
// Wrinklers: the game pops them inside Game.UpdateWrinklers with nothing to hook, multiplying
// the cookies a wrinkler had sucked by a bonus and paying that out (verified in main.js). So we
// watch each wrinkler's `sucked` a few times a second, and when Game.wrinklersPopped goes up,
// whichever wrinkler just went back to phase 0 popped — its last `sucked` times the same bonus
// the game applies (Sacrilegious corruption, Dragon Guts, shiny ×3, Wrinklerspawn, Scorn) is the payout.

CA.GameEvents = (() => {
  const POLL_MS = 200;

  let lastPopped = null;
  let seen = []; // per wrinkler slot: { phase, sucked, type }

  const has = (name) => typeof Game.Has === 'function' && Game.Has(name);

  /** The multiplier main.js applies to a popped wrinkler's sucked cookies. */
  function popBonus(type) {
    let m = 1.1;
    if (has('Sacrilegious corruption')) m *= 1.05;
    if (typeof Game.auraMult === 'function') m *= 1 + Game.auraMult('Dragon Guts') * 0.2;
    if (type === 1) m *= 3;
    if (has('Wrinklerspawn')) m *= 1.05;
    if (Game.hasGod) {
      const lvl = Game.hasGod('scorn');
      if (lvl === 1) m *= 1.15;
      else if (lvl === 2) m *= 1.1;
      else if (lvl === 3) m *= 1.05;
    }
    return m;
  }

  function pollWrinklers() {
    const list = Game.wrinklers;
    if (!Array.isArray(list)) return;
    const popped = Game.wrinklersPopped || 0;
    if (lastPopped !== null && popped > lastPopped) {
      let found = 0;
      list.forEach((w, i) => {
        const before = seen[i];
        if (!before || !(before.phase > 0) || w.phase !== 0) return;
        found++;
        const cookies = before.sucked * popBonus(before.type);
        if (cookies > 0.5 || CA.Settings.get('logEmptyWrinklers')) {
          CA.EventLog.add({
            type: 'wrinkler',
            title: before.type === 1 ? 'Shiny wrinkler popped' : 'Wrinkler popped',
            text: cookies > 0.5 ? '' : 'It hadn’t eaten anything yet.',
            cookies,
            data: { shiny: before.type === 1, sucked: before.sucked },
          });
        }
      });
      // popped between two polls of ours (spawned and popped within 200ms): nothing to measure
      if (!found && CA.Settings.get('logEmptyWrinklers')) CA.EventLog.add({ type: 'wrinkler', title: 'Wrinkler popped', cookies: 0 });
    }
    lastPopped = popped;
    seen = list.map((w) => ({ phase: w.phase, sucked: w.sucked || 0, type: w.type }));
  }

  function watchLumps() {
    if (typeof Game.harvestLumps !== 'function') return;
    CA.Util.wrap(Game, 'harvestLumps', (original, args, self) => {
      const lumps = Game.lumps;
      const cookies = Game.cookies;
      const type = Game.lumpCurrentType;
      const result = original.apply(self, args);
      try {
        const got = (Game.lumps || 0) - (lumps || 0);
        const paid = Game.cookies - cookies;
        if (got > 0 || paid > 0) {
          const kind = ['', 'Bifurcated', 'Golden', 'Meaty', 'Caramelized'][type] || '';
          CA.EventLog.add({
            type: 'lump',
            title: `Harvested ${got} sugar lump${got === 1 ? '' : 's'}`,
            text: kind ? `${kind} lump` : '',
            cookies: paid > 0 ? paid : 0,
            data: { lumps: got, lumpType: type },
          });
        }
      } catch (e) {
        /* never break the game over a log entry */
      }
      return result;
    });
  }

  function watchAchievements() {
    if (typeof Game.Win !== 'function') return;
    CA.Util.wrap(Game, 'Win', (original, args, self) => {
      const what = args[0];
      const ach = typeof what === 'string' && Game.Achievements ? Game.Achievements[what] : null;
      const wasWon = ach ? ach.won : 1;
      const result = original.apply(self, args);
      try {
        if (ach && !wasWon && ach.won) {
          CA.EventLog.add({
            type: 'achievement',
            title: ach.shortName || ach.dname || ach.name || what,
            text: 'Achievement unlocked',
            data: { id: ach.id, icon: ach.icon },
          });
        }
      } catch (e) {
        /* ignore */
      }
      return result;
    });
  }

  function init() {
    CA.Settings.defineOption({
      key: 'logEmptyWrinklers',
      group: 'events',
      icon: 'wrinkler',
      name: 'Log empty wrinklers',
      desc: 'Also log wrinklers popped before they had eaten anything.',
      default: false,
    });
    CA.EventLog.defineType('wrinkler', { name: 'Wrinkler', icon: 'wrinkler', color: '#d97a9a', income: true });
    CA.EventLog.defineType('lump', { name: 'Sugar lump', icon: 'lump', color: '#f2b84b', income: true });
    CA.EventLog.defineType('achievement', { name: 'Achievement', icon: 'trophy', color: '#9be15d' });
    CA.EventLog.defineType('effect', { name: 'Effect', icon: 'sparkle', color: '#42a5f5' });
    watchLumps();
    watchAchievements();
    setInterval(pollWrinklers, POLL_MS);
  }

  return { init, popBonus };
})();
