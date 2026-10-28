// The game's own garden, with what can grow where (features/mutations.js):
//
//   tile tooltips  under an empty tile's tooltip, what it can grow at the next tick and how likely —
//                  a seed you haven't unlocked yet starred — and when the next tick is
//   seed tooltips  under a seed's tooltip, the chance it grows somewhere at the next tick, on how many
//                  tiles, and how long that takes on average at today's odds
//   odds on tiles  a small chip on each empty tile that can grow something: the chance it does at the
//                  next tick — gold when a seed you haven't unlocked is among it
//
// Options (Settings → Garden, the Garden page): gardenOddsTips, gardenOddsTiles.

CA.UI = CA.UI || {};

CA.UI.GardenInsight = (() => {
  const esc = (s) => CA.Util.escapeHtml(s);
  const F = () => CA.Format;
  const S = (k) => CA.Settings.get(k);
  const garden = () => CA.Util.minigame('Farm');
  const pc = (p) => (p >= 0.9995 ? '100%' : p > 0 && p < 0.0001 ? '<0.01%' : `${(p * 100).toFixed(p < 0.01 ? 2 : p < 0.1 ? 1 : 0)}%`);
  const when = (s) => (!Number.isFinite(s) ? 'never at these odds' : s <= 0 ? 'now' : F().span(s));
  const SHOW = 8; // plants listed in a tile's tooltip

  function block(rows, note) {
    return (
      '<div class="ca-tt ca-tt-garden">' +
      '<div class="ca-tt-head">cookieMgr · next tick</div>' +
      rows.map(([k, v, cls]) => `<div class="ca-tt-row"><span>${k}</span><b${cls ? ` class="${cls}"` : ''}>${v}</b></div>`).join('') +
      (note ? `<div class="ca-tt-note">${note}</div>` : '') +
      '</div>'
    );
  }
  const isNew = (M, key) => !!(M.plants[key] && !M.plants[key].unlocked);

  /** The block under an empty tile's tooltip. */
  function tileBlock(x, y) {
    if (!S('gardenOddsTips')) return '';
    const M = garden();
    const t = CA.Mutations.tile(x, y);
    if (!M || !t) return '';
    const a = CA.Mutations.all();
    const nextIn = `next tick in ${when(a ? a.nextTickIn : NaN)}`;
    if (!t.plants.length) return block([['Grows here', 'nothing can']], `${nextIn} · plant something next to it`);
    const rows = t.plants.slice(0, SHOW).map((p) => [`${esc(p.name)}${isNew(M, p.key) ? ' <span class="ca-gi-new">★ new</span>' : ''}`, pc(p.chance)]);
    if (t.plants.length > SHOW) rows.push([`${t.plants.length - SHOW} more`, pc(t.plants.slice(SHOW).reduce((s, p) => s + p.chance, 0))]);
    rows.push(['Something grows', pc(t.any), 'ca-gi-any']);
    return block(rows, nextIn);
  }
  /** The block under a seed's tooltip. */
  function seedBlock(id) {
    if (!S('gardenOddsTips')) return '';
    const M = garden();
    const me = M && M.plantsById[id];
    const a = me && CA.Mutations.all();
    if (!a) return '';
    const p = a.plants.find((x) => x.key === me.key);
    if (!p) return block([['Grows next tick', 'nowhere']], 'nothing on the plot can grow it now');
    return block(
      [
        ['Grows next tick', `${pc(p.chance)} <small>(on ${p.tiles} tile${p.tiles === 1 ? '' : 's'})</small>`],
        ['On average in', when(CA.Mutations.growIn(me.key))],
      ],
      `next tick in ${when(a.nextTickIn)}`
    );
  }

  // ---- the game's tooltips --------------------------------------------------------------------

  function wrap() {
    const M = garden();
    if (!M || typeof M.tileTooltip !== 'function' || M.tileTooltip.__ca) return;
    const tileT = M.tileTooltip;
    M.tileTooltip = function (x, y) {
      const fn = tileT.apply(this, arguments);
      return function () {
        const html = fn.apply(this, arguments);
        try {
          return html && M.plot[y][x][0] === 0 ? html + tileBlock(x, y) : html;
        } catch (e) {
          return html;
        }
      };
    };
    M.tileTooltip.__ca = true;
    if (typeof M.seedTooltip === 'function') {
      const seedT = M.seedTooltip;
      M.seedTooltip = function (id) {
        const fn = seedT.apply(this, arguments);
        return function () {
          const html = fn.apply(this, arguments);
          try {
            return html ? html + seedBlock(id) : html;
          } catch (e) {
            return html;
          }
        };
      };
    }
  }

  // ---- the odds on the tiles ------------------------------------------------------------------

  function paint() {
    const M = garden();
    const on = S('gardenOddsTiles');
    const a = on && M ? CA.Mutations.all() : null;
    const by = {};
    if (a) a.tiles.forEach((t) => (by[`${t.x}-${t.y}`] = t));
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 6; x++) {
        const el = document.getElementById(`gardenTile-${x}-${y}`);
        if (!el) continue;
        let chip = el.querySelector('.ca-gi-chip');
        const t = by[`${x}-${y}`];
        if (!t || !(t.any >= 0.00005)) {
          if (chip) chip.remove();
          continue;
        }
        if (!chip) {
          chip = document.createElement('div');
          el.appendChild(chip);
        }
        const fresh = t.plants.some((p) => isNew(M, p.key));
        chip.className = `ca-gi-chip${fresh ? ' new' : ''}`;
        const text = pc(t.any);
        if (chip.textContent !== text) chip.textContent = text;
      }
  }

  function init() {
    const D = (key, icon, name, desc) => CA.Settings.defineOption({ key, group: 'garden', icon, name, desc, default: true });
    D('gardenOddsTips', 'search', 'Mutation odds in tooltips', 'Under the garden’s tooltips: what an empty tile can grow at the next tick and how likely; under a seed’s, the chance it grows somewhere and how long that takes on average.');
    D('gardenOddsTiles', 'leaf', 'Mutation odds on tiles', 'A small chip on each empty garden tile that can grow something: the chance it does at the next tick (gold when a seed you haven’t unlocked could).');
    setInterval(() => {
      try {
        wrap();
        paint();
      } catch (e) {
        /* the garden mid-rebuild: next time */
      }
    }, 1000);
    CA.Events.on('settings', (k) => {
      if (k !== 'gardenOddsTiles' && k !== null) return;
      try {
        paint();
      } catch (e) {
        /* no garden to paint */
      }
    });
  }

  return { init, tileBlock, seedBlock, paint };
})();
