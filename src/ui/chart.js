// Shared pieces for every canvas time-series chart (CA.UI.Graph, CA.UI.StockGraph, and to a
// smaller extent CA.UI.BankGraph): DPI-aware canvas sizing, a left margin sized to whatever the
// axis labels actually render as, absolute-grid time bucketing, and a scrollable "view" that
// tracks whether a chart is following the live edge or has been dragged/paused into the past.
//
// Bucketing note: bucket boundaries are aligned to absolute multiples of `bucketMs` since the
// epoch, not to the current window's start. If they were window-relative, every tick of live
// tracking (or every pixel of panning) shifts the window start, which reshuffles which raw
// samples fall into which bucket — bars visibly snap to new heights even though nothing
// happened. Anchoring to an absolute grid means a bucket's membership never changes; panning or
// time passing only changes which already-settled buckets are in view.

CA.UI = CA.UI || {};

CA.UI.Chart = (() => {
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

  /** Left-margin width that fits `tickLabels` as rendered in `font`, clamped to a sane minimum. */
  function dynamicPadLeft(ctx, font, tickLabels, minPad, margin) {
    const w = CA.Util.maxTextWidth(ctx, font, tickLabels);
    return Math.max(minPad, Math.round(w) + margin);
  }

  /**
   * Buckets `list` (indexed 0..list.length-1) into fixed-width, absolute-grid time slices.
   * `valueFns` is `{ seriesKey: (i) => number, ... }` — one or more parallel series computed
   * per sample index. Only buckets overlapping [t0, t1] are returned, sorted oldest-first; a
   * bucket with zero samples simply doesn't appear (a gap), rather than being interpolated.
   */
  function alignedBuckets(list, valueFns, t0, t1, bucketMs) {
    const buckets = new Map();
    const keys = Object.keys(valueFns);
    list.forEach((s, i) => {
      const idx = Math.floor(s.t / bucketMs);
      let b = buckets.get(idx);
      if (!b) {
        b = { idx, n: 0, sums: {} };
        keys.forEach((k) => (b.sums[k] = 0));
        buckets.set(idx, b);
      }
      keys.forEach((k) => (b.sums[k] += valueFns[k](i)));
      b.n++;
    });
    return [...buckets.values()]
      .filter((b) => (b.idx + 1) * bucketMs > t0 && b.idx * bucketMs < t1)
      .sort((a, b) => a.idx - b.idx)
      .map((b) => {
        const row = { t0: b.idx * bucketMs, t1: (b.idx + 1) * bucketMs, n: b.n };
        keys.forEach((k) => (row[k] = b.sums[k] / b.n));
        return row;
      });
  }

  /**
   * Tracks a chart's right edge: `null` means "follow the live edge" (advances with real time);
   * a number means frozen at that absolute time, whether from an explicit pause or from
   * dragging/scrolling away from the live edge. One of these per chart module, created once (not
   * per mount) so the view survives a tab switch.
   */
  function createView() {
    let end = null;

    const isLive = () => end === null;
    const getEnd = (liveNow) => (end === null ? liveNow : end);
    const freeze = (t) => {
      end = t;
    };
    const resume = () => {
      end = null;
    };

    /** Shifts the view by `dxPx` screen pixels (positive = drag right = look further back in
     *  time), clamped so you can't scroll past "now" or before `minT + windowMs`. Snaps back to
     *  live once you drag/scroll back up to the live edge. */
    function panByPixels(dxPx, windowMs, plotWidthPx, liveNow, minT) {
      const dtMs = (dxPx / Math.max(1, plotWidthPx)) * windowMs;
      const base = getEnd(liveNow) - dtMs;
      const floor = minT == null ? -Infinity : minT + windowMs;
      const next = Math.max(floor, Math.min(liveNow, base));
      end = next >= liveNow ? null : next;
    }

    /**
     * Wires drag-to-pan (mouse) and wheel-to-pan (horizontal wheel/trackpad, or shift+wheel;
     * plain vertical wheel is left alone so the page still scrolls normally) on `canvas`.
     * `getPanCtx()` supplies `{ windowMs, plotWidthPx, liveNow, minT }` fresh on every event,
     * since those change as the window/data do. `onChange()` runs after every pan step (redraw).
     * Returns `{ detach, isDragging }`.
     */
    function attachPan(canvas, getPanCtx, onChange) {
      let dragging = false;
      let lastX = 0;
      const onDown = (e) => {
        dragging = true;
        lastX = e.clientX;
        canvas.style.cursor = 'grabbing';
      };
      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        if (Math.abs(dx) < 0.5) return;
        const { windowMs, plotWidthPx, liveNow, minT } = getPanCtx();
        panByPixels(dx, windowMs, plotWidthPx, liveNow, minT);
        onChange();
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = 'grab';
      };
      const onWheel = (e) => {
        const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!horiz && !e.shiftKey) return; // plain vertical wheel: let the page scroll as normal
        e.preventDefault();
        const { windowMs, plotWidthPx, liveNow, minT } = getPanCtx();
        panByPixels(-(horiz ? e.deltaX : e.deltaY), windowMs, plotWidthPx, liveNow, minT);
        onChange();
      };
      canvas.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.style.cursor = 'grab';
      const detach = () => {
        canvas.removeEventListener('mousedown', onDown);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        canvas.removeEventListener('wheel', onWheel);
      };
      return { detach, isDragging: () => dragging };
    }

    return { isLive, getEnd, freeze, resume, panByPixels, attachPan };
  }

  return { fitCanvas, dynamicPadLeft, alignedBuckets, createView };
})();
