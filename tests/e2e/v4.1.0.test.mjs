// v4.1.0: code is colored by where each word comes from — the game (cookies(), a building's name),
// cookieMgr (item.payback(), golden.expected()), a statistic (built-in, or yours: underlined), a
// function (fmt.number), a macro or profile — with a legend under every editor and atop the Statistics
// page. Every value, action and condition's card links somewhere to read more: a statistic's shows its
// code and opens it; a payback value's says how it's worked out and opens the payback modes.
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w, errors } = g;
const doc = w.document;
const CA = w.CookieMgr;
await sleep(300);
const S = CA.Script;

// ---- where values come from ----
assert(S.originOf('cookies') === 'game' && S.originOf('stock.price') === 'game' && S.originOf('garden.plantAt') === 'game', 'cookies(), stock.price(), garden.plantAt(): the game’s');
assert(S.originOf('item.payback') === 'cookieMgr' && S.originOf('golden.expected') === 'cookieMgr' && S.originOf('buyer.next') === 'cookieMgr', 'item.payback(), golden.expected(), buyer.next(): cookieMgr’s');
assert(S.originOf('stat.payback') === 'stat', 'stat.payback(): a built-in statistic');
assert(S.originOf('fmt.number') === 'function' && S.originOf('count') === 'function' && S.originOf('finite') === 'function', 'fmt.number(), count(), finite(): functions');
assert(S.originOf('nope') === '', 'not a value: no origin');
const mine = CA.Stats.add({ label: 'Doubled payback', scope: 'item', source: 'return item.payback() * 2' });
assert(S.originOf(`stat.${mine.key}`) === 'mine', 'a statistic you wrote: yours');
// every game value named is a value (a renamed one would quietly turn cookieMgr's)
const all = S.VALUES.map((v) => v.id);
assert(all.every((id) => ['game', 'cookieMgr', 'stat', 'mine', 'function'].includes(S.originOf(id))), 'every value has an origin');
assert(all.filter((id) => S.originOf(id) === 'game').length >= 60, `many are the game’s (${all.filter((id) => S.originOf(id) === 'game').length})`);

// ---- the colors ----
const hl = (line) => CA.UI.CodeEditor.highlightLine(line);
const cls = (html, word) => (new RegExp(`<span class="([^"]+)">${word.replace(/[.()]/g, '\\$&')}</span>`).exec(html) || [])[1];
let h = hl('x = cookies() + item.payback() + stat.payback(item)');
assert(cls(h, 'cookies') === 'hv hv-game', `cookies: game (${cls(h, 'cookies')})`);
assert(cls(h, 'item.payback') === 'hv hv-cookieMgr', 'item.payback: cookieMgr');
assert(cls(h, 'stat.payback') === 'hv hv-stat', 'stat.payback: a statistic');
h = hl(`return fmt.number(stat.${mine.key}(item))`);
assert(cls(h, 'fmt.number') === 'hv hv-function' && cls(h, `stat.${mine.key}`) === 'hv hv-mine' && cls(h, 'return') === 'hk', 'fmt.number: a function; yours: yours; return: a keyword');
h = hl('buyer.profile(payback)');
assert(cls(h, 'buyer.profile') === 'ha' && cls(h, 'payback') === 'hm', 'buyer.profile: an action; payback inside it: a profile');
h = hl('switch on bigCookie');
assert(cls(h, 'bigCookie') === 'hm', 'switch on bigCookie: a macro');
h = hl('if buff(Frenzy) and building(Farm) > 5:');
assert(cls(h, 'buff') === 'hq' && cls(h, 'Frenzy') === 'hg' && cls(h, 'Farm') === 'hg' && cls(h, 'building') === 'hv hv-game', 'buff: a condition; Frenzy, Farm: the game’s names');

