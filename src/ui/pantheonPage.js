// The Pantheon page (Temple minigame):
//
//   Spirits      the three slots — Diamond, Ruby, Jade — with the spirit in each and what it does in
//                that slot
//   Worship      swaps left, when the next one comes back, how long a swap takes to refill
//   All spirits  every spirit, the slot it's in (if any), and on hover what it does in each slot
//
// The effect texts are the game's own (M.gods[…].desc1–3, descBefore/After); their green/red
// highlights are restyled for the panel.

CA.UI = CA.UI || {};

CA.UI.PantheonPage = (() => {
  const C = () => CA.UI.C;
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const SLOTS = ['Diamond', 'Ruby', 'Jade'];
  const SYNC_MS = 1000;
  let root = null;
  let timer = null;

  function minigame() {
    const t = Game.Objects && Game.Objects.Temple;
    const M = t && t.minigame;
    return M && Array.isArray(M.slot) && M.godsById ? M : null;
  }

  const sprite = (g, cls = '') =>
    `<span class="ca-god-ico ${cls}" style="background-image:url(${CA.Util.res('img/icons.png')});background-position:${-g.icon[0] * 48}px ${-g.icon[1] * 48}px"></span>`;

  /** "Holobore, Spirit of Asceticism" → ["Holobore", "Spirit of Asceticism"] */
  const nameParts = (g) => {
    const i = String(g.name).indexOf(',');
    return i < 0 ? [g.name, ''] : [g.name.slice(0, i), g.name.slice(i + 1).trim()];
  };

  /** What a spirit does in slot `i` (0–2): the game's own text. */
  const effect = (g, i) => [g.descBefore, g[`desc${i + 1}`], g.descAfter].filter(Boolean).join('<br>');

  function slotsCard(M) {
    let h = '<div class="ca-card">' + C().cardHead('Spirits', 'pantheon', `<div class="ca-card-meta">${C().button(`${I('widget', 12)} Widget`, 'data-ca="widget-add" data-type="pantheon"', 'ca-btn-small')}${C().gameLink('Temple')}</div>`) + '<div class="ca-slots">';
    M.slot.forEach((id, i) => {
      const g = id >= 0 ? M.godsById[id] : null;
      const [name, title] = g ? nameParts(g) : ['', ''];
      h +=
        `<div class="ca-slot ca-slot-${i}">` +
        `<div class="ca-slot-gem">${SLOTS[i]}</div>` +
        (g
          ? `${sprite(g, 'big')}<div class="ca-slot-name">${esc(name)}</div><div class="ca-slot-title">${esc(title)}</div><div class="ca-god-desc">${effect(g, i)}</div>`
          : '<span class="ca-god-ico big empty"></span><div class="ca-slot-name">Empty</div><div class="ca-slot-title">drag a spirit here in the Temple</div>') +
        '</div>';
    });
    return h + '</div></div>';
  }

  function swapInfo(M) {
    const wait = M.swaps === 0 ? 16 * 3600 : M.swaps === 1 ? 4 * 3600 : 3600;
    const next = M.swaps < 3 ? Math.max(0, (M.swapT + wait * 1000 - Date.now()) / 1000) : null;
    return { wait, next };
  }

  function worshipHtml(M) {
    const { span, tile } = CA.UI.Plot.fmt;
    const { wait, next } = swapInfo(M);
    const pips = [0, 1, 2].map((i) => `<i class="${i < M.swaps ? 'on' : ''}"></i>`).join('');
    return (
      tile('Worship swaps', `<span class="ca-pips">${pips}</span> ${M.swaps} / 3`) +
      tile('Next swap in', next == null ? 'all ready' : span(next), next == null ? '' : `refills ${span(wait)} after a swap with ${M.swaps} left`) +
      tile('Refill times', '1h · 4h · 16h', 'with 2 · 1 · 0 swaps left')
    );
  }

  function worshipCard(M) {
    return '<div class="ca-card">' + C().cardHead('Worship', 'clock') + `<div class="ca-stats" data-pan-worship>${worshipHtml(M)}</div></div>`;
  }

  function godsCard(M) {
    let h = '<div class="ca-card">' + C().cardHead('All spirits', 'sparkle', '<div class="ca-card-meta"><span class="ca-hint">hover a spirit for what it does in each slot</span></div>') + '<div class="ca-gods">';
    M.godsById.forEach((g, id) => {
      const at = M.slot.indexOf(id);
      const [name] = nameParts(g);
      h +=
        `<div class="ca-god${at >= 0 ? ` in slot-${at}` : ''}" data-pop>${sprite(g)}<span class="ca-god-name">${esc(name)}</span>` +
        (at >= 0 ? `<span class="ca-god-slot">${SLOTS[at]}</span>` : '') +
        `<span class="ca-gpop"><span class="ca-wpop-head"><b>${esc(g.name)}</b></span>` +
        SLOTS.map((s, i) => `<span class="ca-god-row"><em>${s}</em><span class="ca-god-desc">${effect(g, i)}</span></span>`).join('') +
        (g.quote ? `<span class="ca-god-quote">${esc(g.quote)}</span>` : '') +
        '</span></div>';
    });
    return h + '</div></div>';
  }

  function html() {
    const M = minigame();
    if (!M)
      return (
        '<div class="ca-card ca-card-note-only">' +
        C().cardHead('Pantheon', 'pantheon') +
        '<div class="ca-card-note">The Pantheon opens once you have a level-1 Temple (spend a sugar lump on it).</div>' +
        '</div>'
      );
    return slotsCard(M) + worshipCard(M) + godsCard(M);
  }

  function sync() {
    if (!root || !root.isConnected) return;
    const M = minigame();
    const el = M && root.querySelector('[data-pan-worship]');
    if (el) CA.UI.Widgets.morph(el, worshipHtml(M));
  }

  function mount(el) {
    unmount();
    root = el;
    sync();
    timer = setInterval(sync, SYNC_MS);
  }
  function unmount() {
    clearInterval(timer);
    timer = null;
    root = null;
  }

  function init() {
    CA.UI.Pages.register({ id: 'pantheon', label: 'Pantheon', icon: 'pantheon', order: 50, group: 'minigames', html, mount, unmount, tick: sync });
  }

  return { init };
})();
