// Registry of **conditions** a "when" macro can wait for: a buff being active, a golden cookie on
// screen, any recorded state (core/states.js) crossing a value, a spell being affordable…
//
//   CA.Conditions.register({
//     id: 'buff', name: 'Effect is active', icon: 'sparkle',
//     params: [{ key: 'name', label: 'Effect', type: 'select', options: () => [...], default: 'Frenzy' }],
//     test(params) { return !!Game.hasBuff(params.name); },
//     describe(params) { return `${params.name} is active`; },
//   });

CA.Conditions = (() => {
  const list = [];
  const byId = {};

  function register(cond) {
    if (byId[cond.id]) throw new Error(`Condition "${cond.id}" already registered`);
    const c = { icon: 'filter', params: [], ...cond };
    list.push(c);
    byId[c.id] = c;
    return c;
  }

  const get = (id) => byId[id];
  const all = () => list.slice();

  function paramsFor(id, params) {
    const c = byId[id];
    const out = {};
    if (c) c.params.forEach((p) => (out[p.key] = p.default));
    return { ...out, ...(params || {}) };
  }

  /** Whether condition `when` ({ cond, params, not }) holds right now; unknown ones never do. */
  function test(when) {
    const c = when && byId[when.cond];
    if (!c) return false;
    let r = false;
    try {
      r = !!c.test(paramsFor(when.cond, when.params));
    } catch (e) {
      r = false;
    }
    return when.not ? !r : r;
  }

  function describe(when) {
    const c = when && byId[when.cond];
    if (!c) return 'Unknown condition';
    const text = c.describe ? c.describe(paramsFor(when.cond, when.params)) : c.name;
    return when.not ? `not: ${text}` : text;
  }

  return { register, get, all, paramsFor, test, describe };
})();
