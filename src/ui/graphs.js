// The Graphs page: sub-tabs of plots (ui/plot.js) over the recorded states.
//
//   Cookies   CpS (production + clicking, unbuffed line, effects, events) with an averages table,
//             Actual CpS (what really got baked per second, by source), Cookies baked (cumulative)
//   Bank      cookies in the bank, what moved it per second (in by source / out), and cumulative
//   Prestige  prestige level if you ascended now, and levels gained per hour
//
// Sources are coloured the same everywhere: production, clicking, golden cookies & reindeer, other.

CA.UI = CA.UI || {};

CA.UI.Graphs = (() => {
  const P = () => CA.UI.Plot;
  const F = () => CA.UI.Plot.fmt;
  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);
  const SEC = 1000;
  const SESSION_START = CA.UI.Plot.SESSION_START;

  const WINDOWS = [60, 300, 900, 3600, 10800, 43200, 86400, 604800, 0];
  const LONG_WINDOWS = [900, 3600, 10800, 43200, 86400, 604800, 0];

  const SOURCES = [
    { key: 'earnProduction', name: 'Production', color: '#f5c451' },
    { key: 'earnClick', name: 'Clicking', color: '#7fe08b' },
    { key: 'earnGolden', name: 'Golden cookies & reindeer', color: '#ff9f43' },
    { key: 'earnOther', name: 'Other', color: '#b39ddb' },
  ];
  const BANK_IN = SOURCES.concat([{ key: 'bankOtherIn', name: 'Other income (stock sales, …)', color: '#4fd6e0' }]);
  const BANK_OUT = [
    { key: 'spent', name: 'Spent', color: '#e5484d' },
    { key: 'withered', name: 'Withered by wrinklers', color: '#8d6e63' },
  ];
  const C_CPS = '#f5c451';
  const C_CLICK = '#7fe08b';
  const C_BASE = '#9db4cc';
  const C_SHOWN = '#ffffff';

  const TABS = [
    { id: 'cookies', label: 'Cookies', icon: 'cookie', plots: ['cps', 'actual', 'baked'] },
    { id: 'bank', label: 'Bank', icon: 'dollar', plots: ['bank', 'bankflow', 'bankcum'] },
    { id: 'prestige', label: 'Prestige', icon: 'ascend', plots: ['prestige', 'prestigeRate'], top: () => targetCardHtml() },
  ];

  // ---- shared overlays --------------------------------------------------------------------

  function intervalTip(iv) {
    const { span, clock, row, swatch } = F();
    const end = iv.end || Date.now();
    let h = `<div class="ca-tip-head">${swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}<span>${iv.end ? '' : 'active'}</span></div>`;
    if (iv.desc) h += `<div class="ca-tip-note">${esc(iv.desc)}</div>`;
    h += row('transparent', 'Effect', mults(iv));
    h += row('transparent', 'Lasted', span((end - iv.start) / SEC) + (iv.end ? '' : ' so far'));
    h += row('transparent', 'Started', clock(iv.start, true));
    if (iv.end) h += row('transparent', 'Ended', clock(iv.end, true));
    return h;
  }
  const trim = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 100) / 100);
  function mults(iv) {
    const bits = [];
    if (Math.abs(iv.multCps - 1) > 0.001) bits.push(`×${trim(iv.multCps)} CpS`);
    if (Math.abs(iv.multClick - 1) > 0.001) bits.push(`×${trim(iv.multClick)} clicks`);
    return bits.length ? bits.join(', ') : 'no CpS change';
  }

  /** Golden cookie effects active in the view, as plot intervals (shading + lanes). */
  function effects(v) {
    if (!S().get('graphEffects')) return [];
    const now = Date.now();
    return CA.History.intervalsIn(v.tAt(v.x0), v.tAt(v.x1)).map((iv) => ({
      x0: v.xAt(iv.start),
      x1: v.xAt(iv.end || now),
      color: CA.History.colorFor(iv.name),
      label: iv.label,
      tip: () => intervalTip(iv),
      iv,
    }));
  }

  function eventTip(ev) {
    const { swatch, clock, row, beautify } = F();
    const type = CA.EventLog.types()[ev.type] || {};
    let h = `<div class="ca-tip-head">${swatch(type.color || '#fff')}${esc(ev.title)}<span>${clock(ev.t, true)}</span></div>`;
    if (ev.text) h += `<div class="ca-tip-note">${esc(ev.text)}</div>`;
    if (ev.type !== 'ascend' && Math.abs(ev.cookies) >= 1)
      h += row('transparent', ev.cookies >= 0 ? 'Cookies gained' : 'Cookies spent', (ev.cookies >= 0 ? '+' : '−') + beautify(Math.abs(ev.cookies)));
    return h;
  }

  /** Event markers for `types`; golden/wrath pops already visible as an effect band are skipped. */
  function markers(v, types, ivs) {
    if (!S().get('graphEvents')) return [];
    const TOL = 3 * SEC;
    return CA.EventLog.list(types)
      .filter((e) => {
        const x = v.active ? e.a : e.t;
        if (x < v.x0 || x > v.x1) return false;
        return !((e.type === 'golden' || e.type === 'wrath') && (ivs || []).some((iv) => Math.abs(iv.iv.start - e.t) < TOL));
      })
      .map((e) => ({
        x: v.active ? e.a : e.t,
        color: (CA.EventLog.types()[e.type] || {}).color || '#fff',
        line: e.type === 'ascend',
        tip: () => eventTip(e),
      }));
  }

  /** A flow as a per-second rate over the seconds it was actually measured. */
  const coverOf = (b, k) => (b.cover && b.cover[k] > 0 ? b.cover[k] : b.secs);
  const rate = (b, k) => (Number.isFinite(b.v[k]) && coverOf(b, k) > 0 ? b.v[k] / coverOf(b, k) : 0);

  /** Running totals of flows across bars, from `startX` (bars before it are dropped). */
  function cumulative(bars, keys, startX, sign = {}) {
    const run = {};
    keys.forEach((k) => (run[k] = 0));
    const out = [];
    bars.forEach((b) => {
      if (b.x1 <= startX) return;
      const parts = {};
      keys.forEach((k) => {
        run[k] += (b.v[k] || 0) * (sign[k] || 1);
        parts[k] = run[k];
      });
      out.push({ x0: b.x0, x1: b.x1, secs: b.secs, parts, raw: b });
    });
    return out;
  }

  function cumulativeStart(v) {
    return v.opt('from') === 'session' ? Math.max(v.x0, v.xAt(SESSION_START)) : v.x0;
  }
  const FROM = {
    key: 'from',
    label: 'From',
    default: 'session',
    options: [
      { v: 'session', label: 'This session', title: 'Since CookieMgr was loaded in this tab' },
      { v: 'window', label: 'Window start', title: 'From the left edge of the chart' },
    ],
  };

  /** dt-weighted averages of the newest `seconds` of active play (live, independent of the view). */
  function recent(seconds) {
    const frames = CA.Recorder.frames();
    const from = CA.Recorder.activeNow() - seconds * SEC;
    // each value averaged over the seconds it was actually measured (the first frame after a
    // gap has no clicking / baked figures — it mustn't count as a second of zero)
    const sum = { cps: 0, click: 0, clickRaw: 0, base: 0 };
    const secs = { cps: 0, click: 0, clickRaw: 0, base: 0 };
    let earned = 0;
    let earnedSecs = 0;
    let total = 0;
    for (let i = frames.length - 1; i >= 0 && frames[i].a > from; i--) {
      const f = frames[i];
      const dt = f.dt || 0;
      total += dt;
      Object.keys(sum).forEach((k) => {
        // frames from before v2.4 have no clickRaw: use clicking as it was
        const v = k === 'clickRaw' && !Number.isFinite(f.clickRaw) ? f.click : f[k];
        if (!Number.isFinite(v)) return;
        sum[k] += v * dt;
        secs[k] += dt;
      });
      if (Number.isFinite(f.earned)) {
        earned += f.earned;
        earnedSecs += dt;
      }
    }
    if (!total) return null;
    const per = (k) => (secs[k] ? sum[k] / secs[k] : 0);
    return { cps: per('cps'), click: per('click'), clickRaw: per('clickRaw'), base: per('base'), actual: earnedSecs ? earned / earnedSecs : 0, secs: total };
  }

  // ---- Cookies tab --------------------------------------------------------------------------

  const cpsPlot = () =>
    P().create({
      id: 'cps',
      title: 'Cookies per second',
      icon: 'graphs',
      windows: WINDOWS,
      window: 300,
      log: true,
      unit: '/s',
      smooth: 5,
      build(v) {
        const bars = v.bucketize(['cps', 'click', 'base']);
        const ivs = effects(v);
        let w = 0;
        let sum = 0;
        bars.forEach((b) => {
          if (Number.isFinite(b.v.cps)) {
            sum += b.v.cps * b.secs;
            w += b.secs;
          }
        });
        const avg = w ? sum / w : NaN;
        return {
          series: [
            { key: 'cps', name: 'Production', color: C_CPS, type: 'bar' },
            { key: 'click', name: 'Clicking', color: C_CLICK, type: 'bar' },
            { key: 'base', name: 'Unbuffed CpS', color: C_BASE, type: 'line', dash: true, width: 1.4 },
          ],
          bars: bars.map((b) => ({ x0: b.x0, x1: b.x1, parts: { cps: b.v.cps || 0, click: b.v.click || 0 }, raw: b })),
          lines: { base: P().linePoints(bars, (b) => b.v.base) },
          hlines: Number.isFinite(avg) ? [{ v: avg, label: `avg ${F().beautify(avg)}/s` }] : [],
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend'], ivs),
          legendExtra: effectLegend(ivs),
          avg,
        };
      },
      stats(v, data) {
        const { tile, beautify, clock } = F();
        const frames = v.frames.filter((f) => f[v.key] > v.x0 && f[v.key] <= v.x1);
        let peak = 0;
        let peakT = 0;
        let w = 0;
        let click = 0;
        frames.forEach((f) => {
          if ((f.cps || 0) >= peak) {
            peak = f.cps || 0;
            peakT = f.t;
          }
          click += (f.click || 0) * (f.dt || 0);
          w += f.dt || 0;
        });
        const last = CA.Recorder.frames()[CA.Recorder.frames().length - 1];
        const avg = data.avg || 0;
        const avgClick = w ? click / w : 0;
        return (
          tile('Now', beautify(last ? last.cps : 0) + '/s', last && last.click > 0.01 ? '+' + beautify(last.click) + ' from clicks' : '') +
          tile('Average', beautify(avg) + '/s', 'this window') +
          tile('Peak', beautify(peak) + '/s', peakT ? clock(peakT, true) : '') +
          tile('Clicking', beautify(avgClick) + '/s', avg + avgClick > 0 ? Math.round((avgClick / (avg + avgClick)) * 100) + '% of income' : '')
        );
      },
      footer: () => averagesTable(),
    });

  function effectLegend(ivs) {
    const counts = new Map();
    ivs.forEach(({ iv }) => counts.set(iv.name, { iv, n: (counts.get(iv.name) || { n: 0 }).n + 1 }));
    if (!counts.size) return '<span class="ca-legend-empty">Golden cookie effects will show up here.</span>';
    return [...counts.values()]
      .map(({ iv, n }) => `<span class="ca-legend-item">${F().swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}${n > 1 ? ` <em>×${n}</em>` : ''}</span>`)
      .join('');
  }

  /** The averages table under the CpS plot: rows of measures, columns of time spans. */
  /**
   * The CpS table, as three stages that build on each other:
   *   1 raw production         unbuffed CpS — no golden-cookie effects
   *   2 + raw clicking         plus clicking with click effects (Click frenzy, …) divided back out
   *   3 actual                 everything that really got baked: buffed production, buffed
   *                            clicking, golden cookie payouts, wrinklers…
   * and the multipliers between them: what clicking adds, what effects & golden cookies add, total.
   */
  function averagesTable() {
    const { beautify } = F();
    const COLS = [
      { s: 0, label: 'Now' },
      { s: 60, label: '1 min' },
      { s: 300, label: '5 min' },
      { s: 900, label: '15 min' },
      { s: 3600, label: '1 h' },
      { s: 10800, label: '3 h' },
    ];
    // "Now" = the last 3 seconds: one frame alone is too jumpy (and may be a just-resumed one)
    const vals = COLS.map((c) => recent(c.s || 3));
    const stage1 = (r) => r.base;
    const stage2 = (r) => r.base + r.clickRaw;
    const stage3 = (r) => r.actual;
    const times = (a, b) => (b > 0 && Number.isFinite(a) ? `×${(a / b).toFixed(a / b >= 10 ? 1 : 2)}` : '—');
    const ROWS = [
      { n: 1, label: 'Raw production', desc: 'CpS with every temporary effect removed', fn: (r) => beautify(stage1(r)) + '/s', color: C_BASE },
      { n: 2, label: '+ raw clicking', desc: 'plus clicking, with click effects (Click frenzy…) taken out', fn: (r) => beautify(stage2(r)) + '/s', color: C_CLICK },
      { n: 3, label: 'Actual', desc: 'everything really baked: effects, golden cookies, wrinklers…', fn: (r) => beautify(stage3(r)) + '/s', color: SOURCES[2].color, strong: true },
      { label: 'Clicking adds', desc: '2 ÷ 1', fn: (r) => times(stage2(r), stage1(r)), mult: true },
      { label: 'Effects & golden add', desc: '3 ÷ 2', fn: (r) => times(stage3(r), stage2(r)), mult: true },
      { label: 'Total', desc: '3 ÷ 1', fn: (r) => times(stage3(r), stage1(r)), mult: true, strong: true },
    ];
    let h = '<div class="ca-table-wrap"><table class="ca-table ca-stages"><thead><tr><th>Average over the last…</th>';
    COLS.forEach((c) => (h += `<th>${c.label}</th>`));
    h += '</tr></thead><tbody>';
    ROWS.forEach((r) => {
      const cls = [r.strong ? 'strong' : '', r.mult ? 'mult' : ''].filter(Boolean).join(' ');
      h +=
        `<tr${cls ? ` class="${cls}"` : ''}><td>` +
        (r.n ? `<span class="ca-stage-n" style="background:${r.color}">${r.n}</span>` : '<span class="ca-stage-n ca-stage-x">×</span>') +
        `${esc(r.label)}<span class="ca-row-sub">${esc(r.desc)}</span></td>`;
      vals.forEach((val) => (h += `<td>${val ? esc(r.fn(val)) : '—'}</td>`));
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="ca-card-note">Averages always cover the newest stretch of active play, whatever the chart is showing.</div>';
    return h;
  }

  const actualPlot = () =>
    P().create({
      id: 'actual',
      title: 'Actual CpS',
      icon: 'bolt',
      note: 'What really got baked each second, split by where it came from — golden cookie payouts, Frenzy and everything else included. The dashed line is what the game shows as CpS (plus clicking).',
      windows: WINDOWS,
      window: 900,
      smooth: 15,
      log: false,
      unit: '/s',
      build(v) {
        const bars = v.bucketize(SOURCES.map((s) => s.key).concat(['earned', 'cps', 'click']));
        const ivs = effects(v);
        let sum = 0;
        let secs = 0;
        bars.forEach((b) => {
          if (!Number.isFinite(b.v.earned)) return;
          sum += b.v.earned;
          secs += coverOf(b, 'earned');
        });
        const avg = secs ? sum / secs : NaN;
        return {
          series: SOURCES.map((s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' })).concat([
            { key: 'shown', name: 'Shown CpS + clicking', color: C_SHOWN, type: 'line', dash: true, width: 1.2 },
          ]),
          bars: bars.map((b) => {
            const parts = {};
            SOURCES.forEach((s) => (parts[s.key] = rate(b, s.key)));
            return { x0: b.x0, x1: b.x1, parts, raw: b };
          }),
          lines: { shown: P().linePoints(bars, (b) => (Number.isFinite(b.v.cps) ? b.v.cps + (b.v.click || 0) : undefined)) },
          hlines: Number.isFinite(avg) ? [{ v: avg, label: `avg ${F().beautify(avg)}/s`, color: 'rgba(255,200,120,0.7)' }] : [],
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend'], ivs),
          sum,
          secs,
          bars0: bars,
        };
      },
      stats(v, data) {
        const { tile, beautify } = F();
        const tot = {};
        SOURCES.forEach((s) => (tot[s.key] = 0));
        let shown = 0;
        data.bars0.forEach((b) => {
          SOURCES.forEach((s) => (tot[s.key] += b.v[s.key] || 0));
          shown += ((b.v.cps || 0) + (b.v.click || 0)) * b.secs;
        });
        const actual = data.secs ? data.sum / data.secs : 0;
        const shownAvg = data.secs ? shown / data.secs : 0;
        const share = (k) => (data.sum > 0 ? Math.round((tot[k] / data.sum) * 100) + '%' : '—');
        return (
          tile('Actual', beautify(actual) + '/s', 'average, this window') +
          tile('Shown', beautify(shownAvg) + '/s', 'CpS + clicking') +
          tile('Actual ÷ shown', shownAvg > 0 ? `×${(actual / shownAvg).toFixed(2)}` : '—', 'extra from everything else') +
          tile('Golden share', share('earnGolden'), 'of cookies baked')
        );
      },
    });

  const bakedPlot = () =>
    P().create({
      id: 'baked',
      title: 'Cookies baked',
      icon: 'cookie',
      note: 'Running total of cookies baked, split by source.',
      windows: WINDOWS,
      window: 3600,
      smooth: false,
      log: false,
      choices: [FROM],
      build(v) {
        const keys = SOURCES.map((s) => s.key);
        const start = cumulativeStart(v);
        const bars = cumulative(v.bucketize(keys), keys, start);
        return {
          series: SOURCES.map((s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' })),
          bars,
          markers: markers(v, ['ascend'], []),
          empty: v.opt('from') === 'session' && start >= v.x1 ? 'Nothing baked yet this session.' : 'Collecting data…',
          totals: bars.length ? bars[bars.length - 1].parts : null,
          start,
        };
      },
      stats(v, data) {
        const { tile, beautify, span } = F();
        const t = data.totals || {};
        const total = SOURCES.reduce((n, s) => n + (t[s.key] || 0), 0);
        const pct = (k) => (total > 0 ? Math.round(((t[k] || 0) / total) * 100) + '%' : '—');
        const secs = data.bars.reduce((n, b) => n + b.secs, 0);
        return (
          tile('Baked', beautify(total), secs ? `in ${span(secs)} of play` : '') +
          tile('Production', pct('earnProduction')) +
          tile('Clicking', pct('earnClick')) +
          tile('Golden & other', total > 0 ? Math.round((((t.earnGolden || 0) + (t.earnOther || 0)) / total) * 100) + '%' : '—')
        );
      },
    });

  // ---- Bank tab ---------------------------------------------------------------------------

  const bankPlot = () =>
    P().create({
      id: 'bank',
      title: 'Cookies in bank',
      icon: 'dollar',
      windows: WINDOWS,
      window: 3600,
      log: false,
      build(v) {
        const bars = v.bucketize(['cookies']);
        const ivs = effects(v);
        return {
          series: [{ key: 'cookies', name: 'Cookies in bank', color: C_CPS, type: 'area', width: 1.8 }],
          lines: { cookies: P().linePoints(bars, (b) => b.v.cookies) },
          intervals: ivs,
          markers: markers(v, ['golden', 'wrath', 'reindeer', 'ascend', 'trade'], ivs),
          bars0: bars,
        };
      },
      stats(v, data) {
        const { tile, beautify, signed } = F();
        const pts = data.lines.cookies;
        if (!pts.length) return tile('Now', '—');
        let lo = Infinity;
        let hi = -Infinity;
        pts.forEach((p) => {
          lo = Math.min(lo, p.v);
          hi = Math.max(hi, p.v);
        });
        return (
          tile('Now', beautify(pts[pts.length - 1].v)) +
          tile('Change', signed(pts[pts.length - 1].v - pts[0].v), 'this window') +
          tile('Lowest', beautify(lo)) +
          tile('Highest', beautify(hi))
        );
      },
    });

  const bankKeys = BANK_IN.concat(BANK_OUT).map((s) => s.key);
  const OUT_SIGN = { spent: -1, withered: -1 };
  const netOf = (parts) => bankKeys.reduce((n, k) => n + (parts[k] || 0), 0);

  // Gains / Losses chips (shared by both bank-change charts): hide one side so the other gets
  // the whole height — one big purchase can otherwise flatten everything else. The net line
  // only makes sense with both.
  const BANK_TOGGLES = [
    { setting: 'bankGains', label: '▲ Gains', title: 'Show cookies coming into the bank' },
    { setting: 'bankLosses', label: '▼ Losses', title: 'Show cookies leaving the bank (spending, wrinklers)' },
  ];
  function bankSides() {
    return { gains: S().get('bankGains') !== false, losses: S().get('bankLosses') !== false };
  }
  function bankSeries() {
    const { gains, losses } = bankSides();
    const bar = (s) => ({ key: s.key, name: s.name, color: s.color, type: 'bar' });
    return (gains ? BANK_IN.map(bar) : [])
      .concat(losses ? BANK_OUT.map(bar) : [])
      .concat(gains && losses ? [{ key: 'net', name: 'Net change', color: C_SHOWN, type: 'line', width: 1.4 }] : []);
  }
  /** Keeps only the parts of the sides being shown, so the y axis fits just those. */
  function bankParts(parts) {
    const { gains, losses } = bankSides();
    const out = {};
    if (gains) BANK_IN.forEach((s) => (out[s.key] = parts[s.key]));
    if (losses) BANK_OUT.forEach((s) => (out[s.key] = parts[s.key]));
    return out;
  }
  const bankEmpty = () => (bankSides().gains || bankSides().losses ? 'Collecting data…' : 'Pick Gains, Losses or both below.');

  const bankFlowPlot = () =>
    P().create({
      id: 'bankflow',
      title: 'Bank change per second',
      icon: 'bolt',
      note: 'Everything that moved the bank: cookies coming in above the line (by source), going out below it.',
      windows: WINDOWS,
      window: 900,
      smooth: 15,
      toggles: BANK_TOGGLES,
      unit: '/s',
      totalLabel: 'Net',
      tipFmt: (val) => F().signed(val) + '/s',
      fmt: (val) => F().beautify(val, 0),
      build(v) {
        const raw = v.bucketize(bankKeys);
        const bars = raw.map((b) => {
          const parts = {};
          bankKeys.forEach((k) => (parts[k] = rate(b, k) * (OUT_SIGN[k] || 1)));
          return { x0: b.x0, x1: b.x1, parts, raw: b };
        });
        const totals = {};
        let secs = 0;
        raw.forEach((b) => {
          secs += coverOf(b, 'spent');
          bankKeys.forEach((k) => (totals[k] = (totals[k] || 0) + (b.v[k] || 0) * (OUT_SIGN[k] || 1)));
        });
        return {
          series: bankSeries(),
          bars: bars.map((b) => ({ ...b, parts: bankParts(b.parts) })),
          lines: { net: bars.map((b) => ({ x: (b.x0 + b.x1) / 2, x0: b.x0, x1: b.x1, bar: b.raw, v: netOf(b.parts) })) },
          markers: markers(v, ['ascend', 'trade'], []),
          empty: bankEmpty(),
          totals,
          secs,
        };
      },
      stats: (v, data) => bankStats(data, true),
    });

  function bankStats(data, perSecond) {
    const { tile, beautify, signed } = F();
    const t = data.totals || {};
    const d = perSecond ? data.secs || 0 : 1;
    if (!d) return tile('Net', '—');
    const income = BANK_IN.reduce((n, s) => n + (t[s.key] || 0), 0);
    const out = BANK_OUT.reduce((n, s) => n + (t[s.key] || 0), 0);
    const u = perSecond ? '/s' : '';
    return (
      tile('Net', signed((income + out) / d) + u, perSecond ? 'average, this window' : '') +
      tile('In', beautify(income / d) + u) +
      tile('Spent', beautify(-(t.spent || 0) / d) + u) +
      tile('Withered', beautify(-(t.withered || 0) / d) + u, 'by wrinklers')
    );
  }

  const bankCumPlot = () =>
    P().create({
      id: 'bankcum',
      title: 'Bank change, running total',
      icon: 'timeline',
      windows: WINDOWS,
      window: 3600,
      smooth: false,
      choices: [FROM],
      toggles: BANK_TOGGLES,
      totalLabel: 'Net',
      tipFmt: (val) => F().signed(val),
      build(v) {
        const start = cumulativeStart(v);
        const bars = cumulative(v.bucketize(bankKeys), bankKeys, start, OUT_SIGN);
        return {
          series: bankSeries(),
          bars: bars.map((b) => ({ ...b, parts: bankParts(b.parts) })),
          lines: { net: bars.map((b) => ({ x: b.x1, x0: b.x0, x1: b.x1, v: netOf(b.parts) })) },
          markers: markers(v, ['ascend'], []),
          empty: bankEmpty(),
          totals: bars.length ? bars[bars.length - 1].parts : {},
        };
      },
      stats: (v, data) => bankStats(data, false),
    });

  // ---- Prestige tab ---------------------------------------------------------------------------

  const prestigePlot = () =>
    P().create({
      id: 'prestige',
      title: 'Prestige',
      icon: 'ascend',
      windows: LONG_WINDOWS,
      window: 10800,
      fmt: (val) => F().beautify(val, 0),
      tipFmt: (val) => F().beautify(Math.floor(val), 0),
      build(v) {
        const bars = v.bucketize(['prestigeTotal', 'prestige']);
        const totals = P().linePoints(bars, (b) => b.v.prestigeTotal);
        // the target as a line, when it's close enough not to squash the chart
        const target = prestigeTarget();
        const top = totals.reduce((m, p) => Math.max(m, p.v), 0);
        const showTarget = target > 0 && top > 0 && target <= top * 1.5;
        return {
          series: [
            { key: 'prestigeTotal', name: 'Level if you ascended now', color: '#c9bcff', type: 'area', width: 1.8 },
            { key: 'prestige', name: 'Current level', color: C_BASE, type: 'line', dash: true },
          ],
          lines: {
            prestigeTotal: totals,
            prestige: P().linePoints(bars, (b) => b.v.prestige),
          },
          hlines: showTarget ? [{ v: target, label: `target ${F().beautify(target, 0)}`, color: 'rgba(201,188,255,0.85)' }] : [],
          markers: markers(v, ['ascend'], []),
          zero: false,
        };
      },
      stats() {
        const { tile, beautify, span } = F();
        const cur = Game.prestige || 0;
        const total = Math.floor(Game.HowMuchPrestige((Game.cookiesReset || 0) + (Game.cookiesEarned || 0)));
        const next = total + 1;
        const need = typeof Game.HowManyCookiesReset === 'function' ? Game.HowManyCookiesReset(next) - ((Game.cookiesReset || 0) + (Game.cookiesEarned || 0)) : NaN;
        const r = recent(900);
        const eta = r && r.actual > 0 && need > 0 ? need / r.actual : NaN;
        return (
          tile('Level', beautify(cur, 0)) +
          tile('If you ascended now', beautify(total, 0), `+${beautify(total - cur, 0)} this run`) +
          tile('Next level', Number.isFinite(need) ? beautify(Math.max(0, need)) : '—', 'cookies to go') +
          tile('Next level in', Number.isFinite(eta) ? span(eta) : '—', 'at the last 15 min’s actual CpS')
        );
      },
    });

  const prestigeRatePlot = () =>
    P().create({
      id: 'prestigeRate',
      title: 'Prestige gained per hour',
      icon: 'sparkle',
      windows: LONG_WINDOWS,
      window: 10800,
      smooth: 900,
      unit: '/h',
      tipFmt: (val) => F().beautify(val, 1) + ' levels/h',
      build(v) {
        const bars = v.bucketize(['prestigeTotal']);
        let prev = null;
        let gained = 0;
        let secs = 0;
        const out = bars.map((b) => {
          const from = prev && b.x0 - prev.x1 <= Math.max(5 * SEC, v.bucket) ? prev.v.prestigeTotal : b.first.prestigeTotal;
          const d = Number.isFinite(b.v.prestigeTotal) && Number.isFinite(from) ? Math.max(0, b.v.prestigeTotal - from) : 0;
          prev = b;
          gained += d;
          secs += b.secs;
          return { x0: b.x0, x1: b.x1, parts: { gain: b.secs > 0 ? (d / b.secs) * 3600 : 0 }, raw: b };
        });
        return {
          series: [{ key: 'gain', name: 'Levels per hour', color: '#c9bcff', type: 'bar' }],
          bars: out,
          markers: markers(v, ['ascend'], []),
          gained,
          secs,
        };
      },
      stats(v, data) {
        const { tile, beautify, span } = F();
        return (
          tile('Gained', beautify(data.gained, 0), data.secs ? `in ${span(data.secs)} of play` : '') +
          tile('Per hour', data.secs ? beautify((data.gained / data.secs) * 3600, 1) : '—', 'average, this window')
        );
      },
    });

  // ---- prestige target --------------------------------------------------------------------
  // A target prestige level, entered as a number from 1–999 and a magnitude (thousand, million…),
  // with how far there is to go and when you'll get there at your recent actual CpS.

  const UNITS = [
    { e: 0, label: 'levels' },
    { e: 3, label: 'thousand' },
    { e: 6, label: 'million' },
    { e: 9, label: 'billion' },
    { e: 12, label: 'trillion' },
    { e: 15, label: 'quadrillion' },
    { e: 18, label: 'quintillion' },
  ];

  /** The target level, or 0 when none is set. */
  function prestigeTarget() {
    const n = Number(S().get('prestigeTargetNum')) || 0;
    return n > 0 ? n * Math.pow(10, Number(S().get('prestigeTargetUnit')) || 0) : 0;
  }

  function targetCardHtml() {
    const n = Number(S().get('prestigeTargetNum')) || 0;
    const u = Number(S().get('prestigeTargetUnit')) || 0;
    return (
      '<div class="ca-card" data-ptarget>' +
      CA.UI.C.cardHead('Prestige target', 'marker') +
      '<div class="ca-target">' +
      '<span class="ca-field-label">Reach level</span>' +
      `<input type="number" min="1" max="999" step="1" placeholder="e.g. 250" value="${n > 0 ? n : ''}" data-ptarget-num>` +
      `<select data-ptarget-unit>${UNITS.map((x) => `<option value="${x.e}"${x.e === u ? ' selected' : ''}>${x.label}</option>`).join('')}</select>` +
      '</div>' +
      '<div data-ptarget-out></div>' +
      '</div>'
    );
  }

  function targetOutHtml() {
    const { tile, beautify, span } = F();
    const target = prestigeTarget();
    if (!target) return '<div class="ca-card-note">Pick a level to aim for — how far it is and when you’ll get there show up here.</div>';
    const baked = (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);
    const now = Math.floor(Game.HowMuchPrestige(baked));
    const start = Game.prestige || 0;
    if (target <= start) return `<div class="ca-card-note">You’re already at prestige ${beautify(start, 0)} — past this target.</div>`;
    const need = typeof Game.HowManyCookiesReset === 'function' ? Math.max(0, Game.HowManyCookiesReset(target) - baked) : NaN;
    const r = recent(900);
    const eta = need > 0 && r && r.actual > 0 ? need / r.actual : need === 0 ? 0 : NaN;
    const pct = Math.max(0, Math.min(100, ((now - start) / (target - start)) * 100));
    const reached = now >= target;
    return (
      `<div class="ca-progress"><div class="ca-progress-fill" style="width:${pct}%"></div><div class="ca-progress-text">${reached ? 'Reached — ascend any time' : `${pct.toFixed(pct < 10 ? 2 : 1)}% of the way this run`}</div></div>` +
      '<div class="ca-stats">' +
      tile('Target', beautify(target, 0), `+${beautify(target - start, 0)} on this ascension`) +
      tile('Levels to go', reached ? '0' : beautify(target - now, 0), `at ${beautify(now, 0)} if you ascended now`) +
      tile('Cookies to go', Number.isFinite(need) ? beautify(need) : '—', 'baked, all time') +
      tile('Reached in', reached ? 'now' : Number.isFinite(eta) ? span(eta) : '—', 'at the last 15 min’s actual CpS') +
      '</div>'
    );
  }

  function onTargetInput(e) {
    const el = e.target;
    if (!el.matches || !el.matches('[data-ptarget-num],[data-ptarget-unit]')) return;
    if (el.matches('[data-ptarget-num]')) {
      const n = Math.round(Number(el.value));
      S().set('prestigeTargetNum', Number.isFinite(n) && n > 0 ? Math.min(999, n) : 0);
    } else S().set('prestigeTargetUnit', Number(el.value) || 0);
    refreshTarget();
    if (plots.prestige) plots.prestige.tick();
  }

  function refreshTarget() {
    const out = mountedRoot && mountedRoot.querySelector('[data-ptarget-out]');
    if (out) out.innerHTML = targetOutHtml();
  }

  // ---- the page ---------------------------------------------------------------------------

  const plots = {};
  let mountedRoot = null;

  const currentTab = () => {
    const t = S().get('graphTab');
    return TABS.find((x) => x.id === t) || TABS[0];
  };

  function html() {
    const cur = currentTab();
    return (
      '<div class="ca-subtabs" role="tablist">' +
      TABS.map(
        (t) =>
          `<button type="button" class="ca-subtab${t === cur ? ' on' : ''}" role="tab" aria-selected="${t === cur}" data-graph-tab="${t.id}">` +
          `${CA.UI.Icons.html(t.icon, 14)}<span>${t.label}</span></button>`
      ).join('') +
      '</div>' +
      (cur.top ? cur.top() : '') +
      cur.plots.map((id) => plots[id].html()).join('')
    );
  }

  function onClick(e) {
    const tab = e.target.closest('[data-graph-tab]');
    if (!tab) return;
    e.stopPropagation();
    CA.Util.sound('snd/tick.mp3');
    S().set('graphTab', tab.dataset.graphTab);
    CA.UI.Menu.render();
  }

  function mount(root) {
    unmount();
    mountedRoot = root;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onTargetInput);
    root.addEventListener('change', onTargetInput);
    currentTab().plots.forEach((id) => plots[id].mount(root));
    refreshTarget();
  }

  function unmount() {
    TABS.forEach((t) => t.plots.forEach((id) => plots[id] && plots[id].unmount()));
    if (mountedRoot) {
      mountedRoot.removeEventListener('click', onClick);
      mountedRoot.removeEventListener('input', onTargetInput);
      mountedRoot.removeEventListener('change', onTargetInput);
    }
    mountedRoot = null;
  }

  function tick() {
    currentTab().plots.forEach((id) => plots[id].tick());
    refreshTarget();
  }

  function init() {
    S().defineOption({ key: 'graphTab', group: 'ui', name: 'Graphs tab', desc: '', default: 'cookies' });
    S().defineOption({ key: 'prestigeTargetNum', group: 'ui', name: 'Prestige target (number)', desc: '', default: 0 });
    S().defineOption({ key: 'prestigeTargetUnit', group: 'ui', name: 'Prestige target (magnitude)', desc: '', default: 0 });
    S().defineOption({ key: 'bankGains', group: 'plot', name: 'Bank charts: gains', desc: '', default: true });
    S().defineOption({ key: 'bankLosses', group: 'plot', name: 'Bank charts: losses', desc: '', default: true });
    S().defineOption({
      key: 'graphEffects',
      group: 'graph',
      icon: 'shade',
      name: 'Effect shading',
      desc: 'Shade the periods when golden cookie effects are active.',
      default: true,
    });
    S().defineOption({
      key: 'graphEvents',
      group: 'graph',
      icon: 'marker',
      name: 'Event markers',
      desc: 'Mark golden cookie pops, reindeer, stock trades and ascensions.',
      default: true,
    });
    P().init();
    plots.cps = cpsPlot();
    plots.actual = actualPlot();
    plots.baked = bakedPlot();
    plots.bank = bankPlot();
    plots.bankflow = bankFlowPlot();
    plots.bankcum = bankCumPlot();
    plots.prestige = prestigePlot();
    plots.prestigeRate = prestigeRatePlot();
    CA.Events.on('history', (why) => {
      if (mountedRoot && why === 'sample') tick();
    });
  }

  return { init, html, mount, unmount, tick, recent, TABS, SOURCES, plots };
})();
