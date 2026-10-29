// Manager stage tabs: the Managers page's stage editor is a tab per stage, the picked stage beside a
// macro library (most used first, searchable: click a row to switch it on or off from that stage).
// A stage shows what's in force there with its own changes marked: macros at work (× takes one out),
// settings (Research's "stop before" as its upgrades' icons), a card per kind of profile (at a
// glance, a link to its page), its "until" and its widget watches as one line of code each (the
// watches folded away). Dark fields throughout. Nunix late game no longer sets the wrinkler wait or
// SeasonCompletion's last season (those macros do that anyway).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange } });
const { window: w, Game } = g;
const CA = w.CookieMgr;
await sleep(400);
const G = CA.Managers;
const M = CA.Macros;

// the research, as the game has it (the harness has no upgrades)
const R = ['Specialized chocolate chips', 'Designer cocoa beans', 'Ritual rolling pins', 'Underworld ovens', 'One mind', 'Exotic nuts', 'Communal brainsweep', 'Arcane sugar', 'Elder Pact'];
Game.Upgrades = Game.Upgrades || {};
R.forEach((n, i) => (Game.Upgrades[n] = { name: n, dname: n, icon: [i, 9], desc: n, pool: 'tech', bought: 0, unlocked: 0, getPrice: () => 1e12, basePrice: 1e12 }));

// ---- Nunix: no settings the macros have anyway ----
const nunix = () => G.find('nunixLateGame');
assert(JSON.stringify(nunix().stages[0].inputs) === '{"research":{"stopBefore":"Elder Pact"}}', 'Nunix sets only Research’s stop (not the wrinkler wait, not the last season)');
assert(M.inputsOf(M.get('seasonCompletion')).then === 'fools' && M.inputsOf(M.get('wrinklers')).fed === true, 'SeasonCompletion ends on Business day, wrinklers wait to be fed: by themselves');

// ---- the page ----
const doc = w.document;
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const change = (el, v) => {
  el.value = v;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
};
const menu = () => doc.getElementById('CookieMgrMenu');
const q = (sel) => menu().querySelector(sel);
const qa = (sel) => [...menu().querySelectorAll(sel)];
Game.resets = 1;
M.set('manager', true, { silent: true });
G.goTo(2);
CA.UI.Menu.openPage('managers');
await sleep(50);
assert(q('.ca-mgr-page'), 'the page is one dark block (its fields styled dark)');
assert(qa('[data-mgr-act="tab"]').length === 3 && q('.ca-mgr-tabadd'), 'a tab per stage, and + for one more');
assert(q('.ca-mgr-tab.sel').dataset.i === '1' && q('.ca-mgr-tab.run .ca-mgr-dot'), 'it opens on the stage it’s on (a dot on its tab)');
assert(q('.ca-mgr-panelhead [data-mgr-stage-name]').value === 'Reindeer', 'that stage beside the library');

// ---- macros at work: the change marked, the rest carried; × takes one out ----
const chip = (id) => q(`.ca-mgr-chip [data-mgr-act="flip"][data-macro="${id}"]`);
assert(chip('elderPledge').closest('.ca-mgr-chip').classList.contains('new'), 'Reindeer: the pledge, new here');
assert(chip('reindeer') && !chip('reindeer').closest('.ca-mgr-chip').classList.contains('new'), 'reindeer: on, carried over');
assert(/Still off:/.test(q('.ca-mgr-still').textContent), 'what’s still off, in a line');
click(chip('reindeer').closest('.ca-mgr-chip').querySelector('[data-mgr-act="drop"]'));
assert(nunix().stages[1].macros.reindeer === 'off' && G.effective(nunix(), 2).macros.reindeer === 'off', '× on a carried one: off from this stage on');
click(q('.ca-mgr-chip.off [data-mgr-act="drop"][data-macro="reindeer"]'));
assert(nunix().stages[1].macros.reindeer === undefined, '× on “switched off here”: undone');
click(chip('elderPledge').closest('.ca-mgr-chip').querySelector('[data-mgr-act="drop"]'));
assert(nunix().stages[1].macros.elderPledge === undefined, '× on a new one: not switched on here');
click(q('.ca-mgr-still [data-macro="elderPledge"]'));
assert(nunix().stages[1].macros.elderPledge === 'on', 'a “still off” one, clicked: on from here');

// ---- the library ----
const row = (id) => q(`.ca-mgr-libgroup:not(.ca-mgr-libtop) [data-mgr-act="lib"][data-macro="${id}"]`);
assert(q('.ca-mgr-libtop') && q('.ca-mgr-libgroup') === q('.ca-mgr-libtop') && qa('.ca-mgr-libtop .ca-mgr-librow').length === 8, 'Most used first (eight)');
assert(row('autoBuyer').classList.contains('on') && row('gardener').classList.contains('off'), 'each row says how it stands in this stage');
click(row('fortune'));
assert(nunix().stages[1].macros.fortune === 'on', 'a row clicked: on from this stage');
click(row('fortune'));
assert(nunix().stages[1].macros.fortune === undefined, 'clicked again: undone');
click(row('wrinklers'));
assert(nunix().stages[1].macros.wrinklers === 'off', 'one at work, clicked: off from this stage');
click(row('wrinklers'));
assert(nunix().stages[1].macros.wrinklers === undefined, 'and back');
const search = q('[data-mgr-libsearch]');
search.value = 'pledge';
search.dispatchEvent(new w.Event('input', { bubbles: true }));
assert(!row('elderPledge').classList.contains('hidden') && row('autoBuyer').classList.contains('hidden'), 'search: the rows that match');
CA.UI.Menu.render();
assert(q('[data-mgr-libsearch]').value === 'pledge' && row('autoBuyer').classList.contains('hidden'), 'kept across a redraw');
search.value = '';
q('[data-mgr-libsearch]').value = '';
q('[data-mgr-libsearch]').dispatchEvent(new w.Event('input', { bubbles: true }));

