// v2.4.0: settings survive without game-save data, group macros, CpS stages, fitted log axis,
// prestige target, widget placement / popups / labels.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const browser = { factory: new IDBFactory(), IDBKeyRange };

function fakeLayout(w) {
  const left = w.document.getElementById('sectionLeft');
  Object.defineProperty(left, 'clientWidth', { get: () => 600 });
  Object.defineProperty(left, 'clientHeight', { get: () => 900 });
  const P = w.HTMLElement.prototype;
  const size = (el, framed, bare) => (el.classList && el.classList.contains('ca-w') ? (el.classList.contains('ca-w-bare') ? bare : framed) : 0);
  Object.defineProperty(P, 'offsetWidth', { get() { return size(this, 200, 40); } });
  Object.defineProperty(P, 'offsetHeight', { get() { return size(this, 100, 40); } });
  Object.defineProperty(P, 'offsetLeft', { get() { return parseFloat(this.style.left) || 0; } });
  Object.defineProperty(P, 'offsetTop', { get() { return parseFloat(this.style.top) || 0; } });
}

// ---- 1. settings come back even when the game save has no CookieMgr data yet
const a = boot({ idb: browser });
await sleep(300);
a.window.CookieMgr.Settings.set('plot.cps.win', 60);
a.window.CookieMgr.Settings.set('rememberStates', true);
a.window.CookieMgr.Macros.set('golden', true);
const mirror = a.window.localStorage.getItem('CookieMgr.settings.v1');
assert(!a.Game.modSaveData.CookieMgr, 'game hasn’t saved CookieMgr data (no autosave yet)');
a.window.close();
const b = boot({ idb: browser, localStorageSeed: { 'CookieMgr.settings.v1': mirror } });
await sleep(300);
const CB = b.window.CookieMgr;
assert(CB.Settings.get('plot.cps.win') === 60, 'settings restored from the local mirror without game-save data');
assert(CB.Macros.isOn('golden'), 'running macros too');
b.window.close();

// ---- main session
const g = boot({ idb: browser });
const { window: w, Game } = g;
fakeLayout(w);
const CA = w.CookieMgr;
const doc = w.document;
Game.cookiesReset = 1e21; // ~1000 prestige levels baked all time
const loop = setInterval(() => {
  const p = Game.cookiesPs / 10;
  Game.cookies += p;
  Game.cookiesEarned += p;
  Game.handmadeCookies += 50;
  Game.cookies += 50;
  Game.cookiesEarned += 50;
}, 100);
await sleep(300);

