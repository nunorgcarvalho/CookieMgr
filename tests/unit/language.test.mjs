// The v3 language: arithmetic, variables, loops over live lists, expressions as options, named
// blocks (def), log <value> — compiled, run (one pass, or as a macro), and written back out.
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({});
await sleep(300);
const CA = g.window.CookieMgr;
const S = CA.Script;
const Game = g.Game;
const M = CA.Macros;

const errs = (src) => S.compile(src).errors.map((e) => `${e.line}: ${e.message}`);
const pass = (src, vars) => {
  const r = S.compile(src, { vars: Object.keys(vars || {}) });
  if (r.errors.length) throw new Error(`${src}: ${errs(src)}`);
  return M.runPass(r.flow, null, vars);
};
const logs = (F) => F.trace.map((t) => t.text.replace(/^line \d+: /, ''));
const ev = (src, env) => S.evaluate(S.compile(`wait until ${src}`).flow[0].cond, env);

// ---- arithmetic
Game.cookies = 2e6;
Game.cookiesPs = 1000;
Game.lumps = 3;
[
  ['cookies() > 0.5 * 3M', true],
  ['cookies() > 0.5 * 5M', false],
  ['cookies() / cps() == 2000', true],
  ['cps() * 60 * 20 < cookies()', true],
  ['(cookies() + 1M) / 2 == 1.5M', true],
  ['cookies() - 1M - 500K == 500K', true],
  ['cookies() - (1M - 500K) == 1.5M', true],
  ['lumps() % 2 == 1', true],
  ['-lumps() < 0', true],
  ['lumps() * -1 == -3', true],
  ['(lumps() > 1) and (cps() + 0 > 999)', true],
].forEach(([src, want]) => {
  const r = ev(src);
  assert(r.ok === want, `${src} → ${want} (“${r.text}”)`);
});
assert(/cookies\(\) \/ cps\(\) = 2,?000/.test(ev('cookies() / cps() == 2000').text), `explains a sum with its value (${ev('cookies() / cps() == 2000').text})`);

// ---- variables
let F = pass('x = 5\ny = x * 2 + 1\nlog y');
assert(logs(F).join() === '11', `x = 5; y = x * 2 + 1 → ${logs(F)}`);
F = pass('ready = lumps() >= 3 and cookies() > 1M\nif ready:\n  log "yes"\nelse:\n  log "no"');
assert(logs(F).some((t) => t === 'yes') && logs(F).some((t) => /ready = true ✓/.test(t)), `a condition kept in a variable (${logs(F)})`);
F = pass('name = "Cookie" + "Mgr"\nlog name');
assert(logs(F).includes('CookieMgr'), 'text joins with +');
F = pass('if buy and not quiet:\n  log "buying"', { buy: true, quiet: false });
assert(logs(F).includes('buying'), 'inputs: variables from the start (a macro’s inputs)');
assert(/isn’t a condition/.test(errs('if x:\n  stop')[0] || ''), 'a name that’s never set isn’t a condition');
assert(/already a word/.test(errs('cookies = 5')[0] || '') && /already a word/.test(errs('pop.golden = 1')[0] || ''), 'variables can’t take the language’s words');
F = pass('log nothing + 1');
assert(logs(F).join() === 'nothing1', 'an unknown word is text, as before');

// ---- expressions as options
const got = [];
CA.Actions.register({ id: 't.cap', name: 'Capture', params: [{ key: 'v', label: 'Value', type: 'number', default: 0 }], run: (p) => (got.push(p.v), 1) });
got.length = 0;
pass('x = 4\nt.cap(x * 2 + 1)\nt.cap(lumps())\nt.cap(7)');
assert(got.join() === '9,3,7', `options worked out when the line runs (${got})`);
assert(S.decompile(S.compile('x = 4\nt.cap(x * 2 + 1)').flow) === 'x = 4\nt.cap(x * 2 + 1)', 'and written back out');

// ---- loops over live lists
F = pass('n = 0\nfor b in buildings():\n  n = n + 1\nlog n\nlog count(buildings())');
const nb = Object.keys(Game.Objects).length;
assert(logs(F).join() === `${nb},${nb}`, `for b in buildings(): every item in one pass (${logs(F)}, ${nb} buildings)`);
F = pass('for b in buildings():\n  if b == "Grandma":\n    log b');
assert(logs(F).filter((t) => !/^if /.test(t)).join() === 'Grandma', `the item’s name inside the loop (${logs(F).slice(0, 3)})`);
// a body that waits: the loop carries on from that item on later passes
got.length = 0;
const m = M.save({ name: 'Each', mode: 'flow', every: 50, source: 'for b in buildings():\n  t.cap(1)\n  wait until lumps() > 10\nlog "done"\nstop\n' });
M.set(m.id, true, { silent: true });
await sleep(200);
const at = M.flowStatus(m.id).at.join(' ');
assert(got.length === 1 && /b = Cursor \(1 of \d+\)/.test(at), `waits inside the loop, says where (${at})`);
Game.lumps = 20;
await sleep(250);
assert(got.length === nb && !M.isOn(m.id), `then goes through the rest (${got.length} of ${nb}) and finishes`);
Game.lumps = 3;
assert(/isn’t a value/.test(errs('for x in nothing():\n  stop')[0] || ''), 'a list that isn’t a value');

// ---- named blocks
got.length = 0;
pass('def twice(v):\n  t.cap(v)\n  t.cap(v * 10)\ntwice(3)\ntwice(lumps())');
assert(got.join() === '3,30,3,30', `def: a named block with options (${got})`);
assert(errs('def f():\n  f()\nf()').some((e) => /too deeply/.test(e)), 'calling itself: caught');
assert(errs('forever:\n  def f():\n    stop').some((e) => /top level/.test(e)), 'a def goes at the top level');
assert(errs('def g(a):\n  stop\ng()').some((e) => /takes 1 option: a/.test(e)), 'its options are checked');
assert(errs('def buff():\n  stop').some((e) => /already a word/.test(e)), 'its name can’t be one of the language’s');
F = pass('def hello():\n  log "hi"\nhello()\nhello()');
assert(logs(F).filter((t) => t === 'hi').length === 2 || logs(F).filter((t) => t === 'hi').length === 1, 'a block without options');

// ---- written back out
[
  'x = cookies() * 0.1',
  'ready = buff(Frenzy) and magic() > 50',
  'for b in buildings():\n  log b',
  'wait until (cookies() + 1M) / 2 > cps() * 60',
  'if a - (b - c) > -2:\n  stop',
  'wait until not ready',
].forEach((src) => {
  const vars = ['a', 'b', 'c', 'ready'];
  const one = S.compile(src, { vars });
  const back = S.decompile(one.flow);
  const two = S.compile(back, { vars });
  const strip = (x) => JSON.stringify(x, (k, v) => (k === 'line' ? undefined : v));
  assert(!one.errors.length && !two.errors.length && strip(one.flow) === strip(two.flow), `round-trips: ${JSON.stringify(src)} → ${JSON.stringify(back)} ${one.errors.map((e) => e.message)}`);
});

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
