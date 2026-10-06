// v2.20.0: Your widgets as a map of the left panel + chips; hovering links a widget on the page with
// the widget itself (both ways); the redesigned widget settings.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = () => doc.getElementById('CookieMgrWidgets');
const pg = () => doc.querySelector('[data-page="widgets"]');
const over = (el) => el.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));

['stats', 'grimoire', 'garden'].forEach((t) => CA.UI.Widgets.add(t));
CA.Macros.setFav('golden', true);
const ids = CA.UI.Widgets.list().map((x) => x.id);
CA.UI.Menu.openPage('widgets');

// ---- the map and the chips
const items = [...pg().querySelectorAll('.ca-wmap .ca-wmap-item')];
assert(items.length === 4 && items.every((el) => /left:[\d.]+%/.test(el.getAttribute('style'))), `a map item per widget, placed in % (${items.length})`);
assert(pg().querySelector('.ca-wmap-item.bare') && pg().querySelector('.ca-wmap-item:not(.bare)'), 'round and framed widgets drawn differently');
const chips = [...pg().querySelectorAll('.ca-wchips .ca-wchip')];
assert(chips.length === 4 && /Golden cookies/.test(chips.map((c) => c.textContent).join()), 'and a chip each (a macro button by its macro’s name)');
assert(!pg().querySelector('.ca-list .ca-row [data-w-page-edit]'), 'no more boring rows');

// ---- linking, page → widget
const stats = CA.UI.Widgets.list().find((x) => x.type === 'stats');
over(pg().querySelector(`.ca-wchip[data-wlink="${stats.id}"] b`));
assert(W().querySelector(`[data-widget="${stats.id}"]`).classList.contains('ca-w-linked'), 'hovering a chip lights up the widget');
assert(pg().querySelector(`.ca-wmap-item[data-wlink="${stats.id}"]`).classList.contains('linked'), '… and its spot on the map');
over(pg().querySelector('.ca-card-note') || pg());
assert(!W().querySelector('.ca-w-linked'), 'and goes out after');

// ---- linking, widget → page
const grim = CA.UI.Widgets.list().find((x) => x.type === 'grimoire');
over(W().querySelector(`[data-widget="${grim.id}"] .ca-orb-label`));
assert(pg().querySelector(`.ca-wchip[data-wlink="${grim.id}"]`).classList.contains('linked') && pg().querySelector(`.ca-wmap-item[data-wlink="${grim.id}"]`).classList.contains('linked'), 'hovering the widget lights up its chip and map spot');
W().dispatchEvent(new w.MouseEvent('mouseleave', {}));
assert(!pg().querySelector('.ca-wchip.linked'), 'leaving the panel clears it');

// ---- click → settings, which glow the widget
click(w, pg().querySelector(`.ca-wmap-item[data-wlink="${grim.id}"]`));
const ed = () => pg().querySelector('[data-w-editor]');
assert(ed() && ed().dataset.wEditor === grim.id, 'a map spot opens its settings');
assert(W().querySelector(`[data-widget="${grim.id}"]`).classList.contains('ca-w-linked'), 'the edited widget glows');
assert(ed().querySelectorAll('.ca-weditor-sec').length === 3 && /Look/.test(ed().textContent) && /Shows/.test(ed().textContent) && /Place/.test(ed().textContent), 'settings in sections: Look, Shows, Place (v2.23)');
assert(ed().querySelector('.ca-weditor-head [data-w-page-del]') && ed().querySelector('.ca-weditor-head [data-w-edit-done]'), 'Remove and Done in its header');
const size = ed().querySelector('input[data-w-opt="font"]');
size.value = '140';
size.dispatchEvent(new w.Event('input', { bubbles: true }));
assert(grim.font === 140 && ed().querySelector('.ca-range-val').textContent === '140%', 'live value');
assert(W().querySelector(`[data-widget="${grim.id}"]`).classList.contains('ca-w-linked'), 'still glowing after the redraw');
click(w, ed().querySelector('[data-w-edit-done]'));
assert(!ed(), 'Done');
CA.UI.Menu.close();
assert(!W().querySelector('.ca-w-linked'), 'nothing glows once the page is closed');
// closing doesn't redraw the widgets (things you hold on to stay)
const el = W().querySelector(`[data-widget="${grim.id}"]`);
CA.UI.Menu.openPage('widgets');
CA.UI.Menu.close();
assert(el.isConnected, 'widgets not rebuilt by opening/closing the page');

// ---- remove from a chip
CA.UI.Menu.openPage('widgets');
click(w, pg().querySelector(`.ca-wchip[data-wlink="${stats.id}"] [data-w-page-del]`));
assert(!CA.UI.Widgets.get(stats.id) && pg().querySelectorAll('.ca-wchip').length === 3, '× on a chip removes it');
void ids;

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
