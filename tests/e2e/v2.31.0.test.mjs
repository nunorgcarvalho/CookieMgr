// v2.31.0: the stock autobuyer hires stockbrokers; every macro runs as algorithmic code (Repeat /
// When… / Once are shortcuts that write it), shown in the editor and continuable as code; the
// library's Lookup lists the names that go inside ( ).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game, M: bank, goods } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const M = CA.Macros;

// ---- stockbrokers
const grandma = Game.Objects.Grandma;
grandma.highest = 25;
grandma.level = 1; // room for ceil(2.5 + 1) = 4
Game.cookiesPsRawHighest = 1000; // a broker: 20 minutes of that = 1.2M
goods.forEach((s) => ((s.mode = 4), (s.stock = 0))); // nothing rising: the bank is left for brokers
Game.cookies = 3e6;
M.runOnce('stockTrader');
assert(bank.brokers === 2 && Math.abs(Game.cookies - 6e5) < 1, `the autobuyer hires the brokers it can afford (${bank.brokers}, ${Game.cookies} left)`);
Game.cookies = 1e8;
M.runOnce('stockTrader');
assert(bank.brokers === 4, `never more than the market allows (${bank.brokers} of ${bank.getMaxBrokers()})`);
grandma.highest = 60; // room for 7
M.setInput('stockTrader', 'brokers', false); // v3: an input of the autobuyer's code (was a step's option)
M.runOnce('stockTrader');
assert(bank.brokers === 4, 'its “Hire stockbrokers” choice off: none');
M.setInput('stockTrader', 'brokers', true);
M.shiftToggle('stockTrader'); // only sells
M.runOnce('stockTrader');
assert(bank.brokers === 4, 'only selling (shift-click): no brokers either');
M.shiftToggle('stockTrader');
assert(CA.Actions.run('stocks.hireBrokers') === 3 && bank.brokers === 7, 'and an action of its own: stocks.hireBrokers()');
CA.UI.Menu.openPage('stocks');
assert(doc.querySelector('[data-macro-row="stockTrader"] input[data-key="brokers"]'), 'its choice on the autobuyer’s row');

// ---- every macro is code
let n = 0;
CA.Actions.register({ id: 'test.count', name: 'Count', run: () => ++n && 1 });
const mk = (def) => M.save({ name: def.mode, every: 50, steps: [{ action: 'test.count', params: {} }], ...def });
const rep = mk({ mode: 'repeat' });
const rise = mk({ mode: 'when', when: { all: [{ cond: 'buff', params: { name: 'Frenzy' }, not: false }], edge: 'rise' } });
const whil = mk({ mode: 'when', when: { all: [{ cond: 'buff', params: { name: 'Frenzy' }, not: false }, { cond: 'buff', params: { name: 'Clot' }, not: true }], edge: 'while' } });
const once = mk({ mode: 'once' });
assert(M.codeOf(rep) === 'forever:\n  test.count()', `Repeat = ${JSON.stringify(M.codeOf(rep))}`);
assert(M.codeOf(rise) === 'forever:\n  wait until buff(Frenzy)\n  test.count()\n  wait until not buff(Frenzy)', `When… (once each time) = ${JSON.stringify(M.codeOf(rise))}`);
assert(M.codeOf(whil) === 'forever:\n  if buff(Frenzy) and not buff(Clot):\n    test.count()', `When… (while it holds) = ${JSON.stringify(M.codeOf(whil))}`);
assert(M.codeOf(once) === 'test.count()', 'Once = its steps');
const counted = async (id, ms) => {
  n = 0;
  M.set(id, true, { silent: true });
  await sleep(ms);
  M.set(id, false, { silent: true });
  return n;
};
assert((await counted(rep.id, 330)) >= 4, 'Repeat: every pass');
Game.buffs = {};
let c = await counted(rise.id, 300);
assert(c === 0, 'When…: nothing until it happens');
n = 0;
M.set(rise.id, true, { silent: true });
Game.buffs.Frenzy = { name: 'Frenzy', time: 100 };
await sleep(300);
assert(n === 1, `once when it happens (${n})`);
delete Game.buffs.Frenzy;
await sleep(150);
Game.buffs.Frenzy = { name: 'Frenzy', time: 100 };
await sleep(200);
M.set(rise.id, false, { silent: true });
assert(n === 2, `again the next time (${n})`);
c = await counted(whil.id, 330);
assert(c >= 4, `while it holds: every pass (${c})`);
Game.buffs.Clot = { name: 'Clot', time: 100 };
assert((await counted(whil.id, 200)) === 0, '…and not while the other one holds');
Game.buffs = {};
// steps still count what they did; the live view works for every kind
n = 0;
M.set(rep.id, true, { silent: true });
await sleep(220);
const st = M.status(rep.id).steps[0];
const live = M.flowStatus(rep.id);
M.set(rep.id, false, { silent: true });
assert(st.total >= 3 && st.lastAt > 0 && live && live.done >= 3, `its step counts (${st.total}) and live status (${live && live.done})`);
assert(M.runOnce(rep.id) === 1, 'running a Repeat macro by hand: its steps once');
// a row choice changed while it runs applies at once
// (v3: the big cookie — the lump harvester is code with inputs now; this one is still a shortcut with a step option)
M.set('bigCookie', true, { silent: true });
M.setParam('bigCookie', 0, 'anim', 'none');
assert(/"none"/.test(JSON.stringify(M.programOf(M.get('bigCookie')))) && /click\.bigCookie\(none\)/.test(M.codeOf(M.get('bigCookie'))), 'a row choice: the code follows');
M.set('bigCookie', false, { silent: true });

