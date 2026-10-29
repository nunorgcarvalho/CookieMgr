// The **Auto buyer row**: the Manager widget's "Auto buyer" part (ui/managerWidget.js), shown while the stage has
// the Auto buyer (features/autoBuyer.js) on — even with the Manager macro off, as what it would buy. Live:
//
//   AUTO BUYER                                   Payback profile
//   ▫ ▫ ▫ ›  ▣  10 × Farm
//              2.4 M · PP 8.5 min
//              ▬▬▬▬▬▬▬▭▭▭ in 7s  (the bank's way to it, green once affordable)
//
// The last three things it bought (oldest left; the newest flashes as it lands), then what it buys next,
// big, with its price, payback period, when you can afford it and a bar. Hover a picture for its card (price,
// payback period, +CpS, when / how long ago, the reserve, the rules); click anything for the Payback page.

CA.UI = CA.UI || {};

CA.UI.BuyerRow = (() => {
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

  function nextHtml(p) {
    const f = B().next();
    if (!f) return `<span class="ca-wbuy-item ca-wbuy-next none">${I('dollar', 14)}</span><span class="ca-wbuy-text"><b>Nothing to buy</b><span>${esc(B().readiness().text)}</span></span>`;
    const keep = B().keepOf(p.id);
    const top = B().reserveParts(p.id).find((q) => q.wins);
    const need = f.price + keep;
    const pct = need > 0 ? Math.max(0, Math.min(1, (Game.cookies || 0) / need)) : 1;
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
      `<span class="ca-wbuy-item ca-wbuy-next${pct >= 1 ? ' can' : ''}" data-pop aria-label="${esc(`Next: ${nameOf(f)}`)}">${picture(f)}${count(f)}` +
      pop(head(f, `Next for the Auto buyer · ${p.name} profile`) + rows) +
      '</span>' +
      `<span class="ca-wbuy-text"><b>${esc(nameOf(f))}</b>` +
      `<span>${F().short(f.price)} · PP ${esc(F().payback(f.pp))}</span>` +
      `<span class="ca-wbuy-when"><span class="ca-wbuy-bar${pct >= 1 ? ' can' : ''}"><i style="width:${(pct * 100).toFixed(1)}%"></i></span>` +
      `${pct >= 1 ? '<i class="ok">affordable now</i>' : `<i>${esc(when)}</i>`}</span></span>`
    );
  }

  function pastHtml() {
    const done = B().recentBought().slice(0, PAST).reverse();
    if (!done.length) return '<span class="ca-wbuy-none">nothing bought yet</span>';
    return done
      .map((x) => {
        const rows = row('paid', F().beautify(x.price)) + row('payback period', esc(F().payback(x.pp))) + (Number.isFinite(x.gain) ? row('CpS', `+${F().short(x.gain)}/s`) : '') + covers(x);
        return (
          `<span class="ca-wbuy-item ca-wbuy-past${Date.now() - x.t < HOT_MS ? ' hot' : ''}" data-pop aria-label="${esc(`Bought ${nameOf(x)}`)}">` +
          `${picture(x)}${count(x)}` +
          pop(head(x, `Bought ${ago(x.t)}${x.profile ? ` · ${x.profile} profile` : ''}`) + rows) +
          '</span>'
        );
      })
      .join('');
  }

  /** The row's HTML. */
  function html() {
    try {
      const p = B().find();
      return (
        `<div class="ca-wbuy" data-w-open="payback">` +
        `<div class="ca-mw-head"><span>Auto buyer</span><em>${esc(p ? `${p.name} profile` : '')}</em></div>` +
        `<div class="ca-wbuy-line"><span class="ca-wbuy-past-list" data-tip="What it bought last (newest on the right)">${pastHtml()}</span><span class="ca-wbuy-arrow">›</span>${p ? nextHtml(p) : ''}</div>` +
        '</div>'
      );
    } catch (e) {
      return ''; // the game isn't ready yet: drawn on the next refresh
    }
  }

  return { html, PAST };
})();