// ---- 2. group macros
CA.UI.Menu.openPage('clickers');
const pg = () => doc.querySelector('[data-page="clickers"]');
click(w, pg().querySelector('[data-ca="macro-new"]'));
const set = (sel, val) => {
  const el = doc.querySelector(sel);
  if (el.type === 'checkbox') el.checked = val;
  else el.value = val;
  el.dispatchEvent(new w.Event(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
};
set('[data-edit="name"]', 'My clickers');
click(w, doc.querySelector('[data-edit-act="mode"][data-val="group"]'));
assert(doc.querySelector('[data-member="bigCookie"]') && !doc.querySelector('[data-edit="steps.0.action"]') && !doc.querySelector('[data-edit="everySec"]'), 'group: member checklist, no steps or timing');
assert(!doc.querySelector('[data-member="sellAll"]'), 'once macros can’t be members');
click(w, doc.querySelector('[data-edit-act="save"]'));
assert(/Tick at least one/.test(doc.querySelector('.ca-editor-error').textContent), 'needs at least one member');
['bigCookie', 'golden', 'wrath'].forEach((id) => set(`[data-member="${id}"]`, true));
click(w, doc.querySelector('[data-edit-act="save"]'));
const grp = CA.Macros.list().find((m) => m.name === 'My clickers');
assert(grp && grp.mode === 'group' && grp.members.join() === 'bigCookie,golden,wrath' && grp.steps.length === 0, 'group saved');
assert(CA.Macros.triggerText(grp) === 'group of 3', 'trigger text');
const row = () => doc.querySelector(`[data-macro-row="${grp.id}"]`);
assert(row().querySelectorAll('.ca-step-member').length === 3, 'row lists the members');
CA.Macros.set('golden', false);
click(w, row().querySelector('[data-ca="macro-toggle"]'));
assert(['bigCookie', 'golden', 'wrath'].every((id) => CA.Macros.isOn(id)) && CA.Macros.isOn(grp.id), 'switching the group on turns all members on');
CA.Macros.set('wrath', false);
assert(!CA.Macros.isOn(grp.id), 'a member switched off elsewhere → group shows off');
CA.Macros.toggle(grp.id);
assert(CA.Macros.isOn('wrath') && CA.Macros.isOn(grp.id), 'toggling again turns the rest on');
CA.Settings.setHotkey(`macro.${grp.id}`, 'KeyY');
w.dispatchEvent(new w.KeyboardEvent('keydown', { code: 'KeyY', bubbles: true }));
assert(['bigCookie', 'golden', 'wrath'].every((id) => !CA.Macros.isOn(id)) && !CA.Macros.isOn(grp.id), 'hotkey switches the whole group off');
click(w, row().querySelector('[data-ca="macro-edit"]'));
assert(doc.querySelector('[data-member="golden"]').checked && !doc.querySelector(`[data-member="${grp.id}"]`), 'editing shows its members (and not itself)');
click(w, doc.querySelector('[data-edit-act="cancel"]'));
assert(CA.Actions.get('macro.set').params[0].options().some((o) => o.v === grp.id), 'groups can be switched by other macros');

// ---- 3. CpS as three stages
Game.buffs['Click frenzy'] = { name: 'Click frenzy', time: 3000, maxTime: 3000, multClick: 777 };
Game.shimmerTypes.golden.popFunc({ gain: 50000 });
await sleep(2300);
const f = CA.Recorder.frames()[CA.Recorder.frames().length - 1];
assert(Number.isFinite(f.clickRaw) && Math.abs(f.clickRaw - f.clickRate * f.perClickRaw) < 1e-6, `raw clicking = clicks/s × raw per-click (${f.clickRaw})`);
delete Game.buffs['Click frenzy'];
CA.UI.Menu.openPage('graphs');
click(w, doc.querySelector('[data-graph-tab="cookies"]'));
CA.UI.Graphs.tick();
const table = doc.querySelector('[data-plot="cps"] .ca-stages');
const labels = [...table.querySelectorAll('tbody tr td:first-child')].map((td) => td.childNodes[1].textContent);
assert(labels.join('|') === 'Raw production|+ raw clicking|Actual|Clicking adds (2 ÷ 1)|Effects & golden add (3 ÷ 2)|Total (3 ÷ 1)|Clicks per second', `stage rows (${labels.join('|')})`);
const r = CA.UI.Graphs.recent(60);
assert(r.base <= r.base + r.clickRaw && r.base + r.clickRaw <= r.actual, `stages increase: ${r.base} ≤ ${r.base + r.clickRaw} ≤ ${r.actual}`);
assert(!table.querySelector('[title]'), 'row explanations shown in the table, not as browser tooltips');

// ---- 4. fitted log axis
const LT = CA.UI.Plot.logTicks;
const narrow = LT(1e12 / 1.25, 1.3e12 * 1.08);
assert(narrow.length >= 2 && narrow.every((t) => t >= 8e11 && t <= 1.41e12), `narrow range gets ticks inside it (${narrow})`);
assert(LT(1, 1e6).join() === [1, 10, 100, 1000, 1e4, 1e5, 1e6].filter((_, i) => true).join() || LT(1, 1e6).length <= 7, `wide range: powers of ten (${LT(1, 1e6)})`);
assert(LT(1, 1e6).every((t) => Math.log10(t) % 1 === 0), 'powers of ten only on wide ranges');

// ---- 5. prestige target
click(w, doc.querySelector('[data-graph-tab="prestige"]'));
await sleep(50);
const card = () => doc.querySelector('[data-ptarget]');
assert(card() && /Pick a level/.test(card().textContent), 'target card with a prompt');
set('[data-ptarget-num]', '2');
set('[data-ptarget-unit]', '3');
assert(CA.Settings.get('prestigeTargetNum') === 2 && CA.Settings.get('prestigeTargetUnit') === 3, 'number + magnitude saved');
const out = card().querySelector('[data-ptarget-out]').textContent;
assert(/Levels to go/.test(out) && /Cookies to go/.test(out) && /Reached in/.test(out) && card().querySelector('.ca-progress-fill'), `target progress (${out.slice(0, 120)})`);
set('[data-ptarget-num]', '1500');
assert(CA.Settings.get('prestigeTargetNum') === 999, 'capped at 999');
set('[data-ptarget-num]', '1');
set('[data-ptarget-unit]', '0');
assert(/already/.test(card().textContent), 'a target below your level says so');
set('[data-ptarget-num]', '1');
set('[data-ptarget-unit]', '3');
await sleep(1100);
CA.UI.Graphs.tick();
const pl = CA.UI.Plot.get('prestige').last();
assert(pl.data.hlines.length === 1 && pl.data.hlines[0].v === 1000, 'target drawn on the prestige chart');

// ---- 6. widgets: placement, labels, popups
const favs = CA.Macros.list().filter((m) => m.mode !== 'group').slice(0, 15);
favs.forEach((m) => CA.Macros.setFav(m.id, true));
const btns = CA.UI.Widgets.list().filter((x) => x.type === 'macro');
const px = (x) => ({ x: Math.round(x.x * (600 - 44)), y: Math.round(x.y * (900 - 44)) });
const p0 = px(btns[0]);
const p1 = px(btns[1]);
assert(p0.x > 500 && p0.y > 800, `first button bottom-right (${p0.x},${p0.y})`);
assert(p1.x === p0.x && p1.y === p0.y - 44, `second one stacked above (${p1.x},${p1.y})`);
const cols = new Set(btns.map((x) => px(x).x));
const wrapped = btns.find((x) => px(x).x < p0.x);
assert(cols.size === 2 && px(wrapped).y === p0.y, `a full column wraps to the next one on the left, from the bottom (${[...cols]})`);
assert(Math.min(...btns.map((x) => px(x).y)) >= 900 * 0.35 - 1, 'columns stop below the sidebar');
assert(!doc.querySelector('#CookieMgrWidgets [title]'), 'no browser tooltips on widgets');
const label = doc.querySelector(`#CookieMgrWidgets [data-w-trigger="${favs[0].id}"]`).parentNode.querySelector('.ca-wb-label');
assert(label.querySelector('b').textContent === favs[0].name && /off|on|run/.test(label.querySelector('em').textContent), 'label: name + state');
CA.UI.Menu.openPage('widgets');
click(w, doc.querySelector('[data-w-page-add="status"]'));
CA.Macros.set('bigCookie', true);
await sleep(400);
CA.UI.Widgets.tick();
const item = doc.querySelector('#CookieMgrWidgets .ca-wbar-item');
const pop = item.querySelector('.ca-wpop');
assert(pop && /Big cookie/.test(pop.textContent) && pop.querySelector('.ca-wpop-row'), 'status icon has a styled popup with its actions');
await sleep(600);
CA.UI.Widgets.tick();
assert(doc.querySelector('#CookieMgrWidgets .ca-wbar-item') === item && item.querySelector('.ca-wpop') === pop, 'refreshes in place (hover isn’t lost)');
CA.Macros.set('bigCookie', false);
const css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
assert(/#CookieMgrWidgets \.ca-w:hover,[\s\S]{0,60}z-index: 20/.test(css), 'hovered widget comes to the front');
assert(/0 0 0 4px #4dff5e/.test(css), 'starker green ring');

clearInterval(loop);
assert(a.errors.length + b.errors.length + g.errors.length === 0, 'no runtime errors' + [a, b, g].map((x) => (x.errors.length ? `: ${x.errors[0]}` : '')).join(''));
done();
process.exit();
