// Virtual time: Date and the timers (setTimeout / setInterval) of a simulated page, on a clock that
// only moves when the simulator moves it. Everything that runs in the page — the game, cookieMgr —
// sees this clock, so an hour of game takes as long as it takes to compute, not an hour.

export function makeClock(start = Date.UTC(2026, 0, 1, 12)) {
  let now = start;
  let seq = 0;
  const timers = new Map(); // id → { at, fn, args, every }
  // a small binary heap of [at, seq, id], so firing order is by time, then by when they were set
  const heap = [];
  const less = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  function push(e) {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  }
  function pop() {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (r < heap.length && less(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  }

  let nextId = 1;
  function schedule(fn, ms, args, every) {
    const id = nextId++;
    const delay = Math.max(every ? 1 : 0, Number(ms) || 0);
    const t = { at: now + delay, fn, args, every: every ? delay : 0 };
    timers.set(id, t);
    push([t.at, seq++, id]);
    return id;
  }
  const clear = (id) => timers.delete(id);

  /** Runs every timer due at or before `t` (in order), moving the clock to each; then sets it to t. */
  function runUntil(t) {
    while (heap.length && heap[0][0] <= t) {
      const [at, , id] = pop();
      const timer = timers.get(id);
      if (!timer || timer.at !== at) continue;
      now = at;
      if (timer.every) {
        timer.at = at + timer.every;
        push([timer.at, seq++, id]);
      } else timers.delete(id);
      try {
        if (typeof timer.fn === 'function') timer.fn(...(timer.args || []));
      } catch (e) {
        clock.errors.push(e);
        if (clock.errors.length <= 5) console.error('[sim] a timer threw:', e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n') : e);
      }
    }
    if (t > now) now = t;
  }

  // the page's Date: "now" is the clock; anything else is the real Date
  const RealDate = Date;
  class SimDate extends RealDate {
    constructor(...a) {
      if (a.length) super(...a);
      else super(now);
    }
    static now() {
      return now;
    }
  }

  const clock = {
    get now() {
      return now;
    },
    start,
    errors: [],
    runUntil,
    pending: () => timers.size,
    Date: SimDate,
    setTimeout: (fn, ms, ...args) => schedule(fn, ms, args, false),
    setInterval: (fn, ms, ...args) => schedule(fn, ms, args, true),
    clearTimeout: clear,
    clearInterval: clear,
  };
  return clock;
}
