// A small chart for the Bank minigame's stocks, shown under the CpS graph on the Graphs tab.
// Default view is portfolio value (what your holdings are worth right now, and how much of
// that is profit) rather than a wall of per-stock price lines you'd have to mentally total
// yourself; "Per stock" switches back to individual price lines. Data comes from CA.Stocks.

CA.UI = CA.UI || {};

CA.UI.StockGraph = (() => {
  const COLORS = ['#f5c451', '#7fe08b', '#9db4cc', '#ff8a65', '#c77dff', '#4fd6e0', '#e5484d', '#a6e35a'];
  const PAD = { r: 8, t: 10, b: 20 };
  const MIN_PAD_L = 30;
  const PAD_L_MARGIN = 10;
  const FONT = '10px Tahoma, Arial, sans-serif';

  let root = null;
  let canvas = null;
  let ctx = null;
  let tip = null;
  let observer = null;
  let timer = null;
  let hover = null;
  let padL = 54;
  let layout = null;

  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);
  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  const signed = (v) => (v < 0 ? '-' : '+') + beautify(Math.abs(v));

  function two(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function clock(t, withSeconds) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}` + (withSeconds ? `:${two(d.getSeconds())}` : '');
  }

  /** Index of the first sample with t >= time (binary search). */
  function lowerBound(arr, time) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].t < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  const mode = () => (S().get('stockGraphMode') === 'perStock' ? 'perStock' : 'portfolio');

  function visibleStocks() {
    const all = CA.Stocks.list();
    return S().get('stockGraphSync') ? all.filter((g) => g.owned) : all;
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

  /** Builds { x, w, yMin, yMax, yOf, ticks } for a set of values, sizing the left padding
   *  to whatever those tick labels actually render as (so they never clip). */
  function scaleFor(w, plotY, plotH, values) {
    let minV = Infinity;
    let maxV = -Infinity;
    values.forEach((v) => {
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });
    if (!isFinite(minV)) {
      minV = 0;
      maxV = 10;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const padV = (maxV - minV) * 0.08 || 1;
    const yMin = minV - padV;
    const yMax = maxV + padV;
    const ticks = [];
    for (let i = 0; i <= 4; i++) ticks.push(yMin + ((yMax - yMin) * i) / 4);

    const labelW = CA.Util.maxTextWidth(ctx, FONT, ticks.map((v) => beautify(v, 0)));
    padL = Math.max(MIN_PAD_L, Math.round(labelW) + PAD_L_MARGIN);
    const x = padL;
    const pw = w - padL - PAD.r;
    const yOf = (v) => plotY + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
    return { x, w: pw, yMin, yMax, yOf, ticks };
  }

  function drawAxes(plot, scale) {
    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    scale.ticks.forEach((v) => {
      const y = Math.round(scale.yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(scale.x, y);
      ctx.lineTo(scale.x + scale.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(beautify(v, 0), scale.x - 6, y);
    });
  }

  function drawXLabels(plot, t0, t1) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(230,220,200,0.7)';
    ctx.fillText(clock(t0), plot.x + 28, plot.y + plot.h + 5);
    ctx.fillText(clock(t1), plot.x + plot.w - 28, plot.y + plot.h + 5);
  }

  function drawLine(plot, xOf, yOf, pts, color, dash) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 4, plot.w, plot.h + 8);
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function emptyMsg(plot, text) {
    ctx.fillStyle = 'rgba(230,220,200,0.6)';
    ctx.font = '12px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, plot.x + plot.w / 2, plot.y + plot.h / 2);
  }

  function drawPortfolio(w, h) {
    const W = Math.max(10, S().get('graphWindow')) * 1000;
    const t1 = Date.now();
    const t0 = t1 - W;
    const hist = CA.Stocks.portfolioHistory();
    const lo = Math.max(0, lowerBound(hist, t0) - 1);
    const pts = hist.slice(lo).filter((p) => p.t <= t1);

    const plotY = PAD.t;
    const plotH = h - PAD.t - PAD.b;
    const scale = scaleFor(w, plotY, plotH, pts.flatMap((p) => [p.value, p.cost]));
    const plot = { x: scale.x, y: plotY, w: scale.w, h: plotH };
    const xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    drawAxes(plot, scale);
    if (pts.length) drawXLabels(plot, t0, t1);
    drawLine(plot, xOf, scale.yOf, pts.map((p) => ({ t: p.t, v: p.cost })), '#9db4cc', [4, 3]);
    drawLine(plot, xOf, scale.yOf, pts.map((p) => ({ t: p.t, v: p.value })), '#f5c451');

    layout = { mode: 'portfolio', plot, xOf, yOf: scale.yOf, t0, t1, pts };

    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHoverPortfolio(w, h);
    else if (tip) tip.style.display = 'none';

    if (!pts.length) emptyMsg(plot, 'Buy or sell a stock to start tracking your portfolio.');
  }

  function drawPerStock(w, h) {
    const stocks = visibleStocks();
    const W = Math.max(10, S().get('graphWindow')) * 1000;
    const t1 = Date.now();
    const t0 = t1 - W;

    const lines = stocks.map((g, i) => {
      const hist = CA.Stocks.history(g.id);
      const lo = Math.max(0, lowerBound(hist, t0) - 1);
      return { g, color: COLORS[i % COLORS.length], pts: hist.slice(lo).filter((p) => p.t <= t1) };
    });

    const plotY = PAD.t;
    const plotH = h - PAD.t - PAD.b;
    const scale = scaleFor(
      w,
      plotY,
      plotH,
      lines.flatMap((l) => l.pts.map((p) => p.v))
    );
    const plot = { x: scale.x, y: plotY, w: scale.w, h: plotH };
    const xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    drawAxes(plot, scale);
    if (lines.some((l) => l.pts.length)) drawXLabels(plot, t0, t1);
    lines.forEach((l) => drawLine(plot, xOf, scale.yOf, l.pts, l.color));

    layout = { mode: 'perStock', plot, xOf, yOf: scale.yOf, t0, t1, lines };

    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) drawHoverPerStock(w, h);
    else if (tip) tip.style.display = 'none';

    if (!stocks.length) {
      emptyMsg(plot, S().get('stockGraphSync') ? "You don't own any stocks right now." : 'Open the Bank minigame to start tracking prices.');
    }
  }

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = fitCanvas();
    if (w < 50 || h < 50) return;
    ctx.clearRect(0, 0, w, h);
    if (mode() === 'perStock') drawPerStock(w, h);
    else drawPortfolio(w, h);
  }

  function crosshair(plot) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
    ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
    ctx.stroke();
  }

  function placeTip(w, h) {
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

  function drawHoverPortfolio(w, h) {
    const { plot, t0, t1, pts } = layout;
    crosshair(plot);
    const t = t0 + ((hover.x - plot.x) / plot.w) * (t1 - t0);
    let html = `<div class="ca-tip-head">${clock(t, true)}</div>`;
    const idx = Math.min(lowerBound(pts, t), pts.length - 1);
    const p = pts[idx];
    if (p) {
      html += `<div class="ca-tip-row"><i class="ca-sw" style="background:#f5c451"></i><b>Value</b><span>${beautify(p.value)}</span></div>`;
      html += `<div class="ca-tip-row"><i class="ca-sw" style="background:#9db4cc"></i><b>Cost basis</b><span>${beautify(p.cost)}</span></div>`;
      html += `<div class="ca-tip-row strong"><b>Unrealized</b><span>${signed(p.unrealized)}</span></div>`;
      html += `<div class="ca-tip-row"><b>Realized</b><span>${signed(p.realized)}</span></div>`;
      html += `<div class="ca-tip-row strong"><b>Total gain</b><span>${signed(p.gain)}</span></div>`;
    } else {
      html += '<div class="ca-tip-note">No data here yet.</div>';
    }
    tip.innerHTML = html;
    placeTip(w, h);
  }

  function drawHoverPerStock(w, h) {
    const { plot, t0, t1, lines } = layout;
    crosshair(plot);
    const t = t0 + ((hover.x - plot.x) / plot.w) * (t1 - t0);
    let html = `<div class="ca-tip-head">${clock(t, true)}</div>`;
    let any = false;
    lines.forEach((l) => {
      if (!l.pts.length) return;
      const idx = Math.min(lowerBound(l.pts, t), l.pts.length - 1);
      const p = l.pts[idx];
      if (!p) return;
      any = true;
      html += `<div class="ca-tip-row"><i class="ca-sw" style="background:${l.color}"></i><b>${esc(l.g.name)}</b><span>${beautify(p.v)}</span></div>`;
    });
    if (!any) html += '<div class="ca-tip-note">No data here yet.</div>';
    tip.innerHTML = html;
    placeTip(w, h);
  }

  // ---- panel HTML + wiring ---------------------------------------------------------

  function chip(label, attrs, title) {
    return `<button type="button" class="ca-chip" ${attrs}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
  }

  function html() {
    return (
      '<div class="ca-card ca-graph-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Stock market</div></div>' +
      '<div class="ca-stats" data-ca-stock-stats></div>' +
      '<div class="ca-toolbar">' +
      '<div class="ca-chipgroup" title="What the chart plots">' +
      chip('Portfolio value', 'data-ca="sgmode" data-val="portfolio" data-pressed-key="stockGraphMode" data-pressed-val="portfolio"') +
      chip('Per stock', 'data-ca="sgmode" data-val="perStock" data-pressed-key="stockGraphMode" data-pressed-val="perStock"') +
      '</div>' +
      '<div class="ca-chipgroup" data-ca-perstock-only>' +
      chip(
        'Sync to owned stocks',
        'data-ca="option" data-key="stockGraphSync" data-pressed-key="stockGraphSync"',
        'Only plot stocks you currently hold; turn off to show all of them.'
      ) +
      '</div>' +
      '</div>' +
      '<div class="ca-graph-wrap"><canvas class="ca-graph ca-graph-small" data-ca-stock-canvas></canvas><div class="ca-tip" data-ca-stock-tip></div></div>' +
      '<div class="ca-legend" data-ca-stock-legend></div>' +
      '</div>'
    );
  }

  function statTile(label, value, sub) {
    return `<div class="ca-stat"><div class="ca-stat-label">${label}</div><div class="ca-stat-value">${value}</div><div class="ca-stat-sub">${sub || '&nbsp;'}</div></div>`;
  }

  function refreshInfo() {
    if (!root) return;
    const perStock = mode() === 'perStock';
    const only = root.querySelector('[data-ca-perstock-only]');
    if (only) only.classList.toggle('ca-hidden', !perStock);

    const stats = root.querySelector('[data-ca-stock-stats]');
    if (stats) {
      if (perStock) {
        stats.innerHTML = '';
      } else {
        const p = CA.Stocks.portfolioNow();
        stats.innerHTML =
          statTile('Value', beautify(p.value)) +
          statTile('Unrealized', signed(p.unrealized), 'if you sold everything now') +
          statTile('Realized', signed(p.realized), 'from past sales') +
          statTile('Total gain', signed(p.gain), 'realized + unrealized');
      }
    }

    const legend = root.querySelector('[data-ca-stock-legend]');
    if (legend) {
      if (perStock) {
        const stocks = visibleStocks();
        legend.innerHTML = stocks.length
          ? stocks
              .map(
                (g, i) =>
                  `<span class="ca-legend-item"><i class="ca-sw" style="background:${COLORS[i % COLORS.length]}"></i>${esc(g.name)}</span>`
              )
              .join('')
          : '<span class="ca-legend-empty">No stocks to show.</span>';
      } else {
        legend.innerHTML =
          '<span class="ca-legend-item"><i class="ca-sw" style="background:#f5c451"></i>Value</span>' +
          '<span class="ca-legend-item"><i class="ca-sw" style="background:#9db4cc"></i>Cost basis (solid gap above it = unrealized gain)</span>';
      }
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

  function mount(el) {
    unmount();
    root = el;
    canvas = el.querySelector('[data-ca-stock-canvas]');
    tip = el.querySelector('[data-ca-stock-tip]');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      hover = { x: e.clientX - r.left, y: e.clientY - r.top };
      draw();
    });
    canvas.addEventListener('mouseleave', () => {
      hover = null;
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

  function init() {}

  return { init, html, mount, unmount, tick };
})();
