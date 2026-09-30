// A small graph inserted directly under the stock list in the Bank minigame itself, so you
// don't have to open the CookieMgr panel to see how you're doing. A little toggle switches it
// between individual stock prices and your total portfolio value — same two views as the
// Graphs-tab stock chart, just a separate "Bank graph view" setting so this one can be left on
// whichever you check while actually trading.
//
// NOTE: this reaches into the Bank minigame's own DOM (there is no mod API for adding a panel
// there), by inserting itself right after whichever element holds the `bankGood-*` boxes. If a
// future game update changes that markup, this quietly stops appearing rather than breaking
// anything else — check that it still shows up after a game update.

CA.UI = CA.UI || {};

CA.UI.BankGraph = (() => {
  const TICK_MS = 1000;
  const WRAP_ID = 'cm-bank-graph';
  const WINDOW_MS = 5 * 60 * 1000; // fixed 5 min window — this is a glanceable mini chart, not the full Graphs tab
  const PAD = { r: 8, t: 6, b: 16 };
  const MIN_PAD_L = 28;
  const PAD_L_MARGIN = 8;
  const FONT = '10px Tahoma, Arial, sans-serif';
  const COLORS = ['#f5c451', '#7fe08b', '#9db4cc', '#ff8a65', '#c77dff', '#4fd6e0', '#e5484d', '#a6e35a'];

  const CSS = `
#${WRAP_ID} { margin: 6px 0 2px; padding: 6px 8px 4px; background: rgba(0,0,0,.28); border: 1px solid rgba(255,255,255,.12); border-radius: 4px; }
#${WRAP_ID} .cm-bg-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; font: 10px Tahoma, Arial, sans-serif; color: #cbbfa6; }
#${WRAP_ID} .cm-bg-readout { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#${WRAP_ID} .cm-bg-toggle { display: flex; gap: 3px; flex: none; }
#${WRAP_ID} .cm-bg-toggle button { font: bold 9px Tahoma, Arial, sans-serif; padding: 2px 7px; color: #b9ab93; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.14); border-radius: 9px; cursor: pointer; }
#${WRAP_ID} .cm-bg-toggle button.on { color: #fff3cf; background: rgba(255,200,100,.18); border-color: rgba(255,210,120,.6); }
#${WRAP_ID} canvas { display: block; width: 100%; height: 70px; }
`;

  let timer = null;

  const S = () => CA.Settings;
  const beautify = (v, floats) => (typeof Beautify === 'function' ? Beautify(v, floats == null ? 1 : floats) : Math.round(v).toString());
  const signed = (v) => (v < 0 ? '-' : '+') + beautify(Math.abs(v));

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
    // Same "Sync to owned stocks" setting as the Graphs-tab per-stock view, so buying a stock
    // makes it show up here too without any extra toggling.
    return S().get('stockGraphSync') ? all.filter((g) => g.owned) : all;
  }

  // ---- finding a home in the Bank minigame's own DOM ------------------------------

  function goodsContainer() {
    const m = CA.Stocks.minigame();
    if (!m || !m.goodsById || !m.goodsById.length) return null;
    const first = document.getElementById(`bankGood-${m.goodsById[0].id}`);
    return first ? first.parentElement : null;
  }

  function ensureMounted() {
    const goods = goodsContainer();
    if (!goods || !S().get('bankGraphEnabled')) {
      remove();
      return null;
    }
    let wrap = document.getElementById(WRAP_ID);
    if (wrap && wrap.previousElementSibling !== goods) {
      wrap.remove();
      wrap = null;
    }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = WRAP_ID;
      wrap.innerHTML =
        '<div class="cm-bg-head"><span class="cm-bg-readout" data-cm-bg-readout></span>' +
        '<span class="cm-bg-toggle">' +
        '<button type="button" data-cm-bg-mode="portfolio">Portfolio</button>' +
        '<button type="button" data-cm-bg-mode="perStock">Per stock</button>' +
        '</span></div>' +
        '<canvas></canvas>';
      wrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cm-bg-mode]');
        if (b) S().set('bankGraphMode', b.dataset.cmBgMode);
      });
      goods.insertAdjacentElement('afterend', wrap);
    }
    return wrap;
  }

  function remove() {
    const wrap = document.getElementById(WRAP_ID);
    if (wrap) wrap.remove();
  }

  // ---- drawing ---------------------------------------------------------------------

  function fitCanvas(canvas, ctx) {
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

  function portfolioLines() {
    const t1 = Date.now();
    const t0 = t1 - WINDOW_MS;
    const hist = CA.Stocks.portfolioHistory();
    const lo = Math.max(0, lowerBound(hist, t0) - 1);
    const list = hist.slice(lo).filter((p) => p.t <= t1);
    return [{ pts: list.map((p) => ({ t: p.t, v: p.value })), color: COLORS[0] }];
  }

  function perStockLines() {
    const t1 = Date.now();
    const t0 = t1 - WINDOW_MS;
    return visibleStocks().map((g, i) => {
      const hist = CA.Stocks.history(g.id);
      const lo = Math.max(0, lowerBound(hist, t0) - 1);
      return { g, pts: hist.slice(lo).filter((p) => p.t <= t1).map((p) => ({ t: p.t, v: p.v })), color: COLORS[i % COLORS.length] };
    });
  }

  function draw(wrap) {
    const canvas = wrap.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const { w, h } = fitCanvas(canvas, ctx);
    ctx.clearRect(0, 0, w, h);
    if (w < 30 || h < 20) return;

    const mode = S().get('bankGraphMode') === 'perStock' ? 'perStock' : 'portfolio';
    wrap.querySelectorAll('[data-cm-bg-mode]').forEach((b) => b.classList.toggle('on', b.dataset.cmBgMode === mode));

    const lines = mode === 'perStock' ? perStockLines() : portfolioLines();
    const t1 = Date.now();
    const t0 = t1 - WINDOW_MS;

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
    const padV = (maxV - minV) * 0.1 || 1;
    const yMin = minV - padV;
    const yMax = maxV + padV;

    const labelW = CA.Util.maxTextWidth(ctx, FONT, [beautify(yMin, 0), beautify(yMax, 0)]);
    const padL = Math.max(MIN_PAD_L, Math.round(labelW) + PAD_L_MARGIN);
    const plot = { x: padL, y: PAD.t, w: w - padL - PAD.r, h: h - PAD.t - PAD.b };
    const xOf = (t) => plot.x + ((t - t0) / WINDOW_MS) * plot.w;
    const yOf = (v) => plot.y + plot.h - ((v - yMin) / (yMax - yMin || 1)) * plot.h;

    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    [yMin, yMax].forEach((v) => {
      const y = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,220,200,0.75)';
      ctx.fillText(beautify(v, 0), plot.x - 5, y);
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y - 3, plot.w, plot.h + 6);
    ctx.clip();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    lines.forEach((l) => {
      if (l.pts.length < 2) return;
      ctx.strokeStyle = l.color;
      ctx.beginPath();
      l.pts.forEach((p, i) => (i ? ctx.lineTo(xOf(p.t), yOf(p.v)) : ctx.moveTo(xOf(p.t), yOf(p.v))));
      ctx.stroke();
    });
    ctx.restore();

    const readout = wrap.querySelector('[data-cm-bg-readout]');
    if (readout) {
      if (mode === 'perStock') {
        readout.textContent = lines.length
          ? lines.map((l) => `${l.g.name} ${beautify(l.pts.length ? l.pts[l.pts.length - 1].v : 0)}`).join('  ·  ')
          : S().get('stockGraphSync')
            ? "You don't own any stocks right now."
            : 'Open the Bank minigame to start tracking prices.';
      } else {
        const p = CA.Stocks.portfolioNow();
        readout.textContent = lines[0].pts.length
          ? `${beautify(p.value)}  ·  unrealized ${signed(p.unrealized)}  ·  total gain ${signed(p.gain)}`
          : 'Buy a stock to start tracking.';
      }
    }
  }

  function tick() {
    const wrap = ensureMounted();
    if (wrap) draw(wrap);
  }

  function init() {
    CA.Util.injectCss('CookieMgrBankGraphStyles', CSS);
    CA.Events.on('settings', tick);
    timer = setInterval(tick, TICK_MS);
    tick();
  }

  return { init };
})();
