// The live CpS graph: a canvas line chart with shaded regions for active effects,
// event markers, and a hover tooltip. Data comes from CA.History; the view is driven by
// settings so the choices survive reloads.

CA.UI = CA.UI || {};

CA.UI.Graph = (() => {
  const WINDOWS = [
    { s: 60, label: '1m' },
    { s: 300, label: '5m' },
    { s: 900, label: '15m' },
    { s: 3600, label: '1h' },
    { s: 10800, label: '3h' },
  ];
  const SMOOTHING = [
    { s: 0, label: 'Raw' },
    { s: 5, label: '5s' },
    { s: 15, label: '15s' },
  ];
  const SERIES = {
    base: { color: '#9db4cc', name: 'Unbuffed CpS' },
    cps: { color: '#f5c451', name: 'Production' },
    total: { color: '#7fe08b', name: 'With clicking' },
  };
  const PAD = { l: 54, r: 14, t: 14, b: 26 };
  const LANE_H = 8;
  const LANE_GAP = 2;
  const MAX_LANES = 6;
  const GAP_MS = 5000; // a longer hole between samples breaks the line

  let root = null;
  let canvas = null;
  let ctx = null;
  let tip = null;
  let observer = null;
  let timer = null;
  let hover = null; // { x, y } in css px
  let paused = false;
  let pausedAt = 0;
  let layout = null; // hit-test info from the last draw

  const S = () => CA.Settings;

  // ---- formatting ----------------------------------------------------------------

  const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function short(v) {
    if (!isFinite(v)) return '0';
    const sign = v < 0 ? '-' : '';
    v = Math.abs(v);
    if (v < 1000) return sign + (v < 10 ? v.toFixed(v < 1 && v > 0 ? 2 : 1).replace(/\.0+$/, '') : Math.round(v));
    let i = 0;
    while (v >= 1000 && i < SUFFIX.length - 1) {
      v /= 1000;
      i++;
    }
    return sign + (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v)).toString().replace(/\.0+$/, '') + SUFFIX[i];
  }
  const beautify = (v) => (typeof Beautify === 'function' ? Beautify(v, 1) : short(v));

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t, withSeconds) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}` + (withSeconds ? `:${two(d.getSeconds())}` : '');
  }
  function span(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${two(sec % 60)}s`;
    return `${Math.floor(sec / 3600)}h ${two(Math.floor((sec % 3600) / 60))}m`;
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  // ---- data preparation ----------------------------------------------------------

  const windowMs = () => Math.max(10, S().get('graphWindow')) * 1000;
  const endTime = () => (paused ? pausedAt : Date.now());

  /** Rolling mean over the previous k samples (k <= 1 leaves the values alone). */
  function smooth(values, k) {
    if (k <= 1) return values;
    const out = new Array(values.length);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= k) sum -= values[i - k];
      out[i] = sum / Math.min(i + 1, k);
    }
    return out;
  }

  /** Splits into segments at gaps, then averages down to about one point per pixel. */
  function buildSegments(list, valueOf, t0, W, plotW) {
    const segs = [];
    let cur = [];
    for (let i = 0; i < list.length; i++) {
      if (i && list[i].t - list[i - 1].t > GAP_MS) {
        if (cur.length) segs.push(cur);
        cur = [];
      }
      cur.push({ t: list[i].t, v: valueOf(i) });
    }
    if (cur.length) segs.push(cur);
    if (list.length <= plotW * 1.5) return segs;
    return segs.map((seg) => {
      const buckets = new Map();
      seg.forEach((p) => {
        const key = Math.floor(((p.t - t0) / W) * plotW);
        const b = buckets.get(key) || { t: 0, v: 0, n: 0 };
        b.t += p.t;
        b.v += p.v;
        b.n++;
        buckets.set(key, b);
      });
      return [...buckets.values()].map((b) => ({ t: b.t / b.n, v: b.v / b.n }));
    });
  }

  function assignLanes(ivs, now) {
    const sorted = ivs.slice().sort((a, b) => a.start - b.start);
    const ends = [];
    const lanes = new Map();
    sorted.forEach((iv) => {
      let lane = ends.findIndex((e) => e <= iv.start);
      if (lane === -1) lane = ends.length;
      ends[lane] = iv.end || now;
      lanes.set(iv, lane);
    });
    return { lanes, count: ends.length };
  }

  // ---- drawing -------------------------------------------------------------------

  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = fitCanvas();
    if (w < 50 || h < 50) return;
    ctx.clearRect(0, 0, w, h);

    const W = windowMs();
    const t1 = endTime();
    const t0 = t1 - W;
    const now = Date.now();
    const plot = { x: PAD.l, y: PAD.t, w: w - PAD.l - PAD.r, h: h - PAD.t - PAD.b };
    const xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    const showEffects = S().get('graphEffects');
    const ivs = showEffects ? CA.History.intervalsIn(t0, t1) : [];
    const laneInfo = assignLanes(ivs, now);
    const laneCount = Math.min(MAX_LANES, laneInfo.count);
    const lanesH = laneCount ? laneCount * (LANE_H + LANE_GAP) + 2 : 0;
    const lanesTop = plot.y + plot.h - lanesH;
    const chartH = plot.h - lanesH - (laneCount ? 4 : 0); // vertical room for the lines

    // --- visible samples (one extra before/after so lines reach the edges)
    const all = CA.History.samples;
    const smoothK = Math.max(1, S().get('graphSmooth'));
    const lo = Math.max(0, CA.History.lowerBound(t0) - 1 - smoothK);
    let hi = CA.History.lowerBound(t1);
    hi = Math.min(all.length, hi + 1);
    const list = all.slice(lo, hi);
    const visStart = list.findIndex((s) => s.t >= t0 - 1000);
    const cutoff = visStart === -1 ? list.length : visStart;

    const want = {
      base: S().get('graphShowBase'),
      cps: S().get('graphShowCps'),
      total: S().get('graphShowTotal'),
    };
    const raw = {
      base: list.map((s) => s.base),
      cps: list.map((s) => s.cps),
      total: list.map((s) => s.cps + s.click),
    };
    const series = {};
    Object.keys(want).forEach((k) => {
      if (!want[k]) return;
      const vals = smooth(raw[k], smoothK);
      series[k] = buildSegments(list.slice(cutoff), (i) => vals[i + cutoff], t0, W, plot.w);
    });

    // --- y scale
    const log = S().get('graphLog');
    let maxV = 0;
    let minPos = Infinity;
    Object.values(series).forEach((segs) =>
      segs.forEach((seg) =>
        seg.forEach((p) => {
          if (p.v > maxV) maxV = p.v;
          if (p.v > 0 && p.v < minPos) minPos = p.v;
        })
      )
    );
    let yMin = 0;
    let yMax = 1;
    let ticks = [];
    if (log) {
      if (!isFinite(minPos)) minPos = 1;
      if (maxV <= 0) maxV = 10;
      yMin = Math.pow(10, Math.floor(Math.log10(minPos)));
      yMax = Math.pow(10, Math.ceil(Math.log10(maxV * 1.02)));
      if (yMax / yMin < 10) yMax = yMin * 10;
      for (let v = yMin; v <= yMax * 1.0001; v *= 10) ticks.push(v);
      while (ticks.length > 7) ticks = ticks.filter((_, i) => i % 2 === 0);
    } else {
      yMax = maxV > 0 ? maxV * 1.08 : 10;
      const step = niceStep(yMax / 4);
      yMax = Math.ceil(yMax / step) * step;
      for (let v = 0; v <= yMax * 1.0001; v += step) ticks.push(v);
    }
    const yOf = (v) => {
      let f;
      if (log) f = (Math.log10(Math.max(v, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
      else f = (v - yMin) / (yMax - yMin);
      return plot.y + chartH - Math.max(0, Math.min(1, f)) * chartH;
    };

    // --- background
    const bg = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
    bg.addColorStop(0, 'rgba(255,255,255,0.045)');
    bg.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = bg;
    ctx.fillRect(plot.x, plot.y, plot.w, plot.h);

    // --- effect shading (overlaps simply add up, which is how stacking shows)
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    const hoverIv = layout && layout.hoverIv;
    ivs.forEach((iv) => {
      const x0 = Math.max(plot.x, xOf(iv.start));
      const x1 = Math.min(plot.x + plot.w, xOf(iv.end || now));
      if (x1 <= x0) return;
      ctx.globalAlpha = iv === hoverIv ? 0.3 : 0.13;
      ctx.fillStyle = CA.History.colorFor(iv.name);
      ctx.fillRect(x0, plot.y, x1 - x0, plot.h);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // --- grid + y labels
    ctx.font = '10px Tahoma, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    ticks.forEach((v) => {
      const y = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(short(v), plot.x - 6, y);
    });

    // --- x grid + labels (aligned to wall-clock time so labels stay put while scrolling)
    const steps = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200].map((x) => x * 1000);
    const stepMs = steps.find((s) => W / s <= Math.max(3, Math.floor(plot.w / 78))) || steps[steps.length - 1];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tz = new Date(t0).getTimezoneOffset() * 60000;
    for (let t = Math.ceil((t0 - tz) / stepMs) * stepMs + tz; t <= t1; t += stepMs) {
      const x = Math.round(xOf(t)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.stroke();
      if (x > plot.x + 16 && x < plot.x + plot.w - 16) {
        ctx.fillStyle = 'rgba(230,220,200,0.7)';
        ctx.fillText(clock(t, stepMs < 60000), x, plot.y + plot.h + 7);
      }
    }

    // --- lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 4, plot.w, chartH + 8);
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const trace = (segs, close) => {
      segs.forEach((seg) => {
        if (!seg.length) return;
        ctx.beginPath();
        seg.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
        if (seg.length === 1) ctx.lineTo(xOf(seg[0].t) + 0.01, yOf(seg[0].v));
        if (close) {
          ctx.lineTo(xOf(seg[seg.length - 1].t), plot.y + chartH);
          ctx.lineTo(xOf(seg[0].t), plot.y + chartH);
          ctx.closePath();
        }
      });
    };
    const strokeSeries = (key, width, dash) => {
      const segs = series[key];
      if (!segs) return;
      ctx.strokeStyle = SERIES[key].color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash || []);
      segs.forEach((seg) => {
        trace([seg], false);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    };
    // fill under the main visible series
    const fillKey = series.cps ? 'cps' : series.total ? 'total' : series.base ? 'base' : null;
    if (fillKey) {
      const grad = ctx.createLinearGradient(0, plot.y, 0, plot.y + chartH);
      grad.addColorStop(0, hexToRgba(SERIES[fillKey].color, 0.3));
      grad.addColorStop(1, hexToRgba(SERIES[fillKey].color, 0.02));
      ctx.fillStyle = grad;
      series[fillKey].forEach((seg) => {
        trace([seg], true);
        ctx.fill();
      });
    }
    strokeSeries('base', 1.4, [4, 3]);
    strokeSeries('total', 1.6);
    strokeSeries('cps', 2);
    ctx.restore();

    // --- effect lanes
    const laneRects = [];
    ivs.forEach((iv) => {
      const lane = laneInfo.lanes.get(iv);
      if (lane >= MAX_LANES) return;
      const x0 = Math.max(plot.x, xOf(iv.start));
      const x1 = Math.min(plot.x + plot.w, xOf(iv.end || now));
      if (x1 <= x0) return;
      const y = lanesTop + 2 + lane * (LANE_H + LANE_GAP);
      const color = CA.History.colorFor(iv.name);
      ctx.fillStyle = color;
      ctx.globalAlpha = iv === hoverIv ? 1 : 0.85;
      roundRect(ctx, x0, y, Math.max(2, x1 - x0), LANE_H, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (x1 - x0 > 46) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y, x1 - x0, LANE_H);
        ctx.clip();
        ctx.font = 'bold 8px Tahoma, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(iv.label, x0 + 4, y + LANE_H / 2 + 0.5);
        ctx.restore();
      }
      laneRects.push({ iv, x0, x1, y, y1: y + LANE_H });
    });

    // --- events (ascension lines, golden/reindeer markers)
    const evRects = [];
    if (S().get('graphEvents')) {
      CA.History.events.forEach((ev) => {
        if (ev.t < t0 || ev.t > t1) return;
        const x = xOf(ev.t);
        if (ev.kind === 'ascend') {
          ctx.strokeStyle = 'rgba(200,190,255,0.7)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, plot.y);
          ctx.lineTo(Math.round(x) + 0.5, plot.y + plot.h);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const y = plot.y + 7;
        ctx.fillStyle = eventColor(ev.kind);
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
        evRects.push({ ev, x, y });
      });
    }

    layout = { plot, xOf, yOf, t0, t1, laneRects, evRects, hoverIv: null, series, chartH };

    // --- hover
    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) {
      drawHover(w, h, plot, t0, W, laneRects, evRects, list);
    } else if (tip) {
      tip.style.display = 'none';
    }

    // --- empty state
    if (!list.length) {
      ctx.fillStyle = 'rgba(230,220,200,0.6)';
      ctx.font = '12px Tahoma, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        S().get('trackHistory') ? 'Collecting data…' : 'History recording is off (Settings tab)',
        plot.x + plot.w / 2,
        plot.y + plot.h / 2
      );
    }
  }

  function drawHover(w, h, plot, t0, W, laneRects, evRects, list) {
    const t = t0 + ((hover.x - plot.x) / plot.w) * W;
    // what is under the pointer?
    const hitEv = evRects.find((r) => Math.abs(r.x - hover.x) < 7 && Math.abs(r.y - hover.y) < 9);
    const hitLane = laneRects.find((r) => hover.x >= r.x0 && hover.x <= r.x1 && hover.y >= r.y - 1 && hover.y <= r.y1 + 1);
    layout.hoverIv = hitLane ? hitLane.iv : null;

    // crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
    ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
    ctx.stroke();

    // nearest sample
    const all = CA.History.samples;
    let idx = CA.History.lowerBound(t);
    if (idx > 0 && (idx >= all.length || t - all[idx - 1].t < all[idx].t - t)) idx--;
    const s = all[idx];
    const near = s && Math.abs(s.t - t) < Math.max(3000, W / 40) ? s : null;

    let html = '';
    if (hitEv) html = eventTip(hitEv.ev);
    else if (hitLane) html = intervalTip(hitLane.iv);
    else html = sampleTip(t, near);

    if (near && !hitEv && !hitLane) {
      const dots = [
        ['base', near.base],
        ['cps', near.cps],
        ['total', near.cps + near.click],
      ];
      dots.forEach(([k, v]) => {
        if (!layout.series[k]) return;
        ctx.fillStyle = SERIES[k].color;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.arc(layout.xOf(near.t), layout.yOf(v), 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    tip.innerHTML = html;
    tip.style.display = 'block';
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = hover.x + 16;
    if (left + tw > w - 4) left = hover.x - tw - 16;
    let top = hover.y + 12;
    if (top + th > h) top = Math.max(2, h - th - 2);
    tip.style.left = Math.max(2, left) + 'px';
    tip.style.top = top + 'px';
  }

  // ---- tooltips ------------------------------------------------------------------

  const esc = (s) => CA.Util.escapeHtml(s);
  const swatch = (c) => `<i class="ca-sw" style="background:${c}"></i>`;

  function activeAt(t) {
    const now = Date.now();
    return CA.History.intervals.filter((iv) => iv.start <= t && (iv.end || now) >= t);
  }

  function sampleTip(t, s) {
    const ago = (Date.now() - t) / 1000;
    let h = `<div class="ca-tip-head">${clock(t, true)}<span>${paused || ago > 1.5 ? span(ago) + ' ago' : 'now'}</span></div>`;
    if (s) {
      const total = s.cps + s.click;
      h += row(SERIES.cps.color, SERIES.cps.name, beautify(s.cps) + '/s');
      if (s.click > 0.01) h += row(SERIES.total.color, 'Clicking', '+' + beautify(s.click) + '/s');
      h += row(SERIES.total.color, 'Total', beautify(total) + '/s', true);
      if (Math.abs(s.base - s.cps) > 0.01) h += row(SERIES.base.color, 'Without effects', beautify(s.base) + '/s');
    } else {
      h += '<div class="ca-tip-note">No data here yet.</div>';
    }
    const act = activeAt(t);
    if (act.length) {
      h += '<div class="ca-tip-sep"></div>';
      act.forEach((iv) => {
        const left = Math.max(0, ((iv.end || Date.now()) - t) / 1000);
        h += row(CA.History.colorFor(iv.name), iv.label, mults(iv) + ' · ' + span(left) + ' left');
      });
    }
    return h;
  }

  function mults(iv) {
    const bits = [];
    if (Math.abs(iv.multCps - 1) > 0.001) bits.push(`×${trim(iv.multCps)} CpS`);
    if (Math.abs(iv.multClick - 1) > 0.001) bits.push(`×${trim(iv.multClick)} clicks`);
    return bits.length ? bits.join(', ') : 'no CpS change';
  }
  const trim = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 100) / 100);

  function row(color, name, value, strong) {
    return `<div class="ca-tip-row${strong ? ' strong' : ''}">${swatch(color)}<b>${esc(name)}</b><span>${esc(value)}</span></div>`;
  }

  function intervalTip(iv) {
    const now = Date.now();
    const end = iv.end || now;
    let h = `<div class="ca-tip-head">${swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}<span>${iv.end ? '' : 'active'}</span></div>`;
    if (iv.desc) h += `<div class="ca-tip-note">${esc(iv.desc)}</div>`;
    h += row('transparent', 'Effect', mults(iv));
    h += row('transparent', 'Lasted', span((end - iv.start) / 1000) + (iv.end ? '' : ' so far'));
    h += row('transparent', 'Started', clock(iv.start, true));
    if (iv.end) h += row('transparent', 'Ended', clock(iv.end, true));
    return h;
  }

  function eventTip(ev) {
    let h = `<div class="ca-tip-head">${swatch(eventColor(ev.kind))}${esc(ev.title)}<span>${clock(ev.t, true)}</span></div>`;
    if (ev.text) h += `<div class="ca-tip-note">${esc(ev.text)}</div>`;
    if (ev.kind !== 'ascend' && Math.abs(ev.gain) >= 1)
      h += row('transparent', ev.gain >= 0 ? 'Cookies gained' : 'Cookies lost', (ev.gain >= 0 ? '+' : '−') + beautify(Math.abs(ev.gain)));
    return h;
  }

  function eventColor(kind) {
    return { golden: '#ffd54a', wrath: '#e5484d', reindeer: '#c48a5a', ascend: '#c9bcff' }[kind] || '#fff';
  }

  // ---- little canvas helpers ---------------------------------------------------------

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---- panel HTML + wiring ---------------------------------------------------------------

  function chip(label, attrs, title) {
    return `<button type="button" class="ca-chip" ${attrs}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
  }
  function seriesChip(key, optKey) {
    return `<button type="button" class="ca-chip ca-chip-series" data-ca="option" data-key="${optKey}" data-pressed-key="${optKey}">${swatch(SERIES[key].color)}${SERIES[key].name}</button>`;
  }

  function html() {
    return (
      '<div class="ca-card ca-graph-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Cookies per second</div>' +
      '<div class="ca-card-meta"><span class="ca-live" data-ca-live></span></div></div>' +
      '<div class="ca-stats" data-ca-stats></div>' +
      '<div class="ca-toolbar">' +
      '<div class="ca-chipgroup" title="How much history to show">' +
      WINDOWS.map((o) => chip(o.label, `data-ca="gwin" data-val="${o.s}" data-pressed-key="graphWindow" data-pressed-val="${o.s}"`)).join(
        ''
      ) +
      '</div>' +
      '<div class="ca-chipgroup" title="Show or hide each line">' +
      seriesChip('cps', 'graphShowCps') +
      seriesChip('total', 'graphShowTotal') +
      seriesChip('base', 'graphShowBase') +
      '</div>' +
      '</div>' +
      '<div class="ca-graph-wrap"><canvas class="ca-graph" data-ca-canvas></canvas><div class="ca-tip" data-ca-tip></div></div>' +
      '<div class="ca-toolbar ca-toolbar-bottom">' +
      '<div class="ca-chipgroup" title="Average over the last few seconds">' +
      '<span class="ca-chip-label">Smooth</span>' +
      SMOOTHING.map((o) =>
        chip(o.label, `data-ca="gsmooth" data-val="${o.s}" data-pressed-key="graphSmooth" data-pressed-val="${o.s}"`)
      ).join('') +
      '</div>' +
      '<div class="ca-chipgroup">' +
      chip(
        'Log scale',
        'data-ca="option" data-key="graphLog" data-pressed-key="graphLog"',
        'Logarithmic vertical axis — handy when CpS grows by orders of magnitude'
      ) +
      chip(
        'Effects',
        'data-ca="option" data-key="graphEffects" data-pressed-key="graphEffects"',
        'Shade the periods when golden cookie effects are active'
      ) +
      chip(
        'Events',
        'data-ca="option" data-key="graphEvents" data-pressed-key="graphEvents"',
        'Mark golden cookie pops, reindeer and ascensions'
      ) +
      '</div>' +
      '<div class="ca-chipgroup">' +
      chip('', 'data-ca="gpause" data-ca-pause') +
      chip('Clear', 'data-ca="gclear"', 'Erase the recorded history') +
      '</div>' +
      '</div>' +
      '<div class="ca-legend" data-ca-legend></div>' +
      '</div>'
    );
  }

  function statTile(label, value, sub) {
    return `<div class="ca-stat"><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;
  }

  /** Cheap dynamic bits (stat tiles, legend, pause button). */
  function refreshInfo() {
    if (!root) return;
    const W = windowMs();
    const t1 = endTime();
    const st = CA.History.stats(t1 - W, t1);
    const last = CA.History.samples[CA.History.samples.length - 1];
    const cur = last ? last.cps : 0;
    const box = root.querySelector('[data-ca-stats]');
    if (box) {
      box.innerHTML =
        statTile('Now', short(cur) + '/s', last && last.click > 0.01 ? '+' + short(last.click) + ' from clicks' : '') +
        statTile('Average', short(st.avg) + '/s', 'last ' + (W >= 3600000 ? W / 3600000 + 'h' : W / 60000 + 'm')) +
        statTile('Peak', short(st.peak) + '/s', st.peakT ? clock(st.peakT, true) : '') +
        statTile('Clicking', short(st.avgClick) + '/s', Math.round(st.clickShare * 100) + '% of income');
    }
    const live = root.querySelector('[data-ca-live]');
    if (live) {
      live.textContent = paused ? 'Paused' : 'Live';
      live.classList.toggle('paused', paused);
    }
    const pause = root.querySelector('[data-ca-pause]');
    if (pause) pause.textContent = paused ? 'Resume' : 'Pause';

    const legend = root.querySelector('[data-ca-legend]');
    if (legend) {
      const counts = new Map();
      CA.History.intervalsIn(t1 - W, t1).forEach((iv) => counts.set(iv.name, { iv, n: (counts.get(iv.name) || { n: 0 }).n + 1 }));
      legend.innerHTML = counts.size
        ? [...counts.values()]
            .map(
              ({ iv, n }) =>
                `<span class="ca-legend-item">${swatch(CA.History.colorFor(iv.name))}${esc(iv.label)}${n > 1 ? ` <em>×${n}</em>` : ''}</span>`
            )
            .join('')
        : '<span class="ca-legend-empty">Golden cookie effects will show up here.</span>';
    }
  }

  function tick() {
    if (!root) return;
    if (!root.isConnected) {
      unmount(); // the game redrew the menu underneath us
      return;
    }
    refreshInfo();
    draw();
  }

  function mount(el) {
    unmount();
    root = el;
    canvas = el.querySelector('[data-ca-canvas]');
    tip = el.querySelector('[data-ca-tip]');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      const prev = layout && layout.hoverIv;
      draw();
      if (layout && layout.hoverIv !== prev) draw(); // repaint once so the highlighted effect shows immediately
    });
    canvas.addEventListener('mouseleave', () => {
      hover = null;
      if (layout) layout.hoverIv = null;
      draw();
    });
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => draw());
      observer.observe(canvas);
    }
    timer = setInterval(tick, 250);
    tick();
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (observer) observer.disconnect();
    observer = null;
    root = canvas = ctx = tip = null;
    hover = null;
    layout = null;
  }

  function setPaused(p) {
    if (p === paused) return;
    paused = p;
    pausedAt = Date.now();
    tick();
  }
  const isPaused = () => paused;

  function init() {
    const S_ = CA.Settings;
    const def = (key, dflt) => S_.defineOption({ key, group: 'graph', name: key, desc: '', default: dflt });
    def('graphWindow', 300);
    def('graphSmooth', 0);
    def('graphShowCps', true);
    def('graphShowTotal', true);
    def('graphShowBase', false);
    def('graphLog', false);
    def('graphEffects', true);
    def('graphEvents', true);
    CA.Events.on('history', () => {
      if (root) tick();
    });
  }

  return { init, html, mount, unmount, draw, tick, setPaused, isPaused };
})();
