// The Golden cookies widget (goldenCookies) — the Stats page's golden cookie numbers, chart and timer bars (ui/spawnView.js)
// on the left panel, with the same numbers (CA.Timers). Its settings pick the parts (Show):
//
//   Stats (numbers)   the statistics you tick: expected wait, within minute %, window, frequency, multiplier,
//                     median wait — named and explained (on hover) by CA.StatInfo
//   Graph (chart)     the odds of the next one over time, on one of two axes (`axis`): this cycle (its cumulative
//                     chance, a line sweeping across it at now) or from now (the odds ahead, its window and mean)
//   Effects (bars)    each effect running on the graph's axis, with its time left and the chance a golden
//                     cookie comes before it ends
//   Frequency Factors (helping)
//                     what makes them come more often: a bar each (upgrades, the garden, spirits, the dragon…),
//                     on a log scale so they add up to the multiplier
//
// Its settings (v3.41) are a live picker: a tile per part, drawn as the widget draws it — the graph on either
// axis, each statistic with its value now — lit while it's picked (the widgets engine's samples: ui/widgets.js).
//
// It replaces v3.38's three golden widgets — Next golden cookie, Golden timeline and Golden cookie frequency —
// whose saved widgets load as this one with the same parts (`legacy` below). Effect timers, a bar per
// effect running, stays its own widget: ui/effectTimers.js.
// It resizes freely (the chart is drawn at the widget's width) and opens the Stats page from its numbers.

CA.UI = CA.UI || {};

