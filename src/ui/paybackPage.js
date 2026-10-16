// The Payback page: what every purchase is worth (features/payback.js) — Cookie Monster's numbers,
// laid out to compare at a glance.
//
//   Best buy      the lowest payback period of all (building or upgrade), what it adds, when you can
//                 afford it — and the best building and the best upgrade
//   Buildings     every building: owned, then ×1 / ×10 / ×100, each a cell coloured by its payback
//                 colour with its payback period, the CpS it adds and its price (click one to buy that
//                 many); and how many more win the next achievement
//   Upgrades      the store's upgrades as tiles, ringed in their colour, best first; click to buy —
//                 switches (no payback period) only when the filter chip shows them, greyed
//   Options       the wrinkler bank, "best = what you can afford", the cheap-enough floor
//
// Colours (Cookie Monster's): blue better than the best building · green the best building ·
// yellow / orange / red within the 10 / 20 / 30 best · purple worse · gray never pays back.

CA.UI = CA.UI || {};

CA.UI.PaybackPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const P = () => CA.Payback;
  const F = () => CA.Format;
  const SYNC_MS = 1000;
  let root = null;
  let life = null;

  const COLOUR_NAMES = {
    blue: 'better than the best building',
    green: 'the best building',
    yellow: 'within the 10 best',
    orange: 'within the 20 best',
    red: 'within the 30 best',
    purple: 'further down',
    gray: 'never pays back',
  };
  /** A payback period, short: seconds as a number (Cookie Monster's way), ∞ when it never pays back. */
  const ppText = (v) => (Number.isFinite(v) ? F().short(v) : '∞');
  const sprite = (pos, cls = '') => `<span class="ca-pp-ico ${cls}" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-pos[0] * 48}px ${-pos[1] * 48}px"></span>`;
  const buildingIcon = (b) => sprite([b.iconColumn || 0, 0]);

  function bestCard(t) {
    return (
      '<div class="ca-card">' +
      C().cardHead('Best buy', 'dollar', '<div class="ca-card-meta"><span class="ca-hint">lowest payback period (PP) = time to afford + price ÷ the CpS it adds</span></div>') +
      `<div class="ca-stats" data-pp-best>${bestTiles(t)}</div></div>`
    );
  }
  function bestTiles(t) {
    // in the minimum bulk: what the buyers would buy
    const all = P().ranking('all', { bulk: 'auto' });
    const top = all[0];
    const bb = P().ranking('building', { bulk: 'auto' })[0];
    const bu = P().ranking('upgrade')[0];
    const { tile } = CA.UI.Plot.fmt;
    const wait = (x) => {
      const s = P().timeTo(x.price);
      return s > 0 ? (Number.isFinite(s) ? `in ${F().span(s)}` : 'not at this CpS') : 'affordable now';
    };
    const who = (x) => (x ? esc(x.label) : '—');
    return (
      tile('Best of all', `<span class="ca-pp-dot ${top ? top.colour : 'gray'}"></span>${who(top)}`, top ? `PP ${ppText(top.pp)} · +${F().short(top.bonus)}/s · ${wait(top)}` : 'nothing pays back') +
      tile('Best building', who(bb), bb ? `PP ${ppText(bb.pp)} · ${F().beautify(bb.price)} · ${wait(bb)}` : '') +
      tile('Best upgrade', who(bu), bu ? `PP ${ppText(bu.pp)} · ${F().beautify(bu.price)}${bu.estimated ? ' · by your clicking' : ''}` : 'none in the store') +
      tile('Best bulk', `×${t.minBulk}`, 'the best building’s amount')
    );
  }

  function cell(b, n, row) {
    if (!row) return '<td></td>';
    const can = row.price <= Game.cookies;
    return (
      `<td class="ca-pp-cell ${row.colour}${can ? ' can' : ''}" data-pp-buy="${esc(b.name)}" data-n="${n}" data-tip="${esc(
        `${n} × ${b.dname || b.name}: PP ${ppText(row.pp)} (${COLOUR_NAMES[row.colour]}) · adds ${F().beautify(row.bonus)}/s for ${F().beautify(row.price)}${row.won.length ? ` · wins ${row.won.join(', ')}` : ''}${can ? ' — click to buy' : ` — affordable ${Number.isFinite(P().timeTo(row.price)) ? `in ${F().span(P().timeTo(row.price))}` : 'not at this CpS'}`}`
      )}">` +
      `<b>${ppText(row.pp)}</b><span>+${F().short(row.bonus)}/s</span><em>${F().short(row.price)}</em>` +
      '</td>'
    );
  }

  function buildingsHtml(t) {
    const rows = Object.values(Game.Objects || {})
      .sort((a, b) => a.id - b.id)
      .filter((b) => !b.locked || b.amount > 0)
      .map((b) => {
        const next = P().nextAchievement(b.name);
        return (
          '<tr>' +
          `<th>${buildingIcon(b)}<span class="ca-pp-name">${esc(b.dname || b.name)}</span><span class="ca-pp-owned">${b.amount}</span></th>` +
          cell(b, 1, t.buildings[1][b.name]) +
          cell(b, 10, t.buildings[10][b.name]) +
          cell(b, 100, t.buildings[100][b.name]) +
          `<td class="ca-pp-next" data-tip="${esc(next.n <= 100 ? `${next.n} more win an achievement, for ${F().beautify(next.price)}` : 'no achievement within the next 100')}">${next.n <= 100 ? `+${next.n}<em>${F().short(next.price)}</em>` : '—'}</td>` +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="ca-pp-table"><thead><tr><th>Building <em>owned</em></th><th>×1</th><th>×10</th><th>×100</th><th>Next achievement</th></tr></thead>' +
      `<tbody>${rows}</tbody></table>`
    );
  }

  function upgradesHtml(t) {
    const list = Object.values(t.upgrades).sort((a, b) => a.pp - b.pp);
    // switches (Elder Pledge, the Golden switch, season biscuits…) have no payback period: shown only when asked, greyed, last
    const sw = CA.Settings.get('ppShowSwitches') ? t.switches : [];
    if (!list.length && !sw.length) return '<div class="ca-card-note">No upgrades in the store.</div>';
    return (
      '<div class="ca-pp-upgrades">' +
      list
        .map((r) => {
          const u = (Game.Upgrades && Game.Upgrades[r.name]) || (Game.UpgradesInStore || []).find((x) => x.name === r.name) || {};
          const can = r.price <= Game.cookies;
          const what = r.bonus > 0 ? `adds ${F().beautify(r.bonus)}/s` : r.mouse > 0 ? `adds ${F().beautify(r.mouse)} a click (≈ ${F().beautify(r.gain)}/s at your clicking)` : 'adds no CpS';
          return (
            `<button type="button" class="ca-pp-up ${r.colour}${can ? ' can' : ''}" data-pp-up="${esc(r.name)}" data-tip="${esc(`${u.dname || r.name}: PP ${ppText(r.pp)} (${COLOUR_NAMES[r.colour]}) · ${what} · ${F().beautify(r.price)}${can ? ' — click to buy' : ''}`)}">` +
            (u.icon ? sprite(u.icon) : '') +
            `<span>${ppText(r.pp)}</span></button>`
          );
        })
        .join('') +
      sw
        .map((n) => {
          const u = (Game.Upgrades && Game.Upgrades[n]) || (Game.UpgradesInStore || []).find((x) => x.name === n) || {};
          return `<span class="ca-pp-up ca-pp-switch" data-tip="${esc(`${u.dname || n}: a switch — no payback period (switches are left out of payback)`)}">${u.icon ? sprite(u.icon) : ''}<span>—</span></span>`;
        })
        .join('') +
      '</div>'
    );
  }
  /** The upgrades card's switch filter: a chip, on when switches are shown. */
  function switchChip(t) {
    const on = !!CA.Settings.get('ppShowSwitches');
    return `<button type="button" class="ca-chip${on ? ' on' : ''}" data-pp-opt="ppShowSwitches" data-tip="${esc(`${on ? 'Hide' : 'Show'} the switches in the store (${t.switches.length}: Elder Pledge, the Golden switch, season biscuits…) — they have no payback period, so they’re left out of it`)}">${I('filter', 11)} switches ${t.switches.length}</button>`;
  }

  function legendHtml() {
    return `<div class="ca-pp-legend">${CA.Payback.COLOURS.map((c) => `<span><i class="ca-pp-dot ${c}"></i>${COLOUR_NAMES[c]}</span>`).join('')}</div>`;
  }

  function optionsCard() {
    const S = CA.Settings;
    const wr = S.get('ppWrinklers');
    const choice = (v, label) => `<button type="button" class="ca-chip${wr === v ? ' on' : ''}" data-pp-wrink="${v}">${label}</button>`;
    const mb = Number(S.get('minBulk')) || 0;
    const bulkChip = (v) => `<button type="button" class="ca-chip${mb === v ? ' on' : ''}" data-pp-bulk="${v}">${v ? `×${v}` : 'auto'}</button>`;
    return (
      '<div class="ca-card">' +
      C().cardHead('Options', 'settings') +
      '<div class="ca-list">' +
      `<div class="ca-row ca-row-option"><span class="ca-row-ico">${I('wrinkler', 16)}</span><div class="ca-row-text"><div class="ca-row-name">Count wrinklers in the bank</div><div class="ca-row-desc">What popping them would give counts towards affording things.</div></div><span class="ca-pp-chips">${choice('none', 'No')}${choice('all', 'All')}${choice('fattest', 'The fattest')}</span></div>` +
      `<div class="ca-row ca-row-option"><span class="ca-row-ico">${I('building', 16)}</span><div class="ca-row-text"><div class="ca-row-name">Minimum bulk</div><div class="ca-row-desc">What the buyers (Best building, buy.best, Best of all above) buy a building in — with Round to multiples on, up to the next multiple of it. Auto: ×10 with Round to multiples, else ×1. Now: ×${CA.Shop.minBulk()}${CA.Shop.roundUp() ? ', rounded up' : ''}.</div></div><span class="ca-pp-chips">${CA.Shop.MIN_BULKS.map(bulkChip).join('')}</span></div>` +
      `<div class="ca-row ca-row-option"><span class="ca-row-ico">${I('dollar', 16)}</span><div class="ca-row-text"><div class="ca-row-name">Best = what you can afford</div><div class="ca-row-desc">The green building is the best you can buy now; what you can’t afford yet shows red.</div></div>${C().toggle(!!S.get('ppOnlyBuyable'), 'data-pp-opt="ppOnlyBuyable"', 'Best = what you can afford')}</div>` +
      `<div class="ca-row ca-row-option"><span class="ca-row-ico">${I('clock', 16)}</span><div class="ca-row-text"><div class="ca-row-name">Cheap enough to just buy</div><div class="ca-row-desc">Anything costing less than this many seconds of CpS shows blue (0: off).</div></div><input type="number" min="0" step="1" class="ca-pp-num" data-pp-num="ppSecondsLowerLimit" value="${Number(S.get('ppSecondsLowerLimit')) || 0}"></div>` +
      '</div>' +
      `<div class="ca-card-note">The store’s ${C().link('Best buy', 'settings')} sort and the ${C().link('Best building / Best upgrade', 'clickers')} macros use these numbers too.</div>` +
      '</div>'
    );
  }

  function html() {
    const t = P().table();
    return (
      bestCard(t) +
      '<div class="ca-card">' +
      C().cardHead('Buildings', 'building', '<div class="ca-card-meta"><span class="ca-hint">payback period, CpS added, price — click a cell to buy</span></div>') +
      `<div data-pp-buildings>${buildingsHtml(t)}</div>${legendHtml()}</div>` +
      '<div class="ca-card">' +
      C().cardHead('Upgrades', 'upgrade', `<div class="ca-card-meta"><span class="ca-hint">best first — click to buy</span><span data-pp-swchip>${switchChip(t)}</span></div>`) +
      `<div data-pp-upgrades>${upgradesHtml(t)}</div></div>` +
      optionsCard()
    );
  }

  function sync() {
    if (!root || !root.isConnected) return;
    const t = P().table();
    const parts = [
      ['[data-pp-buildings]', () => buildingsHtml(t)],
      ['[data-pp-upgrades]', () => upgradesHtml(t)],
      ['[data-pp-best]', () => bestTiles(t)],
      ['[data-pp-swchip]', () => switchChip(t)],
    ];
    parts.forEach(([sel, fn]) => {
      const el = root.querySelector(sel);
      if (el) CA.UI.Dom.morph(el, fn());
    });
  }

  function onClick(e) {
    const b = e.target.closest('[data-pp-buy],[data-pp-up],[data-pp-wrink],[data-pp-opt],[data-pp-bulk]');
    if (!b) return;
    e.stopPropagation();
    const d = b.dataset;
    if (d.ppBuy) {
      const n = Number(d.n) || 1;
      const got = P().buyBuilding(d.ppBuy, n);
      CA.Util.sound(got ? 'snd/buy1.mp3' : 'snd/tick.mp3');
    } else if (d.ppUp) {
      const got = P().buyUpgrade(d.ppUp);
      CA.Util.sound(got ? 'snd/buy1.mp3' : 'snd/tick.mp3');
    } else if (d.ppBulk !== undefined) {
      CA.Util.sound('snd/tick.mp3');
      CA.Shop.setMinBulk(Number(d.ppBulk));
      CA.UI.Menu.render();
      return;
    } else if (d.ppWrink) {
      CA.Settings.set('ppWrinklers', d.ppWrink);
      CA.UI.Menu.render();
      return;
    } else if (d.ppOpt) {
      CA.Settings.set(d.ppOpt, !CA.Settings.get(d.ppOpt));
      CA.UI.Menu.render();
      return;
    }
    sync();
  }
  function onChange(e) {
    const el = e.target;
    if (el.dataset && el.dataset.ppNum) {
      const v = Math.max(0, Number(el.value) || 0);
      CA.Settings.set(el.dataset.ppNum, v);
      sync();
    }
  }

  function mount(el) {
    unmount();
    root = el;
    life = CA.UI.Pages.scope(el).on('click', onClick).on('change', onChange).every(SYNC_MS, sync);
  }
  function unmount() {
    if (life) life.close();
    life = null;
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'payback', label: 'Payback', icon: 'dollar', order: 24, group: 'data', html, mount, unmount, tick: sync });
  }

  return { init, sync };
})();
