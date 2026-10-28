// The Effect timers widget: one slim bar per effect running (Frenzy, Click frenzy, a building special,
// Elder frenzy, Clot…), in the effect's own colour with the game's own icon, draining as it runs out.
// On the bar: its name, what it multiplies (×7 CpS, ×777 clicks) and the time left; beside it, the
// chance a golden cookie comes before it ends (CA.Timers.buffsWithGolden; off unless ticked in its
// settings) — whether it can still be stacked. A full bar is the effect's own length, or (a setting)
// a fresh Frenzy's for every bar, so they compare — longer ones then fill theirs and are outlined.
// Bad effects (Clot, Cursed finger…) are striped. A row is one line of text tall, so a stack of
// effects stays short; it starts see-through (the Widgets engine's Background setting),
// the text outlined so it reads over the game.
//
// Shared with other views of the effects: colorOf(buff) (its colour), iconHtml(buff) (its 16 px game
// icon, .ca-et-ico), isBad(buff) — buff as CA.Timers.buffs() gives it.

CA.UI = CA.UI || {};

CA.UI.EffectTimers = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  // each effect's colour, by the game's buff type; anything else (a mod's, a new one) gets one from its name
  const COLORS = {
    frenzy: '#f0b429',
    'click frenzy': '#3d9cf0',
    dragonflight: '#a35cf5',
    'dragon harvest': '#f07a2a',
    'building buff': '#3fbf63',
    'cookie storm': '#e8c75a',
    'everything must go': '#ee5aa0',
    'sugar blessing': '#f5a3c8',
    'sugar frenzy': '#e0559b',
    'haggler luck': '#2fb8a8',
    'pixie luck': '#7fd0ff',
    'magic adept': '#8f7cf7',
    'blood frenzy': '#d8323a',
    clot: '#8c7a62',
    'cursed finger': '#b0476a',
    'building debuff': '#a9612c',
    devastation: '#c03a2b',
    'haggler misery': '#6d8a86',
    'pixie misery': '#5d7b99',
    'magic inept': '#6f6690',
    'gifted out': '#8a8a8a',
  };
  const BAD = new Set(['clot', 'cursed finger', 'building debuff', 'haggler misery', 'pixie misery', 'magic inept', 'gifted out']);
  const SHOW = [
    { v: 'icon', label: 'Its icon' },
    { v: 'mult', label: 'What it multiplies (×7 CpS, ×777 clicks)' },
    { v: 'golden', label: 'The chance a golden cookie comes before it ends' },
  ];
  const DEFAULT = ['icon', 'mult'];
  const FRENZY_BASE = 77; // a Frenzy's length with no upgrades, if CA.Timers can't say
  const frenzySecs = () => {
    const s = CA.Timers.effectDuration ? CA.Timers.effectDuration('frenzy') : NaN;
    return Number.isFinite(s) && s > 0 ? s : FRENZY_BASE;
  };
  const SCALES = () => [
    { v: 'own', label: 'Its own length (full when it starts)' },
    { v: 'frenzy', label: `A fresh Frenzy’s length (${F().span(frenzySecs())} with your upgrades)` },
  ];
  const SORTS = [
    { v: 'start', label: 'As they started' },
    { v: 'end', label: 'Ending soonest first' },
  ];

  function colorOf(b) {
    const k = String(b.type || '').toLowerCase();
    if (COLORS[k]) return COLORS[k];
    if (/^loan \d/.test(k)) return /interest/.test(k) ? '#9a6b3c' : '#4fae8c';
    let h = 0;
    for (const ch of String(b.name || k)) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${h}, 60%, 52%)`;
  }
  const isBad = (b) => BAD.has(String(b.type || '').toLowerCase()) || b.cps < 1 || b.click < 1;

  /** ×7, ×777, ×1,111, ×0.5, ×18.4 */
  function mult(m) {
    if (m >= 100) return `×${F().beautify(Math.round(m))}`;
    return `×${Number(m.toFixed(m >= 10 ? 1 : 2))}`;
  }
  function multText(b) {
    const out = [];
    if (b.cps !== 1) out.push(`${mult(b.cps)} CpS`);
    if (b.click !== 1) out.push(`${mult(b.click)} clicks`);
    return out.join(' · ');
  }
  /** Seconds as the bar shows them: 9s, 1:17, 1:02:05 — short, so the name keeps its room. */
  function clock(s) {
    const t = Math.max(0, Math.ceil(s));
    const two = F().two;
    if (t < 60) return `${t}s`;
    if (t < 3600) return `${Math.floor(t / 60)}:${two(t % 60)}`;
    return `${Math.floor(t / 3600)}:${two(Math.floor((t % 3600) / 60))}:${two(t % 60)}`;
  }
  const pc = (p) => (p >= 0.995 ? '100%' : p > 0 && p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`);

  function iconHtml(b) {
    if (!b.icon) return '<span class="ca-et-ico none"><i></i></span>';
    const sheet = typeof b.icon[2] === 'string' ? b.icon[2] : CA.Util.res('img/icons.png');
    return `<span class="ca-et-ico"><i style="background-image:url(${esc(sheet)});background-position:${-b.icon[0] * 48}px ${-b.icon[1] * 48}px"></i></span>`;
  }

  /** full: the seconds a full bar stands for — the effect's own length, or one fixed for every bar (a
   *  fresh Frenzy's); an effect with more left than that fills its bar and is outlined (.over). */
  function rowHtml(b, show, golden, full) {
    const len = full || b.maxSecs;
    const frac = len > 0 ? Math.max(0, Math.min(1, b.secs / len)) : 1;
    const over = !!full && b.secs > full;
    const m = multText(b);
    const g = golden ? b.golden : null;
    const tip =
      `${b.name}: ${F().span(b.secs)} left of ${F().span(b.maxSecs)}${m ? ` — ${m}` : ''}.` +
      (over ? ` Longer than a fresh Frenzy (${F().span(full)}): its bar is full and outlined.` : '') +
      (g === null ? '' : ` The chance a golden cookie comes before it ends: ${pc(g)}.`);
    return (
      `<div class="ca-et${isBad(b) ? ' bad' : ''}${b.secs < 5 ? ' ending' : ''}${over ? ' over' : ''}" style="--c:${colorOf(b)}" data-tip="${esc(tip)}">` +
      (show.has('icon') ? iconHtml(b) : '') +
      `<div class="ca-et-bar"><i style="width:${(frac * 100).toFixed(2)}%"></i>` +
      `<span class="ca-et-txt"><span class="ca-et-name">${esc(b.name)}${show.has('mult') && m ? ` <em>${esc(m)}</em>` : ''}</span><b class="ca-et-time">${clock(b.secs)}</b></span></div>` +
      (g === null ? '' : `<span class="ca-et-gc${g >= 0.5 ? ' hi' : g < 0.1 ? ' lo' : ''}"><i style="background-image:url(${esc(CA.Util.res('img/goldCookie.png'))})"></i>${pc(g)}</span>`) +
      '</div>'
    );
  }

  function showOf(inst) {
    const ok = SHOW.map((o) => o.v);
    const s = Array.isArray(inst.stats) ? inst.stats.filter((v) => ok.includes(v)) : [];
    // saved before v3.15 (['bars']): the defaults
    return new Set(Array.isArray(inst.stats) && (s.length || !inst.stats.length) ? s : DEFAULT);
  }

  function html(inst) {
    const show = showOf(inst);
    let list = CA.Timers.buffsWithGolden();
    if (!list.length) return '<div class="ca-et-none">No effects running.</div>';
    if (inst.sort === 'end') list = list.slice().sort((a, b) => a.secs - b.secs);
    // the chance column only while a golden cookie can still come (not with the Golden switch on, nor one on screen)
    const s = CA.Timers.spawnOf('golden');
    const golden = show.has('golden') && !!s && !s.spawned;
    const full = inst.barScale === 'frenzy' ? frenzySecs() : 0;
    return `<div class="ca-et-list">${list.map((b) => rowHtml(b, show, golden, full)).join('')}</div>`;
  }

  // ---- the settings' samples (ui/widgets.js): a row as the widget draws it — the first effect running,
  // or a stand-in Frenzy when none is — showing just the column, or the bar at each scale
  const STAND_IN = () => ({ name: 'Frenzy', type: 'frenzy', icon: [10, 14], secs: 48, maxSecs: frenzySecs(), cps: 7, click: 1, golden: 0.4 });
  const sampleBuff = () => CA.Timers.buffsWithGolden()[0] || STAND_IN();
  const sampleRow = (show, golden, full) => `<div class="ca-et-list">${rowHtml(sampleBuff(), new Set(show), golden, full)}</div>`;
  const showSample = (v) => () => sampleRow(v === 'golden' ? [] : [v], v === 'golden', 0);
  const scaleSample = (v) => () => sampleRow(['icon', 'mult'], false, v === 'frenzy' ? frenzySecs() : 0);

  function init() {
    CA.UI.Widgets.defineType({
      id: 'effectTimers',
      group: 'golden',
      sprite: [0, 14],
      short: 'A draining bar per effect running',
      name: 'Effect timers',
      icon: 'clock',
      desc: 'A slim bar per effect running (Frenzy, Click frenzy, building specials, Clot…) in its own colour and icon: what it multiplies and its time left (and, if you tick it, the chance a golden cookie comes before it ends). See-through until you hover it.',
      width: 240,
      resize: 'free',
      single: false,
      bg: 0,
      html,
      settings: [
        { key: 'stats', label: 'Show', type: 'multi', default: DEFAULT, options: () => SHOW.map((o) => ({ ...o, sample: showSample(o.v) })) },
        { key: 'barScale', label: 'A full bar is', type: 'select', default: 'own', options: () => SCALES().map((o) => ({ ...o, sample: scaleSample(o.v) })) },
        { key: 'sort', label: 'Order', type: 'select', default: 'start', options: () => SORTS },
      ],
    });
  }

  return { init, html, colorOf, isBad, iconHtml, COLORS };
})();
