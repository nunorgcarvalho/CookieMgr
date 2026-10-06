// v2.29.0: a widget's text size reaches its popups; odd widget ids are replaced on load; the shared
// helpers (Pages.scope, CA.Format, CA.UI.Dom, CA.Recorder.recent) behave.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

// ---- a widget's text size, on its popups in the floating layer
CA.Settings.set('widgetsShown', true);
const pan = CA.UI.Widgets.add('pantheon');
pan.font = 150; // %
CA.UI.Widgets.render();
CA.UI.Widgets.tick();
const hot = doc.querySelector(`[data-widget="${pan.id}"] [data-pop]`);
assert(hot, 'a pantheon widget with hover popups');
hot.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const box = doc.querySelector('#CookieMgrLayer .ca-float');
assert(box && box.style.display === 'block' && box.style.zoom === '1.5', `its popup is at the widget’s text size (zoom ${box && box.style.zoom})`);
doc.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));

// ---- widget ids from a save: plain ones only
CA.UI.Widgets.load([{ id: 'ok-1', type: 'stats', x: 0.1, y: 0.1 }, { id: 'x"] .evil', type: 'stats', x: 0.2, y: 0.2 }]);
const ids = CA.UI.Widgets.list().map((x) => x.id);
assert(ids.includes('ok-1') && !ids.some((id) => /["\] ]/.test(id)) && ids.length === 2, `odd ids replaced, plain ones kept (${ids})`);

// ---- Pages.scope: everything it set up, undone by close()
const el = doc.createElement('div');
doc.body.appendChild(el);
let clicks = 0;
let ticks = 0;
let mounted = 0;
let unbound = 0;
const s = CA.UI.Pages.scope(el)
  .on('click', () => clicks++)
  .every(30, () => ticks++)
  .child({ mount: () => mounted++, unmount: () => mounted-- })
  .add(() => unbound++);
click(w, el);
await sleep(100);
assert(clicks === 1 && ticks >= 2 && mounted === 1, 'scope: listener, interval, child mounted');
s.close();
const t0 = ticks;
click(w, el);
await sleep(100);
assert(clicks === 1 && ticks === t0 && mounted === 0 && unbound === 1, 'close(): all undone');

// ---- CA.Format (core) is what the charts use
assert(CA.Format.span(3725) === '1h 02m' && CA.Format.short(1234567) === '1.23M' && CA.UI.Plot.fmt.span === CA.Format.span, 'CA.Format, shared with CA.UI.Plot.fmt');
assert(typeof CA.Recorder.recent === 'function' && CA.UI.Graphs.recent(60) === CA.Recorder.recent(60), 'recent averages: the Recorder’s');

// ---- CA.UI.Dom
const btn = doc.createElement('button');
btn.dataset.armLabel = 'Sure?';
btn.textContent = 'Delete';
assert(CA.UI.Dom.armed(btn) === false && btn.textContent === 'Sure?' && btn.classList.contains('ca-armed'), 'armed: first click arms');
assert(CA.UI.Dom.armed(btn) === true && btn.textContent === 'Delete', 'second click goes');
const box2 = doc.createElement('div');
box2.innerHTML = '<span class="a">1</span>';
const span = box2.firstChild;
CA.UI.Dom.morph(box2, '<span class="b">2</span><i>x</i>');
assert(box2.firstChild === span && span.className === 'b' && span.textContent === '2' && box2.children.length === 2, 'morph: same nodes, new text and attributes');
CA.UI.Dom.replay(span, 'ca-shake', 50);
assert(span.classList.contains('ca-shake'), 'replay: the class is on');
await sleep(80);
assert(!span.classList.contains('ca-shake'), '…and off after its time');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
