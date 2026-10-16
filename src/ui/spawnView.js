// When the next golden cookie (or reindeer) comes, as statistics: the distribution of the wait from
// now (features/timers.js — exact, from the game's own rule), drawn and summed up. Used by the Stats
// page (a card per type) and the Golden cookies widget (a sparkline in its popup).
//
//   the numbers   expected (mean), median, most likely (mode), the chance it comes in this second;
//                 percentiles (soonest · 10 · 25 · 50 · 75 · 90% · latest); the chance within 10 s, 30 s,
//                 1 min, 5 min; this cycle's bounds (fixed when the last one left) and how far in;
//                 the chance the next golden cookie is a wrath cookie
//   the chart     the density of the wait (how likely each moment is), the cumulative chance over it
//                 (0 → 100%), the 10–90% and 25–75% bands shaded, ticks at the mean and the median;
//                 hover it for the moment under the pointer
//   what moves it the factors making them come more often now — each a chip; click one to see the
//                 mean wait without it (what if) — counting from the next one, as the game fixes a
//                 cycle's bounds when the last cookie leaves

CA.UI = CA.UI || {};

CA.UI.SpawnView = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const T = () => CA.Timers;
  const W = 640;
  const H = 150;
  const PAD = { l: 8, r: 8, t: 10, b: 22 };
  const hover = {}; // type → fraction of the chart's width under the pointer (null: none)
  const without = { golden: [], reindeer: [] }; // the what-if: factors left out

  const when = (s) => (!Number.isFinite(s) ? '—' : s <= 0 ? 'now' : s < 1 ? '<1s' : F().span(s));
  const pc = (p) => `${p >= 0.9995 ? 100 : p > 0 && p < 0.0005 ? '<0.1' : (p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
  const LABEL = { golden: 'golden cookie', reindeer: 'reindeer' };

  /** The chart: density (bars), cumulative chance (line), percentile bands, mean and median ticks, the hover readout. */
  function chart(type, w) {
    const x0 = PAD.l;
    const x1 = W - PAD.r;
    const y0 = H - PAD.b;
    const y1 = PAD.t;
    const span = Math.max(1e-9, w.range);
    const X = (s) => x0 + ((x1 - x0) * Math.max(0, Math.min(span, s))) / span;
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
    const tick = (s, cls, label, left) => `<g class="${cls}"><line x1="${X(s).toFixed(2)}" x2="${X(s).toFixed(2)}" y1="${y1}" y2="${y0}"/><text x="${(X(s) + (left ? -3 : 3)).toFixed(2)}" y="${y1 + 9}" text-anchor="${left ? 'end' : 'start'}">${label}</text></g>`;
    // the time axis: a few round moments from now
    const step = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600].find((s) => span / s <= 6) || 3600;
    let axis = '';
    for (let s = 0; s <= span + 1e-9; s += step) axis += `<text x="${X(s).toFixed(2)}" y="${H - 6}" text-anchor="${s === 0 ? 'start' : 'middle'}">${s === 0 ? 'now' : F().span(s)}</text>`;
    // the hover readout
    let hov = '';
    const hf = hover[type];
    if (hf !== null && hf !== undefined) {
      const s = span * hf;
      const i = Math.min(w.bins - 1, Math.max(0, Math.floor(hf * w.bins)));
      const hx = X(s);
      hov =
        `<g class="ca-sp-hover"><line x1="${hx.toFixed(2)}" x2="${hx.toFixed(2)}" y1="${y1}" y2="${y0}"/>` +
        `<text x="${Math.min(x1 - 4, Math.max(x0 + 4, hx + (hf > 0.6 ? -6 : 6))).toFixed(2)}" y="${y0 - 8}" text-anchor="${hf > 0.6 ? 'end' : 'start'}">in ${when(s)}: ${pc(w.within(s))} by then · ${pc(w.pdf[i])} in those ${when(w.bin)}</text></g>`;
    }
    return (
      `<svg class="ca-sp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-sp-chart="${type}">` +
      band(10, 90, 'ca-sp-band') +
      band(25, 75, 'ca-sp-band2') +
      `<g class="ca-sp-pdf">${bars}</g>` +
      `<path class="ca-sp-cdf" d="${line}"/>` +
      tick(w.mean, 'ca-sp-mean', 'mean', w.mean < w.median) +
      tick(w.median, 'ca-sp-median', 'median', w.median <= w.mean) +
      `<line class="ca-sp-axis" x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}"/>` +
      `<g class="ca-sp-ticks">${axis}</g>` +
      hov +
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
    const nextLine =
      `Next cycle at today’s factors: ${when(d.next.min)}–${when(d.next.max)}, on average ${when(d.next.mean)}` +
      (whatIf !== null ? ` — <b>without ${esc(without[type].join(', '))}: ${when(whatIf)}</b> (${whatIf > d.next.mean ? '+' : '−'}${when(Math.abs(whatIf - d.next.mean))})` : '');
    const override = d.override === 'chain' ? ' A cookie chain is going: the next comes within seconds.' : d.override === 'hoard' ? ' Gold hoard: they come almost at once.' : d.override === 'season' ? ' Reindeer season: they come almost at once.' : '';
    if (d.spawned)
      return (
        `<div class="ca-stats">${tile(`Next ${name}`, 'on screen', 'pop it! — the timer starts again when it leaves')}${type === 'golden' ? tile('Wrath chance', pc(d.wrathChance), 'that the next is a wrath cookie') : ''}</div>` +
        `<div class="ca-sp-note">${nextLine}.${override}</div>` +
        (factors ? `<div class="ca-sp-factors"><span>Making them come sooner:</span>${factors}</div>` : '')
      );
    const w = d.wait;
    const within = [10, 30, 60, 300].map((s) => `<span class="ca-sp-chip" data-tip="${esc(`The chance a ${name} appears within ${F().span(s)} from now`)}">${F().span(s)} <b>${pc(w.within(s))}</b></span>`).join('');
    const pcts = [
      ['soonest', w.soonest],
      ['10%', w.pct(10)],
      ['25%', w.pct(25)],
      ['median', w.median],
      ['75%', w.pct(75)],
      ['90%', w.pct(90)],
      ['latest', w.latest],
    ]
      .map(([k, v]) => `<span class="ca-sp-chip" data-tip="${esc(k === 'soonest' || k === 'latest' ? `The ${k} it can come` : `${k} of the time it has come by then`)}">${k} <b>${when(v)}</b></span>`)
      .join('');
    return (
      '<div class="ca-stats">' +
      tile('Expected wait', when(w.mean), `± ${when(w.sd)} (the mean)`) +
      tile('Median', when(w.median), 'even odds by then') +
      tile('Most likely', when(w.mode), 'the single likeliest moment') +
      tile('Within a minute', pc(w.within(60)), `this second: ${pc(w.hazard)}`) +
      (type === 'golden' ? tile('Wrath chance', pc(d.wrathChance), 'that it’s a wrath cookie') : '') +
      '</div>' +
      chart(type, w) +
      `<div class="ca-sp-legend"><span class="pdf"></span>how likely each moment is <span class="cdf"></span>chance it has come by then <span class="band"></span>half the time (25–75%) <span class="band2"></span>80% (10–90%)${w.range < w.latest - 0.5 ? ` · drawn to ${when(w.range)} (99.9%) — the latest is ${when(w.latest)}` : ''}</div>` +
      `<div class="ca-sp-chips">${pcts}</div>` +
      `<div class="ca-sp-chips">${within}</div>` +
      `<div class="ca-sp-note">This cycle: ${when(d.cycle.min)}–${when(d.cycle.max)}, fixed when the last one left; ${when(d.cycle.elapsed)} in. ${nextLine}.${override}</div>` +
      (factors ? `<div class="ca-sp-factors"><span>Making them come sooner:</span>${factors}</div>` : '<div class="ca-sp-note">Nothing is making them come sooner — Lucky day, Serendipity, golden clovers, Muridal and Mokalsium all would.</div>')
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

  return { html, chart, sparkline, onMove, onLeave, onClick };
})();
