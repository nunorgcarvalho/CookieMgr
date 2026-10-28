// CookieSimMgr's charts: lines over simulated time, drawn with the add-on's chart helpers
// (CA.UI.Chart: canvas fitting, nice scales, label margins) and its hover box (.ca-tip in the
// tooltip layer), in the add-on's colors. Log or linear y axis; bands (effects that were on) and
// markers (golden cookies) under the lines.
//
//   const ch = SimChart.create(canvas);
//   ch.draw({ series: [{ name, color, points: [[x, y]…], dash, width, fmt }], log, bands: [{ x0, x1, color, label }],
//             markers: [{ x, color, label }], xFmt(x), yFmt(y) });

window.SimChart = (() => {
  const FONT = '10px Tahoma, Arial, sans-serif';
  const PAD = { r: 10, t: 10, b: 22 };
  const esc = (s) => CA.Util.escapeHtml(s);

  function logTicks(min, max) {
    const lo = Math.floor(Math.log10(min));
    const hi = Math.ceil(Math.log10(max));
    const step = Math.max(1, Math.ceil((hi - lo) / 6));
    const ticks = [];
    for (let e = lo; e <= hi; e += step) ticks.push(10 ** e);
    return { yMin: 10 ** lo, yMax: 10 ** Math.max(hi, lo + 1), ticks };
  }
  function xTicks(x0, x1, w) {
    const n = Math.max(2, Math.floor(w / 90));
    const nice = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800, 604800];
    const step = nice.find((s) => (x1 - x0) / s <= n) || nice[nice.length - 1];
    const out = [];
    for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) out.push(x);
    return out;
  }

  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let spec = null;
    let geo = null;
    let tip = null;
    let hoverX = null;

    function draw(s) {
      if (s) spec = s;
      if (!spec || !canvas.isConnected) return;
      const { w, h } = CA.UI.Chart.fitCanvas(canvas, ctx);
      ctx.clearRect(0, 0, w, h);
      const series = spec.series.filter((x) => x.points.length);
      const all = series.flatMap((x) => x.points);
      ctx.font = FONT;
      if (!all.length) {
        ctx.fillStyle = '#93866f';
        ctx.textAlign = 'center';
        ctx.fillText(spec.empty || 'Nothing yet — press play', w / 2, h / 2);
        geo = null;
        return;
      }
      const xs = all.map((p) => p[0]);
      const x0 = spec.x0 != null ? spec.x0 : Math.min(...xs);
      const x1 = Math.max(spec.x1 != null ? spec.x1 : Math.max(...xs), x0 + 1);
      const ys = all.map((p) => p[1]).filter((v) => Number.isFinite(v) && (!spec.log || v > 0));
      let scale;
      if (spec.log) scale = ys.length ? logTicks(Math.max(1e-3, Math.min(...ys)), Math.max(...ys)) : logTicks(1, 10);
      else scale = CA.UI.Chart.niceLinearScale(Math.min(0, ...ys), Math.max(...ys), 4);
      const yFmt = spec.yFmt || ((v) => CA.Format.short(v));
      const padL = CA.UI.Chart.dynamicPadLeft(ctx, FONT, scale.ticks.map(yFmt), 34, 10);
      const L = padL;
      const R = w - PAD.r;
      const T = PAD.t;
      const B = h - PAD.b;
      const X = (x) => L + ((x - x0) / (x1 - x0)) * (R - L);
      const Y = spec.log ? (v) => B - ((Math.log10(Math.max(v, scale.yMin)) - Math.log10(scale.yMin)) / (Math.log10(scale.yMax) - Math.log10(scale.yMin))) * (B - T) : (v) => B - ((v - scale.yMin) / (scale.yMax - scale.yMin)) * (B - T);
      geo = { L, R, T, B, X, x0, x1, series };

      // effect bands
      (spec.bands || []).forEach((b) => {
        const a = Math.max(L, X(b.x0));
        const z = Math.min(R, X(b.x1));
        if (z <= a) return;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.13;
        ctx.fillRect(a, T, z - a, B - T);
        ctx.globalAlpha = 1;
      });
      // grid + y labels
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.fillStyle = '#93866f';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 1;
      scale.ticks.forEach((v) => {
        const y = Math.round(Y(v)) + 0.5;
        if (y < T - 1 || y > B + 1) return;
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(R, y);
        ctx.stroke();
        ctx.fillText(yFmt(v), L - 6, y);
      });
      // x labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xFmt = spec.xFmt || ((x) => CA.Format.span(x));
      xTicks(x0, x1, R - L).forEach((x) => {
        const px = Math.round(X(x)) + 0.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.moveTo(px, T);
        ctx.lineTo(px, B);
        ctx.stroke();
        ctx.fillText(xFmt(x), px, B + 6);
      });
      // markers
      (spec.markers || []).forEach((m) => {
        const px = X(m.x);
        if (px < L || px > R) return;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(px, B);
        ctx.lineTo(px - 4, B + 6);
        ctx.lineTo(px + 4, B + 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = m.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(px + 0.5, T);
        ctx.lineTo(px + 0.5, B);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      // lines
      series.forEach((sr) => {
        ctx.strokeStyle = sr.color;
        ctx.lineWidth = sr.width || 2;
        ctx.setLineDash(sr.dash ? [5, 4] : []);
        ctx.globalAlpha = sr.alpha || 1;
        ctx.beginPath();
        let started = false;
        sr.points.forEach(([x, y]) => {
          if (!Number.isFinite(y) || (spec.log && y <= 0)) return;
          const px = X(x);
          const py = Y(y);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else ctx.lineTo(px, py);
        });
        ctx.stroke();
        if (sr.band) {
          // a lighter area between band[0] and band[1] (min / max over seeds)
          ctx.fillStyle = sr.color;
          ctx.globalAlpha = 0.12;
          ctx.beginPath();
          sr.band.forEach(([x, lo], i) => (i ? ctx.lineTo(X(x), Y(Math.max(lo, spec.log ? scale.yMin : -Infinity))) : ctx.moveTo(X(x), Y(Math.max(lo, spec.log ? scale.yMin : -Infinity)))));
          sr.band
            .slice()
            .reverse()
            .forEach(([x, , hi]) => ctx.lineTo(X(x), Y(hi)));
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
      });
      // hover line
      if (hoverX != null && hoverX >= L && hoverX <= R) {
        ctx.strokeStyle = 'rgba(255,240,200,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(hoverX) + 0.5, T);
        ctx.lineTo(Math.round(hoverX) + 0.5, B);
        ctx.stroke();
      }
    }

    function nearest(points, x) {
      let best = null;
      for (const p of points) if (!best || Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
      return best;
    }
    function onMove(e) {
      if (!geo) return;
      const r = canvas.getBoundingClientRect();
      hoverX = e.clientX - r.left;
      const x = geo.x0 + ((hoverX - geo.L) / (geo.R - geo.L)) * (geo.x1 - geo.x0);
      draw();
      if (!tip) tip = CA.UI.Tips.float('ca-tip');
      const xFmt = spec.xFmt || ((v) => CA.Format.span(v));
      let html = `<div class="ca-tip-head">${esc(spec.tipHead ? spec.tipHead(x) : xFmt(x))}</div>`;
      geo.series.forEach((sr) => {
        if (sr.noTip) return;
        const p = nearest(sr.points, x);
        if (!p) return;
        const f = sr.fmt || spec.yFmt || ((v) => CA.Format.short(v));
        html += `<div class="ca-tip-row"><i class="ca-sw" style="background:${sr.color}"></i><b>${esc(sr.name)}</b><span>${esc(f(p[1]))}</span></div>`;
      });
      const span = (geo.x1 - geo.x0) * (12 / (geo.R - geo.L));
      (spec.markers || []).filter((m) => Math.abs(m.x - x) <= span).slice(0, 4).forEach((m) => (html += `<div class="ca-tip-note" style="color:${m.color}">▲ ${esc(m.label)}</div>`));
      (spec.bands || []).filter((b) => b.x0 <= x && b.x1 >= x).slice(0, 4).forEach((b) => (html += `<div class="ca-tip-note" style="color:${b.color}">▮ ${esc(b.label)}</div>`));
      tip.innerHTML = html;
      tip.style.display = 'block';
      const tw = tip.offsetWidth;
      tip.style.left = `${Math.min(window.innerWidth - tw - 8, e.clientX + 14)}px`;
      tip.style.top = `${Math.max(8, e.clientY - tip.offsetHeight - 12)}px`;
    }
    function onLeave() {
      hoverX = null;
      if (tip) tip.style.display = 'none';
      draw();
    }
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return {
      draw,
      destroy() {
        ro.disconnect();
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('mouseleave', onLeave);
        if (tip) tip.remove();
      },
    };
  }

  return { create };
})();
