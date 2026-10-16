// v3.4.1: a popped shimmer isn't counted again. The game leaves a popped golden cookie in
// Game.shimmers (popped = true) while it fades out, and its pop() does nothing the second time —
// shimmers(), shimmer.pop and "a golden cookie is on screen" now skip it (the simulator logged
// 103 pops for 8 golden cookies in an hour).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);

// a shimmer as main.js has it: pop() once, then it stays (popped) until it fades
let popFuncs = 0;
let nextId = 1;
const shimmer = (wrath = 0) => ({
  id: nextId++,
  type: 'golden',
  wrath,
  life: 300,
  popped: false,
  pop() {
    if (this.popped) return;
    this.popped = true;
    popFuncs++;
  },
});
const ev = (src) => CA.Script.evaluate(CA.Script.compile(`wait until ${src}`).flow[0].cond);
const run = (id, params) => CA.Actions.run(id, params);
const listed = () => CA.Actions.get('shimmer.pop').params[0].options().map((o) => String(o.v));

const a = shimmer();
Game.shimmers = [a];
assert(listed().join() === String(a.id) && ev(`shimmer.type("${a.id}") == "golden"`).ok, 'on screen: listed, its type known');
const key = String(a.id);
assert(run('shimmer.pop', { shimmer: key }) === 1 && a.popped && popFuncs === 1, 'shimmer.pop: popped, counted once');
assert(Game.shimmers.length === 1, '(the game keeps it while it fades)');
assert(run('shimmer.pop', { shimmer: key }) === 0 && popFuncs === 1, 'popping it again: 0, nothing counted');
assert(!listed().length && ev(`shimmer.type("${a.id}") == ""`).ok, 'once popped: not listed any more (shimmers() skips it)');
assert(!CA.Conditions.test({ cond: 'shimmer', params: { type: 'golden' } }), 'a golden cookie is on screen: no (only a fading one)');

// the Golden cookies macro (every 100 ms) over a second, with one cookie that fades for a while
const b = shimmer();
Game.shimmers = [a, b];
popFuncs = 0;
CA.Macros.set('golden', true, { silent: true });
await sleep(1200);
CA.Macros.set('golden', false, { silent: true });
const st = CA.Macros.flowStatus ? CA.Macros.flowStatus('golden') : null;
assert(popFuncs === 1 && b.popped, `the Golden cookies macro: one cookie, one pop (${popFuncs})`);
assert(!st || st.done === 1, `…and its count: 1 (${st && st.done})`);

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
