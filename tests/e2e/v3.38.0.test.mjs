// v3.38.0: widget layouts — the whole left panel saved under a name (a Layouts card on the Widgets page:
// Save current layout, then per row Use, Save over it, rename, Delete), Undo back to the layout before the
// last one used, macro buttons follow (their macros' ★), saved with the game; widgets.profile(name) in code,
// with widgets.profileActive / activeProfile / profiles.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const idb = { factory: new IDBFactory(), IDBKeyRange };
const g = boot({ idb, withPantheon: true });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = CA.UI.Widgets;
const S = CA.Script;
const pass1 = (src) => CA.Macros.runPass(S.compile(src).flow);
const val = (src) => S.evaluate(S.compile(`wait until ${src}`).flow[0].cond).ok;
const page = () => doc.querySelector('[data-page="widgets"]');
const card = () => page().querySelector('.ca-wprofs');
const row = (id) => card().querySelector(`[data-wp-row="${id}"]`);
const act = (id, a) => row(id).querySelector(`[data-wp-act="${a}"]`);
const kinds = () => W.list().map((x) => x.type).sort().join(',');
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

// start from an empty panel
W.list().forEach((x) => W.remove(x.id));
CA.Macros.list().forEach((m) => CA.Macros.setFav(m.id, false));
CA.UI.Menu.openPage('widgets');

// ---- the card, empty
assert(card() && /Layouts/.test(card().querySelector('.ca-card-head').textContent), 'a Layouts card on the Widgets page');
assert(/No saved layouts yet/.test(card().textContent), 'nothing saved yet: says so');
assert(card().querySelector('[data-wp-act="new"]').disabled, 'nothing on the panel: nothing to save');
assert(!card().querySelector('[data-wp-act="undo"]'), 'no Undo yet');

// ---- a layout: two framed widgets with settings, a round one scaled, a macro button
const stats = W.add('stats', { x: 0.1, y: 0.2 }, { title: 'My stats', bg: 0.4, font: 130, w: 260, h: 140 });
W.add('pantheon', { x: 0.9, y: 0.1 }, { scale: 1.5 });
W.add('events', { x: 0.2, y: 0.8 }, { count: 5 });
CA.Macros.setFav('golden', true);
const btn = W.list().find((x) => x.type === 'macro');
btn.x = 0.33;
btn.y = 0.44;
CA.UI.Menu.render();
click(w, card().querySelector('[data-wp-act="new"]'));
let ps = W.profiles();
eq(ps.length, 1, 'Save current layout adds one');
const A = ps[0].id;
eq(ps[0].name, 'Layout 1', 'named Layout 1');
eq(ps[0].widgets.length, 4, 'with every widget on the panel');
const savedStats = ps[0].widgets.find((x) => x.type === 'stats');
assert(savedStats.title === 'My stats' && savedStats.bg === 0.4 && savedStats.font === 130 && savedStats.w === 260 && savedStats.h === 140 && savedStats.x === 0.1, 'a widget’s place, size and settings are in it');
assert(ps[0].widgets.some((x) => x.type === 'macro' && x.macro === 'golden' && x.x === 0.33), 'the macro button too, where it was');
assert(row(A) && row(A).querySelector('.ca-wthumb') && row(A).querySelectorAll('.ca-wthumb i').length === 4, 'its row: a picture with a box per widget');
eq(row(A).querySelector('code').textContent, '3 widgets · 1 macro button', 'what it holds');
assert(row(A).classList.contains('on') && row(A).querySelector('.ca-inuse'), 'it’s the one on the panel: In use');
assert(!act(A, 'use') && act(A, 'save').disabled, 'on the panel: no Use, and Save has nothing to do');
assert(val('widgets.profileActive("Layout 1")') && val(`widgets.activeProfile() == "${A}"`), 'profileActive / activeProfile');

// ---- rename
const name = row(A).querySelector('[data-wp-name]');
name.value = 'Combo time';
name.dispatchEvent(new w.Event('change', { bubbles: true }));
eq(W.profileOf('combo time').id, A, 'renamed; found by its name, any case');

// ---- change the panel: the row isn't on any more (the page follows by itself)
W.remove(stats.id);
CA.Macros.setFav('golden', false);
W.add('effectTimers', { x: 0.5, y: 0.5 });
CA.Macros.setFav('bigCookie', true);
await sleep(700);
assert(!row(A).classList.contains('on') && act(A, 'use') && !row(A).querySelector('.ca-inuse'), 'changed: no longer on the panel, Use is back');
assert(!val('widgets.profileActive(A)') && val('widgets.activeProfile() == ""'), 'profileActive false, activeProfile ""');
const before = kinds();

