// The plotting engine every CookieMgr chart is built on: a plot is a *technique* applied to
// recorded *states* (core/states.js, core/recorder.js). A plot spec says which states it reads
// and how to turn the recorder's frames into bars / lines / overlays; this module does the rest:
// the card + toolbar chips (persisted per plot), bucketing, scales, axes, effect bands, event
// markers, the hover tooltip, drag-to-scroll and the live/paused view.
//
//   const p = CA.UI.Plot.create({ id, title, icon, windows, build(v) { return { series, bars, lines } } });
//   page html: p.html()   mount: p.mount(pageRoot)   tick: p.tick()   unmount: p.unmount()
//
// The x axis is either wall-clock time (frame.t) or **active play time** (frame.a, see
// core/recorder.js) — the global "Active time" toggle (setting graphActiveTime). In active-time
// mode stretches where the game wasn't running simply don't exist on the axis; a thin dashed
// line marks where one was cut out, and axis labels still show the wall-clock time there.

CA.UI = CA.UI || {};

CA.UI.Plot = (() => {
  const FONT = '10px Tahoma, Arial, sans-serif';
  const PAD = { r: 8, t: 10, b: 22 };
  const MIN_PAD_L = 30;
  const PAD_L_MARGIN = 10;
  const BAR_PX = 5; // target on-screen width (bar + gap) of one bar
  const MAX_AUTO_BARS = 240;
  const BAR_GAP_FRAC = 0.18;
  const LANE_H = 12;
  const LANE_GAP = 2;
  const MAX_LANES = 6;
  const GAP_MS = 5000; // matches the recorder's MAX_GAP_MS
  const SEC = 1000;
  const SESSION_START = Date.now();
  const NICE_MS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800].map((s) => s * SEC);
  const WINDOW_LABELS = { 60: '1m', 300: '5m', 900: '15m', 3600: '1h', 10800: '3h', 43200: '12h', 86400: '1d', 604800: '7d', 0: 'All' };
  const SMOOTH = [0, 5, 15, 60, 300, 900, 3600];
  const SMOOTH_LABELS = { 0: 'Off', 5: '5s', 15: '15s', 60: '1m', 300: '5m', 900: '15m', 3600: '1h' };

  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);

  // ---- formatting ------------------------------------------------------------------------

  const { short, beautify, signed, clock, span } = CA.Format; // core/format.js
  function dayClock(t) {
    const d = new Date(t);
    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${clock(t)}`;
  }
  const windowLabel = (s) => WINDOW_LABELS[s] || span(s);
  const swatch = (c, dash) => `<i class="ca-sw${dash ? ' ca-sw-dash' : ''}" style="${dash ? `border-color:${c}` : `background:${c}`}"></i>`;
  function row(color, name, value, strong, dash) {
    return `<div class="ca-tip-row${strong ? ' strong' : ''}">${swatch(color, dash)}<b>${esc(name)}</b><span>${esc(value)}</span></div>`;
  }
  /**
   * Several figures on one row, separated by a centred dot — with a unit they all share written
   * once at the end: ["1.2K/s", "3.4M/s"] → "1.2K · 3.4M/s".
   */
  function joinFigures(values) {
    if (values.length < 2) return values.join('');
    let suffix = values[0];
    values.forEach((v) => {
      while (suffix && !v.endsWith(suffix)) suffix = suffix.slice(1);
    });
    // the unit starts at a non-alphanumeric character ("/s", "%", " cookies"), not inside "4.5K"
    while (suffix && /[0-9A-Za-z.]/.test(suffix[0])) suffix = suffix.slice(1);
    if (!suffix || values.some((v) => v.length === suffix.length)) return values.join(' · ');
    return values.map((v) => v.slice(0, v.length - suffix.length)).join(' · ') + suffix;
  }
  const tile = (label, value, sub, title) =>
    `<div class="ca-stat"${title ? ` data-tip="${esc(title)}"` : ''}><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;

  // ---- the x axis -------------------------------------------------------------------------

  const activeMode = () => !!S().get('graphActiveTime');

  /** Which clock the x axis runs on, with conversions both ways. */
  function axis() {
    const frames = CA.Recorder.frames();
    if (activeMode()) {
      return {
        key: 'a',
        now: CA.Recorder.activeNow(),
        min: frames.length ? frames[0].a - (frames[0].dt || 1) * SEC : undefined,
        tAt: CA.Recorder.timeAt,
        xAt: CA.Recorder.activeAt,
      };
    }
    return {
      key: 't',
      now: Date.now(),
      min: frames.length ? frames[0].t - (frames[0].dt || 1) * SEC : undefined,
      tAt: (x) => x,
      xAt: (t) => t,
    };
  }

  const niceUp = (ms) => NICE_MS.find((n) => n >= ms) || NICE_MS[NICE_MS.length - 1];

  // ---- bucketing --------------------------------------------------------------------------

  /**
   * Aggregates frames into bars on an absolute grid of `bucket` ms along axis `key` (so bars
   * never reshuffle as the view scrolls). Each field is combined by its state's kind: flows
   * summed, gauges dt-weighted mean, counters last value (and `first` kept, for deltas). Older
   * history is coarser than a small bucket — such a frame becomes its own, wider bar rather
   * than leaving stripes of empty buckets.
   * Bars: { x0, x1, secs (active seconds covered), t0, t1 (wall), v: { field: value }, first: {} }.
   */
  function bucketize(frames, key, x0, x1, bucket, fields) {
    const aggs = fields.map((f) => {
      const d = CA.States.get(f);
      return d ? d.agg : 'mean';
    });
    const bars = [];
    let cur = null;
    const open = (bx0, bx1, idx) => ({ idx, x0: bx0, x1: bx1, secs: 0, n: 0, t0: Infinity, t1: -Infinity, acc: fields.map(() => ({ s: 0, w: 0, c: 0, last: undefined, first: undefined })) });
    const add = (bar, f) => {
      const dt = f.dt || 0;
      bar.secs += dt;
      bar.n++;
      bar.t0 = Math.min(bar.t0, f.t - (dt || 1) * SEC);
      bar.t1 = Math.max(bar.t1, f.t);
      fields.forEach((k, i) => {
        const v = f[k];
        if (!Number.isFinite(v)) return;
        const a = bar.acc[i];
        a.s += v;
        a.w += v * dt;
        a.c += dt;
        if (a.first === undefined) a.first = v;
        a.last = v;
      });
    };
    const flush = () => {
      if (!cur) return;
      const prev = bars[bars.length - 1];
      if (prev && cur.x0 < prev.x1) cur.x0 = prev.x1;
      cur.v = {};
      cur.first = {};
      cur.cover = {}; // seconds each field was actually measured for (unknown frames don't count)
      fields.forEach((k, i) => {
        const a = cur.acc[i];
        if (a.last === undefined) return;
        cur.first[k] = a.first;
        cur.cover[k] = a.c;
        if (aggs[i] === 'sum') cur.v[k] = a.s;
        else if (aggs[i] === 'last') cur.v[k] = a.last;
        else cur.v[k] = a.c > 0 ? a.w / a.c : a.last;
      });
      delete cur.acc;
      if (cur.x1 > cur.x0) bars.push(cur);
      cur = null;
    };
    frames.forEach((f) => {
      const x = f[key];
      const w = (f.dt || 1) * SEC;
      if (!(x > x0) || x - w >= x1) return;
      if (w >= bucket * 0.99) {
        flush();
        cur = open(x - w, x, null);
        add(cur, f);
        flush();
        return;
      }
      const idx = Math.floor((x - w / 2) / bucket);
      if (!cur || cur.idx !== idx) {
        flush();
        cur = open(idx * bucket, (idx + 1) * bucket, idx);
      }
      add(cur, f);
    });
    flush();
    return bars;
  }

  /** Points for a line through bar values (at each bar's centre); `fn(bar)` → number|undefined. */
  function linePoints(bars, fn) {
    const pts = [];
    bars.forEach((b) => {
      const v = fn(b);
      if (Number.isFinite(v)) pts.push({ x: (b.x0 + b.x1) / 2, v, x0: b.x0, x1: b.x1, bar: b });
    });
    return pts;
  }

  /** Rolling mean over the previous k points (k <= 1 leaves them alone). */
  function smooth(pts, k) {
    if (k <= 1) return pts;
    let sum = 0;
    return pts.map((p, i) => {
      sum += p.v;
      if (i >= k) sum -= pts[i - k].v;
      return { ...p, v: sum / Math.min(i + 1, k) };
    });
  }

  /**
   * Centered moving average: each value becomes the weighted mean of every value whose centre
   * lies within ±half of its own centre. Weights are the active seconds each bar covers, so a
   * smoothed rate is exactly (cookies over the window) ÷ (seconds over the window). Values that
   * aren't numbers are left alone and don't count.
   */
  function movingAverage(centers, weights, values, half) {
    const n = centers.length;
    const out = new Array(n);
    let lo = 0;
    let hi = 0;
    let sw = 0;
    let swv = 0;
    for (let i = 0; i < n; i++) {
      while (hi < n && centers[hi] <= centers[i] + half) {
        if (Number.isFinite(values[hi])) {
          sw += weights[hi];
          swv += weights[hi] * values[hi];
        }
        hi++;
      }
      while (centers[lo] < centers[i] - half) {
        if (Number.isFinite(values[lo])) {
          sw -= weights[lo];
          swv -= weights[lo] * values[lo];
        }
        lo++;
      }
      out[i] = Number.isFinite(values[i]) && sw > 1e-12 ? swv / sw : values[i];
    }
    return out;
  }

  const weightOf = (b) => {
    const secs = b.raw && Number.isFinite(b.raw.secs) ? b.raw.secs : b.bar && Number.isFinite(b.bar.secs) ? b.bar.secs : b.secs;
    return secs > 0 ? secs : Math.max(1e-3, ((b.x1 || 0) - (b.x0 || 0)) / SEC) || 1;
  };

  /** Applies a centered moving average of `ms` to every bar series and line in `data`. */
  function smoothData(data, ms) {
    const half = ms / 2;
    const series = data.series || [];
    const bars = data.bars || [];
    if (bars.length) {
      const centers = bars.map((b) => (b.x0 + b.x1) / 2);
      const weights = bars.map(weightOf);
      series
        .filter((s) => s.type === 'bar' && s.smooth !== false)
        .forEach((s) => {
          const out = movingAverage(centers, weights, bars.map((b) => b.parts[s.key]), half);
          bars.forEach((b, i) => {
            if (Number.isFinite(out[i])) b.parts[s.key] = out[i];
          });
        });
    }
    const lines = data.lines || {};
    series
      .filter((s) => (s.type === 'line' || s.type === 'area') && s.smooth !== false && lines[s.key])
      .forEach((s) => {
        const pts = lines[s.key];
        const out = movingAverage(
          pts.map((p) => p.x),
          pts.map(weightOf),
          pts.map((p) => p.v),
          half
        );
        lines[s.key] = pts.map((p, i) => ({ ...p, v: out[i] }));
      });
  }

  /** Round tick values inside [lo, hi] for a log axis: whole powers of ten when the range is
   *  wide, 1-2-5 or finer steps as it narrows, evenly spaced round numbers when very narrow. */
  function logTicks(lo, hi) {
    const SETS = [[1], [1, 3], [1, 2, 5], [1, 1.5, 2, 3, 5, 7], [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9]];
    for (const set of SETS) {
      let t = [];
      for (let d = Math.floor(Math.log10(lo)); d <= Math.ceil(Math.log10(hi)); d++) {
        set.forEach((m) => {
          const v = m * Math.pow(10, d);
          if (v >= lo && v <= hi) t.push(v);
        });
      }
      if (t.length >= 3) {
        while (t.length > 7) t = t.filter((_, i) => i % 2 === 0);
        return t;
      }
    }
    return CA.UI.Chart.niceLinearScale(lo, hi, 4).ticks.filter((v) => v >= lo && v <= hi);
  }

  /** The game's icon sheet, loaded once for drawing effect icons (null until it has loaded). */
  let sheet = null;
  function iconSheet() {
    if (!sheet && typeof Image !== 'undefined') {
      sheet = new Image();
      sheet.src = CA.Util.res('img/icons.png');
    }
    return sheet && sheet.complete && sheet.naturalWidth ? sheet : null;
  }

  /** The share of a bar's width the game was actually running for (1 when unknown). */
  function activeShare(b) {
    const raw = b.raw || b.bar || b;
    const width = ((b.x1 || 0) - (b.x0 || 0)) / SEC;
    return Number.isFinite(raw.secs) && width > 0 ? Math.min(1, raw.secs / width) : 1;
  }

  /** "% of total": each bar's parts become shares of the bar's total size (losses count by their
   *  size too, and stay below the line); lines and averages don't mean anything then, so they go. */
  function toProportions(data) {
    (data.bars || []).forEach((b) => {
      const total = Object.values(b.parts).reduce((n, v) => n + (Number.isFinite(v) ? Math.abs(v) : 0), 0);
      Object.keys(b.parts).forEach((k) => (b.parts[k] = total > 0 && Number.isFinite(b.parts[k]) ? b.parts[k] / total : 0));
    });
    data.series = (data.series || []).filter((x) => x.type === 'bar');
    data.hlines = [];
    data.zero = true;
  }

  /** Spots in [x0, x1] where active-time mode cut out a stretch of inactive time. */
  function gapsIn(frames, key, x0, x1) {
    const out = [];
    for (let i = 1; i < frames.length; i++) {
      const f = frames[i];
      const p = frames[i - 1];
      const wall = f.t - p.t;
      const act = f.a - p.a;
      if (wall - act > GAP_MS && f[key] > x0 && p[key] < x1) out.push({ x: p[key], away: wall - act, from: p.t, to: f.t });
    }
    return out;
  }

  // ---- one plot -----------------------------------------------------------------------------

  const all = new Map(); // id -> instance

  /**
   * spec: {
   *   id, title, icon, height (px, default 220), note (HTML under the title),
   *   windows: [seconds…] (0 = all history), window: default seconds,
   *   smooth: default centered moving average in seconds (0 = off) — every plot gets a Smooth
   *           chooser; false for plots where averaging makes no sense (running totals, …).
   *           A series with smooth: false is left alone.
   *   toggles: [{ key, label, title, default }]          boolean chips, read with v.opt(key)
   *   choices: [{ key, label, options: [{ v, label }], default }]   one-of chips, v.opt(key)
   *   log: true|false to offer a log-scale chip (and its default); omit for linear only
   *   build(v) → { series: [{ key, name, color, type: 'bar'|'line'|'area', dash, width }],
   *                bars: [{ x0, x1, parts: { key: value }, … }], lines: { key: [{ x, v }] },
   *                hlines: [{ v, label, color }], intervals: [{ x0, x1, color, label, tip() }],
   *                markers: [{ x, color, line, tip() }], empty: 'text', zero: true,
   *                xAxis: { x0, x1, labels: [{ x, label }], head(bar, x) } — an x axis in other units
   *                (e.g. garden ticks) for the bars, lines and markers this build returns }
   *   stats(v, data) → HTML (tiles above the chart), footer(v, data) → HTML (below the legend)
   *   tip(bar, v, data) → extra tooltip HTML for a hovered bar
   *   fmt(value) → string for axis/tooltip values (default: beautify), unit: suffix for the tooltip
   * }
   */
  function create(spec) {
    const id = spec.id;
    // settingsOf: use another chart's window / smoothing / log choices (charts that belong together)
    const key = (k) => `plot.${spec.settingsOf || id}.${k}`;
    const height = spec.height || 220;
    const baseFmt = spec.fmt || ((v) => beautify(v, 0));
    const baseTipFmt = spec.tipFmt || ((v) => beautify(v) + (spec.unit || ''));
    const pct = (v) => `${Math.round(v * 1000) / 10}%`;
    // switched to percentages while "% of total" is on (set at the start of each draw)
    let fmt = baseFmt;
    let tipFmt = baseTipFmt;

    // persisted per-plot choices (kept out of the generic Settings list)
    const def = (k, d) => S().optionsIn('plot').some((o) => o.key === key(k)) || S().defineOption({ key: key(k), group: 'plot', name: k, desc: '', default: d });
    def('win', spec.window != null ? spec.window : (spec.windows || [300])[0]);
    if (spec.smooth !== false) def('smooth', spec.smooth || 0);
    if (spec.stacked) def('prop', false);
    if (spec.log != null) def('log', !!spec.log);
    // a toggle with `setting` binds an existing global option instead of a per-plot one
    (spec.toggles || []).forEach((t) => !t.setting && def(t.key, !!t.default));
    (spec.choices || []).forEach((c) => def(c.key, c.default));

    const view = CA.UI.Chart.createView();
    let root = null;
    let canvas = null;
    let ctx = null;
    let tipEl = null;
    let observer = null;
    let panCtl = null;
    let hover = null;
    let padL = 54;
    let layout = null;
    let lastData = null;

    const opt = (k) => S().get(key(k));
    function windowMs(ax) {
      const s = opt('win');
      if (s > 0) return s * SEC;
      const min = ax.min;
      return min == null ? 60 * SEC : Math.max(60 * SEC, ax.now - min);
    }

    // ---- html ----

    function chip(label, attrs, title) {
      return `<button type="button" class="ca-chip" ${attrs}${title ? ` data-tip="${esc(title)}"` : ''}>${label}</button>`;
    }
    const setChip = (k, val, label, title) =>
      chip(label, `data-plot-set="${key(k)}" data-val="${esc(String(val))}" data-pressed-key="${key(k)}" data-pressed-val="${esc(String(val))}"`, title);
    const boolChip = (fullKey, label, title) => chip(label, `data-plot-toggle="${fullKey}" data-pressed-key="${fullKey}"`, title);

    function html() {
      const wins = spec.windows || [300];
      let h =
        `<div class="ca-card ca-graph-card" data-plot="${id}">` +
        CA.UI.C.cardHead(spec.title, spec.icon, '<div class="ca-card-meta"><span class="ca-live" data-plot-live></span></div>') +
        (spec.note ? `<div class="ca-card-note">${spec.note}</div>` : '') +
        (spec.stats ? '<div class="ca-stats" data-plot-stats></div>' : '') +
        '<div class="ca-toolbar">' +
        `<div class="ca-chipgroup" data-tip="How much history to show">${wins.map((s) => setChip('win', s, windowLabel(s))).join('')}</div>` +
        (spec.toggleGroups || [])
          .map(
            (g) =>
              `<div class="ca-chipgroup ca-togglegroup">${g.label ? `<span class="ca-chip-label">${esc(g.label)}</span>` : ''}` +
              g.toggles
                .map((t) =>
                  chip(
                    (t.color ? `<i class="ca-sw" style="background:${t.color}"></i>` : '') + t.label,
                    `data-plot-toggle="${t.setting}" data-pressed-key="${t.setting}"`,
                    t.title
                  )
                )
                .join('') +
              '</div>'
          )
          .join('') +
        (spec.choices || [])
          .map(
            (c) =>
              `<div class="ca-chipgroup">${c.label ? `<span class="ca-chip-label">${esc(c.label)}</span>` : ''}` +
              c.options.map((o) => setChip(c.key, o.v, o.label, o.title)).join('') +
              '</div>'
          )
          .join('') +
        '</div>' +
        `<div class="ca-graph-wrap"><canvas class="ca-graph" style="height:${height}px" data-plot-canvas></canvas></div>` +
        '<div class="ca-toolbar ca-toolbar-bottom">';
      if (spec.smooth !== false) {
        h +=
          '<div class="ca-chipgroup" data-tip="Centered moving average: each point becomes the average of the stretch of time around it">' +
          '<span class="ca-chip-label">Smooth</span>' +
          SMOOTH.map((s) => setChip('smooth', s, SMOOTH_LABELS[s])).join('') +
          '</div>';
      }
      h += '<div class="ca-chipgroup">';
      if (spec.log != null) h += boolChip(key('log'), 'Log scale', 'Logarithmic vertical axis — handy when values grow by orders of magnitude');
      if (spec.stacked) h += boolChip(key('prop'), '% of total', 'Show each bar as shares of its total instead of amounts');
      (spec.toggles || []).forEach((t) => (h += boolChip(t.setting || key(t.key), t.label, t.title)));
      h += boolChip('graphActiveTime', `${CA.UI.Icons.html('clock', 12)} Active time`, 'Leave out time the game wasn’t running (closed, asleep, background tab) — the window then covers that much actual play');
      h += '</div>';
      h += `<div class="ca-chipgroup">${chip('', 'data-plot-pause', 'Drag the chart (or scroll it sideways) to look further back')}</div>`;
      h += '</div>';
      h += '<div class="ca-legend" data-plot-legend></div>';
      if (spec.footer) h += '<div data-plot-footer></div>';
      h += '</div>';
      return h;
    }

    // ---- data ----

    function viewFor(plotW) {
      const ax = axis();
      const W = windowMs(ax);
      const x1 = view.getEnd(ax.now);
      const x0 = x1 - W;
      // bars only as wide as the screen needs; coarseness comes from smoothing, not wider bars
      const bucket = niceUp(W / Math.max(12, Math.min(MAX_AUTO_BARS, Math.round(plotW / BAR_PX))));
      const frames = CA.Recorder.frames();
      const lo = Math.max(0, CA.Recorder.lowerBound(x0, ax.key) - 1);
      const hi = Math.min(frames.length, CA.Recorder.lowerBound(x1, ax.key) + 1);
      const v = {
        key: ax.key,
        active: ax.key === 'a',
        x0,
        x1,
        W,
        now: ax.now,
        live: view.isLive(),
        bucket,
        smoothMs: spec.smooth !== false ? (opt('smooth') || 0) * SEC : 0,
        frames: frames.slice(lo, hi),
        tAt: ax.tAt,
        xAt: ax.xAt,
        opt,
        bucketize: (fields, b) => bucketize(v.frames, ax.key, x0, x1, b || bucket, fields),
        /** Same, but starting at `from` (< x0) — for plots that look back before the window. */
        bucketizeFrom: (fields, from) => {
          const lo2 = Math.max(0, CA.Recorder.lowerBound(from, ax.key) - 1);
          return bucketize(frames.slice(lo2, hi), ax.key, from, x1, bucket, fields);
        },
      };
      return v;
    }

    // ---- drawing ----

    function draw() {
      if (!canvas || !canvas.isConnected) return;
      const { w, h } = CA.UI.Chart.fitCanvas(canvas, ctx);
      if (w < 50 || h < 50) return;
      ctx.clearRect(0, 0, w, h);

      let v = viewFor(Math.max(50, w - padL - PAD.r));
      const data = spec.build(v) || {};
      // the build chose its own x axis (still windowed by time; drawn and hovered in its units)
      if (data.xAxis) v = { ...v, x0: data.xAxis.x0, x1: data.xAxis.x1, W: Math.max(1e-9, data.xAxis.x1 - data.xAxis.x0), active: false, bucket: 1, custom: data.xAxis };
      if (v.smoothMs > 0) smoothData(data, v.smoothMs);
      const prop = !!(spec.stacked && opt('prop'));
      fmt = prop ? pct : baseFmt;
      tipFmt = prop ? pct : baseTipFmt;
      if (prop) toProportions(data);
      lastData = { v, data };
      const series = data.series || [];
      const byKey = {};
      series.forEach((s) => (byKey[s.key] = s));
      const bars = data.bars || [];
      const lines = data.lines || {};
      const barSeries = series.filter((s) => s.type === 'bar');
      const log = spec.log != null && opt('log') && !prop;

      // effect lanes (bottom of the plot)
      const ivs = (data.intervals || []).filter((iv) => iv.x1 > v.x0 && iv.x0 < v.x1);
      const lanes = assignLanes(ivs);
      const laneCount = Math.min(MAX_LANES, lanes.count);
      const lanesH = laneCount ? laneCount * (LANE_H + LANE_GAP) + 2 : 0;

      // y range
      let maxV = -Infinity;
      let minV = Infinity;
      let minPos = Infinity; // smallest positive bar *total* / line value — what a log axis fits
      const see = (val, fit = true) => {
        if (!Number.isFinite(val)) return;
        if (val > maxV) maxV = val;
        if (val < minV) minV = val;
        if (fit && val > 0 && val < minPos) minPos = val;
      };
      bars.forEach((b) => {
        let pos = 0;
        let neg = 0;
        barSeries.forEach((s) => {
          const val = b.parts[s.key];
          if (!Number.isFinite(val)) return;
          if (val >= 0) pos += val;
          else neg += val;
          if (val > 0) see(val, false); // a thin slice on top mustn't drag a log axis down
        });
        // a bar that mostly covers time the game wasn't running mustn't set a log axis's floor —
        // it just gets trimmed at the bottom
        see(pos, activeShare(b) >= 0.5);
        see(neg);
      });
      // only lines actually drawn count — a hidden one (e.g. Net with Losses off) mustn't hold the axis
      series
        .filter((s) => (s.type === 'line' || s.type === 'area') && !s.noScale && lines[s.key])
        .forEach((s) => lines[s.key].forEach((p) => see(p.v, !p.bar || activeShare(p) >= 0.5)));
      (data.hlines || []).forEach((l) => see(l.v));
      if (data.zero !== false) see(0);

      let yMin;
      let yMax;
      let ticks = [];
      // Signed log ("symlog") when a log chart has negative values: sign(v)·log10(1 + |v| / C),
      // linear-ish near zero and logarithmic beyond C, so gains and losses both read on one axis.
      let symC = 0;
      if (log && minV < 0) {
        symC = isFinite(minPos) ? minPos / 10 : 1;
        const sym = (v) => Math.sign(v) * Math.log10(1 + Math.abs(v) / symC);
        const lo = Math.min(minV, 0) * 1.08;
        const hi = Math.max(maxV, 0) * 1.08;
        yMin = lo;
        yMax = hi;
        const side = (max) => (max > symC * 2 ? logTicks(symC * 2, max) : []);
        ticks = side(-lo)
          .map((t) => -t)
          .reverse()
          .concat([0], side(hi));
        while (ticks.length > 9) ticks = ticks.filter((t, i) => t === 0 || i % 2 === 0);
        lastData.sym = sym;
      } else if (log) {
        // Fit the axis to the data instead of whole powers of ten, so the variation fills the
        // chart: just under the smallest bar total / line value, just over the largest.
        if (!isFinite(minPos)) minPos = 1;
        if (!(maxV > 0)) maxV = minPos * 10;
        yMin = minPos / 1.25;
        yMax = maxV * 1.08;
        if (yMax / yMin < 1.5) {
          const mid = Math.sqrt(yMin * yMax);
          yMin = mid / 1.25;
          yMax = mid * 1.25;
        }
        ticks = logTicks(yMin, yMax);
      } else if (!isFinite(maxV)) {
        yMin = 0;
        yMax = 10;
        ticks = [0, 5, 10];
      } else if (minV >= 0 && data.zero !== false) {
        const top = maxV > 0 ? maxV * 1.08 : 10;
        const step = CA.UI.Chart.niceStep(top / 4);
        yMin = 0;
        yMax = Math.ceil(top / step) * step;
        for (let t = 0; t <= yMax * 1.0001; t += step) ticks.push(t);
      } else {
        ({ yMin, yMax, ticks } = CA.UI.Chart.niceLinearScale(minV, maxV));
      }

      lastData.scale = { yMin, yMax, log, symlog: symC > 0, ticks }; // the axis this draw chose (debugging, tests)
      const sym = symC > 0 ? (val) => Math.sign(val) * Math.log10(1 + Math.abs(val) / symC) : null;
      padL = CA.UI.Chart.dynamicPadLeft(ctx, FONT, ticks.map(fmt), MIN_PAD_L, PAD_L_MARGIN);
      const plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
      const chartH = plot.h - lanesH - (laneCount ? 4 : 0);
      const lanesTop = plot.y + plot.h - lanesH;
      const xOf = (x) => plot.x + ((x - v.x0) / v.W) * plot.w;
      const yOf = (val) => {
        let f;
        if (sym) f = (sym(val) - sym(yMin)) / (sym(yMax) - sym(yMin) || 1);
        else if (log) f = (Math.log10(Math.max(val, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
        else f = (val - yMin) / (yMax - yMin || 1);
        return plot.y + chartH - Math.max(0, Math.min(1, f)) * chartH;
      };

      // background
      const bg = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
      bg.addColorStop(0, 'rgba(255,255,255,0.045)');
      bg.addColorStop(1, 'rgba(255,255,255,0.01)');
      ctx.fillStyle = bg;
      ctx.fillRect(plot.x, plot.y, plot.w, plot.h);

      // effect shading
      const hoverIv = layout && layout.hoverIv;
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y, plot.w, plot.h);
      ctx.clip();
      ivs.forEach((iv) => {
        const a = Math.max(plot.x, xOf(iv.x0));
        const b = Math.min(plot.x + plot.w, xOf(iv.x1));
        if (b <= a) return;
        ctx.globalAlpha = iv === hoverIv ? 0.3 : 0.13;
        ctx.fillStyle = iv.color;
        ctx.fillRect(a, plot.y, b - a, plot.h);
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // y grid + labels
      ctx.font = FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.lineWidth = 1;
      ticks.forEach((t) => {
        const y = Math.round(yOf(t)) + 0.5;
        ctx.strokeStyle = t === 0 && yMin < 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.09)';
        ctx.beginPath();
        ctx.moveTo(plot.x, y);
        ctx.lineTo(plot.x + plot.w, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(230,220,200,0.75)';
        ctx.fillText(fmt(t), plot.x - 6, y);
      });

      drawXAxis(plot, v, xOf);

      // bars
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y - 4, plot.w, chartH + 8);
      ctx.clip();
      const y0 = yOf(log && !sym ? yMin : Math.max(yMin, Math.min(yMax, 0)));
      const hoverBar = layout && layout.hoverBar;
      bars.forEach((b) => {
        const xL = xOf(b.x0);
        const xR = xOf(b.x1);
        const full = xR - xL;
        const gap = full > 3 ? full * BAR_GAP_FRAC : 0;
        const bx = xL + gap / 2;
        const bw = Math.max(1, full - gap);
        let pos = 0;
        let neg = 0;
        barSeries.forEach((s) => {
          const val = b.parts[s.key];
          if (!Number.isFinite(val) || val === 0) return;
          let ya;
          let yb;
          if (val > 0) {
            ya = pos === 0 ? y0 : yOf(pos);
            pos += val;
            yb = yOf(pos);
          } else {
            ya = neg === 0 ? y0 : yOf(neg);
            neg += val;
            yb = yOf(neg);
          }
          ctx.fillStyle = s.color;
          ctx.globalAlpha = hoverBar && hoverBar !== b ? 0.8 : 1;
          ctx.fillRect(bx, Math.min(ya, yb), bw, Math.abs(yb - ya));
        });
      });
      ctx.globalAlpha = 1;

      // lines / areas
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      series
        .filter((s) => s.type === 'line' || s.type === 'area')
        .forEach((s) => {
          const pts = lines[s.key] || [];
          segments(pts, v.bucket).forEach((seg) => {
            if (!seg.length) return;
            ctx.beginPath();
            seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.x), yOf(p.v)) : ctx.moveTo(xOf(p.x), yOf(p.v))));
            if (seg.length === 1) ctx.lineTo(xOf(seg[0].x) + 0.01, yOf(seg[0].v));
            if (s.type === 'area') {
              ctx.save();
              ctx.lineTo(xOf(seg[seg.length - 1].x), y0);
              ctx.lineTo(xOf(seg[0].x), y0);
              ctx.closePath();
              ctx.globalAlpha = 0.18;
              ctx.fillStyle = s.color;
              ctx.fill();
              ctx.restore();
              ctx.beginPath();
              seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.x), yOf(p.v)) : ctx.moveTo(xOf(p.x), yOf(p.v))));
            }
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width || 1.6;
            ctx.setLineDash(s.dash ? [4, 3] : []);
            ctx.stroke();
            ctx.setLineDash([]);
          });
        });
      ctx.restore();

      // horizontal reference lines (averages)
      (data.hlines || []).forEach((l) => {
        if (!Number.isFinite(l.v)) return;
        const y = Math.round(yOf(l.v)) + 0.5;
        ctx.save();
        ctx.strokeStyle = l.color || 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(plot.x, y);
        ctx.lineTo(plot.x + plot.w, y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (l.label) {
          ctx.font = 'bold 9px Tahoma, Arial, sans-serif';
          ctx.textAlign = 'left';
          const above = y - plot.y >= 12;
          ctx.textBaseline = above ? 'bottom' : 'top';
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillText(l.label, plot.x + 4, y + (above ? -2 : 2));
        }
        ctx.restore();
      });

      // effect lanes
      const laneRects = [];
      ivs.forEach((iv) => {
        const lane = lanes.lanes.get(iv);
        if (lane >= MAX_LANES) return;
        const a = Math.max(plot.x, xOf(iv.x0));
        const b = Math.min(plot.x + plot.w, xOf(iv.x1));
        if (b <= a) return;
        const y = lanesTop + 2 + lane * (LANE_H + LANE_GAP);
        ctx.fillStyle = iv.color;
        ctx.globalAlpha = iv === hoverIv ? 1 : 0.85;
        roundRect(a, y, Math.max(2, b - a), LANE_H, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        // the effect's own icon (from the game's icon sheet) at the start of its lane
        let textX = a + 4;
        const img = iconSheet();
        if (iv.icon && img && b - a >= LANE_H) {
          ctx.drawImage(img, iv.icon[0] * 48, iv.icon[1] * 48, 48, 48, a + 1, y, LANE_H, LANE_H);
          textX = a + LANE_H + 3;
        }
        if (b - a > 46 && iv.label) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(a, y, b - a, LANE_H);
          ctx.clip();
          ctx.font = 'bold 9px Tahoma, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillText(iv.label, textX, y + LANE_H / 2 + 0.5);
          ctx.restore();
        }
        laneRects.push({ iv, x0: a, x1: b, y, y1: y + LANE_H });
      });

      // cut-out inactive stretches (active-time mode)
      const gapRects = [];
      if (v.active) {
        gapsIn(v.frames, 'a', v.x0, v.x1).forEach((g) => {
          const x = Math.round(xOf(g.x)) + 0.5;
          if (x < plot.x || x > plot.x + plot.w) return;
          ctx.strokeStyle = 'rgba(255,255,255,0.28)';
          ctx.setLineDash([1, 3]);
          ctx.beginPath();
          ctx.moveTo(x, plot.y);
          ctx.lineTo(x, plot.y + chartH);
          ctx.stroke();
          ctx.setLineDash([]);
          gapRects.push({ x, g });
        });
      }

      // event markers
      const evRects = [];
      (data.markers || []).forEach((m) => {
        if (m.x < v.x0 || m.x > v.x1) return;
        const x = xOf(m.x);
        if (m.line) {
          ctx.strokeStyle = m.color;
          ctx.globalAlpha = 0.7;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, plot.y);
          ctx.lineTo(Math.round(x) + 0.5, plot.y + plot.h);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        const y = plot.y + 7;
        ctx.fillStyle = m.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x + 4.5, y);
        ctx.lineTo(x, y + 5);
        ctx.lineTo(x - 4.5, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        evRects.push({ m, x, y });
      });

      layout = { plot, xOf, yOf, v, data, bars, laneRects, evRects, gapRects, hoverIv: null, hoverBar: null, chartH, byKey };

      const dragging = panCtl && panCtl.isDragging();
      if (!dragging && hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHover(w, h);
      else if (tipEl) tipEl.style.display = 'none';

      if (!bars.length && !Object.keys(lines).some((k) => lines[k].length)) {
        ctx.fillStyle = 'rgba(230,220,200,0.6)';
        ctx.font = '12px Tahoma, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const msg = !S().get('trackHistory') ? 'History recording is off (Settings)' : data.empty || 'Collecting data…';
        ctx.fillText(msg, plot.x + plot.w / 2, plot.y + plot.h / 2);
      }
    }

    function drawXAxis(plot, v, xOf) {
      if (v.custom) {
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        (v.custom.labels || []).forEach((l) => {
          const px = Math.round(xOf(l.x)) + 0.5;
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.beginPath();
          ctx.moveTo(px, plot.y);
          ctx.lineTo(px, plot.y + plot.h);
          ctx.stroke();
          if (px > plot.x + 16 && px < plot.x + plot.w - 16) {
            ctx.fillStyle = 'rgba(230,220,200,0.7)';
            ctx.fillText(l.label, px, plot.y + plot.h + 7);
          }
        });
        return;
      }
      const steps = NICE_MS.filter((s) => s >= 5 * SEC);
      const stepMs = steps.find((s) => v.W / s <= Math.max(3, Math.floor(plot.w / 78))) || steps[steps.length - 1];
      const long = stepMs >= 6 * 3600 * SEC;
      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // wall-clock axis: align ticks to the local clock; active axis: evenly spaced, labelled
      // with the wall-clock time at that point
      const tz = v.active ? 0 : new Date(v.x0).getTimezoneOffset() * 60000;
      for (let x = Math.ceil((v.x0 - tz) / stepMs) * stepMs + tz; x <= v.x1; x += stepMs) {
        const px = Math.round(xOf(x)) + 0.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(px, plot.y);
        ctx.lineTo(px, plot.y + plot.h);
        ctx.stroke();
        if (px > plot.x + 16 && px < plot.x + plot.w - 16) {
          const t = v.tAt(x);
          ctx.fillStyle = 'rgba(230,220,200,0.7)';
          ctx.fillText(long ? dayClock(t) : clock(t, stepMs < 60 * SEC), px, plot.y + plot.h + 7);
        }
      }
    }

    function segments(pts, bucket) {
      const out = [];
      let cur = [];
      const maxGap = Math.max(GAP_MS, bucket * 1.6);
      pts.forEach((p, i) => {
        if (i && (p.x0 != null && pts[i - 1].x1 != null ? p.x0 - pts[i - 1].x1 > maxGap : p.x - pts[i - 1].x > maxGap * 2)) {
          out.push(cur);
          cur = [];
        }
        cur.push(p);
      });
      if (cur.length) out.push(cur);
      return out;
    }

    function assignLanes(ivs) {
      const sorted = ivs.slice().sort((a, b) => a.x0 - b.x0);
      const ends = [];
      const lanes = new Map();
      sorted.forEach((iv) => {
        let lane = ends.findIndex((e) => e <= iv.x0);
        if (lane === -1) lane = ends.length;
        ends[lane] = iv.x1;
        lanes.set(iv, lane);
      });
      return { lanes, count: ends.length };
    }

    function roundRect(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // ---- hover ----

    function nearest(pts, x) {
      let lo = 0;
      let hi = pts.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].x < x) lo = mid + 1;
        else hi = mid;
      }
      if (lo > 0 && (lo >= pts.length || x - pts[lo - 1].x < pts[lo].x - x)) lo--;
      return pts[lo];
    }

    function drawHover(w, h) {
      const L = layout;
      const { plot, v, data } = L;
      const x = v.x0 + ((hover.x - plot.x) / plot.w) * v.W;
      const hitEv = L.evRects.find((r) => Math.abs(r.x - hover.x) < 7 && Math.abs(r.y - hover.y) < 9);
      const hitLane = L.laneRects.find((r) => hover.x >= r.x0 && hover.x <= r.x1 && hover.y >= r.y - 1 && hover.y <= r.y1 + 1);
      const hitGap = L.gapRects.find((r) => Math.abs(r.x - hover.x) < 3);
      const bar = L.bars.find((b) => x >= b.x0 && x < b.x1) || null;
      L.hoverIv = hitLane ? hitLane.iv : null;
      L.hoverBar = !hitEv && !hitLane ? bar : null;

      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
      ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
      ctx.stroke();

      let html;
      if (hitEv) html = hitEv.m.tip ? hitEv.m.tip() : '';
      else if (hitLane) html = hitLane.iv.tip ? hitLane.iv.tip() : esc(hitLane.iv.label || '');
      else if (hitGap) {
        const g = hitGap.g;
        html =
          `<div class="ca-tip-head">Not running<span>${clock(g.from)} – ${clock(g.to)}</span></div>` +
          `<div class="ca-tip-note">${span(g.away / SEC)} without the game running, left out of this axis.</div>`;
      } else html = barTip(x, bar);

      // hover dots on lines
      (data.series || [])
        .filter((s) => s.type === 'line' || s.type === 'area')
        .forEach((s) => {
          const pts = (data.lines || {})[s.key] || [];
          const p = pts.length ? nearest(pts, x) : null;
          if (!p || Math.abs(L.xOf(p.x) - hover.x) > 24) return;
          ctx.fillStyle = s.color;
          ctx.strokeStyle = '#000';
          ctx.beginPath();
          ctx.arc(L.xOf(p.x), L.yOf(p.v), 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

      tipEl.innerHTML = html;
      tipEl.style.display = html ? 'block' : 'none';
      if (!html) return;
      // fixed to the window, so the card's edges (overflow: hidden) never cut it off
      const tw = tipEl.offsetWidth;
      const th = tipEl.offsetHeight;
      const r = canvas.getBoundingClientRect();
      const W = window.innerWidth || r.right;
      const H = window.innerHeight || r.bottom;
      const vx = r.left + hover.x;
      const vy = r.top + hover.y;
      let left = vx + 16;
      if (left + tw > W - 4) left = vx - tw - 16;
      let top = vy + 12;
      if (top + th > H - 4) top = H - th - 4;
      tipEl.style.left = Math.max(4, left) + 'px';
      tipEl.style.top = Math.max(4, top) + 'px';
    }

    function barTip(x, bar) {
      const { v, data } = layout;
      let h;
      if (v.custom) h = `<div class="ca-tip-head">${v.custom.head ? v.custom.head(bar, x) : ''}</div>`;
      else {
        const t = bar ? v.tAt(bar.x1) : v.tAt(x);
        const width = bar ? (bar.x1 - bar.x0) / SEC : 0;
        const when = bar && width >= 2 ? `${clock(v.tAt(bar.x0), width < 120)} – ${clock(t, width < 120)}` : clock(t, true);
        const ago = (Date.now() - t) / SEC;
        h = `<div class="ca-tip-head">${when}<span>${ago > 1.5 ? span(ago) + ' ago' : 'now'}</span></div>`;
      }
      let any = false;
      const barSeries = (data.series || []).filter((s) => s.type === 'bar');
      let total = 0;
      let parts = 0;
      if (bar) {
        // series that share a `merge` group show as one row, their figures side by side:
        // "Clicking (raw / boosted)  1.2K / 3.4K" (merge: { id, name, label, order, add })
        const rows = [];
        const groups = {};
        barSeries.forEach((s) => {
          const val = bar.parts[s.key];
          if (!Number.isFinite(val)) return;
          if (val !== 0) {
            total += val;
            parts++;
          }
          if (!s.merge) {
            if (val !== 0 || s.hideZero === false) rows.push({ color: s.color, name: s.name, value: tipFmt(val) });
            return;
          }
          let gp = groups[s.merge.id];
          if (!gp) {
            gp = groups[s.merge.id] = { color: s.color, name: s.merge.name, cells: [], nonzero: false };
            rows.push(gp);
          }
          // "boosted" shows the whole (raw + boost), like the tables
          const shown = s.merge.add ? (bar.parts[s.merge.add] || 0) + val : val;
          gp.cells.push({ label: s.merge.label, v: shown, order: s.merge.order || 0 });
          if (val !== 0) gp.nonzero = true;
        });
        rows.forEach((r) => {
          if (!r.cells) h += row(r.color, r.name, r.value);
          else if (r.nonzero) {
            const cells = r.cells.sort((a, b) => a.order - b.order);
            h += row(r.color, `${r.name} (${cells.map((c) => c.label).join(' · ')})`, joinFigures(cells.map((c) => tipFmt(c.v))));
          } else return;
          any = true;
        });
        if (parts > 1 && spec.total !== false) h += row('transparent', spec.totalLabel || 'Total', tipFmt(total), true);
      }
      (data.series || [])
        .filter((s) => s.type === 'line' || s.type === 'area')
        .forEach((s) => {
          const pts = (data.lines || {})[s.key] || [];
          const p = pts.length ? nearest(pts, x) : null;
          if (!p || Math.abs(p.x - x) > Math.max(v.bucket * 1.5, 3 * SEC)) return;
          h += row(s.color, s.name, (s.fmt || tipFmt)(p.v), false, s.dash);
          any = true;
        });
      if (spec.tip) {
        const extra = spec.tip(bar, v, data, x);
        if (extra) {
          h += extra;
          any = true;
        }
      }
      if (!any) h += '<div class="ca-tip-note">No data here.</div>';
      else if (v.smoothMs > 0) h += `<div class="ca-tip-note">Averaged over the ${windowLabel(v.smoothMs / SEC)} around this point</div>`;
      return h;
    }

    // ---- info ----

    function refreshInfo() {
      if (!root) return;
      const live = root.querySelector('[data-plot-live]');
      if (live) {
        live.textContent = view.isLive() ? 'Live' : 'Paused';
        live.classList.toggle('paused', !view.isLive());
      }
      const pause = root.querySelector('[data-plot-pause]');
      if (pause) pause.textContent = view.isLive() ? 'Pause' : 'Jump to live';
      if (!lastData) return;
      const { v, data } = lastData;
      const stats = root.querySelector('[data-plot-stats]');
      if (stats && spec.stats) stats.innerHTML = spec.stats(v, data);
      const footer = root.querySelector('[data-plot-footer]');
      if (footer && spec.footer) footer.innerHTML = spec.footer(v, data);
      const legend = root.querySelector('[data-plot-legend]');
      if (legend) {
        const items = (data.legend || data.series || []).filter((s) => !s.noLegend);
        legend.innerHTML =
          items.map((s) => `<span class="ca-legend-item">${swatch(s.color, s.dash)}${esc(s.name)}</span>`).join('') +
          (data.legendExtra || '');
      }
    }

    function tick() {
      if (!root) return;
      if (!root.isConnected) {
        unmount();
        return;
      }
      draw();
      refreshInfo();
    }

    function onClick(e) {
      const set = e.target.closest('[data-plot-set]');
      const tog = e.target.closest('[data-plot-toggle]');
      const pause = e.target.closest('[data-plot-pause]');
      if (!set && !tog && !pause) return;
      e.stopPropagation();
      if (e.target.blur) e.target.blur();
      CA.Util.sound('snd/tick.mp3');
      if (set) {
        const k = set.dataset.plotSet;
        const cur = S().get(k);
        const raw = set.dataset.val;
        S().set(k, typeof cur === 'number' ? Number(raw) : raw);
        if (k === key('win')) view.resume();
      } else if (tog) {
        S().set(tog.dataset.plotToggle, !S().get(tog.dataset.plotToggle));
      } else {
        setPaused(view.isLive());
      }
      tick();
    }

    function mount(pageRoot) {
      unmount();
      root = pageRoot.querySelector(`[data-plot="${id}"]`);
      if (!root) return;
      canvas = root.querySelector('[data-plot-canvas]');
      // the hover box lives in the floating layer (ui/tips.js), above the game's panels
      tipEl = CA.UI.Tips.float('ca-tip');
      tipEl.dataset.plotTip = id;
      ctx = canvas.getContext('2d');
      root.addEventListener('click', onClick);
      canvas.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        hover = { x: e.clientX - r.left, y: e.clientY - r.top };
        const before = layout && (layout.hoverIv || layout.hoverBar);
        draw();
        if (layout && (layout.hoverIv || layout.hoverBar) !== before) draw();
      });
      canvas.addEventListener('mouseleave', () => {
        hover = null;
        if (layout) layout.hoverIv = layout.hoverBar = null;
        draw();
      });
      if (window.ResizeObserver) {
        observer = new ResizeObserver(() => draw());
        observer.observe(canvas);
      }
      panCtl = view.attachPan(
        canvas,
        () => {
          const ax = axis();
          return { windowMs: windowMs(ax), plotWidthPx: (layout && layout.plot.w) || canvas.clientWidth, liveNow: ax.now, minT: ax.min };
        },
        draw
      );
      tick();
    }

    function unmount() {
      if (observer) observer.disconnect();
      observer = null;
      if (panCtl) panCtl.detach();
      panCtl = null;
      if (root) root.removeEventListener('click', onClick);
      if (tipEl) tipEl.remove();
      root = canvas = ctx = tipEl = null;
      hover = null;
      layout = null;
    }

    function setPaused(p) {
      if (p === !view.isLive()) return;
      if (p) view.freeze(axis().now);
      else view.resume();
    }

    const inst = {
      id,
      spec,
      html,
      mount,
      unmount,
      tick,
      draw,
      setPaused,
      isPaused: () => !view.isLive(),
      isMounted: () => !!root,
      resume: () => view.resume(),
      last: () => lastData,
    };
    all.set(id, inst);
    return inst;
  }

  // Switching between wall-clock and active time invalidates every frozen view position.
  function init() {
    S().defineOption({
      key: 'graphActiveTime',
      group: 'graph',
      icon: 'clock',
      name: 'Active time only',
      desc: 'Graphs leave out time the game wasn’t running (closed, asleep, background tab) — a 1h window then covers an hour of actual play.',
      default: false,
    });
    CA.Events.on('settings', (k) => {
      if (k === 'graphActiveTime' || k === null) all.forEach((p) => p.resume());
      all.forEach((p) => p.isMounted() && p.tick());
    });
  }

  return {
    init,
    create,
    get: (id) => all.get(id),
    bucketize,
    movingAverage,
    logTicks,
    linePoints,
    smooth,
    axis,
    fmt: { beautify, signed, short, clock, span, tile, row, swatch, windowLabel, joinFigures },
    SEC,
    SESSION_START, // "this session" = since CookieMgr was loaded in this tab
  };
})();