// ---- the cards ----
let i = CA.ScriptWords.explain('x = item.payback()', 1, 6, { vars: ['item'] });
assert(i && i.origin === 'cookieMgr' && /^cookieMgr value/.test(i.tag) && /Worked out by cookieMgr/.test(i.note), `item.payback: a cookieMgr value (${i && i.tag})`);
assert(/price ÷ gain/.test(i.how) && /ca-word-how/.test(CA.UI.CodeEditor.cardHtml(i, null)), '… and how it’s worked out');
i = CA.ScriptWords.explain('x = cookies()', 1, 5);
assert(i.origin === 'game' && /^Game value/.test(i.tag) && /straight from the game/.test(i.note), 'cookies: a game value');
i = CA.ScriptWords.explain('x = stat.payback(item)', 1, 6, { vars: ['item'] });
assert(i.origin === 'stat' && /item\.payback\(\)/.test(i.code), 'a statistic’s card carries its code');
let html = CA.UI.CodeEditor.cardHtml(i, null);
assert(/ca-word-code/.test(html) && /hv-cookieMgr/.test(html) && /ca-word-tag hv-stat/.test(html), 'and shows it, colored, under a tag in its color');

// ---- the legend and the links ----
CA.UI.Menu.openPage('clickers');
CA.UI.MacrosPage.edit(null, { name: 'Demo', mode: 'flow', source: 'x = item.payback()\nwait until golden.expected() < 60\npp.buy()\ny = stat.payback(x)\nz = cookies()' });
await sleep(50);
const legend = doc.querySelector('[data-code-ed] [data-code-legend]');
assert(legend && ['Game', 'cookieMgr', 'Statistic', 'Your statistic', 'Function', 'Macro / profile', 'Action', 'Condition', 'Keyword'].every((n) => legend.textContent.includes(n)), 'a legend under the editor');
const card = () => doc.querySelector('#CookieMgrLayer .ca-word-tip');
const word = (line, text) => [...doc.querySelectorAll('[data-code-ed] [data-code-hl] .ca-hl-line')[line - 1].querySelectorAll('span')].find((s) => s.textContent === text);
const linkFor = (line, text) => {
  CA.UI.CodeEditor.showCard(word(line, text));
  return card().querySelector('[data-word-open]');
};
let link = linkFor(1, 'item.payback');
assert(link && /payback modes/.test(link.textContent), `item.payback → the payback modes (${link && link.textContent})`);
link = linkFor(2, 'golden.expected');
assert(link && /Stats → Golden cookies/.test(link.textContent), `golden.expected → Stats → Golden cookies (${link && link.textContent})`);
link = linkFor(3, 'pp.buy');
assert(link && /Payback page/.test(link.textContent), 'pp.buy (an action) → the Payback page');
link = linkFor(4, 'stat.payback');
assert(link && /Open the statistic/.test(link.textContent), 'stat.payback → the statistic');
link = linkFor(5, 'cookies');
assert(link && /Stats → Cookies/.test(link.textContent), 'cookies → Stats → Cookies');
// follow one: unsaved new macro → Don't save → the Statistics page on its payback modes
CA.UI.CodeEditor.showCard(word(1, 'item.payback'));
card().querySelector('[data-word-open]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const discard = card().querySelector('[data-word-leave="discard"]');
if (discard) discard.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
await sleep(50);
assert(CA.Settings.get('tab') === 'tooltips' && doc.querySelector('[data-st-filter="modes"].on'), 'the Statistics page, on Payback modes');
CA.UI.CodeEditor.goBack();
await sleep(50);
CA.UI.MacrosPage.edit(null);

// ---- the library and the Statistics page ----
CA.UI.Menu.openPage('tooltips');
await sleep(50);
assert(doc.querySelector('#CookieMgrMenu [data-code-legend]'), 'a legend atop the Statistics catalog');
const call = doc.querySelector('.ca-st-call[data-code-view]');
assert(call && call.querySelector('span.hv-stat, span.hv-mine'), 'a statistic’s stat.…(item) is colored and hoverable');
CA.UI.TooltipsPage.showGroup && CA.UI.Menu.openPage('tooltips');
html = CA.UI.CodeEditor.libraryHtml('x', { mode: 'stat' });
assert(/ca-lib-o-game/.test(html) && /ca-lib-o-cookieMgr/.test(html) && /data-code-view="item\.payback\(\)"/.test(html), 'the library: rows by origin, each word hoverable');

assert(errors.length === 0, `no errors (${errors.join(' | ')})`);
done();
process.exit();
