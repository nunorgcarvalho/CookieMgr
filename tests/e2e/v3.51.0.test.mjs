// v3.51.0: the Settings page is split into tabs (General, Store & tooltips, Data & integrations, All options);
// the tab is remembered (option settingsTab) and 'settings:<tab>' links open one.
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot();
const { window: w } = g;
const doc = w.document;
const CA = w.CookieMgr;
await sleep(300);

const page = () => doc.querySelector('#CookieMgrMenu .ca-page[data-page="settings"]');
const tabIds = () => [...page().querySelectorAll('[data-settings-tab]')].map((b) => b.dataset.settingsTab);
const on = () => page().querySelector('.ca-subtab.on').dataset.settingsTab;
const titles = () => [...page().querySelectorAll('.ca-card-title')].map((t) => t.textContent.trim());

// ---- opens on General
CA.UI.Menu.openPage('settings');
await sleep(50);
assert(tabIds().join() === 'general,store,data,all', `four tabs (${tabIds()})`);
assert(on() === 'general' && CA.Settings.get('settingsTab') === 'general', 'General by default');
assert(page().querySelector('.ca-overview') && page().querySelector('[data-ca="reset-hotkeys"]'), 'General: the overview, options and hotkeys');
assert(titles().some((t) => /Miscellaneous/.test(t)), `and Miscellaneous (${titles()})`);
assert(!page().querySelector('[data-tl-lines]') && !page().querySelector('[data-ca-history-info]') && !page().querySelector('.ca-index'), 'and nothing from the other tabs');
assert(page().querySelector('.ca-footer'), 'the footer on every tab');

// ---- clicking a tab
click(w, page().querySelector('[data-settings-tab="store"]'));
await sleep(50);
assert(on() === 'store' && CA.Settings.get('settingsTab') === 'store', 'Store & tooltips: clicked and remembered');
assert(page().querySelector('[data-key="roundUpBulk"]') && page().querySelector('[data-tl-lines]') && page().querySelector('[data-tl-warns]'), 'the Store options and the store tooltip card');
const n0 = CA.UI.StoreInsight.lines().length;
page().querySelector('[data-tl-del="0"]').click();
await sleep(50);
assert(CA.UI.StoreInsight.lines().length === n0 - 1, 'the tooltip card still works on its tab');
CA.UI.StoreInsight.setLines(null);

click(w, page().querySelector('[data-settings-tab="data"]'));
await sleep(50);
assert(page().querySelector('[data-ca-history-info]') && page().querySelector('[data-ca="hexport"]') && page().querySelector('[data-ca="cm-load"]'), 'Data & integrations: history data and Cookie Monster');

click(w, page().querySelector('[data-settings-tab="all"]'));
await sleep(50);
assert(page().querySelectorAll('.ca-index-block').length >= 6, 'All options: the index');

// ---- an option on a tab still switches
CA.UI.Menu.openPage('settings:store');
await sleep(50);
const was = CA.Settings.get('roundUpBulk');
click(w, page().querySelector('[data-ca="option"][data-key="roundUpBulk"]'));
assert(CA.Settings.get('roundUpBulk') === !was, 'a Store option switches');
CA.Settings.set('roundUpBulk', was);

// ---- remembered across closing, and links open the right tab
CA.UI.Menu.openPage('clickers');
CA.UI.Menu.openPage('settings');
await sleep(50);
assert(on() === 'store', 'reopens on the last tab');
CA.UI.Menu.openPage('payback');
await sleep(50);
CA.Settings.set('settingsTab', 'general');
click(w, doc.querySelector('[data-page="payback"] [data-ca="goto"][data-page="settings:store"]'));
await sleep(50);
assert(CA.Settings.get('tab') === 'settings' && on() === 'store', 'Payback’s Best buy link opens Store & tooltips');
CA.UI.Menu.openPage('settings:nope');
assert(page() && on() === 'store', 'an unknown tab is ignored');

// ---- a saved unknown tab falls back to General
CA.Settings.set('settingsTab', 'gone');
CA.UI.Menu.render();
assert(on() === 'general', 'unknown saved tab: General');

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
