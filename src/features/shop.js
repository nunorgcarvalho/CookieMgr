// The building store ("shop"; CA.Store is the IndexedDB layer): sorting the building list and
// rounding bulk buys up to the next multiple.
//
// **Sort** — the order the store lists buildings in (ui/storeBar.js lays the rows out in it):
//   default       the game's own order: Cursor, Grandma, Farm…
//   value         best buy first: by payback period colour, then payback period (features/payback.js),
//                 for what a click buys now — ×1, ×10, ×100, or to the next multiple with Round to
//                 multiples on (Cookie Monster's "PP of selected bulk mode")
//   achievement   cheapest to reach the building's next achievement first; buildings more than 100
//                 away from one last, in the game's order
// While the store sells, it's the game's order.
//
// **Round to multiples** — with ×10 or ×100 selected, a click stops at a multiple of it:
//   buying, the next one up: 37 owned, ×10 → buys 3 (to 40); 40 owned → buys 10
//   selling, the next one down: 37 owned, ×10 → sells 7 (to 30); 40 owned → sells 10
// It wraps each building's buy() (the store calls it with no amount) and sell() (the store's sell
// mode calls it with exactly Game.buyBulk), and the two price functions the store shows prices with
// (getSumPrice, getReverseSumPrice). Explicit amounts from anything else are left alone.

CA.Shop = (() => {
  const SORTS = [
    { id: 'default', name: 'Default', icon: 'sortList', desc: 'The game’s own order: Cursor, Grandma, Farm…' },
    { id: 'value', name: 'Best buy', icon: 'dollar', desc: 'Shortest payback period first, for what a click buys now (×1, ×10 or ×100).' },
    { id: 'achievement', name: 'Achievement', icon: 'trophy', desc: 'Cheapest to reach the next building-count achievement first.' },
  ];
  const wrapped = new WeakSet();

  // ---- sort ------------------------------------------------------------------------------

  const canSort = () => true;
  /** The current sort: 'default' | 'value' | 'achievement'. */
  const sort = () => (SORTS.some((s) => s.id === CA.Settings.get('storeSort')) ? CA.Settings.get('storeSort') : 'default');
  function setSort(id) {
    if (!SORTS.some((s) => s.id === id)) return false;
    CA.Settings.set('storeSort', id);
    CA.Events.emit('shop');
    return true;
  }
  /** The buildings in the order the store should list them (names). */
  function order() {
    const all = Object.values(Game.Objects || {}).sort((a, b) => a.id - b.id);
    const s = sort();
    if (s === 'default' || Game.buyMode !== 1) return all.map((b) => b.name);
    if (s === 'achievement') {
      const price = (b) => {
        const x = CA.Payback.nextAchievement(b.name);
        return x.n <= 100 ? x.price : Infinity;
      };
      return all
        .map((b) => ({ b, p: price(b) }))
        .sort((a, b) => (a.p === b.p ? a.b.id - b.b.id : a.p - b.p))
        .map((x) => x.b.name);
    }
    const t = CA.Payback.table({ staleMs: 2000 }); // redrawn every half second: a table up to 2 s old will do
    const C = CA.Payback.COLOURS;
    return all
      .map((b) => {
        const bulk = Game.buyBulk === 10 || Game.buyBulk === 100 ? Game.buyBulk : 1;
        const n = amountFor(b, bulk) || 1;
        const row = t.buildings[n] && t.buildings[n][b.name];
        const price = row ? row.price : CA.Payback.sumPrice(b, n);
        const v = row ? row.pp : CA.Payback.pp(price, CA.Payback.buildingBonus(b.name, n));
        return { b, v, c: C.indexOf(row ? row.colour : t.colourOf(v, price)) };
      })
      .sort((a, b) => (a.c === b.c ? a.v - b.v || a.b.id - b.b.id : a.c - b.c))
      .map((x) => x.b.name);
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
      desc: 'A small toolbar along the bottom of the store: building sort and rounding to multiples.',
      default: true,
    });
    CA.Settings.defineOption({ key: 'storeSort', group: 'store-hidden', name: 'Building sort', desc: '', default: 'default' });
    Object.values(Game.Objects || {}).forEach(wrap);
    CA.Events.on('settings', (k) => k === 'roundUpBulk' && refreshStore());
  }

  return { init, SORTS, canSort, sort, setSort, order, roundUp, setRoundUp, amountFor };
})();
