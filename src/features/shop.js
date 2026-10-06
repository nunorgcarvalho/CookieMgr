// The building store ("shop"; CA.Store is the IndexedDB layer): sorting the building list
// (through Cookie Monster) and rounding bulk buys up to the next multiple.
//
// **Sort** — Cookie Monster can order the building list in the store; CookieMgr just flips its
// setting (Game.mods.cookieMonsterFramework…settings.SortBuildings — CM re-sorts on its next loop
// and saves it with its own settings). CM's values: 0 default order, 1 payback period of one,
// 2 payback period of the selected bulk amount, 3 price until the building's next achievement.
// We offer 2 (best buy for 1 / 10 / 100), 3 and 0. Without Cookie Monster the switch is disabled.
//
// **Round up** — with buy ×10 or ×100 selected, a click buys only what it takes to reach the next
// multiple: 37 owned, ×10 → buys 3 (to 40); 40 owned → buys 10. It wraps each building's buy()
// (the store calls it with no amount; anything passing an explicit amount is left alone) and
// getSumPrice(), which the store uses for the price it shows.

CA.Shop = (() => {
  const SORTS = [
    { v: 2, id: 'value', name: 'Best buy first', icon: 'dollar', desc: 'Cookie Monster’s order: shortest payback period for the amount you’re buying (×1, ×10 or ×100) first.' },
    { v: 3, id: 'achievement', name: 'Next achievement first', icon: 'trophy', desc: 'Cookie Monster’s order: cheapest to reach the next building-count achievement first.' },
    { v: 0, id: 'default', name: 'Game order', icon: 'sortList', desc: 'The game’s own order: Cursor, Grandma, Farm…' },
  ];
  const wrapped = new WeakSet();

  // ---- sort (Cookie Monster) ----------------------------------------------------------------

  /** Cookie Monster's settings object, or null when it isn't running. */
  function cmSettings() {
    const f = Game.mods && Game.mods.cookieMonsterFramework;
    const s = f && f.saveData && f.saveData.cookieMonsterMod && f.saveData.cookieMonsterMod.settings;
    return s && typeof s === 'object' ? s : null;
  }
  const canSort = () => !!cmSettings();
  /** The current sort ('value' | 'achievement' | 'default'); CM's "payback of one" shows as 'value'. */
  function sort() {
    const s = cmSettings();
    if (!s) return null;
    const v = Number(s.SortBuildings) || 0;
    return v === 1 || v === 2 ? 'value' : v === 3 ? 'achievement' : 'default';
  }
  function setSort(id) {
    const s = cmSettings();
    const def = SORTS.find((x) => x.id === id);
    if (!s || !def) return false;
    s.SortBuildings = def.v;
    if (typeof Game.RefreshStore === 'function') Game.RefreshStore();
    CA.Events.emit('shop');
    return true;
  }

  // ---- round up ---------------------------------------------------------------------------

  const roundUp = () => !!CA.Settings.get('roundUpBulk');
  /** How many a store click buys now: the bulk amount, or what's left to the next multiple of it. */
  function amountFor(b, bulk = Game.buyBulk) {
    if (!roundUp() || Game.buyMode !== 1 || (bulk !== 10 && bulk !== 100)) return bulk;
    return bulk - ((b.amount || 0) % bulk);
  }

  function wrap(b) {
    if (!b || wrapped.has(b) || typeof b.buy !== 'function') return;
    const buy = b.buy;
    b.buy = function (amount) {
      return buy.call(this, amount ? amount : amountFor(this));
    };
    if (typeof b.getSumPrice === 'function') {
      const sum = b.getSumPrice;
      b.getSumPrice = function (amount) {
        return sum.call(this, amount === Game.buyBulk ? amountFor(this, amount) : amount);
      };
    }
    wrapped.add(b);
  }

  function refreshStore() {
    Object.values(Game.Objects || {}).forEach((b) => b && typeof b.refresh === 'function' && b.refresh());
  }

  function setRoundUp(on) {
    CA.Settings.set('roundUpBulk', !!on);
  }

  function init() {
    CA.Settings.defineOption({
      key: 'roundUpBulk',
      group: 'store',
      icon: 'plus',
      name: 'Round bulk buys up',
      desc: 'With ×10 or ×100 selected, buy only what it takes to reach the next multiple (37 → 40, not 47). Also on the store’s side switch.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'storeSwitch',
      group: 'store',
      icon: 'toolbar',
      name: 'Store side switch',
      desc: 'Shows the building sort and round-up switches on the left edge of the store, next to the buildings.',
      default: true,
    });
    Object.values(Game.Objects || {}).forEach(wrap);
    CA.Events.on('settings', (k) => k === 'roundUpBulk' && refreshStore());
  }

  return { init, SORTS, canSort, sort, setSort, roundUp, setRoundUp, amountFor, cmSettings };
})();
