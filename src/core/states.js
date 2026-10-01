// Registry of **states**: named values CookieMgr can read from the game at any moment. Plots
// are just ways of drawing recorded states, and (from v2) macro conditions test them.
//
//   CA.States.define({
//     id: 'cps',                 // stable — it's a field name in recorded frames
//     name: 'CpS', unit: '/s',   // for UI
//     kind: 'gauge',             // 'gauge'   a level (bank, CpS)          — downsampled by mean
//                                // 'counter' a running total (cookies baked) — downsampled by last value
//                                // 'flow'    an amount during one frame (earned from clicks) — summed
//     record: true,              // sample it into the recorder (false = live-only, e.g. conditions)
//     get(ctx) { ... },          // returns a number; ctx = { dt, prev, frame, events } (see recorder)
//   });
//
// Flows are computed after gauges and counters, so a flow's get() can compare ctx.frame (this
// frame's gauges/counters so far) against ctx.prev (the previous frame).

CA.States = (() => {
  const defs = [];
  const byId = {};
  const AGG = { gauge: 'mean', counter: 'last', flow: 'sum' };

  function define(def) {
    if (byId[def.id]) throw new Error(`State "${def.id}" already defined`);
    const d = { record: true, unit: '', group: 'game', kind: 'gauge', ...def };
    d.agg = d.agg || AGG[d.kind] || 'mean';
    defs.push(d);
    byId[d.id] = d;
    return d;
  }

  const get = (id) => byId[id] || null;
  const list = () => defs.slice();
  /** Recorded states in evaluation order: gauges and counters first, then flows. */
  const recorded = () => defs.filter((d) => d.record && d.kind !== 'flow').concat(defs.filter((d) => d.record && d.kind === 'flow'));

  /** Reads one state now; undefined if it isn't defined or its getter throws. */
  function value(id, ctx) {
    const d = byId[id];
    if (!d) return undefined;
    try {
      return d.get(ctx || {});
    } catch (e) {
      return undefined;
    }
  }

  return { define, get, list, recorded, value };
})();
