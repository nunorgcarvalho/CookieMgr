// v3.25.0: the picker's tiles and the widgets on the panel light up together (hover a tile → every widget of
// that kind glows; hover a widget → its tile), and a placed tile's main action is Remove (the newest, for a
// kind that takes more, which gets a small + Add button for another).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const page = () => doc.querySelector('[data-page="widgets"]');
const tile = (id) => page().querySelector(`.ca-wtile[data-w-tile="${id}"]`);
const onPanel = (id) => doc.querySelector(`#CookieMgrWidgets [data-widget="${id}"]`);
const hover = (el) => el.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

CA.UI.Menu.openPage('widgets');

// ---- a fresh tile: Add
eq(tile('events').querySelector('.ca-wadd').textContent, '+ Add', 'unplaced: the pill adds');
assert(!tile('events').querySelector('.ca-wtile-add'), 'no small Add button before it is placed');
click(w, tile('events'));
click(w, tile('events').querySelector('.ca-wtile-add'));
click(w, tile('events').querySelector('.ca-wtile-add'));
const events = () => CA.UI.Widgets.list().filter((x) => x.type === 'events');
eq(events().length, 3, 'the small Add button adds another each time');
eq(tile('events').querySelector('.ca-wadd').textContent, 'Remove', 'placed: the pill removes');
assert(tile('events').matches('[data-w-page-remove="events"]') && !tile('events').matches('[data-w-page-add]'), 'the tile itself removes');
assert(/3 placed — click to remove the newest/.test(tile('events').querySelector('.ca-wtip-act').textContent), 'the popup says so');

// ---- hover a tile: every widget of its kind glows; hover a widget: its tile lights up
const ids = events().map((x) => x.id);
hover(tile('events'));
assert(ids.every((id) => onPanel(id).classList.contains('ca-w-linked')), 'hovering the tile lights up all three on the panel');
assert(tile('events').classList.contains('linked'), 'and the tile itself');
assert(!tile('pantheon').classList.contains('linked'), 'not other tiles');
hover(page().querySelector('.ca-wshelf-head'));
assert(ids.every((id) => !onPanel(id).classList.contains('ca-w-linked')), 'leaving it, they go quiet');
hover(onPanel(ids[1]));
assert(tile('events').classList.contains('linked'), 'hovering a widget on the panel lights up its tile');
assert(onPanel(ids[1]).classList.contains('ca-w-linked') && !onPanel(ids[0]).classList.contains('ca-w-linked'), 'and only that widget');
hover(doc.body);

// ---- Remove takes the newest of a kind
const newest = ids[2];
click(w, tile('events'));
eq(events().length, 2, 'Remove takes one');
assert(!CA.UI.Widgets.get(newest) && CA.UI.Widgets.get(ids[0]) && CA.UI.Widgets.get(ids[1]), 'the newest one');
eq(tile('events').querySelector('.ca-wtag').textContent, '×2', 'badge follows');
click(w, tile('pantheon'));
assert(tile('pantheon').matches('[data-w-page-remove]') && tile('pantheon').querySelector('.ca-wtile-add'), 'v3.52: every kind gets the small Add (no one-only kinds)');
click(w, tile('pantheon'));
assert(!CA.UI.Widgets.has('pantheon'), 'gone');

assert(g.errors.length === 0, `no runtime errors (${g.errors.join('; ')})`);
done();
process.exit();
