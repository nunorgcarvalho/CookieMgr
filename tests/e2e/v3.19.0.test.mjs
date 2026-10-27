// v3.19.0: the Golden cookies widget (the ring) is gone — the Next golden cookie widget replaces it. A saved layout
// that still has one loads without it, keeping the rest; the Golden cookies macro is untouched.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);

const ids = CA.UI.Widgets.types().map((t) => t.id);
assert(!ids.includes('golden'), `no Golden cookies widget type (${ids.join()})`);
assert(ids.includes('goldenNext') && ids.includes('goldenTimeline'), 'the Next golden cookie widget and the Golden timeline stay');
assert(!CA.UI.Widgets.add('golden'), 'it can’t be added');
assert(!('sparkline' in CA.UI.SpawnView), 'its sparkline went with it');

CA.UI.Menu.openPage('widgets');
const gallery = [...doc.querySelectorAll('.ca-wgallery .ca-wcard-name')].map((n) => n.textContent);
assert(!gallery.some((t) => /^Golden cookies/.test(t)) && gallery.some((t) => /^Next golden cookie/.test(t)), `the Widgets page offers it no more (${gallery.join(' | ')})`);

// an old save with the ring among other widgets
CA.UI.Widgets.load([
  { id: 'w1', type: 'golden', x: 0.1, y: 0.2, collapsed: false, scale: 1.5 },
  { id: 'w2', type: 'garden', x: 0.3, y: 0.4, collapsed: false },
  { id: 'w3', type: 'goldenNext', x: 0.5, y: 0.6, collapsed: false },
]);
CA.Settings.set('widgetsShown', true);
CA.UI.Widgets.render();
CA.UI.Widgets.tick();
const list = CA.UI.Widgets.list();
assert(list.map((x) => x.type).join() === 'garden,goldenNext', `an old save loads without it, the rest kept (${list.map((x) => x.type)})`);
assert(list[0].x === 0.3 && list[0].y === 0.4, 'the others stay where they were');
assert(doc.querySelector('[data-widget="w3"]') && !doc.querySelector('[data-widget="w1"]') && !doc.querySelector('#CookieMgrWidgets .ca-orb-golden'), 'on the panel: no ring');
assert(!JSON.stringify(CA.UI.Widgets.serialize()).includes('"golden"'), 'and the next save leaves it out');

assert(CA.Macros.get('golden') && CA.Macros.get('golden').name === 'Golden cookies', 'the Golden cookies macro stays');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
