// End-to-end checks for v1.3.0: page registry + icon sidebar, no page title, Graphs rename,
// Bank toolbar (replacing the embedded graph), Cookie Monster loader.
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const { window: w, Game, goods, calls, errors } = boot();
const $ = (s) => w.document.querySelector(s);
const $$ = (s) => [...w.document.querySelectorAll(s)];

await sleep(600); // registration poll (250ms) + first ticks
assert(Game.mods.CookieMgr, 'CookieMgr registered with the game');
const CA = w.CookieMgr;

// ---- sidebar -------------------------------------------------------------------------
const items = $$('#CookieMgrTab [data-tab-item]');
assert(items.length === 9, `sidebar has one item per page (9), got ${items.length}`);
assert(
  JSON.stringify(items.map((i) => i.querySelector('.ca-tab-label').textContent)) ===
    JSON.stringify(['Events', 'Graphs', 'Garden', 'Stock market', 'Pantheon', 'Grimoire', 'Macros', 'Widgets', 'Settings']),
  'sidebar labels in page order, CPS renamed to Graphs'
);
assert(items.every((i) => i.querySelector('.ca-tab-icon .ca-ico')), 'every sidebar item has an icon');

for (const item of items) {
  const id = item.dataset.tabItem;
  click(w, item);
  assert(Game.onMenu === 'cookiemgr', `clicking "${id}" opens the panel`);
  assert($(`#CookieMgrMenu .ca-page[data-page="${id}"]`), `panel shows the "${id}" page`);
  assert(!$('#CookieMgrMenu .section'), `no "CookieMgr" title on the "${id}" page`);
  assert(item.classList.contains('selected'), `"${id}" sidebar item is highlighted`);
  await sleep(300); // let charts/logs tick while mounted
}
click(w, items[8]); // settings again -> closes
assert(Game.onMenu === '', 'clicking the open page again closes the panel');
assert(!items.some((i) => i.classList.contains('selected')), 'no sidebar item highlighted once closed');

// ---- Bank toolbar --------------------------------------------------------------------
await sleep(1100); // toolbar syncs every second
const bar = $('#cm-bank-toolbar');
assert(bar && bar.previousElementSibling === $('#bankHeader'), 'toolbar sits right after #bankHeader');
assert(!$('#cm-bank-graph'), 'old embedded portfolio graph is gone');
const auto = bar.querySelector('[data-cm-bt="auto"]');
assert(/Autobuyer: off/.test(auto.textContent), `autobuyer button shows off, got "${auto.textContent}"`);
click(w, auto);
assert(CA.StockTrader.isOn(), 'autobuyer button turns the stock autoclicker on');
assert(/Autobuyer: on/.test(auto.textContent), 'autobuyer button label updates to on');
goods[0].stock = 5;
const sell = bar.querySelector('[data-cm-bt="sell"]');
// v2.27: a live styled tip (data-tip-live), not a title set on mouseenter
sell.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const sellTip = (w.document.getElementById('CookieMgrTip') || {}).textContent || '';
assert(/Sells for ~/.test(sellTip) && !sell.hasAttribute('title'), `sell button hover shows the cookie payout, got "${sellTip}"`);
w.document.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
click(w, sell);
assert(!CA.StockTrader.isOn(), 'Sell all turns the autobuyer off');
assert(goods[0].stock === 0, 'Sell all sold the held stock');
click(w, bar.querySelector('[data-cm-bt="open"]'));
assert(Game.onMenu === 'cookiemgr' && $('#CookieMgrMenu .ca-page[data-page="stocks"]'), 'CookieMgr button opens the Stock market page');

CA.Settings.set('bankToolbar', false);
assert(!$('#cm-bank-toolbar'), 'turning the setting off removes the toolbar');
CA.Settings.set('bankToolbar', true);
assert($('#cm-bank-toolbar'), 'turning it back on restores it');

// ---- Cookie Monster ------------------------------------------------------------------
CA.UI.Menu.openPage('settings');
const cmBtn = $('[data-ca="cm-load"]');
assert(cmBtn && /Load now/.test(cmBtn.textContent), 'Settings has a "Load now" Cookie Monster button');
assert($('[data-option="cmAutoLoad"]'), 'Settings has the "Load Cookie Monster on start-up" toggle');
click(w, cmBtn);
assert(calls.loadMod.some((u) => u === 'https://cookiemonsterteam.github.io/CookieMonster/dist/CookieMonster.js'), 'loads the official Cookie Monster URL');
assert(CA.CookieMonster.isLoaded(), 'detected as loaded afterwards');
await sleep(50);
assert(/Loaded/.test($('[data-ca="cm-load"]').textContent), 'button flips to "Loaded"');
click(w, $('[data-ca="cm-load"]'));
assert(calls.loadMod.length === 1, 'does not load it a second time');

// ---- auto-load on start-up -------------------------------------------------------------
Game.WriteSave();
const saved = JSON.parse(Game.modSaveData.CookieMgr);
saved.options.cmAutoLoad = true;
const second = boot({ save: JSON.stringify(saved) });
await sleep(2200);
assert(second.calls.loadMod.length === 1, 'cmAutoLoad=true loads Cookie Monster on start-up');
const third = boot({ save: JSON.stringify(saved) });
third.Game.mods.CookieMonster = {}; // already running
await sleep(2200);
assert(third.calls.loadMod.length === 0, 'auto-load skips it when Cookie Monster is already running');

assert(errors.length === 0, `no runtime errors (${errors.length}): ${errors.slice(0, 3).join(' | ')}`);
assert(second.errors.length === 0 && third.errors.length === 0, 'no runtime errors in the restart runs');
done();
process.exit();
