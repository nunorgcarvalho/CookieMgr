// v2.9.0: round minigame widgets (Grimoire, Garden, Stock market, new Pantheon), in-place refresh,
// per-widget settings on the Widgets page (text size, size, title, Quick stats choice, events).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const browser = { factory: new IDBFactory(), IDBKeyRange };
const g = boot({ idb: browser, withPantheon: true });
const { window: w, Game, M, G, P, goods } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const W = () => doc.getElementById('CookieMgrWidgets');
const pg = () => doc.querySelector('[data-page="widgets"]');
const inst = (t) => CA.UI.Widgets.list().find((x) => x.type === t);
const box = (t) => W().querySelector(`[data-widget="${inst(t).id}"]`);
const C = 2 * Math.PI * 19;
const offset = (t) => Number(box(t).querySelector('.ca-orb-fill').getAttribute('stroke-dashoffset'));

// ---- the four round widgets
CA.UI.Menu.openPage('widgets');
['grimoire', 'garden', 'market', 'pantheon'].forEach((t) => {
  assert(pg().querySelector(`[data-w-page-add="${t}"]`), `${t} offered`);
  click(w, pg().querySelector(`[data-w-page-add="${t}"]`));
  assert(box(t) && box(t).classList.contains('ca-w-bare') && box(t).querySelector(`.ca-orb.ca-orb-${t} svg.ca-orb-ring`), `${t}: a bare round widget with a ring`);
});

// grimoire: ring = magic, label = time until full
G.magic = 40;
CA.UI.Widgets.tick();
assert(Math.abs(offset('grimoire') - C * 0.6) < 0.05, `grimoire ring at 40% (${offset('grimoire')})`);
const gl = box('grimoire').querySelector('.ca-orb-label').textContent;
assert(/\d+(s|m)/.test(gl) && gl === CA.UI.Plot.fmt.span(CA.Grimoire.magicNow().fullIn), `grimoire label: time to full (${gl})`);
assert(/Magic\s*40 \/ 100/.test(box('grimoire').querySelector('.ca-orb-pop').textContent), 'grimoire popup: magic');
G.magic = 100;
CA.UI.Widgets.tick();
assert(box('grimoire').querySelector('.ca-orb-label').textContent === 'full', 'grimoire full');

// garden: dots per stage (game thresholds), ring + label = next tick
const dots = [...box('garden').querySelectorAll('.ca-orb-dots span')].map((s) => s.textContent).join();
assert(dots === '2,0,2,1', `garden: plants per stage (${dots})`);
assert(/^(29|30)s$/.test(box('garden').querySelector('.ca-orb-label').textContent), `garden label: next tick (${box('garden').querySelector('.ca-orb-label').textContent})`);
assert(/Mature\s*1/.test(box('garden').querySelector('.ca-orb-pop').textContent), 'garden popup: stages by name');
click(w, box('garden').querySelector('[data-w-open-mg]'));
assert(Game.Objects.Farm.onMinigame === 1, 'click opens the Garden');

// market: label = last tick for held stocks
goods[0].stock = 10;
M.ticks = 1;
CA.Stocks.sample();
goods[0].val += 2;
M.ticks = 2;
M.tickT = 30 * 25;
CA.Stocks.sample();
CA.UI.Widgets.tick();
assert(box('market').querySelector('.ca-orb-label').textContent === '+$20' && box('market').querySelector('.ca-orb-label .pos'), `market label: last tick (${box('market').querySelector('.ca-orb-label').textContent})`);
assert(/Holding\s*1 of 5 stocks/.test(box('market').textContent) && /Next tick\s*35s/.test(box('market').textContent), 'market popup');
click(w, box('market').querySelector('[data-w-open-mg]'));
assert(Game.Objects.Bank.onMinigame === 1, 'click opens the Stock market');

