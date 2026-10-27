// When the next golden cookie (or reindeer) comes, as statistics (features/timers.js — exact, from the
// game's own rule), drawn and summed up. Used by the Stats page (a card per type), the Next golden
// cookie widget (its chart) and the Golden cookies widget (a sparkline in its popup).
//
//   the numbers   the expected wait (from now), how far along this cycle's odds it is (the curve's
//                 height at now: 0% → 100%), the chance the next golden cookie is a wrath cookie
//   the chart     this cycle's cumulative chance, over the time since the last one left (0 → the
//                 latest it can come): a line sweeps left to right at now, a dashed line at 50%;
//                 hover it for the moment under the pointer
//   the bars      under the chart, from the now line: each effect running — how long it has left and
//                 the chance a golden cookie comes before it ends (to stack on it)
//   frequency     the effects making them come more often now — each a chip; click one to see the
//   effects       mean wait without it (what if) — counting from the next one, as the game fixes a
//                 cycle's bounds when the last cookie leaves
//
// chart() — the wait from now (density, bands, the next one's window) — is the Golden timeline
// widget's.

CA.UI = CA.UI || {};

CA.UI.SpawnView = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const T = () => CA.Timers;
  const W = 640;
  const H = 150;
  const PAD = { l: 8, r: 8, t: 10, b: 22 };
  const LANE = 14; // a timer bar's height, with its gap
  const hover = {}; // type → fraction of the chart's width under the pointer (null: none)
  const without = { golden: [], reindeer: [] }; // the what-if: factors left out

  const when = (s) => (!Number.isFinite(s) ? '—' : s <= 0 ? 'now' : s < 1 ? '<1s' : F().span(s));
  const pc = (p) => `${p >= 0.9995 ? 100 : p > 0 && p < 0.0005 ? '<0.1' : (p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
  const LABEL = { golden: 'golden cookie', reindeer: 'reindeer' };

  /** An effect's bar colour: what it multiplies. */
  const buffKind = (b) => (b.click > 1 ? 'click' : b.cps > 1 ? 'up' : b.cps < 1 || b.click < 1 ? 'down' : 'other');

  /**
   * The chart: density (bars), cumulative chance (line), percentile bands, mean and median ticks, the
   * hover readout — and under it, on the same axis, the timer bars: the next one's window, then (golden
   * cookies) each effect running with the chance one comes before it ends.
   * w: the wait (CA.Timers distribution's), or null (nothing coming / on screen: the effects alone).
   * opts (the widgets'): width (drawn at the size it's shown: text unstretched), height (of the plot),
   * plot (false: the bars alone), next (false: no next-cookie bar), span (seconds the axis covers —
   * default the 99.9% of the wait, or the longest effect), hover (false: no readout), lane (bar height).
   */
  function chart(type, w, effects = [], opts = {}) {
    const WW = opts.width || W;
    const plot = opts.plot !== false && !!w;
    const showNext = opts.next !== false && !!w;
    const LN = opts.lane || LANE;
    const lanes = (showNext ? 1 : 0) + effects.length;
    const x0 = PAD.l;
    const x1 = WW - PAD.r;
    const y1 = PAD.t;
    const y0 = plot ? (opts.height || H) - PAD.b : PAD.t - 6;
    const HH = y0 + 4 + lanes * LN + 18;
    const longest = effects.reduce((m, e) => Math.max(m, e.secs), 0);
    const span = Math.max(1e-9, opts.span || (w ? w.range : longest * 1.05 || 60));
    const X = (s) => x0 + ((x1 - x0) * Math.max(0, Math.min(span, s))) / span;
    let plotSvg = '';
    if (plot) {
      const maxP = Math.max(...w.pdf, 1e-12);
      const bw = (x1 - x0) / w.bins;
      let bars = '';
      w.pdf.forEach((p, i) => {
        const h = ((y0 - y1) * p) / maxP;
        if (h > 0.05) bars += `<rect x="${(x0 + i * bw).toFixed(2)}" y="${(y0 - h).toFixed(2)}" width="${Math.max(0.6, bw - 0.4).toFixed(2)}" height="${h.toFixed(2)}"/>`;
      });
      const line = w.cdf.map((c, i) => `${i ? 'L' : 'M'}${(x0 + (i + 1) * bw).toFixed(2)},${(y0 - (y0 - y1) * c).toFixed(2)}`).join('');
      const band = (a, b, cls) => `<rect class="${cls}" x="${X(w.pct(a)).toFixed(2)}" y="${y1}" width="${Math.max(0, X(w.pct(b)) - X(w.pct(a))).toFixed(2)}" height="${y0 - y1}"/>`;
      // the two labels on either side of their ticks (mean right, median left — they're often close)
      // too close to label both (a narrow chart): the lines alone
      const labels = Math.abs(X(w.mean) - X(w.median)) >= 44 || x1 - x0 >= 400;
      const tick = (s, cls, label, left) => `<g class="${cls}"><line x1="${X(s).toFixed(2)}" x2="${X(s).toFixed(2)}" y1="${y1}" y2="${y0}"/>${labels ? `<text x="${(X(s) + (left ? -3 : 3)).toFixed(2)}" y="${y1 + 9}" text-anchor="${left ? 'end' : 'start'}">${label}</text>` : ''}</g>`;
      plotSvg =
        band(10, 90, 'ca-sp-band') +
        band(25, 75, 'ca-sp-band2') +
        `<g class="ca-sp-pdf">${bars}</g>` +
        `<path class="ca-sp-cdf" d="${line}"/>` +
        tick(w.mean, 'ca-sp-mean', 'mean', w.mean < w.median) +
        tick(w.median, 'ca-sp-median', 'median', w.median <= w.mean) +
        `<line class="ca-sp-axis" x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}"/>`;
    }
    // the time axis: a few round moments from now
    const step = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200].find((s) => span / s <= Math.max(3, Math.floor((x1 - x0) / 100))) || 7200;
    let axis = '';
    for (let s = 0; s <= span + 1e-9; s += step) axis += `<text x="${X(s).toFixed(2)}" y="${HH - 6}" text-anchor="${s === 0 ? 'start' : 'middle'}">${s === 0 ? 'now' : F().span(s)}</text>`;
    // the timer bars, from now: the next one's window, then each effect's time left
    const ly = (i) => y0 + 4 + i * LN;
    const bh = LN - 3;
    const more = (s) => (s > span + 0.5 ? ' →' : '');
    const short = (x1 - x0) < 400; // a narrow chart (a widget): shorter labels
    let bars2 = '';
    if (showNext)
      bars2 +=
        `<g class="ca-sp-lane next" data-tip="${esc(`The next ${LABEL[type]}: it can't come for ${when(w.soonest)}, then can until ${when(w.latest)}; on average in ${when(w.mean)}`)}">` +
        `<rect class="track" x="${x0}" y="${ly(0)}" width="${x1 - x0}" height="${bh}"/>` +
        `<rect class="wait" x="${x0}" y="${ly(0)}" width="${(X(w.soonest) - x0).toFixed(2)}" height="${bh}"/>` +
        `<rect class="open" x="${X(w.soonest).toFixed(2)}" y="${ly(0)}" width="${Math.max(0, X(w.latest) - X(w.soonest)).toFixed(2)}" height="${bh}"/>` +
        `<line x1="${X(w.mean).toFixed(2)}" x2="${X(w.mean).toFixed(2)}" y1="${ly(0)}" y2="${ly(0) + bh}"/>` +
        `<text x="${x0 + 3}" y="${ly(0) + bh - 2}">${short ? 'next' : `next ${LABEL[type]}`} · ${when(w.soonest)}–${when(w.latest)}${more(w.latest)}</text></g>`;
    effects.forEach((b, i) => {
      const y = ly(i + (showNext ? 1 : 0));
      const gc = Number.isFinite(b.golden) ? ` · ${short ? 'GC' : 'golden cookie before it ends'} ${pc(b.golden)}` : '';
      bars2 +=
        `<g class="ca-sp-lane ${buffKind(b)}" data-tip="${esc(`${b.name}: ${when(b.secs)} left${Number.isFinite(b.golden) ? ` — a golden cookie comes before it ends ${pc(b.golden)} of the time` : ''}`)}">` +
        `<rect class="track" x="${x0}" y="${y}" width="${x1 - x0}" height="${bh}"/>` +
        `<rect class="left" x="${x0}" y="${y}" width="${Math.max(1, X(b.secs) - x0).toFixed(2)}" height="${bh}"/>` +
        `<text x="${x0 + 3}" y="${y + bh - 2}">${esc(b.name)} · ${when(b.secs)}${more(b.secs)}${gc}</text></g>`;
    });
    // the hover readout
    let hov = '';
    const hf = hover[type];
    if (plot && opts.hover !== false && hf !== null && hf !== undefined) {
      const s = span * hf;
      const i = Math.min(w.bins - 1, Math.max(0, Math.floor(hf * w.bins)));
      const hx = X(s);
      hov =
        `<g class="ca-sp-hover"><line x1="${hx.toFixed(2)}" x2="${hx.toFixed(2)}" y1="${y1}" y2="${y0 + lanes * LN}"/>` +
        `<text x="${Math.min(x1 - 4, Math.max(x0 + 4, hx + (hf > 0.6 ? -6 : 6))).toFixed(2)}" y="${y0 - 8}" text-anchor="${hf > 0.6 ? 'end' : 'start'}">in ${when(s)}: ${pc(w.within(s))} by then · ${pc(w.pdf[i])} in those ${when(w.bin)}</text></g>`;
    }
    const sized = opts.width ? `width:${WW}px;` : '';
    return (
      `<svg class="ca-sp-chart${opts.width ? ' ca-sp-fixed' : ''}" viewBox="0 0 ${WW} ${HH}" preserveAspectRatio="none" style="${sized}height:${HH}px"${opts.hover === false ? '' : ` data-sp-chart="${type}"`}>` +
      plotSvg +
      `<g class="ca-sp-ticks">${axis}</g>` +
      bars2 +
      hov +
      '</svg>'
    );
  }

  /**
   * This cycle's chart: x is the time since the last one left, 0 → the latest it can come; the curve,
   * the chance one has come by then (0 → 100%); a dashed line at 50%; the now line where the cycle is,
   * its height labelled — and under it, from the now line, each effect running (golden cookies).
   * d: CA.Timers.distribution's (not spawned). opts: width, height, hover, lane — as chart()'s.
   */
  function cycleChart(type, d, effects = [], opts = {}) {
    const WW = opts.width || W;
    const LN = opts.lane || LANE;
    const c = d.cycle;
    const x0 = PAD.l;
    const x1 = WW - PAD.r;
    const y1 = PAD.t;
    const y0 = (opts.height || H) - PAD.b;
    const HH = y0 + 4 + effects.length * LN + 18;
    const span = Math.max(1e-9, c.max);
    const X = (s) => x0 + ((x1 - x0) * Math.max(0, Math.min(span, s))) / span;
    const Y = (p) => y0 - (y0 - y1) * p;
    const N = Math.max(60, Math.round((x1 - x0) / 2));
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const s = (span * i) / N;
      pts.push([X(s), Y(c.cdf(s))]);
    }
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
    const now = Math.min(span, c.elapsed);
    const nx = X(now);
    const ny = Y(c.by);
    // the part swept so far, shaded under the curve
    const swept = pts.filter(([x]) => x <= nx);
    const area = `M${x0},${y0}` + swept.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join('') + `L${nx.toFixed(2)},${ny.toFixed(2)}L${nx.toFixed(2)},${y0}Z`;
    const right = nx > x0 + (x1 - x0) * 0.75; // the label left of the line near the end
    let plotSvg =
      `<path class="ca-sp-swept" d="${area}"/>` +
      `<line class="ca-sp-half" x1="${x0}" x2="${x1}" y1="${Y(0.5).toFixed(2)}" y2="${Y(0.5).toFixed(2)}"/>` +
      `<text class="ca-sp-ylab" x="${x0 + 2}" y="${(Y(0.5) - 3).toFixed(2)}">50%</text>` +
      `<text class="ca-sp-ylab" x="${x0 + 2}" y="${(y1 + 8).toFixed(2)}">100%</text>` +
      `<path class="ca-sp-cdf" d="${line}"/>` +
      `<line class="ca-sp-axis" x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}"/>` +
      `<g class="ca-sp-now"><line x1="${nx.toFixed(2)}" x2="${nx.toFixed(2)}" y1="${y1}" y2="${y0 + effects.length * LN}"/>` +
      `<circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="3"/>` +
      `<text x="${(nx + (right ? -5 : 5)).toFixed(2)}" y="${Math.max(y1 + 9, Math.min(y0 - 4, ny - 5)).toFixed(2)}" text-anchor="${right ? 'end' : 'start'}">${pc(c.by)}</text></g>`;
    // the time axis: since the last one left
    const step = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200].find((s) => span / s <= Math.max(3, Math.floor((x1 - x0) / 100))) || 7200;
    let axis = '';
    for (let s = 0; s <= span + 1e-9; s += step) axis += `<text x="${X(s).toFixed(2)}" y="${HH - 6}" text-anchor="${s === 0 ? 'start' : 'middle'}">${s === 0 ? '0' : F().span(s)}</text>`;
    // and the latest, at the end — unless a round moment is already close to it
    if (span % step > step * 0.45) axis += `<text x="${x1}" y="${HH - 6}" text-anchor="end">${F().span(span)}</text>`;
    // the effects, from now
    const ly = (i) => y0 + 4 + i * LN;
    const bh = LN - 3;
    const short = x1 - x0 < 400;
    let bars = '';
    effects.forEach((b, i) => {
      const y = ly(i);
      const end = c.elapsed + b.secs;
      const gc = Number.isFinite(b.golden) ? ` · ${short ? 'GC' : 'golden cookie before it ends'} ${pc(b.golden)}` : '';
      // its label inside the track, from the now line — or from the left when the line is far right
      const tx = nx + 3 + 140 > x1 ? x0 + 3 : nx + 3;
      bars +=
        `<g class="ca-sp-lane ${buffKind(b)}" data-tip="${esc(`${b.name}: ${when(b.secs)} left${Number.isFinite(b.golden) ? ` — a golden cookie comes before it ends ${pc(b.golden)} of the time` : ''}`)}">` +
        `<rect class="track" x="${x0}" y="${y}" width="${x1 - x0}" height="${bh}"/>` +
        `<rect class="left" x="${nx.toFixed(2)}" y="${y}" width="${Math.max(1, X(end) - nx).toFixed(2)}" height="${bh}"/>` +
        `<text x="${tx.toFixed(2)}" y="${y + bh - 2}">${esc(b.name)} · ${when(b.secs)}${end > span + 0.5 ? ' →' : ''}${gc}</text></g>`;
    });
    // the hover readout
    const hf = hover[type];
    if (opts.hover !== false && hf !== null && hf !== undefined) {
      const s = span * hf;
      const hx = X(s);
      plotSvg +=
        `<g class="ca-sp-hover"><line x1="${hx.toFixed(2)}" x2="${hx.toFixed(2)}" y1="${y1}" y2="${y0}"/>` +
        `<text x="${Math.min(x1 - 4, Math.max(x0 + 4, hx + (hf > 0.6 ? -6 : 6))).toFixed(2)}" y="${y0 - 8}" text-anchor="${hf > 0.6 ? 'end' : 'start'}">${when(s)} after the last: ${pc(c.cdf(s))} by then</text></g>`;
    }
    const sized = opts.width ? `width:${WW}px;` : '';
    return (
      `<svg class="ca-sp-chart ca-sp-cycle${opts.width ? ' ca-sp-fixed' : ''}" viewBox="0 0 ${WW} ${HH}" preserveAspectRatio="none" style="${sized}height:${HH}px"${opts.hover === false ? '' : ` data-sp-chart="${type}"`}>` +
      plotSvg +
      `<g class="ca-sp-ticks">${axis}</g>` +
      bars +
      '</svg>'
    );
  }

  /** A type's card body (the Stats page). */
  function html(type) {
    const d = T().distribution(type, 120);
    const name = LABEL[type];
    if (!d) return `<div class="ca-card-note">No ${name} coming: ${type === 'golden' ? 'the Golden switch is on (switch it off and they come again).' : 'reindeer only run at Christmas.'}</div>`;
    const { tile } = CA.UI.Plot.fmt;
    const fmtF = (x) => `×${Math.round(x.k * 1000) / 1000}`;
    const factors = d.factors
      .map((x) => {
        const off = without[type].includes(x.name);
        return `<button type="button" class="ca-sp-factor${off ? ' off' : ''}" data-sp-without="${type}" data-name="${esc(x.name)}" data-tip="${esc(`${x.name} (${x.why}): times between ${type === 'golden' ? 'golden cookies' : 'reindeer'} ${fmtF(x)} — click to see the wait without it`)}">${esc(x.name)} <b>${fmtF(x)}</b></button>`;
      })
      .join('');
    const whatIf = without[type].length ? T().meanWithout(type, without[type]) : null;
    const whatIfLine =
      whatIf !== null
        ? `<div class="ca-sp-note">From the next one, on average <b>${when(d.next.mean)}</b> — without ${esc(without[type].join(', '))}: <b>${when(whatIf)}</b> (${whatIf > d.next.mean ? '+' : '−'}${when(Math.abs(whatIf - d.next.mean))})</div>`
        : '';
    const effects = type === 'golden' ? T().buffsWithGolden() : [];
    const override = d.override === 'chain' ? 'A cookie chain is going: the next comes within seconds.' : d.override === 'hoard' ? 'Gold hoard: they come almost at once.' : d.override === 'season' ? 'Reindeer season: they come almost at once.' : '';
    const freq = factors ? `<div class="ca-sp-factors"><span>${type === 'golden' ? 'Golden cookie' : 'Reindeer'} frequency effects:</span>${factors}</div>${whatIfLine}` : '';
    const wrath = type === 'golden' ? tile('Wrath chance', pc(d.wrathChance), 'that it’s a wrath cookie') : '';
    if (d.spawned)
      return (
        `<div class="ca-stats">${tile(`Next ${name}`, 'on screen', 'pop it! — the timer starts again when it leaves')}${wrath}</div>` +
        (effects.length ? `<div class="ca-sp-chips">${effects.map((b) => `<span class="ca-sp-chip">${esc(b.name)} <b>${when(b.secs)}</b></span>`).join('')}</div>` : '') +
        (override ? `<div class="ca-sp-note">${override}</div>` : '') +
        freq
      );
    const w = d.wait;
    return (
      '<div class="ca-stats">' +
      tile('Expected wait', when(w.mean), 'on average, from now') +
      tile('Odds so far', pc(d.cycle.by), `of the time one has come by ${when(d.cycle.elapsed)} after the last`) +
      wrath +
      '</div>' +
      cycleChart(type, d, effects) +
      (override ? `<div class="ca-sp-note">${override}</div>` : '') +
      freq
    );
  }

  /** A sparkline of the wait's density, for the widget's popup. */
  function sparkline(type) {
    const d = T().distribution(type, 40);
    if (!d || d.spawned) return '';
    const w = d.wait;
    const maxP = Math.max(...w.pdf, 1e-12);
    const bars = w.pdf.map((p, i) => `<rect x="${i * 3}" y="${(24 - (22 * p) / maxP).toFixed(1)}" width="2.4" height="${((22 * p) / maxP).toFixed(1)}"/>`).join('');
    const mx = (w.mean / Math.max(1e-9, w.range)) * 120;
    return `<svg class="ca-sp-spark" viewBox="0 0 120 24" preserveAspectRatio="none">${bars}<line x1="${mx.toFixed(1)}" x2="${mx.toFixed(1)}" y1="0" y2="24"/></svg>`;
  }

  // ---- interaction (the page that shows it passes its events here) --------------------------------

  /** Pointer over a chart: remember where (rendered on the next sync). Returns whether it was a chart. */
  function onMove(e) {
    const svg = e.target && e.target.closest && e.target.closest('[data-sp-chart]');
    if (!svg) return false;
    const r = svg.getBoundingClientRect();
    if (!r.width) return true;
    const f = (e.clientX - r.left - (r.width * PAD.l) / W) / ((r.width * (W - PAD.l - PAD.r)) / W);
    hover[svg.dataset.spChart] = Math.max(0, Math.min(1, f));
    return true;
  }
  function onLeave(e) {
    const svg = e.target && e.target.closest && e.target.closest('[data-sp-chart]');
    if (svg) hover[svg.dataset.spChart] = null;
  }
  /** A what-if chip clicked: leave that factor out (or put it back). Returns whether it was one. */
  function onClick(e) {
    const b = e.target.closest && e.target.closest('[data-sp-without]');
    if (!b) return false;
    const list = without[b.dataset.spWithout];
    const i = list.indexOf(b.dataset.name);
    if (i >= 0) list.splice(i, 1);
    else list.push(b.dataset.name);
    return true;
  }

  return { html, chart, cycleChart, sparkline, onMove, onLeave, onClick };
})();
