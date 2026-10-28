// The Golden cookies widget (goldenCookies) — the Stats page's golden cookie numbers, chart and timer bars (ui/spawnView.js)
// on the left panel, with the same numbers (CA.Timers). Its settings pick the parts:
//
//   numbers   each switched on or off: next in (the expected wait), the median, the chance within a minute,
//             the window (soonest – latest), the multiplier (× vs nothing helping), the frequency (one
//             every …, on average)
//   chart     the odds of the next one over time, on one of two axes (`axis`): this cycle (its cumulative
//             chance, a line sweeping across it at now) or from now (the odds ahead, its window and mean)
//   bars      effect timers on the chart's axis: each effect running with its time left and the chance a
//             golden cookie comes before it ends
//   helping   what makes them come more often: a bar each (upgrades, the garden, spirits, the dragon…), on a
//             log scale so they add up to the multiplier
//
// It replaces v3.37's three golden widgets — Next golden cookie, Golden timeline and Golden cookie frequency —
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
    { v: 'numbers', label: 'Numbers (pick which below)' },
    { v: 'chart', label: 'Chart: the odds of the next one' },
    { v: 'bars', label: 'Effect timers on the chart’s axis' },
    { v: 'helping', label: 'What’s helping (a bar each)' },
  ];
  const DEFAULT_PARTS = ['numbers', 'chart'];
  const AXES = [
    { v: 'cycle', label: 'This cycle (a line sweeps across it)' },
    { v: 'now', label: 'From now (a timeline)' },
  ];

  // the numbers — 'frequency' is the multiplier (its key from before v3.30.0, when it was called
  // Frequency), 'every' the time between them
  const NUMS = [
    { v: 'next', label: 'Next in (the expected wait)' },
    { v: 'median', label: 'Median' },
    { v: 'minute', label: 'Chance within a minute' },
    { v: 'window', label: 'Window (soonest – latest)' },
    { v: 'frequency', label: 'Multiplier (× vs nothing helping)' },
    { v: 'every', label: 'Frequency (one every …, on average)' },
  ];
  const DEFAULT_NUMS = ['next', 'minute', 'frequency', 'every'];

  // (a part saved that's gone — v3.12's Force the Hand of Fate forecast — is left out)
  const partsOf = (inst) => {
    const saved = Array.isArray(inst.stats) ? inst.stats.filter((p) => PARTS.some((x) => x.v === p)) : [];
    return saved.length ? saved : DEFAULT_PARTS;
  };
  const numsOf = (inst) => (Array.isArray(inst.nums) ? inst.nums : DEFAULT_NUMS);
  const axisOf = (inst) => (inst.axis === 'now' ? 'now' : 'cycle');
  const widthOf = (inst) => Math.max(160, (inst.w || WIDTH) - 18);

  function numbersHtml(d, inst) {
    if (d.spawned) return '<div class="ca-tl-line"><b class="ca-tl-now">A golden cookie is on screen!</b></div>';
    const w = d.wait;
    const on = new Set(numsOf(inst));
    const cells = {
      next: `<span data-tip="On average (the mean), ± ${esc(when(w.sd))}"><em>next in</em><b>${when(w.mean)}</b></span>`,
      median: `<span data-tip="Even odds by then"><em>median</em><b>${when(w.median)}</b></span>`,
      minute: `<span data-tip="The chance one comes within a minute (this second: ${esc(pc(w.hazard))})"><em>≤ 1 min</em><b>${pc(w.within(60))}</b></span>`,
      window: `<span data-tip="The soonest it can come, and the latest"><em>window</em><b>${when(w.soonest)}–${when(w.latest)}</b></span>`,
      frequency: `<span data-tip="${esc(`How many times more often golden cookies come than with nothing helping (no upgrades, garden, spirits, aura…)${d.factors.length ? `: ${d.factors.map((x) => x.name).join(', ')}` : ''} — counted from the next one`)}"><em>multiplier</em><b>×${Math.round(d.frequency * 100) / 100}</b></span>`,
      every: `<span data-tip="One golden cookie every ${esc(when(d.next.mean))} on average with what’s helping now (from one leaving to the next coming) — it doesn’t count down"><em>frequency</em><b>${when(d.next.mean)}</b></span>`,
    };
    const h = NUMS.filter((x) => on.has(x.v))
      .map((x) => cells[x.v])
      .join('');
    return h ? `<div class="ca-tl-nums" data-w-open="stats">${h}</div>` : '';
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
    return `<div class="ca-wfreq" data-w-open="stats">${rows || '<div class="ca-tl-line ca-tl-dim">Nothing is making them come more often yet — upgrades like Lucky day, a Golden Clover in the garden, Mokalsium… each shows up here.</div>'}</div>`;
  }

  function html(inst) {
    const parts = partsOf(inst);
    const d = CA.Timers.distribution('golden', 60);
    if (!d) return '<div class="ca-tl-w"><div class="ca-tl-line">No golden cookies: the Golden switch is on.</div></div>';
    const effects = parts.includes('bars') ? CA.Timers.buffsWithGolden() : [];
    let h = '';
    if (parts.includes('numbers')) h += numbersHtml(d, inst);
    const wait = !d.spawned ? d.wait : null;
    const showChart = parts.includes('chart') && wait;
    if (showChart && axisOf(inst) === 'cycle')
      // this cycle's odds, the now line sweeping across (the Stats page's chart)
      h += CA.UI.SpawnView.cycleChart('golden', d, effects, { width: widthOf(inst), height: 74, hover: false, lane: 13 });
    else if (showChart || effects.length) {
      // the bars alone: an axis as long as the longest effect; with the chart, the chart's
      const opts = { width: widthOf(inst), height: 74, hover: false, lane: 13, plot: !!showChart, next: !!wait && (showChart || parts.includes('numbers')) };
      if (!showChart) opts.span = Math.max(10, ...effects.map((e) => e.secs)) * 1.05;
      h += CA.UI.SpawnView.chart('golden', showChart ? wait : opts.next ? wait : null, effects, opts);
    } else if (parts.includes('bars') && !parts.includes('chart')) h += '<div class="ca-tl-line ca-tl-dim">No effects running.</div>';
    if (parts.includes('helping')) h += helpingHtml(d);
    return `<div class="ca-tl-w">${h || '<div class="ca-tl-line ca-tl-dim">Pick what to show in its settings.</div>'}</div>`;
  }

  // the parts each of v3.37's golden widgets showed (saved without settings = its defaults then), and
  // its name as the title, so you still know which is which (and its width then)
  const ALL_NUMS = NUMS.map((x) => x.v);
  const legacy = {
    goldenNext: (w) => ({ axis: 'cycle', stats: w.stats || ['numbers', 'chart'], nums: w.nums || ALL_NUMS, title: w.title || 'Next golden cookie', w: w.w || 260 }),
    goldenTimeline: (w) => ({ axis: 'now', stats: w.stats || ['numbers', 'chart', 'bars'], nums: w.nums || ALL_NUMS, title: w.title || 'Golden timeline', w: w.w || 300 }),
    goldenFrequency: (w) => ({ stats: ['numbers', 'helping'], nums: ['frequency', 'every'], title: w.title || 'Golden cookie frequency', w: w.w || 260 }),
  };

  /** The Stats page's ☆: the multiplier, the frequency and what's helping (v3.37's Golden cookie frequency). */
  const FREQUENCY_PRESET = { type: 'goldenCookies', stats: ['numbers', 'helping'], nums: ['frequency', 'every'] };

  function init() {
    CA.UI.Widgets.defineType({
      id: 'goldenCookies',
      name: 'Golden cookies',
      icon: 'sparkle',
      desc: 'Everything about the next golden cookie, picked in its settings: when it comes (on average, the median, the chance within a minute, its window), the multiplier and how often they come, a chart of its odds (this cycle, or from now with each effect’s time left on the same axis) and what’s helping. Add as many as you like, each showing different parts.',
      group: 'golden',
      sprite: [8, 14],
      short: 'Next one, odds, frequency — you pick',
      width: WIDTH,
      resize: 'free',
      single: false,
      html,
      legacy,
      settings: [
        { key: 'stats', label: 'Show', type: 'multi', default: DEFAULT_PARTS, options: () => PARTS },
        { key: 'axis', label: 'Chart', type: 'select', default: 'cycle', options: () => AXES },
        { key: 'nums', label: 'Numbers', type: 'multi', default: DEFAULT_NUMS, options: () => NUMS },
      ],
    });
  }

  return { init, html, PARTS, NUMS, FREQUENCY_PRESET };
})();