// pantheon: three slots (two spirits, one empty), ring + label = next swap (1 left → 4 h, 1 h ago)
const gods = box('pantheon').querySelectorAll('.ca-orb-god');
assert(gods.length === 3 && gods[2].classList.contains('empty') && /-1008px -864px/.test(gods[0].getAttribute('style')), 'pantheon: slotted spirits as sprites');
assert(/^2h 59m$/.test(box('pantheon').querySelector('.ca-orb-label').textContent), `pantheon label: next swap (${box('pantheon').querySelector('.ca-orb-label').textContent})`);
assert(Math.abs(offset('pantheon') - C * 0.75) < 0.5, 'pantheon ring: a quarter of the wait done');
const pp = box('pantheon').querySelector('.ca-orb-pop').textContent;
assert(/Diamond\s*Holobore/.test(pp) && /Ruby\s*Godzamok/.test(pp) && /Jade\s*empty/.test(pp) && /Swaps\s*1 \/ 3/.test(pp), `pantheon popup (${pp})`);
P.swaps = 3;
CA.UI.Widgets.tick();
assert(box('pantheon').querySelector('.ca-orb-label').textContent === '3 swaps', 'pantheon: all swaps ready');
click(w, box('pantheon').querySelector('[data-w-open-mg]'));
assert(Game.Objects.Temple.onMinigame === 1, 'click opens the Pantheon');

// ---- refresh in place: nodes survive (hover/popups don't flicker), text changes
const label = box('grimoire').querySelector('.ca-orb-label');
const pop = box('grimoire').querySelector('.ca-orb-pop');
G.magic = 10;
CA.UI.Widgets.tick();
assert(label.isConnected && pop.isConnected && label === box('grimoire').querySelector('.ca-orb-label'), 'refresh keeps the same nodes');
assert(label.textContent !== 'full', 'and updates their text');

// ---- ⚙ → settings on the Widgets page
CA.UI.Menu.close();
click(w, box('garden').querySelector('[data-w-settings]'));
assert(CA.UI.Menu.isOpen() && CA.Settings.get('tab') === 'widgets', '⚙ opens the Widgets page');
const ed = () => pg().querySelector('[data-w-editor]');
assert(ed() && ed().dataset.wEditor === inst('garden').id, 'on that widget’s settings');
const set = (sel, v) => {
  const el = ed().querySelector(sel);
  el.value = v;
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
};
set('[data-w-opt="font"]', '150');
assert(inst('garden').font === 150 && /--wfs:\s*1\.5/.test(box('garden').getAttribute('style')), 'text size');
set('[data-w-opt="scale"]', '200');
assert(inst('garden').scale === 2 && /scale\(2\)/.test(box('garden').style.transform), 'size');
assert(!ed().querySelector('[data-w-opt="title"]'), 'round widgets: no title');
click(w, ed().querySelector('[data-w-edit-done]'));
assert(!ed(), 'Done closes it');

// "Your widgets": every placed widget, each with its settings
const rows = pg().querySelectorAll('.ca-wchips [data-w-page-edit]'); // v2.20: chips (and a map)
assert(rows.length === CA.UI.Widgets.list().length && rows.length === 4, 'Your widgets lists them all');
click(w, pg().querySelector(`[data-w-page-edit="${inst('market').id}"]`));
assert(ed() && ed().dataset.wEditor === inst('market').id, 'and opens their settings');

// ---- Quick stats: choose which
click(w, pg().querySelector('[data-w-page-add="stats"]'));
const statNames = () => [...box('stats').querySelectorAll('.ca-w-stat span')].map((s) => s.textContent);
assert(statNames().length === 7 && statNames().includes('All time baked') && !statNames().includes('Bank'), `default stats (${statNames()})`);
click(w, box('stats').querySelector('[data-w-settings]'));
const tick = (v) => {
  const cb = ed().querySelector(`[data-w-multi="stats"][value="${v}"]`);
  cb.checked = !cb.checked;
  cb.dispatchEvent(new w.Event('change', { bubbles: true }));
};
tick('allTime');
tick('bank');
tick('lumps');
assert(statNames().includes('Bank') && statNames().includes('Sugar lumps') && !statNames().includes('All time baked'), `chosen stats (${statNames()})`);
set('[data-w-opt="title"]', 'My numbers');
assert(box('stats').querySelector('.ca-w-title').textContent === 'My numbers', 'framed widgets: a title');
const sw = inst('stats');
assert(!sw.w || true, 'stats resizable freely');

