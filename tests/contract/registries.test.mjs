// Contract tests: every registered page, widget type, action, condition, value, library entry,
// option and built-in macro is checked against what the rest of CookieMgr expects of it. New
// ones are covered the moment they're registered.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';
import { makeGarden } from '../harness/gardenStub.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w, Game } = g;
const CA = w.CookieMgr;
const doc = w.document;
makeGarden(Game);
await sleep(400);
Game.cookies = 1e15;

const icon = (n) => !n || CA.UI.Icons.has(n);
const errorsSince = (k) => g.errors.slice(k).join(' | ').slice(0, 400);
/** Collects the problems of one kind and asserts once: "every X …" (with the offenders). */
function every(what, items, check) {
  const bad = [];
  items.forEach((it) => {
    let r;
    try {
      r = check(it);
    } catch (e) {
      r = `threw ${(e && e.message) || e}`;
    }
    if (r !== true) bad.push(`${it.id || it.key || it}: ${r === false ? 'no' : r}`);
  });
  assert(!bad.length, `every ${what} (${items.length})${bad.length ? ` — ${bad.slice(0, 8).join('; ')}` : ''}`);
}

// ---- actions --------------------------------------------------------------------------------
const actions = CA.Actions.all();
const PARAM_TYPES = ['select', 'number', 'bool'];
function paramsOk(params) {
  for (const p of params || []) {
    if (!p.key || !p.label) return `a param without key/label`;
    if (!PARAM_TYPES.includes(p.type)) return `param ${p.key}: type ${p.type}`;
    if (p.type === 'select') {
      const opts = typeof p.options === 'function' ? p.options() : p.options;
      if (!Array.isArray(opts)) return `param ${p.key}: options() isn't a list`;
      if (opts.some((o) => o == null || o.v === undefined || o.label == null)) return `param ${p.key}: an option without v/label`;
      if (opts.length && p.default !== '' && !opts.some((o) => o.v === p.default)) return `param ${p.key}: default ${JSON.stringify(p.default)} isn't an option`;
    }
    if (p.type === 'number' && typeof p.default !== 'number') return `param ${p.key}: number default ${p.default}`;
    if (p.type === 'bool' && typeof p.default !== 'boolean') return `param ${p.key}: bool default ${p.default}`;
  }
  return true;
}
assert(actions.length > 20, `actions registered (${actions.length})`);
every('action is well-formed (id, name, icon, group, params)', actions, (a) => {
  if (!/^[a-zA-Z][\w]*(\.[\w]+)*$/.test(a.id)) return `id “${a.id}”`;
  if (!a.name || !a.group) return 'name/group';
  if (!icon(a.icon)) return `icon ${a.icon}`;
  return paramsOk(a.params);
});
every('action describes itself', actions, (a) => typeof CA.Actions.describe({ action: a.id, params: {} }) === 'string');
let k0 = g.errors.length;
every('action runs with its defaults and returns a count', actions, (a) => {
  const n = CA.Actions.run(a.id, {});
  return typeof n === 'number' && n >= 0 ? true : `returned ${n}`;
});
CA.Macros.runningIds().forEach((id) => CA.Macros.set(id, false, { silent: true }));
assert(g.errors.length === k0, `actions ran without page errors ${errorsSince(k0)}`);

// ---- conditions -----------------------------------------------------------------------------
const conds = CA.Conditions.all();
every('condition is well-formed', conds, (c) => (!c.name ? 'name' : !icon(c.icon) ? `icon ${c.icon}` : paramsOk(c.params)));
every('condition tests to a boolean and describes itself', conds, (c) => {
  const when = { all: [{ cond: c.id, params: CA.Conditions.paramsFor(c.id), not: false }] };
  const r = CA.Conditions.test(when);
  if (typeof r !== 'boolean') return `test → ${r}`;
  const d = CA.Conditions.describe(when);
  return typeof d === 'string' && d.length > 0 ? true : `describe → ${d}`;
});

// ---- values + the library -------------------------------------------------------------------
every('value has an id, a description and a getter', CA.Script.VALUES, (v) => (v.id && v.desc && typeof v.get === 'function') || 'id/desc/get');
const lib = CA.Script.library();
/** The library entry as a whole line of code (keywords get a body where they have a blank). */
function asCode(it) {
  if (it.kind === 'action') return it.insert;
  if (it.kind === 'condition') return `wait until ${it.insert}`;
  if (it.kind === 'value') return `wait until ${it.insert} >= 0`;
  return it.insert
    .split('\n')
    .map((l) => (l.trim() ? l : `${l}log "x"`))
    .join('\n');
}
every('library entry compiles as inserted', lib, (it) => {
  const { errors } = CA.Script.compile(asCode(it));
  return errors.length ? `${it.kind} ${it.id}: line ${errors[0].line} ${errors[0].message}` : true;
});
every('value evaluates without throwing', lib.filter((it) => it.kind === 'value'), (it) => {
  const { flow } = CA.Script.compile(asCode(it));
  const r = CA.Script.evaluate(flow[0].cond);
  return typeof r.ok === 'boolean' && typeof r.text === 'string' ? true : JSON.stringify(r);
});

