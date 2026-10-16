// Golden cookie widgets — the Stats page's golden cookie chart and timer bars (ui/spawnView.js), on the
// left panel, with the same numbers (CA.Timers):
//
//   Golden timeline     everything on one time axis from now: when the next golden cookie comes (its
//                       odds over time, the soonest-to-latest window, the mean), each effect running with
//                       its time left and the chance a golden cookie comes before it ends — and what Force
//                       the Hand of Fate gives over the next casts (features/fthof.js)
//   Next golden cookie  the countdown and the odds: expected, median, the chance within a minute, the chart
//   Effect timers       a bar per effect running, its time left, the chance of a golden cookie before it ends
//
// Each shows what you tick in its settings (numbers, chart, effect bars, the forecast), resizes freely
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
    { v: 'fthof', label: 'Force the Hand of Fate, the next casts' },
  ];
  const TYPES = {
    goldenTimeline: { width: 300, parts: ['numbers', 'chart', 'bars', 'fthof'] },
    goldenNext: { width: 260, parts: ['numbers', 'chart'] },
    effectTimers: { width: 240, parts: ['bars'] },
  };

  const partsOf = (inst) => (Array.isArray(inst.stats) && inst.stats.length ? inst.stats : TYPES[inst.type].parts);
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
      '</div>'
    );
  }

  function fthofHtml(inst) {
    const n = Math.max(1, Math.min(12, Number(inst.count) || 5));
    const f = CA.Fthof && CA.Fthof.forecast(n);
    if (!f) return '<div class="ca-tl-line ca-tl-dim">Force the Hand of Fate: no Grimoire yet.</div>';
    const chips = f
      .map(
        (x) =>
          `<span class="ca-tl-cast${x.wrath ? ' wrath' : x.good ? ' good' : ''}" data-tip="${esc(
            `Cast ${x.n} from now${x.n > 1 ? ' (any spell before it counts)' : ''}: ${x.name}${x.wrath ? ' — a backfire' : ''}. If it wins: ${CA.Fthof.nameOf(x.win)}; if it backfires: ${CA.Fthof.nameOf(x.backfire)}.${x.gfd ? ` Gambler’s Fever Dream here would cast ${x.gfd.name}${x.gfd.fthof ? ` → ${x.gfd.fthof.name}` : ''}.` : ''}`
          )}"><i>${x.n}</i>${esc(x.name)}</span>`
      )
      .join('');
    return `<div class="ca-tl-fthof"><span class="ca-tl-label" data-tip="${esc(`What Force the Hand of Fate gives over your next casts — worked out from the game’s seeded rolls, at today’s ${pc(f[0].failChance)} backfire chance`)}">FtHoF</span>${chips}</div>`;
  }

  function html(inst) {
    const parts = partsOf(inst);
    const d = CA.Timers.distribution('golden', 60);
    const effects = parts.includes('bars') ? CA.Timers.buffsWithGolden() : [];
    let h = '';
    if (parts.includes('numbers')) h += numbersHtml(d);
    const wait = d && !d.spawned ? d.wait : null;
    const showChart = parts.includes('chart') && wait;
    if (showChart || effects.length) {
      // the bars alone: an axis as long as the longest effect; with the chart, the chart's
      const opts = { width: widthOf(inst), height: 74, hover: false, lane: 13, plot: !!showChart, next: !!wait && (showChart || parts.includes('numbers')) };
      if (!showChart) opts.span = Math.max(10, ...effects.map((e) => e.secs)) * 1.05;
      h += CA.UI.SpawnView.chart('golden', showChart ? wait : opts.next ? wait : null, effects, opts);
    } else if (parts.includes('bars') && !parts.includes('chart')) h += '<div class="ca-tl-line ca-tl-dim">No effects running.</div>';
    if (parts.includes('fthof')) h += fthofHtml(inst);
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
          { key: 'count', label: 'Force the Hand of Fate: casts ahead', type: 'number', min: 1, max: 12, default: 5, unit: 'casts' },
        ],
      });
    D('goldenTimeline', 'Golden timeline', 'sparkle', 'Everything golden on one time axis from now: the odds of the next golden cookie, each effect running with its time left and the chance a golden cookie comes before it ends, and what Force the Hand of Fate gives over your next casts. Pick what to show in its settings.');
    D('goldenNext', 'Next golden cookie', 'sparkle', 'When the next golden cookie comes: on average, the median, the chance within a minute, its window — and its odds over time as a chart (the Stats page’s).');
    D('effectTimers', 'Effect timers', 'clock', 'A bar per effect running (Frenzy, Click frenzy, building specials…): its time left, and the chance a golden cookie comes before it ends.');
  }

  return { init, html, PARTS };
})();
