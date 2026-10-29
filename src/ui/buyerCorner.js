// The **Auto buyer's corner**: on a widget that runs the Auto buyer (features/autoBuyer.js) — the Manager
// widget while its stage has the Auto buyer on — the top-right of its title bar shows what the buyer did
// and will do, live:
//
//   ▫ ▫ ▫ ▣    the last three things it bought (small, oldest left; the newest flashes as it lands), then
//              what it buys next (with a bar under it filling as you save for it)
//
// Hover one for its card: the next purchase's price, payback period, +CpS, when you can afford it and the
// reserve it keeps; a past one's price, payback period, +CpS and how long ago. Click it for the Payback page.
// A widget type opts in with buyer(inst) → true while the Auto buyer is part of it (ui/widgets.js draws it).

CA.UI = CA.UI || {};

CA.UI.BuyerCorner = (() => {
  const I = (n, s) => CA.UI.Icons.html(n, s);
  const esc = (s) => CA.Util.escapeHtml(s);
  const B = () => CA.AutoBuyer;
  const P = () => CA.Payback;
  const F = () => CA.Format;
  const PAST = 3;
  const HOT_MS = 1500;

  const ago = (t) => (Date.now() - t < 2000 ? 'just now' : `${F().span((Date.now() - t) / 1000)} ago`);
  const cell = (pos, sheet) => `<span class="ca-wbuy-spr" style="background-image:url(${sheet || CA.Util.res('img/icons.png')});background-position:${-pos[0] * 48}px ${-pos[1] * 48}px"></span>`;

  /** A thing's picture: a building's icon, an upgrade's, Buy all upgrades' (the Inspired checklist). */
  function picture(x) {
    const up = (n) => (Game.Upgrades && Game.Upgrades[n]) || null;
    if (x.kind === 'building') {
      const b = (Game.Objects || {})[x.name];
      return b ? cell([b.iconColumn || 0, 0]) : I('building', 12);
    }
    const u = up(x.kind === 'allUpgrades' ? 'Inspired checklist' : x.name);
    return u && u.icon ? cell(u.icon, u.icon[2]) : I('upgrade', 12);
  }
  /** Its name as the game writes it (a building's dname, n of them). */
  function nameOf(x) {
    if (x.kind === 'allUpgrades') return `Buy all upgrades (${(x.names || []).length || x.n || 0})`;
    if (x.kind === 'upgrade') return (Game.Upgrades && Game.Upgrades[x.name] && Game.Upgrades[x.name].dname) || x.name;
    return x.label || x.name;
  }
  const count = (x) => (x.kind === 'building' && x.n > 1 ? `<em>${x.n}</em>` : '');
  const row = (k, v) => `<span class="ca-wpop-row"><span class="ca-wpop-name">${k}</span><span class="ca-wpop-val">${v}</span></span>`;
  const head = (x, sub) => `<span class="ca-wpop-head">${picture(x)}<b>${esc(nameOf(x))}</b></span><span class="ca-wpop-sub">${esc(sub)}</span>`;
  const pop = (inner) => `<span class="ca-wpop ca-wt">${inner}<span class="ca-wpop-foot">click to open the Payback page</span></span>`;
  /** The upgrades Buy all upgrades covers, by name. */
  const covers = (x) => (x.kind === 'allUpgrades' && (x.names || []).length ? row('upgrades', esc(x.names.map((n) => (Game.Upgrades && Game.Upgrades[n] && Game.Upgrades[n].dname) || n).join(', '))) : '');

  function nextHtml() {
    const p = B().find();
    const f = B().next();
    if (!f) {
      const why = B().readiness().text;
      return `<span class="ca-wbuy-item ca-wbuy-next none" data-w-open="payback" data-pop aria-label="Auto buyer: nothing to buy">${I('dollar', 11)}${pop(`<span class="ca-wpop-head"><b>Auto buyer: nothing to buy</b></span><span class="ca-wpop-sub">${esc(why)}</span>`)}</span>`;
    }
    const keep = B().keepOf(p.id);
    const top = B().reserveParts(p.id).find((q) => q.wins);
    const need = f.price + keep;
    const bank = Game.cookies || 0;
    const pct = need > 0 ? Math.max(0, Math.min(1, bank / need)) : 1;
    const wait = P().timeTo(need);
    const when = pct >= 1 ? 'now' : Number.isFinite(wait) ? `in ${F().span(wait)}` : 'not at this income';
    const rows =
      row('price', F().beautify(f.price)) +
      row('payback period', esc(F().payback(f.pp))) +
      (Number.isFinite(f.gain) ? row('CpS', `+${F().short(f.gain)}/s`) : '') +
      row('affordable', when) +
      (keep > 0 ? row('keeps in the bank', `${F().short(keep)}${top ? ` <i>(${esc(top.label)})</i>` : ''}`) : '') +
      (f.rules && f.rules.length ? row('rules', esc(f.rules.join(', '))) : '') +
      covers(f);
    return (
      `<span class="ca-wbuy-item ca-wbuy-next${pct >= 1 ? ' can' : ''}" data-w-open="payback" data-pop aria-label="${esc(`Auto buyer next: ${nameOf(f)}`)}">` +
      `${picture(f)}${count(f)}<span class="ca-wbuy-bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span>` +
      pop(head(f, `Next for the Auto buyer · ${p.name} profile`) + rows) +
      '</span>'
    );
  }

  function pastHtml() {
    return B()
      .recentBought()
      .slice(0, PAST)
      .reverse()
      .map((x) => {
        const rows = row('paid', F().beautify(x.price)) + row('payback period', esc(F().payback(x.pp))) + (Number.isFinite(x.gain) ? row('CpS', `+${F().short(x.gain)}/s`) : '') + covers(x);
        return (
          `<span class="ca-wbuy-item ca-wbuy-past${Date.now() - x.t < HOT_MS ? ' hot' : ''}" data-w-open="payback" data-pop aria-label="${esc(`Auto buyer bought ${nameOf(x)}`)}">` +
          `${picture(x)}${count(x)}` +
          pop(head(x, `Bought ${ago(x.t)}${x.profile ? ` · ${x.profile} profile` : ''}`) + rows) +
          '</span>'
        );
      })
      .join('');
  }

  /** The corner's HTML (the inside of the title bar's [data-w-buyer]). */
  function html() {
    try {
      return pastHtml() + nextHtml();
    } catch (e) {
      return ''; // the game isn't ready yet: drawn on the next refresh
    }
  }

  return { html, PAST };
})();
