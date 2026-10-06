// Numbers and times as CookieMgr writes them — for features and pages alike (charts re-export
// them as CA.UI.Plot.fmt). beautify() uses the game's own formatter when it's there (the player's
// Numbers preference, illion names); short() is CookieMgr's compact one (1.2K, 3.4M).

CA.Format = (() => {
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
  /** The game's own number formatter when available (full illion names, the player's Numbers preference). */
  function beautify(v, floats) {
    if (!isFinite(v)) return '0';
    if (typeof Beautify !== 'function') return short(v);
    return (v < 0 ? '-' : '') + Beautify(Math.abs(v), floats == null ? 1 : floats);
  }
  const signed = (v) => (v < 0 ? '−' : '+') + beautify(Math.abs(v));
  const two = (n) => (n < 10 ? '0' + n : '' + n);
  function clock(t, withSeconds) {
    const d = new Date(t);
    return `${two(d.getHours())}:${two(d.getMinutes())}` + (withSeconds ? `:${two(d.getSeconds())}` : '');
  }
  function span(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${two(sec % 60)}s`;
    if (sec < 172800) return `${Math.floor(sec / 3600)}h ${two(Math.floor((sec % 3600) / 60))}m`;
    return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
  }

  return { short, beautify, signed, two, clock, span };
})();
