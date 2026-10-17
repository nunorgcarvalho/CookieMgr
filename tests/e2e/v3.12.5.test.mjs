// v3.12.5: Force the Hand of Fate on combos says on its card when combos can't happen — the next
// golden cookie can't come before a Frenzy (or a building special) ends — and which upgrades would
// help (Lucky day, Serendipity, Get lucky). A generic hook: any built-in's hint(inputs) shows on its
// card's status, on or off; one without says nothing, one that throws doesn't break the card.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const M = CA.Macros;
const id = CA.Grimoire.AUTO_ID;

// today's golden cookie odds (features/timers.js), as the Timers say them — set by hand here
let soonest = 150; // seconds: Lucky day only (5 min × 0.5)
let owned = [];
CA.Timers.distribution = () => ({ next: { min: soonest, max: soonest * 3, mean: soonest * 2 } });
CA.Timers.effectDuration = (n) => ({ frenzy: owned.includes('Get lucky') ? 154 : 77, 'building special': owned.includes('Get lucky') ? 60 : 30 })[String(n).toLowerCase()];
const has = Game.Has;
Game.Has = (n) => owned.includes(n) || (has ? has(n) : false);

CA.UI.Menu.openPage('clickers');
const status = (mid) => doc.querySelector(`[data-page="clickers"] [data-macro-row="${mid}"] [data-macro-status]`);
const hintOf = (mid) => {
  CA.UI.MacrosPage.sync(doc.querySelector('[data-page="clickers"]'));
  const h = status(mid) && status(mid).querySelector('.ca-status-hint');
  return h ? h.textContent : '';
};
assert(status(id), '(the macro’s card)');

// ---- combos can't happen: said, with what would help
owned = ['Lucky day'];
let h = hintOf(id);
assert(/combos unlikely/.test(h) && /2m 30s/.test(h) && /1m 17s/.test(h), `the next golden cookie can’t come before a Frenzy ends: said (${h})`);
assert(/get Serendipity, Get lucky/.test(h) && !/Lucky day/.test(h), '…naming the upgrades you don’t have that would help');
M.set(id, true, { silent: true });
await sleep(50);
assert(/combos unlikely/.test(hintOf(id)), 'shown while it runs too');
M.set(id, false, { silent: true });
// ---- with Serendipity + Get lucky: combos can happen — nothing said
owned = ['Lucky day', 'Serendipity', 'Get lucky'];
soonest = 75;
assert(hintOf(id) === '', 'Serendipity + Get lucky (75 s at the soonest, a 154 s Frenzy): no hint');
assert(CA.Grimoire.comboHint() === '', '(comboHint: empty)');

// ---- the hook, generically
assert(hintOf('golden') === '', 'a built-in without a hint: nothing');
M.get('golden').hint = () => 'just a test';
assert(hintOf('golden') === '⚠ just a test', 'a built-in with one: shown');
M.get('golden').hint = () => {
  throw new Error('boom');
};
const before = g.errors.length;
assert(hintOf('golden') === '' && status('golden'), 'a hint that throws: nothing shown, the card still there');
delete M.get('golden').hint;
assert(!doc.querySelector('[data-page="clickers"] .ca-status-hint[title]'), 'no native title tooltips');

assert(g.errors.length === before && g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
