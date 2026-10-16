// Numbers and times as CookieMgr writes them — for features and pages alike (charts re-export
// them as CA.UI.Plot.fmt).
//
// Long numbers follow the **Numbers** setting (Settings → General), Cookie Monster's notations:
//   abbr     short scale, abbreviated — 1.23M, 45.6B, 789T, 1.23Qa, 4.56Qi, Sx, Sp, Oc, No, Dc, UDc…
//   short    short scale — 1.23 M, 45.6 B, 789 Tr, 1.23 Quadr, 4.56 Quint, Sext…
//   metric   1.23M, 45.6G, 789T, 1.23P, E, Z, Y, R, Q
//   sci      scientific — 1.23e15
//   eng      engineering — 1.23e15, 12.3e15, 123e15 (exponents in threes)
//   game     the game's own (its Numbers preference, full illion names)
// With three significant digits (always, so 999.96K rounds up into 1M, never "1000K"); numbers
// under a million in full with thousands separators (beautify) — short() abbreviates from 1000.
// Beyond a scale's last name: scientific. beautify(v, floats) keeps the game's meaning of floats:
// the decimals of a number under 1000.

CA.Format = (() => {
  const ABBR = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'Tg', 'UTg', 'DTg', 'TTg', 'QaTg', 'QiTg', 'SxTg', 'SpTg', 'OcTg', 'NoTg', 'Qd'];
  const WORDS = ['', ' K', ' M', ' B', ' Tr', ' Quadr', ' Quint', ' Sext', ' Sept', ' Oct', ' Non', ' Dec', ' Undec', ' Duodec', ' Tredec', ' Quattuordec', ' Quindec', ' Sexdec', ' Septendec', ' Octodec', ' Novemdec', ' Vigint', ' Unvigint', ' Duovigint', ' Trevigint', ' Quattuorvigint', ' Quinvigint', ' Sexvigint', ' Septenvigint', ' Octovigint', ' Novemvigint', ' Trigint'];
  const METRIC = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q'];
  const SCALES = { abbr: ABBR, short: WORDS, metric: METRIC };
  /** The notations, for the Numbers setting. */
  const FORMATS = [
    { v: 'abbr', label: 'Short scale, abbreviated — 1.23M, 4.56Qa' },
    { v: 'short', label: 'Short scale — 1.23 M, 4.56 Quadr' },
    { v: 'metric', label: 'Metric — 1.23M, 4.56P' },
    { v: 'sci', label: 'Scientific — 1.23e15' },
    { v: 'eng', label: 'Engineering — 123e12' },
    { v: 'game', label: 'The game’s own (its Numbers setting)' },
  ];
  const DEFAULT = 'abbr';
  const SIG = 3; // significant digits of an abbreviated number

  // the setting is defined the first time a number is written (core/format.js loads before the
  // settings; by the time anything is shown, they're there)
  let defined = false;
  function kind() {
    const S = CA.Settings;
    if (!S) return DEFAULT;
    if (!defined) {
      defined = true;
      S.defineOption({
        key: 'numberFormat',
        group: 'general',
        icon: 'tag',
        name: 'Numbers',
        desc: 'How CookieMgr writes long numbers (Cookie Monster’s notations).',
        default: DEFAULT,
        choices: FORMATS,
      });
    }
    const k = S.get('numberFormat');
    return SCALES[k] || k === 'sci' || k === 'eng' || k === 'game' ? k : DEFAULT;
  }

  /** `m` (1 ≤ m < 1000) with three significant digits, trailing zeros dropped: 1.23, 12.3, 123. */
  const sig = (m) => String(Number(m.toPrecision(SIG)));
  /** v ≥ 1 split into a mantissa and a power of 1000, rounded first (999.96K → 1M, not 1000K). */
  function thousands(v) {
    let e = Math.floor(Math.log10(v) / 3);
    let m = v / 1000 ** e;
    if (Number(m.toPrecision(SIG)) >= 1000) {
      e++;
      m = v / 1000 ** e;
    }
    return { m, e };
  }
  function scientific(v, eng) {
    let e = Math.floor(Math.log10(v));
    let m = v / 10 ** e;
    if (Number(m.toPrecision(SIG)) >= 10) {
      e++;
      m = v / 10 ** e;
    }
    if (eng) {
      const k = ((e % 3) + 3) % 3;
      e -= k;
      m *= 10 ** k;
    }
    return `${sig(m)}e${e}`;
  }
  /** |v| ≥ 1000 in a notation (scales past their last name: scientific). */
  function big(v, k) {
    if (k === 'sci' || k === 'eng') return scientific(v, k === 'eng');
    const names = SCALES[k] || ABBR;
    const { m, e } = thousands(v);
    if (e >= names.length) return scientific(v, false);
    return sig(m) + names[e];
  }
  /** |v| under 1000: as it is, with `floats` decimals at most (trailing zeros dropped); tiny: scientific. */
  function small(v, floats) {
    if (v === 0) return '0';
    if (v < 0.001) return scientific(v, false);
    const d = floats == null ? 1 : floats;
    const out = Number(v.toFixed(d));
    // a fraction that would round to 0 at these decimals still shows it's not nothing
    if (out === 0) return String(Number(v.toPrecision(2)));
    return String(out);
  }
  const special = (v) => (Number.isNaN(v) ? 'NaN' : v > 0 ? '∞' : '-∞');
  const grouped = (v) => Math.round(v).toLocaleString('en-US');

  /** Compact: abbreviated from 1000 (axis labels, chips): 999, 1.23K, 45.6M. */
  function short(v) {
    if (typeof v !== 'number') v = Number(v);
    if (!isFinite(v)) return Number.isNaN(v) ? '0' : special(v);
    const sign = v < 0 ? '-' : '';
    v = Math.abs(v);
    const k = kind();
    if (v < 1000) return sign + (v < 10 ? small(v, v < 1 ? 2 : 1) : String(Math.round(v)));
    return sign + big(v, k === 'game' ? 'abbr' : k);
  }
  /**
   * A number as the Numbers setting writes it: under a million in full (1,234,567 → 1.23M),
   * `floats` decimals under 1000 (the game's meaning). "game": the game's own Beautify.
   */
  function beautify(v, floats) {
    if (typeof v !== 'number') v = Number(v);
    if (!isFinite(v)) return Number.isNaN(v) ? '0' : special(v);
    const k = kind();
    if (k === 'game' && typeof Beautify === 'function') return (v < 0 ? '-' : '') + Beautify(Math.abs(v), floats == null ? 1 : floats);
    const sign = v < 0 ? '-' : '';
    v = Math.abs(v);
    if (v < 1000) return sign + small(v, floats);
    if (v < 1e6 && k !== 'sci' && k !== 'eng') {
      // 999,999.6 would print as 1,000,000: past the cut-off, abbreviated instead
      if (Math.round(v) < 1e6) return sign + grouped(v);
    }
    return sign + big(v, k === 'game' ? 'abbr' : k);
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

  return { short, beautify, signed, two, clock, span, FORMATS, notation: kind };
})();