// ---- settings: Research's stop as its upgrades ----
click(q('[data-mgr-act="tab"][data-i="0"]'));
assert(q('.ca-mgr-tab.sel').dataset.i === '0', 'a tab click shows that stage');
const tiles = qa('.ca-mgr-uptile');
assert(tiles.length === R.length + 1 && tiles.slice(1).every((t) => t.dataset.popLive === 'upgrade'), 'Research: “all”, then each research’s icon (hover: its card)');
assert(q('.ca-mgr-uptile.sel').dataset.v === 'Elder Pact', 'the stop picked');
click(q('.ca-mgr-uptile[data-v="One mind"]'));
assert(nunix().stages[0].inputs.research.stopBefore === 'One mind', 'click one: stop there');
assert(qa('.ca-mgr-uptile.skip').length === 5, 'it and the ones after it: skipped');
click(q('[data-mgr-act="tab"][data-i="1"]'));
assert(/as before/.test(q('.ca-mgr-set').textContent) && !q('.ca-mgr-set.here'), 'stage 2: the setting carried over (as before)');
click(q('.ca-mgr-uptile[data-v="none"]'));
assert(nunix().stages[1].inputs.research.stopBefore === 'none' && q('.ca-mgr-set.here [data-mgr-act="uninput"]'), 'changed here: marked, × undoes');
click(q('.ca-mgr-set.here [data-mgr-act="uninput"]'));
assert(!nunix().stages[1].inputs.research, 'undone');

// ---- profiles: a card per kind ----
assert(qa('.ca-mgr-pcard').length === G.KINDS.length, 'a card per kind of profile');
const pick = (k) => q(`[data-mgr-profile][data-kind="${k}"]`);
assert(/as before · Payback/.test(pick('buyer').options[0].textContent) && pick('buyer').value === '', 'stage 2’s Auto buyer: as before');
assert(/Mind Over Matter/.test(pick('dragon').closest('.ca-mgr-pcard').querySelector('.ca-mgr-snap').textContent), 'the dragon’s auras, at a glance');
change(pick('grimoire'), 'default');
assert(nunix().stages[1].profiles.grimoire === 'default' && pick('grimoire').closest('.ca-mgr-pcard').classList.contains('here'), 'picked: a change here');
change(pick('grimoire'), '');
assert(!nunix().stages[1].profiles.grimoire, '“as before”: no change');
click(q('[data-mgr-act="open"][data-page="pantheon"]'));
assert(CA.Settings.get('tab') === 'pantheon', 'a card’s link opens its page');
CA.UI.Menu.openPage('managers');
await sleep(20);

// ---- until: a line of code ----
const line = () => q('[data-code-ed="until:1"]');
assert(line() && line().querySelector('[data-code-hl] span.ca-hl-line span'), 'the until is code, colored (its words hover)');
const ta = line().querySelector('[data-code]');
ta.value = 'cookies( >';
ta.dispatchEvent(new w.Event('input', { bubbles: true }));
assert(nunix().stages[1].until === 'cookies( >' && line().classList.contains('bad') && q('[data-mgr-until-status] .ca-mgr-problem'), 'as you type: kept, and what’s wrong said');
ta.value = 'cookies() > 1';
ta.dispatchEvent(new w.Event('input', { bubbles: true }));
assert(!line().classList.contains('bad') && /holds now|not yet/.test(q('[data-mgr-until-status]').textContent), 'fixed');
const enter = new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
ta.dispatchEvent(enter);
assert(enter.defaultPrevented && ta.value === 'cookies() > 1', 'Enter: no new line');
ta.dispatchEvent(new w.Event('change', { bubbles: true }));
assert(/if cookies\(\) > 1:/.test(q('[data-mgr-code] [data-code]').value), 'the Code card follows');
const span = line().querySelector('[data-code-hl] span.ca-hl-line span');
assert(CA.UI.CodeEditor.placeOf(span).source === 'cookies() > 1', 'a word in it knows its code (for its hover card)');

// ---- stage actions keep the tab on the stage ----
click(q('[data-mgr-act="addStage"][data-i="1"]:not(.ca-mgr-tab)'));
assert(nunix().stages.length === 4 && q('.ca-mgr-tab.sel').dataset.i === '2', '+ After: the new stage shown');
click(q('.ca-mgr-panelhead [data-mgr-act="delStage"]'));
click(q('.ca-mgr-panelhead [data-mgr-act="delStage"]'));
assert(nunix().stages.length === 3, 'deleted (asked first)');

M.list().forEach((m) => M.isOn(m.id) && M.set(m.id, false, { silent: true }));
assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
