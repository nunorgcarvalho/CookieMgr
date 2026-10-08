// v2.15.0: every option on its own page (once), the All options index, option tiles, Settings
// overview, built-in macros as cards, the widget gallery, styled hover tips.
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { boot, sleep, makeAssert, click } from '../harness/game.mjs';

const { assert, done } = makeAssert();
const g = boot({ idb: { factory: new IDBFactory(), IDBKeyRange }, withPantheon: true });
const { window: w } = g;
const CA = w.CookieMgr;
const doc = w.document;
await sleep(400);
const page = (id) => doc.querySelector(`[data-page="${id}"]`);

// ---- each option has one home
const homes = {};
CA.UI.Pages.list().forEach((p) => {
  CA.UI.Menu.openPage(p.id);
  page(p.id)
    .querySelectorAll('[data-option]')
    .forEach((el) => (homes[el.dataset.option] = (homes[el.dataset.option] || []).concat(p.id)));
});
const twice = Object.keys(homes).filter((k) => homes[k].length > 1);
assert(!twice.length, `no option shown on two pages (${twice.map((k) => `${k}: ${homes[k]}`)})`);
const expect = { goldenNotify: 'events', logEmptyWrinklers: 'events', graphActiveTime: 'graphs', graphEvents: 'graphs', notifications: 'clickers', disableOnAscend: 'clickers', stockTint: 'stocks', bankToolbar: 'stocks', grimoireToolbar: 'wizard', widgetsShown: 'widgets', updateCheck: 'settings', trackHistory: 'settings', roundUpBulk: 'settings', cmAutoLoad: 'settings' };
Object.keys(expect).forEach((k) => assert(homes[k] && homes[k][0] === expect[k], `${k} lives on ${expect[k]} (${homes[k]})`));

// ---- the Settings page
CA.UI.Menu.openPage('settings');
const st = page('settings');
assert(st.querySelector('.ca-overview') && /CookieMgr/.test(st.querySelector('.ca-overview').textContent) && st.querySelectorAll('.ca-overview .ca-stat').length === 4, 'overview tiles on top');
assert(st.querySelectorAll('.ca-optgrid .ca-opt').length >= 2, 'general options as tiles');
const blocks = [...st.querySelectorAll('.ca-index-block')];
assert(blocks.length >= 6 && blocks.every((b) => b.querySelector('.ca-index-head [data-ca="goto"]')), `All options: a block per page, titled with a link (${blocks.length})`);
const chip = st.querySelector('.ca-index [data-key="goldenNotify"]');
const was = CA.Settings.get('goldenNotify');
click(w, chip);
CA.UI.Menu.sync();
assert(CA.Settings.get('goldenNotify') === !was && chip.classList.contains('on') === !was, 'index chips switch the option');
click(w, st.querySelector('.ca-index-block .ca-index-head [data-page="events"]'));
assert(CA.Settings.get('tab') === 'events' && page('events').querySelector('[data-option="goldenNotify"]'), 'and the title takes you to its page');
assert(CA.Settings.optionsIn('events').find((d) => d.key === 'goldenNotify'), 'golden notifications moved to Events');

// labels
assert(CA.Settings.optionsIn('macros').find((d) => d.key === 'notifications').name === 'Macro on/off notifications', 'clearer name: Macro on/off notifications');
assert(CA.Settings.optionsIn('stocks').find((d) => d.key === 'bankToolbar').name === 'Toolbar in the Stock market', 'clearer name: Toolbar in the Stock market');

// ---- macros: built-ins as cards, yours as rows
CA.UI.Menu.openPage('clickers');
const mp = page('clickers');
assert(mp.querySelectorAll('.ca-mtile').length >= 10 && mp.querySelector('.ca-mtile[data-macro-row="bigCookie"]'), 'built-in macros as cards');
assert(mp.querySelector('.ca-mtile[data-macro-row="lumps"] select[data-macro-param], .ca-mtile[data-macro-row="lumps"] select[data-macro-input]'), 'cards keep their choices'); // v3: an input of its code
CA.Macros.set('golden', true);
CA.UI.MacrosPage.sync(mp);
const gtile = mp.querySelector('.ca-mtile[data-macro-row="golden"]');
assert(gtile.classList.contains('on') && gtile.querySelector('.ca-switch.on'), 'cards follow on/off');
for (let i = 0; i < 300; i++) CA.Macros.runOnce('bigCookie');
CA.UI.MacrosPage.sync(mp);
const meter = mp.querySelector('.ca-mtile[data-macro-row="bigCookie"] [data-macro-heat]');
assert(/h[3-5]/.test(meter.className) && parseFloat(meter.firstChild.style.width) >= 60, `activity meter (${meter.className}, ${meter.firstChild.style.width})`);
click(w, mp.querySelector('.ca-mtile[data-macro-row="wrath"] [data-ca="macro-toggle"]'));
assert(CA.Macros.isOn('wrath'), 'card switch works');
CA.Macros.save({ name: 'Mine', mode: 'repeat', every: 1000, steps: [{ action: 'click.bigCookie' }] });
CA.UI.Menu.render();
assert(page('clickers').querySelector('.ca-list .ca-row.ca-macro'), 'your macros stay as rows');

// ---- widgets: gallery
CA.UI.Menu.openPage('widgets');
const cards = page('widgets').querySelectorAll('.ca-wgallery .ca-wcard');
assert(cards.length === 8, `widget gallery: macro buttons + 7 kinds (${cards.length})`);
click(w, page('widgets').querySelector('.ca-wcard [data-w-page-add="pantheon"]'));
assert(CA.UI.Widgets.has('pantheon') && page('widgets').querySelector('.ca-wcard.placed [data-w-page-remove="pantheon"]'), 'Add from a card; it shows placed');

// ---- styled hover tips
const fav = page('widgets').querySelector('[data-ca="open-macros"]') || page('widgets').querySelector('button');
// v2.27: CookieMgr emits data-tip (never title); a stray title is still converted on hover
assert(!doc.querySelector('#CookieMgrMenu [title]'), 'no native title attributes');
const btn = doc.querySelector('#CookieMgrMenu [data-tip]');
const text = btn.dataset.tip;
btn.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const tip = doc.getElementById('CookieMgrTip');
assert(tip && tip.style.display === 'block' && tip.textContent === text, `styled tip shown (${text})`);
doc.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
assert(tip.style.display === 'none', 'hidden when leaving');
const stray = doc.createElement('button');
stray.setAttribute('title', 'Stray');
doc.querySelector('#CookieMgrMenu').appendChild(stray);
stray.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
assert(!stray.hasAttribute('title') && stray.dataset.tip === 'Stray' && tip.textContent === 'Stray', 'a stray title: converted on hover');
stray.remove();
doc.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
void fav;

assert(g.errors.length === 0, 'no runtime errors' + (g.errors.length ? `: ${g.errors.slice(0, 3).join(' | ')}` : ''));
done();
process.exit();
