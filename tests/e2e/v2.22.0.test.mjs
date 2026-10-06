// v2.22.0: flow macros (do / wait / until / if / parallel / forever), the SeasonCompletion agent,
// and the redesigned macro editor (with flow blocks).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- test actions and conditions
const log = [];
const flags = {};
CA.Actions.register({ id: 't.log', name: 'Log', params: [{ key: 'tag', label: 'Tag', type: 'select', default: 'a', options: () => ['a', 'b', 'c', 'd', 'e', 'f'].map((v) => ({ v, label: v })) }], run: (p) => (log.push(p.tag), 1) });
CA.Conditions.register({ id: 't.flag', name: 'Flag', params: [{ key: 'f', label: 'Flag', type: 'select', default: 'x', options: () => ['x', 'y', 'z'].map((v) => ({ v, label: v })) }], describe: (p) => `flag ${p.f}`, test: (p) => !!flags[p.f] });
const L = (tag) => ({ type: 'do', action: 't.log', params: { tag } });
const F = (f) => ({ all: [{ cond: 't.flag', params: { f }, not: false }] });
const M = CA.Macros;

// a pass by hand: start (no timer runs in between), then tick through runOnce-like passes
async function passes(id, n) {
  for (let i = 0; i < n; i++) await sleep(110);
}

// ---- sequence + wait
let m = M.save({ name: 'Seq', mode: 'flow', every: 100, flow: [L('a'), { type: 'wait', cond: F('x') }, L('b')] });
M.set(m.id, true, { silent: true });
await passes(m.id, 2);
assert(log.join('') === 'a' && M.isOn(m.id), `do, then waits (${log.join('')})`);
assert(/waiting until flag x/.test(M.flowStatus(m.id).at.join()), 'status says what it waits for');
flags.x = true;
await passes(m.id, 2);
assert(log.join('') === 'ab' && !M.isOn(m.id), 'carries on, and switches itself off at the end');

// ---- until: the body each pass until the condition
log.length = 0;
flags.x = false;
m = M.save({ name: 'Until', mode: 'flow', every: 100, flow: [{ type: 'until', cond: F('x'), body: [L('c')] }, L('d')] });
M.set(m.id, true, { silent: true });
await passes(m.id, 3);
const cs = log.filter((t) => t === 'c').length;
assert(cs >= 2 && !log.includes('d'), `until: body every pass (${log.join('')})`);
flags.x = true;
await passes(m.id, 2);
assert(log[log.length - 1] === 'd' && log.filter((t) => t === 'c').length === cs, 'then moves on, body not run again');

// ---- if / else, parallel, forever
log.length = 0;
flags.y = false;
m = M.save({
  name: 'Branches',
  mode: 'flow',
  every: 100,
  flow: [
    { type: 'if', cond: F('y'), then: [L('a')], else: [L('b')] },
    { type: 'parallel', branches: [[L('c'), { type: 'wait', cond: F('z') }, L('e')], [L('d')]] },
    { type: 'forever', body: [L('f')] },
  ],
});
flags.z = false;
M.set(m.id, true, { silent: true });
await passes(m.id, 2);
assert(log.slice(0, 3).join('') === 'bcd', `else branch, then both branches in the same pass (${log.join('')})`);
assert(!log.includes('f'), 'parallel waits for every branch');
flags.z = true;
await passes(m.id, 3);
assert(log.includes('e') && log.filter((t) => t === 'f').length >= 2 && M.isOn(m.id), 'then forever: every pass, never finishes');
// v2.28: blocks run as their code (written out once), so the status names the line
assert(M.flowStatus(m.id).at.some((x) => /repeating$/.test(x)), `status: repeating (${M.flowStatus(m.id).at})`);
M.set(m.id, false, { silent: true });


// ---- v2.24: SeasonCompletion became an algorithm (test_v2240); a v2.22 block flow opens as code
const old = M.save({ name: 'Blocks', mode: 'flow', every: 100, flow: [{ type: 'until', cond: F('x'), body: [L('a')] }, { type: 'parallel', branches: [[L('b')], [L('c')]] }] });
CA.UI.Menu.openPage('clickers');
CA.UI.MacrosPage.edit(old.id);
const ta = doc.querySelector('[data-macro-editor] [data-code]');
assert(ta && /repeat until t\.flag\((x)?\):\n  t\.log\((a)?\)/.test(ta.value) && ta.value.includes('parallel:\n  branch:'), `its blocks, written out as code (${ta && JSON.stringify(ta.value)})`);
click(w, doc.querySelector('[data-macro-editor] [data-edit-act="save"]'));
const saved = M.get(old.id);
assert(typeof saved.source === 'string' && M.flowOf(saved)[1].type === 'parallel', 'saved as code, running the same');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
