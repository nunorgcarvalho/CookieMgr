// What each statistic is: a short label (what a setting, a column or a tile calls it) and a description
// (what hovering it says). One place, so every view that shows a statistic names and explains it the same.
//
//   CA.StatInfo.define(id, { label, desc })   add one (or replace it)
//   CA.StatInfo.get(id)                       { id, label, desc }, or null
//   CA.StatInfo.label(id) / desc(id)          its label / description ('' if unknown)
//
// Plain data: no game access, so core, features and UI can all use it.

CA.StatInfo = (() => {
  const info = {};

  function define(id, d) {
    info[id] = { id, label: d.label || id, desc: d.desc || '' };
    return info[id];
  }
  const get = (id) => info[id] || null;
  const label = (id) => (info[id] ? info[id].label : '');
  const desc = (id) => (info[id] ? info[id].desc : '');

  // ---- golden cookies (CA.Timers.distribution('golden'); the Stats page and the Golden cookies widget)
  define('golden.wait', { label: 'Expected wait', desc: 'How long until the next golden cookie, on average (the mean), from now. It counts down as the cycle goes on.' });
  define('golden.minute', { label: 'Within minute %', desc: 'The chance the next golden cookie comes within the next minute.' });
  define('golden.window', { label: 'Window', desc: 'The soonest the next golden cookie can come, and the latest (the game’s minimum and maximum time, from now).' });
  define('golden.interval', { label: 'Frequency', desc: 'The time between golden cookies on average with what’s helping now, from one leaving to the next coming. It doesn’t count down.' });
  define('golden.frequency', { label: 'Multiplier', desc: 'How many times more often golden cookies come than with nothing helping (no upgrades, garden, spirits or aura): ×2 with Lucky day, ×4 with Serendipity too.' });
  define('golden.median', { label: 'Median wait', desc: 'Even odds the next golden cookie has come by then, from now.' });

  // ---- the garden (the Chart widget's Stats; each plant effect, 'garden.<effect>', is defined with the
  // effects in features/gardenHistory.js)
  define('garden.plants', { label: 'Plants', desc: 'How many plants are in your garden now, at any stage.' });
  define('garden.mature', { label: 'Mature', desc: 'How many of your plants are mature now (the ones whose effects are at full strength and that can be harvested for their rewards).' });
  define('garden.nextTick', { label: 'Next tick', desc: 'How long until the next garden tick, when plants grow, spread and mutate.' });

  // ---- payback periods (features/payback.js — the modes are statistics)
  define('payback.period', { label: 'Payback period', desc: 'How long until a purchase has paid for itself: the time to afford it at your income, plus its price ÷ what it adds to that income. Your income depends on the payback mode.' });
  define('payback.afford', { label: 'Time to afford', desc: 'How long until your bank reaches its price, at your income in the payback mode (0 when you can afford it now).' });
  define('payback.earnBack', { label: 'Earn back', desc: 'How long what it adds takes to make its price back: price ÷ gain, in the payback mode.' });
  define('payback.income', { label: 'Income', desc: 'What payback periods count in: cookies a second, as the payback mode in use counts them.' });
  define('payback.gain', { label: 'Gain', desc: 'What a purchase adds to your income, as the payback mode counts it.' });

  return { define, get, label, desc };
})();
