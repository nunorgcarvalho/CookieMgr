// The Garden page: the auto-gardener and its profiles (features/garden.js).
//
//   Garden          your plot as it is now, against the active profile: each tile's plant and growth
//                   stage, the profile's seed faded in on empty tiles, a red ring on tiles that don't
//                   match, and the chance a mature plant dies on the coming tick; hover a tile for details
//   Auto-gardener   its on/off switch (★ for its button on the left panel), the profile it keeps, the
//                   death-chance threshold, how many seconds before the tick it works, what it last did
//   Profiles        save the current garden (seeds + soil) as a profile; use, rename or delete them

CA.UI = CA.UI || {};

CA.UI.GardenPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const G = () => CA.Garden;
  const SYNC_MS = 500;

  let root = null;
  let timer = null;

  const stageOf = (me, age) => (age >= me.mature ? 4 : age >= me.mature * 0.666 ? 3 : age >= me.mature * 0.333 ? 2 : 1);
  const STAGE_NAMES = ['seed', 'bud', 'sprout', 'bloom', 'mature'];
  const pct = (v) => `${v >= 0.995 ? 100 : v < 0.005 && v > 0 ? '<1' : Math.round(v * 100)}%`;

  /** A garden sprite (img/gardenPlants.png): column = growth stage (0 = seed), row = the plant's icon. */
  const sprite = (me, stage, cls = '') =>
    `<i class="ca-gs ${cls}" style="background-image:url(${CA.Util.res('img/gardenPlants.png')});background-position:${-stage * 48}px ${-me.icon * 48}px"></i>`;

  // ---- the plot -----------------------------------------------------------------------------

  function tileHtml(t, profile) {
    if (!t.open) return '<div class="ca-gtile locked"></div>';
    const me = t.plant;
    let inner = '';
    let pop = '';
    if (me) {
      const st = stageOf(me, t.age);
      inner += sprite(me, st);
      if (st === 4 && !me.immortal && t.decay > 0) inner += `<b class="ca-gdecay${t.decay >= 0.5 ? ' hi' : ''}">${pct(t.decay)}</b>`;
      if (!me.unlocked) inner += `<b class="ca-gnew">${I('sparkle', 9)}</b>`;
      pop +=
        `<span class="ca-wpop-head"><b>${esc(me.name)}</b></span>` +
        `<span class="ca-wpop-row"><span class="ca-wpop-name">Growth</span><span class="ca-wpop-val">${STAGE_NAMES[st]} · ${t.age} / ${me.mature}</span></span>` +
        (me.immortal
          ? '<span class="ca-wpop-row"><span class="ca-wpop-name">Lifespan</span><span class="ca-wpop-val">immortal</span></span>'
          : `<span class="ca-wpop-row"><span class="ca-wpop-name">Dies next tick</span><span class="ca-wpop-val">${pct(t.decay)}</span></span>`) +
        (!me.unlocked ? '<span class="ca-wpop-row"><span class="ca-wpop-name">New seed</span><span class="ca-wpop-val">harvest when mature to unlock</span></span>' : '');
    } else {
      if (t.want) inner += sprite(t.want, 0, 'ghost');
      pop += '<span class="ca-wpop-head"><b>Empty</b></span>';
    }
    if (profile) pop += `<span class="ca-wpop-row"><span class="ca-wpop-name">Profile</span><span class="ca-wpop-val">${t.want ? esc(t.want.name) : 'empty'}</span></span>`;
    return `<div class="ca-gtile${t.match ? '' : ' off'}">${inner}<span class="ca-wpop ca-gpop">${pop}</span></div>`;
  }

  function plotHtml(v) {
    return v.tiles.map((t) => tileHtml(t, v.profile)).join('');
  }

  function statsHtml(v) {
    const { span, tile } = CA.UI.Plot.fmt;
    const off = v.profile ? v.tiles.filter((t) => t.open && !t.match).length : 0;
    const mature = v.tiles.filter((t) => t.plant && t.age >= t.plant.mature).length;
    return (
      tile('Next tick', Number.isFinite(v.next) ? span(v.next) : '—', v.step ? `every ${span(v.step)}` : '') +
      tile('Soil', v.soil ? esc(v.soil.name) : '—', v.profile && v.soil && v.soil.key !== v.profile.soil ? `profile: ${esc(soilName(v.profile.soil))}` : '') +
      tile('Mature', String(mature), `of ${v.tiles.filter((t) => t.plant).length} plants`) +
      (v.profile ? tile('Off-profile', String(off), off ? 'tiles to fix' : 'all as planned') : '')
    );
  }

  const soilName = (key) => {
    const M = G().minigame();
    return (M && M.soils && M.soils[key] && M.soils[key].name) || key;
  };

  function gardenCard() {
    return (
      '<div class="ca-card">' +
      C().cardHead('Garden', 'leaf', `<div class="ca-card-meta"><span class="ca-pill" data-gp-profile></span>${C().gameLink('Farm')}</div>`) +
      '<div class="ca-garden-wrap"><div class="ca-gplot" data-gp-plot></div><div class="ca-stats ca-gstats" data-gp-stats></div></div>' +
      '</div>'
    );
  }

  // ---- auto-gardener -----------------------------------------------------------------------------

  function gardenerCard() {
    const S = CA.Settings;
    const profs = G().profiles();
    const act = G().active();
    const num = (key, min, max, unit) =>
      `<input type="number" min="${min}" max="${max}" value="${esc(S.get(key))}" data-gp-num="${key}" data-min="${min}" data-max="${max}"><em>${unit}</em>`;
    return (
      '<div class="ca-card">' +
      C().cardHead('Auto-gardener', 'bolt', `<div class="ca-card-meta"><span class="ca-hint">also on the ${C().link('Macros', 'clickers')} page · ★ for a button on the left panel</span></div>`) +
      `<div class="ca-list">${CA.UI.MacrosPage.row(CA.Macros.get(G().GARDENER))}</div>` +
      '<div class="ca-gsettings">' +
      '<label class="ca-field"><span>Keep the garden like</span>' +
      (profs.length
        ? `<select data-gp-active>${profs.map((p) => `<option value="${esc(p.id)}"${act && act.id === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`
        : '<em>no profile yet — save one below</em>') +
      '</label>' +
      `<label class="ca-field"><span>Harvest a mature plant if its chance to die next tick is over</span>${num('gardenThreshold', 0, 100, '% (100 = let it die)')}</label>` +
      `<label class="ca-field"><span>Work in the last</span>${num('gardenLead', 1, 900, 'seconds before each garden tick')}</label>` +
      '</div>' +
      `<div class="ca-list">${CA.Settings.optionsIn('garden').map(CA.UI.Menu.optionRow).join('')}</div>` +
      '<div class="ca-card-note" data-gp-last></div>' +
      '</div>'
    );
  }

  function lastText() {
    const l = G().last();
    if (!l.at) return 'It harvests and replants in the last seconds before each garden tick, so new plants start growing right away and plants about to die are picked first.';
    const parts = [];
    if (l.planted) parts.push(`planted ${l.planted}`);
    if (l.harvested) parts.push(`pulled out ${l.harvested} off-profile`);
    if (l.saved) parts.push(`harvested ${l.saved} about to die`);
    if (l.unlocked) parts.push(`harvested ${l.unlocked} new seed${l.unlocked === 1 ? '' : 's'}`);
    if (l.soil) parts.push('changed the soil');
    return `Last: ${parts.join(', ')} — ${CA.UI.Plot.fmt.span((Date.now() - l.at) / 1000)} ago.`;
  }

  // ---- profiles ------------------------------------------------------------------------------

  function miniPlot(p) {
    const M = G().minigame();
    let h = '<div class="ca-gmini">';
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const key = p.plot[y][x];
        const me = M && key && M.plants[key];
        h += `<span>${me ? sprite(me, 4) : ''}</span>`;
      }
    }
    return h + '</div>';
  }

  function profilesCard() {
    const profs = G().profiles();
    const act = G().active();
    let h =
      '<div class="ca-card">' +
      C().cardHead('Profiles', 'save') +
      '<div class="ca-gsave">' +
      `<input type="text" maxlength="40" placeholder="Garden ${profs.length + 1}" data-gp-name>` +
      C().button(`${I('plus', 12)} Save current garden`, 'data-gp-save', 'ca-btn-small ca-btn-on') +
      '</div>';
    if (!profs.length) h += '<div class="ca-card-note">A profile remembers the seed on every tile and the soil. Plant your garden the way you want it, then save it here.</div>';
    else {
      h += '<div class="ca-gprofiles">';
      profs.forEach((p) => {
        const on = act && act.id === p.id;
        const n = p.plot.flat().filter(Boolean).length;
        h +=
          `<div class="ca-gprofile${on ? ' on' : ''}">` +
          miniPlot(p) +
          '<div class="ca-gprofile-text">' +
          `<input type="text" maxlength="40" value="${esc(p.name)}" data-gp-rename="${esc(p.id)}">` +
          `<div class="ca-row-desc">${n} plant${n === 1 ? '' : 's'} · ${esc(soilName(p.soil))}${on ? ' · <b>active</b>' : ''}</div>` +
          '<div class="ca-controls">' +
          (on ? '' : C().button('Use', `data-gp-use="${esc(p.id)}"`, 'ca-btn-small')) +
          C().button('Delete', `data-gp-del="${esc(p.id)}" data-arm-label="Delete it?"`, 'ca-btn-small ca-btn-off') +
          '</div></div></div>';
      });
      h += '</div>';
    }
    return h + '</div>';
  }

  // ---- page ------------------------------------------------------------------------------

  function html() {
    if (!G().minigame())
      return (
        '<div class="ca-card ca-card-note-only">' +
        C().cardHead('Garden', 'leaf') +
        '<div class="ca-card-note">The Garden opens once you have a level-1 Farm (spend a sugar lump on it). The auto-gardener and its profiles will be here.</div>' +
        '</div>'
      );
    return gardenCard() + gardenerCard() + profilesCard();
  }

  function sync() {
    if (!root || !root.isConnected) return;
    const v = G().view();
    if (!v) return;
    const plot = root.querySelector('[data-gp-plot]');
    if (plot) CA.UI.Widgets.morph(plot, plotHtml(v));
    const stats = root.querySelector('[data-gp-stats]');
    if (stats) CA.UI.Widgets.morph(stats, statsHtml(v));
    const pill = root.querySelector('[data-gp-profile]');
    if (pill) pill.textContent = v.profile ? `profile: ${v.profile.name}` : 'no profile';
    const last = root.querySelector('[data-gp-last]');
    if (last) last.textContent = lastText();
    CA.UI.MacrosPage.sync(root);
  }

  function onClick(e) {
    const t = e.target.closest('[data-gp-save],[data-gp-use],[data-gp-del]');
    if (!t) return;
    e.stopPropagation();
    const d = t.dataset;
    if ('gpDel' in d) {
      if (!CA.UI.Menu.armed(t)) return;
      G().removeProfile(d.gpDel);
    } else if ('gpUse' in d) G().use(d.gpUse);
    else if ('gpSave' in d) {
      const name = root.querySelector('[data-gp-name]');
      const p = G().snapshot(name && name.value.trim());
      if (p) CA.Util.notify('Garden profile saved', `“${esc(p.name)}” — ${p.plot.flat().filter(Boolean).length} plants on ${esc(soilName(p.soil))}.`, CA.ICON, 3);
    }
    CA.Util.sound('snd/tick.mp3');
    CA.UI.Menu.render();
  }

  function onChange(e) {
    const el = e.target;
    const d = el.dataset || {};
    if ('gpActive' in d) {
      if (e.type !== 'change') return;
      G().use(el.value);
    }
    else if (d.gpNum) {
      const v = Number(el.value);
      if (!Number.isFinite(v)) return;
      const clamped = Math.max(Number(d.min), Math.min(Number(d.max), Math.round(v)));
      CA.Settings.set(d.gpNum, clamped);
      if (e.type === 'change') el.value = clamped;
      return;
    } else if (d.gpRename) {
      if (e.type !== 'change') return;
      G().rename(d.gpRename, el.value);
      return;
    } else return;
    CA.UI.Menu.render();
  }

  function mount(el) {
    unmount();
    root = el;
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onChange);
    sync();
    timer = setInterval(sync, SYNC_MS);
  }

  function unmount() {
    clearInterval(timer);
    timer = null;
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.removeEventListener('input', onChange);
    }
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'garden', label: 'Garden', icon: 'leaf', order: 30, group: 'minigames', html, mount, unmount, tick: sync });
  }

  return { init, sync };
})();