// ---- the editor: "As code", "Carry on as code"
CA.UI.Menu.openPage('clickers');
CA.UI.MacrosPage.edit(rise.id);
const ed = () => doc.querySelector('[data-macro-editor]');
const pre = () => ed().querySelector('[data-ascode-pre]');
assert(pre() && /wait until/.test(pre().textContent) && /buff\(Frenzy\)/.test(pre().textContent), 'the editor shows what the When… macro runs, as code');
const edge = ed().querySelector('select[data-edit="when.edge"]');
edge.value = 'while';
edge.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(/if buff\(Frenzy\):/.test(pre().textContent), 'changing a setting: the code follows');
click(w, ed().querySelector('[data-edit-act="to-code"]'));
const ta = ed().querySelector('[data-code]');
assert(ta && /forever:\n {2}if buff\(Frenzy\):\n {4}test\.count\(\)/.test(ta.value) && ed().querySelector('.ca-ed-kind.on[data-val="flow"]'), `Carry on as code: an algorithm, from what it ran (${ta && JSON.stringify(ta.value)})`);
click(w, ed().querySelector('[data-edit-act="save"]'));
assert(M.get(rise.id).mode === 'flow', 'saved as an algorithmic macro');
c = await counted(rise.id, 200);
assert(c === 0, 'runs the same: nothing without Frenzy');
Game.buffs.Frenzy = { name: 'Frenzy', time: 100 };
c = await counted(rise.id, 330);
assert(c >= 4, `…every pass with it (${c})`);
Game.buffs = {};
// switching the kind to Algorithmic writes a When… macro's conditions too
CA.UI.MacrosPage.edit(whil.id);
click(w, ed().querySelector('[data-edit-act="mode"][data-val="flow"]'));
assert(/if buff\(Frenzy\) and not buff\(Clot\):/.test(ed().querySelector('[data-code]').value), 'Algorithmic from a When…: its conditions written out');
click(w, ed().querySelector('[data-edit-act="cancel"]'));

// ---- the Lookup
const L = CA.Script.lookups();
const look = (name) => L.find((x) => x.name === name);
assert(look('Spell') && look('Spell').items.some((i) => i.code === '"hand of fate"'), 'Lookup: spells (quoted as written)');
assert(look('Effect') && look('Effect').items.some((i) => i.code === 'Frenzy') && look('Effect').uses.some((u) => /^buff\(/.test(u)), 'effects, and where they go');
assert(look('Macro') && look('Macro').items.some((i) => i.v === 'golden'), 'macros');
assert(look('Season') && look('Building') && look('Building').items.some((i) => i.v === 'Cursor'), 'seasons, buildings');
CA.UI.MacrosPage.edit(null);
click(w, ed().querySelector('[data-edit-act="mode"][data-val="flow"]'));
const code = ed().querySelector('[data-code]');
code.value = 'spell.cast()';
code.dispatchEvent(new w.Event('input', { bubbles: true }));
code.setSelectionRange(11, 11);
const lib = ed().querySelector('[data-ed-lib]');
click(w, lib.querySelector('[data-lib-tab="lookup"]'));
assert(!lib.querySelector('[data-lib-pane="lookup"]').hidden && lib.querySelector('[data-lib-pane="words"]').hidden, 'the Lookup tab');
const item = [...lib.querySelectorAll('[data-lib-lit]')].find((b) => b.textContent === '"stretch time"');
click(w, item);
assert(code.value === 'spell.cast("stretch time")', `a name goes where the cursor is (${code.value})`);
const s = lib.querySelector('[data-lib-search]');
s.value = 'frenzy';
s.dispatchEvent(new w.Event('input', { bubbles: true }));
const shown = [...lib.querySelectorAll('[data-lib-pane="lookup"] .ca-lib-row:not(.hidden)')].map((r) => r.textContent);
assert(shown.length && shown.every((t) => /frenzy/i.test(t)), `search finds names too (${shown.slice(0, 3)})`);
click(w, ed().querySelector('[data-edit-act="cancel"]'));

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