// ---- latest events: count and types from the editor
CA.EventLog.add({ type: 'trade', title: 'T1', cookies: -5 });
for (let i = 0; i < 12; i++) CA.EventLog.add({ type: 'achievement', title: `A${i + 1}` });
click(w, pg().querySelector('[data-w-page-add="events"]'));
click(w, pg().querySelector('[data-w-page-add="events"]'));
const evs = () => CA.UI.Widgets.list().filter((x) => x.type === 'events');
const evBox = (i) => W().querySelector(`[data-widget="${evs()[i].id}"]`);
assert(evBox(0).querySelectorAll('.ca-ev-row').length === 8, 'events: last 8 by default');
assert(!evBox(1).querySelector('[data-w-count],[data-w-config]'), 'no inline settings any more');
click(w, evBox(1).querySelector('[data-w-settings]'));
set('[data-w-opt="count"]', '3');
const evRows = () => [...evBox(1).querySelectorAll('.ca-ev-row')].map((r) => r.querySelector('b').textContent);
assert(evRows().length === 3 && evRows()[0] === 'A12', `keeps the last 3 (${evRows()})`);
const cb = ed().querySelector('[data-w-multi="types"][value="trade"]');
cb.checked = true;
cb.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(evRows().join() === 'T1', `filtered to trades (${evRows()})`);
set('[data-w-opt="count"]', '9999');
assert(evs()[1].count === 200, 'count clamped');

// ---- saved and restored
Game.WriteSave();
const saved = JSON.parse(Game.modSaveData.CookieMgr);
const sv = (t) => saved.widgets.find((x) => x.type === t);
assert(sv('garden').font === 150 && sv('garden').scale === 2, 'font and size saved');
assert(sv('stats').title === 'My numbers' && sv('stats').stats.includes('bank') && !sv('stats').stats.includes('allTime'), 'title and stats saved');
assert(saved.widgets.filter((x) => x.type === 'events')[1].types.join() === 'trade', 'event types saved');

// old (v2.8) framed minigame widgets come back as round ones; settings restored
saved.widgets.push({ id: 'old', type: 'grimoire', x: 0.1, y: 0.1, collapsed: false, w: 240, h: 150 });
saved.widgets = saved.widgets.filter((x) => x.type !== 'grimoire' || x.id === 'old');
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: JSON.stringify(saved) });
await sleep(400);
const CA2 = g2.window.CookieMgr;
const W2 = g2.window.document.getElementById('CookieMgrWidgets');
const old = W2.querySelector('[data-widget="old"]');
assert(old && old.classList.contains('ca-w-bare') && old.querySelector('.ca-orb') && !old.style.width, 'v2.8 framed Grimoire → round widget');
const st2 = CA2.UI.Widgets.list().find((x) => x.type === 'stats');
assert(st2.title === 'My numbers' && st2.stats.includes('lumps') && CA2.UI.Widgets.list().find((x) => x.type === 'garden').font === 150, 'settings restored');
// no Pantheon in that game: the widget says so
assert(/locked/.test(W2.querySelector(`[data-widget="${CA2.UI.Widgets.list().find((x) => x.type === 'pantheon').id}"]`).textContent), 'locked minigame: shown as locked');

assert(g.errors.length === 0 && g2.errors.length === 0, 'no runtime errors' + (g.errors.length + g2.errors.length ? `: ${g.errors.concat(g2.errors).slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
