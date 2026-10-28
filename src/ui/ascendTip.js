// The Legacy button's tooltip (the game's: how long this run has been, what ascending now would give,
// cookies to the next level), with cookieMgr's additions under it (features/prestige.js): how long the
// next level takes at the rate you're baking, levels an hour, the CpS the new levels would add, your
// heavenly chips after ascending, and how far the Lucky heavenly upgrades' levels are.
//
// The game rewrites that tooltip twice a second (main.js: l('ascendTooltip').innerHTML = …), so the
// block is put back right after each rewrite (a MutationObserver: before the next paint, no flicker),
// and only worked out while the tooltip shows. Option (Settings → Store, with the other tooltips): ascendTips.

CA.UI = CA.UI || {};

CA.UI.AscendTip = (() => {
  const F = () => CA.Format;
  const P = () => CA.Prestige;
  const ID = 'CookieMgrAscendTip';
  const when = (s) => (!Number.isFinite(s) ? 'not at this rate' : s <= 0 ? 'now' : F().span(s));
  let observer = null;
  let busy = false;

  function html() {
    const p = P();
    const gain = p.gain();
    const rows = [
      ['Next level in', when(p.secondsTo(p.total() + 1))],
      ['Levels an hour', F().beautify(p.perSecond() * 3600)],
    ];
    if (gain > 0) {
      const cps = p.cpsGain();
      // nothing until a heavenly upgrade (Heavenly chip secret…) makes levels count — whatever the game's +N% says
      rows.push(['They’d add', cps > 0 ? `+${F().beautify(cps)}/s${Game.cookiesPs > 0 ? ` (+${((cps / Game.cookiesPs) * 100).toFixed(1)}%)` : ''}` : 'no CpS yet <small>(Heavenly chip secret first)</small>']);
      rows.push(['Heavenly chips after', F().beautify((Game.heavenlyChips || 0) + gain)]);
    }
    p.lucky()
      .filter((l) => !l.owned)
      .forEach((l) => rows.push([l.name, l.toGo <= 0 ? 'reached' : `${F().beautify(l.toGo)} to go <small>(${F().beautify(l.level)})</small>`, l.toGo <= 0 ? 'ca-mg-ok' : '']));
    return (
      '<div class="line"></div><div class="ca-tt ca-tt-ascend">' +
      '<div class="ca-tt-head">cookieMgr</div>' +
      rows.map(([k, v, cls]) => `<div class="ca-tt-row"><span>${k}</span><b${cls ? ` class="${cls}"` : ''}>${v}</b></div>`).join('') +
      '</div>'
    );
  }

  const showing = (tip) => !!(tip && (tip.offsetWidth || tip.offsetHeight || tip.getClientRects().length));
  function attach() {
    const tip = document.getElementById('ascendTooltip');
    if (!tip || busy) return;
    const old = document.getElementById(ID);
    if (!CA.Settings.get('ascendTips') || !showing(tip)) {
      if (old) old.remove();
      return;
    }
    busy = true;
    try {
      const el = old || document.createElement('div');
      el.id = ID;
      el.innerHTML = html();
      if (el.parentNode !== tip) tip.appendChild(el);
    } catch (e) {
      /* a number not there yet: next time */
    }
    busy = false;
  }

  function hook() {
    const tip = document.getElementById('ascendTooltip');
    if (!tip || observer || typeof MutationObserver !== 'function') return;
    observer = new MutationObserver(() => attach());
    observer.observe(tip, { childList: true });
    const button = document.getElementById('legacyButton');
    if (button) button.addEventListener('mouseenter', () => setTimeout(attach, 0));
  }

  function init() {
    CA.Settings.defineOption({
      key: 'ascendTips',
      group: 'store',
      icon: 'sparkle',
      name: 'Legacy tooltip',
      desc: 'Under the Legacy button’s tooltip: how long the next prestige level takes, levels an hour, the CpS ascending now would add, your heavenly chips after, and how far the Lucky upgrades’ levels are.',
      default: true,
    });
    setInterval(() => {
      hook();
      attach();
    }, 1000);
  }

  return { init, html, attach };
})();
