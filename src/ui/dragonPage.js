// The Dragon page (Krumblor; in the minigames group, under the Grimoire — not a minigame, close enough):
//
//   Dragon         its level, the aura in each slot (and what it does), what the next level takes,
//                  and a Train button
//   Auto dragon    the built-in Auto dragon and Pet the dragon macros
//   Aura profiles  one row per profile: its name, an aura for each slot, whether it's in, Use and
//                  Delete; New profile (empty) and From current (the auras in now). Macros use a
//                  profile with dragon.profile(id) — the id is under its name.
//
// The game logic is features/dragon.js.

CA.UI = CA.UI || {};

CA.UI.DragonPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const D = () => CA.Dragon;
  const SYNC_MS = 1000;
  let root = null;
  let life = null; // the mounted page (CA.UI.Pages.scope)

  const hasDragon = () => !!(Game.dragonLevels && Game.dragonAuras) && (Game.Has('A crumbly egg') || D().nextCost());
  const sprite = (pic, cls = '') =>
    `<span class="ca-god-ico ${cls}" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-pic[0] * 48}px ${-pic[1] * 48}px"></span>`;

  // ---- the dragon ------------------------------------------------------------------------------

  function slotHtml(i) {
    const id = i ? Game.dragonAura2 || 0 : Game.dragonAura || 0;
    const open = D().slots() > i;
    const a = id > 0 ? Game.dragonAuras[id] : null;
    return (
      `<div class="ca-slot ca-aura-slot${open ? '' : ' locked'}">` +
      `<div class="ca-slot-gem">Aura ${i + 1}</div>` +
      (a
        ? `${sprite(a.pic, 'big')}<div class="ca-slot-name">${esc(a.dname || a.name)}</div><div class="ca-god-desc">${a.desc || ''}</div>`
        : `<span class="ca-god-ico big empty"></span><div class="ca-slot-name">${open ? 'No aura' : 'Locked'}</div><div class="ca-slot-title">${open ? 'pick one below, or in the game' : `opens at dragon level ${i ? D().LAST : 5}`}</div>`) +
      '</div>'
    );
  }

  function dragonHtml() {
    const c = D().nextCost();
    const can = D().canTrain('all');
    const next = c
      ? `<div class="ca-dragon-next"><span><em>Next:</em> <b>${esc(D().nextAction())}</b> — ${esc(c.text)}</span>` +
        C().button(`${I('dragon', 12)} ${c.kind === 'egg' ? 'Buy' : 'Train'}`, 'data-dragon-act="train"', `ca-btn-small ca-btn-run${can ? '' : ' ca-unaffordable'}`) +
        '</div>'
      : '<div class="ca-dragon-next"><span>Fully trained.</span></div>';
    return `<div class="ca-slots ca-aura-slots">${slotHtml(0)}${slotHtml(1)}</div>${next}`;
  }

  function dragonCard() {
    const lv = Game.dragonLevels[Game.dragonLevel || 0];
    return (
      '<div class="ca-card">' +
      C().cardHead(esc(lv ? lv.name : 'Dragon'), 'dragon', `<div class="ca-card-meta"><span class="ca-pill" data-dragon-level>level ${Game.dragonLevel || 0} / ${D().LAST}</span>${C().button(`${I('open', 12)} Open in game`, 'data-dragon-act="open"', 'ca-btn-small ca-btn-game')}</div>`) +
      `<div data-dragon-live>${dragonHtml()}</div>` +
      '</div>'
    );
  }

  // ---- profiles --------------------------------------------------------------------------------

  function statusPill(p) {
    const s = D().status(p);
    if (!s) return '';
    const later = s.untrained.length ? `${s.untrained.join(' and ')} not trained yet` : '';
    const pill = (text, tip, on) => `<span class="ca-pill${on ? ' on' : ''}"${tip ? ` data-tip="${esc(tip)}"` : ''}>${text}${later ? ' *' : ''}</span>`;
    if (!s.slots) return pill('no slot yet', ['The first aura slot opens at dragon level 5', later].filter(Boolean).join(' · '));
    if (D().isActive(p)) return pill('in use', later, true);
    if (!s.wanted.some((id) => id > 0)) return pill('nothing to put in', later);
    const b = D().switchCost();
    const cost = b ? `Each switch costs 1 ${b.single || b.name}` : 'Switching is free: you own no buildings';
    return pill(`${s.switches} switch${s.switches === 1 ? '' : 'es'}`, [cost, later].filter(Boolean).join(' · '));
  }

  function auraSelect(p, i) {
    const cur = (p.auras || [])[i] || '';
    const opts = ['<option value="">— none —</option>']
      .concat(D().auras().map((a) => `<option value="${esc(a.name)}"${a.name === cur ? ' selected' : ''}>${esc(a.dname)}${a.trained ? '' : ' (not trained)'}</option>`))
      .join('');
    return `<select data-dragon-aura="${esc(p.id)}:${i}" aria-label="Aura ${i + 1}" data-tip="Aura ${i + 1}${i ? ' (slot 2 opens at dragon level 27)' : ''}">${opts}</select>`;
  }

  function profileRow(p) {
    return (
      `<div class="ca-row ca-dprof${D().isActive(p) ? ' on' : ''}" data-dragon-prof="${esc(p.id)}">` +
      `<div class="ca-dprof-name"><input type="text" class="ca-gname" maxlength="40" value="${esc(p.name)}" data-dragon-name="${esc(p.id)}" aria-label="Profile name"><code data-tip="Its id, for macros: dragon.profile(${esc(p.id)})">${esc(p.id)}</code></div>` +
      auraSelect(p, 0) +
      auraSelect(p, 1) +
      `<span data-dragon-status="${esc(p.id)}">${statusPill(p)}</span>` +
      '<span class="ca-dprof-acts">' +
      C().button('Use', `data-dragon-act="use" data-id="${esc(p.id)}"`, 'ca-btn-small ca-btn-run') +
      C().button('Delete', `data-dragon-act="delete" data-id="${esc(p.id)}" data-arm-label="Delete this profile?"`, 'ca-btn-small ca-btn-off') +
      '</span></div>'
    );
  }

  function profilesCard() {
    const list = D().list();
    return (
      '<div class="ca-card ca-gardener">' +
      C().cardHead('Aura profiles', 'save', '<div class="ca-card-meta"><span class="ca-hint">with one slot, a profile puts in its first trained aura · each switch costs one of your highest buildings</span></div>') +
      (list.length ? `<div class="ca-list">${list.map(profileRow).join('')}</div>` : '<div class="ca-card-note">No profiles — make one below.</div>') +
      '<div class="ca-dprof-foot">' +
      C().button(`${I('plus', 12)} New profile`, 'data-dragon-act="new"', 'ca-btn-small') +
      C().button(`${I('save', 12)} From current auras`, 'data-dragon-act="current"', 'ca-btn-small') +
      '</div></div>'
    );
  }

  function html() {
    if (!hasDragon())
      return (
        '<div class="ca-card ca-card-note-only">' +
        C().cardHead('Dragon', 'dragon') +
        '<div class="ca-card-note">The dragon comes with the heavenly upgrade “How to bake your dragon” and the egg it unlocks (A crumbly egg, once you’ve baked a million cookies). The Auto dragon macro buys the egg for you.</div>' +
        '</div>' +
        autoCard() +
        profilesCard()
      );
    return dragonCard() + autoCard() + profilesCard();
  }

  function autoCard() {
    const ms = ['autoDragon', 'petDragon'].map((id) => CA.Macros.get(id)).filter(Boolean);
    return (
      '<div class="ca-card">' +
      C().cardHead('Auto dragon', 'bolt', '<div class="ca-card-meta"><button type="button" class="ca-btn ca-btn-small" data-ca="open-macros">All macros</button></div>') +
      `<div class="ca-list">${ms.map(CA.UI.MacrosPage.row).join('')}</div>` +
      '</div>'
    );
  }

  // ---- live ------------------------------------------------------------------------------------

  function sync() {
    if (!root || !root.isConnected) return;
    const live = root.querySelector('[data-dragon-live]');
    if (live && Game.dragonLevels) CA.UI.Dom.morph(live, dragonHtml());
    const pill = root.querySelector('[data-dragon-level]');
    if (pill) pill.textContent = `level ${Game.dragonLevel || 0} / ${D().LAST}`;
    root.querySelectorAll('[data-dragon-status]').forEach((el) => {
      const p = D().find(el.dataset.dragonStatus);
      if (!p) return;
      CA.UI.Dom.morph(el, statusPill(p));
      el.closest('.ca-dprof').classList.toggle('on', D().isActive(p));
    });
    CA.UI.MacrosPage.sync(root);
  }

  function act(t) {
    const d = t.dataset;
    if (d.dragonAct === 'delete' && !CA.UI.Dom.armed(t)) return;
    switch (d.dragonAct) {
      case 'train':
        if (!D().train('all')) {
          CA.UI.Dom.replay(t, 'ca-shake', 400);
          return;
        }
        CA.Util.sound('snd/shimmerClick.mp3');
        break;
      case 'open':
        if (Game.onMenu && typeof Game.ShowMenu === 'function') Game.ShowMenu(Game.onMenu);
        Game.specialTab = 'dragon';
        if (typeof Game.ToggleSpecialMenu === 'function') Game.ToggleSpecialMenu(1);
        return;
      case 'use': {
        const n = D().apply(d.id);
        if (!n) {
          CA.UI.Dom.replay(t, 'ca-shake', 400);
          return;
        }
        break;
      }
      case 'delete':
        D().remove(d.id);
        break;
      case 'new':
        D().add();
        break;
      case 'current':
        D().add(null, true);
        break;
      default:
        return;
    }
    CA.Util.sound('snd/tick.mp3');
    CA.UI.Menu.render();
  }

  function onClick(e) {
    const t = e.target.closest('[data-dragon-act]');
    if (!t || !root || !root.contains(t)) return;
    e.stopPropagation();
    act(t);
  }

  function onChange(e) {
    const d = e.target.dataset || {};
    if (d.dragonName) D().update(d.dragonName, { name: e.target.value });
    else if (d.dragonAura) {
      const [id, i] = d.dragonAura.split(':');
      const p = D().find(id);
      if (!p) return;
      const auras = [(p.auras || [])[0] || '', (p.auras || [])[1] || ''];
      auras[Number(i)] = e.target.value;
      D().update(id, { auras });
    } else return;
    sync();
  }

  function mount(el) {
    unmount();
    root = el;
    life = CA.UI.Pages.scope(el).on('click', onClick).on('change', onChange);
    sync();
    life.every(SYNC_MS, sync);
  }
  function unmount() {
    if (life) life.close();
    life = null;
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'dragon', label: 'Dragon', icon: 'dragon', order: 65, group: 'minigames', html, mount, unmount, tick: sync });
  }

  return { init, html };
})();
