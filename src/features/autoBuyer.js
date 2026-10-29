// The **Auto buyer**: one buyer for buildings and upgrades (and, later, other things you buy), driven
// by profiles. It supersedes the Best building and Best upgrade macros (v3.44).
//
// A profile ranks everything it may buy into one **queue**, and the buyer buys the front:
//
//   rank by     a payback mode's payback period ("": the mode in use — features/payback.js)
//   buys        buildings and/or upgrades, and "Buy all upgrades" as one thing (the game's button:
//               every store upgrade the budget affords, cheapest first, measured as one purchase —
//               features/payback.js allUpgrades); buildings in a bulk (auto: the store's minimum bulk,
//               rounded up with Round to multiples — what the old buyers bought) or ×1 / ×10 / ×100
//   cheap ×100  seconds of unbuffed CpS (0: off; default 1): a building whose next 100 cost less than
//               that, and that the budget affords, is bought 100 at a time ahead of the queue — no
//               ranking by payback period for what costs next to nothing
//   skip        only what it can afford now (else it saves up for the front)
//   reserve     minutes of unbuffed CpS it never spends
//   banks       more banks it keeps, each picked on or off: lucky, conjure, luckyFrenzy (what a
//               golden cookie or the spell needs to pay its most) and garden (replanting the whole
//               layout). The highest of these and the minutes is what it keeps (buyer.reserve).
//   rules       top to bottom, each { what it applies to, what it does, when (code, optional) }:
//                 first   jumps the queue (the ones that do are ordered by payback period)
//                 weight  multiplies its payback period by k (below 1: preferred; above: put off)
//                 cap     a building: no more than n owned (a bulk that would pass it buys up to it)
//                 never   held back
//               "when" is a condition in the macro language (features/script.js), with `thing`
//               standing for what's ranked — so any statistic can switch a rule on.
// A thing's **score** is its payback period after the weights; the queue is sorted by it. What
// never pays back is held back, unless a "first" rule takes it.
//
// Profiles are saved in the settings section 'buyer' ({ profiles, active }), seeded with stable ids:
// payback (both kinds — the old two buyers together), buildings, upgrades.
//
// Script (the macro language):
//   buyer.queue(profile)          a list: the queue's things, front first (profile: id or name; none: the active one)
//   buyer.next(profile)           the front ("": nothing)
//   buyer.rank(thing, profile)    its place: 1 the front, 0 not in the queue (held back, or not there)
//   buyer.score(thing, profile)   its score: payback period after the rules (seconds; NaN: not ranked)
//   buyer.budget(profile)         what the buyer may spend: the bank less the profile's reserve
//   buyer.reserve(profile)        the profile's reserve: the highest of its thresholds (cookies)
//   buyer.activeProfile()  buyer.profiles()  buyer.profileActive(profile)
//   buyer.buyNext(profile)        (action) buys the front when the budget covers it
//   buyer.profile(profile)        (action) makes a profile the active one
//   buy.allUpgrades()             (action) the game's "Buy all upgrades" (Inspired checklist), without needing it
// What it bought last (buyer.buyNext, or pp.buy of what buyer.next named) is kept: recentBought(), newest first —
// the widgets' Auto buyer corner (ui/buyerCorner.js).
// A thing is "building:Cursor", "upgrade:Kitten helpers" or "allUpgrades" — what pp.best returns; pp.kind, pp.price,
// pp.of and pp.buy take it (features/autoBuy.js).

