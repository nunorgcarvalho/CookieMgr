// The building store ("shop"; CA.Store is the IndexedDB layer): sorting the building list
// (through Cookie Monster) and rounding bulk buys up to the next multiple.
//
// **Sort** — Cookie Monster can order the building list in the store; CookieMgr just flips its
// setting (Game.mods.cookieMonsterFramework…settings.SortBuildings — CM re-sorts on its next loop
// and saves it with its own settings). CM's values: 0 default order, 1 payback period of one,
// 2 payback period of the selected bulk amount, 3 price until the building's next achievement.
// We offer 2 (best buy for 1 / 10 / 100), 3 and 0. Without Cookie Monster the switch is disabled.
//
// **Round to multiples** — with ×10 or ×100 selected, a click stops at a multiple of it:
//   buying, the next one up: 37 owned, ×10 → buys 3 (to 40); 40 owned → buys 10
//   selling, the next one down: 37 owned, ×10 → sells 7 (to 30); 40 owned → sells 10
// It wraps each building's buy() (the store calls it with no amount) and sell() (the store's sell
// mode calls it with exactly Game.buyBulk), and the two price functions the store shows prices with
// (getSumPrice, getReverseSumPrice). Explicit amounts from anything else are left alone.

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
  /** How many a store click buys (or sells) now: the bulk amount, or what it takes to reach a multiple of it. */
  function amountFor(b, bulk = Game.buyBulk) {
    if (!roundUp() || (bulk !== 10 && bulk !== 100)) return bulk;
    const over = (b.amount || 0) % bulk;
    if (Game.buyMode === 1) return bulk - over;
    if (Game.buyMode === -1) return over || bulk;
    return bulk;
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
        return sum.call(this, amount === Game.buyBulk && Game.buyMode === 1 ? amountFor(this, amount) : amount);
      };
    }
    if (typeof b.sell === 'function') {
      const sell = b.sell;
      b.sell = function (amount, bypass) {
        return sell.call(this, amount === Game.buyBulk && Game.buyMode === -1 ? amountFor(this, amount) : amount, bypass);
      };
    }
    if (typeof b.getReverseSumPrice === 'function') {
      const rev = b.getReverseSumPrice;
      b.getReverseSumPrice = function (amount) {
        return rev.call(this, amount === Game.buyBulk && Game.buyMode === -1 ? amountFor(this, amount) : amount);
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
      name: 'Round to multiples',
      desc: 'With ×10 or ×100 selected, buying stops at the next multiple (37 → 40, not 47) and selling at the one below (37 → 30). Also on the store toolbar.',
      default: false,
    });
    CA.Settings.defineOption({
      key: 'storeSwitch',
      group: 'store',
      icon: 'toolbar',
      name: 'Store toolbar',
      desc: 'A small toolbar along the bottom of the store: building sort (with Cookie Monster) and rounding to multiples.',
      default: true,
    });
    Object.values(Game.Objects || {}).forEach(wrap);
    CA.Events.on('settings', (k) => k === 'roundUpBulk' && refreshStore());
  }

  return { init, SORTS, canSort, sort, setSort, roundUp, setRoundUp, amountFor, cmSettings };
})();
