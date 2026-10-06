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

  /** A macro's `when` is either one condition { cond, params, not } or { all: [those…] } —
   *  every one of which must hold. */
  const parts = (when) => (!when ? [] : Array.isArray(when.all) ? when.all : [when]);

  function testOne(one) {
    const c = one && byId[one.cond];
    if (!c) return false;
    let r = false;
    try {
      r = !!c.test(paramsFor(one.cond, one.params));
    } catch (e) {
      r = false;
    }
    return one.not ? !r : r;
  }

  /** Whether `when` holds right now; unknown conditions never do, nor does an empty list. */
  function test(when) {
    const list = parts(when);
    return list.length > 0 && list.every(testOne);
  }

  function describeOne(one) {
    const c = one && byId[one.cond];
    if (!c) return 'unknown condition';
    let text = c.name;
    try {
      if (c.describe) text = c.describe(paramsFor(one.cond, one.params));
    } catch (e) {
      /* its name, then */
    }
    return one.not ? `not ${text}` : text;
  }

  const describe = (when) => parts(when).map(describeOne).join(' and ') || 'never';

  return { register, get, all, paramsFor, test, describe, parts };
})();
