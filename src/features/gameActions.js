// The game-facing **actions** (core/actions.js) and **conditions** (core/conditions.js) macros
// are built from. Each action does one thing once and returns how many things it did.
// Spells live in features/grimoire.js.

CA.GameActions = (() => {
  const popShimmers = (filter) => {
    const list = (Game.shimmers || []).filter(filter);
    list.forEach((s) => s.pop());
    return list.length;
  };

  // Effect names as the game keys them in Game.buffs (the common golden-cookie ones).
  const BUFFS = [
    'Frenzy',
    'Click frenzy',
    'Elder frenzy',
    'Dragonflight',
    'Dragon Harvest',
    'Cookie storm',
    'Clot',
    'Cursed finger',
    'Everything must go',
    'Sugar blessing',
    'Devastation',
    'Sugar frenzy',
  ];
  const buffOptions = () => {
    const names = new Set(BUFFS);
    Object.keys(Game.buffs || {}).forEach((n) => names.add(n));
    return [...names].map((n) => ({ v: n, label: n }));
  };
  const isBuildingSpecial = (b) => b && b.type && b.type.name === 'building buff';

  const OPS = [
    { v: '>=', label: '≥' },
    { v: '<=', label: '≤' },
    { v: '>', label: '>' },
    { v: '<', label: '<' },
  ];
  const compare = (a, op, b) => (op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : a < b);

  function registerActions() {
    const A = CA.Actions.register;
    A({
      id: 'click.bigCookie',
      name: 'Click the big cookie',
      icon: 'cookie',
      group: 'Clicking',
      unit: 'clicks',
      // the game draws a falling cookie (prefs.particles) and a "+N" (prefs.numbers) per click;
      // these switch them off for CookieMgr's clicks only, leaving your own clicks as they are
      params: [
        {
          key: 'anim',
          label: 'Animation',
          type: 'select',
          default: 'default',
          options: () => [
            { v: 'default', label: 'cookie + number' },
            { v: 'noText', label: 'cookie, no number' },
            { v: 'none', label: 'none' },
          ],
        },
      ],
      describe: (p) => `Click the big cookie${p.anim === 'none' ? ' (no animation)' : p.anim === 'noText' ? ' (no numbers)' : ''}`,
      run: (p) => {
        const prefs = Game.prefs || {};
        const was = { particles: prefs.particles, numbers: prefs.numbers };
        if (p.anim === 'noText' || p.anim === 'none') prefs.numbers = 0;
        if (p.anim === 'none') prefs.particles = 0;
        try {
          Game.ClickCookie();
        } finally {
          prefs.particles = was.particles;
          prefs.numbers = was.numbers;
        }
        return 1;
      },
    });
    A({
      id: 'pop.golden',
      name: 'Pop golden cookies',
      icon: 'cookie',
      group: 'Shimmers',
      unit: 'popped',
      run: () => popShimmers((s) => s.type === 'golden' && !s.wrath),
    });
    A({
      id: 'pop.wrath',
      name: 'Pop wrath cookies',
      icon: 'cookie',
      group: 'Shimmers',
      unit: 'popped',
      run: () => popShimmers((s) => s.type === 'golden' && s.wrath),
    });
    A({
      id: 'pop.reindeer',
      name: 'Pop reindeer',
      icon: 'star',
      group: 'Shimmers',
      unit: 'popped',
      run: () => popShimmers((s) => s.type === 'reindeer'),
    });
    A({
      id: 'click.fortune',
      name: 'Click fortune news',
      icon: 'tag',
      group: 'Clicking',
      unit: 'fortunes',
      run: () => {
        if (!(Game.TickerEffect && Game.TickerEffect.type === 'fortune' && Game.tickerL)) return 0;
        Game.tickerL.click();
        return 1;
      },
    });
    A({
      id: 'pop.wrinklers',
      name: 'Pop wrinklers',
      icon: 'wrinkler',
      group: 'Shimmers',
      unit: 'popped',
      params: [
        {
          key: 'shiny',
          label: 'Shiny wrinklers',
          type: 'select',
          default: 'pop',
          options: () => [
            { v: 'pop', label: 'Pop them too' },
            { v: 'keep', label: 'Leave them alone' },
          ],
        },
      ],
      describe: (p) => (p.shiny === 'keep' ? 'Pop wrinklers (not shiny ones)' : 'Pop wrinklers'),
      run: (p) => {
        let n = 0;
        (Game.wrinklers || []).forEach((w) => {
          if (w.phase > 0 && w.hp > 0 && !(p.shiny === 'keep' && w.type === 1)) {
            w.hp = 0; // the game pops it on its next frame, paying out as usual
            n++;
          }
        });
        return n;
      },
    });
    A({
      id: 'stocks.trade',
      name: 'Trade stocks: buy rising, sell the rest',
      icon: 'stocks',
      group: 'Stock market',
      unit: 'trades',
      // buy: false → only sells what you hold when it stops rising, never buys
      params: [{ key: 'buy', label: 'Buy rising stocks', type: 'bool', default: true }],
      describe: (p) => (p.buy === false ? 'Trade stocks: sell what stops rising (no buying)' : 'Trade stocks: buy rising, sell the rest'),
      available: () => !!CA.Stocks.minigame(),
      run: (p) => CA.StockTrader.trade({ buy: p.buy !== false }),
    });
    A({
      id: 'stocks.sellAll',
      name: 'Sell all stocks',
      icon: 'dollar',
      group: 'Stock market',
      unit: 'sold',
      available: () => !!CA.Stocks.minigame(),
      run: () => CA.StockTrader.sellEverything(),
    });
    A({
      id: 'lump.harvest',
      name: 'Harvest the sugar lump',
      icon: 'lump',
      group: 'Other',
      unit: 'harvested',
      // ripe: always pays out. mature (an hour or so sooner): the game gives a 50% chance of nothing
      params: [
        {
          key: 'when',
          label: 'Harvest when',
          type: 'select',
          default: 'ripe',
          options: () => [
            { v: 'ripe', label: 'ripe (always pays)' },
            { v: 'mature', label: 'mature (50% chance)' },
          ],
        },
      ],
      describe: (p) => `Harvest the sugar lump once ${p.when === 'mature' ? 'mature (50%)' : 'ripe'}`,
      available: () => typeof Game.canLumps === 'function' && Game.canLumps(),
      run: (p) => {
        const age = Date.now() - (Game.lumpT || Date.now());
        if (!Game.lumpT || age < (p.when === 'mature' ? Game.lumpMatureAge : Game.lumpRipeAge)) return 0;
        Game.clickLump();
        return 1;
      },
    });
    const SEASONS = () =>
      Object.keys(Game.seasons || {}).map((k) => ({ v: k, label: Game.seasons[k].name }));
    A({
      id: 'season.keep',
      name: 'Keep a season going',
      icon: 'calendar',
      group: 'Other',
      unit: 'switched',
      params: [{ key: 'season', label: 'Season', type: 'select', default: 'christmas', options: SEASONS }],
      describe: (p) => `Keep ${(Game.seasons && Game.seasons[p.season] && Game.seasons[p.season].name) || 'a season'} going`,
      // the season switcher (a heavenly upgrade) puts the seasons' biscuits in the store
      available: () => typeof Game.Has === 'function' && Game.Has('Season switcher'),
      run: (p) => {
        const s = Game.seasons && Game.seasons[p.season];
        if (!s || Game.season === p.season) return 0;
        const up = Game.Upgrades[s.trigger];
        // the game unlocks it again (bought = 0) when a season ends or another starts
        if (!up || !up.unlocked || up.bought || !up.canBuy()) return 0;
        up.buy();
        return Game.season === p.season ? 1 : 0;
      },
    });
    const macroOptions = (pred) => () => CA.Macros.list().filter(pred).map((m) => ({ v: m.id, label: m.name }));
    A({
      id: 'macro.set',
      name: 'Switch a macro on or off',
      icon: 'bolt',
      group: 'Macros',
      params: [
        { key: 'macro', label: 'Macro', type: 'select', default: '', options: macroOptions((m) => m.mode !== 'once') },
        {
          key: 'to',
          label: 'Switch',
          type: 'select',
          default: 'on',
          options: () => [
            { v: 'on', label: 'On' },
            { v: 'off', label: 'Off' },
            { v: 'toggle', label: 'Toggle' },
          ],
        },
      ],
      describe: (p) => {
        const m = CA.Macros.get(p.macro);
        return `Switch ${m ? `“${m.name}”` : 'a macro'} ${p.to === 'toggle' ? 'on/off' : p.to}`;
      },
      run: (p) => {
        const m = CA.Macros.get(p.macro);
        if (!m) return 0;
        const on = p.to === 'toggle' ? !CA.Macros.isOn(m.id) : p.to === 'on';
        if (CA.Macros.isOn(m.id) === on) return 0;
        CA.Macros.set(m.id, on);
        return 1;
      },
    });
    A({
      id: 'macro.run',
      name: 'Run another macro once',
      icon: 'play',
      group: 'Macros',
      params: [{ key: 'macro', label: 'Macro', type: 'select', default: '', options: macroOptions(() => true) }],
      describe: (p) => {
        const m = CA.Macros.get(p.macro);
        return `Run ${m ? `“${m.name}”` : 'a macro'}`;
      },
      run: (p) => (CA.Macros.get(p.macro) ? CA.Macros.runOnce(p.macro) : 0),
    });
  }

  function registerConditions() {
    const C = CA.Conditions.register;
    C({
      id: 'buff',
      name: 'An effect is active',
      icon: 'sparkle',
      params: [{ key: 'name', label: 'Effect', type: 'select', default: 'Frenzy', options: buffOptions }],
      describe: (p) => `${p.name} is active`,
      test: (p) => {
        const b = Game.buffs && Game.buffs[p.name];
        return !!(b && b.time > 0);
      },
    });
    C({
      id: 'buildingSpecial',
      name: 'A building special is active',
      icon: 'sparkle',
      describe: () => 'a building special is active',
      test: () => Object.values(Game.buffs || {}).some((b) => isBuildingSpecial(b) && b.time > 0),
    });
    C({
      id: 'buffCount',
      name: 'Several effects at once',
      icon: 'sparkle',
      params: [{ key: 'n', label: 'At least', type: 'number', default: 2, min: 1 }],
      describe: (p) => `${p.n}+ effects are active`,
      test: (p) => Object.values(Game.buffs || {}).filter((b) => b && b.time > 0).length >= p.n,
    });
    C({
      id: 'shimmer',
      name: 'Something to pop is on screen',
      icon: 'cookie',
      params: [
        {
          key: 'type',
          label: 'What',
          type: 'select',
          default: 'golden',
          options: () => [
            { v: 'golden', label: 'Golden cookie' },
            { v: 'wrath', label: 'Wrath cookie' },
            { v: 'reindeer', label: 'Reindeer' },
          ],
        },
      ],
      describe: (p) => `a ${p.type === 'golden' ? 'golden cookie' : p.type === 'wrath' ? 'wrath cookie' : 'reindeer'} is on screen`,
      test: (p) =>
        (Game.shimmers || []).some((s) =>
          p.type === 'reindeer' ? s.type === 'reindeer' : s.type === 'golden' && !!s.wrath === (p.type === 'wrath')
        ),
    });
    C({
      id: 'state',
      name: 'A value crosses a threshold',
      icon: 'graphs',
      params: [
        {
          key: 'state',
          label: 'Value',
          type: 'select',
          default: 'cps',
          options: () =>
            CA.States.list()
              .filter((d) => d.kind !== 'flow')
              .map((d) => ({ v: d.id, label: d.name })),
        },
        { key: 'op', label: 'Is', type: 'select', default: '>=', options: () => OPS },
        { key: 'value', label: 'Than', type: 'number', default: 0 },
      ],
      describe: (p) => {
        const d = CA.States.get(p.state);
        const op = (OPS.find((o) => o.v === p.op) || OPS[0]).label;
        return `${d ? d.name : p.state} ${op} ${CA.UI.Plot.fmt.beautify(p.value)}`;
      },
      test: (p) => {
        const v = CA.States.value(p.state);
        return Number.isFinite(v) && compare(v, p.op, Number(p.value));
      },
    });
  }

  function init() {
    registerActions();
    registerConditions();
  }

  return { init, BUFFS };
})();
