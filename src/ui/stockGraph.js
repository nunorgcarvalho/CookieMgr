// A small multi-line price chart for the Bank minigame's stocks, shown under the CpS graph
// on the Graphs tab. Data comes from CA.Stocks' price history; which stocks are plotted is
// controlled by the "Sync graph to owned stocks" setting (defined in features/stocks.js).

CA.UI = CA.UI || {};

CA.UI.StockGraph = (() => {
  const COLORS = ['#f5c451', '#7fe08b', '#9db4cc', '#ff8a65', '#c77dff', '#4fd6e0', '#e5484d', '#a6e35a'];
  const PAD = { l: 54, r: 14, t: 10, b: 20 };

  let root = null;
  let canvas = null;
  let ctx = null;
  let tip = null;
  let observer = null;
  let timer = null;
  let hover = null;
  let layout = null;

  const S = () => CA.Settings;
  const esc = (s) => CA.Util.escapeHtml(s);
  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());

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

  function draw() {
    if (!canvas || !canvas.isConnected) return;
    const { w, h } = fitCanvas();
    if (w < 50 || h < 50) return;
    ctx.clearRect(0, 0, w, h);

    const stocks = visibleStocks();
    const W = Math.max(10, S().get('graphWindow')) * 1000;
    const t1 = Date.now();
    const t0 = t1 - W;
    const plot = { x: PAD.l, y: PAD.t, w: w - PAD.l - PAD.r, h: h - PAD.t - PAD.b };
    const xOf = (t) => plot.x + ((t - t0) / W) * plot.w;

    const lines = stocks.map((g, i) => {
      const hist = CA.Stocks.history(g.id);
      const lo = Math.max(0, lowerBound(hist, t0) - 1);
      return { g, color: COLORS[i % COLORS.length], pts: hist.slice(lo).filter((p) => p.t <= t1) };
    });

    let minV = Infinity;
    let maxV = -Infinity;
    lines.forEach((l) =>
      l.pts.forEach((p) => {
        if (p.v < minV) minV = p.v;
        if (p.v > maxV) maxV = p.v;
      })
    );
    if (!isFinite(minV)) {
      minV = 0;
      maxV = 10;
    }
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const padV = (maxV - minV) * 0.08 || 1;
    const yMin = Math.max(0, minV - padV);
    const yMax = maxV + padV;
    const yOf = (v) => plot.y + plot.h - ((v - yMin) / (yMax - yMin || 1)) * plot.h;

    // grid + y labels
    ctx.font = '10px Tahoma, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = yMin + ((yMax - yMin) * i) / 4;
      const y = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(beautify(v, 0), plot.x - 6, y);
    }

    // x labels (just the window edges — a full grid isn't worth the room here)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(230,220,200,0.7)';
    if (lines.some((l) => l.pts.length)) {
      ctx.fillText(clock(t0), plot.x + 28, plot.y + plot.h + 5);
      ctx.fillText(clock(t1), plot.x + plot.w - 28, plot.y + plot.h + 5);
    }

    // lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 4, plot.w, plot.h + 8);
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.8;
    lines.forEach((l) => {
      if (l.pts.length < 2) return;
      ctx.strokeStyle = l.color;
      ctx.beginPath();
      l.pts.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
      ctx.stroke();
    });
    ctx.restore();

    layout = { plot, xOf, t0, t1, lines };

    if (hover && hover.x >= plot.x && hover.x <= plot.x + plot.w && hover.y >= 0 && hover.y <= h) {
      drawHover(w, h);
    } else if (tip) {
      tip.style.display = 'none';
    }

    if (!stocks.length) {
      ctx.fillStyle = 'rgba(230,220,200,0.6)';
      ctx.font = '12px Tahoma, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        S().get('stockGraphSync') ? "You don't own any stocks right now." : 'Open the Bank minigame to start tracking prices.',
        plot.x + plot.w / 2,
        plot.y + plot.h / 2
      );
    }
  }

  function drawHover(w, h) {
    const { plot, xOf, t0, t1, lines } = layout;
    const t = t0 + ((hover.x - plot.x) / plot.w) * (t1 - t0);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(hover.x) + 0.5, plot.y);
    ctx.lineTo(Math.round(hover.x) + 0.5, plot.y + plot.h);
    ctx.stroke();

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

  // ---- panel HTML + wiring ---------------------------------------------------------

  function chip(label, attrs, title) {
    return `<button type="button" class="ca-chip" ${attrs}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
  }

  function html() {
    return (
      '<div class="ca-card ca-graph-card">' +
      '<div class="ca-card-head"><div class="ca-card-title">Stock prices</div></div>' +
      '<div class="ca-toolbar">' +
      '<div class="ca-chipgroup">' +
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

  function refreshLegend() {
    if (!root) return;
    const legend = root.querySelector('[data-ca-stock-legend]');
    if (!legend) return;
    const stocks = visibleStocks();
    legend.innerHTML = stocks.length
      ? stocks
          .map(
            (g, i) =>
              `<span class="ca-legend-item"><i class="ca-sw" style="background:${COLORS[i % COLORS.length]}"></i>${esc(g.name)}</span>`
          )
          .join('')
      : '<span class="ca-legend-empty">No stocks to show.</span>';
  }

  function tick() {
    if (!root) return;
    if (!root.isConnected) {
      unmount();
      return;
    }
    draw();
    refreshLegend();
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
