// What every word of the macro language is — one registry behind the hover cards in every code editor
// (macros, statistics, the garden's rules): actions, conditions, values, keywords, macro ids, profile
// ids, spells, seasons, buildings… Each module that owns a kind of word says what one is, here.
//
//   CA.Words.defineKind(kind, { name, info(id, ctx) → info | null })
//                                       a whole kind ('macro', 'profile.buyer', 'spell'…): name is what
//                                       one is called ("Macro"); info() describes one of them
//   CA.Words.define(kind, id, info)     one word, on top of its kind (info: an object, or fn(ctx) → one)
//   CA.Words.lookup(kind, id, ctx)      { kind, id, tag, title, sig, desc, rows, note, card }, or null
//   CA.Words.kinds()                    the kinds there are
//
// An info: { title, tag (what it is: "Action · Shimmers"), sig (how it's written), desc, rows:
// [[label, value]], note (a line in italics), card: { pop, data } (a popup another part draws: the
// upgrade info card is { pop: 'upgrade', data: { upgrade } }) } — all optional but the title.
// ctx: where the word was written ({ call, param, args, line, source }, features/script.js wordAt).
//
// Profiles are kinds named 'profile.<family>' (buyer, dragon, pantheon, grimoire): a code line names
// a family's profile as profile.<family> + its id or name.
//
// Plain data and lookups: no game access of its own, so core, features and UI can all use it.

CA.Words = (() => {
  const kinds = {};
  const words = {};

  function defineKind(kind, def) {
    kinds[kind] = { name: def.name || kind, info: def.info || (() => null) };
    return kinds[kind];
  }
  function define(kind, id, info) {
    (words[kind] = words[kind] || {})[id] = info;
  }

  function lookup(kind, id, ctx = {}) {
    const k = kinds[kind];
    const own = words[kind] && words[kind][id];
    let info = null;
    try {
      const base = k ? k.info(id, ctx) : null;
      const extra = typeof own === 'function' ? own(ctx) : own;
      if (base || extra) info = { ...(base || {}), ...(extra || {}) };
    } catch (e) {
      info = null;
    }
    if (!info) return null;
    return { kind, id, tag: k ? k.name : kind, title: String(id), rows: [], ...info };
  }

  const kindsList = () => Object.keys(kinds);
  const nameOf = (kind) => (kinds[kind] ? kinds[kind].name : '');

  return { defineKind, define, lookup, kinds: kindsList, nameOf };
})();
