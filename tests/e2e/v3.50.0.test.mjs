// v3.50.0: every kind of widget can be placed more than once, each copy with its own settings. The Widgets
// page lists placed widgets by kind (copies numbered: "Grimoire 2"), a kind's + adds another, and a widget's
// settings switch between its copies and Duplicate it. Saves and layouts keep every copy.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const Wd = CA.UI.Widgets;
const page = () => doc.querySelector('[data-page="widgets"]');
const tile = (id) => page().querySelector(`.ca-wtile[data-w-tile="${id}"]`);
const ed = () => page().querySelector('[data-w-editor]');
const of = (type) => Wd.list().filter((x) => x.type === type);
const eq = (got, want, what) => assert(got === want, `${what}: ${JSON.stringify(got)}${got === want ? '' : ` (wanted ${JSON.stringify(want)})`}`);

CA.UI.Menu.openPage('widgets');

// ---- every kind takes more than one, from its tile
const kinds = Wd.types().filter((t) => !t.hidden);
kinds.forEach((t) => {
  click(w, tile(t.id));
  const more = tile(t.id).querySelector('.ca-wtile-add');
  assert(more, `${t.id}: a placed tile offers + Add`);
  if (more) click(w, more);
  eq(of(t.id).length, 2, `${t.id}: two placed`);
  eq(tile(t.id).querySelector('.ca-wtag').textContent, '×2', `${t.id}: badge counts`);
});
assert(!kinds.some((t) => t.single), 'no kind is one-only any more');
const two = of('grimoire');
eq(Wd.add('pantheon') !== Wd.add('pantheon'), true, 'add() always places a new one');
eq(of('pantheon').length, 4, 'four Pantheons');
of('pantheon').slice(1).forEach((x) => Wd.remove(x.id));

// ---- names: the second copy is numbered until it gets a name
eq(Wd.labelOf(two[0]), 'Grimoire', 'the first copy keeps the plain name');
eq(Wd.labelOf(two[1]), 'Grimoire 2', 'the second is numbered');

// ---- placed widgets, grouped by kind
CA.UI.Menu.render();
const kind = (type) => page().querySelector(`.ca-wkind[data-w-kind="${type}"]`);
eq(kind('grimoire').querySelectorAll('.ca-wchip').length, 2, 'the Grimoire group holds both chips');
eq([...kind('grimoire').querySelectorAll('.ca-wchip b')].map((b) => b.textContent).join('|'), 'Grimoire|Grimoire 2', 'chips numbered');
eq(kind('grimoire').querySelector('.ca-wkind-n').textContent, '×2', 'the group counts them');
click(w, kind('grimoire').querySelector('.ca-wkind-add'));
eq(of('grimoire').length, 3, "a kind's + adds another");
eq(page().querySelectorAll('.ca-wkind').length, kinds.length, 'one group per kind placed');

// ---- each copy has its own settings
const [g1, g2] = of('grimoire');
click(w, page().querySelector(`.ca-wchip[data-wlink="${g2.id}"] [data-w-page-edit]`));
eq(ed().dataset.wEditor, g2.id, 'the chip opens that copy');
eq(ed().querySelector('.ca-weditor-title b').textContent, 'Grimoire 2', 'its settings say which copy');
const sel = ed().querySelector('select[data-w-opt="target"]');
sel.value = 'custom';
sel.dispatchEvent(new w.Event('change', { bubbles: true }));
eq(g2.target, 'custom', 'copy 2 counts down to a fixed amount');
eq(g1.target, undefined, 'copy 1 untouched');

// ---- the copies switcher
const copies = () => [...ed().querySelectorAll('.ca-wcopies .ca-wcopy')];
eq(copies().map((b) => b.textContent).join(','), '1,2,3', 'numbered copies in the header');
assert(copies()[1].classList.contains('on'), 'the open one lit');
click(w, copies()[0]);
eq(ed().dataset.wEditor, g1.id, 'clicking a number switches to that copy');

// ---- a name of its own (round widgets have no title bar, so it's for the list)
const name = ed().querySelector('input[data-w-opt="title"]');
assert(name, 'round widgets get a Name field');
name.value = 'Spell timer';
name.dispatchEvent(new w.Event('change', { bubbles: true }));
eq(g1.title, 'Spell timer', 'named');
eq(Wd.labelOf(g2), 'Grimoire', 'once copy 1 has a name, copy 2 needs no number');
CA.UI.Menu.render();
assert(/Spell timer/.test(kind('grimoire').textContent), 'the chip shows the name');

// ---- Duplicate: same settings, placed beside it, its settings open
click(w, page().querySelector(`.ca-wchip[data-wlink="${g2.id}"] [data-w-page-edit]`));
click(w, ed().querySelector('[data-w-page-dup]'));
const g4 = of('grimoire')[2];
assert(g4 && g4.id !== g2.id && g4.target === 'custom', 'the duplicate keeps the settings');
assert(Math.abs(g4.x - g2.x) > 0.01 && Math.abs(g4.y - g2.y) > 0.01, 'and sits beside it');
eq(ed().dataset.wEditor, g4.id, "the duplicate's settings show");
g4.targetMagic = 300;
eq(g2.targetMagic, undefined, 'changing the duplicate leaves the original');
const stats = of('stats')[0];
stats.stats = ['cps'];
stats.w = 250;
const sd = Wd.duplicate(stats.id);
assert(sd.stats.join() === 'cps' && sd.stats !== stats.stats && sd.w === 250, 'a framed widget duplicates its lists (copied) and size');
sd.stats.push('bank');
eq(stats.stats.join(), 'cps', 'the copy owns its list');
CA.Macros.setFav('golden', true);
const btn = of('macro')[0];
eq(Wd.duplicate(btn.id), null, 'macro buttons stay one per macro');

// ---- saved and loaded: every copy, with its own settings
const n = Wd.list().length;
const saved = JSON.parse(JSON.stringify(Wd.serialize()));
Wd.load(saved);
eq(Wd.list().length, n, 'every copy loads back');
eq(of('grimoire').map((x) => x.target || 'full').join(','), 'full,custom,custom,full', 'each with its settings');

// ---- layouts keep copies
const pid = Wd.addProfile('Two of everything');
Wd.list()
  .filter((x) => x.type !== 'macro')
  .forEach((x) => Wd.remove(x.id));
eq(of('grimoire').length, 0, 'cleared');
Wd.useProfile(pid);
eq(of('grimoire').length, 4, 'the layout brings back all four Grimoires');
eq(of('grimoire').filter((x) => x.target === 'custom').length, 2, 'with their own settings');
assert(Wd.profileActive(pid), 'and counts as that layout');

// ---- stars: a preset is on while any copy matches it
const preset = { type: 'events', types: ['golden'] };
assert(!Wd.hasPreset(preset), 'no matching events widget yet');
of('events')[1].types = ['golden'];
assert(Wd.hasPreset(preset), 'one copy matching lights the star');

// ---- the shortcut buttons on pages place one, not one per click
Wd.list()
  .filter((x) => x.type === 'pantheon')
  .forEach((x) => Wd.remove(x.id));
CA.UI.Menu.openPage('pantheon');
const add = () => doc.querySelector('[data-page="pantheon"] [data-ca="widget-add"]');
if (add()) {
  click(w, add());
  click(w, add());
  eq(of('pantheon').length, 1, "the Pantheon page's Widget button places one");
}

assert(g.errors.length === 0, `no runtime errors (${g.errors.join('; ')})`);
done();
process.exit();
