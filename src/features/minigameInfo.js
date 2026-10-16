// What the minigames' own tooltips leave out — Cookie Monster's minigame additions, worked out from the
// game's rules (ui/minigameTips.js puts them under the game's tooltips):
//
//   a spell   when you'll have the magic for it, how long the magic takes to come back after casting
//             it (to where it is, and to full); Conjure Baked Goods: what it gives and the bank that
//             gives the most; Spontaneous Edifice: the building it can give, and the bank it needs
//   a stock   its resting value (where it drifts back to) and how far the price is from it, its trend,
//             what you hold and its worth in cookies, the room left in your offices
//   a god     the CpS it would bring in each slot (measured on the game itself — CA.WhatIf.godGain)
//
// Words: spell.cost(spell), spell.waitFor(spell), spell.recover(spell), stock.restingRatio(good).

CA.MinigameInfo = (() => {
  const grimoire = () => CA.Util.minigame('Wizard tower');
  const market = () => CA.Util.minigame('Bank');
  const temple = () => CA.Util.minigame('Temple');
  const MODES = ['stable', 'slow rise', 'slow fall', 'fast rise', 'fast fall', 'chaotic'];
  const SLOT_NAMES = ['Diamond', 'Ruby', 'Jade'];

  const keyOf = (obj, me) => Object.keys(obj || {}).find((k) => obj[k] === me) || null;
  /** A spell by its key ('hand of fate'), name or id. */
  function spellOf(M, s) {
    if (!M) return null;
    if (M.spells && M.spells[s]) return M.spells[s];
    const k = String(s).toLowerCase();
    return (M.spellsById || []).find((x) => String(x.id) === k || (x.name && x.name.toLowerCase() === k)) || null;
  }

  // ---- spells -----------------------------------------------------------------------------------

  /**
   * A spell: { key, name, cost, magic, max, affordable, waitFor (seconds until you can cast it),
   * recover (seconds for the magic to come back to where it is after casting it; null: can't cast),
   * refull (… back to full), fail, conjure?, edifice? }.
   */
  function spell(s) {
    const M = grimoire();
    const sp = spellOf(M, s);
    if (!sp) return null;
    const refill = (from, to) => CA.Grimoire.refillSeconds(from, M.magicM, to);
    const cost = typeof M.getSpellCost === 'function' ? M.getSpellCost(sp) : sp.costMin;
    const after = M.magic - cost;
    const key = keyOf(M.spells, sp);
    const out = {
      key,
      name: sp.name,
      cost,
      magic: M.magic,
      max: M.magicM,
      affordable: after >= 0,
      waitFor: refill(M.magic, cost),
      recover: after >= 0 ? refill(after, M.magic) : null,
      refull: after >= 0 ? refill(after, M.magicM) : null,
      fail: typeof M.getFailChance === 'function' ? M.getFailChance(sp) : 0,
    };
    // what it gives if cast now (the game: max(7, min(15% of the bank, 30 minutes of CpS))), and the bank for the most
    if (key === 'conjure baked goods' && CA.GoldenMath) out.conjure = { ...CA.GoldenMath.conjure(), now: Math.max(7, Math.min((Game.cookies || 0) * 0.15, (Game.cookiesPs || 0) * 1800)) };
    if (key === 'spontaneous edifice' && CA.GoldenMath) out.edifice = CA.GoldenMath.edifice();
    return out;
  }

  // ---- stocks -----------------------------------------------------------------------------------

  /** A stock: { id, symbol, price, resting, ratio, delta, mode, held, max, room, perShare (cookies), worth (cookies) }. */
  function stock(g) {
    const M = market();
    const good = M && (CA.Stocks && CA.Stocks.goodOf ? CA.Stocks.goodOf(g) : M.goodsById[g]);
    if (!good) return null;
    const resting = typeof M.getRestingVal === 'function' ? M.getRestingVal(good.id) : NaN;
    const max = typeof M.getGoodMaxStock === 'function' ? M.getGoodMaxStock(good) : Infinity;
    const price = typeof M.getGoodPrice === 'function' ? M.getGoodPrice(good) : good.val; // what a trade goes at
    const perShare = price * (Game.cookiesPsRawHighest || 0);
    return {
      id: good.id,
      symbol: good.symbol,
      price,
      resting,
      ratio: resting > 0 ? price / resting : NaN,
      delta: typeof M.goodDelta === 'function' ? M.goodDelta(good.id) : NaN,
      mode: MODES[good.mode] || String(good.mode),
      held: good.stock,
      max,
      room: Math.max(0, max - good.stock),
      perShare,
      worth: good.stock * perShare,
    };
  }

  // ---- gods -------------------------------------------------------------------------------------

  /** A god: { key, name, slot (-1: out), gains: [{ slot, name, cps, pct }] } — the CpS in each slot. */
  function god(id) {
    const M = temple();
    const me = M && (M.godsById[id] || (M.gods && M.gods[id]));
    if (!me || !CA.WhatIf) return null;
    const key = keyOf(M.gods, me);
    const cps = Game.cookiesPs || 0;
    const gains = SLOT_NAMES.map((name, s) => {
      const v = me.slot === s ? 0 : CA.WhatIf.godGain(key, s);
      return { slot: s, name, cps: v, pct: cps > 0 ? v / cps : NaN, here: me.slot === s };
    });
    const out = me.slot >= 0 ? CA.WhatIf.godGain(key, -1) : 0;
    return { key, name: me.name, slot: me.slot, gains, out };
  }

  function init() {
    const V = (id, desc, params, get) => CA.Script.defineValue({ id, desc, params, get });
    V('spell.cost', 'the magic a spell costs now', ['spell'], (s) => (spell(s) || { cost: NaN }).cost);
    V('spell.waitFor', 'seconds until there’s magic enough to cast a spell (0: now)', ['spell'], (s) => (spell(s) || { waitFor: Infinity }).waitFor);
    V('spell.recover', 'seconds for the magic to come back to where it is after casting a spell (NaN: not enough to cast it)', ['spell'], (s) => {
      const x = spell(s);
      return x && x.recover !== null ? x.recover : NaN;
    });
    V('stock.restingRatio', 'a stock’s price ÷ its resting value (below 1: under where it drifts back to)', ['good'], (g) => (stock(g) || { ratio: NaN }).ratio);
  }

  return { init, spell, stock, god, MODES };
})();
