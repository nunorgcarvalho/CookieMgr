// Golden cookie widgets — the Stats page's golden cookie chart and timer bars (ui/spawnView.js), on the
// left panel, with the same numbers (CA.Timers):
//
//   Golden timeline     everything on one time axis from now: when the next golden cookie comes (its
//                       odds over time, the soonest-to-latest window, the mean), each effect running with
//                       its time left and the chance a golden cookie comes before it ends
//   Next golden cookie  the countdown and the odds: expected, median, the chance within a minute, the
//                       frequency (× vs nothing helping) — and the chart: this cycle's cumulative
//                       chance, a line sweeping across it at now
//
// (Effect timers, a bar per effect running, is its own widget: ui/effectTimers.js.)
// Each shows what you tick in its settings (numbers, chart, effect bars), resizes freely
// (the chart is drawn at the widget's width), and opens the Stats page from its numbers.

CA.UI = CA.UI || {};

CA.UI.TimelineWidget = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const when = (s) => (!Number.isFinite(s) ? '—' : s <= 0 ? 'now' : s < 1 ? '<1s' : F().span(s));
  const pc = (p) => `${p >= 0.9995 ? 100 : p > 0 && p < 0.0005 ? '<0.1' : (p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
  const PARTS = [
    { v: 'numbers', label: 'The next golden cookie, in numbers' },
    { v: 'chart', label: 'Its odds over time (chart)' },
    { v: 'bars', label: 'Effect timers (bars)' },
  ];
  const TYPES = {
    goldenTimeline: { width: 300, parts: ['numbers', 'chart', 'bars'] },
    goldenNext: { width: 260, parts: ['numbers', 'chart'] },
  };

  // (a part saved that's gone — v3.12's Force the Hand of Fate forecast — is left out)
  const partsOf = (inst) => {
    const saved = Array.isArray(inst.stats) ? inst.stats.filter((p) => PARTS.some((x) => x.v === p)) : [];
    return saved.length ? saved : TYPES[inst.type].parts;
  };
  const widthOf = (inst) => Math.max(160, (inst.w || TYPES[inst.type].width) - 18);

  function numbersHtml(d) {
    if (!d) return '<div class="ca-tl-line">No golden cookies: the Golden switch is on.</div>';
    if (d.spawned) return '<div class="ca-tl-line"><b class="ca-tl-now">A golden cookie is on screen!</b></div>';
    const w = d.wait;
    return (
      '<div class="ca-tl-nums" data-w-open="stats">' +
      `<span data-tip="On average (the mean), ± ${esc(when(w.sd))}"><em>next in</em><b>${when(w.mean)}</b></span>` +
      `<span data-tip="Even odds by then"><em>median</em><b>${when(w.median)}</b></span>` +
      `<span data-tip="The chance one comes within a minute (this second: ${esc(pc(w.hazard))})"><em>≤ 1 min</em><b>${pc(w.within(60))}</b></span>` +
      `<span data-tip="The soonest it can come, and the latest"><em>window</em><b>${when(w.soonest)}–${when(w.latest)}</b></span>` +
      `<span data-tip="${esc(`How many times more often golden cookies come than with nothing helping (no upgrades, garden, spirits, aura…)${d.factors.length ? `: ${d.factors.map((x) => x.name).join(', ')}` : ''} — counted from the next one`)}"><em>frequency</em><b>×${Math.round(d.frequency * 100) / 100}</b></span>` +
      '</div>'
    );
  }

  function html(inst) {
    const parts = partsOf(inst);
    const d = CA.Timers.distribution('golden', 60);
    const effects = parts.includes('bars') ? CA.Timers.buffsWithGolden() : [];
    let h = '';
    if (parts.includes('numbers')) h += numbersHtml(d);
    const wait = d && !d.spawned ? d.wait : null;
    const showChart = parts.includes('chart') && wait;
    if (showChart && inst.type === 'goldenNext')
      // this cycle's odds, the now line sweeping across (the Stats page's chart)
      h += CA.UI.SpawnView.cycleChart('golden', d, effects, { width: widthOf(inst), height: 74, hover: false, lane: 13 });
    else if (showChart || effects.length) {
      // the bars alone: an axis as long as the longest effect; with the chart, the chart's
      const opts = { width: widthOf(inst), height: 74, hover: false, lane: 13, plot: !!showChart, next: !!wait && (showChart || parts.includes('numbers')) };
      if (!showChart) opts.span = Math.max(10, ...effects.map((e) => e.secs)) * 1.05;
      h += CA.UI.SpawnView.chart('golden', showChart ? wait : opts.next ? wait : null, effects, opts);
    } else if (parts.includes('bars') && !parts.includes('chart')) h += '<div class="ca-tl-line ca-tl-dim">No effects running.</div>';
    return `<div class="ca-tl-w">${h || '<div class="ca-tl-line ca-tl-dim">Pick what to show in its settings.</div>'}</div>`;
  }

  function init() {
    const D = (id, name, icon, desc) =>
      CA.UI.Widgets.defineType({
        id,
        name,
        icon,
        desc,
        width: TYPES[id].width,
        resize: 'free',
        single: false,
        html,
        settings: [
          { key: 'stats', label: 'Show', type: 'multi', default: TYPES[id].parts, options: () => PARTS },
        ],
      });
    D('goldenTimeline', 'Golden timeline', 'sparkle', 'Everything golden on one time axis from now: the odds of the next golden cookie, each effect running with its time left and the chance a golden cookie comes before it ends. Pick what to show in its settings.');
    D('goldenNext', 'Next golden cookie', 'sparkle', 'When the next golden cookie comes: on average, the median, the chance within a minute, its window — and this cycle’s odds as a chart, a line sweeping across it as time passes (the Stats page’s).');
  }

  return { init, html, PARTS };
})();