CA.AutoBuyer = (() => {
  const P = () => CA.Payback;
  const BULKS = ['auto', 1, 10, 100];
  const WHATS = ['any', 'building', 'upgrade', 'allUpgrades', 'cheap', 'achievement', 'cookie', 'kitten', 'synergy', 'clicking'];
  const EFFECTS = ['first', 'weight', 'cap', 'never'];
  const GM = () => CA.GoldenMath;
  /** The banks a profile may keep on top of its minutes of CpS (the bank warnings' own banks, and the garden's). */
  const BANKS = [
    { id: 'lucky', label: 'Lucky!', tip: 'what a Lucky! needs to pay its most (bank.lucky)', get: () => GM().lucky().bank },
    { id: 'conjure', label: 'Conjure', tip: 'what Conjure Baked Goods needs to pay its most (bank.conjure)', get: () => GM().conjure().bank },
    { id: 'luckyFrenzy', label: 'Frenzy Lucky!', tip: 'what a Lucky! in a Frenzy needs to pay its most (bank.luckyFrenzy)', get: () => GM().lucky(true).bank },
    { id: 'garden', label: 'Garden replant', tip: 'what replanting the whole garden layout costs (garden.layoutCost)', get: () => (CA.Garden.minigame() ? CA.Garden.layoutCost() : 0) },
  ];

  /** The rule profiles that buy upgrades come with (v3.50): lots of upgrades affordable → buy them all at once. */
  const BULK_RULE = { what: 'allUpgrades', effect: 'first', when: 'payback.allUpgradesCount(buyer.budget()) >= 20' };
  const SEEDS = [
    { id: 'payback', name: 'Payback', kinds: { building: true, upgrade: true, allUpgrades: true }, bulk: 'auto', cheapBulk: 1, skip: false, reserve: 0, banks: [], mode: '', rules: [cleanRule(BULK_RULE)] },
    { id: 'buildings', name: 'Buildings only', kinds: { building: true, upgrade: false, allUpgrades: false }, bulk: 'auto', cheapBulk: 1, skip: false, reserve: 0, banks: [], mode: '', rules: [] },
    { id: 'upgrades', name: 'Upgrades only', kinds: { building: false, upgrade: true, allUpgrades: true }, bulk: 'auto', cheapBulk: 1, skip: false, reserve: 0, banks: [], mode: '', rules: [cleanRule(BULK_RULE)] },
    // v4.0: what Nunix late game buys with once it plays for golden cookie combos — ranked by actual
    // income, never below what a Lucky! and a garden replant need
    { id: 'combos', name: 'Golden cookie combos', kinds: { building: true, upgrade: true, allUpgrades: true }, bulk: 'auto', cheapBulk: 1, skip: false, reserve: 0, banks: ['lucky', 'garden'], mode: 'actualIncome', rules: [cleanRule(BULK_RULE)] },
  ];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  let profiles = copy(SEEDS);
  let active = 'payback';
  let rev = 0; // bumped on every change: the queue's memo key

  // ---- profiles ------------------------------------------------------------------------------

  function cleanRule(r) {
    const x = r && typeof r === 'object' ? r : {};
    const what = typeof x.what === 'string' && (WHATS.includes(x.what) || /^(b|u):.+/.test(x.what)) ? x.what : 'any';
    return {
      on: x.on !== false,
      what,
      secs: Math.max(0, Number(x.secs) || 60),
      effect: EFFECTS.includes(x.effect) ? x.effect : 'first',
      k: Number(x.k) > 0 ? Number(x.k) : 1,
      n: Math.max(0, Math.floor(Number(x.n) || 0)),
      when: typeof x.when === 'string' ? x.when.slice(0, 500) : '',
    };
  }
  function cleanProfile(p, i) {
    const x = p && typeof p === 'object' ? p : {};
    const kinds = x.kinds && typeof x.kinds === 'object' ? x.kinds : {};
    return {
      id: String(x.id || `p${i + 1}`).slice(0, 40),
      name: String(x.name || `Profile ${i + 1}`).slice(0, 40),
      // Buy all upgrades (v3.50): a profile saved before it buys it when it buys upgrades
      kinds: { building: kinds.building !== false, upgrade: kinds.upgrade !== false, allUpgrades: kinds.allUpgrades === undefined ? kinds.upgrade !== false : !!kinds.allUpgrades },
      bulk: BULKS.includes(x.bulk) ? x.bulk : BULKS.includes(Number(x.bulk)) ? Number(x.bulk) : 'auto',
      // cheap ×100: a profile saved before it gets the default (1 s)
      cheapBulk: x.cheapBulk === undefined ? 1 : Math.max(0, Number(x.cheapBulk) || 0),
      skip: !!x.skip,
      reserve: Math.max(0, Number(x.reserve) || 0),
      banks: BANKS.map((b) => b.id).filter((id) => Array.isArray(x.banks) && x.banks.includes(id)),
      // the Actual 15 min / 1 h / 3 h modes are one Actual income now (its window: core/settings.js)
      mode: typeof x.mode !== 'string' ? '' : /^actualIncome(15m|1h|3h)$/.test(x.mode) ? 'actualIncome' : x.mode,
      rules: (Array.isArray(x.rules) ? x.rules : []).slice(0, 50).map(cleanRule),
    };
  }

  const list = () => profiles.slice();
  /** A profile by id or name (any case); none / "": the active one. */
  function find(x) {
    if (x === undefined || x === null || x === '') return profiles.find((p) => p.id === active) || profiles[0] || null;
    const k = String(x).toLowerCase();
    return profiles.find((p) => p.id === String(x)) || profiles.find((p) => p.name.toLowerCase() === k) || null;
  }
  const activeProfile = () => (find() || { id: '' }).id;
  function changed() {
    rev++;
    memo = null;
    CA.Events.emit('buyer', null);
  }
  /** Makes a profile the active one: 1 when it changed, 0 when it already was (or there's no such profile). */
  function use(x) {
    const p = find(x);
    if (!p || p.id === active) return 0;
    active = p.id;
    changed();
    return 1;
  }
  function newId() {
    let i = profiles.length + 1;
    while (profiles.some((p) => p.id === `p${i}`)) i++;
    return `p${i}`;
  }
  /** A new profile, a copy of `from` (none: the active one); returns it. */
  function create(name, from) {
    const base = find(from) || SEEDS[0];
    const p = cleanProfile({ ...copy(base), id: newId(), name: name || `${base.name} (copy)` }, profiles.length);
    profiles.push(p);
    changed();
    return p;
  }
  /** Changes a profile's fields (name, kinds, bulk, cheapBulk, skip, reserve, banks, mode, rules); returns it. */
  function update(id, fields) {
    const i = profiles.findIndex((p) => p.id === id);
    if (i < 0) return null;
    profiles[i] = cleanProfile({ ...profiles[i], ...fields, id }, i);
    changed();
    return profiles[i];
  }
  function remove(id) {
    if (profiles.length <= 1) return false;
    const i = profiles.findIndex((p) => p.id === id);
    if (i < 0) return false;
    profiles.splice(i, 1);
    if (active === id) active = profiles[0].id;
    changed();
    return true;
  }
  const addRule = (id, rule) => {
    const p = find(id);
    return p ? update(p.id, { rules: p.rules.concat([cleanRule(rule)]) }) : null;
  };
  function setRule(id, i, fields) {
    const p = find(id);
    if (!p || !p.rules[i]) return null;
    const rules = p.rules.slice();
    rules[i] = cleanRule({ ...rules[i], ...fields });
    return update(p.id, { rules });
  }
  function removeRule(id, i) {
    const p = find(id);
    if (!p || !p.rules[i]) return null;
    return update(p.id, { rules: p.rules.filter((_, j) => j !== i) });
  }
  function moveRule(id, from, to) {
    const p = find(id);
    if (!p || !p.rules[from] || to < 0 || to >= p.rules.length) return null;
    const rules = p.rules.slice();
    rules.splice(to, 0, rules.splice(from, 1)[0]);
    return update(p.id, { rules });
  }

  // ---- rules ------------------------------------------------------------------------------

  const upgradeNamed = (n) => (Game.Upgrades && Game.Upgrades[n]) || (Game.UpgradesInStore || []).find((u) => u && u.name === n) || null;
  const buildingNamed = (n) => (Game.Objects || {})[n] || null;
  const rawCps = () => Game.cookiesPsRaw || Game.unbuffedCps || Game.cookiesPs || 0;

  /** What a rule applies to, in words. */
  function whatText(r) {
    if (r.what.startsWith('b:')) return (buildingNamed(r.what.slice(2)) || { dname: r.what.slice(2) }).dname || r.what.slice(2);
    if (r.what.startsWith('u:')) return (upgradeNamed(r.what.slice(2)) || { dname: r.what.slice(2) }).dname || r.what.slice(2);
    return {
      any: 'Anything',
      building: 'Buildings',
      upgrade: 'Upgrades',
      allUpgrades: 'Buy all upgrades',
      cheap: `Anything costing under ${r.secs} s of CpS`,
      achievement: 'Anything that wins an achievement',
      cookie: 'Cookie upgrades',
      kitten: 'Kittens',
      synergy: 'Synergy upgrades',
      clicking: 'Clicking upgrades',
    }[r.what];
  }
  /** What a rule does, in words. */
  function effectText(r) {
    if (r.effect === 'first') return 'buy first';
    if (r.effect === 'never') return 'never';
    if (r.effect === 'cap') return `up to ${r.n} owned`;
    return `weight ×${r.k}`;
  }
  /** The cheap ×100 badge a building it takes gets. */
  const cheapBulkText = (p) => `cheap: ×100 under ${p.cheapBulk} s`;
  const ruleText = (r) => `${whatText(r)} → ${effectText(r)}${r.when ? ` when ${r.when}` : ''}`;

  function matches(r, x) {
    const w = r.what;
    if (w === 'any') return true;
    if (w === 'building' || w === 'upgrade' || w === 'allUpgrades') return x.kind === w;
    if (w.startsWith('b:')) return x.kind === 'building' && x.name === w.slice(2);
    if (w.startsWith('u:')) return x.kind === 'upgrade' && x.name === w.slice(2);
    if (w === 'cheap') return x.price <= rawCps() * r.secs;
    if (w === 'achievement') return x.kind === 'building' ? P().nextAchievement(x.name).n <= x.n : !!(x.won && x.won.length);
    if (x.kind !== 'upgrade') return false;
    const u = upgradeNamed(x.name);
    if (!u) return false;
    if (w === 'cookie') return u.pool === 'cookie';
    if (w === 'kitten') return !!u.kitten;
    if (w === 'synergy') return !!(u.buildingTie1 && u.buildingTie2);
    if (w === 'clicking') return !!x.estimated;
    return false;
  }

  // a rule's "when": compiled once per text (a statistic's language: `return <condition>`)
  const compiled = new Map();
  /** A "when" condition's problem ("": none). */
  function whenProblem(code) {
    if (!code) return '';
    const c = compileWhen(code);
    return c.errors.length ? c.errors[0].message : '';
  }
  function compileWhen(code) {
    if (!compiled.has(code)) {
      if (compiled.size > 200) compiled.clear();
      compiled.set(code, CA.Script.compile(`return ${code}`, { mode: 'stat', vars: ['thing'] }));
    }
    return compiled.get(code);
  }
  /** Whether a rule's "when" holds for a thing (no "when": always; one with a problem: never). */
  function when(r, key) {
    if (!r.when) return true;
    const c = compileWhen(r.when);
    if (c.errors.length) return false;
    const out = CA.Script.runStat(c.flow, { thing: key });
    return !out.error && !!out.value && !(typeof out.value === 'number' && !Number.isFinite(out.value));
  }

  // ---- the queue -------------------------------------------------------------------------------

  const thingKey = (x) => (x.kind === 'allUpgrades' ? 'allUpgrades' : `${x.kind}:${x.name}`);
  const kindsOf = (p) => ['building', 'upgrade'].filter((k) => p.kinds[k]);
  /** The cookies a reserve of `minutes` of unbuffed CpS keeps in the bank. */
  const reserveOf = (minutes) => Math.max(0, Number(minutes) || 0) * 60 * rawCps();
  /**
   * A profile's thresholds, each { id, label, amount } (cookies): its minutes of CpS (id 'cps', when
   * above 0) and the banks it picked. `wins` marks the highest — the one its reserve is.
   */
  function reserveParts(x) {
    const p = find(x);
    if (!p) return [];
    const parts = [];
    if (p.reserve > 0) parts.push({ id: 'cps', label: `${p.reserve} min of CpS`, amount: reserveOf(p.reserve) });
    BANKS.filter((b) => p.banks.includes(b.id)).forEach((b) => {
      const v = Number(b.get());
      parts.push({ id: b.id, label: b.label, amount: Number.isFinite(v) ? Math.max(0, v) : 0 });
    });
    const top = parts.reduce((m, q) => (!m || q.amount > m.amount ? q : m), null);
    if (top) top.wins = true;
    return parts;
  }
  /** What a profile never spends: the highest of its thresholds — so the bank stays above every one. */
  const keepOf = (x) => reserveParts(x).reduce((m, q) => Math.max(m, q.amount), 0);
  /** What a profile's buyer may spend: the bank less its reserve. */
  const budget = (x) => (Game.cookies || 0) - keepOf(x);

  /** n of a building, re-priced and re-measured (a cap that cuts a bulk short). */
  function resized(x, n, p) {
    const b = buildingNamed(x.name);
    const price = P().sumPrice(b, n);
    const worth = P().buildingWorth(x.name, n);
    const parts = P().parts(price, worth, p.mode);
    return { ...x, n, label: n > 1 ? `${n} × ${b.dname || x.name}` : b.dname || x.name, price, bonus: worth.bonus, gain: parts.gain, pp: parts.pp, colour: null };
  }

  /**
   * A profile's queue: { profile, items: [{ key, kind, name, n, label, price, pp, score, first, rules: [text], … }]
   * front first, held: [{ …, why }] } — memoized for a moment (same bank, same profiles, same macro pass).
   */
  let memo = null; // { k, t, q }
  function queue(x) {
    const p = find(x);
    if (!p) return { profile: null, items: [], held: [] };
    const pass = CA.Macros && CA.Macros.passKey ? CA.Macros.passKey() : null;
    const k = `${p.id}|${rev}|${Game.cookies}|${Game.cookiesPs}|${P().mode().id}|${pass}|${(Game.UpgradesInStore || []).length}`;
    const now = Date.now();
    if (memo && memo.k === k && now - memo.t < 1000) return memo.q;
    const q = build(p);
    memo = { k, t: now, q };
    last = q;
    return q;
  }
  let last = null; // the latest queue worked out (pp.price / pp.buy find its things)

  function build(p) {
    const kinds = kindsOf(p);
    const kind = kinds.length === 2 ? 'all' : kinds[0];
    if (!kind && !p.kinds.allUpgrades) return { profile: p, items: [], held: [] };
    // a mode that isn't there (deleted) or not ready yet (actual income, under a minute recorded): the one in use
    const mode = p.mode && P().modeOf(p.mode) && Number.isFinite(P().income(p.mode)) ? p.mode : undefined;
    const b = budget(p.id);
    const ranked = kind ? P().ranking(kind, { bulk: p.bulk, mode, all: true, skip: p.skip, budget: b }) : [];
    const items = [];
    const held = [];
    // Buy all upgrades: what the budget affords now, as one thing — fewer than two is just buying that one
    if (p.kinds.allUpgrades) {
      const all = P().allUpgrades({ budget: b, mode });
      if (all.n >= 2) ranked.push(all);
      else held.push({ ...all, key: thingKey(all), score: NaN, first: false, rules: [], why: all.n ? 'affords only one upgrade: the same as buying it' : 'affords no upgrades', colour: 'gray' });
    }
    const rules = p.rules.filter((r) => r.on);
    // cheap ×100: what the next 100 of a building may cost at most (0: off)
    const cheap = p.cheapBulk > 0 ? rawCps() * p.cheapBulk : 0;
    ranked.forEach((r0) => {
      let r = { ...r0, key: thingKey(r0), score: r0.pp, first: false, rules: [] };
      if (cheap > 0 && r.kind === 'building') {
        const price = P().sumPrice(buildingNamed(r.name), 100);
        if (price <= cheap && price <= b) r = { ...(r.n === 100 ? r : resized(r, 100, p)), key: r.key, first: true, rules: [cheapBulkText(p)] };
      }
      let why = Number.isFinite(r.pp) ? '' : 'never pays back';
      for (const rule of rules) {
        if (!matches(rule, r) || !when(rule, r.key)) continue;
        if (rule.effect === 'never') {
          why = ruleText(rule);
          r.rules.push(effectText(rule));
          break;
        }
        if (rule.effect === 'cap') {
          if (r.kind !== 'building') continue;
          const room = rule.n - (buildingNamed(r.name) || { amount: 0 }).amount;
          if (room <= 0) {
            why = `${effectText(rule)} (${whatText(rule)})`;
            r.rules.push(effectText(rule));
            break;
          }
          if (room < r.n) r = { ...resized(r, room, p), key: r.key, score: NaN, first: r.first, rules: r.rules };
          r.rules.push(effectText(rule));
        } else if (rule.effect === 'first') {
          r.first = true;
          r.rules.push(rule.what === 'cheap' ? `cheap: under ${rule.secs} s` : effectText(rule));
        } else if (rule.effect === 'weight') {
          r.weight = (r.weight || 1) * rule.k;
          r.rules.push(effectText(rule));
        }
      }
      r.score = r.pp * (r.weight || 1);
      if (why && !(r.first && why === 'never pays back')) held.push({ ...r, why });
      else items.push(r);
    });
    const order = (a, b2) => (a.score === b2.score ? a.pp - b2.pp || 0 : a.score - b2.score);
    items.sort((a, b2) => (a.first !== b2.first ? (a.first ? -1 : 1) : a.first ? (a.pp === b2.pp ? 0 : a.pp - b2.pp) : order(a, b2)));
    if (p.skip) {
      // a capped bulk may have grown dearer than the budget; skip still means "only what it can afford"
      for (let i = items.length - 1; i >= 0; i--) if (items[i].price > b) held.push({ ...items.splice(i, 1)[0], why: 'can’t afford it yet' });
    }
    return { profile: p, items, held };
  }

  const next = (x) => queue(x).items[0] || null;
  /** A thing of the latest queue worked out (any profile), by key. */
  const thingOf = (k) => (last ? last.items.concat(last.held).find((x) => x.key === String(k)) || null : null);
  /** Buys the front of a profile's queue when the budget covers it: how many things it bought. */
  function buyNext(x) {
    const p = find(x);
    const f = next(x);
    if (!p || !f || f.price > budget(p.id) || f.price > (Game.cookies || 0)) return 0;
    const got = P().buy(f);
    memo = null;
    if (got > 0) noteBought(f, p);
    return got > 0 ? 1 : 0;
  }

  // what it bought last (the widgets' corner): [{ t, key, kind, name, n, label, names, price, pp, gain, profile }], newest first
  const BOUGHT_MAX = 8;
  let bought = [];
  /** Keeps a thing of its queue as just bought (buyer.buyNext, or pp.buy of what buyer.next named). */
  function noteBought(f, p0) {
    const p = p0 || find();
    const { key, kind, name, n, label, names, price, pp, gain } = f;
    bought = [{ t: Date.now(), key, kind, name, n, label, names, price, pp, gain, profile: p ? p.name : '' }].concat(bought).slice(0, BOUGHT_MAX);
  }
  /** What the Auto buyer bought last, newest first. */
  const recentBought = () => bought.slice();
  /** For buttons: what the buyer buys next, and whether it can now (`upgrade`: the upgrade it names, to show with its icon). */
  function readiness(x) {
    const p = find(x);
    if (!p) return { ok: false, text: 'no such profile' };
    const f = next(p.id);
    const keep = keepOf(p.id);
    if (!f) return { ok: false, text: p.skip ? (keep > 0 ? 'nothing affordable above the reserve' : 'nothing affordable') : 'nothing to buy' };
    const ok = f.price + keep <= (Game.cookies || 0);
    const wait = P().timeTo(f.price + keep);
    return {
      ok,
      text: `next: ${f.label}${f.estimated ? ' (PP from your clicking)' : ''}${!ok && Number.isFinite(wait) ? ` — in ${CA.Format.span(wait)}${keep > 0 ? ' (keeping the reserve)' : ''}` : ''}`,
      upgrade: f.kind === 'upgrade' ? f.name : '',
    };
  }

  // ---- buy all upgrades ------------------------------------------------------------------------

  /**
   * What "Buy all upgrades" buys — the game's own button (Inspired checklist, main.js storeBuyAll):
   * every upgrade in the store but switches, research and what you've vaulted, cheapest first.
   * Lump-priced ones are left too. Returns [{ u, price }].
   */
  function allUpgrades() {
    const priceOf = (u) => (typeof u.getPrice === 'function' ? u.getPrice() : u.basePrice || u.price || 0);
    return (Game.UpgradesInStore || [])
      .filter((u) => u && !u.bought && u.pool !== 'toggle' && u.pool !== 'tech' && !(u.priceLumps > 0) && !(typeof u.isVaulted === 'function' && u.isVaulted()))
      .map((u) => ({ u, price: priceOf(u) }))
      .sort((a, b) => a.price - b.price);
  }
  /** Buys every upgrade "Buy all upgrades" covers that the bank affords, cheapest first: how many it bought. */
  function buyAllUpgrades() {
    let n = 0;
    allUpgrades().forEach(({ u, price }) => {
      if (u.bought || price > (Game.cookies || 0)) return;
      u.buy(1);
      if (u.bought) n++;
    });
    if (n) memo = null;
    return n;
  }

  // ---- save, and moving over from Best building / Best upgrade ----------------------------------------

  function load(data, whole) {
    if (data && Array.isArray(data.profiles) && data.profiles.length) {
      profiles = data.profiles.map((raw, i) => {
        const p = cleanProfile(raw, i);
        // saved before Buy all upgrades (v3.50): one that buys upgrades gets its rule
        const old = !(raw && raw.kinds && typeof raw.kinds === 'object' && 'allUpgrades' in raw.kinds);
        if (old && p.kinds.upgrade && p.rules.length < 50) p.rules.push(cleanRule(BULK_RULE));
        return p;
      });
      active = profiles.some((p) => p.id === data.active) ? data.active : profiles[0].id;
      // seeds added since the save was made (one you deleted stays deleted: the save lists what it was given)
      const given = Array.isArray(data.seeded) ? data.seeded : ['payback', 'buildings', 'upgrades'];
      SEEDS.forEach((s) => !given.includes(s.id) && !profiles.some((p) => p.id === s.id) && profiles.push(copy(s)));
    } else {
      profiles = copy(SEEDS);
      active = 'payback';
      migrate(whole || {});
    }
    changed();
  }
  /**
   * A save from before v3.44: Best building (cmBuildings) and Best upgrade (cmUpgrades). Which
   * were on picks the profile (both or neither: payback; one: buildings / upgrades only), their
   * skip and reserve become its; their hotkeys the Auto buyer's. Whether it runs: the running
   * list (CA.Macros.rename maps the old ids).
   */
  function migrate(whole) {
    const prefs = (whole.macros && whole.macros.prefs) || {};
    const running = Array.isArray(whole.running) ? whole.running : [];
    const bOn = running.includes('cmBuildings');
    const uOn = running.includes('cmUpgrades');
    const pick = bOn && !uOn ? 'buildings' : uOn && !bOn ? 'upgrades' : 'payback';
    const ins = (id) => (prefs[id] && prefs[id].inputs) || {};
    const from = pick === 'upgrades' ? ins('cmUpgrades') : { ...ins('cmUpgrades'), ...ins('cmBuildings') };
    const p = profiles.find((x) => x.id === pick);
    if (from.skip !== undefined) p.skip = !!from.skip && from.skip !== 'false';
    if (Number(from.reserve) > 0) p.reserve = Number(from.reserve);
    active = pick;
    // a ★ on either: the Auto buyer's (its left-panel button) — the macros' section loads before this one
    if ((prefs.cmBuildings && prefs.cmBuildings.fav) || (prefs.cmUpgrades && prefs.cmUpgrades.fav)) CA.Macros.setFav('autoBuyer', true);
    const keys = (whole.hotkeys && typeof whole.hotkeys === 'object' && whole.hotkeys) || {};
    const old = keys['macro.cmBuildings'] || keys['macro.cmUpgrades'];
    if (old && !keys['macro.autoBuyer'] && CA.Settings.setHotkey) CA.Settings.setHotkey('macro.autoBuyer', old);
  }

  // ---- building blocks -----------------------------------------------------------------------

  const profileOptions = () => [{ v: '', label: 'the active profile' }].concat(profiles.map((p) => ({ v: p.id, label: p.name })));

  function init() {
    CA.Settings.registerSection('buyer', { serialize: () => ({ profiles, active, seeded: SEEDS.map((s) => s.id) }), load, event: 'buyer' });
    const V = (id, desc, params, get, more) => CA.Script.defineValue({ id, desc, params, get, group: 'Auto buyer', ...(more || {}) });
    V('buyer.queue', 'a list: the Auto buyer’s queue, front first — what a profile (id or name; none: the active one) would buy, in order', ['profile'], (x) => queue(x).items.map((i) => i.key), { list: true });
    V('buyer.next', 'the front of a profile’s queue (none: the active one): what the Auto buyer buys next ("": nothing)', ['profile'], (x) => (next(x) || { key: '' }).key);
    V('buyer.rank', 'a thing’s place in a profile’s queue: 1 the front, 0 not in it (held back by a rule, or not for sale)', ['thing', 'profile'], (t, x) => queue(x).items.findIndex((i) => i.key === String(t)) + 1);
    V('buyer.score', 'a thing’s score in a profile’s queue: its payback period after the rules’ weights (seconds; NaN: not ranked)', ['thing', 'profile'], (t, x) => {
      const q = queue(x);
      const i = q.items.concat(q.held).find((y) => y.key === String(t));
      return i ? i.score : NaN;
    });
    V('buyer.budget', 'what the Auto buyer may spend with a profile: the bank less its reserve', ['profile'], (x) => budget(x));
    V('buyer.reserve', 'what the Auto buyer keeps in the bank with a profile: the highest of its thresholds (minutes of CpS, Lucky!, Conjure, Frenzy Lucky!, garden replant)', ['profile'], (x) => keepOf(x));
    V('buyer.activeProfile', 'the id of the Auto buyer’s active profile', [], () => activeProfile());
    V('buyer.profiles', 'a list: the Auto buyer’s profiles’ ids', [], () => profiles.map((p) => p.id), { list: true });
    V('buyer.profileActive', 'whether a profile (its id or name) is the Auto buyer’s active one', ['profile'], (x) => !!find(x) && find(x).id === active, { bool: true });

    const A = CA.Actions.register;
    A({
      id: 'buyer.buyNext',
      name: 'Buy the front of the Auto buyer’s queue',
      icon: 'dollar',
      group: 'Buying',
      unit: 'bought',
      params: [{ key: 'profile', label: 'Profile', type: 'select', default: '', options: profileOptions }],
      ready: (p) => readiness(p.profile),
      run: (p) => buyNext(p.profile),
    });
    A({
      id: 'buyer.profile',
      name: 'Use an Auto buyer profile',
      icon: 'dollar',
      group: 'Buying',
      unit: 'switched',
      params: [{ key: 'profile', label: 'Profile', type: 'select', default: 'payback', options: () => profiles.map((p) => ({ v: p.id, label: p.name })) }],
      describe: (p) => `Use the Auto buyer profile ${(find(p.profile) || { name: p.profile }).name}`,
      run: (p) => use(p.profile),
    });

    A({
      id: 'buy.allUpgrades',
      name: 'Buy all upgrades',
      icon: 'upgrade',
      group: 'Buying',
      unit: 'bought',
      ready: () => {
        const all = allUpgrades();
        const can = all.filter((x) => x.price <= (Game.cookies || 0)).length;
        return all.length ? { ok: can > 0, text: `${can} of ${all.length} affordable` } : { ok: false, text: 'no upgrades in the store' };
      },
      run: () => buyAllUpgrades(),
    });
    CA.Macros.addBuiltin({
      id: 'autoBuyer',
      name: 'Auto buyer',
      desc: 'Buys the front of the queue on the Payback page: its active profile ranks every building and upgrade by payback period, then its rules (buy first, weights, caps, never). Replaces Best building and Best upgrade.',
      icon: { ico: 'dollar' },
      mode: 'flow',
      every: 50,
      defaultSource: '# Buy the front of the Auto buyer’s queue (the Payback page): the active profile ranks every\n# building and upgrade by payback period, then by its rules. buyer.budget(): the bank less\n# the profile’s reserve.\nforever:\n  pick = buyer.next()\n  if pick != "" and pp.price(pick) <= buyer.budget():\n    pp.buy(pick)\n',
      readiness: () => readiness(),
      holdRepeat: true,
      section: 'buying',
    });
    // the two it replaces: their ids (left-panel buttons, groups, code, the running list) now mean it
    CA.Macros.rename('cmBuildings', 'autoBuyer');
    CA.Macros.rename('cmUpgrades', 'autoBuyer');
  }

  // a profile's id in code (buyer.profile(payback), buyer.queue(buildings)…): the code editors' hover cards
  CA.Words.defineKind('profile.buyer', {
    name: 'Auto buyer profile',
    info: (id) => {
      const p = find(id);
      if (!p) return null;
      const mode = p.mode ? (P().modes().find((m) => m.id === p.mode || m.key === p.mode) || { label: p.mode }).label : 'the payback mode in use';
      const kinds = Object.keys(p.kinds).filter((k) => p.kinds[k]);
      const front = next(p.id);
      return {
        title: p.name,
        sig: p.id,
        desc: `Ranks ${kinds.length ? kinds.map((k) => ({ building: 'buildings', upgrade: 'upgrades', allUpgrades: 'Buy all upgrades' })[k] || k).join(', ') : 'nothing'} by payback period (${mode}) into one queue, and the Auto buyer buys the front.`,
        rows: [
          ['bulk', p.bulk === 'auto' ? 'auto' : `×${p.bulk}`],
          ['cheap ×100', p.cheapBulk > 0 ? `next 100 under ${p.cheapBulk} s of CpS` : 'off'],
          ['reserve', reserveParts(p.id).length ? reserveParts(p.id).map((x) => x.label).join(', ') : 'none'],
          ['rules', String(p.rules.length)],
          ['front now', front ? front.name : '—'],
          ['in use', p.id === active ? 'yes' : 'no'],
        ],
        note: 'Payback page, Auto buyer.',
      };
    },
  });

  return { init, allUpgrades, buyAllUpgrades, list, find, use, create, update, remove, addRule, setRule, removeRule, moveRule, activeProfile, queue, next, buyNext, noteBought, recentBought, readiness, budget, keepOf, reserveParts, thingOf, ruleText, whatText, effectText, whenProblem, reserveOf, WHATS, EFFECTS, BULKS, BANKS, SEEDS, BULK_RULE };
})();