// ---- the language round-trips ---------------------------------------------------------------
const strip = (x) =>
  JSON.parse(
    JSON.stringify(x, function (k, v) {
      if (k === 'line') return undefined;
      if (k === 'params' && this.type === 'do') return CA.Actions.paramsFor(this.action, v);
      if (k === 'params' && this.t === 'cond') return CA.Conditions.paramsFor(this.id, v);
      return v;
    })
  );
const roundTrip = (src) => {
  const a = CA.Script.compile(src);
  if (a.errors.length) return `compile: line ${a.errors[0].line} ${a.errors[0].message}`;
  const back = CA.Script.decompile(a.flow);
  const b = CA.Script.compile(back);
  if (b.errors.length) return `recompile: line ${b.errors[0].line} ${b.errors[0].message}\n${back}`;
  return JSON.stringify(strip(a.flow)) === JSON.stringify(strip(b.flow)) ? true : `decompiled code compiles differently:\n${back}`;
};

// ---- built-in macros ------------------------------------------------------------------------
const builtins = CA.Macros.list().filter((m) => m.builtin);
const MODES = ['repeat', 'when', 'once', 'group', 'flow'];
every('built-in macro is well-formed', builtins, (m) => {
  if (!MODES.includes(m.mode)) return `mode ${m.mode}`;
  if (!m.name) return 'name'; // desc may be empty (the spells show the game's own text)
  if (m.mode !== 'once' && m.mode !== 'group' && m.mode !== 'flow' && !(m.every >= CA.Macros.MIN_EVERY)) return `every ${m.every}`;
  for (const s of m.steps || []) if (!CA.Actions.get(s.action)) return `unknown action ${s.action}`;
  for (const c of (m.when && m.when.all) || []) if (!CA.Conditions.get(c.cond)) return `unknown condition ${c.cond}`;
  for (const id of m.members || []) if (!CA.Macros.get(id)) return `unknown member ${id}`;
  return true;
});
every('algorithmic built-in compiles and round-trips', builtins.filter((m) => m.mode === 'flow'), (m) => roundTrip(CA.Macros.sourceOf(m.id)));
every('garden profile’s default rules round-trip', [{ id: 'default rules' }], () => roundTrip(CA.Garden.defaultRules()));
k0 = g.errors.length;
every('repeat / once built-in runs once without throwing', builtins.filter((m) => m.mode === 'repeat' || m.mode === 'once'), (m) => {
  CA.Macros.runOnce(m.id);
  return true;
});
CA.Macros.runningIds().forEach((id) => CA.Macros.set(id, false, { silent: true }));
assert(g.errors.length === k0, `built-ins ran without page errors ${errorsSince(k0)}`);

// ---- options --------------------------------------------------------------------------------
const opts = CA.Settings.definitions();
every('option has a key, a group and a default', opts, (o) => (o.key && typeof o.group === 'string' && o.default !== undefined) || 'key/group/default');
every('option key is unique', opts, (o) => opts.filter((x) => x.key === o.key).length === 1);
every('shown option has a name and a valid icon', opts.filter((o) => !/hidden$/.test(o.group) && o.group !== 'ui'), (o) => (o.name ? icon(o.icon) || `icon ${o.icon}` : 'name'));

// ---- pages ----------------------------------------------------------------------------------
const pages = CA.UI.Pages.list();
every('page is well-formed (id, label, icon)', pages, (p) => (p.label && icon(p.icon) && typeof p.html === 'function') || 'label/icon/html');
k0 = g.errors.length;
every('page opens, renders and refreshes', pages, (p) => {
  CA.UI.Menu.openPage(p.id);
  const el = doc.querySelector(`[data-page="${p.id}"]`);
  if (!el) return 'no [data-page] element';
  if (el.textContent.trim().length < 10) return 'empty';
  p.tick();
  p.tick();
  return true;
});
await sleep(700); // their timers run once or twice
assert(g.errors.length === k0, `pages without page errors ${errorsSince(k0)}`);

