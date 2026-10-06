// v2.27.0: a macro row's settings work on every page that shows it; styled tips everywhere (live
// ones through Tips.provide); the language's fixes (library snippets quoted, state() compared,
// # in quotes, 30s / 5m in a wait, explicit arguments kept when written back).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, goods } = g;
const CA = w.CookieMgr;
const doc = w.document;
makeGarden(Game);
await sleep(400);
const change = (el, v) => {
  if (el.type === 'checkbox') el.checked = v;
  else el.value = String(v);
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};

// ---- a macro row's settings, outside the Macros page
CA.UI.Menu.openPage('stocks');
const every = doc.querySelector('[data-page="stocks"] [data-macro-row="stockTrader"] input[data-macro-every]');
assert(every, 'the autobuyer’s row on the Stock market page has its interval box');
change(every, 3);
assert(CA.Macros.everyOf(CA.Macros.get('stockTrader')) === 3000, `changing it there works (${CA.Macros.everyOf(CA.Macros.get('stockTrader'))} ms)`);
const buy = doc.querySelector('[data-page="stocks"] [data-macro-row="stockTrader"] input[data-key="buy"]');
if (buy) {
  change(buy, false);
  assert(CA.Macros.shiftValue('stockTrader') === false, 'and its choices');
}
CA.UI.Menu.openPage('garden');
const gEvery = doc.querySelector('[data-page="garden"] [data-macro-row="gardener"] input[data-macro-every]');
if (gEvery) {
  change(gEvery, 2);
  assert(CA.Macros.everyOf(CA.Macros.get('gardener')) === 2000, 'the Auto-gardener’s, on the Garden page');
}
// on the Macros page it still applies once (not twice)
CA.UI.Menu.openPage('clickers');
let sets = 0;
const realSet = CA.Macros.setEvery;
CA.Macros.setEvery = (...a) => (sets++, realSet(...a));
change(doc.querySelector('[data-page="clickers"] [data-macro-row="golden"] input[data-macro-every]'), 5); // times a second
CA.Macros.setEvery = realSet;
assert(sets === 1 && CA.Macros.everyOf(CA.Macros.get('golden')) === 200, `the Macros page: applied once (${sets})`);

// ---- tips: never native; live text while it shows
CA.UI.Menu.openPage('stocks');
assert(!doc.querySelector('#CookieMgrMenu [title]'), 'no title attributes on the Stock market page');
goods[0].stock = 7;
const sell = doc.querySelector('[data-ca-sellall]');
sell.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const tip = () => doc.getElementById('CookieMgrTip');
assert(tip() && tip().style.display === 'block' && /Sells for ~/.test(tip().textContent), `Sell all: a live estimate (${tip() && tip().textContent})`);
const before = tip().textContent;
goods[0].stock = 0;
goods.forEach((s) => (s.stock = 0));
await sleep(500);
assert(tip().textContent !== before, `…kept current while it shows (${tip().textContent})`);
doc.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
assert(tip().style.display === 'none', 'gone when leaving');
CA.UI.Tips.provide('test', (el) => `hello ${el.dataset.n}`);
const t = doc.createElement('span');
t.dataset.tipLive = 'test';
t.dataset.n = '7';
doc.querySelector('#CookieMgrMenu').appendChild(t);
t.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
assert(tip().textContent === 'hello 7' && t.getAttribute('aria-label') === 'hello 7', 'Tips.provide: any element can have a live tip (and an aria-label)');
t.remove();
doc.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));

// ---- the language
const S = CA.Script;
const ins = (id) => S.library().find((it) => it.id === id).insert;
assert(ins('spell.cast') === 'spell.cast("hand of fate")', `library: a spell name with spaces is quoted (${ins('spell.cast')})`);
assert(!S.compile('if state(cps) > 0:\n  log "y"').errors.length, 'state(…) can be compared');
const m = CA.Macros.save({ name: 'Waits', mode: 'flow', source: 'log "step #1"\nwait 5m\nwait 30s\n' });
const f = S.compile(CA.Macros.sourceOf(m)).flow;
assert(f[0].text === 'step #1' && f[1].secs === 300 && f[2].secs === 30, `# in quotes is text; 5m = five minutes; 30s (${JSON.stringify(f.map((n) => n.text || n.secs))})`);
assert(S.decompile(S.compile('spell.cast("hand of fate")').flow) === 'spell.cast("hand of fate")', 'an argument you wrote stays written');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
