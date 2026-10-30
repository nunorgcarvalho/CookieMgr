// Numbers and times as cookieMgr writes them — for features and pages alike (charts re-export
// them as CA.UI.Plot.fmt).
//
// Long numbers follow the **Numbers** setting (Settings → General), Cookie Monster's notations:
//   short    short scale (the default, as in Cookie Monster) — 1.23 M, 45.6 B, 789 Tr, 1.23 Quadr,
//            Quint, Sext, Sept, Oct, Non, Dec, Undec… Octodec, Novemdec… up to Quattuorvigint
//   abbr     short scale, abbreviated — 1.23 M, 45.6 B, 789 T, 1.23 Qa, Qi, Sx, Sp, Oc, No, De, UDe…
//            SpDe, ODe, NDe, Vi… up to UCt (1e303)
//   metric   1.23 M, 45.6 G, 789 T, 1.23 P, E, Z, Y
// (Cookie Monster's own suffix lists and spacing.)
//   sci      scientific — 1.23e15
//   eng      engineering — 1.23e15, 12.3e15, 123e15 (exponents in threes)
//   game     the game's own (its Numbers preference, full illion names)
// With three significant digits (always, so 999.96K rounds up into 1M, never "1000K"); numbers
// under a million in full with thousands separators (beautify) — short() abbreviates from 1000.
// Beyond a scale's last name: scientific. beautify(v, floats) keeps the game's meaning of floats:
// the decimals of a number under 1000.

CA.Format = (() => {
  // Cookie Monster's own lists, as its source has them (dist/CookieMonster.js: Lt, Dt, Ot) — index =
  // the power of 1000; its long-name and metric lists leave the thousands blank (it writes numbers
  // under its cut-off in full), short() fills in K / k
  const ABBR = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'De', 'UDe', 'DDe', 'TDe', 'QaDe', 'QiDe', 'SxDe', 'SpDe', 'ODe', 'NDe', 'Vi', 'UVi', 'DVi', 'TVi', 'QaVi', 'QiVi', 'SxVi', 'SpVi', 'OVi', 'NVi', 'Tr', 'UTr', 'DTr', 'TTr', 'QaTr', 'QiTr', 'SxTr', 'SpTr', 'OTr', 'NTr', 'Qaa', 'UQa', 'DQa', 'TQa', 'QaQa', 'QiQa', 'SxQa', 'SpQa', 'OQa', 'NQa', 'Qia', 'UQi', 'DQi', 'TQi', 'QaQi', 'QiQi', 'SxQi', 'SpQi', 'OQi', 'NQi', 'Sxa', 'USx', 'DSx', 'TSx', 'QaSx', 'QiSx', 'SxSx', 'SpSx', 'OSx', 'NSx', 'Spa', 'USp', 'DSp', 'TSp', 'QaSp', 'QiSp', 'SxSp', 'SpSp', 'OSp', 'NSp', 'Oco', 'UOc', 'DOc', 'TOc', 'QaOc', 'QiOc', 'SxOc', 'SpOc', 'OOc', 'NOc', 'Noa', 'UNo', 'DNo', 'TNo', 'QaNo', 'QiNo', 'SxNo', 'SpNo', 'ONo', 'NNo', 'Ct', 'UCt'];
  const WORDS = ['', '', 'M', 'B', 'Tr', 'Quadr', 'Quint', 'Sext', 'Sept', 'Oct', 'Non', 'Dec', 'Undec', 'Duodec', 'Tredec', 'Quattuordec', 'Quindec', 'Sexdec', 'Septendec', 'Octodec', 'Novemdec', 'Vigint', 'Unvigint', 'Duovigint', 'Trevigint', 'Quattuorvigint'];
  const METRIC = ['', '', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  const SCALES = { abbr: ABBR, short: WORDS, metric: METRIC };
  /** The notations, for the Numbers setting. */
  const FORMATS = [
    { v: 'short', label: 'Short scale — 1.23 M, 4.56 Quadr, 7.89 Octodec' },
    { v: 'abbr', label: 'Short scale, abbreviated — 1.23 M, 4.56 Qa, 7.89 ODe' },
    { v: 'metric', label: 'Metric — 1.23 M, 4.56 P' },
    { v: 'sci', label: 'Scientific — 1.23e15' },
    { v: 'eng', label: 'Engineering — 123e12' },
    { v: 'game', label: 'The game’s own (its Numbers setting)' },
  ];
  const DEFAULT = 'short'; // Cookie Monster's own default
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
        desc: 'How cookieMgr writes long numbers (Cookie Monster’s notations).',
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
  /**
   * |v| ≥ 1000 in a notation, the name after a space as Cookie Monster writes it ("1.23 M"); compact
   * (short(), axes): no space, K / k for the thousands. Past a scale's last name: scientific.
   */
  function big(v, k, compact) {
    if (k === 'sci' || k === 'eng') return scientific(v, k === 'eng');
    const names = SCALES[k] || ABBR;
    const { m, e } = thousands(v);
    if (e >= names.length) return scientific(v, false);
    const name = names[e] || (e === 1 ? (k === 'metric' ? 'k' : 'K') : '');
    return sig(m) + (compact ? '' : ' ') + name;
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
    return sign + big(v, k === 'game' ? 'abbr' : k, true);
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

  // a payback period in compact lowercase time units, the largest two that apply: 500ms, 45s, 16m 40s,
  // 3h 12m, 2d 5h, 1y 23d (100y on, years alone: 345y, 12,345y); a zero second part is left out (3h)
  function inUnits(sec) {
    const pair = (v, unit, sub, n) => `${Math.floor(v / n)}${unit}` + (v % n ? ` ${v % n}${sub}` : '');
    if (sec === 0) return '0s';
    if (Math.round(sec * 1000) < 1000) {
      const ms = sec * 1000;
      return (ms < 0.001 ? scientific(ms, false) : ms < 10 ? small(ms, 1) : String(Math.round(ms))) + 'ms';
    }
    if (Math.round(sec) < 60) return (sec < 10 ? small(sec, 1) : String(Math.round(sec))) + 's';
    if (Math.round(sec) < 3600) return pair(Math.round(sec), 'm', 's', 60);
    if (Math.round(sec / 60) < 1440) return pair(Math.round(sec / 60), 'h', 'm', 60);
    if (Math.round(sec / 3600) < 365 * 24) return pair(Math.round(sec / 3600), 'd', 'h', 24);
    if (Math.round(sec / 86400) < 365 * 100) return pair(Math.round(sec / 86400), 'y', 'd', 365);
    const y = sec / (365 * 86400);
    return Math.round(y) < 1e6 ? `${grouped(y)}y` : `${short(y)} y`;
  }
  /**
   * A payback period (seconds) as the Payback units setting writes it: time units (the default —
   * 45s, 16m 40s, 3h 12m, 2d 5h, 1y 23d) or plain seconds, short (Cookie Monster's way: 999, 1K); ∞ when it
   * never pays back.
   */
  function payback(sec) {
    if (typeof sec !== 'number') sec = Number(sec);
    if (Number.isNaN(sec)) return '—';
    if (!isFinite(sec)) return sec > 0 ? '∞' : '-∞';
    const seconds = CA.Settings && CA.Settings.get('ppUnits') === 'seconds';
    if (seconds) return short(sec);
    return (sec < 0 ? '-' : '') + inUnits(Math.abs(sec));
  }

  return { short, beautify, signed, two, clock, span, units: inUnits, payback, FORMATS, notation: kind };
})();