// leaving a page undoes what it set up: its intervals and its listeners on the page element
{
  const live = new Set();
  const [si, ci] = [w.setInterval, w.clearInterval];
  w.setInterval = (...a) => {
    const id = si.apply(w, a);
    live.add(id);
    return id;
  };
  w.clearInterval = (id) => (live.delete(id), ci.call(w, id));
  const listeners = new Map(); // element → count of listeners added and not removed
  const [ael, rel] = [w.EventTarget.prototype.addEventListener, w.EventTarget.prototype.removeEventListener];
  w.EventTarget.prototype.addEventListener = function (...a) {
    if (this.matches && this.matches('[data-page]')) listeners.set(this, (listeners.get(this) || 0) + 1);
    return ael.apply(this, a);
  };
  w.EventTarget.prototype.removeEventListener = function (...a) {
    if (listeners.has(this)) listeners.set(this, listeners.get(this) - 1);
    return rel.apply(this, a);
  };
  every('page cleans up when you leave it', pages.filter((p) => p.id !== 'settings'), (p) => {
    CA.UI.Menu.openPage('settings');
    live.clear();
    listeners.clear();
    CA.UI.Menu.openPage(p.id);
    CA.UI.Menu.openPage('settings');
    const leftOn = [...listeners.values()].reduce((a, b) => a + Math.max(0, b), 0);
    return !live.size && !leftOn ? true : `${live.size} interval(s), ${leftOn} listener(s) left running`;
  });
  w.setInterval = si;
  w.clearInterval = ci;
  w.EventTarget.prototype.addEventListener = ael;
  w.EventTarget.prototype.removeEventListener = rel;
}

// ---- widget types ---------------------------------------------------------------------------
const types = CA.UI.Widgets.types();
every('widget type is well-formed', types, (t) => (t.name && icon(t.icon) && typeof t.html === 'function') || 'name/icon/html');
k0 = g.errors.length;
every('widget type renders on the left panel and goes away', types.filter((t) => !t.hidden), (t) => {
  const inst = CA.UI.Widgets.add(t.id);
  if (!inst) return 'add() returned nothing';
  CA.UI.Widgets.render();
  CA.UI.Widgets.tick();
  const el = doc.querySelector(`[data-widget="${inst.id}"]`);
  if (!el) return 'not rendered';
  CA.UI.Widgets.remove(inst.id);
  CA.UI.Widgets.render();
  return doc.querySelector(`[data-widget="${inst.id}"]`) ? 'still there after remove' : true;
});
assert(g.errors.length === k0, `widgets without page errors ${errorsSince(k0)}`);

// ---- the save round-trips -------------------------------------------------------------------
// a non-trivial state: an edited built-in, a widget, a garden profile with rules, options, hotkeys
CA.Macros.setEvery('golden', 750);
CA.Macros.setFav('golden', true);
CA.UI.Widgets.add('stats');
const prof = CA.Garden.snapshot('Contract');
CA.Garden.setRules(prof.id, 'garden.plantEmpty()\n');
CA.Settings.set('notifications', !CA.Settings.get('notifications'));
Game.WriteSave();
const s1 = JSON.parse(Game.modSaveData.CookieMgr);
const g2 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: Game.modSaveData.CookieMgr, withPantheon: true });
makeGarden(g2.Game);
await sleep(400);
g2.Game.WriteSave();
const s2 = JSON.parse(g2.Game.modSaveData.CookieMgr);
['options', 'hotkeys', 'macros', 'widgets', 'garden'].forEach((k) =>
  assert(JSON.stringify(s1[k]) === JSON.stringify(s2[k]), `save → load → save keeps “${k}”${JSON.stringify(s1[k]) === JSON.stringify(s2[k]) ? '' : `\n  ${JSON.stringify(s1[k]).slice(0, 300)}\n  ${JSON.stringify(s2[k]).slice(0, 300)}`}`)
);

// ---- a broken save doesn't break start-up -------------------------------------------------------
for (const bad of ['{', '[]', 'null', '{"v":1,"macros":"x","widgets":{},"garden":5,"options":[]}', '{"macros":{"custom":[{"id":"x"}]},"widgets":[{"type":"nope"}],"garden":[{"plot":7}]}']) {
  const g3 = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, save: bad });
  await sleep(350);
  const ok = !g3.errors.length && g3.window.CookieMgr && g3.window.document.getElementById('CookieMgrTab');
  assert(ok, `a broken save (${bad.slice(0, 40)}) still starts${g3.errors.length ? `: ${g3.errors[0].slice(0, 200)}` : ''}`);
  g3.window.close();
}

// ---- house style: styled tooltips only ---------------------------------------------------------
const titled = [...doc.querySelectorAll('#CookieMgrMenu [title], #CookieMgrWidgets [title], #CookieMgrTab [title]')];
assert(!titled.length, `no native title tooltips (styled ones via ui/tips.js)${titled.length ? ` — ${titled.length}: ${titled.slice(0, 6).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}[${e.getAttribute('title')}]`).join(', ')}` : ''}`);

assert(g.errors.length + g2.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