CA.UI.TimelineWidget = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const when = (s) => (!Number.isFinite(s) ? '—' : s <= 0 ? 'now' : s < 1 ? '<1s' : F().span(s));
  const pc = (p) => `${p >= 0.9995 ? 100 : p > 0 && p < 0.0005 ? '<0.1' : (p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
  const WIDTH = 280;
  const PARTS = [
    { v: 'numbers', label: 'Stats', tip: 'The statistics you tick under Stats' },
    { v: 'chart', label: 'Graph', tip: 'The odds of the next golden cookie over time, on the axis picked under Graph' },
    { v: 'bars', label: 'Effects', tip: 'A bar per effect running, on the graph’s axis: its time left and the chance a golden cookie comes before it ends' },
    { v: 'helping', label: 'Frequency Factors', tip: 'A bar for each thing making golden cookies come more often (upgrades, the garden, spirits, the dragon…), on a log scale so they add up to the multiplier' },
  ];
  const DEFAULT_PARTS = ['numbers', 'chart'];
  const AXES = [
    { v: 'cycle', label: 'This cycle', tip: 'The chance it has come, over this cycle — from the last one leaving to the latest it can come; a line sweeps across at now' },
    { v: 'now', label: 'From now', tip: 'The odds ahead: how likely each moment from now is, its window and the expected wait' },
  ];

  // the statistics (names and descriptions: CA.StatInfo) — 'frequency' is the multiplier (its key from before
  // v3.30.0, when it was called Frequency), 'every' the time between them
  const NUMS = [
    { v: 'next', stat: 'golden.wait' },
    { v: 'minute', stat: 'golden.minute' },
    { v: 'window', stat: 'golden.window' },
    { v: 'every', stat: 'golden.interval' },
    { v: 'frequency', stat: 'golden.frequency' },
    { v: 'median', stat: 'golden.median' },
  ];
  const numOptions = () => NUMS.map((x) => ({ v: x.v, label: CA.StatInfo.label(x.stat), tip: CA.StatInfo.desc(x.stat), sample: () => numSample(x.v) }));
  const DEFAULT_NUMS = ['next', 'minute', 'every', 'frequency'];

  // none picked shows none (since v3.41 — before, the defaults); a save with only parts that are gone (v3.12's
  // Force the Hand of Fate forecast) shows the defaults
  const partsOf = (inst) => {
    if (!Array.isArray(inst.stats)) return DEFAULT_PARTS;
    const saved = inst.stats.filter((p) => PARTS.some((x) => x.v === p));
    return saved.length || !inst.stats.length ? saved : DEFAULT_PARTS;
  };
  const numsOf = (inst) => (Array.isArray(inst.nums) ? inst.nums : DEFAULT_NUMS);
  const axisOf = (inst) => (inst.axis === 'now' ? 'now' : 'cycle');
  const widthOf = (inst) => Math.max(160, (inst.w || WIDTH) - 18);

  function numbersHtml(d, inst) {
    if (d.spawned) return '<div class="ca-tl-line"><b class="ca-tl-now">A golden cookie is on screen!</b></div>';
    const w = d.wait;
    const on = new Set(numsOf(inst));
    const why = d.factors.length ? ` Helping now: ${d.factors.map((x) => x.name).join(', ')}.` : '';
    const cells = {
      next: [when(w.mean), ` ± ${when(w.sd)}.`],
      minute: [pc(w.within(60)), ` This second: ${pc(w.hazard)}.`],
      window: [`${when(w.soonest)}–${when(w.latest)}`, ''],
      every: [when(d.next.mean), ''],
      frequency: [`×${Math.round(d.frequency * 100) / 100}`, why],
      median: [when(w.median), ''],
    };
    const cell = (x) => `<span data-tip="${esc(CA.StatInfo.desc(x.stat) + cells[x.v][1])}"><em>${esc(CA.StatInfo.label(x.stat))}</em><b>${cells[x.v][0]}</b></span>`;
    const h = NUMS.filter((x) => on.has(x.v))
      .map(cell)
      .join('');
    return h ? `<div class="ca-tl-nums" data-w-open="graphs:golden">${h}</div>` : '';
  }

  /** One statistic's value now, as its cell shows it (the picker's tile for it; its name is the tile's). */
  function numSample(v) {
    const d = CA.Timers.distribution('golden', 60);
    if (!d) return '<div class="ca-tl-nums"><span><b>—</b></span></div>';
    if (d.spawned) return '<div class="ca-tl-nums"><span><b class="ca-tl-now">on screen</b></span></div>';
    const w = d.wait;
    const val = { next: `${when(w.mean)} ± ${when(w.sd)}`, minute: pc(w.within(60)), window: `${when(w.soonest)}–${when(w.latest)}`, every: when(d.next.mean), frequency: `×${Math.round(d.frequency * 100) / 100}`, median: when(w.median) }[v];
    return `<div class="ca-tl-nums"><span><b>${val}</b></span></div>`;
  }

  /** ×2.37, ×12, ×1.5 */
  const times = (v) => `×${v >= 10 ? Math.round(v) : Math.round(v * 100) / 100}`;

  /** A bar for each thing helping — each a frequency (×2: twice as often; the game's own numbers are the
   *  times between), on a log scale so they add up to the whole: ×2 and ×2 fill as much as one ×4. */
  function helpingHtml(d) {
    const parts = d.factors.map((x) => ({ name: x.name, why: x.why, f: 1 / x.k })).sort((a, b) => b.f - a.f);
    const total = Number.isFinite(d.frequency) ? d.frequency : parts.reduce((a, x) => a * x.f, 1);
    const logTotal = Math.max(Math.log(total), parts.reduce((a, x) => a + Math.max(0, Math.log(x.f)), 0));
    const rows = parts
      .map((x) => {
        const w = logTotal > 0 ? Math.max(3, (Math.max(0, Math.log(x.f)) / logTotal) * 100) : 0;
        return (
          `<div class="ca-wfq-row${x.f < 1 ? ' slower' : ''}" data-tip="${esc(`${x.name} (${x.why}): ${times(x.f)} as often`)}">` +
          `<span class="ca-wfq-name">${esc(x.name)}</span><span class="ca-wfq-bar"><i style="width:${w.toFixed(1)}%"></i></span><b>${times(x.f)}</b></div>`
        );
      })
      .join('');
    return `<div class="ca-wfreq" data-w-open="graphs:golden">${rows || '<div class="ca-tl-line ca-tl-dim">Nothing is making them come more often yet — upgrades like Lucky day, a Golden Clover in the garden, Mokalsium… each shows up here.</div>'}</div>`;
  }

  /**
   * The graph and/or the effect bars: this cycle's odds with the now line sweeping across (the Stats page's
   * chart), or from now — the bars on the same axis; the bars alone on an axis as long as the longest effect.
   */
  function graphHtml(d, inst, parts, axis, width) {
    const effects = parts.includes('bars') ? CA.Timers.buffsWithGolden() : [];
    const wait = !d.spawned ? d.wait : null;
    const showChart = parts.includes('chart') && wait;
    if (showChart && axis === 'cycle') return CA.UI.SpawnView.cycleChart('golden', d, effects, { width, height: 74, hover: false, lane: 13 });
    if (showChart || effects.length) {
      const opts = { width, height: 74, hover: false, lane: 13, plot: !!showChart, next: !!wait && (showChart || parts.includes('numbers')) };
      if (!showChart) opts.span = Math.max(10, ...effects.map((e) => e.secs)) * 1.05;
      return CA.UI.SpawnView.chart('golden', showChart ? wait : opts.next ? wait : null, effects, opts);
    }
    if (parts.includes('bars') && !parts.includes('chart')) return '<div class="ca-tl-line ca-tl-dim">No effects running.</div>';
    return '';
  }

  function html(inst) {
    const parts = partsOf(inst);
    const d = CA.Timers.distribution('golden', 60);
    if (!d) return '<div class="ca-tl-w"><div class="ca-tl-line">No golden cookies: the Golden switch is on.</div></div>';
    let h = '';
    if (parts.includes('numbers')) h += numbersHtml(d, inst);
    h += graphHtml(d, inst, parts, axisOf(inst), widthOf(inst));
    if (parts.includes('helping')) h += helpingHtml(d);
    return `<div class="ca-tl-w">${h || '<div class="ca-tl-line ca-tl-dim">Pick what to show in its settings.</div>'}</div>`;
  }

  // ---- the settings' samples: each part (and each axis) as the widget draws it, at a tile's width
  const SAMPLE_W = 200;
  const OFF = '<div class="ca-tl-line ca-tl-dim">No golden cookies: the Golden switch is on.</div>';
  const ON_SCREEN = '<div class="ca-tl-line"><b class="ca-tl-now">A golden cookie is on screen!</b></div>';
  const withData = (fn) => (inst) => {
    const d = CA.Timers.distribution('golden', 60);
    return d ? fn(d, inst) : OFF;
  };
  const SAMPLES = {
    numbers: withData((d, inst) => numbersHtml(d, inst) || '<div class="ca-tl-line ca-tl-dim">None ticked under Stats.</div>'),
    chart: withData((d, inst) => graphHtml(d, inst, ['chart'], axisOf(inst), SAMPLE_W) || ON_SCREEN),
    bars: withData((d, inst) => graphHtml(d, inst, ['bars'], axisOf(inst), SAMPLE_W)),
    helping: withData((d) => helpingHtml(d)),
  };
  const axisSample = (axis) => withData((d, inst) => graphHtml(d, inst, ['chart'], axis, SAMPLE_W) || ON_SCREEN);

  // the parts each of v3.38's golden widgets showed (saved without settings = its defaults then), and
  // its name as the title, so you still know which is which (and its width then)
  const ALL_NUMS = NUMS.map((x) => x.v);
  const legacy = {
    goldenNext: (w) => ({ axis: 'cycle', stats: w.stats || ['numbers', 'chart'], nums: w.nums || ALL_NUMS, title: w.title || 'Next golden cookie', w: w.w || 260 }),
    goldenTimeline: (w) => ({ axis: 'now', stats: w.stats || ['numbers', 'chart', 'bars'], nums: w.nums || ALL_NUMS, title: w.title || 'Golden timeline', w: w.w || 300 }),
    goldenFrequency: (w) => ({ stats: ['numbers', 'helping'], nums: ['frequency', 'every'], title: w.title || 'Golden cookie frequency', w: w.w || 260 }),
  };

  /** The Stats page's ☆: the multiplier, the frequency and what's helping (v3.38's Golden cookie frequency). */
  const FREQUENCY_PRESET = { type: 'goldenCookies', stats: ['numbers', 'helping'], nums: ['frequency', 'every'] };

  function init() {
    CA.UI.Widgets.defineType({
      id: 'goldenCookies',
      name: 'Golden cookies',
      icon: 'sparkle',
      desc: 'The next golden cookie: the stats, graph, effects and frequency factors you pick in its settings. Add as many as you like.',
      group: 'golden',
      sprite: [8, 14],
      short: 'Stats, graph, effects — you pick',
      width: WIDTH,
      resize: 'free',
      single: false,
      html,
      legacy,
      settings: [
        { key: 'stats', label: 'Show', type: 'multi', default: DEFAULT_PARTS, options: () => PARTS.map((p) => ({ ...p, sample: SAMPLES[p.v] })) },
        { key: 'axis', label: 'Graph', type: 'select', default: 'cycle', options: () => AXES.map((a) => ({ ...a, sample: axisSample(a.v) })), when: (inst) => partsOf(inst).includes('chart') },
        { key: 'nums', label: 'Stats', type: 'multi', default: DEFAULT_NUMS, options: numOptions, when: (inst) => partsOf(inst).includes('numbers'), tile: 'small' },
      ],
    });
  }

  return { init, html, PARTS, NUMS, FREQUENCY_PRESET };
})();
