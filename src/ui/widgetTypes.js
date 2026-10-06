// The built-in widget types (ui/widgets.js is the engine that places, drags, sizes and saves them).
//
//   macro      one per ★ favourite macro: a round icon button (on/off or run); name on hover
//   status     "Running now" as a status bar: an icon per running macro, details on hover
//   stats      Quick stats — you pick which (see STATS below)
//   events     the latest events — how many and which types; as many of these as you like
//   grimoire / garden / market / pantheon
//              one compact round widget per minigame: a ring for its timer (magic, next tick,
//              next worship swap), a short label under it, details on hover; click to open it
//
// A type can declare `settings` — fields the widget settings editor (Widgets page) shows for it:
//   { key, label, type: 'number' | 'multi', min, max, default, options: () => [{ v, label, icon, color }] }

CA.UI = CA.UI || {};

CA.UI.WidgetTypes = (() => {
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.UI.Plot.fmt;
  const HOT_MS = 1500;

  // ---- macro buttons ------------------------------------------------------------------------

  function macroHtml(inst) {
    const m = CA.Macros.get(inst.macro);
    if (!m) return '';
    const on = CA.Macros.isOn(m.id);
    const key = CA.Settings.getHotkey(`macro.${m.id}`);
    const state = m.mode === 'once' ? 'click to run' : on ? 'on' : 'off';
    return (
      `<button type="button" class="ca-wb${on ? ' on' : ''}${m.mode === 'once' ? ' once' : ''}" data-w-trigger="${esc(m.id)}" aria-label="${esc(m.name)}">` +
      `${CA.UI.MacrosPage.icon(m, true)}</button>` +
      `<span class="ca-wb-label ca-wt"><b>${esc(m.name)}</b><em class="${on ? 'on' : ''}">${state}${key ? ` · ${esc(CA.Hotkeys.format(key))}` : ''}</em></span>`
    );
  }

  // ---- running now ---------------------------------------------------------------------------

  function statusPop(m) {
    const st = CA.Macros.status(m.id);
    const { beautify, span } = F();
    let h =
      '<span class="ca-wpop ca-wt">' +
      `<span class="ca-wpop-head">${CA.UI.MacrosPage.icon(m, true)}<b>${esc(m.name)}</b></span>` +
      `<span class="ca-wpop-sub">${esc(CA.Macros.triggerText(m))} · on for ${span((Date.now() - CA.Macros.since(m.id)) / 1000)}</span>`;
    CA.Macros.stepsOf(m).forEach((step, i) => {
      const s = (st && st.steps[i]) || {};
      const a = CA.Actions.get(step.action) || {};
      const hot = s.lastAt && Date.now() - s.lastAt < HOT_MS;
      const val = s.error ? esc(s.error) : `${beautify(s.total || 0, 0)}${a.unit ? ' ' + esc(a.unit) : ''} · ${s.lastAt ? `${span((Date.now() - s.lastAt) / 1000)} ago` : 'nothing yet'}`;
      h += `<span class="ca-wpop-row${hot ? ' hot' : ''}${s.error ? ' err' : ''}">${I(a.icon || 'close', 11)}<span class="ca-wpop-name">${esc(CA.Actions.describe(step))}</span><span class="ca-wpop-val">${val}</span></span>`;
    });
    return h + '<span class="ca-wpop-foot">click to open the Macros page</span></span>';
  }

  function statusHtml() {
    const ids = CA.Macros.runningIds();
    let h = `<span class="ca-wbar-lead">${I('play', 11)}</span>`;
    if (!ids.length) return `${h}<span class="ca-wbar-idle ca-wt">idle</span>`;
    ids.forEach((id) => {
      const m = CA.Macros.get(id);
      if (!m) return;
      const st = CA.Macros.status(id);
      const hot = st && st.steps.some((s) => s.lastAt && Date.now() - s.lastAt < HOT_MS);
      const err = st && st.steps.some((s) => s.error);
      h += `<span class="ca-wbar-item${hot ? ' hot' : ''}${err ? ' err' : ''}" data-w-open="clickers" aria-label="${esc(m.name)}">${CA.UI.MacrosPage.icon(m, true)}${statusPop(m)}</span>`;
    });
    return h;
  }

  // ---- quick stats ------------------------------------------------------------------------------

  // totals counted with the game's own rules (the same ones behind UpgradesOwned / AchievementsOwned);
  // UpgradesById / AchievementsById are plain objects keyed by id, not arrays
  let upTotal = 0;
  let achTotal = 0;
  function upgradesTotal() {
    if (!upTotal && Game.UpgradesById && Game.CountsAsUpgradeOwned) upTotal = Object.values(Game.UpgradesById).filter((u) => u && Game.CountsAsUpgradeOwned(u.pool)).length;
    return upTotal;
  }
  function achievementsTotal() {
    if (!achTotal && Game.AchievementsById && Game.CountsAsAchievementOwned) achTotal = Object.values(Game.AchievementsById).filter((a) => a && Game.CountsAsAchievementOwned(a.pool)).length;
    return achTotal;
  }

  const lastFrame = () => {
    const fr = CA.Recorder.frames();
    return fr[fr.length - 1];
  };
  const allTime = () => (Game.cookiesReset || 0) + (Game.cookiesEarned || 0);
  const count = (owned, total) => (Number.isFinite(owned) ? `${F().beautify(owned, 0)}${total ? ` <em>/ ${F().beautify(total, 0)}</em>` : ''}` : '—');
  const perS = (v) => (Number.isFinite(v) ? `${F().beautify(v)}/s` : '—');

  /** Every stat Quick stats can show, in display order. */
  const STATS = [
    { id: 'cpsClick', label: 'CpS + clicking', value: () => { const f = lastFrame(); return f ? perS((f.cps || 0) + (f.click || 0)) : '—'; } },
    { id: 'cps', label: 'CpS', value: () => perS(Game.cookiesPs) },
    { id: 'actual', label: 'Actual CpS', value: () => { const r = CA.UI.Graphs.recent(60); return r ? `${perS(r.actual)} <em>last min</em>` : '—'; } },
    { id: 'clickRate', label: 'Clicks / second', value: () => { const r = CA.UI.Graphs.recent(10); return r && Number.isFinite(r.clickRate) ? r.clickRate.toFixed(1) : '—'; } },
    { id: 'bank', label: 'Bank', value: () => F().beautify(Game.cookies || 0) },
    { id: 'runStarted', label: 'Run started', value: () => (Game.startDate ? `${F().span((Date.now() - Game.startDate) / 1000)} <em>ago</em>` : '—') },
    { id: 'upgrades', label: 'Upgrades', value: () => count(Game.UpgradesOwned, upgradesTotal()) },
    { id: 'buildings', label: 'Buildings', value: () => count(Game.BuildingsOwned) },
    { id: 'prestige', label: 'Prestige level', value: () => `${F().beautify(Game.prestige || 0, 0)} <em>(max ${F().beautify(Math.floor(Game.HowMuchPrestige(allTime())), 0)})</em>` },
    { id: 'prestigeGain', label: 'Prestige this run', value: () => `+${F().beautify(Math.floor(Game.HowMuchPrestige(allTime())) - (Game.prestige || 0), 0)}` },
    {
      id: 'nextLevel',
      label: 'Next level in',
      value: () => {
        const lvl = Math.floor(Game.HowMuchPrestige(allTime()));
        const need = typeof Game.HowManyCookiesReset === 'function' ? Game.HowManyCookiesReset(lvl + 1) - allTime() : NaN;
        const r = CA.UI.Graphs.recent(60);
        return r && r.actual > 0 && need > 0 ? F().span(need / r.actual) : '—';
      },
    },
    { id: 'chips', label: 'Heavenly chips', value: () => F().beautify(Game.heavenlyChips || 0, 0) },
    { id: 'achievements', label: 'Achievements', value: () => count(Game.AchievementsOwned, achievementsTotal()) },
    { id: 'lumps', label: 'Sugar lumps', value: () => count(Game.lumps) },
    { id: 'goldenClicks', label: 'Golden cookies clicked', value: () => count(Game.goldenClicks) },
    { id: 'wrinklers', label: 'Wrinklers', value: () => count((Game.wrinklers || []).filter((w) => w.phase > 0).length) },
    { id: 'allTime', label: 'All time baked', value: () => F().beautify(allTime()) },
  ];
  const DEFAULT_STATS = ['cpsClick', 'actual', 'runStarted', 'upgrades', 'prestige', 'achievements', 'allTime'];

  function statsHtml(inst) {
    const chosen = new Set(Array.isArray(inst.stats) && inst.stats.length ? inst.stats : DEFAULT_STATS);
    return STATS.filter((s) => chosen.has(s.id))
      .map((s) => {
        let v;
        try {
          v = s.value();
        } catch (e) {
          v = '—';
        }
        return `<div class="ca-w-stat"><span>${s.label}</span><b>${v}</b></div>`;
      })
      .join('');
  }

  // ---- latest events ------------------------------------------------------------------------

  const DEFAULT_EVENTS = 8;
  const eventCount = (inst) => Math.max(1, Math.min(200, Math.round(inst.count || DEFAULT_EVENTS)));

  function eventsHtml(inst) {
    const kinds = Array.isArray(inst.types) && inst.types.length ? inst.types : null;
    const list = CA.EventLog.list(kinds).slice(-eventCount(inst)).reverse();
    if (!list.length) return `<div class="ca-w-empty">${kinds ? 'No events of the chosen types yet.' : 'Nothing has happened yet.'}</div>`;
    return `<div class="ca-w-events">${list.map((e) => CA.UI.EventsPage.rowHtml(e)).join('')}</div>`;
  }

  // ---- minigames: compact round widgets ---------------------------------------------------------

  /** Opens a building's minigame in the game and scrolls to it. */
  function openMinigame(building) {
    const b = Game.Objects && Game.Objects[building];
    if (!b || !b.minigame || typeof b.switchMinigame !== 'function') {
      CA.Util.notify(building, 'This minigame isn’t unlocked yet (the building needs level 1 — a sugar lump).', CA.ICON, 3);
      return;
    }
    // the building rows are hidden while a menu (ours, Stats, Options…) is open: close it first
    if (Game.onMenu && typeof Game.ShowMenu === 'function') Game.ShowMenu(Game.onMenu);
    if (!b.onMinigame) b.switchMinigame(1);
    // after the rows are back on screen: the minigame sits at the top of its building's row
    setTimeout(() => {
      const row = document.getElementById(`row${b.id}`);
      if (row && row.scrollIntoView) row.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 50);
  }

  const RING_R = 19;
  const RING_C = 2 * Math.PI * RING_R;

  /**
   * One round widget: a ring filled to `frac`, an icon in the middle, a short label under it, and
   * a styled popup (rows of [label, value]) on hover. Clicking opens `building`'s minigame.
   */
  function orb({ theme, building, icon, frac, label, extra, pop }) {
    const f = Math.max(0, Math.min(1, Number.isFinite(frac) ? frac : 0));
    return (
      `<div class="ca-orb ca-orb-${theme}" data-w-open-mg="${esc(building)}">` +
      '<svg class="ca-orb-ring" viewBox="0 0 44 44" aria-hidden="true">' +
      `<circle class="ca-orb-track" cx="22" cy="22" r="${RING_R}"/>` +
      `<circle class="ca-orb-fill" cx="22" cy="22" r="${RING_R}" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${(RING_C * (1 - f)).toFixed(2)}"/>` +
      '</svg>' +
      `<span class="ca-orb-ico">${icon}</span>` +
      (extra || '') +
      `<span class="ca-orb-label ca-wt">${label}</span>` +
      `<span class="ca-wpop ca-orb-pop ca-wt">${pop.map(([k, v]) => (k === null ? `<span class="ca-wpop-head">${v}</span>` : `<span class="ca-wpop-row"><span class="ca-wpop-name">${k}</span><span class="ca-wpop-val">${v}</span></span>`)).join('')}<span class="ca-wpop-foot">click to open it</span></span>` +
      '</div>'
    );
  }

  const lockedOrb = (theme, building, icon, name) =>
    orb({ theme, building, icon: I(icon, 18), frac: 0, label: 'locked', pop: [[null, `<b>${name}</b>`], ['', 'not unlocked yet']] });

  function grimoireHtml() {
    const { span } = F();
    const mg = CA.Grimoire.magicNow();
    if (!mg) return lockedOrb('grimoire', 'Wizard tower', 'wizard', 'Grimoire');
    const full = mg.fullIn === 0;
    return orb({
      theme: 'grimoire',
      building: 'Wizard tower',
      icon: I('wizard', 18),
      frac: mg.magic / mg.max,
      label: full ? 'full' : Number.isFinite(mg.fullIn) ? span(mg.fullIn) : '—',
      pop: [
        [null, '<b>Grimoire</b>'],
        ['Magic', `${Math.floor(mg.magic)} / ${Math.floor(mg.max)}`],
        ['Refill', mg.perSec ? `+${mg.perSec.toFixed(2)}/s` : 'full'],
        ['Full in', full ? 'now' : Number.isFinite(mg.fullIn) ? span(mg.fullIn) : '—'],
      ],
    });
  }

  const STAGES = ['bud', 'sprout', 'bloom', 'mature'];

  /** Plants per growth stage — the game's own thresholds: ⅓, ⅔ and all of a plant's maturity. */
  function gardenInfo() {
    const farm = Game.Objects && Game.Objects.Farm;
    const M = farm && farm.minigame;
    if (!M || !M.plot || !M.plantsById) return null;
    const counts = [0, 0, 0, 0];
    M.plot.forEach((rowTiles) =>
      (rowTiles || []).forEach((tile) => {
        if (!tile || !tile[0]) return;
        const me = M.plantsById[tile[0] - 1];
        if (!me) return;
        const age = tile[1];
        counts[age >= me.mature ? 3 : age >= me.mature * 0.666 ? 2 : age >= me.mature * 0.333 ? 1 : 0]++;
      })
    );
    const next = M.nextStep ? Math.max(0, (M.nextStep - Date.now()) / 1000) : null;
    return { counts, next, step: M.stepT || 0 };
  }

  function gardenHtml() {
    const { span } = F();
    const g = gardenInfo();
    if (!g) return lockedOrb('garden', 'Farm', 'leaf', 'Garden');
    // four small dots under the ring, one per growth stage, each with its count
    const dots = `<span class="ca-orb-dots ca-wt">${STAGES.map((st, i) => `<span class="s${i}"><i></i>${g.counts[i]}</span>`).join('')}</span>`;
    return orb({
      theme: 'garden',
      building: 'Farm',
      icon: I('leaf', 18),
      frac: g.next != null && g.step ? 1 - g.next / g.step : 0,
      label: g.next == null ? '—' : span(g.next),
      extra: dots,
      pop: [[null, '<b>Garden</b>']].concat(STAGES.map((st, i) => [st[0].toUpperCase() + st.slice(1), String(g.counts[i])]), [['Next tick', g.next == null ? '—' : span(g.next)]]),
    });
  }

  function marketHtml() {
    const { span, beautify } = F();
    const m = CA.Stocks.minigame();
    if (!m) return lockedOrb('market', 'Bank', 'stocks', 'Stock market');
    const owned = m.goodsById.filter((g) => g.stock > 0).length;
    const last = CA.Stocks.lastTick();
    const next = CA.Stocks.nextTickIn();
    const moved = last && last.held;
    const signed = (v, unit, d) => `${v < 0 ? '−' : '+'}${unit}${beautify(Math.abs(v), d)}`;
    return orb({
      theme: 'market',
      building: 'Bank',
      icon: I('stocks', 18),
      frac: next != null && m.secondsPerTick ? 1 - next / m.secondsPerTick : 0,
      label: moved ? `<span class="${last.dollars < 0 ? 'neg' : 'pos'}">${signed(last.dollars, '$', Math.abs(last.dollars) < 10 ? 2 : 0)}</span>` : `${owned} held`,
      pop: [
        [null, '<b>Stock market</b>'],
        ['Holding', `${owned} of ${m.goodsById.length} stocks`],
        ['Last tick', moved ? `${signed(last.dollars, '$', 2)} (${signed(last.cookies, '', 1)} cookies)` : 'no stocks held into it'],
        ['Next tick', next == null ? '—' : span(next)],
      ],
    });
  }

  /** The Pantheon (Temple minigame): the three slotted spirits and the next worship swap. */
  function pantheonInfo() {
    const temple = Game.Objects && Game.Objects.Temple;
    const M = temple && temple.minigame;
    if (!M || !Array.isArray(M.slot) || !M.godsById) return null;
    const gods = M.slot.map((id) => (id >= 0 ? M.godsById[id] : null));
    // main.js: a swap refills 1 h after the last one with 2 left, 4 h with 1, 16 h with 0
    const wait = M.swaps === 0 ? 16 * 3600 : M.swaps === 1 ? 4 * 3600 : 3600;
    const next = M.swaps < 3 ? Math.max(0, (M.swapT + wait * 1000 - Date.now()) / 1000) : null;
    return { gods, swaps: M.swaps, next, wait };
  }

  const SLOTS = ['Diamond', 'Ruby', 'Jade'];

  function pantheonHtml() {
    const { span } = F();
    const p = pantheonInfo();
    if (!p) return lockedOrb('pantheon', 'Temple', 'pantheon', 'Pantheon');
    const sprite = (g) =>
      g && g.icon
        ? `<i class="ca-orb-god" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-g.icon[0] * 48}px ${-g.icon[1] * 48}px"></i>`
        : '<i class="ca-orb-god empty"></i>';
    return orb({
      theme: 'pantheon',
      building: 'Temple',
      icon: I('pantheon', 18),
      frac: p.next == null ? 1 : 1 - p.next / p.wait,
      label: p.next == null ? `${p.swaps} swaps` : span(p.next),
      extra: `<span class="ca-orb-gods">${p.gods.map(sprite).join('')}</span>`,
      pop: [[null, '<b>Pantheon</b>']].concat(
        p.gods.map((g, i) => [SLOTS[i], g ? esc(g.name) : '<em>empty</em>']),
        [
          ['Swaps', `${p.swaps} / 3`],
          ['Next swap in', p.next == null ? 'all 3 ready' : span(p.next)],
        ]
      ),
    });
  }

  function register() {
    const D = CA.UI.Widgets.defineType;
    D({ id: 'macro', name: 'Macro button', icon: 'star', bare: true, hidden: true, resize: 'scale', html: macroHtml });
    D({ id: 'status', name: 'Running now', icon: 'play', desc: 'A status bar: an icon for each running macro, pulsing while it works. Hover an icon for what its actions have done.', bare: true, single: true, resize: 'scale', html: statusHtml });
    D({
      id: 'stats',
      name: 'Quick stats',
      icon: 'graphs',
      desc: 'The numbers you care about at a glance — pick which in its settings.',
      width: 190,
      single: true,
      resize: 'free',
      html: statsHtml,
      settings: [{ key: 'stats', label: 'Show', type: 'multi', default: DEFAULT_STATS, options: () => STATS.map((s) => ({ v: s.id, label: s.label })) }],
    });
    D({
      id: 'events',
      name: 'Latest events',
      icon: 'events',
      desc: 'The newest entries in the event log, scrollable. Choose how many and which types in its settings; add as many as you like (one for golden cookies, one for trades…).',
      width: 260,
      resize: 'free',
      html: eventsHtml,
      settings: [
        { key: 'count', label: 'Keep the last', type: 'number', min: 1, max: 200, default: DEFAULT_EVENTS, unit: 'events' },
        {
          key: 'types',
          label: 'Show (none ticked = all)',
          type: 'multi',
          default: [],
          options: () => {
            const t = CA.EventLog.types();
            return Object.keys(t).map((k) => ({ v: k, label: t[k].name, icon: t[k].icon, color: t[k].color }));
          },
        },
      ],
    });
    D({ id: 'grimoire', name: 'Grimoire', icon: 'wizard', desc: 'A small round meter: the ring is your magic, the label the time until it’s full. Click it to open the Grimoire.', bare: true, single: true, resize: 'scale', html: grimoireHtml });
    D({ id: 'garden', name: 'Garden', icon: 'leaf', desc: 'The ring counts down to the next garden tick; the dots under it are your plants by stage (bud, sprout, bloom, mature). Click it to open the Garden.', bare: true, single: true, resize: 'scale', html: gardenHtml });
    D({ id: 'market', name: 'Stock market', icon: 'stocks', desc: 'The ring counts down to the next market tick; the label is what the last tick did to the stocks you held. Click it to open the Stock market.', bare: true, single: true, resize: 'scale', html: marketHtml });
    D({ id: 'pantheon', name: 'Pantheon', icon: 'pantheon', desc: 'Your three slotted spirits, and a ring counting down to the next worship swap. Click it to open the Pantheon.', bare: true, single: true, resize: 'scale', html: pantheonHtml });
  }

  return { register, openMinigame, STATS, DEFAULT_STATS };
})();