// a second one, from this panel
CA.UI.Menu.render();
click(w, card().querySelector('[data-wp-act="new"]'));
const B = W.profiles()[1].id;
eq(W.profiles()[1].name, 'Layout 2', 'the next is Layout 2');

// ---- Use: the panel becomes the layout, macro ★s follow
click(w, act(A, 'use'));
eq(kinds(), 'events,macro,pantheon,stats', 'Use: exactly its widgets');
const st = W.list().find((x) => x.type === 'stats');
assert(st.title === 'My stats' && st.w === 260 && st.x === 0.1 && st.y === 0.2, 'where they were, as they were');
assert(W.list().find((x) => x.type === 'pantheon').scale === 1.5, 'a scaled round widget keeps its size');
assert(CA.Macros.isFav('golden') && !CA.Macros.isFav('bigCookie'), 'its macro gets its ★; the one it hasn’t loses it');
const mb = W.list().find((x) => x.type === 'macro');
assert(mb && mb.macro === 'golden' && mb.x === 0.33 && mb.y === 0.44, 'the macro button where it was saved');
assert(doc.querySelectorAll('#CookieMgrWidgets [data-widget]').length === 4, 'on the left panel');
assert(row(A).classList.contains('on'), 'it’s on the panel');
assert(card().querySelector('[data-wp-act="undo"]'), 'Undo shows up');

// ---- Undo: back to what was there before
click(w, card().querySelector('[data-wp-act="undo"]'));
eq(kinds(), before, 'Undo: the layout from before');
assert(CA.Macros.isFav('bigCookie') && !CA.Macros.isFav('golden'), '…its ★s too');
assert(!card().querySelector('[data-wp-act="undo"]'), 'and Undo goes');
assert(row(B).classList.contains('on'), 'which is Layout 2');

// ---- Save over a layout (a second click), Delete (a second click)
W.add('status');
CA.UI.Menu.render();
click(w, act(B, 'save'));
assert(!W.profileOf(B).widgets.some((x) => x.type === 'status'), 'Save: the first click only arms');
click(w, act(B, 'save'));
assert(W.profileOf(B).widgets.some((x) => x.type === 'status'), 'the second saves the panel over it');
click(w, act(B, 'delete'));
assert(W.profileOf(B), 'Delete: the first click only arms');
click(w, act(B, 'delete'));
assert(!W.profileOf(B) && !row(B), 'the second deletes it');

// ---- in code
assert(pass1('log widgets.profiles()').trace.some((t) => t.text.includes(A)), 'widgets.profiles()');
eq(pass1('widgets.profile("Combo time")').done, 4, 'widgets.profile(name): places its widgets');
assert(val('widgets.profileActive("Combo time")'), 'and it’s active');
eq(pass1('widgets.profile("Combo time")').done, 0, 'already on: does nothing');
eq(pass1('widgets.profile(nope)').done, 0, 'an unknown one: nothing');
assert(CA.Actions.get('widgets.profile').params[0].options().some((o) => o.v === A && o.label === 'Combo time'), 'the action’s picker lists the layouts');

// ---- saved with the game; a saved layout goes through the same cleaning as the panel's
const saved = JSON.parse(CA.Settings.serialize());
assert(saved.widgetProfiles && saved.widgetProfiles.profiles.length === 1 && saved.widgetProfiles.profiles[0].name === 'Combo time', 'in the save');
saved.widgetProfiles.profiles.push({ id: 'old', name: 'Old', widgets: [{ id: 'x', type: 'goneType', x: 0, y: 0 }, { id: 'bad"id', type: 'events', x: 0.5, y: 0.5, count: 3 }] });
saved.widgetProfiles.profiles.push({ id: 'bad id!', name: 'Nope', widgets: [] });
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: JSON.stringify(saved), withPantheon: true });
await sleep(400);
const W2 = g2.window.CookieMgr.UI.Widgets;
eq(W2.profiles().map((p) => p.name).join(','), 'Combo time,Old', 'loaded from the save (a bad id dropped)');
eq(W2.profileOf('old').widgets.map((x) => x.type).join(','), 'events', 'a type that’s gone is dropped');
eq(W2.useProfile('old'), 1, 'and it still works');
assert(/^[\w-]+$/.test(W2.list()[0].id), 'with a clean id');

assert(g.errors.length === 0, `no runtime errors (${g.errors.join('; ')})`);
assert(g2.errors.length === 0, `no runtime errors after loading (${g2.errors.join('; ')})`);
done();
process.exit();
